# ✅ Checkout Page - Reseller Discount Integration

## 📊 Status: FULLY IMPLEMENTED

Checkout page **sudah sepenuhnya terintegrasi** dengan sistem reseller discount!

---

## 🎯 Fitur yang Sudah Diterapkan

### **1. Automatic Discount Calculation**

User dengan status reseller akan **otomatis** mendapat diskon di checkout berdasarkan `user.diskon`.

**Code Implementation:**

```typescript
const calculateDiscount = (amount: number) => {
  if (!user) {
    return {
      discountPercentage: 0,
      discountAmount: 0,
      finalAmount: amount,
    };
  }

  const discountPercentage = user.diskon || 0; // ✅ From reseller package
  const discountAmount = Math.round((amount * discountPercentage) / 100);
  const finalAmount = amount - discountAmount;

  return {
    discountPercentage,
    discountAmount,
    finalAmount,
  };
};
```

---

### **2. Real-time Recalculation on User Change**

Jika user login/logout atau data user berubah, discount **otomatis recalculate**.

**Code Implementation:**

```typescript
useEffect(() => {
  if (checkoutData && checkoutData.items.length > 0) {
    // Recalculate base amount
    const baseAmount = checkoutData.items.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);

    // Recalculate discount based on current user
    const discount = calculateDiscount(baseAmount);

    // Update checkoutData with new discount
    setCheckoutData({
      ...checkoutData,
      discountPercentage: discount.discountPercentage,
      discountAmount: discount.discountAmount,
      finalAmount: discount.finalAmount,
    });
  }
}, [user]); // ✅ Trigger when user changes
```

---

### **3. Display in Order Summary**

Discount ditampilkan dengan jelas di order summary.

**UI Display:**

```
┌─────────────────────────────────────┐
│ 📦 Ringkasan Pesanan                │
├─────────────────────────────────────┤
│ Subtotal:         Rp 1.000.000      │
│ Diskon Member (10%): - Rp 100.000   │ ← ✅ Tampil jika ada discount
│ Biaya Admin:      + Rp 2.500        │
├─────────────────────────────────────┤
│ Total Bayar:      Rp 902.500        │
└─────────────────────────────────────┘
```

**Code Implementation:**

```typescript
{
  (checkoutData.discountPercentage || 0) > 0 && (
    <div className="flex justify-between items-center text-sm">
      <span className="text-green-400">
        Diskon Member ({checkoutData.discountPercentage}%):
      </span>
      <span className="text-green-400">
        - Rp {(checkoutData.discountAmount || 0).toLocaleString("id-ID")}
      </span>
    </div>
  );
}
```

---

### **4. Final Amount Calculation**

Total bayar = Subtotal - Discount + Payment Fee

**Code Implementation:**

```typescript
const calculateFinalAmount = () => {
  const baseAmount = checkoutData.finalAmount || checkoutData.totalAmount;

  if (selectedPaymentMethod) {
    const method = getAllMethods().find(
      (pm) => pm.id === selectedPaymentMethod
    );
    if (method) {
      const paymentFee = calculatePaymentFee(baseAmount, method);
      return baseAmount + paymentFee;
    }
  }

  return baseAmount;
};
```

**Flow:**

1. Base Amount = Sum of (quantity × unitPrice) for all items
2. Discount Amount = Base Amount × (discount %)
3. After Discount = Base Amount - Discount Amount
4. Payment Fee = Based on payment method selected
5. **Final Amount = After Discount + Payment Fee**

---

## 🔄 Flow Lengkap

### **Scenario 1: User dengan Reseller Tier 2 (10% discount)**

**Step 1: Load Checkout**

```
User: John Doe
Reseller Tier: 2
Reseller Expiry: 2025-12-31
Discount: 10%  ← From ResellerPackage via API /auth/me
```

**Step 2: Calculate Amount**

