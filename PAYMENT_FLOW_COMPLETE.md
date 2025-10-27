# Payment Flow End-to-End Documentation

## Overview

Complete documentation of the payment flow from frontend calculation to Midtrans integration, including reseller discount and payment fee handling.

## 1. Frontend Payment Calculation (Checkout Page)

### Location

`/app/checkout/page.tsx`

### Calculation Flow

```typescript
// Step 1: Calculate Subtotal
const subtotal = calculateSubtotal();
// Example: 100,000 (total items price × quantity)

// Step 2: Apply Reseller Discount
const discountPercent = user.diskon || 0; // From ResellerPackage via Auth
// Example: 10% for Reseller Tier 1

const discountAmount = Math.round(subtotal * (discountPercent / 100));
// Example: 100,000 × 0.10 = 10,000

// Step 3: Calculate Base Amount After Discount
const baseAmountAfterDiscount = subtotal - discountAmount;
// Example: 100,000 - 10,000 = 90,000

// Step 4: Calculate Payment Fee
const paymentFee = calculatePaymentFee(selectedMethod, baseAmountAfterDiscount);
// Example: 4,000 (based on payment method)

// Step 5: Calculate Final Amount
const finalAmountWithFee = baseAmountAfterDiscount + paymentFee;
// Example: 90,000 + 4,000 = 94,000
```

### Console Output

```
💰 PAYMENT CALCULATION:
  Subtotal: Rp 100,000
  Discount: 10% = Rp 10,000
  After Discount: Rp 90,000
  Payment Fee: Rp 4,000
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FINAL AMOUNT: Rp 94,000
```

## 2. Frontend Request to Backend

### Multi-Item Request (Cart Checkout)

```typescript
const requestData = {
  items: itemsWithCredentials,
  totalAmount: checkoutData.totalAmount, // 100,000 (subtotal)
  discountPercentage: checkoutData.discountPercentage || 0, // 10
  discountAmount: checkoutData.discountAmount || 0, // 10,000
  finalAmount: finalAmountWithFee, // 94,000 (includes payment fee)
  paymentMethod: selectedPaymentMethod,
  paymentFee: paymentFee, // 4,000 ✅ SENT
  additionalNotes: additionalNotes.trim() || undefined,
  customerInfo: { ... },
  userId: user?._id,
  paymentMethodId: selectedMethod._id,
};
```

### Single-Item Request (Direct Checkout)

```typescript
const requestData = {
  serviceType: "robux",
  serviceId: product._id,
  serviceName: product.name,
  quantity: quantity,
  unitPrice: product.price,
  totalAmount: subtotal, // 100,000
  discountPercentage: discountPercent, // 10
  discountAmount: discountAmount, // 10,000
  finalAmount: finalAmountWithFee, // 94,000 (includes payment fee)
  paymentFee: paymentFee, // 4,000 ✅ SENT
  paymentMethodId: selectedMethod._id,
  robloxUsername: credentials.username,
  robloxPassword: credentials.password,
  customerInfo: { ... },
  userId: user?._id,
};
```

## 3. Backend Transaction Processing

### Location

`/app/api/transactions/route.ts`

### Multi-Item Handler (`handleMultiItemDirectPurchase`)

```typescript
// Receive payment data from frontend
const {
  items,
  customerInfo,
  userId,
  totalAmount, // 100,000
  discountPercentage, // 10
  discountAmount, // 10,000
  finalAmount, // 94,000
  paymentFee, // 4,000 ✅ RECEIVED
  additionalNotes,
  paymentMethodId,
} = body;

// Prepare items for Midtrans
const midtransItems = items.map((item) => ({
  id: item.itemId,
  price: Math.round(item.price * (1 - discountPercentage / 100)),
  quantity: item.quantity,
  name: item.itemName,
}));

// Add payment fee as separate item
if (paymentFee > 0) {
  midtransItems.push({
    id: "PAYMENT_FEE",
    price: paymentFee, // ✅ USE value from frontend
    quantity: 1,
    name: "Biaya Admin",
    brand: "RBX Store",
    category: "fee",
  });
}

// Send to Midtrans
const snapResult = await midtransService.createSnapTransaction({
  orderId: midtransOrderId,
  amount: finalAmount, // 94,000
  items: midtransItems,
  customer: customerDetails,
});
```

### Single-Item Handler (`handleSingleItemTransaction`)

