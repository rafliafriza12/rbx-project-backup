import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';

// GET - Get user's chat room (or null if doesn't exist)
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find chat room for this user
    const chatRoom = await ChatRoom.findOne({ userId: user._id })
      .populate('userId', 'firstName lastName email profilePicture')
      .populate('adminId', 'firstName lastName email profilePicture')
      .sort({ updatedAt: -1 });

    if (!chatRoom) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No chat room found'
      });
    }

    return NextResponse.json({
      success: true,
      data: chatRoom
    });

  } catch (error: any) {
    console.error('Error fetching user chat room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
