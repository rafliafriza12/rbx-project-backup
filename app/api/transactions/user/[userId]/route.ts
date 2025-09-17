import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();

    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    // Cari transaksi berdasarkan customerInfo.userId
    const transactions = await Transaction.find({
      "customerInfo.userId": userId,
    })
      .sort({ createdAt: -1 }) // Sort by newest first
      .exec();

    // Transform data untuk frontend
    const transformedTransactions = transactions.map((transaction) => ({
      _id: transaction._id.toString(),
      userId: transaction.userId?.toString() || null,
      serviceType: transaction.serviceType,
      serviceId: transaction.serviceId.toString(),
      serviceName: transaction.serviceName,
      serviceImage: transaction.serviceImage || "",
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      totalAmount: transaction.totalAmount,
      // Discount fields
      discountPercentage: transaction.discountPercentage || 0,
      discountAmount: transaction.discountAmount || 0,
      finalAmount: transaction.finalAmount || transaction.totalAmount,
      robloxUsername: transaction.robloxUsername,
      robloxPassword: transaction.robloxPassword,
      jokiDetails: transaction.jokiDetails || {},
      paymentStatus: transaction.paymentStatus,
      orderStatus: transaction.orderStatus,
      customerInfo: transaction.customerInfo || {},
      adminNotes: transaction.adminNotes || "",
      invoiceId: transaction.invoiceId,
      statusHistory: transaction.statusHistory.map((history: any) => ({
        status: history.status,
        updatedAt: history.timestamp || history.updatedAt,
        updatedBy: history.updatedBy || "system",
        notes: history.notes || "",
      })),
      expiresAt: transaction.expiresAt,
      midtransOrderId: transaction.midtransOrderId,
      midtransTransactionId: transaction.midtransTransactionId,
      snapToken: transaction.snapToken,
      redirectUrl: transaction.redirectUrl,
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
      { status: 500 }
    );
  }
}
