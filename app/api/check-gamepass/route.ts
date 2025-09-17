import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const universeId = searchParams.get("universeId");
    const expectedRobux = searchParams.get("expectedRobux");

    if (!universeId || !expectedRobux) {
      return NextResponse.json(
        {
          success: false,
          message: "universeId dan expectedRobux diperlukan",
        },
        { status: 400 }
      );
    }

    const expectedAmount = parseInt(expectedRobux);

    // Hit Roblox API to get game passes
    const robloxResponse = await fetch(
      `https://games.roblox.com/v1/games/${universeId}/game-passes?sortOrder=Asc&limit=100`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!robloxResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data gamepass dari Roblox",
        },
        { status: 500 }
      );
    }

    const gamepassData = await robloxResponse.json();

    if (!gamepassData.data || !Array.isArray(gamepassData.data)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format data gamepass tidak valid",
        },
        { status: 500 }
      );
    }

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
          price: matchingGamepass.price,
          isForSale: matchingGamepass.isForSale,
          description: matchingGamepass.description,
          created: matchingGamepass.created,
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
