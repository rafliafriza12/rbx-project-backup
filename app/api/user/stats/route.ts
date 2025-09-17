import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get user ID from query params
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 }
      );
    }

    // Get user transactions using customerInfo.userId
    const userTransactions = await Transaction.find({
      "customerInfo.userId": userId,
    }).sort({ createdAt: -1 });

    // Calculate statistics
    const totalOrders = userTransactions.length;
    const pendingOrders = userTransactions.filter(
      (t) =>
        t.orderStatus === "waiting_payment" || t.orderStatus === "processing"
    ).length;
    const completedOrders = userTransactions.filter(
      (t) => t.orderStatus === "completed"
    ).length;
    const cancelledOrders = userTransactions.filter(
      (t) => t.orderStatus === "cancelled" || t.orderStatus === "failed"
    ).length;

    // Service breakdown
    const serviceBreakdown = userTransactions.reduce((acc, transaction) => {
      const service = transaction.serviceType;
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find most used service
    const favoriteService =
      Object.entries(serviceBreakdown).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || "robux";

    // Monthly spending (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const recentTransactions = userTransactions.filter(
      (t) =>
        new Date(t.createdAt) >= sixMonthsAgo &&
        t.paymentStatus === "settlement"
    );

    const monthlySpending = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      const monthName = month.toLocaleDateString("id-ID", { month: "short" });

      const monthTransactions = recentTransactions.filter((t) => {
        const transactionDate = new Date(t.createdAt);
        return (
          transactionDate.getMonth() === month.getMonth() &&
          transactionDate.getFullYear() === month.getFullYear()
        );
      });

      const totalAmount = monthTransactions.reduce(
        (sum, t) => sum + t.totalAmount,
        0
      );
      monthlySpending.push({ month: monthName, amount: totalAmount });
    }

    // Recent activity (last 5 transactions)
    const recentActivity = userTransactions.slice(0, 5).map((transaction) => ({
      id: transaction._id.toString(),
      action: `${
        transaction.serviceType === "robux"
          ? "Membeli Robux"
          : transaction.serviceType === "gamepass"
          ? "Membeli Gamepass"
          : "Joki Level Up"
      } - ${transaction.serviceName}`,
      date: transaction.createdAt,
      amount: transaction.totalAmount,
      status: transaction.orderStatus,
      paymentStatus: transaction.paymentStatus,
    }));

    const stats = {
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      favoriteService,
      monthlySpending,
      serviceBreakdown,
      recentActivity,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user statistics",
      },
      { status: 500 }
    );
  }
}
