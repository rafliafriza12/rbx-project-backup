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
  lastUserReplyAt?: string;
  unreadCountAdmin: number;
  unreadCountUser: number;
  status: "active" | "closed" | "archived";
  deactivatedAt?: string;
  deactivatedBy?: 'admin' | 'system';
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
  const chatRoomsRef = useRef<ChatRoom[]>([]); // Ref to access current chatRooms in event handlers
  const [togglingStatus, setTogglingStatus] = useState(false); // Loading state for toggle status
  const [markingAsRead, setMarkingAsRead] = useState(false); // Loading state for mark as read
  const [showMobileSidebar, setShowMobileSidebar] = useState(false); // Mobile sidebar visibility
  const [deletingRoom, setDeletingRoom] = useState<string | null>(null); // Track which room is being deleted
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false); // Show delete all confirmation modal
  const [deletingAll, setDeletingAll] = useState(false); // Loading state for delete all

  // Keep ref in sync with state
  useEffect(() => {
    chatRoomsRef.current = chatRooms;
  }, [chatRooms]);

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
      
      // Check if room exists using ref (synchronous access to current state)
      const roomExists = chatRoomsRef.current.some(room => room._id === data.roomId);
      
      if (!roomExists) {
        // Room doesn't exist in list - fetch to get new room data
        console.log('[Admin Chat] 🆕 New message for unknown room, fetching rooms...');
        fetchChatRooms();
        return;
      }
      
      // Room exists - update it locally
      setChatRooms(prev => prev.map(room => 
        room._id === data.roomId 
          ? { 
              ...room, 
              unreadCountAdmin: room.unreadCountAdmin + 1,
              lastMessage: data.message,
              lastMessageAt: data.timestamp || new Date().toISOString()
            } 
          : room
      ));

      // Also update grouped users
      setGroupedUsers(prev => prev.map(userGroup => {
        const updatedRooms = userGroup.rooms.map(room => 
          room._id === data.roomId 
            ? { 
                ...room, 
                unreadCountAdmin: room.unreadCountAdmin + 1,
                lastMessage: data.message,
                lastMessageAt: data.timestamp || new Date().toISOString()
              } 
            : room
        );
        
        return {
          ...userGroup,
          rooms: updatedRooms,
          totalUnread: updatedRooms.reduce((sum, room) => sum + room.unreadCountAdmin, 0),
          lastActivity: data.timestamp || userGroup.lastActivity
        };
      }));
    });

    // Listen for room status changes (deactivation/reactivation) - only for room list update
    // Note: System message is handled by private room channel in ChatMessages component
    adminChannel.bind('room-status-changed', (data: {
      roomId: string;
      userId: string;
      userName: string;
      status: string;
      changedBy: string;
    }) => {
      console.log('[Admin Chat] 🔄 Room status changed (notification channel):', data);
      
      // Update room list locally WITHOUT fetching
      setChatRooms(prev => prev.map(room => 
        room._id === data.roomId 
          ? { ...room, status: data.status as "active" | "closed" | "archived" } 
          : room
      ));

      // Update grouped users
      setGroupedUsers(prev => prev.map(userGroup => ({
        ...userGroup,
        rooms: userGroup.rooms.map(room => 
          room._id === data.roomId 
            ? { ...room, status: data.status as "active" | "closed" | "archived" } 
            : room
        )
      })));
    });

    // Listen for room deactivation (auto-deactivate by system) - only for room list update
    // Note: System message is handled by private room channel in ChatMessages component
    adminChannel.bind('room-deactivated', (data: {
      roomId: string;
      userId: string;
      userName: string;
      deactivatedBy: string;
      reason: string;
    }) => {
      console.log('[Admin Chat] 🔴 Room deactivated (notification channel):', data);
      
      // Update room list locally WITHOUT fetching
      setChatRooms(prev => prev.map(room => 
        room._id === data.roomId 
          ? { ...room, status: 'closed' as const, deactivatedBy: data.deactivatedBy as 'admin' | 'system' } 
          : room
      ));

      // Update grouped users
      setGroupedUsers(prev => prev.map(userGroup => ({
        ...userGroup,
        rooms: userGroup.rooms.map(room => 
          room._id === data.roomId 
            ? { ...room, status: 'closed' as const, deactivatedBy: data.deactivatedBy as 'admin' | 'system' } 
            : room
        )
      })));
    });

    // Listen for room activation (when user sends first message to activate chat)
    adminChannel.bind('room-activated', (data: {
      roomId: string;
      userId: string;
      activatedBy: string;
    }) => {
      console.log('[Admin Chat] 🟢 Room activated (user sent message):', data);
      
      // Update room list locally WITHOUT fetching
      setChatRooms(prev => prev.map(room => 
        room._id === data.roomId 
          ? { ...room, status: 'active' as const, deactivatedAt: undefined, deactivatedBy: undefined } 
          : room
      ));

      // Update grouped users
      setGroupedUsers(prev => prev.map(userGroup => ({
        ...userGroup,
        rooms: userGroup.rooms.map(room => 
          room._id === data.roomId 
            ? { ...room, status: 'active' as const, deactivatedAt: undefined, deactivatedBy: undefined } 
            : room
        )
      })));
    });

    // Listen for NEW ROOM created by user
    adminChannel.bind('new-room', (data: {
      roomId: string;
      userId: string;
      roomType: 'general' | 'order';
      transactionCode?: string;
      transactionTitle?: string;
      createdAt: string;
    }) => {
      console.log('[Admin Chat] 🆕 New room created by user:', data);
      
      // Fetch updated room list to get full user data
      // This is the cleanest approach to ensure we have all necessary data
      fetchChatRooms();
    });

    return () => {
      console.log('[Admin Chat] 🔌 Cleaning up Pusher connection');
      adminChannel.unbind_all();
      pusher.unsubscribe('admin-notifications');
      pusher.disconnect();
    };
  }, [user, isAdmin]);

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
        
        const userMap = new Map<string, UserWithRooms>();
        
        data.data.forEach((room: ChatRoom) => {
          const userId = room.userId._id;
          
          if (!userMap.has(userId)) {
            userMap.set(userId, {
              user: room.userId,
              rooms: [],
              totalUnread: 0,
              lastActivity: room.lastMessageAt || undefined,
            });
          }
          
          const userGroup = userMap.get(userId)!;
          
          // Only add room if it actually exists (hasRoom: true)
          if (room.hasRoom && room._id) {
            userGroup.rooms.push(room);
            userGroup.totalUnread += room.unreadCountAdmin;
            
            // Update last activity if this room has newer activity
            if (room.lastMessageAt) {
              if (!userGroup.lastActivity || new Date(room.lastMessageAt) > new Date(userGroup.lastActivity)) {
                userGroup.lastActivity = room.lastMessageAt;
              }
            }
          }
        });
        
        // Convert map to array and sort
        // Users with rooms and unread messages first, then by last activity
        const grouped = Array.from(userMap.values()).sort((a, b) => {
          // Users with rooms first
          const aHasRooms = a.rooms.length > 0;
          const bHasRooms = b.rooms.length > 0;
          if (aHasRooms !== bHasRooms) {
            return aHasRooms ? -1 : 1;
          }
          
          // Then by unread count
          if (a.totalUnread !== b.totalUnread) {
            return b.totalUnread - a.totalUnread;
          }
          
          // Then by last activity
          const dateA = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          const dateB = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          return dateB - dateA;
        });
        
        setGroupedUsers(grouped);
        console.log(`[Admin Chat] ✅ Loaded ${data.data.length} entries, grouped into ${grouped.length} users`);
        
        // Auto-expand and select first user's room on first load (only if has rooms)
        if (isFirstLoad && grouped.length > 0) {
          const firstUserWithRoom = grouped.find(g => g.rooms.length > 0);
          
          if (firstUserWithRoom) {
            setExpandedUsers(new Set([firstUserWithRoom.user._id]));
            
            // Find general chat room (preferred) or first room
            const generalRoom = firstUserWithRoom.rooms.find(r => r.roomType === 'general');
            const roomToSelect = generalRoom || firstUserWithRoom.rooms[0];
            
            if (roomToSelect && roomToSelect._id) {
              setSelectedRoom(roomToSelect);
              setSelectedRoomId(roomToSelect._id);
            }
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
          const newRoom = { ...room, ...data.data };
          setSelectedRoom(newRoom);
          setSelectedRoomId(data.data._id);
          
          // Add new room to chatRooms state locally (no fetchChatRooms to avoid refresh)
          setChatRooms(prev => [newRoom, ...prev]);
          
          // Update groupedUsers state locally
          setGroupedUsers(prev => {
            const userId = room.userId._id;
            return prev.map(userWithRooms => {
              if (userWithRooms.user._id === userId) {
                return {
                  ...userWithRooms,
                  rooms: [newRoom, ...userWithRooms.rooms],
                  totalUnread: userWithRooms.totalUnread,
                  lastActivity: newRoom.createdAt,
                };
              }
              return userWithRooms;
            });
          });
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
    // NOTE: No longer calling fetchChatRooms() to avoid refresh/loading skeleton
    // The Pusher event handler on the global channel already updates
    // chatRooms and groupedUsers state locally when new messages arrive
    console.log('[Admin Chat] 📝 handleNewMessage called (no fetch needed - handled by Pusher)');
  };

  // Toggle chat room status (activate/deactivate)
  const handleToggleRoomStatus = async () => {
    if (!selectedRoom || !selectedRoomId || togglingStatus) return;

    const newStatus = selectedRoom.status === 'active' ? 'closed' : 'active';
    const action = newStatus === 'closed' ? 'menonaktifkan' : 'mengaktifkan';
    
    if (!confirm(`Apakah Anda yakin ingin ${action} chat ini?`)) {
      return;
    }

    setTogglingStatus(true);

    try {
      const response = await fetch(`/api/chat/rooms/${selectedRoomId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        // Update selected room state
        setSelectedRoom(prev => prev ? {
          ...prev,
          status: newStatus,
          deactivatedAt: newStatus === 'closed' ? new Date().toISOString() : undefined,
          deactivatedBy: newStatus === 'closed' ? 'admin' : undefined,
        } : null);

        // Update chatRooms state locally (no fetchChatRooms to avoid refresh)
        setChatRooms(prev => prev.map(room => 
          room._id === selectedRoomId 
            ? { 
                ...room, 
                status: newStatus,
                deactivatedAt: newStatus === 'closed' ? new Date().toISOString() : undefined,
                deactivatedBy: newStatus === 'closed' ? 'admin' : undefined,
              } 
            : room
        ));
        
        // Update groupedUsers state locally
        setGroupedUsers(prev => prev.map(userWithRooms => ({
          ...userWithRooms,
          rooms: userWithRooms.rooms.map(room => 
            room._id === selectedRoomId 
              ? { 
                  ...room, 
                  status: newStatus,
                  deactivatedAt: newStatus === 'closed' ? new Date().toISOString() : undefined,
                  deactivatedBy: newStatus === 'closed' ? 'admin' : undefined,
                } 
              : room
          ),
        })));
        
        console.log(`[Admin Chat] ✅ Room status changed to '${newStatus}'`);
      } else {
        alert(data.error || 'Gagal mengubah status chat');
      }
    } catch (error) {
      console.error('[Admin Chat] ❌ Error toggling room status:', error);
      alert('Terjadi kesalahan saat mengubah status chat');
    } finally {
      setTogglingStatus(false);
    }
  };

  // Mark all messages as read
  const handleMarkAsRead = async () => {
    if (!selectedRoomId || markingAsRead) return;

    setMarkingAsRead(true);
    try {
      const response = await fetch(`/api/chat/rooms/${selectedRoomId}/read`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Update local state
        setSelectedRoom(prev => prev ? { ...prev, unreadCountAdmin: 0 } : null);
        
        // Update room list
        setChatRooms(prev => prev.map(room => 
          room._id === selectedRoomId ? { ...room, unreadCountAdmin: 0 } : room
        ));
        
        // Update grouped users
        setGroupedUsers(prev => prev.map(userGroup => ({
          ...userGroup,
          rooms: userGroup.rooms.map(room => 
            room._id === selectedRoomId ? { ...room, unreadCountAdmin: 0 } : room
          ),
          totalUnread: userGroup.rooms.reduce((sum, room) => 
            sum + (room._id === selectedRoomId ? 0 : room.unreadCountAdmin), 0
          )
        })));

        // Also clear new message indicator
        setNewMessageRooms(prev => {
          const newSet = new Set(prev);
          newSet.delete(selectedRoomId);
          return newSet;
        });

        console.log('[Admin Chat] ✅ Messages marked as read');
      }
    } catch (error) {
      console.error('[Admin Chat] ❌ Error marking as read:', error);
    } finally {
      setMarkingAsRead(false);
    }
  };

  // Delete a single chat room
  const handleDeleteRoom = async (roomId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // Prevent triggering room selection
    }
    
    if (!roomId || deletingRoom) return;

    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus chat room ini? Semua pesan akan dihapus secara permanen.');
    if (!confirmDelete) return;

    setDeletingRoom(roomId);
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // If deleted room was selected, clear selection
        if (selectedRoomId === roomId) {
          setSelectedRoom(null);
          setSelectedRoomId(null);
        }

        // Update chat rooms state
        setChatRooms(prev => prev.filter(room => room._id !== roomId));

        // Update grouped users - remove room and recalculate
        setGroupedUsers(prev => prev.map(userGroup => {
          const updatedRooms = userGroup.rooms.filter(room => room._id !== roomId);
          return {
            ...userGroup,
            rooms: updatedRooms,
            totalUnread: updatedRooms.reduce((sum, room) => sum + room.unreadCountAdmin, 0),
          };
        }));

        console.log('[Admin Chat] ✅ Room deleted successfully');
      } else {
        const data = await response.json();
        alert(`Gagal menghapus chat room: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[Admin Chat] ❌ Error deleting room:', error);
      alert('Terjadi kesalahan saat menghapus chat room');
    } finally {
      setDeletingRoom(null);
    }
  };

  // Delete all chat rooms
  const handleDeleteAllRooms = async () => {
    if (deletingAll) return;

    setDeletingAll(true);
    try {
      const response = await fetch('/api/chat/rooms', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        
        console.log(`[Admin Chat] ✅ Deleted ${data.deletedRoomsCount} rooms and ${data.deletedMessagesCount} messages`);
        
        // Refresh the page to show updated user list
        window.location.reload();
      } else {
        const data = await response.json();
        alert(`Gagal menghapus semua chat: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('[Admin Chat] ❌ Error deleting all rooms:', error);
      alert('Terjadi kesalahan saat menghapus semua chat');
    } finally {
      setDeletingAll(false);
      setShowDeleteAllConfirm(false);
    }
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
      <div className="h-[calc(100vh-120px)] relative">
        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 w-80 z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          showMobileSidebar ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="h-full bg-[#1e293b] border-r border-[#334155] flex flex-col">
            {/* Mobile Sidebar Header */}
            <div className="p-4 border-b border-[#334155] bg-[#0f172a]">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[#f1f5f9] font-bold text-sm">Chat Users</h2>
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 text-[#94a3b8] hover:text-[#f1f5f9]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Mobile Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari user..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg pl-10 pr-4 py-2 text-sm text-[#f1f5f9] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {/* Mobile Delete All Button */}
              {chatRooms.length > 0 && (
                <button
                  onClick={() => {
                    setShowMobileSidebar(false);
                    setShowDeleteAllConfirm(true);
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/50 rounded-lg text-xs font-medium transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Hapus Semua Chat</span>
                </button>
              )}
            </div>

            {/* Mobile Chat Rooms List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
                </div>
              ) : groupedUsers.length === 0 ? (
                <div className="p-4 text-center text-[#64748b]">
                  <p className="text-sm">Tidak ada user ditemukan</p>
                </div>
              ) : (
                <div className="divide-y divide-[#334155]">
                  {groupedUsers.map((userGroup) => {
                    // Check if user has any active chat rooms
                    const hasActiveRooms = userGroup.rooms.some(room => room.status === 'active');
                    const activeRoomsCount = userGroup.rooms.filter(room => room.status === 'active').length;
                    
                    return (
                    <div key={userGroup.user._id} className={`${
                      hasActiveRooms 
                        ? 'border-l-4 border-l-green-500/70' 
                        : userGroup.rooms.length > 0 
                          ? 'border-l-4 border-l-red-500/30' 
                          : 'border-l-4 border-l-transparent'
                    }`}>
                      {/* User Header */}
                      <button
                        onClick={() => toggleUserExpand(userGroup.user._id)}
                        className={`w-full p-3 text-left hover:bg-[#334155] transition-all ${
                          hasActiveRooms ? 'bg-green-900/5' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="relative">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 transition-all ${
                                hasActiveRooms 
                                  ? 'bg-green-500/30 ring-2 ring-green-500/50 shadow-lg shadow-green-500/20' 
                                  : userGroup.rooms.length > 0 && !hasActiveRooms
                                    ? 'bg-red-500/20 ring-2 ring-red-500/30'
                                    : 'bg-white/20'
                              }`}>
                                {(userGroup.user.fullName || userGroup.user.username || "U").charAt(0).toUpperCase()}
                              </div>
                              {userGroup.rooms.some(room => room._id && newMessageRooms.has(room._id)) && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1e293b] animate-pulse"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-[#f1f5f9] text-sm truncate">
                                  {userGroup.user.fullName || userGroup.user.username}
                                </p>
                                {/* User-level status badge for mobile */}
                                {userGroup.rooms.length > 0 && (
                                  <span className={`px-1 py-0.5 rounded text-[8px] font-semibold flex-shrink-0 ${
                                    hasActiveRooms
                                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}>
                                    {hasActiveRooms ? `${activeRoomsCount}` : '✕'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#94a3b8]">{userGroup.rooms.length} chat</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {userGroup.totalUnread > 0 && (
                              <span className="bg-[#3b82f6] text-white text-xs rounded-full px-2 py-0.5 font-bold">
                                {userGroup.totalUnread}
                              </span>
                            )}
                            <svg className={`w-4 h-4 text-[#64748b] transition-transform ${expandedUsers.has(userGroup.user._id) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </button>

                      {/* Expanded Room List */}
                      {expandedUsers.has(userGroup.user._id) && (
                        <div className="bg-[#0f172a]">
                          {userGroup.rooms.length === 0 ? (
                            <div className="p-3 pl-12">
                              <button
                                onClick={() => {
                                  handleRoomClick({
                                    _id: null,
                                    userId: userGroup.user,
                                    roomType: 'general',
                                    unreadCountAdmin: 0,
                                    unreadCountUser: 0,
                                    status: 'closed',
                                    createdAt: new Date().toISOString(),
                                    hasRoom: false,
                                  });
                                  setShowMobileSidebar(false);
                                }}
                                className="w-full px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Mulai Chat
                              </button>
                            </div>
                          ) : (
                            userGroup.rooms.map((room) => (
                              <div 
                                key={room._id || `${userGroup.user._id}-${room.roomType}`}
                                className="relative"
                              >
                                <button
                                  onClick={() => {
                                    handleRoomClick(room);
                                    setShowMobileSidebar(false);
                                  }}
                                  className={`w-full p-3 pl-12 pr-10 text-left transition-all ${
                                    selectedRoomId === room._id
                                      ? room.roomType === 'order' ? 'bg-emerald-500/20' : 'bg-purple-500/20'
                                      : room.status !== 'active'
                                        ? 'bg-red-900/10 opacity-70'
                                        : 'hover:bg-[#334155]/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                        room.roomType === 'order'
                                          ? 'bg-emerald-500/20 text-emerald-400'
                                          : 'bg-purple-500/20 text-purple-400'
                                      }`}>
                                        {room.roomType === 'order' ? 'Order' : 'General'}
                                      </span>
                                      {/* Status Badge */}
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        room.status === 'active'
                                          ? 'bg-green-500/20 text-green-400'
                                          : room.status === 'archived'
                                            ? 'bg-gray-500/20 text-gray-400'
                                            : 'bg-red-500/20 text-red-400'
                                      }`}>
                                        {room.status === 'active' ? '●' : room.status === 'archived' ? '●' : '●'}
                                      </span>
                                    </div>
                                    {room.unreadCountAdmin > 0 && (
                                      <span className="bg-[#3b82f6] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                        {room.unreadCountAdmin}
                                      </span>
                                    )}
                                  </div>
                                  {room.lastMessage && (
                                    <p className="text-xs text-[#64748b] truncate mt-1">{room.lastMessage}</p>
                                  )}
                                </button>
                                {/* Mobile Delete Button */}
                                {room._id && (
                                  <button
                                    onClick={(e) => handleDeleteRoom(room._id!, e)}
                                    disabled={deletingRoom === room._id}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded hover:bg-red-500/20 text-[#64748b] hover:text-red-400 transition-all"
                                    title="Hapus chat room"
                                  >
                                    {deletingRoom === room._id ? (
                                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    )}
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );})}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4 lg:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="lg:hidden p-2 rounded-lg bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-[#f1f5f9]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-[#f1f5f9]">Chat Management</h1>
                <p className="text-[#94a3b8] text-xs lg:text-sm mt-0.5 lg:mt-1 hidden sm:block">
                  Kelola percakapan dengan pelanggan
                </p>
              </div>
            </div>
          
          {/* Quick Stats */}
          <div className="flex gap-2 lg:gap-4 items-center">
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg px-2 lg:px-4 py-1.5 lg:py-2">
              <div className="text-[10px] lg:text-xs text-[#94a3b8]">Users</div>
              <div className="text-base lg:text-xl font-bold text-[#f1f5f9]">{groupedUsers.length}</div>
            </div>
            <div className="bg-[#1e293b] border border-[#334155] rounded-lg px-2 lg:px-4 py-1.5 lg:py-2">
              <div className="text-[10px] lg:text-xs text-[#94a3b8]">Unread</div>
              <div className="text-base lg:text-xl font-bold text-[#3b82f6]">
                {groupedUsers.reduce((sum, u) => sum + u.totalUnread, 0)}
              </div>
            </div>
            {/* Delete All Button */}
            {chatRooms.length > 0 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/50 hover:border-red-600 rounded-lg text-xs font-medium transition-all"
                title="Hapus Semua Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Hapus Semua</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg h-[calc(100%-60px)] lg:h-[calc(100%-80px)] flex">
        {/* Chat Room List - Left Sidebar (Desktop Only) */}
        <div className="hidden lg:flex w-80 border-r border-[#334155] flex-col">
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
                {groupedUsers.map((userGroup) => {
                  // Check if user has any active chat rooms
                  const hasActiveRooms = userGroup.rooms.some(room => room.status === 'active');
                  const activeRoomsCount = userGroup.rooms.filter(room => room.status === 'active').length;
                  
                  return (
                  <div key={userGroup.user._id} className={`${
                    hasActiveRooms 
                      ? 'border-l-4 border-l-green-500/70' 
                      : userGroup.rooms.length > 0 
                        ? 'border-l-4 border-l-red-500/30' 
                        : 'border-l-4 border-l-transparent'
                  }`}>
                    {/* User Header */}
                    <button
                      onClick={() => toggleUserExpand(userGroup.user._id)}
                      className={`w-full p-4 text-left hover:bg-[#334155] transition-all duration-200 ${
                        hasActiveRooms ? 'bg-green-900/5' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 transition-all ${
                              hasActiveRooms 
                                ? 'bg-green-500/30 ring-2 ring-green-500/50 shadow-lg shadow-green-500/20' 
                                : userGroup.rooms.length > 0 && !hasActiveRooms
                                  ? 'bg-red-500/20 ring-2 ring-red-500/30'
                                  : 'bg-white/20'
                            }`}>
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
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-[#f1f5f9] truncate">
                                {highlightText(
                                  userGroup.user.fullName || userGroup.user.username,
                                  search
                                )}
                              </p>
                              {/* User-level status badge */}
                              {userGroup.rooms.length > 0 && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${
                                  hasActiveRooms
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {hasActiveRooms ? `${activeRoomsCount} Aktif` : 'Semua Nonaktif'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#94a3b8] truncate">
                              {userGroup.rooms.length > 0 
                                ? `${userGroup.rooms.length} chat room${userGroup.rooms.length > 1 ? 's' : ''}`
                                : 'Belum ada chat'
                              }
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
                        {/* Show "Create Chat" button if user has no rooms */}
                        {userGroup.rooms.length === 0 ? (
                          <div className="p-4 pl-14">
                            <div className="flex flex-col items-center justify-center py-4 text-center">
                              <div className="bg-[#1e293b] rounded-full p-3 mb-3">
                                <svg className="w-6 h-6 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              </div>
                              <p className="text-sm text-[#94a3b8] mb-3">Belum ada percakapan dengan user ini</p>
                              <button
                                onClick={() => handleRoomClick({
                                  _id: null,
                                  userId: userGroup.user,
                                  roomType: 'general',
                                  unreadCountAdmin: 0,
                                  unreadCountUser: 0,
                                  status: 'closed',
                                  createdAt: new Date().toISOString(),
                                  hasRoom: false,
                                })}
                                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors border border-purple-500/30 flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Mulai Chat
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Existing rooms list */
                          userGroup.rooms.map((room, index) => (
                          <div key={room._id || `${userGroup.user._id}-${room.roomType}`} className="group">
                            <button
                              onClick={() => handleRoomClick(room)}
                              className={`w-full p-4 pl-14 text-left transition-all duration-200 relative ${
                                selectedRoomId === room._id
                                  ? room.roomType === 'order'
                                    ? 'bg-emerald-500/20 border-l-4 border-l-emerald-500'
                                    : 'bg-purple-500/20 border-l-4 border-l-purple-500'
                                  : room.status !== 'active'
                                    ? 'bg-red-900/10 border-l-4 border-l-red-500/50 opacity-70'
                                    : 'border-l-4 border-l-transparent bg-transparent'
                              } hover:bg-[#334155]/50`}
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
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                        room.roomType === 'order'
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                      }`}>
                                        {room.roomType === 'order' ? 'Order Support' : 'General Support'}
                                      </span>
                                      {/* Status Badge */}
                                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                        room.status === 'active'
                                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                          : room.status === 'archived'
                                            ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      }`}>
                                        {room.status === 'active' ? '● Aktif' : room.status === 'archived' ? '● Arsip' : '● Nonaktif'}
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
                                  <div className="flex items-center gap-1">
                                    {room.lastMessageAt && (
                                      <span className="text-xs text-[#64748b] font-medium">
                                        {formatTime(room.lastMessageAt)}
                                      </span>
                                    )}
                                    {/* Delete Room Button */}
                                    {room._id && (
                                      <button
                                        onClick={(e) => handleDeleteRoom(room._id!, e)}
                                        disabled={deletingRoom === room._id}
                                        className="p-1 rounded hover:bg-red-500/20 text-[#64748b] hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                                        title="Hapus chat room"
                                      >
                                        {deletingRoom === room._id ? (
                                          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                          </svg>
                                        ) : (
                                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        )}
                                      </button>
                                    )}
                                  </div>
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
                        ))
                        )}
                      </div>
                    )}
                  </div>
                );})}
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages - Right Panel */}
        <div className="flex-1 flex flex-col">
          {selectedRoom && selectedRoomId ? (
            <>
              {/* Chat Header */}
              <div className="p-2 lg:p-4 border-b border-[#334155] flex items-center justify-between">
                <div className="flex items-center gap-2 lg:gap-3">
                  {/* Mobile Menu Button */}
                  <button
                    onClick={() => setShowMobileSidebar(true)}
                    className="lg:hidden p-1.5 rounded-lg bg-[#0f172a] text-[#94a3b8] hover:text-[#f1f5f9]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm lg:text-base">
                    {(
                      selectedRoom.userId?.fullName ||
                      selectedRoom.userId?.username ||
                      "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 lg:gap-2">
                      <h3 className="font-semibold text-[#f1f5f9] text-sm lg:text-base truncate max-w-[100px] lg:max-w-none">
                        {selectedRoom.userId?.fullName ||
                          selectedRoom.userId?.username}
                      </h3>
                      <span className={`px-1.5 lg:px-2 py-0.5 rounded text-[10px] lg:text-xs font-semibold ${
                        selectedRoom.roomType === 'order'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {selectedRoom.roomType === 'order' ? 'Order' : 'General'}
                      </span>
                    </div>
                    <p className="text-[10px] lg:text-xs text-[#64748b] truncate max-w-[150px] lg:max-w-none">
                      {selectedRoom.roomType === 'order' && selectedRoom.transactionCode
                        ? `${selectedRoom.transactionTitle || selectedRoom.transactionCode}`
                        : selectedRoom.userId?.email}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 lg:gap-2 items-center">
                  {/* Mark as Read Button */}
                  {selectedRoom.unreadCountAdmin > 0 && (
                    <button
                      onClick={handleMarkAsRead}
                      disabled={markingAsRead}
                      className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all duration-200 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700/50 hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Tandai Sudah Dibaca"
                    >
                      {markingAsRead ? (
                        <svg className="animate-spin h-3 w-3 lg:h-3.5 lg:w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <>
                          <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="hidden sm:inline">Tandai Dibaca</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Toggle Status Button */}
                  <button
                    onClick={handleToggleRoomStatus}
                    disabled={togglingStatus}
                    className={`flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all duration-200 ${
                      selectedRoom.status === 'active'
                        ? 'bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/50 hover:border-red-600'
                        : 'bg-green-900/30 hover:bg-green-900/50 text-green-300 border border-green-700/50 hover:border-green-600'
                    } ${togglingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={selectedRoom.status === 'active' ? 'Nonaktifkan Chat' : 'Aktifkan Kembali Chat'}
                  >
                    {togglingStatus ? (
                      <svg className="animate-spin h-3 w-3 lg:h-3.5 lg:w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : selectedRoom.status === 'active' ? (
                      <>
                        <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <span className="hidden sm:inline">Nonaktifkan</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline">Aktifkan</span>
                      </>
                    )}
                  </button>

                  {/* Delete Room Button */}
                  <button
                    onClick={() => selectedRoomId && handleDeleteRoom(selectedRoomId)}
                    disabled={deletingRoom === selectedRoomId}
                    className="flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1 lg:py-1.5 rounded-lg text-[10px] lg:text-xs font-medium transition-all duration-200 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-700/50 hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Hapus Chat Room"
                  >
                    {deletingRoom === selectedRoomId ? (
                      <svg className="animate-spin h-3 w-3 lg:h-3.5 lg:w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <>
                        <svg className="w-3 h-3 lg:w-3.5 lg:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="hidden sm:inline">Hapus</span>
                      </>
                    )}
                  </button>

                  {/* Status Badge - Hidden on very small screens */}
                  <span
                    className={`hidden sm:inline-flex px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-[10px] lg:text-xs font-medium ${
                      selectedRoom.status === "active"
                        ? "bg-green-900/50 text-green-300 border border-green-700"
                        : selectedRoom.status === "closed"
                        ? "bg-red-900/50 text-red-300 border border-red-700"
                        : "bg-gray-700 text-gray-300 border border-gray-600"
                    }`}
                  >
                    {selectedRoom.status === 'active' ? 'Aktif' : selectedRoom.status === 'closed' ? 'Nonaktif' : selectedRoom.status}
                  </span>
                </div>
              </div>

              {/* Chat Messages Component */}
              <div className="flex-1 overflow-hidden">
                <ChatMessages
                  roomId={selectedRoomId}
                  currentUserId={user.id}
                  onNewMessage={handleNewMessage}
                  roomStatus={selectedRoom.status}
                  onStatusChange={(newStatus) => {
                    setSelectedRoom(prev => prev ? { ...prev, status: newStatus } : null);
                    // Update chatRooms state locally (no fetchChatRooms to avoid refresh)
                    setChatRooms(prev => prev.map(room => 
                      room._id === selectedRoomId 
                        ? { ...room, status: newStatus } 
                        : room
                    ));
                    // Update groupedUsers state locally
                    setGroupedUsers(prev => prev.map(userWithRooms => ({
                      ...userWithRooms,
                      rooms: userWithRooms.rooms.map(room => 
                        room._id === selectedRoomId 
                          ? { ...room, status: newStatus } 
                          : room
                      ),
                    })));
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#64748b]">
              <div className="text-center px-4">
                <div className="relative inline-block mb-4 lg:mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 blur-2xl opacity-20 animate-pulse"></div>
                  <div className="relative bg-[#1e293b] rounded-full p-6 lg:p-8">
                    <svg className="w-12 h-12 lg:w-16 lg:h-16 text-[#475569]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                </div>
                <p className="text-base lg:text-lg font-semibold text-[#94a3b8] mb-2">Pilih chat room</p>
                <p className="text-xs lg:text-sm text-[#64748b] mb-4 lg:mb-6 max-w-sm mx-auto">
                  Pilih percakapan dari daftar untuk mulai chat dengan pelanggan
                </p>
                {/* Mobile: Show button to open sidebar */}
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="lg:hidden bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mb-4"
                >
                  Lihat Daftar Chat
                </button>
                {/* Desktop: Show keyboard shortcut */}
                <div className="hidden lg:inline-flex items-center gap-2 px-4 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-xs text-[#94a3b8]">
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

    {/* Delete All Confirmation Modal */}
    {showDeleteAllConfirm && (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/20 rounded-full">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#f1f5f9]">Hapus Semua Chat</h3>
              <p className="text-sm text-[#94a3b8]">Tindakan ini tidak dapat dibatalkan</p>
            </div>
          </div>
          
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-300">
              Anda akan menghapus <span className="font-bold">{chatRooms.length} chat room</span> dan semua pesan di dalamnya secara permanen. 
              User tidak akan dapat melihat riwayat chat mereka lagi.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteAllConfirm(false)}
              disabled={deletingAll}
              className="flex-1 px-4 py-2.5 bg-[#334155] hover:bg-[#475569] text-[#f1f5f9] rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteAllRooms}
              disabled={deletingAll}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {deletingAll ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Ya, Hapus Semua</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
