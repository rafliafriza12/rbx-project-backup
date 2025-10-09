# 🛒 CHECKOUT SYSTEM IMPLEMENTATION

## 📋 Overview

Sistem checkout lengkap dengan integrasi Midtrans payment gateway dan email invoice untuk pembelian Robux, Gamepass, dan Joki.

## ✨ Fitur Yang Diimplementasikan

### 1. **Multi-Checkout Support** 🎯

- **Single Checkout**: Pembelian langsung dari halaman produk
- **Multi-Checkout**: Pembelian multiple items dari keranjang
- Auto-detect checkout type berdasarkan jumlah items

### 2. **Payment Method Integration** 💳

- Dynamic payment methods dari database
- Support multiple categories:
  - E-Wallet (GoPay, ShopeePay, QRIS)
  - Virtual Account (BCA, BNI, BRI, Mandiri, Permata)
  - Convenience Store (Indomaret, Alfamart)
  - Credit Card
- Automatic fee calculation (percentage/fixed)
- Real-time price update dengan fee

### 3. **Discount System** 🎁

- Member role-based discount
- Auto-apply berdasarkan memberRole user
- Display discount percentage dan amount
- Calculate final amount setelah discount

### 4. **Midtrans Integration** 💰

#### Konfigurasi

```typescript
// Environment variables
MIDTRANS_SERVER_KEY = your - server - key;
MIDTRANS_CLIENT_KEY = your - client - key;
MIDTRANS_MODE = sandbox / production;
NEXT_PUBLIC_BASE_URL = your - site - url;
```

#### Fitur

- Snap API integration
- 24-hour payment expiry
- Callback URLs untuk finish/error/pending
- Transaction status tracking
- Signature verification untuk webhook

### 5. **Email Invoice System** 📧

#### Konfigurasi Email

```typescript
// Di Settings model
emailHost: smtp.gmail.com
emailPort: 587
emailUser: your-email@gmail.com
emailPassword: your-app-password
emailFromName: RobuxID
emailFromAddress: noreply@yourdomain.com
emailNotifications: true/false
```

#### Invoice Email Features

- Professional HTML template
- Menampilkan detail transaksi lengkap
- Customer information
- Roblox account details (password hidden)
- Joki/Gamepass/Robux specific details
- Payment instructions dengan button
- Company contact information
- Auto-send setelah transaction dibuat

### 6. **Roblox Credentials Handling** 🎮

#### Single Checkout

- Form global untuk username & password
- Password sensor dengan toggle visibility
- Validation per service type

#### Multi-Checkout dari Cart

- Per-item credentials
- Username ditampilkan
- Password disensor (••••••••)
- Backup code ditampilkan lengkap (bukan hanya ✓)
- Icon dollar untuk Robux products

### 7. **Service-Specific Data Handling** 📦

#### Robux Instant

```typescript
robuxInstantDetails: {
  notes: string,           // Backup code
  additionalInfo: string,
  robuxAmount: number,
  productName: string,
  description: string,
}
```

#### Robux 5 Hari

```typescript
rbx5Details: {
  robuxAmount: number,
  packageName: string,
  selectedPlace: {
    placeId: number,
    name: string,
    universeId: number,
  },
  gamepassAmount: number,
  gamepassCreated: boolean,
  gamepass: {              // For automation via Roblox API
    id: number,
    name: string,
    price: number,
    productId: number,
    sellerId: number,
  },
  pricePerRobux: mixed,
  backupCode: string,
}
```

#### Joki

```typescript
jokiDetails: {
  description: string,
  gameType: string,
  targetLevel: string,
  estimatedTime: string,
  notes: string,          // Backup code
  additionalInfo: string,
}
```

#### Gamepass

```typescript
gamepassDetails: {
  gameName: string,
  itemName: string,
  gamepassId: string,
  additionalInfo: string,
}
```

### 8. **Guest Checkout** 👤

- Checkout tanpa login
- Manual input customer info (name, email, phone)
- Email validation
- Same invoice email system
- No user account creation

### 9. **Transaction Flow** 🔄

#### Single Item Checkout

```
Product Page → Add to Cart/Buy Now → Checkout Page
    ↓
Fill Form (username, password if needed)
    ↓
Select Payment Method
    ↓
Review Order (subtotal, discount, fee, total)
    ↓
Submit → POST /api/transactions
    ↓
Create Transaction → Midtrans Snap Token → Send Invoice Email
    ↓
Redirect to Midtrans Payment Page
```

#### Multi Item Checkout

```
Multiple Items in Cart → Checkout Page
    ↓
Show Each Item with Credentials
    ↓
Select Payment Method
    ↓
Review Order (items, subtotal, discount, fee, total)
    ↓
Submit → POST /api/transactions/multi
    ↓
Create Multiple Transactions → Single Midtrans Order → Send Invoice Email
    ↓
Redirect to Midtrans Payment Page
```

