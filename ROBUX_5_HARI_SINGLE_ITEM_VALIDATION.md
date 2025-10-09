# ⚠️ Robux 5 Hari - Single Item Validation

## 🎯 **CRITICAL BUSINESS RULE**

**Robux 5 Hari HANYA BOLEH 1 ITEM PER CHECKOUT**

### **Alasan:**

Robux 5 Hari menggunakan **automasi gamepass creation** yang:

1. Harus dijalankan **per-transaction** oleh webhook Midtrans atau admin
2. Memerlukan data gamepass specific (placeId, sellerId, productId) dari setiap transaction
3. Tidak bisa di-batch process karena setiap gamepass harus dibuat secara individual di Roblox API

Jika multiple items diizinkan, maka:

- ❌ Automasi webhook tidak bisa menentukan gamepass mana yang harus dibuat
- ❌ Admin harus manual memilih item mana yang akan diproses
- ❌ Data gamepass (productId, sellerId) bisa tercampur antar items
- ❌ Proses error handling menjadi kompleks (bagaimana jika 1 item gagal?)

---

## ✅ **Validasi yang Sudah Diterapkan**

### **1. Frontend - Cart Page**

📁 `app/(public)/cart/page.tsx` (Line 122-141)

```tsx
if (category === "robux_5_hari") {
  const categoryItems = groupedItems[category] || [];
  const categoryItemIds = categoryItems.map((item) => item._id);

  // Check if any item is selected
  const anySelected = categoryItemIds.some((id) => selectedItems.includes(id));

  if (anySelected) {
    // Deselect all
    setSelectedItems([]);
  } else {
    // Select only the first item
    if (categoryItemIds.length > 0) {
      setSelectedItems([categoryItemIds[0]]);
      toast.info("Robux 5 Hari: Hanya 1 item yang dapat dipilih per checkout");
    }
  }
  return;
}
```

**Behavior:**

- User hanya bisa select **1 item Rbx 5 Hari** dari cart
- Jika user mencoba select multiple, sistem otomatis hanya select 1 item
- Toast notification muncul untuk menginformasikan user

---

### **2. Frontend - RBX5 Page**

📁 `app/(public)/rbx5/page.tsx` (Line 609-645)

```tsx
const checkoutItems = [
  {
    serviceType: "robux",
    serviceId: selectedPackage?._id || `custom_${robux}`,
    serviceName: selectedPackage?.name || `${robux} Robux (5 Hari)`,
    serviceCategory: "robux_5_hari",
    quantity: 1, // ALWAYS 1
    unitPrice: price,
    robloxUsername: username,
    rbx5Details: {
      robuxAmount: robux,
      packageName: selectedPackage?.name || `Custom ${robux} Robux`,
      selectedPlace: selectedPlace ? {...} : null,
      gamepassAmount: getGamepassAmount(),
      gamepassCreated: gamepassInstructionShown,
      gamepass: gamepassCheckResult?.gamepass || null,
      pricePerRobux: currentRobuxPricing,
    },
  },
];
```

**Behavior:**

- RBX5 page **SELALU** membuat checkout dengan **1 item saja**
- Quantity hardcoded ke `1`
- User tidak bisa mengubah quantity (berbeda dengan Robux Instant)

---

### **3. Backend - Cart Multi Checkout API**

📁 `app/api/transactions/multi/route.ts` (Line 27-48)

```typescript
// CRITICAL: Validasi Rbx 5 Hari hanya boleh 1 item per checkout
// Karena ada automasi gamepass creation yang harus dijalankan per-transaction
const rbx5Items = items.filter(
  (item) =>
    item.serviceCategory === "robux_5_hari" ||
    (item.serviceType === "robux" && item.rbx5Details)
);

if (rbx5Items.length > 1) {
  return NextResponse.json(
    {
      error:
        "Rbx 5 Hari: Hanya dapat checkout 1 item per transaksi karena ada automasi gamepass creation. Silakan checkout item Rbx 5 Hari secara terpisah.",
    },
    { status: 400 }
  );
}
```

