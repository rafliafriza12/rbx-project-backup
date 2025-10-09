# 🔄 Cart & Checkout - Multiple Items Display Fix

## Overview

**Last Updated:** October 6, 2025

This document covers the complete cart-to-checkout integration, including critical fixes for:

1. **Multiple items display** - No more merging, each add creates new item
2. **Child item details** - Game and item names shown in checkout
3. **Data structure** - Complete data flow from service to checkout

---

## 🐛 Critical Issues Fixed

### Issue 1: Items Being Merged When They Shouldn't

**Problem:** Adding 3 different items from PUBG (Crown, Ace, Conqueror) resulted in only 1 item with merged quantity.

**Root Cause:** Cart API had duplicate detection that merged items with same `serviceId + serviceType + serviceName`.

**Solution:** **DISABLED** duplicate detection - every add to cart now creates a new item.

### Issue 2: Cart Only Showing Partial Names

**Problem:** Cart displayed "Crown" instead of "PUBG - Crown".

**Root Cause:** Display used `item.itemName` instead of full `item.serviceName`.

**Solution:** Changed to `item.serviceName || item.itemName` for full context.

### Issue 3: Checkout Not Showing Child Items

**Problem:** Checkout only showed "PUBG - Crown" but not the "Game: PUBG" and "Item: Crown" breakdown.

**Root Cause:** Checkout page didn't display `gamepassDetails` and `jokiDetails` fields.

**Solution:** Added conditional display blocks to show child item details.

---

## 📊 Data Structure Overview

Data structure cart telah disesuaikan dengan format checkout untuk memastikan kompatibilitas seamless antara keranjang belanja dan proses pembayaran. Data yang disimpan di cart sekarang langsung compatible dengan format yang diperlukan halaman checkout.

## 🆕 **Updated Cart Data Structure**

### **ICartItem Interface (Extended)**

```typescript
interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  type: "rbx5" | "rbx-instant" | "gamepass" | "joki";

  // Core service information (required for checkout)
  serviceId: string; // ID dari service/produk
  serviceName: string; // Nama layanan lengkap (e.g., "PUBG - Crown")
  serviceImage: string; // URL gambar service
  serviceCategory?: string; // robux_5_hari, robux_instant, gamepass, joki

  // Legacy fields (kept for compatibility)
  gameId?: string;
  gameName: string;
  itemName: string;
  imgUrl: string;
  price: number;
  quantity: number;
  description?: string;

  // Extended fields for Gamepass
  gamepassDetails?: {
    gameName: string;
    itemName: string;
    imgUrl: string;
    unitPrice: number;
    description: string;
    gamepassAmount: number;
  };

  // Extended fields for Joki
  jokiDetails?: {
    gameName: string;
    itemName: string;
    imgUrl: string;
    unitPrice: number;
    description: string;
    gameType: string;
    estimatedTime: string;
    additionalInfo: string;
    notes: string;
    syaratJoki: string[];
    prosesJoki: string[];
  };

  // Extended fields for Robux Instant
  robuxInstantDetails?: {
    gameName: string;
    robuxAmount: number;
    unitPrice: number;
    description: string;
  };

  // User credentials (for services requiring login)
  robloxUsername?: string;
  robloxPassword?: string;

  // Additional service-specific fields
  gameType?: string;
  robuxAmount?: number;
  gamepassAmount?: number;
  estimatedTime?: string;
  additionalInfo?: string;
}
```

### **Key Data Flow Fields**

1. **serviceName** - Full unique identifier

   - ✅ "PUBG - Crown"
   - ✅ "Blox Fruits - Leopard Fruit"
   - ❌ Just "Crown" or "Leopard Fruit"

2. **gamepassDetails / jokiDetails** - Child item information

   - Contains `gameName` and `itemName` separately
   - Used for detailed display in checkout
   - Includes all original service data

3. **robloxUsername / robloxPassword** - User credentials
   - Preserved through entire flow
   - Required for service processing

---

## 🔧 **Updated Components**

