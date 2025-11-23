# Chat System Documentation

## 📋 Overview

Sistem chat real-time antara Admin dan Customer menggunakan **Pusher WebSocket** untuk komunikasi instant.

---

## 🏗️ Arsitektur

### **Database Schema**

#### **ChatRoom Model** (`models/ChatRoom.ts`)
```typescript
{
  userId: ObjectId,           // Reference to User
  adminId: ObjectId,          // Reference to Admin who handled
  lastMessage: String,        // Preview last message
  lastMessageAt: Date,        // Timestamp of last message
  unreadCountAdmin: Number,   // Unread messages for admin
  unreadCountUser: Number,    // Unread messages for user
  status: Enum,               // 'active' | 'closed' | 'archived'
  createdAt: Date,
  updatedAt: Date
}
```

#### **Message Model** (`models/Message.ts`)
```typescript
{
  roomId: ObjectId,           // Reference to ChatRoom
  senderId: ObjectId,         // Reference to User
  senderRole: Enum,           // 'user' | 'admin'
  message: String,            // Message content
  type: Enum,                 // 'text' | 'image' | 'file' | 'system'
  fileUrl: String,            // Optional file URL
  fileName: String,           // Optional file name
  isRead: Boolean,            // Read status
  readAt: Date,               // Timestamp when read
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔌 API Endpoints

### **Chat Rooms**

#### `GET /api/chat/rooms`
Get all chat rooms (Admin only)

**Query Parameters:**
- `status` - Filter by status (active/closed/archived)
- `search` - Search by username/email
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### `POST /api/chat/rooms`
Create new chat room

**Body:**
```json
{
  "userId": "user_id_here"
}
```

---

### **Messages**

#### `GET /api/chat/rooms/[roomId]/messages`
Get messages for a specific room

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [...messages],
  "pagination": {...}
}
```

#### `POST /api/chat/rooms/[roomId]/messages`
Send a new message

**Body:**
```json
{
  "message": "Hello!",
  "type": "text",
  "fileUrl": "optional_file_url",
  "fileName": "optional_file_name"
}
```

**Pusher Events:**
- `chat-room-{roomId}` → `new-message` - New message in room
- `admin-chat` → `room-updated` - Chat room list updated

---

#### `PUT /api/chat/rooms/[roomId]/read`
Mark messages as read

**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read"
}
```

---

#### `PATCH /api/chat/rooms/[roomId]`
Update chat room status (Admin only)

**Body:**
```json
{
  "status": "closed"
}
```

---

## 🎨 Frontend Components

### **Admin Chat Page** (`app/admin/chat/page.tsx`)

**Features:**
- ✅ List semua chat rooms dengan filter
- ✅ Search by username/email
- ✅ Status filter (active/closed/archived)
- ✅ Real-time room list updates
- ✅ Unread message counter
- ✅ Click to open chat

**Layout:**
```
┌─────────────────────────────────────┐
│  Search & Filter                    │
├─────────────┬───────────────────────┤
│  Chat Rooms │  Chat Messages        │
│  List       │  - Header             │
│  - User 1   │  - Messages           │
│  - User 2   │  - Input Form         │
│  - User 3   │                       │
└─────────────┴───────────────────────┘
```

---

### **ChatMessages Component** (`components/admin/ChatMessages.tsx`)

**Props:**
```typescript
{
  roomId: string,
  currentUserId: string,
  onNewMessage?: () => void
}
```

**Features:**
- ✅ Real-time message updates via Pusher
- ✅ Auto-scroll to bottom
- ✅ Date separators
- ✅ Read receipts (✓ / ✓✓)
- ✅ Message bubbles (admin = blue, user = gray)
- ✅ Timestamp formatting

---

## 🚀 Setup Instructions

### **1. Install Pusher**
```bash
pnpm add pusher pusher-js
```

### **2. Configure Environment Variables**
Add to `.env`:
```env
PUSHER_APP_ID=your_app_id
NEXT_PUBLIC_PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
```

### **3. Get Pusher Credentials**
1. Sign up di [pusher.com](https://pusher.com)
2. Create new Channels app
3. Copy credentials ke `.env`

### **4. Test Chat**
1. Login sebagai admin
2. Go to `/admin/chat`
3. Click user untuk mulai chat
4. Send message

---

## 📡 Real-time Updates

### **Pusher Channels**

#### **1. Per-Room Channel**
```javascript
Channel: `chat-room-{roomId}`
Event: `new-message`
Payload: { message: MessageObject }
```

**Triggered when:**
- Admin sends message
- User sends message

**Listeners:**
- ChatMessages component

---

#### **2. Admin Global Channel**
```javascript
Channel: `admin-chat`
Event: `room-updated`
Payload: { roomId, lastMessage, lastMessageAt }
```

**Triggered when:**
- New message sent
- Room status changed

**Listeners:**
- Admin chat page (untuk refresh room list)

---

## 🎯 Features

### **✅ Implemented**
- Real-time messaging via Pusher
- Unread message counter
- Read receipts
- Message history pagination
- Search & filter chat rooms
- Status management (active/closed/archived)
- Auto-scroll to bottom
- Date separators
- Responsive UI

### **🔜 Future Enhancements**
- File/image upload support
- Typing indicators
- Message reactions
- User-side chat interface
- Push notifications
- Message search within room
- Canned responses (quick replies)
- Chat analytics

---

## 🔒 Security

### **Authentication**
- All endpoints protected with JWT
- Role-based access control (admin only)
- User can only access their own chat room

### **Authorization**
```typescript
// Admin: Can view all rooms
if (user.accessRole !== 'admin' && user.accessRole !== 'superadmin') {
  return 401 Unauthorized
}

