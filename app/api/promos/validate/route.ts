import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Promo from "@/models/Promo";
import { authenticateToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const { code, totalAmount, serviceType } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, error: "Kode promo tidak valid" }, { status: 400 });
    }

    let userId = null;
    try {
      const user = await authenticateToken(req);
      userId = user._id;
    } catch (e) {
      // User might be a guest
    }

    const promo = await Promo.findOne({ code: code.toUpperCase() });

    if (!promo) {
      return NextResponse.json({ success: false, error: "Kode promo tidak ditemukan" }, { status: 404 });
    }

    if (!promo.isActive) {
      return NextResponse.json({ success: false, error: "Kode promo sudah tidak aktif" }, { status: 400 });
    }

    if (promo.applicableTo && promo.applicableTo.length > 0 && serviceType) {
      if (!promo.applicableTo.includes(serviceType)) {
        return NextResponse.json({ success: false, error: "Kode promo ini tidak berlaku untuk layanan ini" }, { status: 400 });
      }
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return NextResponse.json({ success: false, error: "Kode promo sudah kedaluwarsa" }, { status: 400 });
    }

    if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
      return NextResponse.json({ success: false, error: "Batas maksimal penggunaan kode promo telah tercapai" }, { status: 400 });
    }

    if (promo.minPurchaseAmount > 0 && totalAmount < promo.minPurchaseAmount) {
      return NextResponse.json({ success: false, error: `Minimal belanja untuk menggunakan promo ini adalah Rp ${promo.minPurchaseAmount.toLocaleString()}` }, { status: 400 });
    }

    // Check per-user limit if user is logged in
    if (userId && promo.maxUsesPerUser > 0) {
      const userUsage = promo.usedBy.find((u: any) => u.userId === userId.toString());
      if (userUsage && userUsage.count >= promo.maxUsesPerUser) {
        return NextResponse.json({ success: false, error: "Anda telah mencapai batas maksimal penggunaan promo ini" }, { status: 400 });
      }
    } else if (!userId && promo.maxUsesPerUser > 0) {
      // If user is not logged in but there's a per-user limit, we should enforce login
      return NextResponse.json({ success: false, error: "Silakan login untuk menggunakan kode promo ini" }, { status: 401 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === "percentage") {
      discountAmount = Math.round((totalAmount * promo.discountValue) / 100);
    } else {
      discountAmount = promo.discountValue;
    }

    // Ensure discount doesn't exceed total amount
    if (discountAmount > totalAmount) {
      discountAmount = totalAmount;
    }

    return NextResponse.json({
      success: true,
      data: {
        code: promo.code,
        discountAmount,
        discountType: promo.discountType,
        discountValue: promo.discountValue
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