## 📁 File Structure

### API Endpoints

```
/api/transactions/route.ts        - Single transaction creation
/api/transactions/multi/route.ts  - Multi transaction creation
/api/payment-methods/route.ts     - Payment methods CRUD
```

### Models

```
/models/Transaction.ts  - Transaction schema dengan rbx5Details
/models/Cart.ts         - Cart schema dengan rbx5Details
/models/Settings.ts     - Site settings untuk Midtrans & Email
```

### Services

```
/lib/midtrans.ts  - Midtrans service (Snap API, Status, Cancel)
/lib/email.ts     - Email service (SMTP, Invoice template)
```

### Pages

```
/app/checkout/page.tsx  - Main checkout page
/app/(public)/rbx5/page.tsx        - Rbx5 product page
/app/(public)/robux-instant/page.tsx - Robux Instant page
/app/(public)/cart/page.tsx        - Shopping cart
```

### Components

```
/components/AddToCartButton.tsx  - Universal add to cart button
```

## 🔧 API Endpoints Detail

### POST /api/transactions (Single)

**Request Body:**

```json
{
  "serviceType": "robux|gamepass|joki",
  "serviceId": "string",
  "serviceName": "string",
  "serviceImage": "string",
  "serviceCategory": "robux_instant|robux_5_hari",
  "quantity": 1,
  "unitPrice": 100000,
  "totalAmount": 100000,
  "discountPercentage": 5,
  "discountAmount": 5000,
  "finalAmount": 97000,
  "robloxUsername": "username",
  "robloxPassword": "password",
  "jokiDetails": {},
  "robuxInstantDetails": {},
  "rbx5Details": {
    "gamepass": {
      "id": 123456,
      "productId": 789012,
      "sellerId": 345678
    }
  },
  "paymentMethodId": "gopay",
  "paymentFee": 3000,
  "customerInfo": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "08123456789"
  },
  "userId": "user-id-or-null"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transaction": {...},
    "snapToken": "xxx-xxx-xxx",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."
  }
}
```

### POST /api/transactions/multi (Multiple)

**Request Body:**

```json
{
  "items": [
    {
      "serviceType": "robux",
      "serviceId": "rbx5-500",
      "serviceName": "500 Robux (5 Hari)",
      "quantity": 1,
      "unitPrice": 50000,
      "robloxUsername": "user1",
      "rbx5Details": {...}
    },
    {
      "serviceType": "robux",
      "serviceId": "instant-1000",
      "serviceName": "1000 Robux Instant",
      "quantity": 1,
      "unitPrice": 80000,
      "robloxUsername": "user2",
      "robloxPassword": "pass2",
      "robuxInstantDetails": {...}
    }
  ],
  "totalAmount": 130000,
  "discountPercentage": 5,
  "discountAmount": 6500,
  "finalAmount": 126500,
  "paymentMethodId": "bca_va",
  "paymentFee": 4000,
  "customerInfo": {...},
  "userId": "user-id-or-null"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "transactions": [{...}, {...}],
    "masterOrderId": "MULTI-xxx-xxx",
    "snapToken": "xxx-xxx-xxx",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "totalTransactions": 2,
    "totalAmount": 130000,
    "discountAmount": 6500,
    "finalAmount": 126500
  }
}
```

## 💡 Key Features Implementation

### 1. Kalkulasi Harga Lengkap

```typescript
// Base amount
const baseAmount = items.reduce(
  (sum, item) => sum + item.quantity * item.unitPrice,
  0
);

// Discount (member-based)
const discountPercentage = user?.memberRole?.diskon || 0;
const discountAmount = Math.round((baseAmount * discountPercentage) / 100);
const afterDiscount = baseAmount - discountAmount;

// Payment method fee
const paymentFee =
  method.feeType === "percentage"
    ? Math.round((afterDiscount * method.fee) / 100)
    : method.fee;

// Final total
const finalAmount = afterDiscount + paymentFee;
```

### 2. Credentials per Item (Multi-Checkout)

```typescript
// Each item has its own credentials
{
  serviceName: "500 Robux",
  robloxUsername: "user1",      // ✓ Shown
  robloxPassword: "pass1",       // ✓ Hidden as ••••••••
  rbx5Details: {
    backupCode: "ABC123",        // ✓ Shown in full
    gamepass: {
      id: 123,                   // ✓ Saved for automation
      productId: 456,
      sellerId: 789
    }
  }
}
```

### 3. Icon Dollar untuk Robux Products

```tsx
{
  item.rbx5Details || item.robuxInstantDetails ? (
    <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border-2 border-green-500/30">
      <DollarSign className="w-8 h-8 text-green-400" />
    </div>
  ) : (
    <img src={item.serviceImage} className="w-16 h-16" />
  );
}
```

