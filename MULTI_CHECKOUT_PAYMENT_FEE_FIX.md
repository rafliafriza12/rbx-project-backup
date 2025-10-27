# Multi-Checkout Payment Fee Fix - COMPLETE

## Problem Overview

Payment fee was not being added to Midtrans transactions in multi-checkout flow, causing the total amount in Midtrans to be incorrect (missing the payment fee).

### Root Cause Discovery

After extensive debugging, discovered there are **TWO separate transaction API routes**:

1. **`/app/api/transactions/route.ts`** - Handles both single and multi items via `handleMultiItemDirectPurchase()`
2. **`/app/api/transactions/multi/route.ts`** - **Dedicated multi-checkout handler** (THIS is the route actually used!)

All initial fixes were applied to the main `route.ts`, but multi-checkout was actually calling `/api/transactions/multi`, which still had old code.

## Issues Found in `/app/api/transactions/multi/route.ts`

### 1. Payment Fee Not Extracted from Request Body

**Before:**

```typescript
const {
  items,
  subtotal,
  discountAmount,
  discountPercentage,
  finalAmount,
  // ... other fields
  // ❌ Missing: paymentFee
} = await request.json();
```

**After:**

```typescript
const {
  items,
  subtotal,
  discountAmount,
  discountPercentage,
  finalAmount,
  paymentFee: rawPaymentFee, // ✅ Receive payment fee from frontend
  // ... other fields
} = await request.json();

// Convert to number with safety check
const paymentFee = rawPaymentFee ? Number(rawPaymentFee) : 0;
console.log("Payment Fee (raw):", rawPaymentFee);
console.log("Payment Fee (converted):", paymentFee);
```

### 2. Discount Not Applied to Item Prices

**Before (Line 254):**

```typescript
// Items sent to Midtrans with original prices (discount NOT applied)
midtransItems.push({
  id: `${item.serviceId}-${i}`,
  price: item.unitPrice, // ❌ Original price without discount
  quantity: item.quantity,
  name: item.serviceName,
  brand: "RBX Store",
  category: item.serviceType,
});
```

**After:**

```typescript
// Calculate unit price after discount
const itemUnitPriceAfterDiscount =
  itemDiscountAmount > 0
    ? Math.round(itemFinalAmount / item.quantity)
    : item.unitPrice;

const itemNameWithDiscount =
  itemDiscountPercentage > 0
    ? `${item.serviceName} (Diskon ${itemDiscountPercentage}%)`
    : item.serviceName;

// Items sent to Midtrans with discount applied to unit price
midtransItems.push({
  id: `${item.serviceId}-${i}`,
  price: itemUnitPriceAfterDiscount, // ✅ Price after discount
  quantity: item.quantity,
  name: itemNameWithDiscount, // ✅ Shows discount percentage
  brand: "RBX Store",
  category: item.serviceType,
});
```

### 3. Negative DISCOUNT Item Added (Double Discount)

**Before (Line 324):**

```typescript
// ❌ Added negative DISCOUNT item (old approach - causes double discount!)
if (totalDiscountDistributed > 0) {
  midtransItems.push({
    id: "DISCOUNT",
    price: -Math.round(totalDiscountDistributed), // Negative price
    quantity: 1,
    name: `Diskon Member${
      discountPercentage ? ` (${discountPercentage}%)` : ""
    }`,
    brand: "RBX Store",
    category: "discount",
  });
}
```

**After:**

```typescript
// ✅ Removed - Discount already applied to individual item prices
// No need for separate negative DISCOUNT item
```

### 4. Payment Fee Calculated Incorrectly

**Before (Line 337):**

```typescript
// ❌ Calculate payment fee from difference (WRONG - ignores frontend value)
const itemsTotal = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);
const paymentFee = Math.round(finalAmountBeforeFee) - itemsTotal;

console.log("=== PAYMENT FEE CALCULATION ===");
console.log("Final Amount (from request):", finalAmountBeforeFee);
console.log("Items Total (subtotal - discount):", itemsTotal);
console.log("Payment Fee:", paymentFee);
```

**After:**

```typescript
// ✅ Use payment fee from request body (calculated by frontend)
const itemsTotal = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);

console.log("=== PAYMENT FEE FROM REQUEST ===");
console.log("Payment Fee (from frontend):", paymentFee);
console.log("Payment Fee Type:", typeof paymentFee);
console.log("Items Total (after discount):", itemsTotal);
```

### 5. Payment Fee Added to Items (But with Wrong Value)

**Before (Line 359):**

```typescript
// Payment fee was added, BUT using wrongly calculated value
if (paymentFee > 0) {
  midtransItems.push({
    id: "PAYMENT_FEE",
    price: paymentFee, // ❌ Wrong calculated value
    quantity: 1,
    name: "Biaya Admin",
    brand: "RBX Store",
    category: "fee",
  });
}
```

**After:**

```typescript
// ✅ Use payment fee from request body with proper logging
if (paymentFee && paymentFee > 0) {
  midtransItems.push({
    id: "PAYMENT_FEE",
    price: paymentFee, // ✅ Correct value from frontend
    quantity: 1,
    name: "Biaya Admin",
    brand: "RBX Store",
    category: "fee",
  });
  console.log(`✅ Payment fee added to Midtrans items: ${paymentFee}`);
} else {
  console.log(`❌ Payment fee NOT added (value: ${paymentFee})`);
}
```

