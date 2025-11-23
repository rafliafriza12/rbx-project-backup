// Update chat room status
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import { authenticateToken } from '@/lib/auth';

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

    const chatRoom = await ChatRoom.findByIdAndUpdate(
      roomId,
      { status },
      { new: true }
    ).populate('userId', 'username email fullName avatar');

    if (!chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
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
