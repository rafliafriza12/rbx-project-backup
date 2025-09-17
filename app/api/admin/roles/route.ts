import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Role from "@/models/Role";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

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

    // Get all active roles
    const roles = await Role.find({ isActive: true }).sort({ diskon: 1 });

    const rolesResponse = roles.map((role) => ({
      _id: role._id,
      member: role.member,
      diskon: role.diskon,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return NextResponse.json(
      {
        message: "Data roles berhasil diambil",
        roles: rolesResponse,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Get roles error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

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

    const { member, diskon, description } = await request.json();

    // Validate required fields
    if (!member || diskon === undefined) {
      return NextResponse.json(
        { error: "Nama member dan diskon wajib diisi" },
        { status: 400 }
      );
    }

    // Check if member name already exists
    const existingRole = await Role.findOne({ member });
    if (existingRole) {
      return NextResponse.json(
        { error: "Nama member sudah terdaftar" },
        { status: 400 }
      );
    }

    // Create new role
    const newRole = new Role({
      member,
      diskon,
      description,
      isActive: true,
    });

    await newRole.save();

    const roleResponse = {
      _id: newRole._id,
      member: newRole.member,
      diskon: newRole.diskon,
      description: newRole.description,
      isActive: newRole.isActive,
      createdAt: newRole.createdAt,
      updatedAt: newRole.updatedAt,
    };

    return NextResponse.json(
      {
        message: "Role berhasil dibuat",
        role: roleResponse,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create role error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
