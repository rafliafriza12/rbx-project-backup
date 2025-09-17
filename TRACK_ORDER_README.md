# Fitur Track Order

## Deskripsi

Fitur Track Order memungkinkan pengguna (baik yang sudah login maupun guest) untuk melacak status pesanan mereka dengan memasukkan kode invoice.

## Cara Menggunakan

### 1. Akses Halaman Track Order

- Klik menu "🔍 Lacak Pesanan" di header website
- Atau kunjungi `/track-order` secara langsung

### 2. Masukkan Kode Invoice

- Input kode invoice pada form pencarian
- Kode invoice format: `INV-YYYYMMDD-XXX` (contoh: `INV-20240912-001`)
- Klik tombol "🔍 Lacak Pesanan"

### 3. Lihat Detail Transaksi

Setelah kode invoice ditemukan, halaman akan menampilkan:

- **Detail Pesanan**: Nama layanan, tipe, quantity, harga total
- **Status Pesanan**: Status terkini dan badge warna
- **Informasi Pembeli**: Nama, email, telepon
- **Riwayat Status**: Timeline perubahan status pesanan
- **Status Pembayaran**: Status dan metode pembayaran

## Fitur yang Tersedia

### Status Tracking

- **Pending**: Menunggu pembayaran
- **Paid**: Pembayaran berhasil
- **Processing**: Sedang diproses
- **Completed**: Pesanan selesai
- **Cancelled**: Pesanan dibatalkan
- **Failed**: Pesanan gagal
- **Expired**: Pesanan kadaluarsa

### Actions Available

- **Lanjutkan Pembayaran**: Untuk pesanan dengan status pending
- **Cetak Detail**: Cetak informasi pesanan
- **Hubungi CS**: Link ke WhatsApp customer service
- **Lacak Pesanan Lain**: Reset form untuk pencarian baru

## API Endpoints

### GET `/api/transactions/invoice/[invoiceId]`

Mengambil detail transaksi berdasarkan invoice ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "string",
    "invoiceId": "string",
    "serviceName": "string",
    "serviceType": "gamepass|joki|rbx5",
    "quantity": number,
    "totalAmount": number,
    "paymentStatus": "pending|paid|failed|expired",
    "orderStatus": "pending|processing|completed|cancelled|failed",
    "createdAt": "string",
    "updatedAt": "string",
    "robloxUsername": "string",
    "midtransOrderId": "string",
    "customerInfo": {
      "name": "string",
      "email": "string",
      "phone": "string"
    },
    "statusHistory": [
      {
        "status": "string",
        "updatedAt": "string",
        "updatedBy": "string",
        "notes": "string"
      }
    ]
  },
  "message": "Transaksi ditemukan"
}
```

## Mock Data untuk Testing

Tersedia 3 sample invoice untuk testing:

- `INV-20240912-001` - Gamepass completed
- `INV-20240912-002` - Joki pending payment
- `INV-20240912-003` - Robux failed/cancelled

## File Structure

```
app/
├── (public)/
│   └── track-order/
│       └── page.tsx          # Halaman utama track order
├── api/
│   └── transactions/
│       └── invoice/
│           └── [invoiceId]/
│               └── route.ts   # API endpoint
types/
└── index.ts                   # Type definitions

components/
└── header/
    └── public-app-header.tsx  # Navigation link
```

## Theme & Styling

- Menggunakan base theme: `from-[#f9d6db] via-[#f5b8c6] to-white`
- Glassmorphism effect dengan `bg-white/90 backdrop-blur-sm`
- Responsive design untuk mobile dan desktop
- Status badges dengan warna yang sesuai

## Integrasi dengan Sistem

- Terintegrasi dengan context authentication
- Compatible dengan guest users
- Toast notifications menggunakan react-toastify
- Navigation links di header dan footer

## Error Handling

- Input validation untuk kode invoice
- API error handling dengan user-friendly messages
- Loading states dan empty states
- Network error handling

## SEO & Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Alt text untuk images
- Keyboard navigation support
