# Chat Feature - Quick Setup Guide

## 🚀 Setup Pusher (5 menit)

### 1. Buat Akun Pusher
1. Buka https://pusher.com
2. Sign up (gratis untuk development)
3. Click **"Create app"**

### 2. Konfigurasi App
**Name:** RBX Chat  
**Cluster:** ap1 (Asia Pacific - Singapore)  
**Tech Stack:** 
- Frontend: React
- Backend: Node.js

### 3. Copy Credentials
Setelah app dibuat, copy credentials:

```env
# Add to .env file
PUSHER_APP_ID=1234567
NEXT_PUBLIC_PUSHER_KEY=xxxxxxxxxxxxxxxxxxxxx
PUSHER_SECRET=xxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_PUSHER_CLUSTER=ap1
```

**⚠️ PENTING:** `NEXT_PUBLIC_` prefix wajib untuk client-side variables!

---

## 📦 Install Dependencies

Dependencies sudah diinstall:
- ✅ `pusher` (server-side)
- ✅ `pusher-js` (client-side - sudah ada)
- ✅ `date-fns` (date formatting)

---

## 🎯 Testing

### Test sebagai Admin:
1. **Start dev server:**
   ```bash
   pnpm dev
   ```

2. **Login sebagai admin:**
   - Go to `http://localhost:3000/admin-login`
   - Login dengan credentials admin

3. **Open Chat Management:**
   - Click menu **"Chat"** 💬 di sidebar
   - Akan muncul list users/customers

4. **Test Chat:**
   - Click salah satu user
   - Ketik pesan → Click "Kirim"
   - Message akan muncul real-time

### Test Real-time:
1. Buka 2 browser/tabs berbeda
2. Tab 1: Admin chat
3. Tab 2: Admin chat (atau nanti customer interface)
4. Send message dari Tab 1
5. Tab 2 akan update otomatis (real-time) ✨

---

## 🔧 Pusher Dashboard - Test Events

### Cara cek Pusher bekerja:
1. Go to Pusher Dashboard → Your App
2. Click tab **"Debug Console"**
3. Send message dari app
4. Lihat events muncul di console:
   - `new-message` event
   - `room-updated` event

---

## 📊 Monitoring

### Check Pusher Usage:
- Go to Pusher Dashboard → Overview
- Free tier limit: 
  - **200k messages/day**
  - **100 concurrent connections**
  - Cukup untuk development & early production

---

## 🐛 Troubleshooting

### Message tidak real-time?
```bash
# Check 1: Pusher credentials
echo $NEXT_PUBLIC_PUSHER_KEY
# Harus ada value

# Check 2: Restart dev server
pnpm dev

# Check 3: Clear browser cache & reload
```

### Error "Pusher not connected"?
1. Check `.env` file ada semua credentials
2. Check `NEXT_PUBLIC_` prefix benar
3. Restart dev server
4. Check Pusher Dashboard → Connection count

### Messages tersimpan tapi tidak muncul di UI?
1. Open browser DevTools → Console
2. Cari error Pusher
3. Check network tab untuk `/api/chat` requests
4. Verify roomId benar

---

## ✅ Checklist Setup

- [ ] Pusher account created
- [ ] App created di Pusher
- [ ] Credentials copied to `.env`
- [ ] Dev server restarted
- [ ] Login sebagai admin berhasil
- [ ] Chat menu muncul di sidebar
- [ ] Bisa kirim message
- [ ] Message muncul real-time
- [ ] Unread counter berfungsi

---

## 🎉 Success!

Jika semua checklist ✅, chat system sudah berjalan!

**Next:** Implement customer-side chat interface 🚀

---

## 📞 Support

Jika ada masalah:
1. Check dokumentasi lengkap di `docs/chat-system.md`
2. Check Pusher docs: https://pusher.com/docs
3. Check browser console untuk errors
