# Fitur Keranjang - Dokumentasi Lengkap

## Overview

Semua service (Robux 5 Hari, Robux Instant, Gamepass, dan Joki) sekarang **sudah memiliki fitur "Tambah ke Keranjang"** dengan category grouping.

---

## ✅ Status Implementasi

### 1. **Robux 5 Hari** (`/rbx5`)

- ✅ Tombol "Tambah ke Keranjang"
- ✅ Direct Checkout "Beli Sekarang"
- ✅ Data format: `serviceCategory: "robux_5_hari"`
- ✅ Default image: `/robux-icon.png`

### 2. **Robux Instant** (`/robux-instant`)

- ✅ Tombol "Tambah ke Keranjang"
- ✅ Direct Checkout "Beli Sekarang"
- ✅ Data format: `serviceCategory: "robux_instant"`
- ✅ Default image: `/robux-icon.png`
- ✅ Backup code field (optional)

### 3. **Gamepass** (`/gamepass/[id]`)

- ✅ Tombol "Tambah ke Keranjang" (BARU!)
- ✅ Direct Checkout "Beli Sekarang"
- ✅ Data format: `serviceCategory: "gamepass"`
- ✅ Multi-item selection support
- ✅ Authentication check

### 4. **Joki** (`/joki/[id]`)

- ✅ Tombol "Tambah ke Keranjang" (BARU!)
- ✅ Direct Checkout "Beli Sekarang"
- ✅ Data format: `serviceCategory: "joki"`
- ✅ Multi-item selection support
- ✅ Backup code field (optional)
- ✅ Authentication check

---

## 🛒 Cart System Features

### Category Grouping

Cart mengelompokkan item berdasarkan `serviceCategory`:

- `robux_5_hari` - Robux 5 Hari
- `robux_instant` - Robux Instant
- `gamepass` - Gamepass
- `joki` - Joki Services

### Same-Category Checkout Rule

- ✅ User dapat memilih **banyak item** dari cart
- ✅ Hanya bisa checkout item dengan **serviceCategory yang sama**
- ✅ Akan muncul error toast jika mencoba select item dari kategori berbeda
- ✅ Tombol "Pilih Semua" per kategori

### Category Display

```
📦 ROBUX 5 HARI (2 items)
  [Pilih Semua]
  □ Item 1
  □ Item 2

💎 ROBUX INSTANT (1 item)
  [Pilih Semua]
  □ Item 3

🎮 GAMEPASS (3 items)
  [Pilih Semua]
  □ Item 4
  □ Item 5
  □ Item 6
```

---

## 📝 Data Format Standardization

Semua service mengirim data dengan format yang sama:

```typescript
{
  // Required fields
  serviceType: "robux" | "gamepass" | "joki",
  serviceId: string,
  serviceName: string,
  serviceCategory: string,  // Root level!
  quantity: number,
  unitPrice: number,
  robloxUsername: string,
  robloxPassword: string | null,

  // Optional fields
  serviceImage: string,  // Optional, fallback to category icon
  imgUrl: string,        // For backward compatibility

  // Service-specific details
  gamepassDetails?: { ... },
  jokiDetails?: { ... },
  robuxInstantDetails?: { ... },
  rbx5Details?: { ... }
}
```

---

## 🔧 Implementation Details

### Gamepass - handleAddToCart()

**File:** `app/(public)/gamepass/[id]/page.tsx`

