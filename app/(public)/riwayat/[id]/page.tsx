"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Transaction } from "@/types";

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
      const data: ApiResponse<Transaction> = await response.json();

      if (response.ok && data.data) {
        // Verify that this transaction belongs to the current user
        if (data.data.customerInfo?.userId !== user?.id) {
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
        bg: "bg-amber-50 border border-amber-200",
        text: "text-amber-700",
        icon: "⏳",
        label: "Menunggu Pembayaran",
      },
      settlement: {
        bg: "bg-emerald-50 border border-emerald-200",
        text: "text-emerald-700",
        icon: "✅",
        label: "Sudah Dibayar",
      },
      expired: {
        bg: "bg-gray-50 border border-gray-200",
        text: "text-gray-700",
        icon: "⏰",
        label: "Kadaluarsa",
      },
      cancelled: {
        bg: "bg-red-50 border border-red-200",
        text: "text-red-700",
        icon: "🚫",
        label: "Dibatalkan",
      },
      failed: {
        bg: "bg-red-50 border border-red-200",
        text: "text-red-700",
        icon: "❌",
        label: "Gagal",
      },

      // Order Status
      waiting_payment: {
        bg: "bg-amber-50 border border-amber-200",
        text: "text-amber-700",
        icon: "⏳",
        label: "Menunggu Pembayaran",
      },
      processing: {
        bg: "bg-blue-50 border border-blue-200",
        text: "text-blue-700",
        icon: "🔄",
        label: "Sedang Diproses",
      },
      in_progress: {
        bg: "bg-purple-50 border border-purple-200",
        text: "text-purple-700",
        icon: "⚙️",
        label: "Sedang Dikerjakan",
      },
      completed: {
        bg: "bg-green-50 border border-green-200",
        text: "text-green-700",
        icon: "🎉",
        label: "Selesai",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      bg: "bg-gray-50 border border-gray-200",
      text: "text-gray-700",
      icon: "📋",
      label: status,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text} shadow-sm`}
      >
        <span className="text-sm">{config.icon}</span>
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
        return "💎";
      case "gamepass":
        return "🎮";
      case "joki":
        return "🎯";
      default:
        return "📦";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-rose-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Memuat detail transaksi...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-600 text-lg mb-4">
            Transaksi tidak ditemukan
          </p>
          <Link
            href="/riwayat"
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            ← Kembali ke Riwayat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center text-sm text-gray-600">
            <Link
              href="/riwayat"
              className="inline-flex items-center gap-2 hover:text-rose-600 transition-colors font-medium"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Kembali ke Riwayat
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-400">Detail Transaksi</span>
          </nav>
        </div>

        {/* Header Card */}
        <div className="mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 sm:p-8 border border-gray-200">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex items-start gap-4">
                <div className="text-5xl sm:text-6xl flex-shrink-0">
                  {getServiceIcon(transaction.serviceType)}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 break-words">
                    {transaction.serviceName}
                  </h1>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {getStatusBadge(transaction.paymentStatus)}
                    {getStatusBadge(transaction.orderStatus)}
                  </div>
                  <div className="space-y-2 text-sm sm:text-base text-gray-600">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="flex items-center gap-2">
                        <span className="text-gray-400">📄</span>
                        <span className="font-medium">Invoice:</span>
                        <span className="font-mono text-gray-900">
                          {transaction.invoiceId}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">📅</span>
                      <span>{formatDate(transaction.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:text-right">
                <div className="space-y-1">
                  {/* Show discount info if available */}
                  {(transaction.discountPercentage || 0) > 0 && (
                    <>
                      <div className="text-lg text-gray-500 line-through">
                        Rp {transaction.totalAmount.toLocaleString("id-ID")}
                      </div>
                      <div className="text-sm text-green-600 font-medium">
                        Diskon {transaction.discountPercentage}% (-Rp{" "}
                        {(transaction.discountAmount || 0).toLocaleString(
                          "id-ID"
                        )}
                        )
                      </div>
                    </>
                  )}
                  <div className="text-3xl sm:text-4xl font-bold text-rose-600 mb-2">
                    Rp{" "}
                    {(
                      transaction.finalAmount || transaction.totalAmount
                    ).toLocaleString("id-ID")}
                  </div>
                </div>
                <div className="text-gray-600">Total Pembayaran</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-8">
            {/* Transaction Summary */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                Ringkasan Pesanan
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Layanan:</span>
                    <span className="font-semibold text-gray-900 capitalize">
                      {transaction.serviceType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Quantity:</span>
                    <span className="font-semibold text-gray-900">
                      {transaction.quantity.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Harga Satuan:
                    </span>
                    <span className="font-semibold text-gray-900">
                      Rp {transaction.unitPrice.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Subtotal:</span>
                    <span className="font-semibold text-gray-900">
                      Rp {transaction.totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Show discount if available */}
                  {(transaction.discountPercentage || 0) > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">
                        Diskon ({transaction.discountPercentage}%):
                      </span>
                      <span className="font-semibold text-green-600">
                        -Rp{" "}
                        {(transaction.discountAmount || 0).toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-3 border-t-2 border-gray-200 mt-4">
                    <span className="text-lg font-bold text-gray-900">
                      Total Bayar:
                    </span>
                    <span className="text-lg font-bold text-rose-600">
                      Rp{" "}
                      {(
                        transaction.finalAmount || transaction.totalAmount
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-2xl">👤</span>
                Informasi Pelanggan
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Nama:</span>
                    <span className="font-semibold text-gray-900">
                      {transaction.customerInfo.name || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Email:</span>
                    <span className="font-semibold text-gray-900 break-all">
                      {transaction.customerInfo.email || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Phone:</span>
                    <span className="font-semibold text-gray-900">
                      {transaction.customerInfo.phone || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">
                      Username Roblox:
                    </span>
                    <span className="font-semibold text-gray-900">
                      {transaction.robloxUsername}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Status History */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <span className="text-2xl">📊</span>
                Riwayat Status
              </h2>

              <div className="space-y-4">
                {transaction.statusHistory.map((history, index) => {
                  const statusData = parseStatus(history.status);
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-3xl flex-shrink-0">
                        {getStatusIcon(statusData.type, statusData.value)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 mb-1">
                              {statusData.type === "payment"
                                ? "Pembayaran"
                                : "Pesanan"}
                            </p>
                            <div className="mb-2">
                              {getStatusBadge(statusData.value)}
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatDate(history.updatedAt)}
                            </p>
                            {history.notes && (
                              <p className="text-sm text-gray-500 mt-2 italic">
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
          <div className="space-y-8">
            {/* Payment Information */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">💳</span>
                Informasi Pembayaran
              </h2>

              <div className="space-y-4">
                {transaction.midtransOrderId && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Order ID:</span>
                    <span className="font-mono text-sm text-gray-900 break-all">
                      {transaction.midtransOrderId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-medium">Status:</span>
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
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 font-semibold shadow-lg transform hover:scale-105"
                    >
                      <span className="text-xl">💳</span>
                      Bayar Sekarang
                    </a>
                  </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">⚡</span>
                Aksi Cepat
              </h2>

              <div className="space-y-3">
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
                >
                  <span>🖨️</span>
                  Cetak Detail
                </button>

                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                >
                  <span>💬</span>
                  Hubungi CS
                </a>

                <Link
                  href="/track-order"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
                >
                  <span>🔍</span>
                  Lacak Pesanan Lain
                </Link>

                <button
                  onClick={fetchTransactionDetail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors font-medium"
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
    </div>
  );
}
