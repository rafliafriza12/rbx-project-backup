// Update chat room status
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import Message from '@/models/Message';
import { authenticateToken } from '@/lib/auth';
import { getPusherInstance } from '@/lib/pusher';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const user = await authenticateToken(request);
    
    if (!user || (user.accessRole !== 'admin' && user.accessRole !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { roomId } = await params;
    const { status } = await request.json();

    if (!['active', 'closed', 'archived'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Build update data
    const updateData: any = { status };
    
    // Track deactivation info
    if (status === 'closed') {
      updateData.deactivatedAt = new Date();
      updateData.deactivatedBy = 'admin';
      updateData.lastMessage = null;
      updateData.lastMessageAt = null;
      updateData.unreadCountAdmin = 0;
      updateData.unreadCountUser = 0;
      
      // Delete all messages for this room when deactivating
      const deleteResult = await Message.deleteMany({ roomId });
      console.log(`[Room Deactivation] 🗑️ Deleted ${deleteResult.deletedCount} messages from room ${roomId}`);
    } else if (status === 'active') {
      // Reactivating - clear deactivation info
      updateData.deactivatedAt = null;
      updateData.deactivatedBy = null;
    }

    const chatRoom = await ChatRoom.findByIdAndUpdate(
      roomId,
      updateData,
      { new: true }
    ).populate('userId', 'username email fullName avatar');

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Send Pusher notification for status change
    try {
      const pusher = getPusherInstance();
      
      // Notify the specific chat room channel
      await pusher.trigger(`private-chat-room-${roomId}`, 'room-status-changed', {
        roomId,
        status,
        deactivatedBy: status === 'closed' ? 'admin' : null,
        deactivatedAt: status === 'closed' ? new Date().toISOString() : null,
        messagesCleared: status === 'closed', // Indicate messages were deleted
        message: status === 'closed' 
          ? 'Chat ini telah dinonaktifkan oleh admin. Semua pesan telah dihapus.'
          : 'Chat ini telah diaktifkan kembali oleh admin.',
      });

      // Notify admin channel (without message to avoid duplicate)
      await pusher.trigger('admin-notifications', 'room-status-changed', {
        roomId,
        userId: chatRoom.userId?._id?.toString(),
        userName: chatRoom.userId?.fullName || chatRoom.userId?.email,
        status,
        messagesCleared: status === 'closed',
        changedBy: user._id.toString(),
      });

      // Notify user channel (without message to avoid duplicate - message already sent via private room channel)
      if (chatRoom.userId?._id) {
        await pusher.trigger(`user-notifications-${chatRoom.userId._id}`, 'room-status-changed', {
          roomId,
          status,
          messagesCleared: status === 'closed',
        });
      }

      console.log(`[Room Status] ✅ Status changed to '${status}' for room ${roomId}${status === 'closed' ? ' (messages cleared)' : ''}`);
    } catch (pusherError) {
      console.error('[Room Status] ❌ Pusher error:', pusherError);
      // Continue even if Pusher fails
    }

    return NextResponse.json({
      success: true,
      data: chatRoom,
    });
  } catch (error: any) {
    console.error('Error updating chat room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
