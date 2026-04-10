import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import { getPusherInstance } from '@/lib/pusher';

// Auto-deactivation timeout in minutes
const AUTO_DEACTIVATE_TIMEOUT_MINUTES = 30;

/**
 * Auto-deactivate chat rooms that have been idle for 30 minutes
 * This endpoint should be called by a cron job (e.g., Vercel Cron, external cron service)
 * 
 * Idle is defined as:
 * - Room is active
 * - User has not replied in the last 30 minutes
 * 
 * Security: Uses a secret token to prevent unauthorized access
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (set in environment variable)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // If CRON_SECRET is set, verify it
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - AUTO_DEACTIVATE_TIMEOUT_MINUTES * 60 * 1000);

    console.log(`[Auto-Deactivate] 🔍 Checking for idle chats...`);
    console.log(`[Auto-Deactivate] ⏰ Timeout threshold: ${timeoutThreshold.toISOString()}`);

    // Find active rooms where user hasn't replied in 30 minutes
    // Also include rooms that never had a lastUserReplyAt (use lastMessageAt as fallback)
    const idleRooms = await ChatRoom.find({
      status: 'active',
      $or: [
        // User replied but more than 30 minutes ago
        { lastUserReplyAt: { $lt: timeoutThreshold } },
        // User never replied and last message is more than 30 minutes old
        { 
          lastUserReplyAt: { $exists: false },
          lastMessageAt: { $lt: timeoutThreshold }
        },
        // No messages at all and created more than 30 minutes ago
        {
          lastUserReplyAt: { $exists: false },
          lastMessageAt: { $exists: false },
          createdAt: { $lt: timeoutThreshold }
        }
      ]
    }).populate('userId', 'username email fullName');

    console.log(`[Auto-Deactivate] 📋 Found ${idleRooms.length} idle room(s)`);

    if (idleRooms.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No idle rooms to deactivate',
        deactivatedCount: 0,
      });
    }

    const deactivatedRooms: string[] = [];
    const pusher = getPusherInstance();

    for (const room of idleRooms) {
      try {
        // Update room status
        await ChatRoom.findByIdAndUpdate(room._id, {
          status: 'closed',
          deactivatedAt: now,
          deactivatedBy: 'system',
        });

        deactivatedRooms.push(room._id.toString());

        console.log(`[Auto-Deactivate] ✅ Deactivated room: ${room._id} (User: ${room.userId?.fullName || room.userId?.email})`);

        // Notify via Pusher - room status change
        try {
          // Notify the specific chat room
          await pusher.trigger(`private-chat-room-${room._id}`, 'room-status-changed', {
            roomId: room._id.toString(),
            status: 'closed',
            deactivatedBy: 'system',
            deactivatedAt: now.toISOString(),
            message: 'Chat ini telah dinonaktifkan karena tidak ada aktivitas selama 30 menit.',
          });

          // Notify admin channel
          await pusher.trigger('admin-notifications', 'room-deactivated', {
            roomId: room._id.toString(),
            userId: room.userId?._id?.toString(),
            userName: room.userId?.fullName || room.userId?.email,
            deactivatedBy: 'system',
            reason: 'No user response for 30 minutes',
          });

          // Notify user channel
          if (room.userId?._id) {
            await pusher.trigger(`user-notifications-${room.userId._id}`, 'room-deactivated', {
              roomId: room._id.toString(),
              message: 'Chat Anda telah dinonaktifkan karena tidak ada aktivitas selama 30 menit. Silakan buat chat baru jika diperlukan.',
            });
          }
        } catch (pusherError) {
          console.error(`[Auto-Deactivate] ❌ Pusher error for room ${room._id}:`, pusherError);
        }
      } catch (roomError) {
        console.error(`[Auto-Deactivate] ❌ Error deactivating room ${room._id}:`, roomError);
      }
    }

    console.log(`[Auto-Deactivate] 🏁 Completed. Deactivated ${deactivatedRooms.length} room(s)`);

    return NextResponse.json({
      success: true,
      message: `Deactivated ${deactivatedRooms.length} idle chat room(s)`,
      deactivatedCount: deactivatedRooms.length,
      deactivatedRooms,
    });
  } catch (error: any) {
    console.error('[Auto-Deactivate] ❌ Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint for manual testing
export async function GET(request: NextRequest) {
  try {
    // Only allow in development mode for testing
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ 
        error: 'This endpoint is only available in development mode. Use POST with proper authentication in production.' 
      }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - AUTO_DEACTIVATE_TIMEOUT_MINUTES * 60 * 1000);

    // Find potentially idle rooms (for debugging/preview)
    const idleRooms = await ChatRoom.find({
      status: 'active',
      $or: [
        { lastUserReplyAt: { $lt: timeoutThreshold } },
        { 
          lastUserReplyAt: { $exists: false },
          lastMessageAt: { $lt: timeoutThreshold }
        },
        {
          lastUserReplyAt: { $exists: false },
          lastMessageAt: { $exists: false },
          createdAt: { $lt: timeoutThreshold }
        }
      ]
    }).populate('userId', 'username email fullName');

    return NextResponse.json({
      success: true,
      message: 'Preview of idle rooms (no action taken)',
      timeoutMinutes: AUTO_DEACTIVATE_TIMEOUT_MINUTES,
      currentTime: now.toISOString(),
      timeoutThreshold: timeoutThreshold.toISOString(),
      idleRoomsCount: idleRooms.length,
      idleRooms: idleRooms.map(room => ({
        roomId: room._id,
        userId: room.userId?._id,
        userName: room.userId?.fullName || room.userId?.email,
        roomType: room.roomType,
        lastUserReplyAt: room.lastUserReplyAt,
        lastMessageAt: room.lastMessageAt,
        createdAt: room.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('[Auto-Deactivate Preview] ❌ Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
