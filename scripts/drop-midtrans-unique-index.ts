// Migration Script: Drop unique index on midtransOrderId
// Run this ONCE to fix the duplicate key error

import mongoose from "mongoose";
import Transaction from "../models/Transaction";

async function dropMidtransOrderIdIndex() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/robuxid";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Get the Transaction collection
    const collection = mongoose.connection.collection("transactions");

    // List all indexes
    console.log("\n📋 Current indexes:");
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if midtransOrderId_1 index exists
    const hasUniqueIndex = indexes.some(
      (index) => index.name === "midtransOrderId_1" && index.unique === true
    );

    if (hasUniqueIndex) {
      console.log("\n⚠️  Found unique index on midtransOrderId");
      console.log("🔧 Dropping index: midtransOrderId_1");

      // Drop the unique index
      await collection.dropIndex("midtransOrderId_1");
      console.log("✅ Index dropped successfully");

      // Verify index is dropped
      console.log("\n📋 Indexes after dropping:");
      const updatedIndexes = await collection.indexes();
      updatedIndexes.forEach((index) => {
        console.log(`  - ${index.name}:`, JSON.stringify(index.key));
      });
    } else {
      console.log("\n✅ No unique index on midtransOrderId found");
      console.log("   (Index may have been dropped already)");
    }

    // Close connection
    await mongoose.connection.close();
    console.log("\n✅ Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
console.log("🚀 Starting migration: Drop midtransOrderId unique index");
console.log("=".repeat(60));
dropMidtransOrderIdIndex();
