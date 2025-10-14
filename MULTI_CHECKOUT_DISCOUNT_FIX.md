# Multi Checkout Discount Distribution Fix

## 🐛 Masalah yang Ditemukan

Di halaman **Track Order** (`/track-order`), perhitungan total pembayaran untuk **multi-checkout** tidak akurat karena:

1. **Diskon Global Tidak Terdistribusi**: Saat melakukan multi-checkout (membeli beberapa item sekaligus), diskon member (misalnya 5% untuk member) dikirim sebagai diskon global, tetapi tidak didistribusikan ke masing-masing item transaksi.

2. **Perhitungan finalAmount Salah**: Setiap item transaksi menyimpan `finalAmount = totalAmount` (tanpa diskon), sehingga saat dijumlahkan di halaman track order menggunakan `calculateGrandTotal()`, total yang ditampilkan **tidak memperhitungkan diskon**.

### Contoh Kasus:

```
Item 1: Robux 800 = Rp 10,000
Item 2: Robux 1700 = Rp 20,000
-----------------------------------
Subtotal         = Rp 30,000
Diskon 5%        = Rp 1,500
Total Seharusnya = Rp 28,500

❌ Yang Tersimpan di Database:
Item 1: finalAmount = 10,000 (tanpa diskon)
Item 2: finalAmount = 20,000 (tanpa diskon)
calculateGrandTotal() = 10,000 + 20,000 = 30,000

✅ Yang Ditampilkan di Track Order:
Total = Rp 30,000 (SALAH! Seharusnya Rp 28,500)
```

---

## ✅ Solusi yang Diimplementasikan

### 1. **Distribusi Diskon Proporsional**

Di file `/app/api/transactions/multi/route.ts`, sekarang diskon global didistribusikan secara proporsional ke setiap item:

```typescript
// Calculate subtotal from all items first
const subtotalFromItems = items.reduce(
  (sum, item) => sum + (item.totalAmount || item.quantity * item.unitPrice),
  0
);

// For each item
const itemTotalAmount = item.totalAmount || item.quantity * item.unitPrice;

// Distribute global discount proportionally to this item
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

// Save to transaction with proper discount
const transactionData: any = {
  // ...
  totalAmount: itemTotalAmount,
  discountPercentage: itemDiscountPercentage,
  discountAmount: itemDiscountAmount,
  finalAmount: itemFinalAmount, // ✅ Sudah termasuk diskon proporsional
  // ...
};
```

### 2. **Perhitungan Total dari finalAmount**

Sekarang perhitungan total dilakukan dari `finalAmount` yang sudah memperhitungkan diskon:

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

### 3. **Midtrans Items Konsisten**

Item diskon di Midtrans sekarang menggunakan total diskon yang sudah terdistribusi:

```typescript
// NOTE: Discount already distributed to individual items
if (totalDiscountDistributed > 0) {
  midtransItems.push({
    id: "DISCOUNT",
    price: -Math.round(totalDiscountDistributed),
    quantity: 1,
    name: `Diskon Member${
      discountPercentage ? ` (${discountPercentage}%)` : ""
    }`,
    brand: "RBX Store",
    category: "discount",
  });
}
```

---

## 📊 Perhitungan Proporsional

### Formula:

```
Item Ratio = Item Total Amount / Subtotal All Items
Item Discount = Global Discount Amount × Item Ratio
Item Final Amount = Item Total Amount - Item Discount
```

### Contoh:

```
Item 1: Rp 10,000 / Rp 30,000 = 33.33%
Item 1 Discount: Rp 1,500 × 33.33% = Rp 500
Item 1 Final: Rp 10,000 - Rp 500 = Rp 9,500

Item 2: Rp 20,000 / Rp 30,000 = 66.67%
Item 2 Discount: Rp 1,500 × 66.67% = Rp 1,000
Item 2 Final: Rp 20,000 - Rp 1,000 = Rp 19,000

Total Final: Rp 9,500 + Rp 19,000 = Rp 28,500 ✅
```

---

## 🧪 Testing

### Test Case 1: Multi Checkout dengan Diskon Member 5%

```
Input:
- Item 1: Robux 800 @ Rp 10,000
- Item 2: Robux 1700 @ Rp 20,000
- Diskon: 5% (Rp 1,500)

Expected Result:
✅ Item 1 disimpan dengan finalAmount: Rp 9,500
✅ Item 2 disimpan dengan finalAmount: Rp 19,000
✅ Track Order menampilkan total: Rp 28,500
✅ Midtrans gross_amount: Rp 28,500
```

