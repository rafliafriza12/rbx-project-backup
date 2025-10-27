import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  googleId?: string;
  profilePicture?: string;
  accessRole: "user" | "admin";
  resellerTier?: number;
  resellerExpiry?: Date;
  resellerPackageId?: mongoose.Types.ObjectId;
  spendedMoney: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "Nama lengkap diperlukan"],
      trim: true,
      maxlength: [50, "Nama lengkap tidak boleh lebih dari 50 karakter"],
    },
    lastName: {
      type: String,
      required: [true, "Nama pengguna diperlukan"],
      trim: true,
      maxlength: [50, "Nama pengguna tidak boleh lebih dari 50 karakter"],
    },
    email: {
      type: String,
      required: [true, "Email diperlukan"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Format email tidak valid",
      ],
    },
    phone: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (this: IUser, value: string): boolean {
          // Only require phone if not a Google OAuth user
          if (this.googleId) return true;
          // For regular users, check presence and format
          if (!value || value.length === 0) return false;
          return /^[0-9]{8,15}$/.test(value);
        },
        message: function (this: IUser) {
          if (!this.googleId) {
            if (!this.phone || this.phone.length === 0) {
              return "Nomor handphone diperlukan";
            }
            if (!/^[0-9]{8,15}$/.test(this.phone)) {
              return "Format nomor handphone tidak valid";
            }
          }
          return "Nomor handphone diperlukan";
        },
      },
    },
    countryCode: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: function (this: IUser, value: string): boolean {
          // Only require countryCode if not a Google OAuth user
          if (this.googleId) return true;
          return Boolean(value && value.length > 0);
        },
        message: "Kode negara diperlukan",
      },
    },
    password: {
      type: String,
      default: "",
      validate: {
        validator: function (this: IUser, value: string): boolean {
          // Only require password if not a Google OAuth user
          if (this.googleId) return true;
          // For regular users, check both presence and minimum length
          return Boolean(value && value.length >= 6);
        },
        message: function (this: IUser) {
          if (!this.googleId) {
            if (!this.password || this.password.length === 0) {
              return "Password diperlukan";
            }
            if (this.password.length < 6) {
              return "Password minimal 6 karakter";
            }
          }
          return "Password diperlukan";
        },
      },
    },
    googleId: {
      type: String,
      trim: true,
      index: { unique: true, sparse: true }, // Single index definition
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    accessRole: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    resellerTier: {
      type: Number,
      min: [1, "Tier reseller harus antara 1-3"],
      max: [3, "Tier reseller harus antara 1-3"],
      default: null,
    },
    resellerExpiry: {
      type: Date,
      default: null,
    },
    resellerPackageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ResellerPackage",
    },
    spendedMoney: {
      type: Number,
      default: 0,
      min: [0, "Jumlah uang yang dihabiskan tidak boleh negatif"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Custom validation for Google OAuth users
UserSchema.pre("validate", function (next) {
  // For Google OAuth users, ensure required fields have default values
  if (this.googleId) {
    // Set defaults for optional fields in Google OAuth
    if (!this.phone) {
      this.phone = "";
    }
    if (!this.countryCode) {
      this.countryCode = "";
    }
    if (!this.password) {
      this.password = "";
    }
  }
  next();
});

// Index for better query performance
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ phone: 1, countryCode: 1 });

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
