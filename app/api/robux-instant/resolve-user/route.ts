import { NextRequest, NextResponse } from "next/server";
import { resolveRobloxUser } from "@/lib/robux-transfer";

/**
 * POST /api/robux-instant/resolve-user
 * Body: { username: string }
 * Resolves username to recipientId, username, displayName, and avatar.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username || !username.trim()) {
      return NextResponse.json(
        { success: false, message: "Username Roblox tidak boleh kosong" },
        { status: 400 },
      );
    }

    const resolved = await resolveRobloxUser(username.trim());

    // Ambil avatar thumbnail
    let avatarUrl = "";
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${resolved.recipientId}&size=150x150&format=Png&isCircular=true`,
      );
      if (thumbRes.ok) {
        const thumbData = await thumbRes.json();
        avatarUrl = thumbData?.data?.[0]?.imageUrl || "";
      }
    } catch (e) {
      console.warn("Gagal mengambil avatar thumbnail:", e);
    }

    return NextResponse.json({
      success: true,
      data: {
        recipientId: resolved.recipientId,
        username: resolved.username,
        displayName: resolved.displayName,
        avatarUrl,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Gagal resolve user Roblox",
      },
      { status: 400 },
    );
  }
}
