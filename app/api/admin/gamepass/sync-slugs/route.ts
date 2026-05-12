import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gamepass from "@/models/Gamepass";
import { requireAdmin, requireApiKey } from "@/lib/auth";
import slugify from "slugify";

export async function POST(request: NextRequest) {
  try {
    const apiKeyError = await requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    await dbConnect();

    const gamepasses = await Gamepass.find({});
    let updatedCount = 0;

    for (const gamepass of gamepasses) {
      const newSlug = slugify(gamepass.gameName, {
        lower: true,
        strict: true,
        trim: true,
      });

      if (gamepass.slug !== newSlug) {
        gamepass.slug = newSlug;
        await gamepass.save();
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil sinkronisasi ${updatedCount} slug gamepass`,
      updatedCount
    });
  } catch (error: any) {
    console.error("Sync slugs error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan server saat sinkronisasi slug",
      },
      { status: 500 },
    );
  }
}
