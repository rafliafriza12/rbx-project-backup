import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PaymentMethod from "@/models/PaymentMethod";

// GET - Fetch all payment methods atau active payment methods
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active") === "true";
    const category = url.searchParams.get("category");

    let query: any = {};

    if (activeOnly) {
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    const paymentMethods = await PaymentMethod.find(query).sort({
      displayOrder: 1,
      name: 1,
    });

    return NextResponse.json({
      success: true,
      message: "Payment methods berhasil diambil",
      data: paymentMethods,
    });
  } catch (error: any) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data payment methods",
      },
      { status: 500 }
    );
  }
}

// POST - Create new payment method
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    // Validation
    if (!body.code || !body.name || !body.category) {
      return NextResponse.json(
        {
          success: false,
          error: "Code, name, dan category wajib diisi",
        },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingMethod = await PaymentMethod.findOne({
      code: body.code.toUpperCase(),
    });
    if (existingMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Kode payment method sudah digunakan",
        },
        { status: 400 }
      );
    }

    // Validate fee
    if (body.feeType === "percentage" && body.fee > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Fee percentage tidak boleh lebih dari 100%",
        },
        { status: 400 }
      );
    }

    // Create new payment method
    const paymentMethod = new PaymentMethod({
      code: body.code.toUpperCase(),
      name: body.name,
      category: body.category,
      icon: body.icon || "💳",
      fee: body.fee || 0,
      feeType: body.feeType || "fixed",
      description: body.description || "",
      isActive: body.isActive !== undefined ? body.isActive : true,
      displayOrder: body.displayOrder || 0,
      midtransEnabled:
        body.midtransEnabled !== undefined ? body.midtransEnabled : true,
      minimumAmount: body.minimumAmount,
      maximumAmount: body.maximumAmount,
      instructions: body.instructions,
    });

    await paymentMethod.save();

    return NextResponse.json(
      {
        success: true,
        message: "Payment method berhasil dibuat",
        data: paymentMethod,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating payment method:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal membuat payment method",
      },
      { status: 500 }
    );
  }
}
