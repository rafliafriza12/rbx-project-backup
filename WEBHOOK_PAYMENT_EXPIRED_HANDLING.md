# Webhook Payment Expired Handling

## 📋 Overview

Update webhook Midtrans untuk otomatis mengubah status order menjadi **"cancelled"** ketika payment status expired, cancelled, atau denied.

## ✅ Perubahan yang Dilakukan

### File: `/app/api/transactions/webhook/route.ts`

#### 1. **Handle Payment Expired** ⏰

```typescript
if (
  transaction_status === "expire" &&
  statusMapping.paymentStatus === "expired"
) {
  console.log(
    `⏰ Payment expired for transaction ${transaction.invoiceId}, cancelling order...`
  );
  await transaction.updateStatus(
    "order",
    "cancelled",
    `Pesanan dibatalkan karena pembayaran sudah kadaluarsa (expired)`,
    null
  );
}
```

**Behavior:**

- Ketika Midtrans mengirim status `expire`
- Payment status akan menjadi `"expired"`
- Order status akan **otomatis di-set ke `"cancelled"`**
- Pesan: "Pesanan dibatalkan karena pembayaran sudah kadaluarsa (expired)"

#### 2. **Handle Payment Cancelled/Denied** ❌

```typescript
else if (
  (transaction_status === "cancel" || transaction_status === "deny") &&
  statusMapping.paymentStatus === "cancelled"
) {
  console.log(
    `❌ Payment ${transaction_status} for transaction ${transaction.invoiceId}, cancelling order...`
  );
  await transaction.updateStatus(
    "order",
    "cancelled",
    `Pesanan dibatalkan karena pembayaran ${
      transaction_status === "cancel" ? "dibatalkan" : "ditolak"
    }`,
    null
  );
}
```

**Behavior:**

- Ketika Midtrans mengirim status `cancel` atau `deny`
- Payment status akan menjadi `"cancelled"`
- Order status akan **otomatis di-set ke `"cancelled"`**
- Pesan dinamis:
  - Status `cancel`: "Pesanan dibatalkan karena pembayaran dibatalkan"
  - Status `deny`: "Pesanan dibatalkan karena pembayaran ditolak"

## 🔄 Flow Diagram

### Payment Expired Flow:

```
Midtrans Webhook (transaction_status: "expire")
    ↓
Payment Status: "expired"
    ↓
Order Status: "cancelled" ✅
    ↓
Status History Updated
    ↓
User/Admin notified
```

### Payment Cancelled/Denied Flow:

```
Midtrans Webhook (transaction_status: "cancel" | "deny")
    ↓
Payment Status: "cancelled"
    ↓
Order Status: "cancelled" ✅
    ↓
Status History Updated
    ↓
User/Admin notified
```

## 📊 Status Mapping Reference

### Midtrans Status → Internal Status

| Midtrans Status | Payment Status | Order Status      | Action           |
| --------------- | -------------- | ----------------- | ---------------- |
| `expire`        | `expired`      | `cancelled`       | ✅ Auto-cancel   |
| `cancel`        | `cancelled`    | `cancelled`       | ✅ Auto-cancel   |
| `deny`          | `cancelled`    | `cancelled`       | ✅ Auto-cancel   |
| `settlement`    | `settlement`   | `processing`      | ✅ Process order |
| `pending`       | `pending`      | `waiting_payment` | ⏳ Wait payment  |
| `failure`       | `failed`       | `failed`          | ❌ Failed        |

## 🧪 Testing

### Test Case 1: Payment Expired

**Steps:**

1. Create order dengan payment method
2. Tunggu hingga payment expired (biasanya 24 jam)
3. Midtrans akan kirim webhook dengan `transaction_status: "expire"`
4. **Expected:** Order status berubah dari `waiting_payment` → `cancelled`

### Test Case 2: Payment Cancelled by User

**Steps:**

1. Create order dengan payment method
2. User cancel payment di Midtrans
3. Midtrans kirim webhook dengan `transaction_status: "cancel"`
4. **Expected:** Order status berubah menjadi `cancelled`

### Test Case 3: Payment Denied

**Steps:**

1. Create order dengan payment method
2. Payment ditolak (fraud detection, insufficient funds, etc.)
3. Midtrans kirim webhook dengan `transaction_status: "deny"`
4. **Expected:** Order status berubah menjadi `cancelled`

## 📝 Console Logs

### Expired Payment:

```
⏰ Payment expired for transaction INV-1234567890, cancelling order...
Order status updated: waiting_payment → cancelled
Status history: Pesanan dibatalkan karena pembayaran sudah kadaluarsa (expired)
```

### Cancelled Payment:

```
❌ Payment cancel for transaction INV-1234567890, cancelling order...
Order status updated: waiting_payment → cancelled
Status history: Pesanan dibatalkan karena pembayaran dibatalkan
```

### Denied Payment:

```
❌ Payment deny for transaction INV-1234567890, cancelling order...
Order status updated: waiting_payment → cancelled
Status history: Pesanan dibatalkan karena pembayaran ditolak
```

## 🔒 Security & Validation

1. **Signature Verification** ✅

   - Webhook signature sudah diverifikasi sebelum processing
   - Mencegah fake webhook requests

2. **Transaction Validation** ✅

   - Check transaction exists di database
   - Validate order_id matching

3. **Status Transition Control** ✅
   - Only allowed status transitions are processed
   - Prevents invalid status changes

## 📌 Important Notes

1. **Multi-Transaction Support**: Logic ini berlaku untuk **semua transactions** dalam satu order (multi-item checkout)

2. **Idempotency**: Webhook bisa dipanggil multiple times dengan status yang sama, logic sudah handle ini dengan proper status checking

3. **Status History**: Setiap perubahan status dicatat di `statusHistory` dengan timestamp dan notes

4. **No Rollback for Expired**: Jika payment sudah expired dan order cancelled, user harus create new order

5. **Email Notification**: Untuk implementasi lengkap, pertimbangkan mengirim email notification ketika order cancelled karena payment expired

## 🎯 Next Steps (Optional Improvements)

1. **Email Notification**: Kirim email ke customer ketika order cancelled karena expired
2. **Stock Restore**: Jika ada stock reservation, restore stock ketika order cancelled
3. **Analytics**: Track expired payment rate untuk business insights
4. **Reminder Email**: Kirim reminder sebelum payment expired (e.g., 1 hour before)
5. **Retry Option**: Provide easy way untuk customer re-order jika expired

## 🔗 Related Files

- `/app/api/transactions/webhook/route.ts` - Main webhook handler
- `/lib/midtrans.ts` - Midtrans service with status mapping
- `/models/Transaction.ts` - Transaction model with updateStatus method

---

**Created:** November 20, 2025
**Status:** ✅ Implemented & Ready for Testing
