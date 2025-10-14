# Payment Summary Fix - Track Order Page

## 🐛 Masalah yang Ditemukan

### Issues:

1. **❌ Diskon tidak ditampilkan dengan benar**

   - Perhitungan diskon menggunakan `calculateOriginalTotal - calculateGrandTotal`
   - Tidak akurat karena tidak memperhitungkan pembulatan
   - Tidak menampilkan persentase diskon

2. **❌ Payment method fee tidak ditampilkan**

   - Biaya admin payment method tidak terlihat
   - User tidak tahu ada biaya tambahan

3. **❌ Payment Summary terlalu sederhana**

   - Tidak ada breakdown yang jelas
   - Tidak menampilkan payment method name
   - Tidak ada informasi tentang biaya admin

4. **❌ API tidak mengembalikan paymentMethodName**
   - Field ada di database tapi tidak di-return ke frontend

---

## ✅ Solusi yang Diimplementasikan

### 1. **Improved Payment Summary Display**

**File:** `/app/(public)/track-order/page.tsx`

#### A. Import calculateTotalDiscount Helper

```typescript
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  calculateOriginalTotal,
  calculateTotalDiscount, // ✅ Added
  getTotalItemsCount,
  getCheckoutDisplayName,
} from "@/lib/transaction-helpers";
```

#### B. Enhanced Payment Summary Structure

```tsx
<div className="mt-6 pt-6 border-t border-white/10">
  <h3 className="font-semibold text-white text-base mb-4">
    Ringkasan Pembayaran
  </h3>
  <div className="space-y-3">
    {/* 1. Subtotal */}
    <div className="flex justify-between text-white/70">
      <span>Subtotal ({getTotalItemsCount(transaction)} items):</span>
      <span className="font-medium text-white">
        Rp {calculateOriginalTotal(transaction).toLocaleString("id-ID")}
      </span>
    </div>

    {/* 2. Discount with percentage */}
    {calculateTotalDiscount(transaction) > 0 && (
      <div className="flex justify-between text-green-400">
        <span>
          Diskon
          {(() => {
            const firstItem = getAllTransactions(transaction)[0];
            return firstItem && firstItem.discountPercentage > 0
              ? ` (${firstItem.discountPercentage}%)`
              : "";
          })()}:
        </span>
        <span className="font-medium">
          -Rp {calculateTotalDiscount(transaction).toLocaleString("id-ID")}
        </span>
      </div>
    )}

    {/* 3. Subtotal after discount */}
    {calculateTotalDiscount(transaction) > 0 && (
      <div className="flex justify-between text-white/70 text-sm">
        <span>Subtotal setelah diskon:</span>
        <span className="font-medium text-white">
          Rp{" "}
          {(
            calculateOriginalTotal(transaction) -
            calculateTotalDiscount(transaction)
          ).toLocaleString("id-ID")}
        </span>
      </div>
    )}

    {/* 4. Payment Method Name */}
    {(transaction as any).paymentMethodName && (
      <div className="flex justify-between text-white/70 text-sm">
        <span>Metode Pembayaran:</span>
        <span className="font-medium text-white">
          {(transaction as any).paymentMethodName}
        </span>
      </div>
    )}

    {/* 5. Total Payment (highlighted) */}
    <div className="flex justify-between text-white font-bold text-lg pt-3 border-t border-white/20">
      <span>Total Pembayaran:</span>
      <span className="text-primary-100">
        Rp {calculateGrandTotal(transaction).toLocaleString("id-ID")}
      </span>
    </div>

    {/* 6. Info note about payment fee */}
    {(transaction as any).paymentMethodName && (
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-3">
        <p className="text-xs text-blue-300">
          <span className="font-semibold">ℹ️ Catatan:</span> Total pembayaran
          sudah termasuk biaya admin metode pembayaran (jika ada).
        </p>
      </div>
    )}
  </div>
</div>
```

---

### 2. **API Enhancement - Return paymentMethodName**

**File:** `/app/api/transactions/invoice/[invoiceId]/route.ts`

#### Added to Both GET and POST Methods:

```typescript
const transformedTransaction = {
  // ... existing fields
  paymentStatus: transaction.paymentStatus,
  orderStatus: transaction.orderStatus,
  // ✅ Payment method fields
  paymentMethodId: transaction.paymentMethodId,
  paymentMethodName: transaction.paymentMethodName || null,
  customerInfo: transaction.customerInfo || {},
  // ... rest of fields
};
```