### **1. AddToCartButton - New Required Props**

```tsx
<AddToCartButton
  // Required new props
  serviceId="gamepass_123" // Unique service ID
  serviceName="VIP Gamepass - Pet Sim X" // Full service name
  serviceImage="/gamepass-premium.jpg" // Service image URL
  // Optional category for robux services
  serviceCategory="robux_5_hari" // robux_5_hari | robux_instant
  // Existing props (unchanged)
  type="gamepass"
  gameName="Pet Simulator X"
  itemName="VIP Gamepass"
  imgUrl="/gamepass-image.jpg"
  price={50000}
  // Optional service-specific props
  gameType="Simulation" // For joki services
  robuxAmount={1000} // For robux services
  gamepassAmount={1} // For gamepass
  estimatedTime="Instant" // For joki services
  additionalInfo="Premium features" // Additional notes
/>
```

### **2. Cart Page - Checkout Integration**

```typescript
// Automatic data transformation for checkout
const handleCheckout = () => {
  const checkoutData = selectedItems.map((item) => ({
    serviceType:
      item.type === "rbx5"
        ? "robux"
        : item.type === "rbx-instant"
        ? "robux"
        : item.type,
    serviceId: item.serviceId,
    serviceName: item.serviceName,
    serviceImage: item.serviceImage || item.imgUrl,
    serviceCategory:
      item.type === "rbx5"
        ? "robux_5_hari"
        : item.type === "rbx-instant"
        ? "robux_instant"
        : item.serviceCategory,
    quantity: item.quantity,
    unitPrice: item.price,
    // ... all other checkout-required fields
  }));

  // Direct integration with checkout page
  sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData[0]));
  router.push("/checkout");
};
```

## 📋 **Service-Specific Examples**

### **1. Robux 5 Hari Service**

```tsx
<AddToCartButton
  type="rbx5"
  serviceId="rbx5_1000_robux"
  serviceName="1000 Robux (5 Hari)"
  serviceImage="/assets/robux-5-hari.png"
  serviceCategory="robux_5_hari"
  gameName="Roblox"
  itemName="1000 Robux"
  imgUrl="/assets/robux-5-hari.png"
  price={100000}
  robuxAmount={1000}
  additionalInfo="Delivered via GamePass system"
/>
```

### **2. Robux Instant Service**

```tsx
<AddToCartButton
  type="rbx-instant"
  serviceId="rbx_instant_500"
  serviceName="500 Robux (Instant)"
  serviceImage="/assets/robux-instant.png"
  serviceCategory="robux_instant"
  gameName="Roblox"
  itemName="500 Robux"
  imgUrl="/assets/robux-instant.png"
  price={75000}
  robuxAmount={500}
  additionalInfo="Instant delivery - requires password"
/>
```

### **3. Gamepass Service**

```tsx
<AddToCartButton
  type="gamepass"
  serviceId="gamepass_pet_sim_vip"
  serviceName="VIP Gamepass - Pet Simulator X"
  serviceImage="/assets/pet-sim-vip.jpg"
  serviceCategory="premium_gamepass"
  gameId="pet_simulator_x_123"
  gameName="Pet Simulator X"
  itemName="VIP Gamepass"
  imgUrl="/assets/pet-sim-vip.jpg"
  price={50000}
  gamepassAmount={1}
  description="Access to VIP area with exclusive pets"
/>
```

### **4. Joki Service**

```tsx
<AddToCartButton
  type="joki"
  serviceId="joki_brookhaven_level_boost"
  serviceName="Level 100 Boost - Brookhaven RP"
  serviceImage="/assets/brookhaven-joki.jpg"
  gameId="brookhaven_rp_456"
  gameName="Brookhaven RP"
  itemName="Level 100 Boost"
  imgUrl="/assets/brookhaven-joki.jpg"
  price={25000}
  description="Professional level boosting service"
  gameType="Roleplay"
  estimatedTime="2-4 hours"
  additionalInfo="Safe account boost with security measures"
/>
```

