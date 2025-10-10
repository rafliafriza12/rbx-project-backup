# 🐛 HOT Badge Debugging Guide

**Date**: 2025
**Issue**: Badge HOT tidak muncul meskipun ada transaksi joki
**Status**: 🔍 Under Investigation

---

## 🔍 Potential Issues & Solutions

### Issue 1: serviceId Stores Child Item ID (MOST LIKELY!)

**Problem**: Ketika checkout joki, `serviceId` menyimpan ID item child, bukan ID parent joki
**Impact**: Query tidak menemukan transaksi karena mencari parent joki ID

**Example**:

```javascript
// Joki parent
joki._id = "67890abcdef"; // Blox Fruits game

// Joki child item
item._id = "12345xyz"; // Devil Fruit item

// Transaction saves:
serviceId: "67890abcdef"; // Should be parent ID
serviceName: "Blox Fruits - Devil Fruit"; // Contains game name
```

**Solution**: Query berdasarkan `serviceName` yang pasti berisi nama game

```typescript
// Method 3: Match by serviceName
const orderCountByName = await Transaction.countDocuments({
  serviceType: "joki",
  serviceName: { $regex: joki.gameName, $options: "i" },
  status: { $in: ["pending", "settlement", "capture"] },
});
```

### Issue 2: serviceId Type Mismatch

**Problem**: `serviceId` di Transaction bisa ObjectId atau String

### Solution\*\*: Query dengan kedua format

```typescript
// Try both ObjectId and String format
const orderCountString = await Transaction.countDocuments({
  serviceType: "joki",
  serviceId: joki._id.toString(), // String
  status: { $in: ["pending", "settlement", "capture"] },
});

const orderCountObjectId = await Transaction.countDocuments({
  serviceType: "joki",
  serviceId: joki._id, // ObjectId
  status: { $in: ["pending", "settlement", "capture"] },
});

const orderCount = Math.max(orderCountString, orderCountObjectId);
```

### THREE-METHOD QUERY APPROACH (Current Fix)

```typescript
// Method 1: Match as ObjectId
const orderCountObjectId = await Transaction.countDocuments({
  serviceType: "joki",
  serviceId: joki._id, // ObjectId format
  status: { $in: ["pending", "settlement", "capture"] },
});

// Method 2: Match as String
const orderCountString = await Transaction.countDocuments({
  serviceType: "joki",
  serviceId: joki._id.toString(), // String format
  status: { $in: ["pending", "settlement", "capture"] },
});

// Method 3: Match by serviceName (FALLBACK - catches all!)
const orderCountByName = await Transaction.countDocuments({
  serviceType: "joki",
  serviceName: { $regex: joki.gameName, $options: "i" }, // Regex match
  status: { $in: ["pending", "settlement", "capture"] },
});

// Take the maximum (most accurate)
const orderCount = Math.max(
  orderCountObjectId,
  orderCountString,
  orderCountByName
);
```

**Why Method 3 Works**:

- serviceName format: `"[GameName] - [ItemName]"`
- Example: `"Blox Fruits - Devil Fruit"`
- Regex `{ $regex: "Blox Fruits", $options: "i" }` akan match!
- Case insensitive dengan flag `i`
- Menangkap semua transaksi untuk joki tersebut

### Issue 2: Transaction Status

**Current Query**: `status: { $in: ["pending", "settlement", "capture"] }`

**Check if transactions have different status values**:

- `pending` - Payment initiated
- `settlement` - Payment completed (most common)
- `capture` - Credit card capture
- `deny` - Payment denied (NOT counted)
- `cancel` - Order cancelled (NOT counted)
- `expire` - Payment expired (NOT counted)

### Issue 3: serviceType Value

**Expected**: `"joki"`
**Check**: Pastikan transaksi disimpan dengan `serviceType: "joki"` (lowercase)

---

## 🔧 Debugging Steps

### Step 1: Check Terminal/Console Logs

Setelah refresh halaman `/joki`, cek terminal server untuk output:

```bash
=== API /api/joki Output ===
Total Joki Services: X

Joki: [Nama Game]
  ID: [ObjectId]
  Order Count (String): X
  Order Count (ObjectId): X
  Final Order Count: X

=== SORTED JOKI BY ORDER COUNT ===
1. [Nama]: X orders
2. [Nama]: X orders
3. [Nama]: X orders

=== HOT JOKI ===
🔥 [Nama] (X orders)
```

