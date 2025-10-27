# Transaction Detail Page Price Calculation Fix

## Problem

Halaman detail transaksi (`/riwayat/[id]`) menggunakan perhitungan harga yang salah:

### Issues Found:

1. **Double Counting Payment Fee**

```typescript
// ❌ WRONG - Adds payment fee twice!
Rp {(
  calculateGrandTotal(transaction) +  // Already includes payment fee
  (transaction.paymentFee || 0)        // Adding again!
).toLocaleString("id-ID")}
```

2. **Not Using Helper Functions Consistently**

```typescript
// ❌ Direct access to transaction.paymentFee
{
  transaction.paymentFee && transaction.paymentFee > 0 && (
    <div>Biaya Admin: Rp {transaction.paymentFee.toLocaleString("id-ID")}</div>
  );
}

// Problem: Payment fee might be in relatedTransactions!
```

3. **Manual Calculation Instead of Helper**

```typescript
// ❌ Manual calculation
Rp {(
  calculateOriginalTotal(transaction) -
  calculateTotalDiscount(transaction)
).toLocaleString("id-ID")}

// ✅ Should use helper
Rp {calculateSubtotalAfterDiscount(transaction).toLocaleString("id-ID")}
```

## Solution

### 1. Import Missing Helper Functions

**File:** `/app/(public)/riwayat/[id]/page.tsx`

**Before:**

```typescript
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  calculateOriginalTotal,
  calculateTotalDiscount,
  getTotalItemsCount,
  getCheckoutDisplayName,
} from "@/lib/transaction-helpers";
```

**After:**

```typescript
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  calculateOriginalTotal,
  calculateTotalDiscount,
  calculateSubtotalAfterDiscount, // ✅ Added
  getTotalItemsCount,
  getCheckoutDisplayName,
  getPaymentFee, // ✅ Added
} from "@/lib/transaction-helpers";
```

### 2. Fix Header Price Display

**Location:** Lines 340-370

**Before:**

```typescript
{
  /* Show discount info if available */
}
{
  calculateTotalDiscount(transaction) > 0 && (
    <div className="text-sm text-primary-200/60 line-through mb-1">
      Rp{" "}
      {(calculateOriginalTotal(transaction) + (transaction.paymentFee || 0)) // ❌ Direct access
        .toLocaleString("id-ID")}
    </div>
  );
}
<div className="text-3xl sm:text-4xl font-bold text-neon-pink mb-2">
  Rp{" "}
  {(calculateGrandTotal(transaction) + (transaction.paymentFee || 0)) // ❌ Double counting!
    .toLocaleString("id-ID")}
</div>;
```

**After:**

```typescript
{
  /* Show original price with payment fee if there's discount */
}
{
  calculateTotalDiscount(transaction) > 0 && (
    <div className="text-sm text-primary-200/60 line-through mb-1">
      Rp{" "}
      {(calculateOriginalTotal(transaction) + getPaymentFee(transaction)) // ✅ Use helper
        .toLocaleString("id-ID")}
    </div>
  );
}

{
  /* Grand Total (already includes payment fee) */
}
<div className="text-3xl sm:text-4xl font-bold text-neon-pink mb-2">
  Rp {calculateGrandTotal(transaction).toLocaleString("id-ID")}{" "}
  {/* ✅ No double counting */}
</div>;
```

### 3. Fix Multi-Checkout Summary

**Location:** Lines 490-540

**Before:**

