# Auto-Deactivate Expired Reseller Tiers

## 🎯 Overview

Sistem sudah memiliki **dua layer protection** untuk reseller yang expired:

1. **✅ Runtime Check (Already Implemented):** Discount tidak berlaku jika expired
2. **🆕 Database Cleanup (New):** Auto-deactivate tier yang expired

---

## 📋 Current System Behavior

### Layer 1: Runtime Check (Already Working ✅)

**Location:** `/app/api/auth/me/route.ts` (lines 40-56)

```typescript
// Get reseller discount if user has active reseller package
let resellerDiscount = 0;
if (
  user.resellerPackageId &&
  user.resellerExpiry &&
  new Date(user.resellerExpiry) > new Date() // ✅ Check if not expired
) {
  const resellerPackage = await ResellerPackage.findById(
    user.resellerPackageId
  );
  if (resellerPackage) {
    resellerDiscount = resellerPackage.discount;
  }
}
```

**What it does:**

- ✅ Checks expiry date on EVERY login/auth request
- ✅ Only applies discount if `resellerExpiry > current date`
- ✅ Expired resellers automatically get 0% discount

**Limitation:**

- ❌ `resellerTier` field still shows tier number (not reset to null)
- ❌ Database contains "zombie" expired reseller records
- ❌ No admin notification about expired accounts

---

## 🆕 New Feature: Auto-Deactivate Cron Job

### API Endpoint

**File:** `/app/api/cron/deactivate-expired-resellers/route.ts`

#### 1. POST - Deactivate Expired Resellers

**URL:** `POST /api/cron/deactivate-expired-resellers`

**What it does:**

1. Find all users with `resellerExpiry < current date`
2. Reset their fields to null:
   - `resellerTier = null`
   - `resellerExpiry = null`
   - `resellerPackageId = null`
3. Log each deactivation
4. Return list of deactivated users

**Response:**

```json
{
  "success": true,
  "message": "Successfully deactivated 5 expired reseller accounts",
  "totalProcessed": 5,
  "deactivatedUsers": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "previousTier": 2,
      "expiredDate": "2025-09-27T00:00:00.000Z",
      "deactivatedAt": "2025-10-28T10:00:00.000Z"
    }
  ]
}
```

#### 2. GET - Check Expired Resellers (Preview)

**URL:** `GET /api/cron/deactivate-expired-resellers`

**What it does:**

- Find expired resellers WITHOUT deactivating them
- Useful for monitoring and preview before running deactivation

**Response:**

```json
{
  "success": true,
  "totalExpired": 5,
  "expiredResellers": [
    {
      "userId": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "tier": 2,
      "expiredDate": "2025-09-27T00:00:00.000Z",
      "daysExpired": 31
    }
  ]
}
```

---

## 🔄 Complete Flow

### Before Expiry:

```
User buys Tier 2 (12 months)
↓
Payment settlement
↓
resellerTier = 2
resellerExpiry = 2026-10-27
resellerPackageId = pkg._id
↓
User gets 10% discount on purchases ✅
```

### After Expiry (Automatic):

```
Date: 2026-10-28 (1 day after expiry)
↓
User tries to checkout
↓
Runtime Check:
  - resellerExpiry (2026-10-27) < current date (2026-10-28)? ✅ YES
  - resellerDiscount = 0 (no discount applied)
↓
User sees 0% discount ✅

Daily Cron Job runs:
↓
POST /api/cron/deactivate-expired-resellers
↓
Find user with expired tier
↓
Reset fields:
  - resellerTier: 2 → null
  - resellerExpiry: 2026-10-27 → null
  - resellerPackageId: pkg._id → null
↓
Database cleaned ✅
```

---

## 🚀 Setup Cron Job

### Option 1: External Cron Service (Recommended for Production)

**Services you can use:**

- **cron-job.org** (Free)
- **EasyCron** (Free tier available)
- **GitHub Actions** (Free for public repos)

**Setup Example (cron-job.org):**

```
1. Go to cron-job.org
2. Create account
3. Add new cron job:
   - URL: https://your-domain.com/api/cron/deactivate-expired-resellers
   - Method: POST
   - Schedule: Daily at 00:00 (midnight)
   - Timezone: Asia/Jakarta
```

### Option 2: Vercel Cron (Vercel Pro/Enterprise only)

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/deactivate-expired-resellers",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Note:** Requires Vercel Pro or Enterprise plan

### Option 3: Server Cron (Self-Hosted)

**Add to crontab:**

```bash
# Run daily at midnight
0 0 * * * curl -X POST https://your-domain.com/api/cron/deactivate-expired-resellers

# Or with more logging
0 0 * * * curl -X POST https://your-domain.com/api/cron/deactivate-expired-resellers >> /var/log/reseller-deactivate.log 2>&1
```

