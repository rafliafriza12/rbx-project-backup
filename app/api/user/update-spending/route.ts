import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function PUT(request: NextRequest) {
  try {
    // This endpoint is restricted to internal server calls only (e.g. webhook handlers).
    // It must NOT be callable by regular users from the browser.
    const internalSecret = request.headers.get("x-internal-secret");
    const expectedSecret = process.env.INTERNAL_API_SECRET;
    if (!expectedSecret || internalSecret !== expectedSecret) {
      return NextResponse.json(
        { error: "Forbidden: endpoint is internal only" },
        { status: 403 },
      );
    }

    await dbConnect();

    const body = await request.json();
    const { userId, amount } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId wajib diisi" },
        { status: 400 },
      );
    }

    // Validation
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Jumlah harus berupa angka positif" },
        { status: 400 },
      );
    }

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    // Update spended money
    user.spendedMoney += amount;
    await user.save();

    return NextResponse.json(
      {
        message: "Pengeluaran berhasil diperbarui",
        addedAmount: amount,
        spendedMoney: user.spendedMoney,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Update spending error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
