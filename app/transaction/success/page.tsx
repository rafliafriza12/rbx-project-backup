"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

function TransactionSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderIdParam = searchParams.get("order_id");
    const statusCode = searchParams.get("status_code");
    const transactionStatus = searchParams.get("transaction_status");

    console.log("=== TRANSACTION SUCCESS PAGE ===");
    console.log("Order ID from URL:", orderIdParam);
    console.log("Status Code:", statusCode);
    console.log("Transaction Status:", transactionStatus);

    if (orderIdParam) {
      setOrderId(orderIdParam);
      setLoading(false);

      // Show success message based on transaction status
      if (transactionStatus === "settlement") {
        toast.success("Pembayaran berhasil! Transaksi Anda sedang diproses.");
      } else {
        toast.info("Pembayaran diterima! Menunggu konfirmasi bank.");
      }
    } else {
      console.warn("No order ID found in URL");
      toast.error("Order ID tidak ditemukan");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    }
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-700 font-medium">Memuat halaman sukses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 text-center border border-green-200">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Pembayaran Berhasil! 🎉
          </h1>
          <p className="text-gray-600">
            Terima kasih atas pembayaran Anda. Transaksi telah berhasil diproses
            dan sedang dikerjakan.
          </p>
        </div>

        {orderId && (
          <div className="bg-gradient-to-br from-[#f9d6db]/30 to-[#f5b8c6]/30 rounded-xl p-4 mb-6 border border-rose-200">
            <p className="text-sm text-gray-600 mb-1">Order ID:</p>
            <p className="font-mono text-xs font-medium text-gray-800 break-all">
              {orderId}
            </p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={() => router.push("/")}
            className="w-full bg-gradient-to-r from-[#f5b8c6] to-[#f9d6db] text-gray-800 py-3 px-4 rounded-xl hover:from-[#f2a5b5] hover:to-[#f6c8ce] transition-all duration-200 font-medium shadow-md"
          >
            🏠 Kembali ke Beranda
          </button>

          <button
            onClick={() => router.push("/profile/transactions")}
            className="w-full bg-gray-500 text-white py-3 px-4 rounded-xl hover:bg-gray-600 transition-colors font-medium"
          >
            📋 Lihat Riwayat Transaksi
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50/80 rounded-xl border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">
              Apa yang terjadi selanjutnya?
            </h3>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• Pesanan Anda sedang diproses oleh tim kami</li>
              <li>• Estimasi waktu pengerjaan: 1-24 jam</li>
              <li>• Anda akan mendapat notifikasi via email/WhatsApp</li>
              <li>• Status dapat dipantau di riwayat transaksi</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50/80 rounded-xl border border-green-200">
            <p className="text-sm text-green-700">
              💬 <strong>Butuh bantuan?</strong>
              <br />
              Hubungi customer service kami melalui WhatsApp untuk informasi
              lebih lanjut.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      }
    >
      <TransactionSuccessContent />
    </Suspense>
  );
}