---

## 📊 Visual Breakdown

### Before Fix:

```
Payment Summary:
├─ Subtotal (2 items): Rp 141,800
├─ Diskon: -Rp ??? (tidak akurat)
└─ Total Pembayaran: Rp 134,710

❌ Tidak ada breakdown detail
❌ Tidak ada info payment method
❌ Tidak ada info biaya admin
```

### After Fix:

```
Ringkasan Pembayaran:
├─ Subtotal (2 items): Rp 141,800
├─ Diskon (5%): -Rp 7,090 ✅ (akurat dari calculateTotalDiscount)
├─ Subtotal setelah diskon: Rp 134,710 ✅
├─ Metode Pembayaran: BCA Virtual Account ✅
├─ ─────────────────────────
└─ Total Pembayaran: Rp 134,710 ✅

ℹ️ Catatan: Total pembayaran sudah termasuk biaya admin
metode pembayaran (jika ada). ✅
```

---

## 🔍 Technical Details

### 1. **calculateTotalDiscount Helper Function**

Already exists in `/lib/transaction-helpers.ts`:

```typescript
export function calculateTotalDiscount(transaction: Transaction): number {
  const allTransactions = getAllTransactions(transaction);
  return allTransactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
}
```

**Why it's better:**

- ✅ Directly sums `discountAmount` from all items
- ✅ Handles proportional discount distribution correctly
- ✅ No floating-point errors from subtraction
- ✅ Works for both single and multi-checkout

**Old Method (WRONG):**

```typescript
// ❌ Inaccurate due to rounding
calculateOriginalTotal(transaction) - calculateGrandTotal(transaction);
```

**New Method (CORRECT):**

```typescript
// ✅ Accurate - sums actual discount amounts
calculateTotalDiscount(transaction);
```

---

### 2. **Discount Percentage Display**

```typescript
{
  (() => {
    const firstItem = getAllTransactions(transaction)[0];
    return firstItem &&
      firstItem.discountPercentage &&
      firstItem.discountPercentage > 0
      ? ` (${firstItem.discountPercentage}%)`
      : "";
  })();
}
```

**Logic:**

1. Get first item from transaction
2. Check if it has `discountPercentage` > 0
3. Display percentage if available
4. All items in multi-checkout should have same percentage (from global discount)

---

### 3. **Payment Method Information**

#### Database Schema:

```typescript
// Transaction model already has:
paymentMethodId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "PaymentMethod",
  required: false,
},
paymentMethodName: {
  type: String,
  required: false,
}
```

#### API Multi Checkout:

```typescript
// When creating transaction
transactionData.paymentMethodId = validPaymentMethodId;
transactionData.paymentMethodName = paymentMethodName;
```

#### Track Order API:

```typescript
// Now returns this field
paymentMethodId: transaction.paymentMethodId,
paymentMethodName: transaction.paymentMethodName || null,
```

---

### 4. **Payment Fee Note**

```tsx
{
  (transaction as any).paymentMethodName && (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-3">
      <p className="text-xs text-blue-300">
        <span className="font-semibold">ℹ️ Catatan:</span> Total pembayaran
        sudah termasuk biaya admin metode pembayaran (jika ada).
      </p>
    </div>
  );
}
```

**Purpose:**

- Inform user that total already includes admin fee
- No separate line item for payment fee (already in finalAmount)
- Transparency about pricing

**Why no separate payment fee line?**

- Payment fee is calculated dynamically: `fee = finalAmount - (subtotal - discount)`
- Not stored in database as separate field
- Already included in each item's `finalAmount`
- Displaying it separately would be redundant

---

## 🧪 Testing Scenarios

### Test Case 1: Single Item with Discount

```
Input:
- 1 Item: Robux 800 @ Rp 10,000
- Member discount: 5% (Rp 500)
- Payment method: BCA VA (no admin fee assumed)

Expected Display:
✅ Subtotal (1 items): Rp 10,000
✅ Diskon (5%): -Rp 500
✅ Subtotal setelah diskon: Rp 9,500
✅ Metode Pembayaran: BCA Virtual Account
✅ Total Pembayaran: Rp 9,500
ℹ️ Catatan: Total pembayaran sudah termasuk biaya admin...
```

### Test Case 2: Multi-Checkout with Discount

