"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

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
      <div className="min-h-screen bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Transaksi tidak ditemukan</p>
      </div>
    );
  }

  // Tentukan tampilan berdasarkan status
  const renderStatusUI = () => {
    switch (transactionStatus) {
      case "settlement":
        return (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-600">
              Pembayaran Berhasil 🎉
            </h1>
            <p className="text-gray-700 mt-2">
              Terima kasih, transaksi Anda sudah berhasil diproses.
            </p>
          </div>
        );
      case "pending":
        return (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-amber-600">
              Menunggu Pembayaran ⏳
            </h1>
            <p className="text-gray-700 mt-2">
              Silakan selesaikan pembayaran Anda.{" "}
              {action === "back" && "(Anda keluar dari halaman pembayaran)"}
            </p>
          </div>
        );
      case "cancel":
      case "expire":
      case "failed":
        return (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">
              Transaksi Gagal ❌
            </h1>
            <p className="text-gray-700 mt-2">
              Mohon coba lagi atau hubungi customer service.
            </p>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-600">
              Status Tidak Dikenal
            </h1>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white flex items-center justify-center">
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-8 max-w-lg w-full text-center border">
        {renderStatusUI()}

        {/* Info transaksi ringkas */}
        <div className="mt-6 text-left text-gray-700">
          <p>
            <strong>Invoice ID:</strong> {transaction.invoiceId}
          </p>
          <p>
            <strong>Order ID:</strong> {transaction.midtransOrderId}
          </p>
          <p>
            <strong>Layanan:</strong> {transaction.serviceName}
          </p>
          <p>
            <strong>Total:</strong> Rp{" "}
            {transaction.finalAmount.toLocaleString("id-ID")}
          </p>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600"
          >
            Kembali ke Beranda
          </button>
          <button
            onClick={() => router.push("/riwayat")}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
          >
            Lihat Riwayat
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TransactionResultPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TransactionResultContent />
    </Suspense>
  );
}
