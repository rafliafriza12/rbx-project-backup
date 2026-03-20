import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import StockAccount from "@/models/StockAccount";
import Rbx5Stats from "@/models/Rbx5Stats";
import MidtransService from "@/lib/midtrans";
import EmailService from "@/lib/email";
import mongoose from "mongoose";
import { POST as buyPassHandler } from "@/app/api/buy-pass/route";
import { requireAdmin, authenticateToken, requireApiKey } from "@/lib/auth";
import {
  notifyPaymentStatusChange,
  notifyOrderStatusChange,
} from "@/lib/discord";
import { maskEmail, maskUsername, maskName } from "@/lib/mask";

// Function to process gamepass purchase for robux_5_hari
async function processGamepassPurchase(transaction: any) {
  try {
    console.log(
      "Processing gamepass purchase for transaction:",
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
          "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
        },
        body: JSON.stringify({
          robloxCookie: suitableAccount.robloxCookie,
        }),
      },
    );

    if (!updateAccountResponse.ok) {
      console.error("Failed to update account data");
      await transaction.updateStatus(
        "order",
        "pending",
        "Pesanan sedang diproses",
        null,
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
        null,
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
        null,
      );
      return;
    }

    // Lakukan purchase gamepass (using direct import with Puppeteer)
    console.log("🎯 Purchasing gamepass via Puppeteer...");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const purchaseRequest = new NextRequest(`${apiUrl}/api/buy-pass`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      },
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

    if (purchaseResult.success) {
      console.log("Gamepass purchase successful");

      // Update order status to completed
      await transaction.updateStatus(
        "order",
        "completed",
        `Gamepass berhasil dibeli`,
        null,
      );

      // Update account data setelah purchase - langsung kurangi robux di database
      // Tidak perlu fetch ke Roblox lagi (menghindari socket error / rate limit)
      console.log("🔄 Updating stock account robux in database...");
      const gamepassPrice = transaction.gamepass?.price || 0;
      suitableAccount.robux = Math.max(
        0,
        suitableAccount.robux - gamepassPrice,
      );
      suitableAccount.lastChecked = new Date();
      await suitableAccount.save();
      console.log(
        `✅ Account ${suitableAccount.username} robux updated: ${suitableAccount.robux} (deducted ${gamepassPrice})`,
      );

      // Record purchase di stats (untuk mode manual & tracking)
      try {
        await Rbx5Stats.recordPurchase(gamepassPrice, 1);
        console.log("📊 Rbx5Stats updated after purchase");
      } catch (statsError) {
        console.warn("⚠️ Failed to update Rbx5Stats:", statsError);
      }
    } else {
      console.error("Gamepass purchase failed:", purchaseResult.message);
      await transaction.updateStatus(
        "order",
        "pending",
        `Pesanan sedang diproses`,
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

// GET - Get transaction by ID atau invoice ID (with related transactions for multi-checkout)
// Requires authentication: admin gets full data, user gets own transaction (sanitized)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // WAJIB: Validasi API key
    const apiKeyError = requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await dbConnect();

    // ============================================================
    // AUTH: Must be logged in (admin or user)
    // ============================================================
    let currentUser: any = null;
    let isAdmin = false;

    try {
      currentUser = await authenticateToken(request);
      isAdmin = currentUser?.accessRole === "admin";
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transactionId = id;

    // Buat array kondisi query
    const conditions: any[] = [
      { invoiceId: transactionId },
      { midtransOrderId: transactionId },
    ];

    // Hanya push _id kalau valid ObjectId
    if (mongoose.Types.ObjectId.isValid(transactionId)) {
      conditions.push({ _id: transactionId });
    }

    const transaction = await Transaction.findOne({
      $or: conditions,
    }).populate("customerInfo.userId", "username email");

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Non-admin: verify ownership
    if (!isAdmin) {
      const txUserId =
        transaction.customerInfo?.userId?._id?.toString() ||
        transaction.customerInfo?.userId?.toString();
      if (!txUserId || txUserId !== currentUser._id.toString()) {
        return NextResponse.json(
          { error: "Forbidden: Anda tidak memiliki akses ke transaksi ini" },
          { status: 403 },
        );
      }
    }

    // Check if this is part of a multi-checkout (grouped by midtransOrderId)
    let relatedTransactions: any[] = [];
    let isMultiCheckout = false;

    if (transaction.midtransOrderId) {
      // Find all transactions with the same midtransOrderId
      relatedTransactions = await Transaction.find({
        midtransOrderId: transaction.midtransOrderId,
        _id: { $ne: transaction._id }, // Exclude the current transaction
      })
        .populate("customerInfo.userId", "username email")
        .sort({ createdAt: 1 });

      isMultiCheckout = relatedTransactions.length > 0;
    }

    // Admin: return full data
    if (isAdmin) {
      const responseData = transaction.toObject();
      responseData.relatedTransactions = relatedTransactions;
      responseData.isMultiCheckout = isMultiCheckout;

      return NextResponse.json({
        success: true,
        data: responseData,
      });
    }

    // User: return sanitized data (strip sensitive fields)
    const safeTransaction = {
      _id: transaction._id.toString(),
      serviceType: transaction.serviceType,
      serviceId: transaction.serviceId.toString(),
      serviceName: transaction.serviceName,
      serviceImage: transaction.serviceImage || "",
      serviceCategory: transaction.serviceCategory,
      quantity: transaction.quantity,
      unitPrice: transaction.unitPrice,
      totalAmount: transaction.totalAmount,
      discountPercentage: transaction.discountPercentage || 0,
      discountAmount: transaction.discountAmount || 0,
      finalAmount: transaction.finalAmount || transaction.totalAmount,
      robloxUsername: maskUsername(transaction.robloxUsername),
      // REMOVED: robloxPassword, jokiDetails, robuxInstantDetails, rbx5Details sensitive data
      gamepass: transaction.gamepass || {},
      gamepassDetails: transaction.gamepassDetails || {},
      paymentStatus: transaction.paymentStatus,
      orderStatus: transaction.orderStatus,
      paymentMethodName: transaction.paymentMethodName || null,
      paymentFee: transaction.paymentFee || 0,
      customerInfo: {
        name: maskName(transaction.customerInfo?.name || ""),
        email: maskEmail(transaction.customerInfo?.email || ""),
        userId: transaction.customerInfo?.userId,
      },
      invoiceId: transaction.invoiceId,
      statusHistory: (transaction.statusHistory || []).map((h: any) => ({
        status: h.status,
        updatedAt: h.timestamp || h.updatedAt,
        notes: h.notes || "",
        // REMOVED: updatedBy
      })),
      expiresAt: transaction.expiresAt,
      // REMOVED: midtransOrderId, snapToken, redirectUrl, adminNotes
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
      paidAt: transaction.paidAt,
      completedAt: transaction.completedAt,
      relatedTransactions: relatedTransactions.map((t: any) => ({
        _id: t._id.toString(),
        serviceType: t.serviceType,
        serviceName: t.serviceName,
        serviceImage: t.serviceImage || "",
        quantity: t.quantity,
        unitPrice: t.unitPrice,
        totalAmount: t.totalAmount,
        finalAmount: t.finalAmount || t.totalAmount,
        robloxUsername: maskUsername(t.robloxUsername),
        orderStatus: t.orderStatus,
        invoiceId: t.invoiceId,
        createdAt: t.createdAt,
      })),
      isMultiCheckout,
    };

    return NextResponse.json({
      success: true,
      data: safeTransaction,
    });
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction" },
      { status: 500 },
    );
  }
}

