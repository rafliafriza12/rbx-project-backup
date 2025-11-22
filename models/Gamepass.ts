import mongoose, { Document, Schema } from "mongoose";
import RobuxSetting from "./RobuxSetting";

export interface IGamepass extends Document {
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  showOnHomepage: boolean;
  developer: string;
  item: {
    itemName: string;
    imgUrl: string;
    robuxAmount: number; // Jumlah Robux (input dari admin)
    price: number; // Harga dalam Rupiah (auto-calculated)
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const GamepassSchema: Schema = new Schema(
  {
    gameName: {
      type: String,
      required: [true, "Nama game diperlukan"],
      trim: true,
      maxlength: [100, "Nama game tidak boleh lebih dari 100 karakter"],
    },
    imgUrl: {
      type: String,
      required: [true, "URL gambar diperlukan"],
      trim: true,
    },
    caraPesan: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "Minimal satu cara pesan diperlukan",
      },
    },
    showOnHomepage: {
      type: Boolean,
      default: false,
    },
    developer: {
      type: String,
      required: [true, "Developer diperlukan"],
      trim: true,
      maxlength: [100, "Nama developer tidak boleh lebih dari 100 karakter"],
    },
    item: {
      type: [
        {
          itemName: {
            type: String,
            required: [true, "Nama item diperlukan"],
            trim: true,
            maxlength: [100, "Nama item tidak boleh lebih dari 100 karakter"],
          },
          imgUrl: {
            type: String,
            required: [true, "URL gambar item diperlukan"],
            trim: true,
          },
          robuxAmount: {
            type: Number,
            required: [true, "Jumlah Robux diperlukan"],
            min: [0, "Jumlah Robux tidak boleh negatif"],
          },
          price: {
            type: Number,
            default: 0, // Will be auto-calculated
            min: [0, "Harga tidak boleh negatif"],
          },
        },
      ],
      validate: {
        validator: function (v: any[]) {
          return v && v.length > 0;
        },
        message: "Minimal satu item diperlukan",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
GamepassSchema.index({ gameName: 1 });
GamepassSchema.index({ createdAt: -1 });
GamepassSchema.index({ showOnHomepage: 1 });

// Static method to check homepage limit
GamepassSchema.statics.canAddToHomepage = async function (excludeId?: string) {
  const count = await this.countDocuments({
    showOnHomepage: true,
    ...(excludeId && { _id: { $ne: excludeId } }),
  });
  return count < 3;
};

// Pre-save middleware to validate homepage limit and auto-calculate price
GamepassSchema.pre("save", async function (next) {
  try {
    // Auto-calculate price for each item based on robuxAmount
    const robuxSetting = await RobuxSetting.findOne();
    const pricePerRobux = robuxSetting?.pricePerRobux || 100;

    // Map items dengan type assertion yang benar
    const items = this.item as any[];
    this.item = items.map((item) => {
      const itemObj = item.toObject ? item.toObject() : item;
      const robuxAmount = Number(itemObj.robuxAmount) || 0;
      const calculatedPrice = Math.round(robuxAmount * pricePerRobux);

      return {
        ...itemObj,
        robuxAmount: robuxAmount,
        price: isNaN(calculatedPrice) ? 0 : calculatedPrice,
      };
    }) as any;

    // Validate homepage limit
    if (this.showOnHomepage && this.isModified("showOnHomepage")) {
      const canAdd = await (this.constructor as any).canAddToHomepage(this._id);
      if (!canAdd) {
        const error = new Error(
          "Maksimal 3 gamepass yang dapat ditampilkan di homepage"
        );
        return next(error);
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// Pre-update middleware to validate homepage limit and auto-calculate price on findByIdAndUpdate
GamepassSchema.pre("findOneAndUpdate", async function (next) {
  try {
    const update = this.getUpdate() as any;

    // If items are being updated, recalculate prices
    if (update && update.item) {
      const robuxSetting = await RobuxSetting.findOne();
      const pricePerRobux = robuxSetting?.pricePerRobux || 100;

      update.item = update.item.map((item: any) => {
        const robuxAmount = Number(item.robuxAmount) || 0;
        const calculatedPrice = Math.round(robuxAmount * pricePerRobux);

        return {
          ...item,
          robuxAmount: robuxAmount,
          price: isNaN(calculatedPrice) ? 0 : calculatedPrice,
        };
      });

      this.setUpdate(update);
    }

    // Validate homepage limit
    if (update && update.showOnHomepage === true) {
      const gamepassId = this.getQuery()._id;
      const canAdd = await (this.model as any).canAddToHomepage(gamepassId);
      if (!canAdd) {
        const error = new Error(
          "Maksimal 3 gamepass yang dapat ditampilkan di homepage"
        );
        return next(error);
      }
    }
    next();
  } catch (error: any) {
    next(error);
  }
});

// Static method to recalculate all prices (digunakan ketika harga per Robux berubah)
GamepassSchema.statics.recalculateAllPrices = async function () {
  try {
    const robuxSetting = await RobuxSetting.findOne();
    const pricePerRobux = robuxSetting?.pricePerRobux || 100;

    const gamepasses = await this.find();

    const updates = gamepasses.map((gamepass: any) => {
      const updatedItems = gamepass.item.map((item: any) => {
        // Ensure robuxAmount is a valid number
        const robuxAmount = Number(item.robuxAmount) || 0;
        const calculatedPrice = Math.round(robuxAmount * pricePerRobux);

        return {
          ...item.toObject(),
          robuxAmount: robuxAmount, // Ensure it's a number
          price: isNaN(calculatedPrice) ? 0 : calculatedPrice, // Prevent NaN
        };
      });

      return this.findByIdAndUpdate(
        gamepass._id,
        { item: updatedItems },
        { new: true, runValidators: true }
      );
    });

    return Promise.all(updates);
  } catch (error) {
    console.error("Error recalculating prices:", error);
    throw error;
  }
};

export default mongoose.models.Gamepass ||
  mongoose.model<IGamepass>("Gamepass", GamepassSchema);