**Behavior:**

- API memeriksa **SEMUA items** yang akan di-checkout
- Filter items yang merupakan Rbx 5 Hari (by `serviceCategory` atau `rbx5Details`)
- Jika ditemukan **lebih dari 1** item Rbx 5 Hari → **REJECT** dengan error 400
- Error message jelas menjelaskan alasan rejection

---

### **4. Backend - Direct Purchase Multi-Item API**

📁 `app/api/transactions/route.ts` - `handleMultiItemDirectPurchase()` (Line 283-304)

```typescript
// CRITICAL: Validasi Rbx 5 Hari hanya boleh 1 item per checkout
// Karena ada automasi gamepass creation yang harus dijalankan per-transaction
const rbx5Items = items.filter(
  (item: any) =>
    item.serviceCategory === "robux_5_hari" ||
    (item.serviceType === "robux" && item.rbx5Details)
);

if (rbx5Items.length > 1) {
  return NextResponse.json(
    {
      error:
        "Rbx 5 Hari: Hanya dapat checkout 1 item per transaksi karena ada automasi gamepass creation. Silakan checkout item Rbx 5 Hari secara terpisah.",
    },
    { status: 400 }
  );
}
```

**Behavior:**

- Sama seperti cart checkout API
- Validasi diterapkan **SEBELUM** pembuatan transaction
- Mencegah bypass melalui direct API call

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Normal Rbx5 Checkout (Valid)**

```json
POST /api/transactions
{
  "items": [
    {
      "serviceType": "robux",
      "serviceCategory": "robux_5_hari",
      "serviceName": "1000 Robux (5 Hari)",
      "quantity": 1,
      "unitPrice": 100000,
      "rbx5Details": {
        "robuxAmount": 1000,
        "gamepass": { "id": "...", "productId": "...", "sellerId": "..." }
      }
    }
  ]
}
```

✅ **Expected:** Transaction created successfully

---

### **Scenario 2: Multiple Rbx5 Items (Invalid)**

```json
POST /api/transactions/multi
{
  "items": [
    {
      "serviceType": "robux",
      "serviceCategory": "robux_5_hari",
      "serviceName": "1000 Robux (5 Hari)",
      "rbx5Details": { ... }
    },
    {
      "serviceType": "robux",
      "serviceCategory": "robux_5_hari",
      "serviceName": "2000 Robux (5 Hari)",
      "rbx5Details": { ... }
    }
  ]
}
```

❌ **Expected:**

- Status: 400 Bad Request
- Error: "Rbx 5 Hari: Hanya dapat checkout 1 item per transaksi karena ada automasi gamepass creation. Silakan checkout item Rbx 5 Hari secara terpisah."

---

### **Scenario 3: Mixed Services with 1 Rbx5 (Valid)**

```json
POST /api/transactions/multi
{
  "items": [
    {
      "serviceType": "robux",
      "serviceCategory": "robux_5_hari",
      "serviceName": "1000 Robux (5 Hari)",
      "rbx5Details": { ... }
    },
    {
      "serviceType": "joki",
      "serviceName": "Crown of Madness Joki",
      "jokiDetails": { ... }
    }
  ]
}
```

✅ **Expected:** Transactions created successfully (mixed services allowed as long as Rbx5 ≤ 1)

---

### **Scenario 4: Multiple Robux Instant (Valid)**

```json
POST /api/transactions/multi
{
  "items": [
    {
      "serviceType": "robux",
      "serviceCategory": "robux_instant",
      "serviceName": "500 Robux (Instant)",
      "robuxInstantDetails": { ... }
    },
    {
      "serviceType": "robux",
      "serviceCategory": "robux_instant",
      "serviceName": "1000 Robux (Instant)",
      "robuxInstantDetails": { ... }
    }
  ]
}
```

✅ **Expected:** Transactions created successfully (Robux Instant tidak ada batasan)

---

## 🛡️ **Security & Edge Cases**

### **1. API Direct Call Bypass**

