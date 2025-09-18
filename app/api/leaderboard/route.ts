import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import Role from "@/models/Role";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const filterType = searchParams.get("filterType") || "all";

    const skip = (page - 1) * limit;

    // Build date filter based on filterType
    let dateFilter: any = {};

    if (filterType === "month" && month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else if (filterType === "year" && year) {
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
      dateFilter = {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    // Aggregation pipeline untuk menghitung leaderboard
    const leaderboardPipeline = [
      {
        $match: {
          paymentStatus: "settlement", // Hanya transaksi yang sudah dibayar
          //   orderStatus: "completed", // Hanya pesanan yang selesai
          "customerInfo.userId": { $exists: true, $ne: null }, // Hanya user yang terdaftar
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$customerInfo.userId",
          totalSpent: { $sum: "$finalAmount" },
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
          firstOrderDate: { $min: "$createdAt" },
          avgOrderValue: { $avg: "$finalAmount" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $lookup: {
          from: "roles",
          localField: "userInfo.memberRole",
          foreignField: "_id",
          as: "roleInfo",
        },
      },
      {
        $addFields: {
          roleName: {
            $cond: {
              if: { $gt: [{ $size: "$roleInfo" }, 0] },
              then: { $arrayElemAt: ["$roleInfo.member", 0] },
              else: "Regular",
            },
          },
          discount: {
            $cond: {
              if: { $gt: [{ $size: "$roleInfo" }, 0] },
              then: { $arrayElemAt: ["$roleInfo.diskon", 0] },
              else: 0,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          username: {
            $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"],
          },
          email: "$userInfo.email",
          totalSpent: 1,
          totalOrders: 1,
          lastOrderDate: 1,
          firstOrderDate: 1,
          avgOrderValue: 1,
          roleName: 1,
          discount: 1,
          spendedMoney: "$userInfo.spendedMoney",
          isVerified: "$userInfo.isVerified",
        },
      },
      {
        $sort: { totalSpent: -1 }, // Sort by total spent descending
      },
    ];

    // Get total count for pagination
    const totalPipeline = [...leaderboardPipeline, { $count: "total" }];
    const totalResult = await Transaction.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    // Get paginated results with ranking
    const dataPipeline = [
      ...leaderboardPipeline,
      { $skip: skip },
      { $limit: limit },
      {
        $addFields: {
          rank: {
            $add: [skip, { $indexOfArray: [{ $range: [0, limit] }, "$$ROOT"] }],
          },
        },
      },
    ];

    const leaderboardData = await Transaction.aggregate(dataPipeline);

    // Add rank to each entry based on their position
    const rankedData = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: skip + index + 1,
    }));

    // Get additional statistics
    const statsResult = await Transaction.aggregate([
      {
        $match: {
          paymentStatus: "settlement",
          orderStatus: "completed",
          "customerInfo.userId": { $exists: true, $ne: null },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmount" },
          totalTransactions: { $sum: 1 },
          avgTransactionValue: { $avg: "$finalAmount" },
          uniqueCustomers: { $addToSet: "$customerInfo.userId" },
        },
      },
      {
        $addFields: {
          uniqueCustomerCount: { $size: "$uniqueCustomers" },
        },
      },
    ]);

    const stats = statsResult[0] || {
      totalRevenue: 0,
      totalTransactions: 0,
      avgTransactionValue: 0,
      uniqueCustomerCount: 0,
    };

    // Get Premium Members count (members with roles other than "Regular")
    const premiumCount = rankedData.filter(
      (entry) => entry.roleName && entry.roleName !== "Regular"
    ).length;

    return NextResponse.json({
      success: true,
      data: rankedData,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      statistics: {
        ...stats,
        vipMembers: premiumCount,
        regularMembers: rankedData.length - premiumCount,
      },
      filters: {
        filterType,
        month,
        year,
      },
    });
  } catch (error: any) {
    console.error("Leaderboard API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data leaderboard",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// GET endpoint untuk top spender (untuk homepage atau widget)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { limit = 5, period = "all" } = await request.json();

    let dateFilter: any = {};

    if (period === "month") {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      dateFilter = {
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      };
    } else if (period === "week") {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      endOfWeek.setHours(23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          $gte: startOfWeek,
          $lte: endOfWeek,
        },
      };
    }

    const topSpenders = await Transaction.aggregate([
      {
        $match: {
          paymentStatus: "settlement",
          orderStatus: "completed",
          "customerInfo.userId": { $exists: true, $ne: null },
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: "$customerInfo.userId",
          totalSpent: { $sum: "$finalAmount" },
          totalOrders: { $sum: 1 },
          lastOrderDate: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      {
        $unwind: "$userInfo",
      },
      {
        $lookup: {
          from: "roles",
          localField: "userInfo.memberRole",
          foreignField: "_id",
          as: "roleInfo",
        },
      },
      {
        $addFields: {
          roleName: {
            $cond: {
              if: { $gt: [{ $size: "$roleInfo" }, 0] },
              then: { $arrayElemAt: ["$roleInfo.member", 0] },
              else: "Regular",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          username: {
            $concat: ["$userInfo.firstName", " ", "$userInfo.lastName"],
          },
          totalSpent: 1,
          totalOrders: 1,
          lastOrderDate: 1,
          roleName: 1,
        },
      },
      {
        $sort: { totalSpent: -1 },
      },
      {
        $limit: parseInt(limit),
      },
    ]);

    const rankedTopSpenders = topSpenders.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      data: rankedTopSpenders,
      period,
      total: rankedTopSpenders.length,
    });
  } catch (error: any) {
    console.error("Top Spenders API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data top spenders",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
