# Multi-Checkout Support Documentation

## Overview

Sistem sekarang sudah mendukung **Multi-Checkout** dimana beberapa transaksi bisa digabungkan dalam satu pembayaran (satu `midtransOrderId`).

## API Changes

### GET `/api/transactions/[id]`

Endpoint ini sekarang mengembalikan data tambahan untuk multi-checkout:

```typescript
{
  success: true,
  data: {
    // ... transaction fields ...
    relatedTransactions: Transaction[], // Transaksi lain dengan midtransOrderId yang sama
    isMultiCheckout: boolean // true jika ada related transactions
  }
}
```

## Frontend Updates Needed

### 1. Track Order Page (`/track-order`)

- ✅ Deteksi multi-checkout
- ✅ Tampilkan semua items dalam satu grup
- ✅ Show combined total payment
- ✅ Individual item details

### 2. Riwayat Transaksi Page (`/riwayat`)

- ⏳ Group transactions by midtransOrderId
- ⏳ Show as single card for multi-checkout
- ⏳ Expandable to see individual items

### 3. Detail Riwayat Page (`/riwayat/[id]`)

- ⏳ Similar to track order
- ⏳ Show all grouped transactions
- ⏳ Payment summary for all items

## Implementation Notes

### Detecting Multi-Checkout

```typescript
const isMultiCheckout =
  transaction.isMultiCheckout ||
  (transaction.relatedTransactions &&
    transaction.relatedTransactions.length > 0);
```

### Calculating Total

```typescript
const allTransactions = [
  transaction,
  ...(transaction.relatedTransactions || []),
];
const grandTotal = allTransactions.reduce(
  (sum, t) => sum + (t.finalAmount || t.totalAmount),
  0
);
```

### Displaying Items

- Show main transaction first
- Show related transactions in a collapsible section
- Each item should show: serviceName, quantity, unitPrice, totalAmount
- Payment details should be shared (same snapToken, redirectUrl, etc.)

## Status Handling

- Payment status is shared across all transactions (same midtransOrderId)
- Order status is individual per transaction (different items may have different processing status)
