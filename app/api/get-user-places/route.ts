import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json(
      { success: false, message: "UserId wajib diisi" },
      { status: 400 }
    );
  }

  try {
    // 🔹 ambil daftar place user
    const placeRes = await fetch(
      `https://games.roblox.com/v2/users/${userId}/games?accessFilter=2&sortOrder=Asc&limit=10`
    );

    if (!placeRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil data place",
        },
        { status: placeRes.status }
      );
    }

    const placeData = await placeRes.json();

    const places = placeData.data || [];
    if (places.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 🔹 ambil semua thumbnail sekaligus
    const placeIds = places.map((p: any) => p.id).join(",");
    const thumbRes = await fetch(
      `https://thumbnails.roblox.com/v1/places/gameicons?placeIds=${placeIds}&size=512x512&format=Png&isCircular=false`
    );

    let thumbsMap: Record<number, string> = {};
    if (thumbRes.ok) {
      const thumbData = await thumbRes.json();
      // mapping thumbnail ke place
      thumbData.data.forEach((t: any) => {
        thumbsMap[t.targetId] = t.imageUrl;
      });
    }

    const result = places.map((p: any) => ({
      placeId: p.id,
      name: p.name,
      description: p.description,
      visits: p.placeVisits,
      universeId: p.universeId,
      creator: p.creator,
      thumbnail: thumbsMap[p.id] || null,
    }));

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching user places:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Terjadi kesalahan saat mengambil data place",
      },
      { status: 500 }
    );
  }
}
