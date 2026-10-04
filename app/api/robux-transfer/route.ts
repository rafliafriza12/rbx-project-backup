import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { autoTransferInstantRobux, executeRobuxTransfer } from "@/lib/robux-transfer";
import Transaction from "@/models/Transaction";
import StockAccount from "@/models/StockAccount";

/**
 * POST /api/robux-transfer
 *
 * Untuk trigger manual atau retry transfer Robux Instant.
 *
 * Body (mode 1 - by transactionId):
 * { transactionId: string }
 *
 * Body (mode 2 - standalone transfer):
 * {
 *   recipientUsername: string,
 *   robuxAmount: number,
 *   stockAccountId?: string,
 * }
 *
 * Security: Hanya boleh dipanggil oleh internal (x-internal-secret) atau admin.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth: internal secret
    const internalSecret = request.headers.get("x-internal-secret");
    const isInternal = internalSecret === process.env.INTERNAL_API_SECRET;

    if (!isInternal) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { transactionId, recipientUsername, robuxAmount, stockAccountId } = body;

    // ============================================================
    // MODE 1: Transfer by transactionId (retry dari admin panel)
    // ============================================================
    if (transactionId) {
      const transaction = await Transaction.findById(transactionId);
      if (!transaction) {
        return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
      }

      if (transaction.serviceType !== "robux_instant") {
        return NextResponse.json(
          { error: "Transaksi bukan tipe robux_instant" },
          { status: 400 },
        );
      }

      console.log(`[robux-transfer API] Retry transfer untuk Invoice: ${transaction.invoiceId}`);

      const result = await autoTransferInstantRobux(transaction, {
        specificStockAccountId: stockAccountId,
        executedBy: "admin-retry",
      });

      return NextResponse.json({
        success: result.success,
        message: result.message,
        invoiceId: transaction.invoiceId,
      }, { status: result.success ? 200 : 422 });
    }

    // ============================================================
    // MODE 2: Standalone transfer (manual test / direct call)
    // ============================================================
    if (!recipientUsername || typeof recipientUsername !== "string") {
      return NextResponse.json(
        { error: "recipientUsername atau transactionId diperlukan" },
        { status: 400 },
      );
    }

    if (!robuxAmount || typeof robuxAmount !== "number" || robuxAmount <= 0) {
      return NextResponse.json(
        { error: "robuxAmount diperlukan dan harus lebih dari 0" },
        { status: 400 },
      );
    }

    // Pilih stock account
    let stockAccount;
    if (stockAccountId) {
      stockAccount = await StockAccount.findById(stockAccountId);
      if (!stockAccount || stockAccount.status !== "active") {
        return NextResponse.json(
          { error: "Stock account tidak ditemukan atau tidak aktif" },
          { status: 404 },
        );
      }
    } else {
      stockAccount = await StockAccount.findOne({
        status: "active",
        robux: { $gte: robuxAmount },
      }).sort({ isRobuxPlus: -1, robux: 1 });

      if (!stockAccount) {
        return NextResponse.json(
          { error: "Tidak ada stock account aktif dengan robux yang cukup", required: robuxAmount },
          { status: 422 },
        );
      }
    }

    console.log(
      `[robux-transfer API] Standalone transfer ${robuxAmount} R$ ke "${recipientUsername}" via ${stockAccount.username}`,
    );

    const result = await executeRobuxTransfer({
      cookie: stockAccount.robloxCookie,
      username: recipientUsername,
      robuxAmount,
      stockAccountId: stockAccount._id.toString(),
      stockAccountUsername: stockAccount.username,
      executedBy: "api-manual",
    });

    if (result.success) {
      stockAccount.robux = Math.max(0, stockAccount.robux - robuxAmount);
      stockAccount.lastChecked = new Date();
      await stockAccount.save();

      return NextResponse.json({
        success: true,
        data: {
          recipientUsername: result.recipientUsername,
          recipientId: result.recipientId,
          robuxAmount,
          rxtToken: result.rxtToken,
          senderUsername: stockAccount.username,
          senderRobuxRemaining: stockAccount.robux,
          purchaseRunId: result.purchaseRunId,
        },
      });
    }

    // Transfer gagal — jika sender diblokir, nonaktifkan akun
    if (result.failureReasonCode === 13) {
      console.warn(`⚠️ Akun ${stockAccount.username} diblokir (failureReason=13). Menandai inactive.`);
      stockAccount.status = "inactive";
      await stockAccount.save();
    }

    return NextResponse.json(
      {
        success: false,
        error: result.failureReason || "Transfer gagal",
        failureReasonCode: result.failureReasonCode,
        senderUsername: stockAccount.username,
        purchaseRunId: result.purchaseRunId,
      },
      { status: 422 },
    );
  } catch (error: any) {
    console.error("[robux-transfer] Unexpected error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
