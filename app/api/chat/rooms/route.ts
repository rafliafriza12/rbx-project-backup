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
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const isAdmin = user.accessRole === 'admin' || user.accessRole === 'superadmin';

    if (isAdmin) {
      // ADMIN VIEW: Get all users for admin to chat with
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

      // Create a map of userId -> array of rooms
      const roomsByUser = new Map<string, any[]>();
      existingRooms.forEach((room: any) => {
        const userId = room.userId.toString();
        if (!roomsByUser.has(userId)) {
          roomsByUser.set(userId, []);
        }
        roomsByUser.get(userId)!.push(room);
      });

      // NO AUTO-CREATE: Chat rooms are only created when admin/user explicitly creates them
      // This minimizes Pusher connections and network idle

      // Combine users with their chat room data
      // Users WITHOUT rooms will also be included with hasRoom: false
      const usersWithChatData: any[] = [];
      
      for (const u of users) {
        const userObj = u as any;
        const userRooms = roomsByUser.get(userObj._id.toString()) || [];
        
        if (userRooms.length > 0) {
          // User has rooms - add each room
          userRooms.forEach((room: any) => {
            usersWithChatData.push({
              _id: room._id,
              userId: {
                _id: userObj._id,
                username: userObj.username,
                email: userObj.email,
                fullName: `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || userObj.username,
                avatar: userObj.profilePicture,
              },
              roomType: room.roomType || 'general',
              transactionCode: room.transactionCode || null,
              transactionTitle: room.transactionTitle || null,
              lastMessage: room.lastMessage || null,
              lastMessageAt: room.lastMessageAt || null,
              unreadCountAdmin: room.unreadCountAdmin || 0,
              unreadCountUser: room.unreadCountUser || 0,
              status: room.status || 'closed',
              createdAt: room.createdAt || userObj.createdAt,
              hasRoom: true,
            });
          });
        } else {
          // User has NO rooms - add user entry without room
          usersWithChatData.push({
            _id: null, // No room ID
            userId: {
              _id: userObj._id,
              username: userObj.username,
              email: userObj.email,
              fullName: `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || userObj.username,
              avatar: userObj.profilePicture,
            },
            roomType: null,
            transactionCode: null,
            transactionTitle: null,
            lastMessage: null,
            lastMessageAt: null,
            unreadCountAdmin: 0,
            unreadCountUser: 0,
            status: null,
            createdAt: userObj.createdAt,
            hasRoom: false,
          });
        }
      }

      // Sort by: 
      // 1. Users with rooms first (hasRoom: true)
      // 2. Unread messages first
      // 3. Last message time
      // 4. Creation time
      usersWithChatData.sort((a, b) => {
        // Users with rooms come first
        if (a.hasRoom !== b.hasRoom) {
          return a.hasRoom ? -1 : 1;
        }
        // Then sort by unread count
        if (a.unreadCountAdmin !== b.unreadCountAdmin) {
          return b.unreadCountAdmin - a.unreadCountAdmin;
        }
        // Then by last message time
        if (a.lastMessageAt && b.lastMessageAt) {
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        }
        if (a.lastMessageAt) return -1;
        if (b.lastMessageAt) return 1;
        // Finally by creation time
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      const total = await User.countDocuments(userQuery);

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
    } else {
      // USER VIEW: Get all chat rooms for this user
      const chatRooms = await ChatRoom.find({ 
        userId: user._id,
        status: { $ne: 'archived' }
      })
        .populate('userId', 'username email firstName lastName profilePicture')
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .lean();

      const formattedRooms = chatRooms.map((room: any) => ({
        _id: room._id,
        userId: {
          _id: room.userId._id,
          username: room.userId.username,
          email: room.userId.email,
          fullName: `${room.userId.firstName || ''} ${room.userId.lastName || ''}`.trim() || room.userId.username,
          avatar: room.userId.profilePicture,
        },
        roomType: room.roomType || 'general',
        transactionCode: room.transactionCode || null,
        transactionTitle: room.transactionTitle || null,
        lastMessage: room.lastMessage || null,
        lastMessageAt: room.lastMessageAt || null,
        unreadCountUser: room.unreadCountUser || 0,
        status: room.status,
        createdAt: room.createdAt,
      }));

      console.log(`[GET /rooms] ✅ User: Returned ${formattedRooms.length} rooms`);

      return NextResponse.json({
        success: true,
        data: formattedRooms,
      });
    }
  } catch (error: any) {
    console.error('[GET /rooms] ❌ Error fetching chat rooms:', error);
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

    const body = await request.json();
    const { userId, roomType, transactionCode, transactionTitle } = body;
    
    // Determine target user ID and admin ID
    const isAdmin = user.accessRole === 'admin' || user.accessRole === 'superadmin';
    const targetUserId = isAdmin ? userId : user._id;

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Find an admin to assign to this chat room
    // Priority: current user if admin, otherwise find any admin
    let adminId;
    if (isAdmin) {
      adminId = user._id;
    } else {
      // Find any available admin (prefer 'admin' role over 'superadmin')
      const admin = await User.findOne({ 
        accessRole: { $in: ['admin', 'superadmin'] } 
      }).sort({ accessRole: 1 }); // 'admin' comes before 'superadmin' alphabetically
      
      if (!admin) {
        return NextResponse.json({ 
          error: 'No admin available. Please contact support.' 
        }, { status: 503 });
      }
      
      adminId = admin._id;
    }

    console.log('[POST /rooms] 👤 Target User:', targetUserId, '| Admin:', adminId);

    // Validate room type
    const type = roomType || 'general';
    if (!['general', 'order'].includes(type)) {
      return NextResponse.json({ error: 'Invalid room type' }, { status: 400 });
    }

    // For order support, validate transaction code
    let finalTransactionTitle = transactionTitle;
    if (type === 'order') {
      if (!transactionCode) {
        return NextResponse.json({ error: 'Transaction code required for order support' }, { status: 400 });
      }

      // Use provided transaction title or fallback to generated one
      if (!finalTransactionTitle) {
        finalTransactionTitle = `Order #${transactionCode}`;
      }
    }

    // Always create a new chat room (allow multiple rooms per user/transaction)
    // Default status is 'active' - user can start chatting immediately
    const chatRoom = await ChatRoom.create({
      userId: targetUserId,
      adminId: adminId,
      roomType: type,
      transactionCode: type === 'order' ? transactionCode : null,
      transactionTitle: type === 'order' ? finalTransactionTitle : null,
      status: 'active',
    });

    console.log('[POST /rooms] ✅ New chat room created:', chatRoom._id);

    // Populate user and admin data
    await chatRoom.populate('userId', 'username email firstName lastName profilePicture');
    await chatRoom.populate('adminId', 'username email firstName lastName');

    // Format response
    const response = {
      _id: chatRoom._id,
      userId: {
        _id: chatRoom.userId._id,
        username: chatRoom.userId.username,
        email: chatRoom.userId.email,
        fullName: `${chatRoom.userId.firstName || ''} ${chatRoom.userId.lastName || ''}`.trim() || chatRoom.userId.username,
        avatar: chatRoom.userId.profilePicture,
      },
      adminId: {
        _id: chatRoom.adminId._id,
        username: chatRoom.adminId.username,
        email: chatRoom.adminId.email,
        fullName: `${chatRoom.adminId.firstName || ''} ${chatRoom.adminId.lastName || ''}`.trim(),
      },
      roomType: chatRoom.roomType,
      transactionCode: chatRoom.transactionCode,
      transactionTitle: chatRoom.transactionTitle,
      lastMessage: chatRoom.lastMessage,
      lastMessageAt: chatRoom.lastMessageAt,
      unreadCountAdmin: chatRoom.unreadCountAdmin,
      unreadCountUser: chatRoom.unreadCountUser,
      status: chatRoom.status,
      createdAt: chatRoom.createdAt,
    };

    console.log('[POST /rooms] 📤 Response:', response);

    return NextResponse.json({
      success: true,
      data: response,
      existing: false,
    });
  } catch (error: any) {
    console.error('Error creating chat room:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
