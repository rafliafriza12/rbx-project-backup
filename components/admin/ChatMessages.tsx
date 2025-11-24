"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatMessagesProps {
  roomId: string;
  currentUserId: string;
  onNewMessage?: () => void;
}

export default function ChatMessages({
  roomId,
  currentUserId,
  onNewMessage,
}: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pusherRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastSendTimeRef = useRef<number>(0);
  const SEND_COOLDOWN = 500; // 500ms cooldown between messages
  const onNewMessageRef = useRef(onNewMessage); // Store callback in ref

  // Update ref when callback changes
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const markAsRead = useCallback(async () => {
    if (!roomId) return;
    
    try {
      await fetch(`/api/chat/rooms/${roomId}/read`, {
        method: "PUT",
      });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [roomId]);

  useEffect(() => {
    if (roomId) {
      fetchMessages();
      markAsRead();
    }
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Real-time updates with Pusher (PRIVATE CHANNEL with Authentication)
  useEffect(() => {
    if (!roomId) {
      console.log('[Pusher Setup] ⚠️ No roomId - skipping setup');
      return;
    }

    console.log(`[Pusher Setup] 🔐 Setting up PRIVATE channel for room ${roomId}`);

    // Import Pusher dynamically
    import("pusher-js").then((Pusher) => {
      console.log('[Pusher Setup] 📦 Pusher library loaded');
      console.log('[Pusher Setup] 🔧 Pusher config:', {
        key: process.env.NEXT_PUBLIC_PUSHER_KEY?.substring(0, 10) + '...',
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
        authEndpoint: '/api/pusher/auth',
      });

      // Initialize Pusher with auth endpoint
      // Auth will use HTTP-only cookie automatically (no need to send token from client)
      const pusherInstance = new Pusher.default(
        process.env.NEXT_PUBLIC_PUSHER_KEY || "",
        {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "ap1",
          authEndpoint: '/api/pusher/auth', // Auth endpoint for private channels
        }
      );

      console.log('[Pusher Setup] ✅ Pusher instance created');

      // Subscribe to PRIVATE channel (requires authentication)
      const channelName = `private-chat-room-${roomId}`;
      console.log(`[Pusher Setup] 📡 Subscribing to: ${channelName}`);
      
      const channelInstance = pusherInstance.subscribe(channelName);

      console.log('[Pusher Setup] 🔄 Subscription initiated');

      // Store in refs for cleanup
      pusherRef.current = pusherInstance;
      channelRef.current = channelInstance;

      // Handle subscription success
      channelInstance.bind('pusher:subscription_succeeded', () => {
        console.log(`[Pusher Setup] ✅ Successfully subscribed to private channel: ${channelName}`);
        console.log(`[Pusher Setup] 🎯 Now listening for "new-message" events`);
      });

      // Handle subscription error (e.g., authentication failed)
      channelInstance.bind('pusher:subscription_error', (error: any) => {
        console.error(`[Pusher Setup] ❌ Subscription failed for ${channelName}:`, error);
      });

      const handleNewMessage = (data: any) => {
        console.log('[Pusher Event] ================================================');
        console.log('[Pusher Event] 📨 Raw event received');
        console.log('[Pusher Event] Full data structure:', JSON.stringify(data, null, 2));
        
        // The backend sends: { message: Message, roomUpdate: {...} }
        if (!data || !data.message) {
          console.error('[Pusher Event] ❌ Invalid data structure - missing message field');
          console.log('[Pusher Event] ================================================');
          return;
        }
        
        console.log('[Pusher Event] Message ID:', data.message._id);
        console.log('[Pusher Event] Message data:', {
          _id: data.message._id,
          sender: data.message.senderId?.username || 'UNKNOWN',
          message: data.message.message?.substring(0, 50),
          hasPopulatedSender: !!data.message.senderId?.username,
        });
        
        setMessages((prev) => {
          // Prevent duplicates by checking message ID
          const isDuplicate = prev.some((msg) => msg._id === data.message._id);
          if (isDuplicate) {
            console.log('[Pusher Event] ⚠️ Duplicate message ignored:', data.message._id);
            console.log('[Pusher Event] ================================================');
            return prev;
          }
          
          console.log('[Pusher Event] ✅ New message added to state');
          
          // Show notification if message is from user (not from admin itself)
          const isFromUser = data.message.senderRole === 'user';
          if (isFromUser && shouldShowNotification() && getNotificationPreference()) {
            const senderName = data.message.senderId?.fullName || 
                              data.message.senderId?.username || 
                              'User';
            
            showChatNotification({
              senderName,
              message: data.message.message,
              roomId: roomId,
              isImage: data.message.type === 'image',
            }).then((shown) => {
              if (shown) {
                console.log('[Notification] ✅ Notification shown for new message');
              }
            });
          }
          
          console.log('[Pusher Event] ================================================');
          return [...prev, data.message];
        });
        
        if (onNewMessageRef.current) onNewMessageRef.current(); // Use ref instead of direct callback
        setTimeout(scrollToBottom, 100);
      };

      console.log('[Pusher Setup] 🎧 Binding "new-message" event handler');
      channelInstance.bind("new-message", handleNewMessage);
      console.log('[Pusher Setup] ✅ Event handler bound successfully');
      console.log('[Pusher Setup] ================================================');
    }).catch((error) => {
      console.error('[Pusher Setup] ❌ Failed to load Pusher:', error);
    });

    // Cleanup function - only runs when component unmounts or roomId changes
    return () => {
      console.log(`[Pusher Cleanup] 🧹 Cleaning up private channel for room ${roomId}`);
      
      if (channelRef.current) {
        console.log('[Pusher Cleanup] Unbinding all events');
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
      
      if (pusherRef.current) {
        console.log('[Pusher Cleanup] Disconnecting Pusher');
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    };
  }, [roomId]); // ONLY roomId as dependency - NOT onNewMessage or scrollToBottom!

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `/api/chat/rooms/${roomId}/messages?page=${page}&limit=50`
      );
      const data = await response.json();

      if (data.success) {
        setMessages(data.data);
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if we have either text or image
    if ((!newMessage.trim() && !selectedImage) || sending) return;

    console.log(`[Chat Frontend] ================================================`);
    console.log(`[Chat Frontend] 🔵 Sending new message...`);

    // Debounce: prevent rapid clicking/submitting
    const now = Date.now();
    if (now - lastSendTimeRef.current < SEND_COOLDOWN) {
      console.log(`[Chat Frontend] ⚠️ DEBOUNCED! Too fast (< ${SEND_COOLDOWN}ms)`);
      console.log(`[Chat Frontend] ================================================`);
      return;
    }
    lastSendTimeRef.current = now;

    // Cancel any pending request
    if (abortControllerRef.current) {
      console.log(`[Chat Frontend] 🚫 Aborting previous request`);
      abortControllerRef.current.abort();
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const messageText = newMessage.trim() || (selectedImage ? '📷 Image' : '');
    setSending(true);

    console.log(`[Chat Frontend] 📤 POST /api/chat/rooms/${roomId}/messages`);
    console.log(`[Chat Frontend] 💬 Message type: ${selectedImage ? 'image' : 'text'}`);

    try {
      let fileUrl = '';
      let fileName = '';

      // Upload image first if selected
      if (selectedImage) {
        setUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedImage);

        const uploadResponse = await fetch('/api/chat/upload-image', {
          method: 'POST',
          body: uploadFormData,
        });

        const uploadData = await uploadResponse.json();

        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Failed to upload image');
        }

        fileUrl = uploadData.data.url;
        fileName = uploadData.data.fileName;
        setUploading(false);
      }

      const response = await fetch(`/api/chat/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: messageText,
          type: selectedImage ? "image" : "text",
          fileUrl: fileUrl || undefined,
          fileName: fileName || undefined,
        }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (!data.success) {
        // Show user-friendly error for rate limiting
        if (response.status === 429) {
          console.log(`[Chat Frontend] ⚠️ Rate limited by backend!`);
          alert("Terlalu banyak pesan. Mohon tunggu sebentar.");
        } else {
          console.error(`[Chat Frontend] ❌ Failed to send:`, data.error);
          alert(data.error || 'Failed to send message');
        }
        console.log(`[Chat Frontend] ================================================`);
      } else {
        console.log(`[Chat Frontend] ✅ POST successful - Message ID: ${data.data._id}`);
        
        // Clear inputs on success
        setNewMessage("");
        setSelectedImage(null);
        setImagePreview(null);
        
        if (data.duplicate) {
          console.warn(`[Chat Frontend] 🔁 Backend returned duplicate (idempotency)`);
        }
        
        console.log(`[Chat Frontend] ⏳ Waiting for Pusher event...`);
        console.log(`[Chat Frontend] ================================================`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log(`[Chat Frontend] 🚫 Request aborted - rapid messaging detected`);
        console.log(`[Chat Frontend] ================================================`);
        return;
      }
      
      console.error(`[Chat Frontend] ❌ Error:`, error);
      console.log(`[Chat Frontend] ================================================`);
      alert(error.message || 'Failed to send message');
    } finally {
      setSending(false);
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Hanya file gambar yang diperbolehkan (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('Ukuran file maksimal 5MB');
      return;
    }

    setSelectedImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>Belum ada pesan. Mulai percakapan!</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isOwnMessage = message.senderRole === "admin";
              const showDate =
                index === 0 ||
                formatDate(messages[index - 1].createdAt) !==
                  formatDate(message.createdAt);

              return (
                <div key={message._id}>
                  {/* Date Separator */}
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.createdAt)}
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`flex ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        isOwnMessage ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Sender Name (for user messages) */}
                      {!isOwnMessage && (
                        <div className="text-xs text-slate-400 mb-1 px-1">
                          {message.senderId?.fullName ||
                            message.senderId?.username ||
                            "User"}
                        </div>
                      )}

                      {/* Message Content */}
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? "bg-blue-600 text-white"
                            : "bg-slate-700 text-slate-100"
                        }`}
                      >
                        {/* Render Image if type is image */}
                        {message.type === 'image' && message.fileUrl && (
                          <div className="mb-2">
                            <img
                              src={message.fileUrl}
                              alt={message.fileName || 'Image'}
                              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(message.fileUrl, '_blank')}
                              style={{ maxHeight: '300px', objectFit: 'contain' }}
                            />
                          </div>
                        )}
                        
                        {/* Render text message */}
                        {message.message && message.message !== '📷 Image' && (
                          <p className="whitespace-pre-wrap break-words">
                            {message.message}
                          </p>
                        )}
                        
                        <div
                          className={`text-xs mt-1 ${
                            isOwnMessage ? "text-blue-200" : "text-slate-400"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                          {isOwnMessage && (
                            <span className="ml-1">
                              {message.isRead ? "✓✓" : "✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 p-4">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-32 rounded-lg border-2 border-blue-500"
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
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
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
            className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
            title="Upload Image"
          >
            📷
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending || uploading}
          />
          <button
            type="submit"
            disabled={(!newMessage.trim() && !selectedImage) || sending || uploading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {uploading ? (
              <span className="inline-block">⏫</span>
            ) : sending ? (
              <span className="inline-block animate-spin">⏳</span>
            ) : (
              "Kirim"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
