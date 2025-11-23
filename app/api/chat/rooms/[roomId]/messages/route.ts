import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose'; // ✅ Import mongoose for ObjectId conversion
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import Message from '@/models/Message';
import User from '@/models/User'; // ✅ Import User model explicitly
import { authenticateToken } from '@/lib/auth';
import { getPusherInstance } from '@/lib/pusher';

// Simple in-memory rate limiter (for production, use Redis)
const messageRateLimiter = new Map<string, { count: number; resetAt: number }>();
const MAX_MESSAGES_PER_MINUTE = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Idempotency cache to prevent duplicate messages
const idempotencyCache = new Map<string, { messageId: string; expiresAt: number }>();
const IDEMPOTENCY_WINDOW = 5000; // 5 seconds

// Global request counter for debugging
let postRequestCount = 0;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = messageRateLimiter.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    messageRateLimiter.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= MAX_MESSAGES_PER_MINUTE) {
    return false;
  }

  userLimit.count++;
  return true;
}

function checkIdempotency(key: string): string | null {
  const now = Date.now();
  const cached = idempotencyCache.get(key);
  
  if (cached && now < cached.expiresAt) {
    return cached.messageId; // Return existing message ID
  }
  
  // Clean up expired entries
  for (const [k, v] of idempotencyCache.entries()) {
    if (now >= v.expiresAt) {
      idempotencyCache.delete(k);
    }
  }
  
  return null;
}

