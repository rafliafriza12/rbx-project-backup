"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import UserChatInterface from "@/components/UserChatInterface";
import CreateChatRoomModal from "@/components/CreateChatRoomModal";
import NotificationPrompt from "@/components/NotificationPrompt";
import { format } from "date-fns";
import Pusher from "pusher-js";

interface ChatRoom {
  _id: string;
  roomType: 'general' | 'order';
  transactionCode?: string;
  transactionTitle?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCountUser: number;
  status: "active" | "closed" | "archived";
  deactivatedAt?: string;
  deactivatedBy?: 'admin' | 'system';
  createdAt: string;
}

export default function UserChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMessageRooms, setNewMessageRooms] = useState<Set<string>>(new Set()); // Track rooms with new messages
  const [showMobileDropdown, setShowMobileDropdown] = useState(false); // Mobile dropdown toggle
  const pusherRef = useRef<Pusher | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/chat");
      return;
    }

    if (user) {
      fetchChatRooms();
    }
  }, [user, loading]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // Real-time notifications via Pusher
  useEffect(() => {
    if (!user) return;

    const userId = user.id || (user as any)._id;
    console.log('[User Chat] 🔌 Setting up Pusher for real-time notifications');

    // Initialize Pusher
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    pusherRef.current = pusher;

    // Subscribe to user-specific notification channel
    const userChannel = pusher.subscribe(`user-notifications-${userId}`);

    // Listen for new messages from admin
    userChannel.bind('new-message', (data: { 
      roomId: string; 
      adminId: string; 
      message: string;
      senderName?: string;
      roomType?: string;
      transactionCode?: string;
      timestamp?: string;
    }) => {
      console.log('[User Chat] 📨 New message notification from admin:', data);

      // Add to new message rooms (will show red indicator)
      setNewMessageRooms(prev => new Set(prev).add(data.roomId));
      
      // Update room list locally WITHOUT fetching (no refresh)
      // Only increment unread count and update last message
      setChatRooms(prev => prev.map(room => 
        room._id === data.roomId 
          ? { 
              ...room, 
              unreadCountUser: room.unreadCountUser + 1,
              lastMessage: data.message,
              lastMessageAt: data.timestamp || new Date().toISOString()
            } 
          : room
      )); 
    });

    // Listen for room status changes (deactivation/reactivation) - only for room list update
    // Note: System message is handled by private room channel in UserChatInterface component
    userChannel.bind('room-status-changed', (data: {
      roomId: string;
      status: string;
    }) => {
      console.log('[User Chat] 🔄 Room status changed (notification channel):', data);
      
      // Only update chat rooms list status - don't show message (handled by private channe l)
      setChatRooms(prev => prev.map(room => 
        room._id === data.roomId 
          ? { ...room, status: data.status as "active" | "closed" | "archived" } 
          : room
      ));
    });

    // Listen for room deactivation (auto-deactivate by system) - only for room list update
    // Note: System message is handled by private room channel in UserChatInterface component
    userChannel.bind('room-deactivated', (data: {
      roomId: string;
    }) => {
      console.log('[User Chat] 🔴 Room deactivated (notification channel):', data);
      
      // Only update chat rooms list status - don't show message (handled by private channel)
      setChatRooms(prev => prev.map(room => 
        room._id === data.roomId 
          ? { ...room, status: 'closed' as const } 
          : room
      ));
    });

    return () => {
      console.log('[User Chat] 🔌 Cleaning up Pusher connection');
      userChannel.unbind_all();
      pusher.unsubscribe(`user-notifications-${userId}`);
      pusher.disconnect();
    };
  }, [user]); // ✅ Persistent connection - doesn't depend on selectedRoomId

  const fetchChatRooms = async () => {
    try {
      setLoadingRooms(true);
      
      const response = await fetch("/api/chat/rooms");
      const data = await response.json();

      if (data.success) {
        setChatRooms(data.data || []);
        
        // Auto-select first room if available
        if (data.data && data.data.length > 0 && !selectedRoomId) {
          setSelectedRoomId(data.data[0]._id);
        }
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleCreateRoom = async (roomType: 'general' | 'order', transactionCode?: string, transactionTitle?: string) => {
    console.log("Creating room:", roomType, transactionCode, transactionTitle);
    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomType,
          transactionCode: roomType === 'order' ? transactionCode : null,
          transactionTitle: roomType === 'order' ? transactionTitle : null,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Gagal membuat ruang chat");
      }

      // Refresh rooms list
      await fetchChatRooms();
      
      // Select the new room
      setSelectedRoomId(data.data._id);
    } catch (error: any) {
      throw error;
    }
  };

  const handleRoomClick = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowMobileDropdown(false); // Close mobile dropdown when room is selected
    
    // Clear new message indicator for this room
    setNewMessageRooms(prev => {
      const newSet = new Set(prev);
      newSet.delete(roomId);
      return newSet;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setShowMobileDropdown(false);
      }
    };
    
    if (showMobileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileDropdown]);

  const selectedRoom = chatRooms.find(room => room._id === selectedRoomId);

  const formatTime = (date?: string) => {
    if (!date) return "";
    try {
      return format(new Date(date), "HH:mm");
    } catch {
      return "";
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "";
    try {
      const msgDate = new Date(date);
      const today = new Date();
      
      if (msgDate.toDateString() === today.toDateString()) {
        return formatTime(date);
      } else {
        return format(msgDate, "dd/MM/yy");
      }
    } catch {
      return "";
    }
  };

  if (loading || loadingRooms) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <NotificationPrompt />
      <div className="h-full relative">
        {/* Mobile Dropdown Chat Rooms Selector - Above Chat Interface */}
        <div className="md:hidden mb-3" ref={mobileDropdownRef}>
          <div className="bg-gradient-to-r from-primary-800/95 to-primary-900/95 rounded-xl border border-white/20 overflow-hidden backdrop-blur-sm shadow-xl">
            {/* Dropdown Header - Always Visible */}
            <div 
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => setShowMobileDropdown(!showMobileDropdown)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Selected Room Preview */}
                {selectedRoom ? (
                  <>
                    <div className="relative flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedRoom.status !== 'active'
                          ? 'bg-gradient-to-br from-gray-500/80 to-gray-600'
                          : selectedRoom.roomType === 'general'
                            ? 'bg-gradient-to-br from-neon-purple to-neon-pink'
                            : 'bg-gradient-to-br from-emerald-fresh/80 to-emerald-fresh'
                      }`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {selectedRoom.roomType === 'general' ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          )}
                        </svg>
                      </div>
                      {/* Status indicator */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-primary-800 ${
                        selectedRoom.status === 'active' ? 'bg-emerald-fresh' : 'bg-gray-500'
                      }`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm truncate">
                        {selectedRoom.roomType === 'general' 
                          ? 'General Support' 
                          : `Order ${selectedRoom.transactionCode?.slice(-8) || 'Support'}`}
                      </h3>
                      <p className="text-white/50 text-xs truncate">
                        {selectedRoom.lastMessage || 'Mulai percakapan...'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple/40 to-neon-pink/40 flex items-center justify-center">
                      <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white/60 font-semibold text-sm">Pilih Chat Room</h3>
                      <p className="text-white/40 text-xs">{chatRooms.length} percakapan tersedia</p>
                    </div>
                  </>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Total unread badge */}
                {(chatRooms.some(r => r.unreadCountUser > 0) || newMessageRooms.size > 0) && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {chatRooms.reduce((sum, r) => sum + r.unreadCountUser, 0) + newMessageRooms.size}
                    </span>
                  </div>
                )}
                
                {/* Add new chat button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateModal(true);
                  }}
                  className="p-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-pink text-white shadow-lg hover:shadow-neon-pink/30 transition-all"
                  title="Tambah Chat Baru"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                {/* Dropdown toggle icon */}
                <div className={`p-1.5 rounded-lg bg-white/10 transition-transform duration-300 ${showMobileDropdown ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Dropdown Content - Chat Rooms List */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              showMobileDropdown ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="border-t border-white/10">
                {chatRooms.length === 0 ? (
                  <div className="p-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-medium text-sm mb-1">Belum Ada Percakapan</h4>
                    <p className="text-white/50 text-xs mb-3">Tap + untuk membuat chat baru</p>
                    <button
                      onClick={() => {
                        setShowMobileDropdown(false);
                        setShowCreateModal(true);
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                    >
                      Buat Chat Baru
                    </button>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto custom-scrollbar">
                    <div className="p-2 space-y-1.5">
                      {chatRooms.map((room) => (
                        <button
                          key={room._id}
                          onClick={() => handleRoomClick(room._id)}
                          className={`w-full text-left transition-all rounded-lg p-2.5 ${
                            selectedRoomId === room._id
                              ? 'bg-gradient-to-br from-neon-purple/25 to-neon-pink/25 border border-neon-pink/60'
                              : room.status !== 'active'
                                ? 'bg-gradient-to-br from-gray-700/20 to-gray-600/20 border border-white/5 opacity-60'
                                : 'bg-gradient-to-br from-primary-700/20 to-primary-600/20 border border-white/10 active:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="relative flex-shrink-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                                room.status !== 'active'
                                  ? 'bg-gradient-to-br from-gray-500/80 to-gray-600'
                                  : room.roomType === 'general'
                                    ? 'bg-gradient-to-br from-neon-purple to-neon-pink'
                                    : 'bg-gradient-to-br from-emerald-fresh/80 to-emerald-fresh'
                              }`}>
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {room.roomType === 'general' ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                  )}
                                </svg>
                              </div>
                              {/* New message indicator */}
                              {(newMessageRooms.has(room._id) || room.unreadCountUser > 0) && (
                                <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border-2 border-primary-800">
                                  {newMessageRooms.has(room._id) && <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>}
                                  <span className="relative text-white text-[9px] font-bold">
                                    {newMessageRooms.has(room._id) ? '!' : room.unreadCountUser}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                    room.roomType === 'general'
                                      ? 'bg-neon-purple/20 text-neon-purple'
                                      : 'bg-emerald-fresh/20 text-emerald-fresh'
                                  }`}>
                                    {room.roomType === 'general' ? 'General' : 'Order'}
                                  </span>
                                  {room.status !== 'active' && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-400">
                                      Tidak Aktif
                                    </span>
                                  )}
                                </div>
                                {room.lastMessageAt && (
                                  <span className="text-[10px] text-white/40">{formatDate(room.lastMessageAt)}</span>
                                )}
                              </div>
                              <p className="text-white/60 text-xs truncate mt-0.5">
                                {room.lastMessage || 'Mulai percakapan...'}
                              </p>
                            </div>
                            {/* Selected indicator */}
                            {selectedRoomId === room._id && (
                              <svg className="w-4 h-4 text-neon-pink flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Container - Responsive Height */}
        <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-10rem)] flex rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          {/* Left Sidebar - Chat Rooms List (Desktop Only) */}
          <div className="hidden md:flex md:w-80 lg:w-96 bg-gradient-to-b from-primary-800/95 to-primary-900/95 border-r border-white/10 flex-col backdrop-blur-sm">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-neon-purple to-neon-pink rounded-xl flex items-center justify-center shadow-lg glow-neon-pink">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base">Chat Rooms</h2>
                    <p className="text-white/60 text-xs">{chatRooms.length} percakapan</p>
                  </div>
                </div>
                
                {/* Add Chat Button */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex gap-2 items-center px-4 py-2.5 text-xs font-semibold border border-white/20 rounded-xl text-white shadow-lg hover:shadow-gray-500/20 transition-all transform whitespace-nowrap"
                  title="Buat Chat Baru"
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tambah Chat</span>
                </button>
              </div>
            </div>

            {/* Chat Rooms List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {chatRooms.length === 0 ? (
                <div className="p-6">
                  <div className="bg-primary-700/30 border border-white/10 rounded-xl p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h4 className="text-white font-medium text-sm mb-2">Belum Ada Percakapan</h4>
                    <p className="text-white/50 text-xs mb-4">
                      Klik tombol + di atas untuk membuat ruang chat baru
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-gray-500 hover:from-neon-purple/90 hover:to-neon-pink/90 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-lg hover:shadow-neon-pink/50"
                    >
                      Buat Chat Sekarang
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {chatRooms.map((room) => (
                    <button
                      key={room._id}
                      onClick={() => handleRoomClick(room._id)}
                      className={`w-full text-left transition-all rounded-xl p-4 cursor-pointer ${
                        selectedRoomId === room._id
                          ? 'bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-pink/60 shadow-lg shadow-neon-pink/20'
                          : room.status !== 'active'
                            ? 'bg-gradient-to-br from-gray-700/30 to-gray-600/30 border border-white/5 hover:border-white/10 opacity-60'
                            : 'bg-gradient-to-br from-primary-700/30 to-primary-600/30 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            room.status !== 'active'
                              ? 'bg-gradient-to-br from-gray-500/80 to-gray-600'
                              : room.roomType === 'general'
                                ? 'bg-gradient-to-br from-neon-purple to-neon-pink'
                                : 'bg-gradient-to-br from-emerald-fresh/80 to-emerald-fresh'
                          }`}>
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {room.roomType === 'general' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              )}
                            </svg>
                          </div>
                          {/* Real-time notification indicator - RED with ping animation */}
                          {newMessageRooms.has(room._id) && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-primary-800">
                              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
                              <span className="relative text-white text-xs font-bold">!</span>
                            </div>
                          )}
                          {/* Unread count indicator (existing) - only show if no new message */}
                          {room.unreadCountUser > 0 && !newMessageRooms.has(room._id) && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-primary-800">
                              <span className="text-white text-xs font-bold">{room.unreadCountUser}</span>
                            </div>
                          )}
                          {/* Status indicator */}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-primary-800 ${
                            room.status === 'active' ? 'bg-emerald-fresh' : 'bg-gray-500'
                          }`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-semibold text-sm truncate flex items-center gap-1.5">
                              {room.roomType === 'general' ? (
                                <>
                                  Chat Support - {user?.firstName || (user as any)?.username || 'User'}
                                </>
                              ) : (
                                <>
                                  Chat for Order {room.transactionCode?.slice(-8) || 'Support'}
                                </>
                              )}
                            </h3>
                            {room.lastMessageAt && (
                              <span className="text-xs text-white/40 flex-shrink-0">{formatTime(room.lastMessageAt)}</span>
                            )}
                          </div>
                          
                          {/* Room Type Badge */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              room.status !== 'active'
                                ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                : room.roomType === 'general'
                                  ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                                  : 'bg-emerald-fresh/20 text-emerald-fresh border border-emerald-fresh/30'
                            }`}>
                              {room.roomType === 'general' ? 'General Support' : 'Order Support'}
                            </span>
                            {room.status !== 'active' && (
                              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Tidak Aktif
                              </span>
                            )}
                          </div>
                          
                          <p className="text-white/60 text-xs truncate">
                            {room.lastMessage || (room.roomType === 'general' ? 'Chat umum dengan admin' : `Order: ${room.transactionCode || 'N/A'}`)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Chat Interface */}
          <div className="flex-1 flex flex-col">
            {/* Chat Interface - Full Height */}
            {selectedRoomId ? (
              <div className="flex-1 h-full">
                <UserChatInterface 
                  roomId={selectedRoomId}
                  currentUserId={user.id || (user as any)._id}
                  roomType={selectedRoom?.roomType}
                  transactionCode={selectedRoom?.transactionCode}
                  transactionTitle={selectedRoom?.transactionTitle}
                  roomStatus={selectedRoom?.status}
                  unreadCountUser={selectedRoom?.unreadCountUser || 0}
                  onStatusChange={(newStatus) => {
                    setChatRooms(prev => prev.map(room => 
                      room._id === selectedRoomId 
                        ? { ...room, status: newStatus } 
                        : room
                    ));
                  }}
                  onMarkAsRead={() => {
                    setChatRooms(prev => prev.map(room => 
                      room._id === selectedRoomId 
                        ? { ...room, unreadCountUser: 0 } 
                        : room
                    ));
                    // Also clear new message indicator
                    setNewMessageRooms(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(selectedRoomId);
                      return newSet;
                    });
                  }}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
                <div className="text-center max-w-md px-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 md:mb-6 bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 rounded-full flex items-center justify-center border border-white/10">
                    <svg className="w-10 h-10 md:w-12 md:h-12 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-lg md:text-xl mb-2">Pilih Percakapan</h3>
                  <p className="text-white/60 text-xs md:text-sm mb-4">
                    <span className="md:hidden">Tap dropdown di atas untuk memilih chat atau buat chat baru</span>
                    <span className="hidden md:inline">Pilih ruang chat dari sidebar atau buat ruang chat baru</span>
                  </p>
                  <button
                    onClick={() => {
                      // On mobile, open dropdown first if there are rooms
                      if (chatRooms.length > 0 && window.innerWidth < 768) {
                        setShowMobileDropdown(true);
                      } else {
                        setShowCreateModal(true);
                      }
                    }}
                    className="md:hidden bg-gray-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg"
                  >
                    {chatRooms.length > 0 ? 'Pilih Chat' : 'Buat Chat Baru'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Chat Room Modal */}
      <CreateChatRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={handleCreateRoom}
        userName={user?.firstName || (user as any)?.username || 'User'}
      />
    </>
  );
}

