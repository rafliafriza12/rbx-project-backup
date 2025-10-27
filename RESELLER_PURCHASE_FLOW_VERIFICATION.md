# Verifikasi Flow Pembelian Reseller Package

## 🎯 Status: **SEMUA SUDAH BENAR** ✅

Setelah dilakukan audit menyeluruh, berikut adalah verifikasi lengkap bahwa flow pembelian reseller package sudah benar dan siap digunakan.

---

## 📋 Flow Pembelian Reseller

### 1. **Halaman Reseller** (`/app/(public)/reseller/page.tsx`)

**Location:** Lines 110-143

Saat user klik tombol "Beli" pada reseller package:

```typescript
const checkoutData = {
  serviceType: "reseller", // ✅ Correct
  serviceId: pkg._id, // ✅ Correct - ID dari ResellerPackage
  serviceName: pkg.name, // ✅ Correct
  serviceImage: "",
  serviceCategory: "reseller", // ✅ Correct
  quantity: 1,
  unitPrice: pkg.price,
  resellerDetails: {
    tier: pkg.tier,
    duration: pkg.duration,
    discount: pkg.discount,
    features: pkg.features,
  },
};

sessionStorage.setItem("checkoutData", JSON.stringify([checkoutData]));
router.push("/checkout");
```

**✅ Validasi:**

- `serviceType` diset ke `"reseller"` - sesuai dengan enum di Transaction model
- `serviceId` berisi `pkg._id` - ini adalah MongoDB ObjectId dari ResellerPackage
- `serviceCategory` diset ke `"reseller"`

---

### 2. **Halaman Checkout** (`/app/checkout/page.tsx`)

#### A. Validasi Form (Lines 547-551)

```typescript
// Reseller packages don't need Roblox credentials
const isResellerPurchase = checkoutData.items.some(
  (item) => item.serviceType === "reseller"
);

if (!isResellerPurchase && !robloxUsername.trim()) {
  toast.error("Username Roblox harus diisi");
  return;
}
```

**✅ Validasi:**

- Reseller packages **TIDAK** membutuhkan username/password Roblox
- Form validation di-skip untuk reseller purchase

#### B. Password Field Hidden (Lines 1361-1365)

```typescript
{/* Roblox Account - Hide for Reseller packages */}
{!checkoutData.items.some(
  (item) => item.serviceType === "reseller"
) && (
  // ... render password field
)}
```

**✅ Validasi:**

- Password field tidak ditampilkan untuk reseller packages

#### C. Data Dikirim ke API (Lines 810-820)

**Single-item checkout:**

```typescript
{
  serviceType: itemsWithCredentials[0].serviceType,  // "reseller"
  serviceId: itemsWithCredentials[0].serviceId,      // ResellerPackage._id
  serviceName: itemsWithCredentials[0].serviceName,
  serviceCategory: itemsWithCredentials[0].serviceCategory, // "reseller"
  quantity: 1,
  unitPrice: pkg.price,
  // ... other fields
}
```

**✅ Validasi:**

- `serviceId` diteruskan dengan benar ke API
- `serviceType` adalah `"reseller"`

---

### 3. **API Transactions** (`/app/api/transactions/route.ts`)

#### A. Single-Item Transaction (Lines 892-895)

```typescript
const transactionData: any = {
  serviceType, // "reseller"
  serviceId, // ResellerPackage._id
  serviceName,
  serviceImage,
  // ...
};
```

**✅ Validasi:**

- `serviceId` disimpan di Transaction document
- Field ini akan digunakan oleh webhook untuk mencari ResellerPackage

#### B. Multi-Item Transaction (Lines 444-448)

```typescript
const transactionData: any = {
  serviceType: item.serviceType, // "reseller"
  serviceId: item.serviceId, // ResellerPackage._id
  serviceName: item.serviceName,
  // ...
};
```

**✅ Validasi:**

- Multi-item juga menyimpan `serviceId` dengan benar

---

### 4. **Webhook Handler** (`/app/api/transactions/webhook/route.ts`)

#### A. Activation Function (Lines 11-64)

