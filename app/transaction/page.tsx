"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Home,
  History,
  Receipt,
  Package,
  ShoppingBag,
} from "lucide-react";
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  getTotalItemsCount,
  getCheckoutDisplayName,
} from "@/lib/transaction-helpers";

interface Transaction {
  _id: string;
  invoiceId: string;
  serviceName: string;
  serviceType: string;
  quantity: number;
  totalAmount: number;
  finalAmount: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  robloxUsername: string;
  midtransOrderId: string;
  // Multi-checkout fields
  relatedTransactions?: Transaction[];
  isMultiCheckout?: boolean;
  masterOrderId?: string;
  serviceCategory?: string;
}

function TransactionResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get("order_id");
  const transactionStatus = searchParams.get("transaction_status"); // dari midtrans
  const action = searchParams.get("action"); // contoh: back

  useEffect(() => {
    if (!orderId) {
      toast.error("Order ID tidak ditemukan");
      router.push("/");
      return;
    }

    fetchTransaction(orderId);
  }, [orderId, router]);

  const fetchTransaction = async (orderId: string) => {
    try {
      const response = await fetch(`/api/transactions/${orderId}`);
      const data = await response.json();

      if (response.ok) {
        setTransaction(data.data);
      } else {
        toast.error(data.error || "Transaksi tidak ditemukan");
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      toast.error("Gagal mengambil data transaksi");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-neon-pink/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse delay-500"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-100/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-100/30 border-t-primary-100"></div>
          <p className="text-primary-100 font-medium animate-pulse">
            Memuat transaksi...
          </p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-neon-pink/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative bg-primary-900/60 backdrop-blur-xl border-2 border-primary-100/40 rounded-3xl shadow-2xl shadow-primary-100/20 p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-primary-200 mx-auto mb-4" />
            <p className="text-primary-100 text-lg">
              Transaksi tidak ditemukan
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-6 px-6 py-2 bg-primary-100/20 hover:bg-primary-100/30 text-primary-100 rounded-xl border border-primary-100/40 transition-all duration-300"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tentukan tampilan berdasarkan status
  const renderStatusUI = () => {
    switch (transactionStatus) {
      case "settlement":
        return (
          <div className="text-center relative">
            {/* Success Animation */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
              <CheckCircle className="relative w-24 h-24 text-emerald-400 mx-auto animate-bounce" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Pembayaran Berhasil! 🎉
            </h1>
            <p className="text-primary-200 text-lg">
              Terima kasih, transaksi Anda sudah berhasil diproses.
              <br />
              <span className="text-emerald-400 font-semibold">
                Pesanan Anda sedang dalam proses pengerjaan
              </span>
            </p>
          </div>
        );
      case "pending":
        return (
          <div className="text-center relative">
            {/* Pending Animation */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse"></div>
              <Clock className="relative w-24 h-24 text-amber-400 mx-auto animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Menunggu Pembayaran ⏳
            </h1>
            <p className="text-primary-200 text-lg">
              Silakan selesaikan pembayaran Anda.
              {action === "back" && (
                <span className="block mt-2 text-amber-300">
                  (Anda keluar dari halaman pembayaran)
                </span>
              )}
            </p>
          </div>
        );
      case "cancel":
      case "expire":
      case "failed":
        return (
          <div className="text-center relative">
            {/* Failed Animation */}
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl animate-pulse"></div>
              <XCircle className="relative w-24 h-24 text-red-400 mx-auto" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Transaksi Gagal ❌
            </h1>
            <p className="text-primary-200 text-lg">
              Mohon coba lagi atau hubungi customer service kami.
            </p>
          </div>
        );
      default:
        return (
          <div className="text-center relative">
            <AlertCircle className="w-24 h-24 text-primary-200 mx-auto mb-6" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Status Tidak Dikenal
            </h1>
            <p className="text-primary-200">Status: {transactionStatus}</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-neon-pink/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary-100/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-100 rounded-full animate-ping opacity-75"></div>
        <div className="absolute top-3/4 right-1/3 w-1.5 h-1.5 bg-neon-pink rounded-full animate-ping delay-300 opacity-60"></div>
        <div className="absolute bottom-1/3 left-2/3 w-2.5 h-2.5 bg-neon-purple rounded-full animate-ping delay-700 opacity-70"></div>
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Main Card */}
          <div className="group relative bg-gradient-to-br from-primary-900/80 via-primary-800/60 to-primary-700/70 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl shadow-2xl shadow-primary-100/20 overflow-hidden transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.01]">
            {/* Card Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/5 via-transparent to-primary-200/5 rounded-3xl"></div>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-primary-100/15 to-primary-200/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute -bottom-24 -left-24 w-40 h-40 bg-gradient-to-tr from-primary-200/10 to-primary-100/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>

            {/* Sparkle effects */}
            <div className="absolute top-6 right-6 w-2 h-2 bg-primary-100 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-10 right-14 w-1 h-1 bg-primary-200 rounded-full animate-ping delay-300 opacity-60"></div>
            <div className="absolute bottom-10 left-8 w-1.5 h-1.5 bg-primary-100/80 rounded-full animate-ping delay-700"></div>

            {/* Content */}
            <div className="relative z-10 p-8 sm:p-12">
              {/* Multi-Checkout Badge */}
              {isMultiCheckout(transaction as any) && (
                <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-xl backdrop-blur-sm">
                  <ShoppingBag className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">
                    Multi-Item Checkout •{" "}
                    {getTotalItemsCount(transaction as any)} Items
                  </span>
                </div>
              )}

              {/* Status Section */}
              {renderStatusUI()}

              {/* Transaction Info Card */}
              <div className="mt-10 bg-primary-900/40 backdrop-blur-sm border border-primary-100/30 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt className="w-5 h-5 text-primary-100" />
                  <h3 className="text-lg font-semibold text-white">
                    {isMultiCheckout(transaction as any)
                      ? "Ringkasan Checkout"
                      : "Detail Transaksi"}
                  </h3>
                </div>

                {/* Multi-Checkout: Show all items */}
                {isMultiCheckout(transaction as any) ? (
                  <div className="space-y-4">
                    {/* Items List */}
                    <div className="space-y-3">
                      {getAllTransactions(transaction as any).map(
                        (item, index) => (
                          <div
                            key={item._id}
                            className="p-4 bg-primary-800/30 border border-primary-100/20 rounded-xl"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="bg-primary-100/20 text-primary-100 px-2 py-0.5 rounded text-xs font-semibold">
                                    ITEM {index + 1}
                                  </span>
                                  <h4 className="font-semibold text-white text-sm">
                                    {item.serviceName}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-primary-200">
                                  <span className="capitalize">
                                    {item.serviceType}
                                  </span>
                                  <span>•</span>
                                  <span>Qty: {item.quantity}</span>
                                  <span>•</span>
                                  <span className="font-mono">
                                    {item.robloxUsername}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-white text-sm">
                                  Rp {item.totalAmount.toLocaleString("id-ID")}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Grand Total Section */}
                    <div className="pt-4 border-t-2 border-primary-100/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-primary-200 font-medium">
                          Invoice ID:
                        </span>
                        <span className="font-mono font-semibold text-primary-100 text-sm">
                          {transaction.invoiceId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-primary-200 font-medium">
                          Order ID:
                        </span>
                        <span className="font-mono font-semibold text-primary-100 text-xs">
                          {transaction.midtransOrderId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-primary-100/20">
                        <span className="text-lg font-bold text-white">
                          Grand Total:
                        </span>
                        <span className="text-xl font-bold text-primary-100">
                          Rp{" "}
                          {calculateGrandTotal(
                            transaction as any
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="text-xs text-primary-200 text-right mt-1">
                        {getTotalItemsCount(transaction as any)} total items
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single Transaction Info */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex justify-between sm:col-span-2 py-3 border-b border-primary-100/20">
                      <span className="text-primary-200 font-medium">
                        Invoice ID:
                      </span>
                      <span className="font-mono font-semibold text-primary-100">
                        {transaction.invoiceId}
                      </span>
                    </div>
                    <div className="flex justify-between sm:col-span-2 py-3 border-b border-primary-100/20">
                      <span className="text-primary-200 font-medium">
                        Order ID:
                      </span>
                      <span className="font-mono font-semibold text-primary-100 text-sm">
                        {transaction.midtransOrderId}
                      </span>
                    </div>
                    <div className="flex justify-between sm:col-span-2 py-3 border-b border-primary-100/20">
                      <span className="text-primary-200 font-medium flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Layanan:
                      </span>
                      <span className="font-semibold text-white text-right max-w-[200px] truncate">
                        {transaction.serviceName}
                      </span>
                    </div>
                    <div className="flex justify-between sm:col-span-2 py-3 border-t-2 border-primary-100/30 mt-2">
                      <span className="text-lg font-bold text-white">
                        Total Pembayaran:
                      </span>
                      <span className="text-xl font-bold text-primary-100">
                        Rp {transaction.finalAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={() => router.push("/")}
                  className="group/btn relative flex-1 overflow-hidden flex items-center justify-center gap-3 px-6 py-4 bg-primary-100/20 hover:bg-primary-100/30 text-white rounded-xl transition-all duration-300 hover:scale-105 font-semibold backdrop-blur-sm border border-primary-100/40 hover:border-primary-100/60"
                >
                  {/* Button glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-100/10 to-primary-200/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <Home className="relative w-5 h-5 group-hover/btn:scale-110 transition-transform duration-200" />
                  <span className="relative">Kembali ke Beranda</span>
                </button>
                <button
                  onClick={() => router.push("/riwayat")}
                  className="group/btn relative flex-1 overflow-hidden flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 hover:from-neon-purple/30 hover:to-neon-pink/30 text-white rounded-xl transition-all duration-300 hover:scale-105 font-semibold backdrop-blur-sm border border-primary-100/40 hover:border-primary-100/60"
                >
                  {/* Button glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                  <History className="relative w-5 h-5 group-hover/btn:scale-110 transition-transform duration-200" />
                  <span className="relative">Lihat Riwayat</span>
                </button>
              </div>

              {/* Additional Info */}
              {transactionStatus === "settlement" && (
                <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <p className="text-emerald-300 text-sm text-center">
                    💡 <strong>Tips:</strong> Simpan Invoice ID Anda untuk
                    tracking pesanan
                  </p>
                </div>
              )}

              {transactionStatus === "pending" && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-amber-300 text-sm text-center">
                    ⚡ Segera selesaikan pembayaran agar pesanan dapat segera
                    diproses
                  </p>
                </div>
              )}
            </div>

            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-10 h-10 border-l-2 border-t-2 border-primary-100/40 rounded-tl-3xl opacity-60"></div>
            <div className="absolute bottom-0 right-0 w-10 h-10 border-r-2 border-b-2 border-primary-100/40 rounded-br-3xl opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-neon-pink/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>

          <div className="relative flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-100/30 border-t-primary-100"></div>
            <p className="text-primary-100 font-medium animate-pulse">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <TransactionResultContent />
    </Suspense>
  );
}
