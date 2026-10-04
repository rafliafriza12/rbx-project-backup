import mongoose, { Document, Schema } from "mongoose";

export interface IRobuxUsernamePricing extends Document {
  pricePerHundred: number; // Harga per 100 Robux dalam IDR
  minRobux: number; // Minimal pembelian Robux (default: 50)
  maxRobux: number; // Maksimal pembelian Robux (default: 10000)
  description?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RobuxUsernamePricingSchema: Schema = new Schema(
  {
    pricePerHundred: {
      type: Number,
      required: [true, "Harga per 100 Robux diperlukan"],
      min: [1, "Harga per 100 Robux harus lebih dari 0"],
      default: 13000,
    },
    minRobux: {
      type: Number,
      default: 50,
      min: [1, "Minimal Robux tidak boleh kurang dari 1"],
    },
    maxRobux: {
      type: Number,
      default: 10000,
      min: [1, "Maksimal Robux tidak boleh kurang dari 1"],
    },
    description: {
      type: String,
      default: "Harga Robux via Username (API Transfer)",
    },
    updatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.RobuxUsernamePricing ||
  mongoose.model<IRobuxUsernamePricing>(
    "RobuxUsernamePricing",
    RobuxUsernamePricingSchema
  );
