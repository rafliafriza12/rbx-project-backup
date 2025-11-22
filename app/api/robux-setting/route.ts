import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import RobuxSetting from "@/models/RobuxSetting";
import Gamepass from "@/models/Gamepass";

// GET - Ambil setting harga Robux
export async function GET() {
  try {
    await dbConnect();

    let setting = await RobuxSetting.findOne();

    // Jika belum ada setting, buat default
    if (!setting) {
      setting = await RobuxSetting.create({
        pricePerRobux: 100, // Default Rp 100 per Robux
        updatedBy: "system",
      });
    }

    return NextResponse.json({
      success: true,
      data: setting,
    });
  } catch (error: any) {
    console.error("Error fetching robux setting:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal mengambil setting Robux",
      },
      { status: 500 }
    );
  }
}

// PUT - Update setting harga Robux
export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { pricePerRobux, updatedBy } = body;

    if (!pricePerRobux || pricePerRobux < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Harga per Robux harus lebih dari 0",
        },
        { status: 400 }
      );
    }

    let setting = await RobuxSetting.findOne();

    if (setting) {
      setting.pricePerRobux = pricePerRobux;
      setting.updatedBy = updatedBy || "admin";
      await setting.save();
    } else {
      setting = await RobuxSetting.create({
        pricePerRobux,
        updatedBy: updatedBy || "admin",
      });
    }

    // Auto-update all gamepass prices
    console.log("Recalculating all gamepass prices...");
    try {
      await (Gamepass as any).recalculateAllPrices();
      console.log("All gamepass prices updated successfully!");
    } catch (recalcError: any) {
      console.error("Error recalculating gamepass prices:", recalcError);
      // Continue even if recalculation fails - setting is already saved
      return NextResponse.json({
        success: true,
        data: setting,
        message:
          "Setting Robux berhasil diperbarui, namun beberapa gamepass mungkin perlu diperbarui manual",
        warning:
          "Ada error saat update otomatis gamepass: " + recalcError.message,
      });
    }

    return NextResponse.json({
      success: true,
      data: setting,
      message: "Setting Robux dan semua harga gamepass berhasil diperbarui",
    });
  } catch (error: any) {
    console.error("Error updating robux setting:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Gagal memperbarui setting Robux",
      },
      { status: 500 }
    );
  }
}
