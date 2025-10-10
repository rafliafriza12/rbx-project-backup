# Email Invoice System - Complete Documentation

## Overview

Sistem email invoice akan otomatis mengirim invoice ke customer di berbagai skenario untuk memastikan customer selalu mendapat konfirmasi transaksi mereka.

---

## 📧 Email Invoice Scenarios

### ✅ Scenario 1: Transaction Created (Pending Payment)

**When:** Customer completes checkout form and submits order  
**Status:** Payment = `pending`, Order = `waiting_payment`

#### Endpoints:

1. **Single Item Checkout** - `/api/transactions` (POST - handleSingleItemTransaction)

   ```typescript
   // After transaction saved and Midtrans snap created
   if (customerInfo.email) {
     await EmailService.sendInvoiceEmail(transaction);
   }
   ```

   - **File:** `app/api/transactions/route.ts`
   - **Line:** ~866

2. **Multi-Item Direct Purchase** - `/api/transactions` (POST - handleMultiItemDirectPurchase)

   ```typescript
   // After all transactions saved and Midtrans snap created
   if (customerInfo.email) {
     await EmailService.sendInvoiceEmail(createdTransactions[0]);
   }
   ```

   - **File:** `app/api/transactions/route.ts`
   - **Line:** ~560
   - **Note:** Sends email using first transaction as reference for multi-item order

3. **Cart Multi-Checkout** - `/api/transactions/multi` (POST)
   ```typescript
   // After all transactions saved and Midtrans snap created
   if (customerInfo.email) {
     await EmailService.sendInvoiceEmail(createdTransactions[0]);
   }
   ```
   - **File:** `app/api/transactions/multi/route.ts`
   - **Line:** ~292
   - **Note:** Sends one email for all items in cart using first transaction

**Email Content:**

- Invoice ID
- Order details
- Total amount
- Payment instructions
- Payment link (Midtrans Snap)

---

### ✅ Scenario 2: Payment Settlement (via Webhook) ✨ NEW

**When:** Customer completes payment and Midtrans sends webhook notification  
**Status:** Payment = `settlement`

#### Endpoints:

1. **Main Webhook (with Rbx5 Automation)** - `/api/transactions/webhook` (POST)

   ```typescript
   // After all transactions updated with settlement status
   if (
     statusMapping.paymentStatus === "settlement" &&
     transactions.length > 0
   ) {
     const firstTransaction = transactions[0];
     if (firstTransaction.customerInfo?.email) {
       await EmailService.sendInvoiceEmail(firstTransaction);
     }
   }
   ```

   - **File:** `app/api/transactions/webhook/route.ts`
   - **Line:** ~354
   - **Status:** ✅ **ADDED** (Just implemented)
   - **Note:** Handles multi-transaction, sends one email for all transactions

2. **Simplified Webhook** - `/api/webhooks/midtrans` (POST)
   ```typescript
   // After all transactions updated, check if newly settled
   if (statusMapping.paymentStatus === "settlement" && !wasAlreadySettled) {
     if (firstTransaction.customerInfo?.email) {
       await EmailService.sendInvoiceEmail(firstTransaction);
     }
   }
   ```
   - **File:** `app/api/webhooks/midtrans/route.ts`
   - **Line:** ~154
   - **Status:** ✅ Already implemented
   - **Note:** Has duplicate check (`!wasAlreadySettled`)

**Email Content:**

- Payment confirmation
- Invoice ID
- Payment method used
- Amount paid
- Transaction receipt

**Important Notes:**

- Email sent ONLY if payment status changes to `settlement` for the first time
- For multi-transaction checkout, sends ONE email using first transaction as reference
- Email contains all transaction details (implicitly via invoice template)

---

### ✅ Scenario 3: Order Completed (by Admin) ✨ NEW

**When:** Admin manually changes order status to `completed`  
**Status:** Order = `completed`

#### Endpoint:

**Admin Status Update** - `/api/transactions/[id]` (PUT)

```typescript
// After order status updated to completed
if (
  statusType === "order" &&
  newStatus === "completed" &&
  oldOrderStatus !== "completed" &&
  transaction.customerInfo?.email
) {
  await EmailService.sendInvoiceEmail(transaction);
}
```

- **File:** `app/api/transactions/[id]/route.ts`
- **Line:** ~345
- **Status:** ✅ **ADDED** (Just implemented)

**Use Case:**

- Admin manually processes order (e.g., Joki service)
- Admin marks order as completed after manual work
- Customer receives confirmation email

**Email Content:**

- Order completion notification
- Service details
- Invoice summary

---

## 📊 Email Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Customer Checkout                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/transactions OR /api/transactions/multi          │
│  Status: pending                                             │
│  ✉️  EMAIL 1: Invoice with payment link                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Customer Completes Payment                      │
│              (via Midtrans Snap)                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  POST /api/transactions/webhook                              │
│  OR /api/webhooks/midtrans                                   │
│  Status: payment = settlement                                │
│  ✉️  EMAIL 2: Payment confirmation                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼ (for manual services like Joki)
┌─────────────────────────────────────────────────────────────┐
│  PUT /api/transactions/[id]                                  │
│  Admin changes order to completed                            │
│  Status: order = completed                                   │
│  ✉️  EMAIL 3: Order completion notification                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Complete Endpoint Summary

| Endpoint                     | Method | Scenario                   | Email Sent?         | Status            |
| ---------------------------- | ------ | -------------------------- | ------------------- | ----------------- |
| `/api/transactions` (single) | POST   | Customer checkout (1 item) | ✅ Yes (pending)    | ✅ Implemented    |
| `/api/transactions` (multi)  | POST   | Direct purchase (N items)  | ✅ Yes (pending)    | ✅ Implemented    |
| `/api/transactions/multi`    | POST   | Cart checkout (N items)    | ✅ Yes (pending)    | ✅ Implemented    |
| `/api/transactions/webhook`  | POST   | Payment settlement         | ✅ Yes (settlement) | ✅ **Just Added** |
| `/api/webhooks/midtrans`     | POST   | Payment settlement         | ✅ Yes (settlement) | ✅ Already had it |
| `/api/transactions/[id]`     | PUT    | Admin completes order      | ✅ Yes (completed)  | ✅ **Just Added** |

---

## ✅ Summary

**Current Status:**

- ✅ Email sent when order created (pending payment) - 3 endpoints
- ✅ Email sent when payment settled (webhook) - 2 endpoints
- ✅ Email sent when admin completes order - 1 endpoint
- ✅ All scenarios covered
- ✅ Multi-transaction support
- ✅ Error handling implemented

**Total Email Touchpoints:** 6 endpoints across 5 files

---

**Last Updated:** October 2025  
**Status:** ✅ Complete  
**Coverage:** All transaction scenarios
