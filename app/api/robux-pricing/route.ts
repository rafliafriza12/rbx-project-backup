import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import RobuxPricing from "@/models/RobuxPricing";
import Product from "@/models/Product";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get the single pricing record
    const pricing = await RobuxPricing.findOne();

    return NextResponse.json({
      success: true,
      data: pricing,
    });
  } catch (error) {
    console.error("Error fetching robux pricing:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data harga Robux",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { pricePerHundred, description } = body;

    if (!pricePerHundred || pricePerHundred <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Harga per 100 Robux harus lebih dari 0",
        },
        { status: 400 }
      );
    }

    // Check if pricing already exists
    const existingPricing = await RobuxPricing.findOne();

    if (existingPricing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Harga sudah ada. Gunakan fungsi update untuk mengubah harga.",
        },
        { status: 400 }
      );
    }

    const newPricing = new RobuxPricing({
      pricePerHundred,
      description: description || "Harga per 100 Robux untuk kategori 5 hari",
    });

    await newPricing.save();

    // Update all existing robux_5_hari products with new calculated prices
    const robux5HariProducts = await Product.find({ category: "robux_5_hari" });

    if (robux5HariProducts.length > 0) {
      const updatePromises = robux5HariProducts.map(async (product) => {
        const newPrice = Math.ceil(
          (product.robuxAmount / 100) * pricePerHundred
        );
        return Product.findByIdAndUpdate(product._id, { price: newPrice });
      });

      await Promise.all(updatePromises);

      console.log(
        `Updated ${robux5HariProducts.length} robux 5 hari products with new pricing`
      );
    }

    return NextResponse.json({
      success: true,
      message: `Harga Robux berhasil ditambahkan${
        robux5HariProducts.length > 0
          ? ` dan ${robux5HariProducts.length} produk robux 5 hari telah diperbarui`
          : ""
      }`,
      data: newPricing,
      updatedProductsCount: robux5HariProducts.length,
    });
  } catch (error) {
    console.error("Error creating robux pricing:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan harga Robux",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { pricePerHundred, description } = body;

    if (!pricePerHundred || pricePerHundred <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Harga per 100 Robux harus lebih dari 0",
        },
        { status: 400 }
      );
    }

    // Find and update the single pricing record
    let pricing = await RobuxPricing.findOne();

    if (!pricing) {
      // If no pricing exists, create one
      pricing = new RobuxPricing({
        pricePerHundred,
        description: description || "Harga per 100 Robux untuk kategori 5 hari",
      });
    } else {
      // Update existing pricing
      pricing.pricePerHundred = pricePerHundred;
      if (description !== undefined) {
        pricing.description = description;
      }
    }

    await pricing.save();

    // Update all existing robux_5_hari products with new calculated prices
    const robux5HariProducts = await Product.find({ category: "robux_5_hari" });

    if (robux5HariProducts.length > 0) {
      const updatePromises = robux5HariProducts.map(async (product) => {
        const newPrice = Math.ceil(
          (product.robuxAmount / 100) * pricePerHundred
        );
        return Product.findByIdAndUpdate(product._id, { price: newPrice });
      });

      await Promise.all(updatePromises);

      console.log(
        `Updated ${robux5HariProducts.length} robux 5 hari products with new pricing`
      );
    }

    return NextResponse.json({
      success: true,
      message: `Harga Robux berhasil diupdate${
        robux5HariProducts.length > 0
          ? ` dan ${robux5HariProducts.length} produk robux 5 hari telah diperbarui`
          : ""
      }`,
      data: pricing,
      updatedProductsCount: robux5HariProducts.length,
    });
  } catch (error) {
    console.error("Error updating robux pricing:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengupdate harga Robux",
      },
      { status: 500 }
    );
  }
}
