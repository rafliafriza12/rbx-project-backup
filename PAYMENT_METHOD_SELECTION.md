# Payment Method Selection Integration

## Overview

Sistem untuk menyaring metode pembayaran yang ditampilkan di Midtrans Snap berdasarkan pilihan user di checkout form. Sekarang user yang memilih payment method tertentu (misal: GoPay) akan langsung diarahkan ke payment page yang hanya menampilkan GoPay saja, tanpa pilihan payment method lain.

## Problem yang Dipecahkan

**Sebelumnya:**

- User memilih payment method di checkout form (misal: GoPay)
- Frontend mengirim `paymentMethod` ke API ✅
- **API menerima tapi tidak menggunakan parameter tersebut** ❌
- Midtrans menampilkan SEMUA metode pembayaran (hardcoded)
- User bingung karena harus memilih lagi di Midtrans

**Sekarang:**

- User memilih payment method di checkout form (misal: GoPay)
- Frontend mengirim `paymentMethod` ke API ✅
- **API memetakan payment method ID ke Midtrans payment codes** ✅
- **Midtrans hanya menampilkan payment method yang dipilih** ✅
- User langsung melihat payment page yang sesuai

## Architecture

### 1. Frontend (Checkout Form)

**File:** `app/checkout/page.tsx`

```typescript
const requestData = {
  items: [...],
  paymentMethod: selectedPaymentMethod, // "gopay", "bca_va", dll
  additionalNotes: additionalNotes.trim(),
  customerInfo: { name, email, phone },
  userId: user?.id,
  // ...
};

// Send to API
const response = await fetch('/api/transactions', {
  method: 'POST',
  body: JSON.stringify(requestData),
});
```

### 2. Mapping Layer (Midtrans Service)

**File:** `lib/midtrans.ts`

```typescript
static mapPaymentMethodToMidtrans(paymentMethodId: string): string[] {
  const mapping: Record<string, string[]> = {
    // E-Wallets
    "gopay": ["gopay"],
    "shopeepay": ["shopeepay"],
    "dana": ["shopeepay"], // Dana uses ShopeePay integration
    "ovo": ["other_qris"], // OVO via QRIS

    // Virtual Accounts
    "bca_va": ["bca_va"],
    "bni_va": ["bni_va"],
    "bri_va": ["bri_va"],
    "mandiri_va": ["echannel"], // Mandiri uses echannel
    "permata_va": ["permata_va"],
    "cimb_va": ["cimb_va"],

    // QRIS
    "qris": ["qris"],

    // Credit Card
    "credit_card": ["credit_card"],

    // Convenience Store
    "indomaret": ["cstore"],
    "alfamart": ["cstore"],

    // All payment methods (default fallback)
    "all": [
      "gopay", "shopeepay", "other_qris",
      "bca_va", "bni_va", "bri_va", "echannel", "permata_va", "cimb_va",
      "qris", "credit_card", "cstore"
    ],
  };

  return mapping[paymentMethodId] || mapping["all"];
}
```

### 3. API Layer (Transaction Routes)

**Files:**

- `app/api/transactions/route.ts` - Single/multi-item direct purchase
- `app/api/transactions/multi/route.ts` - Cart checkout

```typescript
// Extract payment method from request
const { paymentMethod, ...otherFields } = body;

// Map to Midtrans payment codes
const enabledPayments = paymentMethod
  ? MidtransService.mapPaymentMethodToMidtrans(paymentMethod)
  : undefined; // undefined = show all methods

console.log("Payment method:", paymentMethod);
console.log("Enabled payments for Midtrans:", enabledPayments);

// Pass to Midtrans
const snapResult = await midtransService.createSnapTransaction({
  orderId: masterOrderId,
  amount: finalAmount,
  items: midtransItems,
  customer: { ... },
  enabledPayments, // ✅ Now using selected payment method
  expiryHours: 24,
  callbackUrls: { ... },
});
```

### 4. Midtrans Integration Layer

**File:** `lib/midtrans.ts`

