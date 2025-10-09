# Multi-Checkout Cart dengan Credentials Management

## 📋 Overview

Sistem checkout sekarang mendukung 2 mode berbeda:

1. **Single Checkout Langsung** - Checkout langsung dari halaman service (1 item atau multiple item identik)
2. **Multi-Checkout dari Cart** - Checkout multiple items dari cart dengan data berbeda per item

## 🎯 Problem yang Diperbaiki

### Problem Sebelumnya:

- Ketika user checkout multiple items dari cart (Robux 5 Hari, Robux Instant, Joki, Gamepass)
- Setiap item di cart sudah punya data Roblox sendiri (username, password, backup code)
- **Data tersebut hilang** di halaman checkout
- Checkout page hanya menggunakan 1 form global untuk semua items
- User harus input ulang credentials di checkout page

### Setelah Diperbaiki:

✅ **Multi-checkout dari cart**: Data credentials dari setiap item tetap terbawa dan ditampilkan
✅ **Single checkout**: Tetap menggunakan form global seperti sebelumnya
✅ **Backup code**: Tersimpan dan terbawa untuk semua kategori service
✅ **Validation**: Sesuai dengan mode checkout (form vs item data)

---

## 🔧 Technical Implementation

### 1. Cart Page (`app/(public)/cart/page.tsx`)

#### Data yang Disimpan per Item:

```typescript
const checkoutData = selectedItemsData.map((item) => ({
  // Basic service info
  serviceType: item.serviceType,
  serviceId: item.serviceId,
  serviceName: item.serviceName,
  quantity: item.quantity,
  unitPrice: item.unitPrice,

  // User credentials (dari form InputUsername saat add to cart)
  robloxUsername: item.robloxUsername,
  robloxPassword: item.robloxPassword,

  // Service-specific details dengan backup code
  jokiDetails: {
    gameType: item.gameType,
    notes: item.additionalInfo, // Backup code untuk Joki
    additionalInfo: item.additionalInfo,
  },

  robuxInstantDetails: {
    notes: item.additionalInfo, // Backup code untuk Robux Instant
    additionalInfo: item.additionalInfo,
  },

  rbx5Details: {
    backupCode: item.additionalInfo, // Backup code untuk Robux 5 Hari
  },

  gamepassDetails: item.gamepassDetails, // Gamepass tidak perlu password
}));

// Simpan ke sessionStorage
sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
```

---

### 2. Checkout Page (`app/checkout/page.tsx`)

#### State Management:

```typescript
// Track jika ini multi-checkout dari cart
const [isMultiCheckoutFromCart, setIsMultiCheckoutFromCart] = useState(false);

// Form data (untuk single checkout)
const [robloxUsername, setRobloxUsername] = useState("");
const [robloxPassword, setRobloxPassword] = useState("");
```

#### Detection Logic:

```typescript
// Load data dari sessionStorage
const itemsArray = Array.isArray(parsedData) ? parsedData : [parsedData];

// Check if multi-checkout dari cart
const hasItemCredentials = itemsArray.some(
  (item) => item.robloxUsername || item.robloxPassword
);
const isMultiCheckout = itemsArray.length > 1 && hasItemCredentials;

setIsMultiCheckoutFromCart(isMultiCheckout);
```

#### Data Handling:

```typescript
// Prepare items untuk submit
const itemsWithCredentials = checkoutData.items.map((item) => {
  // Multi-checkout: gunakan data dari item
  // Single checkout: gunakan data dari form
  const itemUsername = isMultiCheckoutFromCart
    ? item.robloxUsername
    : robloxUsername;

  const itemPassword = isMultiCheckoutFromCart
    ? item.robloxPassword
    : item.serviceType === "gamepass" || item.rbx5Details
    ? ""
    : robloxPassword;

  return {
    ...item,
    robloxUsername: itemUsername,
    robloxPassword: itemPassword,

    // Preserve backup code
    jokiDetails: item.jokiDetails,
    robuxInstantDetails: item.robuxInstantDetails,
    rbx5Details: item.rbx5Details,
  };
});
```

#### Validation Logic:

```typescript
// Multi-checkout: validasi data sudah ada di item
if (!isMultiCheckoutFromCart) {
  // Single checkout: validasi form
  if (!robloxUsername.trim()) {
    toast.error("Username Roblox harus diisi");
    return;
  }

  if (requiresPassword && !robloxPassword.trim()) {
    toast.error("Password Roblox harus diisi");
    return;
  }
} else {
  // Multi-checkout: validasi setiap item punya credentials
  const missingCredentials = checkoutData.items.some(
    (item) => !item.robloxUsername
  );

  if (missingCredentials) {
    toast.error("Ada item yang belum memiliki data Roblox");
    return;
  }
}
```

---

## 🎨 UI/UX Changes

### Multi-Checkout Display:

Ketika `isMultiCheckoutFromCart = true`, checkout page menampilkan:

1. **Badge "Data dari Cart"** di header section
2. **Info Alert** menjelaskan data diambil dari cart
3. **List Items dengan Credentials**:

   ```
   #1 - Robux Instant 100K
        Username: ✓ player123
        Password: ✓ ••••••
        Backup Code: ✓

   #2 - Joki Rank Silver
        Username: ✓ player456
        Password: ✓ ••••••
        Backup Code: ✓
   ```

