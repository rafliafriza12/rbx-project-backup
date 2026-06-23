// lib/auto-purchase-robux.ts
import Transaction from "@/models/Transaction";
import StockAccount from "@/models/StockAccount";
import AutoPurchaseProgress from "@/models/AutoPurchaseProgress";
import Rbx5Stats from "@/models/Rbx5Stats";
import { POST as buyPassHandler } from "@/app/api/buy-pass/route";
import { NextRequest } from "next/server";

/**
 * Fetch with retry & timeout - handles Roblox socket errors ("other side closed")
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      return res;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.warn(
        `⚠️ Fetch attempt ${attempt}/${maxRetries} failed for ${url}: ${errMsg}`,
      );

      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retry: 2s, 4s, 6s
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }

  throw new Error("Max retries exceeded");
}

/**
 * Auto-purchase pending robux 5 hari transactions using available stock accounts
 * Called after adding/updating stock account
 *
 * Logic:
 * 1. Get ALL pending robux_5_hari transactions (payment: settlement, order: pending) - no date limit
 * 2. Sort by oldest first (createdAt ascending)
 * 3. For each transaction:
 *    - Find suitable stock account (robux >= gamepass price, active status)
 *    - Sort by robux ascending (use account with least robux that's sufficient)
 * 4. If found: purchase gamepass, update transaction to completed, wait 10 seconds
 * 5. If not found: stop processing, remaining transactions stay pending until next stock update
 */