```
Item 1: Robux 1000 × 1 = Rp 500.000
Item 2: Joki Rank × 1  = Rp 500.000
─────────────────────────────────────
Subtotal:                 Rp 1.000.000
Diskon (10%):            - Rp 100.000
─────────────────────────────────────
After Discount:           Rp 900.000
Payment Fee (QRIS):      + Rp 2.500
─────────────────────────────────────
TOTAL BAYAR:              Rp 902.500
```

**Step 3: Display in UI**

- ✅ Subtotal: Rp 1.000.000
- ✅ Diskon Member (10%): - Rp 100.000 ← Tampil hijau
- ✅ Biaya Admin: + Rp 2.500
- ✅ Total Bayar: Rp 902.500

---

### **Scenario 2: User tanpa Reseller (0% discount)**

**Step 1: Load Checkout**

```
User: Jane Smith
Reseller Tier: 0 (atau null)
Discount: 0%
```

**Step 2: Calculate Amount**

```
Item 1: Robux 1000 × 1 = Rp 500.000
Item 2: Joki Rank × 1  = Rp 500.000
─────────────────────────────────────
Subtotal:                 Rp 1.000.000
Diskon (0%):             - Rp 0        ← Tidak tampil
─────────────────────────────────────
After Discount:           Rp 1.000.000
Payment Fee (QRIS):      + Rp 2.500
─────────────────────────────────────
TOTAL BAYAR:              Rp 1.002.500
```

**Step 3: Display in UI**

- ✅ Subtotal: Rp 1.000.000
- ❌ Diskon Member: (tidak tampil karena 0%)
- ✅ Biaya Admin: + Rp 2.500
- ✅ Total Bayar: Rp 1.002.500

---

### **Scenario 3: User dengan Reseller Expired**

**Step 1: Load Checkout**

```
User: Bob Wilson
Reseller Tier: 1
Reseller Expiry: 2025-10-01 (expired)
Discount: 0%  ← Auth API return 0% karena expired
```

**Step 2: Calculate Amount**

```
Item: Robux 1000 × 1 = Rp 500.000
─────────────────────────────────────
Subtotal:                 Rp 500.000
Diskon (0%):             - Rp 0        ← Tidak ada karena expired
─────────────────────────────────────
After Discount:           Rp 500.000
Payment Fee (QRIS):      + Rp 2.500
─────────────────────────────────────
TOTAL BAYAR:              Rp 502.500
```

---

## 🔍 Validasi di Backend

### **Auth API Response:**

**File:** `/app/api/auth/me/route.ts`

```typescript
// Check if user has active reseller
if (
  user.resellerPackageId &&
  user.resellerExpiry &&
  new Date(user.resellerExpiry) > new Date()
) {
  // Fetch package from database
  const resellerPackage = await ResellerPackage.findById(
    user.resellerPackageId
  );

  if (resellerPackage && resellerPackage.isActive) {
    user.diskon = resellerPackage.discount; // ✅ Set discount
  }
} else {
  user.diskon = 0; // ❌ Expired or no reseller
}
```

**Response Example (Active Reseller):**

```json
{
  "user": {
    "_id": "67...",
    "firstName": "John",
    "lastName": "Doe",
    "resellerTier": 2,
    "resellerExpiry": "2025-12-31T00:00:00.000Z",
    "resellerPackageId": "67...abc",
    "diskon": 10  ← ✅ From ResellerPackage
  }
}
```

**Response Example (Expired/No Reseller):**

```json
{
  "user": {
    "_id": "67...",
    "firstName": "Jane",
    "lastName": "Smith",
    "resellerTier": 0,
    "resellerExpiry": null,
    "resellerPackageId": null,
    "diskon": 0  ← ❌ No discount
  }
}
```

---

## 🧪 Testing Checklist

### **Test 1: Active Reseller - Single Item**

1. ✅ Login sebagai user dengan reseller aktif (Tier 2, 10%)
2. ✅ Add item ke cart: Robux 1000 (Rp 500.000)
3. ✅ Go to checkout
4. ✅ **Verify:**
   - Subtotal: Rp 500.000
   - Diskon Member (10%): - Rp 50.000
   - Total sebelum payment fee: Rp 450.000
