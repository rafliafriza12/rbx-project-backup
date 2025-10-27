# Payment Fee Backend Integration Fix

## Problem Statement

Payment fee yang sudah dihitung dengan benar di frontend **TIDAK diterima dan digunakan** oleh backend. Backend **RECALCULATE** payment fee sendiri dengan cara yang salah, menyebabkan jumlah yang dikirim ke Midtrans **TIDAK SESUAI** dengan yang ditampilkan di UI.

### Root Cause

Backend di `/app/api/transactions/route.ts` melakukan:

**Multi-item handler (line 530):**

```typescript
const paymentFee = Math.round(finalAmountAfterDiscount) - itemsTotal;
```

**Single-item handler (line 913):**

```typescript
const amountDifference = Math.round(calculatedFinalAmount) - itemsTotal;
```

Backend **tidak receive** `paymentFee` dari request body, dan **recalculate** sendiri dengan cara yang berbeda dari frontend!

## Solution Implemented

### 1. Multi-Item Handler (`handleMultiItemDirectPurchase`)

**Before:**

```typescript
async function handleMultiItemDirectPurchase(body: any) {
  const {
    items,
    customerInfo,
    userId,
    totalAmount,
    discountPercentage,
    discountAmount,
    finalAmount,
    // paymentFee TIDAK di-receive! ❌
    additionalNotes,
    paymentMethodId,
  } = body;

  // ...

  // Backend RECALCULATE payment fee ❌
  const paymentFee = Math.round(finalAmountAfterDiscount) - itemsTotal;
}
```

**After:**

```typescript
async function handleMultiItemDirectPurchase(body: any) {
  const {
    items,
    customerInfo,
    userId,
    totalAmount,
    discountPercentage,
    discountAmount,
    finalAmount,
    paymentFee, // ✅ NOW RECEIVE from frontend
    additionalNotes,
    paymentMethodId,
  } = body;

  // ...

  // ✅ USE payment fee from frontend (already calculated correctly)
  const itemsTotal = midtransItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Add payment fee if applicable
  if (paymentFee > 0) {
    midtransItems.push({
      id: "PAYMENT_FEE",
      price: paymentFee, // ✅ Use value from frontend
      quantity: 1,
      name: "Biaya Admin",
      brand: "RBX Store",
      category: "fee",
    });
  }
}
```

### 2. Single-Item Handler (`handleSingleItemTransaction`)

**Before:**

```typescript
async function handleSingleItemTransaction(body: any) {
  const {
    serviceType,
    serviceId,
    // ... other fields
    finalAmount,
    // paymentFee TIDAK di-receive! ❌
    robloxUsername,
    // ...
  } = body;

  // ...

  // Backend RECALCULATE payment fee ❌
  const amountDifference = Math.round(calculatedFinalAmount) - itemsTotal;

  if (amountDifference > 0) {
    items.push({
      id: "PAYMENT_FEE",
      price: amountDifference, // ❌ Wrong calculation
      quantity: 1,
      name: "Biaya Admin",
    });
  }
}
```

**After:**

```typescript
async function handleSingleItemTransaction(body: any) {
  const {
    serviceType,
    serviceId,
    // ... other fields
    finalAmount,
    paymentFee, // ✅ NOW RECEIVE from frontend
    robloxUsername,
    // ...
  } = body;

  // ...

  // Calculate sum of items
  const itemsTotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // ✅ USE payment fee from frontend (already calculated correctly)
  if (paymentFee && paymentFee > 0) {
    items.push({
      id: "PAYMENT_FEE",
      price: paymentFee, // ✅ Use value from frontend
      quantity: 1,
      name: "Biaya Admin",
      brand: "RBX Store",
      category: "fee",
    });
  }
}
```

### 3. Enhanced Backend Logging

**Multi-item handler:**

```typescript
console.log("=== MIDTRANS MULTI-ITEM DEBUG ===");
console.log("Items:", JSON.stringify(midtransItems, null, 2));
console.log("Items subtotal:", itemsSubtotal);
console.log("Items total with discount:", itemsTotal);
console.log("Payment fee from frontend:", paymentFee); // ✅ Show received value
console.log("Final Amount:", finalAmountAfterDiscount);
```

**Single-item handler:**

```typescript
console.log("=== SINGLE ITEM TRANSACTION DEBUG ===");
console.log("Extracted fields:", {
  // ... other fields
  totalAmount,
  discountPercentage,
  discountAmount,
  finalAmount,
  paymentFee, // ✅ Show received value
  // ...
});

// Later in Midtrans preparation:
console.log("=== MIDTRANS SINGLE-ITEM DEBUG ===");
console.log("Items:", JSON.stringify(items, null, 2));
console.log("Items total:", itemsTotal);
console.log("Payment fee from frontend:", paymentFee); // ✅ Show received value
console.log("Final Amount:", calculatedFinalAmount);
```

## Data Flow (End-to-End)

### Frontend Calculation (Checkout Page)

```typescript
// 1. Subtotal
const subtotal = calculateSubtotal(); // e.g., 100,000

// 2. Discount
const discountPercent = user.diskon || 0; // e.g., 10
const discountAmount = Math.round(subtotal * (discountPercent / 100)); // 10,000

// 3. After Discount
const baseAmountAfterDiscount = subtotal - discountAmount; // 90,000

// 4. Payment Fee
const paymentFee = calculatePaymentFee(selectedMethod, baseAmountAfterDiscount); // e.g., 4,000

// 5. Final Amount
const finalAmountWithFee = baseAmountAfterDiscount + paymentFee; // 94,000
```

