# Debug Guide: Cart API Error - Gamepass & Joki

## 🐛 Error Timeline

### Error 1: "User ID diperlukan"

**Status:** ✅ FIXED  
**Solution:** Tambahkan `userId: user.id` ke request body

### Error 2: "Gagal menambahkan item ke keranjang"

**Status:** ✅ FIXED  
**Root Cause:** Model Cart tidak memiliki field `gamepassDetails`, `robloxUsername`, `robloxPassword`

---

## 🔍 Root Cause Analysis

### Problem

Gamepass dan Joki mengirim data yang tidak ada di Cart model:

- `gamepassDetails` - Not defined in model
- `robloxUsername` - Not defined in model
- `robloxPassword` - Not defined in model
- `jokiDetails` with additional fields - Partially defined

### Why This Happened

Cart model was designed for Robux services first, then extended for other services but some fields were missing.

---

## ✅ Solution - Extended Cart Model

### 1. Updated Interface (ICartItem)

**File:** `models/Cart.ts`

**Before:**

```typescript
export interface ICartItem {
  // ... other fields
  jokiDetails?: {
    description?: string;
    gameType?: string;
    targetLevel?: string;
    estimatedTime?: string;
    notes?: string;
  };
  robuxInstantDetails?: {
    notes?: string;
  };
}
```

**After:**

```typescript
export interface ICartItem {
  // ... other fields

  // Joki details - EXTENDED
  jokiDetails?: {
    description?: string;
    gameType?: string;
    targetLevel?: string;
    estimatedTime?: string;
    notes?: string;
    gameName?: string; // ✅ Added
    itemName?: string; // ✅ Added
    imgUrl?: string; // ✅ Added
    additionalInfo?: string; // ✅ Added
    syaratJoki?: string[]; // ✅ Added
    prosesJoki?: string[]; // ✅ Added
    features?: string[]; // ✅ Added
  };

  // Gamepass details - NEW!
  gamepassDetails?: {
    // ✅ Added entire object
    gameName?: string;
    itemName?: string;
    imgUrl?: string;
    developer?: string;
    features?: string[];
    caraPesan?: string[];
  };

  // Robux instant details - EXTENDED
  robuxInstantDetails?: {
    notes?: string;
    additionalInfo?: string; // ✅ Added
    robuxAmount?: number; // ✅ Added
    productName?: string; // ✅ Added
    description?: string; // ✅ Added
  };

  // User credentials - NEW!
  robloxUsername?: string; // ✅ Added
  robloxPassword?: string | null; // ✅ Added
}
```

### 2. Updated Mongoose Schema

**File:** `models/Cart.ts`

**Added to CartItemSchema:**

```typescript
// Joki details - Extended
jokiDetails: {
  description: String,
  gameType: String,
  targetLevel: String,
  estimatedTime: String,
  notes: String,
  gameName: String,           // ✅ New
  itemName: String,           // ✅ New
  imgUrl: String,             // ✅ New
  additionalInfo: String,     // ✅ New
  syaratJoki: [String],       // ✅ New
  prosesJoki: [String],       // ✅ New
  features: [String],         // ✅ New
},

// Gamepass details - NEW!
gamepassDetails: {            // ✅ Entire object is new
  gameName: String,
  itemName: String,
  imgUrl: String,
  developer: String,
  features: [String],
  caraPesan: [String],
},

// Robux instant details - Extended
robuxInstantDetails: {
  notes: String,
  additionalInfo: String,     // ✅ New
  robuxAmount: Number,        // ✅ New
  productName: String,        // ✅ New
  description: String,        // ✅ New
},

// User credentials - NEW!
robloxUsername: {             // ✅ New
  type: String,
  required: false,
},
robloxPassword: {             // ✅ New
  type: String,
  required: false,
},
```

### 3. Updated Cart API

**File:** `app/api/cart/route.ts`

**Added field extraction:**

```typescript
const {
  userId,
  // ... other fields
  gamepass,
  jokiDetails,
  robuxInstantDetails,
  robloxUsername, // ✅ Added
  robloxPassword, // ✅ Added
  gamepassDetails, // ✅ Added
} = body;
```

**Added to newItem:**

```typescript
const newItem: ICartItem = {
  // ... other fields
  gamepass,
  jokiDetails,
  robuxInstantDetails,
  gamepassDetails, // ✅ Added
  robloxUsername, // ✅ Added
  robloxPassword, // ✅ Added
};
```

### 4. Added Detailed Logging

**For debugging future issues:**

**Client Side (Gamepass & Joki):**

```typescript
console.log("=== GAMEPASS/JOKI ADD TO CART DEBUG ===");
console.log("Sending cartItem:", JSON.stringify(cartItem, null, 2));
// ... after fetch
console.log("Response status:", response.status);
console.log("Response data:", data);
```