### Step 2: Check Browser Console

Buka browser console (F12) dan cek:

```javascript
=== JOKI SERVICES FROM API ===
Total joki: X
[Nama]: { orderCount: X, isHot: true/false }
```

### Step 3: Inspect Database

Jalankan query di MongoDB:

```javascript
// Check transactions
db.transactions
  .find({
    serviceType: "joki",
  })
  .pretty();

// Count by joki ID
db.transactions.aggregate([
  { $match: { serviceType: "joki" } },
  {
    $group: {
      _id: "$serviceId",
      count: { $sum: 1 },
    },
  },
  { $sort: { count: -1 } },
]);

// Check serviceId types
db.transactions
  .find(
    {
      serviceType: "joki",
    },
    {
      serviceId: 1,
      serviceName: 1,
      status: 1,
    }
  )
  .limit(10);
```

### Step 4: Verify Data Structure

Check if `joki._id` matches `transaction.serviceId`:

```javascript
// In Node.js/MongoDB shell
const joki = db.jokis.findOne({ gameName: "Blox Fruits" });
console.log("Joki ID:", joki._id);
console.log("Type:", typeof joki._id);

const transactions = db.transactions.find({
  serviceType: "joki",
  serviceId: joki._id,
});
console.log("Transactions found:", transactions.count());
```

---

## 🎯 Quick Fix Options

### Option A: Query Both Formats (Current Implementation)

```typescript
const orderCountString = await Transaction.countDocuments({
  serviceType: "joki",
  serviceId: joki._id.toString(),
  status: { $in: ["pending", "settlement", "capture"] },
});

const orderCountObjectId = await Transaction.countDocuments({
  serviceType: "joki",
  serviceId: joki._id,
  status: { $in: ["pending", "settlement", "capture"] },
});

const orderCount = Math.max(orderCountString, orderCountObjectId);
```

### Option B: Remove Status Filter (Test Only)

```typescript
// Test without status filter
const orderCount = await Transaction.countDocuments({
  serviceType: "joki",
  serviceId: joki._id.toString(),
});
```

### Option C: Use $or Query

```typescript
const orderCount = await Transaction.countDocuments({
  serviceType: "joki",
  $or: [{ serviceId: joki._id }, { serviceId: joki._id.toString() }],
  status: { $in: ["pending", "settlement", "capture"] },
});
```

---

## 📋 Checklist

Gunakan checklist ini untuk debugging:

### Database Check

- [ ] Ada transaksi dengan `serviceType: "joki"`?
- [ ] `serviceId` di transaksi match dengan `joki._id`?
- [ ] Status transaksi = "pending", "settlement", atau "capture"?
- [ ] `serviceId` bertipe ObjectId atau String?

### API Check

- [ ] Console log menampilkan order count > 0?
- [ ] Joki tersortir dengan benar?
- [ ] `isHot` di-set ke `true` untuk top 3?
- [ ] Response JSON berisi field `isHot`?

### Frontend Check

- [ ] Console browser menampilkan `isHot: true`?
- [ ] Conditional `{joki.isHot && ...}` dipanggil?
- [ ] Badge component ter-render?
- [ ] CSS classes applied correctly?

### Visual Check

- [ ] Badge muncul di corner card?
- [ ] Fire icon visible?
- [ ] Animation berjalan?
- [ ] Responsive di mobile?

---

## 🔍 Common Issues

### 1. No Transactions Found

**Symptom**: All orderCount = 0

**Possible Causes**:

- serviceType typo ("Joki" vs "joki")
- serviceId mismatch (ObjectId vs String)
- Wrong status filter
- No transactions created yet

**Solution**:

```javascript
// Check raw transactions
db.transactions.find({ serviceType: "joki" }).count();

// If 0, check with case-insensitive
db.transactions
  .find({
    serviceType: { $regex: /joki/i },
  })
  .count();
```

### 2. Badge Not Rendering

**Symptom**: orderCount > 0 but badge tidak muncul

**Possible Causes**:

- `isHot` not in response
- Frontend not using `joki.isHot`
- CSS hiding the badge
- Z-index issue

**Solution**:

