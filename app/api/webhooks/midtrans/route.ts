import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import ResellerPackage from "@/models/ResellerPackage";
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
      const firstTransaction = transactions[0];
      const wasAlreadySettled =
        updatedTransactions[0].oldStatus.payment === "settlement";

      if (!wasAlreadySettled) {
        // Activate reseller if this is a reseller package purchase
        for (const transaction of transactions) {
          if (transaction.serviceType === "reseller" && transaction.customerInfo?.userId) {
            try {
              const user = await User.findById(transaction.customerInfo.userId);
              if (user && transaction.serviceId) {
                const resellerPackage = await ResellerPackage.findById(
                  transaction.serviceId,
                );

                if (resellerPackage) {
                  // Calculate expiry date
                  const expiryDate = new Date();
                  expiryDate.setMonth(
                    expiryDate.getMonth() + resellerPackage.duration,
                  );

                  // Update user with reseller info
                  user.resellerTier = resellerPackage.tier;
                  user.resellerExpiry = expiryDate;
                  user.resellerPackageId = resellerPackage._id;
                  await user.save();

                  console.log(
                    `Reseller activated for user ${user.email}: Tier ${resellerPackage.tier}, Expires: ${expiryDate}`,
                  );
                }
              }
            } catch (resellerError) {
              console.error("Failed to activate reseller:", resellerError);
              // Don't fail the webhook for reseller activation errors
            }
          }

          // Activate Coin Top Up if this is a coin purchase
          if (transaction.serviceType === "coin_topup" && transaction.customerInfo?.userId) {
            try {
              const user = await User.findById(transaction.customerInfo.userId);
              if (user && transaction.coinDetails?.totalCoins) {
                if (transaction.coinDetails.isAdded) {
                  console.log("Coins already added to user, skipping.");
                } else {
                  user.balance = (user.balance || 0) + transaction.coinDetails.totalCoins;
                  await user.save();
                  
                  transaction.coinDetails.isAdded = true;
                  await transaction.save();
                  
                  console.log(`Added ${transaction.coinDetails.totalCoins} coins to user ${user.email}. New balance: ${user.balance}`);
                }
              }
            } catch (coinError) {
              console.error("Failed to add coins:", coinError);
              // Don't fail the webhook for coin activation errors
            }
          }
        }

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
