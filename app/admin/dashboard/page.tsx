"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import StatsCard from "@/components/admin/StatsCard";
import SalesChart from "@/components/admin/Charts/SalesChart";
import DataTable from "@/components/admin/DataTable";

interface Stats {
  todaySales: number;
  monthlySales: number;
  pendingOrders: number;
  successOrders: number;
  failedOrders: number;
  totalUsers: number;
  totalGamepass: number;
  paymentMethods: number;
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
    paymentMethods: 0,
  });

  // Protect admin route
  useEffect(() => {
    if (!loading) {
      if (!user || !isAdmin()) {
        router.push("/admin-login");
        return;
      }
    }
  }, [user, loading, isAdmin, router]);

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/admin/dashboard");
      const data = await response.json();

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
      value: `Rp ${stats.todaySales.toLocaleString("id-ID")}`,
      icon: "💰",
      color: "bg-green-500",
    },
    {
      title: "Penjualan Bulan Ini",
      value: `Rp ${stats.monthlySales.toLocaleString("id-ID")}`,
      icon: "📈",
      color: "bg-blue-500",
    },
    {
      title: "Order Pending",
      value: stats.pendingOrders,
      icon: "⏳",
      color: "bg-yellow-500",
    },
    {
      title: "Order Success",
      value: stats.successOrders,
      icon: "✅",
      color: "bg-green-500",
    },
    {
      title: "Order Failed",
      value: stats.failedOrders,
      icon: "❌",
      color: "bg-red-500",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: "👥",
      color: "bg-purple-500",
    },
    {
      title: "Total Gamepass",
      value: stats.totalGamepass,
      icon: "🎮",
      color: "bg-indigo-500",
    },
    {
      title: "Payment Methods",
      value: stats.paymentMethods,
      icon: "💳",
      color: "bg-pink-500",
    },
  ];

  const transactionColumns = [
    { key: "invoice", label: "Invoice" },
    { key: "user", label: "User" },
    { key: "product", label: "Product" },
    { key: "amount", label: "Amount" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date" },
  ];

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
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
      <div className="flex items-center justify-center h-96 bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Sales Overview
          </h3>
          <SalesChart />
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Order Status Distribution
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Pending</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-700 rounded-full h-2 mr-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: "30%" }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-white">30%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Success</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-700 rounded-full h-2 mr-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: "60%" }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-white">60%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Failed</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-700 rounded-full h-2 mr-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: "10%" }}
                  ></div>
                </div>
                <span className="text-sm font-semibold text-white">10%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-white">
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
