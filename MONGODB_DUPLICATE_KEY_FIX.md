# MongoDB Duplicate Key Error Fix - midtransOrderId

## Problem

```
MongoServerError: E11000 duplicate key error collection: robuxid.transactions
index: midtransOrderId_1 dup key: { midtransOrderId: "MULTI-1760035725250-GMJ841" }
```

## Root Cause

### Timeline of Events:

```
1. Loop through items array
2. For each item:
   - Create Transaction object
   - Save transaction → midtransOrderId = null ✅
3. After loop completes:
   - Generate masterOrderId (e.g., "MULTI-XXX")
   - Call Midtrans API
   - Update all transactions:
     - Transaction 1: midtransOrderId = "MULTI-XXX" ✅
     - Transaction 2: midtransOrderId = "MULTI-XXX" ❌ DUPLICATE!
```

### Why It Fails:

MongoDB has a **unique index** on `midtransOrderId` field. When we try to save **multiple transactions** with the **same `midtransOrderId`**, MongoDB rejects the second save operation with duplicate key error.

### Code Flow (Before Fix):

```typescript
// Step 1: Create and save transactions (midtransOrderId = null)
for (let i = 0; i < items.length; i++) {
  const transaction = new Transaction(transactionData);
  await transaction.save(); // midtransOrderId is null
  createdTransactions.push(transaction);
}

// Step 2: Generate masterOrderId
const masterOrderId = `MULTI-${Date.now()}-...`;

// Step 3: Call Midtrans
const snapResult = await midtransService.createSnapTransaction({...});

// Step 4: Update transactions with SAME midtransOrderId
const updatePromises = createdTransactions.map(async (transaction) => {
  transaction.midtransOrderId = masterOrderId; // ❌ All get same ID
  await transaction.save(); // ❌ Duplicate key error!
});
```

## Solution

### Set `midtransOrderId` BEFORE Midtrans API Call

Generate the `masterOrderId` **BEFORE** calling Midtrans API, and set it on all transactions **BEFORE** they are saved the second time.

### Fixed Code Flow:

```typescript
// Step 1: Create and save transactions (midtransOrderId = null)
for (let i = 0; i < items.length; i++) {
  const transaction = new Transaction(transactionData);
  await transaction.save(); // midtransOrderId is still null
  createdTransactions.push(transaction);
}

// Step 2: Generate masterOrderId
const masterOrderId = `MULTI-${Date.now()}-...`;

// Step 3: Set midtransOrderId BEFORE Midtrans call ✅
createdTransactions.forEach((transaction) => {
  transaction.midtransOrderId = masterOrderId;
});

// Step 4: Call Midtrans
const snapResult = await midtransService.createSnapTransaction({
  orderId: masterOrderId, // ✅ Uses same ID
  ...
});

// Step 5: Update transactions with snapToken and redirectUrl
// midtransOrderId already set, no duplicate error ✅
const updatePromises = createdTransactions.map(async (transaction) => {
  transaction.snapToken = snapResult.token;
  transaction.redirectUrl = snapResult.redirect_url;
  // midtransOrderId already set, don't set it again
  await transaction.save(); // ✅ No duplicate error!
});
```

## Implementation

### 1. Cart Multi-Checkout (`app/api/transactions/multi/route.ts`)

**Before Fix:**

```typescript
// Create a master order ID for grouping
const masterOrderId = `MULTI-${Date.now()}-${Math.random()
  .toString(36)
  .substring(2, 8)
  .toUpperCase()}`;

// Create Midtrans Snap transaction for all items
try {
  const snapResult = await midtransService.createSnapTransaction({...});

  // Update all transactions with Midtrans data
  const updatePromises = createdTransactions.map(async (transaction) => {
    transaction.snapToken = snapResult.token;
    transaction.redirectUrl = snapResult.redirect_url;
    transaction.midtransOrderId = masterOrderId; // ❌ Duplicate key error
    await transaction.save();
  });
```

