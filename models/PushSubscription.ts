import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    subscription: {
      endpoint: {
        type: String,
        required: true,
      },
      keys: {
        p256dh: {
          type: String,
          required: true,
        },
        auth: {
          type: String,
          required: true,
        },
      },
    },
    userAgent: {
      type: String, // Browser info
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for userId and endpoint (prevent duplicates)
pushSubscriptionSchema.index({ userId: 1, "subscription.endpoint": 1 }, { unique: true });

const PushSubscription =
  mongoose.models.PushSubscription ||
  mongoose.model("PushSubscription", pushSubscriptionSchema);

export default PushSubscription;
