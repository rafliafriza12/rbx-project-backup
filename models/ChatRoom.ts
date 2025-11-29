import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  userId: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  roomType: 'general' | 'order'; // Type of chat room
  transactionCode?: string; // Order ID for order support
  transactionTitle?: string; // Product name for order support
  lastMessage?: string;
  lastMessageAt?: Date;
  lastUserReplyAt?: Date; // Last time user replied - for auto-deactivation
  unreadCountAdmin: number; // Unread messages for admin
  unreadCountUser: number;  // Unread messages for user
  status: 'active' | 'closed' | 'archived';
  deactivatedAt?: Date; // When chat was deactivated
  deactivatedBy?: 'admin' | 'system'; // Who deactivated the chat
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
    roomType: {
      type: String,
      enum: ['general', 'order'],
      default: 'general',
      required: true,
    },
    transactionCode: {
      type: String,
      sparse: true, // Allow null but enforce uniqueness when present
    },
    transactionTitle: {
      type: String,
    },
    lastMessage: {
      type: String,
    },
    lastMessageAt: {
      type: Date,
    },
    lastUserReplyAt: {
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
    deactivatedAt: {
      type: Date,
    },
    deactivatedBy: {
      type: String,
      enum: ['admin', 'system'],
    },
  },
  { timestamps: true }
);

// Index for faster queries
ChatRoomSchema.index({ userId: 1 });
ChatRoomSchema.index({ status: 1, lastMessageAt: -1 });
ChatRoomSchema.index({ transactionCode: 1 }, { sparse: true });

export default mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
