# Payment Method Testing Guide

## Quick Test untuk Semua Services

### Cara Test

1. Buka halaman checkout dengan service tertentu
2. Pilih payment method spesifik (e.g., GoPay)
3. Submit checkout
4. **VERIFY**: Di halaman Midtrans hanya muncul payment method yang dipilih
5. Check browser console untuk log debug

### Expected Behavior

Jika user pilih **GoPay**, di Midtrans **HANYA** muncul GoPay, tidak ada Shopeepay, BCA VA, dll.

---

## Test Cases

### 1. Single Robux Instant + GoPay

**Service**: Robux Instant (single item)  
**Payment Method**: GoPay  
**API Endpoint**: `/api/transactions`  
**Expected Midtrans**: Only GoPay  
**Status**: ✅ FIXED

**Console Logs**:

```
Payment method ID: gopay
Enabled payments for Midtrans: ["gopay"]
```

---

### 2. Single Rbx 5 Hari + BCA VA

**Service**: Rbx 5 Hari (single item)  
**Payment Method**: BCA Virtual Account  
**API Endpoint**: `/api/transactions`  
**Expected Midtrans**: Only BCA VA  
**Status**: ✅ FIXED

**Console Logs**:

```
Payment method ID: bca_va
Enabled payments for Midtrans: ["bca_va"]
```

---

### 3. Single Gamepass + Mandiri VA

**Service**: Gamepass (single item)  
**Payment Method**: Mandiri Virtual Account  
**API Endpoint**: `/api/transactions`  
**Expected Midtrans**: Only Mandiri VA  
**Status**: ✅ FIXED

**Console Logs**:

```
Payment method ID: mandiri_va
Enabled payments for Midtrans: ["echannel"]
```

---

### 4. Single Joki + QRIS

**Service**: Joki (single item)  
**Payment Method**: QRIS  
**API Endpoint**: `/api/transactions`  
**Expected Midtrans**: Only QRIS  
**Status**: ✅ FIXED

**Console Logs**:

```
Payment method ID: qris
Enabled payments for Midtrans: ["qris"]
```

---

### 5. Multi Robux + ShopeePay

**Service**: Multiple Robux items from cart  
**Payment Method**: ShopeePay  
**API Endpoint**: `/api/transactions/multi`  
**Expected Midtrans**: Only ShopeePay  
**Status**: ✅ Already Working

**Console Logs**:

```
Payment method ID: shopeepay
Enabled payments for Midtrans: ["shopeepay"]
```

---

### 6. Multi Gamepass + Credit Card

**Service**: Multiple Gamepass items from cart  
**Payment Method**: Credit Card  
**API Endpoint**: `/api/transactions/multi`  
**Expected Midtrans**: Only Credit Card  
**Status**: ✅ Already Working

**Console Logs**:

```
Payment method ID: credit_card
Enabled payments for Midtrans: ["credit_card"]
```

---

### 7. Mixed Cart + BNI VA

**Service**: Mixed items (Robux + Gamepass) from cart  
**Payment Method**: BNI Virtual Account  
**API Endpoint**: `/api/transactions/multi`  
**Expected Midtrans**: Only BNI VA  
**Status**: ✅ Already Working

**Console Logs**:

```
Payment method ID: bni_va
Enabled payments for Midtrans: ["bni_va"]
```

---

## All Payment Methods to Test

### E-Wallet

- ✅ GoPay (`gopay`)
- ✅ ShopeePay (`shopeepay`)
- ✅ QRIS (`qris`)

### Virtual Account

- ✅ BCA VA (`bca_va`)
- ✅ BNI VA (`bni_va`)
- ✅ BRI VA (`bri_va`)
- ✅ Permata VA (`permata_va`)
- ✅ Mandiri VA (`mandiri_va` → `echannel`)
- ✅ CIMB Niaga VA (`cimb_va`)

### Retail

- ✅ Indomaret (`indomaret` → `cstore`)
- ✅ Alfamart (`alfamart` → `cstore`)

### Credit Card

- ✅ Credit Card (`credit_card`)

### Bank Transfer

- ✅ Bank Transfer (`bank_transfer` → multiple VAs)

---

## Debug Commands

### Check API Logs

Open browser DevTools Console dan cari:

```
=== SUBMITTING TRANSACTION DEBUG ===
Payment method ID: gopay
Enabled payments for Midtrans: ["gopay"]
```

### Check Network Tab

1. Open DevTools → Network
2. Filter: `/api/transactions`
3. Check Request Payload:
   ```json
   {
     "paymentMethodId": "gopay",
     "finalAmount": 15000,
     ...
   }
   ```

### Check Midtrans Response

Di Network Tab, cari response dari `/api/transactions`:

```json
{
  "success": true,
  "transaction": {
    "snapToken": "...",
    "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/..."
  }
}
```

---

## Troubleshooting

### Issue: Masih muncul semua payment methods

**Cause**: Frontend tidak mengirim `paymentMethodId`  
**Solution**: Check `app/checkout/page.tsx` line 747 & 776

### Issue: Payment method ID tidak valid

**Cause**: Payment method ID tidak ada di mapping  
**Solution**: Tambahkan mapping di `lib/midtrans.ts`

### Issue: `enabledPayments` undefined

**Cause**: Parameter extraction salah  
**Solution**: Verify API route extracts `paymentMethodId` correctly

---

## Before & After Fix

### BEFORE (Broken)

```typescript
// API extracts wrong parameter
const { paymentMethod } = body; // ❌ undefined

// enabledPayments is undefined
const enabledPayments = paymentMethod
  ? MidtransService.mapPaymentMethodToMidtrans(paymentMethod)
  : undefined; // ❌ undefined

// Midtrans shows ALL payment methods ❌
```

### AFTER (Fixed)

```typescript
// API extracts correct parameter
const { paymentMethodId } = body; // ✅ "gopay"
const paymentMethod = paymentMethodId;

// enabledPayments correctly mapped
const enabledPayments = paymentMethod
  ? MidtransService.mapPaymentMethodToMidtrans(paymentMethod)
  : undefined; // ✅ ["gopay"]

// Midtrans shows ONLY selected payment method ✅
```

---

## Success Criteria

✅ **Single Checkout**: User pilih GoPay → Midtrans hanya tampilkan GoPay  
✅ **Multi Checkout**: User pilih BCA VA → Midtrans hanya tampilkan BCA VA  
✅ **All Services**: Robux, Gamepass, Joki semuanya filter payment methods dengan benar  
✅ **Console Logs**: Menampilkan payment method ID dan enabled payments yang benar

---

## Final Verification Steps

1. Test minimal 3 payment methods berbeda:

   - E-Wallet (GoPay/ShopeePay)
   - Virtual Account (BCA/BNI/Mandiri)
   - Retail/QRIS

2. Test dengan 2 service types berbeda:

   - Single item (Robux Instant)
   - Multi items (Cart checkout)

3. Verify di Midtrans:

   - ✅ Hanya payment method yang dipilih muncul
   - ❌ Tidak ada payment method lain yang tampil

4. Check logs:
   - Browser console ada log payment method
   - Server logs (terminal) ada log enabled payments

---

## Contact for Issues

Jika masih ada masalah setelah fix ini:

1. Screenshot halaman Midtrans (show all visible payment methods)
2. Copy console logs (payment method ID & enabled payments)
3. Note: Service type apa yang bermasalah (Robux/Gamepass/Joki)
