# Transaction History Price Breakdown Fix

## Problem

Halaman riwayat transaksi (`/riwayat`) tidak menampilkan breakdown harga yang lengkap:

- Total yang ditampilkan tidak mencerminkan perhitungan yang benar (subtotal - diskon + biaya admin)
- Tidak ada informasi detail tentang biaya admin (payment fee)
- User tidak bisa melihat breakdown harga dengan jelas

## Solution

### 1. Fixed `calculateGrandTotal` Function

**File:** `/lib/transaction-helpers.ts`

**Before:**

```typescript
export function calculateGrandTotal(transaction: Transaction): number {
  const allTransactions = getAllTransactions(transaction);
  const rawTotal = allTransactions.reduce(
    (sum, t) => sum + (t.finalAmount || t.totalAmount),
    0
  );
  return rawTotal + ((transaction as any).paymentFee ?? 0);
}
```

**Issues:**

- Tidak ada komentar yang jelas tentang apa yang dihitung
- Type casting `as any` tidak aman
- Tidak konsisten dengan fungsi helper lainnya

**After:**

```typescript
/**
 * Calculate grand total for all transactions in checkout
 * Grand Total = Sum of all finalAmount + Payment Fee (only in main transaction)
 */
export function calculateGrandTotal(transaction: Transaction): number {
  const allTransactions = getAllTransactions(transaction);

  // Sum all finalAmount (already includes discount)
  const totalAfterDiscount = allTransactions.reduce(
    (sum, t) => sum + (t.finalAmount || t.totalAmount),
    0
  );

  // Add payment fee (only stored in main/first transaction)
  const paymentFee = getPaymentFee(transaction);

  return totalAfterDiscount + paymentFee;
}
```

**Improvements:**
✅ Dokumentasi jelas tentang rumus perhitungan
✅ Menggunakan fungsi `getPaymentFee()` yang sudah ada
✅ Kode lebih readable dengan variabel yang deskriptif
✅ Menghindari type casting dengan menggunakan fungsi helper

### 2. Added New Helper Function

**File:** `/lib/transaction-helpers.ts`

```typescript
/**
 * Calculate subtotal after discount (before payment fee)
 */
export function calculateSubtotalAfterDiscount(
  transaction: Transaction
): number {
  const allTransactions = getAllTransactions(transaction);
  return allTransactions.reduce(
    (sum, t) => sum + (t.finalAmount || t.totalAmount),
    0
  );
}
```

**Purpose:**

- Menghitung subtotal setelah diskon, tapi sebelum payment fee
- Berguna untuk menampilkan breakdown harga yang detail
- Memisahkan logika perhitungan subtotal dari grand total

### 3. Updated Transaction History Display

**File:** `/app/(public)/riwayat/page.tsx`

**Changes:**

#### Import Statement Updated:

```typescript
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  calculateOriginalTotal,
  calculateTotalDiscount,
  calculateSubtotalAfterDiscount, // ✅ New import
  getCheckoutDisplayName,
  getTotalItemsCount,
  getPaymentFee, // ✅ New import
} from "@/lib/transaction-helpers";
```

#### Price Display Section Redesigned:

**Before:**

```tsx
{
  /* Show discount info if available */
}
{
  calculateTotalDiscount(transaction) > 0 && (
    <div className="text-xs text-primary-200/60 line-through mb-1">
      Rp {calculateOriginalTotal(transaction).toLocaleString("id-ID")}
    </div>
  );
}
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary-100">
  <span className="text-white">
    Rp {calculateGrandTotal(transaction).toLocaleString("id-ID")}
  </span>
</div>;
```

**After:**

```tsx
{
  /* Show original price if there's discount */
}
{
  calculateTotalDiscount(transaction) > 0 && (
    <div className="text-xs text-primary-200/60 line-through mb-1">
      Rp {calculateOriginalTotal(transaction).toLocaleString("id-ID")}
    </div>
  );
}

{
  /* Price breakdown */
}
<div className="space-y-1 mb-2">
  {/* Subtotal after discount */}
  {(calculateTotalDiscount(transaction) > 0 ||
    getPaymentFee(transaction) > 0) && (
    <div className="text-xs text-primary-200/70">
      Subtotal: Rp{" "}
      {calculateSubtotalAfterDiscount(transaction).toLocaleString("id-ID")}
    </div>
  )}

  {/* Payment fee */}
  {getPaymentFee(transaction) > 0 && (
    <div className="text-xs text-primary-200/70">
      Biaya Admin: Rp {getPaymentFee(transaction).toLocaleString("id-ID")}
    </div>
  )}
</div>;

{
  /* Grand Total */
}
<div className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary-100">
  <span className="text-white">
    Rp {calculateGrandTotal(transaction).toLocaleString("id-ID")}
  </span>
</div>;
```

