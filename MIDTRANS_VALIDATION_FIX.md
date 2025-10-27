# Midtrans Gross Amount Validation Fix

## Problem

After fixing backend to receive `paymentFee` from frontend, Midtrans API returned validation error:

```
Midtrans API Error: transaction_details.gross_amount is not equal to the sum of item_details
```

### Root Cause

Backend was sending `finalAmount` (which already includes payment fee) as `gross_amount`, but **also adding payment fee as a separate item** in `item_details`. This caused payment fee to be **counted twice** from Midtrans's perspective.

### Example of the Error

**Request sent to Midtrans:**

```json
{
  "transaction_details": {
    "order_id": "TRX-1234567890",
    "gross_amount": 94000 // finalAmount (90,000 + 4,000)
  },
  "item_details": [
    {
      "id": "PRODUCT_123",
      "price": 90000, // After discount
      "quantity": 1,
      "name": "Robux 100K (Diskon 10%)"
    },
    {
      "id": "PAYMENT_FEE",
      "price": 4000, // Payment fee
      "quantity": 1,
      "name": "Biaya Admin"
    }
  ]
}
```

**Midtrans Validation:**

```
gross_amount: 94,000 (from finalAmount)
sum of item_details: 94,000 (90,000 + 4,000)

❌ ERROR: Payment fee counted in both gross_amount AND item_details!
```

## Solution

**Calculate `gross_amount` from the sum of `item_details`**, since payment fee is already included as an item.

### Before (WRONG)

**Multi-Item Handler:**

```typescript
const snapResult = await midtransService.createSnapTransaction({
  orderId: masterOrderId,
  amount: Math.round(finalAmountAfterDiscount), // ❌ Includes payment fee
  items: midtransItems, // Also includes payment fee item
});
```

**Single-Item Handler:**

```typescript
const snapResult = await midtransService.createSnapTransaction({
  orderId: midtransOrderId,
  amount: calculatedFinalAmount, // ❌ Includes payment fee
  items, // Also includes payment fee item
});
```

### After (CORRECT)

**Multi-Item Handler:**

```typescript
// Calculate total items amount (should match gross_amount sent to Midtrans)
const totalItemsAmount = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);
console.log("Total items amount for Midtrans:", totalItemsAmount);

const snapResult = await midtransService.createSnapTransaction({
  orderId: masterOrderId,
  amount: totalItemsAmount, // ✅ Sum of all items (including payment fee item)
  items: midtransItems,
});
```

**Single-Item Handler:**

```typescript
// Calculate total items amount (should match gross_amount sent to Midtrans)
const totalItemsAmount = items.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);
console.log("Total items amount for Midtrans:", totalItemsAmount);

const snapResult = await midtransService.createSnapTransaction({
  orderId: midtransOrderId,
  amount: totalItemsAmount, // ✅ Sum of all items (including payment fee item)
  items,
});
```

## Verification

### Correct Request to Midtrans

```json
{
  "transaction_details": {
    "order_id": "TRX-1234567890",
    "gross_amount": 94000 // ✅ Sum of item_details
  },
  "item_details": [
    {
      "id": "PRODUCT_123",
      "price": 90000,
      "quantity": 1,
      "name": "Robux 100K (Diskon 10%)"
    },
    {
      "id": "PAYMENT_FEE",
      "price": 4000,
      "quantity": 1,
      "name": "Biaya Admin"
    }
  ]
}
```

**Midtrans Validation:**

```
gross_amount: 94,000
sum of item_details: 90,000 + 4,000 = 94,000
✅ MATCH! Validation passes
```

## Console Output

### Before Fix

```
=== MIDTRANS SINGLE-ITEM DEBUG ===
Items: [
  { "id": "PRODUCT_123", "price": 90000, "quantity": 1 },
  { "id": "PAYMENT_FEE", "price": 4000, "quantity": 1 }
]
Items total: 90000
Payment fee from frontend: 4000
Final Amount: 94000
Sending to Midtrans with gross_amount: 94000 ❌

Error: gross_amount is not equal to the sum of item_details
```