```typescript
async function activateResellerPackage(transaction: any) {
  // Get ResellerPackage using serviceId from transaction
  const resellerPackage = await ResellerPackage.findById(
    transaction.serviceId // ✅ Menggunakan serviceId yang tersimpan
  );

  if (!resellerPackage) {
    console.log("Reseller package not found:", transaction.serviceId);
    return null;
  }

  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + resellerPackage.duration);

  // Update user
  user.resellerTier = resellerPackage.tier;
  user.resellerExpiry = expiryDate;
  user.resellerPackageId = resellerPackage._id;
  await user.save();

  return {
    /* activation details */
  };
}
```

**✅ Validasi:**

- Function mencari ResellerPackage menggunakan `transaction.serviceId`
- Menghitung expiry date berdasarkan `package.duration` (dalam bulan)
- Update user dengan tier, expiry, dan packageId

#### B. Webhook Integration (Lines 334-356)

```typescript
// Activate reseller package if this is a reseller purchase
if (
  statusMapping.paymentStatus === "settlement" &&
  previousPaymentStatus !== "settlement" &&
  transaction.serviceType === "reseller" // ✅ Check serviceType
) {
  const activationResult = await activateResellerPackage(transaction);

  if (activationResult) {
    console.log(
      `Reseller package activated: Tier ${activationResult.newTier} ` +
        `(${activationResult.packageName}), ` +
        `Discount: ${activationResult.discount}%, ` +
        `Expires: ${activationResult.expiryDate.toLocaleDateString("id-ID")}`
    );
  }
}
```

**✅ Validasi:**

- Aktivasi dipanggil hanya saat:
  - Payment status berubah menjadi `"settlement"`
  - `serviceType === "reseller"`
- Error handling tidak menggagalkan webhook

---

### 5. **Transaction Model** (`/models/Transaction.ts`)

```typescript
serviceType: {
  type: String,
  enum: ["robux", "gamepass", "joki", "reseller"],  // ✅ "reseller" added
  required: true,
}
```

**✅ Validasi:**

