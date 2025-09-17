"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface Transaction {
  _id: string;
  invoiceId: string;
  serviceName: string;
  serviceType: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  robloxUsername: string;
  midtransOrderId: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in (simplified version)
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        if (response.ok) {
          setIsAuthenticated(true);
          fetchTransactions();
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      }
    };

    checkAuth();
  }, [filter, currentPage, router]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(filter !== "all" && { status: filter }),
      });

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.data);
        setTotalPages(data.pagination.totalPages);
      } else {
        toast.error(data.error || "Gagal mengambil data transaksi");
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Gagal mengambil data transaksi");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "settlement":
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
      case "processing":
      case "in_progress":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
      case "cancelled":
      case "expired":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      // Payment Status
      pending: "Menunggu Pembayaran",
      settlement: "Sudah Dibayar",
      expired: "Kadaluarsa",
      cancelled: "Dibatalkan",
      failed: "Gagal",

      // Order Status
      waiting_payment: "Menunggu Pembayaran",
      processing: "Sedang Diproses",
      in_progress: "Sedang Dikerjakan",
      completed: "Selesai",
      refunded: "Dikembalikan",
    };

    return statusMap[status] || status;
  };

  const handleViewDetails = (transaction: Transaction) => {
    // Redirect to appropriate transaction status page
    if (transaction.paymentStatus === "settlement") {
      router.push(
        `/transaction/success?order_id=${transaction.midtransOrderId}`
      );
    } else if (transaction.paymentStatus === "pending") {
      router.push(
        `/transaction/pending?order_id=${transaction.midtransOrderId}`
      );
    } else {
      router.push(
        `/transaction/failed?order_id=${transaction.midtransOrderId}`
      );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Riwayat Transaksi
              </h1>
              <p className="text-gray-600 mt-1">
                Lihat semua transaksi yang pernah Anda lakukan
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buat Pesanan Baru
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Menunggu Pembayaran
            </button>
            <button
              onClick={() => setFilter("settlement")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "settlement"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Berhasil
            </button>
            <button
              onClick={() => setFilter("failed")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "failed"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Gagal
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Memuat transaksi...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum Ada Transaksi
              </h3>
              <p className="text-gray-600 mb-4">
                Anda belum memiliki transaksi apapun
              </p>
              <button
                onClick={() => router.push("/")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mulai Berbelanja
              </button>
            </div>
          ) : (
            transactions.map((transaction) => (
              <div
                key={transaction._id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Transaction Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {transaction.serviceName}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {transaction.serviceType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          Rp {transaction.totalAmount.toLocaleString("id-ID")}
                        </p>
                        <p className="text-sm text-gray-600">
                          Qty: {transaction.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Invoice ID:</span>
                        <p className="font-medium text-gray-900">
                          {transaction.invoiceId}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Akun Roblox:</span>
                        <p className="font-medium text-gray-900">
                          {transaction.robloxUsername}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Tanggal:</span>
                        <p className="font-medium text-gray-900">
                          {new Date(transaction.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col lg:items-end gap-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Pembayaran:
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.paymentStatus
                          )}`}
                        >
                          {getStatusText(transaction.paymentStatus)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Pesanan:</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            transaction.orderStatus
                          )}`}
                        >
                          {getStatusText(transaction.orderStatus)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleViewDetails(transaction)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
