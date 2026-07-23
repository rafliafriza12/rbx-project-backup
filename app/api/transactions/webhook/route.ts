import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import StockAccount from "@/models/StockAccount";
import ResellerPackage from "@/models/ResellerPackage";
import Rbx5Stats from "@/models/Rbx5Stats";
import MidtransService from "@/lib/midtrans";
import EmailService from "@/lib/email";
import { POST as buyPassHandler } from "@/app/api/buy-pass/route";
import { PUT as updateStockAccountHandler } from "@/app/api/admin/stock-accounts/[id]/route";
import {
  notifyPaymentStatusChange,
  notifyOrderStatusChange,
} from "@/lib/discord";

// Helper to activate Coin Top Up
async function activateCoinTopup(transaction: any) {
  try {
    console.log(`[Webhook Route] Starting coin activation for Invoice: ${transaction.invoiceId}`);

    if (!transaction.customerInfo?.userId) {
      console.log(`[Webhook Route] ❌ Missing customerInfo.userId for coin top up (Invoice: ${transaction.invoiceId})`);
      return null;
    }

    if (!transaction.coinDetails?.totalCoins) {
      console.log(`[Webhook Route] ❌ Missing coinDetails.totalCoins (Invoice: ${transaction.invoiceId})`, transaction.coinDetails);
      return null;
    }

    if (transaction.coinDetails.isAdded) {
      console.log(`[Webhook Route] ℹ️ Coins already added to user for Invoice ${transaction.invoiceId}, skipping.`);
      return true;
    }

    const user = await User.findById(transaction.customerInfo.userId);
    if (!user) {
      console.log(`[Webhook Route] ❌ User not found for coin top up (UserId: ${transaction.customerInfo.userId})`);
      return null;
    }

    const previousBalance = user.balance || 0;
    user.balance = previousBalance + transaction.coinDetails.totalCoins;
    await user.save();

    transaction.coinDetails.isAdded = true;
    await transaction.save();

    console.log(`[Webhook Route] ✅ SUCCESS: Added ${transaction.coinDetails.totalCoins} coins to user ${user.email}. Previous: ${previousBalance}, New: ${user.balance}`);
    return true;
  } catch (error) {
    console.error("[Webhook Route] ❌ Error in activateCoinTopup:", error);
    return null;
  }
}

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
      transaction.serviceId,
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
      `✅ Reseller activated for user ${user.email}: Tier ${resellerPackage.tier
      } (${resellerPackage.name}), Expires: ${expiryDate.toLocaleDateString(
        "id-ID",
      )}`,
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
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    console.log(
      "Processing gamepass purchase for transaction:",
      transaction.invoiceId,
    );

    // ============================================================
    // ATOMIC CLAIM — Mencegah double purchase jika 2 webhook datang bersamaan.
    // findOneAndUpdate dengan kondisi orderStatus "pending/waiting_payment" bersifat atomic.
    // Jika webhook lain sudah mengklaim transaksi ini, result akan null → return langsung.
    // ============================================================
    const claimed = await Transaction.findOneAndUpdate(
      {
        _id: transaction._id,
        orderStatus: { $in: ["pending", "waiting_payment"] }, // Hanya claim jika belum diproses
      },
      {
        $set: { orderStatus: "in_progress" },
      },
      { new: false }, // Kembalikan dokumen LAMA untuk validasi
    );

    if (!claimed) {
      console.log(
        `🔒 Transaction ${transaction.invoiceId} sudah di-claim oleh proses lain (orderStatus sudah bukan pending). Skip double-purchase.`,
      );
      return; // Webhook lain sudah menangani ini — aman dari double purchase
    }

    console.log(
      `✅ Atomic claim berhasil untuk ${transaction.invoiceId}. Lanjutkan purchase...`,
    );

    // Ambil gamepass data dari root level, fallback ke rbx5Details.gamepass
    const gamepassData =
      (transaction.gamepass?.id ? transaction.gamepass : null) ||
      (transaction.rbx5Details?.gamepass?.id
        ? transaction.rbx5Details.gamepass
        : null);

    console.log("Gamepass data (resolved):", gamepassData);

    if (!gamepassData || !gamepassData.id || !gamepassData.price) {
      console.error(
        "❌ Gamepass data tidak lengkap! Tidak bisa proses purchase.",
      );
      console.log(
        "transaction.gamepass:",
        JSON.stringify(transaction.gamepass),
      );
      console.log(
        "transaction.rbx5Details?.gamepass:",
        JSON.stringify(transaction.rbx5Details?.gamepass),
      );
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan gagal: Data gamepass tidak lengkap`,
        null,
      );
      return;
    }


    const gamepassPrice = gamepassData.price;

    // Cari akun Robux Plus TERLEBIH DAHULU — karena mereka dapat discount Roblox
    // sehingga bisa membeli gamepass dengan lebih sedikit robux
    // Contoh: gamepassPrice=129 (dengan discount 10%) → akun Robux Plus butuh ~114 robux aktual
    // Tapi untuk safety, kita tetap filter yang punya robux >= gamepassPrice
    let suitableAccounts = await StockAccount.find({
      robux: { $gte: gamepassPrice },
      status: "active",
      isRobuxPlus: true,
    }).sort({ robux: 1 }); // Pakai akun paling sedikit robux yang cukup

    if (!suitableAccounts || suitableAccounts.length === 0) {
      // Fallback ke akun regular
      console.log(`[buy-pass] Tidak ada akun Robux Plus aktif dengan robux >= ${gamepassPrice}. Coba akun regular.`);
      suitableAccounts = await StockAccount.find({
        robux: { $gte: gamepassPrice },
        status: "active",
        isRobuxPlus: { $ne: true },
      }).sort({ robux: 1 });
    } else {
      console.log(`[buy-pass] Ditemukan ${suitableAccounts.length} akun Robux Plus aktif untuk gamepass ${gamepassPrice} R$`);
    }

    if (!suitableAccounts || suitableAccounts.length === 0) {
      console.log("No suitable account found for gamepass purchase");
      // Update order status to failed
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null,
      );
      return;
    }

    let purchaseSuccess = false;
    let lastErrorMessage = "";

    for (const suitableAccount of suitableAccounts) {
      console.log("Suitable account found:", suitableAccount.username);

      // Validate dan update account data terlebih dahulu (using direct import)
      console.log("🔄 Updating stock account data...");
      const updateRequest = new NextRequest(
        `${apiUrl}/api/admin/stock-accounts/${suitableAccount._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
          },
          body: JSON.stringify({
            robloxCookie: suitableAccount.robloxCookie,
          }),
        },
      );

      const updateAccountResponse = await updateStockAccountHandler(
        updateRequest,
        { params: Promise.resolve({ id: suitableAccount._id.toString() }) },
      );

      if (!updateAccountResponse.ok) {
        console.error(`❌ Failed to update account data for ${suitableAccount.username}, marking inactive`);
        suitableAccount.status = "inactive";
        suitableAccount.lastChecked = new Date();
        await suitableAccount.save();
        lastErrorMessage = "Gagal memvalidasi akun stock (cookie invalid)";
        continue;
      }

      const updatedAccountData = await updateAccountResponse.json();

      if (!updatedAccountData.success) {
        console.error("Account validation failed:", updatedAccountData.message);
        suitableAccount.status = "inactive";
        suitableAccount.lastChecked = new Date();
        await suitableAccount.save();
        lastErrorMessage = `Validasi akun gagal: ${updatedAccountData.message}`;
        continue;
      }

      // Cek apakah robux masih mencukupi setelah update
      if (updatedAccountData.stockAccount.robux < gamepassPrice) {
        console.log("Account robux insufficient after update");
        lastErrorMessage = `Robux tidak mencukupi setelah validasi (tersedia: ${updatedAccountData.stockAccount.robux}, diperlukan: ${gamepassPrice})`;
        continue;
      }

      // Lakukan purchase gamepass (using direct import with Puppeteer)
      console.log("🎯 Purchasing gamepass via Puppeteer...");
      const purchaseRequest = new NextRequest(`${apiUrl}/api/buy-pass`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
        },
        body: JSON.stringify({
          robloxCookie: suitableAccount.robloxCookie,
          gamepassId: gamepassData.id,
          gamepassName: gamepassData.name,
          price: gamepassData.price,
          sellerId: gamepassData.sellerId,
        }),
      });

      const purchaseResponse = await buyPassHandler(purchaseRequest);
      const purchaseResult = await purchaseResponse.json();

      if (purchaseResult.success) {
        console.log("Gamepass purchase successful");

        // Update order status to processing
        await transaction.updateStatus(
          "order",
          "processing",
          `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username}`,
          null,
        );

        // Update account data setelah purchase - langsung kurangi robux di database
        // Tidak perlu fetch ke Roblox lagi (menghindari socket error / rate limit)
        console.log("🔄 Updating stock account robux in database...");
        const deductPrice = gamepassData.price || 0;
        suitableAccount.robux = Math.max(0, suitableAccount.robux - deductPrice);
        suitableAccount.lastChecked = new Date();
        await suitableAccount.save();
        console.log(
          `✅ Account ${suitableAccount.username} robux updated: ${suitableAccount.robux} (deducted ${deductPrice})`,
        );

        // Record purchase di stats (untuk mode manual & tracking)
        try {
          await Rbx5Stats.recordPurchase(deductPrice, 1);
          console.log("📊 Rbx5Stats updated after purchase");
        } catch (statsError) {
          console.warn("⚠️ Failed to update Rbx5Stats:", statsError);
        }

        purchaseSuccess = true;
        return; // Success, exit function
      } else {
        console.error("Gamepass purchase failed:", purchaseResult.message);
        
        // Check if it's a price mismatch error
        const isPriceMismatch =
          purchaseResult.message?.includes("Harga gamepass tidak sesuai") ||
          purchaseResult.expectedPrice !== undefined;

        if (isPriceMismatch) {
          lastErrorMessage = `Pembelian ditunda: ${purchaseResult.message || "Harga gamepass berubah"}. Harga database: ${purchaseResult.expectedPrice || gamepassData.price} Robux, Harga di Roblox: ${purchaseResult.actualPrice || "tidak diketahui"} Robux. Silakan hubungi admin.`;
          break; // Don't try other accounts for price mismatch
        }

        const errMsgLower = (purchaseResult.message || "").toLowerCase();
        if (errMsgLower.includes("rate limit") || errMsgLower.includes("too many requests") || errMsgLower.includes("challenge")) {
          lastErrorMessage = `Pembelian gagal (Rate Limit), mencoba akun lain...`;
          continue;
        }

        lastErrorMessage = `Pembelian gamepass gagal: ${purchaseResult.message}`;
        break; // Stop and fail for other errors
      }
    }

    if (!purchaseSuccess) {
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses. ${lastErrorMessage}`,
        null,
      );
    }
  } catch (error) {
    console.error("Error processing gamepass purchase:", error);
    await transaction.updateStatus(
      "order",
      "pending",
      `Pesanan sedang diproses`,
      null,
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
      acquirer, // For QRIS - which acquirer processed it (gopay, etc.)
      issuer, // For QRIS - which app was used to pay
      shopeepay_reference_number, // For ShopeePay
      settlement_time, // When payment was settled
    } = body;

    console.log("📥 Midtrans Webhook received:", {
      order_id,
      transaction_status,
      status_code,
      payment_type,
      transaction_id,
      acquirer,
      issuer,
      settlement_time,
    });

    // Log full body for debugging (remove in production)
    console.log("Full webhook body:", JSON.stringify(body, null, 2));

    // Verifikasi signature
    const midtransService = new MidtransService();
    if (
      !(await midtransService.verifyNotificationSignature(
        order_id,
        status_code,
        gross_amount,
        signature_key,
      ))
    ) {
      console.error("Invalid signature from Midtrans webhook");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // CRITICAL FIX: Cari SEMUA transaksi dengan masterOrderId yang sama
    // Untuk multi-item checkout, bisa ada multiple transactions dengan same order_id
    const transactions = await Transaction.find({
      midtransOrderId: order_id,
    });

    if (!transactions || transactions.length === 0) {
      console.error("Transaction not found for order_id:", order_id);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    console.log(
      `Found ${transactions.length} transaction(s) with order_id: ${order_id}`,
    );

    console.log(
      `Found ${transactions.length} transaction(s) with order_id: ${order_id}`,
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
      fraud_status,
    );

    // Process each transaction
    const updatedTransactions = [];
    const rbx5TransactionsToProcess = [];

    for (const transaction of transactions) {
      const previousPaymentStatus = transaction.paymentStatus;
      const previousOrderStatus = transaction.orderStatus;

      // 🛡️ GUARD: Jika payment sudah settlement, jangan update status payment lagi.
      // TAPI: jangan skip fulfillment! Jika orderStatus masih pending, artinya robux belum
      // terkirim (mungkin error sebelumnya) → tetap harus diproses ulang.
      const alreadySettled = transaction.paymentStatus === "settlement";

      if (alreadySettled) {
        console.log(
          `🛡️ Transaction ${transaction.invoiceId} sudah settlement (orderStatus: ${transaction.orderStatus}), skip payment status update.`,
        );

        // Cek apakah fulfillment masih perlu diproses (orderStatus masih pending/waiting)
        const needsFulfillment =
          transaction.orderStatus === "pending" ||
          transaction.orderStatus === "waiting_payment";

        if (needsFulfillment) {
          console.log(
            `🔄 Transaction ${transaction.invoiceId} sudah settlement tapi orderStatus masih "${transaction.orderStatus}" → akan dicoba kirim ulang fulfillment.`,
          );
          // Jatuhkan ke bawah agar fulfillment dijalankan
        } else {
          updatedTransactions.push({
            invoiceId: transaction.invoiceId,
            previousPaymentStatus,
            newPaymentStatus: transaction.paymentStatus,
            previousOrderStatus,
            newOrderStatus: transaction.orderStatus,
            skipped: true,
            reason: "Already settled and fulfilled",
          });
          continue;
        }
      }

      // Update payment status jika berubah (hanya jika belum settlement)
      if (!alreadySettled && transaction.paymentStatus !== statusMapping.paymentStatus) {
        await transaction.updateStatus(
          "payment",
          statusMapping.paymentStatus,
          `Payment ${transaction_status} via ${payment_type}. Midtrans Transaction ID: ${transaction_id}`,
          null,
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
                  0,
                );

                user.spendedMoney += totalOrderAmount;
                await user.save();

                console.log(
                  `Updated spendedMoney for user ${user.email}: +${totalOrderAmount} (total: ${user.spendedMoney})`,
                );
              }
            }
          } catch (userUpdateError) {
            console.error("Error updating user spendedMoney:", userUpdateError);
            // Don't fail the webhook if user update fails
          }
        }
      }

      // ============================================================
      // FULFILLMENT — dijalankan jika payment settlement, terlepas
      // dari apakah status baru berubah atau tidak.
      // Ini memungkinkan retry jika sebelumnya gagal (orderStatus masih pending).
      // ============================================================
      const isSettlement = alreadySettled || statusMapping.paymentStatus === "settlement";

      if (isSettlement) {
        // --- Reseller activation ---
        if (transaction.serviceType === "reseller") {
          try {
            console.log(
              "Processing reseller package activation for transaction:",
              transaction.invoiceId,
            );
            const activationResult = await activateResellerPackage(transaction);

            if (activationResult) {
              console.log(
                `✅ Reseller package activated: Tier ${activationResult.newTier} (${activationResult.packageName})`,
              );
              await transaction.updateStatus(
                "order",
                "completed",
                `Reseller Tier ${activationResult.newTier} berhasil diaktifkan hingga ${activationResult.expiryDate.toLocaleDateString("id-ID")}`,
                null,
              );
            } else {
              console.log(
                "❌ Reseller package activation failed for transaction:",
                transaction.invoiceId,
              );
              await transaction.updateStatus(
                "order",
                "pending",
                "Gagal mengaktifkan reseller package. Silakan hubungi admin.",
                null,
              );
            }
          } catch (resellerError) {
            console.error("Error activating reseller package:", resellerError);
            await transaction.updateStatus(
              "order",
              "pending",
              `Error saat mengaktifkan reseller: ${resellerError instanceof Error ? resellerError.message : "Unknown error"}`,
              null,
            );
          }
        }

        // --- Coin Top Up ---
        if (transaction.serviceType === "coin_topup") {
          await activateCoinTopup(transaction);
        }

        // --- Robux 5 Hari (Gamepass) ---
        // BUG FIX: Cek gamepass dari root level ATAU rbx5Details.gamepass
        const hasValidGamepassData =
          (transaction.gamepass?.id && transaction.gamepass?.price) ||
          (transaction.rbx5Details?.gamepass?.id &&
            transaction.rbx5Details?.gamepass?.price);

        if (
          transaction.serviceType === "robux" &&
          transaction.serviceCategory === "robux_5_hari" &&
          hasValidGamepassData
        ) {
          // BUG FIX: Push ke array untuk diproses, baik itu pertama kali settlement
          // MAUPUN retry (orderStatus masih pending meski sudah settlement).
          // Gunakan flag di transaksi untuk cegah double-purchase jika sudah processing/completed.
          const canRetry =
            transaction.orderStatus === "pending" ||
            transaction.orderStatus === "waiting_payment";

          if (canRetry) {
            console.log(
              `📦 Queuing robux_5_hari purchase for ${transaction.invoiceId} (orderStatus: ${transaction.orderStatus})`,
            );
            rbx5TransactionsToProcess.push(transaction);
          } else {
            console.log(
              `ℹ️ Skip robux_5_hari purchase for ${transaction.invoiceId} — sudah ${transaction.orderStatus}`,
            );
          }
        }
      }

      // Handle payment expired - force order status to cancelled
      if (
        !alreadySettled &&
        transaction_status === "expire" &&
        statusMapping.paymentStatus === "expired"
      ) {
        console.log(
          `⏰ Payment expired for transaction ${transaction.invoiceId}, cancelling order...`,
        );
        await transaction.updateStatus(
          "order",
          "cancelled",
          `Pesanan dibatalkan karena pembayaran sudah kadaluarsa (expired)`,
          null,
        );
      }
      // Handle payment cancelled or denied - force order status to cancelled
      else if (
        !alreadySettled &&
        (transaction_status === "cancel" || transaction_status === "deny") &&
        statusMapping.paymentStatus === "cancelled"
      ) {
        console.log(
          `❌ Payment ${transaction_status} for transaction ${transaction.invoiceId}, cancelling order...`,
        );
        await transaction.updateStatus(
          "order",
          "cancelled",
          `Pesanan dibatalkan karena pembayaran ${transaction_status === "cancel" ? "dibatalkan" : "ditolak"}`,
          null,
        );
      }
      // Update order status jika berubah dan sesuai kondisi (untuk status lainnya)
      else if (!alreadySettled && transaction.orderStatus !== statusMapping.orderStatus) {
        // Hanya update order status jika payment status memungkinkan
        const allowedOrderStatusUpdates: { [key: string]: string[] } = {
          waiting_payment: ["pending", "processing", "cancelled"],
          pending: ["processing", "in_progress", "completed", "cancelled"],
          processing: ["in_progress", "completed", "cancelled"],
          in_progress: ["completed", "cancelled"],
        };

        const currentOrderStatus = transaction.orderStatus;
        const allowedStatuses =
          allowedOrderStatusUpdates[currentOrderStatus] || [];

        let targetOrderStatus = statusMapping.orderStatus;

        // Khusus gamepass dan robux_5_hari, jika midtrans me-return processing, ubah ke pending terlebih dahulu
        if (targetOrderStatus === "processing" && (transaction.serviceType === "gamepass" || transaction.serviceCategory === "gamepass" || transaction.serviceCategory === "robux_5_hari")) {
          targetOrderStatus = "pending";
        }

        if (allowedStatuses.includes(targetOrderStatus)) {
          await transaction.updateStatus(
            "order",
            targetOrderStatus,
            `Order status updated based on payment ${transaction_status}`,
            null,
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

      // Send Discord notifications only for settlement (payment) and completed (order)
      try {
        if (
          previousPaymentStatus !== transaction.paymentStatus &&
          transaction.paymentStatus === "settlement"
        ) {
          await notifyPaymentStatusChange(
            transaction,
            previousPaymentStatus,
            transaction.paymentStatus,
            `Webhook Midtrans: ${transaction_status} via ${payment_type}`,
          );
        }
        if (
          previousOrderStatus !== transaction.orderStatus &&
          transaction.orderStatus === "completed"
        ) {
          await notifyOrderStatusChange(
            transaction,
            previousOrderStatus,
            transaction.orderStatus,
            `Order updated from Midtrans webhook`,
          );
        }
      } catch (discordError) {
        console.error("Error sending Discord notification:", discordError);
      }
    }

    // Process Rbx5 gamepasses (jika ada)
    // NOTE: Untuk Rbx5, seharusnya hanya 1 item per checkout (enforced di API)
    // Tapi tetap handle sebagai array untuk robustness
    if (rbx5TransactionsToProcess.length > 0) {
      console.log(
        `Processing ${rbx5TransactionsToProcess.length} Rbx5 gamepass transaction(s)`,
      );

      for (const rbx5Transaction of rbx5TransactionsToProcess) {
        try {
          await processGamepassPurchase(rbx5Transaction);
        } catch (gamepassError) {
          console.error(
            `Error processing gamepass for ${rbx5Transaction.invoiceId}:`,
            gamepassError,
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
            `Sending invoice email to ${firstTransaction.customerInfo.email} for ${transactions.length} transaction(s)`,
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
      { status: 200 },
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
        { status: 400 },
      );
    }

    // Get status dari Midtrans
    const midtransService = new MidtransService();
    const midtransStatus = await midtransService.getTransactionStatus(orderId);

    // Cari transaksi di database
    const transactions = await Transaction.find({
      midtransOrderId: orderId,
    });

    if (!transactions || transactions.length === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Map dan update status jika perlu
    const statusMapping = midtransService.mapMidtransStatus(
      midtransStatus.transaction_status,
      midtransStatus.fraud_status,
    );

    let anyUpdated = false;
    const results = [];

    for (const transaction of transactions) {
      // 🛡️ GUARD: Jika payment sudah settlement, jangan izinkan perubahan status
      if (transaction.paymentStatus === "settlement") {
        console.log(
          `🛡️ Transaction ${transaction.invoiceId} sudah settlement, skip update (incoming: ${statusMapping.paymentStatus})`,
        );
        results.push({
          transactionId: transaction.invoiceId,
          midtransStatus,
          updated: false,
          skipped: true,
          reason: "Already settled - status cannot be changed",
        });
        continue;
      }

      // Update jika status berbeda
      if (transaction.paymentStatus !== statusMapping.paymentStatus) {
        const previousPaymentStatus = transaction.paymentStatus;

        await transaction.updateStatus(
          "payment",
          statusMapping.paymentStatus,
          `Manual status check: ${midtransStatus.transaction_status}`,
          null,
        );
        anyUpdated = true;

        // Jika payment status berubah menjadi settlement dan transaksi memiliki userId
        if (
          statusMapping.paymentStatus === "settlement" &&
          previousPaymentStatus !== "settlement" &&
          transaction.customerInfo?.userId
        ) {
          try {
            // Update spendedMoney user only once for the first transaction
            const isFirstTransaction = transactions.findIndex((t) => t._id.equals(transaction._id)) === 0;

            if (isFirstTransaction) {
              const user = await User.findById(transaction.customerInfo.userId);
              if (user) {
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
          }
        }
      }

      // Process fulfillment (Reseller, Coins, etc.) outside the status change guard
      if (statusMapping.paymentStatus === "settlement") {
        if (transaction.serviceType === "reseller") {
          await activateResellerPackage(transaction);
        }
        if (transaction.serviceType === "coin_topup") {
          await activateCoinTopup(transaction);
        }
      }

      results.push({
        transactionId: transaction.invoiceId,
        midtransStatus,
        updated: anyUpdated,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        results,
      },
    });
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return NextResponse.json(
      { error: "Failed to check transaction status" },
      { status: 500 },
    );
  }
}
