# Fix: Reseller Purchase Transaction Error

## 🐛 Problem

Error terjadi saat user mencoba membeli reseller package:

```
POST /api/transactions 400 in 45ms
Validation failed - missing fields: {
  robloxUsername: false,
  ...
}

POST /api/transactions 500 in 2880ms
Midtrans Error: Error: Transaction validation failed: robloxUsername:
Path `robloxUsername` is required.
```

**Root Cause:**

1. API validation mengharuskan `robloxUsername` untuk SEMUA service types, termasuk reseller
2. Transaction model memiliki `robloxUsername: { required: true }`
3. Reseller purchases tidak membutuhkan Roblox credentials

---

## ✅ Solution

### 1. **Transaction Model** (`/models/Transaction.ts`)

**Before:**

```typescript
// Data Akun Roblox (untuk semua layanan)
robloxUsername: {
  type: String,
  required: true,
  trim: true,
},
robloxPassword: {
  type: String,
  required: false, // Optional - tidak diperlukan untuk gamepass
  default: null,
},
```

**After:**

```typescript
// Data Akun Roblox (untuk semua layanan kecuali reseller)
robloxUsername: {
  type: String,
  required: function () {
    // Not required for reseller purchases
    return this.serviceType !== "reseller";
  },
  trim: true,
  default: "",
},
robloxPassword: {
  type: String,
  required: false, // Optional - tidak diperlukan untuk gamepass dan reseller
  default: null,
},
```

**Changes:**

- ✅ `robloxUsername` now uses **conditional required** function
- ✅ Returns `false` (not required) when `serviceType === "reseller"`
- ✅ Returns `true` (required) for other service types (robux, gamepass, joki)
- ✅ Added `default: ""` to allow empty string
- ✅ Updated comment to include reseller

---

### 2. **Add resellerDetails Field** (`/models/Transaction.ts`)

**Added:**

```typescript
// Data Reseller Package (for reseller purchases)
resellerDetails: {
  tier: Number,           // 1, 2, or 3
  duration: Number,       // in months
  discount: Number,       // percentage
  features: [String],     // list of features
},
```

**Purpose:**

- Store reseller package information in transaction
- Useful for tracking what tier was purchased
- Can be used for invoice/receipt display

---

### 3. **API Transactions Route** (`/app/api/transactions/route.ts`)

#### A. Validation Logic (Lines ~795-810)

**Before:**

```typescript
// Password required for all services
let passwordRequired = false;

if (serviceType === "robux") {
  passwordRequired = serviceCategory === "robux_instant" && !robloxPassword;
} else if (serviceType === "joki") {
  passwordRequired = !robloxPassword;
}

if (
  !serviceType ||
  !serviceId ||
  !serviceName ||
  !quantity ||
  !unitPrice ||
  !robloxUsername || // ❌ Always required
  passwordRequired
) {
  // Error
}
```

**After:**

```typescript
// Password hanya diperlukan untuk robux instant dan joki,
// tidak untuk gamepass, robux 5 hari, dan reseller
let passwordRequired = false;
let usernameRequired = true;

// Reseller packages don't need Roblox credentials
if (serviceType === "reseller") {
  usernameRequired = false;
  passwordRequired = false;
} else if (serviceType === "robux") {
  passwordRequired = serviceCategory === "robux_instant" && !robloxPassword;
} else if (serviceType === "joki") {
  passwordRequired = !robloxPassword;
}

if (
  !serviceType ||
  !serviceId ||
  !serviceName ||
  !quantity ||
  !unitPrice ||
  (usernameRequired && !robloxUsername) || // ✅ Conditional
  passwordRequired
) {
  // Error
}
```

**Changes:**

- ✅ Added `usernameRequired` flag (default `true`)
- ✅ Set both flags to `false` for reseller
- ✅ Username validation now conditional: `(usernameRequired && !robloxUsername)`

#### B. Extract resellerDetails from Request (Line ~745)

**Added:**

```typescript
const {
  // ... other fields
  resellerDetails, // Add resellerDetails
  customerInfo,
  userId,
  // ...
} = body;
```

#### C. Save resellerDetails in Transaction (Line ~920)

**Added:**

```typescript
const transactionData: any = {
  // ... other fields
  resellerDetails: resellerDetails || undefined, // Add resellerDetails
  paymentMethodId: validPaymentMethodId,
  // ...
};
```

---

## 🔄 Flow Comparison

### Before (❌ Failed):

```
Frontend sends:
{
  serviceType: "reseller",
  robloxUsername: "",  // Empty because not needed
  resellerDetails: { tier: 3, duration: 12, ... }
}
↓
API validates: robloxUsername required? ❌ FAIL
↓
OR
↓
Transaction.save(): robloxUsername required? ❌ FAIL
```

### After (✅ Success):

```
Frontend sends:
{
  serviceType: "reseller",
  serviceId: "68fcc0d867adceac59bf0db9",
  robloxUsername: "",  // Empty, OK for reseller
  resellerDetails: { tier: 3, duration: 12, discount: 15, features: [...] }
}
↓
API validates:
  - serviceType === "reseller"? ✅
  - usernameRequired = false ✅
  - Skip robloxUsername validation ✅
↓
Transaction Model validates:
  - robloxUsername.required() checks serviceType
  - Returns false for reseller ✅
  - Validation passes ✅
↓
Transaction saved with:
  - robloxUsername: ""
  - robloxPassword: null
  - resellerDetails: { tier: 3, ... } ✅
↓
Create Midtrans payment ✅
↓
Return snap_token ✅
```

---

## 📋 Service Type Requirements

