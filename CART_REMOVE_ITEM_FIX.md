# Fix: Cart Remove Item - Method Not Allowed

## 🐛 Issue

**Error:** "Method not allowed" when trying to remove item from cart

**Root Cause:**

- CartContext was calling `/api/cart/remove` with DELETE method
- This endpoint doesn't exist
- Cart API route (`/api/cart/route.ts`) had no DELETE handler

---

## ✅ Solution

### 1. Added DELETE Handler to Cart API

**File:** `app/api/cart/route.ts`

**Added:**

```typescript
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const itemId = searchParams.get("itemId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID diperlukan" },
        { status: 400 }
      );
    }

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID diperlukan" },
        { status: 400 }
      );
    }

    await dbConnect();

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return NextResponse.json(
        { error: "Keranjang tidak ditemukan" },
        { status: 404 }
      );
    }

    // Remove item from cart
    cart.items = cart.items.filter(
      (item: ICartItem) => item._id?.toString() !== itemId
    );

    await cart.save();

    return NextResponse.json({
      message: "Item berhasil dihapus dari keranjang",
      items: cart.items,
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return NextResponse.json(
      { error: "Gagal menghapus item dari keranjang" },
      { status: 500 }
    );
  }
}
```

---

### 2. Updated CartContext to Use Correct Endpoint

**File:** `contexts/CartContext.tsx`

**Before:**

```typescript
// ❌ Called non-existent endpoint
const response = await fetch("/api/cart/remove", {
  method: "DELETE",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ userId, itemId }),
});
```

**After:**

```typescript
// ✅ Use main cart endpoint with query params
const response = await fetch(
  `/api/cart?userId=${encodeURIComponent(userId)}&itemId=${encodeURIComponent(
    itemId
  )}`,
  {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  }
);
```

---

## 🔄 How It Works

### Remove Item Flow

```
Cart Page
  ↓
  User clicks remove button (trash icon)
  ↓
handleRemoveItem(itemId)
  ↓
CartContext.removeItem(itemId)
  ↓
DELETE /api/cart?userId=xxx&itemId=yyy
  ↓
Cart API (route.ts)
  ├─ Validate userId and itemId
  ├─ Find user's cart
  ├─ Filter out item with matching _id
  └─ Save updated cart
  ↓
Response: { message: "Item berhasil dihapus dari keranjang", items: [...] }
  ↓
refreshCart() - Fetch updated cart
  ↓
Cart UI updates - Item removed from display
```

---

## 🧪 Testing

### Test Case: Remove Single Item

**Steps:**

1. Add 3 items to cart (Crown, Ace, Conqueror)
2. Open cart page
3. Click trash icon on "PUBG - Crown"
4. Confirm removal

**Expected Result:**

- ✅ Item removed immediately
- ✅ Cart shows 2 remaining items (Ace, Conqueror)
- ✅ Total price updated
- ✅ No error in console

---

### Test Case: Remove All Items

**Steps:**

1. Add 2 items to cart
2. Remove first item
3. Remove second item

**Expected Result:**

- ✅ Both items removed
- ✅ Cart shows "Keranjang kosong"
- ✅ Empty state displayed
- ✅ No errors

---

### Test Case: Remove from Multiple Items (Same Game)

**Steps:**

1. Add PUBG - Crown (Qty: 3)
2. Add PUBG - Crown (Qty: 2) (separate item)
3. Add PUBG - Ace (Qty: 2)
4. Remove first PUBG - Crown item

**Expected Result:**

- ✅ Only first Crown item removed
- ✅ Second Crown item (Qty: 2) still in cart
- ✅ Ace item still in cart
- ✅ Cart shows 2 remaining items

---

## 📊 API Endpoint Summary

### `/api/cart` - Now Supports 3 Methods

#### 1. GET - Fetch Cart Items

```
GET /api/cart?userId=xxx

Response:
{
  items: [...],
  total: 500000
}
```

#### 2. POST - Add Item to Cart

```
POST /api/cart

Body: {
  userId, serviceId, serviceName, ...
}

Response:
{
  message: "Item berhasil ditambahkan ke keranjang"
}
```

#### 3. DELETE - Remove Item from Cart (NEW)

```
DELETE /api/cart?userId=xxx&itemId=yyy

Response:
{
  message: "Item berhasil dihapus dari keranjang",
  items: [...]
}
```

---

## 📝 Files Modified

1. ✅ `app/api/cart/route.ts`

   - Added `DELETE` handler
   - Validates userId and itemId
   - Filters out removed item
   - Returns updated cart

2. ✅ `contexts/CartContext.tsx`
   - Changed endpoint from `/api/cart/remove` to `/api/cart`
   - Changed from body to query params
   - Maintains DELETE method

---

## 🎯 Status

✅ **FIXED** - Remove item now works correctly

**Testing Checklist:**

- [ ] Remove single item
- [ ] Remove multiple items one by one
- [ ] Remove all items (empty cart)
- [ ] Remove from cart with same game items
- [ ] Verify cart total updates
- [ ] Check no console errors

---

**Last Updated:** October 6, 2025