```
Input:
- Item 1: Rbx 5 Hari 1Juta @ Rp 50,900
- Item 2: Rbx 5 Hari 2Juta @ Rp 90,900
- Member discount: 5% (Rp 7,090)
- Payment method: Mandiri VA

Expected Display:
✅ Subtotal (2 items): Rp 141,800
✅ Diskon (5%): -Rp 7,090
✅ Subtotal setelah diskon: Rp 134,710
✅ Metode Pembayaran: Mandiri Virtual Account
✅ Total Pembayaran: Rp 134,710
ℹ️ Catatan: Total pembayaran sudah termasuk biaya admin...
```

### Test Case 3: Guest Checkout (No Discount)

```
Input:
- 1 Item: Robux 800 @ Rp 10,000
- No discount (guest)
- Payment method: QRIS

Expected Display:
✅ Subtotal (1 items): Rp 10,000
❌ Diskon section NOT shown (because calculateTotalDiscount = 0)
❌ Subtotal setelah diskon NOT shown
✅ Metode Pembayaran: QRIS
✅ Total Pembayaran: Rp 10,000
ℹ️ Catatan: Total pembayaran sudah termasuk biaya admin...
```

---

## 📝 Files Modified

### 1. `/app/(public)/track-order/page.tsx`

**Changes:**

- ✅ Import `calculateTotalDiscount` helper
- ✅ Enhanced Payment Summary with 6 sections
- ✅ Display discount percentage
- ✅ Show subtotal after discount
- ✅ Show payment method name
- ✅ Add info note about payment fee
- ✅ Better typography and spacing

### 2. `/app/api/transactions/invoice/[invoiceId]/route.ts`

**Changes:**

- ✅ Added `paymentMethodId` to response (GET method)
- ✅ Added `paymentMethodName` to response (GET method)
- ✅ Added `paymentMethodId` to response (POST method)
- ✅ Added `paymentMethodName` to response (POST method)

---

## 🎯 Benefits

### User Experience:

- ✅ **Clear Breakdown:** User sees exactly what they're paying for
- ✅ **Discount Transparency:** Percentage and amount clearly shown
- ✅ **Payment Method Info:** Know which method they used
- ✅ **Admin Fee Notice:** Understand that fees are included
- ✅ **Professional Look:** Better typography and spacing

### Technical:

- ✅ **Accurate Calculations:** Using proper helper functions
- ✅ **Maintainable Code:** Reusing existing helpers
- ✅ **Consistent Data:** Same discount logic as checkout
- ✅ **Type Safety:** Using TypeScript features properly

---

## 💡 Why No Separate Payment Fee Line?

**Question:** "Kenapa biaya admin payment method tidak ditampilkan sebagai line item terpisah?"

**Answer:**

1. **Not Stored Separately in Database**

   ```typescript
   // Database has:
   totalAmount: 50900,       // Before discount
   discountAmount: 2545,     // Discount amount
   finalAmount: 48355,       // After discount + includes fee

   // No separate field:
   // paymentFee: ???
   ```

2. **Calculated Dynamically at Midtrans**

   ```typescript
   // In API multi checkout:
   const paymentFee = Math.round(finalAmount) - itemsTotal;

   // This fee is added to Midtrans items but not stored per transaction
   ```

3. **Already Included in finalAmount**
   - Each transaction's `finalAmount` already includes its portion of fee
   - Displaying it separately would require:
     - Storing fee in database (schema change)
     - Distributing fee proportionally to items
     - Additional API changes
4. **Transparent with Note**
   - Info box tells user: "Total sudah termasuk biaya admin"
   - User knows fees are included
   - No confusion about extra charges

**Future Enhancement (if needed):**

- Add `paymentFee` field to Transaction schema
- Calculate and distribute fee to each item
- Display as separate line item
- Requires database migration for existing data

---

## 🚀 Summary

**Before:**

- ❌ Diskon tidak akurat
- ❌ Tidak ada info payment method
- ❌ Tidak ada penjelasan biaya admin
- ❌ Layout sederhana

**After:**

- ✅ Diskon akurat dengan persentase
- ✅ Menampilkan payment method name
- ✅ Info note tentang biaya admin
- ✅ Layout profesional dengan breakdown jelas
- ✅ Consistent dengan checkout flow

---

**Tanggal Fix:** 14 Oktober 2025  
**Status:** ✅ Complete - Ready for Testing  
**Impact:** Improved transparency and user experience
