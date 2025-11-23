import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  userId: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCountAdmin: number; // Unread messages for admin
  unreadCountUser: number;  // Unread messages for user
  status: 'active' | 'closed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const ChatRoomSchema = new Schema<IChatRoom>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      // Removed: index: true (will use schema.index() instead)
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    unreadCountAdmin: {
      type: Number,
      default: 0,
    },
    unreadCountUser: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Index for faster queries
ChatRoomSchema.index({ userId: 1 });
ChatRoomSchema.index({ status: 1, lastMessageAt: -1 });

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
