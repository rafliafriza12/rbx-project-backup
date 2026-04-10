import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
    await dbConnect();

    return NextResponse.json(
      {
        message: "Database connection successful",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
