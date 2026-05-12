import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Gamepass from "@/models/Gamepass";
import { requireApiKey } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const apiKeyError = await requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await dbConnect();

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Slug gamepass tidak valid" },
        { status: 400 },
      );
    }

    const gamepass = await Gamepass.findOne({ slug });

    if (!gamepass) {
      return NextResponse.json(
        { error: "Gamepass tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Gamepass berhasil diambil",
      data: gamepass,
    });
  } catch (error: any) {
    console.error("Get gamepass by slug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan server",
      },
      { status: 500 },
    );
  }
}
