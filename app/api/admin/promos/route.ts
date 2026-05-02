import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Promo from "@/models/Promo";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  try {
    const promos = await Promo.find().sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: promos });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  try {
    const body = await req.json();
    const existing = await Promo.findOne({ code: body.code.toUpperCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: "Kode promo sudah ada" }, { status: 400 });
    }

    const newPromo = await Promo.create({
      ...body,
      code: body.code.toUpperCase()
    });

    return NextResponse.json({ success: true, data: newPromo });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
