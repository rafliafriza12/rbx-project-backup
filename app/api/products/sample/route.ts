import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Sample products untuk gamepass (robux 5 hari)
    const gamepassProducts = [
      {
        name: "Robux Package 100 - Gamepass",
        description:
          "Paket robux 100 melalui gamepass dengan durasi 5 hari. Cocok untuk pembelian item kecil di Roblox.",
        robuxAmount: 100,
        price: 15000,
        isActive: true,
        category: "robux_5_hari",
      },
      {
        name: "Robux Package 500 - Gamepass",
        description:
          "Paket robux 500 melalui gamepass dengan durasi 5 hari. Ideal untuk pembelian item premium.",
        robuxAmount: 500,
        price: 70000,
        isActive: true,
        category: "robux_5_hari",
      },
      {
        name: "Robux Package 1000 - Gamepass",
        description:
          "Paket robux 1000 melalui gamepass dengan durasi 5 hari. Perfect untuk upgrade avatar dan gamepass.",
        robuxAmount: 1000,
        price: 135000,
        isActive: true,
        category: "robux_5_hari",
      },
    ];

    // Sample products untuk instant (robux instant)
    const instantProducts = [
      {
        name: "Robux Package 100 - Instant",
        description:
          "Paket robux 100 langsung masuk ke akun Anda. Proses cepat dan aman dalam hitungan menit.",
        robuxAmount: 100,
        price: 18000,
        isActive: true,
        category: "robux_instant",
      },
      {
        name: "Robux Package 300 - Instant",
        description:
          "Paket robux 300 langsung masuk ke akun Anda. Cocok untuk pembelian item menengah.",
        robuxAmount: 300,
        price: 52000,
        isActive: true,
        category: "robux_instant",
      },
      {
        name: "Robux Package 800 - Instant",
        description:
          "Paket robux 800 langsung masuk ke akun Anda. Pilihan terbaik untuk pembelian premium.",
        robuxAmount: 800,
        price: 135000,
        isActive: true,
        category: "robux_instant",
      },
    ];

    // Insert all products
    const allProducts = [...gamepassProducts, ...instantProducts];
    const insertedProducts = await Product.insertMany(allProducts);

    return NextResponse.json(
      {
        message: "Sample products berhasil dibuat",
        count: insertedProducts.length,
        products: insertedProducts,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create sample products error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
