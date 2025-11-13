// models/AutoPurchaseProgress.ts
import mongoose from "mongoose";

const autoPurchaseProgressSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["running", "completed", "failed"],
      default: "running",
    },
    triggeredBy: {
      stockAccountId: String,
      stockAccountName: String,
    },
    currentStep: {
      type: String,
      default: "Initializing...",
    },
    stockAccounts: [
      {
        id: String,
        username: String,
        robux: Number,
        status: String,
      },
    ],
    transactions: [
      {
        invoiceId: String,
        gamepassName: String,
        gamepassPrice: Number,
        status: {
          type: String,
          enum: ["pending", "processing", "completed", "failed"],
          default: "pending",
        },
        usedAccount: String,
        error: String,
        timestamp: Date,
      },
    ],
    summary: {
      totalTransactions: Number,
      processedCount: Number,
      skippedCount: Number,
      failedCount: Number,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: Date,
    error: String,
  },
  {
    timestamps: true,
  }
);

// Auto-delete after 1 hour
autoPurchaseProgressSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }
);

export default mongoose.models.AutoPurchaseProgress ||
  mongoose.model("AutoPurchaseProgress", autoPurchaseProgressSchema);
