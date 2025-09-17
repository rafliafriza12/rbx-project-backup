import { NextRequest, NextResponse } from "next/server";
import { processOrderAndUpdateSpending } from "@/lib/orderUtils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, productType, productDetails, paymentMethod } = body;

    // Validation
    if (!amount || !productType || !productDetails) {
      return NextResponse.json(
        { error: "Data order tidak lengkap" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Jumlah pembayaran tidak valid" },
        { status: 400 }
      );
    }

    // Generate order ID (in real implementation, you might use a more sophisticated method)
    const orderId = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Process order and update user spending if authenticated
    const result = await processOrderAndUpdateSpending(request, {
      amount,
      orderId,
      productType,
      productDetails,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Gagal memproses pesanan" },
        { status: 500 }
      );
    }

    // Here you would typically:
    // 1. Save order to database
    // 2. Process payment with payment gateway
    // 3. Send confirmation email
    // 4. Update inventory

    const orderResponse = {
      orderId,
      amount,
      productType,
      productDetails,
      paymentMethod,
      status: "pending",
      createdAt: new Date().toISOString(),
      user: result.user || null, // Include updated user data if authenticated
    };

    return NextResponse.json(
      {
        message: "Pesanan berhasil dibuat",
        order: orderResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create order error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
