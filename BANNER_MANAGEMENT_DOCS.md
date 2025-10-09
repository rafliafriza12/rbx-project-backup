# Banner Management System

Sistem management banner telah berhasil dibuat untuk mengelola banner yang tampil di halaman beranda.

## Fitur yang Ditambahkan

### 1. **Model Banner** (`models/Banner.ts`)

- **imageUrl**: URL gambar banner (dari Cloudinary)
- **link**: Link tujuan ketika banner diklik
- **alt**: Alt text untuk SEO dan accessibility
- **isActive**: Status apakah banner aktif/ditampilkan
- **order**: Urutan tampilan banner (semakin kecil, semakin prioritas)
- **timestamps**: Otomatis tracking createdAt dan updatedAt

### 2. **API Routes**

- `GET /api/banners` - Ambil semua banner (support query `?active=true`)
- `GET /api/banners/[id]` - Ambil detail banner
- `POST /api/banners` - Tambah banner baru
- `PUT /api/banners/[id]` - Update banner
- `DELETE /api/banners/[id]` - Hapus banner

### 3. **Admin Panel** (`/admin/banners`)

Halaman management banner dengan fitur:

- ✅ List semua banner dengan preview gambar
- ✅ Upload gambar ke Cloudinary
- ✅ Form lengkap (image, link, alt text, order, isActive)
- ✅ Toggle active/inactive banner
- ✅ Edit dan hapus banner
- ✅ Visual card-based layout
- ✅ Status badge (Active/Inactive)
- ✅ Order number badge

### 4. **Integrasi Homepage**

Banner di homepage (`/`) sudah terintegrasi dengan database:

- Fetch active banners dari API
- Auto-fallback ke banner default jika tidak ada data
- Smooth carousel animation
- Click to navigate ke link tujuan
- Loading state saat fetch data

## Cara Menggunakan

### Menambah Banner Baru:

1. Buka `/admin/banners`
2. Klik "Tambah Banner"
3. Upload gambar (maks 5MB, format: JPG/PNG/WebP)
4. Isi link tujuan (contoh: `/gamepass` atau `https://...`)
5. Isi alt text untuk SEO
6. Set urutan (order) - semakin kecil semakin prioritas
7. Centang "Tampilkan banner" untuk mengaktifkan
8. Klik "Tambah Banner"

### Mengedit Banner:

1. Klik tombol "Edit" pada banner yang ingin diubah
2. Update informasi yang diperlukan
3. Klik "Update Banner"

### Mengaktifkan/Nonaktifkan Banner:

- Klik tombol "Aktifkan" atau "Nonaktifkan" pada card banner
- Banner yang nonaktif tidak akan tampil di homepage

### Menghapus Banner:

- Klik tombol "Hapus" (akan ada konfirmasi)

## Catatan Penting

### Upload Gambar:

- Gambar akan diupload ke Cloudinary folder `banners/`
- Upload menggunakan konfigurasi Cloudinary yang sudah ada di server
- Maksimal ukuran file: 5MB
- Format yang didukung: JPG, PNG, WebP

### Rekomendasi Banner:

- **Rasio aspek**: 16:9 (ideal untuk carousel)
- **Resolusi**: Minimal 1920x1080px
- **Format**: WebP (optimal), PNG, atau JPG
- **Ukuran file**: Maksimal 5MB

### Order/Urutan Banner:

- Banner dengan order lebih kecil tampil lebih dulu
- Contoh: order 1, 2, 3 akan tampil berurutan
- Jika order sama, urutkan berdasarkan tanggal dibuat

### Link Tujuan:

- Internal link: `/gamepass`, `/rbx5`, `/joki`
- External link: `https://example.com`
- Link akan terbuka saat user klik banner

## Environment Variables

Pastikan file `.env.local` memiliki konfigurasi Cloudinary:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Catatan**: Upload banner menggunakan server-side API yang sudah terintegrasi dengan konfigurasi Cloudinary yang sama dengan gamepass dan joki.

## Menu Admin

Menu "Banner" dengan icon 🎨 sudah ditambahkan ke sidebar admin, terletak di antara "Jasa Joki" dan "Metode Pembayaran".

## Fallback Behavior

Jika tidak ada banner aktif di database, homepage akan menampilkan banner default:

1. Banner Gamepass (`/banner.webp`)
2. Banner Robux Promo (`/banner2.png`)
3. Banner Joki Service (`/banner.png`)

## UI/UX Features

### Admin Panel:

- Grid card layout yang responsive
- Image preview yang besar
- Status badge yang jelas
- Quick action buttons
- Smooth animations
- Dark theme consistency

### Homepage:

- Smooth carousel transition
- Loading state
- Auto-loop every 4 seconds
- Click to navigate
- Responsive design (mobile-friendly)

---

**Status**: ✅ Sistem Banner Management Lengkap dan Siap Digunakan