### Request Body to Backend

```typescript
const requestData = {
  // ... items, customer info, etc.
  totalAmount: subtotal, // 100,000
  discountPercentage: discountPercent, // 10
  discountAmount: discountAmount, // 10,000
  finalAmount: finalAmountWithFee, // 94,000
  paymentFee: paymentFee, // 4,000 ✅ NOW SENT
  paymentMethodId: selectedMethod._id,
};
```

### Backend Processing

```typescript
// ✅ NOW RECEIVE paymentFee from request
const { finalAmount, paymentFee } = body;

// ✅ USE paymentFee directly (no recalculation)
if (paymentFee > 0) {
  items.push({
    id: "PAYMENT_FEE",
    price: paymentFee, // ✅ Exact value from frontend
    quantity: 1,
    name: "Biaya Admin",
  });
}
```

### Midtrans Integration

```typescript
const snapResult = await midtransService.createSnapTransaction({
  orderId: midtransOrderId,
  amount: finalAmount, // 94,000 (includes 4,000 payment fee)
  items: [
    {
      id: "PRODUCT_123",
      price: 90000, // After discount
      quantity: 1,
      name: "Product (Diskon 10%)",
    },
    {
      id: "PAYMENT_FEE",
      price: 4000, // ✅ Exact fee from frontend
      quantity: 1,
      name: "Biaya Admin",
    },
  ],
  // Total: 90,000 + 4,000 = 94,000 ✅ MATCH!
});
```

## Files Modified

1. **`/app/api/transactions/route.ts`**
   - Line 276-290: Multi-item handler - added `paymentFee` to destructuring
   - Line 526-540: Multi-item handler - removed recalculation, use `paymentFee` from request
   - Line 544-555: Multi-item handler - enhanced logging
   - Line 641-662: Single-item handler - added `paymentFee` to destructuring
   - Line 668-698: Single-item handler - enhanced logging with payment amounts
   - Line 900-928: Single-item handler - removed recalculation, use `paymentFee` from request

## Testing Checklist

### Frontend (Already Fixed)

- [x] Payment fee calculated correctly with selected method
- [x] Consistent variable naming (baseAmountAfterDiscount → paymentFee → finalAmountWithFee)
- [x] Console logs show correct calculations
- [x] Request body includes `paymentFee`

### Backend (Now Fixed)

- [x] Multi-item handler receives `paymentFee` from request body
- [x] Single-item handler receives `paymentFee` from request body
- [x] Both handlers use `paymentFee` directly (no recalculation)
- [x] Console logs show received `paymentFee` value

### Integration Testing Needed

- [ ] Test multi-item checkout with payment fee
  - Check console: frontend calculation = backend received = Midtrans amount
- [ ] Test single-item checkout with payment fee
  - Check console: frontend calculation = backend received = Midtrans amount
- [ ] Test with reseller discount + payment fee
  - Verify: (subtotal - discount) + fee = final amount
- [ ] Test different payment methods (different fee structures)
  - BCA VA (flat fee)
  - GoPay (percentage fee)
  - QRIS (percentage fee)
- [ ] Verify Midtrans dashboard shows correct amounts
- [ ] Test guest checkout with payment fee
- [ ] Test logged-in user checkout with payment fee

## Expected Console Output

### Frontend (Checkout Page)

```
💰 PAYMENT CALCULATION:
  Subtotal: Rp 100,000
  Discount: 10% = Rp 10,000
  After Discount: Rp 90,000
  Payment Fee: Rp 4,000
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FINAL AMOUNT: Rp 94,000
```

### Backend (Multi-Item)

```
=== MIDTRANS MULTI-ITEM DEBUG ===
Items: [
  {
    "id": "PRODUCT_123",
    "price": 90000,
    "quantity": 1,
    "name": "Product (Diskon 10%)"
  },
  {
    "id": "PAYMENT_FEE",
    "price": 4000,
    "quantity": 1,
    "name": "Biaya Admin"
  }
]
Items subtotal: 100000
Items total with discount: 90000
Payment fee from frontend: 4000
Final Amount: 94000
```

### Backend (Single-Item)

```
=== SINGLE ITEM TRANSACTION DEBUG ===
Extracted fields: {
  totalAmount: 100000,
  discountPercentage: 10,
  discountAmount: 10000,
  finalAmount: 94000,
  paymentFee: 4000,
  ...
}

=== MIDTRANS SINGLE-ITEM DEBUG ===
Items: [
  {
    "id": "PRODUCT_123",
    "price": 90000,
    "quantity": 1,
    "name": "Product (Diskon 10%)"
  },
  {
    "id": "PAYMENT_FEE",
    "price": 4000,
    "quantity": 1,
    "name": "Biaya Admin"
  }
]
Items total: 90000
Payment fee from frontend: 4000
Final Amount: 94000
```

## Summary

✅ **FIXED:**

- Backend now **receives** `paymentFee` from frontend in both handlers
- Backend **uses** frontend's `paymentFee` directly (no recalculation)
- Enhanced logging to track payment fee throughout the flow
- Both single and multi-item transactions handle payment fee consistently

✅ **RESULT:**

- Amount shown in UI = Amount sent to backend = Amount sent to Midtrans
- No more calculation mismatch between frontend and backend
- Payment fee handled consistently across all transaction types
- Full traceability via console logs

## Related Documents

- `PAYMENT_FEE_CALCULATION_FIX.md` - Frontend payment calculation fix
- `CHECKOUT_RESELLER_DISCOUNT_VERIFICATION.md` - Reseller discount implementation

## Date

2024 - Payment Fee Backend Integration Fix