```typescript
// Receive payment data from frontend
const {
  serviceType,
  serviceId,
  serviceName,
  quantity,
  unitPrice,
  totalAmount, // 100,000
  discountPercentage, // 10
  discountAmount, // 10,000
  finalAmount, // 94,000
  paymentFee, // 4,000 ✅ RECEIVED
  paymentMethodId,
  robloxUsername,
  robloxPassword,
  customerInfo,
  userId,
} = body;

// Calculate final unit price after discount
const finalUnitPrice = Math.round(finalAmount / quantity);

// Prepare items for Midtrans
const items = [
  {
    id: serviceId,
    price: finalUnitPrice,
    quantity: quantity,
    name:
      discountPercentage > 0
        ? `${serviceName} (Diskon ${discountPercentage}%)`
        : serviceName,
  },
];

// Add payment fee as separate item
if (paymentFee && paymentFee > 0) {
  items.push({
    id: "PAYMENT_FEE",
    price: paymentFee, // ✅ USE value from frontend
    quantity: 1,
    name: "Biaya Admin",
    brand: "RBX Store",
    category: "fee",
  });
}

// Send to Midtrans
const snapResult = await midtransService.createSnapTransaction({
  orderId: midtransOrderId,
  amount: finalAmount, // 94,000
  items: items,
  customer: customerDetails,
});
```

### Backend Console Output

**Multi-Item:**