export async function autoPurchasePendingRobux(
  triggeredByStockAccountId?: string,
) {
  // Generate unique session ID for tracking
  const sessionId = `auto-purchase-${Date.now()}-${Math.random()
    .toString(36)
    .substring(7)}`;

  try {
    console.log(
      "🤖 Starting auto-purchase for pending robux_5_hari transactions...",
    );
    console.log(`📊 Session ID: ${sessionId}`);

    // Initialize progress tracking
    const progressDoc = new AutoPurchaseProgress({
      sessionId,
      status: "running",
      currentStep: "Initializing auto-purchase...",
      summary: {
        totalTransactions: 0,
        processedCount: 0,
        skippedCount: 0,
        failedCount: 0,
      },
    });

    // Get trigger account info if provided
    let triggerAccount = null;
    if (triggeredByStockAccountId) {
      triggerAccount = await StockAccount.findById(triggeredByStockAccountId);
      if (triggerAccount) {
        console.log(
          `🎯 Triggered by stock account update: ${triggerAccount.username} (Robux: ${triggerAccount.robux})`,
        );
        progressDoc.triggeredBy = {
          stockAccountId: triggerAccount._id.toString(),
          stockAccountName: triggerAccount.username,
        };
      }
    }

    await progressDoc.save();

    // Update: Checking stock accounts
    progressDoc.currentStep = "Checking available stock accounts...";
    await progressDoc.save();

    const allStockAccounts = await StockAccount.find({ status: "active" });
    progressDoc.stockAccounts = allStockAccounts.map((acc) => ({
      id: acc._id.toString(),
      username: acc.username,
      robux: acc.robux,
      status: "available",
    }));
    await progressDoc.save();

    console.log(`💰 Found ${allStockAccounts.length} active stock accounts`);

    // Update: Fetching pending transactions
    progressDoc.currentStep = "Fetching pending robux_5_hari transactions...";
    await progressDoc.save();

    // Get ALL pending robux_5_hari transactions (payment settled, order pending)
    const pendingTransactions = await Transaction.find({
      serviceType: "robux",
      serviceCategory: "robux_5_hari",
      paymentStatus: "settlement",
      orderStatus: "pending",
      "gamepass.price": { $exists: true }, // Must have gamepass data
    }).sort({ createdAt: 1 }); // Oldest first

    console.log(
      `📋 Found ${pendingTransactions.length} pending robux_5_hari transactions`,
    );

    // Update progress with transaction list
    progressDoc.transactions = pendingTransactions.map((t) => ({
      invoiceId: t.invoiceId,
      gamepassName: t.gamepass?.name || "Unknown",
      gamepassPrice: t.gamepass?.price || 0,
      status: "pending",
      timestamp: new Date(),
    }));
    progressDoc.summary.totalTransactions = pendingTransactions.length;
    await progressDoc.save();

    if (pendingTransactions.length === 0) {
      console.log(
        "📭 No pending transactions found. Updating stock account cookies...",
      );

      // Update: Refresh all stock accounts
      progressDoc.currentStep = "Updating stock account data...";
      await progressDoc.save();

      let updatedCount = 0;
      for (const account of allStockAccounts) {
        try {
          // Get updated Robux amount
          const robuxRes = await fetchWithRetry(
            "https://economy.roblox.com/v1/user/currency",
            {
              headers: { Cookie: `.ROBLOSECURITY=${account.robloxCookie};` },
            },
          );

          if (robuxRes.ok) {
            const robuxData = await robuxRes.json();
            account.robux = robuxData.robux ?? account.robux;
            account.lastChecked = new Date();
            await account.save();
            updatedCount++;

            // Update in progress doc
            const stockIdx = progressDoc.stockAccounts.findIndex(
              (s: {
                id: string;
                username: string;
                robux: number;
                status: string;
              }) => s.id === account._id.toString(),
            );
            if (stockIdx !== -1) {
              progressDoc.stockAccounts[stockIdx].robux = account.robux;
            }

            console.log(
              `✅ Updated ${account.username}: ${account.robux} robux`,
            );
          }
        } catch (error) {
          console.error(
            `❌ Failed to update account ${account.username}:`,
            error,
          );
        }
      }

      progressDoc.status = "completed";
      progressDoc.currentStep = `No pending transactions. Updated ${updatedCount} stock accounts.`;
      progressDoc.endTime = new Date();
      await progressDoc.save();

      console.log(
        `✅ Stock accounts updated. ${updatedCount}/${allStockAccounts.length} accounts refreshed.`,
      );

      return {
        success: true,
        message: `No pending transactions. Updated ${updatedCount} stock accounts.`,
        processed: 0,
        skipped: 0,
        updated: updatedCount,
        // Don't return sessionId - no need to show modal for background updates
        sessionId: null,
      };
    }

    let processedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    progressDoc.currentStep = "Processing transactions...";
    await progressDoc.save();

    // Process transactions one by one
    for (let i = 0; i < pendingTransactions.length; i++) {
      const transaction = pendingTransactions[i];
      const gamepassPrice = transaction.gamepass?.price || 0;

      if (!transaction.gamepass || !transaction.gamepass.productId) {
        console.log(
          `⚠️ Transaction ${transaction.invoiceId} missing gamepass data, skipping...`,
        );

        // Update progress
        progressDoc.transactions[i].status = "failed";
        progressDoc.transactions[i].error = "Missing gamepass data";
        progressDoc.summary.failedCount = ++failedCount;
        await progressDoc.save();

        skippedCount++;
        continue;
      }

      console.log(
        `🔄 Processing transaction ${transaction.invoiceId} - Gamepass: ${transaction.gamepass.name} (${gamepassPrice} robux)`,
      );

      // Update progress: processing this transaction
      progressDoc.currentStep = `Processing transaction ${i + 1}/${
        pendingTransactions.length
      }: ${transaction.invoiceId}`;
      progressDoc.transactions[i].status = "processing";
      await progressDoc.save();

      // ============ Pilih akun stock terbaik untuk transaksi ini ============
      //
      // Strategi:
      // 1. Coba akun Robux Plus dulu (customer sudah listing di harga diskon)
      //    - Akun Robux Plus bayar 90% dari listed price (Roblox apply diskon otomatis)
      //    - Contoh: gamepass 129, Robux Plus bayar 117 dari balance
      //    - CATATAN: Roblox Purchase API mungkin gagal (PriceChanged bug) → fallback
      // 2. Jika Robux Plus gagal/tidak ada → gunakan akun regular
      //    - Akun regular bayar harga penuh (129 atau 143)

      // Akun Robux Plus: check dengan efektif price (10% lebih murah dari listed)
      const rbxPlusEffectivePrice = Math.ceil(gamepassPrice * 0.9);
      const rbxPlusAccount = await StockAccount.findOne({
        robux: { $gte: rbxPlusEffectivePrice },
        status: "active",
        isRobuxPlus: true,
      }).sort({ robux: 1 });

      // Akun regular: check dengan harga penuh
      const regularAccount = await StockAccount.findOne({
        robux: { $gte: gamepassPrice },
        status: "active",
        $or: [{ isRobuxPlus: false }, { isRobuxPlus: { $exists: false } }],
      }).sort({ robux: 1 });

      if (!rbxPlusAccount && !regularAccount) {
        console.log(
          `⚠️ No suitable stock account found for transaction ${transaction.invoiceId}. Need: ${gamepassPrice} robux. Skipping to next...`,
        );

        // Update progress: insufficient robux for this transaction, but continue
        // NOTE: Transaction status in DB remains "pending" — will be retried on next stock update
        progressDoc.transactions[i].status = "skipped";
        progressDoc.transactions[i].error =
          `Stok tidak cukup (butuh ${gamepassPrice} robux). Transaksi tetap pending, akan diproses saat stok diperbarui.`;
        progressDoc.summary.skippedCount = ++skippedCount;
        await progressDoc.save();

        continue; // Skip this transaction, try the next one
      }

      // Prioritaskan Robux Plus jika tersedia
      const primaryAccount = rbxPlusAccount || regularAccount;
      const fallbackAccount = rbxPlusAccount ? regularAccount : null;

      console.log(
        `✅ Primary account: ${primaryAccount!.username} (${primaryAccount!.robux} robux, isRobuxPlus: ${primaryAccount!.isRobuxPlus})`,
      );
      if (fallbackAccount) {
        console.log(`   Fallback account: ${fallbackAccount.username} (${fallbackAccount.robux} robux)`);
      }

      // Update progress: found account
      progressDoc.transactions[i].usedAccount = primaryAccount!.username;
      await progressDoc.save();

      // ============ Fungsi helper untuk eksekusi purchase dan update state ============
      const executePurchase = async (account: typeof primaryAccount) => {
        const purchaseResult = await purchaseGamepass(
          account!.robloxCookie,
          transaction.gamepass.id,
          transaction.gamepass.name,
          transaction.gamepass.price,
          transaction.gamepass.sellerId,
        );

        if (purchaseResult.success) {
          // Update transaction status to processing (pending 5 days)
          await transaction.updateStatus(
            "order",
            "processing",
            `Gamepass berhasil dibeli oleh @${account!.username}`,
            null,
          );

          // Deduct robux dari akun yang berhasil beli
          // Robux Plus: deduct harga efektif (90% dari listed)
          // Regular: deduct harga penuh
          const actualDeduction = account!.isRobuxPlus
            ? Math.ceil(gamepassPrice * 0.9)
            : gamepassPrice;
          account!.robux -= actualDeduction;
          account!.lastChecked = new Date();
          await account!.save();

          processedCount++;

          console.log(
            `✅ Transaction ${transaction.invoiceId} completed via @${account!.username}. ` +
            `Deducted: ${actualDeduction} R$ (${account!.isRobuxPlus ? "Robux Plus rate" : "regular rate"}). ` +
            `Remaining: ${account!.robux} R$`,
          );

          // Record purchase di stats
          try {
            await Rbx5Stats.recordPurchase(gamepassPrice, 1);
            console.log("📊 Rbx5Stats updated after purchase");
          } catch (statsError) {
            console.warn("⚠️ Failed to update Rbx5Stats:", statsError);
          }

          // Update progress: completed
          progressDoc.transactions[i].status = "completed";
          progressDoc.transactions[i].usedAccount = account!.username;
          progressDoc.summary.processedCount = processedCount;

          const stockIdx = progressDoc.stockAccounts.findIndex(
            (s: { id: string; username: string; robux: number; status: string }) =>
              s.id === account!._id.toString(),
          );
          if (stockIdx !== -1) {
            progressDoc.stockAccounts[stockIdx].robux = account!.robux;
          }

          await progressDoc.save();

          // Wait sebelum purchase berikutnya
          const remainingTransactions =
            pendingTransactions.length - processedCount - skippedCount - failedCount;
          if (remainingTransactions > 0) {
            progressDoc.currentStep = `Waiting before next purchase... (${processedCount}/${pendingTransactions.length} completed)`;
            await progressDoc.save();
            await sleep(4000);
          }

          return true; // success
        }

        return purchaseResult; // { success: false, error: "..." }
      };

      try {
        // Coba primary account (Robux Plus jika ada)
        const primaryResult = await executePurchase(primaryAccount);

        if (primaryResult === true) {
          // Purchase berhasil dengan primary account
        } else if (fallbackAccount) {
          // Primary gagal — coba fallback (regular account)
          const primaryError = typeof primaryResult === "object" ? primaryResult.error : "Unknown";
          console.warn(
            `⚠️ Primary account @${primaryAccount!.username} gagal: ${primaryError}. ` +
            `Mencoba fallback account @${fallbackAccount.username}...`,
          );

          progressDoc.transactions[i].usedAccount = fallbackAccount.username;
          await progressDoc.save();

          const fallbackResult = await executePurchase(fallbackAccount);

          if (fallbackResult !== true) {
            const fallbackError = typeof fallbackResult === "object" ? fallbackResult.error : "Unknown";
            console.error(
              `❌ Fallback juga gagal untuk ${transaction.invoiceId}: ${fallbackError}`,
            );
            progressDoc.transactions[i].status = "failed";
            progressDoc.transactions[i].error = `Primary: ${primaryError} | Fallback: ${fallbackError}`;
            progressDoc.summary.failedCount = ++failedCount;
            await progressDoc.save();
            skippedCount++;
          }
        } else {
          // Tidak ada fallback
          const errorMsg = typeof primaryResult === "object" ? primaryResult.error : "Purchase failed";
          console.error(`❌ Failed to purchase for ${transaction.invoiceId}: ${errorMsg}`);
          progressDoc.transactions[i].status = "failed";
          progressDoc.transactions[i].error = errorMsg || "Purchase failed";
          progressDoc.summary.failedCount = ++failedCount;
          await progressDoc.save();
          skippedCount++;
        }
      } catch (error) {
        console.error(
          `❌ Error processing transaction ${transaction.invoiceId}:`,
          error,
        );

        // Update progress: error
        progressDoc.transactions[i].status = "failed";
        progressDoc.transactions[i].error =
          error instanceof Error ? error.message : "Unknown error";
        progressDoc.summary.failedCount = ++failedCount;
        await progressDoc.save();

        skippedCount++;
        // Don't break, try next transaction
      }
    }

    console.log(
      `🎉 Auto-purchase completed! Processed: ${processedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`,
    );

    // Update progress: completed
    progressDoc.status = "completed";
    progressDoc.currentStep = "Auto-purchase completed";
    progressDoc.endTime = new Date();
    progressDoc.summary.processedCount = processedCount;
    progressDoc.summary.skippedCount = skippedCount;
    progressDoc.summary.failedCount = failedCount;
    await progressDoc.save();

    return {
      success: true,
      message: `Processed ${processedCount} transactions, ${skippedCount} skipped, ${failedCount} failed`,
      processed: processedCount,
      skipped: skippedCount,
      failed: failedCount,
      sessionId,
    };
  } catch (error) {
    console.error("❌ Error in auto-purchase:", error);

    // Update progress: failed
    try {
      const foundProgressDoc = await AutoPurchaseProgress.findOne({
        sessionId,
      });
      if (foundProgressDoc) {
        foundProgressDoc.status = "failed";
        foundProgressDoc.currentStep = "Error occurred";
        foundProgressDoc.error =
          error instanceof Error ? error.message : "Unknown error";
        foundProgressDoc.endTime = new Date();
        await foundProgressDoc.save();
      }
    } catch (updateError) {
      console.error("Failed to update progress on error:", updateError);
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      sessionId,
    };
  }
}

