import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import RobuxUsernamePricing from "@/models/RobuxUsernamePricing";
import { requireAdmin, requireApiKey } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const apiKeyError = await requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await connectDB();

    let pricing = await RobuxUsernamePricing.findOne().sort({ updatedAt: -1 });

    if (!pricing) {
      pricing = await RobuxUsernamePricing.create({
        pricePerHundred: 13000,
        minRobux: 50,
        maxRobux: 10000,
        description: "Harga Robux via Username (API Transfer)",
        updatedBy: "system",
      });
    }

    return NextResponse.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error("Error fetching robux username pricing:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data harga Robux via Username",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const apiKeyError = await requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await connectDB();

    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const body = await request.json();
    const { pricePerHundred, minRobux, maxRobux, description } = body;

    const parsedPrice = Number(pricePerHundred);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Harga per 100 Robux harus berupa angka lebih dari 0",
        },
        { status: 400 },
      );
    }

    const parsedMin = minRobux !== undefined ? Number(minRobux) : 50;
    if (isNaN(parsedMin) || parsedMin < 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimal Robux harus lebih dari atau sama dengan 1",
        },
        { status: 400 },
      );
    }

    const parsedMax = maxRobux !== undefined ? Number(maxRobux) : 10000;
    if (isNaN(parsedMax) || parsedMax < parsedMin) {
      return NextResponse.json(
        {
          success: false,
          message: "Maksimal Robux tidak boleh lebih kecil dari minimal Robux",
        },
        { status: 400 },
      );
    }

    let pricing = await RobuxUsernamePricing.findOne().sort({ updatedAt: -1 });

    if (pricing) {
      pricing.pricePerHundred = parsedPrice;
      pricing.minRobux = parsedMin;
      pricing.maxRobux = parsedMax;
      if (description !== undefined) pricing.description = description;
      pricing.updatedBy = "admin";
      await pricing.save();
    } else {
      pricing = await RobuxUsernamePricing.create({
        pricePerHundred: parsedPrice,
        minRobux: parsedMin,
        maxRobux: parsedMax,
        description: description || "Harga Robux via Username (API Transfer)",
        updatedBy: "admin",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Harga Robux via Username berhasil diperbarui",
      data: pricing,
    });
  } catch (error) {
    console.error("Error updating robux username pricing:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui harga Robux via Username",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
