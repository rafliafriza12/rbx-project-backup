# Multi-Item Discount Calculation Fix

## Problem

Di **multi-item checkout**, total yang dikirim ke Midtrans **tidak sama** dengan yang dikalkulasi di frontend karena cara handle discount yang salah.

### Before (WRONG Approach)

```typescript
// 1. Add items with ORIGINAL price
midtransItems.push({
  id: item.serviceId,
  price: item.unitPrice, // ❌ Original price (no discount)
  quantity: item.quantity,
  name: item.serviceName,
});

// 2. Add DISCOUNT as negative item
if (discount > 0) {
  midtransItems.push({
    id: "DISCOUNT",
    price: -Math.round(discount), // ❌ Negative price
    quantity: 1,
    name: `Diskon Member (${discountPercentage}%)`,
  });
}

// 3. Add payment fee
midtransItems.push({
  id: "PAYMENT_FEE",
  price: paymentFee,
  quantity: 1,
  name: "Biaya Admin",
});
```

**Example dengan 2 items, discount 10%, payment fee 4,000:**

```
Items sent to Midtrans:
  - Product A: Rp 100,000 × 1 = Rp 100,000
  - Product B: Rp 50,000 × 1 = Rp 50,000
  - DISCOUNT: Rp -15,000 × 1 = Rp -15,000
  - Payment Fee: Rp 4,000 × 1 = Rp 4,000

Total: 100,000 + 50,000 - 15,000 + 4,000 = 139,000

But frontend calculated:
  Subtotal: 150,000
  Discount 10%: -15,000
  After Discount: 135,000
  Payment Fee: +4,000
  FINAL: 139,000

❌ LOOKS CORRECT but has issues:
- Negative price items can cause problems
- Doesn't match single-item approach
- Harder to track in Midtrans dashboard
```

## Solution (CORRECT Approach)

**Apply discount DIRECTLY to each item price**, not as negative item:

```typescript
// 1. Add items with ORIGINAL price first
midtransItems.push({
  id: item.serviceId,
  price: item.unitPrice, // Original price
  quantity: item.quantity,
  name: item.serviceName,
});

// 2. Apply discount to EACH item (proportionally)
if (discount > 0 && midtransItems.length > 0) {
  const discountMultiplier = 1 - discountPercent / 100;

  midtransItems.forEach((item) => {
    const originalPrice = item.price;
    item.price = Math.round(item.price * discountMultiplier); // ✅ Apply discount

    // Update name to show discount
    if (!item.name.includes("Diskon")) {
      item.name = `${item.name} (Diskon ${discountPercent}%)`;
    }

    console.log(
      `Item: ${item.name}, Original: ${originalPrice}, Discounted: ${item.price}`
    );
  });
}

// 3. Calculate items total AFTER discount
const itemsTotal = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);

// 4. Add payment fee
if (paymentFee > 0) {
  midtransItems.push({
    id: "PAYMENT_FEE",
    price: paymentFee,
    quantity: 1,
    name: "Biaya Admin",
  });
}
```

**Example dengan 2 items, discount 10%, payment fee 4,000:**

```
Items sent to Midtrans:
  - Product A (Diskon 10%): Rp 90,000 × 1 = Rp 90,000 ✅
  - Product B (Diskon 10%): Rp 45,000 × 1 = Rp 45,000 ✅
  - Payment Fee: Rp 4,000 × 1 = Rp 4,000 ✅

Total: 90,000 + 45,000 + 4,000 = 139,000 ✅

Frontend calculated:
  Subtotal: 150,000
  Discount 10%: -15,000
  After Discount: 135,000
  Payment Fee: +4,000
  FINAL: 139,000 ✅

✅ MATCH! And cleaner approach:
- No negative prices
- Each item shows discounted price
- Consistent with single-item approach
- Clear in Midtrans dashboard
```

## Data Flow Comparison

### Frontend Calculation (Same for Both)

```typescript
Cart Items:
  - Product A: Rp 100,000 × 1
  - Product B: Rp 50,000 × 1

Subtotal: Rp 150,000
Discount 10%: -Rp 15,000
After Discount: Rp 135,000
Payment Fee: +Rp 4,000
━━━━━━━━━━━━━━━━━━━━━━━
FINAL: Rp 139,000
```

### Backend Processing (BEFORE - WRONG)

```typescript
Items with original price:
  - Product A: 100,000
  - Product B: 50,000
  - DISCOUNT: -15,000 ❌ Negative item
  - Payment Fee: 4,000

Total: 139,000
```

### Backend Processing (AFTER - CORRECT)

```typescript
Items with discounted price:
  - Product A (Diskon 10%): 90,000 ✅
  - Product B (Diskon 10%): 45,000 ✅
  - Payment Fee: 4,000 ✅

Total: 139,000 ✅
```

### Midtrans Request (BEFORE)

```json
{
  "transaction_details": {
    "gross_amount": 139000
  },
  "item_details": [
    { "id": "PROD_A", "price": 100000, "quantity": 1 },
    { "id": "PROD_B", "price": 50000, "quantity": 1 },
    { "id": "DISCOUNT", "price": -15000, "quantity": 1 },
    { "id": "PAYMENT_FEE", "price": 4000, "quantity": 1 }
  ]
}
```

### Midtrans Request (AFTER - CLEANER)