### Single Checkout Display:

Ketika `isMultiCheckoutFromCart = false`, checkout page menampilkan:

1. **Form Input** untuk Username & Password
2. **Backup Code Display** (read-only) jika ada dari service page
3. **Standard validation** untuk required fields

---

## 📊 Data Flow Diagram

```
SERVICE PAGE
    ↓ (user input username/password/backup code)
ADD TO CART BUTTON
    ↓ (data disimpan ke CartItem)
CART PAGE
    ↓ (user select multiple items)
CHECKOUT BUTTON
    ↓ (data dikirim ke sessionStorage)
    ├─→ Multiple items + hasCredentials = Multi-Checkout Mode
    └─→ Single item / no credentials = Single Checkout Mode
CHECKOUT PAGE
    ├─→ Multi-Checkout: Display item credentials
    └─→ Single Checkout: Show input form
SUBMIT
    ↓ (merge data sesuai mode)
CREATE TRANSACTION API
```

---

## 🔐 Data Credentials per Service Category

### Robux 5 Hari (`robux_5_hari`)

- ✅ Username Roblox (required)
- ❌ Password (tidak perlu)
- ✅ Backup Code (optional, disimpan di `rbx5Details.backupCode`)

### Robux Instant (`robux_instant`)

- ✅ Username Roblox (required)
- ✅ Password Roblox (required)
- ✅ Backup Code (optional, disimpan di `robuxInstantDetails.notes`)

### Joki (`joki`)

- ✅ Username Roblox (required)
- ✅ Password Roblox (required)
- ✅ Backup Code (optional, disimpan di `jokiDetails.notes`)

### Gamepass (`gamepass`)

- ✅ Username Roblox (required)
- ❌ Password (tidak perlu)
- ❌ Backup Code (tidak perlu)

---

## 🧪 Testing Scenarios

### Scenario 1: Multi-Checkout Robux Instant

```
1. Buka halaman Robux Instant
2. Input username: player1, password: pass1, backup: code1
3. Add to cart
4. Buka halaman Robux Instant lagi
5. Input username: player2, password: pass2, backup: code2
6. Add to cart
7. Di cart, select kedua item
8. Click checkout
9. ✅ Halaman checkout menampilkan data 2 items berbeda
10. ✅ Submit berhasil dengan data masing-masing item
```

### Scenario 2: Multi-Checkout Mixed Categories

```
1. Add Robux 5 Hari (username: player1, backup: code1)
2. Add Joki (username: player2, password: pass2, backup: code2)
3. ❌ Cart validation: Tidak bisa select beda kategori
4. ✅ System mencegah checkout mixed categories
```

### Scenario 3: Single Checkout Langsung

```
1. Buka halaman Robux Instant
2. Input username: player1, password: pass1
3. Klik "Pesan Sekarang" (bypass cart)
4. ✅ Checkout page tampil form dengan data pre-filled
5. ✅ User bisa edit jika perlu
6. ✅ Submit dengan data dari form
```

---

## 🐛 Known Issues & Solutions

### Issue 1: Data Hilang saat Reload Checkout Page

**Problem**: SessionStorage cleared on refresh
**Solution**: Data persists di cart. User harus checkout ulang dari cart.

### Issue 2: Backup Code tidak Tampil

**Problem**: Backup code ada di `additionalInfo` tapi field berbeda per service
**Solution**: Mapping di cart:

- Joki → `jokiDetails.notes`
- Robux Instant → `robuxInstantDetails.notes`
- Rbx 5 Hari → `rbx5Details.backupCode`

### Issue 3: Password Required Validation

**Problem**: Gamepass & Rbx 5 Hari tidak perlu password
**Solution**: Check `serviceType` dan `rbx5Details`:

```typescript
const itemPassword = isMultiCheckoutFromCart
  ? item.robloxPassword
  : item.serviceType === "gamepass" || item.rbx5Details
  ? ""
  : robloxPassword;
```

---

## ✅ Success Criteria

- [x] Multi-checkout dari cart membawa semua credentials per item
- [x] Single checkout menggunakan form global
- [x] Backup code tersimpan dan terbawa untuk semua kategori
- [x] Validation sesuai dengan mode checkout
- [x] UI menampilkan info yang jelas tentang mode checkout
- [x] Data tidak hilang saat submit transaction
- [x] Admin menerima credentials yang benar untuk setiap item

---

## 📝 Developer Notes

### Jangan Lakukan:

❌ Override data item credentials dengan form global di multi-checkout
❌ Clear sessionStorage sebelum submit transaction
❌ Merge backup code dari form additionalNotes ke item details

### Selalu Lakukan:

✅ Preserve item credentials dari cart
✅ Check `isMultiCheckoutFromCart` sebelum gunakan form data
✅ Map backup code ke field yang benar per service type
✅ Validate credentials sesuai mode checkout

---

## 🔄 Future Improvements

1. **Edit Credentials di Checkout**: Allow user edit individual item credentials
2. **Batch Edit**: Edit username/password untuk semua items sekaligus
3. **Validation per Item**: Show validation error per item, bukan global
4. **Credential Preview**: Show masked password preview di cart page
5. **Auto-fill**: Suggest recently used usernames

---

**Last Updated**: 2025-01-09
**Version**: 2.0
**Status**: ✅ Production Ready
