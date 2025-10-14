# 🐛 Multi-Checkout Discount Bug Fix - COMPLETE

## 📋 Problem Analysis

### Issue: Multi-Checkout tidak menyimpan discount

**Evidence dari Database:**

**Multi-Checkout (TANPA Discount):**

```json
{
  "_id": "68d08ff2632cd19e6c4b0633",
  "invoiceId": "INV-1758498802668-3QQHVB",
  "serviceName": "robux 200",
  "totalAmount": 24000,
  "discountPercentage": 0,     ← ❌ HARUSNYA 5%
  "discountAmount": 0,          ← ❌ HARUSNYA ada discount
  "finalAmount": 24000,
  "midtransOrderId": "ORDER-INV-1758498802668-3QQHVB-1758498802669"
}
```

**Single Checkout (ADA Discount):**

```json
{
  "_id": "68cd4c4062fdf555f88c50ed",
  "invoiceId": "INV-1758284864769-IOIEG3",
  "serviceName": "12 Robux (5 Hari)",
  "totalAmount": 1500,
  "discountPercentage": 15,     ← ✅ Discount tersimpan
  "discountAmount": 225,        ← ✅ Discount tersimpan
  "finalAmount": 1275
}
```

**Another Multi-Checkout (TANPA Discount):**

```json
{
  "_id": "68cb2134b4183f300767f478",
  "serviceName": "Coding - TypeScript",
  "totalAmount": 1000000,
  "discountPercentage": 5,      ← ✅ Ada discount
  "discountAmount": 50000,      ← ✅ Tersimpan dengan benar
  "finalAmount": 950000,
  "paymentStatus": "settlement"
}
```

**Insight:**

- ✅ Multi-checkout **BISA** menyimpan discount (contoh 2)
- ❌ Tapi multi-checkout **KADANG** tidak menyimpan discount (contoh 1)
- **Root Cause:** Tergantung **kapan user login**

---

## 🔍 Root Cause Analysis

### 1. **Checkout Page - calculateDiscount()**

**File:** `/app/checkout/page.tsx` (Line 142-175)

```typescript
// Fungsi untuk menghitung diskon
const calculateDiscount = (amount: number) => {
  console.log("=== CALCULATE DISCOUNT DEBUG ===");
  console.log("User object:", user);
  console.log("User memberRole:", user?.memberRole);
  console.log("User diskon from memberRole:", user?.memberRole?.diskon || 0);
  console.log("Amount to calculate:", amount);

  if (!user) {
    console.log("No user logged in, no discount applied");
    return {
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: amount,
    };
  }

  const discountPercentage = user.memberRole ? user.memberRole.diskon : 0;
  const discountAmount = Math.round((amount * discountPercentage) / 100);
  const finalAmount = amount - discountAmount;

  console.log("Calculated discount:", {
    discountPercentage,
    discountAmount,
    finalAmount,
  });

  return {
    discountPercentage,
    discountAmount,
    finalAmount,
  };
};
```

**Problem:**

- ✅ Single checkout: User **sudah login** saat buka checkout page
- ✅ Multi-checkout (contoh 2): User **sudah login** saat buka checkout page → dapat discount
- ❌ Multi-checkout (contoh 1): User **belum login** saat buka checkout page → tidak dapat discount

### 2. **When Discount is Calculated**

**File:** `/app/checkout/page.tsx` (Line 264)

```typescript
// Load checkout data from sessionStorage
const sessionData = sessionStorage.getItem("checkoutData");

if (sessionData) {
  const parsedData = JSON.parse(sessionData);
  const itemsArray = Array.isArray(parsedData) ? parsedData : [parsedData];

  const baseAmount = itemsArray.reduce((sum: number, item: any) => {
    return sum + item.quantity * item.unitPrice;
  }, 0);

  const discount = calculateDiscount(baseAmount); // ← DIPANGGIL HANYA SEKALI!

  setCheckoutData({
    items: itemsArray,
    totalAmount: baseAmount,
    discountPercentage: discount.discountPercentage, // ← 0 if no user
    discountAmount: discount.discountAmount, // ← 0 if no user
    finalAmount: discount.finalAmount,
  });
}
```

**Masalah Utama:**

- `calculateDiscount()` **HANYA dipanggil 1x** saat component mount
- Jika user **login SETELAH** component mount → discount TIDAK recalculate
- `checkoutData` tetap berisi discount = 0

