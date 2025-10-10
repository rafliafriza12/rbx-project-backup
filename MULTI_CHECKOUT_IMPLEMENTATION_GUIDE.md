# Implementasi Multi-Checkout pada Halaman Transaksi

## 📋 Overview

Dokumen ini menjelaskan cara mengimplementasikan dukungan multi-checkout pada 3 halaman:

1. Track Order Page (`/track-order`)
2. Riwayat Transaksi Page (`/riwayat`)
3. Detail Riwayat Page (`/riwayat/[id]`)

## 🎯 Fitur Multi-Checkout

### Yang Sudah Tersedia:

- ✅ API `/api/transactions/[id]` mengembalikan `relatedTransactions` dan `isMultiCheckout`
- ✅ Helper functions di `lib/transaction-helpers.ts`
- ✅ Type definitions updated di `types/index.ts`

### Yang Perlu Diimplementasikan:

1. **Deteksi multi-checkout** - gunakan `isMultiCheckout(transaction)`
2. **Tampilkan semua items** - iterate `getAllTransactions(transaction)`
3. **Grand total** - gunakan `calculateGrandTotal(transaction)`
4. **UI grouping** - tampilkan sebagai satu grup dengan detail per-item

---

## 1️⃣ Track Order Page Implementation

### A. Import Helper Functions

```tsx
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  calculateOriginalTotal,
  getTotalItemsCount,
  getCheckoutDisplayName,
} from "@/lib/transaction-helpers";
```

### B. Update Transaction Display Section

Ganti bagian "Transaction Header" dengan:

```tsx
{
  transaction && (
    <div className="space-y-6">
      {/* Multi-Checkout Indicator */}
      {isMultiCheckout(transaction) && (
        <div className="bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary-100" />
            <div>
              <h4 className="font-semibold text-white">Multi-Item Checkout</h4>
              <p className="text-sm text-white/70">
                Pesanan ini berisi {getAllTransactions(transaction).length} item
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Header */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>

        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white break-words mb-2">
                {getCheckoutDisplayName(transaction)}
              </h2>
              <p className="text-sm sm:text-base text-white/70">
                Invoice: {transaction.invoiceId}
                {transaction.midtransOrderId && (
                  <> • Order ID: {transaction.midtransOrderId}</>
                )}
              </p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <div className="mb-3">
                {getStatusBadge(transaction.orderStatus)}
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold text-primary-100">
                  Rp {calculateGrandTotal(transaction).toLocaleString("id-ID")}
                </div>
                <div className="text-sm text-white/60">Total Pembayaran</div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4 mt-6">
            <h3 className="font-semibold text-white text-lg">Detail Items</h3>

            {getAllTransactions(transaction).map((item, index) => (
              <div
                key={item._id}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {item.serviceImage && (
                        <img
                          src={item.serviceImage}
                          alt={item.serviceName}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-white mb-1">
                          {item.serviceName}
                        </h4>
                        <p className="text-sm text-white/60 capitalize">
                          {item.serviceType}
                          {item.serviceCategory && ` • ${item.serviceCategory}`}
                        </p>
                        <p className="text-sm text-white/70 mt-1">
                          Akun: {item.robloxUsername}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="text-sm text-white/60 mb-1">
                      {item.quantity}x @ Rp{" "}
                      {item.unitPrice.toLocaleString("id-ID")}
                    </div>
                    <div className="font-semibold text-white">
                      Rp{" "}
                      {(item.finalAmount || item.totalAmount).toLocaleString(
                        "id-ID"
                      )}
                    </div>
                    {/* Item Status */}
                    <div className="mt-2">
                      {getStatusBadge(item.orderStatus)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Payment Summary */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="space-y-2">
              <div className="flex justify-between text-white/70">
                <span>Subtotal ({getTotalItemsCount(transaction)} items):</span>
                <span>
                  Rp{" "}
                  {calculateOriginalTotal(transaction).toLocaleString("id-ID")}
                </span>
              </div>
              {calculateOriginalTotal(transaction) !==
                calculateGrandTotal(transaction) && (
                <div className="flex justify-between text-green-400">
                  <span>Diskon:</span>
                  <span>
                    -Rp{" "}
                    {(
                      calculateOriginalTotal(transaction) -
                      calculateGrandTotal(transaction)
                    ).toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                <span>Total Pembayaran:</span>
                <span className="text-primary-100">
                  Rp {calculateGrandTotal(transaction).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 2️⃣ Riwayat Transaksi Page Implementation

### A. Import Helper Functions

```tsx
import {
  isMultiCheckout,
  getAllTransactions,
  calculateGrandTotal,
  getCheckoutDisplayName,
  getTotalItemsCount,
} from "@/lib/transaction-helpers";
```

### B. Group Transactions by midtransOrderId

Tambahkan function untuk grouping:

```tsx
// Group transactions by midtransOrderId for multi-checkout display
const groupTransactionsByCheckout = (transactions: Transaction[]) => {
  const grouped = new Map<string, Transaction[]>();
  const singles: Transaction[] = [];

  transactions.forEach((transaction) => {
    if (transaction.midtransOrderId) {
      const orderId = transaction.midtransOrderId;
      if (!grouped.has(orderId)) {
        grouped.set(orderId, []);
      }
      grouped.get(orderId)!.push(transaction);
    } else {
      singles.push(transaction);
    }
  });

  return { grouped, singles };
};
```

### C. Update Display Logic

```tsx
const { grouped, singles } = groupTransactionsByCheckout(filteredTransactions);

