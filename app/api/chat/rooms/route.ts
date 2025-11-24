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

      // Find an admin for auto-creating general rooms
      const admin = await User.findOne({ 
        accessRole: { $in: ['admin', 'superadmin'] } 
      }).sort({ accessRole: 1 });

      if (!admin) {
        return NextResponse.json({ 
          error: 'No admin available in the system' 
        }, { status: 503 });
      }

      // Create a map of userId -> array of rooms
      const roomsByUser = new Map<string, any[]>();
      existingRooms.forEach((room: any) => {
        const userId = room.userId.toString();
        if (!roomsByUser.has(userId)) {
          roomsByUser.set(userId, []);
        }
        roomsByUser.get(userId)!.push(room);
      });

      // Ensure every user has a general chat room
      const roomsToCreate: any[] = [];
      for (const u of users) {
        const user = u as any;
        const userId = user._id.toString();
        const userRooms = roomsByUser.get(userId) || [];
        const hasGeneralRoom = userRooms.some((r: any) => r.roomType === 'general');
        
        if (!hasGeneralRoom) {
          // User doesn't have general room, create it
          roomsToCreate.push({
            userId: user._id,
            adminId: admin._id,
            roomType: 'general',
            status: 'active',
          });
        }
      }

      // Bulk create missing general rooms
      if (roomsToCreate.length > 0) {
        const createdRooms = await ChatRoom.insertMany(roomsToCreate);
        console.log(`[GET /rooms] 🆕 Auto-created ${createdRooms.length} general chat rooms`);
        
        // Add newly created rooms to the map
        createdRooms.forEach((room: any) => {
          const userId = room.userId.toString();
          if (!roomsByUser.has(userId)) {
            roomsByUser.set(userId, []);
          }
          roomsByUser.get(userId)!.push(room);
        });
      }

      // Combine users with their chat room data
      const usersWithChatData = users.flatMap((u: any) => {
        const userRooms = roomsByUser.get(u._id.toString()) || [];
        
        // Map each room to a formatted object
        return userRooms.map((room: any) => ({
          _id: room._id,
          userId: {
            _id: u._id,
            username: u.username,
            email: u.email,
            fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username,
            avatar: u.profilePicture,
          },
          roomType: room.roomType || 'general',
          transactionCode: room.transactionCode || null,
          transactionTitle: room.transactionTitle || null,
          lastMessage: room.lastMessage || null,
          lastMessageAt: room.lastMessageAt || null,
          unreadCountAdmin: room.unreadCountAdmin || 0,
          unreadCountUser: room.unreadCountUser || 0,
          status: room.status || 'active',
          createdAt: room.createdAt || u.createdAt,
          hasRoom: true,
        }));
      });

      // Sort by: unread messages first, then last message time, then creation time
      usersWithChatData.sort((a, b) => {
        if (a.unreadCountAdmin !== b.unreadCountAdmin) {
          return b.unreadCountAdmin - a.unreadCountAdmin;
        }
        if (a.lastMessageAt && b.lastMessageAt) {
          return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        }
        if (a.lastMessageAt) return -1;
        if (b.lastMessageAt) return 1;
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

      // Check if room with this transaction code already exists for this user
      const existingOrderRoom = await ChatRoom.findOne({ 
        userId: targetUserId,
        transactionCode: transactionCode 
      });

      if (existingOrderRoom) {
        // Return existing room
        console.log('[POST /rooms] ✅ Existing order room found:', existingOrderRoom._id);
        await existingOrderRoom.populate('userId', 'username email firstName lastName profilePicture');
        await existingOrderRoom.populate('adminId', 'username email firstName lastName');

        return NextResponse.json({
          success: true,
          data: {
            _id: existingOrderRoom._id,
            userId: {
              _id: existingOrderRoom.userId._id,
              username: existingOrderRoom.userId.username,
              email: existingOrderRoom.userId.email,
              fullName: `${existingOrderRoom.userId.firstName || ''} ${existingOrderRoom.userId.lastName || ''}`.trim() || existingOrderRoom.userId.username,
              avatar: existingOrderRoom.userId.profilePicture,
            },
            adminId: {
              _id: existingOrderRoom.adminId._id,
              username: existingOrderRoom.adminId.username,
              email: existingOrderRoom.adminId.email,
              fullName: `${existingOrderRoom.adminId.firstName || ''} ${existingOrderRoom.adminId.lastName || ''}`.trim(),
            },
            roomType: existingOrderRoom.roomType,
            transactionCode: existingOrderRoom.transactionCode,
            transactionTitle: existingOrderRoom.transactionTitle,
            lastMessage: existingOrderRoom.lastMessage,
            lastMessageAt: existingOrderRoom.lastMessageAt,
            unreadCountAdmin: existingOrderRoom.unreadCountAdmin,
            unreadCountUser: existingOrderRoom.unreadCountUser,
            status: existingOrderRoom.status,
            createdAt: existingOrderRoom.createdAt,
          },
          existing: true,
        });
      }

      // Validate transaction exists (optional - you can skip this if you want)
      // For now, we'll just use the provided transaction title
    }

    // Check if general chat room already exists
    if (type === 'general') {
      const existingGeneralRoom = await ChatRoom.findOne({ 
        userId: targetUserId,
        roomType: 'general'
      });

      if (existingGeneralRoom) {
        // Return existing room
        console.log('[POST /rooms] ✅ Existing general room found:', existingGeneralRoom._id);
        await existingGeneralRoom.populate('userId', 'username email firstName lastName profilePicture');
        await existingGeneralRoom.populate('adminId', 'username email firstName lastName');

        return NextResponse.json({
          success: true,
          data: {
            _id: existingGeneralRoom._id,
            userId: {
              _id: existingGeneralRoom.userId._id,
              username: existingGeneralRoom.userId.username,
              email: existingGeneralRoom.userId.email,
              fullName: `${existingGeneralRoom.userId.firstName || ''} ${existingGeneralRoom.userId.lastName || ''}`.trim() || existingGeneralRoom.userId.username,
              avatar: existingGeneralRoom.userId.profilePicture,
            },
            adminId: {
              _id: existingGeneralRoom.adminId._id,
              username: existingGeneralRoom.adminId.username,
              email: existingGeneralRoom.adminId.email,
              fullName: `${existingGeneralRoom.adminId.firstName || ''} ${existingGeneralRoom.adminId.lastName || ''}`.trim(),
            },
            roomType: existingGeneralRoom.roomType,
            transactionCode: existingGeneralRoom.transactionCode,
            transactionTitle: existingGeneralRoom.transactionTitle,
            lastMessage: existingGeneralRoom.lastMessage,
            lastMessageAt: existingGeneralRoom.lastMessageAt,
            unreadCountAdmin: existingGeneralRoom.unreadCountAdmin,
            unreadCountUser: existingGeneralRoom.unreadCountUser,
            status: existingGeneralRoom.status,
            createdAt: existingGeneralRoom.createdAt,
          },
          existing: true,
        });
      }
    }

    // Create new chat room
    const chatRoom = await ChatRoom.create({
      userId: targetUserId,
      adminId: adminId, // Always set admin ID
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