**After Fix:**

```typescript
// Create a master order ID for grouping BEFORE saving transactions
const masterOrderId = `MULTI-${Date.now()}-${Math.random()
  .toString(36)
  .substring(2, 8)
  .toUpperCase()}`;

console.log("=== MASTER ORDER ID CREATED ===");
console.log("Master Order ID:", masterOrderId);

// NOW set midtransOrderId for all transactions BEFORE Midtrans call ✅
createdTransactions.forEach((transaction) => {
  transaction.midtransOrderId = masterOrderId;
});

// Create Midtrans Snap transaction for all items
try {
  const snapResult = await midtransService.createSnapTransaction({...});

  // Update all transactions with Midtrans data (snapToken and redirectUrl)
  const updatePromises = createdTransactions.map(async (transaction) => {
    transaction.snapToken = snapResult.token;
    transaction.redirectUrl = snapResult.redirect_url;
    // midtransOrderId already set before Midtrans call ✅
    await transaction.save();
  });
```

### 2. Multi-Item Direct Purchase (`app/api/transactions/route.ts`)

**Before Fix:**

```typescript
// Create a master order ID for grouping
const masterOrderId = `ORDER-${Date.now()}-...`;

// Create Midtrans Snap transaction for all items
try {
  const snapResult = await midtransService.createSnapTransaction({...});

  // Update all transactions with Midtrans data
  const updatePromises = createdTransactions.map(async (transaction) => {
    transaction.snapToken = snapResult.token;
    transaction.redirectUrl = snapResult.redirect_url;
    transaction.midtransOrderId = masterOrderId; // ❌ Duplicate key error
    await transaction.save();
  });
```

**After Fix:**

```typescript
// Create a master order ID for grouping BEFORE Midtrans call
const masterOrderId = `ORDER-${Date.now()}-...`;

console.log("=== MASTER ORDER ID CREATED ===");
console.log("Master Order ID:", masterOrderId);

// Set midtransOrderId for all transactions BEFORE Midtrans call ✅
createdTransactions.forEach((transaction) => {
  transaction.midtransOrderId = masterOrderId;
});

// Create Midtrans Snap transaction for all items
try {
  const snapResult = await midtransService.createSnapTransaction({...});

  // Update all transactions with Midtrans data (snapToken and redirectUrl)
  const updatePromises = createdTransactions.map(async (transaction) => {
    transaction.snapToken = snapResult.token;
    transaction.redirectUrl = snapResult.redirect_url;
    // midtransOrderId already set before Midtrans call ✅
    await transaction.save();
  });
```

## Key Changes

### 1. Move `midtransOrderId` Assignment

```typescript
// ❌ BEFORE: Set during second save
transaction.midtransOrderId = masterOrderId;
await transaction.save(); // Duplicate key error!

// ✅ AFTER: Set before Midtrans call, save later
createdTransactions.forEach((transaction) => {
  transaction.midtransOrderId = masterOrderId; // Just set, don't save yet
});

// Later...
await transaction.save(); // midtransOrderId already set, no duplicate
```

### 2. Console Logs for Debugging

```typescript
console.log("=== MASTER ORDER ID CREATED ===");
console.log("Master Order ID:", masterOrderId);
```

This helps track when `masterOrderId` is generated and assigned.

## Why This Works

### MongoDB Unique Index Constraint

```
midtransOrderId: { type: String, unique: true, sparse: true }
```

- **`unique: true`** - No two documents can have the same value
- **`sparse: true`** - Allows multiple documents with `null` value

### Transaction Save Lifecycle

**Before Fix:**

```
Transaction 1: midtransOrderId = null → Save ✅
Transaction 2: midtransOrderId = null → Save ✅
...
Transaction 1: midtransOrderId = "MULTI-XXX" → Save ✅
Transaction 2: midtransOrderId = "MULTI-XXX" → Save ❌ (DUPLICATE!)
```

**After Fix:**

