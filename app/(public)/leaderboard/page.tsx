"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Trophy,
  Medal,
  Award,
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Star,
  Crown,
  Shield,
  RotateCcw,
} from "lucide-react";

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
        return <Trophy className="w-8 h-8 text-yellow-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-amber-600" />;
      default:
        return <span className="text-xl font-bold text-white/70">#{rank}</span>;
    }
  };

  const getRoleBadge = (entry: LeaderboardEntry) => {
    if (!entry.roleName || entry.roleName === "Regular") {
      return (
        <span className="px-3 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-white/80 text-xs font-medium rounded-full flex items-center gap-1">
          No Tier
        </span>
      );
    } else {
      return (
        <div className="flex flex-col items-start gap-1">
          <span className="px-3 py-1.5 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 text-primary-100 text-xs font-bold rounded-full backdrop-blur-sm flex items-center gap-1">
            <Crown className="w-3 h-3" />
            {entry.roleName}
          </span>
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
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-100/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-20 w-40 h-40 bg-primary-200/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 w-36 h-36 bg-primary-100/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header Section */}
        <div className=" p-8 mb-8  relative overflow-hidden">
          {/* Glow effect */}

          <div className="relative">
            <div className="text-center mb-8">
              {/* Badge */}
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 rounded-2xl text-sm text-white/80 font-semibold mb-6 backdrop-blur-sm shadow-lg hover:shadow-primary-100/20 transition-all duration-300">
                <Trophy className="w-4 h-4 text-primary-100 mr-2" />
                Top Spenders Leaderboard
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary-100 via-white to-primary-200 bg-clip-text text-transparent flex items-center justify-center gap-4">
                <Trophy className="w-12 h-12 text-primary-100" />
                Leaderboard
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                Peringkat customer terbaik berdasarkan{" "}
                <span className="text-primary-100 font-medium">
                  total pembelian
                </span>{" "}
                dan aktivitas
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-transparent transition-all duration-300"
                >
                  <option value="all" className="bg-gray-800 text-white">
                    Semua Waktu
                  </option>
                  <option value="month" className="bg-gray-800 text-white">
                    Per Bulan
                  </option>
                  <option value="year" className="bg-gray-800 text-white">
                    Per Tahun
                  </option>
                </select>
              </div>

              {filterType === "month" && (
                <>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-transparent transition-all duration-300"
                  >
                    <option value="" className="bg-gray-800 text-white">
                      Pilih Bulan
                    </option>
                    {months.map((month) => (
                      <option
                        key={month.value}
                        value={month.value}
                        className="bg-gray-800 text-white"
                      >
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-transparent transition-all duration-300"
                  >
                    <option value="" className="bg-gray-800 text-white">
                      Pilih Tahun
                    </option>
                    {years.map((year) => (
                      <option
                        key={year}
                        value={year.toString()}
                        className="bg-gray-800 text-white"
                      >
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
                  className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-transparent transition-all duration-300"
                >
                  <option value="" className="bg-gray-800 text-white">
                    Pilih Tahun
                  </option>
                  {years.map((year) => (
                    <option
                      key={year}
                      value={year.toString()}
                      className="bg-gray-800 text-white"
                    >
                      {year}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-gradient-to-r from-primary-200/20 to-primary-300/20 border border-primary-200/40 text-white rounded-xl hover:from-primary-200/30 hover:to-primary-300/30 transition-all duration-300 backdrop-blur-sm font-medium flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-lg hover:shadow-primary-100/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-primary-100" />
                </div>
                <span className="text-xs text-white/50 uppercase tracking-wider">
                  Total Orders (Leaderboard)
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {leaderboard.length > 0
                  ? leaderboard
                      .reduce((total, entry) => total + entry.totalOrders, 0)
                      .toLocaleString()
                  : "0"}
              </div>
              <div className="text-sm text-white/60">
                Dari {leaderboard.length} top spenders
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-lg hover:shadow-primary-100/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-100" />
                </div>
                <span className="text-xs text-white/50 uppercase tracking-wider">
                  Total Customers
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {statistics?.uniqueCustomerCount
                  ? statistics.uniqueCustomerCount.toLocaleString()
                  : leaderboard.length.toLocaleString()}
              </div>
              <div className="text-sm text-white/60">
                {statistics?.vipMembers || 0} Reseller •{" "}
                {statistics?.regularMembers || 0} No Tier
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 shadow-lg hover:shadow-primary-100/10 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary-100" />
                </div>
                <span className="text-xs text-white/50 uppercase tracking-wider">
                  Avg Order Value
                </span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {statistics?.avgTransactionValue
                  ? formatCurrency(statistics.avgTransactionValue)
                  : leaderboard.length > 0
                  ? formatCurrency(
                      leaderboard.reduce(
                        (total, entry) => total + entry.avgOrderValue,
                        0
                      ) / leaderboard.length
                    )
                  : "Rp 0"}
              </div>
              <div className="text-sm text-white/60">Per transaksi</div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
          {loading ? (
            <div className="text-center py-20">
              <div className="relative mx-auto mb-8 w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary-100/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary-100 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-white/70 text-lg">
                Memuat data leaderboard...
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-primary-900/30 via-primary-800/40 to-primary-900/30 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider text-white/90">
                        Peringkat
                      </th>
                      <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider text-white/90">
                        Username
                      </th>
                      <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider text-white/90">
                        Total Pembelian
                      </th>
                      <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider text-white/90">
                        Jumlah Order
                      </th>
                      <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider text-white/90">
                        Terakhir Order
                      </th>
                      <th className="px-6 py-6 text-left text-sm font-bold uppercase tracking-wider text-white/90">
                        Tier
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {leaderboard.map((entry, index) => (
                      <tr
                        key={entry._id}
                        className={`hover:bg-white/5 transition-all duration-300 group ${
                          entry.rank <= 3
                            ? "bg-gradient-to-r from-primary-900/20 via-primary-800/10 to-primary-900/20"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="mr-3">
                              {getRankIcon(entry.rank)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-lg shadow-primary-100/20">
                              {entry.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-lg font-semibold text-white group-hover:text-primary-100 transition-colors duration-300">
                                {entry.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="text-xl font-bold text-primary-100">
                            {formatCurrency(entry.totalSpent)}
                          </div>
                          <div className="text-sm text-white/60 mt-1">
                            Avg: {formatCurrency(entry.avgOrderValue)}
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="text-lg text-white/90 font-medium">
                            {entry.totalOrders} order
                            {entry.totalOrders > 1 ? "s" : ""}
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="text-sm text-white/70">
                            {formatDate(entry.lastOrderDate)}
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          {getRoleBadge(entry)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-white/5 backdrop-blur-sm px-6 py-6 border-t border-white/10">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-white/70">
                    Menampilkan {(pagination.page - 1) * pagination.limit + 1} -{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    dari {pagination.total} top spenders
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={!pagination.hasPrev}
                      className="px-3 lg:px-5 lg:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden lg:block">Previous</span>
                    </button>
                    <span className="px-5 py-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 text-white rounded-xl font-semibold backdrop-blur-sm">
                      {pagination.page} / {pagination.pages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 lg:px-5 lg:py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium flex items-center gap-2"
                    >
                      <span className="hidden lg:block">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
