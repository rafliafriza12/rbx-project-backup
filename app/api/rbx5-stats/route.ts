import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Product from "@/models/Product";
import StockAccount from "@/models/StockAccount";
import Rbx5Stats from "@/models/Rbx5Stats";
import { requireApiKey } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const apiKeyError = requireApiKey(request);
  if (apiKeyError) return apiKeyError;

  try {
    await dbConnect();

    // Get stats config (singleton)
    const statsConfig = await Rbx5Stats.getStats();

    // Harga per 100 Robux - selalu dari RobuxPricing (tidak tergantung mode)
    let hargaPer100Robux = 13000; // Default fallback

    try {
      const { default: RobuxPricing } = await import("@/models/RobuxPricing");
      const pricing = await RobuxPricing.findOne({});

      if (pricing && pricing.pricePerHundred) {
        hargaPer100Robux = pricing.pricePerHundred;
      }
    } catch (error) {
      // Fallback: hitung dari produk
      try {
        const sampleProduct = await Product.findOne({
          category: "robux_5_hari",
          isActive: true,
          robuxAmount: { $gte: 100 },
        }).sort({ robuxAmount: 1 });

        if (sampleProduct) {
          hargaPer100Robux = Math.round(
            (sampleProduct.price / sampleProduct.robuxAmount) * 100,
          );
        }
      } catch (productError) {
        console.warn("Error calculating from products:", productError);
      }
    }

    if (statsConfig.mode === "manual") {
      // ============ MODE MANUAL ============
      // Gunakan nilai yang di-set admin
      const stats = {
        totalStok: statsConfig.manualTotalStok,
        totalOrder: statsConfig.manualTotalCustomers,
        totalTerjual: statsConfig.manualTotalTerjual,
        hargaPer100Robux,
        mode: "manual" as const,
      };

      return NextResponse.json({
        success: true,
        data: stats,
      });
    }

    // ============ MODE AUTO (default, seperti sebelumnya) ============

    // 1. Total Stok - Jumlahkan robux dari semua akun stok yang aktif
    const stockAccounts = await StockAccount.find({
      status: "active",
    }).select("robux username");

    const totalStok = stockAccounts.reduce(
      (sum, account) => sum + (account.robux || 0),
      0,
    );

    // 2. Total Order/Customers - Hitung jumlah transaksi dengan serviceCategory robux_5_hari
    const totalOrder = await Transaction.countDocuments({
      $or: [
        { serviceCategory: "robux_5_hari" },
        { serviceType: "robux", serviceCategory: "robux_5_hari" },
      ],
    });

    // 3. Terjual - Ambil data transaksi robux_5_hari yang settlement lalu jumlahkan robux
    const soldTransactions = await Transaction.find({
      $or: [
        { serviceCategory: "robux_5_hari" },
        { serviceType: "robux", serviceCategory: "robux_5_hari" },
      ],
      paymentStatus: "settlement",
      orderStatus: "completed",
    });

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

    const stats = {
      totalStok,
      totalOrder,
      totalTerjual,
      hargaPer100Robux,
      mode: "auto" as const,
    };

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
      { status: 500 },
    );
  }
}
