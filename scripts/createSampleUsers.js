// Script to create sample users in MongoDB
// Run this file with: node scripts/createSampleUsers.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// User model
const UserSchema = new mongoose.Schema(
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
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Format email tidak valid",
      ],
    },
    phone: {
      type: String,
      required: [true, "Nomor handphone diperlukan"],
      trim: true,
      match: [/^[0-9]{8,15}$/, "Format nomor handphone tidak valid"],
    },
    countryCode: {
      type: String,
      required: [true, "Kode negara diperlukan"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password diperlukan"],
      minlength: [6, "Password minimal 6 karakter"],
    },
    accessRole: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
    },
    memberRole: {
      type: String,
      default: null,
      trim: true,
      maxlength: [50, "Role member tidak boleh lebih dari 50 karakter"],
    },
    spendedMoney: {
      type: Number,
      default: 0,
      min: [0, "Jumlah uang yang dihabiskan tidak boleh negatif"],
    },
    diskon: {
      type: Number,
      default: 0,
      min: [0, "Diskon tidak boleh negatif"],
      max: [100, "Diskon tidak boleh lebih dari 100%"],
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

const User = mongoose.model("User", UserSchema);

const createSampleUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      "mongodb+srv://rafliafriza90:Y9HOoJybQtABpZUk@rafli.6lc8d.mongodb.net/robuxid?retryWrites=true&w=majority&appName=Rafli"
    );
    console.log("Connected to MongoDB");

    // Hash password
    const hashedPassword = await bcrypt.hash("password123", 10);

    // Sample users
    const sampleUsers = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "81234567890",
        countryCode: "+62",
        password: hashedPassword,
        accessRole: "user",
        memberRole: "premium",
        spendedMoney: 1500000,
        diskon: 5,
        isVerified: true,
      },
      {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane.smith@example.com",
        phone: "81987654321",
        countryCode: "+62",
        password: hashedPassword,
        accessRole: "user",
        memberRole: "regular",
        spendedMoney: 750000,
        diskon: 2,
        isVerified: true,
      },
      {
        firstName: "Admin",
        lastName: "User",
        email: "admin@rbx.com",
        phone: "81111111111",
        countryCode: "+62",
        password: hashedPassword,
        accessRole: "admin",
        memberRole: "admin",
        spendedMoney: 0,
        diskon: 10,
        isVerified: true,
      },
    ];

    // Delete existing users
    await User.deleteMany({});
    console.log("Cleared existing users");

    // Insert sample users
    const users = await User.insertMany(sampleUsers);
    console.log("Sample users created:", users.length);

    console.log("Users created:");
    users.forEach((user) => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email})`);
    });
  } catch (error) {
    console.error("Error creating sample users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

createSampleUsers();
