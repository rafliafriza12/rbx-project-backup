# CHANGELOG - RBXNET Update
**Tanggal: 8 April 2026**

---

## Ringkasan
Update UI/tampilan website RBXNET + fitur baru Klaim Gamepass + proteksi chat room.

---

## File yang Diubah

### 1. `app/(public)/leaderboard/page.tsx` — Redesign Leaderboard
- Tambah podium Top 3: Top 1 tengah (emas, paling besar), Top 2 kiri (silver), Top 3 kanan (bronze) dalam layout card
- Username di-mask untuk privasi (contoh: "Al****sa")
- Rank 4+ ditampilkan sebagai list row simpel, bukan tabel
- Foto profil Google tampil di avatar jika user login via Google, fallback ke inisial huruf
- Tambah CTA section di bawah: "Mau Masuk Leaderboard?" dengan tombol Top Up RBX dan Beli Produk
- Warna disesuaikan tema ungu website
- Animasi masuk pakai Framer Motion
- Responsive untuk HP, tablet, desktop
- Fix dropdown filter: warna option putih → inline style backgroundColor gelap supaya konsisten di semua browser

### 2. `app/api/leaderboard/route.ts` — Tambah Profile Picture
- Tambah field `profilePicture` di MongoDB aggregation pipeline (GET dan POST handler) supaya foto profil Google muncul di leaderboard
- Hapus 2 unused imports (User, Role)

### 3. `app/(public)/rbx/page.tsx` — Redesign Halaman RBX
- Header hero: mascot kiri, judul kanan (sejajar di semua device)
- 2 product cards: RBX 5 Hari (accent ungu/pink, badge "Termurah") dan RBX Reguler (accent kuning/amber, badge "Tercepat"), masing-masing dengan checklist fitur dan tombol "Beli Sekarang"
- Section bantuan: mascot sedih + tombol WhatsApp
- FAQ accordion: 5 pertanyaan umum dengan animasi expand/collapse + mascot mikir
- Banner carousel dihapus dari halaman ini
- Responsive untuk semua device
- Teks FAQ refund: ditambahkan "jika pesanan belum diproses dalam 3 hari"

### 4. `app/page.tsx` — Home Page + Hide Tombol Mobile
**Tombol Panduan & Lacak Pesanan di hero desktop:**
- Disembunyikan di mobile (hidden md:block), tetap tampil di desktop
- Tombol "Beli RBX Sekarang" tetap tampil di semua device

**Mobile hero baru (hanya tampil di HP):**
- Mascot + "Selamat Datang di RBXNET" sejajar
- Grid produk: RBX 5 Hari, RBX Via Login, Gamepass, Panduan, Lacak Pesanan
- Mini stats 4 kolom

**Desktop hero:**
- Tidak diubah dari aslinya, kecuali:
  - Tambah tombol "Panduan" (link YouTube) di antara "Beli RBX Sekarang" dan "Lacak Pesanan"
  - Stats di-hide di mobile (sudah ada di mobile hero)

**Tombol CTA:**
- "Beli RBX Sekarang" di hero atas dan CTA bawah: diubah dari scroll ke bawah → link ke /rbx
- Tambah tombol "Panduan" → https://www.youtube.com/watch?v=SemqFE2fcKY

**Banner default:**
- Hapus 3 banner default lama (banner.webp, banner2.png, banner.png)
- Ganti 1 banner default baru: /Banner/Tak berjudul40_20251112150853.png
- Kalau database punya banner aktif, tetap prioritas dari database
- Kalau tidak ada banner, section tidak tampil

**Lain-lain:**
- Hapus kata "Joki" dari teks welcome mobile
- Fix CSS class "full" yang invalid di banner section
- Tambah import Clock, PlayCircle dari lucide-react

### 5. `app/(public)/layout.tsx` — Layout Public
- Import dan render BottomNav component
- Tambah spacer div di bawah agar konten tidak tertutup bottom nav di mobile

### 6. `app/transaction/page.tsx` — Fix Layout Invoice + Tombol Klaim Gamepass
**Fix Layout (sebelumnya):**
- Invoice ID, Order ID, Reference: layout diubah dari samping-samping → label atas, value bawah
- Tambah break-all supaya ID panjang wrap rapi di HP kecil
- Font size disesuaikan untuk mobile
- Berlaku untuk single transaction dan multi-checkout

