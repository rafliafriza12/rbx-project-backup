import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { midtransService } from "@/lib/midtrans";
import EmailService from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    console.log("=== MIDTRANS WEBHOOK ===");
    console.log("Received webhook:", body);

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
    } = body;

    // Verify signature for security
    if (signature_key) {
      const isValidSignature = midtransService.verifyNotificationSignature(
        order_id,
        status_code,
        gross_amount,
        signature_key
      );

      if (!isValidSignature) {
        console.error("Invalid signature:", { order_id, signature_key });
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    // Find transaction by Midtrans order ID
    const transaction = await Transaction.findOne({
      midtransOrderId: order_id,
    });

    if (!transaction) {
      console.error("Transaction not found:", order_id);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Map Midtrans status to internal status
    const statusMapping = midtransService.mapMidtransStatus(
      transaction_status,
      fraud_status
    );

    console.log("Status mapping:", {
      midtransStatus: transaction_status,
      fraudStatus: fraud_status,
      mapped: statusMapping,
    });

    // Update transaction status
    const oldPaymentStatus = transaction.paymentStatus;
    const oldOrderStatus = transaction.orderStatus;

    transaction.paymentStatus = statusMapping.paymentStatus;
    transaction.orderStatus = statusMapping.orderStatus;

    // Add to status history with more detailed information
    transaction.statusHistory.push({
      status: `payment:${statusMapping.paymentStatus}`,
      timestamp: new Date(),
      notes: `Midtrans webhook - Status: ${transaction_status}${
        fraud_status ? `, Fraud: ${fraud_status}` : ""
      }${payment_type ? `, Payment: ${payment_type}` : ""}`,
      updatedBy: "system",
    });

    // Also add order status history if it changed
    if (oldOrderStatus !== statusMapping.orderStatus) {
      transaction.statusHistory.push({
        status: `order:${statusMapping.orderStatus}`,
        timestamp: new Date(),
        notes: `Auto-updated from payment status change`,
        updatedBy: "system",
      });
    }

    // Update payment details
    transaction.midtransTransactionId =
      body.transaction_id || transaction.midtransTransactionId;
    transaction.paidAt =
      statusMapping.paymentStatus === "settlement"
        ? new Date()
        : transaction.paidAt;

    // If payment is successful, also complete the transaction date
    if (statusMapping.paymentStatus === "settlement") {
      // Set paidAt if not already set
      if (!transaction.paidAt) {
        transaction.paidAt = new Date();
      }
    }

    await transaction.save();

    console.log("Transaction updated:", {
      orderId: order_id,
      oldStatus: { payment: oldPaymentStatus, order: oldOrderStatus },
      newStatus: {
        payment: statusMapping.paymentStatus,
        order: statusMapping.orderStatus,
      },
    });

    // Send email notification if payment is successful
    if (
      statusMapping.paymentStatus === "settlement" &&
      oldPaymentStatus !== "settlement"
    ) {
      try {
        if (transaction.customerInfo?.email) {
          await EmailService.sendInvoiceEmail(transaction);
          console.log(
            "Payment confirmation email sent to:",
            transaction.customerInfo.email
          );
        } else {
          console.log("No customer email found for transaction:", order_id);
        }
      } catch (emailError) {
        console.error("Failed to send payment confirmation email:", emailError);
        // Don't fail the webhook for email errors
      }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
