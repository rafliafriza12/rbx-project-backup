# Summary: Field yang Perlu Di-Drop Unique Index di MongoDB Atlas

## 📋 Index yang Perlu Di-Drop

### 1. `midtransOrderId_1` ⚠️ **MUST DROP**

**Reason:** Multiple transactions need to share the same `midtransOrderId` for cart checkout (multi-item purchase).

**How to Drop:**

```javascript
// Di MongoDB Atlas Shell atau Compass
db.transactions.dropIndex("midtransOrderId_1");
```

**Verify:**

```javascript
// Check indexes
db.transactions.getIndexes();

// Should NOT see:
// { v: 2, key: { midtransOrderId: 1 }, name: 'midtransOrderId_1', unique: true }
```

---

## ✅ Index yang TIDAK Perlu Di-Drop

### 1. `invoiceId_1` ✅ **KEEP UNIQUE**

**Reason:** `invoiceId` adalah primary identifier untuk setiap transaction. Setiap transaction HARUS punya `invoiceId` yang unique.

```typescript
invoiceId: {
  type: String,
  required: true,
  unique: true, // ✅ KEEP THIS - Each transaction needs unique invoice ID
  default: function () {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${timestamp}-${random}`;
  },
}
```

**Example:**

```
Transaction 1: invoiceId = "INV-1760037159992-ABC123" ✅
Transaction 2: invoiceId = "INV-1760037159993-DEF456" ✅
Transaction 3: invoiceId = "INV-1760037159994-GHI789" ✅
```

---

## 🔍 Complete Index Structure (After Fix)

**Expected indexes in MongoDB Atlas:**

```javascript
[
  // Default MongoDB index
  {
    v: 2,
    key: { _id: 1 },
    name: "_id_",
  },

  // Invoice ID - UNIQUE (KEEP THIS)
  {
    v: 2,
    key: { invoiceId: 1 },
    name: "invoiceId_1",
    unique: true,
    background: true,
  },

  // Midtrans Order ID - NOT UNIQUE (after dropping)
  // This index might be recreated automatically without unique constraint
  // Or it might not exist at all (which is fine)

  // Created/Updated timestamps (if you have them)
  {
    v: 2,
    key: { createdAt: 1 },
    name: "createdAt_1",
  },
  {
    v: 2,
    key: { updatedAt: 1 },
    name: "updatedAt_1",
  },
];
```

---

## 📝 Step-by-Step Instructions for MongoDB Atlas

### Method 1: Using Atlas UI (Easiest)

1. **Login to MongoDB Atlas**

   - Go to https://cloud.mongodb.com
   - Login to your account

2. **Navigate to Database**

   - Click on your cluster
   - Click "Browse Collections"

3. **Select Collection**

   - Select database: `robuxid`
   - Select collection: `transactions`

4. **Go to Indexes Tab**

   - Click on "Indexes" tab

5. **Drop the Index**

   - Find index: `midtransOrderId_1`
   - Click the trash icon (🗑️)
   - Confirm deletion

6. **Verify**
   - Refresh the page
   - `midtransOrderId_1` should be gone
   - `invoiceId_1` should still exist ✅

### Method 2: Using Atlas Shell

1. **Open Shell**

   - In MongoDB Atlas UI, click "Connect"
   - Choose "Shell"
   - Copy the connection string

2. **Run Commands**

   ```javascript
   // Switch to your database
   use robuxid

   // Check current indexes
   db.transactions.getIndexes()

   // Drop the unique index
   db.transactions.dropIndex("midtransOrderId_1")

   // Verify it's dropped
   db.transactions.getIndexes()
   ```

3. **Expected Output**

   ```javascript
   // Before dropping
   {
     "v": 2,
     "key": { "midtransOrderId": 1 },
     "name": "midtransOrderId_1",
     "unique": true,  // ⚠️ This is the problem
     "sparse": true
   }

   // After dropping
   // midtransOrderId_1 should not appear in the list
   ```

### Method 3: Using MongoDB Compass

1. **Connect to Atlas**

   - Open MongoDB Compass
   - Use connection string from Atlas

2. **Navigate to Collection**

   - Database: `robuxid`
   - Collection: `transactions`

3. **Go to Indexes Tab**

   - Click "Indexes" in the left panel

4. **Drop Index**
   - Find `midtransOrderId_1`
   - Click "Drop Index"
   - Confirm

---

## ⚠️ Important Notes

### After Dropping Index:

1. **Restart Your Application**

   ```bash
   # Stop dev server (Ctrl+C)
   pnpm dev
   ```

2. **Test Cart Checkout**

   - Add 2+ items to cart
   - Proceed to checkout
   - Should work without duplicate key error ✅

3. **No Need to Recreate Index**
   - MongoDB will still allow queries on `midtransOrderId`
   - Index is optional for queries (just slower without it)
   - We don't need fast lookup by `midtransOrderId` (only by `invoiceId`)

### If You Want Non-Unique Index (Optional):

If you want to speed up queries by `midtransOrderId` without uniqueness:

```javascript
// Create non-unique index
db.transactions.createIndex(
  { midtransOrderId: 1 },
  {
    sparse: true,
    background: true,
    // NO unique: true
  }
);
```

But this is **optional** - not required for the system to work.

---

## 🧪 Verification After Fix

### Test 1: Cart Checkout with 2 Items

```bash
# In your app:
1. Add "Robux 200" to cart
2. Add "Robux 200" to cart again
3. Go to cart
4. Click checkout
5. Fill form and submit

# Expected Console Output:
=== MASTER ORDER ID CREATED ===
Master Order ID: MULTI-1760037159992-LVV8OW

Transaction created: INV-1760037159992-ABC123
Transaction created: INV-1760037159993-DEF456

All transactions updated with Midtrans data ✅

# Should NOT see:
❌ MongoServerError: E11000 duplicate key error
```

### Test 2: MongoDB Query

```javascript
// In MongoDB Atlas Shell or Compass:
db.transactions
  .find({
    midtransOrderId: "MULTI-1760037159992-LVV8OW",
  })
  .count();

// Expected: 2 (or more, depending on items) ✅
// If you see 2+ transactions with same midtransOrderId, it's working!
```

---

## 🎯 Summary

**What to Do:**

1. ✅ Drop index `midtransOrderId_1` in MongoDB Atlas
2. ✅ Keep index `invoiceId_1` (DON'T drop this)
3. ✅ Restart your application
4. ✅ Test cart checkout with 2+ items

**What NOT to Do:**

1. ❌ Don't drop `invoiceId_1` index
2. ❌ Don't drop `_id` index (default MongoDB index)
3. ❌ Don't recreate `midtransOrderId_1` with unique constraint

**After Fix:**

- Cart checkout with multiple items: ✅ Works
- Direct purchase with multiple items: ✅ Works
- Single item checkout: ✅ Still works
- Webhooks: ✅ Still works (finds multiple transactions)
- Admin panel: ✅ Still works

---

## 📞 If You Still See Duplicate Key Error After Dropping Index

**Possible causes:**

1. **Index not fully dropped**

   - Run `db.transactions.getIndexes()` again
   - Make sure `midtransOrderId_1` is NOT in the list

2. **Application cache**

   - Restart application: `pnpm dev`
   - Clear browser cache and refresh

3. **Wrong database/collection**

   - Make sure you're connected to correct database: `robuxid`
   - Make sure you're in correct collection: `transactions`

4. **Different index name**
   - Check if index has different name like `midtransOrderId_1_1`
   - Drop all indexes with `midtransOrderId` in the name

---

**Need Help?** Share screenshot of `db.transactions.getIndexes()` output if still having issues.
