# Fitur Transaksi dengan Midtrans Integration

## Overview

Sistem transaksi lengkap yang terintegrasi dengan Midtrans Snap API untuk semua layanan (Robux, Gamepass, Joki) dengan dual status tracking (pembayaran + pesanan) dan sistem invoice otomatis.

## Fitur Utama

### 1. Model Transaksi Komprehensif

- **Dual Status Tracking**: Status pembayaran terpisah dari status pesanan
- **Invoice ID Otomatis**: Generate unique invoice dengan format INV-YYYYMMDD-XXXXX
- **Data Lengkap**: Menyimpan semua data termasuk kredensial Roblox (terenkripsi)
- **History Tracking**: Log semua perubahan status dengan timestamp

### 2. Integrasi Midtrans Snap API

- **Konfigurasi Dinamis**: API keys diambil dari settings admin
- **Sandbox/Production**: Support untuk environment sandbox dan production
- **Webhook Handler**: Otomatis update status dari notifikasi Midtrans
- **Retry Payment**: Fitur untuk mencoba ulang pembayaran yang gagal

### 3. Halaman Checkout

- **Multi-Service Form**: Form berbeda untuk setiap jenis layanan
- **Validasi Lengkap**: Client-side dan server-side validation
- **Responsive Design**: Optimal untuk desktop dan mobile
- **Progress Indicator**: Visual feedback untuk proses checkout

### 4. Status Pages

- **Success Page**: Konfirmasi pembayaran berhasil dengan detail lengkap
- **Pending Page**: Monitoring pembayaran pending dengan auto-refresh
- **Failed Page**: Handling gagal pembayaran dengan opsi retry
- **Troubleshooting**: Tips dan panduan untuk mengatasi masalah

### 5. Transaction Management

- **History Page**: Daftar semua transaksi user dengan filter
- **Status Filter**: Filter berdasarkan status pembayaran
- **Pagination**: Efficient loading untuk transaksi banyak
- **Real-time Updates**: Auto-refresh status transaksi

## File Structure

```
app/
├── checkout/
│   └── page.tsx                    # Halaman checkout lengkap
├── transaction/
│   ├── success/
│   │   └── page.tsx               # Halaman sukses pembayaran
│   ├── pending/
│   │   └── page.tsx               # Halaman pending payment
│   └── failed/
│       └── page.tsx               # Halaman gagal pembayaran
├── transactions/
│   └── page.tsx                   # Daftar semua transaksi user
└── api/
    └── transactions/
        ├── route.ts               # Create & list transactions
        ├── [id]/
        │   ├── route.ts           # Get, update, delete transaction
        │   └── retry/
        │       └── route.ts       # Retry failed payment
        └── webhook/
            └── route.ts           # Midtrans webhook handler

models/
└── Transaction.ts                 # MongoDB model dengan schema lengkap

lib/
└── midtrans.ts                   # Service class untuk Midtrans API
```

## Schema Database

### Transaction Model

```javascript
{
  // Basic Info
  invoiceId: String (unique, auto-generated),
  midtransOrderId: String (unique),

  // Service Details
  serviceId: String,
  serviceName: String,
  serviceType: String (robux/gamepass/joki),
  quantity: Number,
  totalAmount: Number,

  // Customer Info
  customerId: ObjectId,
  customerName: String,
  customerEmail: String,
  customerPhone: String,

  // Roblox Credentials (encrypted)
  robloxUsername: String,
  robloxPassword: String (encrypted),

  // Status Tracking
  paymentStatus: String (pending/paid/failed/expired/cancelled),
  orderStatus: String (waiting_payment/processing/in_progress/completed/cancelled/refunded),

  // Midtrans Integration
  snapToken: String,
  paymentType: String,
  transactionTime: Date,

  // Service Specific Data
  gamepassData: Object,
  jokiData: Object,
  robuxData: Object,

  // Tracking
  statusHistory: Array,
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Transaction Management

- `POST /api/transactions` - Create new transaction
- `GET /api/transactions` - List user transactions (with pagination)
- `GET /api/transactions/[id]` - Get transaction details
- `PUT /api/transactions/[id]` - Update transaction status
- `DELETE /api/transactions/[id]` - Cancel transaction
- `POST /api/transactions/[id]/retry` - Retry failed payment

### Webhook

- `POST /api/transactions/webhook` - Midtrans payment notification

## Flow Transaksi

### 1. Checkout Process

```
User memilih layanan →
Mengisi form checkout →
Validasi data →
Create transaction record →
Generate Midtrans Snap token →
Redirect ke Midtrans payment
```

### 2. Payment Flow

```
Midtrans Payment →
Webhook notification →
Update payment status →
Redirect user ke status page →
Process order (jika paid)
```

### 3. Order Processing

```
Payment confirmed →
Update order status to processing →
Execute service (robux/gamepass/joki) →
Update order status to completed →
Send notification to user
```

## Status Mapping

### Payment Status

- `pending` - Menunggu pembayaran
- `paid` - Pembayaran berhasil
- `failed` - Pembayaran gagal
- `expired` - Pembayaran kadaluarsa
- `cancelled` - Pembayaran dibatalkan

### Order Status

- `waiting_payment` - Menunggu pembayaran
- `processing` - Sedang diproses
- `in_progress` - Sedang dikerjakan (khusus joki)
- `completed` - Selesai
- `cancelled` - Dibatalkan
- `refunded` - Dikembalikan

## Security Features

### 1. Data Encryption

- Password Roblox dienkripsi menggunakan crypto
- Sensitive data tidak disimpan dalam plain text

### 2. Webhook Security

- Signature verification dari Midtrans
- IP whitelist untuk webhook endpoint
- Request validation dan sanitization

### 3. User Authentication

- JWT-based authentication
- Role-based access control
- Session management

## Environment Variables

```bash
# Midtrans Configuration
MIDTRANS_SERVER_KEY=SB-Mid-server-your_server_key_here
MIDTRANS_CLIENT_KEY=SB-Mid-client-your_client_key_here
MIDTRANS_IS_PRODUCTION=false
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-your_client_key_here

# Database
MONGODB_URI=mongodb://localhost:27017/rbx-store

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install react-toastify
```

### 2. Setup Environment

```bash
cp .env.example .env.local
# Edit .env.local dengan konfigurasi Midtrans Anda
```

### 3. Setup Database

```bash
# Pastikan MongoDB running
# Model akan auto-create collection saat first run
```

### 4. Configure Midtrans

1. Daftar di Midtrans Dashboard
2. Dapatkan Server Key dan Client Key
3. Setup webhook URL di dashboard
4. Test dengan sandbox environment

## Testing

### 1. Test Payment Flow

- Gunakan test card numbers dari Midtrans
- Test semua status: success, pending, failed
- Verify webhook notifications

### 2. Test Order Processing

- Test untuk setiap jenis layanan
- Verify status updates
- Test retry functionality

## Troubleshooting

### Common Issues

1. **Webhook tidak terima**: Check URL dan firewall
2. **Payment gagal**: Verify API keys dan sandbox mode
3. **Status tidak update**: Check webhook signature
4. **CORS errors**: Configure Midtrans allowed origins

### Debug Tools

- Check browser console untuk Snap errors
- Monitor webhook logs di Midtrans dashboard
- Use transaction history untuk tracking

## Future Enhancements

1. **Email Notifications**: Send email untuk status updates
2. **WhatsApp Integration**: Notifikasi via WhatsApp
3. **Refund System**: Handle refund requests
4. **Analytics Dashboard**: Transaction analytics untuk admin
5. **Multi-Currency**: Support multiple currencies
