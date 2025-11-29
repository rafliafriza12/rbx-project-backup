import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";

// This endpoint can be called without authentication for emergency index fixes
// But should only be used during development/maintenance
export async function GET() {
  try {
    await connectDB();

    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { error: "Database connection not available" },
        { status: 500 }
      );
    }

    const collection = db.collection("transactions");

    // Get current indexes
    const indexesBefore = await collection.indexes();

    const droppedIndexes: string[] = [];
    const errors: string[] = [];

    // Check if midtransOrderId_1 unique index exists and drop it
    const midtransIndex = indexesBefore.find(
      (idx) => idx.name === "midtransOrderId_1" && idx.unique === true
    );

    if (midtransIndex) {
      try {
        await collection.dropIndex("midtransOrderId_1");
        droppedIndexes.push("midtransOrderId_1");
      } catch (err: any) {
        errors.push(`Failed to drop midtransOrderId_1: ${err.message}`);
      }
    }

    // Get indexes after cleanup
    const indexesAfter = await collection.indexes();

    return NextResponse.json({
      success: true,
      message: "Index sync completed",
      indexesBefore: indexesBefore.map((idx) => ({
        name: idx.name,
        key: idx.key,
        unique: idx.unique || false,
      })),
      indexesAfter: indexesAfter.map((idx) => ({
        name: idx.name,
        key: idx.key,
        unique: idx.unique || false,
      })),
      droppedIndexes,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Sync indexes error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync indexes" },
      { status: 500 }
    );
  }
}
