# 🔧 Payment Fee Calculation Fix

## 🐛 Problem Identified

Payment fee **tampil correct di UI** checkout page, tapi **tidak dikirim dengan benar** ke Midtrans karena kalkulasi yang tidak konsisten.

### **Issue:**

```typescript
// ❌ SEBELUM (Inconsistent calculation)
const paymentFee = calculatePaymentFee(
  checkoutData.finalAmount || checkoutData.totalAmount,
  selectedPayment
);

// Di beberapa tempat:
finalAmount: (checkoutData.finalAmount || checkoutData.totalAmount) +
  paymentFee;
```

Problem: Terkadang `checkoutData.finalAmount` sudah ada (after discount), tapi calculation tidak consistent.

---

## ✅ Solution Applied

### **1. Consistent Variable Naming**

```typescript
// ✅ SESUDAH (Clear and consistent)
const baseAmountAfterDiscount =
  checkoutData.finalAmount || checkoutData.totalAmount;

const paymentFee = selectedPayment
  ? calculatePaymentFee(baseAmountAfterDiscount, selectedPayment)
  : 0;

const finalAmountWithFee = baseAmountAfterDiscount + paymentFee;
```

**Variable hierarchy yang jelas:**

1. `checkoutData.totalAmount` = Subtotal (sebelum discount)
2. `checkoutData.finalAmount` = After discount (sebelum payment fee)
3. `baseAmountAfterDiscount` = Same as finalAmount (untuk clarity)
4. `paymentFee` = Fee dari payment method
5. `finalAmountWithFee` = Final amount to charge (after discount + fee)

---

### **2. Enhanced Logging**

```typescript
console.log("\n=== PAYMENT CALCULATION DEBUG ===");
console.log("Subtotal:", checkoutData.totalAmount);
console.log("Discount Percentage:", checkoutData.discountPercentage || 0, "%");
console.log("Discount Amount:", checkoutData.discountAmount || 0);
console.log("After Discount (Base):", baseAmountAfterDiscount);
console.log("Selected Payment Method:", selectedPayment?.name);
console.log("Payment Fee:", paymentFee);
console.log("FINAL AMOUNT (to send to Midtrans):", finalAmountWithFee);
console.log("================================\n");
```

Sekarang mudah untuk debug kalkulasi di browser console!

---

### **3. Consistent Data Sent to API**

**Single Transaction:**

```typescript
{
  totalAmount: checkoutData.totalAmount,        // Subtotal
  discountPercentage: 10,                       // 10%
  discountAmount: 100000,                       // Rp 100.000
  finalAmount: finalAmountWithFee,              // After discount + fee
  paymentFee: paymentFee,                       // Fee amount
  paymentMethodId: "qris"
}
```

**Multi Transaction:**

```typescript
{
  items: [...],
  totalAmount: checkoutData.totalAmount,        // Subtotal
  discountPercentage: 10,                       // 10%
  discountAmount: 100000,                       // Rp 100.000
  finalAmount: finalAmountWithFee,              // After discount + fee
  paymentFee: paymentFee,                       // Fee amount
  paymentMethodId: "qris"
}
```

---

## 📊 Calculation Flow

### **Example: User dengan Reseller 10%, Payment via QRIS**

**Step 1: Calculate Subtotal**

```
Item 1: Robux 1000 × 1 = Rp 500.000
Item 2: Joki Rank × 1  = Rp 500.000
─────────────────────────────────────
Subtotal (totalAmount):   Rp 1.000.000
```

**Step 2: Apply Discount**

```
Discount (10%):          - Rp 100.000
─────────────────────────────────────
After Discount (baseAmountAfterDiscount):
                          Rp 900.000
```

**Step 3: Calculate Payment Fee**

```
Payment Method: QRIS (0.7% fee)
Payment Fee:              Rp 6.300
```

**Step 4: Calculate Final Amount**

```
After Discount:           Rp 900.000
Payment Fee:            + Rp 6.300
─────────────────────────────────────
FINAL (finalAmountWithFee):
                          Rp 906.300
```

**Step 5: Data Sent to Backend**

```json
{
  "totalAmount": 1000000,
  "discountPercentage": 10,
  "discountAmount": 100000,
  "finalAmount": 906300,      ← This amount sent to Midtrans
  "paymentFee": 6300,
  "paymentMethodId": "qris"
}
```

**Step 6: Backend Creates Midtrans Transaction**

```typescript
// Backend should use finalAmount directly
const snapToken = await createMidtransTransaction({
  amount: req.body.finalAmount, // 906300 ✅
  orderId: orderId,
  customerDetails: req.body.customerInfo,
});
```

---

## 🔍 Debugging Guide

### **How to Verify Fix:**

**1. Open Browser Console**

```
F12 → Console tab
```

**2. Go to Checkout & Select Payment**

```
Add item to cart → Checkout → Select QRIS
```

**3. Check Console Log**
You should see:

```
=== PAYMENT CALCULATION DEBUG ===
Subtotal: 1000000
Discount Percentage: 10 %
Discount Amount: 100000
After Discount (Base): 900000
Selected Payment Method: QRIS
Payment Fee: 6300
FINAL AMOUNT (to send to Midtrans): 906300
================================
```

**4. Click "Bayar Sekarang"**

**5. Check Network Tab**

```
F12 → Network → Look for POST /api/transactions
```

**6. Check Request Payload**

```json
{
  "finalAmount": 906300,    ← Should match console log
  "paymentFee": 6300,
  "totalAmount": 1000000,
  "discountAmount": 100000
}
```

**7. Verify in Midtrans Dashboard**

- Transaction amount should be **Rp 906.300**
- Should match "Total Bayar" in UI

---

## 🧪 Test Scenarios

### **Test 1: No Discount, QRIS Payment**

```
Subtotal:        Rp 500.000
Discount:        Rp 0
After Discount:  Rp 500.000
Payment Fee:     Rp 3.500 (0.7%)
───────────────────────────
FINAL:           Rp 503.500 ✅
```

### **Test 2: With Discount 10%, QRIS**

```
Subtotal:        Rp 1.000.000
Discount (10%):  - Rp 100.000
After Discount:  Rp 900.000
Payment Fee:     Rp 6.300 (0.7%)
───────────────────────────
FINAL:           Rp 906.300 ✅
```

### **Test 3: With Discount 20%, Bank Transfer**

```
Subtotal:        Rp 2.000.000
Discount (20%):  - Rp 400.000
After Discount:  Rp 1.600.000
Payment Fee:     Rp 4.000 (fixed)
───────────────────────────
FINAL:           Rp 1.604.000 ✅
```

### **Test 4: Multi Items with Discount**

```
Item 1: Robux    Rp 500.000
Item 2: Joki     Rp 500.000
Item 3: Gamepass Rp 300.000
───────────────────────────
Subtotal:        Rp 1.300.000
Discount (15%):  - Rp 195.000
After Discount:  Rp 1.105.000
Payment Fee:     Rp 7.735 (0.7%)
───────────────────────────
FINAL:           Rp 1.112.735 ✅
```

---

## ⚠️ Important Notes

### **For Backend Developers:**

1. **Use `finalAmount` directly** from request:

   ```typescript
   // ✅ CORRECT
   const amountToCharge = req.body.finalAmount;

   // ❌ WRONG - Don't recalculate
   const amountToCharge =
     req.body.totalAmount - req.body.discountAmount + req.body.paymentFee;
   ```

2. **Validate the amount** (optional security check):

   ```typescript
   const expectedFinal =
     req.body.totalAmount - req.body.discountAmount + req.body.paymentFee;

   if (Math.abs(expectedFinal - req.body.finalAmount) > 1) {
     throw new Error("Amount mismatch");
   }
   ```

3. **Store all amounts** in transaction record:
   ```typescript
   {
     totalAmount: req.body.totalAmount,
     discountAmount: req.body.discountAmount,
     paymentFee: req.body.paymentFee,
     finalAmount: req.body.finalAmount,  // This goes to Midtrans
     ...
   }
   ```

---

## 📋 Checklist

After this fix, verify:

- [x] ✅ Payment fee calculation consistent
- [x] ✅ Clear variable naming (finalAmountWithFee)
- [x] ✅ Enhanced console logging
- [x] ✅ Single transaction uses finalAmountWithFee
- [x] ✅ Multi transaction uses finalAmountWithFee
- [x] ✅ No TypeScript errors
- [ ] ⏳ Test with actual Midtrans payment
- [ ] ⏳ Verify amount in Midtrans dashboard matches UI
- [ ] ⏳ Test with different payment methods
- [ ] ⏳ Test with and without discount

---

## 🎯 Expected Behavior

### **UI Display:**

```
Subtotal:           Rp 1.000.000
Diskon (10%):       - Rp 100.000
Biaya Admin:        + Rp 6.300
─────────────────────────────────
Total Bayar:        Rp 906.300
```

### **Midtrans Snap:**

```
Order ID: TRX-20251027-XXXX
Amount: Rp 906.300  ← Must match Total Bayar
```

### **Transaction Record:**

```json
{
  "orderId": "TRX-20251027-XXXX",
  "totalAmount": 1000000,
  "discountAmount": 100000,
  "paymentFee": 6300,
  "finalAmount": 906300,
  "status": "pending"
}
```

---

## 🚀 Deployment Notes

1. **Frontend Updated:** ✅ Checkout page payment calculation fixed
2. **Backend Verification:** ⏳ Ensure backend uses `finalAmount` correctly
3. **Testing Required:** ⏳ End-to-end payment test with Midtrans
4. **Monitoring:** Add logging in backend to track finalAmount vs Midtrans amount

---

**Last Updated:** 27 Oktober 2025  
**Status:** ✅ Frontend Fixed - Pending Backend Verification & Testing  
**Priority:** 🔴 HIGH - Payment calculation critical for business
