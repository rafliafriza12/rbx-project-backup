import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  username: string;
  serviceType: string; // robux, gamepass, joki
  serviceCategory?: string; // robux_instant, robux_5_hari (only for robux)
  serviceId?: string; // ID dari joki atau gamepass yang direview
  serviceName?: string; // Nama joki atau gamepass yang direview
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    serviceType: {
      type: String,
      required: true,
      enum: ["robux", "gamepass", "joki"],
      trim: true,
    },
    serviceCategory: {
      type: String,
      required: function () {
        return this.serviceType === "robux";
      },
      enum: ["robux_instant", "robux_5_hari"],
      trim: true,
    },
    serviceId: {
      type: String,
      required: function () {
        return this.serviceType === "gamepass" || this.serviceType === "joki";
      },
      trim: true,
    },
    serviceName: {
      type: String,
      required: function () {
        return this.serviceType === "gamepass" || this.serviceType === "joki";
      },
      trim: true,
      maxlength: 100,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes untuk optimasi query
reviewSchema.index({ username: 1 });
reviewSchema.index({ serviceType: 1 });
reviewSchema.index({ serviceCategory: 1 });
reviewSchema.index({ serviceId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ createdAt: -1 });

// Model
const Review =
  mongoose.models.Review || mongoose.model<IReview>("Review", reviewSchema);

export default Review;
