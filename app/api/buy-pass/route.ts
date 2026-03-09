import { NextRequest, NextResponse } from "next/server";
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
      console.log(
        `🔐 Login sebagai: ${currentUser.UserName} (ID: ${currentUser.UserID})`,
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

    // ============ STEP 2: Get Product Info untuk validasi ============
    let productInfo: any;
    try {
      productInfo = await withRetry(
        () => noblox.getGamePassProductInfo(gamepassId),
        "getGamePassProductInfo",
      );
      console.log("📦 Product Info:", {
        Name: productInfo.Name,
        ProductId: productInfo.ProductId,
        PriceInRobux: productInfo.PriceInRobux,
        IsForSale: productInfo.IsForSale,
        Creator: productInfo.Creator?.Name,
        CreatorTargetId: productInfo.Creator?.CreatorTargetId,
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
    const actualPrice = productInfo.PriceInRobux;
    if (actualPrice !== expectedPrice) {
      console.error(
        `❌ Price mismatch! Expected: ${expectedPrice}, Actual: ${actualPrice}`,
      );
      return NextResponse.json(
        {
          success: false,
          message: `Harga gamepass tidak sesuai! Harga di database: ${expectedPrice} Robux, Harga di Roblox: ${actualPrice} Robux. Pembelian dibatalkan untuk keamanan.`,
          expectedPrice,
          actualPrice,
        },
        { status: 400 },
      );
    }
    console.log(`✅ Price validated: ${actualPrice} Robux`);

    // ============ STEP 5: Get CSRF Token ============
    let csrfToken: string;
    try {
      csrfToken = await withRetry(
        () => noblox.getGeneralToken(),
        "getGeneralToken",
      );
      console.log("🔑 CSRF Token obtained");
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

    // ============ STEP 6: Purchase via Economy API (with retry for rate limit) ============
    console.log(
      `🛒 Purchasing gamepass "${productInfo.Name}" (ProductId: ${productInfo.ProductId}) for ${actualPrice} Robux...`,
    );

    const maxPurchaseRetries = 5;
    let result: any = null;

    for (let attempt = 1; attempt <= maxPurchaseRetries; attempt++) {
      // Re-fetch CSRF token setiap retry karena bisa expired
      if (attempt > 1) {
        try {
          csrfToken = await withRetry(
            () => noblox.getGeneralToken(),
            "getGeneralToken-retry",
          );
        } catch {
          // Pakai token lama jika gagal
        }
      }

      const purchaseResponse = await fetch(
        `https://economy.roblox.com/v1/purchases/products/${productInfo.ProductId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `.ROBLOSECURITY=${robloxCookie}`,
            "X-CSRF-TOKEN": csrfToken,
          },
          body: JSON.stringify({
            expectedCurrency: 1,
            expectedPrice: actualPrice,
            expectedSellerId: productInfo.Creator.CreatorTargetId,
          }),
        },
      );

      // Handle 429 rate limit
      if (purchaseResponse.status === 429) {
        if (attempt < maxPurchaseRetries) {
          const retryAfter = purchaseResponse.headers.get("retry-after");
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s, 16s
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

      // Handle 403 (CSRF token expired) - ambil token baru dari header
      if (purchaseResponse.status === 403) {
        const newCsrf = purchaseResponse.headers.get("x-csrf-token");
        if (newCsrf && attempt < maxPurchaseRetries) {
          console.warn(
            `🔄 [Purchase] CSRF token expired, got new token. Retry ${attempt}/${maxPurchaseRetries}...`,
          );
          csrfToken = newCsrf;
          await sleep(500);
          continue;
        }
      }

      result = await purchaseResponse.json();
      console.log("📋 Purchase result:", result);
      break; // Berhasil dapat response, keluar dari loop
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
    if (result.purchased) {
      console.log(
        `�� Pembelian berhasil! "${result.assetName}" - ${result.price} Robux dari ${result.sellerName}`,
      );
      return NextResponse.json({
        success: true,
        message: `Gamepass "${result.assetName}" berhasil dibeli seharga ${result.price} Robux`,
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
            message: `Gamepass sudah dimiliki oleh akun ini. ${result.errorMsg}`,
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
