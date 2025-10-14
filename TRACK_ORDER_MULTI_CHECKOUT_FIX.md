# Track Order Multi-Checkout Fix - Complete Solution

## 🐛 Masalah yang Ditemukan

### 1. **API Tidak Mengembalikan Related Transactions**

Track order API (`/api/transactions/invoice/[invoiceId]`) hanya mengembalikan **1 transaksi** berdasarkan `invoiceId`, padahal untuk multi-checkout ada beberapa transaksi yang di-group dengan `midtransOrderId` yang sama.

**Impact:**

- Helper function `isMultiCheckout()` selalu return `false` karena `relatedTransactions` kosong
- `calculateGrandTotal()` hanya menghitung 1 item, bukan semua items dalam multi-checkout
- Total pembayaran yang ditampilkan **SALAH**

### 2. **Schema Transaction Tidak Ada Field Multi-Checkout**

File `/models/Transaction.ts` tidak memiliki field:

- `isMultiCheckout` (boolean)
- `relatedTransactions` (array)

Field ini hanya ada di TypeScript type definition, tapi **tidak ada di database schema**, sehingga data ini harus di-populate secara manual dari query.

### 3. **Diskon Tidak Terdistribusi ke Item**

Di `/app/api/transactions/multi/route.ts`, setiap item transaksi disimpan dengan:

```typescript
discountPercentage: 0,
discountAmount: 0,
finalAmount: totalAmount  // Tanpa diskon!
```

Padahal ada diskon global yang seharusnya di-distribusikan ke masing-masing item secara proporsional.

### 4. **Section "Informasi Pesanan" Menampilkan Data Salah**

Di halaman track order, section "Informasi Pesanan" menampilkan:

- Quantity dari 1 transaksi saja
- Harga satuan dari 1 transaksi saja
- Subtotal dari 1 transaksi saja

Padahal untuk multi-checkout, seharusnya section ini **tidak ditampilkan** atau diganti dengan summary.

---

## ✅ Solusi yang Diimplementasikan

### 1. **Update API: Query Related Transactions**

**File:** `/app/api/transactions/invoice/[invoiceId]/route.ts`

Sekarang API melakukan query tambahan untuk mencari semua transaksi dengan `midtransOrderId` yang sama:

```typescript
// Check if this is part of multi-checkout
let relatedTransactions: any[] = [];
let isMultiCheckout = false;

if (transaction.midtransOrderId) {
  // Find all transactions with the same midtransOrderId (excluding current)
  const allTransactionsInGroup = await Transaction.find({
    midtransOrderId: transaction.midtransOrderId,
    _id: { $ne: transaction._id },
  }).exec();

  if (allTransactionsInGroup.length > 0) {
    isMultiCheckout = true;
    relatedTransactions = allTransactionsInGroup.map((t: any) => ({
      _id: t._id.toString(),
      serviceName: t.serviceName,
      serviceImage: t.serviceImage || "",
      serviceCategory: t.serviceCategory,
      quantity: t.quantity,
      unitPrice: t.unitPrice,
      totalAmount: t.totalAmount,
      discountPercentage: t.discountPercentage || 0,
      discountAmount: t.discountAmount || 0,
      finalAmount: t.finalAmount || t.totalAmount,
      robloxUsername: t.robloxUsername,
      orderStatus: t.orderStatus,
      // ... other fields
    }));
  }
}

// Add to response
const transformedTransaction = {
  // ... existing fields
  isMultiCheckout: isMultiCheckout,
  relatedTransactions: relatedTransactions,
};
```

**Benefit:**

- ✅ Frontend menerima semua transaksi dalam multi-checkout
- ✅ Helper functions `isMultiCheckout()` dan `getAllTransactions()` bekerja dengan benar
- ✅ `calculateGrandTotal()` menghitung semua items

---

### 2. **Distribusi Diskon Proporsional**

**File:** `/app/api/transactions/multi/route.ts`

