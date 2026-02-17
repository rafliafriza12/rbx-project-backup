// lib/auto-purchase-robux.ts
import Transaction from "@/models/Transaction";
import StockAccount from "@/models/StockAccount";
import AutoPurchaseProgress from "@/models/AutoPurchaseProgress";
import { POST as buyPassHandler } from "@/app/api/buy-pass/route";
import { NextRequest } from "next/server";

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
          const robuxRes = await fetch(
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

      // Find suitable stock account for this transaction
      // Sort by robux ascending to use account with least robux that's sufficient
      const suitableAccount = await StockAccount.findOne({
        robux: { $gte: gamepassPrice },
        status: "active",
      }).sort({ robux: 1 });

      if (!suitableAccount) {
        console.log(
          `⚠️ No suitable stock account found for transaction ${transaction.invoiceId}. Need: ${gamepassPrice} robux`,
        );
        console.log(
          `🛑 Stopping auto-purchase. Remaining ${
            pendingTransactions.length - processedCount - skippedCount
          } transactions will be processed when stock is updated again.`,
        );

        // Update progress: insufficient robux
        progressDoc.transactions[i].status = "failed";
        progressDoc.transactions[i].error =
          `No account with ${gamepassPrice} robux available`;
        progressDoc.currentStep = "Stopped: Insufficient robux in all accounts";
        await progressDoc.save();

        break; // Stop processing, wait for next stock update
      }

      console.log(
        `✅ Found suitable account: ${suitableAccount.username} (${suitableAccount.robux} robux)`,
      );

      // Update progress: found account
      progressDoc.transactions[i].usedAccount = suitableAccount.username;
      await progressDoc.save();

      try {
        // Purchase gamepass using the buy-pass API logic
        const purchaseResult = await purchaseGamepass(
          suitableAccount.robloxCookie,
          transaction.gamepass.id,
          transaction.gamepass.name,
          transaction.gamepass.price,
          transaction.gamepass.sellerId,
        );

        if (purchaseResult.success) {
          // Update transaction status to completed
          await transaction.updateStatus(
            "order",
            "completed",
            `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username}`,
            null,
          );

          // Deduct robux from stock account
          suitableAccount.robux -= gamepassPrice;
          suitableAccount.lastChecked = new Date();
          await suitableAccount.save();

          processedCount++;

          console.log(
            `✅ Transaction ${transaction.invoiceId} completed successfully. Account ${suitableAccount.username} remaining robux: ${suitableAccount.robux}`,
          );

          // Update progress: completed
          progressDoc.transactions[i].status = "completed";
          progressDoc.summary.processedCount = processedCount;

          // Update stock account robux in progress
          const stockIdx = progressDoc.stockAccounts.findIndex(
            (s: {
              id: string;
              username: string;
              robux: number;
              status: string;
            }) => s.id === suitableAccount._id.toString(),
          );
          if (stockIdx !== -1) {
            progressDoc.stockAccounts[stockIdx].robux = suitableAccount.robux;
          }

          await progressDoc.save();

          // Wait 10 seconds before next purchase (unless this is the last one)
          const remainingTransactions =
            pendingTransactions.length -
            processedCount -
            skippedCount -
            failedCount;
          if (remainingTransactions > 0) {
            console.log("⏳ Waiting 10 seconds before next purchase...");
            progressDoc.currentStep = `Waiting 10 seconds before next purchase... (${processedCount}/${pendingTransactions.length} completed)`;
            await progressDoc.save();
            await sleep(4000);
          }
        } else {
          console.log(
            `❌ Failed to purchase gamepass for transaction ${transaction.invoiceId}: ${purchaseResult.error}`,
          );

          // Update progress: failed
          progressDoc.transactions[i].status = "failed";
          progressDoc.transactions[i].error =
            purchaseResult.error || "Purchase failed";
          progressDoc.summary.failedCount = ++failedCount;
          await progressDoc.save();

          skippedCount++;
          // Don't break, try next transaction
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
 * Purchase gamepass using the /api/buy-pass endpoint with Puppeteer
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
    console.log("🎯 Attempting to purchase gamepass via Puppeteer:", {
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
