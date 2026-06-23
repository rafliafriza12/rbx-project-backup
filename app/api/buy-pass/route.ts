import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import StockAccount from "@/models/StockAccount";
import { generateRoblox2FACode } from "@/utils/totp";
import { calculateGamepassAmount } from "@/utils/checkRobuxPlus";
const noblox = require("noblox.js");

// Vercel serverless function config
// export const maxDuration = 60;
// export const dynamic = "force-dynamic";

// Helper: sleep
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper: retry with exponential backoff untuk handle rate limit
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 3,
  baseDelay = 2000,
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit =
        error?.statusCode === 429 ||
        error?.status === 429 ||
        error?.message?.includes("429") ||
        error?.message?.toLowerCase()?.includes("too many request") ||
        error?.message?.toLowerCase()?.includes("rate limit") ||
        error?.message?.toLowerCase()?.includes("throttle");

      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // 2s, 4s, 8s
        console.warn(
          `⏳ [${label}] Rate limited (429). Retry ${attempt}/${maxRetries} setelah ${delay}ms...`,
        );
        await sleep(delay);
        continue;
      }

      // Not rate limit or last attempt, throw
      throw error;
    }
  }
  throw new Error(`[${label}] Max retries exceeded`);
}

export async function POST(req: NextRequest) {
  try {
    // Internal-only endpoint: must be called from server-side with secret
    const internalSecret = req.headers.get("x-internal-secret");
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    if (!expectedSecret || internalSecret !== expectedSecret) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { robloxCookie, gamepassId, gamepassName, price, sellerId } =
      await req.json();

    if (!robloxCookie || !gamepassId) {
      return NextResponse.json(
        {
          success: false,
          message: "robloxCookie dan gamepassId wajib diisi",
        },
        { status: 400 },
      );
    }

    // Price validation - harus ada untuk memastikan tidak beli dengan harga berbeda
    if (price === undefined || price === null) {
      return NextResponse.json(
        {
          success: false,
          message: "price wajib diisi untuk validasi harga gamepass",
        },
        { status: 400 },
      );
    }

    const expectedPrice = Number(price);
    if (isNaN(expectedPrice) || expectedPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "price harus berupa angka positif",
        },
        { status: 400 },
      );
    }

    console.log("🎯 Attempting to purchase gamepass via noblox.js API:", {
      gamepassId,
      gamepassName,
      expectedPrice,
      sellerId,
      cookie: robloxCookie ? "[PRESENT]" : "[MISSING]",
    });

    // ============ STEP 1: Login dengan cookie ============
    let currentUser: any;
    try {
      currentUser = await withRetry(
        () => noblox.setCookie(robloxCookie),
        "setCookie",
      );
    } catch (loginError: any) {
      console.error("❌ Failed to login with cookie:", loginError.message);
      return NextResponse.json(
        {
          success: false,
          message: `Gagal login ke Roblox: ${loginError.message}. Cookie mungkin expired.`,
        },
        { status: 401 },
      );
    }

    // ============ STEP 1b: Ambil data stock account dari DB ============
    await connectDB();
    const stockAccountData = await StockAccount.findOne({ robloxCookie }).lean();
    const isRobuxPlus = (stockAccountData as any)?.isRobuxPlus === true;

    // Gunakan username dari DB (lebih reliable daripada noblox.setCookie return value)
    const accountUsername =
      (stockAccountData as any)?.username ||
      currentUser?.UserName ||
      currentUser?.name ||
      "unknown";

    console.log(
      `🔐 Login sebagai: @${accountUsername}` +
      (isRobuxPlus
        ? " ⭐ (Robux Plus) — Roblox akan apply diskon 10% ke harga listed. Sistem kirim effective price (misal 129 dari 143 listed)."
        : " 💰 (Regular) — beli di harga penuh."),
    );

    // ============ STEP 2: Get Product Info untuk validasi ============
    // PENTING: Gunakan REST fetch langsung (bukan noblox.getGamePassProductInfo)
    // karena noblox meng-cache hasil per gamepassId, sehingga bisa return harga lama
    // sebelum Robux Plus discount diterapkan atau sebelum harga diubah customer.
    let productInfo: any;
    try {
      const infoRes = await fetch(
        `https://apis.roblox.com/game-passes/v1/game-passes/${gamepassId}/product-info`,
        {
          headers: {
            Cookie: `.ROBLOSECURITY=${robloxCookie}`,
            Accept: "application/json",
          },
        },
      );
      if (!infoRes.ok) {
        throw new Error(`HTTP ${infoRes.status}: ${await infoRes.text()}`);
      }
      productInfo = await infoRes.json();
      console.log("📦 Product Info (via REST):", {
        Name: productInfo.Name,
        ProductId: productInfo.ProductId,
        PriceInRobux: productInfo.PriceInRobux,        // harga efektif untuk akun ini
        UserBasePriceInRobux: productInfo.UserBasePriceInRobux, // harga listed (sebelum diskon)
        IsForSale: productInfo.IsForSale,
        Creator: productInfo.Creator?.Name,
        DiscountDetails: productInfo.PriceDiscountDetails,
      });
    } catch (infoError: any) {
      console.error("❌ Failed to get gamepass info:", infoError.message);
      return NextResponse.json(
        {
          success: false,
          message: `Gagal mendapatkan info gamepass: ${infoError.message}`,
        },
        { status: 400 },
      );
    }

    // ============ STEP 3: Validasi gamepass IsForSale ============
    if (!productInfo.IsForSale) {
      console.error("❌ Gamepass is not for sale!");
      return NextResponse.json(
        {
          success: false,
          message: `Gamepass "${productInfo.Name}" tidak dijual (IsForSale: false).`,
        },
        { status: 400 },
      );
    }

    // ============ STEP 4: Validasi harga ============
    // Gunakan harga live yang dikembalikan server untuk akun ini (sudah mempertimbangkan diskon Premium/Robux Plus)
    let actualPrice = productInfo.PriceInRobux;

    if (actualPrice > expectedPrice && !isRobuxPlus) {
      // Harga NAIK dari yang tersimpan di DB — tolak pembelian jika bukan karena anomali Robux Plus
      console.error(
        `❌ Price NAIK! Expected: ${expectedPrice}, Actual: ${actualPrice}. Pembelian dibatalkan.`,
      );
      return NextResponse.json(
        {
          success: false,
          message: `Harga gamepass naik! Harga di database: ${expectedPrice} Robux, Harga live di Roblox: ${actualPrice} Robux.`,
          expectedPrice,
          actualPrice,
        },
        { status: 400 },
      );
    }

    if (actualPrice < expectedPrice) {
      // Harga LEBIH RENDAH — kemungkinan Robux Plus discount dari Roblox (valid & aman)
      console.log(
        `💡 Price live lebih rendah dari expected: ${actualPrice} Robux (expected: ${expectedPrice}). Lanjutkan dengan harga live server.`,
      );
    } else {
      console.log(`✅ Price validated: ${actualPrice} Robux`);
    }

    // ============ STEP 5: Get CSRF Token ============
    // Ambil CSRF token langsung menggunakan cookie yang sama (bukan via noblox.js internal session)
    // Caranya: kirim POST ke auth logout endpoint, Roblox akan return 403 + x-csrf-token header
    let csrfToken: string;
    try {
      const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
        method: "POST",
        headers: {
          Cookie: `.ROBLOSECURITY=${robloxCookie}`,
        },
      });
      const token = csrfRes.headers.get("x-csrf-token");
      if (!token) {
        throw new Error("CSRF token not found in response headers");
      }
      csrfToken = token;
      console.log("🔑 CSRF Token obtained via auth endpoint");
    } catch (csrfError: any) {
      console.error("❌ Failed to get CSRF token:", csrfError.message);
      return NextResponse.json(
        {
          success: false,
          message: `Gagal mendapatkan CSRF token: ${csrfError.message}`,
        },
        { status: 500 },
      );
    }

    // ============ STEP 6: Purchase via Economy API (with retry & 2FA handling) ============
    console.log(
      `🛒 Purchasing gamepass "${productInfo.Name}" (ProductId: ${productInfo.ProductId}) for ${actualPrice} Robux...`,
    );

    const maxPurchaseRetries = 5;
    let result: any = null;

    // Helper: melakukan purchase request dengan optional challenge headers
    async function doPurchaseRequest(extraHeaders: Record<string, string> = {}) {
      return await fetch(
        `https://apis.roblox.com/game-passes/v1/game-passes/${productInfo.ProductId}/purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `.ROBLOSECURITY=${robloxCookie}`,
            "X-CSRF-TOKEN": csrfToken,
            ...extraHeaders,
          },
          body: JSON.stringify({
            expectedCurrency: 1,
            expectedPrice: actualPrice,
          }),
        },
      );
    }

    // Helper: menyelesaikan 2FA challenge dan mengulangi pembelian
    // challengeTypeHeader = nilai dari header "rblx-challenge-type" (bukan dari metadata)
    async function handle2FAChallenge(
      challengeId: string,
      challengeMetadataBase64: string,
      challengeTypeHeader: string,
    ): Promise<any> {
      console.warn("⚠️ Terdeteksi 2FA challenge dari Roblox!");
      console.log(`🔑 Challenge ID: ${challengeId}, Type: ${challengeTypeHeader}`);

      // 1. Ambil secret2fa dari database
      await connectDB();
      const account = await StockAccount.findOne({ robloxCookie });

      if (!account || !account.secret2fa) {
        throw new Error("Akun ini membutuhkan 2FA, tapi secret2fa tidak ditemukan di database! Silakan tambahkan secret 2FA di halaman Admin > Stock Accounts.");
      }

      // 2. Generate kode TOTP 6 digit
      const code2fa = generateRoblox2FACode(account.secret2fa);
      console.log(`🔐 Kode 2FA berhasil di-generate: ${code2fa}`);

      // 3. Parse metadata dari challenge untuk ambil userId
      let userId: string;
      try {
        const challengeMetadata = JSON.parse(
          Buffer.from(challengeMetadataBase64, "base64").toString("utf-8"),
        );
        console.log("📋 Challenge metadata:", challengeMetadata);
        // userId ada di dalam metadata, fallback ke currentUser jika tidak ada
        userId = String(challengeMetadata.userId || currentUser.UserID);
      } catch {
        console.warn("⚠️ Gagal parse metadata, fallback ke currentUser.UserID");
        userId = String(currentUser.UserID);
      }

      // 4. Verifikasi kode TOTP ke endpoint Roblox
      // actionType "Purchase" sesuai dengan transaksi Economy
      console.log(`📤 Mengirim kode 2FA ke Roblox untuk user ${userId}...`);

      async function doVerifyRequest(token: string) {
        return await fetch(
          `https://twostepverification.roblox.com/v1/users/${userId}/challenges/authenticator/verify`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: `.ROBLOSECURITY=${robloxCookie}`,
              "X-CSRF-TOKEN": token,
            },
            body: JSON.stringify({
              challengeId: challengeId,
              actionType: "Purchase",
              code: code2fa,
            }),
          },
        );
      }

      let verifyResponse = await doVerifyRequest(csrfToken);

      // Handle CSRF token refresh pada verify endpoint
      if (verifyResponse.status === 403) {
        const newCsrf = verifyResponse.headers.get("x-csrf-token");
        if (!newCsrf) {
          const errBody = await verifyResponse.text();
          throw new Error(`Verifikasi 2FA gagal (403, no csrf): ${errBody}`);
        }
        csrfToken = newCsrf;
        console.log("🔑 CSRF token diperbarui dari verify response, mencoba ulang...");
        verifyResponse = await doVerifyRequest(csrfToken);
      }

      if (!verifyResponse.ok) {
        const errBody = await verifyResponse.text();
        throw new Error(`Verifikasi 2FA gagal: HTTP ${verifyResponse.status} - ${errBody}`);
      }

      const verifyResult = await verifyResponse.json();
      console.log("✅ Verifikasi 2FA berhasil:", verifyResult);

      const verificationToken: string = verifyResult.verificationToken;
      if (!verificationToken) {
        throw new Error("Roblox tidak mengembalikan verificationToken setelah verifikasi 2FA.");
      }

      // 5. Lanjutkan pembelian dengan challenge token
      return await continuePurchaseWithChallenge(challengeId, verificationToken, challengeTypeHeader);
    }

    // Helper: melanjutkan pembelian setelah challenge berhasil diverifikasi
    async function continuePurchaseWithChallenge(
      challengeId: string,
      verificationToken: string,
      challengeType: string,
    ): Promise<any> {
      // redemptionToken adalah bukti challenge sudah diselesaikan yang dikirim ke Economy API
      const solvedMetadata = Buffer.from(
        JSON.stringify({
          redemptionToken: verificationToken,
          rememberDevice: false,
          challengeId: challengeId,
          actionType: "Purchase",
        }),
      ).toString("base64");

      console.log("🔄 Mengulang pembelian dengan challenge token...");

      let retryPurchaseResponse = await doPurchaseRequest({
        "rblx-challenge-id": challengeId,
        "rblx-challenge-type": challengeType,
        "rblx-challenge-metadata": solvedMetadata,
      });

      // Handle CSRF refresh sekali lagi jika perlu
      if (retryPurchaseResponse.status === 403) {
        const newCsrf = retryPurchaseResponse.headers.get("x-csrf-token");
        if (newCsrf) {
          csrfToken = newCsrf;
          console.log("🔑 CSRF token diperbarui, mencoba pembelian sekali lagi...");
          retryPurchaseResponse = await doPurchaseRequest({
            "rblx-challenge-id": challengeId,
            "rblx-challenge-type": challengeType,
            "rblx-challenge-metadata": solvedMetadata,
          });
        }
      }

      return await retryPurchaseResponse.json();
    }

    // ---- Main purchase loop ----
    for (let attempt = 1; attempt <= maxPurchaseRetries; attempt++) {
      // Re-fetch CSRF token setiap retry via auth endpoint
      if (attempt > 1) {
        try {
          const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
            method: "POST",
            headers: {
              Cookie: `.ROBLOSECURITY=${robloxCookie}`,
            },
          });
          const newToken = csrfRes.headers.get("x-csrf-token");
          if (newToken) {
            csrfToken = newToken;
            console.log(
              `🔑 [Retry ${attempt}] Fresh CSRF token obtained via auth endpoint`,
            );
          }
        } catch {
          // Pakai token lama jika gagal
        }
      }

      const purchaseResponse = await doPurchaseRequest();

      // Handle 429 rate limit
      if (purchaseResponse.status === 429) {
        if (attempt < maxPurchaseRetries) {
          const retryAfter = purchaseResponse.headers.get("retry-after");
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : 2000 * Math.pow(2, attempt - 1);
          console.warn(
            `⏳ [Purchase] Rate limited (429). Retry ${attempt}/${maxPurchaseRetries} setelah ${delay}ms...`,
          );
          await sleep(delay);
          continue;
        }
        return NextResponse.json(
          {
            success: false,
            message: `Roblox rate limit (429). Terlalu banyak request, coba lagi nanti.`,
            reason: "TooManyRequests",
          },
          { status: 429 },
        );
      }

      // Handle 403 - bisa CSRF expired ATAU 2FA challenge
      if (purchaseResponse.status === 403) {
        // Cek apakah ini 2FA challenge (ada header rblx-challenge-id)
        const challengeId = purchaseResponse.headers.get("rblx-challenge-id");
        const challengeType = purchaseResponse.headers.get("rblx-challenge-type");
        const challengeMetadata = purchaseResponse.headers.get("rblx-challenge-metadata");

        if (challengeId && challengeType && challengeMetadata) {
          console.log(`🔒 Roblox meminta challenge: type=${challengeType}, id=${challengeId}`);

          // Update CSRF dari response jika ada
          const headerCsrf = purchaseResponse.headers.get("x-csrf-token");
          if (headerCsrf) {
            csrfToken = headerCsrf;
          }

          try {
            // Teruskan challengeType dari header langsung ke handler
            result = await handle2FAChallenge(challengeId, challengeMetadata, challengeType);
            console.log("📋 Purchase result (after 2FA):", result);
            if (
              result &&
              result.reason === "PriceChanged" &&
              attempt < maxPurchaseRetries
            ) {
              const newServerPrice = result.price !== undefined ? result.price : productInfo.UserBasePriceInRobux;
              if (newServerPrice && newServerPrice !== actualPrice && newServerPrice <= expectedPrice) {
                console.warn(
                  `🔄 [Purchase (after 2FA)] Price changed. Server bilang harga: ${newServerPrice} Robux. Retry ${attempt}/${maxPurchaseRetries}...`,
                );
                actualPrice = newServerPrice;
                await sleep(1000);
                continue;
              }
            }
            break;
          } catch (challengeError: any) {
            console.error("❌ Gagal menyelesaikan 2FA challenge:", challengeError.message);
            return NextResponse.json(
              {
                success: false,
                message: `Gagal menyelesaikan 2FA: ${challengeError.message}`,
                requires2FA: true,
              },
              { status: 403 },
            );
          }
        }

        // Bukan 2FA, kemungkinan CSRF expired biasa
        if (attempt < maxPurchaseRetries) {
          const headerCsrf = purchaseResponse.headers.get("x-csrf-token");
          if (headerCsrf) {
            csrfToken = headerCsrf;
            console.warn(
              `🔄 [Purchase] CSRF expired, got new token from response header. Retry ${attempt}/${maxPurchaseRetries}...`,
            );
          } else {
            try {
              const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
                method: "POST",
                headers: {
                  Cookie: `.ROBLOSECURITY=${robloxCookie}`,
                },
              });
              const freshToken = csrfRes.headers.get("x-csrf-token");
              if (freshToken) {
                csrfToken = freshToken;
                console.warn(
                  `🔄 [Purchase] CSRF expired, fetched fresh token via auth. Retry ${attempt}/${maxPurchaseRetries}...`,
                );
              }
            } catch {
              console.warn(
                `🔄 [Purchase] CSRF expired, failed to get fresh token. Retry ${attempt}/${maxPurchaseRetries}...`,
              );
            }
          }
          await sleep(1000);
          continue;
        }

        // Last attempt, read the error response
        result = await purchaseResponse.json();
        console.log("📋 Purchase result (final 403):", result);
        break;
      }

      result = await purchaseResponse.json();
      console.log("📋 Purchase result:", result);

      if (
        result &&
        result.reason === "PriceChanged" &&
        attempt < maxPurchaseRetries
      ) {
        // Gunakan field price yang diberikan error payload. Jika undefined (seperti kasus Robux Plus tertentu),
        // coba gunakan UserBasePriceInRobux dari product-info GET awal
        const newServerPrice = result.price !== undefined ? result.price : productInfo.UserBasePriceInRobux;
        
        if (newServerPrice && newServerPrice !== actualPrice && newServerPrice <= expectedPrice) {
          console.warn(
            `🔄 [Purchase] Price changed! Server memberitahu harga yang benar: ${newServerPrice} Robux (sebelumnya ${actualPrice}). Retry ${attempt}/${maxPurchaseRetries}...`,
          );
          actualPrice = newServerPrice;
          
          // Dapatkan CSRF token baru sebelum retry karena payload body berubah
          try {
            const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
              method: "POST",
              headers: { Cookie: `.ROBLOSECURITY=${robloxCookie}` },
            });
            const newCsrf = csrfRes.headers.get("x-csrf-token");
            if (newCsrf) csrfToken = newCsrf;
          } catch(e) {}

          await sleep(1000);
          continue;
        }
      }
      break;
    }

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal melakukan purchase setelah beberapa percobaan.",
        },
        { status: 500 },
      );
    }

    // ============ STEP 7: Handle response ============
    if (result.errors && Array.isArray(result.errors)) {
      const errorMsg = result.errors
        .map((e: any) => e.message || e.code)
        .join(", ");
      console.error(`❌ Roblox API error: ${errorMsg}`);
      return NextResponse.json(
        {
          success: false,
          message: `Roblox API error: ${errorMsg}`,
          errors: result.errors,
        },
        { status: 400 },
      );
    }

    if (result.purchased) {
      console.log(`🎉 Pembelian berhasil!`);
      return NextResponse.json({
        success: true,
        message: `Gamepass berhasil dibeli`,
        data: {
          productId: result.productId,
          assetName: result.assetName,
          price: result.price,
          sellerName: result.sellerName,
          transactionVerb: result.transactionVerb,
        },
      });
    }

    // Handle specific failure reasons
    switch (result.reason) {
      case "InsufficientFunds":
        console.error(
          `❌ Robux tidak cukup! Kekurangan: ${result.shortfallPrice} Robux`,
        );
        return NextResponse.json(
          {
            success: false,
            message: `Robux tidak cukup! ${result.errorMsg}. Kekurangan: ${result.shortfallPrice} Robux.`,
            reason: "InsufficientFunds",
            shortfallPrice: result.shortfallPrice,
            expectedPrice: result.expectedPrice,
          },
          { status: 400 },
        );

      case "AlreadyOwned":
        console.error("❌ Gamepass sudah dimiliki!");
        return NextResponse.json(
          {
            success: false,
            message: `Gamepass sudah dimiliki oleh akun ini.`,
            reason: "AlreadyOwned",
          },
          { status: 400 },
        );

      default:
        console.error(
          `❌ Pembelian gagal: ${result.reason} - ${result.errorMsg}`,
        );
        return NextResponse.json(
          {
            success: false,
            message: `Pembelian gagal: ${result.errorMsg || result.reason || "Unknown error"}`,
            reason: result.reason,
            statusCode: result.statusCode,
          },
          { status: 400 },
        );
    }
  } catch (error: any) {
    console.error("❌ Error in buy-pass API:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 },
    );
  }
}
