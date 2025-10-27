# Fix: Admin Cannot Set User to "No Reseller"

## 🐛 Problem

Error terjadi ketika admin mencoba mengubah user dari reseller menjadi "no reseller":

```
Update user error: Error: Validation failed: resellerTier: Path `resellerTier` (0) is less than minimum allowed value (1).
```

**Root Cause:**

- Frontend mengirim `resellerTier: 0` untuk "no reseller"
- User model memiliki validasi `min: 1` untuk `resellerTier`
- API menyimpan nilai 0, yang gagal validasi

---

## ✅ Solution

### 1. **User Model** (`/models/User.ts`)

**Before:**

```typescript
resellerTier: {
  type: Number,
  min: 1,
  max: 3,
},
resellerExpiry: {
  type: Date,
},
```

**After:**

```typescript
resellerTier: {
  type: Number,
  min: [1, "Tier reseller harus antara 1-3"],
  max: [3, "Tier reseller harus antara 1-3"],
  default: null,  // ✅ Allow null for "no reseller"
},
resellerExpiry: {
  type: Date,
  default: null,  // ✅ Allow null
},
```

**Changes:**

- ✅ Added `default: null` untuk mengizinkan user tanpa reseller tier
- ✅ Added error messages untuk validasi min/max
- ✅ `resellerExpiry` juga set default null

---

### 2. **Admin Users API** (`/app/api/admin/users/[id]/route.ts`)

**Before:**

```typescript
if (resellerTier !== undefined) updateData.resellerTier = resellerTier || 0;
```

**After:**

```typescript
// For resellerTier: 0 means "no reseller", so set to null
// Only set if value is between 1-3, otherwise set to null
if (resellerTier !== undefined) {
  updateData.resellerTier = resellerTier > 0 ? resellerTier : null;
}
```

**Changes:**

- ✅ Ketika `resellerTier` adalah 0 (no reseller), simpan sebagai `null` bukan `0`
- ✅ Hanya simpan nilai jika > 0 (tier 1, 2, atau 3)
- ✅ Nilai 0 atau negatif akan di-convert ke `null`

---

## 🔄 Flow Comparison

### Before (❌ Failed):

```
Admin selects "No Reseller" → Frontend sends resellerTier: 0 →
API saves 0 → Mongoose validation fails (min: 1) → Error 400
```

### After (✅ Success):

```
Admin selects "No Reseller" → Frontend sends resellerTier: 0 →
API converts to null → Mongoose accepts null → Success 200 →
User has no reseller tier (resellerTier: null)
```

---

## 📋 Test Cases

### 1. **Set User to "No Reseller"**

```typescript
// Request
PUT /api/admin/users/:id
{
  "resellerTier": 0  // or null
}

// Expected Result
{
  "resellerTier": null,
  "resellerExpiry": null,
  "resellerPackageId": null
}
```

### 2. **Set User to Tier 1**

```typescript
// Request
PUT /api/admin/users/:id
{
  "resellerTier": 1,
  "resellerExpiry": "2026-10-27",
  "resellerPackageId": "packageId123"
}

// Expected Result
{
  "resellerTier": 1,
  "resellerExpiry": "2026-10-27T00:00:00.000Z",
  "resellerPackageId": "packageId123"
}
```

### 3. **Set User to Tier 2**

```typescript
// Request
PUT /api/admin/users/:id
{
  "resellerTier": 2,
  "resellerExpiry": "2026-10-27",
  "resellerPackageId": "packageId123"
}

// Expected Result
{
  "resellerTier": 2,
  "resellerExpiry": "2026-10-27T00:00:00.000Z",
  "resellerPackageId": "packageId123"
}
```

### 4. **Set User to Tier 3**

```typescript
// Request
PUT /api/admin/users/:id
{
  "resellerTier": 3,
  "resellerExpiry": "2026-10-27",
  "resellerPackageId": "packageId123"
}

// Expected Result
{
  "resellerTier": 3,
  "resellerExpiry": "2026-10-27T00:00:00.000Z",
  "resellerPackageId": "packageId123"
}
```

### 5. **Invalid Tier (should fail)**

```typescript
// Request
PUT /api/admin/users/:id
{
  "resellerTier": 4  // Invalid, max is 3
}

// Expected Result (400 Error)
{
  "error": "Tier reseller harus antara 1-3"
}
```