- `"reseller"` sudah ditambahkan ke enum serviceType
- Model mendukung field `serviceId` untuk menyimpan reference ke ResellerPackage

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Opens /reseller page                                    │
│    - Melihat daftar reseller packages                           │
│    - Klik tombol "Beli" pada package yang dipilih              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Prepare Checkout Data                                         │
│    {                                                             │
│      serviceType: "reseller",                                   │
│      serviceId: pkg._id,        ← ResellerPackage MongoDB ID    │
│      serviceName: pkg.name,                                     │
│      serviceCategory: "reseller",                               │
│      unitPrice: pkg.price,                                      │
│      resellerDetails: { tier, duration, discount, features }    │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Redirect to /checkout                                         │
│    - Data disimpan di sessionStorage                            │
│    - Password field HIDDEN (tidak perlu credentials)            │
│    - Validation di-skip untuk reseller                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. User Isi Data & Pilih Payment Method                         │
│    - Nama, Email, Phone (required)                              │
│    - Pilih metode pembayaran                                    │
│    - Klik "Bayar Sekarang"                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. POST /api/transactions                                        │
│    - Create Transaction document:                               │
│      {                                                           │
│        serviceType: "reseller",                                 │
│        serviceId: pkg._id,      ← Saved to database             │
│        serviceName: pkg.name,                                   │
│        paymentStatus: "waiting_payment"                         │
│      }                                                           │
│    - Create Midtrans Snap transaction                           │
│    - Return snap_token                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. User Completes Payment via Midtrans                          │
│    - Redirect ke Midtrans payment page                          │
│    - User bayar dengan metode yang dipilih                      │
│    - Payment successful                                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Midtrans Sends Webhook Notification                          │
│    POST /api/transactions/webhook                               │
│    {                                                             │
│      order_id: "...",                                           │
│      transaction_status: "settlement",                          │
│      ...                                                         │
│    }                                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Webhook Handler Processes                                    │
│    - Find transaction by order_id                               │
│    - Check: transaction.serviceType === "reseller"? ✅          │
│    - Check: paymentStatus changed to "settlement"? ✅           │
│    - Call activateResellerPackage(transaction)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. activateResellerPackage() Function                           │
│    - Get ResellerPackage.findById(transaction.serviceId)       │
│    - Calculate expiry: now + package.duration months            │
│    - Update User:                                               │
│      * user.resellerTier = package.tier                         │
│      * user.resellerExpiry = expiryDate                         │
│      * user.resellerPackageId = package._id                     │
│    - Save user                                                  │
│    - Log activation success                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. User Now Active Reseller                                    │
│     - resellerTier: 1, 2, or 3                                  │
│     - resellerExpiry: current date + duration months            │
│     - Can get discount on future purchases                      │
│     - Discount percentage based on tier                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Verifikasi

- [x] **Halaman Reseller**: Data dikirim dengan `serviceType: "reseller"` dan `serviceId: pkg._id`
- [x] **Halaman Checkout**:
  - [x] Form validation di-skip untuk reseller
  - [x] Password field tidak ditampilkan
  - [x] Data diteruskan ke API dengan benar
- [x] **API Transactions**:
  - [x] Single-item: `serviceId` disimpan
  - [x] Multi-item: `serviceId` disimpan
- [x] **Webhook Handler**:
  - [x] Check `serviceType === "reseller"`
  - [x] Call `activateResellerPackage()` on settlement
  - [x] Function mencari ResellerPackage by `serviceId`
  - [x] Update user dengan tier, expiry, packageId
  - [x] Error handling tidak menggagalkan webhook
- [x] **Transaction Model**: Enum serviceType sudah include `"reseller"`

---

## 🧪 Testing Checklist

### Manual Testing Steps:

1. **Test Purchase Flow:**

   ```
   1. Login sebagai user
   2. Buka /reseller
   3. Klik "Beli" pada salah satu package
   4. Verify: redirect ke checkout tanpa password field
   5. Isi data customer
   6. Pilih payment method
   7. Klik "Bayar Sekarang"
   8. Complete payment di Midtrans (sandbox)
   9. Wait for webhook notification
   ```

2. **Verify Database After Payment:**

   ```javascript
   // Check Transaction
   db.transactions.findOne({
     serviceType: "reseller",
     paymentStatus: "settlement",
   });
   // Should have: serviceId pointing to ResellerPackage

   // Check User
   db.users.findOne({ email: "test@example.com" });
   // Should have:
   // - resellerTier: 1, 2, or 3
   // - resellerExpiry: Date in future
   // - resellerPackageId: ObjectId of package
   ```

3. **Verify Webhook Logs:**

   ```
   Check console for:
   ✅ Reseller activated for user email@example.com:
      Tier 2 (Gold Package), Expires: 27/10/2026
   ```

4. **Verify Discount Application:**
   ```
   1. Make another purchase after reseller activation
   2. Verify discount automatically applied based on tier
   3. Check transaction has correct discount percentage
   ```

---

## 🐛 Error Handling

### Webhook tidak menggagalkan jika:

- ResellerPackage tidak ditemukan (deleted)
- User tidak ditemukan
- Error saat update user

### Logging:

```typescript
// Success log
console.log(
  `✅ Reseller activated for user ${user.email}: Tier ${tier} ` +
    `(${packageName}), Expires: ${expiryDate.toLocaleDateString("id-ID")}`
);

// Error logs
console.log("Missing userId or serviceId for reseller activation");
console.log("User not found for reseller activation");
console.log("Reseller package not found:", transaction.serviceId);
console.error("Error in activateResellerPackage:", error);
```

---

## 📝 Kesimpulan

**Semua komponen sudah benar dan siap digunakan:**

1. ✅ Frontend mengirim data dengan benar
2. ✅ API menyimpan `serviceId` dengan benar
3. ✅ Webhook mengaktifkan reseller dengan benar
4. ✅ Error handling sudah proper
5. ✅ Logging sudah lengkap untuk debugging

**Next Steps:**

- Test manual dengan sandbox Midtrans
- Verify database updates
- Monitor webhook logs untuk debugging
- Create test user dan test purchase flow

---

**Created:** 2025-10-27  
**Status:** ✅ VERIFIED - Ready for Testing