## Price Calculation Flow

### Example Transaction:

- **Item 1:** Joki Rank - Rp50.000 × 2 = Rp100.000
- **Discount:** 45% = Rp45.000
- **Payment Fee:** Rp3.000

### Display Flow:

#### 1. Original Price (if discount exists)

```
calculateOriginalTotal() = 100.000 (crossed out)
```

#### 2. Price Breakdown (if discount or payment fee exists)

```
Subtotal: Rp55.000 (calculateSubtotalAfterDiscount)
Biaya Admin: Rp3.000 (getPaymentFee)
```

#### 3. Grand Total (Bold, large text)

```
Rp58.000 (calculateGrandTotal)
```

#### 4. Discount Badge (if discount exists)

```
💰 Hemat Rp45.000
```

## Visual Hierarchy

```
┌─────────────────────────────────────┐
│ Rp100.000 (strikethrough)          │ ← Original price (if discount)
├─────────────────────────────────────┤
│ Subtotal: Rp55.000                  │ ← After discount
│ Biaya Admin: Rp3.000                │ ← Payment fee
├─────────────────────────────────────┤
│ Rp58.000 (BOLD, LARGE)              │ ← Grand Total
├─────────────────────────────────────┤
│ 💰 Hemat Rp45.000                   │ ← Discount badge
└─────────────────────────────────────┘
```

## Benefits

### For Users:

✅ **Transparansi Harga** - User bisa melihat breakdown lengkap
✅ **Jelas & Mudah Dipahami** - Informasi biaya admin ditampilkan eksplisit
✅ **Visual Hierarchy** - Harga total lebih menonjol, breakdown sebagai detail
✅ **Informasi Lengkap** - Menampilkan harga asli, diskon, biaya admin, dan total

### For Developers:

✅ **Kode Lebih Maintainable** - Fungsi helper yang jelas dan terdokumentasi
✅ **Reusable Functions** - Helper functions bisa digunakan di halaman lain
✅ **Type Safety** - Tidak ada type casting `as any`
✅ **Consistent Logic** - Perhitungan konsisten dengan checkout page

## Testing

### Test Case 1: Transaction with Discount and Payment Fee

**Input:**

- Original: Rp100.000
- Discount: Rp45.000 (45%)
- Payment Fee: Rp3.000

**Expected Display:**

```
Rp100.000 (strikethrough)
Subtotal: Rp55.000
Biaya Admin: Rp3.000
Rp58.000 (bold)
💰 Hemat Rp45.000
```

### Test Case 2: Transaction with Payment Fee Only

**Input:**

- Original: Rp50.000
- Discount: Rp0
- Payment Fee: Rp2.000

**Expected Display:**

```
Subtotal: Rp50.000
Biaya Admin: Rp2.000
Rp52.000 (bold)
```

### Test Case 3: Transaction with Discount Only

**Input:**

- Original: Rp100.000
- Discount: Rp30.000 (30%)
- Payment Fee: Rp0

**Expected Display:**

```
Rp100.000 (strikethrough)
Subtotal: Rp70.000
Rp70.000 (bold)
💰 Hemat Rp30.000
```

### Test Case 4: Transaction without Discount or Payment Fee

**Input:**

- Original: Rp50.000
- Discount: Rp0
- Payment Fee: Rp0

**Expected Display:**

```
Rp50.000 (bold)
```

(No breakdown shown - keeps display clean)

## Related Files

### Modified:

1. `/lib/transaction-helpers.ts`

   - Fixed `calculateGrandTotal()` function
   - Added `calculateSubtotalAfterDiscount()` function
   - Improved documentation

2. `/app/(public)/riwayat/page.tsx`
   - Updated imports
   - Redesigned price display section
   - Added breakdown display logic

### Related Documentation:

- `MULTI_CHECKOUT_PAYMENT_FEE_FIX.md` - Backend payment fee handling
- `PAYMENT_FEE_CALCULATION_FIX.md` - Frontend checkout calculation
- `CART_SYSTEM_DOCS.md` - Cart and checkout system overview

## Status

✅ **COMPLETE** - Transaction history now displays complete price breakdown including:

- Original price (if discount exists)
- Subtotal after discount
- Payment fee (biaya admin)
- Grand total (bold, prominent)
- Discount savings badge

## Future Improvements

Potential enhancements for future iterations:

- [ ] Add tooltip explaining what payment fee is
- [ ] Show payment method name alongside payment fee
- [ ] Add animation when hovering over price breakdown
- [ ] Export price breakdown data for invoice/receipt generation
- [ ] Add price history tracking (price changes over time)
