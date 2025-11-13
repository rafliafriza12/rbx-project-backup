import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import StockAccount from "@/models/StockAccount";
import ResellerPackage from "@/models/ResellerPackage";
import MidtransService from "@/lib/midtrans";
import EmailService from "@/lib/email";
import { POST as buyPassHandler } from "@/app/api/buy-pass/route";
import { PUT as updateStockAccountHandler } from "@/app/api/admin/stock-accounts/[id]/route";

// Activate reseller package for user after payment settlement
async function activateResellerPackage(transaction: any) {
  try {
    if (!transaction.customerInfo?.userId || !transaction.serviceId) {
      console.log("Missing userId or serviceId for reseller activation");
      return null;
    }

    const user = await User.findById(transaction.customerInfo.userId);
    if (!user) {
      console.log("User not found for reseller activation");
      return null;
    }

    const resellerPackage = await ResellerPackage.findById(
      transaction.serviceId
    );
    if (!resellerPackage) {
      console.log("Reseller package not found:", transaction.serviceId);
      return null;
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + resellerPackage.duration);

    // Update user with reseller info
    const previousTier = user.resellerTier || 0;
    user.resellerTier = resellerPackage.tier;
    user.resellerExpiry = expiryDate;
    user.resellerPackageId = resellerPackage._id;
    await user.save();

    console.log(
      `✅ Reseller activated for user ${user.email}: Tier ${
        resellerPackage.tier
      } (${resellerPackage.name}), Expires: ${expiryDate.toLocaleDateString(
        "id-ID"
      )}`
    );

    return {
      previousTier,
      newTier: resellerPackage.tier,
      packageName: resellerPackage.name,
      discount: resellerPackage.discount,
      expiryDate,
    };
  } catch (error) {
    console.error("Error in activateResellerPackage:", error);
    return null;
  }
}

