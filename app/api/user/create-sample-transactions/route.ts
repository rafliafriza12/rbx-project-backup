import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Get user ID from request body
    const { userEmail } = await request.json();

    let user;
    if (userEmail) {
      user = await User.findOne({ email: userEmail });
    } else {
      // Get first user if no email provided
      user = await User.findOne({});
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 }
      );
    }

    // Check if transactions already exist for this user
    const existingTransactions = await Transaction.countDocuments({
      "customerInfo.userId": user._id,
    });

    if (existingTransactions > 0) {
      return NextResponse.json({
        success: true,
        message: `User already has ${existingTransactions} transactions`,
        data: {
          userId: user._id,
          userEmail: user.email,
          existingTransactions,
        },
      });
    }

    // Create sample transactions
    const sampleTransactions = [
      {
        serviceType: "robux",
        serviceId: "robux_1000",
        serviceName: "Robux 1000",
        serviceImage: "/robux.png",
        quantity: 1,
        unitPrice: 50000,
        totalAmount: 50000,
        robloxUsername: "TestUser123",
        paymentStatus: "settlement",
        orderStatus: "completed",
        customerInfo: {
          userId: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
        },
        paidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      },
      {
        serviceType: "gamepass",
        serviceId: "gamepass_premium",
        serviceName: "Premium Gamepass",
        serviceImage: "/gamepass1.png",
        quantity: 1,
        unitPrice: 75000,
        totalAmount: 75000,
        robloxUsername: "TestUser123",
        paymentStatus: "settlement",
        orderStatus: "completed",
        customerInfo: {
          userId: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
        },
        paidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        completedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000), // 13 days ago
      },
      {
        serviceType: "joki",
        serviceId: "joki_levelup",
        serviceName: "Level Up Service",
        serviceImage: "/joki1.png",
        quantity: 1,
        unitPrice: 100000,
        totalAmount: 100000,
        robloxUsername: "TestUser123",
        robloxPassword: "encrypted_password",
        jokiDetails: {
          description: "Level up character to level 50",
          gameType: "Simulator",
          targetLevel: "50",
          estimatedTime: "2-3 days",
          notes: "Please level up safely",
        },
        paymentStatus: "settlement",
        orderStatus: "completed",
        customerInfo: {
          userId: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
        },
        paidAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
        completedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
      },
      {
        serviceType: "robux",
        serviceId: "robux_2500",
        serviceName: "Robux 2500",
        serviceImage: "/robux.png",
        quantity: 1,
        unitPrice: 125000,
        totalAmount: 125000,
        robloxUsername: "TestUser123",
        paymentStatus: "settlement",
        orderStatus: "processing",
        customerInfo: {
          userId: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
        },
        paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      },
      {
        serviceType: "gamepass",
        serviceId: "gamepass_vip",
        serviceName: "VIP Gamepass",
        serviceImage: "/gamepass2.png",
        quantity: 1,
        unitPrice: 150000,
        totalAmount: 150000,
        robloxUsername: "TestUser123",
        paymentStatus: "pending",
        orderStatus: "waiting_payment",
        customerInfo: {
          userId: user._id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          phone: user.phone,
        },
      },
    ];

    // Insert transactions
    const transactions = await Transaction.insertMany(sampleTransactions);

    return NextResponse.json({
      success: true,
      message: "Sample transactions created successfully",
      data: {
        userId: user._id,
        userEmail: user.email,
        transactionsCreated: transactions.length,
        transactions: transactions.map((t) => ({
          id: t._id,
          service: t.serviceName,
          amount: t.totalAmount,
          status: t.orderStatus,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error creating sample transactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create sample transactions",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
