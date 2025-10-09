import mongoose, { Document, Schema } from "mongoose";

export interface IBanner extends Document {
  _id: string;
  imageUrl: string;
  link: string;
  alt: string;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    imageUrl: {
      type: String,
      required: [true, "Image URL wajib diisi"],
    },
    link: {
      type: String,
      required: [true, "Link tujuan wajib diisi"],
    },
    alt: {
      type: String,
      required: [true, "Alt text wajib diisi"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk sorting berdasarkan order
BannerSchema.index({ order: 1, createdAt: -1 });

const Banner =
  mongoose.models.Banner || mongoose.model<IBanner>("Banner", BannerSchema);

export default Banner;