// Function to process gamepass purchase for robux_5_hari
async function processGamepassPurchase(transaction: any) {
  try {
    console.log(
      "Processing gamepass purchase for transaction:",
      transaction.invoiceId
    );
    console.log("Gamepass data:", transaction.gamepass);

    const gamepassPrice = transaction.gamepass.price;

    // Cari akun yang memiliki robux sama atau lebih dari price gamepass
    const suitableAccount = await StockAccount.findOne({
      robux: { $gte: gamepassPrice },
      status: "active",
    }).sort({ robux: 1 }); // Sort ascending untuk menggunakan akun dengan robux paling sedikit yang mencukupi

    if (!suitableAccount) {
      console.log("No suitable account found for gamepass purchase");
      // Update order status to failed
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null
      );
      return;
    }

    console.log("Suitable account found:", suitableAccount.username);

    // Validate dan update account data terlebih dahulu (using direct import)
    console.log("🔄 Updating stock account data...");
    const updateRequest = new NextRequest(
      `http://localhost:3000/api/admin/stock-accounts/${suitableAccount._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robloxCookie: suitableAccount.robloxCookie,
        }),
      }
    );

    const updateAccountResponse = await updateStockAccountHandler(
      updateRequest,
      { params: Promise.resolve({ id: suitableAccount._id.toString() }) }
    );

    if (!updateAccountResponse.ok) {
      console.error("Failed to update account data");
      await transaction.updateStatus(
        "order",
        "pending",
        "Pesanan sedang diproses",
        null
      );
      return;
    }

    const updatedAccountData = await updateAccountResponse.json();

    if (!updatedAccountData.success) {
      console.error("Account validation failed:", updatedAccountData.message);
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null
      );
      return;
    }

    // Cek apakah robux masih mencukupi setelah update
    if (updatedAccountData.stockAccount.robux < gamepassPrice) {
      console.log("Account robux insufficient after update");
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null
      );
      return;
    }

    // Lakukan purchase gamepass (using direct import with Puppeteer)
    console.log("🎯 Purchasing gamepass via Puppeteer...");
    const purchaseRequest = new NextRequest(
      "http://localhost:3000/api/buy-pass",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          robloxCookie: suitableAccount.robloxCookie,
          productId: transaction.gamepass.productId,
          productName: transaction.gamepass.name,
          price: transaction.gamepass.price,
          sellerId: transaction.gamepass.sellerId,
        }),
      }
    );

    const purchaseResponse = await buyPassHandler(purchaseRequest);
    const purchaseResult = await purchaseResponse.json();

    if (purchaseResult.success) {
      console.log("Gamepass purchase successful");

      // Update order status to completed
      await transaction.updateStatus(
        "order",
        "completed",
        `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username}`,
        null
      );

      // Update account data setelah purchase (using direct import)
      console.log("🔄 Updating stock account after purchase...");
      const postUpdateRequest = new NextRequest(
        `http://localhost:3000/api/admin/stock-accounts/${suitableAccount._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            robloxCookie: suitableAccount.robloxCookie,
          }),
        }
      );

      await updateStockAccountHandler(postUpdateRequest, {
        params: Promise.resolve({ id: suitableAccount._id.toString() }),
      });
    } else {
      console.error("Gamepass purchase failed:", purchaseResult.message);
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null
      );
    }
  } catch (error) {
    console.error("Error processing gamepass purchase:", error);
    await transaction.updateStatus(
      "order",
      "pending",
      `Pesanan sedang diproses`,
      null
    );
  }
}

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
    // if (
    //   !midtransService.verifyNotificationSignature(
    //     order_id,
    //     status_code,
    //     gross_amount,
    //     signature_key
    //   )
    // ) {
    //   console.error("Invalid signature from Midtrans webhook");
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    // CRITICAL FIX: Cari SEMUA transaksi dengan masterOrderId yang sama
    // Untuk multi-item checkout, bisa ada multiple transactions dengan same order_id
    const transactions = await Transaction.find({
      midtransOrderId: order_id,
    });

    if (!transactions || transactions.length === 0) {
      console.error("Transaction not found for order_id:", order_id);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    console.log(
      `Found ${transactions.length} transaction(s) with order_id: ${order_id}`
    );

    console.log(
      `Found ${transactions.length} transaction(s) with order_id: ${order_id}`
    );

    // Update transaction ID dari Midtrans untuk semua transactions
    const updateTransactionIdPromises = transactions
      .filter((t) => transaction_id && !t.midtransTransactionId)
      .map((t) => {
        t.midtransTransactionId = transaction_id;
        return t.save();
      });

    await Promise.all(updateTransactionIdPromises);

    // Map status Midtrans ke status aplikasi
    const statusMapping = midtransService.mapMidtransStatus(
      transaction_status,
      payment_type
    );

    // Process each transaction
    const updatedTransactions = [];
    const rbx5TransactionsToProcess = [];

    for (const transaction of transactions) {
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
            // Update spendedMoney user (hanya sekali per user per order)
            // Check if this is the first transaction in the group to update user
            const isFirstTransaction =
              transactions.findIndex((t) => t._id.equals(transaction._id)) ===
              0;

            if (isFirstTransaction) {
              const user = await User.findById(transaction.customerInfo.userId);
              if (user) {
                // Sum total dari SEMUA transactions dalam order ini
                const totalOrderAmount = transactions.reduce(
                  (sum, t) => sum + (t.finalAmount || t.totalAmount),
                  0
                );

                user.spendedMoney += totalOrderAmount;
                await user.save();

                console.log(
                  `Updated spendedMoney for user ${user.email}: +${totalOrderAmount} (total: ${user.spendedMoney})`
                );
              }
            }
          } catch (userUpdateError) {
            console.error("Error updating user spendedMoney:", userUpdateError);
            // Don't fail the webhook if user update fails
          }
        }

        // Activate reseller package if this is a reseller purchase
        if (
          statusMapping.paymentStatus === "settlement" &&
          previousPaymentStatus !== "settlement" &&
          transaction.serviceType === "reseller"
        ) {
          try {
            console.log(
              "Processing reseller package activation for transaction:",
              transaction.invoiceId
            );
            const activationResult = await activateResellerPackage(transaction);

            if (activationResult) {
              console.log(
                `✅ Reseller package activated: Tier ${
                  activationResult.newTier
                } (${activationResult.packageName}), Discount: ${
                  activationResult.discount
                }%, Expires: ${activationResult.expiryDate.toLocaleDateString(
                  "id-ID"
                )}`
              );

              // Update order status to completed on successful activation
              await transaction.updateStatus(
                "order",
                "completed",
                `Reseller Tier ${
                  activationResult.newTier
                } berhasil diaktifkan hingga ${activationResult.expiryDate.toLocaleDateString(
                  "id-ID"
                )}`,
                null
              );
            } else {
              console.log(
                "❌ Reseller package activation failed for transaction:",
                transaction.invoiceId
              );

              // Update order status to pending if activation fails
              await transaction.updateStatus(
                "order",
                "pending",
                "Gagal mengaktifkan reseller package. Silakan hubungi admin.",
                null
              );
            }
          } catch (resellerError) {
            console.error("Error activating reseller package:", resellerError);

            // Update order status to pending on error
            await transaction.updateStatus(
              "order",
              "pending",
              `Error saat mengaktifkan reseller: ${
                resellerError instanceof Error
                  ? resellerError.message
                  : "Unknown error"
              }`,
              null
            );
          }
        }

        // Collect Rbx5 transactions for processing (setelah semua updated)
        if (
          statusMapping.paymentStatus === "settlement" &&
          previousPaymentStatus !== "settlement" &&
          transaction.serviceType === "robux" &&
          transaction.serviceCategory === "robux_5_hari" &&
          transaction.gamepass
        ) {
          rbx5TransactionsToProcess.push(transaction);
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

      updatedTransactions.push({
        invoiceId: transaction.invoiceId,
        previousPaymentStatus,
        newPaymentStatus: transaction.paymentStatus,
        previousOrderStatus,
        newOrderStatus: transaction.orderStatus,
      });
    }

    // Process Rbx5 gamepasses (jika ada)
    // NOTE: Untuk Rbx5, seharusnya hanya 1 item per checkout (enforced di API)
    // Tapi tetap handle sebagai array untuk robustness
    if (rbx5TransactionsToProcess.length > 0) {
      console.log(
        `Processing ${rbx5TransactionsToProcess.length} Rbx5 gamepass transaction(s)`
      );

      for (const rbx5Transaction of rbx5TransactionsToProcess) {
        try {
          await processGamepassPurchase(rbx5Transaction);
        } catch (gamepassError) {
          console.error(
            `Error processing gamepass for ${rbx5Transaction.invoiceId}:`,
            gamepassError
          );
          // Continue with other transactions even if one fails
        }
      }
    }

    // Send invoice email if payment is settled
    // For multi-transaction checkout, send one email with first transaction as reference
    if (
      statusMapping.paymentStatus === "settlement" &&
      transactions.length > 0
    ) {
      const firstTransaction = transactions[0];
      if (firstTransaction.customerInfo?.email) {
        try {
          console.log(
            `Sending invoice email to ${firstTransaction.customerInfo.email} for ${transactions.length} transaction(s)`
          );
          await EmailService.sendInvoiceEmail(firstTransaction);
          console.log("Invoice email sent successfully");
        } catch (emailError) {
          console.error("Error sending invoice email:", emailError);
          // Don't fail the webhook if email fails
        }
      }
    }

    // Log webhook untuk debugging
    console.log("Transactions updated:", {
      totalTransactions: transactions.length,
      details: updatedTransactions,
    });

    // Kirim response sukses ke Midtrans
    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        totalTransactions: transactions.length,
        transactions: updatedTransactions,
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
