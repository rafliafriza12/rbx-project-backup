# Auto-Purchase Pending Robux 5 Hari 🤖

## 📋 **Overview**

Sistem otomatis untuk memproses transaksi **robux_5_hari** yang statusnya:

- ✅ **Payment Status:** `settlement` (sudah dibayar)
- ⏳ **Order Status:** `pending` (belum diproses)

Automasi ini berjalan **setiap kali admin menambahkan atau update stock account**.

---

## 🔄 **Flow Automation**

### Trigger:

1. Admin **add new stock account** di `/admin/users` tab "Stock"
2. Admin **update cookie** stock account yang sudah ada

### Process:

```
Admin Add/Update Stock Account
↓
Validate Roblox Cookie ✅
↓
Get User Info & Robux Balance
↓
Save Stock Account to Database
↓
🚀 Trigger Auto-Purchase (Background, Non-blocking)
   ↓
   1. Query Pending Transactions (last 5 days):
      - serviceType = "robux"
      - serviceCategory = "robux_5_hari"
      - paymentStatus = "settlement"
      - orderStatus = "pending"
      - Sort by createdAt (oldest first)
   ↓
   2. For Each Transaction:
      ↓
      Check: Stock Robux >= Gamepass Price?
      ↓
      ├─ YES ✅
      │  ↓
      │  Purchase Gamepass via Roblox API
      │  ↓
      │  Update Transaction:
      │    - orderStatus → "completed"
      │    - Add note: "Gamepass berhasil dibeli menggunakan akun {username}"
      │  ↓
      │  Deduct Robux from Stock Account
      │  ↓
      │  ⏳ Wait 10 seconds
      │  ↓
      │  Process Next Transaction
      │
      └─ NO ❌
         ↓
         🛑 STOP Processing
         ↓
         Remaining Transactions → Stay "pending"
         ↓
         Will be processed on next stock update
↓
Return Response to Admin
(Auto-purchase runs in background)
```

---

## 🎯 **Key Features**

### 1. **Smart Transaction Selection**

```typescript
const pendingTransactions = await Transaction.find({
  serviceType: "robux",
  serviceCategory: "robux_5_hari",
  paymentStatus: "settlement",
  orderStatus: "pending",
  createdAt: { $gte: fiveDaysAgo },
  "gamepass.price": { $exists: true },
}).sort({ createdAt: 1 }); // Oldest first ⏰
```

**Why only last 5 days?**

- Robux 5 hari = valid for 5 days
- Transaksi lebih dari 5 hari kemungkinan sudah expired atau handled manually
- Prevent processing very old stuck transactions

### 2. **Sequential Processing with Delay**

```typescript
for (const transaction of pendingTransactions) {
  // Purchase gamepass
  await purchaseGamepass(...);

  // Wait 10 seconds before next purchase
  if (remainingTransactions > 0) {
    await sleep(10000); // ⏳ 10 second delay
  }
}
```

**Why 10 second delay?**

- Prevent Roblox rate limiting
- Avoid triggering anti-bot detection
- Give time for Roblox to process each purchase

### 3. **Stop on Insufficient Robux**

```typescript
if (currentRobux < gamepassPrice) {
  console.log("🛑 Stopping auto-purchase");
  break; // Stop, don't skip
}
```

**Why stop instead of skip?**

- Transactions are sorted by oldest first
- If we can't process transaction #3, we shouldn't skip to #4
- Fair queue system (FIFO - First In First Out)
- Admin knows exactly what needs more robux

### 4. **Background Execution (Non-blocking)**

```typescript
// In route.ts
autoPurchasePendingRobux(stockAccount._id.toString()).catch((error) => {
  console.error("Error in background auto-purchase:", error);
});

return NextResponse.json({
  success: true,
  message:
    "Stock account berhasil ditambahkan. Auto-purchase dimulai untuk transaksi pending.",
});
```

**Why non-blocking?**

- Admin gets immediate response
- Purchase process can take minutes (10s delay × multiple transactions)
- Don't timeout the HTTP request
- Errors logged to console, don't affect admin UI

---

## 📁 **Files Modified**

### 1. `/lib/auto-purchase-robux.ts` ⭐ NEW

Main automation logic:

- `autoPurchasePendingRobux()` - Main function
- `purchaseGamepass()` - Purchase logic (based on buy-pass API)
- `sleep()` - Delay helper

### 2. `/app/api/admin/stock-accounts/route.ts`

