import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import PaymentMethod from "@/models/PaymentMethod";

// GET - Fetch single payment method
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const paymentMethod = await PaymentMethod.findById(params.id);

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment method tidak ditemukan",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment method berhasil diambil",
      data: paymentMethod,
    });
  } catch (error: any) {
    console.error("Error fetching payment method:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil data payment method",
      },
      { status: 500 }
    );
  }
}

// PUT - Update payment method
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();

    const paymentMethod = await PaymentMethod.findById(params.id);

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment method tidak ditemukan",
        },
        { status: 404 }
      );
    }

    // Check if code is being changed and if it already exists
    if (body.code && body.code.toUpperCase() !== paymentMethod.code) {
      const existingMethod = await PaymentMethod.findOne({
        code: body.code.toUpperCase(),
        _id: { $ne: params.id },
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

    // Update fields
    if (body.code) paymentMethod.code = body.code.toUpperCase();
    if (body.name !== undefined) paymentMethod.name = body.name;
    if (body.category !== undefined) paymentMethod.category = body.category;
    if (body.icon !== undefined) paymentMethod.icon = body.icon;
    if (body.fee !== undefined) paymentMethod.fee = body.fee;
    if (body.feeType !== undefined) paymentMethod.feeType = body.feeType;
    if (body.description !== undefined)
      paymentMethod.description = body.description;
    if (body.isActive !== undefined) paymentMethod.isActive = body.isActive;
    if (body.displayOrder !== undefined)
      paymentMethod.displayOrder = body.displayOrder;
    if (body.midtransEnabled !== undefined)
      paymentMethod.midtransEnabled = body.midtransEnabled;
    if (body.duitkuEnabled !== undefined)
      paymentMethod.duitkuEnabled = body.duitkuEnabled;
    if (body.duitkuCode !== undefined)
      paymentMethod.duitkuCode = body.duitkuCode;
    if (body.minimumAmount !== undefined)
      paymentMethod.minimumAmount = body.minimumAmount;
    if (body.maximumAmount !== undefined)
      paymentMethod.maximumAmount = body.maximumAmount;
    if (body.instructions !== undefined)
      paymentMethod.instructions = body.instructions;

    await paymentMethod.save();

    return NextResponse.json({
      success: true,
      message: "Payment method berhasil diupdate",
      data: paymentMethod,
    });
  } catch (error: any) {
    console.error("Error updating payment method:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengupdate payment method",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const paymentMethod = await PaymentMethod.findById(params.id);

    if (!paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment method tidak ditemukan",
        },
        { status: 404 }
      );
    }

    await PaymentMethod.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: "Payment method berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting payment method:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal menghapus payment method",
      },
      { status: 500 }
    );
  }
}
