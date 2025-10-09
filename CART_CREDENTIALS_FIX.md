# Fix: Data Roblox Tidak Terkirim dari Cart ke Checkout

## 🐛 Problem

Ketika checkout Robux 5 Hari atau Robux Instant dari keranjang, data Roblox (username, password, backup code) tidak terkirim ke halaman checkout.

## 🔍 Root Cause

1. **AddToCartButton** tidak menerima dan mengirim prop `robloxUsername` dan `robloxPassword`
2. Halaman service (robux-instant, rbx5) tidak mengirim data username/password ke AddToCartButton
3. Data credentials yang diinput user di halaman service tidak tersimpan ke cart

## ✅ Solution

### 1. Update AddToCartButton Component

**File**: `components/AddToCartButton.tsx`

**Changes**:

```typescript
// Tambah interface props
interface AddToCartButtonProps {
  // ... existing props

  // User credentials
  robloxUsername?: string;
  robloxPassword?: string;
}

// Tambah destructuring props
export default function AddToCartButton({
  // ... existing props
  robloxUsername,
  robloxPassword,
}: AddToCartButtonProps) {
  // Kirim ke API cart
  const success = await addToCart({
    // ... existing data
    robloxUsername,
    robloxPassword,
  });
}
```

### 2. Update Robux Instant Page

**File**: `app/(public)/robux-instant/page.tsx`

**Changes**:

```tsx
<AddToCartButton
  // ... existing props
  robloxUsername={username}
  robloxPassword={password}
/>
```

### 3. Update Robux 5 Hari Page

**File**: `app/(public)/rbx5/page.tsx`

**Changes**:

```tsx
<AddToCartButton
  // ... existing props
  robloxUsername={username}
  // Tidak perlu password untuk rbx5
/>
```

### 4. Add Debug Logging di Cart Page

**File**: `app/(public)/cart/page.tsx`

**Changes**:

```typescript
console.log("=== CART CHECKOUT DEBUG ===");
console.log("Selected items from cart:", selectedItemsData);
console.log("Formatted checkout data:", checkoutData);
checkoutData.forEach((item, index) => {
  console.log(`Item ${index + 1} credentials:`, {
    serviceName: item.serviceName,
    robloxUsername: item.robloxUsername,
    hasPassword: !!item.robloxPassword,
  });
});
```

## 📊 Data Flow Sekarang

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SERVICE PAGE (robux-instant / rbx5)                      │
│    - User input username, password, backup code             │
│    - State: username, password, additionalInfo              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ADD TO CART BUTTON                                        │
│    - Receive: robloxUsername, robloxPassword                │
│    - Send to API: {...item, robloxUsername, robloxPassword}│
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CART API (/api/cart)                                     │
│    - Save to MongoDB Cart collection                         │
│    - Fields: robloxUsername, robloxPassword                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. CART PAGE                                                 │
│    - Load items from Cart API                                │
│    - Display items with credentials                          │
│    - User select items                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. CHECKOUT BUTTON                                           │
│    - Map items: robloxUsername, robloxPassword              │
│    - Save to sessionStorage                                  │
│    - Navigate to /checkout                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. CHECKOUT PAGE                                             │
│    - Load from sessionStorage                                │
│    - Detect multi-checkout mode                              │
│    - Display credentials per item                            │
│    - Submit with correct data                                │
└─────────────────────────────────────────────────────────────┘
```

## 🧪 Testing Steps

### Test 1: Robux Instant Single Item

1. Buka `/robux-instant`
2. Input:
   - Username: `testuser1`
   - Password: `testpass1`
   - Backup Code: `backup123`
3. Klik "Tambah ke Keranjang"
4. Buka browser console → Cek log AddToCart
5. Buka `/cart`
6. Select item → Klik "Checkout"
7. Buka browser console → Cek "CART CHECKOUT DEBUG"
8. ✅ **Expected**: robloxUsername dan robloxPassword terisi di checkout data

### Test 2: Robux 5 Hari Single Item

1. Buka `/rbx5`
2. Input:
   - Username: `testuser2`
   - Select place & gamepass
3. Klik "Tambah ke Keranjang"
4. Buka `/cart`
5. Select item → Klik "Checkout"
6. Buka browser console → Cek credentials
7. ✅ **Expected**: robloxUsername terisi, password kosong (tidak perlu untuk rbx5)

### Test 3: Multi-Checkout Robux Instant

1. Add 2x Robux Instant dengan username berbeda:
   - Item 1: username: `user1`, password: `pass1`
   - Item 2: username: `user2`, password: `pass2`
2. Di cart, select kedua item
3. Klik "Checkout"
4. Buka browser console → Cek array credentials
5. Di checkout page → Cek tampilan list items
6. ✅ **Expected**: Setiap item punya username/password masing-masing

### Test 4: Verify in MongoDB

1. Setelah add to cart, cek MongoDB collection `carts`
2. Find document dengan userId
3. Check field `items[].robloxUsername` dan `items[].robloxPassword`
4. ✅ **Expected**: Data tersimpan di database

## 🎯 Success Criteria

- [x] AddToCartButton menerima robloxUsername dan robloxPassword
- [x] Robux Instant page mengirim username & password ke AddToCartButton
- [x] Robux 5 Hari page mengirim username ke AddToCartButton
- [x] API Cart menyimpan credentials ke MongoDB
- [x] Cart page membaca credentials dari API
- [x] Checkout page menerima credentials dari cart
- [x] Multi-checkout mode menampilkan credentials per item
- [x] Debug logging untuk tracking data flow

## 📝 Notes

### Robux 5 Hari

- ✅ Username: Required
- ❌ Password: Tidak perlu (gamepass tidak perlu login)
- ✅ Backup Code: Optional (di additionalInfo)

### Robux Instant

- ✅ Username: Required
- ✅ Password: Required (perlu login untuk instant transfer)
- ✅ Backup Code: Optional (di robuxInstantDetails.notes)

### Joki

- ✅ Username: Required
- ✅ Password: Required
- ✅ Backup Code: Optional (di jokiDetails.notes)

### Gamepass

- ✅ Username: Required
- ❌ Password: Tidak perlu
- ❌ Backup Code: Tidak perlu

## 🔧 Related Files Modified

1. `components/AddToCartButton.tsx` - Add robloxUsername & robloxPassword props
2. `app/(public)/robux-instant/page.tsx` - Send credentials to button
3. `app/(public)/rbx5/page.tsx` - Send username to button
4. `app/(public)/cart/page.tsx` - Add debug logging
5. `contexts/CartContext.tsx` - Already has robloxUsername/Password in interface ✅
6. `app/api/cart/route.ts` - Already saves credentials ✅
7. `models/Cart.ts` - Already has credentials fields ✅
8. `app/checkout/page.tsx` - Already handles multi-checkout mode ✅

## ✅ Verification Checklist

- [x] Build passes without TypeScript errors
- [x] AddToCartButton accepts new props
- [x] Service pages send credentials
- [x] Cart API saves to database
- [x] Cart page loads credentials
- [x] Checkout page receives credentials
- [x] Multi-checkout displays per-item data
- [x] Console logs show correct data flow

---

**Status**: ✅ **FIXED**  
**Date**: 2025-01-09  
**Version**: 1.0