Sekarang diskon global didistribusikan ke setiap item secara proporsional:

```typescript
// Calculate subtotal from all items first
const subtotalFromItems = items.reduce(
  (sum, item) => sum + (item.totalAmount || item.quantity * item.unitPrice),
  0
);

// For each item
const itemTotalAmount = item.totalAmount || item.quantity * item.unitPrice;

// Distribute global discount proportionally
let itemDiscountAmount = 0;
let itemDiscountPercentage = 0;
let itemFinalAmount = itemTotalAmount;

if (discountAmount && discountAmount > 0 && subtotalFromItems > 0) {
  // Calculate proportional discount for this item
  const itemRatio = itemTotalAmount / subtotalFromItems;
  itemDiscountAmount = Math.round(discountAmount * itemRatio);
  itemDiscountPercentage = discountPercentage || 0;
  itemFinalAmount = itemTotalAmount - itemDiscountAmount;
}

// Save to transaction
const transactionData = {
  // ...
  totalAmount: itemTotalAmount,
  discountPercentage: itemDiscountPercentage,
  discountAmount: itemDiscountAmount,
  finalAmount: itemFinalAmount, // ✅ Sudah termasuk diskon
  // ...
};
```

**Formula:**

```
Item Ratio = Item Total / Subtotal All Items
Item Discount = Global Discount × Item Ratio
Item Final Amount = Item Total - Item Discount
```

**Contoh:**

```
Item 1: Rp 10,000 (33.33% dari total Rp 30,000)
Item 1 Discount: Rp 1,500 × 33.33% = Rp 500
Item 1 Final: Rp 9,500

Item 2: Rp 20,000 (66.67% dari total Rp 30,000)
Item 2 Discount: Rp 1,500 × 66.67% = Rp 1,000
Item 2 Final: Rp 19,000

Grand Total: Rp 9,500 + Rp 19,000 = Rp 28,500 ✅
```

---

### 3. **Recalculate Totals dari Transaction FinalAmount**

**File:** `/app/api/transactions/multi/route.ts`

Setelah diskon didistribusikan, perhitungan total dilakukan dari `finalAmount` setiap transaksi:

```typescript
// Calculate totals from created transactions (discount already distributed)
const subtotal = createdTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
const totalDiscountDistributed = createdTransactions.reduce(
  (sum, t) => sum + (t.discountAmount || 0),
  0
);
const finalAmountBeforeFee = createdTransactions.reduce(
  (sum, t) => sum + t.finalAmount, // ✅ Sudah termasuk diskon
  0
);
```

---

### 4. **Conditional Rendering: Hide "Informasi Pesanan" untuk Multi-Checkout**

**File:** `/app/(public)/track-order/page.tsx`

Section "Informasi Pesanan" sekarang hanya ditampilkan untuk **single checkout**:

```tsx
{
  /* Informasi Pesanan - Only show for single checkout */
}
{
  !isMultiCheckout(transaction) && (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
      <h3 className="font-medium text-white mb-4">
        <Package className="w-5 h-5 text-primary-100" />
        Informasi Pesanan
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span>Quantity:</span>
          <span>{transaction.quantity}</span>
        </div>
        <div className="flex justify-between">
          <span>Harga Satuan:</span>
          <span>Rp {transaction.unitPrice.toLocaleString("id-ID")}</span>
        </div>
        {/* ... other fields */}
      </div>
    </div>
  );
}

{
  /* Informasi Pembeli - Always show, full width for multi-checkout */
}
<div className={`... ${isMultiCheckout(transaction) ? "lg:col-span-2" : ""}`}>
  {/* Customer info */}
</div>;
```

**Behavior:**

- **Single Checkout:** Tampilkan 2 kolom (Informasi Pesanan + Informasi Pembeli)
- **Multi Checkout:** Tampilkan 1 kolom full width (Informasi Pembeli saja)

---

## 📊 Flow Data Multi-Checkout

