import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin, requireApiKey } from "@/lib/auth";
import StockAccount from "@/models/StockAccount";
import {
  executeRobuxTransfer,
  autoTransferInstantRobux,
} from "@/lib/robux-transfer";

/**
 * POST /api/robux-instant/transfer
 *
 * Endpoint untuk mengeksekusi transfer Robux Instant.
 * Mendukung dua mode:
 * 1. Mode Transaksi: { transactionId: "..." }
 * 2. Mode Direct / Manual Test: { username: "...", robuxAmount: 100, stockAccountId?: "..." }
 */
export async function POST(request: NextRequest) {
  try {
    const internalSecret = request.headers.get("x-internal-secret");
    const isInternal =
      !!process.env.INTERNAL_API_SECRET &&
      internalSecret === process.env.INTERNAL_API_SECRET;

    // Jika bukan internal call, wajibkan API key dan admin auth
    if (!isInternal) {
      const apiKeyError = requireApiKey(request);
      if (apiKeyError) return apiKeyError;

      try {
        await requireAdmin(request);
      } catch (authError: any) {
        const status = authError.message.includes("Forbidden") ? 403 : 401;
        return NextResponse.json({ error: authError.message }, { status });
      }
    }

    await dbConnect();
    const body = await request.json();

    // MODE 1: Berdasarkan Transaction ID
    if (body.transactionId) {
      const result = await autoTransferInstantRobux(body.transactionId, {
        specificStockAccountId: body.stockAccountId,
        executedBy: body.executedBy || "admin",
      });

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            message: result.message,
            transaction: result.transaction,
          },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        transaction: result.transaction,
        purchaseRun: result.purchaseRun,
      });
    }

    // MODE 2: Direct Transfer (Username + Amount)
    const { username, robuxAmount, stockAccountId } = body;

    if (!username || !username.trim()) {
      return NextResponse.json(
        { success: false, message: "Username Roblox wajib diisi" },
        { status: 400 },
      );
    }

    const amount = parseInt(robuxAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Jumlah Robux harus berupa angka lebih dari 0" },
        { status: 400 },
      );
    }

    // Cari stock account
    let selectedAccount = null;
    if (stockAccountId) {
      selectedAccount = await StockAccount.findById(stockAccountId);
      if (!selectedAccount) {
        return NextResponse.json(
          { success: false, message: "Stock account yang dipilih tidak ditemukan" },
          { status: 404 },
        );
      }
      if (selectedAccount.status !== "active") {
        return NextResponse.json(
          { success: false, message: "Stock account yang dipilih berstatus tidak aktif" },
          { status: 400 },
        );
      }
      if (selectedAccount.robux < amount) {
        return NextResponse.json(
          {
            success: false,
            message: `Saldo Robux akun ${selectedAccount.username} (${selectedAccount.robux} R$) tidak mencukupi untuk transfer ${amount} R$`,
          },
          { status: 400 },
        );
      }
    } else {
      // Auto-pilih akun aktif dengan saldo cukup
      selectedAccount = await StockAccount.findOne({
        status: "active",
        robux: { $gte: amount },
      }).sort({ isRobuxPlus: -1, robux: 1 });

      if (!selectedAccount) {
        return NextResponse.json(
          {
            success: false,
            message: `Tidak ada akun stock aktif dengan saldo Robux >= ${amount}`,
          },
          { status: 400 },
        );
      }
    }

    console.log(
      `[API robux-instant/transfer] Eksekusi direct transfer: @${selectedAccount.username} -> @${username} (${amount} Robux)`,
    );

    const transferResult = await executeRobuxTransfer({
      cookie: selectedAccount.robloxCookie,
      username,
      robuxAmount: amount,
      stockAccountId: selectedAccount._id.toString(),
      stockAccountUsername: selectedAccount.username,
      invoiceId: body.invoiceId,
      executedBy: body.executedBy || "admin_direct",
    });

    if (transferResult.success) {
      // Kurangi saldo akun stock
      selectedAccount.robux = Math.max(0, selectedAccount.robux - amount);
      selectedAccount.lastChecked = new Date();
      await selectedAccount.save();

      return NextResponse.json({
        success: true,
        message: `Berhasil mentransfer ${amount} Robux ke @${transferResult.recipientUsername}!`,
        data: transferResult,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: transferResult.failureReason || "Transfer Robux Instant gagal",
          failureReasonCode: transferResult.failureReasonCode,
          data: transferResult,
        },
        { status: 400 },
      );
    }
  } catch (error: any) {
    console.error("[API robux-instant/transfer] Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Terjadi kesalahan internal server",
      },
      { status: 500 },
    );
  }
}
