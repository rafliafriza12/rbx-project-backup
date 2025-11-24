"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { 
  showChatNotification, 
  shouldShowNotification, 
  getNotificationPreference 
} from "@/lib/notifications";

interface Message {
  _id: string;
  senderId: {
    _id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  senderRole: "user" | "admin";
  message: string;
  type: "text" | "image" | "file" | "system";
  isRead: boolean;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
}

interface UserChatInterfaceProps {
  roomId: string;
  currentUserId: string;
  roomType?: "general" | "order";
  transactionCode?: string;
  transactionTitle?: string;
}

export default function UserChatInterface({
  roomId,
  currentUserId,
  roomType = "general",
  transactionCode,
  transactionTitle,
}: UserChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSendTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const SEND_COOLDOWN = 500;

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const markAsRead = async () => {
    if (!roomId) return;

    try {
      await fetch(`/api/chat/rooms/${roomId}/read`, {
        method: "PUT",
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchMessages();
      markAsRead();
    }
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time updates with Pusher (PRIVATE CHANNEL)
  useEffect(() => {
    if (!roomId) return;

    console.log(`[User Pusher] 🔐 Setting up for room ${roomId}`);

    import("pusher-js")
      .then((Pusher) => {
        const pusherInstance = new Pusher.default(
          process.env.NEXT_PUBLIC_PUSHER_KEY || "",
          {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
            authEndpoint: "/api/pusher/auth",
          }
        );

        const channelName = `private-chat-room-${roomId}`;
        const channelInstance = pusherInstance.subscribe(channelName);

        pusherRef.current = pusherInstance;
        channelRef.current = channelInstance;

        channelInstance.bind("pusher:subscription_succeeded", () => {
          console.log(`[User Pusher] ✅ Subscribed to ${channelName}`);
        });

        channelInstance.bind("pusher:subscription_error", (error: any) => {
          console.error(`[User Pusher] ❌ Subscription error:`, error);
        });

        const handleNewMessage = (data: any) => {
          if (!data || !data.message) return;

          setMessages((prev) => {
            const isDuplicate = prev.some(
              (msg) => msg._id === data.message._id
            );
            if (isDuplicate) return prev;
            
            // Show notification if message is from admin (not from user itself)
            const isFromAdmin = data.message.senderRole === 'admin';
            if (isFromAdmin && shouldShowNotification() && getNotificationPreference()) {
              const senderName = data.message.senderId?.fullName || 
                                data.message.senderId?.username || 
                                'Admin';
              
              showChatNotification({
                senderName,
                message: data.message.message,
                roomId: roomId,
                isImage: data.message.type === 'image',
              }).then((shown) => {
                if (shown) {
                  console.log('[Notification] ✅ Notification shown for admin message');
                }
              });
            }
            
            return [...prev, data.message];
          });

          setTimeout(scrollToBottom, 100);
        };

        channelInstance.bind("new-message", handleNewMessage);
      })
      .catch((error) => {
        console.error("[User Pusher] ❌ Failed to load Pusher:", error);
      });

    return () => {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }

      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [roomId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/api/chat/rooms/${roomId}/messages?page=1&limit=50`
      );
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && !selectedImage) || sending) return;

    const now = Date.now();
    if (now - lastSendTimeRef.current < SEND_COOLDOWN) return;
    lastSendTimeRef.current = now;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const messageText = newMessage.trim();
    let fileUrl: string | undefined;
    let fileName: string | undefined;

    // Upload image first if selected
    if (selectedImage) {
      setUploading(true);
      try {
        const uploadFormData = new FormData();
        uploadFormData.append("file", selectedImage);

        const uploadResponse = await fetch("/api/chat/upload-image", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          alert("Gagal upload gambar. Silakan coba lagi.");
          setUploading(false);
          return;
        }

        fileUrl = uploadData.data.url;
        fileName = uploadData.data.fileName;
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Gagal upload gambar. Silakan coba lagi.");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    setSending(true);
    setNewMessage("");

    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText || (selectedImage ? "📷 Image" : ""),
          type: selectedImage ? "image" : "text",
          fileUrl: fileUrl || undefined,
          fileName: fileName || undefined,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (!data.success) {
        setNewMessage(messageText);

        if (response.status === 429) {
          alert("Terlalu banyak pesan. Mohon tunggu sebentar.");
        }
      } else {
        // Clear image states on success
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") return;
      setNewMessage(messageText);
    } finally {
      setSending(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!validTypes.includes(file.type)) {
      alert("Format file tidak didukung. Gunakan JPEG, PNG, GIF, atau WebP.");
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert("Ukuran file terlalu besar. Maksimal 5MB.");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedImage(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatTime = (date: string) => {
    try {
      return format(new Date(date), "HH:mm");
    } catch {
      return "";
    }
  };

  const formatDate = (date: string) => {
    try {
      const msgDate = new Date(date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (msgDate.toDateString() === today.toDateString()) {
        return "Hari Ini";
      } else if (msgDate.toDateString() === yesterday.toDateString()) {
        return "Kemarin";
      } else {
        return format(msgDate, "dd MMM yyyy");
      }
    } catch {
      return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[700px] bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 rounded-br-2xl border border-white/10 shadow-2xl">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-neon-purple/20 mx-auto"></div>
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 animate-spin rounded-full h-12 w-12 border-4 border-neon-pink border-t-transparent"></div>
          </div>
          <p className="text-white/80 font-medium">Memuat percakapan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br h-full from-primary-800 via-primary-700 to-primary-900 rounded-br-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Chat Header - Enhanced with gradient */}
      <div
        className={`relative border-b border-white/10 px-6 py-4 backdrop-blur-sm flex-shrink-0 ${
          roomType === "order"
            ? "bg-gradient-to-r from-emerald-fresh/20 via-emerald-fresh/10 to-emerald-fresh/20"
            : "bg-gradient-to-r from-neon-purple/30 via-neon-pink/20 to-neon-purple/30"
        }`}
      >
        {/* Decorative glow effect */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent animate-pulse pointer-events-none ${
            roomType === "order" ? "via-emerald-fresh/10" : "via-neon-pink/10"
          }`}
        ></div>

        <div className="relative">
          {roomType === "order" ? (
            // Order Support Header - Style matching the image
            <div className="space-y-2">
              {/* Title */}
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 bg-emerald-fresh/20 border border-emerald-fresh/30 rounded-md">
                  <span className="text-emerald-fresh text-xs font-semibold">
                    Order Support
                  </span>
                </div>
                <h3 className="text-white font-bold text-base truncate">
                  Order: {transactionCode}
                </h3>
              </div>

              {/* Subtitle with product name */}
              {transactionTitle && (
                <p className="text-white/70 text-sm">{transactionTitle}</p>
              )}
            </div>
          ) : (
            // General Support Header - Original style
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg glow-neon-pink bg-gradient-to-br from-neon-purple to-neon-pink">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-fresh rounded-full"></div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-0.5 bg-neon-purple/20 border border-neon-purple/30 rounded-md">
                    <span className="text-neon-purple text-xs font-semibold">
                      General Support
                    </span>
                  </div>
                </div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2 mt-1">
                  Chat Support - Admin
                  <svg
                    className="w-4 h-4 text-neon-pink"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </h3>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area - Fixed scroll behavior */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-gradient-to-b from-primary-900/50 to-primary-800/50 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="relative mb-6">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-neon-purple/20 to-neon-pink/20 rounded-full flex items-center justify-center border border-white/10">
                  <svg
                    className="w-12 h-12 text-neon-purple"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 to-neon-pink/20 rounded-full blur-2xl animate-pulse"></div>
              </div>
              <h4 className="text-white font-bold text-lg mb-2">
                Mulai Percakapan
              </h4>
              <p className="text-white/60 text-sm">
                Belum ada pesan. Kirim pesan pertama Anda dan admin kami akan
                segera merespons!
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.senderRole === "user";
              const showDate =
                index === 0 ||
                formatDate(messages[index - 1].createdAt) !==
                  formatDate(message.createdAt);

              return (
                <div key={message._id}>
                  {/* Date Separator - Enhanced design */}
                  {showDate && (
                    <div className="flex items-center justify-center my-6">
                      <div className="bg-gradient-to-r from-primary-700 to-primary-800 text-white/70 text-xs px-5 py-2 rounded-full border border-white/10 shadow-lg backdrop-blur-sm">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  )}
                  {!isOwnMessage && (
                    <div className="text-xs text-neon-purple mb-2 font-semibold flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-neon-pink rounded-full"></div>
                      {"Admin"}
                    </div>
                  )}
                  {/* Message Bubble - Enhanced styling */}
                  <div
                    className={`flex ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    } mb-3`}
                  >
                    <div
                      className={`max-w-[75%] group border border-white/20 rounded-2xl`}
                    >
                      {/* Sender Name (for admin messages) */}

                      {/* Message Content - Enhanced with animations */}
                      <div
                        className={`rounded-2xl px-5 py-3.5 shadow-lg transition-all duration-200 ${
                          isOwnMessage
                            ? "bg-gradient-to-br from-neon-purple to-neon-pink text-white rounded-br-md transform hover:scale-[1.02] shadow-neon-pink/30"
                            : "bg-gradient-to-br from-primary-600/80 to-primary-700/80 text-white border border-white/10 rounded-bl-md backdrop-blur-sm shadow-lg"
                        }`}
                      >
                        {/* Render Image if type is image */}
                        {message.type === "image" && message.fileUrl && (
                          <div className="mb-2">
                            <img
                              src={message.fileUrl}
                              alt={message.fileName || "Image"}
                              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() =>
                                window.open(message.fileUrl, "_blank")
                              }
                              style={{
                                maxHeight: "300px",
                                objectFit: "contain",
                              }}
                            />
                          </div>
                        )}

                        {/* Render text message */}
                        {message.message && message.message !== "📷 Image" && (
                          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                            {message.message}
                          </p>
                        )}

                        <div
                          className={`flex items-center gap-1.5 text-xs mt-2 ${
                            isOwnMessage
                              ? "text-white/80 justify-end"
                              : "text-white/60"
                          }`}
                        >
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {formatTime(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Input Area - Enhanced design */}
      <div className="border-t border-white/10 pb-20 pt-6 px-5 md:p-5 bg-gradient-to-r from-primary-800 to-primary-900 backdrop-blur-sm ">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 w-full relative inline-block text-center">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-52 rounded-lg border-2 border-neon-pink mx-auto"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold"
              type="button"
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex gap-3">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Image Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || uploading}
            className="bg-gradient-to-r from-primary-700/50 to-primary-600/50 hover:from-primary-700 hover:to-primary-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white px-4 py-3.5 rounded-xl font-semibold transition-all shadow-lg border border-white/10"
            title="Upload Image"
          >
            📷
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik pesan Anda..."
              className="w-full bg-gradient-to-r from-primary-700/50 to-primary-600/50 border border-white/10 rounded-xl px-5 py-3.5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-neon-pink focus:border-transparent transition-all backdrop-blur-sm shadow-inner"
              disabled={sending || uploading}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            disabled={
              (!newMessage.trim() && !selectedImage) || sending || uploading
            }
            className="bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-purple/90 hover:to-neon-pink/90 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white px-7 py-3.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-neon-pink/50 disabled:shadow-none transform hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Upload...</span>
              </>
            ) : sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Mengirim...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                <span className="hidden sm:inline">Kirim</span>
              </>
            )}
          </button>
        </form>

        {/* Helper text */}
        <p className="text-white/40 text-xs mt-3 text-center">
          Tekan Enter untuk mengirim • Admin biasanya membalas dalam beberapa
          menit
        </p>
      </div>
    </div>
  );
}
