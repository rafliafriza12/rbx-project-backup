// GET all users (customers) for admin to chat with
// POST create new chat room
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatRoom from '@/models/ChatRoom';
import User from '@/models/User';
import Message from '@/models/Message';
import Transaction from '@/models/Transaction';
import { authenticateToken } from '@/lib/auth';
import { getPusherInstance } from '@/lib/pusher';

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Helper function to format date
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

// Helper function to generate invoice message for multiple transactions
function generateInvoiceMessage(transactions: any[]): string {
  const lines: string[] = [];
  
  // Use first transaction for main info
  const mainTransaction = transactions[0];
  const isMultipleItems = transactions.length > 1;
  
  // Calculate total amount from all transactions
  const totalAmount = transactions.reduce((sum, t) => sum + (t.finalAmount || 0), 0);
  
  // Header with transaction info
  lines.push(`### 🧾 Informasi Transaksi`);
  lines.push('');
  
  if (isMultipleItems) {
    // For multi-item checkout, show master order ID
    lines.push(`**Kode Pesanan:** \`${mainTransaction.midtransOrderId || mainTransaction.invoiceId}\``);
  } else {
    lines.push(`**Kode:** \`${mainTransaction.invoiceId}\``);
  }
  
  lines.push(`**Total Pembayaran:** ${formatCurrency(totalAmount)}`);
  
  if (mainTransaction.paidAt) {
    lines.push(`**Waktu Pembayaran:** ${formatDate(new Date(mainTransaction.paidAt))}`);
  }
  
  lines.push('');
  lines.push(`### 📦 Detail Pesanan${isMultipleItems ? ` (${transactions.length} item)` : ''}`);
  lines.push('');
  
  // Loop through all transactions/items
  transactions.forEach((transaction, index) => {
    if (isMultipleItems) {
      lines.push(`**${index + 1}. ${transaction.serviceName}**`);
    } else {
      lines.push(`- **Produk:** ${transaction.serviceName}`);
    }
    
    // Add game info based on service type
    if (transaction.serviceType === 'gamepass' || transaction.serviceType === 'robux') {
      lines.push(`- **Platform:** Roblox`);
    } else if (transaction.serviceType === 'joki' && transaction.jokiDetails?.gameType) {
      lines.push(`- **Game:** ${transaction.jokiDetails.gameType}`);
    }
    
    if (transaction.robloxUsername) {
      lines.push(`- **Username:** ${transaction.robloxUsername}`);
    }
    
    lines.push(`- **Qty:** ${transaction.quantity}`);
    lines.push(`- **Harga:** ${formatCurrency(transaction.finalAmount)}`);
    
    if (isMultipleItems && index < transactions.length - 1) {
      lines.push(''); // Add spacing between items
    }
  });
  
  // Customer contact info (from main transaction)
  lines.push('');
  lines.push(`### 👤 Info Pelanggan`);
  lines.push('');
  
  if (mainTransaction.customerInfo?.name) {
    lines.push(`- **Nama:** ${mainTransaction.customerInfo.name}`);
  }
  if (mainTransaction.customerInfo?.email) {
    lines.push(`- **Email:** ${mainTransaction.customerInfo.email}`);
  }
  if (mainTransaction.customerInfo?.phone) {
    lines.push(`- **No. Telepon:** ${mainTransaction.customerInfo.phone}`);
  }
  
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('Terima kasih sudah berbelanja di toko kami! 🎉');
  lines.push('');
  lines.push('Silakan hubungi kami di chat ini jika ada kendala atau pertanyaan seputar pesanan Anda.');
  lines.push('');
  lines.push('_Jangan lupa berikan ulasan untuk layanan kami ya!_ ⭐');
  
  return lines.join('\n');
}

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

    // Send Pusher notification for NEW ROOM to admin
    try {
      const pusher = getPusherInstance();
      
      // Notify admin channel about the new room
      await pusher.trigger('admin-notifications', 'new-room', {
        roomId: chatRoom._id.toString(),
        userId: targetUserId.toString(),
        roomType: type,
        transactionCode: type === 'order' ? transactionCode : null,
        transactionTitle: type === 'order' ? finalTransactionTitle : null,
        createdAt: chatRoom.createdAt,
      });
      
      console.log('[POST /rooms] 📢 Admin notification sent for new room');
    } catch (pusherError) {
      console.error('[POST /rooms] ⚠️ Pusher error for new room notification:', pusherError);
    }

    // For order chat, auto-send invoice message
    if (type === 'order' && transactionCode) {
      try {
        // Find the main transaction by invoiceId
        const mainTransaction = await Transaction.findOne({ invoiceId: transactionCode });
        
        if (mainTransaction) {
          let allTransactions = [mainTransaction];
          
          // Check if this is part of a multi-item checkout (has midtransOrderId)
          if (mainTransaction.midtransOrderId) {
            // Find all transactions with the same midtransOrderId
            const relatedTransactions = await Transaction.find({ 
              midtransOrderId: mainTransaction.midtransOrderId 
            }).sort({ createdAt: 1 });
            
            if (relatedTransactions.length > 1) {
              allTransactions = relatedTransactions;
              console.log(`[POST /rooms] 📦 Found ${relatedTransactions.length} items in this order`);
            }
          }
          
          // Generate invoice message with all transactions
          const invoiceMessageText = generateInvoiceMessage(allTransactions);
          
          // Create the auto-message (sent by user, type: system for styling)
          const autoMessage = await Message.create({
            roomId: chatRoom._id,
            senderId: targetUserId,
            senderRole: 'user',
            message: invoiceMessageText,
            type: 'text', // Use text type so it displays normally
            isRead: false,
          });
          
          // Update chat room with last message
          await ChatRoom.findByIdAndUpdate(chatRoom._id, {
            lastMessage: invoiceMessageText.substring(0, 100) + '...',
            lastMessageAt: new Date(),
            unreadCountAdmin: 1,
          });
          
          // Send Pusher notification
          try {
            const pusher = getPusherInstance();
            
            // Populate sender info for the message
            const populatedMessage = await Message.findById(autoMessage._id)
              .populate('senderId', 'username email firstName lastName profilePicture')
              .lean();
            
            const messagePayload = {
              ...populatedMessage,
              senderId: {
                _id: (populatedMessage as any).senderId._id,
                username: (populatedMessage as any).senderId.username,
                fullName: `${(populatedMessage as any).senderId.firstName || ''} ${(populatedMessage as any).senderId.lastName || ''}`.trim() || (populatedMessage as any).senderId.username,
                avatar: (populatedMessage as any).senderId.profilePicture,
              },
            };
            
            await pusher.trigger(`private-chat-room-${chatRoom._id}`, 'new-message', {
              message: messagePayload,
              roomUpdate: {
                lastMessage: invoiceMessageText.substring(0, 100) + '...',
                lastMessageAt: new Date().toISOString(),
              },
            });

            // Also notify admin channel about the new message in the new room
            await pusher.trigger('admin-notifications', 'new-message', {
              roomId: chatRoom._id.toString(),
              userId: targetUserId.toString(),
              message: invoiceMessageText.substring(0, 100) + '...',
              senderName: (populatedMessage as any).senderId?.fullName || (populatedMessage as any).senderId?.username,
              roomType: type,
              transactionCode: transactionCode,
              timestamp: new Date().toISOString(),
            });
            
            console.log('[POST /rooms] 📨 Auto invoice message sent via Pusher');
          } catch (pusherError) {
            console.error('[POST /rooms] ⚠️ Pusher error (non-critical):', pusherError);
          }
          
          console.log('[POST /rooms] 📝 Auto invoice message created for order chat');
        } else {
          console.log('[POST /rooms] ⚠️ Transaction not found for code:', transactionCode);
        }
      } catch (autoMsgError) {
        console.error('[POST /rooms] ⚠️ Failed to create auto message:', autoMsgError);
        // Don't fail the room creation if auto-message fails
      }
    }

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

