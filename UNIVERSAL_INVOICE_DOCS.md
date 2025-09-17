# Universal Invoice System Documentation

## Overview

Sistem invoice universal yang dapat menangani semua jenis pemesanan di project ini:

- 🎮 **Gamepass** - Pembelian gamepass untuk berbagai game
- 💎 **Robux 5 Hari** - Pembelian robux dengan pengiriman dalam 5 hari
- ⚡ **Robux Instant** - Pembelian robux dengan pengiriman instant
- 👤 **Jasa Joki** - Layanan joki ranking atau achievement

## Struktur File

```
/app/(public)/
├── invoice/[id]/page.tsx       # Universal invoice page (NEW)
├── test-invoice/page.tsx       # Test page untuk demo berbagai invoice
└── gamepass/[id]/page.tsx      # Updated dengan link ke checkout

/utils/
└── invoice.ts                  # Utility functions untuk invoice

/components/header/
└── public-app-header.tsx       # Updated dengan active link highlighting
```

## Flow Penggunaan

### 1. Akses Invoice via URL Parameters

```
/invoice/[id]?type=gamepass&package=Product%20Name&price=300000&quantity=1
```

### 2. Parameter URL yang Didukung

- `type`: "gamepass" | "robux5" | "robux-instant" | "joki"
- `package`: Nama produk/paket
- `price`: Harga dalam rupiah
- `quantity`: Jumlah (default: 1)
- `game`: Nama game (opsional)
- `robux`: Jumlah robux (untuk produk robux)
- `service`: Jenis layanan (untuk joki)

### 3. Contoh URL untuk Setiap Jenis

#### Gamepass

```
/invoice/GP-12345678?type=gamepass&package=Anime%20Last%20Stand%20-%20Goku%20UI&price=300000&game=Anime%20Last%20Stand
```

#### Robux 5 Hari

```
/invoice/R5-12345678?type=robux5&package=1000%20Robux&price=14000&robux=1000
```

#### Robux Instant

```
/invoice/RI-12345678?type=robux-instant&package=5000%20Robux&price=70000&robux=5000
```

#### Jasa Joki

```
/invoice/JK-12345678?type=joki&package=Joki%20Bronze%20to%20Gold&price=150000&service=ranking
```

## Features Universal Invoice

### ✅ Adaptive Content

- **Title & Description**: Berubah sesuai jenis pesanan
- **Required Fields**: Field yang wajib diisi menyesuaikan jenis pesanan
- **Info Messages**: Pesan informatif khusus setiap jenis pesanan
- **Invoice Prefix**: Prefix invoice otomatis (GP-, R5-, RI-, JK-)

### ✅ Smart Form Validation

- **Gamepass**: Nama, Email, Username Roblox
- **Robux**: Nama, Email, Username Roblox
- **Joki**: Nama, Email, Username Roblox, Display ID/Name
- **Base**: Nama, Email (minimum requirement)

### ✅ Dynamic Pricing

- **Base Price**: Harga produk dari parameter URL
- **Admin Fee**: Biaya admin berdasarkan metode pembayaran
- **Total Calculation**: Otomatis menghitung total akhir

### ✅ Payment Methods Support

- **E-Wallet**: DANA, GoPay, ShopeePay (+Rp 1.000)
- **Virtual Account**: BCA, BNI, BRI (+Rp 2.000)
- **Retail**: Alfamart (+Rp 2.500)

## Demo & Testing

### Test Page

Akses `/test-invoice` untuk melihat demo berbagai jenis invoice:

- 🎮 Gamepass Demo
- 💎 Robux 5 Hari Demo
- ⚡ Robux Instant Demo
- 👤 Jasa Joki Demo

### Manual Testing

Buat URL custom dengan parameter yang diinginkan:

```
/invoice/TEST-123?type=gamepass&package=Test%20Product&price=100000
```

## Integration dengan Halaman Lain

### Dari Halaman Produk

```javascript
// Contoh redirect ke invoice
const handleBuyNow = () => {
  const params = new URLSearchParams({
    type: "gamepass",
    package: productName,
    price: productPrice.toString(),
    game: gameName,
    quantity: "1",
  });

  router.push(`/invoice/${generateId()}?${params.toString()}`);
};
```

### Dari Halaman Checkout (Legacy)

Invoice bisa menerima data dari localStorage jika ada invoice yang sudah dibuat sebelumnya.

## Customization

### Menambah Jenis Pesanan Baru

1. Update interface `OrderData.type`
2. Tambah case di `getOrderTitle()` dan `getOrderDescription()`
3. Update `getRequiredFields()` untuk field validation
4. Tambah prefix baru di `getInvoicePrefix()`

### Menambah Payment Method

1. Tambah ke array `paymentMethods`
2. Pastikan icon tersedia di `/public`
3. Set fee yang sesuai

### Mengubah Styling

File menggunakan:

- **Theme**: Dark theme dengan accent color `#FF9C01`
- **Layout**: Responsive grid (1 col mobile, 3 col desktop)
- **Components**: Tailwind CSS classes

## Notes

- ✅ **URL Parameters**: Sistem utama untuk passing data
- ✅ **LocalStorage Fallback**: Support untuk invoice yang sudah dibuat
- ✅ **Form Validation**: Real-time validation berdasarkan jenis pesanan
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Loading States**: Loading indicator saat memproses
- ✅ **Error Handling**: User-friendly error messages

## Implementation Checklist

- [x] Universal invoice component
- [x] URL parameter parsing
- [x] Dynamic form validation
- [x] Payment method selection
- [x] Responsive design
- [x] Test page for demos
- [x] Documentation
- [ ] Integration dengan payment gateway
- [ ] Real-time status updates
- [ ] Email notifications
- [ ] Admin dashboard integration