```
=== MIDTRANS MULTI-ITEM DEBUG ===
Items: [
  {
    "id": "PRODUCT_123",
    "price": 90000,
    "quantity": 1,
    "name": "Robux 100K"
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

**Single-Item:**

```
=== SINGLE ITEM TRANSACTION DEBUG ===
Extracted fields: {
  serviceType: "robux",
  quantity: 1,
  unitPrice: 100000,
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
    "name": "Robux 100K (Diskon 10%)"
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

## 4. Midtrans Integration

### Snap Transaction Structure

```typescript
{
  transaction_details: {
    order_id: "TRX-1234567890",
    gross_amount: 94000, // Final amount including payment fee
  },
  item_details: [
    {
      id: "PRODUCT_123",
      price: 90000, // After discount
      quantity: 1,
      name: "Robux 100K (Diskon 10%)",
    },
    {
      id: "PAYMENT_FEE",
      price: 4000, // Payment fee from frontend
      quantity: 1,
      name: "Biaya Admin",
    }
  ],
  customer_details: {
    first_name: "John Doe",
    email: "john@example.com",
    phone: "081234567890",
  },
  enabled_payments: ["bca_va"], // Based on selected method
  callbacks: {
    finish: "https://yoursite.com/transaction/?order_id=TRX-1234567890",
    error: "https://yoursite.com/transaction/?order_id=TRX-1234567890",
  }
}
```

### Verification

```
Item 1: Rp 90,000 × 1 = Rp 90,000
Item 2: Rp  4,000 × 1 = Rp  4,000
                        ──────────
Total:                  Rp 94,000 ✅ MATCH!
```

## 5. Reseller Discount Integration

### Authentication Layer

Location: `/app/api/auth/*/route.ts`

```typescript
// Check reseller status
if (user.resellerPackageId && user.resellerExpiry > new Date()) {
  const package = await ResellerPackage.findById(user.resellerPackageId);
  if (package && package.isActive) {
    userWithDiscount.diskon = package.discount; // Set discount %
  }
}
```

### Frontend Usage

```typescript
// In checkout page
const user = useAuth(); // Contains diskon field
const discountPercent = user.diskon || 0; // e.g., 10 for Tier 1
```

### Discount Tiers

```
Tier 0 (Non-Reseller): 0% discount
Tier 1 (Bronze): 10% discount
Tier 2 (Silver): 15% discount
Tier 3 (Gold): 20% discount
```

## 6. Payment Method Fee Structure

### Fee Types

1. **Flat Fee**: Fixed amount (e.g., Rp 4,000 for BCA VA)
2. **Percentage Fee**: Based on amount (e.g., 2% for GoPay)

### Calculation Function

```typescript
function calculatePaymentFee(method, amount) {
  if (!method) return 0;

  if (method.feeType === "flat") {
    return method.flatFee || 0;
  }

  if (method.feeType === "percentage") {
    return Math.round(amount * (method.percentageFee / 100));
  }

  return 0;
}
```

### Examples

```
BCA VA (Flat Rp 4,000):
  Base: Rp 90,000 → Fee: Rp 4,000 → Total: Rp 94,000

GoPay (2%):
  Base: Rp 90,000 → Fee: Rp 1,800 → Total: Rp 91,800

QRIS (0.7%):
  Base: Rp 90,000 → Fee: Rp 630 → Total: Rp 90,630
```

## 7. Data Consistency Verification

### Checkpoint 1: Frontend Calculation

```
✅ Subtotal calculated correctly
✅ Discount applied based on user.diskon
✅ Payment fee calculated based on selected method
✅ Final amount = (subtotal - discount) + fee
```

### Checkpoint 2: Request Body

```
✅ totalAmount = subtotal
✅ discountPercentage = user.diskon
✅ discountAmount = calculated discount
✅ paymentFee = calculated fee
✅ finalAmount = final calculated amount
```

### Checkpoint 3: Backend Processing

```
✅ Receives paymentFee from request
✅ Uses paymentFee directly (no recalculation)
✅ Adds paymentFee as separate Midtrans item
✅ Total items sum = finalAmount
```

### Checkpoint 4: Midtrans Transaction

```
✅ gross_amount = finalAmount
✅ item_details sum = finalAmount
✅ Includes payment fee item
✅ Customer details present
```

## 8. Testing Scenarios

### Scenario 1: Non-Reseller + BCA VA

```
Product: Robux 100K @ Rp 100,000
User: Non-Reseller (0% discount)
Payment: BCA VA (Flat Rp 4,000)

Calculation:
  Subtotal: Rp 100,000
  Discount: Rp 0
  After Discount: Rp 100,000
  Payment Fee: Rp 4,000
  FINAL: Rp 104,000 ✅
```

### Scenario 2: Reseller Tier 1 + GoPay

```
Product: Robux 100K @ Rp 100,000
User: Reseller Tier 1 (10% discount)
Payment: GoPay (2% fee)

Calculation:
  Subtotal: Rp 100,000
  Discount: Rp 10,000 (10%)
  After Discount: Rp 90,000
  Payment Fee: Rp 1,800 (2% of 90,000)
  FINAL: Rp 91,800 ✅
```

### Scenario 3: Reseller Tier 3 + QRIS

```
Product: Robux 500K @ Rp 500,000
User: Reseller Tier 3 (20% discount)
Payment: QRIS (0.7% fee)

Calculation:
  Subtotal: Rp 500,000
  Discount: Rp 100,000 (20%)
  After Discount: Rp 400,000
  Payment Fee: Rp 2,800 (0.7% of 400,000)
  FINAL: Rp 402,800 ✅
```

### Scenario 4: Multi-Item Cart + Reseller

```
Cart:
  - Robux 100K @ Rp 100,000 × 2 = Rp 200,000
  - Gamepass @ Rp 50,000 × 1 = Rp 50,000

User: Reseller Tier 2 (15% discount)
Payment: BCA VA (Flat Rp 4,000)

Calculation:
  Subtotal: Rp 250,000
  Discount: Rp 37,500 (15%)
  After Discount: Rp 212,500
  Payment Fee: Rp 4,000
  FINAL: Rp 216,500 ✅
```

## 9. Error Handling

### Frontend Validation

```typescript
// Check if payment method selected
if (!selectedPaymentMethod) {
  toast.error("Pilih metode pembayaran");
  return;
}

// Validate final amount
if (finalAmountWithFee <= 0) {
  toast.error("Total pembayaran tidak valid");
  return;
}
```

### Backend Validation

```typescript
// Validate required fields
if (!finalAmount || !paymentMethodId) {
  return NextResponse.json(
    { error: "Missing required payment data" },
    { status: 400 }
  );
}

// Validate payment fee
if (paymentFee < 0) {
  return NextResponse.json({ error: "Invalid payment fee" }, { status: 400 });
}
```

## 10. Related Files

### Frontend

- `/app/checkout/page.tsx` - Payment calculation & request
- `/app/api/auth/google/callback/route.ts` - Google OAuth + discount
- `/app/api/auth/login/route.ts` - Login + discount
- `/app/api/auth/register/route.ts` - Register + discount
- `/app/api/auth/me/route.ts` - Get user + discount

### Backend

- `/app/api/transactions/route.ts` - Transaction processing
- `/lib/midtrans.ts` - Midtrans service
- `/models/Transaction.ts` - Transaction model
- `/models/PaymentMethod.ts` - Payment method model
- `/models/ResellerPackage.ts` - Reseller package model

### Documentation

- `PAYMENT_FEE_CALCULATION_FIX.md` - Frontend fix
- `PAYMENT_FEE_BACKEND_FIX.md` - Backend fix
- `CHECKOUT_RESELLER_DISCOUNT_VERIFICATION.md` - Reseller integration
- `MIGRATION_TO_RESELLER_SYSTEM_COMPLETE.md` - System migration

## Date

2024 - Complete Payment Flow Documentation