| Service Type        | robloxUsername  | robloxPassword  | Details Field       |
| ------------------- | --------------- | --------------- | ------------------- |
| **robux** (instant) | ✅ Required     | ✅ Required     | robuxInstantDetails |
| **robux** (5 hari)  | ✅ Required     | ❌ Not required | rbx5Details         |
| **gamepass**        | ✅ Required     | ❌ Not required | gamepassDetails     |
| **joki**            | ✅ Required     | ✅ Required     | jokiDetails         |
| **reseller**        | ❌ Not required | ❌ Not required | resellerDetails     |

---

## 🧪 Test Cases

### 1. **Reseller Purchase (Successful)**

**Request:**

```json
POST /api/transactions
{
  "serviceType": "reseller",
  "serviceId": "68fcc0d867adceac59bf0db9",
  "serviceName": "Raja",
  "serviceCategory": "reseller",
  "quantity": 1,
  "unitPrice": 200000,
  "totalAmount": 200000,
  "finalAmount": 204000,
  "paymentFee": 4000,
  "robloxUsername": "",
  "robloxPassword": null,
  "resellerDetails": {
    "tier": 3,
    "duration": 12,
    "discount": 15,
    "features": ["Diskon 15%", "Support prioritas", "Dashboard khusus"]
  },
  "customerInfo": {
    "name": "Rafli Afriza",
    "email": "rafli@example.com",
    "phone": "087652725529",
    "userId": "68bf30bffe73d90a831f7482"
  }
}
```

**Expected Response:**

```json
{
  "success": true,
  "data": {
    "transaction": {
      "invoiceId": "INV-...",
      "serviceType": "reseller",
      "robloxUsername": "",
      "robloxPassword": null,
      "resellerDetails": {
        "tier": 3,
        "duration": 12,
        "discount": 15,
        "features": ["..."]
      },
      "paymentStatus": "pending"
    },
    "snapToken": "...",
    "redirectUrl": "..."
  }
}
```

### 2. **Robux Purchase (Requires Username)**

**Request:**

```json
POST /api/transactions
{
  "serviceType": "robux",
  "serviceCategory": "robux_instant",
  "robloxUsername": "player123",
  "robloxPassword": "password",
  // ... other fields
}
```

**Expected:** ✅ Success (username provided)

### 3. **Reseller Without Username (Should Pass)**

**Request:**

```json
POST /api/transactions
{
  "serviceType": "reseller",
  "robloxUsername": "",  // Empty
  // ... other fields
}
```

**Expected:** ✅ Success (username not required for reseller)

### 4. **Robux Without Username (Should Fail)**

**Request:**

```json
POST /api/transactions
{
  "serviceType": "robux",
  "robloxUsername": "",  // Empty
  // ... other fields
}
```

**Expected:** ❌ 400 Error "Missing required fields"

---

## 🔍 Database Query Examples

### Find all reseller transactions:

```javascript
db.transactions.find({
  serviceType: "reseller",
});
```

### Find reseller transactions with details:

```javascript
db.transactions.find({
  serviceType: "reseller",
  resellerDetails: { $exists: true },
});
```

### Find by reseller tier:

```javascript
db.transactions.find({
  "resellerDetails.tier": 3,
});
```

### Find settled reseller purchases:

```javascript
db.transactions.find({
  serviceType: "reseller",
  paymentStatus: "settlement",
});
```

---

## 🎯 Validation Summary

### Transaction Model Validation:

```typescript
// robloxUsername validation
required: function() {
  return this.serviceType !== "reseller";
}
```

| serviceType | required? | Reason                               |
| ----------- | --------- | ------------------------------------ |
| "reseller"  | `false`   | Reseller doesn't need Roblox account |
| "robux"     | `true`    | Need account to deliver robux        |
| "gamepass"  | `true`    | Need account to buy gamepass         |
| "joki"      | `true`    | Need account to perform joki service |

### API Validation:

```typescript
let usernameRequired = serviceType !== "reseller";
```

---

## 📝 Frontend Integration

Frontend checkout for reseller should send:

```typescript
// For reseller purchase
const checkoutData = {
  serviceType: "reseller",
  serviceId: pkg._id,
  serviceName: pkg.name,
  serviceCategory: "reseller",
  quantity: 1,
  unitPrice: pkg.price,
  robloxUsername: "", // Empty string
  robloxPassword: null, // Null
  resellerDetails: {
    // Include package details
    tier: pkg.tier,
    duration: pkg.duration,
    discount: pkg.discount,
    features: pkg.features,
  },
  customerInfo: {
    /* ... */
  },
  paymentMethodId: "...",
};
```

---

## ✅ Checklist

- [x] **Transaction Model**: robloxUsername conditional required
- [x] **Transaction Model**: Add resellerDetails field
- [x] **API Route**: Add usernameRequired flag
- [x] **API Route**: Skip username validation for reseller
- [x] **API Route**: Extract resellerDetails from body
- [x] **API Route**: Save resellerDetails in transaction
- [x] **Validation**: Service-specific requirements implemented
- [x] **Error Handling**: Clear error messages
- [x] **Testing**: Ready for manual testing

---

## 🎉 Result

✅ Reseller purchases dapat diproses tanpa Roblox credentials
✅ Validation tetap ketat untuk service types lain
✅ resellerDetails tersimpan untuk tracking
✅ Model dan API konsisten

**Status:** FIXED - Ready for Testing

---

**Created:** 2025-10-27  
**Issue:** Reseller purchase failed validation  
**Solution:** Conditional robloxUsername requirement based on serviceType