### 6. Gross Amount Used finalAmountBeforeFee

**Before (Line 377):**

```typescript
const snapResult = await midtransService.createSnapTransaction({
  orderId: masterOrderId,
  amount: Math.round(finalAmountBeforeFee), // ❌ Direct value (may not match items)
  items: midtransItems,
  // ...
});
```

**After:**

```typescript
// ✅ Calculate gross_amount from sum of item_details (Midtrans requirement)
const grossAmount = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);

console.log("=== MIDTRANS GROSS AMOUNT ===");
console.log("Calculated from items:", grossAmount);
console.log("Items count:", midtransItems.length);

const snapResult = await midtransService.createSnapTransaction({
  orderId: masterOrderId,
  amount: grossAmount, // ✅ Calculated from items
  items: midtransItems,
  // ...
});
```

## Complete Flow After Fix

### Frontend (Checkout Page)

1. User selects items and payment method
2. Calculate: `finalAmount = subtotal - discount + paymentFee`
3. Send to backend:
   ```json
   {
     "items": [...],
     "subtotal": 100000,
     "discountAmount": 45000,
     "paymentFee": 3000,
     "finalAmount": 58000
   }
   ```

### Backend (`/app/api/transactions/multi/route.ts`)

1. **Extract payment fee** from request body
2. **For each item:**
   - Distribute discount proportionally
   - Calculate `itemFinalAmount = itemTotalAmount - itemDiscountAmount`
   - Calculate `itemUnitPriceAfterDiscount = itemFinalAmount / quantity`
   - Add to `midtransItems` with discounted price
3. **Add payment fee** to `midtransItems`
4. **Calculate gross_amount** from sum of all items (including payment fee)
5. **Send to Midtrans** with correct total

### Midtrans

Receives transaction with:

```javascript
{
  "gross_amount": 58000, // subtotal - discount + paymentFee
  "item_details": [
    {
      "id": "joki-1",
      "name": "Joki Rank (Diskon 45%)",
      "price": 27500, // After discount applied
      "quantity": 2
    },
    {
      "id": "PAYMENT_FEE",
      "name": "Biaya Admin",
      "price": 3000,
      "quantity": 1
    }
  ]
}

// Validation: 27500×2 + 3000 = 58000 ✅
```

## Testing Verification

### Test Case: Multi-Checkout with Discount and Payment Fee

**Input:**

- Item 1: Joki Rank, Rp50.000 × 2 = Rp100.000
- Discount: 45% (Rp45.000)
- Payment Fee: Rp3.000
- **Expected Total: Rp58.000**

**Before Fix:**

```
Items sent to Midtrans:
- Joki Rank: Rp50.000 × 2 = Rp100.000
- DISCOUNT: -Rp45.000 × 1 = -Rp45.000
- (Payment fee: NOT ADDED)
Total: Rp55.000 ❌ (Missing payment fee)
```

**After Fix:**

```
Items sent to Midtrans:
- Joki Rank (Diskon 45%): Rp27.500 × 2 = Rp55.000
- Biaya Admin: Rp3.000 × 1 = Rp3.000
Total: Rp58.000 ✅ (Correct!)
```

## Files Modified

### `/app/api/transactions/multi/route.ts`

**Changes:**

1. Line 16-35: Extract and convert `paymentFee` from request body
2. Line 254-271: Apply discount to item unit prices in `midtransItems`
3. Line 324-370: Remove negative DISCOUNT item, use payment fee from request
4. Line 377-388: Calculate `grossAmount` from sum of `midtransItems`

## Related Documentation

- `PAYMENT_FEE_CALCULATION_FIX.md` - Frontend payment fee calculation
- `PAYMENT_FEE_BACKEND_FIX.md` - Initial backend fix (wrong file)
- `MIDTRANS_VALIDATION_FIX.md` - Midtrans gross_amount validation
- `MULTI_ITEM_DISCOUNT_FIX.md` - Discount application approach

## Important Notes

### Why Two Transaction Routes?

The codebase has two separate routes for historical/architectural reasons:

- `/api/transactions` - Original multi-purpose handler
- `/api/transactions/multi` - Dedicated multi-checkout handler (more optimized)

Frontend uses `/api/transactions/multi` for multi-checkout, so this is the file that needed fixing.

### Why Not Use Negative DISCOUNT Item?

Midtrans validation requires: `gross_amount = sum of (price × quantity) for all items`

With negative DISCOUNT item:

```
Items: 100000
DISCOUNT: -45000
Sum: 55000
But we need: 58000 (including payment fee)
```

With discount applied to prices:

```
Items (after discount): 55000
PAYMENT_FEE: 3000
Sum: 58000 ✅
```

## Status

✅ **COMPLETE** - All issues in `/app/api/transactions/multi/route.ts` have been fixed.

Multi-checkout now correctly:

- Receives payment fee from frontend
- Applies discount to item unit prices
- Adds payment fee to Midtrans items
- Calculates gross_amount from item sum
- Matches frontend total calculation
