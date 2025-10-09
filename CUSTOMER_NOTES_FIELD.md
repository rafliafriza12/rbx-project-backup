# 📝 Customer Notes Field - Universal Notes System

## 🎯 **Overview**

Field "Catatan Tambahan" (Customer Notes) telah ditambahkan ke sistem transaction untuk menyimpan catatan dari customer saat checkout. Field ini **universal** untuk semua service types.

**Last Updated:** October 10, 2025  
**Status:** ✅ **FULLY IMPLEMENTED**

---

## 🔍 **Problem yang Diperbaiki**

### **Before:**

- ❌ User bisa input "Catatan Tambahan" di checkout form
- ❌ Tapi notes **TIDAK disimpan** ke transaction database
- ❌ Admin tidak bisa lihat catatan dari customer

### **After:**

- ✅ Field `customerNotes` ditambahkan ke Transaction model
- ✅ Notes dikirim dari checkout → API → database
- ✅ Admin bisa lihat notes di transaction detail
- ✅ Universal untuk semua service types

---

## 🏗️ **Implementation**

### **1. Database Model**

📁 `models/Transaction.ts`

```typescript
const transactionSchema = new mongoose.Schema({
  // ... existing fields ...

  // Metadata
  customerNotes: {
    type: String,
    default: "",
  },
  adminNotes: {
    type: String,
    default: "",
  },

  // ... more fields ...
});
```

**Changes:**

- Added `customerNotes` field before `adminNotes`
- Type: String with default empty string
- Stores notes from customer at checkout

---

### **2. Frontend - Checkout Form**

📁 `app/checkout/page.tsx`

#### **State Management:**

```tsx
const [additionalNotes, setAdditionalNotes] = useState("");
```

#### **Request Data:**

```typescript
const requestData = {
  items: itemsWithCredentials,
  totalAmount: checkoutData.totalAmount,
  // ... other fields ...
  additionalNotes: additionalNotes.trim() || undefined, // ✅ Sent to API
  customerInfo: { ... },
  userId: user?.id,
};
```

**Flow:**

1. User type di textarea "Catatan Tambahan"
2. Save ke state `additionalNotes`
3. Kirim ke API saat submit
4. API save ke `customerNotes` field di database

---

### **3. API - Transaction Routes**

#### **A. Single Item Checkout**

📁 `app/api/transactions/route.ts` - `handleSingleItemTransaction()`

```typescript
async function handleSingleItemTransaction(body: any) {
  const {
    serviceType,
    serviceId,
    serviceName,
    // ... other fields ...
    additionalNotes, // ✅ Extract from body
  } = body;

  console.log("Additional notes:", additionalNotes);

  const transactionData: any = {
    serviceType,
    serviceId,
    serviceName,
    // ... other fields ...
    customerNotes: additionalNotes || "", // ✅ Save to transaction
    customerInfo: { ... },
  };

  const transaction = new Transaction(transactionData);
  await transaction.save();
}
```

---

#### **B. Multi-Item Direct Purchase**

📁 `app/api/transactions/route.ts` - `handleMultiItemDirectPurchase()`

```typescript
async function handleMultiItemDirectPurchase(body: any) {
  const {
    items,
    customerInfo,
    userId,
    // ... other fields ...
    additionalNotes, // ✅ Extract from body
  } = body;

  console.log("Additional notes:", additionalNotes);

  // Process each item
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const transactionData: any = {
      serviceType: item.serviceType,
      serviceName: item.serviceName,
      // ... other fields ...
      customerNotes: additionalNotes || "", // ✅ SAME notes for all items in order
      customerInfo: { ... },
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();
  }
}
```

**Note:** Untuk multi-item checkout, **SAME notes** disimpan di semua transactions dalam order yang sama. Ini karena notes adalah catatan untuk "order" secara keseluruhan, bukan per-item.

---

#### **C. Cart Multi Checkout**

📁 `app/api/transactions/multi/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const {
    items,
    customerInfo,
    userId,
    // ... other fields ...
    additionalNotes, // ✅ Extract from body
  } = body;

  // Process each item from cart
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    const transactionData: any = {
      serviceType: item.serviceType,
      serviceName: item.serviceName,
      // ... other fields ...
      customerNotes: additionalNotes || "", // ✅ SAME notes for all cart items
      customerInfo: { ... },
    };

    const transaction = new Transaction(transactionData);
    await transaction.save();
  }
}
```

---