```tsx
// Add temporary debug badge
{
  joki.orderCount && joki.orderCount > 0 && (
    <div className="bg-red-500 text-white p-2">
      Orders: {joki.orderCount}, Hot: {joki.isHot ? "Yes" : "No"}
    </div>
  );
}
```

### 3. Wrong Joki Marked as Hot

**Symptom**: Joki dengan order sedikit dapat badge

**Possible Causes**:

- Sorting logic terbalik
- Multiple joki dengan order count sama
- orderCount tidak akurat

**Solution**:

```typescript
// Verify sorting
console.log(
  sortedJoki.map((j) => ({
    name: j.gameName,
    count: j.orderCount,
  }))
);

// Should be descending: [10, 8, 5, 3, 1]
```

---

## 🛠️ Testing Commands

### Create Test Transaction

```javascript
// MongoDB shell or API
db.transactions.insertOne({
  serviceType: "joki",
  serviceId: ObjectId("your_joki_id"), // Get from db.jokis.findOne()
  serviceName: "Test Joki Service",
  status: "settlement",
  quantity: 1,
  unitPrice: 50000,
  totalAmount: 50000,
  finalAmount: 50000,
  robloxUsername: "testuser",
  createdAt: new Date(),
  updatedAt: new Date(),
});
```

### Query to Find Joki with Orders

```javascript
db.transactions.aggregate([
  { $match: { serviceType: "joki" } },
  {
    $group: {
      _id: "$serviceId",
      count: { $sum: 1 },
      serviceName: { $first: "$serviceName" },
    },
  },
  { $sort: { count: -1 } },
  { $limit: 5 },
]);
```

---

## 📝 Expected Output

### Server Console (Terminal)

```
Total Joki Services: 5

Joki: Blox Fruits
  ID: 67890abcdef123456
  Order Count (String): 15
  Order Count (ObjectId): 15
  Final Order Count: 15

Joki: Pet Simulator X
  ID: 12345abcdef67890
  Order Count (String): 8
  Order Count (ObjectId): 8
  Final Order Count: 8

=== SORTED JOKI BY ORDER COUNT ===
1. Blox Fruits: 15 orders
2. Pet Simulator X: 8 orders
3. Adopt Me: 5 orders
4. Tower Defense: 2 orders
5. Other Game: 0 orders

Blox Fruits: isHot = true (index: 0, orderCount: 15)
Pet Simulator X: isHot = true (index: 1, orderCount: 8)
Adopt Me: isHot = true (index: 2, orderCount: 5)
Tower Defense: isHot = false (index: 3, orderCount: 2)
Other Game: isHot = false (index: 4, orderCount: 0)

=== HOT JOKI ===
🔥 Blox Fruits (15 orders)
🔥 Pet Simulator X (8 orders)
🔥 Adopt Me (5 orders)
```

### Browser Console

```
=== JOKI SERVICES FROM API ===
Total joki: 5
Blox Fruits: { orderCount: 15, isHot: true }
Pet Simulator X: { orderCount: 8, isHot: true }
Adopt Me: { orderCount: 5, isHot: true }
Tower Defense: { orderCount: 2, isHot: false }
Other Game: { orderCount: 0, isHot: false }
```

---

## ✅ Resolution Steps

1. **Check Logs**: Refresh `/joki` dan lihat terminal + browser console
2. **Verify Query**: Pastikan orderCount > 0 untuk joki yang sudah dipesan
3. **Check Database**: Verifikasi data transaksi di MongoDB
4. **Test Badge**: Jika orderCount benar, cek rendering badge
5. **Fix & Deploy**: Apply fix yang sesuai

---

## 🔧 Current Implementation Status

### Files Modified:

- ✅ `/app/api/joki/route.ts` - Enhanced with dual query & logging
- ✅ `/app/(public)/joki/page.tsx` - Added console logging

### Logging Added:

- ✅ Server-side: Order count per joki (both formats)
- ✅ Server-side: Sorted ranking
- ✅ Server-side: Hot badge assignment
- ✅ Client-side: API response data

### Next Actions:

1. Refresh halaman `/joki`
2. Check terminal output
3. Check browser console
4. Analyze the logs
5. Apply appropriate fix

---

_Last Updated: 2025_
_Status: Debugging in Progress_
_Need: Console logs to diagnose issue_
