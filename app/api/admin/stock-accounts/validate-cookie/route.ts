import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { robloxCookie } = await req.json();

    if (!robloxCookie) {
      return NextResponse.json(
        { success: false, message: "Cookie tidak ada" },
        { status: 400 }
      );
    }

    // 🔹 ambil info user
    const userRes = await fetch(
      "https://users.roblox.com/v1/users/authenticated",
      {
        headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
      }
    );

    if (!userRes.ok) {
      return NextResponse.json(
        { success: false, message: "Cookie invalid / expired" },
        { status: 401 }
      );
    }

    const user = await userRes.json();

    // 🔹 ambil jumlah Robux
    const robuxRes = await fetch(
      "https://economy.roblox.com/v1/user/currency",
      {
        headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
      }
    );

    const robuxData = await robuxRes.json();

    return NextResponse.json({
      success: true,
      userId: user.id,
      username: user.name,
      displayName: user.displayName,
      robux: robuxData.robux ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
