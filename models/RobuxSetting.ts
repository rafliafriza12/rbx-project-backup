import mongoose, { Document, Schema } from "mongoose";

export interface IRobuxSetting extends Document {
  pricePerRobux: number; // Harga per 1 Robux dalam Rupiah
  updatedBy: string; // Admin yang mengubah
  createdAt: Date;
  updatedAt: Date;
}

const RobuxSettingSchema: Schema = new Schema(
  {
    pricePerRobux: {
      type: Number,
      required: [true, "Harga per Robux diperlukan"],
      min: [0, "Harga tidak boleh negatif"],
      default: 100, // Default Rp 100 per Robux
    },
    updatedBy: {
      type: String,
      required: [true, "Admin updater diperlukan"],
      default: "system",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one document exists
RobuxSettingSchema.index({}, { unique: false });

export default mongoose.models.RobuxSetting ||
  mongoose.model<IRobuxSetting>("RobuxSetting", RobuxSettingSchema);
