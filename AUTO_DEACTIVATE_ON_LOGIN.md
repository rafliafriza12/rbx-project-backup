# Auto-Deactivate Expired Reseller on Login ✅

## 🎯 Update: Real-Time Deactivation

Sistem sekarang **otomatis menon-aktifkan reseller tier yang expired** saat user login atau mengakses API auth. Tidak perlu cron job eksternal!

---

## ✅ **Yang Sudah Diimplementasikan:**

### 1. **Login Route** (`/app/api/auth/login/route.ts`)

**Kapan:** Setiap kali user login dengan email/password

```typescript
// Auto-deactivate expired reseller tier on login
if (
  user.resellerTier &&
  user.resellerExpiry &&
  new Date(user.resellerExpiry) < new Date()
) {
  console.log(
    `🔄 Auto-deactivating expired reseller for user ${user.email}: ` +
      `Tier ${user.resellerTier} expired on ${user.resellerExpiry}`
  );

  user.resellerTier = null;
  user.resellerExpiry = null;
  user.resellerPackageId = null;
  await user.save();

  console.log(`✅ Reseller tier deactivated for user ${user.email}`);
}
```

### 2. **Auth Me Route** (`/app/api/auth/me/route.ts`)

**Kapan:** Setiap kali frontend fetch user data (page load, refresh)

```typescript
// Auto-deactivate expired reseller tier
if (
  user.resellerTier &&
  user.resellerExpiry &&
  new Date(user.resellerExpiry) < new Date()
) {
  // ... same deactivation logic
}
```

### 3. **Google Login Route** (`/app/api/auth/google/route.ts`)

**Kapan:** Setiap kali user login dengan Google OAuth

```typescript
// Auto-deactivate expired reseller tier
if (
  user.resellerTier &&
  user.resellerExpiry &&
  new Date(user.resellerExpiry) < new Date()
) {
  // ... same deactivation logic with validateBeforeSave: false
}
```

---

## 🔄 **Flow Lengkap:**

### Scenario 1: User Login (Expired)

```
User: Tier 2, Expiry: 2025-10-01 (EXPIRED)
↓
User login dengan email/password
↓
Backend checks: resellerExpiry < current date? ✅ YES
↓
Auto-deactivate:
  - resellerTier: 2 → null
  - resellerExpiry: 2025-10-01 → null
  - resellerPackageId: xxx → null
↓
Console log: "✅ Reseller tier deactivated for user xxx@example.com"
↓
User response: resellerTier = null, diskon = 0
↓
Frontend: User sees NO reseller badge, NO discount
```

### Scenario 2: Page Refresh/Load (Expired)

```
User logged in, page loads
↓
Frontend calls: GET /api/auth/me
↓
Backend checks: resellerExpiry < current date? ✅ YES
↓
Auto-deactivate (same as above)
↓
User data updated in real-time
```

### Scenario 3: Google Login (Expired)

```
User login via Google
↓
Backend checks: resellerExpiry < current date? ✅ YES
↓
Auto-deactivate with validateBeforeSave: false
↓
OAuth login succeeds with clean reseller data
```

### Scenario 4: Active Reseller (Not Expired)

```
User: Tier 3, Expiry: 2026-12-31 (ACTIVE)
↓
User login
↓
Backend checks: resellerExpiry < current date? ❌ NO
↓
Skip deactivation
↓
Get discount from ResellerPackage
↓
User response: resellerTier = 3, diskon = 15%
↓
Frontend: User sees Tier 3 badge, gets 15% discount ✅
```

---

## 📊 **Comparison: Before vs After**

| Feature               | Before                     | After                      |
| --------------------- | -------------------------- | -------------------------- |
| **Discount Check**    | ✅ Runtime (0% if expired) | ✅ Runtime (0% if expired) |
| **Tier Reset**        | ❌ Manual only             | ✅ Auto on login/auth      |
| **Database Cleanup**  | ❌ Stale data remains      | ✅ Auto cleanup on access  |
| **Cron Job Required** | ⚠️ Yes (optional)          | ❌ No longer needed        |
| **Real-time**         | ❌ Delayed until cron      | ✅ Immediate on login      |

---

## 🎯 **Advantages:**

### ✅ **Automatic & Real-time**

- User yang expired langsung di-reset saat login
- Tidak perlu tunggu cron job berjalan
- Database selalu up-to-date

### ✅ **No External Dependencies**

- Tidak perlu setup cron service eksternal
- Tidak perlu Vercel Pro untuk Vercel Cron
- Tidak perlu monitoring cron job

