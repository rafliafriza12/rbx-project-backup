import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Product";
import User from "@/models/User";
import RobuxPricing from "@/models/RobuxPricing";
import { verifyToken } from "@/lib/auth";

// GET - Ambil semua produk dengan filtering
export async function GET(request: NextRequest) {
  try {
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

    // For public API (non-admin), only show active products
    if (!isAdmin) {
      filter.isActive = true;
    }

    // If admin request, verify admin token
    if (isAdmin) {
      const token = request.cookies.get("token")?.value;
      if (!token) {
        return NextResponse.json(
          { error: "Token tidak ditemukan" },
          { status: 401 }
        );
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return NextResponse.json(
          { error: "Token tidak valid" },
          { status: 401 }
        );
      }

      const user = await User.findById(decoded.userId);
      if (!user || user.accessRole !== "admin") {
        return NextResponse.json(
          { error: "Akses ditolak. Admin diperlukan" },
          { status: 403 }
        );
      }
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      message: "Produk berhasil diambil",
      products,
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Buat produk baru (Admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Verify admin token
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.accessRole !== "admin") {
      return NextResponse.json(
        { error: "Akses ditolak. Admin diperlukan" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, robuxAmount, price, isActive, category } = body;

    // Validation
    if (!name || !description || !robuxAmount || !category) {
      return NextResponse.json(
        { error: "Field wajib tidak boleh kosong" },
        { status: 400 }
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
          { status: 400 }
        );
      }

      // Calculate price based on robux amount and price per 100 robux
      finalPrice = Math.ceil((robuxAmount / 100) * pricing.pricePerHundred);
    } else {
      // For other categories (robux_instant), price must be provided
      if (!price) {
        return NextResponse.json(
          { error: "Harga harus diisi untuk kategori ini" },
          { status: 400 }
        );
      }
    }

    // Create new product
    const newProduct = new Product({
      name,
      description,
      robuxAmount,
      price: finalPrice,
      isActive: isActive !== undefined ? isActive : true,
      category,
    });

    await newProduct.save();

    return NextResponse.json(
      {
        message: "Produk berhasil dibuat",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create product error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
