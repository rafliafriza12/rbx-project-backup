import mongoose, { Document, Schema, Model } from "mongoose";

export interface IPurchaseRun extends Document {
  invoiceId?: string;
  transactionId?: mongoose.Types.ObjectId;
  serviceType: string;
  stockAccountId?: mongoose.Types.ObjectId;
  stockAccountUsername?: string;
  recipientUsername: string;
  recipientId: number;
  robuxAmount: number;
  rxtToken?: string;
  status: "success" | "failed" | "pending";
  failureReasonCode?: number;
  failureReason?: string;
  responseDetails?: any;
  executedBy: string;
  executedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRunSchema: Schema<IPurchaseRun> = new Schema(
  {
    invoiceId: {
      type: String,
      index: true,
      trim: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      index: true,
    },
    serviceType: {
      type: String,
      default: "robux_instant",
      index: true,
    },
    stockAccountId: {
      type: Schema.Types.ObjectId,
      ref: "StockAccount",
    },
    stockAccountUsername: {
      type: String,
      trim: true,
    },
    recipientUsername: {
      type: String,
      required: [true, "Recipient username diperlukan"],
      trim: true,
      index: true,
    },
    recipientId: {
      type: Number,
      required: [true, "Recipient ID diperlukan"],
      index: true,
    },
    robuxAmount: {
      type: Number,
      required: [true, "Robux amount diperlukan"],
      min: [1, "Robux amount minimal 1"],
    },
    rxtToken: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "pending",
      index: true,
    },
    failureReasonCode: {
      type: Number,
    },
    failureReason: {
      type: String,
      trim: true,
    },
    responseDetails: {
      type: Schema.Types.Mixed,
    },
    executedBy: {
      type: String,
      default: "system",
      trim: true,
    },
    executedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "purchase_runs",
  },
);

PurchaseRunSchema.index({ createdAt: -1 });
PurchaseRunSchema.index({ status: 1, createdAt: -1 });

export default (mongoose.models.PurchaseRun as Model<IPurchaseRun>) ||
  mongoose.model<IPurchaseRun>("PurchaseRun", PurchaseRunSchema, "purchase_runs");