```typescript
import { autoPurchasePendingRobux } from "@/lib/auto-purchase-robux";

export async function POST(req: NextRequest) {
  // ... validate cookie, save account ...

  await stockAccount.save();

  // 🚀 Trigger auto-purchase
  autoPurchasePendingRobux(stockAccount._id.toString()).catch((error) => {
    console.error("Error in background auto-purchase:", error);
  });

  return NextResponse.json({
    success: true,
    message:
      "Stock account berhasil ditambahkan. Auto-purchase dimulai untuk transaksi pending.",
  });
}
```

### 3. `/app/api/admin/stock-accounts/[id]/route.ts`

```typescript
import { autoPurchasePendingRobux } from "@/lib/auto-purchase-robux";

export async function PUT(req: NextRequest, { params }) {
  // ... validate cookie, update account ...

  // 🚀 Trigger auto-purchase
  autoPurchasePendingRobux(updatedAccount._id.toString()).catch((error) => {
    console.error("Error in background auto-purchase:", error);
  });

  return NextResponse.json({
    success: true,
    message:
      "Stock account berhasil diperbarui. Auto-purchase dimulai untuk transaksi pending.",
  });
}
```

---

## 🔍 **Purchase Gamepass Logic**

Based on `/app/api/buy-pass/route.ts`:

```typescript
async function purchaseGamepass(
  robloxCookie: string,
  productId: number,
  price: number,
  sellerId: number
) {
  // 1️⃣ Get CSRF Token from /v2/logout
  const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
    method: "POST",
    headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
  });
  const csrfToken = csrfRes.headers.get("x-csrf-token");

  // 2️⃣ Purchase Product
  const purchaseRes = await fetch(
    `https://economy.roblox.com/v1/purchases/products/${productId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
        Cookie: `.ROBLOSECURITY=${robloxCookie};`,
      },
      body: JSON.stringify({
        expectedPrice: price,
        expectedSellerId: sellerId,
      }),
    }
  );

  return purchaseRes.ok ? { success: true } : { success: false };
}
```

---

## 📊 **Transaction Status Updates**

### Before Auto-Purchase:

```json
{
  "invoiceId": "INV-123",
  "serviceType": "robux",
  "serviceCategory": "robux_5_hari",
  "paymentStatus": "settlement", // ✅ Paid
  "orderStatus": "pending", // ⏳ Waiting
  "gamepass": {
    "id": 123456,
    "name": "1000 Robux",
    "price": 1000,
    "productId": 789012,
    "sellerId": 345678
  }
}
```

### After Successful Purchase:

```json
{
  "invoiceId": "INV-123",
  "paymentStatus": "settlement", // ✅ Paid
  "orderStatus": "completed", // ✅ Done
  "statusHistory": [
    {
      "type": "order",
      "status": "completed",
      "note": "Gamepass berhasil dibeli menggunakan akun RobloxStockBot",
      "timestamp": "2025-11-11T10:30:00Z"
    }
  ]
}
```

---

## 🧪 **Testing Scenarios**

### Scenario 1: Add Stock Account with Pending Transactions

```
Setup:
- 3 pending robux_5_hari transactions:
  * Transaction A: 1000 robux (oldest)
  * Transaction B: 2000 robux
  * Transaction C: 3000 robux
- Add stock account with 4000 robux

Expected:
✅ Transaction A processed (4000 - 1000 = 3000)
⏳ Wait 10 seconds
✅ Transaction B processed (3000 - 2000 = 1000)
⏳ Wait 10 seconds
❌ Transaction C NOT processed (1000 < 3000)
🛑 Stop automation

Result:
- 2 transactions completed
- 1 transaction still pending
- Stock account: 1000 robux remaining
```

### Scenario 2: Update Cookie with Enough Robux

```
Setup:
- 2 pending robux_5_hari transactions:
  * Transaction D: 5000 robux
  * Transaction E: 3000 robux
- Update stock account cookie (has 10000 robux after validation)

Expected:
✅ Transaction D processed (10000 - 5000 = 5000)
⏳ Wait 10 seconds
✅ Transaction E processed (5000 - 3000 = 2000)
✅ All transactions completed

Result:
- 2 transactions completed
- 0 transactions pending
- Stock account: 2000 robux remaining
```

### Scenario 3: No Pending Transactions

```
Setup:
- 0 pending robux_5_hari transactions
- Add stock account with 5000 robux

Expected:
ℹ️ Log: "No pending robux_5_hari transactions found"
✅ Auto-purchase completed immediately

Result:
- 0 transactions processed
- Stock account: 5000 robux (unchanged)
```

### Scenario 4: Purchase Failure

```
Setup:
- 1 pending transaction: 2000 robux
- Stock account with 5000 robux
- Roblox API returns error (cookie expired, product not found, etc.)