```typescript
{
  /* Subtotal after discount */
}
{
  calculateTotalDiscount(transaction) > 0 && (
    <div className="flex justify-between items-center text-primary-200 text-sm">
      <span>Subtotal setelah diskon:</span>
      <span className="font-semibold text-white">
        Rp{" "}
        {(
          calculateOriginalTotal(transaction) -
          calculateTotalDiscount(transaction)
        ) // ❌ Manual calculation
          .toLocaleString("id-ID")}
      </span>
    </div>
  );
}

{
  /* Payment Fee */
}
{
  transaction.paymentFee &&
    transaction.paymentFee > 0 && ( // ❌ Direct access
      <div className="flex justify-between items-center text-primary-200 text-sm">
        <span>Biaya Admin:</span>
        <span className="font-semibold text-white">
          Rp {transaction.paymentFee.toLocaleString("id-ID")}
        </span>
      </div>
    );
}

<div className="flex justify-between items-center py-3 border-t-2 border-neon-purple/30">
  <span className="text-lg font-bold text-white">Grand Total:</span>
  <span className="text-lg font-bold text-neon-pink">
    Rp{" "}
    {(calculateGrandTotal(transaction) + (transaction.paymentFee || 0)) // ❌ Double counting!
      .toLocaleString("id-ID")}
  </span>
</div>;
```

**After:**

```typescript
{
  /* Subtotal after discount */
}
{
  calculateTotalDiscount(transaction) > 0 && (
    <div className="flex justify-between items-center text-primary-200 text-sm">
      <span>Subtotal setelah diskon:</span>
      <span className="font-semibold text-white">
        Rp {calculateSubtotalAfterDiscount(transaction).toLocaleString("id-ID")}{" "}
        {/* ✅ Use helper */}
      </span>
    </div>
  );
}

{
  /* Payment Fee */
}
{
  getPaymentFee(transaction) > 0 && ( // ✅ Use helper (searches all transactions)
    <div className="flex justify-between items-center text-primary-200 text-sm">
      <span>Biaya Admin:</span>
      <span className="font-semibold text-white">
        Rp {getPaymentFee(transaction).toLocaleString("id-ID")}
      </span>
    </div>
  );
}

<div className="flex justify-between items-center py-3 border-t-2 border-neon-purple/30">
  <span className="text-lg font-bold text-white">Grand Total:</span>
  <span className="text-lg font-bold text-neon-pink">
    Rp {calculateGrandTotal(transaction).toLocaleString("id-ID")}{" "}
    {/* ✅ Correct */}
  </span>
</div>;
```

### 4. Fix Single-Item Summary

**Location:** Lines 610-645

**Before:**

```typescript
{
  /* Payment Fee */
}
{
  transaction.paymentFee &&
    transaction.paymentFee > 0 && ( // ❌ Direct access
      <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
        <span className="text-primary-200 font-medium">Biaya Admin:</span>
        <span className="font-semibold text-white">
          Rp {transaction.paymentFee.toLocaleString("id-ID")}
        </span>
      </div>
    );
}

<div className="flex justify-between items-center py-3 border-t-2 border-neon-purple/30 mt-4">
  <span className="text-lg font-bold text-white">Total Bayar:</span>
  <span className="text-lg font-bold text-neon-pink">
    Rp{" "}
    {(
      (transaction.finalAmount || transaction.totalAmount) +
      (transaction.paymentFee || 0)
    ) // ❌ Manual calculation
      .toLocaleString("id-ID")}
  </span>
</div>;
```

**After:**

```typescript
{
  /* Payment Fee */
}
{
  getPaymentFee(transaction) > 0 && ( // ✅ Use helper
    <div className="flex justify-between items-center py-3 border-b border-neon-purple/20">
      <span className="text-primary-200 font-medium">Biaya Admin:</span>
      <span className="font-semibold text-white">
        Rp {getPaymentFee(transaction).toLocaleString("id-ID")}
      </span>
    </div>
  );
}

<div className="flex justify-between items-center py-3 border-t-2 border-neon-purple/30 mt-4">
  <span className="text-lg font-bold text-white">Total Bayar:</span>
  <span className="text-lg font-bold text-neon-pink">
    Rp {calculateGrandTotal(transaction).toLocaleString("id-ID")}{" "}
    {/* ✅ Use helper */}
  </span>
</div>;
```

## Price Calculation Flow (Correct)

### Example: Multi-Checkout with Discount

**Input:**

- Item 1: PUBG Conqueror - Rp1.200.000
- Item 2: PUBG Crown - Rp300.000
- **Subtotal:** Rp1.500.000
- **Discount:** 3% = Rp45.000
- **Payment Fee:** Rp4.000
- **Expected Total:** Rp1.459.000