## 📊 **Data Flow**

```
1. User fills "Catatan Tambahan" form
   └─> State: additionalNotes = "Tolong kirim ke akun Budi123"

2. User clicks "Bayar Sekarang"
   └─> Submit to API with additionalNotes field

3. API receives request
   └─> Extract additionalNotes from body
   └─> console.log("Additional notes:", additionalNotes)

4. API creates transaction(s)
   └─> transactionData.customerNotes = additionalNotes || ""
   └─> Save to MongoDB

5. Database stores
   └─> Transaction { customerNotes: "Tolong kirim ke akun Budi123" }

6. Admin views transaction
   └─> See customerNotes field in detail page
```

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Single Item with Notes**

**User Action:**

1. Checkout 1 item (Robux Instant)
2. Fill "Catatan Tambahan": "Kirim secepatnya"
3. Submit

**Expected Database:**

```json
{
  "invoiceId": "INV-001",
  "serviceName": "500 Robux (Instant)",
  "customerNotes": "Kirim secepatnya",
  "quantity": 1
}
```

✅ **Result:** customerNotes saved

---

### **Scenario 2: Multi-Item with Notes**

**User Action:**

1. Checkout 3 gamepass items
2. Fill "Catatan Tambahan": "Password: abc123 untuk semua"
3. Submit

**Expected Database:**

```json
[
  {
    "invoiceId": "INV-001",
    "serviceName": "Blox Fruits - Leopard",
    "customerNotes": "Password: abc123 untuk semua",
    "masterOrderId": "ORDER-12345"
  },
  {
    "invoiceId": "INV-002",
    "serviceName": "Blox Fruits - Dragon",
    "customerNotes": "Password: abc123 untuk semua", // SAME
    "masterOrderId": "ORDER-12345"
  },
  {
    "invoiceId": "INV-003",
    "serviceName": "Blox Fruits - Buddha",
    "customerNotes": "Password: abc123 untuk semua", // SAME
    "masterOrderId": "ORDER-12345"
  }
]
```

✅ **Result:** All 3 transactions have SAME customerNotes

---

### **Scenario 3: Empty Notes**

**User Action:**

1. Checkout 1 item
2. Leave "Catatan Tambahan" empty
3. Submit

**Expected Database:**

```json
{
  "invoiceId": "INV-001",
  "serviceName": "Joki Crown of Madness",
  "customerNotes": "" // Empty string
}
```

✅ **Result:** customerNotes is empty string (not null)

---

### **Scenario 4: Cart Checkout with Notes**

**User Action:**

1. Add 3 items to cart (mixed services)
2. Go to checkout
3. Fill "Catatan Tambahan": "Urgent! Butuh hari ini"
4. Submit

**Expected Database:**

```json
[
  {
    "invoiceId": "INV-001",
    "serviceType": "robux",
    "customerNotes": "Urgent! Butuh hari ini"
  },
  {
    "invoiceId": "INV-002",
    "serviceType": "gamepass",
    "customerNotes": "Urgent! Butuh hari ini" // SAME
  },
  {
    "invoiceId": "INV-003",
    "serviceType": "joki",
    "customerNotes": "Urgent! Butuh hari ini" // SAME
  }
]
```

✅ **Result:** All transactions from cart have SAME notes

---

## 🔍 **Distinction: customerNotes vs Service-Specific Notes**

### **customerNotes (Universal)**

- **Purpose:** General notes dari customer untuk **entire order**
- **Scope:** Berlaku untuk semua items dalam checkout
- **Location:** Root level di Transaction model
- **Input:** Textarea "Catatan Tambahan" di checkout form
- **Examples:**
  - "Tolong kirim secepatnya"
  - "Password untuk semua: abc123"
  - "Kontak saya di WhatsApp: 08123456789"

### **jokiDetails.notes (Service-Specific)**

- **Purpose:** Backup code **specific** untuk service Joki
- **Scope:** Hanya untuk item Joki itu saja
- **Location:** Inside jokiDetails object
- **Input:** Field "Backup Code" di Joki form
- **Examples:**
  - "2FA Code: 123456"
  - "Email backup: user@email.com"

### **robuxInstantDetails.notes (Service-Specific)**

- **Purpose:** Backup code **specific** untuk Robux Instant
- **Scope:** Hanya untuk item Robux Instant itu saja
- **Location:** Inside robuxInstantDetails object
- **Input:** Field "Backup Code" di Robux Instant form
- **Examples:**
  - "2FA: 987654"

