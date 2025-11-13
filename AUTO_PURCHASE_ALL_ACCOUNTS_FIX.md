# Auto-Purchase Fix: Gunakan SEMUA Stock Account 🔄

## 🐛 **Problem Sebelumnya:**

```typescript
// ❌ WRONG: Hanya gunakan stock account yang baru ditambah/update
export async function autoPurchasePendingRobux(stockAccountId: string) {
  const stockAccount = await StockAccount.findById(stockAccountId);

  // Hanya cek robux dari 1 account ini
  if (stockAccount.robux < gamepassPrice) {
    break; // Stop, padahal mungkin ada account lain yang cukup!
  }
}
```

**Issue:**

- ❌ Hanya cek 1 stock account (yang baru ditambah/update)
- ❌ Tidak cek stock account lain yang mungkin punya robux cukup
- ❌ Inefficient: Account A punya 10k robux tapi tidak digunakan karena yang di-trigger adalah Account B

---

## ✅ **Solution:**

```typescript
// ✅ CORRECT: Cek SEMUA stock account untuk setiap transaction
export async function autoPurchasePendingRobux(triggeredByStockAccountId?: string) {
  for (const transaction of pendingTransactions) {
    const gamepassPrice = transaction.gamepass.price;

    // Cari stock account yang paling cocok dari SEMUA account
    const suitableAccount = await StockAccount.findOne({
      robux: { $gte: gamepassPrice },  // Robux >= price
      status: "active",
    }).sort({ robux: 1 });  // Sort ascending: gunakan yang paling sedikit

    if (!suitableAccount) {
      break; // Stop hanya jika TIDAK ADA account yang cukup
    }

    // Purchase dengan account yang ditemukan
    await purchaseGamepass(suitableAccount.robloxCookie, ...);

    // Update robux account yang digunakan
    suitableAccount.robux -= gamepassPrice;
    await suitableAccount.save();
  }
}
```

---

## 🎯 **Key Changes:**

### 1. **Dynamic Stock Account Selection**

**Before:**

```typescript
// Fixed account (yang di-trigger)
const stockAccount = await StockAccount.findById(stockAccountId);
let currentRobux = stockAccount.robux;

// Gunakan account ini terus sampai robux habis
for (transaction of pendingTransactions) {
  if (currentRobux < gamepassPrice) break;
  // purchase using stockAccount
  currentRobux -= gamepassPrice;
}
```

**After:**

```typescript
// Dynamic account selection untuk SETIAP transaction
for (transaction of pendingTransactions) {
  // Cari account paling cocok dari SEMUA account
  const suitableAccount = await StockAccount.findOne({
    robux: { $gte: gamepassPrice },
    status: "active",
  }).sort({ robux: 1 });

  if (!suitableAccount) break;

  // Purchase dengan account yang ditemukan
  // Update robux account tersebut
  suitableAccount.robux -= gamepassPrice;
  await suitableAccount.save();
}
```

### 2. **Smart Account Selection**

```typescript
.sort({ robux: 1 })  // Ascending order
```

**Why?**

- Gunakan account dengan robux PALING SEDIKIT yang mencukupi
- Preserve account dengan robux banyak untuk transaction besar
- Load balancing otomatis

**Example:**

```
Stock Accounts:
- Account A: 15,000 robux
- Account B: 5,000 robux
- Account C: 2,000 robux

Transaction: Need 1,500 robux

Selected: Account C (2,000 robux) ✅
Not: Account A (15,000 robux) ❌

Why? Preserve Account A untuk transaction yang butuh 10,000+ robux
```

### 3. **Individual Account Updates**

**Before:**

```typescript
// Update 1 account di akhir
stockAccount.robux = currentRobux;
await stockAccount.save();
```

**After:**

```typescript
// Update setiap account yang digunakan
suitableAccount.robux -= gamepassPrice;
suitableAccount.lastChecked = new Date();
await suitableAccount.save();
```

---

## 📊 **Flow Comparison**

### Before (Wrong):

```
Admin Add Account B (5,000 robux)
↓
Auto-purchase triggered
↓
Use ONLY Account B:
  Transaction 1: 2,000 robux ✅ (3,000 left)
  Transaction 2: 3,000 robux ✅ (0 left)
  Transaction 3: 4,000 robux ❌ Stop!

Account A (10,000 robux) NOT USED! 😞
```

### After (Correct):

```
Admin Add Account B (5,000 robux)
↓
Auto-purchase triggered
↓
Check ALL Accounts for Each Transaction:

Transaction 1: Need 2,000 robux
  Available: Account C (2,500), Account B (5,000), Account A (10,000)
  Selected: Account C ✅ (smallest sufficient)
  Account C: 2,500 → 500 robux

Transaction 2: Need 3,000 robux
  Available: Account B (5,000), Account A (10,000)
  Selected: Account B ✅
  Account B: 5,000 → 2,000 robux

Transaction 3: Need 4,000 robux
  Available: Account A (10,000)
  Selected: Account A ✅
  Account A: 10,000 → 6,000 robux

All transactions processed! 🎉
```

---

## 🔍 **Query Explanation**

```typescript
const suitableAccount = await StockAccount.findOne({
  robux: { $gte: gamepassPrice }, // Greater than or equal
  status: "active", // Only active accounts
}).sort({ robux: 1 }); // Ascending (smallest first)
```

**Breakdown:**

1. **Filter:**

   - `robux >= gamepassPrice`: Only accounts with enough robux
   - `status = "active"`: Exclude inactive accounts

2. **Sort:**

   - `robux: 1`: Ascending order (smallest to largest)
   - Result: Account with LEAST robux that's still sufficient

3. **Return:**
   - `.findOne()`: Return first match (the smallest sufficient account)

**Example Query:**