5. ✅ Pilih payment method (e.g., QRIS)
6. ✅ **Verify:**
   - Total Bayar = Rp 450.000 + payment fee

### **Test 2: Active Reseller - Multiple Items**

1. ✅ Login sebagai user dengan reseller aktif (Tier 3, 20%)
2. ✅ Add multiple items:
   - Robux 1000: Rp 500.000
   - Joki Rank: Rp 500.000
   - Total: Rp 1.000.000
3. ✅ Go to checkout
4. ✅ **Verify:**
   - Subtotal: Rp 1.000.000
   - Diskon Member (20%): - Rp 200.000
   - Total sebelum payment fee: Rp 800.000

### **Test 3: No Reseller**

1. ✅ Login sebagai user tanpa reseller
2. ✅ Add item: Robux 1000 (Rp 500.000)
3. ✅ Go to checkout
4. ✅ **Verify:**
   - Subtotal: Rp 500.000
   - Diskon Member: (tidak tampil)
   - Total = Rp 500.000 + payment fee

### **Test 4: Expired Reseller**

1. ✅ Login sebagai user dengan reseller expired
2. ✅ Verify `user.diskon = 0` (check console log atau API response)
3. ✅ Add item dan checkout
4. ✅ **Verify:**
   - Discount tidak tampil (0%)
   - Total = Subtotal + payment fee

### **Test 5: Login During Checkout**

1. ✅ Add item tanpa login (guest checkout)
2. ✅ Go to checkout - Subtotal tanpa discount
3. ✅ Login sebagai user dengan reseller
4. ✅ **Verify:**
   - useEffect trigger recalculation
   - Discount langsung tampil
   - Total updated dengan discount

### **Test 6: Payment Method Change**

1. ✅ Checkout dengan discount aktif
2. ✅ Ganti payment method (e.g., QRIS → Bank Transfer)
3. ✅ **Verify:**
   - Discount tetap sama
   - Biaya admin berubah sesuai payment method
   - Total updated correctly

---

## 💡 Key Points

### **✅ Yang Sudah Benar:**

1. **Auto-calculate** discount dari `user.diskon`
2. **Real-time recalculation** saat user berubah
3. **Display conditional** - hanya tampil jika discount > 0%
4. **Integration with payment fee** - discount applied before payment fee
5. **Console logging** untuk debugging
6. **Support all service types** (Robux, Joki, Gamepass, RBX5, Reseller)

### **📋 Data Flow:**

```
1. User login → API /auth/me
2. API check reseller status:
   - If active → fetch ResellerPackage → set user.diskon
   - If expired/none → user.diskon = 0
3. Checkout page load → read user.diskon
4. Calculate:
   - Base amount from items
   - Discount = Base × (user.diskon %)
   - Final = Base - Discount + Payment Fee
5. Display in UI dengan warna hijau
```

### **🎨 UI/UX:**

- ✅ Discount tampil dengan **warna hijau** (text-green-400)
- ✅ Format: "Diskon Member (X%): - Rp XXX.XXX"
- ✅ Conditional display (hanya jika > 0%)
- ✅ Clear separation antara discount dan payment fee

---

## 📝 Notes

- **Discount calculation** dilakukan di frontend tapi data `user.diskon` dari backend
- **Validation** di backend saat payment - webhook juga consider discount
- **Expired handling** - automatic set to 0% di Auth API
- **Multi-checkout support** - discount applied ke total semua items
- **Guest checkout** - tidak ada discount (user === null)

---

## 🚀 Conclusion

✅ **CHECKOUT PAGE SUDAH FULLY SUPPORT RESELLER DISCOUNT!**

Tidak ada yang perlu diubah. Sistem sudah:

1. ✅ Automatically calculate discount dari user.diskon
2. ✅ Display discount di UI dengan jelas
3. ✅ Apply discount sebelum payment fee
4. ✅ Recalculate saat user berubah
5. ✅ Handle expired/no reseller dengan benar

**Status:** Ready for Production ✨

---

**Last Updated:** 27 Oktober 2025  
**Verified:** Checkout page fully integrated with reseller system
