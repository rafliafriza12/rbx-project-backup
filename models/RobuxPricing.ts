import mongoose, { Schema, Document } from "mongoose";

export interface IRobuxPricing extends Document {
  pricePerHundred: number; // Harga per 100 Robux dalam IDR
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RobuxPricingSchema: Schema = new Schema(
  {
    pricePerHundred: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "Harga per 100 Robux untuk kategori 5 hari",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.RobuxPricing ||
  mongoose.model<IRobuxPricing>("RobuxPricing", RobuxPricingSchema);