### ✅ **Efficient**

- Hanya process user yang memang login/akses
- Tidak scan seluruh database sekaligus
- Resource-efficient

### ✅ **Immediate Feedback**

- User langsung tahu tier mereka expired
- Admin tidak perlu manual intervention
- Clean user experience

---

## 🧪 **Testing:**

### Test 1: Login dengan Expired Tier

```bash
# Setup: Create user with expired tier in MongoDB
db.users.updateOne(
  { email: "test@example.com" },
  {
    $set: {
      resellerTier: 2,
      resellerExpiry: new Date("2025-01-01"), // Already expired
      resellerPackageId: ObjectId("...")
    }
  }
)

# Test: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Expected Response:
{
  "user": {
    "resellerTier": null,  // ✅ Auto-reset
    "resellerExpiry": null,
    "diskon": 0
  }
}

# Check Logs:
🔄 Auto-deactivating expired reseller for user test@example.com: Tier 2 expired on 2025-01-01
✅ Reseller tier deactivated for user test@example.com
```

### Test 2: Page Load dengan Expired Tier

```bash
# User already logged in, refresh page
# Frontend calls: GET /api/auth/me

curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>"

# Expected: Same auto-deactivation if expired
```

### Test 3: Active Tier (Should NOT Deactivate)

```bash
# Setup: User with active tier
db.users.updateOne(
  { email: "active@example.com" },
  {
    $set: {
      resellerTier: 3,
      resellerExpiry: new Date("2026-12-31"), // Future date
      resellerPackageId: ObjectId("...")
    }
  }
)

# Test: Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"active@example.com","password":"password123"}'

# Expected Response:
{
  "user": {
    "resellerTier": 3,  // ✅ NOT changed
    "resellerExpiry": "2026-12-31T00:00:00.000Z",
    "diskon": 15  // Based on package
  }
}

# No deactivation logs
```

---

## 📝 **Database Before & After:**

### Before Login (Expired):

```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  resellerTier: 2,
  resellerExpiry: ISODate("2025-01-01T00:00:00.000Z"),
  resellerPackageId: ObjectId("...")
}
```

### After Login (Auto-Deactivated):

```javascript
{
  _id: ObjectId("..."),
  email: "user@example.com",
  resellerTier: null,  // ✅ Reset
  resellerExpiry: null,  // ✅ Reset
  resellerPackageId: null  // ✅ Reset
}
```

---

## 🔍 **Monitoring:**

### Check Logs for Auto-Deactivations:

```bash
# In server logs, look for:
🔄 Auto-deactivating expired reseller for user xxx@example.com: Tier X expired on YYYY-MM-DD
✅ Reseller tier deactivated for user xxx@example.com
```

### Query Expired Resellers (Before Cleanup):

```javascript
// Find users with expired tiers (before they login)
db.users.find({
  resellerTier: { $ne: null },
  resellerExpiry: { $lt: new Date() },
});
```

---

## ⚠️ **Important Notes:**

### 1. **Lazy Cleanup:**

- Only cleans up when user logs in or accesses auth endpoints
- Users yang tidak pernah login tetap punya stale data
- **Optional:** Masih bisa jalankan cron job sekali-sekali untuk cleanup bulk

### 2. **Multiple Login Points:**

- Email/Password login ✅
- Google OAuth login ✅
- Token refresh (/api/auth/me) ✅

### 3. **Performance:**

- Minimal impact - hanya 1 extra check per auth request
- Only saves if tier is actually expired
- No unnecessary database queries

---

## 🎉 **Result:**

### Before:

```
User expired → Login → Discount = 0% (runtime check)
                    → resellerTier still shows "2" in DB
                    → Admin needs to manually reset or wait for cron
```

### After:

```
User expired → Login → Auto-deactivate ✅
                    → resellerTier = null in DB ✅
                    → Discount = 0% ✅
                    → Clean data immediately ✅
```

---

## ✅ **Status:**

- ✅ **Login Route:** Auto-deactivate implemented
- ✅ **Auth Me Route:** Auto-deactivate implemented
- ✅ **Google Login Route:** Auto-deactivate implemented
- ✅ **No External Dependencies:** Works standalone
- ✅ **Real-time:** Immediate on user access
- ✅ **Tested:** No compilation errors
- 🎯 **Ready for Production:** Deploy and test!

---

**Updated:** 2025-10-28  
**Feature:** Real-time auto-deactivate on login/auth  
**Status:** ✅ IMPLEMENTED - No Cron Needed!
