import mongoose, { Document, Schema } from "mongoose";

export interface IStockAccount extends Document {
  userId: number;
  username: string;
  displayName: string;
  robloxCookie: string;
  robux: number;
  status: "active" | "inactive";
  lastChecked: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StockAccountSchema: Schema<IStockAccount> = new Schema(
  {
    userId: {
      type: Number,
      required: [true, "User ID diperlukan"],
      unique: true,
    },
    username: {
      type: String,
      required: [true, "Username diperlukan"],
      trim: true,
      maxlength: [50, "Username tidak boleh lebih dari 50 karakter"],
    },
    displayName: {
      type: String,
      required: [true, "Display name diperlukan"],
      trim: true,
      maxlength: [50, "Display name tidak boleh lebih dari 50 karakter"],
    },
    robloxCookie: {
      type: String,
      required: [true, "Roblox cookie diperlukan"],
      trim: true,
    },
    robux: {
      type: Number,
      default: 0,
      min: [0, "Robux tidak boleh negatif"],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      required: true,
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
StockAccountSchema.index({ userId: 1 }, { unique: true });
StockAccountSchema.index({ username: 1 });
StockAccountSchema.index({ status: 1 });
StockAccountSchema.index({ lastChecked: 1 });

export default mongoose.models.StockAccount ||
  mongoose.model<IStockAccount>("StockAccount", StockAccountSchema);
