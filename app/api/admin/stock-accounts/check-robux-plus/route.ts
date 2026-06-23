import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StockAccount from "@/models/StockAccount";
import { checkRobuxPlus } from "@/utils/checkRobuxPlus";
import { requireAdmin, requireApiKey } from "@/lib/auth";

/**
 * POST /api/admin/stock-accounts/check-robux-plus
 *
 * Cek dan update status Robux Plus untuk satu atau semua akun stock.
 *
 * Body: { stockAccountId?: string }
 *   - Jika stockAccountId diberikan → cek akun tersebut saja
 *   - Jika kosong → cek semua akun aktif (batch)
 */
export async function POST(req: NextRequest) {
  const apiKeyError = requireApiKey(req);
  if (apiKeyError) return apiKeyError;

  try {
    await requireAdmin(req);
  } catch (authError: any) {
    const status = authError.message.includes("Forbidden") ? 403 : 401;
    return NextResponse.json({ error: authError.message }, { status });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { stockAccountId } = body;

    await connectDB();

    // ── Mode: satu akun ────────────────────────────────────────────────────
    if (stockAccountId) {
      const account = await StockAccount.findById(stockAccountId);
      if (!account) {
        return NextResponse.json(
          { success: false, message: "Stock account tidak ditemukan" },
          { status: 404 },
        );
      }

      console.log(
        `🔍 [CheckRobuxPlus] Mengecek akun @${account.username} (${account.userId})...`,
      );

      const result = await checkRobuxPlus(account.robloxCookie);

      account.isRobuxPlus = result.isRobuxPlus;
      account.robuxPlusVerifiedAt = new Date();
      await account.save();

      console.log(
        `✅ [CheckRobuxPlus] @${account.username}: isRobuxPlus=${result.isRobuxPlus}`,
      );

      return NextResponse.json({
        success: true,
        username: account.username,
        isRobuxPlus: result.isRobuxPlus,
        subscriptionDetails: result.subscriptionDetails,
        error: result.error,
        message: result.isRobuxPlus
          ? `⭐ Akun @${account.username} memiliki Robux Plus aktif!`
          : `Akun @${account.username} tidak memiliki Robux Plus.`,
      });
    }

    // ── Mode: semua akun aktif (batch) ────────────────────────────────────
    const accounts = await StockAccount.find({ status: "active" });
    console.log(
      `🔍 [CheckRobuxPlus] Mengecek ${accounts.length} akun aktif...`,
    );

    const results = [];
    for (const account of accounts) {
      try {
        const result = await checkRobuxPlus(account.robloxCookie);
        account.isRobuxPlus = result.isRobuxPlus;
        account.robuxPlusVerifiedAt = new Date();
        await account.save();

        results.push({
          username: account.username,
          userId: account.userId,
          isRobuxPlus: result.isRobuxPlus,
          error: result.error,
        });

        console.log(
          `  → @${account.username}: isRobuxPlus=${result.isRobuxPlus}${result.error ? ` (${result.error})` : ""}`,
        );

        // Jeda antar request supaya tidak kena rate limit
        await new Promise((r) => setTimeout(r, 500));
      } catch (e: any) {
        results.push({
          username: account.username,
          userId: account.userId,
          isRobuxPlus: false,
          error: e.message,
        });
      }
    }

    const plusCount = results.filter((r) => r.isRobuxPlus).length;
    console.log(
      `✅ [CheckRobuxPlus] Selesai: ${plusCount}/${accounts.length} akun punya Robux Plus.`,
    );

    return NextResponse.json({
      success: true,
      total: accounts.length,
      robuxPlusCount: plusCount,
      results,
      message: `Selesai: ${plusCount} dari ${accounts.length} akun memiliki Robux Plus.`,
    });
  } catch (error: any) {
    console.error("❌ [CheckRobuxPlus] Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