### Option 4: Manual Trigger (Testing)

**Via curl:**

```bash
# Check expired resellers (preview)
curl https://your-domain.com/api/cron/deactivate-expired-resellers

# Deactivate expired resellers
curl -X POST https://your-domain.com/api/cron/deactivate-expired-resellers
```

**Via Postman:**

```
GET  https://your-domain.com/api/cron/deactivate-expired-resellers
POST https://your-domain.com/api/cron/deactivate-expired-resellers
```

---

## 🧪 Testing Scenarios

### 1. **Test with Expired Account**

**Setup:**

```javascript
// In MongoDB, create test user with expired tier
db.users.insertOne({
  email: "test-expired@example.com",
  firstName: "Test",
  lastName: "User",
  password: "hashed_password",
  resellerTier: 2,
  resellerExpiry: new Date("2025-01-01"), // Already expired
  resellerPackageId: ObjectId("..."),
});
```

**Test:**

```bash
# 1. Check expired resellers
curl https://localhost:3000/api/cron/deactivate-expired-resellers
# Should show 1 expired reseller

# 2. Deactivate
curl -X POST https://localhost:3000/api/cron/deactivate-expired-resellers
# Should deactivate successfully

# 3. Verify in database
db.users.findOne({ email: "test-expired@example.com" })
# Should have resellerTier: null
```

### 2. **Test Runtime Check (Login)**

**Steps:**

```
1. Login as user with expired tier
2. Go to checkout page
3. Try to buy something
4. Verify discount = 0%
5. Check response from /api/auth/me
6. Verify diskon field = 0
```

### 3. **Test Non-Expired Account (Should Not Deactivate)**

**Setup:**

```javascript
db.users.insertOne({
  email: "test-active@example.com",
  // ...
  resellerTier: 3,
  resellerExpiry: new Date("2026-12-31"), // Future date
  resellerPackageId: ObjectId("..."),
});
```

**Test:**

```bash
curl -X POST https://localhost:3000/api/cron/deactivate-expired-resellers
# Should NOT deactivate this user
# Response should show 0 deactivations
```

---

## 📊 Monitoring

### Daily Monitoring Checklist:

**1. Check Expired Count:**

```bash
curl https://your-domain.com/api/cron/deactivate-expired-resellers | jq '.totalExpired'
```

**2. View Expired List:**

```bash
curl https://your-domain.com/api/cron/deactivate-expired-resellers | jq '.expiredResellers'
```

**3. Database Query:**

```javascript
// Count expired resellers
db.users.countDocuments({
  resellerTier: { $ne: null },
  resellerExpiry: { $lt: new Date() },
});

// View details
db.users
  .find({
    resellerTier: { $ne: null },
    resellerExpiry: { $lt: new Date() },
  })
  .pretty();
```

---

## 🔐 Security

### Authentication (Optional - Recommended for Production)

Add API key authentication to prevent unauthorized access:

**Update route.ts:**

```typescript
export async function POST(request: NextRequest) {
  // Check API key
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.CRON_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... rest of code
}
```

**Update cron job:**

```bash
curl -X POST \
  -H "x-api-key: your-secret-key" \
  https://your-domain.com/api/cron/deactivate-expired-resellers
```

---

## 📝 Summary

| Feature             | Status         | Description                 |
| ------------------- | -------------- | --------------------------- |
| **Runtime Check**   | ✅ Implemented | Discount = 0 if expired     |
| **Auto-Deactivate** | 🆕 New         | Reset tier to null via cron |
| **Monitoring**      | ✅ Included    | GET endpoint for preview    |
| **Logging**         | ✅ Included    | Console logs for tracking   |

### What happens when reseller expires:

| Timing                         | resellerTier | resellerExpiry | Discount Applied | Database State |
| ------------------------------ | ------------ | -------------- | ---------------- | -------------- |
| **Before expiry**              | 2            | 2026-10-27     | 10% ✅           | Active         |
| **Just expired (before cron)** | 2            | 2026-10-27     | 0% ✅            | Stale data     |
| **After cron runs**            | null         | null           | 0% ✅            | Cleaned        |

---

## ✅ Checklist

- [x] **Runtime check**: Discount tidak berlaku jika expired
- [x] **Cron endpoint**: POST untuk deactivate
- [x] **Preview endpoint**: GET untuk monitoring
- [x] **Logging**: Console logs untuk tracking
- [x] **Documentation**: Complete setup guide
- [ ] **Cron setup**: Choose and configure cron service
- [ ] **Testing**: Test with expired accounts
- [ ] **Monitoring**: Daily check via GET endpoint

---

**Created:** 2025-10-28  
**Feature:** Auto-deactivate expired reseller tiers  
**Status:** ✅ READY - Needs Cron Setup
