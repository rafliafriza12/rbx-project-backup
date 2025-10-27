# Reseller Order Status Automation

## 🎯 Feature: Auto-Complete Order on Successful Activation

Ketika pembayaran reseller package settlement dan reseller berhasil diaktifkan, order status otomatis menjadi **"completed"**. Jika gagal, order status menjadi **"pending"** dengan notes error.

---

## 📋 Implementation Details

### Webhook Logic (`/app/api/transactions/webhook/route.ts`)

**Location:** Lines 346-397

```typescript
// Activate reseller package if this is a reseller purchase
if (
  statusMapping.paymentStatus === "settlement" &&
  previousPaymentStatus !== "settlement" &&
  transaction.serviceType === "reseller"
) {
  try {
    console.log(
      "Processing reseller package activation for transaction:",
      transaction.invoiceId
    );
    const activationResult = await activateResellerPackage(transaction);

    if (activationResult) {
      // ✅ SUCCESS - Update order status to completed
      console.log(
        `✅ Reseller package activated: Tier ${activationResult.newTier} ` +
          `(${activationResult.packageName}), Discount: ${activationResult.discount}%, ` +
          `Expires: ${activationResult.expiryDate.toLocaleDateString("id-ID")}`
      );

      await transaction.updateStatus(
        "order",
        "completed",
        `Reseller Tier ${activationResult.newTier} berhasil diaktifkan hingga ` +
          `${activationResult.expiryDate.toLocaleDateString("id-ID")}`,
        null
      );
    } else {
      // ❌ FAILED - Update order status to pending
      console.log(
        "❌ Reseller package activation failed for transaction:",
        transaction.invoiceId
      );

      await transaction.updateStatus(
        "order",
        "pending",
        "Gagal mengaktifkan reseller package. Silakan hubungi admin.",
        null
      );
    }
  } catch (resellerError) {
    // ⚠️ ERROR - Update order status to pending with error message
    console.error("Error activating reseller package:", resellerError);

    await transaction.updateStatus(
      "order",
      "pending",
      `Error saat mengaktifkan reseller: ${
        resellerError instanceof Error ? resellerError.message : "Unknown error"
      }`,
      null
    );
  }
}
```

---

## 🔄 Flow Diagram

### Successful Activation:

```
Payment Settlement
↓
activateResellerPackage(transaction)
↓
✅ User updated with:
   - resellerTier
   - resellerExpiry
   - resellerPackageId
↓
Order Status: "completed" ✅
Customer Notes: "Reseller Tier X berhasil diaktifkan hingga DD/MM/YYYY"
↓
User dapat langsung menggunakan diskon reseller
```

### Failed Activation (Package Not Found):

```
Payment Settlement
↓
activateResellerPackage(transaction)
↓
❌ ResellerPackage not found in database
↓
Return null
↓
Order Status: "pending" ⏳
Customer Notes: "Gagal mengaktifkan reseller package. Silakan hubungi admin."
↓
Admin perlu manual intervention
```

### Failed Activation (User Not Found):

```
Payment Settlement
↓
activateResellerPackage(transaction)
↓
❌ User not found in database
↓
Return null
↓
Order Status: "pending" ⏳
Customer Notes: "Gagal mengaktifkan reseller package. Silakan hubungi admin."
↓
Admin perlu manual intervention
```

### Failed Activation (Error/Exception):

```
Payment Settlement
↓
activateResellerPackage(transaction)
↓
⚠️ Exception thrown (database error, etc.)
↓
Catch block
↓
Order Status: "pending" ⏳
Customer Notes: "Error saat mengaktifkan reseller: [error message]"
↓
Admin perlu check logs dan manual intervention
```

---

## 📊 Order Status Transitions

| Scenario              | Payment Status | Activation Result | Final Order Status | Customer Notes                                                |
| --------------------- | -------------- | ----------------- | ------------------ | ------------------------------------------------------------- |
| **Success**           | settlement     | ✅ Success        | **completed**      | "Reseller Tier X berhasil diaktifkan hingga DD/MM/YYYY"       |
| **Package Not Found** | settlement     | ❌ null           | **pending**        | "Gagal mengaktifkan reseller package. Silakan hubungi admin." |
| **User Not Found**    | settlement     | ❌ null           | **pending**        | "Gagal mengaktifkan reseller package. Silakan hubungi admin." |
| **Error/Exception**   | settlement     | ⚠️ Exception      | **pending**        | "Error saat mengaktifkan reseller: [error message]"           |
| **Payment Failed**    | failed         | -                 | **cancelled**      | "Payment failed"                                              |
| **Payment Expired**   | expired        | -                 | **cancelled**      | "Payment expired"                                             |

---

## 🎯 activateResellerPackage() Return Values

### Success Case:

```typescript
{
  previousTier: 0,  // or current tier if upgrading
  newTier: 3,
  packageName: "Raja",
  discount: 15,
  expiryDate: Date("2026-10-27")
}
```

