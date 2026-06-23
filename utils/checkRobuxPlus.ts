/**
 * utils/checkRobuxPlus.ts
 *
 * Cek apakah akun Roblox memiliki langganan Robux Plus (Blackbird) aktif.
 * Menggunakan endpoint resmi Roblox: 
 *   GET https://apis.roblox.com/subscriptions/v2/user/subscriptions?ProductType=Blackbird&ResultsPerPage=1
 *
 * Response jika aktif:
 *   { subscriptions: [{ ... productId: "...", status: "Active", ... }], total: 1 }
 *
 * Response jika tidak aktif:
 *   { subscriptions: [], total: 0 }
 */

export interface RobuxPlusCheckResult {
  isRobuxPlus: boolean;
  /** Hanya ada jika isRobuxPlus true */
  subscriptionDetails?: {
    productId: string;
    expirationDate: string;
    discountPercent: number;   // misal: 10 (untuk tier pertama) atau 20 (setelah 3 bulan)
    isRobuxTransferEnabled: boolean;
  };
  error?: string;
}

/**
 * Cek apakah akun dengan cookie ini memiliki Robux Plus aktif.
 *
 * Format response Roblox (tidak ada field 'status'):
 * {
 *   productKey: { type: "Blackbird", id: "..." },
 *   expirationTimestampMs: 1784419200000,   ← pakai ini untuk cek aktif
 *   productTypeMembershipDetails: {
 *     robloxSubscriptionMembershipDetails: {
 *       features: { virtualTransactionDiscountTierId: "percent_10", ... }
 *     }
 *   }
 * }
 *
 * @param robloxCookie nilai `.ROBLOSECURITY` cookie dari akun tersebut
 */
export async function checkRobuxPlus(
  robloxCookie: string,
): Promise<RobuxPlusCheckResult> {
  if (!robloxCookie) {
    return { isRobuxPlus: false, error: "Cookie tidak diberikan" };
  }

  try {
    const res = await fetch(
      "https://apis.roblox.com/subscriptions/v2/user/subscriptions?ProductType=Blackbird&ResultsPerPage=10",
      {
        method: "GET",
        headers: {
          Cookie: `.ROBLOSECURITY=${robloxCookie}`,
          Accept: "application/json",
        },
      },
    );

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          isRobuxPlus: false,
          error: `Cookie expired atau tidak valid (HTTP ${res.status})`,
        };
      }
      const body = await res.text();
      return {
        isRobuxPlus: false,
        error: `Roblox API error: HTTP ${res.status} - ${body}`,
      };
    }

    const data = await res.json();

    // Roblox mengembalikan array subscriptions (bisa di root atau di field 'subscriptions'/'data')
    const subscriptions: any[] = data.subscriptions || data.data || (Array.isArray(data) ? data : []);

    console.log(`[checkRobuxPlus] Total subscriptions ditemukan: ${subscriptions.length}`);

    const now = Date.now();

    // Cari subscription Blackbird yang masih aktif (expiry di masa depan)
    const activeSub = subscriptions.find((sub: any) => {
      const isBlackbird =
        sub.productKey?.type === "Blackbird" ||
        sub.productType === "Blackbird" ||
        sub.type === "Blackbird";

      // Cek expiry: jika expirationTimestampMs > sekarang → masih aktif
      // nextRenewalTimestampMs = 0 bisa terjadi pada free trial yang tidak auto-renew
      const expirationMs: number = sub.expirationTimestampMs || 0;
      const isNotExpired = expirationMs === 0 || expirationMs > now;

      // Jika ada activationTimestampMs tapi belum expired → aktif
      const hasActivation = !!sub.activationTimestampMs;

      console.log(`[checkRobuxPlus] Sub: type=${sub.productKey?.type}, expirationMs=${expirationMs}, now=${now}, isNotExpired=${isNotExpired}, isBlackbird=${isBlackbird}`);

      return isBlackbird && hasActivation && isNotExpired;
    });

    if (activeSub) {
      // Ambil discount percentage dari features
      const features = activeSub.productTypeMembershipDetails
        ?.robloxSubscriptionMembershipDetails?.features;

      const discountTierId: string =
        features?.virtualTransactionDiscountTierId || "percent_10";

      // Parse "percent_10" → 10, "percent_20" → 20
      const discountPercent = parseInt(discountTierId.replace("percent_", ""), 10) || 10;

      const expirationDate = activeSub.expirationTimestampMs
        ? new Date(activeSub.expirationTimestampMs).toISOString()
        : "unknown";

      console.log(
        `[checkRobuxPlus] ✅ Robux Plus AKTIF! discount=${discountPercent}%, expiry=${expirationDate}`,
      );

      return {
        isRobuxPlus: true,
        subscriptionDetails: {
          productId: activeSub.productKey?.id || "",
          expirationDate,
          discountPercent,
          isRobuxTransferEnabled: features?.isRobuxTransferEnabled ?? true,
        },
      };
    }

    if (subscriptions.length > 0) {
      // Ada subscription tapi sudah expired
      const expiredSub = subscriptions[0];
      const expirationMs = expiredSub.expirationTimestampMs || 0;
      console.log(
        `[checkRobuxPlus] ⚠️ Subscription ditemukan tapi sudah expired. expirationMs=${expirationMs}, now=${now}`,
      );
    }

    return { isRobuxPlus: false };
  } catch (error: any) {
    console.error("[checkRobuxPlus] Error:", error.message);
    return {
      isRobuxPlus: false,
      error: `Network error: ${error.message}`,
    };
  }
}


/**
 * Hitung jumlah Robux gamepass berdasarkan tipe akun stock.
 *
 * - Akun biasa:      robuxAmount × 1.43               (dibulatkan ke atas)
 * - Akun Robux Plus: robuxAmount × 1.43 × (1 - disc)  (dibulatkan ke atas)
 *   - Tier 1 (bulan 1-2): disc=10% → ×0.90
 *   - Tier 2 (bulan 3+):  disc=20% → ×0.80
 *   Contoh 100 Robux, tier 10%: ceil(143 × 0.90) = ceil(128.7) = 129
 *
 * @param robuxAmount Jumlah Robux yang ingin dikirim ke buyer
 * @param isRobuxPlus Apakah akun stock yang dipakai punya Robux Plus
 * @param discountPercent Persentase diskon Robux Plus (default 10)
 * @param feeMultiplier Multiplier dasar (default 1.43 dari env)
 */
export function calculateGamepassAmount(
  robuxAmount: number,
  isRobuxPlus: boolean,
  discountPercent: number = 10,
  feeMultiplier?: number,
): number {
  const multiplier =
    feeMultiplier ??
    parseFloat(process.env.NEXT_PUBLIC_GAMEPASS_FEE_MULTIPLIER || "1.43");

  const base = robuxAmount * multiplier;

  if (isRobuxPlus) {
    const discountFactor = 1 - discountPercent / 100;
    return Math.ceil(base * discountFactor);
  }

  return Math.ceil(base);
}
