"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Transaction, ApiResponse } from "@/types";
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  calculateOriginalTotal,
  calculateTotalDiscount,
  calculateSubtotalAfterDiscount,
  getCheckoutDisplayName,
  getTotalItemsCount,
  getPaymentFee,
} from "@/lib/transaction-helpers";
import {
  Clock,
  CheckCircle,
  Timer,
  X,
  XCircle,
  AlertCircle,
  RotateCcw,
  Settings,
  Trophy,
  Gem,
  Gamepad2,
  Target,
  Package,
  Filter,
  SortDesc,
  Eye,
  CreditCard,
  ShoppingCart,
  RefreshCw,
  FileText,
  User,
  Calendar,
  DollarSign,
  Zap,
} from "lucide-react";

export default function RiwayatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      fetchTransactions();
    }
  }, [user, authLoading, router]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const url = `/api/transactions?userId=${user.id}`;
      console.log("=== FRONTEND FETCH DEBUG ===");
      console.log("Making request to:", url);
      console.log("User object:", user);
      console.log("User ID:", user.id);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (response.ok) {
        const data: ApiResponse<Transaction[]> = await response.json();
        console.log("Response data:", data);
        console.log("Transactions received:", data.data?.length || 0);

        // Debug: Log first transaction details
        if (data.data && data.data.length > 0) {
          const firstTx = data.data[0];
          console.log("=== FIRST TRANSACTION DEBUG ===");
          console.log("Invoice ID:", firstTx.invoiceId);
          console.log("Total Amount:", firstTx.totalAmount);
          console.log("Discount Amount:", firstTx.discountAmount);
          console.log("Final Amount:", firstTx.finalAmount);
          console.log("Payment Fee:", firstTx.paymentFee);
          console.log("Is Multi Checkout:", firstTx.isMultiCheckout);
          console.log(
            "Related Transactions Count:",
            firstTx.relatedTransactions?.length || 0,
          );

          // Test helper functions
          console.log("=== HELPER FUNCTIONS TEST ===");
          console.log(
            "calculateOriginalTotal:",
            calculateOriginalTotal(firstTx),
          );
          console.log(
            "calculateTotalDiscount:",
            calculateTotalDiscount(firstTx),
          );
          console.log(
            "calculateSubtotalAfterDiscount:",
            calculateSubtotalAfterDiscount(firstTx),
          );
          console.log("getPaymentFee:", getPaymentFee(firstTx));
          console.log("calculateGrandTotal:", calculateGrandTotal(firstTx));

          // Manual calculation
          const manualCalc =
            calculateSubtotalAfterDiscount(firstTx) + getPaymentFee(firstTx);
          console.log("Manual Calculation (subtotal + fee):", manualCalc);
        }

        setTransactions(data.data || []);
      } else {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        toast.error(errorData.message || "Gagal memuat riwayat transaksi");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Terjadi kesalahan saat memuat riwayat transaksi");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (
    status: string,
    type: "payment" | "order" = "payment",
  ) => {
    const baseClass =
      "px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border transition-all duration-300";

    if (type === "payment") {
      switch (status) {
        case "pending":
          return (
            <span
              className={`${baseClass} bg-amber-500/20 text-amber-300 border-amber-400/30 hover:bg-amber-500/30`}
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Menunggu Pembayaran</span>
              </div>
            </span>
          );
        case "paid":
        case "settlement":
          return (
            <span
              className={`${baseClass} bg-green-500/20 text-green-300 border-green-400/30 hover:bg-green-500/30`}
            >
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Dibayar</span>
              </div>
            </span>
          );
        case "expired":
        case "cancelled":
          return (
            <span
              className={`${baseClass} bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30`}
            >
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                <span>Dibatalkan</span>
              </div>
            </span>
          );
        case "failed":
          return (
            <span
              className={`${baseClass} bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30`}
            >
              <div className="flex items-center gap-1">
                <X className="w-3 h-3" />
                <span>Gagal</span>
              </div>
            </span>
          );
        default:
          return (
            <span
              className={`${baseClass} bg-gray-500/20 text-gray-300 border-gray-400/30`}
            >
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Tidak Diketahui</span>
              </div>
            </span>
          );
      }
    } else {
      switch (status) {
        case "waiting_payment":
          return (
            <span
              className={`${baseClass} bg-amber-500/20 text-amber-300 border-amber-400/30 hover:bg-amber-500/30`}
            >
              <div className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                <span>Menunggu</span>
              </div>
            </span>
          );
        case "processing":
        case "in_progress":
          return (
            <span
              className={`${baseClass} bg-blue-500/20 text-blue-300 border-blue-400/30 hover:bg-blue-500/30`}
            >
              <div className="flex items-center gap-1">
                <RotateCcw className="w-3 h-3 animate-spin" />
                <span>Diproses</span>
              </div>
            </span>
          );
        case "completed":
          return (
            <span
              className={`${baseClass} bg-green-500/20 text-green-300 border-green-400/30 hover:bg-green-500/30`}
            >
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>Selesai</span>
              </div>
            </span>
          );
        case "cancelled":
          return (
            <span
              className={`${baseClass} bg-red-500/20 text-red-300 border-red-400/30 hover:bg-red-500/30`}
            >
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                <span>Dibatalkan</span>
              </div>
            </span>
          );
        default:
          return (
            <span
              className={`${baseClass} bg-gray-500/20 text-gray-300 border-gray-400/30`}
            >
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>Tidak Diketahui</span>
              </div>
            </span>
          );
      }
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case "account":
        return <Settings className="w-5 h-5 text-primary-100" />;
      case "rank":
        return <Trophy className="w-5 h-5 text-primary-100" />;
      case "robux":
        return <Gem className="w-5 h-5 text-primary-100" />;
      case "gamepass":
        return <Gamepad2 className="w-5 h-5 text-primary-100" />;
      case "joki":
        return <Target className="w-5 h-5 text-primary-100" />;
      default:
        return <Package className="w-5 h-5 text-primary-100" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTransactions = transactions
    .filter((transaction) => {
      if (filter === "all") return true;
      if (filter === "pending") {
        return (
          transaction.paymentStatus === "pending" ||
          transaction.orderStatus === "waiting_payment"
        );
      }
      if (filter === "completed") {
        return (
          transaction.paymentStatus === "settlement" &&
          transaction.orderStatus === "completed"
        );
      }
      if (filter === "processing") {
        return (
          transaction.paymentStatus === "settlement" &&
          (transaction.orderStatus === "processing" ||
            transaction.orderStatus === "in_progress")
        );
      }
      if (filter === "cancelled") {
        return (
          transaction.paymentStatus === "cancelled" ||
          transaction.paymentStatus === "expired" ||
          transaction.orderStatus === "cancelled"
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "amount_high":
          return (
            (b.finalAmount || b.totalAmount) - (a.finalAmount || a.totalAmount)
          );
        case "amount_low":
          return (
            (a.finalAmount || a.totalAmount) - (b.finalAmount || b.totalAmount)
          );
        default:
          return 0;
      }
    });

  // Group transactions by midtransOrderId or duitkuOrderId for multi-checkout display
  const groupTransactionsByCheckout = (transactions: Transaction[]) => {
    const grouped = new Map<string, Transaction[]>();
    const singles: Transaction[] = [];

    transactions.forEach((transaction) => {
      // Use midtransOrderId or duitkuOrderId for grouping
      const orderId = transaction.midtransOrderId || transaction.duitkuOrderId;
      if (orderId) {
        if (!grouped.has(orderId)) {
          grouped.set(orderId, []);
        }
        grouped.get(orderId)!.push(transaction);
      } else {
        singles.push(transaction);
      }
    });

    return { grouped, singles };
  };

  const { grouped, singles } =
    groupTransactionsByCheckout(filteredTransactions);

  // Convert grouped to array of representative transactions
  const groupedArray = Array.from(grouped.values()).map((group) => {
    // Use first transaction as representative
    const representative = group[0];
    // Add related transactions
    representative.relatedTransactions = group.slice(1);
    representative.isMultiCheckout = group.length > 1;
    return representative;
  });

  // Combine with singles and re-sort
  const displayTransactions = [...groupedArray, ...singles].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "amount_high":
        return calculateGrandTotal(b) - calculateGrandTotal(a);
      case "amount_low":
        return calculateGrandTotal(a) - calculateGrandTotal(b);
      default:
        return 0;
    }
  });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary-100/30 border-t-primary-100 rounded-full animate-spin mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              Memuat Riwayat Transaksi
            </h3>
            <p className="text-primary-200/80">
              Tunggu sebentar, kami sedang mengambil data transaksi Anda...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Enhanced Header */}
      <div className="relative">
        {/* Background Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-100/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-primary-200/10 rounded-full blur-2xl"></div>

        <div className="relative z-10 container mx-auto px-4 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-primary-100/20 rounded-2xl backdrop-blur-sm border border-primary-100/30">
                <FileText className="w-8 h-8 text-primary-100" />
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                Riwayat Transaksi
              </h1>
            </div>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Pantau semua transaksi dan pesanan Anda dengan mudah
            </p>
          </div>

          {/* Enhanced Filters and Search */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-2xl sm:rounded-3xl p-6 shadow-xl shadow-primary-100/20">
              <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100/20 rounded-xl backdrop-blur-sm border border-primary-100/30">
                    <Filter className="w-5 h-5 text-primary-100" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Filter & Urutkan
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-200" />
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-primary-800/30 border-2 border-primary-100/40 rounded-xl focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 focus:outline-none text-white placeholder-primary-200/60 text-sm shadow-lg backdrop-blur-sm transition-all duration-300 appearance-none cursor-pointer w-full"
                  >
                    <option value="all" className="bg-primary-900 text-white">
                      Semua Status
                    </option>
                    <option
                      value="pending"
                      className="bg-primary-900 text-white"
                    >
                      Menunggu Pembayaran
                    </option>
                    <option
                      value="processing"
                      className="bg-primary-900 text-white"
                    >
                      Diproses
                    </option>
                    <option
                      value="completed"
                      className="bg-primary-900 text-white"
                    >
                      Selesai
                    </option>
                    <option
                      value="cancelled"
                      className="bg-primary-900 text-white"
                    >
                      Dibatalkan
                    </option>
                    <option
                      value="expired"
                      className="bg-primary-900 text-white"
                    >
                      Kadaluarsa
                    </option>
                  </select>
                </div>

                <div className="relative">
                  <SortDesc className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-200" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-primary-800/30 border-2 border-primary-100/40 rounded-xl focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 focus:outline-none text-white placeholder-primary-200/60 text-sm shadow-lg backdrop-blur-sm transition-all duration-300 appearance-none cursor-pointer w-full"
                  >
                    <option
                      value="newest"
                      className="bg-primary-900 text-white"
                    >
                      Terbaru
                    </option>
                    <option
                      value="oldest"
                      className="bg-primary-900 text-white"
                    >
                      Terlama
                    </option>
                    <option
                      value="amount_high"
                      className="bg-primary-900 text-white"
                    >
                      Harga Tertinggi
                    </option>
                    <option
                      value="amount_low"
                      className="bg-primary-900 text-white"
                    >
                      Harga Terendah
                    </option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-sm bg-primary-100/10 px-4 py-2 rounded-xl border border-primary-100/20 backdrop-blur-sm">
                  <Zap className="w-4 h-4 text-primary-100" />
                  <span className="text-primary-100 font-bold">
                    {filteredTransactions.length}
                  </span>
                  <span className="text-primary-200">transaksi ditemukan</span>
                </div>
              </div>

              <button
                onClick={fetchTransactions}
                className="flex items-center gap-2 px-4 py-2 bg-primary-100/20 hover:bg-primary-100/30 text-primary-100 rounded-lg transition-all duration-300 hover:scale-105 font-medium text-sm backdrop-blur-sm border border-primary-100/30"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="container mx-auto px-4 pb-8">
        {displayTransactions.length === 0 ? (
          <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-2xl sm:rounded-3xl p-8 shadow-xl shadow-primary-100/20 text-center transition-all duration-500 hover:shadow-primary-100/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/10 via-transparent to-primary-200/10 rounded-2xl sm:rounded-3xl"></div>

            <div className="relative z-10">
              <div className="w-16 h-16 bg-primary-100/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-primary-100/30">
                <FileText className="w-8 h-8 text-primary-100" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {filter === "all"
                  ? "Belum Ada Transaksi"
                  : "Tidak Ada Transaksi dengan Filter Ini"}
              </h3>
              <p className="text-primary-200/80 mb-4">
                {filter === "all"
                  ? "Anda belum memiliki riwayat transaksi. Mulai berbelanja sekarang!"
                  : "Coba ubah filter untuk melihat transaksi lainnya."}
              </p>
              {filter === "all" && (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary-100/30 font-medium"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Mulai Berbelanja
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {displayTransactions.map((transaction, index) => {
              const isMulti = isMultiCheckout(transaction);
              const allItems = getAllTransactions(transaction);

              return (
                <div
                  key={transaction._id}
                  className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.02] hover:border-primary-100/60"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Enhanced Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-100/10 via-transparent to-primary-200/10 rounded-2xl sm:rounded-3xl"></div>
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-full blur-3xl animate-pulse group-hover:scale-110 transition-transform duration-700"></div>
                  <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-tr from-primary-200/15 to-primary-100/10 rounded-full blur-2xl animate-pulse delay-500 group-hover:scale-110 transition-transform duration-700"></div>

                  {/* Sparkle effects */}
                  <div className="absolute top-4 right-4 w-2 h-2 bg-primary-100 rounded-full animate-ping opacity-75 group-hover:opacity-100"></div>
                  <div className="absolute top-8 right-12 w-1 h-1 bg-primary-200 rounded-full animate-ping delay-300 opacity-60 group-hover:opacity-90"></div>
                  <div className="absolute bottom-8 left-6 w-1.5 h-1.5 bg-primary-100/80 rounded-full animate-ping delay-700 group-hover:opacity-100"></div>

                  {/* Glowing border effect on hover */}
                  <div className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-primary-100/0 via-primary-100/20 to-primary-100/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative z-10 p-4 sm:p-6">
                    {/* Multi-checkout badge */}
                    {isMulti && (
                      <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100/20 border border-primary-100/40 rounded-xl backdrop-blur-sm">
                        <Package className="w-4 h-4 text-primary-100" />
                        <span className="text-sm font-medium text-primary-100">
                          {allItems.length} Items
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Transaction Info */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1">
                        <div className="relative p-2 bg-primary-100/20 rounded-xl backdrop-blur-sm border border-primary-100/30 group-hover:bg-primary-100/30 group-hover:scale-110 transition-all duration-300">
                          {getServiceIcon(transaction.serviceType)}
                          {/* Pulsing ring effect */}
                          <div className="absolute inset-0 rounded-xl border-2 border-primary-100/40 animate-ping opacity-0 group-hover:opacity-75"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white mb-2 line-clamp-2 transition-colors duration-300">
                            {getCheckoutDisplayName(transaction)}
                          </h3>

                          {/* Multi-item details or single item info */}
                          {isMulti ? (
                            <div className="space-y-1 mb-3">
                              {allItems.slice(0, 3).map((item) => (
                                <p
                                  key={item._id}
                                  className="text-sm text-primary-200/80 flex items-center gap-2"
                                >
                                  <span className="w-1.5 h-1.5 bg-primary-100 rounded-full"></span>
                                  {item.serviceName} ({item.quantity}x)
                                </p>
                              ))}
                              {allItems.length > 3 && (
                                <p className="text-sm text-primary-100/80 italic">
                                  +{allItems.length - 3} item lainnya
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2 text-sm text-primary-200/80 mb-3">
                              <span className="bg-primary-100/20 px-2 py-1 rounded-lg capitalize backdrop-blur-sm border border-primary-100/20 group-hover:bg-primary-100/30 group-hover:border-primary-100/40 transition-all duration-300">
                                {transaction.serviceType}
                                {transaction.serviceCategory &&
                                  ` • ${transaction.serviceCategory}`}
                              </span>
                              <span className="text-primary-100/60">•</span>
                              <div className="flex items-center gap-1 group-hover:text-primary-100/90 transition-colors duration-300">
                                <Package className="w-3 h-3" />
                                <span>Qty: {transaction.quantity}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-2 text-sm text-primary-200/80 mb-3">
                            <div className="flex items-center gap-1 group-hover:text-primary-100/90 transition-colors duration-300">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(transaction.createdAt)}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {getStatusBadge(transaction.paymentStatus)}
                            {getStatusBadge(transaction.orderStatus, "order")}
                          </div>
                        </div>
                      </div>

                      {/* Amount and Action */}
                      <div className="flex flex-col sm:items-end gap-3">
                        <div className="text-right relative">
                          {/* Show original price if there's discount */}
                          {calculateTotalDiscount(transaction) > 0 && (
                            <div className="text-xs text-primary-200/60 line-through mb-1">
                              Rp{" "}
                              {calculateOriginalTotal(
                                transaction,
                              ).toLocaleString("id-ID")}
                            </div>
                          )}

                          {/* Price breakdown */}
                          <div className="space-y-1 mb-2">
                            {/* Subtotal after discount */}
                            {(calculateTotalDiscount(transaction) > 0 ||
                              getPaymentFee(transaction) > 0) && (
                              <div className="text-xs text-primary-200/70">
                                Subtotal: Rp{" "}
                                {calculateSubtotalAfterDiscount(
                                  transaction,
                                ).toLocaleString("id-ID")}
                              </div>
                            )}

                            {/* Payment fee */}
                            {getPaymentFee(transaction) > 0 && (
                              <div className="text-xs text-primary-200/70">
                                Biaya Admin: Rp{" "}
                                {getPaymentFee(transaction).toLocaleString(
                                  "id-ID",
                                )}
                              </div>
                            )}
                          </div>

                          {/* Grand Total */}
                          <div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary-100 group-hover:scale-105 transition-transform duration-300">
                            <span className="text-white">
                              Rp{" "}
                              {calculateGrandTotal(transaction).toLocaleString(
                                "id-ID",
                              )}
                            </span>
                          </div>

                          {/* Show discount badge if available */}
                          {calculateTotalDiscount(transaction) > 0 && (
                            <div className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/20 mt-1">
                              <span>💰</span>
                              <span>
                                Hemat Rp{" "}
                                {calculateTotalDiscount(
                                  transaction,
                                ).toLocaleString("id-ID")}
                              </span>
                            </div>
                          )}

                          {isMulti && (
                            <div className="text-sm text-primary-200/70 mt-1">
                              {getTotalItemsCount(transaction)} total items
                            </div>
                          )}
                          {/* Glowing effect behind price */}
                          <div className="absolute -inset-2 bg-primary-100/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/riwayat/${transaction._id}`}
                            className="relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-primary-100/20 hover:bg-primary-100/30 text-white rounded-lg transition-all duration-300 hover:scale-105 font-medium text-sm backdrop-blur-sm border border-primary-100/30 group/btn"
                          >
                            {/* Button glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-primary-200/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                            <Eye className="w-4 h-4 relative z-10 group-hover/btn:scale-110 transition-transform duration-200" />
                            <span className="relative z-10">Detail</span>
                          </Link>
                          {(transaction.paymentStatus === "pending" ||
                            transaction.orderStatus === "waiting_payment") &&
                            !transaction.qrCodeUrl &&
                            (transaction.snapToken ||
                              transaction.duitkuPaymentUrl) && (
                              <a
                                href={
                                  transaction.redirectUrl ||
                                  transaction.duitkuPaymentUrl ||
                                  `/transaction/pending?order_id=${
                                    transaction.midtransOrderId ||
                                    transaction.duitkuOrderId
                                  }`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all duration-300 hover:scale-105 font-medium text-sm shadow-lg group/pay"
                              >
                                {/* Payment button pulse effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 animate-pulse"></div>
                                <CreditCard className="w-4 h-4 relative z-10 group-hover/pay:scale-110 transition-transform duration-200" />
                                <span className="relative z-10">Bayar</span>
                                {/* Urgent indicator */}
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                              </a>
                            )}
                          {/* QR Code indicator for GoPay/QRIS */}
                          {(transaction.paymentStatus === "pending" ||
                            transaction.orderStatus === "waiting_payment") &&
                            transaction.qrCodeUrl && (
                              <Link
                                href={`/riwayat/${transaction._id}`}
                                className="relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-300 hover:scale-105 font-medium text-sm shadow-lg group/qr"
                              >
                                <span className="relative z-10">
                                  📱 Scan QR
                                </span>
                                {/* Urgent indicator */}
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                              </Link>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Invoice ID with enhanced styling */}
                    <div className="mt-4 pt-4 border-t border-primary-100/20 relative">
                      {/* Background accent line */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-primary-100/50 to-transparent"></div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 text-white/80 group-hover:text-primary-100/90 transition-colors duration-300">
                          <div className="p-1 bg-primary-100/20 rounded-lg">
                            <FileText className="w-3 h-3" color="white" />
                          </div>
                          <span>Invoice:</span>
                          <span className="font-mono font-medium text-white bg-primary-100/10 px-2 py-1 rounded border border-primary-100/20">
                            {transaction.invoiceId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-white/80 group-hover:text-primary-100/90 transition-colors duration-300">
                          <div className="p-1 bg-primary-100/20 rounded-lg">
                            <User className="w-3 h-3" />
                          </div>
                          <span>Akun:</span>
                          <span className="font-medium text-white bg-primary-100/10 px-2 py-1 rounded border border-primary-100/20">
                            {transaction.robloxUsername}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Decorative corner elements */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary-100/30 rounded-tl-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary-100/30 rounded-br-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
