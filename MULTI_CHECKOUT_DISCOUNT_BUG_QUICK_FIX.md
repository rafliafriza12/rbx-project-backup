# 🐛 Multi-Checkout Discount Bug - Quick Summary

## Problem

Multi-checkout **kadang tidak menyimpan discount** ke database:

- ❌ Transaction dengan discount = 0
- ✅ Transaction dengan discount tersimpan

## Root Cause

**`calculateDiscount()` hanya dipanggil 1x saat checkout page load**

**Scenario Bug:**

```
1. User belum login
2. Add items ke cart
3. Klik "Checkout"
4. Checkout page load → calculateDiscount() → discount = 0 (no user)
5. User LOGIN di checkout page
6. calculateDiscount() TIDAK dipanggil lagi ❌
7. Submit → kirim discount = 0 ke API ❌
```

## Solution ✅

**Added useEffect di checkout page:**

```typescript
useEffect(() => {
  if (checkoutData && checkoutData.items && checkoutData.items.length > 0) {
    // Recalculate base amount
    const baseAmount = checkoutData.items.reduce((sum: number, item: any) => {
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
}, [user]); // ← Trigger when user login/logout
```

## How It Works

```
Checkout page load (no user) → discount = 0
   ↓
User LOGIN → useEffect triggered ✅
   ↓
Recalculate discount → discount = 5% ✅
   ↓
Update checkoutData ✅
   ↓
Submit → send correct discount to API ✅
```

## Result

- ✅ Discount selalu up-to-date dengan user state
- ✅ Multi-checkout dapat discount member
- ✅ Discount tersimpan di database dengan benar

## Files Modified

- `/app/checkout/page.tsx` (added ~30 lines)

## Status

✅ **IMPLEMENTED** - October 14, 2025
