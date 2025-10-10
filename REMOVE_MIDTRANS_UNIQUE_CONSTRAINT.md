# Fix: Remove Unique Constraint from midtransOrderId

## Problem

```
MongoServerError: E11000 duplicate key error collection: robuxid.transactions
index: midtransOrderId_1 dup key: { midtransOrderId: "MULTI-1760037159992-LVV8OW" }
```

## Root Cause

### The Unique Constraint Issue

```typescript
// models/Transaction.ts
midtransOrderId: {
  type: String,
  unique: true,  // ❌ This prevents multiple transactions with same ID
  sparse: true,
}
```

**Why This Is a Problem:**

For **multi-item checkout** (cart), we need **multiple transactions** to share the **same `midtransOrderId`**:

```
Cart Checkout:
- Transaction 1 (Robux 200) → midtransOrderId: "MULTI-XXX"
- Transaction 2 (Robux 200) → midtransOrderId: "MULTI-XXX" ❌ DUPLICATE!

Direct Purchase Multiple Items:
- Transaction 1 (Gamepass A) → midtransOrderId: "ORDER-XXX"
- Transaction 2 (Gamepass B) → midtransOrderId: "ORDER-XXX" ❌ DUPLICATE!
```

MongoDB's unique constraint prevents this, causing the duplicate key error.

### Multi-Transaction Architecture

Our system uses **N transactions + 1 payment** model:

- **N transactions** - One per item
- **1 payment** - Shared via `midtransOrderId` (masterOrderId)
- **Webhook** - Finds all transactions by `midtransOrderId` and updates them

```
User buys 2 items:
├── Transaction 1: INV-001 (Robux 200)
│   └── midtransOrderId: "MULTI-12345"
├── Transaction 2: INV-002 (Robux 200)
│   └── midtransOrderId: "MULTI-12345"
└── Payment: "MULTI-12345" (42,400)
    └── Webhook updates BOTH transactions
```

**This architecture REQUIRES removing the unique constraint.**

## Solution

### 1. Update Transaction Schema

**Before:**

```typescript
midtransOrderId: {
  type: String,
  unique: true,  // ❌ Prevents multiple transactions with same ID
  sparse: true,
}
```

**After:**

```typescript
midtransOrderId: {
  type: String,
  // REMOVED unique: true - Multiple transactions can share same midtransOrderId
  // This is required for multi-item checkout (cart) where multiple transactions
  // are grouped under one payment (one masterOrderId)
  sparse: true,
}
```

### 2. Drop Existing Unique Index

**IMPORTANT:** Updating the schema alone doesn't drop the existing index in MongoDB. You must run a migration script to drop the index.

#### Option A: Run Migration Script (Recommended)

```bash
pnpm migrate:drop-midtrans-index
```

This script will:

1. Connect to MongoDB
2. List all indexes
3. Drop `midtransOrderId_1` unique index
4. Verify the index is dropped

#### Option B: Manual MongoDB Command

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/robuxid

# Or if using MongoDB Atlas
mongosh "mongodb+srv://your-cluster.mongodb.net/robuxid"

# Drop the unique index
db.transactions.dropIndex("midtransOrderId_1")

# Verify indexes
db.transactions.getIndexes()
```

Expected output:

```javascript
[
  { v: 2, key: { _id: 1 }, name: "_id_" },
  { v: 2, key: { invoiceId: 1 }, name: "invoiceId_1", unique: true },
  // midtransOrderId_1 should be GONE
  { v: 2, key: { createdAt: 1 }, name: "createdAt_1" },
];
```

### 3. Restart Application

After dropping the index, restart your Next.js application:

```bash
# Stop the dev server (Ctrl+C)
# Start again
pnpm dev
```

## Migration Script

**File:** `scripts/drop-midtrans-unique-index.ts`

```typescript
import mongoose from "mongoose";