// PUT - Update transaction status (untuk admin)
export async function PUT(
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

    const { id } = await params;
    const transactionId = id;
    const body = await request.json();
    const { statusType, newStatus, notes, updatedBy } = body;

    // Validasi input
    if (!statusType || !newStatus) {
      return NextResponse.json(
        { error: "Status type and new status are required" },
        { status: 400 },
      );
    }

    if (!["payment", "order"].includes(statusType)) {
      return NextResponse.json(
        { error: "Invalid status type. Must be 'payment' or 'order'" },
        { status: 400 },
      );
    }

    // Cari transaksi
    const transaction = await Transaction.findOne({
      $or: [
        { _id: transactionId },
        { invoiceId: transactionId },
        { midtransOrderId: transactionId },
      ],
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Store old status untuk comparison
    const oldPaymentStatus = transaction.paymentStatus;
    const oldOrderStatus = transaction.orderStatus;

    // Debug: Log transaction structure
    console.log("Transaction structure:", {
      _id: transaction._id,
      customerInfo: transaction.customerInfo,
      hasUserId: !!transaction.customerInfo?.userId,
    });

    // Update status menggunakan method
    await transaction.updateStatus(statusType, newStatus, notes, updatedBy);
    console.log("halooo");

    // Debug: Check all conditions for spendedMoney update
    console.log("=== Debug spendedMoney update conditions ===");
    console.log("statusType:", statusType);
    console.log("newStatus:", newStatus);
    console.log("oldPaymentStatus:", oldPaymentStatus);
    console.log(
      "transaction.customerInfo?.userId:",
      transaction.customerInfo?.userId,
    );
    console.log("statusType === 'payment':", statusType === "payment");
    console.log("newStatus === 'settlement':", newStatus === "settlement");
    console.log(
      "oldPaymentStatus !== 'settlement':",
      oldPaymentStatus !== "settlement",
    );
    console.log(
      "!!transaction.customerInfo?.userId:",
      !!transaction.customerInfo?.userId,
    );

    // Jika payment status berubah menjadi settlement dan transaksi memiliki userId
    if (
      statusType === "payment" &&
      newStatus === "settlement" &&
      oldPaymentStatus !== "settlement" &&
      transaction.customerInfo?.userId
    ) {
      console.log("halooo 1");
      console.log("Entering spendedMoney update logic");
      try {
        // Update spendedMoney user
        const user = await User.findById(transaction.customerInfo.userId);
        if (user) {
          // Gunakan finalAmount, fallback ke totalAmount untuk safety
          const amountToAdd =
            transaction.finalAmount || transaction.totalAmount;
          console.log("finalAmount:", transaction.finalAmount);
          console.log("totalAmount:", transaction.totalAmount);
          console.log("amount to add : ", amountToAdd);
          user.spendedMoney += amountToAdd;
          await user.save();

          console.log(
            `Updated spendedMoney for user ${user.email}: +${amountToAdd} (total: ${user.spendedMoney})`,
          );
        } else {
          console.log(
            "User not found with ID:",
            transaction.customerInfo.userId,
          );
        }
      } catch (userUpdateError) {
        console.error("Error updating user spendedMoney:", userUpdateError);
        // Don't fail the transaction update if user update fails
      }
    }

    // Khusus untuk robux_5_hari: proses gamepass purchase saat payment status diubah ke settlement
    if (
      statusType === "payment" &&
      newStatus === "settlement" &&
      oldPaymentStatus !== "settlement" &&
      transaction.serviceType === "robux" &&
      transaction.serviceCategory === "robux_5_hari" &&
      transaction.gamepass
    ) {
      console.log(
        "Admin changed payment to settlement - processing gamepass purchase",
      );
      await processGamepassPurchase(transaction);
    }

    if (statusType === "payment" && newStatus === "settlement") {
      try {
        console.log(
          `Sending invoice email to ${transaction.customerInfo.email} (admin changed order to completed)`,
        );
        await EmailService.sendInvoiceEmail(transaction);
        console.log("Invoice email sent successfully");
      } catch (emailError) {
        console.error("Error sending invoice email:", emailError);
        // Don't fail the status update if email fails
      }
    }

    // Send invoice email when order status becomes completed
    if (
      statusType === "order" &&
      newStatus === "completed" &&
      oldOrderStatus !== "completed" &&
      transaction.customerInfo?.email
    ) {
      try {
        console.log(
          `Sending invoice email to ${transaction.customerInfo.email} (admin changed order to completed)`,
        );
        await EmailService.sendInvoiceEmail(transaction);
        console.log("Invoice email sent successfully");
      } catch (emailError) {
        console.error("Error sending invoice email:", emailError);
        // Don't fail the status update if email fails
      }
    }

    // Send Discord notification only for settlement (payment) and completed (order)
    try {
      if (
        statusType === "payment" &&
        newStatus === "settlement" &&
        oldPaymentStatus !== newStatus
      ) {
        await notifyPaymentStatusChange(
          transaction,
          oldPaymentStatus,
          newStatus,
          notes,
        );
      }
      if (
        statusType === "order" &&
        newStatus === "completed" &&
        oldOrderStatus !== newStatus
      ) {
        await notifyOrderStatusChange(
          transaction,
          oldOrderStatus,
          newStatus,
          notes,
        );
      }
    } catch (discordError) {
      console.error("Error sending Discord notification:", discordError);
    }

    return NextResponse.json({
      success: true,
      data: transaction,
      message: `${statusType} status updated to ${newStatus}`,
    });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 },
    );
  }
}

