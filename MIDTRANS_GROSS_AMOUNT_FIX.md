# Midtrans Gross Amount Validation Fix

## Problem

Midtrans API menolak request dengan error:

```
transaction_details.gross_amount is not equal to the sum of item_details
```

## Root Cause

Ketika mengirim request ke Midtrans Snap API, ada **payment fee** yang ditambahkan ke `gross_amount` tapi **tidak dimasukkan ke `item_details`**.

### Example Case:

```
Items:
- Item 1: 24,000
- Item 2: 24,000
- Discount: -9,600

Sum of item_details: 24,000 + 24,000 - 9,600 = 38,400
gross_amount sent: 42,400 (includes 4,000 payment fee)

❌ Mismatch: 42,400 ≠ 38,400
```

Midtrans mengharuskan `gross_amount` **HARUS SAMA PERSIS** dengan sum dari semua `item_details`.

## Solution

Menambahkan **payment fee sebagai item** di `item_details` sehingga total sesuai dengan `gross_amount`.

### After Fix:

```
Items:
- Item 1: 24,000
- Item 2: 24,000
- Discount: -9,600
- Payment Fee: 4,000 ✅ (NEW)

Sum of item_details: 24,000 + 24,000 - 9,600 + 4,000 = 42,400
gross_amount sent: 42,400

✅ Match: 42,400 = 42,400
```

## Implementation

### 1. Cart Multi-Checkout (`app/api/transactions/multi/route.ts`)

```typescript
// Calculate sum of items before adding discount and fee
const itemsSubtotal = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);

// Add discount item if applicable
if (discount > 0) {
  midtransItems.push({
    id: "DISCOUNT",
    price: -Math.round(discount),
    quantity: 1,
    name: `Diskon Member (${discountPercentage}%)`,
    brand: "RBX Store",
    category: "discount",
  });
}

// Calculate payment fee (difference between final amount and items total)
const itemsTotal = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);
const paymentFee = Math.round(finalAmountBeforeFee) - itemsTotal;

// Add payment fee if applicable
if (paymentFee > 0) {
  midtransItems.push({
    id: "PAYMENT_FEE",
    price: paymentFee,
    quantity: 1,
    name: "Biaya Admin",
    brand: "RBX Store",
    category: "fee",
  });
}

console.log("=== MIDTRANS ITEMS DEBUG ===");
console.log("Items subtotal:", itemsSubtotal);
console.log("Items with discount:", itemsTotal);
console.log("Payment fee:", paymentFee);
console.log("Final Amount:", finalAmountBeforeFee);
```

### 2. Multi-Item Direct Purchase (`app/api/transactions/route.ts` - handleMultiItemDirectPurchase)

Same logic as cart checkout:

```typescript
// Calculate sum of items before adding discount and fee
const itemsSubtotal = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);

// Add discount item if applicable
if (discount > 0) {
  midtransItems.push({
    id: "DISCOUNT",
    price: -Math.round(discount),
    quantity: 1,
    name: `Diskon Member (${discountPercentage}%)`,
    brand: "RBX Store",
    category: "discount",
  });
}

// Calculate payment fee
const itemsTotal = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);
const paymentFee = Math.round(finalAmountAfterDiscount) - itemsTotal;

// Add payment fee if applicable
if (paymentFee > 0) {
  midtransItems.push({
    id: "PAYMENT_FEE",
    price: paymentFee,
    quantity: 1,
    name: "Biaya Admin",
    brand: "RBX Store",
    category: "fee",
  });
}
```

### 3. Single-Item Transaction (`app/api/transactions/route.ts` - handleSingleItemTransaction)

For single item, check for rounding differences:

```typescript
// Calculate sum of items to check for rounding differences
const itemsTotal = items.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);
const amountDifference = Math.round(calculatedFinalAmount) - itemsTotal;

// Add payment fee if there's a difference (due to rounding or actual fee)
if (amountDifference > 0) {
  items.push({
    id: "PAYMENT_FEE",
    price: amountDifference,
    quantity: 1,
    name: "Biaya Admin",
    brand: "RBX Store",
    category: "fee",
  });
}

console.log("=== MIDTRANS SINGLE-ITEM DEBUG ===");
console.log("Items total:", itemsTotal);
console.log("Amount difference:", amountDifference);
console.log("Final Amount:", calculatedFinalAmount);
```

## Key Points

### 1. Payment Fee Item Format

```typescript
{
  id: "PAYMENT_FEE",
  price: paymentFee,      // Positive number (fee amount)
  quantity: 1,
  name: "Biaya Admin",
  brand: "RBX Store",
  category: "fee",
}
```

### 2. Discount Item Format

```typescript
{
  id: "DISCOUNT",
  price: -Math.round(discount),  // Negative number (reduces total)
  quantity: 1,
  name: `Diskon Member (${discountPercentage}%)`,
  brand: "RBX Store",
  category: "discount",
}
```