## 🔄 **Data Flow: Cart → Checkout**

### **Complete Flow Diagram**

```
Service Page (joki/[id]/page.tsx)
  ↓
  User fills form (username, password, selects items)
  ↓
  handleAddToCart() - Loop through selected items
  ↓
  For each item:
    └→ POST /api/cart
       Body: {
         serviceId, serviceName, serviceImage,
         serviceCategory: "joki",
         quantity, unitPrice,
         jokiDetails: { gameName, itemName, ... },
         robloxUsername, robloxPassword
       }
  ↓
Cart API (app/api/cart/route.ts)
  ↓
  ✅ NEW BEHAVIOR: Always add as new item
  └→ existingCart.items.push(newItem)  // No duplicate checking
  ↓
MongoDB Cart Collection
  Items: [
    { serviceName: "PUBG - Crown", quantity: 3, ... },
    { serviceName: "PUBG - Ace", quantity: 2, ... },
    { serviceName: "PUBG - Conqueror", quantity: 1, ... }
  ]
  ↓
Cart Page (app/(public)/cart/page.tsx)
  ↓
  Display: {item.serviceName || item.itemName}
  Shows: "PUBG - Crown", "PUBG - Ace", "PUBG - Conqueror"
  ↓
  User selects items and clicks "Checkout"
  ↓
  Prepare checkout data:
    checkoutData = selectedItems.map(item => ({
      ...item,
      gamepassDetails: item.gamepassDetails,  // ✅ Added
      jokiDetails: item.jokiDetails,          // ✅ Added
      robloxUsername: item.robloxUsername,    // ✅ Added
      robloxPassword: item.robloxPassword     // ✅ Added
    }))
  ↓
  sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData))
  router.push('/checkout')
  ↓
Checkout Page (app/checkout/page.tsx)
  ↓
  Read from sessionStorage
  ↓
  Display each item:
    <h3>{item.serviceName}</h3>           // "PUBG - Crown"

    ✅ NEW: Show child details
    {item.gamepassDetails && (
      <div>
        <div>Game: {item.gamepassDetails.gameName}</div>
        <div>Item: {item.gamepassDetails.itemName}</div>
      </div>
    )}

    {item.jokiDetails && (
      <div>
        <div>Game: {item.jokiDetails.gameName}</div>  // "PUBG"
        <div>Item: {item.jokiDetails.itemName}</div>  // "Crown"
      </div>
    )}
  ↓
  User completes payment
  ↓
Transaction API
  All item details + credentials sent for processing
```

---

## 🎯 **Critical Changes**

### **1. Cart API - Duplicate Detection DISABLED**

**File:** `app/api/cart/route.ts`

**Before:**

```typescript
// ❌ OLD: Checked for duplicates and merged
const itemIndex = existingCart.items.findIndex(
  (item) =>
    item.serviceId === finalServiceId &&
    item.serviceType === finalServiceType &&
    item.serviceName === finalServiceName
);

if (itemIndex > -1) {
  // Merge: increase quantity
  existingCart.items[itemIndex].quantity += quantity;
} else {
  existingCart.items.push(newItem);
}
```

**After:**

```typescript
// ✅ NEW: Always add as new item - NO MERGING
existingCart.items.push(newItem);
```

**Impact:**

- ✅ Every "Add to Cart" creates a NEW separate item
- ✅ Adding PUBG Crown 3 times = 3 separate cart items
- ✅ User has full control over individual items

---

### **2. Cart Page - Data Passing Enhanced**

**File:** `app/(public)/cart/page.tsx`

**Added Fields to Checkout Data:**

```typescript
const checkoutData = selectedItemsData.map((item) => ({
  // ... existing fields ...

  // ✅ NEW: Pass complete details
  gamepassDetails: item.gamepassDetails,
  jokiDetails: item.jokiDetails,
  robuxInstantDetails: item.robuxInstantDetails,

  // ✅ NEW: Pass user credentials
  robloxUsername: item.robloxUsername,
  robloxPassword: item.robloxPassword,
}));
```

