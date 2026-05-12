import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import RobuxPricing from "@/models/RobuxPricing";
import { requireAdmin, requireApiKey } from "@/lib/auth";

// GET - Ambil semua produk dengan filtering
export async function GET(request: NextRequest) {
  try {
    const apiKeyError = await requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");
    const isAdmin = searchParams.get("admin") === "true";

    // Build filter object
    const filter: any = {};

    if (category) filter.category = category;
    if (isActive !== null && isActive !== undefined) {
      filter.isActive = isActive === "true";
    }
    
    // Filter by productType (regular/premium)
    if (type) {
      if (type === "regular") {
        // Treat missing productType as regular for older documents
        filter.$or = [
          { productType: "regular" },
          { productType: { $exists: false } },
          { productType: null }
        ];
      } else {
        filter.productType = type;
      }
    }

    // For public API (non-admin), only show active products
    if (!isAdmin) {
      filter.isActive = true;
    }

    // If admin request, verify admin token
    if (isAdmin) {
      try {
        await requireAdmin(request);
      } catch (authError: any) {
        const status = authError.message.includes("Forbidden") ? 403 : 401;
        return NextResponse.json({ error: authError.message }, { status });
      }
    }

    let products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    // If fetching coin category, auto-calculate price based on global settings
    if (category === "coin" || products.some(p => p.category === "coin")) {
      const Settings = (await import("@/models/Settings")).default;
      const settings = await Settings.findOne({});
      const coinTopupPrice = settings?.coinTopupPrice || 1000;
      const coinBonusTiers = settings?.coinBonusTiers || [];

      products = products.map((p: any) => {
        if (p.category === "coin") {
          const coinAmount = p.robuxAmount;
          p.price = coinAmount * coinTopupPrice;
          
          // Calculate bonus for display based on tiers, unless customBonusAmount is set
          let bonusAmount = 0;
          if (coinBonusTiers.length > 0) {
            // Find the tier with the highest minAmount that the quantity qualifies for
            let applicableTier = null;
            for (const tier of coinBonusTiers) {
              if (coinAmount >= tier.minAmount) {
                if (!applicableTier || tier.minAmount > applicableTier.minAmount) {
                  applicableTier = tier;
                }
              }
            }
            
            if (applicableTier) {
              if (applicableTier.bonusType === "fixed") {
                bonusAmount = applicableTier.fixedBonus || 0;
              } else {
                bonusAmount = Math.floor(coinAmount * ((applicableTier.percentage || 0) / 100));
              }
            }
          }
          
          let finalBonusAmount = bonusAmount;
          // Treats undefined or false as "Manual" (use customBonusAmount)
          if (!p.useBonusTiers) {
            finalBonusAmount = p.customBonusAmount || 0;
          }
          p.bonusAmount = finalBonusAmount;
        }
        return p;
      });
    }

    return NextResponse.json({
      message: "Produk berhasil diambil",
      products,
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}

// POST - Buat produk baru (Admin only)
export async function POST(request: NextRequest) {
  try {
    const apiKeyError = await requireApiKey(request);
    if (apiKeyError) return apiKeyError;

    await dbConnect();

    // Admin only
    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const body = await request.json();
    console.log("POST /api/products received body:", body);
    const { name, description, robuxAmount, price, isActive, category, productType, customBonusAmount, useBonusTiers } = body;
    console.log("Extracted productType:", productType);

    // Validation
    if (!name || !description || !robuxAmount || !category) {
      return NextResponse.json(
        { error: "Field wajib tidak boleh kosong" },
        { status: 400 },
      );
    }

    let finalPrice = price;

    // Auto-calculate price for robux_5_hari category
    if (category === "robux_5_hari") {
      const pricing = await RobuxPricing.findOne();

      if (!pricing) {
        return NextResponse.json(
          {
            error:
              "Harga per 100 Robux belum diatur. Silakan atur harga terlebih dahulu di menu Robux Pricing.",
          },
          { status: 400 },
        );
      }

      // Calculate price based on robux amount and price per 100 robux
      finalPrice = Math.ceil((robuxAmount / 100) * pricing.pricePerHundred);
    } else if (category === "coin") {
      finalPrice = 0;
    } else {
      // For other categories (robux_instant), price must be provided
      if (price === undefined || price === null || price < 0) {
        return NextResponse.json(
          { error: "Harga harus diisi untuk kategori ini" },
          { status: 400 },
        );
      }
      finalPrice = price;
    }

    // Create new product
    const newProduct = new Product({
      name,
      description,
      robuxAmount,
      price: finalPrice,
      isActive: isActive !== undefined ? isActive : true,
      category,
      productType: productType || "regular",
      customBonusAmount: customBonusAmount || 0,
      useBonusTiers: useBonusTiers !== undefined ? useBonusTiers : false,
    });

    await newProduct.save();

    return NextResponse.json(
      {
        message: "Produk berhasil dibuat",
        product: newProduct,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Create product error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