async function dropMidtransOrderIdIndex() {
  try {
    // Connect to MongoDB
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/robuxid";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // Get the Transaction collection
    const collection = mongoose.connection.collection("transactions");

    // List all indexes
    console.log("\n📋 Current indexes:");
    const indexes = await collection.indexes();
    indexes.forEach((index) => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    // Check if midtransOrderId_1 index exists
    const hasUniqueIndex = indexes.some(
      (index) => index.name === "midtransOrderId_1" && index.unique === true
    );

    if (hasUniqueIndex) {
      console.log("\n⚠️  Found unique index on midtransOrderId");
      console.log("🔧 Dropping index: midtransOrderId_1");

      // Drop the unique index
      await collection.dropIndex("midtransOrderId_1");
      console.log("✅ Index dropped successfully");
    } else {
      console.log("\n✅ No unique index on midtransOrderId found");
    }

    await mongoose.connection.close();
    console.log("\n✅ Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

dropMidtransOrderIdIndex();
```

## Why We Still Need `sparse: true`

```typescript
midtransOrderId: {
  type: String,
  sparse: true, // ✅ KEEP THIS
}
```

**`sparse: true`** allows:

- Multiple documents with `null` value
- Multiple documents with the same non-null value (after removing `unique`)

This is important because:

1. New transactions start with `midtransOrderId = null`
2. They get updated with `midtransOrderId` later
3. Multiple transactions can share the same `midtransOrderId`

## Verification

### Test Case 1: Cart with 2 Items

```bash
# After migration, try cart checkout with 2 items
# Expected: Success ✅

Console Output:
=== MASTER ORDER ID CREATED ===
Master Order ID: MULTI-1760037159992-LVV8OW

Transaction created: INV-1760037159992-ABC123
Transaction created: INV-1760037159993-DEF456
All transactions updated with Midtrans data ✅
```

### Test Case 2: Check MongoDB

```javascript
// Connect to MongoDB
db.transactions.find({ midtransOrderId: "MULTI-1760037159992-LVV8OW" })

// Expected: Multiple transactions ✅
[
  {
    _id: ObjectId("..."),
    invoiceId: "INV-1760037159992-ABC123",
    midtransOrderId: "MULTI-1760037159992-LVV8OW",
    serviceName: "robux 200",
    ...
  },
  {
    _id: ObjectId("..."),
    invoiceId: "INV-1760037159993-DEF456",
    midtransOrderId: "MULTI-1760037159992-LVV8OW",
    serviceName: "robux 200",
    ...
  }
]
```

## Impact on Existing System

### Webhooks ✅ Still Work

```typescript
// app/api/transactions/webhook/route.ts
const transactions = await Transaction.find({
  midtransOrderId: order_id
});

// Now finds multiple transactions ✅
for (const transaction of transactions) {
  await transaction.updateStatus(...);
}
```

### Transaction Lookup ✅ Still Works

```typescript
// Find all transactions for one payment
const transactions = await Transaction.find({
  midtransOrderId: "MULTI-XXX",
});

// Returns array of transactions ✅
```

### Single Item Checkout ✅ Not Affected

```typescript
// Single item checkout still works
Transaction {
  invoiceId: "INV-001",
  midtransOrderId: "ORDER-001", // Unique per checkout
  ...
}
```

## Files Modified

1. **`models/Transaction.ts`**

   - Removed `unique: true` from `midtransOrderId`
   - Added comments explaining the change

2. **`scripts/drop-midtrans-unique-index.ts`** ✨ NEW

   - Migration script to drop unique index

3. **`package.json`**
   - Added migration command: `migrate:drop-midtrans-index`

## Related Documentation

- **MONGODB_DUPLICATE_KEY_FIX.md** - Why we set midtransOrderId before Midtrans call
- **WEBHOOK_MULTI_TRANSACTION_SUPPORT.md** - Webhook finds multiple transactions
- **TRANSACTION_SYSTEM.md** - Multi-transaction architecture

## Common Questions

### Q: Why not use a separate "Payment" collection?

**A:** We chose the N transactions + 1 payment model because:

1. Each item needs its own transaction record (for automation, tracking, etc.)
2. Grouping via `midtransOrderId` is simpler than maintaining a separate Payment collection
3. Webhooks can easily find and update all related transactions

### Q: What if I want to find a unique transaction by midtransOrderId?

**A:** Use `invoiceId` instead, which is unique:

```typescript
// Find one specific transaction
const transaction = await Transaction.findOne({ invoiceId: "INV-XXX" });

// Find all transactions for one payment
const transactions = await Transaction.find({ midtransOrderId: "MULTI-XXX" });
```

### Q: Can midtransOrderId be null?

**A:** Yes, `sparse: true` allows null values. This is normal for transactions that haven't been submitted to Midtrans yet.

## Troubleshooting

### Error: "Index already exists with different options"

This happens if you try to create a new index with same name but different options.

**Solution:**

1. Drop the old index first: `pnpm migrate:drop-midtrans-index`
2. Restart application

### Error: "Cannot drop index"

Check if you have the correct permissions in MongoDB.

**Solution:**

```bash
# Check user permissions
db.runCommand({ connectionStatus: 1 })

# You need "dbAdmin" or "root" role to drop indexes
```

### Migration Script Doesn't Work

**Check:**

1. `MONGODB_URI` is set correctly in `.env`
2. MongoDB is running
3. You have network access to MongoDB

**Debug:**

```bash
# Test connection
node -e "require('mongoose').connect(process.env.MONGODB_URI).then(() => console.log('OK'))"
```

---

**Last Updated:** October 2025  
**Issue:** E11000 duplicate key error on `midtransOrderId`  
**Solution:** Remove unique constraint + drop existing index  
**Status:** ✅ Fixed  
**Impact:** Cart checkout, multi-item direct purchase
