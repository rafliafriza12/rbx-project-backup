import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    await dbConnect();
    
    // Tambahkan field productType (regular) ke semua produk lama yang belum punya
    const result = await mongoose.connection.db.collection('products').updateMany(
      { productType: { $exists: false } },
      { $set: { productType: "regular" } }
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
