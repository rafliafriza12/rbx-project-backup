# Auto-Purchase Update: Menggunakan Endpoint /api/buy-pass ✅

## 🔄 **Changes Made**

### Problem:

- ❌ Fungsi `purchaseGamepass()` langsung call Roblox API
- ❌ Duplikasi logic (sudah ada di `/api/buy-pass`)
- ❌ Tidak konsisten dengan webhook automation
- ❌ Lebih susah di-maintain (2 tempat untuk update logic)

### Solution:

- ✅ Gunakan endpoint `/api/buy-pass` yang sudah ada
- ✅ Konsisten dengan webhook automation
- ✅ Single source of truth untuk purchase logic
- ✅ Lebih mudah di-maintain

---

## 📝 **Updated Function**

### Before (Direct Roblox API Call):

```typescript
async function purchaseGamepass(
  robloxCookie: string,
  productId: number,
  price: number,
  sellerId: number
) {
  // 1️⃣ Get CSRF token from /v2/logout
  const csrfRes = await fetch("https://auth.roblox.com/v2/logout", {
    method: "POST",
    headers: { Cookie: `.ROBLOSECURITY=${robloxCookie};` },
  });
  const csrfToken = csrfRes.headers.get("x-csrf-token");

  // 2️⃣ Purchase product
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

### After (Using Endpoint):

```typescript
async function purchaseGamepass(
  robloxCookie: string,
  productId: number,
  price: number,
  sellerId: number
) {
  console.log("Attempting to purchase gamepass via API:", {
    productId,
    price,
    sellerId,
  });

  // Use the /api/buy-pass endpoint (same as webhook)
  const purchaseResponse = await fetch(
    `${
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    }/api/buy-pass`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        robloxCookie,
        productId,
        price,
        sellerId,
      }),
    }
  );

  const purchaseResult = await purchaseResponse.json();

  if (purchaseResult.success) {
    console.log("Gamepass purchase successful via API");
    return { success: true };
  } else {
    console.error("Gamepass purchase failed:", purchaseResult.message);
    return {
      success: false,
      error: purchaseResult.message || "Purchase failed",
    };
  }
}
```

---

## ✅ **Verification: Auto-Purchase Triggers**

### 1. **POST Route** (Add Stock Account)

```typescript
// /app/api/admin/stock-accounts/route.ts

export async function POST(req: NextRequest) {
  // ... validate cookie, get user info, get robux ...

  const stockAccount = new StockAccount({
    userId: user.id,
    username: user.name,
    displayName: user.displayName,
    robloxCookie,
    robux: robuxData.robux ?? 0,
    status: "active",
    lastChecked: new Date(),
  });

  await stockAccount.save();

  // ✅ TRIGGER AUTO-PURCHASE
  console.log("🚀 Triggering auto-purchase for pending transactions...");
  autoPurchasePendingRobux(stockAccount._id.toString()).catch((error) => {
    console.error("Error in background auto-purchase:", error);
  });

  return NextResponse.json({
    success: true,
    message:
      "Stock account berhasil ditambahkan. Auto-purchase dimulai untuk transaksi pending.",
    stockAccount,
  });
}
```

**Trigger Conditions:**

- ✅ Admin add new stock account
- ✅ Cookie valid
- ✅ Stock account saved to database
- ✅ Auto-purchase runs in background

---

### 2. **PUT Route** (Update Stock Account)

```typescript
// /app/api/admin/stock-accounts/[id]/route.ts

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // ... validate cookie, get user info, get robux ...

  const updatedAccount = await StockAccount.findByIdAndUpdate(
    id,
    {
      userId: user.id,
      username: user.name,
      displayName: user.displayName,
      robloxCookie,
      robux: robuxData.robux ?? 0,
      lastChecked: new Date(),
    },
    { new: true }
  );

  if (!updatedAccount) {
    return NextResponse.json(
      { success: false, message: "Stock account tidak ditemukan" },
      { status: 404 }
    );
  }

  // ✅ TRIGGER AUTO-PURCHASE
  console.log("🚀 Triggering auto-purchase for pending transactions...");
  autoPurchasePendingRobux(updatedAccount._id.toString()).catch((error) => {
    console.error("Error in background auto-purchase:", error);
  });

  return NextResponse.json({
    success: true,
    message:
      "Stock account berhasil diperbarui. Auto-purchase dimulai untuk transaksi pending.",
    stockAccount: updatedAccount,
  });
}
```

**Trigger Conditions:**

- ✅ Admin update stock account cookie
- ✅ Cookie valid
- ✅ Stock account updated in database
- ✅ Auto-purchase runs in background

---

## 🎯 **Benefits of Using Endpoint**

### 1. **Consistency**

```
Webhook: /api/buy-pass ✅
Auto-Purchase: /api/buy-pass ✅
Manual Purchase: /api/buy-pass ✅
```

**Semua menggunakan endpoint yang sama!**

### 2. **Maintainability**

```
Jika ada perubahan logic purchase:
❌ Before: Update di 2 tempat (webhook + auto-purchase)
✅ After: Update di 1 tempat (/api/buy-pass)
```

### 3. **Error Handling**

```
/api/buy-pass sudah handle:
- CSRF token
- Purchase API call
- Error responses
- Logging
```

### 4. **Reusability**

```
/api/buy-pass bisa digunakan dari:
- Webhook automation ✅
- Auto-purchase on stock update ✅
- Manual purchase (future) ✅
- Retry mechanism (future) ✅
```

---

## 📊 **Flow Comparison**

### Webhook Automation:

```
Payment Settlement
↓
Webhook triggered
↓
Find suitable stock account
↓
🔹 Call /api/buy-pass endpoint
↓
Update transaction status
```

### Auto-Purchase on Stock Update:

```
Admin add/update stock account
↓
Validate cookie & save
↓
Find pending transactions
↓
For each transaction:
  🔹 Call /api/buy-pass endpoint
  ↓
  Update transaction status
  ↓
  Wait 10 seconds
