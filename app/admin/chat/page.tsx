"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ChatMessages from "@/components/admin/ChatMessages";

interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
}

interface ChatRoom {
  _id: string | null; // Can be null if room doesn't exist yet
  userId: User;
  adminId?: {
    _id: string;
    username: string;
    fullName?: string;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCountAdmin: number;
  unreadCountUser: number;
  status: "active" | "closed" | "archived";
  createdAt: string;
  hasRoom?: boolean; // Flag to indicate if room exists
}

export default function AdminChatPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Protect admin route
  useEffect(() => {
    if (!authLoading) {
      if (!user || !isAdmin()) {
        router.push("/login");
        return;
      }
    }
  }, [user, authLoading, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin()) {
      fetchChatRooms();
    }
  }, [user, statusFilter, search]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // REMOVED: Real-time room list updates via Pusher
  // Room list will update via handleNewMessage callback from ChatMessages component
  // This prevents duplicate Pusher subscriptions and reduces message count

  const fetchChatRooms = async () => {
    try {
      console.log('[Admin Chat] 📞 fetchChatRooms() called');
      console.trace('[Admin Chat] Call stack:'); // Show where this was called from
      
      const params = new URLSearchParams({
        search: search,
        limit: "100",
      });

      const response = await fetch(`/api/chat/rooms?${params}`);
      const data = await response.json();

      if (data.success) {
        setChatRooms(data.data);
        console.log(`[Admin Chat] ✅ Loaded ${data.data.length} chat rooms`);
      }
    } catch (error) {
      console.error("[Admin Chat] ❌ Error fetching chat rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = async (room: ChatRoom) => {
    setSelectedRoom(room);
    
    // If room doesn't exist yet, create it
    if (!room._id) {
      try {
        const response = await fetch('/api/chat/rooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: room.userId._id,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Update room with new ID
          const updatedRoom = { ...room, ...data.data };
          setSelectedRoom(updatedRoom);
          setSelectedRoomId(data.data._id);
          
          // Refresh room list to update with new room
          fetchChatRooms();
        }
      } catch (error) {
        console.error('Error creating chat room:', error);
      }
    } else {
      setSelectedRoomId(room._id);
    }
  };

  const handleNewMessage = () => {
    // Debounce: Prevent multiple rapid calls to fetchChatRooms
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      console.log('[Admin Chat] 🔄 Refreshing chat rooms list (debounced)');
      fetchChatRooms();
    }, 300); // 300ms debounce
  };

  const formatTime = (date?: string) => {
    if (!date) return "";

    try {
      const msgDate = new Date(date);
      const now = new Date();
      const diffMs = now.getTime() - msgDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Baru saja";
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;

      return msgDate.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6]"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Chat Management</h1>
        <p className="text-[#94a3b8] mt-1">
          Kelola percakapan dengan pelanggan
        </p>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg h-[calc(100%-80px)] flex">
        {/* Chat Room List - Left Sidebar */}
        <div className="w-80 border-r border-[#334155] flex flex-col">
          {/* Search & Filter */}
          <div className="p-4 border-b border-[#334155] space-y-3">
            <input
              type="text"
              placeholder="Cari user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            />
          </div>

          {/* Chat Rooms List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
              </div>
            ) : chatRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-[#64748b]">
                <p className="text-sm">
                  {search ? "Tidak ada user ditemukan" : "Tidak ada user terdaftar"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#334155]">
                {chatRooms.map((room) => (
                  <button
                    key={room.userId._id}
                    onClick={() => handleRoomClick(room)}
                    className={`w-full p-4 text-left hover:bg-[#334155] transition-colors ${
                      selectedRoom?.userId._id === room.userId._id ? "bg-[#334155]" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                          {(
                            room.userId?.fullName ||
                            room.userId?.username ||
                            "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[#f1f5f9] truncate">
                            {room.userId?.fullName || room.userId?.username}
                          </p>
                          <p className="text-xs text-[#94a3b8] truncate">
                            {room.userId?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {room.lastMessageAt ? (
                          <span className="text-xs text-[#64748b]">
                            {formatTime(room.lastMessageAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-[#64748b] italic">
                            Belum chat
                          </span>
                        )}
                        {room.unreadCountAdmin > 0 && (
                          <span className="bg-[#3b82f6] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {room.unreadCountAdmin}
                          </span>
                        )}
                      </div>
                    </div>
                    {room.lastMessage && (
                      <p className="text-sm text-[#64748b] truncate mt-1">
                        {room.lastMessage}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages - Right Panel */}
        <div className="flex-1 flex flex-col">
          {selectedRoom && selectedRoomId ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#334155] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
                    {(
                      selectedRoom.userId?.fullName ||
                      selectedRoom.userId?.username ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#f1f5f9]">
                      {selectedRoom.userId?.fullName ||
                        selectedRoom.userId?.username}
                    </h3>
                    <p className="text-xs text-[#64748b]">
                      {selectedRoom.userId?.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedRoom.status === "active"
                        ? "bg-green-900/50 text-green-300 border border-green-700"
                        : selectedRoom.status === "closed"
                        ? "bg-red-900/50 text-red-300 border border-red-700"
                        : "bg-gray-700 text-gray-300 border border-gray-600"
                    }`}
                  >
                    {selectedRoom.status}
                  </span>
                </div>
              </div>

              {/* Chat Messages Component */}
              <div className="flex-1 overflow-hidden">
                <ChatMessages
                  roomId={selectedRoomId}
                  currentUserId={user.id}
                  onNewMessage={handleNewMessage}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#64748b]">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-lg font-medium">Pilih chat room</p>
                <p className="text-sm mt-1">
                  Pilih percakapan dari daftar untuk mulai chat
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