// DELETE - Delete all chat rooms and messages (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticateToken(request);
    
    if (!user || (user.accessRole !== 'admin' && user.accessRole !== 'superadmin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all room IDs before deletion for Pusher notifications
    const allRooms = await ChatRoom.find({}).populate('userId', '_id');
    const roomIds = allRooms.map(room => room._id.toString());
    const userIds = [...new Set(allRooms.map(room => room.userId?._id?.toString()).filter(Boolean))];

    // Delete all messages first
    const deletedMessages = await Message.deleteMany({});
    console.log(`[Bulk Delete] 🗑️ Deleted ${deletedMessages.deletedCount} messages`);

    // Delete all chat rooms
    const deletedRooms = await ChatRoom.deleteMany({});
    console.log(`[Bulk Delete] 🗑️ Deleted ${deletedRooms.deletedCount} chat rooms`);

    // Send Pusher notifications
    try {
      const pusher = getPusherInstance();
      
      // Notify each room channel
      for (const roomId of roomIds) {
        await pusher.trigger(`private-chat-room-${roomId}`, 'room-deleted', {
          roomId,
          message: 'Semua chat telah dihapus oleh admin.',
          bulkDelete: true,
        });
      }

      // Notify admin channel
      await pusher.trigger('admin-notifications', 'bulk-rooms-deleted', {
        deletedRoomsCount: deletedRooms.deletedCount,
        deletedMessagesCount: deletedMessages.deletedCount,
        deletedBy: user._id.toString(),
      });

      // Notify all affected users
      for (const userId of userIds) {
        await pusher.trigger(`user-notifications-${userId}`, 'rooms-deleted', {
          message: 'Chat room Anda telah dihapus.',
          bulkDelete: true,
        });
      }
    } catch (pusherError) {
      console.error('[Bulk Delete] ❌ Pusher error:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: 'All chat rooms and messages deleted successfully',
      deletedRoomsCount: deletedRooms.deletedCount,
      deletedMessagesCount: deletedMessages.deletedCount,
    });
  } catch (error: any) {
    console.error('Error deleting all chat rooms:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
