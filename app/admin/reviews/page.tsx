"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Review } from "@/types";

interface ReviewStats {
  total: number;
  approved: number;
  pending: number;
}

interface AdminReviewsResponse {
  success: boolean;
  data: Review[];
  stats: ReviewStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    total: 0,
    approved: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<
    "all" | "approved" | "pending"
  >("all");
  const [serviceFilter, setServiceFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, serviceFilter, currentPage]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });

      if (statusFilter !== "all") params.append("status", statusFilter);
      if (serviceFilter) params.append("serviceType", serviceFilter);

      const response = await fetch(`/api/admin/reviews?${params}`);
      const data: AdminReviewsResponse = await response.json();

      if (data.success) {
        setReviews(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReview = (reviewId: string) => {
    setSelectedReviews((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleSelectAll = () => {
    if (selectedReviews.length === reviews.length) {
      setSelectedReviews([]);
    } else {
      setSelectedReviews(reviews.map((review) => review._id));
    }
  };

  const handleBulkAction = async (action: "approve" | "reject" | "delete") => {
    if (selectedReviews.length === 0) {
      toast.error("Pilih review terlebih dahulu");
      return;
    }

    const confirmMessage =
      action === "delete"
        ? `Hapus ${selectedReviews.length} review?`
        : `${action === "approve" ? "Approve" : "Reject"} ${
            selectedReviews.length
          } review?`;

    if (!confirm(confirmMessage)) return;

    setActionLoading(true);
    try {
      const endpoint = "/api/admin/reviews";
      const method = action === "delete" ? "DELETE" : "PUT";
      const body =
        action === "delete"
          ? { reviewIds: selectedReviews }
          : { reviewIds: selectedReviews, action };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setSelectedReviews([]);
        fetchReviews();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Terjadi kesalahan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSingleAction = async (
    reviewId: string,
    action: "approve" | "reject" | "delete"
  ) => {
    const confirmMessage =
      action === "delete"
        ? "Hapus review ini?"
        : `${action === "approve" ? "Approve" : "Reject"} review ini?`;

    if (!confirm(confirmMessage)) return;

    try {
      const endpoint = `/api/admin/reviews/${reviewId}`;
      const method = action === "delete" ? "DELETE" : "PUT";
      const body = action === "delete" ? {} : { action };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchReviews();
      } else {
        toast.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error("Error performing action:", error);
      toast.error("Terjadi kesalahan");
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= rating ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ⭐
          </span>
        ))}
      </div>
    );
  };

  const getStatusBadge = (isApproved: boolean) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          isApproved
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {isApproved ? "Approved" : "Pending"}
      </span>
    );
  };

  return (
    <div className="p-6  min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">
          Review Management
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 border border-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400">
              Total Reviews
            </h3>
            <p className="text-2xl font-bold text-blue-300">{stats.total}</p>
          </div>
          <div className="bg-slate-800 border border-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400">Approved</h3>
            <p className="text-2xl font-bold text-green-300">
              {stats.approved}
            </p>
          </div>
          <div className="bg-slate-800 border border-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-400">Pending</h3>
            <p className="text-2xl font-bold text-yellow-300">
              {stats.pending}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-slate-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>

          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Services</option>
            <option value="robux">Robux</option>
            <option value="gamepass">Gamepass</option>
            <option value="joki">Joki</option>
          </select>

          <button
            onClick={() => {
              setStatusFilter("all");
              setServiceFilter("");
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 border border-gray-600"
          >
            Reset Filters
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedReviews.length > 0 && (
          <div className="bg-slate-800 border border-gray-700 p-4 rounded-lg mb-4">
            <p className="mb-2 text-white">
              {selectedReviews.length} review(s) selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction("approve")}
                disabled={actionLoading}
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleBulkAction("reject")}
                disabled={actionLoading}
                className="px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                disabled={actionLoading}
                className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-800 border border-gray-700 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-slate-900">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedReviews.length === reviews.length &&
                      reviews.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-600 bg-slate-700"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"></th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Comment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  </td>
                </tr>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <tr key={review._id} className="hover:bg-slate-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReviews.includes(review._id)}
                        onChange={() => handleSelectReview(review._id)}
                        className="rounded border-gray-600 bg-slate-700"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {review.username}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        <div className="font-medium">{review.serviceType}</div>
                        {review.serviceCategory && (
                          <div className="text-xs text-gray-400">
                            {review.serviceCategory}
                          </div>
                        )}
                        {review.serviceName && (
                          <div className="text-xs text-gray-400">
                            {review.serviceName}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStars(review.rating)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300 max-w-xs truncate">
                        {review.comment}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(review.isApproved)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-1">
                        {!review.isApproved && (
                          <button
                            onClick={() =>
                              handleSingleAction(review._id, "approve")
                            }
                            className="text-green-400 hover:text-green-300"
                          >
                            ✓
                          </button>
                        )}
                        {review.isApproved && (
                          <button
                            onClick={() =>
                              handleSingleAction(review._id, "reject")
                            }
                            className="text-yellow-400 hover:text-yellow-300"
                          >
                            ⏸
                          </button>
                        )}
                        <button
                          onClick={() =>
                            handleSingleAction(review._id, "delete")
                          }
                          className="text-red-400 hover:text-red-300 ml-2"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-4 text-center text-gray-400"
                  >
                    Tidak ada review ditemukan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
