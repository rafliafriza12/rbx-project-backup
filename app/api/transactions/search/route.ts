import { NextRequest, NextResponse } from "next/server";
import { authenticateToken } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(req: NextRequest) {
  try {
    const user = await authenticateToken(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    await dbConnect();

    // Search transactions by invoice ID or service name
    // Only return paid transactions (settlement)
    const transactions = await Transaction.find({
      "customerInfo.userId": user._id,
    //   paymentStatus: "settlement", // Only show paid transactions
      $or: [
        { invoiceId: { $regex: query, $options: "i" } },
        { serviceName: { $regex: query, $options: "i" } },
      ],
    })
      .select("invoiceId serviceName serviceType totalAmount finalAmount createdAt serviceImage")
      .sort({ createdAt: -1 })
      .limit(10); // Limit to 10 results

    return NextResponse.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Error searching transactions:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
