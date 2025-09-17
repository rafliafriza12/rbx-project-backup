import mongoose, { Document, Schema } from "mongoose";

export interface IGamepass extends Document {
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
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
    features: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v && v.length > 0;
        },
        message: "Minimal satu fitur diperlukan",
      },
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

export default mongoose.models.Gamepass ||
  mongoose.model<IGamepass>("Gamepass", GamepassSchema);