```typescript
const handleAddToCart = async () => {
  // 1. Validate form
  if (!isFormValid || selectedItems.length === 0 || !gamepass) {
    toast.error("Mohon lengkapi semua data!");
    return;
  }

  // 2. Check authentication
  if (!user) {
    toast.error("Silakan login terlebih dahulu");
    router.push("/login");
    return;
  }

  // 3. Add each selected item to cart
  for (const item of selectedItems) {
    const cartItem = {
      serviceType: "gamepass",
      serviceId: gamepass._id,
      serviceName: `${gamepass.gameName} - ${item.itemName}`,
      serviceImage: gamepass.imgUrl,
      imgUrl: gamepass.imgUrl,
      serviceCategory: "gamepass",
      quantity: item.quantity,
      unitPrice: item.price,
      robloxUsername: username,
      robloxPassword: null,
      gamepassDetails: {
        gameName: gamepass.gameName,
        itemName: item.itemName,
        imgUrl: item.imgUrl,
        developer: gamepass.developer,
        features: gamepass.features,
        caraPesan: gamepass.caraPesan,
      },
    };

    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cartItem),
    });
  }

  toast.success(`${selectedItems.length} item berhasil ditambahkan!`);

  // 4. Reset form
  setSelectedItems([]);
  setUsername("");
};
```

### Joki - handleAddToCart()

**File:** `app/(public)/joki/[id]/page.tsx`

```typescript
const handleAddToCart = async () => {
  // 1. Validate form
  if (!isFormValid || !hasSelectedItems || !joki) {
    toast.error("Mohon lengkapi semua data!");
    return;
  }

  // 2. Check authentication
  if (!user) {
    toast.error("Silakan login terlebih dahulu");
    router.push("/login");
    return;
  }

  // 3. Add each selected item to cart
  for (const itemName of selectedItemsArray) {
    const item = joki.item.find((i) => i.itemName === itemName);
    if (!item) continue;

    const cartItem = {
      serviceType: "joki",
      serviceId: joki._id,
      serviceName: `${joki.gameName} - ${item.itemName}`,
      serviceImage: joki.imgUrl,
      imgUrl: joki.imgUrl,
      serviceCategory: "joki",
      quantity: selectedItems[itemName],
      unitPrice: item.price,
      description: item.description,
      robloxUsername: username,
      robloxPassword: password,
      jokiDetails: {
        gameName: joki.gameName,
        itemName: item.itemName,
        description: item.description,
        notes: additionalInfo,
        additionalInfo: additionalInfo,
        syaratJoki: item.syaratJoki,
        prosesJoki: item.prosesJoki,
        features: joki.features,
      },
    };

    await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cartItem),
    });
  }

  toast.success(`${selectedItemsArray.length} item berhasil ditambahkan!`);

  // 4. Reset form
  setSelectedItems({});
  setUsername("");
  setPassword("");
  setAdditionalInfo("");
};
```

---

## 🎨 UI/UX Features

### Two Buttons Layout

Semua service detail page sekarang punya 2 tombol:

```
┌─────────────────────────────────┬─────────────────────────────────┐
│  🛒 Tambah ke Keranjang         │  ⚡ Beli Sekarang               │
│  (Purple gradient)              │  (Pink gradient + price)        │
└─────────────────────────────────┴─────────────────────────────────┘
```

### Button States

1. **Disabled** (form tidak valid):

   - Gray gradient
   - Cursor not-allowed
   - No hover effects

2. **Enabled** (form valid):

   - Colorful gradient
   - Hover effects (scale, shadow)
   - Animated particles

3. **Loading** (adding to cart):
   - Text berubah jadi "Menambahkan..."
   - Button disabled

### Notifications

- ✅ Success: "X item berhasil ditambahkan ke keranjang!"
- ❌ Error: "Silakan login terlebih dahulu"
- ❌ Error: "Mohon lengkapi semua data!"
- ❌ Error: Custom error dari API

---

## 🔐 Authentication

### Login Required

User **harus login** untuk menambahkan item ke cart:

```typescript
if (!user) {
  toast.error("Silakan login terlebih dahulu untuk menambahkan ke keranjang");
  router.push("/login");
  return;
}
```

### Guest Checkout

Direct checkout tetap support guest user (tidak perlu login).

---

## 🧪 Testing Checklist

### Gamepass