**Server Side (Cart API):**

```typescript
console.log("=== CART API POST DEBUG ===");
console.log("Received body:", JSON.stringify(body, null, 2));
console.log("Extracted userId:", userId);
console.log("Validation check:", { ... });
console.log("Created newItem:", JSON.stringify(newItem, null, 2));
```

---

## 📊 Data Flow Comparison

### Robux Services (Working)

```
Service Page
  ↓ (uses AddToCartButton)
CartContext.addToCart()
  ↓ (auto adds userId)
Cart API
  ↓
MongoDB Cart Model
  ✅ All fields match
```

### Gamepass & Joki (Now Fixed)

```
Service Detail Page
  ↓ (handleAddToCart)
Direct Fetch to Cart API
  ↓ (manually add userId + extra fields)
Cart API
  ↓
MongoDB Cart Model
  ✅ All fields match (after extension)
```

---

## 🧪 Testing Checklist

### Gamepass Add to Cart

- [ ] Select gamepass
- [ ] Select multiple items
- [ ] Input username
- [ ] Click "Tambah ke Keranjang"
- [ ] Check console logs (client & server)
- [ ] Verify success toast
- [ ] Open `/cart` and verify items appear
- [ ] Check all gamepassDetails are saved:
  - gameName
  - itemName
  - imgUrl
  - developer
  - features
  - caraPesan

### Joki Add to Cart

- [ ] Select joki service
- [ ] Select multiple items
- [ ] Input username, password, backup code
- [ ] Click "Tambah ke Keranjang"
- [ ] Check console logs (client & server)
- [ ] Verify success toast
- [ ] Open `/cart` and verify items appear
- [ ] Check all jokiDetails are saved:
  - All basic fields
  - gameName, itemName, imgUrl
  - additionalInfo (backup code)
  - syaratJoki, prosesJoki
  - features
- [ ] Verify robloxUsername and robloxPassword saved

### Checkout from Cart

- [ ] Add multiple items from same category
- [ ] Select items
- [ ] Click checkout
- [ ] Verify all details preserved:
  - Gamepass: gamepassDetails intact
  - Joki: jokiDetails + backup code intact
  - Robux: robuxInstantDetails intact
- [ ] Complete transaction
- [ ] Verify transaction created with all data

---

## 🔧 Console Log Examples

### Client Side - Successful Add to Cart:

```javascript
=== GAMEPASS ADD TO CART DEBUG ===
Sending cartItem: {
  "userId": "507f1f77bcf86cd799439011",
  "serviceType": "gamepass",
  "serviceId": "65abc123...",
  "serviceName": "Blox Fruits - Leopard Fruit",
  "serviceCategory": "gamepass",
  "gamepassDetails": {
    "gameName": "Blox Fruits",
    "itemName": "Leopard Fruit",
    "features": ["Instant delivery", "Cheapest price"],
    "caraPesan": ["Step 1", "Step 2"]
  },
  "robloxUsername": "myusername123"
}
Response status: 200
Response data: { "message": "Item berhasil ditambahkan ke keranjang" }
```

### Server Side - Successful Processing:

```javascript
=== CART API POST DEBUG ===
Received body: {
  "userId": "507f1f77bcf86cd799439011",
  "serviceType": "gamepass",
  ...
}
Extracted userId: 507f1f77bcf86cd799439011
Validation check: {
  "finalServiceType": "gamepass",
  "finalServiceId": "65abc123...",
  "finalServiceName": "Blox Fruits - Leopard Fruit",
  "finalUnitPrice": 50000
}
Created newItem: { ... }
```

---

## 📝 Modified Files Summary

1. ✅ `models/Cart.ts`

   - Extended `ICartItem` interface
   - Added `gamepassDetails`, `robloxUsername`, `robloxPassword`
   - Extended `jokiDetails` and `robuxInstantDetails`
   - Updated Mongoose schema

2. ✅ `app/api/cart/route.ts`

   - Added new field extraction
   - Added new fields to `newItem`
   - Added comprehensive logging

3. ✅ `app/(public)/gamepass/[id]/page.tsx`

   - Added userId to cartItem
   - Added debug logging

4. ✅ `app/(public)/joki/[id]/page.tsx`
   - Added userId to cartItem
   - Added debug logging

---

## 🚀 Status

✅ **ALL FIXED**

- User ID error: Fixed
- Model mismatch error: Fixed
- Detailed logging: Added
- Ready for testing

**Next Steps:**

1. Test add to cart from all services
2. Verify data persistence in MongoDB
3. Test checkout flow with cart items
4. Verify backup code preservation
5. Remove debug logs after confirming everything works

**Last Updated:** October 6, 2025
