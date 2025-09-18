import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { robloxCookie, productId, price, sellerId } = await req.json();

    if (!robloxCookie || !productId || !price || !sellerId) {
      return NextResponse.json(
        {
          success: false,
          message: "robloxCookie, productId, price, sellerId wajib diisi",
        },
        { status: 400 }
      );
    }

    console.log("Attempting to purchase gamepass:", {
      productId,
      price,
      sellerId,
      cookie: robloxCookie ? "[PRESENT]" : "[MISSING]",
    });

    // 1️⃣ ambil csrf token dari /v2/logout
    const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
      method: "POST",
      headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
    });

    const csrfToken = csrfRes.headers.get("x-csrf-token");
    if (!csrfToken) {
      console.error("Failed to get CSRF token from Roblox");
      return NextResponse.json(
        { success: false, message: "Gagal ambil CSRF token" },
        { status: 403 }
      );
    }

    console.log("CSRF token obtained successfully");

    // 2️⃣ lakukan purchase
    const purchaseRes = await fetch(
      `https://economy.roblox.com/v1/purchases/products/${productId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
          Cookie: `.ROBLOSECURITY=${robloxCookie};`,
        },
        body: JSON.stringify({
          expectedPrice: price,
          expectedSellerId: sellerId,
        }),
      }
    );

    const data = await purchaseRes.json();

    console.log("Purchase response:", {
      status: purchaseRes.status,
      statusText: purchaseRes.statusText,
      data,
    });

    if (!purchaseRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Purchase failed: ${purchaseRes.status} ${purchaseRes.statusText}`,
          details: data,
        },
        { status: purchaseRes.status }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in buy-pass API:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