**Scenario yang Menyebabkan Bug:**

1. User **belum login**
2. User add items ke cart
3. User klik "Checkout"
4. **Checkout page load** → `calculateDiscount()` dipanggil
5. `if (!user)` → return discount = 0 ❌
6. `checkoutData` di-set dengan discount = 0
7. User **login di checkout page**
8. `calculateDiscount()` TIDAK dipanggil lagi ❌
9. Submit checkout → kirim discount = 0 ke API ❌

**Flow Chart:**

```
Cart Page (User belum login)
   ↓
Add items to cart
   ↓
Click "Checkout" → sessionStorage.setItem("checkoutData", items)
   ↓
Redirect to /checkout
   ↓
Checkout Page Load
   ↓
calculateDiscount(baseAmount)
   ↓ (user = null)
Return { discountPercentage: 0, discountAmount: 0 } ❌
   ↓
setCheckoutData({ discount: 0 })
   ↓
User Login di Checkout Page
   ↓
calculateDiscount() TIDAK dipanggil lagi ❌
   ↓
Submit → Send discount = 0 to API ❌
```

### 3. **Multi-Checkout API sudah BENAR**

**File:** `/app/api/transactions/multi/route.ts` (Line 171-186)

```typescript
// Distribute global discount proportionally to this item
let itemDiscountAmount = 0;
let itemDiscountPercentage = 0;
let itemFinalAmount = itemTotalAmount;

if (discountAmount && discountAmount > 0 && subtotalFromItems > 0) {
  // Calculate proportional discount for this item
  const itemRatio = itemTotalAmount / subtotalFromItems;
  itemDiscountAmount = Math.round(discountAmount * itemRatio);
  itemDiscountPercentage = discountPercentage || 0;
  itemFinalAmount = itemTotalAmount - itemDiscountAmount;
}
```

**API Logic:** ✅ CORRECT

- API sudah siap menerima `discountAmount` dan `discountPercentage`
- API sudah distribute discount proportionally ke setiap item
- **TAPI** frontend mengirim `discountAmount: 0` dan `discountPercentage: 0`

---

## ✅ Solution Implemented

### Fix: Recalculate Discount saat User Login/Logout

**File:** `/app/checkout/page.tsx` (After line 175)

**Added useEffect Hook:**

```typescript
// Recalculate discount when user login status changes
useEffect(() => {
  if (checkoutData && checkoutData.items && checkoutData.items.length > 0) {
    console.log("=== RECALCULATE DISCOUNT ON USER CHANGE ===");
    console.log("User changed:", user);
    console.log("Current checkoutData:", checkoutData);

    // Recalculate base amount
    const baseAmount = checkoutData.items.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Recalculate discount based on current user
    const discount = calculateDiscount(baseAmount);

    console.log("New discount calculated:", discount);

    // Update checkoutData with new discount
    setCheckoutData({
      ...checkoutData,
      discountPercentage: discount.discountPercentage,
      discountAmount: discount.discountAmount,
      finalAmount: discount.finalAmount,
    });

    console.log("CheckoutData updated with new discount");
  }
}, [user]); // Trigger when user changes (login/logout)
```

**Why This Works:**

1. ✅ When user **logs in** → `user` changes → trigger recalculation
2. ✅ When user **logs out** → `user` changes → trigger recalculation
3. ✅ Discount always up-to-date with current user state
4. ✅ Multi-checkout will get correct discount even if user login after page load

**How It Works:**

```
Checkout Page Load (user = null)
   ↓
calculateDiscount() → discount = 0
   ↓
setCheckoutData({ discount: 0 })
   ↓
User Login → user changes
   ↓
useEffect([user]) triggered ✅
   ↓
calculateDiscount() called again ✅
   ↓
discount = { percentage: 5, amount: 1200 } ✅
   ↓
setCheckoutData updated with correct discount ✅
   ↓
Submit → Send discount to API ✅
```

---

## 📊 Comparison: Single vs Multi Checkout

### Single Checkout Flow:

```
Product Page (User SUDAH login)
   ↓
Click "Beli Sekarang"
   ↓
Redirect to /checkout
   ↓
Checkout Page Load → calculateDiscount() with user ✅
   ↓
Return { discountPercentage: 15, discountAmount: 225 } ✅
   ↓
Submit → Send discount to API ✅
```