function setIdempotency(key: string, messageId: string): void {
  idempotencyCache.set(key, {
    messageId,
    expiresAt: Date.now() + IDEMPOTENCY_WINDOW,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await authenticateToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { roomId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Verify chat room exists and user has access
    const chatRoom = await ChatRoom.findById(roomId);
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check access rights
    const isAdmin = user.accessRole === 'admin' || user.accessRole === 'superadmin';
    const isOwner = chatRoom.userId.toString() === user._id.toString();

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages using aggregation for reliable population
    const messages = await Message.aggregate([
      { $match: { roomId: new mongoose.Types.ObjectId(roomId) } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'senderData'
        }
      },
      {
        $unwind: {
          path: '$senderData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          roomId: 1,
          senderRole: 1,
          message: 1,
          type: 1,
          fileUrl: 1,
          fileName: 1,
          isRead: 1,
          readAt: 1,
          createdAt: 1,
          updatedAt: 1,
          senderId: {
            _id: '$senderData._id',
            username: { 
              $cond: {
                if: { $ne: ['$senderData.email', null] },
                then: { $arrayElemAt: [{ $split: ['$senderData.email', '@'] }, 0] },
                else: '$senderData.firstName'
              }
            },
            fullName: { 
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$senderData.firstName', ''] },
                    ' ',
                    { $ifNull: ['$senderData.lastName', ''] }
                  ]
                }
              }
            },
            avatar: '$senderData.profilePicture'
          }
        }
      }
    ]);

    // Reverse to show oldest first
    messages.reverse();

    const total = await Message.countDocuments({ roomId });

    // Mark messages as read
    if (isAdmin) {
      await Message.updateMany(
        { roomId, senderRole: 'user', isRead: false },
        { isRead: true, readAt: new Date() }
      );
      await ChatRoom.findByIdAndUpdate(roomId, { unreadCountAdmin: 0 });
    } else {
      await Message.updateMany(
        { roomId, senderRole: 'admin', isRead: false },
        { isRead: true, readAt: new Date() }
      );
      await ChatRoom.findByIdAndUpdate(roomId, { unreadCountUser: 0 });
    }

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    postRequestCount++;
    console.log('');
    console.log('========================================================');
    console.log(`[POST /messages] 🔵 REQUEST #${postRequestCount} - New message request`);
    console.log('========================================================');
    
    const user = await authenticateToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[POST /messages] � User: ${user._id}`);

    // Rate limiting check
    if (!checkRateLimit(user._id.toString())) {
      console.log(`[POST /messages] ⚠️ Rate limit exceeded for user ${user._id}`);
      return NextResponse.json(
        { error: 'Too many messages. Please wait a moment.' },
        { status: 429 }
      );
    }

    await connectDB();

    const { roomId } = await params;
    const { message, type = 'text', fileUrl, fileName } = await request.json();

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check for duplicate message using idempotency key
    const idempotencyKey = `${user._id}-${roomId}-${message.trim().substring(0, 50)}`;
    const existingMessageId = checkIdempotency(idempotencyKey);
    
    if (existingMessageId) {
      // Return existing message instead of creating duplicate
      const existingMessage = await Message.findById(existingMessageId)
        .populate('senderId', 'username fullName avatar');
      
      if (existingMessage) {
        console.log(`[POST /messages] 🔁 DUPLICATE DETECTED! Returning existing message: ${existingMessageId}`);
        console.log(`[POST /messages] 📊 Pusher events triggered: 0 (duplicate prevented)`);
        return NextResponse.json({
          success: true,
          data: existingMessage,
          duplicate: true,
        });
      }
    }

    // Verify chat room exists
    const chatRoom = await ChatRoom.findById(roomId);
    
    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Check access rights
    const isAdmin = user.accessRole === 'admin' || user.accessRole === 'superadmin';
    const isOwner = chatRoom.userId.toString() === user._id.toString();

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Determine sender role
    const senderRole = isAdmin ? 'admin' : 'user';

    // Create message
    const newMessage = await Message.create({
      roomId,
      senderId: user._id,
      senderRole,
      message: message.trim(),
      type,
      fileUrl,
      fileName,
      isRead: false,
    });

    console.log(`[POST /messages] ✅ Message created in DB: ${newMessage._id}`);

    // Populate senderId using aggregation (more reliable than .populate())
    const populatedMessages = await Message.aggregate([
      { $match: { _id: newMessage._id } },
      {
        $lookup: {
          from: 'users', // MongoDB collection name (lowercase + plural)
          localField: 'senderId',
          foreignField: '_id',
          as: 'senderData'
        }
      },
      {
        $unwind: {
          path: '$senderData',
          preserveNullAndEmptyArrays: false
        }
      },
      {
        $project: {
          _id: 1,
          roomId: 1,
          senderRole: 1,
          message: 1,
          type: 1,
          fileUrl: 1,
          fileName: 1,
          isRead: 1,
          readAt: 1,
          createdAt: 1,
          updatedAt: 1,
          senderId: {
            _id: '$senderData._id',
            username: { 
              $cond: {
                if: { $ne: ['$senderData.email', null] },
                then: { $arrayElemAt: [{ $split: ['$senderData.email', '@'] }, 0] },
                else: '$senderData.firstName'
              }
            }, // Extract username from email (before @)
            fullName: { 
              $trim: {
                input: {
                  $concat: [
                    { $ifNull: ['$senderData.firstName', ''] },
                    ' ',
                    { $ifNull: ['$senderData.lastName', ''] }
                  ]
                }
              }
            },
            avatar: '$senderData.profilePicture'
          }
        }
      }
    ]);
    
    const populatedMessage = populatedMessages[0];
    
    if (!populatedMessage) {
      throw new Error('Failed to fetch created message');
    }
    
    console.log(`[POST /messages] 👤 Message populated successfully`);
    console.log(`[POST /messages] 🔍 Sender data:`, {
      hasUsername: !!populatedMessage.senderId?.username,
      username: populatedMessage.senderId?.username,
      fullName: populatedMessage.senderId?.fullName,
      hasAvatar: !!populatedMessage.senderId?.avatar,
    });

    // Update chat room
    const updateData: any = {
      lastMessage: message.trim(),
      lastMessageAt: new Date(),
    };

    // Increment unread count for receiver
    if (senderRole === 'admin') {
      updateData.$inc = { unreadCountUser: 1 };
      if (!chatRoom.adminId) {
        updateData.adminId = user._id;
      }
    } else {
      updateData.$inc = { unreadCountAdmin: 1 };
    }

    await ChatRoom.findByIdAndUpdate(roomId, updateData);
    console.log(`[POST /messages] 📝 ChatRoom updated`);

    // Store idempotency key BEFORE Pusher
    setIdempotency(idempotencyKey, newMessage._id.toString());
    console.log(`[POST /messages] 🔐 Idempotency key stored for 5 seconds`);

    // Send real-time update via Pusher - ONLY ONCE
    // Using PRIVATE CHANNEL for security (requires authentication)
    let pusherEventCount = 0;
    try {
      const pusher = getPusherInstance();
      
      console.log(`[POST /messages] 🚀 Triggering Pusher event...`);
      console.log(`[POST /messages] 🔐 Channel: private-chat-room-${roomId} (PRIVATE CHANNEL)`);
      console.log(`[POST /messages] 📡 Event: new-message`);
      console.log(`[POST /messages] 📦 Pusher payload:`, {
        message: {
          _id: populatedMessage._id,
          username: populatedMessage.senderId?.username || 'NO_USERNAME',
          fullName: populatedMessage.senderId?.fullName || 'NO_NAME',
          message: message.trim().substring(0, 50),
        }
      });
      
      // Single event with all data needed - PRIVATE CHANNEL
      // Use populatedMessage (not newMessage!) for real-time updates
      await pusher.trigger(`private-chat-room-${roomId}`, 'new-message', {
        message: populatedMessage, // ✅ Use populated message!
        roomUpdate: {
          roomId,
          lastMessage: message.trim(),
          lastMessageAt: new Date(),
          unreadCount: senderRole === 'admin' ? 
            (chatRoom.unreadCountUser || 0) + 1 : 
            (chatRoom.unreadCountAdmin || 0) + 1,
        },
      });

      pusherEventCount = 1;
      console.log(`[POST /messages] ✅ Pusher event sent successfully to private channel`);
      console.log(`[POST /messages] 📊 TOTAL PUSHER EVENTS TRIGGERED: ${pusherEventCount}`);
      console.log(`[POST /messages] ================================================`);
    } catch (pusherError) {
      console.error(`[POST /messages] ❌ Pusher error:`, pusherError);
      console.log(`[POST /messages] 📊 TOTAL PUSHER EVENTS TRIGGERED: ${pusherEventCount} (failed)`);
      // Continue even if Pusher fails - message already saved
    }

    return NextResponse.json({
      success: true,
      data: populatedMessage, // Return populated message to frontend
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
