# Fix: User ID Error di Cart - Gamepass & Joki

## 🐛 Issue

Error ketika menambahkan item ke keranjang dari Gamepass dan Joki:

```json
{ "error": "User ID diperlukan" }
```

## 🔍 Root Cause

Cart API (`/api/cart`) membutuhkan `userId` di request body, tapi Gamepass dan Joki tidak mengirimnya.

**Cart API Requirement:**

```typescript
// app/api/cart/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, serviceType, serviceId, ... } = body;

  if (!userId) {
    return NextResponse.json(
      { error: "User ID diperlukan" },
      { status: 400 }
    );
  }
  // ...
}
```

## ✅ Solution

### 1. Gamepass - Added userId to cartItem

**File:** `app/(public)/gamepass/[id]/page.tsx`

**Before:**

```typescript
const cartItem = {
  serviceType: "gamepass",
  serviceId: gamepass._id,
  serviceName: `${gamepass.gameName} - ${item.itemName}`,
  // ... other fields
};
```

**After:**

```typescript
const cartItem = {
  userId: user.id, // ✅ Added userId from auth context
  serviceType: "gamepass",
  serviceId: gamepass._id,
  serviceName: `${gamepass.gameName} - ${item.itemName}`,
  // ... other fields
};
```

### 2. Joki - Added userId to cartItem

**File:** `app/(public)/joki/[id]/page.tsx`

**Before:**

```typescript
const cartItem = {
  serviceType: "joki",
  serviceId: joki._id,
  serviceName: `${joki.gameName} - ${item.itemName}`,
  // ... other fields
};
```

**After:**

```typescript
const cartItem = {
  userId: user.id, // ✅ Added userId from auth context
  serviceType: "joki",
  serviceId: joki._id,
  serviceName: `${joki.gameName} - ${item.itemName}`,
  // ... other fields
};
```

## 📊 Comparison with Other Services

### ✅ Robux Instant & RBX5 (Already Working)

These services use `AddToCartButton` component which calls `CartContext.addToCart()`:

```typescript
// contexts/CartContext.tsx
const addToCart = async (item: Omit<CartItem, "_id">): Promise<boolean> => {
  if (!user) return false;

  const userId = (user as any)?.id || (user as any)?._id;

  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...item,
      userId, // ✅ Automatically added by CartContext
    }),
  });
  // ...
};
```

**Flow:**

1. Service page → AddToCartButton component
2. AddToCartButton → CartContext.addToCart()
3. CartContext automatically adds `userId` before API call
4. ✅ Works!

### ❌ Gamepass & Joki (Fixed Now)

These services call Cart API directly without using CartContext:

**Previous Flow:**

1. Service page → handleAddToCart() function
2. handleAddToCart() → Direct fetch to `/api/cart`
3. ❌ Missing `userId` in request body
4. ❌ Error: "User ID diperlukan"

**Fixed Flow:**

1. Service page → handleAddToCart() function
2. Get `userId` from `user.id` (AuthContext)
3. handleAddToCart() → fetch to `/api/cart` with `userId`
4. ✅ Works!

## 🔐 Auth Context User Type

```typescript
// contexts/AuthContext.tsx
interface User {
  id: string; // ✅ Use this for userId
  firstName: string;
  lastName: string;
  email: string;
  // ... other fields
}
```

**Important:** Use `user.id` NOT `user.uid` (property doesn't exist)

## 🧪 Testing Steps

### Gamepass Test:

1. Login ke aplikasi
2. Buka halaman Gamepass list
3. Pilih salah satu gamepass
4. Pilih items yang ingin dibeli
5. Input username
6. Klik "Tambah ke Keranjang"
7. ✅ Should show: "X item berhasil ditambahkan ke keranjang!"
8. ❌ Should NOT show: "User ID diperlukan"
9. Buka `/cart` dan verify item muncul

### Joki Test:

1. Login ke aplikasi
2. Buka halaman Joki list
3. Pilih salah satu joki service
4. Pilih items yang ingin dibeli
5. Input username, password, backup code
6. Klik "Tambah ke Keranjang"
7. ✅ Should show: "X item berhasil ditambahkan ke keranjang!"
8. ❌ Should NOT show: "User ID diperlukan"
9. Buka `/cart` dan verify item muncul

### Multi-Service Test:

1. Tambahkan item dari Robux Instant → Success
2. Tambahkan item dari RBX5 → Success
3. Tambahkan item dari Gamepass → Success ✅ (Fixed!)
4. Tambahkan item dari Joki → Success ✅ (Fixed!)
5. Buka `/cart` → All items grouped by category
6. Select items from same category → Success
7. Try select items from different category → Error toast (expected)

## 📝 Summary

### Modified Files:

1. ✅ `app/(public)/gamepass/[id]/page.tsx`

   - Line ~159: Added `userId: user.id` to cartItem

2. ✅ `app/(public)/joki/[id]/page.tsx`
   - Line ~165: Added `userId: user.id` to cartItem

### Why Different Implementation?

**Robux Services:**

- Use shared `AddToCartButton` component
- CartContext handles userId automatically
- Centralized logic

**Gamepass & Joki:**

- Have custom multi-item selection UI
- Direct API calls in handleAddToCart
- Need to manually add userId

Both approaches are valid, just different patterns.

## 🚀 Status

✅ **FIXED** - Ready to test

- Gamepass add to cart with userId
- Joki add to cart with userId
- No more "User ID diperlukan" error

**Last Updated:** October 6, 2025