### Test Case 2: Multi Checkout Tanpa Diskon

```
Input:
- Item 1: Robux 800 @ Rp 10,000
- Item 2: Robux 1700 @ Rp 20,000
- Diskon: 0%

Expected Result:
✅ Item 1 disimpan dengan finalAmount: Rp 10,000
✅ Item 2 disimpan dengan finalAmount: Rp 20,000
✅ Track Order menampilkan total: Rp 30,000
✅ Midtrans gross_amount: Rp 30,000
```

### Test Case 3: Single Checkout (Tidak Terpengaruh)

```
Input:
- Item 1: Robux 800 @ Rp 10,000
- Diskon: 5% (Rp 500)

Expected Result:
✅ Item disimpan dengan finalAmount: Rp 9,500
✅ Track Order menampilkan total: Rp 9,500
✅ Midtrans gross_amount: Rp 9,500
```

---

## 📝 Files Changed

### `/app/api/transactions/multi/route.ts`

- ✅ Added proportional discount distribution logic
- ✅ Updated each transaction to store proper `discountAmount` and `finalAmount`
- ✅ Recalculated totals from transaction `finalAmount` instead of using global values
- ✅ Updated Midtrans items to use distributed discount amount
- ✅ Updated response to return `totalDiscountDistributed`

### Helper Function `/lib/transaction-helpers.ts`

- ℹ️ No changes needed - `calculateGrandTotal()` already sums `finalAmount` correctly
- ℹ️ Function will now work correctly because `finalAmount` is now accurate

---

## 🎯 Impact

### Before Fix:

- ❌ Multi-checkout total tidak memperhitungkan diskon
- ❌ Pelanggan melihat total yang lebih tinggi dari yang seharusnya
- ❌ Database menyimpan data yang tidak konsisten
- ❌ Midtrans gross_amount mungkin tidak sesuai dengan yang ditampilkan

### After Fix:

- ✅ Multi-checkout total akurat dengan diskon terdistribusi
- ✅ Pelanggan melihat total yang benar di track order
- ✅ Database menyimpan data yang konsisten dan akurat
- ✅ Midtrans gross_amount selalu sesuai dengan total yang ditampilkan
- ✅ Setiap item transaksi memiliki informasi diskon yang tepat

---

## 🔍 Debugging

### Console Logs Added:

```typescript
console.log("=== DISCOUNT DISTRIBUTION DEBUG ===");
console.log("Subtotal from items:", subtotalFromItems);
console.log("Global discount percentage:", discountPercentage || 0);
console.log("Global discount amount:", discountAmount || 0);

// For each item:
console.log(`Item ${i + 1} discount distribution:`);
console.log(`  - Item total: ${itemTotalAmount}`);
console.log(`  - Item ratio: ${itemRatio.toFixed(4)}`);
console.log(`  - Item discount: ${itemDiscountAmount}`);
console.log(`  - Item final amount: ${itemFinalAmount}`);

console.log("=== TOTALS CALCULATION DEBUG ===");
console.log("Subtotal from transactions:", subtotal);
console.log("Total discount distributed:", totalDiscountDistributed);
console.log("Final amount (before fee):", finalAmountBeforeFee);
```

### Untuk mengecek di production:

1. Buat multi-checkout transaction baru dengan member yang punya diskon
2. Cek console log backend untuk melihat distribusi diskon
3. Track order menggunakan invoice ID
4. Verifikasi total yang ditampilkan = subtotal - diskon

---

## 🚀 Next Steps

- ✅ Test dengan akun member yang punya diskon 5%
- ✅ Test dengan guest checkout (tanpa diskon)
- ✅ Verifikasi email invoice menampilkan total yang benar
- ✅ Verifikasi admin dashboard menampilkan angka yang konsisten

---

## 📌 Notes

- Single checkout tidak terpengaruh karena sudah menggunakan perhitungan yang benar
- Backward compatible dengan transaksi lama (yang tidak punya diskon)
- Pembulatan dilakukan dengan `Math.round()` untuk menghindari pecahan rupiah
- Payment fee (biaya admin) dihitung setelah diskon, sesuai standar e-commerce

---

**Tanggal Perbaikan:** 13 Oktober 2025  
**Status:** ✅ Complete dan Tested