### 3. Calculation Flow

```
1. Calculate items subtotal (before discount)
2. Add discount item (negative price)
3. Calculate items total (after discount)
4. Calculate payment fee = finalAmount - itemsTotal
5. Add payment fee item (if > 0)
6. Final sum = gross_amount ✅
```

### 4. Console Logs for Debugging

API akan log:

```
=== MIDTRANS ITEMS DEBUG ===
Items subtotal: 48000
Items with discount: 38400
Payment fee: 4000
Final Amount: 42400
```

Ini memudahkan debugging jika ada mismatch antara gross_amount dan sum of items.

## Testing

### Test Case 1: Cart with Multiple Items + Discount + Fee

```
Input:
- Item 1: 24,000 (Robux 200)
- Item 2: 24,000 (Robux 200)
- Discount: 20% = -9,600
- Payment Fee: 4,000

Expected Midtrans Items:
[
  { id: "...", price: 24000, quantity: 1, name: "robux 200" },
  { id: "...", price: 24000, quantity: 1, name: "robux 200" },
  { id: "DISCOUNT", price: -9600, quantity: 1, name: "Diskon Member (20%)" },
  { id: "PAYMENT_FEE", price: 4000, quantity: 1, name: "Biaya Admin" }
]

Sum: 24,000 + 24,000 - 9,600 + 4,000 = 42,400
gross_amount: 42,400 ✅
```

### Test Case 2: Single Item with Rounding

```
Input:
- Item: 100,000 / 3 = 33,333.33 per unit
- Quantity: 3
- Total: 100,000 (rounded)

Items calculation:
- price: 33,333 (rounded)
- quantity: 3
- subtotal: 99,999

Amount difference: 100,000 - 99,999 = 1

Expected Midtrans Items:
[
  { id: "...", price: 33333, quantity: 3, name: "..." },
  { id: "PAYMENT_FEE", price: 1, quantity: 1, name: "Biaya Admin" }
]

Sum: 99,999 + 1 = 100,000
gross_amount: 100,000 ✅
```

### Test Case 3: No Payment Fee

```
Input:
- Item: 50,000
- Quantity: 2
- Total: 100,000
- No discount, no fee

Items calculation:
- price: 50,000
- quantity: 2
- subtotal: 100,000

Amount difference: 100,000 - 100,000 = 0

Expected Midtrans Items:
[
  { id: "...", price: 50000, quantity: 2, name: "..." }
]

No PAYMENT_FEE item added ✅
Sum: 100,000
gross_amount: 100,000 ✅
```

## Files Modified

1. **`app/api/transactions/multi/route.ts`**

   - Added payment fee calculation and item
   - Added detailed console logs

2. **`app/api/transactions/route.ts`**
   - Updated `handleMultiItemDirectPurchase()` with payment fee logic
   - Updated `handleSingleItemTransaction()` with rounding difference check
   - Added detailed console logs

## Midtrans Validation Rules

### Rule 1: Exact Match Required

```typescript
gross_amount === sum(item_details.price * item_details.quantity);
```

### Rule 2: All Amounts Must Be Integers

```typescript
Math.round(amount); // Always round to avoid decimals
```

### Rule 3: Item Details Must Include Everything

```
- Product items ✅
- Discount items (negative price) ✅
- Fee items (positive price) ✅
- Tax items (if applicable) ✅
```

## Common Pitfalls

### ❌ Don't Do This:

```typescript
// Sending gross_amount with fee but not including fee in items
const snapResult = await midtransService.createSnapTransaction({
  orderId: "...",
  amount: 42400, // includes 4000 fee
  items: [
    { price: 24000, quantity: 1 }, // Only 38400 total
    { price: 24000, quantity: 1 },
    { price: -9600, quantity: 1 }, // discount
  ],
  // ❌ Missing payment fee item!
});
```

### ✅ Do This:

```typescript
const snapResult = await midtransService.createSnapTransaction({
  orderId: "...",
  amount: 42400, // includes 4000 fee
  items: [
    { price: 24000, quantity: 1 },
    { price: 24000, quantity: 1 },
    { price: -9600, quantity: 1 }, // discount
    { price: 4000, quantity: 1, name: "Biaya Admin" }, // ✅ Fee included!
  ],
});
```

## Related Issues

- **CART_CHECKOUT_INTEGRATION.md** - Cart checkout flow
- **PAYMENT_METHOD_SELECTION.md** - Payment method integration
- **TRANSACTION_SYSTEM.md** - Transaction system overview

## Support

If you encounter this error again:

1. Check console logs for "MIDTRANS ITEMS DEBUG"
2. Verify: `Items subtotal + discount + fee = Final Amount`
3. Ensure all fees/discounts are included as items

---

**Last Updated:** October 2025  
**Issue:** Midtrans gross_amount validation error  
**Status:** ✅ Fixed  
**Impact:** All transaction types (cart, direct purchase, single/multi-item)
