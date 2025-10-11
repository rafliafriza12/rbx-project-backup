"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import StatsCard from "@/components/admin/StatsCard";
import SalesChart from "@/components/admin/Charts/SalesChart";
import DataTable, { Column } from "@/components/admin/DataTable";

interface Stats {
  todaySales: number;
  monthlySales: number;
  pendingOrders: number;
  successOrders: number;
  failedOrders: number;
  totalUsers: number;
  totalGamepass: number;
  proccessOrders: number;
}

export default function DashboardPage() {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    todaySales: 0,
    monthlySales: 0,
    pendingOrders: 0,
    successOrders: 0,
    failedOrders: 0,
    totalUsers: 0,
    totalGamepass: 0,
    proccessOrders: 0,
  });

  // Protect admin route
  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin()) {
        router.push("/login");
        return;
      }
    }
  }, [user, loading, isAdmin, router]);

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper functions for percentage calculations
  const getTotalOrders = () => {
    return (
      (stats?.pendingOrders || 0) +
      (stats?.successOrders || 0) +
      (stats?.failedOrders || 0)
    );
  };

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard");
      const data = await response.json();
      console.log(data);

      setStats(data.stats);
      setRecentTransactions(data.recentTransactions);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
  };

  const statsCards = [
    {
      title: "Penjualan Hari Ini",
      value: `Rp ${(stats?.todaySales || 0).toLocaleString("id-ID")}`,
      icon: "💰",
      color: "bg-green-500",
    },
    {
      title: "Penjualan Bulan Ini",
      value: `Rp ${(stats?.monthlySales || 0).toLocaleString("id-ID")}`,
      icon: "📈",
      color: "bg-blue-500",
    },
    {
      title: "Order Pending",
      value: stats?.pendingOrders || 0,
      icon: "⏳",
      color: "bg-yellow-500",
    },
    {
      title: "Order Proccess",
      value: stats?.proccessOrders || 0,
      icon: "🕐",
      color: "bg-pink-500",
    },
    {
      title: "Order Success",
      value: stats?.successOrders || 0,
      icon: "✅",
      color: "bg-green-500",
    },
    {
      title: "Order Failed",
      value: stats?.failedOrders || 0,
      icon: "❌",
      color: "bg-red-500",
    },
    {
      title: "Total Users",
      value: stats?.totalUsers || 0,
      icon: "👥",
      color: "bg-purple-500",
    },
    {
      title: "Total Gamepass",
      value: stats?.totalGamepass || 0,
      icon: "🎮",
      color: "bg-indigo-500",
    },
  ];

  const transactionColumns: Column[] = [
    { key: "invoice", label: "Invoice" },
    { key: "user", label: "User" },
    { key: "product", label: "Product" },
    { key: "amount", label: "Amount" },
    {
      key: "status",
      label: "Status Payment",
      render: (value: string) => {
        const styles: { [key: string]: string } = {
          pending: "bg-yellow-900 text-yellow-300 border border-yellow-700",
          settlement: "bg-green-900 text-green-300 border border-green-700",
          processing: "bg-purple-900 text-purple-300 border border-purple-700",
          success: "bg-green-900 text-green-300 border border-green-700",
          completed: "bg-green-900 text-green-300 border border-green-700",
          failed: "bg-red-900 text-red-300 border border-red-700",
          expired: "bg-gray-700 text-gray-300 border border-gray-600",
          capture: "bg-blue-900 text-blue-300 border border-blue-700",
          deny: "bg-red-900 text-red-300 border border-red-700",
          cancel: "bg-gray-700 text-gray-300 border border-gray-600",
          expire: "bg-gray-700 text-gray-300 border border-gray-600",
          refund: "bg-orange-900 text-orange-300 border border-orange-700",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              styles[value?.toLowerCase()] || styles.pending
            }`}
          >
            {value || "pending"}
          </span>
        );
      },
    },
    { key: "date", label: "Date" },
  ];

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user || !isAdmin()) {
    return null;
  }

  // Show data loading
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-[#f1f5f9]">
            Sales Overview
          </h3>
          <SalesChart />
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-[#f1f5f9]">
            Order Status Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Pending</span>
              <div className="flex items-center">
                <div className="w-32 bg-[#334155] rounded-full h-2 mr-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${calculatePercentage(
                        stats?.pendingOrders || 0,
                        getTotalOrders()
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-[#f1f5f9]">
                  {calculatePercentage(
                    stats?.pendingOrders || 0,
                    getTotalOrders()
                  )}
                  %
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Success</span>
              <div className="flex items-center">
                <div className="w-32 bg-[#334155] rounded-full h-2 mr-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${calculatePercentage(
                        stats?.successOrders || 0,
                        getTotalOrders()
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-[#f1f5f9]">
                  {calculatePercentage(
                    stats?.successOrders || 0,
                    getTotalOrders()
                  )}
                  %
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#94a3b8]">Failed</span>
              <div className="flex items-center">
                <div className="w-32 bg-[#334155] rounded-full h-2 mr-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${calculatePercentage(
                        stats?.failedOrders || 0,
                        getTotalOrders()
                      )}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-[#f1f5f9]">
                  {calculatePercentage(
                    stats?.failedOrders || 0,
                    getTotalOrders()
                  )}
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-[#f1f5f9]">
            Recent Transactions
          </h3>
          <DataTable
            columns={transactionColumns}
            data={recentTransactions}
            serverSide={false}
          />
        </div>
      </div>
    </div>
  );
}
