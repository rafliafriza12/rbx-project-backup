// src/app/admin/transactions/page.tsx
"use client";
import { useState, useEffect } from "react";
import DataTable from "@/components/admin/DataTable";
import { toast } from "react-toastify";
import Link from "next/link";

interface Transaction {
  _id: string;
  invoiceId: string;
  userId?: string;
  serviceType: string;
  serviceCategory?: string; // Tambahkan serviceCategory
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  robloxUsername: string;
  robloxPassword?: string; // Optional password
  paymentStatus: string;
  orderStatus: string;
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    serviceType: "",
    dateFrom: "",
    dateTo: "",
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState("");
  const [newOrderStatus, setNewOrderStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        admin: "true",
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.serviceType && { serviceType: filters.serviceType }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      console.log("Fetching transactions with params:", params.toString());
      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();
      console.log("API Response status:", response.status);
      console.log("API Response data:", data);

      if (response.ok) {
        console.log("Setting transactions count:", data.data?.length || 0);
        setTransactions(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalTransactions(data.pagination?.total || 0);
      } else {
        console.error("API Error:", data);
        setTransactions([]);
        toast.error(data.error || "Failed to fetch transactions");
      }
    } catch (error) {
      console.error("Error:", error);
      setTransactions([]);
      toast.error("Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  };

  const handleUpdateStatus = async (
    transactionId: string,
    newStatus: string,
    statusType: "payment" | "order"
  ) => {
    try {
      setIsUpdating(true);
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statusType,
          newStatus,
          notes: adminNotes || `Status updated by admin to ${newStatus}`,
          updatedBy: "admin",
        }),
      });

      if (response.ok) {
        toast.success(`${statusType} status updated successfully`);
        fetchTransactions();
        setShowStatusModal(false);
        setSelectedTransaction(null);
        setAdminNotes("");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const openStatusModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setNewPaymentStatus(transaction.paymentStatus);
    setNewOrderStatus(transaction.orderStatus);
    setAdminNotes("");
    setShowStatusModal(true);
  };

  const handleModalUpdate = () => {
    if (!selectedTransaction) return;

    // Update payment status if changed
    if (newPaymentStatus !== selectedTransaction.paymentStatus) {
      handleUpdateStatus(selectedTransaction._id, newPaymentStatus, "payment");
    }

    // Update order status if changed
    if (newOrderStatus !== selectedTransaction.orderStatus) {
      handleUpdateStatus(selectedTransaction._id, newOrderStatus, "order");
    }

    // If no status changed, just close modal
    if (
      newPaymentStatus === selectedTransaction.paymentStatus &&
      newOrderStatus === selectedTransaction.orderStatus
    ) {
      setShowStatusModal(false);
      setSelectedTransaction(null);
    }
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this transaction? This action cannot be undone."
      )
    )
      return;

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Transaction deleted successfully");
        fetchTransactions();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete transaction");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleExportData = async () => {
    try {
      const params = new URLSearchParams({
        export: "true",
        admin: "true",
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.serviceType && { serviceType: filters.serviceType }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      });

      const response = await fetch(`/api/transactions?${params}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions-${
          new Date().toISOString().split("T")[0]
        }.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Data exported successfully");
      } else {
        toast.error("Failed to export data");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to export data");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "",
      serviceType: "",
      dateFrom: "",
      dateTo: "",
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string, type: "payment" | "order") => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      settlement: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
      expired: "bg-gray-100 text-gray-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  const columns = [
    {
      key: "invoiceId",
      label: "Invoice",
      render: (value: string) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: "robloxUsername",
      label: "Username",
      render: (value: string) => <span className="font-medium">{value}</span>,
    },
    {
      key: "serviceType",
      label: "Type",
      render: (value: string, row: Transaction) => {
        if (value === "robux" && row.serviceCategory) {
          // Untuk robux, tampilkan kategori
          const categoryDisplay =
            row.serviceCategory === "robux_5_hari"
              ? "Robux 5D"
              : "Robux Instant";
          return (
            <span className="capitalize">
              <span className={` py-1 rounded-full text-xs font-medium `}>
                {categoryDisplay}
              </span>
            </span>
          );
        }
        return <span className="capitalize">{value}</span>;
      },
    },
    {
      key: "serviceName",
      label: "Service",
      render: (value: string) => (
        <span className="text-sm">
          {value.length > 30 ? value.substring(0, 30) + "..." : value}
        </span>
      ),
    },
    {
      key: "totalAmount",
      label: "Amount",
      render: (value: number) => (
        <span className="font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (value: string) => getStatusBadge(value, "payment"),
    },
    {
      key: "orderStatus",
      label: "Order",
      render: (value: string) => getStatusBadge(value, "order"),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (value: string) => (
        <span className="text-sm">{formatDate(value)}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: any, row: Transaction) => (
        <div className="flex space-x-2">
          <Link
            href={`/admin/transactions/${row._id}`}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
          >
            View Detail
          </Link>
          <button
            onClick={() => openStatusModal(row)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Update Status
          </button>
          <button
            onClick={() => handleDeleteTransaction(row._id)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex  justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Transaction Management
          </h1>
          <p className="text-gray-600">
            Total: {totalTransactions} transactions
          </p>
        </div>
        <button
          onClick={handleExportData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Search invoice or username..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 "
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 "
          >
            <option className="text-black" value="">
              All Status
            </option>
            <option className="text-black" value="payment:pending">
              Payment: Pending
            </option>
            <option className="text-black" value="payment:settlement">
              Payment: Settlement
            </option>
            <option className="text-black" value="payment:failed">
              Payment: Failed
            </option>
            <option className="text-black" value="order:pending">
              Order: Pending
            </option>
            <option className="text-black" value="order:processing">
              Order: Processing
            </option>
            <option className="text-black" value="order:completed">
              Order: Completed
            </option>
            <option className="text-black" value="order:cancelled">
              Order: Cancelled
            </option>
          </select>
          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange("serviceType", e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 "
          >
            <option className="text-black" value="">
              All Types
            </option>
            <option className="text-black" value="robux">
              Robux
            </option>
            <option className="text-black" value="gamepass">
              Gamepass
            </option>
            <option className="text-black" value="joki">
              Joki
            </option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 "
            placeholder="From Date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 "
            placeholder="To Date"
          />
          <button
            onClick={clearFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/80">Total Revenue</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(
                  (transactions || []).reduce(
                    (sum, t) =>
                      t.paymentStatus === "settlement"
                        ? sum + t.totalAmount
                        : sum,
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/80">Completed</p>
              <p className="text-2xl font-bold text-white/">
                {
                  (transactions || []).filter(
                    (t) => t.orderStatus === "completed"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
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
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/80">Processing</p>
              <p className="text-2xl font-bold text-white/">
                {
                  (transactions || []).filter(
                    (t) =>
                      t.orderStatus === "processing" ||
                      t.orderStatus === "pending"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-white/80">
                Failed/Cancelled
              </p>
              <p className="text-2xl font-bold text-white">
                {
                  (transactions || []).filter(
                    (t) =>
                      t.paymentStatus === "failed" ||
                      t.orderStatus === "cancelled"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow">
        <div className="p-6 text-black">
          <p className="mb-4 text-sm text-gray-600">
            Showing {(transactions || []).length} transactions
            {totalTransactions > 0 && ` of ${totalTransactions} total`}
          </p>
          <DataTable
            columns={columns}
            data={transactions}
            serverSide={true}
            onPageChange={setCurrentPage}
            currentPage={currentPage}
            totalPages={totalPages}
            loading={loading}
          />
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && selectedTransaction && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[4px] bg-opacity-50 flex items-center justify-center z-50 text-black">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Update Transaction Status
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Invoice:</span>{" "}
                  {selectedTransaction.invoiceId}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Service:</span>{" "}
                  {selectedTransaction.serviceName}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Username:</span>{" "}
                  {selectedTransaction.robloxUsername}
                </p>
                {selectedTransaction.robloxPassword && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Password:</span>{" "}
                    <span className="font-mono bg-gray-200 px-1 rounded">
                      {selectedTransaction.robloxPassword}
                    </span>
                  </p>
                )}
                {!selectedTransaction.robloxPassword &&
                  selectedTransaction.serviceType !== "gamepass" && (
                    <p className="text-sm text-yellow-600">
                      <span className="font-medium">⚠️ Password:</span> Not
                      provided (may be required for this service)
                    </p>
                  )}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Amount:</span>{" "}
                  {formatCurrency(selectedTransaction.totalAmount)}
                </p>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full border  border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="settlement">Settlement</option>
                  <option value="expired">Expired</option>
                  <option value="cancel">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="waiting_payment">Waiting Payment</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this status update..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleModalUpdate}
                  disabled={isUpdating}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isUpdating ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update Status"
                  )}
                </button>
                <button
                  onClick={() => setShowStatusModal(false)}
                  disabled={isUpdating}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