```typescript
async createSnapTransaction(params: {
  orderId: string;
  amount: number;
  items: MidtransItem[];
  customer: MidtransCustomer;
  enabledPayments?: string[]; // ✅ New optional parameter
  expiryHours?: number;
  callbackUrls?: { finish?: string; error?: string; pending?: string };
}): Promise<MidtransSnapResponse> {
  // ...
  const payload = {
    transaction_details: { ... },
    item_details: params.items,
    customer_details: params.customer,
    enabled_payments: params.enabledPayments || [
      // Default: all payment methods
      "gopay", "shopeepay", "other_qris",
      "bca_va", "bni_va", "bri_va", "echannel", "permata_va", "cimb_va",
      "qris", "credit_card", "cstore"
    ],
    // ...
  };
  // ...
}
```

## Payment Method Mapping Table

| Payment Method ID | Midtrans Payment Code(s) | Notes                                          |
| ----------------- | ------------------------ | ---------------------------------------------- |
| `gopay`           | `["gopay"]`              | GoPay e-wallet                                 |
| `shopeepay`       | `["shopeepay"]`          | ShopeePay e-wallet                             |
| `dana`            | `["shopeepay"]`          | Dana uses ShopeePay integration                |
| `ovo`             | `["other_qris"]`         | OVO via QRIS                                   |
| `bca_va`          | `["bca_va"]`             | BCA Virtual Account                            |
| `bni_va`          | `["bni_va"]`             | BNI Virtual Account                            |
| `bri_va`          | `["bri_va"]`             | BRI Virtual Account                            |
| `mandiri_va`      | `["echannel"]`           | Mandiri Bill Payment                           |
| `permata_va`      | `["permata_va"]`         | Permata Virtual Account                        |
| `cimb_va`         | `["cimb_va"]`            | CIMB Niaga Virtual Account                     |
| `qris`            | `["qris"]`               | QRIS (Quick Response Code Indonesian Standard) |
| `credit_card`     | `["credit_card"]`        | Credit/Debit Card                              |
| `indomaret`       | `["cstore"]`             | Indomaret Convenience Store                    |
| `alfamart`        | `["cstore"]`             | Alfamart Convenience Store                     |
| `all`             | `[all codes]`            | Show all available payment methods             |

## Special Cases

### 1. Mandiri Virtual Account → echannel

```typescript
"mandiri_va": ["echannel"]
```

Midtrans uses "echannel" sebagai payment code untuk Mandiri Bill Payment, bukan "mandiri_va".

### 2. Dana → ShopeePay

```typescript
"dana": ["shopeepay"]
```

Dana menggunakan integrasi ShopeePay di Midtrans.

### 3. OVO → QRIS

```typescript
"ovo": ["other_qris"]
```

OVO payment dilakukan via QRIS karena tidak ada direct integration.

### 4. Convenience Store (Indomaret/Alfamart)

```typescript
"indomaret": ["cstore"],
"alfamart": ["cstore"]
```

Both use the same "cstore" payment code. Midtrans akan menampilkan pilihan Indomaret dan Alfamart.

### 5. No Payment Method Selected

```typescript
enabledPayments = undefined;
// Midtrans will show all available payment methods
```

Jika user tidak memilih payment method (atau pilih "Semua Metode"), API akan pass `undefined` ke Midtrans, yang akan menampilkan semua pilihan payment.

## Testing Guide

### Test Case 1: E-Wallet Selection

```
1. Pilih service (misal: Robux 100K)
2. Pilih payment method: "GoPay"
3. Klik checkout
4. Verify di Midtrans Snap:
   ✅ Hanya menampilkan GoPay
   ❌ Tidak ada ShopeePay, QRIS, dll
```

### Test Case 2: Virtual Account Selection

```
1. Pilih service (misal: Robux 100K)
2. Pilih payment method: "BCA Virtual Account"
3. Klik checkout
4. Verify di Midtrans Snap:
   ✅ Hanya menampilkan BCA VA
   ❌ Tidak ada BNI VA, Mandiri VA, dll
```

### Test Case 3: Mandiri Special Case

```
1. Pilih service (misal: Robux 100K)
2. Pilih payment method: "Mandiri Virtual Account"
3. Klik checkout
4. Verify di Midtrans Snap:
   ✅ Menampilkan Mandiri Bill Payment
   ❌ Tidak ada VA lain

Note: Midtrans maps "echannel" to "Mandiri Bill Payment"
```

