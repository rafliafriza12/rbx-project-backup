# Cart System Behavior - Joki & Gamepass Multiple Items

## ✅ Expected Behavior

### When Adding Multiple Items from Same Game

**Example: PUBG Joki Service**
User selects:

- Crown (3x) - Rp 300,000
- Ace (2x) - Rp 500,000

**Expected Result in Cart:**

```
📦 JOKI (2 items)
  ☐ PUBG - Crown         Qty: 3   Rp 300,000
  ☐ PUBG - Ace           Qty: 2   Rp 500,000
```

**✅ Two separate items** because they have different `serviceName`:

- Item 1: `serviceName: "PUBG - Crown"`
- Item 2: `serviceName: "PUBG - Ace"`

---

## 🔧 How Duplicate Detection Works

### Cart API Logic (`app/api/cart/route.ts`)

**Duplicate Check:**

```typescript
const itemIndex = existingCart.items.findIndex(
  (item: ICartItem) =>
    item.serviceId === finalServiceId && // Same game/service
    item.serviceType === finalServiceType && // Same type (joki/gamepass)
    item.serviceName === finalServiceName // Same specific item ✅
);
```

**3 conditions must match for item to be considered "duplicate":**

1. ✅ `serviceId` - Same game/service (e.g., PUBG)
2. ✅ `serviceType` - Same category (joki/gamepass)
3. ✅ `serviceName` - Same specific item (e.g., "PUBG - Crown")

### Behavior Examples

#### Case 1: Add Same Item Twice

```
1st Add: PUBG - Crown (Qty: 3)
2nd Add: PUBG - Crown (Qty: 2)

Result:
  ☐ PUBG - Crown    Qty: 5 ✅ (merged)
```

**Why:** All 3 conditions match → Quantity increased

#### Case 2: Add Different Items from Same Game

```
1st Add: PUBG - Crown (Qty: 3)
2nd Add: PUBG - Ace (Qty: 2)

Result:
  ☐ PUBG - Crown    Qty: 3 ✅
  ☐ PUBG - Ace      Qty: 2 ✅
```

**Why:** `serviceName` different → Separate items

#### Case 3: Add Same Game, Different Service Type

```
1st Add: Joki PUBG - Crown
2nd Add: Gamepass PUBG Item

Result:
  📦 JOKI
    ☐ PUBG - Crown
  🎮 GAMEPASS
    ☐ PUBG Item
```

**Why:** `serviceType` different → Separate items in different categories

---

## 🎨 Cart Display Logic

### Before Fix

Cart displayed `item.itemName` only:

```
❌ Crown       (not clear which game)
❌ Ace         (not clear which game)
```

### After Fix

Cart displays `item.serviceName` which includes full context:

```typescript
<h3>{item.serviceName || item.itemName} // ✅ Shows "PUBG - Crown"</h3>
```

**Display:**

```
✅ PUBG - Crown    (clear and complete)
✅ PUBG - Ace      (clear and complete)
```

---

## 📊 Data Structure

### How Items are Sent from Client

**Gamepass Example:**

```typescript
// Item 1: Leopard Fruit
{
  serviceId: "gamepass123",
  serviceName: "Blox Fruits - Leopard Fruit",  // ✅ Unique
  gamepassDetails: {
    gameName: "Blox Fruits",
    itemName: "Leopard Fruit"
  }
}

// Item 2: Dragon Fruit
{
  serviceId: "gamepass123",                     // Same gamepass
  serviceName: "Blox Fruits - Dragon Fruit",   // ✅ Different
  gamepassDetails: {
    gameName: "Blox Fruits",
    itemName: "Dragon Fruit"
  }
}
```

**Joki Example:**

```typescript
// Item 1: Crown
{
  serviceId: "joki456",
  serviceName: "PUBG - Crown",                  // ✅ Unique
  jokiDetails: {
    gameName: "PUBG",
    itemName: "Crown"
  }
}

// Item 2: Ace
{
  serviceId: "joki456",                         // Same joki service
  serviceName: "PUBG - Ace",                    // ✅ Different
  jokiDetails: {
    gameName: "PUBG",
    itemName: "Ace"
  }
}
```

---

## 🧪 Testing Scenarios

### Test 1: Multiple Items from Same Gamepass

**Steps:**

1. Go to Blox Fruits gamepass
2. Select "Leopard Fruit" (Qty: 1)
3. Select "Dragon Fruit" (Qty: 2)
4. Click "Tambah ke Keranjang"

**Expected:**

- ✅ 2 separate items in cart
- ✅ Each shows full name "Blox Fruits - [Item]"
- ✅ Can select both for checkout

### Test 2: Add Same Item Multiple Times

**Steps:**

1. Go to PUBG joki
2. Add "Crown" (Qty: 3)
3. Go back to PUBG joki
4. Add "Crown" (Qty: 2) again

**Expected:**

- ✅ 1 item in cart
- ✅ Quantity: 5 (3 + 2)
- ✅ Price updated correctly

### Test 3: Different Items from Same Game

**Steps:**

1. Go to PUBG joki
2. Add "Crown" (Qty: 3)
3. Go back to PUBG joki
4. Add "Ace" (Qty: 2)

**Expected:**

- ✅ 2 separate items in cart
- ✅ Both show "PUBG - [Rank]"
- ✅ Can select both for checkout

### Test 4: Mix Services

**Steps:**

1. Add Robux Instant (50K)
2. Add PUBG Joki - Crown
3. Add Blox Fruits Gamepass - Leopard

**Expected:**

```
💎 ROBUX INSTANT (1 item)
  ☐ 50000 Robux Instant

📦 JOKI (1 item)
  ☐ PUBG - Crown

🎮 GAMEPASS (1 item)
  ☐ Blox Fruits - Leopard Fruit
```

- ✅ Grouped by category
- ✅ Can only select from one category
- ✅ Error if try to select across categories

---

## 🔍 Debugging

### Check if Items are Separate

**Browser Console:**

```javascript
// After adding items, check cart API response
GET /api/cart?userId=xxx

Response: {
  items: [
    { _id: "1", serviceName: "PUBG - Crown", quantity: 3 },
    { _id: "2", serviceName: "PUBG - Ace", quantity: 2 }
  ]
}
```

### Check Duplicate Detection

**Server Console:**

```
Added new item to cart: {
  serviceName: 'PUBG - Crown',
  quantity: 3
}

Updated existing item quantity: {
  serviceName: 'PUBG - Crown',  // Same item added again
  newQuantity: 5
}
```

---

## 📝 Modified Files

1. ✅ `app/api/cart/route.ts`

   - Enhanced duplicate check to include `serviceName`
   - Added console logs for debugging

2. ✅ `app/(public)/cart/page.tsx`
   - Changed display from `item.itemName` to `item.serviceName`
   - Shows full context (Game - Item)

---

## 🚀 Status

✅ **FIXED**

- Each item with different `serviceName` appears separately
- Same item with same `serviceName` increases quantity
- Cart displays full item name with context
- Category grouping works correctly

**Ready to test!**

**Last Updated:** October 6, 2025
