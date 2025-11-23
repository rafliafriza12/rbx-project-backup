# 📊 Pusher Event Tracking - Console Log Guide

## 🎯 Tujuan
Menghitung berapa kali Pusher trigger event dipanggil setiap kali mengirim 1 bubble chat.

**Target:** 1 bubble chat = **1 Pusher event**

---

## 🔍 Cara Test

### 1. **Buka Browser Console**
- Buka halaman `/admin/chat`
- Tekan `F12` atau `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- Tab **Console**

### 2. **Buka Terminal Backend**
- Pastikan `pnpm dev` berjalan
- Lihat log di terminal

### 3. **Kirim 1 Pesan Chat**
- Pilih user dari daftar
- Ketik pesan: "test"
- Klik "Kirim"

---

## 📝 Expected Console Output

### **Backend (Terminal)** 
Setiap 1 pesan, harusnya tampil:

```bash
[POST /messages] 🔵 New message request from user 673...
[POST /messages] ✅ Message created in DB: 674abc123...
[POST /messages] 📝 ChatRoom updated
[POST /messages] 🔐 Idempotency key stored for 5 seconds
[POST /messages] 🚀 Triggering Pusher event...
[POST /messages] 📡 Channel: chat-room-674abc123...
[POST /messages] 📡 Event: new-message
[POST /messages] ✅ Pusher event sent successfully
[POST /messages] 📊 TOTAL PUSHER EVENTS TRIGGERED: 1
[POST /messages] ================================================
```

**✅ CORRECT:** `TOTAL PUSHER EVENTS TRIGGERED: 1`  
**❌ WRONG:** Jika muncul angka 2, 3, atau lebih

---

### **Frontend (Browser Console)**
Setiap 1 pesan, harusnya tampil:

```javascript
[Chat Frontend] ================================================
[Chat Frontend] 🔵 Sending new message...
[Chat Frontend] 📤 POST /api/chat/rooms/674abc123.../messages
[Chat Frontend] 💬 Message: "test"
[Chat Frontend] ✅ POST successful - Message ID: 674def456...
[Chat Frontend] ⏳ Waiting for Pusher event...
[Chat Frontend] ================================================