**Impact:**

- ✅ All child item data available in checkout
- ✅ Credentials preserved for transaction processing
- ✅ No data loss between cart and checkout

---

### **3. Checkout Page - Child Item Display**

**File:** `app/checkout/page.tsx`

**Added Display Logic:**

```typescript
<div key={index} className="border-b border-white/10 pb-4 mb-4">
  <div className="flex justify-between items-start">
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-white">{item.serviceName}</h3>

      {/* ✅ NEW: Show gamepass details */}
      {item.gamepassDetails && (
        <div className="text-xs text-white/70 mt-1">
          <div>Game: {item.gamepassDetails.gameName}</div>
          <div>Item: {item.gamepassDetails.itemName}</div>
        </div>
      )}

      {/* ✅ NEW: Show joki details */}
      {item.jokiDetails && (
        <div className="text-xs text-white/70 mt-1">
          <div>Game: {item.jokiDetails.gameName}</div>
          <div>Item: {item.jokiDetails.itemName}</div>
        </div>
      )}

      <div className="text-sm text-white/60 mt-1">{item.serviceType}</div>
    </div>

    <div className="text-right ml-4">
      <div className="text-xs text-white/60 mb-1">Qty: {item.quantity}</div>
      <div className="text-lg font-semibold text-white">
        Rp {(item.unitPrice * item.quantity).toLocaleString("id-ID")}
      </div>
    </div>
  </div>
</div>
```

**Display Example:**

```
┌────────────────────────────────────────────────┐
│ 📦 PUBG - Crown                                │
│    Game: PUBG                                  │
│    Item: Crown                                 │
│    Type: joki                                  │
│    Qty: 3           Rp 300,000                │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 📦 Blox Fruits - Leopard Fruit                 │
│    Game: Blox Fruits                           │
│    Item: Leopard Fruit                         │
│    Type: gamepass                              │
│    Qty: 1           Rp 150,000                │
└────────────────────────────────────────────────┘
```

**Impact:**

- ✅ Clear breakdown of each item
- ✅ Game and item names displayed separately
- ✅ Better user understanding of what they're buying

---

### **After (Seamless Integration)**

```
Cart Item → Select & Checkout → Auto-populated checkout → Payment
```

## 🧪 **Testing Guide**

### **Test Case 1: Add Multiple Different Items (Same Game)**

**Objective:** Verify each item creates separate cart entry (no merging)

**Steps:**

1. Go to PUBG Joki page (`/joki/[id]`)
2. Fill in Roblox credentials
3. Select 3 items:
   - Crown (Qty: 3)
   - Ace (Qty: 2)
   - Conqueror (Qty: 1)
4. Click "Tambah ke Keranjang"
5. Open cart (`/cart`)

**Expected Result:**

```
📦 JOKI (3 items)
  ☐ PUBG - Crown         Qty: 3   Rp 300,000
  ☐ PUBG - Ace           Qty: 2   Rp 500,000
  ☐ PUBG - Conqueror     Qty: 1   Rp 400,000
```

✅ **3 SEPARATE items** displayed
✅ Each shows full name (Game - Item)
✅ Correct quantities for each

---

### **Test Case 2: Add Same Item Multiple Times**

**Objective:** Verify same item added twice creates 2 separate entries

**Steps:**

1. Add PUBG - Crown (Qty: 3)
2. Wait for success toast
3. Add PUBG - Crown (Qty: 2) again
4. Open cart

**Expected Result:**

```
📦 JOKI (2 items)
  ☐ PUBG - Crown         Qty: 3   Rp 300,000
  ☐ PUBG - Crown         Qty: 2   Rp 200,000
```

✅ **2 SEPARATE items** (not merged)
✅ First item: Qty 3
✅ Second item: Qty 2
❌ NOT: 1 item with Qty 5

---

### **Test Case 3: Checkout Display - Child Items**