### Failure Cases (returns `null`):

1. **Missing userId:** `transaction.customerInfo.userId` is null/undefined
2. **Missing serviceId:** `transaction.serviceId` is null/undefined
3. **User not found:** No user with that userId in database
4. **Package not found:** No ResellerPackage with that serviceId in database

---

## 🧪 Testing Scenarios

### 1. **Normal Successful Purchase:**

```
Steps:
1. User buys reseller package
2. Complete payment (sandbox Midtrans)
3. Webhook receives settlement notification
4. activateResellerPackage() executes successfully
5. User record updated with tier, expiry, packageId

Expected Result:
✅ Order Status: "completed"
✅ Customer Notes: "Reseller Tier 3 berhasil diaktifkan hingga 27/10/2026"
✅ User can see discount on next purchase
```

### 2. **Package Deleted After Purchase:**

```
Steps:
1. User buys reseller package
2. Admin deletes package from database (before payment)
3. User completes payment
4. Webhook tries to find package
5. Package not found → returns null

Expected Result:
⏳ Order Status: "pending"
⏳ Customer Notes: "Gagal mengaktifkan reseller package. Silakan hubungi admin."
⏳ Admin needs to manually assign tier
```

### 3. **User Account Deleted:**

```
Steps:
1. User buys reseller package
2. User account deleted (before payment settles)
3. Webhook tries to find user
4. User not found → returns null

Expected Result:
⏳ Order Status: "pending"
⏳ Customer Notes: "Gagal mengaktifkan reseller package. Silakan hubungi admin."
⏳ May need refund
```

### 4. **Database Error:**

```
Steps:
1. User buys reseller package
2. Payment settles
3. Database connection error during user.save()
4. Exception thrown

Expected Result:
⏳ Order Status: "pending"
⏳ Customer Notes: "Error saat mengaktifkan reseller: MongoError: connection timeout"
⏳ Admin checks logs and retries
```

---

## 📝 Admin Action Required

Ketika order status reseller = "pending" setelah payment settlement:

### Check Logs:

```bash
# Look for error messages
grep "Reseller package activation failed" logs.txt
grep "Error activating reseller package" logs.txt

# Check what went wrong
- Missing userId or serviceId?
- User not found?
- Package not found?
- Database error?
```

### Manual Intervention:

```javascript
// 1. Find the transaction
const transaction = await Transaction.findOne({ invoiceId: "INV-..." });

// 2. Check payment status
console.log(transaction.paymentStatus); // Should be "settlement"

// 3. Find user
const user = await User.findById(transaction.customerInfo.userId);

// 4. Find package
const pkg = await ResellerPackage.findById(transaction.serviceId);

// 5. Manually activate
if (user && pkg) {
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + pkg.duration);

  user.resellerTier = pkg.tier;
  user.resellerExpiry = expiryDate;
  user.resellerPackageId = pkg._id;
  await user.save();

  // Update transaction
  await transaction.updateStatus(
    "order",
    "completed",
    `Reseller Tier ${pkg.tier} diaktifkan secara manual oleh admin`,
    null
  );
}
```

---

## 🔍 Database Queries for Monitoring

### Find pending reseller orders after payment:

```javascript
db.transactions.find({
  serviceType: "reseller",
  paymentStatus: "settlement",
  orderStatus: "pending",
});
```

### Find completed reseller orders:

```javascript
db.transactions.find({
  serviceType: "reseller",
  paymentStatus: "settlement",
  orderStatus: "completed",
});
```

### Check activation rate:

```javascript
// Total settled reseller payments
const total = db.transactions.countDocuments({
  serviceType: "reseller",
  paymentStatus: "settlement",
});

// Successfully activated
const completed = db.transactions.countDocuments({
  serviceType: "reseller",
  paymentStatus: "settlement",
  orderStatus: "completed",
});

// Activation rate
const rate = (completed / total) * 100;
console.log(`Activation Rate: ${rate}%`);
```

---

## ✅ Benefits

1. **Automatic Processing:** No manual intervention needed for successful activations
2. **Clear Status:** Admin can easily identify failed activations (orderStatus = "pending")
3. **Error Messages:** Detailed notes explain why activation failed
4. **User Experience:** Users immediately get their reseller status on successful payment
5. **Audit Trail:** All status changes logged with timestamps and notes

---

## 🎉 Result

✅ Reseller activation berhasil → Order otomatis "completed"
⏳ Reseller activation gagal → Order otomatis "pending" dengan notes
📝 Admin dapat dengan mudah identify dan resolve failed activations
🚀 User langsung dapat menggunakan diskon reseller setelah payment settlement

---

**Created:** 2025-10-27  
**Feature:** Auto-complete reseller orders on successful activation  
**Status:** ✅ IMPLEMENTED - Ready for Testing