### After Fix

```
=== MIDTRANS SINGLE-ITEM DEBUG ===
Items: [
  { "id": "PRODUCT_123", "price": 90000, "quantity": 1 },
  { "id": "PAYMENT_FEE", "price": 4000, "quantity": 1 }
]
Items total: 90000
Payment fee from frontend: 4000
Calculated Final Amount: 94000
Total items amount for Midtrans: 94000
Sending to Midtrans with gross_amount: 94000 ✅

Success: Snap transaction created
```

## Data Flow Breakdown

### Frontend Calculation

```
Subtotal: 100,000
Discount (10%): -10,000
After Discount: 90,000
Payment Fee: +4,000
Final Amount: 94,000 ← Sent to backend
```

### Backend Processing

```
Received from frontend:
  totalAmount: 100,000
  discountAmount: 10,000
  finalAmount: 94,000 ← Used to calculate final unit price
  paymentFee: 4,000 ← Used as separate item

Items for Midtrans:
  1. Product (after discount): 90,000
  2. Payment Fee: 4,000

Total Items: 94,000 ← Sent as gross_amount to Midtrans
```

### Midtrans Validation

```
gross_amount: 94,000
item_details sum: 90,000 + 4,000 = 94,000
Result: ✅ PASS
```

## Files Modified

**`/app/api/transactions/route.ts`**

1. **Multi-Item Handler** (Lines 545-570):

   - Added calculation: `totalItemsAmount = midtransItems.reduce(...)`
   - Changed: `amount: totalItemsAmount` (was `Math.round(finalAmountAfterDiscount)`)
   - Added logging: "Total items amount for Midtrans"

2. **Single-Item Handler** (Lines 925-950):
   - Added calculation: `totalItemsAmount = items.reduce(...)`
   - Changed: `amount: totalItemsAmount` (was `calculatedFinalAmount`)
   - Added logging: "Total items amount for Midtrans"

## Testing Scenarios

### Scenario 1: Single Item + Payment Fee

```
Product: Rp 100,000
Discount: 10% = Rp 10,000
Payment Fee: Rp 4,000

Items sent to Midtrans:
  - Product: Rp 90,000 (after discount)
  - Payment Fee: Rp 4,000

gross_amount: Rp 94,000 (90,000 + 4,000) ✅
```

### Scenario 2: Multi Item + Discount + Payment Fee

```
Cart:
  - Product A: Rp 100,000 × 2 = Rp 200,000
  - Product B: Rp 50,000 × 1 = Rp 50,000
  Subtotal: Rp 250,000

Discount: 15% = Rp 37,500
After Discount: Rp 212,500
Payment Fee: Rp 4,000

Items sent to Midtrans:
  - Product A (discounted): Rp 85,000 × 2 = Rp 170,000
  - Product B (discounted): Rp 42,500 × 1 = Rp 42,500
  - Payment Fee: Rp 4,000

gross_amount: Rp 216,500 (170,000 + 42,500 + 4,000) ✅
```

### Scenario 3: No Payment Fee

```
Product: Rp 100,000
Discount: 10% = Rp 10,000
Payment Fee: Rp 0 (free payment method)

Items sent to Midtrans:
  - Product: Rp 90,000 (after discount)

gross_amount: Rp 90,000 ✅
```

## Key Takeaways

1. ✅ **Payment fee must be added as item**, not in gross_amount
2. ✅ **gross_amount = sum of all item_details** (Midtrans validation rule)
3. ✅ **Frontend sends finalAmount** for reference, but backend calculates gross_amount from items
4. ✅ **Console logging** shows both finalAmount and totalItemsAmount for verification

## Related Documents

- `PAYMENT_FEE_CALCULATION_FIX.md` - Frontend payment calculation
- `PAYMENT_FEE_BACKEND_FIX.md` - Backend receives payment fee
- `PAYMENT_FLOW_COMPLETE.md` - End-to-end payment flow

## Date

2024 - Midtrans Gross Amount Validation Fix