### Multi-Checkout Flow (BEFORE FIX):

```
Cart Page (User BELUM login) ❌
   ↓
Add items to cart
   ↓
Click "Checkout"
   ↓
Checkout Page Load → calculateDiscount() without user ❌
   ↓
Return { discountPercentage: 0, discountAmount: 0 } ❌
   ↓
User Login
   ↓
calculateDiscount() NOT called again ❌
   ↓
Submit → Send discount = 0 to API ❌
```

### Multi-Checkout Flow (AFTER FIX):

```
Cart Page (User BELUM login)
   ↓
Add items to cart
   ↓
Click "Checkout"
   ↓
Checkout Page Load → calculateDiscount() without user
   ↓
Return { discountPercentage: 0, discountAmount: 0 }
   ↓
User Login → useEffect triggered ✅
   ↓
Recalculate discount with user ✅
   ↓
Return { discountPercentage: 5, discountAmount: 1200 } ✅
   ↓
Submit → Send discount to API ✅
```

---

## 🧪 Testing Checklist

### Test Case 1: Guest → Login → Checkout ✅

```
Steps:
1. Buka browser (belum login)
2. Add item Rp 24,000 ke cart
3. Click "Checkout"
4. ✅ Verify: discount = 0 (karena belum login)
5. Login di checkout page
6. ✅ Verify: Console log shows "RECALCULATE DISCOUNT ON USER CHANGE"
7. ✅ Verify: discount otomatis recalculate (5% = Rp 1,200)
8. ✅ Verify: Final amount = Rp 22,800
9. Submit checkout
10. ✅ Verify: Transaction tersimpan dengan:
    - discountPercentage: 5
    - discountAmount: 1200
    - finalAmount: 22800
```

### Test Case 2: Login → Add to Cart → Checkout ✅

```
Steps:
1. Login sebagai member (discount 5%)
2. Add item Rp 50,000 ke cart
3. Click "Checkout"
4. ✅ Verify: discount = 5% (Rp 2,500)
5. ✅ Verify: Final amount = Rp 47,500
6. Submit checkout
7. ✅ Verify: Transaction tersimpan dengan discount
```

### Test Case 3: Login → Add to Cart → Logout → Checkout ✅

```
Steps:
1. Login sebagai member
2. Add item Rp 100,000 ke cart
3. Logout
4. Click "Checkout"
5. ✅ Verify: discount = 0 (karena logout)
6. Login kembali
7. ✅ Verify: Console log shows recalculation
8. ✅ Verify: discount recalculate = 5% (Rp 5,000)
9. Submit checkout
10. ✅ Verify: Transaction tersimpan dengan discount
```

### Test Case 4: Multi-Checkout dengan 2+ Items ✅

```
Steps:
1. Belum login
2. Add 2 items ke cart:
   - Item 1: Rp 24,000
   - Item 2: Rp 50,000
   - Total: Rp 74,000
3. Click "Checkout"
4. ✅ Verify: discount = 0
5. Login (discount 5%)
6. ✅ Verify: discount recalculate = Rp 3,700
7. ✅ Verify: Final = Rp 70,300
8. Submit checkout
9. ✅ Verify: Both transactions have proportional discount:
    - Transaction 1: discount ~Rp 1,200 (24k/74k × 3700)
    - Transaction 2: discount ~Rp 2,500 (50k/74k × 3700)
```

---

## 🔍 Debug Logs to Check

### When User Logs In:

```
=== RECALCULATE DISCOUNT ON USER CHANGE ===
User changed: {
  memberRole: { diskon: 5 },
  email: "user@example.com",
  ...
}
Current checkoutData: {
  items: [
    { serviceName: "robux 200", unitPrice: 24000, quantity: 1 }
  ],
  totalAmount: 24000,
  discountPercentage: 0,  ← Before (0%)
  discountAmount: 0,      ← Before (Rp 0)
  finalAmount: 24000
}

=== CALCULATE DISCOUNT DEBUG ===
User object: { memberRole: { diskon: 5 } }
User memberRole: { diskon: 5 }
User diskon from memberRole: 5
Amount to calculate: 24000

Calculated discount: {
  discountPercentage: 5,
  discountAmount: 1200,
  finalAmount: 22800
}

New discount calculated: {
  discountPercentage: 5,  ← After (5%)
  discountAmount: 1200,   ← After (Rp 1,200)
  finalAmount: 22800      ← After (Rp 22,800)
}

CheckoutData updated with new discount
```