// Setelah beberapa ms...
[Pusher Frontend] 📥 Received 'new-message' event
[Pusher Frontend] 📨 Message ID: 674def456...
[Pusher Frontend] ✅ New message added to state
[Pusher Frontend] 📊 Total messages in chat: 5
[Pusher Frontend] ================================================
```

**✅ CORRECT:** Hanya 1x "Received 'new-message' event"  
**❌ WRONG:** Jika event diterima 2x atau lebih (berarti duplikasi)

---

## 🧪 Test Scenarios

### **Test 1: Single Message**
**Action:** Kirim 1 pesan  
**Expected:**
- Backend: `TOTAL PUSHER EVENTS TRIGGERED: 1`
- Frontend: 1x "Received 'new-message' event"
- UI: 1 bubble chat muncul

---

### **Test 2: Rapid Messaging (Debounce Test)**
**Action:** Kirim 3 pesan berturut-turut cepat (< 500ms)  
**Expected:**
- Console: `⚠️ DEBOUNCED! Too fast (< 500ms)` untuk request ke-2 dan ke-3
- Hanya pesan pertama yang terkirim

---

### **Test 3: Duplicate Message (Idempotency Test)**
**Action:** 
1. Kirim pesan "hello"
2. Tunggu 2 detik
3. Kirim pesan "hello" lagi (identik)
**Expected:**
- Pesan pertama: Normal (TOTAL EVENTS: 1)
- Pesan kedua dalam 5 detik: 
  ```
  [POST /messages] 🔁 DUPLICATE DETECTED! Returning existing message...
  [POST /messages] 📊 Pusher events triggered: 0 (duplicate prevented)
  ```

---

### **Test 4: Rate Limiting**
**Action:** Kirim 11 pesan dalam 1 menit  
**Expected:**
- Pesan 1-10: Sukses
- Pesan 11: 
  ```
  [POST /messages] ⚠️ Rate limit exceeded for user...
  [Chat Frontend] ⚠️ Rate limited by backend!
  Alert: "Terlalu banyak pesan. Mohon tunggu sebentar."
  ```

---

### **Test 5: Multiple Tabs (Connection Test)**
**Action:** Buka 2 tab browser, login admin di keduanya  
**Expected:**
- Kirim pesan di Tab 1
- Tab 2 juga menerima pesan real-time via Pusher
- Setiap tab hanya subscribe 1x ke channel

Console Tab 2:
```javascript
[Pusher Setup] 📡 Subscribing to channel: chat-room-674...
[Pusher Frontend] 📥 Received 'new-message' event
```

---

## 📊 Tracking Summary

### **Per 1 Bubble Chat:**

| Component | Expected Count | Log Message |
|-----------|---------------|-------------|
| **POST Request** | 1 | `POST /api/chat/rooms/.../messages` |
| **DB Insert** | 1 | `Message created in DB` |
| **Pusher Trigger** | **1** ⭐ | `TOTAL PUSHER EVENTS TRIGGERED: 1` |
| **Pusher Receive** | **1** ⭐ | `Received 'new-message' event` |
| **State Update** | 1 | `New message added to state` |
| **UI Render** | 1 bubble | Visual chat bubble |

---

## 🚨 Red Flags (Masalah yang Perlu Diperbaiki)

### ❌ **Multiple Pusher Events per Message**
```bash
[POST /messages] 📊 TOTAL PUSHER EVENTS TRIGGERED: 2  # WRONG!
[POST /messages] 📊 TOTAL PUSHER EVENTS TRIGGERED: 3  # WRONG!
```
**Problem:** Backend trigger Pusher lebih dari 1x  
**Solution:** Check kode POST handler, pastikan hanya 1x `pusher.trigger()`

---

### ❌ **Duplicate Frontend Events**
```javascript
[Pusher Frontend] 📥 Received 'new-message' event
[Pusher Frontend] 📥 Received 'new-message' event  // DUPLICATE!
```
**Problem:** Multiple Pusher subscriptions active  
**Solution:** Check cleanup di useEffect, pastikan unsubscribe sebelum re-subscribe

---

### ❌ **No Duplicate Detection**
```javascript
[Pusher Frontend] ✅ New message added to state
[Pusher Frontend] ✅ New message added to state  // Should be DUPLICATE DETECTED!
```
**Problem:** Same message ID added twice  
**Solution:** Check duplicate detection logic dengan `msg._id`

---

### ❌ **Zombie Listeners**
```javascript
[Pusher Setup] 📡 Subscribing to channel: chat-room-674...
[Pusher Setup] 📡 Subscribing to channel: chat-room-674...  // DUPLICATE!
```
**Problem:** useEffect re-running tanpa cleanup  
**Solution:** Check dependencies array, pastikan cleanup berjalan

---

## 🎯 Success Criteria

✅ **1 pesan = 1 backend log "TOTAL PUSHER EVENTS: 1"**  
✅ **1 pesan = 1 frontend log "Received 'new-message' event"**  
✅ **1 pesan = 1 bubble di UI**  
✅ **Duplicate detection berjalan (skip jika message ID sama)**  
✅ **Debounce blocks rapid sends (< 500ms)**  
✅ **Rate limit blocks setelah 10 pesan/menit**  
✅ **Idempotency prevents duplicate POST dalam 5 detik**

---

## 📈 Pusher Dashboard Validation

Setelah test, check **Pusher Dashboard**:

1. **Total messages sent today**
   - Harus = jumlah chat yang dikirim
   - Contoh: 10 chat = **10 Pusher messages** ✅
   - **BUKAN:** 10 chat = 20-36 Pusher messages ❌

2. **Peak connections today**
   - Normal: 1-5 connections (tergantung jumlah tab/user)
   - **BUKAN:** 20-30 connections (memory leak) ❌

3. **Messages per minute**
   - Konsisten dengan rate limit (max 10/user)
   - Tidak ada spike anomali

---

## 🛠️ Debugging Tips

### **Check Backend Logs**
```bash
# Terminal saat pnpm dev
grep "TOTAL PUSHER EVENTS" logs
```

### **Check Frontend Logs**
```javascript
// Browser Console
// Filter by "Pusher"
// Count "Received 'new-message' event"
```

### **Count Pusher Events Manually**
```javascript
// Tambahkan di browser console
let pusherEventCount = 0;
window.addEventListener('console', (e) => {
  if (e.message.includes('Received new-message')) {
    pusherEventCount++;
    console.log(`Total Pusher events received: ${pusherEventCount}`);
  }
});
```

---

## 📞 Quick Reference

**1 bubble chat harus:**
- ✅ 1x POST request
- ✅ 1x Pusher trigger (backend)
- ✅ 1x Pusher receive (frontend)
- ✅ 1x bubble di UI

**Jika lebih dari itu = ADA BUG!**
