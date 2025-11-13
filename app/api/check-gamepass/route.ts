import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId"); // Changed from universeId to userId
    const expectedRobux = searchParams.get("expectedRobux");

    if (!userId || !expectedRobux) {
      return NextResponse.json(
        {
          success: false,
          message: "userId dan expectedRobux diperlukan",
        },
        { status: 400 }
      );
    }

    const expectedAmount = parseInt(expectedRobux);

    // Use the new working API endpoint (User-based GamePass API)
    // This endpoint is STABLE and works reliably!
    const apiEndpoint = `https://apis.roblox.com/game-passes/v1/users/${userId}/game-passes?count=100`;

    console.log(`\n🔍 Fetching gamepasses for User ID: ${userId}`);
    console.log(`   Endpoint: ${apiEndpoint}`);

    const maxRetries = 3;
    const timeoutMs = 10000; // 10 seconds
    let lastError;

    // Retry mechanism
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `   🔄 Attempt ${attempt}/${maxRetries}: Fetching gamepasses...`
        );

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const robloxResponse = await fetch(apiEndpoint, {
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!robloxResponse.ok) {
          lastError = `HTTP ${robloxResponse.status}: ${robloxResponse.statusText}`;
          console.log(`   ⚠️ Attempt ${attempt} failed: ${lastError}`);

          if (attempt < maxRetries) {
            const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
            console.log(`   ⏳ Waiting ${delayMs}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
          continue;
        }

        // Parse response
        const responseData = await robloxResponse.json();

        // Check for errors
        if (responseData.errors || responseData.code === 0) {
          lastError = responseData.message || "API returned error";
          console.log(`   ⚠️ API error: ${lastError}`);

          if (attempt < maxRetries) {
            const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          }
          continue;
        }

        // Success! Normalize response format
        const gamePasses = responseData.gamePasses || [];
        console.log(
          `   ✅ Successfully fetched ${gamePasses.length} gamepasses!`
        );

        // Normalize to old format for compatibility
        const gamepassData = {
          data: gamePasses.map((gp: any) => ({
            id: gp.gamePassId,
            name: gp.name,
            price: gp.price,
            sellerId: gp.creator?.creatorId,
            productId: gp.gamePassId, // Use gamePassId as productId
            isForSale: gp.isForSale,
          })),
        };

        // Check if gamepass with expected price exists
        const matchingGamepass = gamepassData.data.find(
          (gamepass: any) => gamepass.price === expectedAmount
        );

        if (matchingGamepass) {
          return NextResponse.json({
            success: true,
            message: "GamePass ditemukan!",
            gamepass: {
              id: matchingGamepass.id,
              name: matchingGamepass.name,
              sellerId: matchingGamepass.sellerId,
              productId: matchingGamepass.productId,
              price: matchingGamepass.price,
            },
            allGamepasses: gamepassData.data.map((gp: any) => ({
              id: gp.id,
              name: gp.name,
              price: gp.price,
              isForSale: gp.isForSale,
            })),
          });
        } else {
          return NextResponse.json({
            success: false,
            message: `GamePass dengan harga ${expectedAmount} Robux tidak ditemukan`,
            allGamepasses: gamepassData.data.map((gp: any) => ({
              id: gp.id,
              name: gp.name,
              price: gp.price,
              isForSale: gp.isForSale,
            })),
            expectedPrice: expectedAmount,
          });
        }
      } catch (error: any) {
        lastError = error.message || "Unknown error";

        if (error.name === "AbortError") {
          console.log(`   ⏱️ Attempt ${attempt} timeout after ${timeoutMs}ms`);
          lastError = "Request timeout";
        } else {
          console.log(`   ❌ Attempt ${attempt} error: ${lastError}`);
        }

        // If not last attempt, wait before retrying
        if (attempt < maxRetries) {
          const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 3000);
          console.log(`   ⏳ Waiting ${delayMs}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    // All retries failed
    console.error(
      `\n❌ All ${maxRetries} attempts failed. Last error: ${lastError}`
    );
    return NextResponse.json(
      {
        success: false,
        message: `Gagal mengambil data gamepass dari Roblox. Error: ${lastError}`,
        hint: "Mohon coba lagi beberapa saat atau hubungi admin jika masalah berlanjut.",
      },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error checking gamepass:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memeriksa gamepass",
      },
      { status: 500 }
    );
  }
}
