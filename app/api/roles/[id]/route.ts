import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Role from "@/models/Role";
import User from "@/models/User";

// GET - Ambil role berdasarkan ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Role ID diperlukan" },
        { status: 400 }
      );
    }

    const role = await Role.findById(id);

    if (!role) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: role,
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

// PUT - Update role
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await request.json();
    const { member, diskon, description, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Role ID diperlukan" },
        { status: 400 }
      );
    }

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

    // Cek apakah role ada
    const existingRole = await Role.findById(id);
    if (!existingRole) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah nama role sudah digunakan oleh role lain
    const duplicateRole = await Role.findOne({
      member: member.trim().toLowerCase(),
      _id: { $ne: id },
    });

    if (duplicateRole) {
      return NextResponse.json(
        { error: "Role dengan nama tersebut sudah ada" },
        { status: 409 }
      );
    }

    // Update role
    const updatedRole = await Role.findByIdAndUpdate(
      id,
      {
        member: member.trim(),
        diskon,
        description: description?.trim() || "",
        isActive: typeof isActive === "boolean" ? isActive : true,
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: updatedRole,
      message: "Role berhasil diupdate",
    });
  } catch (error: any) {
    console.error("Error updating role:", error);

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
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}

// DELETE - Hapus role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Role ID diperlukan" },
        { status: 400 }
      );
    }

    // Cek apakah role ada
    const role = await Role.findById(id);
    if (!role) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah ada user yang masih menggunakan role ini
    const usersWithRole = await User.countDocuments({ memberRole: id });
    if (usersWithRole > 0) {
      return NextResponse.json(
        {
          error: `Tidak dapat menghapus role. Masih ada ${usersWithRole} user yang menggunakan role ini.`,
          details:
            "Silakan hapus atau pindahkan user tersebut ke role lain terlebih dahulu.",
        },
        { status: 409 }
      );
    }

    // Hapus role
    await Role.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Role berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Failed to delete role" },
      { status: 500 }
    );
  }
}