```

**Both use same endpoint: `/api/buy-pass` ✅**

---

## 🧪 **Testing Flow**

### Test 1: Add Stock Account

```bash
# 1. Admin navigates to /admin/users, tab "Stock"
# 2. Click "Add Stock Account"
# 3. Paste Roblox cookie
# 4. Submit

Expected Console Logs:
✅ "Stock account validation successful"
✅ "Stock account saved to database"
✅ "🚀 Triggering auto-purchase for pending transactions..."
✅ "📋 Found X pending robux_5_hari transactions from last 5 days"
✅ "Attempting to purchase gamepass via API: { productId, price, sellerId }"
✅ "Gamepass purchase successful via API"
✅ "✅ Transaction INV-XXX completed successfully"
```

### Test 2: Update Stock Account

```bash
# 1. Admin clicks "Update" on existing stock account
# 2. Cookie gets re-validated (robux updated)
# 3. Submit

Expected Console Logs:
✅ "Stock account updated successfully"
✅ "🚀 Triggering auto-purchase for pending transactions..."
✅ (same as Test 1)
```

---

## 🔍 **Request Flow Example**

```
Admin Update Stock Account
↓
PUT /api/admin/stock-accounts/{id}
  - Validate cookie ✅
  - Update robux balance ✅
  - Save to database ✅
  - Return response ✅ (admin sees success immediately)
↓
Background: autoPurchasePendingRobux()
  - Query pending transactions ✅
  - For each transaction:
    ↓
    POST /api/buy-pass
      - Get CSRF token ✅
      - Purchase gamepass ✅
      - Return result ✅
    ↓
    Update transaction status ✅
    ↓
    Wait 10 seconds ⏳
    ↓
    Next transaction
```

---

## ✅ **Confirmation**

### Auto-Purchase Triggers:

- ✅ **POST /api/admin/stock-accounts** (Add new account)
- ✅ **PUT /api/admin/stock-accounts/[id]** (Update existing account)

### Purchase Logic:

- ✅ Uses `/api/buy-pass` endpoint
- ✅ Consistent with webhook
- ✅ Single source of truth
- ✅ No code duplication

### Background Execution:

- ✅ Non-blocking (admin gets immediate response)
- ✅ Error handling with catch
- ✅ Comprehensive logging

### Status Updates:

- ✅ Transaction `orderStatus` → "completed"
- ✅ Transaction `statusHistory` updated
- ✅ Stock account `robux` deducted
- ✅ Stock account `lastChecked` updated

---

## 🎉 **Summary**

### Changes:

1. ✅ Updated `purchaseGamepass()` to use `/api/buy-pass` endpoint
2. ✅ Removed direct Roblox API calls
3. ✅ Consistent with webhook automation
4. ✅ Verified trigger in POST route (add stock)
5. ✅ Verified trigger in PUT route (update stock)

### Result:

- ✅ More efficient (reuse existing endpoint)
- ✅ More maintainable (single source of truth)
- ✅ More consistent (same logic everywhere)
- ✅ Ready for production testing

---

**Updated:** November 11, 2025  
**Changes:** Use /api/buy-pass endpoint instead of direct Roblox API  
**Verified:** Auto-purchase triggers on both add and update stock account
