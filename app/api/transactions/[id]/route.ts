import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
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
    }).populate("customerInfo.userId", "username email");

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

    // Store old status untuk comparison
    const oldPaymentStatus = transaction.paymentStatus;
    const oldOrderStatus = transaction.orderStatus;

    // Debug: Log transaction structure
    console.log("Transaction structure:", {
      _id: transaction._id,
      customerInfo: transaction.customerInfo,
      hasUserId: !!transaction.customerInfo?.userId,
    });

    // Update status menggunakan method
    await transaction.updateStatus(statusType, newStatus, notes, updatedBy);
    console.log("halooo");

    // Debug: Check all conditions for spendedMoney update
    console.log("=== Debug spendedMoney update conditions ===");
    console.log("statusType:", statusType);
    console.log("newStatus:", newStatus);
    console.log("oldPaymentStatus:", oldPaymentStatus);
    console.log(
      "transaction.customerInfo?.userId:",
      transaction.customerInfo?.userId
    );
    console.log("statusType === 'payment':", statusType === "payment");
    console.log("newStatus === 'settlement':", newStatus === "settlement");
    console.log(
      "oldPaymentStatus !== 'settlement':",
      oldPaymentStatus !== "settlement"
    );
    console.log(
      "!!transaction.customerInfo?.userId:",
      !!transaction.customerInfo?.userId
    );

    // Jika payment status berubah menjadi settlement dan transaksi memiliki userId
    if (
      statusType === "payment" &&
      newStatus === "settlement" &&
      oldPaymentStatus !== "settlement" &&
      transaction.customerInfo?.userId
    ) {
      console.log("halooo 1");
      console.log("Entering spendedMoney update logic");
      try {
        // Update spendedMoney user
        const user = await User.findById(transaction.customerInfo.userId);
        if (user) {
          // Gunakan finalAmount, fallback ke totalAmount untuk safety
          const amountToAdd =
            transaction.finalAmount || transaction.totalAmount;
          console.log("finalAmount:", transaction.finalAmount);
          console.log("totalAmount:", transaction.totalAmount);
          console.log("amount to add : ", amountToAdd);
          user.spendedMoney += amountToAdd;
          await user.save();

          console.log(
            `Updated spendedMoney for user ${user.email}: +${amountToAdd} (total: ${user.spendedMoney})`
          );
        } else {
          console.log(
            "User not found with ID:",
            transaction.customerInfo.userId
          );
        }
      } catch (userUpdateError) {
        console.error("Error updating user spendedMoney:", userUpdateError);
        // Don't fail the transaction update if user update fails
      }
    }

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