```javascript
// Transaction needs 3,000 robux
// Stock Accounts:
//   - Account A: 15,000 robux, active
//   - Account B: 5,000 robux, active
//   - Account C: 2,000 robux, active
//   - Account D: 10,000 robux, inactive

StockAccount.findOne({
  robux: { $gte: 3000 }, // Filter: A (15k), B (5k), D (10k but inactive)
  status: "active", // Filter: A (15k), B (5k)
}).sort({ robux: 1 }); // Sort: B (5k), A (15k)
// Return: B (5k) ✅
```

---

## 🧪 **Testing Scenarios**

### Scenario 1: Multiple Accounts Available

```
Setup:
- Account A: 10,000 robux
- Account B: 5,000 robux
- Account C: 2,000 robux
- Pending Transactions:
  * Transaction 1: 1,500 robux
  * Transaction 2: 2,500 robux
  * Transaction 3: 4,000 robux

Expected:
Transaction 1 (1,500):
  ✅ Use Account C (2,000 → 500)

Transaction 2 (2,500):
  ✅ Use Account B (5,000 → 2,500)

Transaction 3 (4,000):
  ✅ Use Account B (2,500) + extra from A? NO!
  ❌ Account B insufficient (2,500 < 4,000)
  ✅ Use Account A (10,000 → 6,000)

Result:
- Account A: 6,000 robux
- Account B: 2,500 robux
- Account C: 500 robux
- All 3 transactions completed ✅
```

### Scenario 2: No Sufficient Account

```
Setup:
- Account A: 2,000 robux
- Account B: 1,500 robux
- Pending Transaction: 3,000 robux

Expected:
Transaction 1 (3,000):
  Query: robux >= 3000
  Result: No accounts found
  ❌ Stop processing

Result:
- Transaction stays pending
- No accounts modified
- Will retry when admin adds more robux
```

### Scenario 3: Exact Match

```
Setup:
- Account A: 5,000 robux
- Account B: 5,000 robux
- Pending Transaction: 5,000 robux

Expected:
Transaction 1 (5,000):
  Query: robux >= 5000
  Results: Account A, Account B (both 5000)
  Sort: Both equal, return first (Account A or B)
  ✅ Use Account A (5,000 → 0)

Result:
- Account A: 0 robux
- Account B: 5,000 robux (untouched)
- Transaction completed ✅
```

---

## 📈 **Benefits**

### 1. **Efficiency**

```
Before:
- 3 accounts available
- Only use 1 account
- Other 2 accounts idle

After:
- 3 accounts available
- Use all accounts based on need
- Optimal resource utilization
```

### 2. **Load Balancing**

```
Small transactions → Use small accounts
Large transactions → Use large accounts
Automatic distribution!
```

### 3. **Scalability**

```
1 stock account: Works ✅
5 stock accounts: Works ✅
100 stock accounts: Works ✅

System automatically finds best account for each transaction
```

### 4. **Preserve Resources**

```
Account with 50,000 robux:
- Don't use for 500 robux transaction
- Save for 30,000 robux transaction
- Let smaller accounts handle small transactions
```

---

## 🎯 **Console Logs Example**

```bash
🤖 Starting auto-purchase for pending robux_5_hari transactions...
🎯 Triggered by stock account update: RobloxBot1 (Robux: 5000)

📋 Found 3 pending robux_5_hari transactions from last 5 days

🔄 Processing transaction INV-001 - Gamepass: 1000 Robux (1000 robux)
✅ Found suitable account: RobloxBot3 (1200 robux)
Attempting to purchase gamepass via API: { productId: 789, price: 1000 }
Gamepass purchase successful via API
✅ Transaction INV-001 completed successfully. Account RobloxBot3 remaining robux: 200
⏳ Waiting 10 seconds before next purchase...

🔄 Processing transaction INV-002 - Gamepass: 3000 Robux (3000 robux)
✅ Found suitable account: RobloxBot1 (5000 robux)
Attempting to purchase gamepass via API: { productId: 790, price: 3000 }
Gamepass purchase successful via API
✅ Transaction INV-002 completed successfully. Account RobloxBot1 remaining robux: 2000
⏳ Waiting 10 seconds before next purchase...

🔄 Processing transaction INV-003 - Gamepass: 8000 Robux (8000 robux)
✅ Found suitable account: RobloxBot2 (10000 robux)
Attempting to purchase gamepass via API: { productId: 791, price: 8000 }
Gamepass purchase successful via API
✅ Transaction INV-003 completed successfully. Account RobloxBot2 remaining robux: 2000

🎉 Auto-purchase completed! Processed: 3, Skipped: 0
```

**Notice:**

- Transaction 1 used RobloxBot3 (smallest)
- Transaction 2 used RobloxBot1 (medium)
- Transaction 3 used RobloxBot2 (largest)
- **Different accounts for different transactions!** ✅

---

## ✅ **Summary**

### Changes:

1. ✅ **Dynamic account selection** untuk setiap transaction
2. ✅ **Check ALL active stock accounts**, bukan hanya yang di-trigger
3. ✅ **Smart selection**: Gunakan account dengan robux paling sedikit yang cukup
4. ✅ **Individual updates**: Update setiap account yang digunakan
5. ✅ **Optional parameter**: `triggeredByStockAccountId` hanya untuk logging

### Result:

- ✅ **More efficient**: Semua stock account digunakan
- ✅ **Better load balancing**: Optimal resource distribution
- ✅ **More transactions processed**: Tidak stop hanya karena 1 account habis
- ✅ **Scalable**: Works dengan 1 atau 100+ stock accounts

---

**Updated:** November 11, 2025  
**Fix:** Use ALL stock accounts instead of just the triggered one  
**Impact:** Significantly more efficient transaction processing
