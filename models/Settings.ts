import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    // General Settings
    siteName: {
      type: String,
      default: "RBX Store",
      required: true,
    },
    siteDescription: {
      type: String,
      default: "Platform jual beli Robux, Gamepass, dan Jasa Joki terpercaya",
    },
    contactEmail: {
      type: String,
      default: "contact@rbxstore.com",
    },
    contactPhone: {
      type: String,
      default: "+62812345678",
    },
    whatsappNumber: {
      type: String,
      default: "+628123456789",
    },
    discordInvite: {
      type: String,
      default: "https://discord.gg/rbxstore",
    },

    // Business Settings
    businessHours: {
      type: String,
      default: "24/7",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "Situs sedang dalam pemeliharaan. Silakan coba lagi nanti.",
    },

    // Robux Settings
    robuxRate: {
      type: Number,
      default: 14000, // IDR per 100 Robux
      required: true,
    },
    minRobuxOrder: {
      type: Number,
      default: 100,
    },
    maxRobuxOrder: {
      type: Number,
      default: 10000,
    },

    // Payment Gateway Settings
    midtransServerKey: {
      type: String,
      default: "",
    },
    midtransClientKey: {
      type: String,
      default: "",
    },
    midtransMode: {
      type: String,
      enum: ["sandbox", "production"],
      default: "sandbox",
    },

    // API External Settings
    robuxApiKey: {
      type: String,
      default: "",
    },
    robuxApiUrl: {
      type: String,
      default: "",
    },
    gamepassApiKey: {
      type: String,
      default: "",
    },
    gamepassApiUrl: {
      type: String,
      default: "",
    },
    discordWebhookUrl: {
      type: String,
      default: "",
    },
    telegramBotToken: {
      type: String,
      default: "",
    },
    telegramChatId: {
      type: String,
      default: "",
    },

    // Security Settings
    enableRegistration: {
      type: Boolean,
      default: true,
    },
    requireEmailVerification: {
      type: Boolean,
      default: true,
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
    },
    sessionTimeout: {
      type: Number,
      default: 24, // hours
    },

    // Notification Settings
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    smsNotifications: {
      type: Boolean,
      default: false,
    },
    webhookUrl: {
      type: String,
      default: "",
    },

    // Email Configuration
    emailProvider: {
      type: String,
      enum: ["smtp", "gmail", "outlook"],
      default: "smtp",
    },
    emailHost: {
      type: String,
      default: "smtp.gmail.com",
    },
    emailPort: {
      type: Number,
      default: 587,
    },
    emailUser: {
      type: String,
      default: "",
    },
    emailPassword: {
      type: String,
      default: "",
    },
    emailFromName: {
      type: String,
      default: "RBX Store",
    },
    emailFromAddress: {
      type: String,
      default: "noreply@rbxstore.com",
    },
    emailSecure: {
      type: Boolean,
      default: false, // false for 587, true for 465
    },

    // SEO Settings
    metaTitle: {
      type: String,
      default: "RBX Store - Jual Beli Robux Termurah",
    },
    metaDescription: {
      type: String,
      default:
        "Platform terpercaya untuk jual beli Robux, Gamepass, dan jasa joki game. Harga murah, proses cepat, dan aman.",
    },
    metaKeywords: {
      type: String,
      default: "robux, gamepass, joki, roblox, game, murah",
    },

    // Social Media
    facebookUrl: {
      type: String,
      default: "",
    },
    instagramUrl: {
      type: String,
      default: "",
    },
    twitterUrl: {
      type: String,
      default: "",
    },
    youtubeUrl: {
      type: String,
      default: "",
    },

    // Analytics
    googleAnalyticsId: {
      type: String,
      default: "",
    },
    facebookPixelId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
settingsSchema.statics.getSiteSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Define interface for Settings model with statics
interface ISettingsModel extends mongoose.Model<any> {
  getSiteSettings(): Promise<any>;
}

const Settings = (mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema)) as ISettingsModel;

export default Settings;
