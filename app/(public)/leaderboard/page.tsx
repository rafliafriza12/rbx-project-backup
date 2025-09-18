"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface LeaderboardEntry {
  _id: string;
  username: string;
  email: string;
  totalSpent: number;
  totalOrders: number;
  lastOrderDate: string;
  firstOrderDate: string;
  avgOrderValue: number;
  rank: number;
  roleName: string;
  discount: number;
  spendedMoney: number;
  isVerified: boolean;
}

interface LeaderboardResponse {
  success: boolean;
  data: LeaderboardEntry[];
  message?: string;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statistics: {
    totalRevenue: number;
    totalTransactions: number;
    avgTransactionValue: number;
    uniqueCustomerCount: number;
    vipMembers: number;
    regularMembers: number;
  };
  filters: {
    filterType: string;
    month: string;
    year: string;
  };
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<"month" | "year" | "all">("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    avgTransactionValue: 0,
    uniqueCustomerCount: 0,
    vipMembers: 0,
    regularMembers: 0,
  });

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const months = [
    { value: "1", label: "Januari" },
    { value: "2", label: "Februari" },
    { value: "3", label: "Maret" },
    { value: "4", label: "April" },
    { value: "5", label: "Mei" },
    { value: "6", label: "Juni" },
    { value: "7", label: "Juli" },
    { value: "8", label: "Agustus" },
    { value: "9", label: "September" },
    { value: "10", label: "Oktober" },
    { value: "11", label: "November" },
    { value: "12", label: "Desember" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage, filterType, selectedMonth, selectedYear]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        filterType: filterType,
      });

      if (filterType === "month" && selectedMonth && selectedYear) {
        params.append("month", selectedMonth);
        params.append("year", selectedYear);
      } else if (filterType === "year" && selectedYear) {
        params.append("year", selectedYear);
      }

      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      const result: LeaderboardResponse = await response.json();

      if (result.success) {
        setLeaderboard(result.data);
        setPagination(result.pagination);
        setStatistics(result.statistics);
      } else {
        toast.error(result.message || "Gagal memuat data leaderboard");
        setLeaderboard([]);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Gagal memuat data leaderboard");
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
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
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `#${rank}`;
    }
  };

  const getRoleBadge = (entry: LeaderboardEntry) => {
    // Jika role adalah Regular atau tidak ada, tampilkan badge regular
    if (!entry.roleName || entry.roleName === "Regular") {
      return (
        <span className="px-2 py-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs font-medium rounded-full">
          Regular
        </span>
      );
    } else {
      // Untuk role khusus (VIP, Premium, dll), tampilkan dengan style premium
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
            {entry.roleName} ⭐
          </span>
          {/* {entry.discount > 0 && (
            <span className="text-xs text-green-600 font-medium">
              {entry.discount}% OFF
            </span>
          )} */}
        </div>
      );
    }
  };

  const resetFilters = () => {
    setFilterType("all");
    setSelectedMonth("");
    setSelectedYear("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <div className=" rounded-xl  p-6 mb-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏆 Leaderboard Top Spenders
          </h1>
          <p className="text-gray-600">
            Peringkat customer terbaik berdasarkan total pembelian
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-4 py-2   rounded-lg focus:outline-none focus:ring-0 "
            >
              <option value="all">Semua Waktu</option>
              <option value="month">Per Bulan</option>
              <option value="year">Per Tahun</option>
            </select>
          </div>

          {filterType === "month" && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 bg-white/80 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">Pilih Bulan</option>
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 bg-white/80 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              >
                <option value="">Pilih Tahun</option>
                {years.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
            </>
          )}

          {filterType === "year" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 bg-white/80 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            >
              <option value="">Pilih Tahun</option>
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl border border-rose-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data leaderboard...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Peringkat
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Total Pembelian
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Jumlah Order
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Terakhir Order
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-200">
                  {leaderboard.map((entry, index) => (
                    <tr
                      key={entry._id}
                      className={`hover:bg-rose-50 transition-colors duration-200 ${
                        entry.rank <= 3
                          ? "bg-gradient-to-r from-yellow-50 to-orange-50"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-2">
                            {getRankIcon(entry.rank)}
                          </span>
                          <span className="text-lg font-bold text-gray-800">
                            {entry.rank <= 3 ? "" : entry.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {entry.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {entry.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(entry.totalSpent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {entry.totalOrders} order
                          {entry.totalOrders > 1 ? "s" : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(entry.lastOrderDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(entry)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-rose-50 px-6 py-4 border-t border-rose-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  dari {pagination.total} top spenders
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 bg-white border border-rose-300 rounded-lg hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    ← Previous
                  </button>
                  <span className="px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg font-medium">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 bg-white border border-rose-300 rounded-lg hover:bg-rose-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
