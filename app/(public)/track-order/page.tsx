"use client";

import { useState } from "react";
import { toast } from "react-toastify";
import { Transaction, ApiResponse } from "@/types";

export default function TrackOrderPage() {
  const [invoiceId, setInvoiceId] = useState("");
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceId.trim()) {
      toast.error("Masukkan kode invoice");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/transactions/invoice/${invoiceId.trim()}`
      );
      const data: ApiResponse<Transaction> = await response.json();

      if (response.ok && data.data) {
        setTransaction(data.data);
        toast.success("Transaksi ditemukan!");
      } else {
        setTransaction(null);
        toast.error(data.error || "Transaksi tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      setTransaction(null);
      toast.error("Gagal mencari transaksi");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse status from "payment:settlement" or "order:processing" format
  const parseStatus = (status: string) => {
    if (status.includes(":")) {
      const [type, statusValue] = status.split(":");
      return {
        type: type, // "payment" or "order"
        status: statusValue, // "settlement", "processing", etc.
        displayStatus: statusValue,
      };
    }
    return {
      type: "general",
      status: status,
      displayStatus: status,
    };
  };

  const getStatusBadge = (status: string) => {
    const parsed = parseStatus(status);
    const displayStatus = parsed.displayStatus;

    const statusConfig = {
      // Payment Status
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Menunggu Pembayaran",
      },
      settlement: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Sudah Dibayar",
      },
      expired: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "Kadaluarsa",
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Dibatalkan",
      },
      failed: { bg: "bg-red-100", text: "text-red-800", label: "Gagal" },

      // Order Status
      waiting_payment: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Menunggu Pembayaran",
      },
      processing: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        label: "Sedang Diproses",
      },
      in_progress: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        label: "Sedang Dikerjakan",
      },
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Selesai",
      },
    };

    const config =
      statusConfig[displayStatus as keyof typeof statusConfig] ||
      statusConfig.pending;

    return (
      <span
        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
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

  return (
    <div className="min-h-screen py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            Lacak Pesanan Anda
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-2">
            Masukkan kode invoice untuk melihat status dan detail pesanan Anda.
            Kode invoice dikirim melalui email setelah pemesanan.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border border-rose-200">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Invoice *
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={invoiceId}
                  onChange={(e) => setInvoiceId(e.target.value.toUpperCase())}
                  className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-black transition-colors bg-white/70 text-sm sm:text-base"
                  placeholder="Contoh: INV-20240912-001"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !invoiceId.trim()}
                  className={`w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                    loading || !invoiceId.trim()
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-gradient-to-r from-[#f5b8c6] to-[#f9d6db] text-gray-800 hover:from-[#f2a5b5] hover:to-[#f6c8ce] shadow-md"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800 mr-2"></div>
                      <span className="hidden sm:inline">Mencari...</span>
                      <span className="sm:hidden">...</span>
                    </div>
                  ) : (
                    <>
                      <span className="hidden sm:inline"> Lacak Pesanan</span>
                      <span className="sm:hidden"> Lacak</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50/80 rounded-xl p-3 sm:p-4 border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2 text-sm sm:text-base">
                Tips Pencarian:
              </h3>
              <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
                <li>
                  • Kode invoice dimulai dengan "INV-" diikuti tanggal dan nomor
                  urut
                </li>
                <li>
                  • Periksa email konfirmasi pesanan untuk mendapatkan kode
                  invoice
                </li>
                <li>
                  • Pastikan memasukkan kode invoice dengan benar
                  (case-insensitive)
                </li>
              </ul>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Mencari transaksi...</p>
          </div>
        )}

        {/* No Results */}
        {searched && !loading && !transaction && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 text-center border border-red-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Transaksi Tidak Ditemukan
            </h3>
            <p className="text-gray-600 mb-4">
              Tidak dapat menemukan transaksi dengan kode invoice "{invoiceId}".
            </p>
            <div className="bg-amber-50/80 rounded-xl p-4 border border-amber-200 text-left">
              <h4 className="font-medium text-amber-800 mb-2">
                Kemungkinan Penyebab:
              </h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Kode invoice salah atau tidak lengkap</li>
                <li>• Transaksi belum dibuat atau masih dalam proses</li>
                <li>• Kode invoice sudah kadaluarsa (lebih dari 6 bulan)</li>
                <li>• Terjadi kesalahan penulisan</li>
              </ul>
            </div>
          </div>
        )}

        {/* Transaction Details */}
        {transaction && (
          <div className="space-y-4 sm:space-y-6">
            {/* Transaction Header */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-rose-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
                    {transaction.serviceName}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 capitalize">
                    {transaction.serviceType} • Invoice: {transaction.invoiceId}
                  </p>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="mb-2">
                    {getStatusBadge(transaction.orderStatus)}
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-rose-600">
                    Rp {transaction.totalAmount.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-[#f9d6db]/30 to-[#f5b8c6]/30 rounded-xl p-3 sm:p-4">
                  <h3 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
                    Informasi Pesanan
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600 flex-shrink-0 mr-2">
                        Tanggal Pesanan:
                      </span>
                      <span className="font-medium text-gray-800 text-right">
                        {formatDate(transaction.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-gray-800">
                        {transaction.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Akun Roblox:</span>
                      <span className="font-medium text-gray-800 break-all">
                        {transaction.robloxUsername}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[#f9d6db]/30 to-[#f5b8c6]/30 rounded-xl p-3 sm:p-4">
                  <h3 className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
                    Informasi Pembeli
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-gray-800">
                        {transaction.userId ||
                        transaction.customerInfo?.userId ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            👤 User Terdaftar
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            👥 Guest Checkout
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nama:</span>
                      <span className="font-medium text-gray-800 break-words">
                        {transaction.customerInfo?.name || "Tidak tersedia"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-800 break-all">
                        {transaction.customerInfo?.email || "Tidak tersedia"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Telepon:</span>
                      <span className="font-medium text-gray-800 break-all">
                        {transaction.customerInfo?.phone || "Tidak tersedia"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-rose-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Riwayat Status Pesanan
              </h3>

              <div className="space-y-3 sm:space-y-4">
                {transaction.statusHistory &&
                transaction.statusHistory.length > 0 ? (
                  transaction.statusHistory.map((status, index) => {
                    const parsed = parseStatus(status.status);
                    const isPaymentStatus = parsed.type === "payment";
                    const isOrderStatus = parsed.type === "order";

                    return (
                      <div
                        key={index}
                        className="flex items-start space-x-3 sm:space-x-4"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                              isPaymentStatus
                                ? "bg-blue-100"
                                : isOrderStatus
                                ? "bg-green-100"
                                : "bg-rose-100"
                            }`}
                          >
                            {isPaymentStatus ? (
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                              </svg>
                            ) : isOrderStatus ? (
                              <svg
                                className="w-3 h-3 sm:w-4 sm:h-4 text-green-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-rose-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusBadge(status.status)}
                                {isPaymentStatus && (
                                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                    Pembayaran
                                  </span>
                                )}
                                {isOrderStatus && (
                                  <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                                    Pesanan
                                  </span>
                                )}
                              </div>
                              {status.notes && (
                                <p className="text-xs sm:text-sm text-gray-600 break-words">
                                  {status.notes}
                                </p>
                              )}
                              {status.updatedBy &&
                                status.updatedBy !== "system" && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Diperbarui oleh: {status.updatedBy}
                                  </p>
                                )}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                              {formatDate(status.updatedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <p className="text-sm sm:text-base text-gray-500">
                      Belum ada riwayat status
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-rose-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Status Pembayaran
              </h3>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gradient-to-br from-[#f9d6db]/30 to-[#f5b8c6]/30 rounded-xl gap-3">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">
                    Status Pembayaran:
                  </p>
                  <div className="mb-2">
                    {getStatusBadge(transaction.paymentStatus)}
                  </div>
                  {transaction.midtransOrderId && (
                    <p className="text-xs sm:text-sm text-gray-600 break-all">
                      Order ID: {transaction.midtransOrderId}
                    </p>
                  )}
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm text-gray-600">
                    Total Pembayaran:
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-rose-600">
                    Rp {transaction.totalAmount.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-rose-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
                Tindakan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {(transaction.paymentStatus === "pending" ||
                  transaction.orderStatus === "waiting_payment") &&
                  transaction.snapToken && (
                    <a
                      href={
                        transaction.redirectUrl ||
                        `/transaction/pending?order_id=${transaction.midtransOrderId}`
                      }
                      className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl hover:from-yellow-600 hover:to-amber-700 transition-all duration-200 font-medium shadow-md text-sm sm:text-base"
                    >
                      💳 Lanjutkan Pembayaran
                    </a>
                  )}

                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium text-sm sm:text-base"
                >
                  🖨️ Cetak Detail
                </button>

                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-md text-sm sm:text-base"
                >
                  💬 Hubungi CS
                </a>

                <button
                  onClick={() => {
                    setTransaction(null);
                    setSearched(false);
                    setInvoiceId("");
                  }}
                  className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#f5b8c6] to-[#f9d6db] text-gray-800 rounded-xl hover:from-[#f2a5b5] hover:to-[#f6c8ce] transition-all duration-200 font-medium shadow-md text-sm sm:text-base"
                >
                  🔍 Lacak Pesanan Lain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!transaction && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-4 sm:p-6 border border-blue-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">
              Butuh Bantuan?
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">
                  Cara Mendapatkan Kode Invoice:
                </h4>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <li>• Cek email konfirmasi setelah pemesanan</li>
                  <li>
                    • Lihat di halaman riwayat transaksi (jika sudah login)
                  </li>
                  <li>
                    • Screenshot bukti pembayaran biasanya mencantumkan invoice
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-gray-800 mb-2 text-sm sm:text-base">
                  Masih Tidak Menemukan?
                </h4>
                <div className="space-y-2">
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs sm:text-sm"
                  >
                    💬 Hubungi Customer Service
                  </a>
                  <a
                    href="mailto:support@rbxstore.com"
                    className="block w-full text-center px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
                  >
                    📧 Kirim Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
