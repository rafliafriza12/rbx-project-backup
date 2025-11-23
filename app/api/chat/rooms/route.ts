// GET all users (customers) for admin to chat with
// POST create new chat room
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';
import { authenticateToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('[GET /rooms] 📋 Fetching chat rooms list...');
    
    const user = await authenticateToken(request);
    
    if (!user || (user.accessRole !== 'admin' && user.accessRole !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = (page - 1) * limit;

    // Build query to get all USERS (not admin)
    const userQuery: any = {
      accessRole: { $nin: ['admin', 'superadmin'] } // Exclude admins
    };

    // Add search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      userQuery.$or = [
        { username: { $regex: searchLower, $options: 'i' } },
        { email: { $regex: searchLower, $options: 'i' } },
        { firstName: { $regex: searchLower, $options: 'i' } },
        { lastName: { $regex: searchLower, $options: 'i' } },
      ];
    }

    // Get all users
    const users = await User.find(userQuery)
      .select('_id username email firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get existing chat rooms for these users
    const userIds = users.map((u: any) => u._id);
    const existingRooms = await ChatRoom.find({
      userId: { $in: userIds }
    }).lean();

    // Create a map of userId -> chatRoom
    const roomMap = new Map();
    existingRooms.forEach((room: any) => {
      roomMap.set(room.userId.toString(), room);
    });

    // Combine users with their chat room data
    const usersWithChatData = users.map((u: any) => {
      const room = roomMap.get(u._id.toString());
      
      return {
        _id: room?._id || null, // Chat room ID (null if no room yet)
        userId: {
          _id: u._id,
          username: u.username,
          email: u.email,
          fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
          avatar: u.profilePicture,
        },
        lastMessage: room?.lastMessage || null,
        lastMessageAt: room?.lastMessageAt || null,
        unreadCountAdmin: room?.unreadCountAdmin || 0,
        unreadCountUser: room?.unreadCountUser || 0,
        status: room?.status || 'active',
        createdAt: room?.createdAt || u.createdAt,
        hasRoom: !!room, // Flag to indicate if room exists
      };
    });

    // Sort by: unread messages first, then last message time, then creation time
    usersWithChatData.sort((a, b) => {
      // Priority 1: Unread messages
      if (a.unreadCountAdmin !== b.unreadCountAdmin) {
        return b.unreadCountAdmin - a.unreadCountAdmin;
      }
      
      // Priority 2: Last message time
      if (a.lastMessageAt && b.lastMessageAt) {
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      }
      if (a.lastMessageAt) return -1;
      if (b.lastMessageAt) return 1;
      
      // Priority 3: User creation time (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = await User.countDocuments(userQuery);

    console.log(`[GET /rooms] ✅ Returned ${usersWithChatData.length} users`);
    console.log(`[GET /rooms] ================================================`);

    return NextResponse.json({
      success: true,
      data: usersWithChatData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[GET /rooms] ❌ Error fetching users for chat:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create or get existing chat room
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateToken(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { userId } = await request.json();
    
    // Determine target user ID
    const isAdmin = user.accessRole === 'admin' || user.accessRole === 'superadmin';
    const targetUserId = isAdmin ? userId : user._id;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if chat room already exists
    let chatRoom = await ChatRoom.findOne({ userId: targetUserId });

    if (!chatRoom) {
      // Create new chat room
      chatRoom = await ChatRoom.create({
        userId: targetUserId,
        adminId: isAdmin ? user._id : null,
        status: 'active',
      });
    } else if (isAdmin && !chatRoom.adminId) {
      // Update adminId if admin opens the chat for the first time
      chatRoom.adminId = user._id;
      await chatRoom.save();
    }

    // Populate user data
    await chatRoom.populate('userId', 'username email firstName lastName profilePicture');
    await chatRoom.populate('adminId', 'username firstName lastName');

    // Format response to match frontend interface
    const response = {
      _id: chatRoom._id,
      userId: {
        _id: chatRoom.userId._id,
        username: chatRoom.userId.username,
        email: chatRoom.userId.email,
        fullName: `${chatRoom.userId.firstName || ''} ${chatRoom.userId.lastName || ''}`.trim() || chatRoom.userId.username,
        avatar: chatRoom.userId.profilePicture,
      },
      adminId: chatRoom.adminId ? {
        _id: chatRoom.adminId._id,
        username: chatRoom.adminId.username,
        fullName: `${chatRoom.adminId.firstName || ''} ${chatRoom.adminId.lastName || ''}`.trim(),
      } : null,
      lastMessage: chatRoom.lastMessage,
      lastMessageAt: chatRoom.lastMessageAt,
      unreadCountAdmin: chatRoom.unreadCountAdmin,
      unreadCountUser: chatRoom.unreadCountUser,
      status: chatRoom.status,
      createdAt: chatRoom.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
