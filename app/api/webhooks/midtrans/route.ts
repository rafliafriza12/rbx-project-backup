import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import ResellerPackage from "@/models/ResellerPackage";
import { midtransService } from "@/lib/midtrans";
import EmailService from "@/lib/email";

// Helper to activate Reseller Package
async function activateResellerPackage(transaction: any) {
  try {
    if (!transaction.customerInfo?.userId || !transaction.serviceId) {
      console.log(`[Midtrans Webhook] Missing userId or serviceId for reseller activation (Invoice: ${transaction.invoiceId})`);
      return null;
    }

    const user = await User.findById(transaction.customerInfo.userId);
    if (!user) {
      console.log(`[Midtrans Webhook] User not found for reseller activation (UserId: ${transaction.customerInfo.userId})`);
      return null;
    }

    const resellerPackage = await ResellerPackage.findById(transaction.serviceId);
    if (!resellerPackage) {
      console.log(`[Midtrans Webhook] Reseller package not found: ${transaction.serviceId}`);
      return null;
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + resellerPackage.duration);

    user.resellerTier = resellerPackage.tier;
    user.resellerExpiry = expiryDate;
    user.resellerPackageId = resellerPackage._id;
    await user.save();

    console.log(`[Midtrans Webhook] ✅ Reseller activated for user ${user.email}: Tier ${resellerPackage.tier}`);
    return true;
  } catch (error) {
    console.error("[Midtrans Webhook] Error in activateResellerPackage:", error);
    return null;
  }
}

// Helper to activate Coin Top Up
async function activateCoinTopup(transaction: any) {
  try {
    console.log(`[Midtrans Webhook] Starting coin activation for Invoice: ${transaction.invoiceId}`);
    
    if (!transaction.customerInfo?.userId) {
      console.log(`[Midtrans Webhook] ❌ Missing customerInfo.userId for coin top up (Invoice: ${transaction.invoiceId})`);
      return null;
    }

    if (!transaction.coinDetails?.totalCoins) {
      console.log(`[Midtrans Webhook] ❌ Missing coinDetails.totalCoins (Invoice: ${transaction.invoiceId})`, transaction.coinDetails);
      return null;
    }

    if (transaction.coinDetails.isAdded) {
      console.log(`[Midtrans Webhook] ℹ️ Coins already added to user for Invoice ${transaction.invoiceId}, skipping.`);
      return true;
    }

    const user = await User.findById(transaction.customerInfo.userId);
    if (!user) {
      console.log(`[Midtrans Webhook] ❌ User not found for coin top up (UserId: ${transaction.customerInfo.userId})`);
      return null;
    }

    const previousBalance = user.balance || 0;
    user.balance = previousBalance + transaction.coinDetails.totalCoins;
    await user.save();

    transaction.coinDetails.isAdded = true;
    await transaction.save();

    console.log(`[Midtrans Webhook] ✅ SUCCESS: Added ${transaction.coinDetails.totalCoins} coins to user ${user.email}. Previous: ${previousBalance}, New: ${user.balance}`);
    return true;
  } catch (error) {
    console.error("[Midtrans Webhook] ❌ Error in activateCoinTopup:", error);
    return null;
  }
}

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
      const isValidSignature =
        await midtransService.verifyNotificationSignature(
          order_id,
          status_code,
          gross_amount,
          signature_key,
        );

      if (!isValidSignature) {
        console.error("Invalid signature:", { order_id, signature_key });
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    // CRITICAL FIX: Find ALL transactions with this masterOrderId
    // For multi-item checkout, there can be multiple transactions with same order_id
    const transactions = await Transaction.find({
      midtransOrderId: order_id,
    });

    if (!transactions || transactions.length === 0) {
      console.error("Transaction not found:", order_id);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    console.log(
      `Found ${transactions.length} transaction(s) for order_id: ${order_id}`,
    );

    // Map Midtrans status to internal status
    const statusMapping = midtransService.mapMidtransStatus(
      transaction_status,
      fraud_status,
    );

    console.log("Status mapping:", {
      midtransStatus: transaction_status,
      fraudStatus: fraud_status,
      mapped: statusMapping,
    });

    // Update ALL transactions with same masterOrderId
    const updatedTransactions = [];

    for (const transaction of transactions) {
      const oldPaymentStatus = transaction.paymentStatus;
      const oldOrderStatus = transaction.orderStatus;

      let finalOrderStatus = statusMapping.orderStatus;
      let orderNote = `Auto-updated from payment status change`;

      // Khusus RBX5: setelah bayar, masuk ke pending dengan catatan
      if (statusMapping.paymentStatus === "settlement" && transaction.serviceCategory === "robux_5_hari") {
        finalOrderStatus = "pending";
        orderNote = "Pesanan sedang diproses admin";
      } else if (statusMapping.paymentStatus === "settlement" && transaction.serviceType === "coin_topup") {
        finalOrderStatus = "completed";
        orderNote = "Pesanan selesai dan credits berhasil ditambahkan ke akun";
      }

      transaction.paymentStatus = statusMapping.paymentStatus;
      transaction.orderStatus = finalOrderStatus;

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
      if (oldOrderStatus !== finalOrderStatus) {
        transaction.statusHistory.push({
          status: `order:${finalOrderStatus}`,
          timestamp: new Date(),
          notes: orderNote,
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

      updatedTransactions.push({
        invoiceId: transaction.invoiceId,
        oldStatus: { payment: oldPaymentStatus, order: oldOrderStatus },
        newStatus: {
          payment: statusMapping.paymentStatus,
          order: statusMapping.orderStatus,
        },
      });

      console.log("Transaction updated:", {
        invoiceId: transaction.invoiceId,
        oldStatus: { payment: oldPaymentStatus, order: oldOrderStatus },
        newStatus: {
          payment: statusMapping.paymentStatus,
          order: statusMapping.orderStatus,
        },
      });
    }

    // Send email notification if payment is successful
    // Only send once for the first transaction in the group
    if (
      statusMapping.paymentStatus === "settlement" &&
      transactions.length > 0
    ) {
      // Process fulfillment (Reseller, Coins, etc.)
      for (const transaction of transactions) {
          // Activate reseller if this is a reseller package purchase
          if (transaction.serviceType === "reseller") {
            await activateResellerPackage(transaction);
          }

          // Activate Coin Top Up if this is a coin purchase
          if (transaction.serviceType === "coin_topup") {
            await activateCoinTopup(transaction);
          }
        }

        // Send email notification if payment is successful
        // Only send once for the first transaction in the group if it just became settlement
        const firstTransaction = transactions[0];
        const wasAlreadySettled = updatedTransactions[0].oldStatus.payment === "settlement";
        
        if (!wasAlreadySettled) {
          try {
            if (firstTransaction.customerInfo?.email) {
              await EmailService.sendInvoiceEmail(firstTransaction);
              console.log(
                "Payment confirmation email sent to:",
                firstTransaction.customerInfo.email,
              );
            } else {
              console.log("No customer email found for transaction:", order_id);
            }
          } catch (emailError) {
            console.error(
              "Failed to send payment confirmation email:",
              emailError,
            );
            // Don't fail the webhook for email errors
          }
        }
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        totalTransactions: transactions.length,
        transactions: updatedTransactions,
      },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
