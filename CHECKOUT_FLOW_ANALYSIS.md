# Checkout Flow & Endpoint Usage - Complete Analysis

## 🎯 Checkout Flows

### Flow 1: Direct Checkout (dari Product Detail Page)

```
User di Product Page
  → Klik "Beli Sekarang"
  → Data disimpan ke sessionStorage
  → Redirect ke /checkout
  → Checkout page load data dari sessionStorage
  → User isi form (username, email, etc.)
  → Submit checkout
  → Frontend check: items.length > 1?
     ├─ YES (multiple items) → POST /api/transactions/multi
     └─ NO (single item) → POST /api/transactions
```

### Flow 2: Cart Checkout

```
User di Cart Page
  → Select items untuk checkout
  → Klik "Checkout"
  → Data disimpan ke sessionStorage
  → Redirect ke /checkout
  → Checkout page load data dari sessionStorage
  → User isi form (username, email, etc.)
  → Submit checkout
  → Frontend check: items.length > 1?
     ├─ YES (multiple items) → POST /api/transactions/multi
     └─ NO (single item) → POST /api/transactions
```

**KEY INSIGHT:** Cart dan Direct Checkout menggunakan **SAME** `/checkout` page dan **SAME** logic untuk memilih endpoint!

---

## 📋 Endpoint Routing Logic

### Frontend Logic (`app/checkout/page.tsx`)

```typescript
// Line 732-734
const isMultiTransaction = itemsWithCredentials.length > 1;
const apiEndpoint = isMultiTransaction
  ? "/api/transactions/multi"
  : "/api/transactions";
```

**Decision Tree:**

```
if (items.length > 1) {
  endpoint = "/api/transactions/multi"
} else {
  endpoint = "/api/transactions"
}
```

---

## 🔀 Endpoint Responsibilities

### 1. `/api/transactions` (POST)

**File:** `app/api/transactions/route.ts`

**Handles:**

- ✅ Single item checkout (1 item)
- ✅ Multiple items direct purchase (N items) - via handleMultiItemDirectPurchase()

**Logic:**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Check if items array exists (multi-item direct purchase)
  if (body.items && Array.isArray(body.items)) {
    return handleMultiItemDirectPurchase(body);
  }

  // Otherwise, single item transaction
  return handleSingleItemTransaction(body);
}
```

**2 Handlers:**

#### Handler A: `handleSingleItemTransaction()`

- **Input:** Single item object (not array)
- **Creates:** 1 transaction
- **Midtrans Order ID:** `ORDER-{invoiceId}-{timestamp}`
- **Email:** ✅ Sent after creation

#### Handler B: `handleMultiItemDirectPurchase()`

- **Input:** Array of items
- **Creates:** N transactions (1 per item)
- **Midtrans Order ID:** `ORDER-{timestamp}-{random}` (shared by all)
- **Email:** ✅ Sent once using first transaction

---

### 2. `/api/transactions/multi` (POST)

**File:** `app/api/transactions/multi/route.ts`

**Handles:**

- ✅ Cart multi-checkout ONLY
- ✅ Multiple items from cart

**Logic:**

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { items, customerInfo, ... } = body;

  // Always expects items array
  // Creates N transactions (1 per item)
  // Groups them with masterOrderId
}
```

**Creates:** N transactions (1 per item)  
**Midtrans Order ID:** `MULTI-{timestamp}-{random}` (shared by all)  
**Email:** ✅ Sent once using first transaction

---

## 🤔 Confusion Point: Why 2 Endpoints for Multi-Item?

### Scenario 1: Direct Purchase Multiple Items

**Example:** User buys 3 gamepasses directly from product detail page

**Flow:**

```
Product Detail Page
  → Add 3 gamepasses to checkout
  → Redirect to /checkout
  → items.length = 3 → isMultiTransaction = true
  → POST /api/transactions/multi ✅
```

**Endpoint:** `/api/transactions/multi`

---

### Scenario 2: Cart Multiple Items

**Example:** User adds 2 robux items to cart, then checkout

**Flow:**

```
Cart Page
  → Select 2 items
  → Checkout
  → Redirect to /checkout
  → items.length = 2 → isMultiTransaction = true
  → POST /api/transactions/multi ✅
```

**Endpoint:** `/api/transactions/multi`

---

### Scenario 3: Single Item (Cart or Direct)

**Example:** User buys 1 robux from product page OR checkout 1 item from cart

**Flow:**

```
Product/Cart Page
  → 1 item
  → Redirect to /checkout
  → items.length = 1 → isMultiTransaction = false
  → POST /api/transactions ✅
```

**Endpoint:** `/api/transactions` (single handler)

---

## ❌ The handleMultiItemDirectPurchase() Confusion

