import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Gamepass from "@/models/Gamepass";
import Settings from "@/models/Settings";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    // Get month's date range
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Get last 7 days range for sales chart
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Parallel database queries for better performance
    const [
      todaySales,
      monthlySales,
      pendingOrders,
      successOrders,
      failedOrders,
      totalUsers,
      totalGamepass,
      proccessOrders,
      recentTransactions,
      salesChartData,
    ] = await Promise.all([
      // Today's sales (settlement transactions only)
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfDay, $lt: endOfDay },
            paymentStatus: "settlement",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$finalAmount" },
          },
        },
      ]),

      // Monthly sales (settlement transactions only)
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth, $lt: endOfMonth },
            paymentStatus: "settlement",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$finalAmount" },
          },
        },
      ]),

      // Pending orders count (waiting for payment)
      Transaction.countDocuments({
        orderStatus: { $in: ["waiting_payment", "pending"] },
      }),

      // Success orders count (payment settled)
      Transaction.countDocuments({ orderStatus: "completed" }),

      // Failed orders count (payment failed/expired/cancelled)
      Transaction.countDocuments({
        orderStatus: { $in: ["failed", "cancelled"] },
      }),

      // Total users count
      User.countDocuments({ accessRole: "user" }),

      // Total gamepass count
      Gamepass.countDocuments(),

      // Process orders count (processing/in_progress orders)
      Transaction.countDocuments({
        orderStatus: { $in: ["processing", "in_progress"] },
      }),

      // Recent transactions (last 10)
      Transaction.find()
        .populate("customerInfo.userId", "username email")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // Sales chart data (last 7 days)
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: last7Days },
            paymentStatus: "settlement",
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
              },
            },
            sales: { $sum: "$finalAmount" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]),
    ]);

    // Process results
    const stats = {
      todaySales: todaySales[0]?.total || 0,
      monthlySales: monthlySales[0]?.total || 0,
      pendingOrders,
      successOrders,
      failedOrders,
      totalUsers,
      totalGamepass,
      proccessOrders,
    };

    // Process sales chart data - create complete 7 days array
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = date.toISOString().split("T")[0];
      const dayName = date.toLocaleDateString("id-ID", { weekday: "short" });

      const salesData = salesChartData.find(
        (item: any) => item._id === dateString
      );

      chartData.push({
        day: dayName,
        date: dateString,
        sales: salesData?.sales || 0,
        transactions: salesData?.count || 0,
      });
    }

    // Format recent transactions for the table
    const formattedTransactions = recentTransactions.map(
      (transaction: any) => ({
        id: transaction._id,
        invoice:
          transaction.invoiceId ||
          `TXN-${transaction._id.toString().slice(-8)}`,
        user:
          transaction.customerInfo?.userId?.username ||
          transaction.customerInfo?.name ||
          "Guest",
        product: getProductName(transaction),
        amount: `Rp ${(transaction.finalAmount || 0).toLocaleString("id-ID")}`,
        status: transaction.paymentStatus || "pending",
        date: new Date(transaction.createdAt).toLocaleDateString("id-ID"),
        createdAt: transaction.createdAt,
      })
    );

    return NextResponse.json({
      success: true,
      stats,
      recentTransactions: formattedTransactions,
      salesChartData: chartData,
    });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to get product name based on service type
function getProductName(transaction: any): string {
  // Menggunakan serviceName jika tersedia
  if (transaction.serviceName) {
    return transaction.serviceName;
  }

  // Fallback berdasarkan serviceType
  if (transaction.serviceType === "gamepass") {
    return "Gamepass";
  } else if (transaction.serviceType === "joki") {
    return "Joki Service";
  } else if (transaction.serviceType === "robux") {
    if (transaction.serviceCategory === "robux_5_hari") {
      return "Robux 5 Hari";
    } else if (transaction.serviceCategory === "robux_instant") {
      return "Robux Instant";
    }
    return "Robux";
  }
  return "Unknown Service";
}