// Convert grouped to array of representative transactions
const groupedArray = Array.from(grouped.values()).map((group) => {
  // Use first transaction as representative
  const representative = group[0];
  // Add related transactions
  representative.relatedTransactions = group.slice(1);
  representative.isMultiCheckout = group.length > 1;
  return representative;
});

// Combine with singles
const displayTransactions = [...groupedArray, ...singles].sort((a, b) => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
});
```

### D. Update Transaction Card

```tsx
{
  displayTransactions.map((transaction, index) => {
    const isMulti = isMultiCheckout(transaction);
    const allItems = getAllTransactions(transaction);

    return (
      <div
        key={transaction._id}
        className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.02] hover:border-primary-100/60"
      >
        {/* ... background effects ... */}

        <div className="relative z-10 p-4 sm:p-6">
          {/* Multi-checkout badge */}
          {isMulti && (
            <div className="mb-3 inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100/20 border border-primary-100/40 rounded-xl backdrop-blur-sm">
              <Package className="w-4 h-4 text-primary-100" />
              <span className="text-sm font-medium text-primary-100">
                {allItems.length} Items
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: Service Info */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1">
              <div className="flex-shrink-0">
                {getServiceIcon(transaction.serviceType)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-[#f1f5f9] mb-2 group-hover:text-primary-100 transition-colors">
                  {getCheckoutDisplayName(transaction)}
                </h3>

                {/* Multi-item details */}
                {isMulti ? (
                  <div className="space-y-1">
                    {allItems.map((item, idx) => (
                      <p key={item._id} className="text-sm text-[#94a3b8]">
                        • {item.serviceName} ({item.quantity}x)
                      </p>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[#94a3b8] mb-1 capitalize">
                      {transaction.serviceType}
                      {transaction.serviceCategory &&
                        ` • ${transaction.serviceCategory}`}
                    </p>
                    <p className="text-sm text-[#cbd5e1]">
                      Quantity: {transaction.quantity}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right: Amount & Status */}
            <div className="flex flex-col sm:items-end gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-100 mb-1">
                  Rp {calculateGrandTotal(transaction).toLocaleString("id-ID")}
                </div>
                {isMulti && (
                  <div className="text-sm text-[#94a3b8]">
                    {getTotalItemsCount(transaction)} total items
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {getStatusBadge(transaction.paymentStatus, "payment")}
                {getStatusBadge(transaction.orderStatus, "order")}
              </div>

              <Link
                href={`/riwayat/${transaction._id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100/20 hover:bg-primary-100/30 text-primary-100 rounded-lg transition-all duration-300 text-sm font-medium border border-primary-100/30"
              >
                <span>Lihat Detail</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          {/* Invoice ID */}
          <div className="mt-4 pt-4 border-t border-primary-100/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <span className="text-[#94a3b8]">
                Invoice:{" "}
                <span className="text-[#cbd5e1] font-mono">
                  {transaction.invoiceId}
                </span>
              </span>
              <span className="text-[#94a3b8]">
                {formatDate(transaction.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  });
}
```

---

## 3️⃣ Detail Riwayat Page Implementation

Implementasinya sama dengan **Track Order** page. Gunakan kode yang sama dari bagian 1️⃣.

---

## 🎨 UI Guidelines

### 1. Multi-Checkout Indicator

- Tampilkan badge "Multi-Item Checkout" di atas header
- Gunakan warna primary untuk highlight
- Tampilkan jumlah total items

### 2. Items List

- Setiap item dalam card terpisah
- Tampilkan thumbnail (jika ada)
- Show individual status untuk setiap item
- Tampilkan username Roblox per item

### 3. Payment Summary

- Subtotal dari semua items
- Diskon (jika ada)
- Total pembayaran (bold, primary color)
- Payment method fee (jika ada)

### 4. Status Display

- Payment status: shared untuk semua items (satu payment)
- Order status: individual per item (bisa berbeda-beda)

---

## 🚀 Testing Checklist

- [ ] Single transaction tetap ditampilkan dengan benar
- [ ] Multi-checkout ditampilkan dengan grouping yang benar
- [ ] Grand total calculation akurat
- [ ] Individual item status terlihat jelas
- [ ] Payment button works untuk pending transactions
- [ ] Status history shows untuk semua items
- [ ] Responsive di mobile dan desktop
- [ ] Filter dan sorting tetap bekerja di halaman riwayat

---

## 📝 Notes

1. **Backward Compatibility**: Kode tetap support transaksi lama (single-item)
2. **Performance**: Grouping dilakukan di frontend untuk menghindari query kompleks
3. **UX**: User bisa lihat detail setiap item meskipun dalam satu checkout
4. **Payment**: Satu payment untuk semua items (shared snapToken, redirectUrl)

---

Untuk implementasi lengkap, copy kode dari dokumen ini dan sesuaikan dengan struktur existing code di setiap halaman.
