"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Transaction } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Receipt,
  CreditCard,
  Package,
  User,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Gem,
  Gamepad2,
  Target,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  getTotalItemsCount,
  getCheckoutDisplayName,
} from "@/lib/transaction-helpers";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        router.push("/login");
        return;
      }

      if (params.id) {
        fetchTransactionDetail();
      }
    }
  }, [user, authLoading, router, params.id]);

  const fetchTransactionDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/${params.id}`);
      const data: ApiResponse<any> = await response.json();
      console.log(data.data);

      if (response.ok && data.data) {
        // Verify that this transaction belongs to the current user
        if (data.data.customerInfo?.userId?._id !== user?.id) {
          toast.error("Anda tidak memiliki akses ke transaksi ini");
          router.push("/riwayat");
          return;
        }
        setTransaction(data.data);
      } else {
        toast.error(data.error || "Transaksi tidak ditemukan");
        router.push("/riwayat");
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      toast.error("Gagal mengambil detail transaksi");
      router.push("/riwayat");
    } finally {
      setLoading(false);
    }
  };

  const parseStatus = (status: string) => {
    if (status.includes(":")) {
      const [type, value] = status.split(":");
      return { type: type as "payment" | "order", value };
    }
    return { type: "unknown" as const, value: status };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      // Payment Status
      pending: {
        bg: "bg-amber-500/20 border border-amber-500/40",
        text: "text-amber-300",
        icon: "⏳",
        label: "Menunggu Pembayaran",
      },
      settlement: {
        bg: "bg-emerald-500/20 border border-emerald-500/40",
        text: "text-emerald-300",
        icon: "✅",
        label: "Sudah Dibayar",
      },
      expired: {
        bg: "bg-gray-500/20 border border-gray-500/40",
        text: "text-gray-300",
        icon: "⏰",
        label: "Kadaluarsa",
      },
      cancelled: {
        bg: "bg-red-500/20 border border-red-500/40",
        text: "text-red-300",
        icon: "🚫",
        label: "Dibatalkan",
      },
      failed: {
        bg: "bg-red-500/20 border border-red-500/40",
        text: "text-red-300",
        icon: "❌",
        label: "Gagal",
      },

      // Order Status
      waiting_payment: {
        bg: "bg-amber-500/20 border border-amber-500/40",
        text: "text-amber-300",
        icon: "⏳",
        label: "Menunggu Pembayaran",
      },
      processing: {
        bg: "bg-blue-500/20 border border-blue-500/40",
        text: "text-blue-300",
        icon: "🔄",
        label: "Sedang Diproses",
      },
      in_progress: {
        bg: "bg-neon-purple/20 border border-neon-purple/40",
        text: "text-neon-purple",
        icon: "⚙️",
        label: "Sedang Dikerjakan",
      },
      completed: {
        bg: "bg-emerald-500/20 border border-emerald-500/40",
        text: "text-emerald-300",
        icon: "🎉",
        label: "Selesai",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: "bg-gray-500/20 border border-gray-500/40",
      text: "text-gray-300",
      icon: "📋",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium ${config.bg} ${config.text} backdrop-blur-sm shadow-sm`}
      >
        <span className="text-base">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  const getStatusIcon = (type: string, value: string) => {
    if (type === "payment") {
      switch (value) {
        case "pending":
          return "⏳";
        case "settlement":
          return "✅";
        case "expired":
          return "⏰";
        case "cancelled":
          return "🚫";
        case "failed":
          return "❌";
        default:
          return "💳";
      }
    } else if (type === "order") {
      switch (value) {
        case "waiting_payment":
          return "⏳";
        case "processing":
          return "🔄";
        case "in_progress":
          return "⚙️";
        case "completed":
          return "🎉";
        case "cancelled":
          return "🚫";
        case "failed":
          return "❌";
        default:
          return "📋";
      }
    }
    return "📋";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case "robux":
        return <Gem className="w-8 h-8 text-neon-pink" />;
      case "gamepass":
        return <Gamepad2 className="w-8 h-8 text-neon-purple" />;
      case "joki":
        return <Target className="w-8 h-8 text-neon-pink" />;
      default:
        return <Package className="w-8 h-8 text-primary-300" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-neon-pink mx-auto mb-6"></div>
          <p className="text-primary-100 text-lg font-medium">
            Memuat detail transaksi...
          </p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center neon-card rounded-2xl shadow-lg p-8 max-w-md mx-4">
          <div className="w-20 h-20 bg-neon-pink/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-neon-pink" />
          </div>
          <h1 className="text-xl font-bold text-white mb-4">
            Transaksi Tidak Ditemukan
          </h1>
          <p className="text-primary-200 mb-6">
            Tidak dapat menemukan transaksi yang Anda cari.
          </p>
          <Link
            href="/riwayat"
            className="inline-flex items-center gap-2 px-6 py-3 btn-neon-primary rounded-xl font-medium transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Riwayat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-8">
      {/* Background Effects */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-neon-pink/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-neon-purple/20 rounded-full blur-xl animate-pulse"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center text-sm text-primary-200">
            <Link
              href="/riwayat"
              className="inline-flex items-center gap-2 hover:text-neon-pink transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Riwayat
            </Link>
            <span className="mx-2 text-primary-400">/</span>
            <span className="text-primary-300">Detail Transaksi</span>
          </nav>
        </div>

        {/* Header Card */}
        <div className="mb-8">
          <div className="neon-card rounded-2xl shadow-lg p-6 sm:p-8">
            {/* Multi-checkout badge */}
            {isMultiCheckout(transaction) && (
              <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-100/20 border border-primary-100/40 rounded-xl backdrop-blur-sm">
                <ShoppingBag className="w-5 h-5 text-primary-100" />
                <span className="text-sm font-medium text-primary-100">
                  Multi-Item Checkout • {getTotalItemsCount(transaction)} Items
                </span>
              </div>
            )}

            <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
              <div className="flex items-start gap-4">
                <div className="text-4xl sm:text-5xl flex-shrink-0 hidden md:block">
                  {getServiceIcon(transaction.serviceType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 break-words">
                    {getCheckoutDisplayName(transaction)}
                  </h1>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {getStatusBadge(transaction.paymentStatus)}
                    {getStatusBadge(transaction.orderStatus)}
                  </div>
                  <div className="space-y-2 text-sm sm:text-base text-primary-200">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-neon-purple" />
                        <span className="font-medium">Invoice:</span>
                        <span className="font-mono text-white">
                          {transaction.invoiceId}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neon-purple" />
                      <span>{formatDate(transaction.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:text-right">
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl font-bold text-neon-pink mb-2">
                    Rp{" "}
                    {calculateGrandTotal(transaction).toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="text-primary-200">Total Pembayaran</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Transaction Summary */}
            <div className="neon-card rounded-2xl shadow-lg p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-neon-pink/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-neon-pink" />
                </div>
                {isMultiCheckout(transaction)
                  ? "Item Pesanan"
                  : "Ringkasan Pesanan"}
              </h2>

              {isMultiCheckout(transaction) ? (
                <>
                  {/* Multi-Item List */}
                  <div className="space-y-4 mb-6">
                    {getAllTransactions(transaction).map((item, index) => (
                      <div
                        key={item._id}
                        className="p-4 bg-primary-900/40 border border-primary-100/20 rounded-xl"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="text-2xl">
                            {getServiceIcon(item.serviceType)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-1">
                              {item.serviceName}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-primary-200">
                              <span className="capitalize">
                                {item.serviceType}
                              </span>
                              {item.serviceCategory && (
                                <>
                                  <span>•</span>
                                  <span>{item.serviceCategory}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-primary-200 mb-1">
                              {item.quantity}x @ Rp{" "}
                              {item.unitPrice.toLocaleString("id-ID")}
                            </div>
                            <div className="font-semibold text-white">
                              Rp {item.totalAmount.toLocaleString("id-ID")}
                            </div>
                          </div>
                        </div>

                        {/* Item-specific details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-primary-200">Username:</span>
                            <span className="text-white font-medium">
                              {item.robloxUsername}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-primary-200">Qty:</span>
                            <span className="text-white font-medium">
                              {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Summary for Multi-Checkout */}
                  <div className="border-t-2 border-neon-purple/30 pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-primary-200">
                        <span>Total Items:</span>
                        <span className="font-semibold text-white">
                          {getTotalItemsCount(transaction)} items
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-t-2 border-neon-purple/30">
                        <span className="text-lg font-bold text-white">
                          Grand Total:
                        </span>
                        <span className="text-lg font-bold text-neon-pink">
                          Rp{" "}
                          {calculateGrandTotal(transaction).toLocaleString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                      <span className="text-primary-200 font-medium">
                        Layanan:
                      </span>
                      <span className="font-semibold text-white capitalize">
                        {transaction.serviceType}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                      <span className="text-primary-200 font-medium">
                        Quantity:
                      </span>
                      <span className="font-semibold text-white">
                        {transaction.quantity.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                      <span className="text-primary-200 font-medium">
                        Harga Satuan:
                      </span>
                      <span className="font-semibold text-white">
                        Rp {transaction.unitPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                      <span className="text-primary-200 font-medium">
                        Subtotal:
                      </span>
                      <span className="font-semibold text-white">
                        Rp {transaction.totalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>

                    {/* Show discount if available */}
                    {(transaction.discountPercentage || 0) > 0 && (
                      <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                        <span className="text-primary-200 font-medium">
                          Diskon ({transaction.discountPercentage}%):
                        </span>
                        <span className="font-semibold text-emerald-400">
                          -Rp{" "}
                          {(transaction.discountAmount || 0).toLocaleString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center py-3 border-t-2 border-neon-purple/30 mt-4">
                      <span className="text-lg font-bold text-white">
                        Total Bayar:
                      </span>
                      <span className="text-lg font-bold text-neon-pink">
                        Rp{" "}
                        {(
                          transaction.finalAmount || transaction.totalAmount
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Information */}
            <div className="neon-card rounded-2xl shadow-lg p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-neon-purple" />
                </div>
                Informasi Pelanggan
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                    <span className="text-primary-200 font-medium">Nama:</span>
                    <span className="font-semibold text-white">
                      {transaction.customerInfo.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                    <span className="text-primary-200 font-medium">Email:</span>
                    <span className="font-semibold text-white break-all">
                      {transaction.customerInfo.email || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                    <span className="text-primary-200 font-medium">Phone:</span>
                    <span className="font-semibold text-white">
                      {transaction.customerInfo.phone || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                  <span className="text-primary-200 font-medium">
                    Username Roblox:
                  </span>
                  <span className="font-semibold text-white">
                    {transaction.robloxUsername}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status History */}
          <div className="neon-card rounded-2xl shadow-lg p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-neon-pink/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-neon-pink" />
              </div>
              Riwayat Status
            </h2>

            <div className="space-y-4">
              {transaction.statusHistory.map((history, index) => {
                const statusData = parseStatus(history.status);
                return (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 neon-card-secondary rounded-xl hover:transform hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="text-2xl flex-shrink-0">
                      {statusData.type === "payment" ? (
                        <CreditCard className="w-6 h-6 text-neon-purple" />
                      ) : (
                        <Package className="w-6 h-6 text-neon-pink" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-white mb-1">
                            {statusData.type === "payment"
                              ? "Pembayaran"
                              : "Pesanan"}
                          </p>
                          <div className="mb-2">
                            {getStatusBadge(statusData.value)}
                          </div>
                          <p className="text-sm text-primary-200">
                            {formatDate(history.updatedAt)}
                          </p>
                          {history.notes && (
                            <p className="text-sm text-white mt-2 italic">
                              {history.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-8 mt-8">
          {/* Payment Information */}
          <div className="neon-card rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-neon-purple" />
              </div>
              Informasi Pembayaran
            </h2>

            <div className="space-y-4">
              {transaction.midtransOrderId && (
                <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
                  <span className="text-primary-200 font-medium">
                    Order ID:
                  </span>
                  <span className="font-mono text-sm text-white break-all">
                    {transaction.midtransOrderId}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-3">
                <span className="text-primary-200 font-medium">Status:</span>
                <div>{getStatusBadge(transaction.paymentStatus)}</div>
              </div>
            </div>

            {/* Payment Action */}
            {(transaction.paymentStatus === "pending" ||
              transaction.orderStatus === "waiting_payment") &&
              transaction.snapToken && (
                <div className="mt-6">
                  <a
                    href={
                      transaction.redirectUrl ||
                      `/transaction/pending?order_id=${transaction.midtransOrderId}`
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 btn-neon-primary rounded-xl transition-all duration-300 font-semibold shadow-lg transform hover:scale-105"
                  >
                    <CreditCard className="w-5 h-5" />
                    Bayar Sekarang
                  </a>
                </div>
              )}
          </div>

          {/* Quick Actions */}
          <div className="neon-card rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-neon-pink/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-neon-pink" />
              </div>
              Aksi Cepat
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600/80 text-white rounded-xl hover:bg-primary-500/80 transition-colors font-medium backdrop-blur-sm border border-primary-500/30"
              >
                <span>🖨️</span>
                Cetak Detail
              </button>

              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/80 text-white rounded-xl hover:bg-emerald-600/80 transition-colors font-medium backdrop-blur-sm border border-emerald-500/30"
              >
                <span>💬</span>
                Hubungi CS
              </a>

              <Link
                href="/track-order"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/80 text-white rounded-xl hover:bg-blue-600/80 transition-colors font-medium backdrop-blur-sm border border-blue-500/30"
              >
                <span>🔍</span>
                Lacak Pesanan Lain
              </Link>

              <button
                onClick={fetchTransactionDetail}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neon-purple/80 text-white rounded-xl hover:bg-neon-purple transition-colors font-medium backdrop-blur-sm border border-neon-purple/30"
              >
                <span>🔄</span>
                Refresh
              </button>
            </div>
          </div>

          {/* Help Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-xl">💡</span>
              Butuh Bantuan?
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Jika Anda mengalami masalah dengan transaksi ini, jangan ragu
              untuk menghubungi tim customer service kami.
            </p>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              <span>📞</span>
              Hubungi Support
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