### 4. Email Invoice Auto-Send

```typescript
// After transaction created
if (customerInfo.email) {
  const emailSent = await EmailService.sendInvoiceEmail(transaction);
  // Transaction still succeeds even if email fails
}
```

## 🎨 UI/UX Features

### Checkout Page Display

- ✅ Dollar icon untuk Robux products (Instant & 5 Hari)
- ✅ Item list dengan credentials per item
- ✅ Username ditampilkan dengan warna hijau
- ✅ Password disensor (••••••••) dengan warna kuning
- ✅ Backup code ditampilkan lengkap dengan warna biru
- ✅ Real-time price calculation
- ✅ Payment method selection dengan accordion
- ✅ Terms & conditions checkbox
- ✅ Loading state saat submit
- ✅ Toast notifications untuk feedback

### Order Summary

```
Subtotal:        Rp 100.000
Diskon (5%):    -Rp   5.000
Biaya Admin:    +Rp   3.000
─────────────────────────────
Total Bayar:     Rp  98.000
```

## 🔐 Security Features

1. **Password Handling**

   - Never shown in plain text in UI
   - Stored encrypted in database
   - Shown as ••••••••

2. **Email Validation**

   - Regex pattern check
   - Required for invoice

3. **Midtrans Signature**

   - SHA512 verification
   - Server key validation

4. **Data Sanitization**
   - Trim whitespace
   - Validate required fields
   - Type checking

## 📊 Transaction Schema Updates

Added to Transaction model:

```typescript
rbx5Details: {
  robuxAmount: Number,
  packageName: String,
  selectedPlace: {...},
  gamepassAmount: Number,
  gamepassCreated: Boolean,
  gamepass: {           // 🔑 Critical for automation
    id: Number,
    name: String,
    price: Number,
    productId: Number,
    sellerId: Number,
  },
  pricePerRobux: Mixed,
  backupCode: String,
}
```

## 🚀 Testing Checklist

### Single Checkout

- [ ] Robux Instant dengan password
- [ ] Robux 5 Hari tanpa password
- [ ] Gamepass tanpa password
- [ ] Joki dengan password & backup code
- [ ] Guest checkout
- [ ] Logged in checkout
- [ ] Member discount applied
- [ ] Payment fee calculation
- [ ] Email invoice sent

### Multi Checkout

- [ ] Multiple items dari cart
- [ ] Each item credentials displayed correctly
- [ ] Username shown for all items
- [ ] Password censored for all items
- [ ] Backup code shown in full
- [ ] Dollar icon for Robux products
- [ ] Total calculation correct
- [ ] Single Midtrans payment
- [ ] Email invoice sent

### Payment Methods

- [ ] E-Wallet (GoPay, ShopeePay)
- [ ] Virtual Account (BCA, BNI, etc)
- [ ] QRIS
- [ ] Convenience Store
- [ ] Credit Card
- [ ] Fee calculation (percentage)
- [ ] Fee calculation (fixed)

### Email System

- [ ] SMTP connection works
- [ ] Invoice email sends
- [ ] Email template displays correctly
- [ ] All transaction details shown
- [ ] Payment button works
- [ ] Credentials hidden in email

## 🐛 Known Issues & Solutions

### Issue: Email not sending

**Solution:**

1. Check SMTP settings in Settings model
2. Enable "Less secure apps" for Gmail
3. Use App Password for Gmail
4. Check emailNotifications = true

### Issue: Midtrans redirect not working

**Solution:**

1. Check NEXT_PUBLIC_BASE_URL is set
2. Verify Midtrans keys (server & client)
3. Check callback URLs are correct
4. Ensure Midtrans script loaded

### Issue: Discount not applied

**Solution:**

1. Check user has memberRole
2. Verify memberRole.diskon field exists
3. Check calculation in calculateDiscount()

## 📝 Environment Variables Required

```env
# Midtrans
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_MODE=sandbox
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email (can also be set in Settings)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🎯 Next Steps

1. **Testing**: Test semua flow checkout
2. **Webhook**: Setup Midtrans webhook untuk auto-update status
3. **Admin Panel**: Interface untuk manage transactions
4. **Automation**: Implement Roblox API integration untuk auto-processing
5. **Monitoring**: Add logging dan error tracking

---

## ✅ Summary

Sistem checkout sekarang sudah **LENGKAP** dengan:

- ✅ Multi-checkout support
- ✅ Integrasi Midtrans payment gateway
- ✅ Email invoice otomatis
- ✅ Kalkulasi harga (discount + fee)
- ✅ Per-item credentials untuk multi-checkout
- ✅ Dollar icon untuk Robux products
- ✅ Backup code display yang benar
- ✅ Guest checkout support
- ✅ Gamepass data untuk automation
- ✅ Professional UI/UX

**Status**: 🚀 **READY FOR TESTING!**