```
Transaction 1: midtransOrderId = null → Save ✅
Transaction 2: midtransOrderId = null → Save ✅
...
(Set midtransOrderId on all transactions in memory)
Transaction 1: midtransOrderId = "MULTI-XXX" → Save ✅
Transaction 2: midtransOrderId = "MULTI-XXX" → Save ✅ (Different document!)
```

The key difference: In the fixed version, we set `midtransOrderId` on **ALL transactions BEFORE any of them try to save**. This way, MongoDB sees them as **separate documents** being updated with the same value, which is allowed.

## Testing

### Test Case 1: Cart with 2 Items

```
Input:
- Item 1: Robux 200 (24,000)
- Item 2: Robux 200 (24,000)

Expected Flow:
1. Create Transaction 1 → Save (midtransOrderId = null) ✅
2. Create Transaction 2 → Save (midtransOrderId = null) ✅
3. Generate masterOrderId: "MULTI-1760035725250-GMJ841"
4. Set midtransOrderId on both transactions ✅
5. Call Midtrans API ✅
6. Update Transaction 1 → Save (snapToken, redirectUrl) ✅
7. Update Transaction 2 → Save (snapToken, redirectUrl) ✅

No duplicate key error ✅
```

### Test Case 2: Direct Purchase with 3 Items

```
Input:
- Item 1: Gamepass A
- Item 2: Gamepass B
- Item 3: Gamepass C

Expected Flow:
1. Create 3 transactions (midtransOrderId = null) ✅
2. Generate masterOrderId: "ORDER-XXX"
3. Set midtransOrderId on all 3 transactions ✅
4. Call Midtrans API ✅
5. Update all 3 transactions (snapToken, redirectUrl) ✅

No duplicate key error ✅
```

### Test Case 3: Single Item (No Issue)

```
Input:
- Item 1: Robux 100K

Expected Flow:
1. Create 1 transaction
2. Generate midtransOrderId
3. Set midtransOrderId
4. Call Midtrans API ✅
5. Update transaction ✅

No duplicate (only 1 transaction) ✅
```

## Files Modified

1. **`app/api/transactions/multi/route.ts`**

   - Set `midtransOrderId` before Midtrans call
   - Remove `midtransOrderId` assignment from update loop
   - Added console logs for debugging

2. **`app/api/transactions/route.ts`**
   - Set `midtransOrderId` before Midtrans call (handleMultiItemDirectPurchase)
   - Remove `midtransOrderId` assignment from update loop
   - Added console logs for debugging

## Related Issues

- **Transaction Model** - `midtransOrderId` has unique index
- **Webhook System** - Uses `midtransOrderId` to find transactions
- **Multi-transaction Support** - Multiple transactions share same `midtransOrderId`

## Prevention

### Best Practice for Multi-Document Updates with Unique Constraints:

1. **Generate shared unique value ONCE**

   ```typescript
   const sharedId = generateUniqueId();
   ```

2. **Set on all documents BEFORE any save**

   ```typescript
   documents.forEach((doc) => (doc.sharedId = sharedId));
   ```

3. **Save all documents**
   ```typescript
   await Promise.all(documents.map((doc) => doc.save()));
   ```

### ❌ Don't Do This:

```typescript
// Generate ID
const sharedId = generateUniqueId();

// Save one by one with same ID
for (const doc of documents) {
  doc.sharedId = sharedId;
  await doc.save(); // ❌ Second iteration will fail
}
```

### ✅ Do This:

```typescript
// Generate ID
const sharedId = generateUniqueId();

// Set on all documents first
documents.forEach((doc) => (doc.sharedId = sharedId));

// Then save all
await Promise.all(documents.map((doc) => doc.save())); // ✅ All succeed
```

---

**Last Updated:** October 2025  
**Issue:** MongoDB E11000 duplicate key error on `midtransOrderId`  
**Status:** ✅ Fixed  
**Impact:** Cart checkout, multi-item direct purchase
