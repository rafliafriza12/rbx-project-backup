import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import StockAccount from "@/models/StockAccount";
import { PUT as updateStockAccountHandler } from "@/app/api/admin/stock-accounts/[id]/route";
import { POST as buyPassHandler } from "@/app/api/buy-pass/route";

// Function to process gamepass purchase for robux_5_hari
async function processGamepassPurchase(transaction: any) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    console.log(
      "Manual gamepass purchase for transaction:",
      transaction.invoiceId,
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
        null,
      );
      return {
        success: false,
        message: `Tidak ada akun dengan robux mencukupi (diperlukan: ${gamepassPrice})`,
      };
    }

    console.log("Suitable account found:", suitableAccount.username);

    // Validate dan update account data terlebih dahulu (using direct import)
    console.log("🔄 Updating stock account data...");
    const updateRequest = new NextRequest(
      `${apiUrl}/api/admin/stock-accounts/${suitableAccount._id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
      console.error("❌ Failed to update account data");
      await transaction.updateStatus(
        "order",
        "pending",
        "Pesanan sedang diproses",
        null,
      );
      return { success: false, message: "Gagal memvalidasi akun stock" };
    }

    const updatedAccountData = await updateAccountResponse.json();

    if (!updatedAccountData.success) {
      console.error("Account validation failed:", updatedAccountData.message);
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null,
      );
      return {
        success: false,
        message: `Validasi akun gagal: ${updatedAccountData.message}`,
      };
    }

    // Cek apakah robux masih mencukupi setelah update
    if (updatedAccountData.stockAccount.robux < gamepassPrice) {
      console.log("Account robux insufficient after update");
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null,
      );
      return {
        success: false,
        message: `Robux tidak mencukupi setelah validasi (tersedia: ${updatedAccountData.stockAccount.robux}, diperlukan: ${gamepassPrice})`,
      };
    }

    // Lakukan purchase gamepass (using direct import with Puppeteer)
    console.log("🎯 Purchasing gamepass...");
    const purchaseRequest = new NextRequest(`${apiUrl}/api/buy-pass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        robloxCookie: suitableAccount.robloxCookie,
        gamepassId: transaction.gamepass.id,
        gamepassName: transaction.gamepass.name,
        price: transaction.gamepass.price,
        sellerId: transaction.gamepass.sellerId,
      }),
    });

    const purchaseResponse = await buyPassHandler(purchaseRequest);
    const purchaseResult = await purchaseResponse.json();
    console.log(purchaseResult);
    if (purchaseResult.success) {
      console.log("Gamepass purchase successful");

      // Update order status to completed
      await transaction.updateStatus(
        "order",
        "completed",
        `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username} (Manual)`,
        null,
      );

      // Update account data setelah purchase (using direct import)
      console.log("🔄 Updating stock account after purchase...");
      const updateAfterRequest = new NextRequest(
        `${apiUrl}/api/admin/stock-accounts/${suitableAccount._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            robloxCookie: suitableAccount.robloxCookie,
          }),
        },
      );

      await updateStockAccountHandler(updateAfterRequest, {
        params: Promise.resolve({ id: suitableAccount._id.toString() }),
      });

      return {
        success: true,
        message: `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username}`,
      };
    } else {
      console.error("Gamepass purchase failed:", purchaseResult.message);
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
        null,
      );
      return {
        success: false,
        message: `Pembelian gamepass gagal: ${purchaseResult.message}`,
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
    await dbConnect();

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
