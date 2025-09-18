import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    // Invoice dan Identifikasi
    invoiceId: {
      type: String,
      required: true,
      unique: true,
      default: function () {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `INV-${timestamp}-${random}`;
      },
    },

    // Detail Layanan
    serviceType: {
      type: String,
      enum: ["robux", "gamepass", "joki"],
      required: true,
    },
    serviceCategory: {
      type: String,
      required: false, // Only for robux services
    },
    serviceId: {
      type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
      required: true,
    },
    serviceName: {
      type: String,
      required: true,
    },
    serviceImage: {
      type: String,
      default: "",
    },

    // Detail Pesanan
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Discount Information
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Data Akun Roblox (untuk semua layanan)
    robloxUsername: {
      type: String,
      required: true,
      trim: true,
    },
    robloxPassword: {
      type: String,
      required: false, // Optional - tidak diperlukan untuk gamepass
      default: null,
    },

    // Data Tambahan untuk Joki
    jokiDetails: {
      description: String,
      gameType: String,
      targetLevel: String,
      estimatedTime: String,
      notes: String,
    },

    // Data Tambahan untuk Robux Instant
    robuxInstantDetails: {
      notes: String,
    },

    // Data Gamepass untuk Robux 5 Hari
    gamepass: {
      id: Number,
      name: String,
      price: Number,
      productId: Number,
      sellerId: Number,
    },

    // Data Pembayaran Midtrans
    midtransOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    midtransTransactionId: {
      type: String,
      sparse: true,
    },
    snapToken: {
      type: String,
    },
    redirectUrl: {
      type: String,
    },

    // Status Pembayaran
    paymentStatus: {
      type: String,
      enum: [
        "pending", // Menunggu pembayaran
        "settlement", // Sudah dibayar
        "expired", // Kadaluarsa
        "cancelled", // Dibatalkan
        "failed", // Gagal
      ],
      default: "pending",
    },
    paidAt: {
      type: Date,
    },

    // Status Pesanan/Layanan
    orderStatus: {
      type: String,
      enum: [
        "waiting_payment", // Menunggu pembayaran
        "pending",
        "processing", // Sedang diproses
        "in_progress", // Sedang dikerjakan (untuk joki)
        "completed", // Selesai
        "cancelled", // Dibatalkan
        "failed", // Dikembalikan
      ],
      default: "waiting_payment",
    },

    // Tracking dan Log
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: String,
        updatedBy: {
          type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String
          ref: "User",
        },
      },
    ],

    // Data Customer
    customerInfo: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false,
      },
      email: String,
      phone: String,
      name: String,
    },

    // Metadata
    adminNotes: {
      type: String,
      default: "",
    },
    completedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 jam dari sekarang
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes untuk performa (menghapus index yang sudah unique di schema)
transactionSchema.index({ "customerInfo.userId": 1 });
transactionSchema.index({ paymentStatus: 1, orderStatus: 1 });
transactionSchema.index({ createdAt: -1 });

// Method untuk update status dengan history
transactionSchema.methods.updateStatus = function (
  statusType: "payment" | "order",
  newStatus: string,
  notes?: string,
  updatedBy?: any
) {
  if (statusType === "payment") {
    this.paymentStatus = newStatus;
    if (newStatus === "settlement") {
      this.paidAt = new Date();
      // Auto update order status jika pembayaran berhasil
      if (this.orderStatus === "waiting_payment") {
        this.orderStatus = "processing";
      }
    }
  } else {
    this.orderStatus = newStatus;
    if (newStatus === "completed") {
      this.completedAt = new Date();
    }
  }

  // Add to history
  this.statusHistory.push({
    status: `${statusType}:${newStatus}`,
    timestamp: new Date(),
    notes: notes || "",
    updatedBy: updatedBy,
  });

  return this.save();
};

// Method untuk generate Midtrans order ID
transactionSchema.methods.generateMidtransOrderId = function () {
  if (!this.midtransOrderId) {
    this.midtransOrderId = `ORDER-${this.invoiceId}-${Date.now()}`;
  }
  return this.midtransOrderId;
};

// Static method untuk statistics
transactionSchema.statics.getStatistics = async function (dateRange?: {
  start: Date;
  end: Date;
}) {
  const matchStage: any = {};

  if (dateRange) {
    matchStage.createdAt = {
      $gte: dateRange.start,
      $lte: dateRange.end,
    };
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
        paidTransactions: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "settlement"] }, 1, 0] },
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ["$orderStatus", "completed"] }, 1, 0] },
        },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "pending"] }, 1, 0] },
        },
        processingOrders: {
          $sum: {
            $cond: [
              { $in: ["$orderStatus", ["processing", "in_progress"]] },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalTransactions: 0,
      totalAmount: 0,
      paidTransactions: 0,
      completedOrders: 0,
      pendingPayments: 0,
      processingOrders: 0,
    }
  );
};

// Virtual untuk format currency
transactionSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(this.totalAmount);
});

// Ensure virtual fields are serialized
transactionSchema.set("toJSON", { virtuals: true });

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

export default Transaction;
