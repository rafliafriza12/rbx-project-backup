# Seed Payment Methods - Panduan Penggunaan

## 📋 Overview

Script untuk memasukkan contoh payment methods ke database yang siap untuk integrasi Midtrans.

**11 Payment Methods yang akan ditambahkan:**

### E-Wallet (2)

- ✅ **GOPAY** - GoPay (fee: Rp 2,500)
- ✅ **SHOPEEPAY** - ShopeePay (fee: Rp 2,500)

### QRIS (1)

- ✅ **QRIS** - QRIS (fee: 0.7%)

### Bank Transfer / Virtual Account (5)

- ✅ **BCA_VA** - BCA Virtual Account (fee: Rp 4,000)
- ✅ **BNI_VA** - BNI Virtual Account (fee: Rp 4,000)
- ✅ **BRI_VA** - BRI Virtual Account (fee: Rp 4,000)
- ✅ **PERMATA_VA** - Permata Virtual Account (fee: Rp 4,000)
- ✅ **ECHANNEL** - Mandiri Bill Payment (fee: Rp 4,000)

### Retail / Minimarket (2)

- ✅ **INDOMARET** - Indomaret (fee: Rp 2,500)
- ✅ **ALFAMART** - Alfamart (fee: Rp 2,500)

### Credit Card (1)

- ✅ **CREDIT_CARD** - Credit Card (fee: 2.9%)

---

## 🚀 Cara 1: Via Node Script

### Prerequisites

```bash
# Pastikan MongoDB URI sudah di-set di environment
export MONGODB_URI="mongodb://localhost:27017/rbx-project"
# atau
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/dbname"
```

### Run Script

```bash
cd /home/whoami/Downloads/rbx-project/rbx-project/frontend

node scripts/seed-payment-methods.js
```

### Expected Output

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

🗑️  Clearing existing payment methods...
✅ Deleted 0 existing payment methods

📦 Inserting sample payment methods...

✅ Created: GOPAY - GoPay (ewallet)
✅ Created: SHOPEEPAY - ShopeePay (ewallet)
✅ Created: QRIS - QRIS (qris)
✅ Created: BCA_VA - BCA Virtual Account (bank_transfer)
✅ Created: BNI_VA - BNI Virtual Account (bank_transfer)
✅ Created: BRI_VA - BRI Virtual Account (bank_transfer)
✅ Created: PERMATA_VA - Permata Virtual Account (bank_transfer)
✅ Created: ECHANNEL - Mandiri Bill Payment (bank_transfer)
✅ Created: INDOMARET - Indomaret (retail)
✅ Created: ALFAMART - Alfamart (retail)
✅ Created: CREDIT_CARD - Credit Card (credit_card)

📊 Summary:
   Total Payment Methods: 11
   Active: 11
   Midtrans Enabled: 11

📋 By Category:
   bank_transfer: 5
   credit_card: 1
   ewallet: 2
   qris: 1
   retail: 2

✅ Seeding completed successfully!

🎉 You can now use these payment methods in your application!
   Access admin panel at: http://localhost:3000/admin/payment-methods

🔌 Disconnected from MongoDB
```

---

## 🚀 Cara 2: Via API Endpoint

### Start Development Server

```bash
cd /home/whoami/Downloads/rbx-project/rbx-project/frontend
pnpm dev
```

### Call API Endpoint

```bash
# Using curl
curl -X POST http://localhost:3000/api/seed-payment-methods

# Or using httpie
http POST http://localhost:3000/api/seed-payment-methods
```

### API Response

```json
{
  "success": true,
  "message": "Payment methods seeded successfully",
  "data": {
    "created": [
      {
        "code": "GOPAY",
        "name": "GoPay",
        "category": "ewallet",
        "status": "created"
      }
      // ... more items
    ],
    "errors": [],
    "statistics": {
      "total": 11,
      "active": 11,
      "midtransEnabled": 11,
      "byCategory": {
        "ewallet": 2,
        "qris": 1,
        "bank_transfer": 5,
        "retail": 2,
        "credit_card": 1
      }
    }
  }
}
```

---

## 🚀 Cara 3: Via Browser (Postman/Thunder Client)

1. **Open Postman atau Thunder Client**
2. **Create new request:**
   - Method: `POST`
   - URL: `http://localhost:3000/api/seed-payment-methods`
3. **Click Send**
4. **Check response** untuk melihat hasil

---

## ✅ Verifikasi Hasil

### 1. Via Admin Panel

```
Buka browser: http://localhost:3000/admin/payment-methods

Anda akan melihat:
- 11 payment methods di table
- Stats: Total: 11, Active: 11, Midtrans: 11
- Payment methods grouped by category
```

### 2. Via MongoDB Compass

```
1. Connect ke MongoDB
2. Pilih database: rbx-project (atau sesuai nama database Anda)
3. Buka collection: paymentmethods
4. Anda akan melihat 11 documents
```

### 3. Via API

```bash
curl http://localhost:3000/api/payment-methods
```

### 4. Via Checkout Page

```
1. Buka produk page (e.g., Robux)
2. Klik "Beli Sekarang"
3. Isi form checkout
4. Scroll ke payment method section
5. Anda akan melihat semua 11 payment methods grouped by category
```

---

## 📝 Detail Payment Methods

### GoPay (GOPAY)

```javascript
{
  code: "GOPAY",
  category: "ewallet",
  fee: 2500 (fixed),
  min: Rp 10,000,
  max: Rp 2,000,000,
  midtrans: enabled
}
```

### ShopeePay (SHOPEEPAY)

