# Checkout Data Format - Standardization Guide

## 📋 Overview

Semua service sekarang menggunakan **format array konsisten** untuk mengirim data ke checkout page. Ini memungkinkan:

- ✅ Multi-item purchase (gamepass & joki)
- ✅ Multiple quantity per item
- ✅ Consistent data structure
- ✅ Easy to extend

## 🎯 Standard Format

```typescript
// Format: Array of checkout items
const checkoutItems = [
  {
    serviceType: string,        // "gamepass" | "joki" | "robux"
    serviceId: string,           // ID dari service
    serviceName: string,         // Nama yang akan ditampilkan
    serviceImage: string,        // URL gambar
    quantity: number,            // Jumlah item (bisa > 1)
    unitPrice: number,           // Harga per unit
    robloxUsername: string,      // Username Roblox
    robloxPassword: string | null, // Password (optional untuk gamepass & rbx5)

    // Service-specific details (pilih salah satu):
    gamepassDetails?: {...},
    jokiDetails?: {...},
    robuxInstantDetails?: {...},
    rbx5Details?: {...}
  },
  // ... more items (untuk multi-item purchase)
];

// Store ke sessionStorage
sessionStorage.setItem("checkoutData", JSON.stringify(checkoutItems));
```

## 📦 Format Per Service

### 1. **Gamepass**

**Support**: Multi-item ✅ | Multiple quantity per item ✅

```typescript
const checkoutItems = selectedItems.map((item) => ({
  serviceType: "gamepass",
  serviceId: gamepass._id,
  serviceName: `${gamepass.gameName} - ${item.itemName}`,
  serviceImage: gamepass.imgUrl,
  quantity: item.quantity, // User bisa pilih quantity > 1
  unitPrice: item.price,
  robloxUsername: username,
  robloxPassword: null, // Gamepass tidak perlu password
  gamepassDetails: {
    gameName: gamepass.gameName,
    itemName: item.itemName,
    imgUrl: item.imgUrl,
    developer: gamepass.developer,
    features: gamepass.features,
    caraPesan: gamepass.caraPesan,
  },
}));
```

**Contoh Multi-Item:**

```json
[
  {
    "serviceType": "gamepass",
    "serviceName": "Blox Fruits - Premium Pass",
    "quantity": 2,
    "unitPrice": 50000
  },
  {
    "serviceType": "gamepass",
    "serviceName": "Blox Fruits - VIP Pass",
    "quantity": 1,
    "unitPrice": 30000
  }
]
```

**Total**: 2 items, total price = (2 × 50000) + (1 × 30000) = 130000

---

### 2. **Joki**

**Support**: Multi-item ✅ | Multiple quantity per item ✅

```typescript
const checkoutItems = selectedItemsArray.map((itemName) => {
  const item = joki.item.find((i) => i.itemName === itemName);

  return {
    serviceType: "joki",
    serviceId: joki._id,
    serviceName: `${joki.gameName} - ${item.itemName}`,
    serviceImage: joki.imgUrl,
    quantity: selectedItems[itemName], // User bisa pilih quantity
    unitPrice: item.price,
    robloxUsername: username,
    robloxPassword: password,
    jokiDetails: {
      gameName: joki.gameName,
      itemName: item.itemName,
      description: item.description,
      syaratJoki: item.syaratJoki,
      prosesJoki: item.prosesJoki,
      features: joki.features,
      notes: additionalInfo,
      additionalInfo: additionalInfo,
    },
  };
});
```

**Contoh Multi-Item:**

```json
[
  {
    "serviceType": "joki",
    "serviceName": "Mobile Legends - Mythic Glory",
    "quantity": 1,
    "unitPrice": 100000,
    "robloxUsername": "player123",
    "robloxPassword": "pass123"
  },
  {
    "serviceType": "joki",
    "serviceName": "Mobile Legends - Epic to Legend",
    "quantity": 2,
    "unitPrice": 50000
  }
]
```

**Total**: 2 joki services, total = 100000 + (2 × 50000) = 200000

---

### 3. **Robux Instant**

**Support**: Single item only ✅ | Quantity always 1 ✅

```typescript
const checkoutItems = [
  {
    serviceType: "robux",
    serviceId: selectedProduct._id,
    serviceName: selectedProduct.name, // e.g., "800 Robux Instant"
    serviceImage: "",
    quantity: 1, // Always 1
    unitPrice: getFinalPrice(selectedProduct), // After discount
    robloxUsername: username,
    robloxPassword: password,
    robuxInstantDetails: {
      serviceCategory: "robux_instant",
      robuxAmount: selectedProduct.robuxAmount, // e.g., 800
      productName: selectedProduct.name,
      description: selectedProduct.description,
      additionalInfo: additionalInfo, // Backup code, etc.
      notes: additionalInfo,
    },
  },
];
```

**Contoh:**

```json
[
  {
    "serviceType": "robux",
    "serviceName": "800 Robux Instant",
    "quantity": 1,
    "unitPrice": 13000,
    "robloxUsername": "player123",
    "robloxPassword": "pass123",
    "robuxInstantDetails": {
      "robuxAmount": 800,
      "additionalInfo": "Backup code: 123456"
    }
  }
]
```