### Current Code in `/api/transactions/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Check if items array exists
  if (body.items && Array.isArray(body.items)) {
    return handleMultiItemDirectPurchase(body); // ⚠️ This exists
  }

  return handleSingleItemTransaction(body);
}
```

### Question: When is `handleMultiItemDirectPurchase()` called?

**Answer:** **NEVER!** (in current frontend implementation)

**Why?**
Frontend logic checks `items.length > 1` and routes to `/api/transactions/multi` directly. It **never sends array of items** to `/api/transactions`.

**Frontend sends to `/api/transactions`:**

```typescript
// Single item format (NOT array)
{
  serviceType: "robux",
  serviceId: "...",
  quantity: 1,
  // ... single item fields
}
```

**Frontend sends to `/api/transactions/multi`:**

```typescript
// Multi-item format (array)
{
  items: [
    { serviceType: "robux", ... },
    { serviceType: "gamepass", ... }
  ],
  // ... other fields
}
```

---

## 🔧 Current State Analysis

### Endpoints Actually Used:

| Scenario                  | Items | Frontend Routes To        | Backend Handler                 |
| ------------------------- | ----- | ------------------------- | ------------------------------- |
| Direct purchase (1 item)  | 1     | `/api/transactions`       | `handleSingleItemTransaction()` |
| Direct purchase (N items) | N     | `/api/transactions/multi` | Main handler in multi/route.ts  |
| Cart checkout (1 item)    | 1     | `/api/transactions`       | `handleSingleItemTransaction()` |
| Cart checkout (N items)   | N     | `/api/transactions/multi` | Main handler in multi/route.ts  |

### Endpoints NOT Actually Used:

- ❌ `handleMultiItemDirectPurchase()` in `/api/transactions/route.ts`
  - Reason: Frontend never sends `items` array to `/api/transactions`
  - Frontend always routes multi-item to `/api/transactions/multi`

---

## ✅ Email Invoice Coverage (After Our Changes)

### 1. `/api/transactions` - Single Item

- **Handler:** `handleSingleItemTransaction()`
- **Email:** ✅ Sent (line ~866)
- **Status:** ✅ Correct

### 2. `/api/transactions/multi` - Multi Item

- **Handler:** Main POST handler
- **Email:** ✅ Sent (line ~292)
- **Status:** ✅ Correct

### 3. `/api/transactions` - Multi Item (handleMultiItemDirectPurchase)

- **Handler:** `handleMultiItemDirectPurchase()`
- **Email:** ✅ Sent (line ~560)
- **Status:** ⚠️ **Has email BUT never called by frontend**

### 4. `/api/transactions/webhook`

- **Email:** ✅ Added (line ~354)
- **Status:** ✅ Correct

### 5. `/api/webhooks/midtrans`

- **Email:** ✅ Already had (line ~154)
- **Status:** ✅ Correct

### 6. `/api/transactions/[id]` - Admin Complete

- **Email:** ✅ Added (line ~345)
- **Status:** ✅ Correct

---

## 🎯 Recommendation

### Option 1: Keep Current Implementation (Recommended)

**Reasoning:**

- `handleMultiItemDirectPurchase()` is a **safety fallback**
- If frontend changes in future to send array to `/api/transactions`, it will work
- Having email in unused handler doesn't hurt
- **Action:** No changes needed ✅

### Option 2: Remove Unused Handler

**Reasoning:**

- Clean up dead code
- Simplify maintenance
- **Action:** Remove `handleMultiItemDirectPurchase()` from `/api/transactions/route.ts`
- **Risk:** If someone accidentally sends array format, will break

### Option 3: Consolidate Endpoints

**Reasoning:**

- Have one smart endpoint that handles both single and multi
- **Action:** Merge `/api/transactions/multi` into `/api/transactions`
- **Risk:** Large refactor, might break existing code

---

## 📊 Final Endpoint Mapping

```
┌─────────────────────────────────────────────────────────┐
│                    Checkout Page                         │
│                  (Unified Entry Point)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │ Check: items.length │
           └─────────┬───────────┘
                     │
        ┌────────────┴─────────────┐
        │                          │
        ▼                          ▼
  items.length = 1           items.length > 1
        │                          │
        ▼                          ▼
┌──────────────────┐      ┌──────────────────────┐
│ POST /api/       │      │ POST /api/           │
│ transactions     │      │ transactions/multi   │
│                  │      │                      │
│ Creates:         │      │ Creates:             │
│ • 1 transaction  │      │ • N transactions     │
│ • 1 Midtrans     │      │ • 1 Midtrans         │
│                  │      │ • 1 masterOrderId    │
│ Email: ✅ Sent   │      │ Email: ✅ Sent       │
└──────────────────┘      └──────────────────────┘
        │                          │
        └────────────┬─────────────┘
                     ▼
           ┌─────────────────────┐
           │  Midtrans Payment   │
           └─────────┬───────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │ Webhook Triggered   │
           │ Email: ✅ Sent      │
           └─────────┬───────────┘
                     │
                     ▼
           ┌─────────────────────┐
           │ Admin Completes     │
           │ Email: ✅ Sent      │
           └─────────────────────┘
```

---

## ✅ Conclusion

**Current Implementation:**

1. ✅ Single item checkout → `/api/transactions` → `handleSingleItemTransaction()`
2. ✅ Multi-item checkout → `/api/transactions/multi` → Main handler
3. ⚠️ `handleMultiItemDirectPurchase()` exists but **never called** by frontend
4. ✅ All active endpoints have email sending implemented
5. ✅ All webhooks have email sending implemented
6. ✅ Admin status update has email sending implemented

**Email Invoice Coverage:** **100% of actually used endpoints** ✅

**Unused Handler:** `handleMultiItemDirectPurchase()` has email but never called (safe to keep as fallback)

---

**Last Updated:** October 2025  
**Status:** ✅ Verified Complete  
**Active Endpoints:** 2 checkout + 2 webhooks + 1 admin = 5 total
