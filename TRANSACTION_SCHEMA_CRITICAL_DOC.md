# 🔍 TRANSACTION SCHEMA ANALYSIS - CRITICAL DOCUMENTATION

## 📊 Pemahaman Struktur Pembelian yang Benar

### 🎯 **3 Tipe Service dan Cara Pembeliannya**

---

## 1. **ROBUX (Instant & 5 Hari)** 💎

### Struktur:

- ✅ **1 root product** (misal: "500 Robux Instant" atau "1000 Robux 5 Hari")
- ✅ **Quantity bisa > 1** (user bisa beli 2x paket 500 Robux)
- ❌ **TIDAK BISA** multiple items berbeda dalam 1 transaksi

### Schema Transaction:

```typescript
{
  serviceType: "robux",
  serviceCategory: "robux_instant" | "robux_5_hari",
  serviceId: "rbx-instant-500",
  serviceName: "500 Robux Instant",
  quantity: 2,  // Beli 2 paket
  unitPrice: 50000,
  totalAmount: 100000,  // 2 x 50000
  robloxUsername: "user123",
  robloxPassword: "pass123",  // Required untuk instant, optional untuk 5 hari

  // Untuk Instant
  robuxInstantDetails: {
    notes: "backup code",
    robuxAmount: 500,
    ...
  },

  // Untuk 5 Hari
  rbx5Details: {
    robuxAmount: 1000,
    gamepass: {
      id: 123456,
      productId: 789012,
      sellerId: 345678,  // Untuk automation via Roblox API
    },
    backupCode: "ABC123",
    ...
  }
}
```

### API Endpoint:

- **POST /api/transactions** (single item dengan quantity)
- 1 transaction dalam database
- 1 Midtrans payment

---

## 2. **GAMEPASS** 🎮

### Struktur:

- ✅ **1 root gamepass** (misal: "Blox Fruits Gamepass")
- ✅ **BISA PILIH MULTIPLE ITEMS** di dalam gamepass (Leopard Fruit, Dragon Fruit, Buddha Fruit)
- ✅ **Setiap item bisa punya quantity > 1**

### Contoh Pembelian:

```
User memilih: Blox Fruits Gamepass
  └─ Leopard Fruit (qty: 2) @ Rp 150.000 = Rp 300.000
  └─ Dragon Fruit (qty: 1) @ Rp 200.000 = Rp 200.000
  └─ Buddha Fruit (qty: 3) @ Rp 180.000 = Rp 540.000
                           TOTAL = Rp 1.040.000
```

### Schema (Dikirim sebagai ARRAY):

```typescript
{
  items: [
    {
      serviceType: "gamepass",
      serviceId: "blox-fruits-id",
      serviceName: "Blox Fruits - Leopard Fruit",
      serviceImage: "...",
      quantity: 2,
      unitPrice: 150000,
      robloxUsername: "user123",
      robloxPassword: null,  // Gamepass TIDAK butuh password
      gamepassDetails: {
        gameName: "Blox Fruits",
        itemName: "Leopard Fruit",
        imgUrl: "...",
        developer: "...",
        features: [...],
        caraPesan: [...]
      }
    },
    {
      serviceType: "gamepass",
      serviceId: "blox-fruits-id",
      serviceName: "Blox Fruits - Dragon Fruit",
      quantity: 1,
      unitPrice: 200000,
      ...
    },
    {
      serviceType: "gamepass",
      serviceId: "blox-fruits-id",
      serviceName: "Blox Fruits - Buddha Fruit",
      quantity: 3,
      unitPrice: 180000,
      ...
    }
  ],
  customerInfo: {...},
  userId: "...",
  totalAmount: 1040000,
  discountPercentage: 5,
  discountAmount: 52000,
  finalAmount: 988000
}
```

### API Endpoint:

- **POST /api/transactions** dengan `items` array → triggers `handleMultiItemDirectPurchase()`
- 3 transactions dalam database (1 per item)
- 1 Midtrans payment (grouped dengan 1 masterOrderId)

---

## 3. **JOKI** 🚀

### Struktur:

- ✅ **1 root joki** (misal: "PUBG Joki")
- ✅ **BISA PILIH MULTIPLE ITEMS** di dalam joki (Crown, Ace, Conqueror)
- ✅ **Setiap item bisa punya quantity > 1**

### Contoh Pembelian:

```
User memilih: PUBG Joki
  └─ Crown (qty: 1) @ Rp 100.000 = Rp 100.000
  └─ Ace (qty: 2) @ Rp 150.000 = Rp 300.000
  └─ Conqueror (qty: 1) @ Rp 200.000 = Rp 200.000
                        TOTAL = Rp 600.000
```

### Schema (Dikirim sebagai ARRAY):

```typescript
{
  items: [
    {
      serviceType: "joki",
      serviceId: "pubg-joki-id",
      serviceName: "PUBG - Crown",
      serviceImage: "...",
      quantity: 1,
      unitPrice: 100000,
      robloxUsername: "user123",
      robloxPassword: "pass123",  // Joki WAJIB ada password
      jokiDetails: {
        gameName: "PUBG",
        itemName: "Crown",
        imgUrl: "...",
        description: "...",
        notes: "backup code ABC",  // Backup code
        additionalInfo: "...",
        syaratJoki: [...],
        prosesJoki: [...],
        features: [...]
      }
    },
    {
      serviceType: "joki",
      serviceId: "pubg-joki-id",
      serviceName: "PUBG - Ace",
      quantity: 2,
      unitPrice: 150000,
      ...
    },
    {
      serviceType: "joki",
      serviceId: "pubg-joki-id",
      serviceName: "PUBG - Conqueror",
      quantity: 1,
      unitPrice: 200000,
      ...
    }
  ],
  customerInfo: {...},
  userId: "...",
  totalAmount: 600000,
  discountPercentage: 5,
  discountAmount: 30000,
  finalAmount: 570000
}
```

### API Endpoint:

- **POST /api/transactions** dengan `items` array → triggers `handleMultiItemDirectPurchase()`
- 3 transactions dalam database (1 per item)
- 1 Midtrans payment (grouped dengan 1 masterOrderId)

---

## 🔄 **Flow Pembelian**

### A. **Beli Langsung (Direct Purchase)**

#### Robux:

```
Robux Page → Pilih 1 paket → Set quantity → Checkout
  ↓
POST /api/transactions (single item)
  ↓
1 Transaction + 1 Midtrans Payment
```

#### Gamepass/Joki:

```
Gamepass/Joki Page → Pilih multiple items → Set quantity per item → Checkout
  ↓
POST /api/transactions (items array)
  ↓
N Transactions (1 per item) + 1 Midtrans Payment (grouped)
```

### B. **Dari Keranjang (Cart)**

```
Multiple Products di Cart → Select items → Checkout
  ↓
POST /api/transactions/multi (items array dari berbagai service)
  ↓
N Transactions (1 per item) + 1 Midtrans Payment (grouped)
```

---

## 📁 **API Endpoints**

### 1. POST /api/transactions (Universal)

**Deteksi Otomatis:**

```typescript
// Cek apakah ada items array
const hasItemsArray =
  body.items && Array.isArray(body.items) && body.items.length > 0;

if (hasItemsArray) {
  // Multi-item direct purchase (gamepass/joki)
  return handleMultiItemDirectPurchase(body);
} else {
  // Single item (robux dengan quantity)
  return handleSingleItemTransaction(body);
}
```

**Input untuk Single Item (Robux):**

```json
{
  "serviceType": "robux",
  "serviceId": "rbx-instant-500",
  "serviceName": "500 Robux Instant",
  "quantity": 2,
  "unitPrice": 50000,
  "totalAmount": 100000,
  "discountPercentage": 5,
  "discountAmount": 5000,
  "finalAmount": 95000,
  "robloxUsername": "user123",
  "robloxPassword": "pass123",
  "robuxInstantDetails": {...},
  "customerInfo": {...},
  "userId": "..."
}
```

**Input untuk Multi-Item (Gamepass/Joki):**

```json
{
  "items": [
    {
      "serviceType": "gamepass",
      "serviceId": "...",
      "serviceName": "Blox Fruits - Leopard Fruit",
      "quantity": 2,
      "unitPrice": 150000,
      "robloxUsername": "user123",
      "gamepassDetails": {...}
    },
    {
      "serviceType": "gamepass",
      "serviceId": "...",
      "serviceName": "Blox Fruits - Dragon Fruit",
      "quantity": 1,
      "unitPrice": 200000,
      "robloxUsername": "user123",
      "gamepassDetails": {...}
    }
  ],
  "totalAmount": 500000,
  "discountPercentage": 5,
  "discountAmount": 25000,
  "finalAmount": 475000,
  "customerInfo": {...},
  "userId": "..."
}
```

