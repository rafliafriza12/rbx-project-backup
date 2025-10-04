import mongoose from "mongoose";

const JokiItemSchema = new mongoose.Schema({
  itemName: {
    type: String,
    required: true,
    trim: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  syaratJoki: [
    {
      type: String,
      required: true,
      trim: true,
    },
  ],
  prosesJoki: [
    {
      type: String,
      required: true,
      trim: true,
    },
  ],
});

const JokiSchema = new mongoose.Schema(
  {
    gameName: {
      type: String,
      required: true,
      trim: true,
    },
    imgUrl: {
      type: String,
      required: true,
    },
    caraPesan: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    features: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
    item: [JokiItemSchema],
  },
  {
    timestamps: true,
  }
);

// Add indexes
JokiSchema.index({ gameName: 1 });
JokiSchema.index({ createdAt: -1 });

export interface JokiItem {
  itemName: string;
  imgUrl: string;
  price: number;
  description: string;
  syaratJoki: string[];
  prosesJoki: string[];
}

export interface Joki {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  item: JokiItem[];
  createdAt: Date;
  updatedAt: Date;
}

export default mongoose.models.Joki || mongoose.model("Joki", JokiSchema);