/**
 * Purchase gamepass using the /api/buy-pass endpoint with noblox.js API
 * Same approach as webhook automation
 */
async function purchaseGamepass(
  robloxCookie: string,
  gamepassId: number,
  gamepassName: string,
  price: number,
  sellerId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("🎯 Attempting to purchase gamepass via noblox.js API:", {
      gamepassId,
      gamepassName,
      price,
      sellerId,
    });

    // Call buy-pass API handler DIRECTLY (no HTTP fetch needed!)
    // This is faster and more reliable than HTTP fetch
    const requestBody = JSON.stringify({
      robloxCookie,
      gamepassId,
      gamepassName,
      price,
      sellerId,
    });

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const request = new NextRequest(`${apiUrl}/api/buy-pass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      },
      body: requestBody,
    });

    const purchaseResponse = await buyPassHandler(request);

    // Check if response is OK first
    if (!purchaseResponse.ok) {
      const errorText = await purchaseResponse.text();
      console.error(
        `❌ API returned ${purchaseResponse.status}:`,
        errorText.substring(0, 200),
      );
      return {
        success: false,
        error: `HTTP ${purchaseResponse.status}: ${purchaseResponse.statusText}`,
      };
    }

    // Check if response is JSON
    const contentType = purchaseResponse.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const htmlText = await purchaseResponse.text();
      console.error(
        "❌ API returned HTML instead of JSON:",
        htmlText.substring(0, 300),
      );
      return {
        success: false,
        error:
          "API endpoint returned HTML instead of JSON. Endpoint might not exist or misconfigured.",
      };
    }

    const purchaseResult = await purchaseResponse.json();

    if (purchaseResult.success) {
      console.log("✅ Gamepass purchase successful via API");
      return { success: true };
    } else {
      console.error("❌ Gamepass purchase failed:", purchaseResult.message);
      return {
        success: false,
        error: purchaseResult.message || "Purchase failed",
      };
    }
  } catch (error) {
    console.error("Error in purchaseGamepass:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Sleep helper function
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
