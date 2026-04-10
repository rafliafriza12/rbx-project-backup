import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Role from "@/models/Role";
import { requireAdmin } from "@/lib/auth";

const defaultRoles = [
  {
    member: "Bronze",
    diskon: 0,
    description: "Member standar tanpa diskon",
    isActive: true,
  },
  {
    member: "Silver",
    diskon: 5,
    description: "Member silver dengan diskon 5%",
    isActive: true,
  },
  {
    member: "Gold",
    diskon: 10,
    description: "Member gold dengan diskon 10%",
    isActive: true,
  },
  {
    member: "Platinum",
    diskon: 15,
    description: "Member platinum dengan diskon 15%",
    isActive: true,
  },
  {
    member: "Diamond",
    diskon: 20,
    description: "Member diamond dengan diskon 20%",
    isActive: true,
  },
];

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Auth check - hanya admin
    try {
      await requireAdmin(request);
    } catch (authError: any) {
      const status = authError.message.includes("Forbidden") ? 403 : 401;
      return NextResponse.json({ error: authError.message }, { status });
    }

    const results = [];

    for (const roleData of defaultRoles) {
      const existingRole = await Role.findOne({ member: roleData.member });

      if (!existingRole) {
        const role = new Role(roleData);
        await role.save();
        results.push({ action: "created", role: roleData.member });
      } else {
        results.push({ action: "exists", role: roleData.member });
      }
    }

    return NextResponse.json(
      {
        message: "Roles seeding completed",
        results,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Seed roles error:", error);

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 },
    );
  }
}
