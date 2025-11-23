import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import { getPusherInstance } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    console.log('[Pusher Auth] 🔐 Channel subscription authentication request');
    
    // Parse Pusher authentication request (form-urlencoded)
    const body = await request.text();
    const params = new URLSearchParams(body);
    const socket_id = params.get('socket_id');
    const channel_name = params.get('channel_name');

    if (!socket_id || !channel_name) {
      console.log('[Pusher Auth] ❌ Missing socket_id or channel_name');
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    console.log('[Pusher Auth] 📡 Channel:', channel_name);
    console.log('[Pusher Auth] 🔌 Socket ID:', socket_id);

    // Authenticate user via HTTP-only cookie (token is set by /api/auth/login)
    // The authenticateToken function automatically reads the 'token' cookie from request
    const user = await authenticateToken(request);
    
    if (!user) {
      console.log('[Pusher Auth] ❌ No valid authentication - user not logged in');
      return NextResponse.json({ error: 'Unauthorized - Please login first' }, { status: 401 });
    }

    console.log('[Pusher Auth] 👤 User authenticated:', user.email || user._id);

    // Validate channel format: private-chat-room-{roomId}
    const channelMatch = channel_name.match(/^private-chat-room-(.+)$/);
    if (!channelMatch) {
      console.log('[Pusher Auth] ❌ Invalid channel format (must be private-chat-room-{roomId})');
      return NextResponse.json({ error: 'Invalid channel format' }, { status: 400 });
    }

    const roomId = channelMatch[1];
    console.log('[Pusher Auth] 🏠 Room ID:', roomId);

    // Check if user has access to this chat room
    await connectDB();
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      console.log('[Pusher Auth] ❌ Chat room not found');
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 });
    }

    // Validate access: User must be either the room owner OR an admin
    const isAdmin = user.accessRole === 'admin' || user.accessRole === 'superadmin';
    const isOwner = chatRoom.userId.toString() === user._id.toString();

    if (!isAdmin && !isOwner) {
      console.log('[Pusher Auth] ❌ Access denied - User is not room owner or admin');
      console.log('[Pusher Auth] - User ID:', user._id.toString());
      console.log('[Pusher Auth] - Room owner:', chatRoom.userId.toString());
      console.log('[Pusher Auth] - Is admin:', isAdmin);
      return NextResponse.json({ error: 'Access denied to this chat room' }, { status: 403 });
    }

    // Authorize the channel subscription
    const pusher = getPusherInstance();
    const authResponse = pusher.authorizeChannel(socket_id, channel_name);

    console.log('[Pusher Auth] ✅ Subscription authorized');
    console.log('[Pusher Auth] - Access type:', isAdmin ? 'Admin' : 'Room Owner');
    console.log('[Pusher Auth] ================================================');

    return NextResponse.json(authResponse);

  } catch (error: any) {
    console.error('[Pusher Auth] ❌ Error during authentication:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