// Loading Skeleton Component
function LoadingSkeleton() {
  return (
    <div className="h-full">
      {/* Mobile Dropdown Skeleton */}
      <div className="md:hidden mb-3">
        <div className="bg-gradient-to-r from-primary-800/95 to-primary-900/95 rounded-xl border border-white/20 p-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10"></div>
            <div className="flex-1">
              <div className="h-4 bg-white/10 rounded w-28 mb-1.5"></div>
              <div className="h-3 bg-white/10 rounded w-20"></div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-white/10"></div>
            <div className="w-8 h-8 rounded-lg bg-white/10"></div>
          </div>
        </div>
      </div>
      
      <div className="h-[calc(100vh-14rem)] md:h-[calc(100vh-10rem)] flex rounded-2xl overflow-hidden shadow-2xl border border-white/20 animate-pulse">
        {/* Left Sidebar Skeleton (Desktop) */}
        <div className="hidden md:flex md:w-80 lg:w-96 bg-gradient-to-b from-primary-800/95 to-primary-900/95 border-r border-white/10 flex-col backdrop-blur-sm">
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-xl animate-pulse"></div>
              <div className="flex-1">
                <div className="h-5 bg-white/10 rounded-lg w-32 mb-2 animate-pulse"></div>
                <div className="h-3 bg-white/10 rounded w-24 animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4 space-y-4">
              <div className="bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border border-white/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse"></div>
                    <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Skeleton */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
          <div className="hidden md:block bg-gradient-to-r from-neon-purple/30 via-neon-pink/20 to-neon-purple/30 border-b border-white/10 px-6 py-5 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-white/10 rounded w-36 animate-pulse"></div>
                <div className="h-3 bg-white/10 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-neon-purple/20 mx-auto"></div>
                <div className="absolute top-1 left-1/2 transform -translate-x-1/2 animate-spin rounded-full h-10 w-10 border-4 border-neon-pink border-t-transparent"></div>
              </div>
              <p className="text-white/60 text-sm font-medium">Memuat...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