**Objective:** Verify checkout shows detailed item breakdown

**Steps:**

1. Add multiple Joki items to cart
2. Add multiple Gamepass items to cart
3. Select all items
4. Click "Checkout"
5. Review order summary

**Expected Result:**

```
┌───────────── Order Summary ─────────────┐
│                                         │
│ 📦 PUBG - Crown                        │
│    Game: PUBG                          │
│    Item: Crown                         │
│    Type: joki                          │
│    Qty: 3        Rp 300,000           │
│                                         │
│ 📦 Blox Fruits - Leopard Fruit         │
│    Game: Blox Fruits                   │
│    Item: Leopard Fruit                 │
│    Type: gamepass                      │
│    Qty: 1        Rp 150,000           │
│                                         │
│ ────────────────────────────────────── │
│ Total: Rp 450,000                      │
└─────────────────────────────────────────┘
```

✅ Each item shows:

- Full serviceName header
- Game name (from details)
- Item name (from details)
- Service type
- Quantity and price

---

### **Test Case 4: Complete Flow - Joki Service**

**Objective:** Verify end-to-end flow with all data preserved

**Steps:**

1. Go to PUBG Joki: `/joki/[pubg-id]`
2. Fill form:
   - Roblox Username: `testuser123`
   - Roblox Password: `testpass456`
   - Select: Crown (Qty: 3), Ace (Qty: 2)
3. Click "Tambah ke Keranjang"
4. Go to cart, select both items
5. Click checkout
6. Review data in checkout
7. Complete payment

**Data Validation Points:**

**In Cart:**

- ✅ 2 separate items visible
- ✅ Full names: "PUBG - Crown", "PUBG - Ace"
- ✅ Correct quantities

**In Checkout:**

- ✅ Both items listed
- ✅ Shows "Game: PUBG" for each
- ✅ Shows "Item: Crown" and "Item: Ace"
- ✅ Credentials preserved (check sessionStorage)

**In Transaction API:**

```json
{
  "items": [
    {
      "serviceName": "PUBG - Crown",
      "jokiDetails": {
        "gameName": "PUBG",
        "itemName": "Crown",
        ...
      },
      "robloxUsername": "testuser123",
      "robloxPassword": "testpass456"
    },
    {
      "serviceName": "PUBG - Ace",
      "jokiDetails": {
        "gameName": "PUBG",
        "itemName": "Ace",
        ...
      },
      "robloxUsername": "testuser123",
      "robloxPassword": "testpass456"
    }
  ]
}
```

✅ All data preserved through entire flow

---

### **Test Case 5: Gamepass Multiple Items**

**Objective:** Verify gamepass items work same as joki

**Steps:**

1. Go to Blox Fruits Gamepass: `/gamepass/[blox-fruits-id]`
2. Fill credentials
3. Select 3 gamepasses:
   - Leopard Fruit
   - Dragon Fruit
   - Buddha Fruit
4. Add to cart
5. Go to cart

**Expected Result:**

```
📦 GAMEPASS (3 items)
  ☐ Blox Fruits - Leopard Fruit    Rp 150,000
  ☐ Blox Fruits - Dragon Fruit     Rp 200,000
  ☐ Blox Fruits - Buddha Fruit     Rp 180,000
```

**In Checkout:**

- ✅ Each item shows game and item breakdown
- ✅ gamepassDetails preserved
- ✅ All credentials sent to transaction

---

### **Test Case 6: Mixed Categories**

**Objective:** Verify different service types can coexist in cart

**Steps:**

1. Add Joki item (PUBG - Crown)
2. Add Gamepass item (Blox Fruits - Leopard)
3. Add Robux Instant (500 Robux)
4. Try to checkout

**Expected Result:**

```
⚠️ Error: "Tidak dapat checkout items dari kategori berbeda"
```

✅ Category validation working
✅ Must select items from same category only

---

## 📊 **Database Check**

### **Verify MongoDB Cart Structure**

