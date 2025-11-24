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
  status: string;
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
  const pusherRef = useRef<Pusher | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      
      // Refresh room list to update unread counts
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      fetchTimeoutRef.current = setTimeout(() => {
        fetchChatRooms();
      }, 300);
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
    
    // Clear new message indicator for this room
    setNewMessageRooms(prev => {
      const newSet = new Set(prev);
      newSet.delete(roomId);
      return newSet;
    });
  };

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
      <div className="h-full">
        <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-10rem)] flex rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          {/* Left Sidebar - Chat Rooms List */}
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
                      className="bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/90 hover:to-neon-pink/90 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-lg hover:shadow-neon-pink/50"
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
                      className={`w-full text-left transition-all rounded-xl p-4 ${
                        selectedRoomId === room._id
                          ? 'bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-neon-pink/60 shadow-lg shadow-neon-pink/20'
                          : 'bg-gradient-to-br from-primary-700/30 to-primary-600/30 border border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            room.roomType === 'general'
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
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-fresh rounded-full border-2 border-primary-800"></div>
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
                              room.roomType === 'general'
                                ? 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30'
                                : 'bg-emerald-fresh/20 text-emerald-fresh border border-emerald-fresh/30'
                            }`}>
                              {room.roomType === 'general' ? 'General Support' : 'Order Support'}
                            </span>
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
            {/* Mobile Header - Only visible on mobile */}
            <div className="md:hidden bg-gradient-to-r from-neon-purple/30 via-neon-pink/20 to-neon-purple/30 border-b border-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-fresh rounded-full border-2 border-primary-800"></div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-sm flex items-center gap-1">
                    {selectedRoom?.roomType === 'general' ? 'General Support' : selectedRoom?.transactionCode || 'Admin Support'}
                    <svg className="w-3 h-3 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-emerald-fresh font-medium">
                    <span className="w-1.5 h-1.5 bg-emerald-fresh rounded-full animate-pulse"></span>
                    Online
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Interface - Full Height */}
            {selectedRoomId ? (
              <div className="flex-1 h-full">
                <UserChatInterface 
                  roomId={selectedRoomId}
                  currentUserId={user.id || (user as any)._id}
                  roomType={selectedRoom?.roomType}
                  transactionCode={selectedRoom?.transactionCode}
                  transactionTitle={selectedRoom?.transactionTitle}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
                <div className="text-center max-w-md px-6">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 rounded-full flex items-center justify-center border border-white/10">
                    <svg className="w-12 h-12 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Pilih Percakapan</h3>
                  <p className="text-white/60 text-sm">Pilih ruang chat dari sidebar atau buat ruang chat baru untuk memulai percakapan</p>
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
      <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-10rem)] flex rounded-2xl overflow-hidden shadow-2xl border border-white/20 animate-pulse">
        {/* Left Sidebar Skeleton */}
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
