// src/app/admin/transactions/page.tsx
"use client";
import { useState, useEffect } from "react";
import DataTable from "@/components/admin/DataTable";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  isMultiCheckout,
  calculateGrandTotal,
  getPaymentFee,
  getTotalItemsCount,
} from "@/lib/transaction-helpers";

interface Transaction {
  _id: string;
  invoiceId: string;
  serviceType: string;
  serviceCategory?: string;
  serviceName: string;
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
  customerNotes?: string;
  // Payment method fields
  paymentMethodId?: string;
  paymentMethodName?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
    userId?: string;
  };
  createdAt: string;
  updatedAt: string;
  // Multi-checkout fields
  relatedTransactions?: Transaction[];
  isMultiCheckout?: boolean;
  midtransOrderId?: string;
  masterOrderId?: string;
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
        // Show different message for settlement status update
        if (statusType === "payment" && newStatus === "settlement") {
          toast.success(
            `Payment status updated to settlement. User's spent money has been updated.`
          );
        } else {
          toast.success(`${statusType} status updated successfully`);
        }
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
    const paymentColors = {
      pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50",
      settlement: "bg-green-500/20 text-green-300 border border-green-500/50",
      failed: "bg-red-500/20 text-red-300 border border-red-500/50",
      expired: "bg-gray-500/20 text-gray-300 border border-gray-500/50",
    };

    const orderColors = {
      pending: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50",
      processing: "bg-blue-500/20 text-blue-300 border border-blue-500/50",
      completed: "bg-green-500/20 text-green-300 border border-green-500/50",
      cancelled: "bg-red-500/20 text-red-300 border border-red-500/50",
      waiting_payment:
        "bg-orange-500/20 text-orange-300 border border-orange-500/50",
    };

    const colors = type === "payment" ? paymentColors : orderColors;

    return (
      <span
        className={`px-3 py-1 rounded-lg text-xs font-semibold ${
          colors[status as keyof typeof colors] || colors.pending
        }`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const columns = [
    {
      key: "invoiceId",
      label: "Invoice",
      render: (value: string, row: Transaction) => (
        <div className="flex flex-col gap-1">
          <span className="font-mono text-sm">{value}</span>
          {isMultiCheckout(row as any) && (
            <span className="inline-flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full w-fit">
              <svg
                className="w-3 h-3"
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
              {getTotalItemsCount(row as any)} items
            </span>
          )}
        </div>
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
      render: (value: string, row: Transaction) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm">
            {value.length > 30 ? value.substring(0, 30) + "..." : value}
          </span>
          {row.midtransOrderId && (
            <span className="text-xs text-gray-500 font-mono">
              ID: {row.midtransOrderId.slice(-8)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "Amount",
      render: (value: number, row: Transaction) => {
        const grandTotal = calculateGrandTotal(row as any);
        const paymentFee = getPaymentFee(row as any);

        return (
          <div className="text-sm">
            {isMultiCheckout(row as any) ? (
              <div className="space-y-1">
                <span className="font-medium text-blue-400">
                  {formatCurrency(grandTotal)}
                </span>
                <div className="text-xs text-blue-400/70">
                  {getTotalItemsCount(row as any)} items
                </div>
                {paymentFee > 0 && (
                  <div className="text-xs text-gray-400">
                    Fee: {formatCurrency(paymentFee)}
                  </div>
                )}
              </div>
            ) : row.discountPercentage && row.discountPercentage > 0 ? (
              <div className="space-y-1">
                <div className="text-gray-500 line-through text-xs">
                  {formatCurrency(value)}
                </div>
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-green-400">
                    {formatCurrency(grandTotal)}
                  </span>
                  <span className="bg-green-600 text-white px-1 py-0.5 rounded text-xs">
                    -{row.discountPercentage}%
                  </span>
                </div>
                {paymentFee > 0 && (
                  <div className="text-xs text-gray-400">
                    Fee: {formatCurrency(paymentFee)}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <span className="font-medium">
                  {formatCurrency(grandTotal)}
                </span>
                {paymentFee > 0 && (
                  <div className="text-xs text-gray-400">
                    Fee: {formatCurrency(paymentFee)}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      },
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
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            View Detail
          </Link>
          <button
            onClick={() => openStatusModal(row)}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
          >
            Update Status
          </button>
          <button
            onClick={() => handleDeleteTransaction(row._id)}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">
            Transaction Management
          </h1>
          <p className="text-[#94a3b8] mt-1">
            Total: {totalTransactions} transactions
          </p>
        </div>
        <button
          onClick={handleExportData}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 font-medium"
        >
          <svg
            className="w-5 h-5"
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
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Search invoice or username..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="px-4 py-2 bg-[#334155] border border-[#475569] text-[#f1f5f9] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] placeholder-[#94a3b8]"
          />
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2 bg-[#334155] border border-[#475569] text-[#f1f5f9] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
          >
            <option className="bg-[#334155] text-[#f1f5f9]" value="">
              All Status
            </option>
            <option
              className="bg-[#334155] text-[#f1f5f9]"
              value="payment:pending"
            >
              Payment: Pending
            </option>
            <option
              className="bg-[#334155] text-[#f1f5f9]"
              value="payment:settlement"
            >
              Payment: Settlement
            </option>
            <option
              className="bg-[#334155] text-[#f1f5f9]"
              value="payment:failed"
            >
              Payment: Failed
            </option>
            <option
              className="bg-[#334155] text-[#f1f5f9]"
              value="order:pending"
            >
              Order: Pending
            </option>
            <option
              className="bg-[#334155] text-[#f1f5f9]"
              value="order:processing"
            >
              Order: Processing
            </option>
            <option
              className="bg-[#334155] text-[#f1f5f9]"
              value="order:completed"
            >
              Order: Completed
            </option>
            <option
              className="bg-[#334155] text-[#f1f5f9]"
              value="order:cancelled"
            >
              Order: Cancelled
            </option>
          </select>
          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange("serviceType", e.target.value)}
            className="px-4 py-2 bg-[#334155] border border-[#475569] text-[#f1f5f9] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
          >
            <option className="bg-[#334155] text-[#f1f5f9]" value="">
              All Types
            </option>
            <option className="bg-[#334155] text-[#f1f5f9]" value="robux">
              Robux
            </option>
            <option className="bg-[#334155] text-[#f1f5f9]" value="gamepass">
              Gamepass
            </option>
            <option className="bg-[#334155] text-[#f1f5f9]" value="joki">
              Joki
            </option>
          </select>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            className="px-4 py-2 bg-[#334155] border border-[#475569] text-[#f1f5f9] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
            placeholder="From Date"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            className="px-4 py-2 bg-[#334155] border border-[#475569] text-[#f1f5f9] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
            placeholder="To Date"
          />
          <button
            onClick={clearFilters}
            className="bg-[#475569] text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-[#64748b] transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-[#3b82f6]/20 rounded-lg">
              <svg
                className="w-6 h-6 text-[#3b82f6]"
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
              <p className="text-sm font-medium text-[#94a3b8]">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-[#f1f5f9]">
                {formatCurrency(
                  (transactions || []).reduce(
                    (sum, t) =>
                      t.paymentStatus === "settlement"
                        ? sum + calculateGrandTotal(t as any)
                        : sum,
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <svg
                className="w-6 h-6 text-green-400"
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
              <p className="text-sm font-medium text-[#94a3b8]">Completed</p>
              <p className="text-2xl font-bold text-[#f1f5f9]">
                {
                  (transactions || []).filter(
                    (t) => t.orderStatus === "completed"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-400"
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
              <p className="text-sm font-medium text-[#94a3b8]">Processing</p>
              <p className="text-2xl font-bold text-[#f1f5f9]">
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
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-500/20 rounded-lg">
              <svg
                className="w-6 h-6 text-red-400"
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
              <p className="text-sm font-medium text-[#94a3b8]">
                Failed/Cancelled
              </p>
              <p className="text-2xl font-bold text-[#f1f5f9]">
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
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg">
        <div className="p-6">
          <p className="mb-4 text-sm text-[#94a3b8]">
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 rounded-lg p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#f1f5f9]">
                Update Transaction Status
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
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
              <div className="bg-[#0f172a] border border-[#334155] p-3 rounded-lg">
                <p className="text-sm text-[#94a3b8]">
                  <span className="font-medium text-[#f1f5f9]">Invoice:</span>{" "}
                  {selectedTransaction.invoiceId}
                </p>
                <p className="text-sm text-[#94a3b8]">
                  <span className="font-medium text-[#f1f5f9]">Service:</span>{" "}
                  {selectedTransaction.serviceName}
                </p>
                <p className="text-sm text-[#94a3b8]">
                  <span className="font-medium text-[#f1f5f9]">Username:</span>{" "}
                  {selectedTransaction.robloxUsername}
                </p>
                {selectedTransaction.paymentMethodName && (
                  <p className="text-sm text-[#94a3b8]">
                    <span className="font-medium text-[#f1f5f9]">
                      Payment Method:
                    </span>{" "}
                    <span className="font-semibold text-[#3b82f6]">
                      {selectedTransaction.paymentMethodName}
                    </span>
                  </p>
                )}
                {selectedTransaction.robloxPassword && (
                  <p className="text-sm text-[#94a3b8]">
                    <span className="font-medium text-[#f1f5f9]">
                      Password:
                    </span>{" "}
                    <span className="font-mono bg-[#334155] px-2 py-0.5 rounded text-[#f1f5f9]">
                      {selectedTransaction.robloxPassword}
                    </span>
                  </p>
                )}
                {!selectedTransaction.robloxPassword &&
                  selectedTransaction.serviceType !== "gamepass" && (
                    <p className="text-sm text-yellow-400">
                      <span className="font-medium">⚠️ Password:</span> Not
                      provided (may be required for this service)
                    </p>
                  )}

                {/* Amount with discount info */}
                {(() => {
                  const modalPaymentFee = getPaymentFee(
                    selectedTransaction as any
                  );
                  const modalGrandTotal = calculateGrandTotal(
                    selectedTransaction as any
                  );

                  return (
                    <div className="text-sm space-y-1">
                      {selectedTransaction.discountPercentage &&
                      selectedTransaction.discountPercentage > 0 ? (
                        <>
                          <div className="text-[#94a3b8]">
                            <span className="font-medium text-[#f1f5f9]">
                              Subtotal:
                            </span>{" "}
                            <span className="line-through">
                              {formatCurrency(selectedTransaction.totalAmount)}
                            </span>
                          </div>
                          <div className="text-[#94a3b8]">
                            <span className="font-medium text-[#f1f5f9]">
                              Discount ({selectedTransaction.discountPercentage}
                              %):
                            </span>{" "}
                            <span className="text-green-400">
                              -
                              {formatCurrency(
                                selectedTransaction.discountAmount || 0
                              )}
                            </span>
                          </div>
                          <div className="text-[#94a3b8]">
                            <span className="font-medium text-[#f1f5f9]">
                              Final Amount:
                            </span>{" "}
                            {formatCurrency(
                              selectedTransaction.finalAmount ||
                                selectedTransaction.totalAmount
                            )}
                          </div>
                        </>
                      ) : (
                        <p className="text-[#94a3b8]">
                          <span className="font-medium text-[#f1f5f9]">
                            Amount:
                          </span>{" "}
                          {formatCurrency(selectedTransaction.totalAmount)}
                        </p>
                      )}

                      {/* Payment Fee */}
                      {modalPaymentFee > 0 && (
                        <div className="text-[#94a3b8]">
                          <span className="font-medium text-[#f1f5f9]">
                            Payment Fee:
                          </span>{" "}
                          <span className="text-orange-400">
                            {formatCurrency(modalPaymentFee)}
                          </span>
                        </div>
                      )}

                      {/* Total Pembayaran */}
                      <div className="text-[#f1f5f9] font-semibold pt-1 border-t border-[#334155] mt-1">
                        <span className="font-medium">Total Pembayaran:</span>{" "}
                        <span className="text-blue-400">
                          {formatCurrency(modalGrandTotal)}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* Customer Notes */}
                {selectedTransaction.customerNotes && (
                  <div className="mt-3 pt-3 border-t border-[#334155]">
                    <p className="text-sm text-[#94a3b8] mb-1">
                      <span className="font-medium text-[#f1f5f9]">
                        Customer Notes:
                      </span>
                    </p>
                    <p className="text-sm text-[#e0f2fe] bg-[#1e40af]/20 p-2 rounded border border-[#3b82f6]/50">
                      {selectedTransaction.customerNotes}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-sm font-medium text-[#f1f5f9] mb-2">
                  Payment Status
                </label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full bg-[#334155] border border-[#475569] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                >
                  <option className="bg-[#334155]" value="pending">
                    Pending
                  </option>
                  <option className="bg-[#334155]" value="settlement">
                    Settlement
                  </option>
                  <option className="bg-[#334155]" value="expired">
                    Expired
                  </option>
                  <option className="bg-[#334155]" value="cancelled">
                    Cancelled
                  </option>
                  <option className="bg-[#334155]" value="failed">
                    Failed
                  </option>
                </select>

                {/* Warning for settlement status */}
                {newPaymentStatus === "settlement" &&
                  selectedTransaction?.paymentStatus !== "settlement" &&
                  selectedTransaction?.customerInfo?.userId && (
                    <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-5 w-5 text-yellow-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-300">
                            Settlement Status Update
                          </h3>
                          <div className="mt-2 text-sm text-yellow-200">
                            <p>
                              This will add{" "}
                              <strong>
                                {selectedTransaction.finalAmount
                                  ? `Rp ${selectedTransaction.finalAmount.toLocaleString()}`
                                  : `Rp ${selectedTransaction.totalAmount.toLocaleString()}`}
                              </strong>{" "}
                              to the user's spent money balance.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-[#f1f5f9] mb-2">
                  Order Status
                </label>
                <select
                  value={newOrderStatus}
                  onChange={(e) => setNewOrderStatus(e.target.value)}
                  className="w-full bg-[#334155] border border-[#475569] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                >
                  <option className="bg-[#334155]" value="waiting_payment">
                    Waiting Payment
                  </option>
                  <option className="bg-[#334155]" value="pending">
                    Pending
                  </option>
                  <option className="bg-[#334155]" value="processing">
                    Processing
                  </option>
                  <option className="bg-[#334155]" value="completed">
                    Completed
                  </option>
                  <option className="bg-[#334155]" value="cancelled">
                    Cancelled
                  </option>
                  <option className="bg-[#334155]" value="failed">
                    Failed
                  </option>
                </select>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-[#f1f5f9] mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this status update..."
                  className="w-full bg-[#334155] border border-[#475569] text-[#f1f5f9] placeholder-[#94a3b8] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleModalUpdate}
                  disabled={isUpdating}
                  className="flex-1 bg-[#3b82f6] text-white py-2 px-4 rounded-md hover:bg-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
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
                  className="flex-1 bg-[#475569] text-[#f1f5f9] py-2 px-4 rounded-md hover:bg-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#475569] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
