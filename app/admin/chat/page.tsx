"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ChatMessages from "@/components/admin/ChatMessages";
import NotificationPrompt from "@/components/NotificationPrompt";
import Pusher from "pusher-js";

interface User {
  _id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
}

interface ChatRoom {
  _id: string | null;
  userId: User;
  roomType?: 'general' | 'order';
  transactionCode?: string;
  transactionTitle?: string;
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
  hasRoom?: boolean;
}

interface UserWithRooms {
  user: User;
  rooms: ChatRoom[];
  totalUnread: number;
  lastActivity?: string;
}

export default function AdminChatPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [groupedUsers, setGroupedUsers] = useState<UserWithRooms[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [newMessageRooms, setNewMessageRooms] = useState<Set<string>>(new Set()); // Track rooms with new messages
  const pusherRef = useRef<Pusher | null>(null);

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

  // Keyboard shortcut: Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Real-time notifications via Pusher
  useEffect(() => {
    if (!user || !isAdmin()) return;

    console.log('[Admin Chat] 🔌 Setting up Pusher for real-time notifications');

    // Initialize Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    pusherRef.current = pusher;

    // Subscribe to admin notification channel
    const adminChannel = pusher.subscribe('admin-notifications');

    // Listen for new messages
    adminChannel.bind('new-message', (data: { 
      roomId: string; 
      userId: string; 
      message: string;
      senderName?: string;
      roomType?: string;
      transactionCode?: string;
      timestamp?: string;
    }) => {
      console.log('[Admin Chat] 📨 New message notification:', data);

      // Add to new message rooms (will show red indicator)
      setNewMessageRooms(prev => new Set(prev).add(data.roomId));
      
      // Refresh room list to update unread counts
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      fetchTimeoutRef.current = setTimeout(() => {
        fetchChatRooms();
      }, 300);
    });

    return () => {
      console.log('[Admin Chat] 🔌 Cleaning up Pusher connection');
      adminChannel.unbind_all();
      pusher.unsubscribe('admin-notifications');
      pusher.disconnect();
    };
  }, [user, isAdmin]); // ✅ Removed selectedRoomId dependency - connection stays persistent!

  // REMOVED: Real-time room list updates via Pusher
  // Room list will update via handleNewMessage callback from ChatMessages component
  // This prevents duplicate Pusher subscriptions and reduces message count

  const fetchChatRooms = async () => {
    try {
      console.log('[Admin Chat] 📞 fetchChatRooms() called');
      console.trace('[Admin Chat] Call stack:');
      
      const params = new URLSearchParams({
        search: search,
        limit: "100",
      });

      const response = await fetch(`/api/chat/rooms?${params}`);
      const data = await response.json();

      if (data.success) {
        setChatRooms(data.data);
        
        // Group rooms by user
        const userMap = new Map<string, UserWithRooms>();
        
        data.data.forEach((room: ChatRoom) => {
          const userId = room.userId._id;
          
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              user: room.userId,
              rooms: [],
              totalUnread: 0,
              lastActivity: room.lastMessageAt,
            });
          }
          
          const userGroup = userMap.get(userId)!;
          userGroup.rooms.push(room);
          userGroup.totalUnread += room.unreadCountAdmin;
          
          // Update last activity if this room has newer activity
          if (room.lastMessageAt) {
            if (!userGroup.lastActivity || new Date(room.lastMessageAt) > new Date(userGroup.lastActivity)) {
              userGroup.lastActivity = room.lastMessageAt;
            }
          }
        });
        
        // Convert map to array and sort by last activity
        const grouped = Array.from(userMap.values()).sort((a, b) => {
          const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          return dateB - dateA;
        });
        
        setGroupedUsers(grouped);
        console.log(`[Admin Chat] ✅ Loaded ${data.data.length} chat rooms, grouped into ${grouped.length} users`);
        
        // Auto-expand and select first user's general chat on first load
        if (isFirstLoad && grouped.length > 0) {
          const firstUser = grouped[0];
          setExpandedUsers(new Set([firstUser.user._id]));
          
          // Find general chat room (preferred) or first room
          const generalRoom = firstUser.rooms.find(r => r.roomType === 'general');
          const roomToSelect = generalRoom || firstUser.rooms[0];
          
          if (roomToSelect && roomToSelect._id) {
            setSelectedRoom(roomToSelect);
            setSelectedRoomId(roomToSelect._id);
          }
          
          setIsFirstLoad(false);
        }
      }
    } catch (error) {
      console.error("[Admin Chat] ❌ Error fetching chat rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = async (room: ChatRoom) => {
    setSelectedRoom(room);
    
    // Clear new message indicator for this room
    if (room._id) {
      setNewMessageRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(room._id!);
        return newSet;
      });
    }
    
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
            roomType: room.roomType || 'general',
            transactionCode: room.transactionCode,
            transactionTitle: room.transactionTitle,
          }),
        });
        
        const data = await response.json();
        
        if (data.success) {
          const updatedRoom = { ...room, ...data.data };
          setSelectedRoom(updatedRoom);
          setSelectedRoomId(data.data._id);
          fetchChatRooms();
        }
      } catch (error) {
        console.error('Error creating chat room:', error);
      }
    } else {
      setSelectedRoomId(room._id);
    }
  };

  const toggleUserExpand = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
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

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-500/30 text-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
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
    <>
      <NotificationPrompt />
      <div className="h-[calc(100vh-120px)]">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#f1f5f9]">Chat Management</h1>
              <p className="text-[#94a3b8] mt-1">
                Kelola percakapan dengan pelanggan
              </p>
            </div>
          
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2">
              <div className="text-xs text-[#94a3b8]">Total Users</div>
              <div className="text-xl font-bold text-[#f1f5f9]">{groupedUsers.length}</div>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2">
              <div className="text-xs text-[#94a3b8]">Unread</div>
              <div className="text-xl font-bold text-[#3b82f6]">
                {groupedUsers.reduce((sum, u) => sum + u.totalUnread, 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg h-[calc(100%-80px)] flex">
        {/* Chat Room List - Left Sidebar */}
        <div className="w-80 border-r border-[#334155] flex flex-col">
          {/* Search & Filter */}
          <div className="p-4 border-b border-[#334155] space-y-3">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari user... (Ctrl+K)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg pl-10 pr-10 py-2.5 text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#f1f5f9] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Chat Rooms List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
              </div>
            ) : groupedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-[#64748b] px-4">
                <div className="bg-[#0f172a] rounded-full p-6 mb-4">
                  <svg className="w-12 h-12 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-base font-medium text-[#94a3b8] mb-1">
                  {search ? "Tidak ada user ditemukan" : "Belum ada user"}
                </p>
                <p className="text-sm text-center">
                  {search 
                    ? `Coba kata kunci lain atau hapus filter pencarian` 
                    : "User yang terdaftar akan muncul di sini"}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-4 px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Hapus Pencarian
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#334155]">
                {groupedUsers.map((userGroup) => (
                  <div key={userGroup.user._id}>
                    {/* User Header */}
                    <button
                      onClick={() => toggleUserExpand(userGroup.user._id)}
                      className="w-full p-4 text-left hover:bg-[#334155] transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {(userGroup.user.fullName || userGroup.user.username || "U")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                            {/* Real-time notification indicator - check if any room has new messages */}
                            {userGroup.rooms.some(room => room._id && newMessageRooms.has(room._id)) && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#1e293b] animate-pulse">
                                <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                              </div>
                            )}
                            {/* Unread count indicator (existing) */}
                            {userGroup.totalUnread > 0 && !userGroup.rooms.some(room => room._id && newMessageRooms.has(room._id)) && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#3b82f6] rounded-full border-2 border-[#1e293b] animate-pulse"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#f1f5f9] truncate">
                              {highlightText(
                                userGroup.user.fullName || userGroup.user.username,
                                search
                              )}
                            </p>
                            <p className="text-xs text-[#94a3b8] truncate">
                              {userGroup.rooms.length} chat room{userGroup.rooms.length > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {userGroup.lastActivity && (
                            <span className="text-xs text-[#64748b]">
                              {formatTime(userGroup.lastActivity)}
                            </span>
                          )}
                          {userGroup.totalUnread > 0 && (
                            <span className="bg-[#3b82f6] text-white text-xs rounded-full px-2.5 py-1 font-bold min-w-[24px] text-center shadow-lg shadow-blue-500/50">
                              {userGroup.totalUnread}
                            </span>
                          )}
                          <svg
                            className={`w-5 h-5 text-[#64748b] transition-transform duration-200 ${
                              expandedUsers.has(userGroup.user._id) ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </button>

                    {/* Expanded Room List */}
                    {expandedUsers.has(userGroup.user._id) && (
                      <div className="bg-[#0f172a] border-t border-white/20">
                        {userGroup.rooms.map((room, index) => (
                          <div key={room._id || `${userGroup.user._id}-${room.roomType}`}>
                            <button
                              onClick={() => handleRoomClick(room)}
                              className={`w-full p-4 pl-14 text-left transition-all duration-200 relative ${
                                selectedRoomId === room._id
                                  ? room.roomType === 'order'
                                    ? 'bg-emerald-500/20 border-l-4 border-l-emerald-500'
                                    : 'bg-purple-500/20 border-l-4 border-l-purple-500'
                                  : 'border-l-4 border-l-transparent bg-transparent'
                              }`}
                            >
                              {/* Real-time new message indicator */}
                              {room._id && newMessageRooms.has(room._id) && (
                                <div className="absolute top-3 right-3">
                                  <div className="relative">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className={`p-1.5 rounded-md flex-shrink-0 transition-all ${
                                    room.roomType === 'order'
                                      ? 'bg-emerald-500/20 ring-2 ring-emerald-500/30'
                                      : 'bg-purple-500/20 ring-2 ring-purple-500/30'
                                  } ${selectedRoomId === room._id ? 'scale-110' : ''}`}>
                                    <svg className={`w-4 h-4 ${
                                      room.roomType === 'order' ? 'text-emerald-400' : 'text-purple-400'
                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {room.roomType === 'order' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                      )}
                                    </svg>
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                        room.roomType === 'order'
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                      }`}>
                                        {room.roomType === 'order' ? 'Order Support' : 'General Support'}
                                      </span>
                                    </div>
                                    
                                    {room.roomType === 'order' && room.transactionCode && (
                                      <p className="text-xs text-[#94a3b8] mt-1 truncate font-medium">
                                        {room.transactionTitle || room.transactionCode}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                  {room.lastMessageAt && (
                                    <span className="text-xs text-[#64748b] font-medium">
                                      {formatTime(room.lastMessageAt)}
                                    </span>
                                  )}
                                  {room.unreadCountAdmin > 0 && (
                                    <span className="bg-[#3b82f6] text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg shadow-blue-500/50 animate-pulse">
                                      {room.unreadCountAdmin}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              {room.lastMessage && (
                                <p className="text-sm text-[#64748b] truncate pl-8">
                                  {room.lastMessage}
                                </p>
                              )}
                            </button>
                            
                            {/* Divider between rooms - except for last item */}
                            {index < userGroup.rooms.length - 1 && (
                              <div className="w-full">
                                <div className="border-t border-white/10"></div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {(
                      selectedRoom.userId?.fullName ||
                      selectedRoom.userId?.username ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#f1f5f9]">
                        {selectedRoom.userId?.fullName ||
                          selectedRoom.userId?.username}
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        selectedRoom.roomType === 'order'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {selectedRoom.roomType === 'order' ? 'Order' : 'General'}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748b]">
                      {selectedRoom.roomType === 'order' && selectedRoom.transactionCode
                        ? `${selectedRoom.transactionTitle || selectedRoom.transactionCode}`
                        : selectedRoom.userId?.email}
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
              <div className="text-center px-4">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-[#1e293b] rounded-full p-8">
                    <svg className="w-16 h-16 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <p className="text-lg font-semibold text-[#94a3b8] mb-2">Pilih chat room</p>
                <p className="text-sm text-[#64748b] mb-6 max-w-sm mx-auto">
                  Pilih percakapan dari daftar untuk mulai chat dengan pelanggan
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-xs text-[#94a3b8]">
                  <kbd className="px-2 py-1 bg-[#0f172a] border border-[#334155] rounded text-[#f1f5f9] font-mono">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-2 py-1 bg-[#0f172a] border border-[#334155] rounded text-[#f1f5f9] font-mono">K</kbd>
                  <span className="ml-2">untuk search</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
