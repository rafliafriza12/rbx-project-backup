import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import StockAccount from "@/models/StockAccount";
import Rbx5Stats from "@/models/Rbx5Stats";
import { PUT as updateStockAccountHandler } from "@/app/api/admin/stock-accounts/[id]/route";
import { POST as buyPassHandler } from "@/app/api/buy-pass/route";
import { requireAdmin, requireApiKey } from "@/lib/auth";

// Function to process gamepass purchase for robux_5_hari
async function processGamepassPurchase(transaction: any) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    console.log(
      "Manual gamepass purchase for transaction:",
      transaction.invoiceId,
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
      return {
        success: false,
        message: "Data gamepass tidak lengkap (id atau price tidak ada)",
      };
    }

    const gamepassPrice = gamepassData.price;

    // Cari SEMUA akun yang memiliki robux sama atau lebih dari price gamepass
    const suitableAccounts = await StockAccount.find({
      robux: { $gte: gamepassPrice },
      status: "active",
    }).sort({ robux: 1 }); // Sort ascending untuk menggunakan akun dengan robux paling sedikit yang mencukupi

    if (!suitableAccounts || suitableAccounts.length === 0) {
      console.log("No suitable account found for gamepass purchase");
      // Update order status to pending
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null,
      );
      return {
        success: false,
        message: `Tidak ada akun dengan robux mencukupi (diperlukan: ${gamepassPrice})`,
      };
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
      console.log("🎯 Purchasing gamepass...");
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
      console.log(purchaseResult);
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
        return {
          success: true,
          message: `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username}`,
        };
      } else {
        console.error("Gamepass purchase failed:", purchaseResult.message);
        const errMsgLower = (purchaseResult.message || "").toLowerCase();
        if (errMsgLower.includes("rate limit") || errMsgLower.includes("too many requests") || errMsgLower.includes("challenge")) {
          lastErrorMessage = `Pembelian gagal (Rate Limit), mencoba akun lain...`;
          continue;
        }

        lastErrorMessage = `Pembelian gamepass gagal: ${purchaseResult.message}`;
        break; // Stop and fail for price mismatch etc.
      }
    }

    if (!purchaseSuccess) {
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses. ${lastErrorMessage}`,
        null,
      );
      return {
        success: false,
        message: lastErrorMessage || "Semua akun stok gagal digunakan",
      };
    }
  } catch (error) {
    console.error("Error processing gamepass purchase:", error);
    await transaction.updateStatus(
      "order",
      "pending",
      `Pesanan sedang diproses`,
      null,
    );
    return {
      success: false,
      message: `Error saat memproses pembelian gamepass: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // WAJIB: Validasi API key
    const apiKeyError = requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await dbConnect();

    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const { id: transactionId } = await params;

    // Get transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Validate conditions
    if (
      transaction.serviceType !== "robux" ||
      transaction.serviceCategory !== "robux_5_hari"
    ) {
      return NextResponse.json(
        { error: "Invalid service type for gamepass purchase" },
        { status: 400 },
      );
    }

    if (transaction.paymentStatus !== "settlement") {
      return NextResponse.json(
        {
          error: "Payment must be settled before processing gamepass purchase",
        },
        { status: 400 },
      );
    }

    if (!transaction.gamepass) {
      return NextResponse.json(
        { error: "No gamepass data found for this transaction" },
        { status: 400 },
      );
    }

    // Process gamepass purchase
    const result = await processGamepassPurchase(transaction);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
      });
    } else {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in manual gamepass purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
