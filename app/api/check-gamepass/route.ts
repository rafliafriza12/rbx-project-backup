import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("placeId");
    const expectedRobux = searchParams.get("expectedRobux");

    if (!placeId || !expectedRobux) {
      return NextResponse.json(
        {
          success: false,
          message: "placeId dan expectedRobux diperlukan",
        },
        { status: 400 },
      );
    }

    const expectedAmount = parseInt(expectedRobux);

    // Use Universe-based GamePass API with placeId
    // This endpoint returns all gamepasses for a specific universe/place
    const apiEndpoint = `https://apis.roblox.com/game-passes/v1/universes/${placeId}/game-passes?passView=Full&pageSize=100`;

    console.log(`\n🔍 Fetching gamepasses for Place ID: ${placeId}`);
    console.log(`   Endpoint: ${apiEndpoint}`);

    const maxRetries = 3;
    const timeoutMs = 10000; // 10 seconds
    let lastError;

    // Retry mechanism
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(
          `   🔄 Attempt ${attempt}/${maxRetries}: Fetching gamepasses...`,
        );

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const robloxResponse = await fetch(apiEndpoint, {
          headers: {
            Accept: "application/json",
            // Cookie:
            //   ".ROBLOSECURITY=_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_CAEaAhADIhwKBGR1aWQSFDEzNzQ0MDA4NDE1ODAwNDk2NjgwKAM.7NJ9Qvsz3jDiKWqvEHVqWXQmrCvake0GgfIY3vTYX0d8WvbVGB_0cu2HrgW90DFVQSXjuTELhDCUyFC79XLZs2I1Cze6wMsqHnbFP9ONuZ76sToeLjB40rzy8V_zex3OdQ3_i2xl5K4Pxgbdx6U-n-p0QdLW1Q2WM5vGvbcpEMLdlYbzvuH7bDJMgNzndr-jxwLt2gY57SfBqP2m2sHmDIX4vp0CvzCIxmW8JZDdUsVTQKOZ5PBmI7INTfz_cArh0R7DlPrU4oix3CoVz27gX8HN5FE1nAKuUum2wR0WmJxbUjsVmM1n3-JmpatPcDSRUTFgtkXtCtL7SxEKrjUQupWZQggukHj_R_Q_4tnrWcG9OPBd4eoyuW3KBLmNfVibHU0mCQUABFWynJRtYi8In19qv3rwYe3Xmx7f4mltGhquLdN_NlnqYSV-NAG4tWrr7BGEEjT56Zd5XzW_0igv0Zo9MKzzt4YgRwAZf4T9R_rcWD351H6XgU8qRrPsAN1dQOOzJgOhkBIG5quN7s4Sj7lJSrfqJm8ftxnQrrRZt1OF3ujTWFbtJcAgi_MwwrgmCT-GZ6vtT4rN-t63eNO4oMA_UinLM_yQCkQZyxnSAflB03ceKoT_MJXjZ487qJtMFbv9zA3c6tPC-vmBFoFNY-sP8cg1o_XpgJoFCAmaRG7TxC_i1YIdzU-tfdtdEeP0m3V43g9Yd3OL6obd6DbfMaiuqy4q4UEu-wDsFIcePHEHFBG36o7R9OMUEKlbHNbE02cGAXFA-_86WrSN77dp8ZWpHZyZkyWeKw2CEDrvUETgf9ox",
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

        // Success! Get gamepasses from response
        const gamePasses = responseData.gamePasses || [];
        console.log(
          `   ✅ Successfully fetched ${gamePasses.length} gamepasses!`,
        );

        // Map response to normalized format
        const gamepassData = {
          data: gamePasses.map((gp: any) => ({
            id: gp.id,
            name: gp.name || gp.displayName,
            price: gp.price,
            sellerId: gp.creator?.creatorId,
            productId: gp.productId,
            isForSale: gp.isForSale,
            displayName: gp.displayName,
            displayDescription: gp.displayDescription,
            iconAssetId: gp.displayIconImageAssetId,
          })),
        };

        // Check if gamepass with expected price exists
        const matchingGamepass = gamepassData.data.find(
          (gamepass: any) => gamepass.price === expectedAmount,
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
      `\n❌ All ${maxRetries} attempts failed. Last error: ${lastError}`,
    );
    return NextResponse.json(
      {
        success: false,
        message: `Gagal mengambil data gamepass dari Roblox. Error: ${lastError}`,
        hint: "Mohon coba lagi beberapa saat atau hubungi admin jika masalah berlanjut.",
      },
      { status: 500 },
    );
  } catch (error) {
    console.error("Error checking gamepass:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat memeriksa gamepass",
      },
      { status: 500 },
    );
  }
}
