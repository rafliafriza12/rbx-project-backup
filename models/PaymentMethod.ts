import mongoose, { Schema, Document } from "mongoose";

export interface IPaymentMethod extends Document {
  code: string; // Kode untuk Midtrans (e.g., "gopay", "bca_va", "qris")
  name: string; // Nama tampilan (e.g., "GoPay", "BCA Virtual Account")
  category: string; // Kategori: "ewallet", "bank_transfer", "qris", "retail", "credit_card"
  icon: string; // URL icon atau emoji
  fee: number; // Biaya admin
  feeType: "fixed" | "percentage"; // Tipe fee: fixed (nominal) atau percentage (%)
  description: string; // Deskripsi singkat
  isActive: boolean; // Status aktif/nonaktif
  displayOrder: number; // Urutan tampilan
  midtransEnabled: boolean; // Apakah terintegrasi dengan Midtrans
  minimumAmount?: number; // Minimal transaksi (opsional)
  maximumAmount?: number; // Maksimal transaksi (opsional)
  instructions?: string; // Instruksi pembayaran (opsional)
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "ewallet",
        "bank_transfer",
        "qris",
        "retail",
        "credit_card",
        "other",
      ],
      default: "other",
    },
    icon: {
      type: String,
      default: "💳",
    },
    fee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    feeType: {
      type: String,
      required: true,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    midtransEnabled: {
      type: Boolean,
      default: true,
    },
    minimumAmount: {
      type: Number,
      min: 0,
    },
    maximumAmount: {
      type: Number,
      min: 0,
    },
    instructions: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index untuk performance
PaymentMethodSchema.index({ isActive: 1, displayOrder: 1 });
PaymentMethodSchema.index({ category: 1, isActive: 1 });

// Static method untuk get active payment methods
PaymentMethodSchema.statics.getActivePaymentMethods = function () {
  return this.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
};

// Static method untuk get by category
PaymentMethodSchema.statics.getByCategory = function (category: string) {
  return this.find({ category, isActive: true }).sort({ displayOrder: 1 });
};

const PaymentMethod =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);

export default PaymentMethod;