❌ **Attempt:** User bypass frontend dan call API langsung dengan multiple Rbx5 items
✅ **Protection:** Backend validation akan reject request dengan error 400

### **2. Modified Client Code**

❌ **Attempt:** User modify client-side JavaScript untuk enable multiple selection
✅ **Protection:** Backend validation tetap akan reject di API level

### **3. Race Condition**

❌ **Attempt:** User buka 2 tabs dan checkout Rbx5 secara bersamaan
✅ **Protection:** Setiap request divalidasi independently, kedua request akan berhasil karena masing-masing hanya 1 item

### **4. Mixed with Other Services**

✅ **Allowed:** User bisa checkout 1 Rbx5 + multiple gamepass/joki dalam satu cart
✅ **Validation:** Backend hanya check count dari Rbx5 items, tidak restrict services lain

---

## 🔄 **Webhook & Admin Processing**

### **Webhook Auto-Processing (Planned)**

```typescript
// Webhook akan check transaction type
if (transaction.serviceCategory === "robux_5_hari") {
  // 1. Extract gamepass data
  const gamepass = transaction.gamepass || transaction.rbx5Details.gamepass;

  // 2. Call Roblox API to create gamepass
  const result = await createGamepass({
    placeId: transaction.rbx5Details.selectedPlace.placeId,
    sellerId: gamepass.sellerId,
    robuxAmount: transaction.rbx5Details.gamepassAmount,
  });

  // 3. Update transaction with productId
  transaction.rbx5Details.gamepass.productId = result.productId;
  await transaction.save();
}
```

### **Admin Manual Processing**

1. Admin view transaction detail
2. Sistem show "Kirim" button untuk Rbx5 transaction
3. Click button → trigger automasi gamepass creation
4. System call Roblox API dengan data dari **1 transaction** saja
5. Update transaction status setelah berhasil

**Jika multiple items diizinkan:**

- ❌ Admin harus pilih item mana yang mau diproses (complex UI)
- ❌ Webhook tidak bisa auto-process (tidak tahu item mana yang harus dibuat gamepassnya)
- ❌ Error handling kompleks (bagaimana track status per-item?)

---

## 📝 **User Communication**

### **Cart Page Notice**

Ditampilkan di halaman cart:

```
⚠️ Perhatian: Robux 5 Hari
Untuk kategori Robux 5 Hari, Anda hanya dapat memilih 1 item per checkout.
Ini karena sistem pemrosesan yang memerlukan waktu 5 hari per transaksi.
```

### **Error Message**

Jika user somehow bypass dan hit API:

```
Rbx 5 Hari: Hanya dapat checkout 1 item per transaksi karena ada automasi gamepass creation.
Silakan checkout item Rbx 5 Hari secara terpisah.
```

---

## ✅ **Summary**

| Layer                         | Validation                     | Status         |
| ----------------------------- | ------------------------------ | -------------- |
| Frontend - Cart UI            | Max 1 selection untuk Rbx5     | ✅ Implemented |
| Frontend - RBX5 Page          | Always send 1 item             | ✅ Implemented |
| Backend - Multi Checkout API  | Reject if rbx5Items.length > 1 | ✅ Implemented |
| Backend - Direct Purchase API | Reject if rbx5Items.length > 1 | ✅ Implemented |
| User Communication            | Clear notices & error messages | ✅ Implemented |

**Result:** Rbx 5 Hari **DIJAMIN** hanya bisa checkout 1 item per transaksi di semua flow! ✅

---

## 🔍 **Verification Checklist**

- [x] Frontend cart prevents multiple Rbx5 selection
- [x] Frontend RBX5 page always sends 1 item
- [x] Backend validates on cart checkout (`/api/transactions/multi`)
- [x] Backend validates on direct purchase (`/api/transactions`)
- [x] Error messages are clear and actionable
- [x] User notices displayed in UI
- [x] No way to bypass validation via API
- [x] Mixed services (1 Rbx5 + others) allowed
- [x] Documentation complete

**Status: FULLY VALIDATED & PROTECTED** ✅