**Output:**

```json
{
  "success": true,
  "data": {
    // Single item: 1 transaction
    "transaction": {...},
    "snapToken": "xxx-xxx",
    "redirectUrl": "https://..."

    // Multi-item: N transactions
    "transactions": [{...}, {...}, ...],
    "masterOrderId": "ORDER-xxx-xxx",
    "snapToken": "xxx-xxx",
    "redirectUrl": "https://...",
    "totalTransactions": 3,
    "totalAmount": 500000,
    "discountAmount": 25000,
    "finalAmount": 475000
  }
}
```

### 2. POST /api/transactions/multi (Cart Checkout)

**Purpose:** Khusus untuk checkout dari cart dengan multiple items dari berbagai service

**Input:**

```json
{
  "items": [
    {
      "serviceType": "robux",
      "serviceId": "rbx5-500",
      "serviceName": "500 Robux (5 Hari)",
      "quantity": 1,
      "unitPrice": 50000,
      "robloxUsername": "user1",
      "rbx5Details": {...}
    },
    {
      "serviceType": "gamepass",
      "serviceId": "blox-fruits",
      "serviceName": "Blox Fruits - Leopard",
      "quantity": 1,
      "unitPrice": 150000,
      "robloxUsername": "user2",
      "gamepassDetails": {...}
    },
    {
      "serviceType": "joki",
      "serviceId": "pubg-joki",
      "serviceName": "PUBG - Crown",
      "quantity": 1,
      "unitPrice": 100000,
      "robloxUsername": "user3",
      "robloxPassword": "pass3",
      "jokiDetails": {...}
    }
  ],
  "totalAmount": 300000,
  "discountPercentage": 5,
  "discountAmount": 15000,
  "finalAmount": 285000,
  "customerInfo": {...},
  "userId": "..."
}
```

**Output:** Same as multi-item in /api/transactions

---

## 🎯 **Transaction Model Schema**

### Fields yang Harus Ada:

```typescript
{
  // Basic Info
  serviceType: "robux" | "gamepass" | "joki",
  serviceId: string,
  serviceName: string,  // HARUS full: "GameName - ItemName"
  serviceImage: string,
  serviceCategory?: string,  // "robux_instant" | "robux_5_hari" | "gamepass" | "joki"

  // Quantity & Price
  quantity: number,  // Bisa > 1
  unitPrice: number,
  totalAmount: number,  // quantity * unitPrice

  // Discount (member-based)
  discountPercentage: number,
  discountAmount: number,
  finalAmount: number,

  // Credentials
  robloxUsername: string,  // WAJIB untuk semua
  robloxPassword: string,  // WAJIB untuk joki & robux instant, OPTIONAL untuk gamepass & rbx5

  // Service-specific details
  gamepassDetails?: {...},  // Untuk gamepass
  jokiDetails?: {...},      // Untuk joki
  robuxInstantDetails?: {...},  // Untuk robux instant
  rbx5Details?: {...},      // Untuk robux 5 hari
  gamepass?: {...},         // Gamepass object untuk rbx5 automation

  // Customer
  customerInfo: {
    name: string,
    email: string,
    phone: string,
    userId?: string  // null untuk guest
  },

  // Payment
  midtransOrderId: string,  // Same untuk grouped items
  snapToken: string,
  redirectUrl: string,
  paymentStatus: string,
  orderStatus: string
}
```

---

## ✅ **Validasi Penting**

### 1. Password Requirements:

```typescript
// Joki: WAJIB password
if (serviceType === "joki" && !robloxPassword) {
  return error("Password required for joki");
}

// Robux Instant: WAJIB password
if (
  serviceType === "robux" &&
  serviceCategory === "robux_instant" &&
  !robloxPassword
) {
  return error("Password required for robux instant");
}

// Gamepass: TIDAK perlu password
// Robux 5 Hari: TIDAK perlu password (optional)
```

### 2. Username Requirements:

```typescript
// Semua service WAJIB username
if (!robloxUsername) {
  return error("Roblox username required");
}
```

### 3. Items Array Validation:

