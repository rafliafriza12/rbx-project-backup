import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import MidtransService from "@/lib/midtrans";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const transaction = await Transaction.findById(params.id);
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    // Only allow retry for failed payments
    if (transaction.paymentStatus !== "failed") {
      return NextResponse.json(
        { error: "Hanya transaksi yang gagal yang dapat dicoba ulang" },
        { status: 400 }
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
      data: transaction,
    });
  } catch (error) {
    console.error("Retry payment error:", error);
    return NextResponse.json(
      { error: "Gagal membuat ulang pembayaran" },
      { status: 500 }
    );
  }
}
