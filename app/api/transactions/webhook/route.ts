import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import StockAccount from "@/models/StockAccount";
import MidtransService from "@/lib/midtrans";

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
        "failed",
        `Tidak ada akun dengan robux mencukupi (diperlukan: ${gamepassPrice})`,
        null
      );
      return;
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
      return;
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
      return;
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
      return;
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

    if (purchaseResult.success) {
      console.log("Gamepass purchase successful");

      // Update order status to completed
      await transaction.updateStatus(
        "order",
        "completed",
        `Gamepass berhasil dibeli menggunakan akun ${suitableAccount.username}`,
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
    } else {
      console.error("Gamepass purchase failed:", purchaseResult.message);
      await transaction.updateStatus(
        "order",
        "failed",
        `Pembelian gamepass gagal: ${purchaseResult.message}`,
        null
      );
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

    // Cari transaksi berdasarkan Midtrans order ID
    const transaction = await Transaction.findOne({
      midtransOrderId: order_id,
    });

    if (!transaction) {
      console.error("Transaction not found for order_id:", order_id);
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Update transaction ID dari Midtrans
    if (transaction_id && !transaction.midtransTransactionId) {
      transaction.midtransTransactionId = transaction_id;
    }

    // Map status Midtrans ke status aplikasi
    const statusMapping = midtransService.mapMidtransStatus(
      transaction_status,
      payment_type
    );
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
          // Don't fail the webhook if user update fails
        }
      }

      // Khusus untuk robux_5_hari: proses gamepass purchase
      if (
        statusMapping.paymentStatus === "settlement" &&
        previousPaymentStatus !== "settlement" &&
        transaction.serviceType === "robux" &&
        transaction.serviceCategory === "robux_5_hari" &&
        transaction.gamepass
      ) {
        await processGamepassPurchase(transaction);
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

    // Log webhook untuk debugging
    console.log("Transaction updated:", {
      invoiceId: transaction.invoiceId,
      previousPaymentStatus,
      newPaymentStatus: transaction.paymentStatus,
      previousOrderStatus,
      newOrderStatus: transaction.orderStatus,
    });

    // Kirim response sukses ke Midtrans
    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      data: {
        invoiceId: transaction.invoiceId,
        paymentStatus: transaction.paymentStatus,
        orderStatus: transaction.orderStatus,
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