**Tombol Klaim Gamepass (baru):**
- Tombol "Klaim Gamepass" muncul di atas tombol lain (paling menonjol), hanya jika: pembayaran berhasil (settlement) DAN serviceType === "gamepass"
- Tidak muncul untuk: robux, joki, reseller, atau status pending/failed
- Klik tombol → otomatis buat chat room order sesuai invoice ID → auto-invoice message terkirim → redirect ke /chat
- Jika belum login: muncul toast "Silakan login terlebih dahulu untuk klaim gamepass kamu ya!" → delay 2 detik → redirect ke /login → setelah login redirect balik ke halaman transaction yang sama → klik Klaim Gamepass lagi
- Import tambahan: MessageCircle, createChatRoom, useAuth

### 7. `components/footer/public-app-footer.tsx` — Copyright
- © 2025 → © 2026

---

## File Baru

### `components/BottomNav.tsx` — Bottom Navigation Bar Mobile
- Fixed di bawah layar, hanya tampil di HP/tablet (md:hidden)
- 4 menu: Home (/), Chat (/chat atau /login), Transaksi (/riwayat), Login/Profil
- Chat arahkan ke /login kalau belum login, /chat kalau sudah login
- Login berubah jadi Profil kalau sudah login
- Menggunakan useAuth() dari AuthContext untuk cek status login

### File Gambar Baru
- `public/Maskot/mascot-pointing.png` — Mascot kedip jari (untuk header)
- `public/Maskot/mascot-excited.png` — Mascot semangat (cadangan)
- `public/Maskot/mascot-sad.png` — Mascot sedih (untuk section bantuan)
- `public/Maskot/mascot-thinking.png` — Mascot mikir (untuk FAQ)
- `public/Maskot/mascot-confident.png` — Mascot tangan silang (cadangan)
- `public/Banner/Tak berjudul40_20251112150853.png` — Banner Gift Gamepass default

---

### 8. `app/api/chat/rooms/route.ts` — Proteksi Chat Room
**Order support:**
- Cek apakah sudah ada chat room aktif untuk invoice yang sama
- Kalau sudah ada → return room yang ada (tidak buat duplikat)
- Kalau room lama sudah ditutup/dihapus → bisa buat room baru

**General support:**
- Maksimal 2 chat room aktif per user
- Lebih dari 2 → error "Maksimal 2 ruang chat umum aktif. Tutup salah satu untuk membuat yang baru."
- Room yang sudah closed/archived tidak dihitung

---

## Yang TIDAK Diubah
- Database models
- Middleware / authentication / JWT
- Checkout / payment (Midtrans, Duitku)
- Cart system
- Admin dashboard
- Halaman login / register
- Halaman gamepass, rbx5, robux-instant, reseller, profile, track-order

---

## Catatan untuk Developer
1. Perubahan mencakup UI + fitur baru (Klaim Gamepass) + proteksi backend chat room
2. Pastikan file .env sudah dikonfigurasi (INTERNAL_API_SECRET, MongoDB, dll) di production
3. Banner default bisa diganti dari admin dashboard (database prioritas)
4. Mascot files ada di /public/Maskot/ — pastikan ikut di-deploy
5. BottomNav menggunakan useAuth() context — pastikan AuthContext tetap export useAuth hook
6. Dropdown leaderboard pakai inline style (bukan Tailwind class) untuk kompatibilitas browser
7. Halaman transaction/invoice sudah di-fix untuk mobile — test dengan transaksi real di production
8. **Bug existing (bukan dari update ini, tapi perlu di-fix):**
   - `app/(public)/layout.tsx` line 12: `React.FC` dipakai tapi `React` tidak di-import — tambahkan `import React from "react"`
   - `app/page.tsx` line 469: `key={banner.id}` harusnya `key={banner._id}` — banner dari API pakai `_id`, bukan `id`
   - `app/api/leaderboard/route.ts` line 130: `$addFields` rank pakai `$indexOfArray` yang invalid (tapi di-overwrite di line 140-143, jadi tidak crash)
   - `app/api/leaderboard/route.ts` line 246-249: `now` di-mutate saat hitung week range, bisa salah hitung tanggal
