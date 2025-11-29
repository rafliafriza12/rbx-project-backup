# Drop Duplicate Index on midtransOrderId

## Problem

MongoDB still has a unique index on `midtransOrderId` field which prevents multi-checkout from working (multiple transactions share the same order ID).

## Solution

### Option 1: Using MongoDB Shell (mongosh)

Connect to your MongoDB and run:

```javascript
use rbxnet

// Check existing indexes
db.transactions.getIndexes()

// Drop the unique index on midtransOrderId
db.transactions.dropIndex("midtransOrderId_1")

// Verify it's dropped
db.transactions.getIndexes()
```

### Option 2: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Go to `rbxnet` database → `transactions` collection
4. Click on "Indexes" tab
5. Find the index named `midtransOrderId_1`
6. Click the trash icon to delete it

### Option 3: Run via API (recommended)

Visit this URL in your browser or use curl:

```
GET /api/admin/sync-indexes
```

This will automatically drop the problematic index.

## After Fixing

Multi-checkout should work without the duplicate key error.
