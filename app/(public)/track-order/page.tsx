"use client";

import React, { useState } from "react";
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  TruckIcon,
  AlertTriangle,
} from "lucide-react";
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  calculateOriginalTotal,
  calculateTotalDiscount,
  getTotalItemsCount,
  getCheckoutDisplayName,
} from "@/lib/transaction-helpers";
import { Transaction } from "@/types";

export default function TrackOrderPage() {
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch(
        `/api/transactions/${encodeURIComponent(invoiceId)}`
      );

      const data = await response.json();
      console.log(data.data);
      if (response.ok && data.data) {
        console.log("=== TRACK ORDER FRONTEND DEBUG ===");
        console.log("Transaction received:", data.data);
        console.log("Is Multi Checkout:", data.data.isMultiCheckout);
        console.log(
          "Related Transactions:",
          data.data.relatedTransactions?.length || 0
        );

        // Debug each item
        const allItems = [data.data, ...(data.data.relatedTransactions || [])];
        allItems.forEach((item: any, idx: number) => {
          console.log(`\nItem ${idx + 1}:`, {
            name: item.serviceName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
            discountAmount: item.discountAmount,
            finalAmount: item.finalAmount,
            calculated_total: item.quantity * item.unitPrice,
          });
        });

        setTransaction(data.data);
      } else {
        setTransaction(null);
      }
    } catch (error) {
      console.error("Error tracking order:", error);
      setTransaction(null);
    } finally {
      setLoading(false);
    }
  };

  // Status badge generator with purple theme
  const getStatusBadge = (status: string) => {
    // Extract actual status from format like "payment:settlement" or "order:completed"
    let actualStatus = status;
    if (status.includes(":")) {
      actualStatus = status.split(":")[1];
    }

    const statusStyles: { [key: string]: string } = {
      // Payment Status
      pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
      settlement: "bg-green-500/20 text-green-300 border-green-500/40",
      expired: "bg-gray-500/20 text-gray-300 border-gray-500/40",
      cancelled: "bg-red-500/20 text-red-300 border-red-500/40",
      failed: "bg-red-500/20 text-red-300 border-red-500/40",

      // Order Status
      waiting_payment: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      processing: "bg-blue-500/20 text-blue-300 border-blue-500/40",
      in_progress: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",

      // Legacy support
      paid: "bg-green-500/20 text-green-300 border-green-500/40",
      refunded: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    };

    const statusIcons: { [key: string]: React.ReactElement } = {
      // Payment Status
      pending: <Clock className="w-3 h-3" />,
      settlement: <CheckCircle className="w-3 h-3" />,
      expired: <XCircle className="w-3 h-3" />,
      cancelled: <XCircle className="w-3 h-3" />,
      failed: <XCircle className="w-3 h-3" />,

      // Order Status
      waiting_payment: <Clock className="w-3 h-3" />,
      processing: <Package className="w-3 h-3" />,
      in_progress: <TruckIcon className="w-3 h-3" />,
      completed: <CheckCircle className="w-3 h-3" />,

      // Legacy support
      paid: <CheckCircle className="w-3 h-3" />,
      refunded: <XCircle className="w-3 h-3" />,
    };

    const statusLabels: { [key: string]: string } = {
      // Payment Status
      pending: "Pending",
      settlement: "Sudah Dibayar",
      expired: "Kadaluarsa",
      cancelled: "Dibatalkan",
      failed: "Gagal",

      // Order Status
      waiting_payment: "Menunggu Pembayaran",
      processing: "Sedang Diproses",
      in_progress: "Sedang Dikerjakan",
      completed: "Selesai",

      // Legacy support
      paid: "Dibayar",
      refunded: "Dikembalikan",
    };

    const normalizedStatus = actualStatus?.toLowerCase() || "pending";
    const style = statusStyles[normalizedStatus] || statusStyles.pending;
    const icon = statusIcons[normalizedStatus] || statusIcons.pending;
    const label =
      statusLabels[normalizedStatus] ||
      normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1);

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${style}`}
      >
        {icon}
        {label}
      </span>
    );
  };

  const parseStatus = (status: string) => {
    // Format dari API: "payment:settlement" atau "order:completed"
    if (status.includes(":")) {
      const [type, statusValue] = status.split(":");
      return {
        type: type,
        status: statusValue,
      };
    }

    // Fallback untuk status lama - sesuai dengan enum di model
    const paymentStatuses = [
      "pending",
      "settlement",
      "expired",
      "cancelled",
      "failed",
    ];
    const orderStatuses = [
      "waiting_payment",
      "pending",
      "processing",
      "in_progress",
      "completed",
      "cancelled",
      "failed",
    ];

    return {
      type: paymentStatuses.includes(status?.toLowerCase())
        ? "payment"
        : "order",
      status: status,
    };
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
    <div className="min-h-screen relative ">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-100/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-primary-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-primary-100/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            {/* Badge */}
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 rounded-2xl text-sm text-white/80 font-semibold mb-6 backdrop-blur-sm shadow-lg hover:shadow-primary-100/20 transition-all duration-300">
              <Package className="w-4 h-4 text-primary-100 mr-2" />
              Track Your Order
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-primary-100 via-white to-primary-200 bg-clip-text text-transparent">
              Lacak Pesanan Anda
            </h1>
            <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
              Masukkan kode invoice untuk melacak status dan detail pesanan Anda
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 mb-6 sm:mb-8 relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>

            <div className="relative">
              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-3">
                    Kode Invoice *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      value={invoiceId}
                      onChange={(e) =>
                        setInvoiceId(e.target.value.toUpperCase())
                      }
                      className="flex-1 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                      placeholder="Contoh: INV-20240912-001"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !invoiceId.trim()}
                      className={`w-full sm:w-auto px-6 sm:px-8 py-4 rounded-xl font-medium transition-all duration-300 text-sm sm:text-base flex items-center justify-center gap-2 ${
                        loading || !invoiceId.trim()
                          ? "bg-white/10 cursor-not-allowed text-white/50"
                          : "bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 text-white hover:from-primary-100/30 hover:to-primary-200/30 backdrop-blur-sm"
                      }`}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/50 border-t-white"></div>
                          <span className="hidden sm:inline">Mencari...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            Lacak Pesanan
                          </span>
                          <span className="sm:hidden">Lacak</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-primary-100/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-primary-100/20">
                  <h3 className="font-medium text-primary-100 mb-3 text-sm sm:text-base flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Tips Pencarian:
                  </h3>
                  <ul className="text-xs sm:text-sm text-white/70 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-200 mt-0.5">•</span>
                      Kode invoice dimulai dengan "INV-" diikuti tanggal dan
                      nomor urut
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-200 mt-0.5">•</span>
                      Periksa email konfirmasi pesanan untuk mendapatkan kode
                      invoice
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-200 mt-0.5">•</span>
                      Pastikan memasukkan kode invoice dengan benar
                      (case-insensitive)
                    </li>
                  </ul>
                </div>
              </form>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-100/50 border-t-primary-100 mx-auto mb-4"></div>
              <p className="text-white/70">Mencari transaksi...</p>
            </div>
          )}

          {/* No Results */}
          {searched && !loading && !transaction && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-8 text-center relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-red-600/30 to-red-500/20 rounded-2xl blur-lg opacity-50"></div>

              <div className="relative">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-red-500/30">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Transaksi Tidak Ditemukan
                </h3>
                <p className="text-white/70 mb-4">
                  Tidak dapat menemukan transaksi dengan kode invoice "
                  {invoiceId}".
                </p>
                <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20 text-left">
                  <h4 className="font-medium text-amber-300 mb-2">
                    Kemungkinan Penyebab:
                  </h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• Kode invoice salah atau tidak lengkap</li>
                    <li>• Transaksi belum dibuat atau masih dalam proses</li>
                    <li>
                      • Kode invoice sudah kadaluarsa (lebih dari 6 bulan)
                    </li>
                    <li>• Terjadi kesalahan penulisan</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          {transaction && (
            <div className="space-y-6">
              {/* Multi-Checkout Indicator */}
              {isMultiCheckout(transaction) && (
                <div className="bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-primary-100" />
                    <div>
                      <h4 className="font-semibold text-white">
                        Multi-Item Checkout
                      </h4>
                      <p className="text-sm text-white/70">
                        Pesanan ini berisi{" "}
                        {getAllTransactions(transaction).length} item
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Transaction Header */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>

                <div className="relative">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
                    <div className="flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-white break-words mb-2">
                        {getCheckoutDisplayName(transaction)}
                      </h2>
                      <p className="text-sm sm:text-base text-white/70">
                        Invoice: {transaction.invoiceId}
                        {transaction.midtransOrderId && (
                          <> • Order ID: {transaction.midtransOrderId}</>
                        )}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="mb-3">
                        {getStatusBadge(transaction.orderStatus)}
                      </div>
                      <div className="text-right">
                        <div className="text-xl sm:text-2xl font-bold text-primary-100">
                          Rp{" "}
                          {(
                            calculateGrandTotal(transaction) +
                            (transaction.paymentFee || 0)
                          ).toLocaleString("id-ID")}
                        </div>
                        <div className="text-sm text-white/60">
                          Total Pembayaran
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-4 mt-6">
                    <h3 className="font-semibold text-white text-lg flex items-center gap-2">
                      <Package className="w-5 h-5 text-primary-100" />
                      Detail Items
                    </h3>

                    {getAllTransactions(transaction).map((item, index) => (
                      <div
                        key={item._id}
                        className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-3">
                              {item.serviceImage && (
                                <img
                                  src={item.serviceImage}
                                  alt={item.serviceName}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-white mb-1">
                                  {item.serviceName}
                                </h4>
                                <p className="text-sm text-white/60 capitalize">
                                  {item.serviceType}
                                  {item.serviceCategory &&
                                    ` • ${item.serviceCategory}`}
                                </p>
                                <p className="text-sm text-white/70 mt-1">
                                  Akun:{" "}
                                  <span className="font-medium">
                                    {item.robloxUsername}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="text-left sm:text-right flex-shrink-0">
                            <div className="text-sm text-white/60 mb-1">
                              {item.quantity}x @ Rp{" "}
                              {item.unitPrice.toLocaleString("id-ID")}
                            </div>
                            <div className="font-semibold text-white text-lg">
                              Rp{" "}
                              {(
                                item.finalAmount || item.totalAmount
                              ).toLocaleString("id-ID")}
                            </div>
                            {/* Item Status */}
                            <div className="mt-2">
                              {getStatusBadge(item.orderStatus)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Summary */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="font-semibold text-white text-base mb-4">
                      Ringkasan Pembayaran
                    </h3>
                    <div className="space-y-3">
                      {/* Subtotal */}
                      <div className="flex justify-between text-white/70">
                        <span>
                          Subtotal ({getTotalItemsCount(transaction)} items):
                        </span>
                        <span className="font-medium text-white">
                          Rp{" "}
                          {calculateOriginalTotal(transaction).toLocaleString(
                            "id-ID"
                          )}
                        </span>
                      </div>

                      {/* Discount - Show if there's any discount */}
                      {calculateTotalDiscount(transaction) > 0 && (
                        <div className="flex justify-between text-green-400">
                          <span>
                            Diskon
                            {(() => {
                              const firstItem =
                                getAllTransactions(transaction)[0];
                              return firstItem &&
                                firstItem.discountPercentage &&
                                firstItem.discountPercentage > 0
                                ? ` (${firstItem.discountPercentage}%)`
                                : "";
                            })()}
                            :
                          </span>
                          <span className="font-medium">
                            -Rp{" "}
                            {calculateTotalDiscount(transaction).toLocaleString(
                              "id-ID"
                            )}
                          </span>
                        </div>
                      )}

                      {/* Subtotal after discount */}
                      {calculateTotalDiscount(transaction) > 0 && (
                        <div className="flex justify-between text-white/70 text-sm">
                          <span>Subtotal setelah diskon:</span>
                          <span className="font-medium text-white">
                            Rp{" "}
                            {(
                              calculateOriginalTotal(transaction) -
                              calculateTotalDiscount(transaction)
                            ).toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}

                      {/* Payment Method Name */}
                      {transaction.paymentMethodName && (
                        <div className="flex justify-between text-white/70 text-sm">
                          <span>Metode Pembayaran:</span>
                          <span className="font-medium text-white">
                            {transaction.paymentMethodName}
                          </span>
                        </div>
                      )}

                      {/* Payment Fee */}
                      {transaction.paymentFee && transaction.paymentFee > 0 && (
                        <div className="flex justify-between text-white/70 text-sm">
                          <span>Biaya Admin:</span>
                          <span className="font-medium text-white">
                            Rp {transaction.paymentFee.toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}

                      {/* Total Payment - Bold and highlighted */}
                      <div className="flex justify-between text-white font-bold text-lg pt-3 border-t border-white/20">
                        <span>Total Pembayaran:</span>
                        <span className="text-primary-100">
                          Rp{" "}
                          {(
                            calculateGrandTotal(transaction) +
                            (transaction.paymentFee || 0)
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Informasi Pesanan - Only show for single checkout */}
                    {!isMultiCheckout(transaction) && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                        <h3 className="font-medium text-white mb-4 text-base sm:text-lg flex items-center gap-2">
                          <Package className="w-5 h-5 text-primary-100" />
                          Informasi Pesanan
                        </h3>
                        <div className="space-y-3 text-sm sm:text-base">
                          <div className="flex justify-between items-start">
                            <span className="text-white/60 flex-shrink-0 mr-2">
                              Tanggal Pesanan:
                            </span>
                            <span className="font-medium text-white text-right">
                              {formatDate(transaction.createdAt)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Quantity:</span>
                            <span className="font-medium text-white">
                              {transaction.quantity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Harga Satuan:</span>
                            <span className="font-medium text-white">
                              Rp {transaction.unitPrice.toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Subtotal:</span>
                            <span className="font-medium text-white">
                              Rp{" "}
                              {transaction.totalAmount.toLocaleString("id-ID")}
                            </span>
                          </div>
                          {/* Show discount if available */}
                          {(transaction.discountPercentage || 0) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-white/60">
                                Diskon ({transaction.discountPercentage}%):
                              </span>
                              <span className="font-medium text-green-400">
                                -Rp{" "}
                                {(
                                  transaction.discountAmount || 0
                                ).toLocaleString("id-ID")}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between border-t border-white/20 pt-3">
                            <span className="text-white font-semibold">
                              Total Bayar:
                            </span>
                            <span className="font-bold text-primary-100">
                              Rp{" "}
                              {(
                                transaction.finalAmount ||
                                transaction.totalAmount
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Akun Roblox:</span>
                            <span className="font-medium text-white break-all">
                              {transaction.robloxUsername}
                            </span>
                          </div>

                          {/* Gamepass Information */}
                          {transaction.gamepass && (
                            <>
                              <div className="border-t border-white/20 pt-3">
                                <h4 className="text-white font-medium mb-2 text-sm">
                                  Detail Gamepass:
                                </h4>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/60">
                                  Gamepass ID:
                                </span>
                                <span className="font-medium text-white">
                                  {transaction.gamepass.id}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/60">
                                  Nama Gamepass:
                                </span>
                                <span className="font-medium text-white break-words">
                                  {transaction.gamepass.name}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/60">
                                  Product ID:
                                </span>
                                <span className="font-medium text-white">
                                  {transaction.gamepass.productId}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-white/60">
                                  Seller ID:
                                </span>
                                <span className="font-medium text-white">
                                  {transaction.gamepass.sellerId}
                                </span>
                              </div>
                            </>
                          )}

                          {/* Service Category Information */}
                          {transaction.serviceCategory && (
                            <div className="flex justify-between">
                              <span className="text-white/60">
                                Kategori Layanan:
                              </span>
                              <span className="font-medium text-white capitalize">
                                {transaction.serviceCategory.replace("_", " ")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div
                      className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 ${
                        isMultiCheckout(transaction) ? "lg:col-span-2" : ""
                      }`}
                    >
                      <h3 className="font-medium text-white mb-4 text-base sm:text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary-100" />
                        Informasi Pembeli
                      </h3>
                      <div className="space-y-3 text-sm sm:text-base">
                        <div className="flex justify-between">
                          <span className="text-white/60">Status:</span>
                          <span className="font-medium text-white">
                            {transaction.customerInfo?.userId ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                                👤 User Terdaftar
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-white/10 text-white/80 border border-white/20">
                                👥 Guest Checkout
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Nama:</span>
                          <span className="font-medium text-white break-words">
                            {transaction.customerInfo?.name || "Tidak tersedia"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Email:</span>
                          <span className="font-medium text-white break-all">
                            {transaction.customerInfo?.email ||
                              "Tidak tersedia"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Telepon:</span>
                          <span className="font-medium text-white break-all">
                            {transaction.customerInfo?.phone ||
                              "Tidak tersedia"}
                          </span>
                        </div>

                        {/* Admin Notes if available */}
                        {transaction.adminNotes &&
                          transaction.adminNotes.trim() !== "" && (
                            <>
                              <div className="border-t border-white/20 pt-3">
                                <h4 className="text-white font-medium mb-2 text-sm">
                                  Catatan Admin:
                                </h4>
                              </div>
                              <div className="bg-amber-500/10 backdrop-blur-sm rounded-lg p-3 border border-amber-500/20">
                                <p className="text-white/80 text-sm">
                                  {transaction.adminNotes}
                                </p>
                              </div>
                            </>
                          )}

                        {/* Completion date if completed */}
                        {transaction.completedAt && (
                          <div className="flex justify-between">
                            <span className="text-white/60">Selesai Pada:</span>
                            <span className="font-medium text-white">
                              {formatDate(transaction.completedAt)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Status Timeline */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>

                <div className="relative">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-100" />
                    Riwayat Status Pesanan
                  </h3>

                  <div className="space-y-4 sm:space-y-6">
                    {transaction.statusHistory &&
                    transaction.statusHistory.length > 0 ? (
                      transaction.statusHistory.map(
                        (status: any, index: number) => {
                          const parsed = parseStatus(status.status);
                          const isPaymentStatus = parsed.type === "payment";
                          const isOrderStatus = parsed.type === "order";

                          return (
                            <div
                              key={index}
                              className="flex items-start space-x-4 sm:space-x-6"
                            >
                              <div className="flex-shrink-0 mt-1">
                                <div
                                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-sm border ${
                                    isPaymentStatus
                                      ? "bg-blue-500/20 border-blue-400/30"
                                      : isOrderStatus
                                      ? "bg-green-500/20 border-green-400/30"
                                      : "bg-primary-100/20 border-primary-100/30"
                                  }`}
                                >
                                  {isPaymentStatus ? (
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                                  ) : isOrderStatus ? (
                                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                                  ) : (
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-primary-100 rounded-full"></div>
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      {getStatusBadge(status.status)}
                                      {isPaymentStatus && (
                                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30">
                                          Pembayaran
                                        </span>
                                      )}
                                      {isOrderStatus && (
                                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
                                          Pesanan
                                        </span>
                                      )}
                                    </div>
                                    {status.notes && (
                                      <p className="text-sm sm:text-base text-white/70 break-words mb-2">
                                        {status.notes}
                                      </p>
                                    )}
                                    {status.updatedBy &&
                                      status.updatedBy !== "system" && (
                                        <p className="text-xs text-white/50 mt-1">
                                          Diperbarui oleh: {status.updatedBy}
                                        </p>
                                      )}
                                  </div>
                                  <div className="text-sm text-white/60 flex-shrink-0">
                                    {formatDate(status.timestamp)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className="text-center py-8 sm:py-12">
                        <Clock className="w-12 h-12 text-white/40 mx-auto mb-4" />
                        <p className="text-base text-white/60">
                          Belum ada riwayat status
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Payment Summary */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>

                <div className="relative">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary-100" />
                    Informasi Pembayaran
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="text-white/60 text-sm mb-1">
                        Status Pembayaran
                      </div>
                      <div className="font-medium text-white">
                        {getStatusBadge(transaction.paymentStatus)}
                      </div>
                    </div>

                    {transaction.paidAt && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="text-white/60 text-sm mb-1">
                          Dibayar Pada
                        </div>
                        <div className="font-medium text-white">
                          {formatDate(transaction.paidAt)}
                        </div>
                      </div>
                    )}

                    {transaction.midtransOrderId && (
                      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="text-white/60 text-sm mb-1">
                          Order ID Midtrans
                        </div>
                        <div className="font-medium text-white text-xs break-all">
                          {transaction.midtransOrderId}
                        </div>
                      </div>
                    )}

                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <div className="text-white/60 text-sm mb-1">
                        Expires At
                      </div>
                      <div className="font-medium text-white">
                        {transaction.expiresAt
                          ? formatDate(transaction.expiresAt)
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-6 border-t border-white/10">
                    <p className="text-sm text-white/60 mb-2">
                      Total Pembayaran:
                    </p>
                    {/* Show discount info if available */}
                    {(transaction.discountPercentage || 0) > 0 && (
                      <div className="text-sm text-white/50 mb-2">
                        <span className="line-through">
                          Rp{" "}
                          {calculateOriginalTotal(transaction).toLocaleString(
                            "id-ID"
                          )}
                        </span>
                        <span className="ml-2 text-green-400 font-medium">
                          -{transaction.discountPercentage}%
                        </span>
                      </div>
                    )}
                    <p className="text-2xl sm:text-3xl font-bold text-primary-100">
                      Rp{" "}
                      {(
                        calculateOriginalTotal(transaction) -
                        calculateTotalDiscount(transaction)
                      ).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>{" "}
              {/* Actions */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>

                <div className="relative">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <TruckIcon className="w-5 h-5 text-primary-100" />
                    Tindakan
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(transaction.paymentStatus === "pending" ||
                      transaction.orderStatus === "waiting_payment") &&
                      transaction.snapToken && (
                        <a
                          href={
                            transaction.redirectUrl ||
                            `/transaction/pending?order_id=${transaction.midtransOrderId}`
                          }
                          className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-500/40 text-yellow-300 rounded-xl hover:from-yellow-500/30 hover:to-amber-600/30 backdrop-blur-sm transition-all duration-300 font-medium text-sm sm:text-base"
                        >
                          💳 Lanjutkan Pembayaran
                        </a>
                      )}

                    <button
                      onClick={() => window.print()}
                      className="flex items-center justify-center px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl hover:bg-white/15 transition-all duration-300 font-medium text-sm sm:text-base"
                    >
                      🖨️ Cetak Detail
                    </button>

                    <a
                      href="https://wa.me/6281234567890"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/40 text-green-300 rounded-xl hover:from-green-500/30 hover:to-green-600/30 backdrop-blur-sm transition-all duration-300 font-medium text-sm sm:text-base"
                    >
                      💬 Hubungi CS
                    </a>

                    <button
                      onClick={() => {
                        setTransaction(null);
                        setSearched(false);
                        setInvoiceId("");
                      }}
                      className="flex items-center justify-center px-6 py-4 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 text-white rounded-xl hover:from-primary-100/30 hover:to-primary-200/30 backdrop-blur-sm transition-all duration-300 font-medium text-sm sm:text-base"
                    >
                      🔍 Lacak Pesanan Lain
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          {!transaction && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>

              <div className="relative">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-primary-100" />
                  Butuh Bantuan?
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-white mb-4 text-base flex items-center gap-2">
                      <Search className="w-4 h-4 text-primary-100" />
                      Cara Mendapatkan Kode Invoice:
                    </h4>
                    <ul className="text-sm text-white/70 space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-200 mt-0.5">•</span>
                        Cek email konfirmasi setelah pemesanan
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-200 mt-0.5">•</span>
                        Lihat di halaman riwayat transaksi (jika sudah login)
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-200 mt-0.5">•</span>
                        Screenshot bukti pembayaran biasanya mencantumkan
                        invoice
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-white mb-4 text-base flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-100" />
                      Masih Tidak Menemukan?
                    </h4>
                    <div className="space-y-3">
                      <a
                        href="https://wa.me/6281234567890"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center px-4 py-3 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/40 text-green-300 rounded-xl hover:from-green-500/30 hover:to-green-600/30 backdrop-blur-sm transition-all duration-300 text-sm font-medium"
                      >
                        💬 Hubungi Customer Service
                      </a>
                      <a
                        href="mailto:support@rbxstore.com"
                        className="block w-full text-center px-4 py-3 bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/40 text-blue-300 rounded-xl hover:from-blue-500/30 hover:to-blue-600/30 backdrop-blur-sm transition-all duration-300 text-sm font-medium"
                      >
                        📧 Kirim Email
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
