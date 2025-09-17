import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import MidtransService from "@/lib/midtrans";

// POST - Handle Midtrans webhook notification
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    const {
      order_id,
      transaction_status,
      status_code,
      gross_amount,
      signature_key,
      fraud_status,
      payment_type,
      transaction_id,
    } = body;

    console.log("Midtrans Webhook received:", {
      order_id,
      transaction_status,
      status_code,
      payment_type,
    });

    // Verifikasi signature
    const midtransService = new MidtransService();
    if (
      !midtransService.verifyNotificationSignature(
        order_id,
        status_code,
        gross_amount,
        signature_key
      )
    ) {
      console.error("Invalid signature from Midtrans webhook");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Cari transaksi berdasarkan Midtrans order ID
    const transaction = await Transaction.findOne({
      midtransOrderId: order_id,
    });

    if (!transaction) {
      console.error("Transaction not found for order_id:", order_id);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update transaction ID dari Midtrans
    if (transaction_id && !transaction.midtransTransactionId) {
      transaction.midtransTransactionId = transaction_id;
    }

    // Map status Midtrans ke status aplikasi
    const statusMapping = midtransService.mapMidtransStatus(
      transaction_status,
      payment_type
    );
    const previousPaymentStatus = transaction.paymentStatus;
    const previousOrderStatus = transaction.orderStatus;

    // Update payment status jika berubah
    if (transaction.paymentStatus !== statusMapping.paymentStatus) {
      await transaction.updateStatus(
        "payment",
        statusMapping.paymentStatus,
        `Payment ${transaction_status} via ${payment_type}. Midtrans Transaction ID: ${transaction_id}`,
        null
      );

      // Jika payment status berubah menjadi settlement dan transaksi memiliki userId
      if (
        statusMapping.paymentStatus === "settlement" &&
        previousPaymentStatus !== "settlement" &&
        transaction.customerInfo?.userId
      ) {
        try {
          // Update spendedMoney user
          const user = await User.findById(transaction.customerInfo.userId);
          if (user) {
            // Gunakan finalAmount, fallback ke totalAmount untuk safety
            const amountToAdd =
              transaction.finalAmount || transaction.totalAmount;
            user.spendedMoney += amountToAdd;
            await user.save();

            console.log(
              `Updated spendedMoney for user ${user.email}: +${amountToAdd} (total: ${user.spendedMoney})`
            );
          }
        } catch (userUpdateError) {
          console.error("Error updating user spendedMoney:", userUpdateError);
          // Don't fail the webhook if user update fails
        }
      }
    }

    // Update order status jika berubah dan sesuai kondisi
    if (transaction.orderStatus !== statusMapping.orderStatus) {
      // Hanya update order status jika payment status memungkinkan
      const allowedOrderStatusUpdates: { [key: string]: string[] } = {
        waiting_payment: ["processing", "cancelled"],
        processing: ["in_progress", "completed", "cancelled"],
        in_progress: ["completed", "cancelled"],
      };

      const currentOrderStatus = transaction.orderStatus;
      const allowedStatuses =
        allowedOrderStatusUpdates[currentOrderStatus] || [];

      if (allowedStatuses.includes(statusMapping.orderStatus)) {
        await transaction.updateStatus(
          "order",
          statusMapping.orderStatus,
          `Order status updated based on payment ${transaction_status}`,
          null
        );
      }
    }

    // Log webhook untuk debugging
    console.log("Transaction updated:", {
      invoiceId: transaction.invoiceId,
      previousPaymentStatus,
      newPaymentStatus: transaction.paymentStatus,
      previousOrderStatus,
      newOrderStatus: transaction.orderStatus,
    });

    // Kirim response sukses ke Midtrans
    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        invoiceId: transaction.invoiceId,
        paymentStatus: transaction.paymentStatus,
        orderStatus: transaction.orderStatus,
      },
    });
  } catch (error) {
    console.error("Error processing Midtrans webhook:", error);

    // Tetap return 200 agar Midtrans tidak retry terus menerus
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
  }
}

// GET - Manual check transaction status (untuk admin)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("order_id");

    if (!orderId) {
      return NextResponse.json(
        { error: "order_id parameter is required" },
        { status: 400 }
      );
    }

    // Get status dari Midtrans
    const midtransService = new MidtransService();
    const midtransStatus = await midtransService.getTransactionStatus(orderId);

    // Cari transaksi di database
    const transaction = await Transaction.findOne({
      midtransOrderId: orderId,
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Map dan update status jika perlu
    const statusMapping = midtransService.mapMidtransStatus(
      midtransStatus.transaction_status,
      midtransStatus.fraud_status
    );

    let updated = false;

    // Update jika status berbeda
    if (transaction.paymentStatus !== statusMapping.paymentStatus) {
      const previousPaymentStatus = transaction.paymentStatus;

      await transaction.updateStatus(
        "payment",
        statusMapping.paymentStatus,
        `Manual status check: ${midtransStatus.transaction_status}`,
        null
      );
      updated = true;

      // Jika payment status berubah menjadi settlement dan transaksi memiliki userId
      if (
        statusMapping.paymentStatus === "settlement" &&
        previousPaymentStatus !== "settlement" &&
        transaction.customerInfo?.userId
      ) {
        try {
          // Update spendedMoney user
          const user = await User.findById(transaction.customerInfo.userId);
          if (user) {
            // Gunakan finalAmount, fallback ke totalAmount untuk safety
            const amountToAdd =
              transaction.finalAmount || transaction.totalAmount;
            user.spendedMoney += amountToAdd;
            await user.save();

            console.log(
              `Updated spendedMoney for user ${user.email}: +${amountToAdd} (total: ${user.spendedMoney})`
            );
          }
        } catch (userUpdateError) {
          console.error("Error updating user spendedMoney:", userUpdateError);
          // Continue execution even if user update fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        transaction,
        midtransStatus,
        updated,
      },
    });
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return NextResponse.json(
      { error: "Failed to check transaction status" },
      { status: 500 }
    );
  }
}
