import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import MidtransService from "@/lib/midtrans";

// GET - Get transaction by ID atau invoice ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const transactionId = id;

    // Cari berdasarkan MongoDB ID atau invoice ID
    const transaction = await Transaction.findOne({
      $or: [
        { _id: transactionId },
        { invoiceId: transactionId },
        { midtransOrderId: transactionId },
      ],
    }).populate("userId", "username email");

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

// PUT - Update transaction status (untuk admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const transactionId = id;
    const body = await request.json();
    const { statusType, newStatus, notes, updatedBy } = body;

    // Validasi input
    if (!statusType || !newStatus) {
      return NextResponse.json(
        { error: "Status type and new status are required" },
        { status: 400 }
      );
    }

    if (!["payment", "order"].includes(statusType)) {
      return NextResponse.json(
        { error: "Invalid status type. Must be 'payment' or 'order'" },
        { status: 400 }
      );
    }

    // Cari transaksi
    const transaction = await Transaction.findOne({
      $or: [
        { _id: transactionId },
        { invoiceId: transactionId },
        { midtransOrderId: transactionId },
      ],
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update status menggunakan method
    await transaction.updateStatus(statusType, newStatus, notes, updatedBy);

    return NextResponse.json({
      success: true,
      data: transaction,
      message: `${statusType} status updated to ${newStatus}`,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const transactionId = params.id;

    // Cari transaksi
    const transaction = await Transaction.findOne({
      $or: [
        { _id: transactionId },
        { invoiceId: transactionId },
        { midtransOrderId: transactionId },
      ],
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Cek apakah bisa dibatalkan
    if (transaction.paymentStatus === "settlement") {
      return NextResponse.json(
        { error: "Cannot cancel settlement transaction" },
        { status: 400 }
      );
    }

    // Cancel di Midtrans jika belum expired
    if (transaction.paymentStatus === "pending" && transaction.snapToken) {
      try {
        const midtransService = new MidtransService();
        await midtransService.cancelTransaction(transaction.midtransOrderId);
      } catch (midtransError) {
        console.warn("Failed to cancel in Midtrans:", midtransError);
        // Continue dengan cancel di database meskipun Midtrans gagal
      }
    }

    // Update status
    await transaction.updateStatus(
      "payment",
      "cancelled",
      "Transaction cancelled by user"
    );
    await transaction.updateStatus(
      "order",
      "cancelled",
      "Transaction cancelled by user"
    );

    return NextResponse.json({
      success: true,
      data: transaction,
      message: "Transaction cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling transaction:", error);
    return NextResponse.json(
      { error: "Failed to cancel transaction" },
      { status: 500 }
    );
  }
}
