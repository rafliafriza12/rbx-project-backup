// Mark messages as read
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ChatRoom from "@/models/ChatRoom";
import Message from "@/models/Message";
import { authenticateToken } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await authenticateToken(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { roomId } = await params;

    // Verify chat room exists
    const chatRoom = await ChatRoom.findById(roomId);

    if (!chatRoom) {
      return NextResponse.json(
        { error: "Chat room not found" },
        { status: 404 }
      );
    }

    // Check access rights
    const isAdmin =
      user.accessRole === "admin" || user.accessRole === "superadmin";
    const isOwner = chatRoom.userId.toString() === user._id.toString();

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Mark messages as read based on user role
    if (isAdmin) {
      await Message.updateMany(
        { roomId, senderRole: "user", isRead: false },
        { isRead: true, readAt: new Date() }
      );
      await ChatRoom.findByIdAndUpdate(roomId, { unreadCountAdmin: 0 });
    } else {
      await Message.updateMany(
        { roomId, senderRole: "admin", isRead: false },
        { isRead: true, readAt: new Date() }
      );
      await ChatRoom.findByIdAndUpdate(roomId, { unreadCountUser: 0 });
    }

    return NextResponse.json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
