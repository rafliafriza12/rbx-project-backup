import { NextRequest, NextResponse } from "next/server";
import { calculateGamepassAmount } from "@/utils/checkRobuxPlus";

/**
 * GET /api/gamepass-amount?robux=100
 *
 * Mengembalikan gamepassAmount yang harus dibuat customer di Roblox.
 * SELALU kembalikan harga BASE (× 1.43) — TIDAK pernah pre-apply diskon Robux Plus.
 *
 * Kenapa?
 * - Customer listing gamepass di harga NORMAL (143 untuk 100 Robux)
 * - Saat Robux Plus stock account beli:
 *   → Roblox apply diskon 10% ke buyer OTOMATIS
 *   → REST product-info dengan cookie Robux Plus return PriceInRobux: 129 (bukan 143)
 *   → Sistem kirim expectedPrice: 129 ke purchase API → berhasil!
 *   → Creator tetap terima 143 × 0.7 = 100 Robux ✅
 *
 * Jika kita tampilkan 129 ke customer:
 *   Customer listing 129 → Robux Plus apply diskon lagi → 117
 *   Sistem kirim expectedPrice: 117 → PriceChanged ❌ (double discount!)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const robuxParam = searchParams.get("robux");
  const robuxAmount = parseInt(robuxParam || "0", 10);

  if (isNaN(robuxAmount) || robuxAmount <= 0) {
    return NextResponse.json(
      { success: false, message: "Parameter robux harus berupa angka positif" },
      { status: 400 },
    );
  }

  const feeMultiplier = parseFloat(
    process.env.NEXT_PUBLIC_GAMEPASS_FEE_MULTIPLIER || "1.43",
  );

  // Selalu harga base — diskon Robux Plus ditangani otomatis oleh Roblox saat purchase
  const gamepassAmount = calculateGamepassAmount(robuxAmount, false, 0, feeMultiplier);

  return NextResponse.json({
    success: true,
    gamepassAmount,
    isRobuxPlus: false,
    discountPercent: 0,
    robuxAmount,
  });
}