```javascript
{
  code: "SHOPEEPAY",
  category: "ewallet",
  fee: 2500 (fixed),
  min: Rp 10,000,
  max: Rp 2,000,000,
  midtrans: enabled
}
```

### QRIS (QRIS)

```javascript
{
  code: "QRIS",
  category: "qris",
  fee: 0.7% (percentage),
  min: Rp 1,500,
  max: Rp 10,000,000,
  midtrans: enabled
}
```

### BCA Virtual Account (BCA_VA)

```javascript
{
  code: "BCA_VA",
  category: "bank_transfer",
  fee: 4000 (fixed),
  min: Rp 10,000,
  max: Rp 50,000,000,
  midtrans: enabled
}
```

### BNI Virtual Account (BNI_VA)

```javascript
{
  code: "BNI_VA",
  category: "bank_transfer",
  fee: 4000 (fixed),
  min: Rp 10,000,
  max: Rp 50,000,000,
  midtrans: enabled
}
```

### BRI Virtual Account (BRI_VA)

```javascript
{
  code: "BRI_VA",
  category: "bank_transfer",
  fee: 4000 (fixed),
  min: Rp 10,000,
  max: Rp 50,000,000,
  midtrans: enabled
}
```

### Permata Virtual Account (PERMATA_VA)

```javascript
{
  code: "PERMATA_VA",
  category: "bank_transfer",
  fee: 4000 (fixed),
  min: Rp 10,000,
  max: Rp 50,000,000,
  midtrans: enabled
}
```

### Mandiri Bill Payment (ECHANNEL)

```javascript
{
  code: "ECHANNEL",
  category: "bank_transfer",
  fee: 4000 (fixed),
  min: Rp 10,000,
  max: Rp 50,000,000,
  midtrans: enabled
}
```

### Indomaret (INDOMARET)

```javascript
{
  code: "INDOMARET",
  category: "retail",
  fee: 2500 (fixed),
  min: Rp 10,000,
  max: Rp 5,000,000,
  midtrans: enabled
}
```

### Alfamart (ALFAMART)

```javascript
{
  code: "ALFAMART",
  category: "retail",
  fee: 2500 (fixed),
  min: Rp 10,000,
  max: Rp 5,000,000,
  midtrans: enabled
}
```

### Credit Card (CREDIT_CARD)

```javascript
{
  code: "CREDIT_CARD",
  category: "credit_card",
  fee: 2.9% (percentage),
  min: Rp 10,000,
  max: Rp 100,000,000,
  midtrans: enabled
}
```

---

## 🔄 Re-run Seed

**Script akan:**

1. ❌ Hapus semua payment methods existing
2. ✅ Insert 11 payment methods baru

**Jadi aman untuk re-run berkali-kali!**

---

## ⚠️ Catatan Penting

### 1. Kode Sesuai Midtrans

Semua kode payment method (`code`) sudah sesuai dengan:

- Midtrans Payment Gateway documentation
- Midtrans Snap API
- Dapat langsung digunakan untuk create transaction

### 2. Fee Realistis

Fee yang diset berdasarkan:

- MDR (Merchant Discount Rate) rata-rata di Indonesia
- E-wallet: Rp 2,500 - Rp 3,000
- VA: Rp 4,000 - Rp 5,000
- QRIS: 0.7% - 1%
- Credit Card: 2.9% - 3.5%

### 3. Limits

- Min/max amount berdasarkan limit umum payment gateway
- Dapat disesuaikan sesuai kebutuhan bisnis

### 4. Instructions

Setiap payment method memiliki instruksi lengkap untuk user

---

## 🧪 Testing Flow

### 1. Run Seed

```bash
node scripts/seed-payment-methods.js
```

### 2. Check Admin Panel

```
http://localhost:3000/admin/payment-methods
- Verify 11 methods appear
- Check stats: 11 total, 11 active
```

### 3. Test Checkout

```
1. Add product to cart
2. Go to checkout
3. Select payment method
4. Verify fee calculation
5. Check total update
```

### 4. Test Each Method

- ✅ GoPay: Fee Rp 2,500
- ✅ QRIS: Fee 0.7% (Rp 700 for Rp 100k)
- ✅ BCA VA: Fee Rp 4,000
- ✅ Indomaret: Fee Rp 2,500
- ✅ Credit Card: Fee 2.9%

---

## 🐛 Troubleshooting

### Error: Cannot connect to MongoDB

```bash
# Check MongoDB URI
echo $MONGODB_URI

# Or set it manually
export MONGODB_URI="your_mongodb_uri"
```

### Error: Duplicate key error

```
Reason: Payment method dengan code sama sudah exist
Solution: Script akan auto-clear existing, re-run aja
```

### Payment methods tidak muncul di checkout

```
1. Check isActive: true
2. Refresh browser
3. Clear cache
4. Check browser console for errors
```

---

## 📚 Next Steps

Setelah seed berhasil:

1. **Test di Admin Panel**

   - Edit payment method
   - Toggle active/inactive
   - Upload icon images

2. **Test di Checkout**

   - Select payment method
   - Verify fee calculation
   - Test dengan berbagai amounts

3. **Integration dengan Midtrans**
   - Update Midtrans credentials
   - Test sandbox transaction
   - Go to production

---

## 🎯 Quick Commands

```bash
# Run seed script
node scripts/seed-payment-methods.js

# Or via API
curl -X POST http://localhost:3000/api/seed-payment-methods

# Check via API
curl http://localhost:3000/api/payment-methods

# Check via admin
open http://localhost:3000/admin/payment-methods

# Check via checkout
open http://localhost:3000/checkout
```

---

**Ready! Jalankan script dan 11 payment methods siap digunakan!** 🚀