---

## 📋 **Data Structure Examples**

### **Example 1: Joki with Both Notes**

```json
{
  "invoiceId": "INV-001",
  "serviceType": "joki",
  "serviceName": "PUBG - Crown",
  "customerNotes": "Tolong proses hari ini", // ← Universal notes
  "jokiDetails": {
    "gameName": "PUBG Mobile",
    "itemName": "Crown",
    "notes": "2FA Code: 123456", // ← Service-specific backup code
    "additionalInfo": "Email backup: user@email.com"
  }
}
```

**Usage:**

- **Admin view order:** Baca `customerNotes` untuk instruksi umum
- **Admin process joki:** Baca `jokiDetails.notes` untuk backup code

---

### **Example 2: Multi-Item Order**

```json
// Order with 2 items + 1 universal note
[
  {
    "invoiceId": "INV-001",
    "serviceType": "gamepass",
    "serviceName": "Blox Fruits - Leopard",
    "customerNotes": "Saya online jam 8 malam", // ← SAME for all
    "gamepassDetails": { ... }
  },
  {
    "invoiceId": "INV-002",
    "serviceType": "joki",
    "serviceName": "PUBG - Crown",
    "customerNotes": "Saya online jam 8 malam", // ← SAME for all
    "jokiDetails": {
      "notes": "Backup code: xyz789" // ← Different, service-specific
    }
  }
]
```

---

## 🎨 **UI Display (Admin)**

### **Transaction Detail Page**

```tsx
{
  /* Customer Notes Section */
}
<div className="bg-gray-800 p-4 rounded-lg">
  <h3 className="font-semibold text-lg mb-2">📝 Catatan Customer</h3>

  {transaction.customerNotes ? (
    <p className="text-gray-300 whitespace-pre-wrap">
      {transaction.customerNotes}
    </p>
  ) : (
    <p className="text-gray-500 italic">Tidak ada catatan dari customer</p>
  )}
</div>;

{
  /* Service-Specific Notes (if Joki) */
}
{
  transaction.serviceType === "joki" && transaction.jokiDetails?.notes && (
    <div className="bg-blue-900/20 p-4 rounded-lg mt-4">
      <h4 className="font-semibold text-sm mb-2">🔐 Backup Code Joki</h4>
      <p className="text-blue-300 font-mono">{transaction.jokiDetails.notes}</p>
    </div>
  );
}

{
  /* Admin Notes Section */
}
<div className="bg-gray-800 p-4 rounded-lg mt-4">
  <h3 className="font-semibold text-lg mb-2">🛠️ Catatan Admin</h3>
  <textarea
    value={adminNotes}
    onChange={(e) => setAdminNotes(e.target.value)}
    className="w-full bg-gray-700 p-2 rounded"
    placeholder="Tambahkan catatan internal admin..."
  />
</div>;
```

---

## ✅ **Checklist**

- [x] Add `customerNotes` field to Transaction model
- [x] Extract `additionalNotes` from checkout form
- [x] Send `additionalNotes` to API in request
- [x] API receives and logs `additionalNotes`
- [x] API saves to `customerNotes` in transaction
- [x] Works for single item checkout
- [x] Works for multi-item direct purchase
- [x] Works for cart multi checkout
- [x] SAME notes applied to all items in order
- [x] Empty notes handled correctly (empty string)
- [x] No TypeScript errors
- [x] Documentation complete

---

## 🎯 **Summary**

| Field                         | Purpose                   | Scope                 | Input Location                   |
| ----------------------------- | ------------------------- | --------------------- | -------------------------------- |
| **customerNotes**             | General notes untuk order | Universal (all items) | Checkout form "Catatan Tambahan" |
| **jokiDetails.notes**         | Backup code untuk joki    | Per-item (joki only)  | Joki form "Backup Code"          |
| **robuxInstantDetails.notes** | Backup code untuk robux   | Per-item (robux only) | Robux form "Backup Code"         |
| **adminNotes**                | Internal admin notes      | Universal             | Admin transaction detail         |

**Result:**

- ✅ Customer dapat memberikan instruksi umum untuk order
- ✅ Customer dapat memberikan backup code specific per service
- ✅ Admin dapat melihat semua notes (customer + service-specific)
- ✅ Admin dapat menambahkan notes internal

---

**Status:** ✅ **FULLY IMPLEMENTED & WORKING**

**Last Updated:** October 10, 2025
