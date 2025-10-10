"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
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
  serviceType: string;
  serviceId: string;
  serviceCategory?: string;
  serviceName: string;
  serviceImage?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  // Discount fields
  discountPercentage?: number;
  discountAmount?: number;
  finalAmount?: number;
  robloxUsername: string;
  robloxPassword?: string;
  paymentStatus: string;
  orderStatus: string;
  adminNotes?: string;
  customerNotes?: string;
  // Payment method fields
  paymentMethodId?: string;
  paymentMethodName?: string;
  customerInfo?: {
    userId?: string;
    name: string;
    email: string;
    phone?: string;
  };
  jokiDetails?: {
    description: string;
    gameType: string;
    targetLevel: string;
    estimatedTime?: string;
    notes?: string;
  };
  robuxInstantDetails?: {
    notes?: string;
  };
  gamepass?: {
    id: number;
    name: string;
    price: number;
    productId: number;
    sellerId: number;
  };
  statusHistory?: Array<{
    statusType: string;
    oldStatus: string;
    newStatus: string;
    timestamp: string;
    notes?: string;
    updatedBy?: string;
  }>;
  midtransOrderId?: string;
  snapToken?: string;
  redirectUrl?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  // Multi-checkout fields
  relatedTransactions?: Transaction[];
  isMultiCheckout?: boolean;
  masterOrderId?: string;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPurchase, setProcessingPurchase] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchTransaction(params.id as string);
    }
  }, [params.id]);

  const fetchTransaction = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/${id}`);
      const data = await response.json();

      if (response.ok) {
        setTransaction(data.data);
      } else {
        toast.error(data.error || "Failed to fetch transaction");
        router.push("/admin/transactions");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch transaction");
      router.push("/admin/transactions");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string, type: "payment" | "order") => {
    const paymentStyles: { [key: string]: string } = {
      pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50",
      settlement: "bg-green-500/20 text-green-300 border border-green-500/50",
      failed: "bg-red-500/20 text-red-300 border border-red-500/50",
      expired: "bg-gray-500/20 text-gray-300 border border-gray-500/50",
      cancel: "bg-gray-500/20 text-gray-300 border border-gray-500/50",
      deny: "bg-red-500/20 text-red-300 border border-red-500/50",
      refund: "bg-orange-500/20 text-orange-300 border border-orange-500/50",
    };

    const orderStyles: { [key: string]: string } = {
      waiting_payment:
        "bg-orange-500/20 text-orange-300 border border-orange-500/50",
      pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50",
      processing: "bg-blue-500/20 text-blue-300 border border-blue-500/50",
      completed: "bg-green-500/20 text-green-300 border border-green-500/50",
      cancelled: "bg-red-500/20 text-red-300 border border-red-500/50",
      failed: "bg-red-500/20 text-red-300 border border-red-500/50",
    };

    const styles = type === "payment" ? paymentStyles : orderStyles;

    return (
      <span
        className={`px-3 py-1 rounded-lg text-sm font-semibold ${
          styles[status.toLowerCase()] || styles.pending
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const handleManualGamepassPurchase = async () => {
    if (!transaction?.gamepass) {
      toast.error("Gamepass data not found");
      return;
    }

    setProcessingPurchase(true);
    try {
      const response = await fetch(
        `/api/transactions/${transaction._id}/manual-gamepass-purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Gamepass purchase completed successfully!");
        // Refresh transaction data
        fetchTransaction(transaction._id);
      } else {
        toast.error(data.error || "Failed to process gamepass purchase");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to process gamepass purchase");
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Check if this is robux_5_hari with non-ObjectId serviceId
  const isRobux5Hari =
    transaction?.serviceType === "robux" &&
    transaction?.serviceCategory === "robux_5_hari" &&
    transaction?.serviceId &&
    !transaction.serviceId.match(/^[0-9a-fA-F]{24}$/);

  // Check if manual purchase button should be shown
  const showManualPurchaseButton =
    isRobux5Hari &&
    transaction?.paymentStatus === "settlement" &&
    transaction?.orderStatus === "failed" &&
    transaction?.gamepass;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
        <span className="ml-3 text-[#f1f5f9]">Loading transaction...</span>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12 bg-[#0f172a] min-h-screen">
        <h2 className="text-2xl font-bold text-[#f1f5f9]">
          Transaction Not Found
        </h2>
        <p className="text-[#94a3b8] mt-2">
          The transaction you're looking for doesn't exist.
        </p>
        <button
          onClick={() => router.push("/admin/transactions")}
          className="mt-4 bg-[#3b82f6] text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-[#2563eb] transition-colors"
        >
          Back to Transactions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-h-screen">
      {/* Multi-Checkout Warning Banner */}
      {isMultiCheckout(transaction as any) && (
        <div className="bg-amber-500/20 border-2 border-amber-500/60 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg
                className="w-6 h-6 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-300 mb-1">
                🛒 Multi-Item Checkout Transaction
              </h3>
              <p className="text-amber-200/90 text-sm mb-2">
                This transaction is part of a multi-item checkout with{" "}
                <strong>
                  {getTotalItemsCount(transaction as any)} total items
                </strong>
                . When updating status, all related items will be updated
                together.
              </p>
              <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 rounded px-3 py-1.5 w-fit">
                <span className="font-mono">
                  Payment ID: {transaction.midtransOrderId}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">
            Transaction Detail
          </h1>
          <p className="text-[#94a3b8]">Invoice: {transaction.invoiceId}</p>
          {isMultiCheckout(transaction as any) && (
            <p className="text-amber-400 text-sm mt-1">
              📦 Part of multi-checkout (
              {getAllTransactions(transaction as any).length} items)
            </p>
          )}
        </div>
        <button
          onClick={() => router.push("/admin/transactions")}
          className="bg-[#475569] text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-[#64748b] border border-[#334155] transition-colors"
        >
          ← Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 border border-[#334155]">
          <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
            Basic Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Invoice ID:</span>
              <span className="font-mono font-medium text-[#f1f5f9]">
                {transaction.invoiceId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Service Type:</span>
              <span className="capitalize font-medium text-[#f1f5f9]">
                {transaction.serviceType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Service Name:</span>
              <span className="font-medium text-[#f1f5f9]">
                {transaction.serviceName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Quantity:</span>
              <span className="font-medium text-[#f1f5f9]">
                {transaction.quantity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Unit Price:</span>
              <span className="font-medium text-[#f1f5f9]">
                {formatCurrency(transaction.unitPrice)}
              </span>
            </div>

            {/* Price breakdown with discount */}
            {transaction.discountPercentage &&
            transaction.discountPercentage > 0 ? (
              <>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Subtotal:</span>
                  <span className="font-medium text-[#f1f5f9]">
                    {formatCurrency(transaction.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">
                    Discount ({transaction.discountPercentage}%):
                  </span>
                  <span className="font-medium text-green-400">
                    -{formatCurrency(transaction.discountAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#334155] pt-3">
                  <span className="font-semibold text-[#f1f5f9]">
                    Final Amount:
                  </span>
                  <span className="font-bold text-lg text-[#f1f5f9]">
                    {formatCurrency(
                      transaction.finalAmount || transaction.totalAmount
                    )}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between border-t border-[#334155] pt-3">
                <span className="font-semibold text-[#f1f5f9]">
                  Total Amount:
                </span>
                <span className="font-bold text-lg text-[#f1f5f9]">
                  {formatCurrency(transaction.totalAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Gamepass Information - Only for robux_5_hari with custom serviceId */}
        {isRobux5Hari && transaction.gamepass && (
          <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 border border-[#334155]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#f1f5f9]">
                Gamepass Information
              </h2>
              {showManualPurchaseButton && (
                <button
                  onClick={handleManualGamepassPurchase}
                  disabled={processingPurchase}
                  className="bg-[#3b82f6] hover:bg-[#2563eb] disabled:bg-[#3b82f6]/50 disabled:cursor-not-allowed text-[#f1f5f9] px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                >
                  {processingPurchase ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Retry Purchase</span>
                  )}
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Gamepass Name:</span>
                <span className="font-medium text-[#f1f5f9]">
                  {transaction.gamepass.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Gamepass ID:</span>
                <span className="font-medium text-[#f1f5f9]">
                  {transaction.gamepass.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Product ID:</span>
                <span className="font-medium text-[#f1f5f9]">
                  {transaction.gamepass.productId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Seller ID:</span>
                <span className="font-medium text-[#f1f5f9]">
                  {transaction.gamepass.sellerId}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#334155] pt-3">
                <span className="font-semibold text-[#f1f5f9]">
                  Gamepass Price:
                </span>
                <span className="font-bold text-lg text-blue-400">
                  {transaction.gamepass.price} Robux
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Information */}
        <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 border border-[#334155]">
          <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
            Status Information
          </h2>
          <div className="space-y-4">
            <div>
              <span className="text-[#94a3b8] block mb-2">Payment Status:</span>
              {getStatusBadge(transaction.paymentStatus, "payment")}
            </div>
            <div>
              <span className="text-[#94a3b8] block mb-2">Order Status:</span>
              {getStatusBadge(transaction.orderStatus, "order")}
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Created:</span>
              <span className="font-medium text-[#f1f5f9]">
                {formatDate(transaction.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Last Updated:</span>
              <span className="font-medium text-[#f1f5f9]">
                {formatDate(transaction.updatedAt)}
              </span>
            </div>
            {transaction.expiresAt && (
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Expires At:</span>
                <span className="font-medium text-[#f1f5f9]">
                  {formatDate(transaction.expiresAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Related Transactions - Multi-Checkout Items */}
        {isMultiCheckout(transaction as any) &&
          transaction.relatedTransactions &&
          transaction.relatedTransactions.length > 0 && (
            <div className="lg:col-span-2 bg-[#1e293b] rounded-lg shadow-lg p-6 border border-[#334155]">
              <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Related Items in This Checkout (
                {transaction.relatedTransactions.length + 1} items)
              </h2>

              <div className="space-y-3">
                {/* Current Transaction */}
                <div className="bg-blue-500/10 border-2 border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                          CURRENT
                        </span>
                        <h3 className="font-semibold text-[#f1f5f9]">
                          {transaction.serviceName}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-[#94a3b8]">Type:</span>
                          <span className="ml-2 text-[#f1f5f9] capitalize">
                            {transaction.serviceType}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8]">Username:</span>
                          <span className="ml-2 text-[#f1f5f9] font-mono">
                            {transaction.robloxUsername}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8]">Quantity:</span>
                          <span className="ml-2 text-[#f1f5f9]">
                            {transaction.quantity}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8]">Amount:</span>
                          <span className="ml-2 text-[#f1f5f9] font-semibold">
                            {formatCurrency(transaction.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#94a3b8] mb-1">Status</div>
                      {getStatusBadge(transaction.paymentStatus, "payment")}
                    </div>
                  </div>
                </div>

                {/* Related Transactions */}
                {transaction.relatedTransactions.map((item, index) => (
                  <div
                    key={item._id}
                    className="bg-[#0f172a] border border-[#334155] rounded-lg p-4 hover:border-blue-500/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-[#475569] text-[#f1f5f9] px-2 py-0.5 rounded text-xs font-semibold">
                            ITEM {index + 2}
                          </span>
                          <h3 className="font-semibold text-[#f1f5f9]">
                            {item.serviceName}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-[#94a3b8]">Type:</span>
                            <span className="ml-2 text-[#f1f5f9] capitalize">
                              {item.serviceType}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#94a3b8]">Username:</span>
                            <span className="ml-2 text-[#f1f5f9] font-mono">
                              {item.robloxUsername}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#94a3b8]">Quantity:</span>
                            <span className="ml-2 text-[#f1f5f9]">
                              {item.quantity}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#94a3b8]">Amount:</span>
                            <span className="ml-2 text-[#f1f5f9] font-semibold">
                              {formatCurrency(item.totalAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#94a3b8] mb-1">
                          Status
                        </div>
                        {getStatusBadge(item.paymentStatus, "payment")}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Grand Total */}
                <div className="bg-green-500/10 border-2 border-green-500/50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-[#f1f5f9] mb-1">
                        Grand Total
                      </h3>
                      <p className="text-sm text-[#94a3b8]">
                        Total for all{" "}
                        {transaction.relatedTransactions.length + 1} items
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(
                          calculateGrandTotal(transaction as any)
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Roblox Account Information */}
        <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 border border-[#334155]">
          <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
            Roblox Account
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Username:</span>
              <span className="font-medium font-mono text-[#f1f5f9]">
                {transaction.robloxUsername}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Password:</span>
              {transaction.robloxPassword ? (
                <span className="font-mono bg-gray-700 px-2 py-1 rounded text-[#f1f5f9] border border-[#334155]">
                  {transaction.robloxPassword}
                </span>
              ) : (
                <span className="text-gray-500 italic">
                  {transaction.serviceType === "gamepass"
                    ? "Not required"
                    : "Not provided"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {transaction.customerInfo && (
          <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 border border-[#334155]">
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
              Customer Information
            </h2>
            <div className="space-y-3">
              {transaction.customerInfo.name && (
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Name:</span>
                  <span className="font-medium text-[#f1f5f9]">
                    {transaction.customerInfo.name}
                  </span>
                </div>
              )}
              {transaction.customerInfo.email && (
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Email:</span>
                  <span className="font-medium text-[#f1f5f9]">
                    {transaction.customerInfo.email}
                  </span>
                </div>
              )}
              {transaction.customerInfo.phone && (
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Phone:</span>
                  <span className="font-medium text-[#f1f5f9]">
                    {transaction.customerInfo.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Joki Details */}
        {transaction.jokiDetails && transaction.serviceType === "joki" && (
          <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 lg:col-span-2 border border-[#334155]">
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
              Joki Service Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[#94a3b8] block mb-1">Game Type:</span>
                <span className="font-medium text-[#f1f5f9]">
                  {transaction.jokiDetails.gameType}
                </span>
              </div>
              {/* <div>
                <span className="text-[#94a3b8] block mb-1">Target Level:</span>
                <span className="font-medium text-[#f1f5f9]">
                  {transaction.jokiDetails.targetLevel}
                </span>
              </div> */}
              {transaction.jokiDetails.estimatedTime && (
                <div>
                  <span className="text-[#94a3b8] block mb-1">
                    Estimated Time:
                  </span>
                  <span className="font-medium text-[#f1f5f9]">
                    {transaction.jokiDetails.estimatedTime}
                  </span>
                </div>
              )}
            </div>
            {transaction.jokiDetails.description && (
              <div className="mt-4">
                <span className="text-[#94a3b8] block mb-2">Description:</span>
                <p className="bg-gray-700 p-3 rounded text-[#f1f5f9] border border-[#334155]">
                  {transaction.jokiDetails.description}
                </p>
              </div>
            )}
            {transaction.jokiDetails.notes && (
              <div className="mt-4">
                <span className="text-[#94a3b8] block mb-2">
                  Kode keamanan:
                </span>
                <p className="bg-gray-700 p-3 rounded text-[#f1f5f9] border border-[#334155]">
                  {transaction.jokiDetails.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Robux Instant Details */}
        {transaction.robuxInstantDetails &&
          transaction.serviceType === "robux" &&
          transaction.robuxInstantDetails.notes && (
            <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 lg:col-span-2 border border-[#334155]">
              <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
                Robux Instant Service Details
              </h2>
              <div className="mt-4">
                <span className="text-[#94a3b8] block mb-2">
                  Kode Keamanan:
                </span>
                <p className="bg-gray-700 p-3 rounded text-[#f1f5f9] border border-[#334155]">
                  {transaction.robuxInstantDetails.notes}
                </p>
              </div>
            </div>
          )}

        {/* Payment Information */}
        {transaction.midtransOrderId && (
          <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 lg:col-span-2 border border-[#334155]">
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
              Payment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {transaction.paymentMethodName && (
                <div>
                  <span className="text-[#94a3b8] block mb-1">
                    Payment Method:
                  </span>
                  <span className="font-medium text-blue-400">
                    {transaction.paymentMethodName}
                  </span>
                </div>
              )}
              <div>
                <span className="text-[#94a3b8] block mb-1">
                  Midtrans Order ID:
                </span>
                <span className="font-mono font-medium text-[#f1f5f9]">
                  {transaction.midtransOrderId}
                </span>
              </div>
              {transaction.snapToken && (
                <div>
                  <span className="text-[#94a3b8] block mb-1">Snap Token:</span>
                  <span className="font-mono text-sm text-[#f1f5f9]">
                    {transaction.snapToken}
                  </span>
                </div>
              )}
            </div>
            {transaction.redirectUrl && (
              <div className="mt-4">
                <span className="text-gray-600 block mb-2">Payment URL:</span>
                <a
                  href={transaction.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3b82f6] hover:text-blue-800 underline break-all"
                >
                  {transaction.redirectUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Customer Notes */}
        {transaction.customerNotes && (
          <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 lg:col-span-2 border border-[#334155]">
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
              Customer Notes
            </h2>
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
              <p className="text-blue-200">{transaction.customerNotes}</p>
            </div>
          </div>
        )}

        {/* Admin Notes */}
        {transaction.adminNotes && (
          <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 lg:col-span-2 border border-[#334155]">
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
              Admin Notes
            </h2>
            <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded">
              <p className="text-yellow-200">{transaction.adminNotes}</p>
            </div>
          </div>
        )}

        {/* Status History */}
        {transaction.statusHistory && transaction.statusHistory.length > 0 && (
          <div className="bg-[#1e293b] rounded-lg shadow-lg p-6 lg:col-span-2 border border-[#334155]">
            <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">
              Status History
            </h2>
            <div className="space-y-4">
              {transaction.statusHistory.map((history, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-400 pl-4 pb-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-[#f1f5f9]">
                      {(history.statusType || "Status").toUpperCase()} Status
                      Changed
                    </h3>
                    <span className="text-sm text-[#94a3b8]">
                      {formatDate(history.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    From{" "}
                    <span className="font-medium text-[#f1f5f9]">
                      {history.oldStatus || "Unknown"}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-[#f1f5f9]">
                      {history.newStatus || "Unknown"}
                    </span>
                  </p>
                  {history.notes && (
                    <p className="text-sm text-[#94a3b8] mt-1">
                      {history.notes}
                    </p>
                  )}
                  {history.updatedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated by: {history.updatedBy}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
