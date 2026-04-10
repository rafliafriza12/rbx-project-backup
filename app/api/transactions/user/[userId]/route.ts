import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { authenticateToken, requireApiKey } from "@/lib/auth";
import { maskEmail, maskUsername, maskName } from "@/lib/mask";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  const apiKeyError = requireApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    await dbConnect();

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 },
      );
    }

    // Verify user is authenticated and requesting their own data
    let currentUser: any;
    try {
      currentUser = await authenticateToken(request);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      currentUser._id.toString() !== userId &&
      currentUser.accessRole !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cari transaksi berdasarkan customerInfo.userId
    const transactions = await Transaction.find({
      "customerInfo.userId": userId,
    })
      .sort({ createdAt: -1 }) // Sort by newest first
      .exec();

    // Transform data - strip sensitive fields
    const transformedTransactions = transactions.map((transaction) => ({
      _id: transaction._id.toString(),
      serviceType: transaction.serviceType,
      serviceId: transaction.serviceId.toString(),
      serviceName: transaction.serviceName,
      serviceImage: transaction.serviceImage || "",
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      totalAmount: transaction.totalAmount,
      discountPercentage: transaction.discountPercentage || 0,
      discountAmount: transaction.discountAmount || 0,
      finalAmount: transaction.finalAmount || transaction.totalAmount,
      robloxUsername: maskUsername(transaction.robloxUsername),
      // REMOVED: robloxPassword
      gamepass: transaction.gamepass || {},
      gamepassDetails: transaction.gamepassDetails || {},
      paymentStatus: transaction.paymentStatus,
      orderStatus: transaction.orderStatus,
      paymentMethodName: transaction.paymentMethodName || null,
      paymentFee: transaction.paymentFee || 0,
      customerInfo: {
        name: maskName(transaction.customerInfo?.name || ""),
        email: maskEmail(transaction.customerInfo?.email || ""),
      },
      // REMOVED: adminNotes
      invoiceId: transaction.invoiceId,
      statusHistory: (transaction.statusHistory || []).map((history: any) => ({
        status: history.status,
        updatedAt: history.timestamp || history.updatedAt,
        notes: history.notes || "",
        // REMOVED: updatedBy
      })),
      expiresAt: transaction.expiresAt,
      // REMOVED: midtransOrderId, midtransTransactionId, snapToken, redirectUrl
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      paidAt: transaction.paidAt,
      completedAt: transaction.completedAt,
    }));

    return NextResponse.json({
      success: true,
      data: transformedTransactions,
      message: `Ditemukan ${transformedTransactions.length} transaksi`,
    });
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return NextResponse.json(
      {
        error: "Gagal mengambil data transaksi",
        message: "Terjadi kesalahan server, coba lagi nanti",
      },
      { status: 500 },
    );
  }
}