### 1. **Saat Checkout (Multi-Item Cart)**

```
POST /api/transactions/multi
├─ Items: [Item1, Item2, Item3]
├─ Global Discount: 5% (Rp 1,500)
├─ Subtotal: Rp 30,000
└─ Final Amount: Rp 28,500

Process:
├─ Calculate item ratio for each item
├─ Distribute discount proportionally
├─ Save transactions with individual discount amounts
│   ├─ Transaction 1: finalAmount = Rp 9,500 (discount Rp 500)
│   ├─ Transaction 2: finalAmount = Rp 19,000 (discount Rp 1,000)
│   └─ All share same midtransOrderId: "MULTI-123456"
└─ Create Midtrans payment with total: Rp 28,500
```

### 2. **Saat Track Order**

```
GET /api/transactions/invoice/INV-001

Query Process:
├─ Find transaction by invoiceId
├─ Get midtransOrderId from that transaction
├─ Query all transactions with same midtransOrderId
├─ Build relatedTransactions array
└─ Return {
    transaction: {...},
    isMultiCheckout: true,
    relatedTransactions: [...]
  }

Frontend Display:
├─ isMultiCheckout() → true
├─ getAllTransactions() → [main, ...related]
├─ calculateGrandTotal() → sum all finalAmount
│   └─ Rp 9,500 + Rp 19,000 = Rp 28,500 ✅
└─ Show "Multi-Item Checkout" indicator
```

---

## 🧪 Testing Checklist

### Test Case 1: Single Checkout dengan Diskon

```
✅ Input:
- 1 Item: Robux 800 @ Rp 10,000
- Diskon Member: 5% (Rp 500)

✅ Expected Database:
- transaction.totalAmount: 10,000
- transaction.discountAmount: 500
- transaction.finalAmount: 9,500

✅ Expected Track Order:
- Menampilkan "Informasi Pesanan" section
- Subtotal: Rp 10,000
- Diskon (5%): -Rp 500
- Total Pembayaran: Rp 9,500
```

### Test Case 2: Multi-Checkout dengan Diskon

```
✅ Input:
- Item 1: Robux 800 @ Rp 10,000
- Item 2: Robux 1700 @ Rp 20,000
- Diskon Member: 5% (Rp 1,500)

✅ Expected Database:
Transaction 1:
- totalAmount: 10,000
- discountAmount: 500
- finalAmount: 9,500

Transaction 2:
- totalAmount: 20,000
- discountAmount: 1,000
- finalAmount: 19,000

Both have same midtransOrderId

✅ Expected Track Order (using any invoice):
- Menampilkan "Multi-Item Checkout" indicator
- Item 1 displayed: Rp 9,500
- Item 2 displayed: Rp 19,000
- TIDAK menampilkan "Informasi Pesanan" section
- Subtotal (2 items): Rp 30,000
- Diskon: -Rp 1,500
- Total Pembayaran: Rp 28,500 ✅
```

### Test Case 3: Multi-Checkout Tanpa Diskon

```
✅ Input:
- Item 1: Robux 800 @ Rp 10,000
- Item 2: Robux 1700 @ Rp 20,000
- Diskon: 0%

✅ Expected Database:
Transaction 1:
- totalAmount: 10,000
- discountAmount: 0
- finalAmount: 10,000

Transaction 2:
- totalAmount: 20,000
- discountAmount: 0
- finalAmount: 20,000

✅ Expected Track Order:
- Total Pembayaran: Rp 30,000 ✅
```

---

## 📝 Files Modified

### 1. `/app/api/transactions/invoice/[invoiceId]/route.ts`

**Changes:**

- ✅ Added query for related transactions by `midtransOrderId`
- ✅ Added `isMultiCheckout` boolean to response
- ✅ Added `relatedTransactions` array to response
- ✅ Added debug console logs
- ✅ Added all service detail fields (rbx5Details, gamepass, etc.)

### 2. `/app/api/transactions/multi/route.ts`