```typescript
// Untuk multi-item (gamepass/joki direct purchase)
if (items && Array.isArray(items)) {
  items.forEach((item) => {
    if (
      !item.serviceType ||
      !item.serviceId ||
      !item.serviceName ||
      !item.quantity ||
      !item.unitPrice ||
      !item.robloxUsername
    ) {
      return error("Invalid item data");
    }
  });
}
```

---

## 🚀 **Testing Scenarios**

### Test 1: Robux Instant (Single dengan Quantity)

```
Input:
- Service: Robux Instant 500
- Quantity: 3
- Username: user123
- Password: pass123

Expected:
✅ 1 transaction
✅ totalAmount = 3 × 50000 = 150000
✅ 1 Midtrans payment
```

### Test 2: Gamepass (Multiple Items)

```
Input:
- Service: Blox Fruits Gamepass
- Items:
  • Leopard Fruit qty=2
  • Dragon Fruit qty=1
- Username: user123
- Password: (tidak perlu)

Expected:
✅ 2 transactions
✅ totalAmount = (2×150000) + (1×200000) = 500000
✅ 1 Midtrans payment (grouped)
✅ Same masterOrderId untuk kedua transactions
```

### Test 3: Joki (Multiple Items)

```
Input:
- Service: PUBG Joki
- Items:
  • Crown qty=1
  • Ace qty=2
- Username: user123
- Password: pass123

Expected:
✅ 2 transactions
✅ totalAmount = (1×100000) + (2×150000) = 400000
✅ 1 Midtrans payment (grouped)
✅ Backup code tersimpan di jokiDetails.notes
```

### Test 4: Cart (Mixed Services)

```
Input:
- Items:
  • Robux 5 Hari 500 (user1, no password)
  • Blox Fruits - Leopard (user2, no password)
  • PUBG - Crown (user3, with password)

Expected:
✅ 3 transactions
✅ Each with own credentials
✅ 1 Midtrans payment (grouped)
✅ Member discount applied to total
```

---

## 🎨 **UI Display**

### Checkout Page - Single Item (Robux):

```
┌────────────────────────────────────┐
│  💵  500 Robux Instant            │
│                                    │
│  Quantity: 3                       │
│  Price: Rp 50.000 × 3              │
│  ──────────────────────────────────│
│  Total: Rp 150.000                 │
└────────────────────────────────────┘
```

### Checkout Page - Multi Item (Gamepass):

```
┌────────────────────────────────────┐
│  Blox Fruits - Leopard Fruit      │
│  💵  Qty: 2  |  Rp 300.000        │
├────────────────────────────────────┤
│  Blox Fruits - Dragon Fruit       │
│  💵  Qty: 1  |  Rp 200.000        │
├────────────────────────────────────┤
│  Subtotal:        Rp 500.000       │
│  Diskon (5%):    -Rp  25.000       │
│  ──────────────────────────────────│
│  Total Bayar:     Rp 475.000       │
└────────────────────────────────────┘
```

---

## 📝 **Summary**

### ✅ Yang BENAR:

1. **Robux**: 1 paket, quantity bisa > 1, single transaction
2. **Gamepass**: Multiple items dalam 1 gamepass, each dengan quantity sendiri, multiple transactions dengan 1 payment
3. **Joki**: Multiple items dalam 1 joki, each dengan quantity sendiri, multiple transactions dengan 1 payment
4. **Cart**: Multiple items dari berbagai service, multiple transactions dengan 1 payment

### ❌ Yang SALAH:

1. ~~Gamepass bisa pilih multiple gamepass berbeda~~ → SALAH! Hanya 1 root gamepass, tapi bisa multiple items di dalamnya
2. ~~Joki bisa pilih multiple joki berbeda~~ → SALAH! Hanya 1 root joki, tapi bisa multiple items di dalamnya
3. ~~Robux bisa multiple paket berbeda~~ → SALAH! Hanya 1 paket, tapi quantity bisa > 1

### 🔑 Key Points:

- **Root Product**: 1 per pembelian langsung
- **Items**: Bisa multiple di dalam root product (gamepass/joki)
- **Quantity**: Setiap item bisa punya quantity > 1
- **Transactions**: 1 per item dalam database
- **Payment**: 1 Midtrans payment untuk semua transactions (grouped)
- **masterOrderId**: Same untuk semua grouped transactions

---

**Status**: ✅ TRANSACTION SCHEMA VERIFIED AND DOCUMENTED
**Date**: October 10, 2025
**Critical**: YES - This affects payment processing and order management
