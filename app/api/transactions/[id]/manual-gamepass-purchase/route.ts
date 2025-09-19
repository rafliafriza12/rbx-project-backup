import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import StockAccount from "@/models/StockAccount";

// Function to process gamepass purchase for robux_5_hari
async function processGamepassPurchase(transaction: any) {
  try {
    console.log(
      "Manual gamepass purchase for transaction:",
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
        "failed",
        `Tidak ada akun dengan robux mencukupi (diperlukan: ${gamepassPrice})`,
        null
      );
      return {
        success: false,
        message: `Tidak ada akun dengan robux mencukupi (diperlukan: ${gamepassPrice})`,
      };
    }

    console.log("Suitable account found:", suitableAccount.username);

    // Validate dan update account data terlebih dahulu
    const updateAccountResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/admin/stock-accounts/${suitableAccount._id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          robloxCookie: suitableAccount.robloxCookie,
        }),
      }
    );

    if (!updateAccountResponse.ok) {
      console.error("Failed to update account data");
      await transaction.updateStatus(
        "order",
        "failed",
        "Gagal memvalidasi akun stock",
        null
      );
      return { success: false, message: "Gagal memvalidasi akun stock" };
    }

    const updatedAccountData = await updateAccountResponse.json();

    if (!updatedAccountData.success) {
      console.error("Account validation failed:", updatedAccountData.message);
      await transaction.updateStatus(
        "order",
        "failed",
        `Validasi akun gagal: ${updatedAccountData.message}`,
        null
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
        "failed",
        `Robux tidak mencukupi setelah validasi (tersedia: ${updatedAccountData.stockAccount.robux}, diperlukan: ${gamepassPrice})`,
        null
      );
      return {
        success: false,
        message: `Robux tidak mencukupi setelah validasi (tersedia: ${updatedAccountData.stockAccount.robux}, diperlukan: ${gamepassPrice})`,
      };
    }

    // Lakukan purchase gamepass
    const purchaseResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/buy-pass`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          robloxCookie: suitableAccount.robloxCookie,
          productId: transaction.gamepass.productId,
          price: transaction.gamepass.price,
          sellerId: transaction.gamepass.sellerId,
        }),
      }
    );

    const purchaseResult = await purchaseResponse.json();
    console.log(purchaseResult);
    if (purchaseResult.success) {
      console.log("Gamepass purchase successful");

      // Update order status to completed
      await transaction.updateStatus(
        "order",
        "completed",
        `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username} (Manual)`,
        null
      );

      // Update account data setelah purchase
      await fetch(
        `${
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        }/api/admin/stock-accounts/${suitableAccount._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            robloxCookie: suitableAccount.robloxCookie,
          }),
        }
      );

      return {
        success: true,
        message: `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username}`,
      };
    } else {
      console.error("Gamepass purchase failed:", purchaseResult.message);
      await transaction.updateStatus(
        "order",
        "failed",
        `Pembelian gamepass gagal: ${purchaseResult.message}`,
        null
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
      "failed",
      `Error saat memproses pembelian gamepass: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      null
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
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const transactionId = params.id;

    // Get transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Validate conditions
    if (
      transaction.serviceType !== "robux" ||
      transaction.serviceCategory !== "robux_5_hari"
    ) {
      return NextResponse.json(
        { error: "Invalid service type for gamepass purchase" },
        { status: 400 }
      );
    }

    if (transaction.paymentStatus !== "settlement") {
      return NextResponse.json(
        {
          error: "Payment must be settled before processing gamepass purchase",
        },
        { status: 400 }
      );
    }

    if (!transaction.gamepass) {
      return NextResponse.json(
        { error: "No gamepass data found for this transaction" },
        { status: 400 }
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
      { status: 500 }
    );
  }
}
