# Quick Guide - Banner Management

## 🎨 Akses Admin Panel Banner

1. Login sebagai admin
2. Buka menu **"Banner"** (icon 🎨) di sidebar admin
3. Atau akses langsung: `http://localhost:3000/admin/banners`

## ➕ Tambah Banner Baru

### Langkah-langkah:

1. **Klik tombol "Tambah Banner"** (tombol purple di kanan atas)
2. **Upload Gambar**:
   - Klik "Choose File"
   - Pilih gambar (JPG/PNG/WebP, maks 5MB)
   - Preview akan muncul otomatis
3. **Isi Form**:
   - **Alt Text**: Deskripsi gambar (contoh: "Banner Gamepass Terbaru")
   - **Link Tujuan**: URL tujuan (contoh: `/gamepass` atau `https://...`)
   - **Urutan (Order)**: Angka urutan (0-999, semakin kecil semakin prioritas)
   - **Checkbox**: Centang untuk mengaktifkan banner
4. **Klik "Tambah Banner"**

### Contoh Data Banner:

```
Alt Text: "Promo Robux Murah Oktober 2025"
Link: /rbx5
Order: 1
✅ Tampilkan banner di halaman beranda
```

## ✏️ Edit Banner

1. Klik tombol **"Edit"** (biru) pada card banner
2. Update informasi yang diperlukan
3. Bisa ganti gambar atau tetap pakai gambar lama
4. Klik **"Update Banner"**

## 🔄 Aktifkan/Nonaktifkan Banner

- Klik tombol **"Aktifkan"** (hijau) atau **"Nonaktifkan"** (abu-abu)
- Banner yang nonaktif tidak akan muncul di homepage
- Perubahan langsung berlaku

## 🗑️ Hapus Banner

1. Klik tombol **"Hapus"** (merah) pada card banner
2. Konfirmasi penghapusan
3. Banner terhapus permanen

## 📊 Status Banner

### Badge Status:

- **🟢 Active**: Banner aktif dan ditampilkan di homepage
- **⚫ Inactive**: Banner tidak ditampilkan

### Badge Order:

- **Order: 0** → Tampil pertama
- **Order: 1** → Tampil kedua
- **Order: 2** → Tampil ketiga
- dst...

## 🏠 Hasil di Homepage

- Banner aktif akan tampil di carousel homepage
- Auto-loop setiap 4 detik
- User bisa klik banner untuk navigate ke link tujuan
- Tombol prev/next untuk navigasi manual

## ⚙️ Setup Cloudinary (Jika Belum)

### Environment Variables:

File `.env.local`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Catatan**: Banner menggunakan konfigurasi Cloudinary yang sama dengan gamepass/joki. Jika gamepass sudah bisa upload, banner juga akan berfungsi.

### Restart Development Server:

```bash
pnpm dev
```

## 💡 Tips & Best Practices

### Ukuran Gambar:

- **Rasio**: 16:9 (contoh: 1920x1080px)
- **Format**: WebP (optimal) atau PNG/JPG
- **Ukuran file**: < 5MB (ideal: 500KB - 1MB)
- **Resolusi**: Minimal 1920x1080px untuk HD display

### Urutan Banner:

```
Order 0 → Banner utama/promo terbaru
Order 1 → Banner secondary
Order 2 → Banner tertiary
```

### Link Tujuan:

```
✅ Internal: /gamepass, /rbx5, /joki
✅ External: https://discord.gg/...
✅ Anchor: /gamepass#promo
```

### Alt Text yang Baik:

```
✅ "Promo Gamepass Blox Fruits Update 24"
✅ "Diskon 50% Robux Spesial Ramadan"
❌ "Banner 1"
❌ "Gambar"
```

## 🐛 Troubleshooting

### Banner tidak muncul di homepage?

- ✅ Pastikan banner statusnya **Active**
- ✅ Cek ada minimal 1 banner aktif
- ✅ Refresh halaman homepage (Ctrl+F5)

### Gambar tidak bisa diupload?

- ✅ Cek ukuran file < 5MB
- ✅ Pastikan format JPG/PNG/WebP
- ✅ Cek environment variable Cloudinary sudah diset dengan benar
- ✅ Restart development server setelah set env variable
- ✅ Cek console browser untuk error detail

### Banner tidak urut sesuai order?

- ✅ Set order dengan angka yang berbeda (0, 1, 2, ...)
- ✅ Refresh halaman untuk lihat perubahan

## 📱 Responsive Design

- Mobile: 1 banner visible
- Tablet: 3 banners (center focus)
- Desktop: 3 banners (side preview)

## 🎯 API Endpoints (untuk Developer)

```typescript
GET  /api/banners          // Get all banners
GET  /api/banners?active=true  // Get only active banners
GET  /api/banners/[id]     // Get single banner
POST /api/banners          // Create banner
PUT  /api/banners/[id]     // Update banner
DELETE /api/banners/[id]   // Delete banner
```

---

**Status**: ✅ Sistem Siap Digunakan!
**Menu**: Admin Panel → 🎨 Banner
**Homepage**: Banner carousel otomatis terintegrasi