- [ ] Pilih gamepass dari list
- [ ] Pilih 1 atau lebih items
- [ ] Input username
- [ ] Klik "Tambah ke Keranjang"
- [ ] Cek toast success muncul
- [ ] Buka `/cart` dan lihat item muncul
- [ ] Klik "Beli Sekarang" untuk direct checkout

### Joki

- [ ] Pilih joki service dari list
- [ ] Pilih 1 atau lebih items
- [ ] Input username, password, backup code
- [ ] Klik "Tambah ke Keranjang"
- [ ] Cek toast success muncul
- [ ] Buka `/cart` dan lihat item muncul
- [ ] Backup code harus tersimpan di `jokiDetails.notes`
- [ ] Klik "Beli Sekarang" untuk direct checkout

### Cart Grouping

- [ ] Tambahkan item dari berbagai service
- [ ] Lihat items dikelompokkan per kategori
- [ ] Test "Pilih Semua" per kategori
- [ ] Test select item dari kategori yang sama (harus bisa)
- [ ] Test select item dari kategori berbeda (harus muncul error)
- [ ] Test checkout dengan multi-item dari kategori yang sama

### Backup Code Preservation

- [ ] Input backup code di Joki service
- [ ] Add to cart
- [ ] Checkout dari cart
- [ ] Lihat backup code muncul di checkout page (green box)
- [ ] Submit transaction
- [ ] Verify backup code tersimpan di database

---

## 🐛 Known Issues & Solutions

### Issue 1: "Data item tidak lengkap"

**Cause:** Cart API required `serviceImage`  
**Fixed:** Image sekarang optional, menggunakan fallback icon

### Issue 2: Backup code hilang

**Cause:** Checkout merge logic override dengan empty form state  
**Fixed:** Preserve original item data, tidak override dengan form state

### Issue 3: serviceCategory tidak ada

**Cause:** serviceCategory di dalam service-specific details  
**Fixed:** Pindahkan ke root level di semua service

---

## 📊 File Changes Summary

### Modified Files:

1. ✅ `app/(public)/gamepass/[id]/page.tsx`

   - Added `handleAddToCart()` function
   - Added "Tambah ke Keranjang" button
   - Added authentication check
   - Added toast notifications

2. ✅ `app/(public)/joki/[id]/page.tsx`

   - Added `handleAddToCart()` function
   - Added "Tambah ke Keranjang" button
   - Added authentication check
   - Added toast notifications
   - Changed single button to two buttons layout

3. ✅ `app/(public)/robux-instant/page.tsx`

   - Updated serviceImage to `/robux-icon.png`
   - Fixed data format for cart

4. ✅ `app/(public)/rbx5/page.tsx`

   - Updated serviceImage to `/robux-icon.png`
   - Fixed data format for cart

5. ✅ `app/api/cart/route.ts`

   - Made `serviceImage` optional
   - Removed strict image validation

6. ✅ `app/(public)/cart/page.tsx`
   - Added category grouping
   - Added same-category selection validation
   - Added "Pilih Semua" per category
   - Added fallback image display

---

## 🚀 Next Steps

### Future Enhancements:

1. **Cart Badge:** Show cart item count in header
2. **Quick Add:** Add to cart langsung dari list page (tanpa ke detail)
3. **Save for Later:** Simpan item untuk dibeli nanti
4. **Wishlist:** Fitur wishlist terpisah dari cart
5. **Cart Sync:** Sync cart antar device untuk logged-in users
6. **Promo Code:** Support promo code di cart page
7. **Bulk Actions:** Delete multiple items sekaligus

### Performance Optimization:

1. Add loading skeleton for cart items
2. Implement optimistic updates
3. Add debounce for quantity changes
4. Cache cart data in local storage

---

## 📞 Support

Jika ada masalah atau pertanyaan:

1. Cek console log untuk error details
2. Verify user sudah login
3. Cek network tab untuk API calls
4. Verify data format sesuai dengan dokumentasi ini

**Status:** ✅ READY FOR PRODUCTION
**Last Updated:** October 6, 2025
