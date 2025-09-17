# Invoice System Documentation

## Overview

Sistem invoice yang telah dibuat dapat digunakan untuk semua jenis pemesanan di project ini (Gamepass, Joki, Robux).

## Struktur File

```
/app/(public)/
├── checkout/page.tsx          # Halaman checkout form
├── invoice/[id]/page.tsx      # Halaman invoice detail
└── gamepass/[id]/page.tsx     # Updated dengan link ke checkout

/utils/
└── invoice.ts                 # Utility functions untuk invoice

/components/header/
└── public-app-header.tsx      # Updated dengan active link highlighting
```

## Flow Penggunaan

### 1. User memilih produk (contoh: Gamepass)

- User mengklik "Beli Sekarang" di halaman produk
- Redirect ke `/checkout`

### 2. Halaman Checkout (`/checkout`)

- Form untuk mengisi informasi customer
- Form untuk informasi game (username, display ID)
- Pilihan metode pembayaran
- Ringkasan pesanan
- Tombol "Lanjutkan ke Pembayaran"

### 3. Generate Invoice

- Setelah submit form, sistem generate invoice ID unik
- Data disimpan ke localStorage (untuk demo) atau API
- Redirect ke halaman invoice `/invoice/[id]`

### 4. Halaman Invoice (`/invoice/[id]`)

- Menampilkan detail pesanan sesuai gambar yang diberikan
- Countdown timer untuk pembayaran
- Status pembayaran (pending, paid, failed, expired)
- Pilihan metode pembayaran
- Informasi customer dan game
- Tombol pembayaran

## Komponen Utama

### InvoiceData Interface

```typescript
interface InvoiceData {
  id: string;
  type: "gamepass" | "joki" | "robux";
  orderDetails: OrderDetail[];
  customerInfo: CustomerInfo;
  gameInfo?: GameInfo;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: "pending" | "paid" | "failed" | "expired";
  createdAt: string;
  expiredAt: string;
}
```

### Utility Functions

- `formatRupiah()` - Format angka ke format mata uang Indonesia
- `generateInvoiceId()` - Generate ID invoice unik
- `createInvoice()` - Buat object invoice dari data pesanan
- `getStatusColor()` - Get CSS class berdasarkan status

## Features

### ✅ Implemented

- [x] Responsive design mengikuti tema project
- [x] Support untuk semua jenis produk (gamepass, joki, robux)
- [x] Form validation
- [x] Countdown timer pembayaran
- [x] Multiple payment methods
- [x] Status tracking
- [x] Active navigation highlighting

### 🚀 Demo

- Kunjungi `/checkout` untuk melihat form
- Klik "Lihat Demo Invoice" untuk contoh invoice
- Atau langsung akses `/invoice/DEMO-123456`

## Payment Methods Support

- DANA
- GoPay
- ShopeePay
- E-Wallet (generic)
- QRIS Virtual Account
- BRI Virtual Account
- Minimarket
- Alfamart

## Customization

### Untuk menambah produk baru:

1. Update interface `OrderDetail` jika perlu field tambahan
2. Update enum `type` di `InvoiceData`
3. Buat halaman checkout khusus atau gunakan yang sudah ada

### Untuk menambah payment method:

1. Update array `PAYMENT_METHODS` di `utils/invoice.ts`
2. Pastikan icon tersedia di folder `/public`

### Untuk integrasi dengan backend:

1. Ganti localStorage dengan API calls
2. Implement real-time status updates
3. Add webhook untuk update status pembayaran

## Notes

- Semua data saat ini disimpan di localStorage untuk demo
- Timer countdown otomatis update setiap detik
- Design responsive untuk mobile dan desktop
- Konsisten dengan tema warna merah (#CE3535) project
