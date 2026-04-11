"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getLeaderboardData } from "@/app/lib/actions";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy,
  Medal,
  Award,
  ChevronLeft,
  ChevronRight,
  Crown,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Calendar,
  Flame,
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
  profilePicture?: string;
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
        limit: "20",
        filterType: filterType,
      });

      if (filterType === "month" && selectedMonth && selectedYear) {
        params.append("month", selectedMonth);
        params.append("year", selectedYear);
      } else if (filterType === "year" && selectedYear) {
        params.append("year", selectedYear);
      }

      const response = await getLeaderboardData(params.toString());

      if (response.success) {
        setLeaderboard(response.data);
        setPagination(response.pagination);
        setStatistics(response.statistics);
      } else {
        toast.error(response.message || "Gagal memuat data leaderboard");
        setLeaderboard([]);
      }
    } catch (error) {
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

  const maskUsername = (name: string) => {
    if (name.length <= 4) return name;
    const first = name.slice(0, 2);
    const last = name.slice(-1);
    const masked = "*".repeat(Math.min(name.length - 3, 4));
    return `${first}${masked}${last}`;
  };

  const getRoleBadge = (entry: LeaderboardEntry) => {
    if (!entry.roleName || entry.roleName === "Regular") {
      return null;
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-primary-100/25 to-primary-200/25 border border-primary-100/40 text-primary-100 text-xs font-bold rounded-full">
        <Crown className="w-3 h-3" />
        {entry.roleName}
      </span>
    );
  };

  const resetFilters = () => {
    setFilterType("all");
    setSelectedMonth("");
    setSelectedYear("");
    setCurrentPage(1);
  };

  const isFirstPage = currentPage === 1;
  const top3 = isFirstPage ? leaderboard.slice(0, 3) : [];
  const restOfLeaderboard = isFirstPage ? leaderboard.slice(3) : leaderboard;

  // Podium order: [2nd, 1st, 3rd]
  const podiumOrder =
    top3.length === 3
      ? [top3[1], top3[0], top3[2]]
      : top3.length === 2
        ? [top3[1], top3[0]]
        : top3;

  const podiumConfig = [
    // 2nd place (left)
    {
      borderColor: "border-slate-400/40",
      glowShadow: "",
      avatarRing: "ring-slate-400/60",
      avatarSize: "w-20 h-20 md:w-24 md:h-24",
      icon: <Medal className="w-8 h-8 text-slate-300" />,
      label: "TOP 2",
      labelColor: "text-slate-400",
      amountColor: "text-white font-bold",
      nameSize: "text-sm md:text-base",
      amountSize: "text-base md:text-lg",
      topOffset: "mt-10",
    },
    // 1st place (center)
    {
      borderColor: "border-yellow-400/50",
      glowShadow: "shadow-[0_0_40px_rgba(246,58,230,0.15)]",
      avatarRing: "ring-yellow-400/80",
      avatarSize: "w-28 h-28 md:w-36 md:h-36",
      icon: <Crown className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />,
      label: "TOP 1",
      labelColor: "text-yellow-400",
      amountColor: "text-primary-100 font-extrabold",
      nameSize: "text-base md:text-lg",
      amountSize: "text-xl md:text-2xl",
      topOffset: "mt-0",
    },
    // 3rd place (right)
    {
      borderColor: "border-amber-600/40",
      glowShadow: "",
      avatarRing: "ring-amber-500/60",
      avatarSize: "w-20 h-20 md:w-24 md:h-24",
      icon: <Award className="w-8 h-8 text-amber-500" />,
      label: "TOP 3",
      labelColor: "text-amber-500",
      amountColor: "text-amber-300 font-bold",
      nameSize: "text-sm md:text-base",
      amountSize: "text-base md:text-lg",
      topOffset: "mt-10",
    },
  ];

  return (
    <div className="min-h-screen relative">
      {/* Background glow blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-32 left-1/4 w-72 h-72 bg-primary-100/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-40 right-1/4 w-60 h-60 bg-primary-200/6 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                <Trophy className="w-7 h-7 text-primary-100" />
                Top Spenders
              </h1>
              <p className="text-white/40 mt-1 text-sm">
                Ranking berdasarkan total pembelian
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-white/30" />
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="px-3.5 py-2 bg-bg-secondary/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-100/50 transition-all"
              >
                <option value="all" style={{ backgroundColor: "#22102A", color: "white" }}>Semua Waktu</option>
                <option value="month" style={{ backgroundColor: "#22102A", color: "white" }}>Per Bulan</option>
                <option value="year" style={{ backgroundColor: "#22102A", color: "white" }}>Per Tahun</option>
              </select>

              {filterType === "month" && (
                <>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-3.5 py-2 bg-bg-secondary/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-100/50 transition-all"
                  >
                    <option value="" style={{ backgroundColor: "#22102A", color: "white" }}>Bulan</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value} style={{ backgroundColor: "#22102A", color: "white" }}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3.5 py-2 bg-bg-secondary/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-100/50 transition-all"
                  >
                    <option value="" style={{ backgroundColor: "#22102A", color: "white" }}>Tahun</option>
                    {years.map((year) => (
                      <option key={year} value={year.toString()} style={{ backgroundColor: "#22102A", color: "white" }}>
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
                  className="px-3.5 py-2 bg-bg-secondary/60 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-primary-100/50 transition-all"
                >
                  <option value="" style={{ backgroundColor: "#22102A", color: "white" }}>Tahun</option>
                  {years.map((year) => (
                    <option key={year} value={year.toString()} style={{ backgroundColor: "#22102A", color: "white" }}>
                      {year}
                    </option>
                  ))}
                </select>
              )}

              {filterType !== "all" && (
                <button
                  onClick={resetFilters}
                  className="p-2 bg-bg-secondary/60 border border-white/10 rounded-lg text-white/50 hover:text-white hover:border-primary-100/30 transition-all"
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="text-center py-24">
            <div className="relative mx-auto mb-6 w-14 h-14">
              <div className="absolute inset-0 rounded-full border-3 border-primary-100/20"></div>
              <div className="absolute inset-0 rounded-full border-3 border-primary-100 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-white/50">Memuat leaderboard...</p>
          </div>
        ) : (
          <>
            {/* === TOP 3 PODIUM === */}
            {isFirstPage && top3.length > 0 && (
              <div className="grid grid-cols-3 gap-3 md:gap-6 mb-12 items-end">
                {podiumOrder.map((entry, index) => {
                  if (!entry) return null;
                  const config = podiumConfig[index];
                  const isFirst = index === 1;

                  return (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, y: 25, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: isFirst ? 0 : 0.1 + index * 0.08,
                      }}
                      className={`${config.topOffset}`}
                    >
                      <div
                        className={`relative rounded-2xl border ${config.borderColor} bg-white/[0.03] backdrop-blur-sm ${config.glowShadow} py-8 px-3 md:px-5 flex flex-col items-center text-center`}
                      >
                        {/* Icon */}
                        <motion.div
                          animate={isFirst ? { y: [0, -4, 0] } : {}}
                          transition={isFirst ? { repeat: Infinity, duration: 2.5, ease: "easeInOut" } : {}}
                          className="mb-1"
                        >
                          {config.icon}
                        </motion.div>

                        {/* Label */}
                        <p className={`text-[10px] md:text-xs font-bold ${config.labelColor} tracking-widest mb-4 uppercase`}>
                          {config.label}
                        </p>

                        {/* Avatar */}
                        <div className={`${config.avatarSize} rounded-full ring-3 ${config.avatarRing} bg-bg-secondary flex items-center justify-center mb-4 overflow-hidden`}>
                          {entry.profilePicture ? (
                            <img
                              src={entry.profilePicture}
                              alt={entry.username}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className={`${isFirst ? "text-3xl md:text-4xl" : "text-xl md:text-2xl"} font-bold text-white/90`}>
                              {entry.username.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Username */}
                        <h3 className={`${config.nameSize} font-bold text-white mb-2 truncate max-w-full`}>
                          {maskUsername(entry.username)}
                        </h3>

                        {/* Role */}
                        <div className="mb-3 min-h-[24px]">
                          {getRoleBadge(entry) || (
                            <span className="inline-flex items-center px-2.5 py-0.5 bg-white/5 border border-white/10 text-white/40 text-xs rounded-full">
                              Member
                            </span>
                          )}
                        </div>

                        {/* Amount */}
                        <p className={`${config.amountSize} ${config.amountColor}`}>
                          {formatCurrency(entry.totalSpent)}
                        </p>

                        {/* Orders */}
                        <div className="flex items-center gap-1 mt-2 text-white/30 text-xs">
                          <ShoppingBag className="w-3 h-3" />
                          {entry.totalOrders} pesanan
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* === PERINGKAT LAINNYA === */}
            {restOfLeaderboard.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">
                  Peringkat Lainnya
                </h2>

                <div className="flex flex-col gap-2">
                  {restOfLeaderboard.map((entry, index) => (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.25, delay: index * 0.025 }}
                      className="flex items-center gap-3 md:gap-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/10 rounded-xl px-4 py-3 transition-all duration-200 group"
                    >
                      {/* Rank */}
                      <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white/40">
                          {entry.rank}
                        </span>
                      </div>

                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {entry.profilePicture ? (
                          <img
                            src={entry.profilePicture}
                            alt={entry.username}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white">
                            {entry.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">
                            {maskUsername(entry.username)}
                          </span>
                          {getRoleBadge(entry)}
                        </div>
                        <p className="text-[11px] text-white/25 mt-0.5">
                          {entry.totalOrders} pesanan
                        </p>
                      </div>

                      {/* Amount */}
                      <p className="text-sm font-bold text-primary-100 flex-shrink-0">
                        {formatCurrency(entry.totalSpent)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-white/30">
                  Halaman {pagination.page} dari {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={!pagination.hasPrev}
                    className="px-3.5 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  <span className="px-3.5 py-2 bg-primary-100/10 border border-primary-100/30 text-white rounded-lg font-semibold text-sm">
                    {pagination.page} / {pagination.pages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className="px-3.5 py-2 bg-white/[0.05] border border-white/10 rounded-lg text-white text-sm hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Empty */}
            {leaderboard.length === 0 && (
              <div className="text-center py-24">
                <Trophy className="w-14 h-14 text-white/10 mx-auto mb-4" />
                <p className="text-white/30">Belum ada data leaderboard</p>
              </div>
            )}

            {/* === CTA SECTION === */}
            <div className="mt-16 relative rounded-2xl overflow-hidden">
              {/* Purple gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-400/30 via-bg-secondary to-primary-200/20" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(246,58,230,0.12),transparent_70%)]" />

              <div className="relative py-14 px-6 text-center">
                <Flame className="w-8 h-8 text-primary-100/60 mx-auto mb-4" />
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                  Mau Masuk{" "}
                  <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent italic">
                    Leaderboard
                  </span>
                  ?
                </h2>
                <p className="text-white/40 mb-8 text-base">
                  Belanja sekarang, nanti nama kamu bakal muncul di sini!
                </p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Link
                    href="/rbx"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-100 hover:bg-primary-100/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-100/25"
                  >
                    <Sparkles className="w-4 h-4" />
                    Top Up RBX
                  </Link>
                  <Link
                    href="/gamepass"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-white font-bold rounded-xl transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Beli Produk
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
