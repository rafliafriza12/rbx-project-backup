import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import MidtransService from "@/lib/midtrans";
import { authenticateToken, requireAdmin, requireApiKey } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const apiKeyError = requireApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    await connectDB();
    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    // Verify user is authenticated
    let currentUser: any;
    try {
      currentUser = await authenticateToken(request);
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 },
      );
    }

    // Verify ownership (user can only retry their own transactions)
    const txUserId = transaction.customerInfo?.userId?.toString();
    if (
      txUserId &&
      currentUser._id.toString() !== txUserId &&
      currentUser.accessRole !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow retry for failed payments
    if (transaction.paymentStatus !== "failed") {
      return NextResponse.json(
        { error: "Hanya transaksi yang gagal yang dapat dicoba ulang" },
        { status: 400 },
      );
    }

    const midtransService = new MidtransService();

    // Create new Snap transaction with same details
    const snapTransaction = await midtransService.createSnapTransaction({
      orderId: transaction.midtransOrderId,
      amount: transaction.totalAmount,
      customer: {
        first_name:
          transaction.customerInfo?.name || transaction.robloxUsername,
        email: transaction.customerInfo?.email || "",
        phone: transaction.customerInfo?.phone || "",
      },
      items: [
        {
          id: transaction.serviceId.toString(),
          name: transaction.serviceName,
          price: Math.floor(transaction.totalAmount / transaction.quantity),
          quantity: transaction.quantity,
          brand: "RBX Store",
          category: transaction.serviceType,
        },
      ],
    });

    // Update transaction status back to pending
    transaction.paymentStatus = "pending";
    transaction.orderStatus = "waiting_payment";
    transaction.statusHistory.push({
      status: "pending",
      timestamp: new Date(),
      note: "Payment retry initiated",
    });

    await transaction.save();

    return NextResponse.json({
      success: true,
      snapToken: snapTransaction.token,
      data: {
        _id: transaction._id.toString(),
        invoiceId: transaction.invoiceId,
        paymentStatus: transaction.paymentStatus,
        orderStatus: transaction.orderStatus,
      },
    });
  } catch (error) {
    console.error("Retry payment error:", error);
    return NextResponse.json(
      { error: "Gagal membuat ulang pembayaran" },
      { status: 500 },
    );
  }
}
