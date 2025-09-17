"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function TransactionFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get("order_id");

    if (orderId) {
      fetchTransaction(orderId);
    } else {
      toast.error("Order ID tidak ditemukan");
      router.push("/");
    }
  }, [searchParams, router]);

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

  const handleRetryPayment = async () => {
    if (!transaction) return;

    try {
      const response = await fetch(
        `/api/transactions/${transaction._id}/retry`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (response.ok && data.snapToken) {
        // Redirect to Midtrans Snap
        if (typeof window !== "undefined" && (window as any).snap) {
          (window as any).snap.pay(data.snapToken, {
            onSuccess: (result: any) => {
              toast.success("Pembayaran berhasil!");
              router.push(`/transaction/success?order_id=${result.order_id}`);
            },
            onPending: (result: any) => {
              toast.info("Pembayaran pending, silakan selesaikan pembayaran");
              router.push(`/transaction/pending?order_id=${result.order_id}`);
            },
            onError: (result: any) => {
              toast.error("Pembayaran gagal!");
              console.error("Payment error:", result);
            },
            onClose: () => {
              toast.warning("Pembayaran dibatalkan");
            },
          });
        }
      } else {
        toast.error(data.error || "Gagal membuat ulang pembayaran");
      }
    } catch (error) {
      console.error("Error retrying payment:", error);
      toast.error("Gagal membuat ulang pembayaran");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-rose-700 font-medium">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl shadow-xl p-8 border border-rose-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Transaksi tidak ditemukan
          </h1>
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-[#f5b8c6] to-[#f9d6db] text-gray-800 px-6 py-3 rounded-xl hover:from-[#f2a5b5] hover:to-[#f6c8ce] transition-all duration-200 font-medium shadow-md"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const getFailureReason = (status: string) => {
    switch (status) {
      case "expired":
        return {
          title: "Pembayaran Kadaluarsa",
          description:
            "Waktu pembayaran telah habis. Silakan buat pesanan baru.",
          icon: (
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
      case "cancelled":
        return {
          title: "Pembayaran Dibatalkan",
          description: "Pembayaran telah dibatalkan oleh user atau sistem.",
          icon: (
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ),
        };
      case "failed":
      default:
        return {
          title: "Pembayaran Gagal",
          description:
            "Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi.",
          icon: (
            <svg
              className="w-8 h-8 text-red-600"
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
          ),
        };
    }
  };

  const failureInfo = getFailureReason(transaction.paymentStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-rose-200">
          {/* Failed Header */}
          <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white p-6 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
              {failureInfo.icon}
            </div>
            <h1 className="text-2xl font-bold">{failureInfo.title}</h1>
            <p className="text-red-100 mt-2">{failureInfo.description}</p>
          </div>

          {/* Transaction Details */}
          <div className="p-6">
            <div className="grid gap-6">
              {/* Invoice Info */}
              <div className="bg-gradient-to-br from-[#f9d6db]/30 to-[#f5b8c6]/30 rounded-xl p-4">
                <h2 className="font-semibold text-gray-800 mb-3">
                  Detail Transaksi
                </h2>
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice ID:</span>
                    <span className="font-medium text-gray-800">
                      {transaction.invoiceId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium text-gray-800">
                      {transaction.midtransOrderId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="font-medium text-gray-800">
                      {new Date(transaction.createdAt).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="bg-gradient-to-br from-[#f9d6db]/30 to-[#f5b8c6]/30 rounded-xl p-4">
                <h2 className="font-semibold text-gray-800 mb-3">Layanan</h2>
                <div className="grid gap-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nama Layanan:</span>
                    <span className="font-medium text-gray-800">
                      {transaction.serviceName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jenis:</span>
                    <span className="font-medium text-gray-800 capitalize">
                      {transaction.serviceType}
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
                    <span className="font-medium text-gray-800">
                      {transaction.robloxUsername}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-red-50/80 rounded-xl p-4 border border-red-200">
                <h2 className="font-semibold text-gray-800 mb-3">
                  Ringkasan Pembayaran
                </h2>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-800">
                    Total yang Harus Dibayar:
                  </span>
                  <span className="text-2xl font-bold text-red-600">
                    Rp {transaction.totalAmount.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Status Information */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4">
                <h3 className="font-medium text-amber-800 mb-2">
                  Apa yang Terjadi?
                </h3>
                <div className="text-sm text-amber-700 space-y-2">
                  {transaction.paymentStatus === "expired" && (
                    <div>
                      <p>• Batas waktu pembayaran telah habis</p>
                      <p>• Transaksi otomatis dibatalkan oleh sistem</p>
                      <p>
                        • Silakan buat pesanan baru jika masih ingin membeli
                      </p>
                    </div>
                  )}
                  {transaction.paymentStatus === "cancelled" && (
                    <div>
                      <p>• Pembayaran dibatalkan secara manual</p>
                      <p>• Tidak ada biaya yang dikenakan</p>
                      <p>• Anda dapat membuat pesanan baru kapan saja</p>
                    </div>
                  )}
                  {transaction.paymentStatus === "failed" && (
                    <div>
                      <p>• Terjadi masalah teknis saat memproses pembayaran</p>
                      <p>
                        • Kemungkinan masalah dari bank atau metode pembayaran
                      </p>
                      <p>
                        • Silakan coba lagi atau gunakan metode pembayaran lain
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {transaction.paymentStatus === "failed" && (
                  <button
                    onClick={handleRetryPayment}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-md"
                  >
                    Coba Bayar Lagi
                  </button>
                )}
                <button
                  onClick={() => router.push("/")}
                  className="flex-1 bg-gradient-to-r from-[#f5b8c6] to-[#f9d6db] text-gray-800 py-3 px-4 rounded-xl hover:from-[#f2a5b5] hover:to-[#f6c8ce] transition-all duration-200 font-medium shadow-md"
                >
                  Buat Pesanan Baru
                </button>
              </div>

              {transaction.paymentStatus !== "failed" && (
                <div className="flex gap-4">
                  <button
                    onClick={() => router.push("/transactions")}
                    className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors font-medium"
                  >
                    Lihat Semua Transaksi
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="flex-1 bg-gradient-to-r from-[#f5b8c6] to-[#f9d6db] text-gray-800 py-3 px-4 rounded-xl hover:from-[#f2a5b5] hover:to-[#f6c8ce] transition-all duration-200 font-medium shadow-md"
                  >
                    Kembali ke Beranda
                  </button>
                </div>
              )}

              {/* Troubleshooting */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
                <h3 className="font-medium text-blue-800 mb-2">
                  Tips Mengatasi Masalah Pembayaran
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Pastikan saldo atau limit kartu kredit mencukupi</li>
                  <li>• Coba gunakan metode pembayaran yang berbeda</li>
                  <li>• Pastikan koneksi internet stabil</li>
                  <li>• Periksa kembali data yang dimasukkan</li>
                  <li>• Hubungi bank jika menggunakan kartu kredit/debit</li>
                </ul>
              </div>

              {/* Support */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  Masih mengalami masalah? Hubungi customer service kami
                </p>
                <div className="flex justify-center gap-4">
                  <a
                    href="https://wa.me/6281234567890"
                    className="flex items-center text-green-600 hover:text-green-700 text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                    </svg>
                    WhatsApp
                  </a>
                  <a
                    href="mailto:support@rbxstore.com"
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
