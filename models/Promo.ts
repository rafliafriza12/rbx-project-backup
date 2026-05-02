import mongoose from "mongoose";

const PromoSchema = new mongoose.Schema(
  {
    code: { 
      type: String, 
      required: true, 
      unique: true, 
      uppercase: true,
      trim: true
    },
    discountType: { 
      type: String, 
      enum: ["percentage", "fixed"], 
      required: true 
    },
    discountValue: { 
      type: Number, 
      required: true,
      min: [0, "Nilai diskon tidak boleh negatif"]
    },
    maxUses: { 
      type: Number, 
      default: 0, // 0 means unlimited
      min: [0, "Batas maksimal penggunaan tidak boleh negatif"]
    },
    maxUsesPerUser: {
      type: Number,
      default: 1, // default to 1 use per user
      min: [0, "Batas penggunaan per user tidak boleh negatif"]
    },
    currentUses: { 
      type: Number, 
      default: 0,
      min: [0, "Penggunaan saat ini tidak boleh negatif"]
    },
    usedBy: [
      {
        userId: { type: String, required: true },
        count: { type: Number, default: 0 }
      }
    ],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    expiresAt: { 
      type: Date 
    },
    minPurchaseAmount: { 
      type: Number, 
      default: 0,
      min: [0, "Minimal belanja tidak boleh negatif"]
    },
    applicableTo: {
      type: [String],
      default: [], // empty means applicable to all
      enum: ["rbx5", "robux_instant", "gamepass"]
    }
  },
  { 
    timestamps: true 
  }
);

// To avoid recompilation issues in Next.js development
export default mongoose.models.Promo || mongoose.model("Promo", PromoSchema);