### Display Breakdown:

#### Header Section:

```
Rp1.504.000 (strikethrough)  ← Original + Payment Fee
Rp1.459.000 (large, bold)    ← Grand Total
💰 Hemat Rp45.000             ← Discount badge
```

#### Detail Section:

```
Subtotal:                 Rp1.500.000
Diskon (3%):             -Rp45.000
Subtotal setelah diskon:  Rp1.455.000
Metode Pembayaran:        QRIS
Biaya Admin:              Rp4.000
─────────────────────────────────────
Grand Total:              Rp1.459.000 ✅
```

## Helper Functions Used

### `calculateGrandTotal()`

```typescript
// Returns: subtotal after discount + payment fee
// Already searches all related transactions for payment fee
calculateGrandTotal(transaction); // 1.459.000
```

### `getPaymentFee()`

```typescript
// Searches main transaction first, then related transactions
// Returns: payment fee from anywhere in the multi-checkout group
getPaymentFee(transaction); // 4.000
```

### `calculateSubtotalAfterDiscount()`

```typescript
// Returns: sum of all finalAmount (after discount, before payment fee)
calculateSubtotalAfterDiscount(transaction); // 1.455.000
```

### `calculateOriginalTotal()`

```typescript
// Returns: sum of all totalAmount (before discount and payment fee)
calculateOriginalTotal(transaction); // 1.500.000
```

### `calculateTotalDiscount()`

```typescript
// Returns: sum of all discountAmount
calculateTotalDiscount(transaction); // 45.000
```

## Before vs After Comparison

### Before Fix:

```typescript
Header: Rp1.463.000  ❌ (1.455.000 + 4.000 + 4.000 = double payment fee!)
Detail: Rp1.463.000  ❌ (same double counting)
```

### After Fix:

```typescript
Header: Rp1.459.000  ✅ (correct)
Detail: Rp1.459.000  ✅ (correct)
```

## Benefits

### Consistency

✅ Uses same helper functions as list page (`/riwayat`)  
✅ No duplicate calculation logic  
✅ Handles payment fee in any transaction position

### Correctness

✅ No double counting payment fee  
✅ Finds payment fee even if stored in related transaction  
✅ Accurate price breakdown

### Maintainability

✅ Single source of truth (helper functions)  
✅ Easy to update calculations in one place  
✅ Type-safe with TypeScript

## Testing Checklist

### Single-Item Transaction:

- [ ] Header shows correct total
- [ ] Detail shows: subtotal, discount, payment fee, grand total
- [ ] Grand total = subtotal - discount + payment fee

### Multi-Item Transaction:

- [ ] Header shows correct total for all items combined
- [ ] Detail shows all items with individual prices
- [ ] Shows combined discount
- [ ] Shows payment fee (found from any transaction)
- [ ] Grand total = (all items after discount) + payment fee

### Edge Cases:

- [ ] Transaction without discount (no strikethrough price)
- [ ] Transaction without payment fee (no admin fee line)
- [ ] Payment fee in related transaction (not main)

## Files Modified

1. `/app/(public)/riwayat/[id]/page.tsx`
   - Added imports: `calculateSubtotalAfterDiscount`, `getPaymentFee`
   - Fixed header price display (lines 340-370)
   - Fixed multi-checkout summary (lines 490-540)
   - Fixed single-item summary (lines 610-645)

## Related Documentation

- `TRANSACTION_HISTORY_PRICE_BREAKDOWN.md` - List page price fix
- `PAYMENT_FEE_NOT_FOUND_FIX.md` - Payment fee search logic
- `TRANSACTION_GET_API_MULTI_CHECKOUT_FIX.md` - API grouping logic

## Status

✅ **COMPLETE** - Transaction detail page now displays accurate price breakdown:

- Header shows grand total (with payment fee)
- Detail shows itemized breakdown
- No double counting
- Consistent with list page calculations
