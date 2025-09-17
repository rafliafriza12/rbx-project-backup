import mongoose, { Document, Schema } from "mongoose";

export interface IRole extends Document {
  member: string;
  diskon: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema<IRole> = new Schema(
  {
    member: {
      type: String,
      required: [true, "Nama member diperlukan"],
      trim: true,
      maxlength: [50, "Nama member tidak boleh lebih dari 50 karakter"],
    },
    diskon: {
      type: Number,
      required: [true, "Diskon diperlukan"],
      min: [0, "Diskon tidak boleh negatif"],
      max: [100, "Diskon tidak boleh lebih dari 100%"],
      default: 0,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Deskripsi tidak boleh lebih dari 200 karakter"],
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
RoleSchema.index({ member: 1 }, { unique: true });
RoleSchema.index({ isActive: 1 });

export default mongoose.models.Role ||
  mongoose.model<IRole>("Role", RoleSchema);
