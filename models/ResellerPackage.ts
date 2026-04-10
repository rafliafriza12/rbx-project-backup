import mongoose, { Document, Schema } from "mongoose";

export interface IResellerPackage extends Document {
  name: string;
  tier: number;
  price: number;
  duration: number; // in months
  discount: number; // discount percentage
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResellerPackageSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Nama paket diperlukan"],
      trim: true,
      maxlength: [100, "Nama paket tidak boleh lebih dari 100 karakter"],
    },
    tier: {
      type: Number,
      required: [true, "Tier diperlukan"],
      min: [1, "Tier minimal 1"],
      max: [3, "Tier maksimal 3"],
    },
    price: {
      type: Number,
      required: [true, "Harga diperlukan"],
      min: [0, "Harga tidak boleh negatif"],
    },
    duration: {
      type: Number,
      required: [true, "Durasi diperlukan"],
      min: [1, "Durasi minimal 1 bulan"],
    },
    discount: {
      type: Number,
      required: [true, "Diskon diperlukan"],
      min: [0, "Diskon tidak boleh negatif"],
      max: [100, "Diskon maksimal 100%"],
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
ResellerPackageSchema.index({ tier: 1 });
ResellerPackageSchema.index({ isActive: 1 });
ResellerPackageSchema.index({ price: 1 });

export default mongoose.models.ResellerPackage ||
  mongoose.model<IResellerPackage>("ResellerPackage", ResellerPackageSchema);
