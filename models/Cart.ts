import mongoose, { Document, Schema } from "mongoose";

export interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  // Sesuaikan dengan Transaction model
  serviceType: "robux" | "gamepass" | "joki"; // Sesuai enum di Transaction
  serviceId: mongoose.Schema.Types.Mixed; // Allow both ObjectId and String
  serviceName: string; // Nama layanan
  serviceImage: string; // URL gambar
  serviceCategory?: string; // robux_5_hari, robux_instant, dll (untuk robux services)

  // Legacy fields untuk backward compatibility
  type?: "rbx5" | "rbx-instant" | "gamepass" | "joki";
  gameId?: string;
  gameName: string;
  itemName: string;
  imgUrl: string;

  // Pricing
  unitPrice: number; // Sesuai dengan Transaction model
  price: number; // Keep for backward compatibility
  quantity: number;
  totalAmount?: number; // Calculated field

  description?: string;

  // Service-specific fields
  gameType?: string; // Untuk joki
  robuxAmount?: number; // Untuk robux services
  gamepassAmount?: number; // Untuk gamepass
  estimatedTime?: string; // Untuk joki
  additionalInfo?: string; // Info tambahan

  // Gamepass details untuk Transaction compatibility
  gamepass?: {
    id: number;
    name: string;
    price: number;
    productId: number;
    sellerId: number;
  };

  // Joki details untuk Transaction compatibility
  jokiDetails?: {
    description?: string;
    gameType?: string;
    targetLevel?: string;
    estimatedTime?: string;
    notes?: string;
    gameName?: string;
    itemName?: string;
    imgUrl?: string;
    additionalInfo?: string;
    syaratJoki?: string[];
    prosesJoki?: string[];
    features?: string[];
  };

  // Gamepass details untuk Transaction compatibility
  gamepassDetails?: {
    gameName?: string;
    itemName?: string;
    imgUrl?: string;
    developer?: string;
    features?: string[];
    caraPesan?: string[];
  };

  // Robux instant details
  robuxInstantDetails?: {
    notes?: string;
    additionalInfo?: string;
    robuxAmount?: number;
    productName?: string;
    description?: string;
  };

  // User credentials untuk service processing
  robloxUsername?: string;
  robloxPassword?: string | null;
}

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
  // Primary service identification (sesuai Transaction model)
  serviceType: {
    type: String,
    required: true,
    enum: ["robux", "gamepass", "joki"],
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
    required: true,
  },
  serviceCategory: {
    type: String,
    required: false, // Only for robux services
  },

  // Legacy fields untuk backward compatibility
  type: {
    type: String,
    required: false,
    enum: ["rbx5", "rbx-instant", "gamepass", "joki"],
  },
  gameId: {
    type: String,
    required: false,
  },
  gameName: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },

  // Pricing (sesuai Transaction model)
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  totalAmount: {
    type: Number,
    required: false,
    min: 0,
  },

  description: {
    type: String,
    required: false,
  },

  // Service-specific fields
  gameType: {
    type: String,
    required: false,
  },
  robuxAmount: {
    type: Number,
    required: false,
  },
  gamepassAmount: {
    type: Number,
    required: false,
  },
  estimatedTime: {
    type: String,
    required: false,
  },
  additionalInfo: {
    type: String,
    required: false,
  },

  // Gamepass details (sesuai Transaction model)
  gamepass: {
    id: Number,
    name: String,
    price: Number,
    productId: Number,
    sellerId: Number,
  },

  // Joki details (sesuai Transaction model)
  jokiDetails: {
    description: String,
    gameType: String,
    targetLevel: String,
    estimatedTime: String,
    notes: String,
    gameName: String,
    itemName: String,
    imgUrl: String,
    additionalInfo: String,
    syaratJoki: [String],
    prosesJoki: [String],
    features: [String],
  },

  // Gamepass details (sesuai Transaction model)
  gamepassDetails: {
    gameName: String,
    itemName: String,
    imgUrl: String,
    developer: String,
    features: [String],
    caraPesan: [String],
  },

  // Robux instant details (sesuai Transaction model)
  robuxInstantDetails: {
    notes: String,
    additionalInfo: String,
    robuxAmount: Number,
    productName: String,
    description: String,
  },

  // Robux 5 Hari details (sesuai Transaction model)
  rbx5Details: {
    robuxAmount: Number,
    packageName: String,
    selectedPlace: {
      placeId: Number,
      name: String,
      universeId: Number,
    },
    gamepassAmount: Number,
    gamepassCreated: Boolean,
    gamepass: {
      id: Number,
      name: String,
      price: Number,
      productId: Number,
      sellerId: Number,
    },
    pricePerRobux: mongoose.Schema.Types.Mixed,
    backupCode: String,
  },

  // User credentials untuk service processing
  robloxUsername: {
    type: String,
    required: false,
  },
  robloxPassword: {
    type: String,
    required: false,
  },
});

const CartSchema: Schema<ICart> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [CartItemSchema],
  },
  {
    timestamps: true,
  }
);

// Method untuk mengkonversi cart item ke format Transaction
CartSchema.methods.convertToTransactionData = function () {
  return this.items.map((item: ICartItem) => {
    // Map serviceType dari legacy type jika perlu
    let serviceType = item.serviceType;
    if (!serviceType && item.type) {
      switch (item.type) {
        case "rbx5":
        case "rbx-instant":
          serviceType = "robux";
          break;
        case "gamepass":
          serviceType = "gamepass";
          break;
        case "joki":
          serviceType = "joki";
          break;
      }
    }

    return {
      serviceType,
      serviceCategory: item.serviceCategory,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      serviceImage: item.serviceImage,
      quantity: item.quantity,
      unitPrice: item.unitPrice || item.price,
      totalAmount:
        item.totalAmount || (item.unitPrice || item.price) * item.quantity,
      gamepass: item.gamepass,
      jokiDetails: item.jokiDetails,
      robuxInstantDetails: item.robuxInstantDetails,
    };
  });
};

// Method untuk calculate total cart
CartSchema.methods.calculateTotal = function () {
  return this.items.reduce((total: number, item: ICartItem) => {
    const itemTotal =
      item.totalAmount || (item.unitPrice || item.price) * item.quantity;
    return total + itemTotal;
  }, 0);
};

const Cart = mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);

export default Cart;