// DELETE - Cancel transaction

export async function DELETE(
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
    const { id } = await params;
    const transactionId = id;

    // Cari transaksi
    const transaction = await Transaction.findOne({
      $or: [
        { _id: transactionId },
        { invoiceId: transactionId },
        { midtransOrderId: transactionId },
      ],
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Cek apakah bisa dibatalkan
    if (transaction.paymentStatus === "settlement") {
      return NextResponse.json(
        { error: "Cannot cancel settlement transaction" },
        { status: 400 },
      );
    }

    // Cancel di Midtrans jika belum expired
    if (transaction.paymentStatus === "pending" && transaction.snapToken) {
      try {
        const midtransService = new MidtransService();
        await midtransService.cancelTransaction(transaction.midtransOrderId);
      } catch (midtransError) {
        console.warn("Failed to cancel in Midtrans:", midtransError);
        // Continue dengan cancel di database meskipun Midtrans gagal
      }
    }

    // Update status
    await transaction.updateStatus(
      "payment",
      "cancelled",
      "Transaction cancelled by user",
    );
    await transaction.updateStatus(
      "order",
      "cancelled",
      "Transaction cancelled by user",
    );

    return NextResponse.json({
      success: true,
      data: transaction,
      message: "Transaction cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling transaction:", error);
    return NextResponse.json(
      { error: "Failed to cancel transaction" },
      { status: 500 },
    );
  }
}