---

### 4. **RBX5 (Robux 5 Hari)**

**Support**: Single item only ✅ | Quantity always 1 ✅

```typescript
const checkoutItems = [
  {
    serviceType: "robux",
    serviceId: selectedPackage?._id || `custom_${robux}`,
    serviceName: selectedPackage?.name || `${robux} Robux (5 Hari)`,
    serviceImage: "",
    quantity: 1, // Always 1
    unitPrice: getCurrentPrice(),
    robloxUsername: username,
    robloxPassword: null, // RBX5 doesn't need password
    rbx5Details: {
      serviceCategory: "robux_5_hari",
      robuxAmount: robux, // e.g., 1000
      packageName: selectedPackage?.name || `Custom ${robux} Robux`,
      selectedPlace: selectedPlace
        ? {
            placeId: selectedPlace.placeId,
            name: selectedPlace.name,
            universeId: selectedPlace.universeId,
          }
        : null,
      gamepassAmount: getGamepassAmount(),
      gamepassCreated: gamepassInstructionShown,
      gamepass: gamepassCheckResult?.gamepass || null,
      pricePerRobux: currentRobuxPricing,
    },
  },
];
```

**Contoh:**

```json
[
  {
    "serviceType": "robux",
    "serviceName": "1000 Robux (5 Hari)",
    "quantity": 1,
    "unitPrice": 13000,
    "robloxUsername": "player123",
    "rbx5Details": {
      "robuxAmount": 1000,
      "selectedPlace": {
        "placeId": 123456,
        "name": "My Game"
      },
      "gamepassAmount": 1430,
      "gamepassCreated": true
    }
  }
]
```

---

## 🔄 Checkout Page Implementation

Checkout page harus membaca data dari `sessionStorage`:

```typescript
// Di checkout page
const [checkoutItems, setCheckoutItems] = useState([]);

useEffect(() => {
  const storedData = sessionStorage.getItem("checkoutData");
  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      // Handle both old single object and new array format
      const items = Array.isArray(parsed) ? parsed : [parsed];
      setCheckoutItems(items);
    } catch (error) {
      console.error("Error parsing checkout data:", error);
    }
  }
}, []);

// Calculate total
const totalAmount = checkoutItems.reduce((sum, item) => {
  return sum + item.unitPrice * item.quantity;
}, 0);
```

---

## 📊 Data Flow Diagram

```
Service Page (Gamepass/Joki/Robux)
        ↓
User selects items + quantity
        ↓
handlePurchase() called
        ↓
Create checkoutItems array
        ↓
Store to sessionStorage
        ↓
Navigate to /checkout
        ↓
Checkout page reads data
        ↓
Display items, calculate total
        ↓
Process payment
```

---

## ✅ Validation Checklist

### Sebelum navigate ke checkout:

```typescript
// Gamepass
✅ selectedItems.length > 0
✅ username.trim() !== ""
✅ Each item has quantity > 0

// Joki
✅ selectedItemsArray.length > 0
✅ username.trim() !== ""
✅ password.trim() !== ""
✅ Each item has quantity > 0

// Robux Instant
✅ selectedProduct !== null
✅ username.trim() !== ""
✅ password.trim() !== ""

// RBX5
✅ robux > 0
✅ username.trim() !== ""
✅ priceCheckCompleted
✅ gamepassInstructionShown (if required)
```

---

## 🐛 Debugging

### Check data di console:

```typescript
// Sebelum navigate
console.log("Checkout items:", checkoutItems);

// Di checkout page
const stored = sessionStorage.getItem("checkoutData");
console.log("Stored data:", JSON.parse(stored));
```

### Common Issues:

1. **Data null di checkout**

   - Check: Apakah `sessionStorage.setItem()` dipanggil sebelum `router.push()`?
   - Solution: Pastikan setItem selesai sebelum navigate

2. **Total price salah**

   - Check: Apakah `unitPrice × quantity` untuk setiap item?
   - Solution: Pastikan calculation di checkout page benar

3. **Multi-item tidak tampil**
   - Check: Apakah data dalam format array?
   - Solution: `Array.isArray(parsed) ? parsed : [parsed]`

---

## 📝 Summary

| Service       | Multi-Item | Multi-Quantity   | Password Required | Details Object        |
| ------------- | ---------- | ---------------- | ----------------- | --------------------- |
| Gamepass      | ✅ Yes     | ✅ Yes           | ❌ No             | `gamepassDetails`     |
| Joki          | ✅ Yes     | ✅ Yes           | ✅ Yes            | `jokiDetails`         |
| Robux Instant | ❌ No      | ❌ No (always 1) | ✅ Yes            | `robuxInstantDetails` |
| RBX5          | ❌ No      | ❌ No (always 1) | ❌ No             | `rbx5Details`         |

---

**Status**: ✅ All services standardized with array format
**Date**: 6 Oktober 2025
**Format Version**: 2.0
