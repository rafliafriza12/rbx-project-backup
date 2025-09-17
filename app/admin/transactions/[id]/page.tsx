"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface Transaction {
  _id: string;
  invoiceId: string;
  serviceType: string;
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
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

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
      pending: "bg-yellow-900/20 text-yellow-300 border border-yellow-500/30",
      settlement: "bg-blue-900/20 text-blue-300 border border-blue-500/30",
      // settlement: "bg-green-900/20 text-green-300 border border-green-500/30",
      failed: "bg-red-900/20 text-red-300 border border-red-500/30",
      expired: "bg-gray-700/30 text-gray-300 border border-gray-500/30",
      cancel: "bg-gray-700/30 text-gray-300 border border-gray-500/30",
      deny: "bg-red-900/20 text-red-300 border border-red-500/30",
      refund: "bg-orange-900/20 text-orange-300 border border-orange-500/30",
    };

    const orderStyles: { [key: string]: string } = {
      waiting_payment:
        "bg-yellow-900/20 text-yellow-300 border border-yellow-500/30",
      pending: "bg-yellow-900/20 text-yellow-300 border border-yellow-500/30",
      processing: "bg-blue-900/20 text-blue-300 border border-blue-500/30",
      completed: "bg-green-900/20 text-green-300 border border-green-500/30",
      cancelled: "bg-gray-700/30 text-gray-300 border border-gray-500/30",
      failed: "bg-red-900/20 text-red-300 border border-red-500/30",
    };

    const styles = type === "payment" ? paymentStyles : orderStyles;

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${
          styles[status.toLowerCase()] || styles.pending
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-gray-300">Loading transaction...</span>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12 bg-gray-900 min-h-screen">
        <h2 className="text-2xl font-bold text-white">Transaction Not Found</h2>
        <p className="text-gray-300 mt-2">
          The transaction you're looking for doesn't exist.
        </p>
        <button
          onClick={() => router.push("/admin/transactions")}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Transactions
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-gray-900 min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction Detail</h1>
          <p className="text-gray-300">Invoice: {transaction.invoiceId}</p>
        </div>
        <button
          onClick={() => router.push("/admin/transactions")}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 border border-gray-600"
        >
          ← Back to List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            Basic Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Invoice ID:</span>
              <span className="font-mono font-medium text-gray-200">
                {transaction.invoiceId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Service Type:</span>
              <span className="capitalize font-medium text-gray-200">
                {transaction.serviceType}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Service Name:</span>
              <span className="font-medium text-gray-200">
                {transaction.serviceName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Quantity:</span>
              <span className="font-medium text-gray-200">
                {transaction.quantity}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Unit Price:</span>
              <span className="font-medium text-gray-200">
                {formatCurrency(transaction.unitPrice)}
              </span>
            </div>

            {/* Price breakdown with discount */}
            {transaction.discountPercentage &&
            transaction.discountPercentage > 0 ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-200">
                    {formatCurrency(transaction.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Discount ({transaction.discountPercentage}%):
                  </span>
                  <span className="font-medium text-green-400">
                    -{formatCurrency(transaction.discountAmount || 0)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-600 pt-3">
                  <span className="font-semibold text-gray-200">
                    Final Amount:
                  </span>
                  <span className="font-bold text-lg text-white">
                    {formatCurrency(
                      transaction.finalAmount || transaction.totalAmount
                    )}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between border-t border-gray-600 pt-3">
                <span className="font-semibold text-gray-200">
                  Total Amount:
                </span>
                <span className="font-bold text-lg text-white">
                  {formatCurrency(transaction.totalAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Status Information */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            Status Information
          </h2>
          <div className="space-y-4">
            <div>
              <span className="text-gray-400 block mb-2">Payment Status:</span>
              {getStatusBadge(transaction.paymentStatus, "payment")}
            </div>
            <div>
              <span className="text-gray-400 block mb-2">Order Status:</span>
              {getStatusBadge(transaction.orderStatus, "order")}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="font-medium text-gray-200">
                {formatDate(transaction.createdAt)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Updated:</span>
              <span className="font-medium text-gray-200">
                {formatDate(transaction.updatedAt)}
              </span>
            </div>
            {transaction.expiresAt && (
              <div className="flex justify-between">
                <span className="text-gray-400">Expires At:</span>
                <span className="font-medium text-gray-200">
                  {formatDate(transaction.expiresAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Roblox Account Information */}
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">
            Roblox Account
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Username:</span>
              <span className="font-medium font-mono text-gray-200">
                {transaction.robloxUsername}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Password:</span>
              {transaction.robloxPassword ? (
                <span className="font-mono bg-gray-700 px-2 py-1 rounded text-gray-200 border border-gray-600">
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
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">
              Customer Information
            </h2>
            <div className="space-y-3">
              {transaction.customerInfo.name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Name:</span>
                  <span className="font-medium text-gray-200">
                    {transaction.customerInfo.name}
                  </span>
                </div>
              )}
              {transaction.customerInfo.email && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="font-medium text-gray-200">
                    {transaction.customerInfo.email}
                  </span>
                </div>
              )}
              {transaction.customerInfo.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className="font-medium text-gray-200">
                    {transaction.customerInfo.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Joki Details */}
        {transaction.jokiDetails && transaction.serviceType === "joki" && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-2 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">
              Joki Service Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400 block mb-1">Game Type:</span>
                <span className="font-medium text-gray-200">
                  {transaction.jokiDetails.gameType}
                </span>
              </div>
              {/* <div>
                <span className="text-gray-400 block mb-1">Target Level:</span>
                <span className="font-medium text-gray-200">
                  {transaction.jokiDetails.targetLevel}
                </span>
              </div> */}
              {transaction.jokiDetails.estimatedTime && (
                <div>
                  <span className="text-gray-400 block mb-1">
                    Estimated Time:
                  </span>
                  <span className="font-medium text-gray-200">
                    {transaction.jokiDetails.estimatedTime}
                  </span>
                </div>
              )}
            </div>
            {transaction.jokiDetails.description && (
              <div className="mt-4">
                <span className="text-gray-400 block mb-2">Description:</span>
                <p className="bg-gray-700 p-3 rounded text-gray-200 border border-gray-600">
                  {transaction.jokiDetails.description}
                </p>
              </div>
            )}
            {transaction.jokiDetails.notes && (
              <div className="mt-4">
                <span className="text-gray-400 block mb-2">Kode keamanan:</span>
                <p className="bg-gray-700 p-3 rounded text-gray-200 border border-gray-600">
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
            <div className="bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-2 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">
                Robux Instant Service Details
              </h2>
              <div className="mt-4">
                <span className="text-gray-400 block mb-2">Kode Keamanan:</span>
                <p className="bg-gray-700 p-3 rounded text-gray-200 border border-gray-600">
                  {transaction.robuxInstantDetails.notes}
                </p>
              </div>
            </div>
          )}

        {/* Payment Information */}
        {transaction.midtransOrderId && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-2 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">
              Payment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-400 block mb-1">
                  Midtrans Order ID:
                </span>
                <span className="font-mono font-medium text-gray-200">
                  {transaction.midtransOrderId}
                </span>
              </div>
              {transaction.snapToken && (
                <div>
                  <span className="text-gray-400 block mb-1">Snap Token:</span>
                  <span className="font-mono text-sm text-gray-200">
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
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {transaction.redirectUrl}
                </a>
              </div>
            )}
          </div>
        )}

        {/* Admin Notes */}
        {transaction.adminNotes && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-2 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">
              Admin Notes
            </h2>
            <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded">
              <p className="text-yellow-200">{transaction.adminNotes}</p>
            </div>
          </div>
        )}

        {/* Status History */}
        {transaction.statusHistory && transaction.statusHistory.length > 0 && (
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-2 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">
              Status History
            </h2>
            <div className="space-y-4">
              {transaction.statusHistory.map((history, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-400 pl-4 pb-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-200">
                      {(history.statusType || "Status").toUpperCase()} Status
                      Changed
                    </h3>
                    <span className="text-sm text-gray-400">
                      {formatDate(history.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    From{" "}
                    <span className="font-medium text-gray-200">
                      {history.oldStatus || "Unknown"}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium text-gray-200">
                      {history.newStatus || "Unknown"}
                    </span>
                  </p>
                  {history.notes && (
                    <p className="text-sm text-gray-400 mt-1">
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
