"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import UserChatInterface from "@/components/UserChatInterface";

export default function UserChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [loadingRoom, setLoadingRoom] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login?redirect=/chat");
      return;
    }

    if (user) {
      // Get or create chat room for user
      fetchOrCreateChatRoom();
    }
  }, [user, loading]);

  const fetchOrCreateChatRoom = async () => {
    try {
      setLoadingRoom(true);
      
      // Try to get existing chat room
      const response = await fetch("/api/chat/my-room");
      const data = await response.json();

      if (data.success && data.data) {
        setRoomId(data.data._id);
      } else {
        // Create new chat room if doesn't exist
        const createResponse = await fetch("/api/chat/rooms", {
          method: "POST",
        });
        const createData = await createResponse.json();

        if (createData.success) {
          setRoomId(createData.data._id);
        }
      }
    } catch (error) {
      console.error("Error fetching/creating chat room:", error);
    } finally {
      setLoadingRoom(false);
    }
  };

  if (loading || loadingRoom) {
    return (
      <div className="h-full">
        <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-10rem)] flex rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          {/* Left Sidebar Skeleton - Hidden on mobile */}
          <div className="hidden md:flex md:w-80 lg:w-96 bg-gradient-to-b from-primary-800/95 to-primary-900/95 border-r border-white/10 flex-col backdrop-blur-sm">
            {/* Sidebar Header Skeleton */}
            <div className="p-6 border-b border-white/10 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20">
              <div className="flex items-center gap-3 mb-4">
                {/* Icon skeleton */}
                <div className="w-12 h-12 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-xl animate-pulse"></div>
                <div className="flex-1">
                  {/* Title skeleton */}
                  <div className="h-5 bg-white/10 rounded-lg w-32 mb-2 animate-pulse"></div>
                  {/* Subtitle skeleton */}
                  <div className="h-3 bg-white/10 rounded w-24 animate-pulse"></div>
                </div>
              </div>
              
              {/* Badge skeleton */}
              <div className="bg-primary-700/30 backdrop-blur-sm border border-white/10 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white/20 rounded-full animate-pulse"></div>
                  <div className="h-3 bg-white/10 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Chat Room Card Skeleton */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-4">
                {/* Active room skeleton */}
                <div className="bg-gradient-to-br from-neon-purple/10 to-neon-pink/10 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {/* Avatar skeleton */}
                    <div className="w-12 h-12 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      {/* Name skeleton */}
                      <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse"></div>
                      {/* Description skeleton */}
                      <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse"></div>
                      {/* Info skeleton */}
                      <div className="h-3 bg-white/10 rounded w-2/3 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Help card skeleton */}
                <div className="bg-primary-700/30 border border-white/10 rounded-xl p-4">
                  <div className="text-center space-y-3">
                    {/* Icon skeleton */}
                    <div className="w-12 h-12 mx-auto bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 rounded-full animate-pulse"></div>
                    {/* Title skeleton */}
                    <div className="h-4 bg-white/10 rounded w-32 mx-auto animate-pulse"></div>
                    {/* Text skeleton */}
                    <div className="space-y-1">
                      <div className="h-3 bg-white/10 rounded w-full animate-pulse"></div>
                      <div className="h-3 bg-white/10 rounded w-3/4 mx-auto animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Chat Interface Skeleton */}
          <div className="flex-1 flex flex-col bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
            {/* Mobile Header Skeleton - Only on mobile */}
            <div className="md:hidden bg-gradient-to-r from-neon-purple/30 via-neon-pink/20 to-neon-purple/30 border-b border-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                {/* Avatar skeleton */}
                <div className="w-10 h-10 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-1">
                  {/* Name skeleton */}
                  <div className="h-4 bg-white/10 rounded w-28 animate-pulse"></div>
                  {/* Status skeleton */}
                  <div className="h-3 bg-white/10 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Desktop Header Skeleton - Hidden on mobile */}
            <div className="hidden md:block bg-gradient-to-r from-neon-purple/30 via-neon-pink/20 to-neon-purple/30 border-b border-white/10 px-6 py-5 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                {/* Avatar skeleton */}
                <div className="w-12 h-12 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  {/* Title skeleton */}
                  <div className="h-5 bg-white/10 rounded w-36 animate-pulse"></div>
                  {/* Status skeleton */}
                  <div className="h-3 bg-white/10 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Messages Area Skeleton */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-b from-primary-900/50 to-primary-800/50">
              {/* Date separator skeleton */}
              <div className="flex items-center justify-center my-6">
                <div className="h-7 bg-primary-700/50 rounded-full w-28 animate-pulse"></div>
              </div>

              {/* Message bubbles skeleton - Admin message */}
              <div className="flex justify-start mb-3">
                <div className="max-w-[75%] space-y-2">
                  {/* Sender name skeleton */}
                  <div className="h-3 bg-white/10 rounded w-20 animate-pulse"></div>
                  {/* Message bubble skeleton */}
                  <div className="bg-gradient-to-br from-primary-600/80 to-primary-700/80 border border-white/10 rounded-2xl rounded-bl-md p-4 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-48 animate-pulse"></div>
                    <div className="h-4 bg-white/10 rounded w-40 animate-pulse"></div>
                    <div className="h-3 bg-white/10 rounded w-16 mt-2 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* User message skeleton */}
              <div className="flex justify-end mb-3">
                <div className="max-w-[75%]">
                  <div className="bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-2xl rounded-br-md p-4 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-36 animate-pulse"></div>
                    <div className="h-3 bg-white/10 rounded w-16 ml-auto mt-2 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Admin message skeleton */}
              <div className="flex justify-start mb-3">
                <div className="max-w-[75%] space-y-2">
                  <div className="h-3 bg-white/10 rounded w-20 animate-pulse"></div>
                  <div className="bg-gradient-to-br from-primary-600/80 to-primary-700/80 border border-white/10 rounded-2xl rounded-bl-md p-4 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-56 animate-pulse"></div>
                    <div className="h-3 bg-white/10 rounded w-16 mt-2 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* User message skeleton */}
              <div className="flex justify-end mb-3">
                <div className="max-w-[75%]">
                  <div className="bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-2xl rounded-br-md p-4 space-y-2">
                    <div className="h-4 bg-white/10 rounded w-44 animate-pulse"></div>
                    <div className="h-4 bg-white/10 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-white/10 rounded w-16 ml-auto mt-2 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Loading indicator */}
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-neon-purple/20 mx-auto"></div>
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 animate-spin rounded-full h-10 w-10 border-4 border-neon-pink border-t-transparent"></div>
                  </div>
                  <p className="text-white/60 text-sm font-medium">
                    {loading ? "Memuat..." : "Menyiapkan Chat..."}
                  </p>
                </div>
              </div>
            </div>

            {/* Input Area Skeleton */}
            <div className="border-t border-white/10 p-5 bg-gradient-to-r from-primary-800 to-primary-900 backdrop-blur-sm">
              <div className="flex gap-3">
                {/* Input skeleton */}
                <div className="flex-1 bg-gradient-to-r from-primary-700/50 to-primary-600/50 border border-white/10 rounded-xl px-5 py-3.5 animate-pulse">
                  <div className="h-5 bg-white/10 rounded w-48"></div>
                </div>
                {/* Button skeleton */}
                <div className="bg-gradient-to-r from-neon-purple/30 to-neon-pink/30 rounded-xl px-7 py-3.5 w-24 animate-pulse"></div>
              </div>
              {/* Helper text skeleton */}
              <div className="h-3 bg-white/10 rounded w-64 mx-auto mt-3 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!roomId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center border border-red-500/40">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">
            Gagal Membuat Room Chat
          </h3>
          <p className="text-white/60 mb-6">Terjadi kesalahan saat menyiapkan ruang chat Anda. Silakan coba lagi.</p>
          <button
            onClick={fetchOrCreateChatRoom}
            className="bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/90 hover:to-neon-pink/90 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg hover:shadow-neon-pink/50 transform hover:scale-105"
          >
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="h-[calc(100vh-10rem)] md:h-[calc(100vh-10rem)] flex rounded-2xl overflow-hidden shadow-2xl border border-white/20">
        {/* Left Sidebar - Chat Rooms List */}
        <div className="hidden md:flex md:w-80 lg:w-96 bg-gradient-to-b from-primary-800/95 to-primary-900/95 border-r border-white/10 flex-col backdrop-blur-sm">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-white/10 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-neon-purple to-neon-pink rounded-xl flex items-center justify-center shadow-lg glow-neon-pink">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Chat Rooms</h2>
                <p className="text-white/60 text-xs">Support Chat</p>
              </div>
            </div>
            
            {/* Info badges */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-primary-700/30 backdrop-blur-sm border border-emerald-fresh/30 px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-emerald-fresh rounded-full animate-pulse"></div>
                <span className="text-emerald-fresh text-xs font-medium">Admin Online</span>
              </div>
            </div>
          </div>

          {/* Chat Rooms List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Active Chat Room */}
            <div className="p-4">
              <div className="bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-neon-pink/60 transition-all">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-fresh rounded-full border-2 border-primary-800"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-semibold text-sm flex items-center gap-1">
                        Chat Support - {user?.firstName || user?.email?.split('@')[0] || 'User'}
                        <svg className="w-3 h-3 text-neon-pink" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </h3>
                    </div>
                    <p className="text-white/60 text-xs truncate">General Support</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Response: 2-5 min
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State / Help */}
            <div className="p-4">
              <div className="bg-primary-700/30 border border-white/10 rounded-xl p-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-neon-purple/30 to-neon-pink/30 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-neon-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-white/80 font-medium text-sm mb-1">Bantuan & Tips</h4>
                  <p className="text-white/50 text-xs">
                    Tim support kami siap membantu Anda 24/7. Response time biasanya 2-5 menit.
                  </p>
                </div>
              </div>
            </div>
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
                  Admin Support
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
          <div className="flex-1 h-full">
            <UserChatInterface 
              roomId={roomId} 
              currentUserId={user.id || (user as any)._id} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