### When Submit to Multi-Checkout API:

```
=== MULTI TRANSACTION API DEBUG ===
Received body: {
  "items": [
    {
      "serviceType": "robux",
      "serviceName": "robux 200",
      "quantity": 1,
      "unitPrice": 24000
    }
  ],
  "totalAmount": 24000,
  "discountPercentage": 5,    ← ✅ Now sent correctly
  "discountAmount": 1200,     ← ✅ Now sent correctly
  "finalAmount": 22800,       ← ✅ Correct final amount
  "paymentMethodId": "...",
  "customerInfo": {...}
}

=== DISCOUNT DISTRIBUTION DEBUG ===
Subtotal from items (recalculated): 24000
Global discount percentage: 5
Global discount amount: 1200

Processing item 1: {
  serviceName: "robux 200",
  quantity: 1,
  unitPrice: 24000
}

Item 1 calculation: {
  name: "robux 200",
  quantity: 1,
  unitPrice: 24000,
  calculatedTotal: 24000,
  frontendTotal: 24000,
  match: true
}

Item 1 discount distribution:
  - Item total: 24000
  - Item ratio: 1.0000
  - Item discount: 1200
  - Item final amount: 22800

Transaction created with:
  - totalAmount: 24000
  - discountPercentage: 5
  - discountAmount: 1200
  - finalAmount: 22800
```

---

## 📁 Files Modified

### 1. `/app/checkout/page.tsx`

**Changes:**

- ✅ Added `useEffect` hook to listen for `user` changes
- ✅ Automatically recalculate discount when user login/logout
- ✅ Update `checkoutData` with new discount values

**Location:** After line 175 (after `calculateDiscount` function)

**Lines Added:** ~30 lines

---

## 🎯 Expected Results

### Before Fix:

```json
// Multi-Checkout (User belum login saat checkout page load)
{
  "discountPercentage": 0,
  "discountAmount": 0,
  "finalAmount": 24000
}
```

### After Fix:

```json
// Multi-Checkout (User login sebelum submit)
{
  "discountPercentage": 5,
  "discountAmount": 1200,
  "finalAmount": 22800
}
```

### Database Result:

```json
{
  "_id": "new-transaction-id",
  "invoiceId": "INV-xxxxx",
  "serviceName": "robux 200",
  "totalAmount": 24000,
  "discountPercentage": 5,     ← ✅ Tersimpan
  "discountAmount": 1200,      ← ✅ Tersimpan
  "finalAmount": 22800,        ← ✅ Benar
  "paymentStatus": "pending"
}
```

---

## 🎉 Summary

**Problem:**

- Multi-checkout tidak menyimpan discount karena user belum login saat checkout page load
- `calculateDiscount()` hanya dipanggil sekali saat component mount
- User login setelah checkout page load tidak trigger recalculation
- `checkoutData` tetap berisi discount = 0 meskipun user sudah login

**Root Cause:**

- Tidak ada listener untuk perubahan `user` state
- Discount calculation hanya terjadi pada initial mount
- Missing reactive update when authentication state changes

**Solution:**

- ✅ Added `useEffect` yang listen ke perubahan `user`
- ✅ Otomatis recalculate discount saat user login/logout
- ✅ Update `checkoutData` dengan discount terbaru
- ✅ Discount selalu up-to-date dengan user state saat ini

**Impact:**

- ✅ Multi-checkout akan dapat discount member
- ✅ Discount tersimpan di database dengan benar
- ✅ Track order menampilkan discount dengan akurat
- ✅ Payment summary menunjukkan discount yang benar
- ✅ User experience lebih baik (tidak perlu reload halaman)

**Technical Highlights:**

1. **Reactive Updates:** useEffect dengan dependency `[user]`
2. **Automatic Recalculation:** Saat user state berubah
3. **State Synchronization:** checkoutData selalu sync dengan user
4. **Zero Breaking Changes:** API tetap sama, hanya frontend logic yang diperbaiki

---

**Status:** ✅ IMPLEMENTED & TESTED  
**Priority:** 🔴 HIGH - Affecting member discount in multi-checkout  
**Impact:** All multi-checkout transactions will now properly save discount  
**Date Fixed:** October 14, 2025  
**Lines Changed:** ~30 lines in `/app/checkout/page.tsx`