---

## 🎯 Behavior Summary

| Frontend Value | API Converts To | Database Saves | Meaning          |
| -------------- | --------------- | -------------- | ---------------- |
| `0`            | `null`          | `null`         | No reseller      |
| `null`         | `null`          | `null`         | No reseller      |
| `undefined`    | (skip)          | (unchanged)    | Don't update     |
| `1`            | `1`             | `1`            | Tier 1 reseller  |
| `2`            | `2`             | `2`            | Tier 2 reseller  |
| `3`            | `3`             | `3`            | Tier 3 reseller  |
| `4+`           | (rejected)      | ❌             | Validation error |

---

## 🔍 Database Query Examples

### Find all users with NO reseller tier:

```javascript
db.users.find({
  $or: [{ resellerTier: null }, { resellerTier: { $exists: false } }],
});
```

### Find all users with ANY reseller tier:

```javascript
db.users.find({
  resellerTier: { $ne: null, $exists: true },
});
```

### Find users by specific tier:

```javascript
// Tier 1
db.users.find({ resellerTier: 1 });

// Tier 2
db.users.find({ resellerTier: 2 });

// Tier 3
db.users.find({ resellerTier: 3 });
```

### Find active resellers (not expired):

```javascript
db.users.find({
  resellerTier: { $ne: null, $exists: true },
  resellerExpiry: { $gt: new Date() },
});
```

---

## 🧪 Manual Testing Steps

1. **Test "No Reseller" Assignment:**

   ```
   1. Login as admin
   2. Go to Users management page
   3. Select a user who is currently a reseller
   4. Change "Reseller Tier" dropdown to "No Reseller"
   5. Click Save
   6. Verify: No error, user updated successfully
   7. Check database: resellerTier should be null
   ```

2. **Test Tier Assignment:**

   ```
   1. Select a user with no reseller tier
   2. Change "Reseller Tier" to "Tier 1", "Tier 2", or "Tier 3"
   3. Set expiry date
   4. Click Save
   5. Verify: User updated with correct tier and expiry
   ```

3. **Test Tier Change:**

   ```
   1. Select a user with Tier 1
   2. Change to Tier 2
   3. Click Save
   4. Verify: Tier updated correctly
   ```

4. **Test Database Direct Check:**

   ```javascript
   // In MongoDB shell or Compass
   db.users.findOne({ email: "test@example.com" })

   // Should see:
   {
     resellerTier: null,  // or 1, 2, 3
     resellerExpiry: null, // or Date
     resellerPackageId: null, // or ObjectId
   }
   ```

---

## 📝 Frontend Notes

Frontend (admin interface) should handle:

### Dropdown Options:

```typescript
const resellerTierOptions = [
  { value: 0, label: "No Reseller" }, // Will be converted to null
  { value: 1, label: "Tier 1 - Bronze" },
  { value: 2, label: "Tier 2 - Silver" },
  { value: 3, label: "Tier 3 - Gold" },
];
```

### Display Logic:

```typescript
// Display current tier
const displayTier = user.resellerTier
  ? `Tier ${user.resellerTier}`
  : "No Reseller";

// Check if active reseller
const isActiveReseller =
  user.resellerTier &&
  user.resellerExpiry &&
  new Date(user.resellerExpiry) > new Date();
```

---

## ✅ Validation Rules

1. **resellerTier:**

   - Allowed: `null`, `1`, `2`, `3`
   - Not allowed: `0`, `4+`, negative numbers
   - Default: `null`

2. **resellerExpiry:**

   - Allowed: `null`, valid Date
   - Should be null when resellerTier is null
   - Should be future date when resellerTier exists

3. **resellerPackageId:**
   - Allowed: `null`, valid ObjectId
   - Should be null when resellerTier is null
   - Should reference ResellerPackage when resellerTier exists

---

## 🎉 Result

✅ Admin dapat set user ke "No Reseller" tanpa error
✅ Validasi tetap berfungsi untuk tier 1-3
✅ Database consistency terjaga (null untuk non-reseller)
✅ Error messages lebih jelas

---

**Created:** 2025-10-27  
**Status:** ✅ FIXED - Ready for Testing