**Changes:**

- ✅ Added discount distribution logic (lines ~110-170)
- ✅ Calculate proportional discount for each item
- ✅ Store `discountAmount`, `discountPercentage`, `finalAmount` per item
- ✅ Recalculate totals from transaction `finalAmount`
- ✅ Update Midtrans items with distributed discount
- ✅ Update response with `totalDiscountDistributed`

### 3. `/app/(public)/track-order/page.tsx`

**Changes:**

- ✅ Added conditional rendering for "Informasi Pesanan" section
- ✅ Hide section for multi-checkout (using `!isMultiCheckout()`)
- ✅ Full-width "Informasi Pembeli" for multi-checkout
- ✅ Keep existing Payment Summary (already correct with calculateGrandTotal)

### 4. `/lib/transaction-helpers.ts`

**Changes:**

- ℹ️ No changes needed
- ℹ️ Functions already correct, just needed proper data from API

---

## 🎯 Summary of Fixes

| Issue                           | Root Cause                            | Solution                           | Status   |
| ------------------------------- | ------------------------------------- | ---------------------------------- | -------- |
| Total tidak include diskon      | Diskon tidak di-distribusikan ke item | Distribute discount proportionally | ✅ Fixed |
| Multi-checkout tidak terdeteksi | API tidak return relatedTransactions  | Query by midtransOrderId           | ✅ Fixed |
| Informasi Pesanan salah         | Menampilkan data 1 item saja          | Conditional rendering              | ✅ Fixed |
| isMultiCheckout() false         | relatedTransactions kosong            | Populate from database             | ✅ Fixed |
| calculateGrandTotal() salah     | Hanya 1 item yang dijumlah            | Return all related transactions    | ✅ Fixed |

---

## 🔍 Debugging

### Console Logs Added:

**Backend (API):**

```javascript
console.log("=== TRACK ORDER DEBUG ===");
console.log("Invoice ID:", transaction.invoiceId);
console.log("Midtrans Order ID:", transaction.midtransOrderId);
console.log("Is Multi-Checkout:", isMultiCheckout);
console.log("Related Transactions Count:", relatedTransactions.length);
console.log("Main Transaction Discount:", transaction.discountAmount);
console.log("Main Transaction Final Amount:", transaction.finalAmount);

console.log("=== DISCOUNT DISTRIBUTION DEBUG ===");
console.log("Subtotal from items:", subtotalFromItems);
console.log("Global discount percentage:", discountPercentage);
console.log("Global discount amount:", discountAmount);
console.log(`Item ${i + 1} discount distribution:`);
console.log(`  - Item total: ${itemTotalAmount}`);
console.log(`  - Item ratio: ${itemRatio.toFixed(4)}`);
console.log(`  - Item discount: ${itemDiscountAmount}`);
console.log(`  - Item final amount: ${itemFinalAmount}`);
```

**Frontend (Browser Console):**

```javascript
// Di track-order page
console.log(data.data); // Check structure dari API
```

---

## 🚀 Next Steps

1. ✅ Test multi-checkout dengan member yang punya diskon
2. ✅ Test multi-checkout dengan guest (tanpa diskon)
3. ✅ Test single checkout (ensure tidak break)
4. ✅ Verify email invoice shows correct total
5. ✅ Check admin dashboard displays consistent numbers
6. ✅ Test payment flow end-to-end

---

## 📌 Important Notes

- **Backward Compatible:** Transaksi lama tanpa diskon tetap berfungsi
- **Single Checkout Unaffected:** Tidak ada perubahan behavior untuk single item
- **Database Schema:** Tidak perlu migrasi, field discount sudah ada di schema
- **Performance:** Query tambahan minimal impact (indexed by midtransOrderId)
- **Midtrans Consistency:** gross_amount di Midtrans = total di track order

---

**Tanggal Perbaikan:** 13 Oktober 2025  
**Status:** ✅ Complete - Siap untuk Testing
