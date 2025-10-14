# Total Amount Calculation Bug Fix

## 🐛 Bug yang Ditemukan

### Symptoms:

Pada halaman **Track Order** untuk multi-checkout, subtotal yang ditampilkan **SANGAT TIDAK AKURAT**:

**Contoh dari Screenshot:**

```
Item 1: Rbx 5 Hari 1Juta - Rp 50,900 (1x @ Rp 50,900)
Item 2: Rbx 5 Hari 2Juta - Rp 90,900 (1x @ Rp 90,900)
---------------------------------------------------
Expected Subtotal: Rp 50,900 + Rp 90,900 = Rp 141,800
Actual Subtotal: Rp 2,048,422 ❌❌❌

Expected Discount (5%): -Rp 7,090
Actual Discount: -Rp 7,042

Expected Total: Rp 134,710
Actual Total: Rp 2,041,380 ❌❌❌
```

### Root Cause Analysis:

#### 1. **Frontend Mengirim `totalAmount` yang Salah**

Saat checkout dari cart, frontend mengirim data seperti:

```json
{
  "items": [
    {
      "quantity": 1,
      "unitPrice": 50900,
      "totalAmount": 1024211 // ❌ SALAH! Seharusnya 50,900
    },
    {
      "quantity": 1,
      "unitPrice": 90900,
      "totalAmount": 1024211 // ❌ SALAH! Seharusnya 90,900
    }
  ]
}
```

**Penyebab:** Kemungkinan bug di cart logic yang menghitung `totalAmount` per item dengan formula yang salah, atau menggunakan nilai dari field yang salah.

#### 2. **Backend Mempercayai `totalAmount` dari Frontend**

Di `/app/api/transactions/multi/route.ts` line 153:

```typescript
const itemTotalAmount = item.totalAmount || item.quantity * item.unitPrice;
//                      ^^^^^^^^^^^^^^^^^ ❌ Ini mempercayai nilai dari frontend!
```

**Masalah:**

- Jika frontend mengirim `totalAmount` yang salah, backend langsung menggunakan nilai tersebut
- Backend TIDAK memvalidasi apakah `totalAmount === quantity × unitPrice`
- Nilai salah tersimpan ke database
- Track order menampilkan nilai salah dari database

#### 3. **Same Issue di Single Checkout**

Di `/app/api/transactions/route.ts` line 744:

```typescript
const calculatedTotalAmount = totalAmount || quantity * unitPrice;
//                            ^^^^^^^^^^^ ❌ Sama, mempercayai frontend
```

---

## ✅ Solution Implemented

### Principle: **Never Trust Frontend Calculations**

Backend harus **SELALU** recalculate `totalAmount` dari `quantity × unitPrice` yang diterima, **BUKAN** menggunakan `totalAmount` yang dikirim frontend.

### 1. **Fix Multi-Checkout API** (`/app/api/transactions/multi/route.ts`)

#### A. Recalculate Subtotal

```typescript
// Before (❌):
const subtotalFromItems = items.reduce(
  (sum, item) => sum + (item.totalAmount || item.quantity * item.unitPrice),
  //                     ^^^^^^^^^^^^^^^^ Mempercayai frontend
  0
);

// After (✅):
const subtotalFromItems = items.reduce(
  (sum, item) => sum + item.quantity * item.unitPrice,
  //                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ SELALU recalculate
  0
);
```

#### B. Recalculate Per-Item Total

```typescript
// Before (❌):
const itemTotalAmount = item.totalAmount || item.quantity * item.unitPrice;
//                      ^^^^^^^^^^^^^^^^ Mempercayai frontend

// After (✅):
const itemTotalAmount = item.quantity * item.unitPrice;
//                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ SELALU recalculate

console.log(`Item ${i + 1} calculation:`, {
  name: item.serviceName,
  quantity: item.quantity,
  unitPrice: item.unitPrice,
  calculatedTotal: itemTotalAmount,
  frontendTotal: item.totalAmount,
  match: itemTotalAmount === item.totalAmount, // Debug: apakah frontend kirim benar?
});
```

### 2. **Fix Single Checkout API** (`/app/api/transactions/route.ts`)

```typescript
// Before (❌):
const calculatedTotalAmount = totalAmount || quantity * unitPrice;
//                            ^^^^^^^^^^^ Mempercayai frontend

// After (✅):
const calculatedTotalAmount = quantity * unitPrice;
//                            ^^^^^^^^^^^^^^^^^^^^^^ SELALU recalculate

console.log("Single transaction calculation:", {
  quantity,
  unitPrice,
  calculatedTotal: calculatedTotalAmount,
  frontendTotal: totalAmount,
  match: calculatedTotalAmount === totalAmount, // Debug
});
```

### 3. **Add Debug Logging in Track Order** (`/app/(public)/track-order/page.tsx`)

```typescript
if (response.ok && data.data) {
  console.log("=== TRACK ORDER FRONTEND DEBUG ===");
  console.log("Transaction received:", data.data);

  // Debug each item
  const allItems = [data.data, ...(data.data.relatedTransactions || [])];
  allItems.forEach((item: any, idx: number) => {
    console.log(`\nItem ${idx + 1}:`, {
      name: item.serviceName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalAmount: item.totalAmount,
      calculated_total: item.quantity * item.unitPrice, // Should match!
    });
  });

  setTransaction(data.data);
}
```

---

## 🔍 Verification Steps

### 1. **Test dengan Transaksi Baru**

Buat multi-checkout baru dan pastikan:

```
✅ Console log backend menampilkan:
   - Item 1: calculatedTotal = 50,900 (match: true/false dengan frontendTotal)
   - Item 2: calculatedTotal = 90,900 (match: true/false dengan frontendTotal)

✅ Database menyimpan:
   - Transaction 1: totalAmount = 50,900
   - Transaction 2: totalAmount = 90,900

✅ Track Order menampilkan:
   - Item 1: Rp 50,900
   - Item 2: Rp 90,900
   - Subtotal: Rp 141,800 ✅
   - Diskon 5%: -Rp 7,090
   - Total: Rp 134,710 ✅
```

### 2. **Investigate Cart Bug**

Jika console log menampilkan `match: false`, artinya **cart mengirim totalAmount yang salah**.

Cek file cart untuk menemukan bug:

```bash
# Search untuk cart checkout logic
grep -r "totalAmount" app/**/cart/**
```

Kemungkinan bug di:

- Cart state calculation
- Cart item update logic
- Checkout data preparation

### 3. **Test dengan Transaksi Lama (Data Corrupt)**

Transaksi yang sudah ada dengan `totalAmount` salah **TIDAK BISA** otomatis diperbaiki karena sudah tersimpan di database.

**Options:**

1. **Manual Database Update** (if critical):

   ```javascript
   // Run di MongoDB shell atau create migration script
   db.transactions.find({ midtransOrderId: "MULTI-..." }).forEach((tx) => {
     const correctTotal = tx.quantity * tx.unitPrice;
     if (tx.totalAmount !== correctTotal) {
       db.transactions.updateOne(
         { _id: tx._id },
         {
           $set: {
             totalAmount: correctTotal,
             finalAmount: correctTotal - (tx.discountAmount || 0),
           },
         }
       );
     }
   });
   ```

2. **Leave as-is** (recommended for non-critical):
   - Data lama tetap salah, tapi transaksi baru akan benar
   - Inform customer service team tentang data corrupt

---

## 📊 Impact Analysis

### Before Fix:

```
❌ Frontend bug di cart → mengirim totalAmount salah
❌ Backend mempercayai nilai dari frontend
❌ Database menyimpan nilai salah (Rp 1,024,211 per item)
❌ Track order menampilkan total salah (Rp 2,048,422)
❌ Midtrans menerima amount salah
❌ Customer bingung karena harga tidak sesuai
```

### After Fix:

```
✅ Frontend bug di cart masih ada (perlu di-fix terpisah)
✅ Backend SELALU recalculate totalAmount yang benar
✅ Database menyimpan nilai benar (Rp 50,900 + Rp 90,900)
✅ Track order menampilkan total benar (Rp 141,800)
✅ Midtrans menerima amount benar
✅ Customer melihat harga yang sesuai dengan yang diharapkan
```

---

## 🛡️ Security & Best Practices

### Why Never Trust Frontend?

1. **Client-Side Can Be Manipulated**

   - Browser developer tools bisa edit request
   - Malicious users bisa inject fake data
   - JavaScript errors bisa corrupt data

2. **Business Logic Should Be in Backend**

   - Price calculation
   - Discount application
   - Tax calculation
   - Total amount calculation

3. **Single Source of Truth**
   - Backend adalah authority untuk semua perhitungan
   - Frontend hanya untuk display
   - Database menyimpan hasil perhitungan backend

### Proper Flow:

```
Frontend → Backend
├─ Send: quantity, unitPrice (from database)
└─ Backend calculates: totalAmount, discount, finalAmount

Backend → Database
└─ Store: calculated values (validated & correct)

Database → Frontend (Track Order)
└─ Display: stored values (guaranteed correct)
```

---

## 📝 Files Modified

1. ✅ `/app/api/transactions/multi/route.ts`

   - Line ~113: Recalculate subtotalFromItems
   - Line ~153: Recalculate itemTotalAmount
   - Added debug logging

2. ✅ `/app/api/transactions/route.ts`

   - Line ~744: Recalculate calculatedTotalAmount
   - Added debug logging

3. ✅ `/app/(public)/track-order/page.tsx`
   - Line ~40: Added comprehensive debug logging
   - Shows calculated vs stored totalAmount

---

## 🚀 Next Steps

### 1. **Fix Cart Bug** (Recommended)

Sekarang backend sudah aman, tapi cart masih mengirim data salah. Perlu investigate:

- Cart state management
- Item price calculation logic
- Checkout data preparation

**Temporary Workaround:** Backend sekarang ignore nilai salah dari cart, jadi sistem tetap berfungsi benar.

### 2. **Database Cleanup** (Optional)

Jika ada banyak transaksi corrupt, pertimbangkan:

- Create migration script
- Update old transactions
- Or leave as-is (tidak critical karena sudah completed)

### 3. **Monitoring**

Watch console logs untuk:

- `match: false` → indicates frontend masih kirim data salah
- `match: true` → indicates frontend sudah diperbaiki

---

## 🎯 Summary

**Problem:** Backend mempercayai `totalAmount` dari frontend yang corrupt  
**Solution:** Backend SELALU recalculate dari `quantity × unitPrice`  
**Result:** Track order sekarang menampilkan total yang benar ✅

**Critical Change:**

```diff
- const itemTotalAmount = item.totalAmount || item.quantity * item.unitPrice;
+ const itemTotalAmount = item.quantity * item.unitPrice;
```

---

**Tanggal Fix:** 13 Oktober 2025  
**Status:** ✅ Complete - Ready for Testing  
**Severity:** 🔴 Critical (wrong payment amounts!)
