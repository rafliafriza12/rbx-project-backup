import mongoose, { Document, Schema, Model } from "mongoose";

export interface IRbx5Stats extends Document {
  // Mode: "auto" = hitung dari database realtime, "manual" = admin set manual
  mode: "auto" | "manual";

  // Manual values - digunakan saat mode "manual"
  manualTotalStok: number;
  manualTotalTerjual: number;
  manualTotalCustomers: number;

  // Auto-tracking counters - selalu update saat ada purchase, terlepas dari mode
  // Ini berguna agar saat switch dari manual ke auto, data tetap akurat
  trackedTotalTerjual: number; // Kumulatif robux terjual dari semua purchase
  trackedTotalCustomers: number; // Kumulatif jumlah transaksi completed

  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface IRbx5StatsModel extends Model<IRbx5Stats> {
  getStats(): Promise<IRbx5Stats>;
  recordPurchase(
    robuxAmount: number,
    customerCount?: number,
  ): Promise<IRbx5Stats>;
}

const Rbx5StatsSchema: Schema<IRbx5Stats> = new Schema(
  {
    mode: {
      type: String,
      enum: ["auto", "manual"],
      default: "auto",
      required: true,
    },

    // Manual override values
    manualTotalStok: {
      type: Number,
      default: 0,
      min: [0, "Nilai tidak boleh negatif"],
    },
    manualTotalTerjual: {
      type: Number,
      default: 0,
      min: [0, "Nilai tidak boleh negatif"],
    },
    manualTotalCustomers: {
      type: Number,
      default: 0,
      min: [0, "Nilai tidak boleh negatif"],
    },

    // Auto-tracking counters (always updated on purchase regardless of mode)
    trackedTotalTerjual: {
      type: Number,
      default: 0,
      min: 0,
    },
    trackedTotalCustomers: {
      type: Number,
      default: 0,
      min: 0,
    },

    updatedBy: {
      type: String,
      default: "system",
    },
  },
  {
    timestamps: true,
  },
);

// Helper: Get or create the singleton stats document
Rbx5StatsSchema.statics.getStats = async function () {
  let stats = await this.findOne();
  if (!stats) {
    stats = await this.create({
      mode: "auto",
      manualTotalStok: 0,
      manualTotalTerjual: 0,
      manualTotalCustomers: 0,
      trackedTotalTerjual: 0,
      trackedTotalCustomers: 0,
    });
  }
  return stats;
};

// Helper: Record a purchase (called after successful gamepass purchase)
// Updates both manual and tracked counters
Rbx5StatsSchema.statics.recordPurchase = async function (
  robuxAmount: number,
  customerCount: number = 1,
) {
  // Use findOne directly instead of this.getStats() to avoid TS issue
  let stats = await this.findOne();
  if (!stats) {
    stats = await this.create({
      mode: "auto",
      manualTotalStok: 0,
      manualTotalTerjual: 0,
      manualTotalCustomers: 0,
      trackedTotalTerjual: 0,
      trackedTotalCustomers: 0,
    });
  }

  // Always update tracked counters
  stats.trackedTotalTerjual += robuxAmount;
  stats.trackedTotalCustomers += customerCount;

  // If manual mode, also update manual counters
  if (stats.mode === "manual") {
    stats.manualTotalStok = Math.max(0, stats.manualTotalStok - robuxAmount);
    stats.manualTotalTerjual += robuxAmount;
    stats.manualTotalCustomers += customerCount;
  }

  await stats.save();
  return stats;
};

export default (mongoose.models.Rbx5Stats as IRbx5StatsModel) ||
  mongoose.model<IRbx5Stats, IRbx5StatsModel>("Rbx5Stats", Rbx5StatsSchema);
