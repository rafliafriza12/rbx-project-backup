import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Promo from "@/models/Promo";

export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  try {
    const { id } = context.params;
    const body = await req.json();

    const promo = await Promo.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!promo) {
      return NextResponse.json({ success: false, error: "Promo tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: promo });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  try {
    await requireAdmin(req);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  try {
    const { id } = context.params;
    const promo = await Promo.findByIdAndDelete(id);

    if (!promo) {
      return NextResponse.json({ success: false, error: "Promo tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: {} });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
