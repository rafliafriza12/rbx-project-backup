import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    return NextResponse.json(
      {
        message: "Database connection successful",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Database connection error:", error);

    return NextResponse.json(
      {
        error: "Database connection failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