```json
{
  "transaction_details": {
    "gross_amount": 139000
  },
  "item_details": [
    {
      "id": "PROD_A",
      "price": 90000,
      "quantity": 1,
      "name": "Product A (Diskon 10%)"
    },
    {
      "id": "PROD_B",
      "price": 45000,
      "quantity": 1,
      "name": "Product B (Diskon 10%)"
    },
    { "id": "PAYMENT_FEE", "price": 4000, "quantity": 1, "name": "Biaya Admin" }
  ]
}
```

## Benefits of New Approach

### 1. **No Negative Prices**

- Cleaner data structure
- Easier to understand in Midtrans dashboard
- Avoid potential edge cases with negative values

### 2. **Consistent with Single-Item**

- Both single and multi-item use same approach
- Apply discount to item price directly
- Same code pattern for maintenance

### 3. **Better Transparency**

- Each item clearly shows discounted price
- Item name includes discount percentage
- Customer sees exact breakdown

### 4. **Accurate Calculations**

```
BEFORE:
  Original prices + Negative discount = Net total
  100,000 + 50,000 - 15,000 + 4,000 = 139,000

AFTER:
  Discounted prices + Payment fee = Net total
  90,000 + 45,000 + 4,000 = 139,000

Both equal, but AFTER is clearer!
```

## Enhanced Logging

```
=== MULTI-ITEM PRICE CALCULATION DEBUG ===
Subtotal (before discount): 150000
Discount Amount: 15000
Discount Percentage: 10
Payment Fee: 4000
Final Amount (from frontend): 139000

Applying discount to items:
  Item: Product A (Diskon 10%), Original: 100000, Discounted: 90000
  Item: Product B (Diskon 10%), Original: 50000, Discounted: 45000

Items total after discount (before payment fee): 135000

=== MIDTRANS MULTI-ITEM DEBUG ===
Items: [
  {
    "id": "PROD_A",
    "price": 90000,
    "quantity": 1,
    "name": "Product A (Diskon 10%)"
  },
  {
    "id": "PROD_B",
    "price": 45000,
    "quantity": 1,
    "name": "Product B (Diskon 10%)"
  },
  {
    "id": "PAYMENT_FEE",
    "price": 4000,
    "quantity": 1,
    "name": "Biaya Admin"
  }
]

Total items amount for Midtrans: 139000

Expected match:
  frontendFinalAmount: 139000
  calculatedFromItems: 139000
  match: true ✅
```

## Files Modified

**`/app/api/transactions/route.ts`**

### 1. Multi-Item Handler Calculation (Lines 471-477)

Added detailed logging:

```typescript
console.log("=== MULTI-ITEM PRICE CALCULATION DEBUG ===");
console.log("Subtotal (before discount):", subtotal);
console.log("Discount Amount:", discount);
console.log("Discount Percentage:", discountPercent);
console.log("Payment Fee:", paymentFee);
console.log("Final Amount (from frontend):", finalAmount);
```

### 2. Discount Application (Lines 512-528)

**CHANGED from negative discount item to direct price discount:**

```typescript
// Apply discount to each item price (proportionally)
if (discount > 0 && midtransItems.length > 0) {
  const discountMultiplier = 1 - discountPercent / 100;
  midtransItems.forEach((item) => {
    const originalPrice = item.price;
    item.price = Math.round(item.price * discountMultiplier);

    // Update item name to show discount
    if (!item.name.includes("Diskon")) {
      item.name = `${item.name} (Diskon ${discountPercent}%)`;
    }

    console.log(
      `Item: ${item.name}, Original: ${originalPrice}, Discounted: ${item.price}`
    );
  });
}
```

### 3. Items Total Calculation (Lines 530-533)

```typescript
// Calculate sum of items AFTER applying discount (BEFORE payment fee)
const itemsTotal = midtransItems.reduce(
  (sum, item) => sum + item.price * item.quantity,
  0
);
```

### 4. Enhanced Midtrans Logging (Lines 558-571)

```typescript
console.log("=== MIDTRANS MULTI-ITEM DEBUG ===");
console.log("Items:", JSON.stringify(midtransItems, null, 2));
console.log("Payment fee from frontend:", paymentFee);
console.log("Final Amount (from frontend):", finalAmountAfterDiscount);
console.log("Total items amount for Midtrans:", totalItemsAmount);

// Verification
console.log("Expected match:", {
  frontendFinalAmount: finalAmount,
  calculatedFromItems: totalItemsAmount,
  match: finalAmount === totalItemsAmount,
});
```

## Testing Checklist

- [x] Multi-item checkout without discount
- [x] Multi-item checkout with discount (10%, 15%, 20%)
- [x] Multi-item checkout with payment fee
- [x] Multi-item checkout with discount + payment fee
- [x] Verify total matches frontend calculation
- [x] Check Midtrans dashboard shows discounted prices
- [x] Verify no negative price items
- [x] Console logs show correct calculations

## Related Documents

- `PAYMENT_FEE_CALCULATION_FIX.md` - Frontend payment calculation
- `PAYMENT_FEE_BACKEND_FIX.md` - Backend receives payment fee
- `MIDTRANS_VALIDATION_FIX.md` - Gross amount validation
- `PAYMENT_FLOW_COMPLETE.md` - End-to-end payment flow

## Date

2024 - Multi-Item Discount Calculation Fix
