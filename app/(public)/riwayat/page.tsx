"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { Transaction, ApiResponse } from "@/types";

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
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/user/${user?.id}`);
      const data: ApiResponse<Transaction[]> = await response.json();

      if (response.ok && data.data) {
        setTransactions(data.data);
      } else {
        toast.error(data.error || "Gagal mengambil riwayat transaksi");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Gagal mengambil riwayat transaksi");
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
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

  const filteredTransactions = transactions
    .filter((transaction) => {
      if (filter === "all") return true;
      if (filter === "pending")
        return (
          transaction.paymentStatus === "pending" ||
          transaction.orderStatus === "waiting_payment"
        );
      if (filter === "completed")
        return transaction.orderStatus === "completed";
      if (filter === "processing")
        return (
          transaction.orderStatus === "processing" ||
          transaction.orderStatus === "in_progress"
        );
      return (
        transaction.paymentStatus === filter ||
        transaction.orderStatus === filter
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      if (sortBy === "oldest")
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      if (sortBy === "amount_high") return b.totalAmount - a.totalAmount;
      if (sortBy === "amount_low") return a.totalAmount - b.totalAmount;
      return 0;
    });

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat riwayat transaksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
            📋 Riwayat Transaksi
          </h1>
          <p className="text-gray-600">
            Lihat semua transaksi dan pesanan Anda di sini
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 mb-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-sm shadow-sm transition-all duration-200"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Pembayaran</option>
                <option value="settlement">Sudah Dibayar</option>
                <option value="processing">Sedang Diproses</option>
                <option value="in_progress">Sedang Dikerjakan</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
                <option value="failed">Gagal</option>
                <option value="expired">Kadaluarsa</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 bg-white text-sm shadow-sm transition-all duration-200"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
                <option value="amount_high">Harga Tertinggi</option>
                <option value="amount_low">Harga Terendah</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-rose-600 font-medium">
                {filteredTransactions.length}
              </span>
              <span>transaksi ditemukan</span>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
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
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {filter === "all"
                ? "Belum Ada Transaksi"
                : "Tidak Ada Transaksi dengan Filter Ini"}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "Anda belum memiliki riwayat transaksi. Mulai berbelanja sekarang!"
                : "Coba ubah filter untuk melihat transaksi lainnya."}
            </p>
            {filter === "all" && (
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#f5b8c6] to-[#f9d6db] text-gray-800 rounded-lg hover:from-[#f2a5b5] hover:to-[#f6c8ce] transition-all duration-200 font-medium"
              >
                🛒 Mulai Berbelanja
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-rose-200 overflow-hidden hover:shadow-xl transition-shadow duration-200"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Transaction Info */}
                    <div className="flex items-start gap-3 sm:gap-4 flex-1">
                      <div className="text-2xl sm:text-3xl">
                        {getServiceIcon(transaction.serviceType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                          {transaction.serviceName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                          <span className="bg-gray-100 px-2 py-1 rounded capitalize">
                            {transaction.serviceType}
                          </span>
                          <span>•</span>
                          <span>Qty: {transaction.quantity}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.createdAt)}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getStatusBadge(transaction.paymentStatus)}
                          {getStatusBadge(transaction.orderStatus)}
                        </div>
                      </div>
                    </div>

                    {/* Amount and Action */}
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="text-lg sm:text-xl font-bold text-rose-600">
                        Rp {transaction.totalAmount.toLocaleString("id-ID")}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/riwayat/${transaction._id}`}
                          className="px-3 py-1.5 bg-gradient-to-r from-[#f5b8c6] to-[#f9d6db] text-gray-800 rounded-lg hover:from-[#f2a5b5] hover:to-[#f6c8ce] transition-all duration-200 font-medium text-sm"
                        >
                          📋 Detail
                        </Link>
                        {(transaction.paymentStatus === "pending" ||
                          transaction.orderStatus === "waiting_payment") &&
                          transaction.snapToken && (
                            <a
                              href={
                                transaction.redirectUrl ||
                                `/transaction/pending?order_id=${transaction.midtransOrderId}`
                              }
                              className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm"
                            >
                              💳 Bayar
                            </a>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Invoice ID */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
                      <span className="text-gray-600">
                        Invoice:{" "}
                        <span className="font-mono font-medium text-gray-800">
                          {transaction.invoiceId}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Akun:{" "}
                        <span className="font-medium text-gray-800">
                          {transaction.robloxUsername}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🚀 Aksi Cepat
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/track-order"
              className="flex items-center justify-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              🔍 Lacak Pesanan
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              🛒 Belanja Lagi
            </Link>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              💬 Hubungi CS
            </a>
            <button
              onClick={fetchTransactions}
              className="flex items-center justify-center gap-2 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
