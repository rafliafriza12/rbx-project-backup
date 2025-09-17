import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Role from "@/models/Role";

// GET - Ambil semua roles
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { member: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== "") {
      query.isActive = isActive === "true";
    }

    // Get total count
    const total = await Role.countDocuments(query);

    // Get roles with pagination
    const roles = await Role.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: roles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

// POST - Buat role baru
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { member, diskon, description, isActive } = body;

    // Validasi input
    if (!member || typeof member !== "string" || member.trim().length === 0) {
      return NextResponse.json(
        { error: "Nama member diperlukan" },
        { status: 400 }
      );
    }

    if (typeof diskon !== "number" || diskon < 0 || diskon > 100) {
      return NextResponse.json(
        { error: "Diskon harus berupa angka antara 0-100" },
        { status: 400 }
      );
    }

    // Cek apakah role dengan nama yang sama sudah ada
    const existingRole = await Role.findOne({
      member: member.trim().toLowerCase(),
    });

    if (existingRole) {
      return NextResponse.json(
        { error: "Role dengan nama tersebut sudah ada" },
        { status: 409 }
      );
    }

    // Buat role baru
    const newRole = new Role({
      member: member.trim(),
      diskon,
      description: description?.trim() || "",
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    await newRole.save();

    return NextResponse.json({
      success: true,
      data: newRole,
      message: "Role berhasil dibuat",
    });
  } catch (error: any) {
    console.error("Error creating role:", error);

    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return NextResponse.json({ error: messages.join(", ") }, { status: 400 });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Role dengan nama tersebut sudah ada" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}
