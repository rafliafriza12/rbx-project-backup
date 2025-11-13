import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import RobloxCache from "@/models/RobloxCache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.toLowerCase();

  if (!username) {
    return NextResponse.json(
      { success: false, message: "Username wajib diisi" },
      { status: 400 }
    );
  }

  try {
    // Connect to database
    await dbConnect();

    // 1️⃣ Check cache in MongoDB
    let cached = await RobloxCache.findOne({ username });
    if (cached) {
      console.log(`Cache hit for username: ${username}`);
      return NextResponse.json({
        success: true,
        cached: true,
        id: cached.userId,
        username: cached.username,
        displayName: cached.displayName,
        avatar: cached.avatarUrl,
      });
    }

    console.log(
      `Cache miss for username: ${username}, fetching from Roblox API`
    );

    // 2️⃣ Fetch user info from Roblox API
    const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [username],
        excludeBannedUsers: false,
      }),
    });

    if (!userRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data dari Roblox API",
        },
        { status: userRes.status }
      );
    }

    const userData = await userRes.json();
    console.log("Roblox API response:", userData);

    if (!userData.data || userData.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const user = userData.data[0];

    // 3️⃣ Fetch avatar
    const avatarRes = await fetch(
      `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`
    );

    let avatarUrl = "";
    if (avatarRes.ok) {
      const avatarData = await avatarRes.json();
      avatarUrl = avatarData.data?.[0]?.imageUrl ?? "";
    }

    // 4️⃣ Save to MongoDB cache
    const newCache = await RobloxCache.findOneAndUpdate(
      { username: username.toLowerCase() },
      {
        username: user.name.toLowerCase(), // Store lowercase for consistency
        userId: user.id,
        displayName: user.displayName,
        avatarUrl,
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    console.log(`Cached new user data for: ${username}`);

    return NextResponse.json({
      success: true,
      cached: false,
      id: newCache.userId,
      username: user.name, // Return original case username
      displayName: newCache.displayName,
      avatar: newCache.avatarUrl,
    });
  } catch (error) {
    console.error("Error in user-info API:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat mencari user" },
      { status: 500 }
    );
  }
}