// User: Can only access own room
if (!isAdmin && chatRoom.userId !== user._id) {
  return 403 Forbidden
}
```

---

## 📊 Performance Optimization

### **Indexing**
```typescript
// ChatRoom indexes
ChatRoomSchema.index({ userId: 1 });
ChatRoomSchema.index({ status: 1, lastMessageAt: -1 });

// Message indexes
MessageSchema.index({ roomId: 1, createdAt: -1 });
MessageSchema.index({ roomId: 1, isRead: 1 });
```

### **Pagination**
- Default: 50 messages per load
- Older messages loaded on scroll up

### **Real-time Efficiency**
- Pusher channels auto-cleanup on unmount
- Debounced search input

---

## 🐛 Troubleshooting

### **Messages not appearing in real-time**
1. Check Pusher credentials in `.env`
2. Verify Pusher app is active
3. Check browser console for Pusher connection errors
4. Ensure `NEXT_PUBLIC_` prefix for client-side vars

### **Unauthorized errors**
1. Clear browser cookies
2. Re-login as admin
3. Check JWT token validity

### **Room not updating**
1. Check if Pusher trigger is successful
2. Verify channel subscription
3. Check admin-chat channel binding

---

## 📝 Usage Example

### **Admin sends message:**
```typescript
// 1. User clicks "Send"
// 2. API: POST /api/chat/rooms/{roomId}/messages
// 3. Message saved to MongoDB
// 4. Pusher triggers 'new-message' event
// 5. ChatMessages component receives update
// 6. Auto-scroll to bottom
// 7. unreadCountUser incremented
```

### **User receives notification:**
```typescript
// 1. Pusher event received
// 2. UI shows new message instantly
// 3. If room is open, mark as read automatically
// 4. If room is closed, show unread badge
```

---

## 🎓 Code Structure

```
app/
├── admin/
│   └── chat/
│       └── page.tsx              # Admin chat management page
├── api/
│   └── chat/
│       ├── rooms/
│       │   ├── route.ts          # GET all rooms, POST create room
│       │   └── [roomId]/
│       │       ├── route.ts      # PATCH update room status
│       │       ├── messages/
│       │       │   └── route.ts  # GET messages, POST new message
│       │       └── read/
│       │           └── route.ts  # PUT mark as read

components/
└── admin/
    └── ChatMessages.tsx          # Chat messages component

models/
├── ChatRoom.ts                   # ChatRoom schema
└── Message.ts                    # Message schema

lib/
└── pusher.ts                     # Pusher server configuration
```

---

## 🎉 Conclusion

Sistem chat sudah **production-ready** dengan:
- ✅ Real-time communication
- ✅ Scalable architecture
- ✅ Secure authentication
- ✅ Professional UI/UX
- ✅ Optimized performance

**Next steps:** Implementasi customer-side chat interface! 🚀