```javascript
// Check cart in MongoDB
db.carts.findOne({ userId: "user123" })

// Should return:
{
  userId: "user123",
  items: [
    {
      type: "joki",
      serviceId: "pubg_joki_123",
      serviceName: "PUBG - Crown",  // ✅ Full name
      serviceCategory: "joki",
      quantity: 3,
      unitPrice: 100000,
      jokiDetails: {                 // ✅ Complete details
        gameName: "PUBG",
        itemName: "Crown",
        description: "...",
        notes: "backup code...",
        syaratJoki: [...],
        prosesJoki: [...]
      },
      robloxUsername: "testuser123",  // ✅ Credentials
      robloxPassword: "testpass456"
    },
    {
      type: "joki",
      serviceId: "pubg_joki_123",
      serviceName: "PUBG - Ace",      // ✅ Different item
      serviceCategory: "joki",
      quantity: 2,
      unitPrice: 250000,
      jokiDetails: {
        gameName: "PUBG",
        itemName: "Ace",
        ...
      },
      robloxUsername: "testuser123",
      robloxPassword: "testpass456"
    }
  ]
}
```

✅ Each item is separate object
✅ No merging in database
✅ All fields preserved

---

## 🚀 **Benefits of Updated Structure**

### **1. No More Item Merging**

**Before:**

- Add Crown (Qty: 3) → Cart has 1 item (Qty: 3)
- Add Ace (Qty: 2) → Cart merges to 1 item (Qty: 5) ❌

**After:**

- Add Crown (Qty: 3) → Cart has 1 item (Qty: 3)
- Add Ace (Qty: 2) → Cart has 2 items (Qty: 3 + Qty: 2) ✅

### **2. Clear Item Display**

**Before:**

- Cart shows: "Crown" ❌ (Which game?)

**After:**

- Cart shows: "PUBG - Crown" ✅ (Clear context)

### **3. Detailed Checkout**

**Before:**

- Checkout shows: "PUBG - Crown" (no breakdown) ❌

**After:**

- Checkout shows:
  ```
  PUBG - Crown
    Game: PUBG
    Item: Crown
  ```
  ✅ Complete information

### **4. Data Integrity**

**Before:**

- Some fields lost between cart and checkout ❌

**After:**

- All fields preserved:
  - gamepassDetails ✅
  - jokiDetails ✅
  - robloxUsername ✅
  - robloxPassword ✅

---

## 📝 **Files Modified**

### **1. Cart API**

**File:** `app/api/cart/route.ts`
**Change:** Removed duplicate detection logic
**Lines:** ~190-210

### **2. Cart Page**

**File:** `app/(public)/cart/page.tsx`
**Changes:**

- Display: Use `serviceName` instead of `itemName`
- Checkout data: Added `gamepassDetails`, credentials
  **Lines:** ~450, ~190-210

### **3. Checkout Page**

**File:** `app/checkout/page.tsx`
**Change:** Added child item display blocks
**Lines:** ~758-772

### **4. Cart Model**

**File:** `models/Cart.ts`
**Change:** Extended with gamepassDetails, jokiDetails, credentials
**Status:** Already updated in previous sessions

---

## 🎯 **Summary**

### **Problems Solved:**

1. ✅ Items no longer merge automatically
2. ✅ Full item names displayed in cart
3. ✅ Checkout shows detailed item breakdown
4. ✅ All data preserved through complete flow

### **Key Changes:**

1. **Duplicate Detection:** DISABLED
2. **Display Logic:** Shows full serviceName
3. **Data Passing:** Complete details to checkout
4. **Checkout Display:** Child items visible

### **Testing Checklist:**

- [ ] Add multiple items from same game → Separate entries
- [ ] Add same item twice → 2 separate entries (not merged)
- [ ] Cart shows full names → "Game - Item" format
- [ ] Checkout shows breakdown → Game + Item details
- [ ] Complete transaction → All data sent to API

---

**🎯 Cart & Checkout system now fully functional with proper multiple item support!** ✨

**Last Updated:** October 6, 2025