Expected:
❌ Transaction skipped with error log
✅ Continue to next transaction (if any)
✅ Stock account robux NOT deducted

Result:
- 0 transactions completed
- 1 transaction skipped (still pending)
- Stock account: 5000 robux (unchanged)
```

---

## 📈 **Console Logs Example**

```bash
🤖 Starting auto-purchase for pending robux_5_hari transactions...
✅ Stock Account: RobloxStockBot (ID: 12345) - Robux: 10000

📋 Found 3 pending robux_5_hari transactions from last 5 days

🔄 Processing transaction INV-001 - Gamepass: 1000 Robux (1000 robux)
Attempting to purchase gamepass: { productId: 789, price: 1000, sellerId: 456 }
CSRF token obtained successfully
Purchase response: { status: 200, data: { purchased: true } }
✅ Transaction INV-001 completed successfully. Remaining robux: 9000
⏳ Waiting 10 seconds before next purchase...

🔄 Processing transaction INV-002 - Gamepass: 2000 Robux (2000 robux)
Attempting to purchase gamepass: { productId: 790, price: 2000, sellerId: 456 }
CSRF token obtained successfully
Purchase response: { status: 200, data: { purchased: true } }
✅ Transaction INV-002 completed successfully. Remaining robux: 7000
⏳ Waiting 10 seconds before next purchase...

🔄 Processing transaction INV-003 - Gamepass: 5000 Robux (5000 robux)
Attempting to purchase gamepass: { productId: 791, price: 5000, sellerId: 456 }
CSRF token obtained successfully
Purchase response: { status: 200, data: { purchased: true } }
✅ Transaction INV-003 completed successfully. Remaining robux: 2000

🎉 Auto-purchase completed! Processed: 3, Skipped: 0, Remaining robux: 2000
```

---

## ⚠️ **Important Notes**

### 1. **Only Robux 5 Hari**

```typescript
serviceCategory: "robux_5_hari";
```

Tidak termasuk:

- ❌ Robux instant
- ❌ Gamepass manual
- ❌ Joki
- ❌ Reseller

### 2. **Payment Must Be Settled**

```typescript
paymentStatus: "settlement";
```

Tidak process transaction dengan status:

- ❌ `waiting_payment`
- ❌ `pending`
- ❌ `expired`
- ❌ `cancelled`

### 3. **Must Have Gamepass Data**

```typescript
"gamepass.price": { $exists: true }
```

Transaction harus punya:

- ✅ `gamepass.productId`
- ✅ `gamepass.price`
- ✅ `gamepass.sellerId`

### 4. **FIFO Queue System**

Transactions processed in order (oldest first):

- ✅ Fair to all customers
- ✅ Predictable behavior
- ✅ No cherry-picking

### 5. **Error Handling**

```typescript
.catch((error) => {
  console.error("Error in background auto-purchase:", error);
});
```

- Errors logged to console
- Don't affect admin UI
- Transaction stays pending for retry

---

## 🚀 **Admin Experience**

### Before:

```
1. Add stock account
2. Wait for response
3. Manually check pending transactions
4. Manually process each transaction
5. Wait for each purchase to complete
```

### After:

```
1. Add stock account
2. Get immediate response ✅
3. Auto-purchase runs in background 🤖
4. Check console logs for progress 📊
5. Refresh transaction list to see completed orders ✅
```

---

## 📊 **Monitoring**

### Check Auto-Purchase Progress:

1. **Console Logs:** Server terminal shows real-time progress
2. **Admin Transactions Page:** Refresh to see updated orderStatus
3. **Stock Account Robux:** Check remaining robux after automation

### Indicators:

- ✅ **Green logs:** Successful purchases
- ❌ **Red logs:** Failed purchases (transaction skipped)
- ⏳ **Yellow logs:** Waiting between purchases
- 🛑 **Stop log:** Insufficient robux

---

## ✅ **Status**

- ✅ Auto-purchase logic implemented
- ✅ Integrated with stock account routes
- ✅ Based on webhook automation reference
- ✅ 10 second delay between purchases
- ✅ Stop on insufficient robux
- ✅ Non-blocking background execution
- ✅ Comprehensive logging
- ✅ Error handling
- ✅ Ready for testing

---

**Implemented:** November 11, 2025  
**Feature:** Auto-Purchase Pending Robux 5 Hari on Stock Account Add/Update  
**Files:** `lib/auto-purchase-robux.ts`, `app/api/admin/stock-accounts/route.ts`, `app/api/admin/stock-accounts/[id]/route.ts`
