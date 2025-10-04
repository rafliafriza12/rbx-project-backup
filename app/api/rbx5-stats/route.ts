import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Product from "@/models/Product";
import StockAccount from "@/models/StockAccount";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // console.log("=== Fetching RBX5 Statistics ===");

    // 1. Total Stok - Jumlahkan robux dari semua akun stok yang aktif
    const stockAccounts = await StockAccount.find({
      status: "active",
    }).select("robux username");

    // console.log("Active stock accounts found:", stockAccounts.length);

    const totalStok = stockAccounts.reduce(
      (sum, account) => sum + (account.robux || 0),
      0
    );

    // console.log("Total stok calculated from stock accounts:", totalStok);
    // console.log(
    //   "Stock accounts breakdown:",
    //   stockAccounts.map((acc) => ({
    //     username: acc.username,
    //     robux: acc.robux,
    //   }))
    // );

    // 2. Total Order - Hitung jumlah transaksi dengan serviceCategory robux_5_hari
    const totalOrder = await Transaction.countDocuments({
      $or: [
        { serviceCategory: "robux_5_hari" },
        { serviceType: "robux", serviceCategory: "robux_5_hari" },
      ],
    });

    // console.log("Total orders found:", totalOrder);

    // 3. Terjual - Ambil data transaksi robux_5_hari yang settlement lalu jumlahkan robux
    const soldTransactions = await Transaction.find({
      $or: [
        { serviceCategory: "robux_5_hari" },
        { serviceType: "robux", serviceCategory: "robux_5_hari" },
      ],
      paymentStatus: "settlement",
      orderStatus: "completed",
    });

    // console.log("Sold transactions found:", soldTransactions.length);

    let totalTerjual = 0;

    for (const transaction of soldTransactions) {
      try {
        if (transaction.gamepass && transaction.gamepass.price) {
          totalTerjual +=
            transaction.gamepass.price * (transaction.quantity || 1);
        }
      } catch (error) {
        console.warn("Error processing transaction:", transaction._id, error);
      }
    }

    // console.log("Total terjual calculated:", totalTerjual);

    // 4. Harga per 100 Robux - Ambil dari collection RobuxPricing
    let hargaPer100Robux = 13000; // Default fallback

    try {
      const { default: RobuxPricing } = await import("@/models/RobuxPricing");
      const pricing = await RobuxPricing.findOne({});

      if (pricing && pricing.pricePerHundred) {
        hargaPer100Robux = pricing.pricePerHundred;
      }
      console.log(
        "RobuxPricing found:",
        pricing ? pricing.pricePerHundred : "not found"
      );
    } catch (error) {
      // Jika model RobuxPricing tidak ada, coba ambil dari produk
      console.log("RobuxPricing model not found, calculating from products");

      try {
        const sampleProduct = await Product.findOne({
          category: "robux_5_hari",
          isActive: true,
          robuxAmount: { $gte: 100 },
        }).sort({ robuxAmount: 1 });

        if (sampleProduct) {
          // Hitung harga per 100 robux berdasarkan produk sampel
          hargaPer100Robux = Math.round(
            (sampleProduct.price / sampleProduct.robuxAmount) * 100
          );
        }
        console.log("Calculated from sample product:", hargaPer100Robux);
      } catch (productError) {
        console.warn("Error calculating from products:", productError);
      }
    }

    const stats = {
      totalStok,
      totalOrder,
      totalTerjual,
      hargaPer100Robux,
    };

    console.log("Final stats:", stats);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching RBX5 stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch RBX5 statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
