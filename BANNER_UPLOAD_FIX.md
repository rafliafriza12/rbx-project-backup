# Banner Upload - Cloudinary Integration Fix

## ❌ Masalah Sebelumnya

Error saat upload banner:

```json
{ "error": { "message": "cloud_name is disabled" } }
```

**Penyebab**:

- Upload dilakukan langsung dari client-side ke Cloudinary API public endpoint
- Menggunakan `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` yang tidak aman
- Memerlukan unsigned upload preset di Cloudinary

## ✅ Solusi yang Diterapkan

### 1. **Server-Side Upload API**

Dibuat endpoint baru: `/api/upload/banner/route.ts`

**Keuntungan**:

- ✅ Menggunakan konfigurasi Cloudinary yang sudah ada (`lib/cloudinary.ts`)
- ✅ Credentials aman di server-side (tidak expose ke client)
- ✅ Konsisten dengan upload gamepass dan joki yang sudah berfungsi
- ✅ Tidak perlu buat upload preset unsigned di Cloudinary

### 2. **Update Admin Panel**

File: `app/admin/banners/page.tsx`

**Perubahan**:

```typescript
// SEBELUM: Upload langsung ke Cloudinary
const response = await fetch(
  `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
  { method: "POST", body: formData }
);

// SESUDAH: Upload via internal API
const response = await fetch("/api/upload/banner", {
  method: "POST",
  body: formData,
});
```

## 📋 File yang Diubah

1. **Baru**: `app/api/upload/banner/route.ts` - Server-side upload endpoint
2. **Update**: `app/admin/banners/page.tsx` - Ganti upload method
3. **Update**: `BANNER_MANAGEMENT_DOCS.md` - Update dokumentasi
4. **Update**: `BANNER_QUICK_GUIDE.md` - Update guide

## ⚙️ Konfigurasi yang Diperlukan

File `.env.local` (sudah ada untuk gamepass/joki):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Catatan**:

- Tidak perlu `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` lagi
- Tidak perlu buat unsigned upload preset
- Gunakan konfigurasi yang sama dengan gamepass/joki

## 🔄 Cara Menggunakan Sekarang

1. **Pastikan env variables sudah diset** (sama seperti gamepass)
2. **Restart development server**: `pnpm dev`
3. **Upload banner** di `/admin/banners` → Upload otomatis ke folder `banners/`

## 🧪 Testing

### Test Upload Banner:

1. Login ke admin panel
2. Buka `/admin/banners`
3. Klik "Tambah Banner"
4. Upload gambar (JPG/PNG/WebP, max 5MB)
5. Isi form dan submit
6. ✅ Success: Banner muncul dengan gambar dari Cloudinary
7. ❌ Error: Cek console untuk error detail

### Troubleshooting:

```bash
# Cek env variables
cat .env.local | grep CLOUDINARY

# Restart server
pnpm dev

# Test API endpoint langsung
curl -X POST http://localhost:3000/api/upload/banner \
  -F "file=@/path/to/image.jpg"
```

## 🎯 Status

✅ **FIXED** - Upload banner sekarang menggunakan server-side API yang aman dan terintegrasi dengan konfigurasi Cloudinary yang sudah ada.

---

**Tanggal Fix**: 6 Oktober 2025
**API Endpoint**: `/api/upload/banner`
**Folder Cloudinary**: `banners/`
**Security**: ✅ Server-side only, credentials aman
