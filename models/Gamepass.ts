import mongoose, { Document, Schema } from "mongoose";

export interface IGamepass extends Document {
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  showOnHomepage: boolean;
  developer: string;
  item: {
    itemName: string;
    imgUrl: string;
    price: number;
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
          price: {
            type: Number,
            required: [true, "Harga item diperlukan"],
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

// Pre-save middleware to validate homepage limit
GamepassSchema.pre("save", async function (next) {
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
});

// Pre-update middleware to validate homepage limit on findByIdAndUpdate
GamepassSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;

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
});

export default mongoose.models.Gamepass ||
  mongoose.model<IGamepass>("Gamepass", GamepassSchema);
