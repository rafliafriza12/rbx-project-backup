import mongoose, { Document, Schema } from "mongoose";

export interface IProduct extends Document {
  name: string;
  description: string;
  robuxAmount: number;
  price: number;
  isActive: boolean;
  category: "robux_5_hari" | "robux_instant";
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Nama produk diperlukan"],
      trim: true,
      maxlength: [100, "Nama produk tidak boleh lebih dari 100 karakter"],
    },
    description: {
      type: String,
      required: [true, "Deskripsi produk diperlukan"],
      trim: true,
      maxlength: [500, "Deskripsi tidak boleh lebih dari 500 karakter"],
    },
    robuxAmount: {
      type: Number,
      required: [true, "Jumlah robux diperlukan"],
      min: [1, "Jumlah robux minimal 1"],
    },
    price: {
      type: Number,
      required: [true, "Harga diperlukan"],
      min: [0, "Harga tidak boleh negatif"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: ["robux_5_hari", "robux_instant"],
      required: [true, "Kategori produk diperlukan"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ robuxAmount: 1 });

export default mongoose.models.Product ||
  mongoose.model<IProduct>("Product", ProductSchema);
