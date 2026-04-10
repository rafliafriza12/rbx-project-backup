import mongoose, { Schema, Document } from "mongoose";

export interface IRobloxCache extends Document {
  username: string;
  userId: number;
  displayName: string;
  avatarUrl: string;
  updatedAt: Date;
}

const RobloxCacheSchema = new Schema<IRobloxCache>({
  username: { type: String, required: true, unique: true, index: true },
  userId: { type: Number, required: true },
  displayName: { type: String, required: true },
  avatarUrl: { type: String, required: false },
  updatedAt: { type: Date, default: Date.now, expires: 600 },
  // 🔹 expires: 600 artinya TTL 600 detik (10 menit)
});

export default mongoose.models.RobloxCache ||
  mongoose.model<IRobloxCache>("RobloxCache", RobloxCacheSchema);