### Test Case 4: QRIS Selection

```
1. Pilih service (misal: Robux 100K)
2. Pilih payment method: "QRIS"
3. Klik checkout
4. Verify di Midtrans Snap:
   ✅ Hanya menampilkan QRIS
   ❌ Tidak ada GoPay, ShopeePay, dll
```

### Test Case 5: No Selection (All Methods)

```
1. Pilih service (misal: Robux 100K)
2. Tidak pilih payment method (atau pilih "Semua Metode")
3. Klik checkout
4. Verify di Midtrans Snap:
   ✅ Menampilkan SEMUA payment methods
   ✅ User bisa pilih sendiri di Midtrans
```

### Test Case 6: Cart Checkout with Payment Method

```
1. Add multiple items ke cart
2. Go to cart
3. Pilih payment method: "BNI Virtual Account"
4. Klik checkout
5. Verify di Midtrans Snap:
   ✅ Hanya menampilkan BNI VA
   ❌ Tidak ada VA lain
```

## Console Logs untuk Debugging

API akan log informasi berikut untuk debugging:

```
=== MIDTRANS MULTI-ITEM DEBUG ===
Items: [...]
Final Amount: 500000
Payment method: gopay
Enabled payments for Midtrans: ["gopay"]
```

```
=== CALLBACK URLs DEBUG ===
NEXT_PUBLIC_BASE_URL: https://rbxstore.com
Base URL used: https://rbxstore.com
Finish URL: https://rbxstore.com/transaction/?order_id=...
Payment method: bca_va
Enabled payments for Midtrans: ["bca_va"]
```

## Files Modified

### 1. `lib/midtrans.ts`

- Added `enabledPayments?: string[]` parameter to `createSnapTransaction()`
- Added `mapPaymentMethodToMidtrans()` static method
- Changed hardcoded enabled_payments to use parameter or fallback to all

### 2. `app/api/transactions/route.ts`

- Extract `paymentMethod` from request body (2 handlers)
- Map payment method using `MidtransService.mapPaymentMethodToMidtrans()`
- Pass `enabledPayments` to Midtrans (2 locations)

### 3. `app/api/transactions/multi/route.ts`

- Extract `paymentMethodId` from request body
- Map payment method using `MidtransService.mapPaymentMethodToMidtrans()`
- Pass `enabledPayments` to Midtrans

## Future Enhancements

### 1. Add New Payment Method

Untuk menambah payment method baru:

1. **Add to payment methods collection** (MongoDB):

   ```json
   {
     "name": "LinkAja",
     "code": "linkaja",
     "type": "ewallet",
     "active": true
   }
   ```

2. **Add to mapping** (`lib/midtrans.ts`):

   ```typescript
   "linkaja": ["linkaja"], // If supported by Midtrans
   // or
   "linkaja": ["other_qris"], // If via QRIS
   ```

3. **Test** the new payment method

### 2. Dynamic Mapping from Database

Instead of hardcoded mapping, load from database:

```typescript
static async mapPaymentMethodToMidtrans(paymentMethodId: string): Promise<string[]> {
  // Load mapping from database
  const paymentMethod = await PaymentMethod.findOne({ code: paymentMethodId });
  return paymentMethod?.midtransCodes || ["all"];
}
```

### 3. Payment Method Groups

Allow grouping payment methods:

```typescript
// User selects "Virtual Account"
// Show: BCA VA, BNI VA, BRI VA, Mandiri VA, etc.
"virtual_account_group": ["bca_va", "bni_va", "bri_va", "echannel", ...]
```

## Related Documentation

- `PAYMENT_METHOD_SYSTEM.md` - Payment method management system
- `PAYMENT_METHOD_IMPLEMENTATION_SUMMARY.md` - Implementation summary
- `CART_CHECKOUT_INTEGRATION.md` - Cart checkout flow
- `TRANSACTION_SYSTEM.md` - Transaction system overview

## Support

Untuk pertanyaan atau issues, kontak development team.

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** ✅ Implemented and Tested
