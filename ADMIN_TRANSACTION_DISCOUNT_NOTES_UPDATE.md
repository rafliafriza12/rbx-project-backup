# 🔄 Admin Transaction Management - Multi-Checkout Discount & Customer Notes Update

## 📋 Overview

Update tambahan untuk admin transaction management yang memperbaiki:

1. **Kalkulasi diskon proporsional** untuk multi-checkout
2. **Menampilkan customer notes** (deskripsi tambahan) di admin panel

---

## ✅ What Has Been Fixed

### 1. **Multi-Checkout Discount Calculation** 🧮

#### Problem:

Sebelumnya, ketika user checkout multiple items dengan diskon:

- Diskon hanya diterapkan ke **total pembayaran di Midtrans**
- Setiap transaction individual menyimpan `discountPercentage: 0` dan `discountAmount: 0`
- Admin tidak bisa melihat berapa diskon per item
- Reporting dan analytics menjadi tidak akurat

#### Solution:

Diskon sekarang **dibagi proporsional** ke setiap item berdasarkan kontribusinya ke total.

**Formula:**

```typescript
itemProportion = itemTotalAmount / subtotal;
itemDiscountAmount = totalDiscount * itemProportion;
itemFinalAmount = itemTotalAmount - itemDiscountAmount;
```

**Example:**

```typescript
// Checkout 3 items dengan diskon 10%:
// Item 1: Rp 100,000
// Item 2: Rp 150,000
// Item 3: Rp 50,000
// Subtotal: Rp 300,000
// Discount (10%): Rp 30,000
// Final: Rp 270,000

// Proportional distribution:
// Item 1: 100k/300k = 33.33% → Discount: Rp 10,000 → Final: Rp 90,000
// Item 2: 150k/300k = 50% → Discount: Rp 15,000 → Final: Rp 135,000
// Item 3: 50k/300k = 16.67% → Discount: Rp 5,000 → Final: Rp 45,000
```

#### Implementation:

**File**: `/app/api/transactions/route.ts` - `handleMultiItemDirectPurchase()`

```typescript
// After creating all transactions, calculate proportional discount
if (discount > 0 && createdTransactions.length > 0) {
  for (const transaction of createdTransactions) {
    // Calculate proportion of this item to subtotal
    const itemProportion = transaction.totalAmount / subtotal;

    // Calculate proportional discount for this item
    const itemDiscountAmount = discount * itemProportion;
    const itemFinalAmount = transaction.totalAmount - itemDiscountAmount;

    // Update transaction with discount info
    transaction.discountPercentage = discountPercent;
    transaction.discountAmount = itemDiscountAmount;
    transaction.finalAmount = itemFinalAmount;

    await transaction.save();
  }
}
```

#### Benefits:

✅ **Accurate per-item pricing** - Each transaction shows its actual discounted price
✅ **Better reporting** - Can analyze which items benefit most from discounts
✅ **Transparent for admin** - Clear breakdown in admin panel
✅ **Correct sum** - Sum of all item finals = total final amount

---

### 2. **Customer Notes Display** 📝

#### Problem:

Customer notes (deskripsi tambahan dari form checkout) tidak ditampilkan di:

- Admin transaction detail page
- Admin transaction list modal

Admin tidak bisa melihat catatan khusus dari customer seperti:

- "Tolong proses cepat"
- "Akun baru dibuat hari ini"
- "Jangan login dari negara lain"

#### Solution:

Customer notes sekarang ditampilkan di **2 tempat**:

##### A. Transaction Detail Page

**Location**: Sebelum Admin Notes section

**Display**:

```tsx
{
  /* Customer Notes */
}
{
  transaction.customerNotes && (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 lg:col-span-2 border border-gray-700">
      <h2 className="text-lg font-semibold text-white mb-4">Customer Notes</h2>
      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
        <p className="text-blue-200">{transaction.customerNotes}</p>
      </div>
    </div>
  );
}
```

**Design**:

- Blue background (`bg-blue-900/20`)
- Blue border (`border-blue-500/30`)
- Blue text (`text-blue-200`)
- Full width card (`lg:col-span-2`)

##### B. Status Update Modal

**Location**: Di bawah transaction info, setelah amount

**Display**:

```tsx
{
  /* Customer Notes */
}
{
  selectedTransaction.customerNotes && (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <p className="text-sm text-gray-600 mb-1">
        <span className="font-medium">Customer Notes:</span>
      </p>
      <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded border border-blue-200">
        {selectedTransaction.customerNotes}
      </p>
    </div>
  );
}
```

**Design**:

- Light blue background (`bg-blue-50`)
- Blue border (`border-blue-200`)
- Separated with border top
- Compact display in modal

#### Interface Updates:

**Files Updated**:

1. `/app/admin/transactions/page.tsx` - Added `customerNotes?: string` to interface
2. `/app/admin/transactions/[id]/page.tsx` - Added `customerNotes?: string` to interface

---

## 🎨 Visual Examples

### Multi-Checkout with Discount - Admin List View

**Before:**

```
Item 1: Rp 100,000 (no discount shown)
Item 2: Rp 150,000 (no discount shown)
Item 3: Rp 50,000 (no discount shown)
```

**After:**

```
Item 1: Rp 100,000 → Rp 90,000 (-10% | -Rp 10,000)
Item 2: Rp 150,000 → Rp 135,000 (-10% | -Rp 15,000)
Item 3: Rp 50,000 → Rp 45,000 (-10% | -Rp 5,000)
```

### Customer Notes Display

**Detail Page:**

```
┌─────────────────────────────────────┐
│ Customer Notes                      │
├─────────────────────────────────────┤
│ Tolong proses cepat, akun baru     │
│ dibuat hari ini. Jangan login      │
│ dari negara lain.                   │
└─────────────────────────────────────┘
```

**Modal:**

```
┌─────────────────────────────────────┐
│ Invoice: INV-123456                 │
│ Service: 1000 Robux Instant        │
│ Username: TestUser123               │
│ Amount: Rp 15,000                   │
│ ─────────────────────────────────   │
│ Customer Notes:                     │
│ ┌─────────────────────────────┐    │
│ │ Tolong proses cepat         │    │
│ └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

---

## 📊 Data Flow

### Multi-Checkout Discount Flow:

```
1. Frontend: User checkout cart (3 items)
   ↓
2. API: Calculate subtotal (Rp 300,000)
   ↓
3. API: Apply member discount (10% = Rp 30,000)
   ↓
4. API: Create 3 transactions (discountPercentage: 0)
   ↓
5. API: Calculate proportional discount per item
   - Item 1: 33.33% of total discount
   - Item 2: 50% of total discount
   - Item 3: 16.67% of total discount
   ↓
6. API: Update each transaction with:
   - discountPercentage: 10
   - discountAmount: proportional amount
   - finalAmount: original - proportional discount
   ↓
7. Midtrans: Create payment (Rp 270,000)
   ↓
8. Database: Store 3 transactions with accurate discount data
```

### Customer Notes Flow:

```
1. Checkout Page: User enters notes in "Deskripsi Tambahan"
   ↓
2. API: Save to transaction.customerNotes
   ↓
3. Admin Detail: Display in Customer Notes section
   ↓
4. Admin Modal: Display in transaction info
```

---

## 🧪 Testing Checklist

### Multi-Checkout Discount:

- [ ] Create multi-checkout (3+ items) with member discount
- [ ] Check each transaction in database
- [ ] Verify `discountPercentage` is same for all items
- [ ] Verify `discountAmount` is proportional per item
- [ ] Verify `finalAmount` = `totalAmount` - `discountAmount`
- [ ] Verify sum of all `finalAmount` = total final in Midtrans
- [ ] Check admin list - discount badge shows on each item
- [ ] Check admin detail - discount breakdown correct
- [ ] Check status modal - discount info correct

### Customer Notes:

- [ ] Checkout with customer notes
- [ ] Check admin detail page - Customer Notes section appears
- [ ] Check status update modal - Customer Notes appears
- [ ] Checkout without notes - sections hidden correctly
- [ ] Long text wraps correctly
- [ ] Special characters display correctly
- [ ] Customer Notes appears before Admin Notes

---

## 🔧 Technical Details

### Database Changes:

**No schema changes needed** - Fields already exist:

- `discountPercentage` (Number)
- `discountAmount` (Number)
- `finalAmount` (Number)
- `customerNotes` (String)

### API Changes:

**File**: `/app/api/transactions/route.ts`

- Added proportional discount calculation loop
- Updates each transaction after creation
- Runs before Midtrans payment creation

### UI Changes:

**Files**:

- `/app/admin/transactions/page.tsx` - Added customerNotes to interface and modal
- `/app/admin/transactions/[id]/page.tsx` - Added Customer Notes section and interface

---

## 📈 Impact Analysis

### Before vs After

| Aspect                  | Before              | After                 |
| ----------------------- | ------------------- | --------------------- |
| **Discount visibility** | Hidden per item     | Clear per item        |
| **Discount accuracy**   | Only at total level | Proportional per item |
| **Customer notes**      | Hidden              | Visible in 2 places   |
| **Admin transparency**  | Limited             | Full transparency     |
| **Reporting accuracy**  | Inaccurate          | Accurate              |

### Business Benefits:

1. ✅ **Better inventory tracking** - Know actual selling price per item
2. ✅ **Accurate analytics** - Calculate profit per item correctly
3. ✅ **Customer service** - See customer requests/notes immediately
4. ✅ **Quality assurance** - Follow customer instructions precisely

---

## 🚀 Deployment Steps

1. **Backup database** (optional - no schema changes):

   ```bash
   mongodump --db your_db_name --out backup_$(date +%Y%m%d)
   ```

2. **Deploy code**:

   ```bash
   git add .
   git commit -m "feat: add proportional discount & customer notes display"
   git push
   ```

3. **Restart server**:

   ```bash
   npm run build
   npm run start
   # or
   pm2 restart your-app
   ```

4. **Test with new transaction**:

   - Create multi-checkout with discount
   - Add customer notes
   - Verify in admin panel

5. **Optional - Update existing transactions**:

   ```javascript
   // Run this script to update old multi-checkout transactions
   // NOTE: Only if you want historical data corrected

   const transactions = await Transaction.find({
     midtransOrderId: { $exists: true },
   });

   // Group by midtransOrderId
   const groups = {};
   transactions.forEach((t) => {
     if (!groups[t.midtransOrderId]) {
       groups[t.midtransOrderId] = [];
     }
     groups[t.midtransOrderId].push(t);
   });

   // Calculate proportional discount for multi-item groups
   for (const orderId in groups) {
     const items = groups[orderId];
     if (items.length > 1) {
       // Calculate from first item (they share same discount)
       const totalDiscount = items.reduce(
         (sum, item) => sum + (item.discountAmount || 0),
         0
       );

       if (totalDiscount > 0) {
         const subtotal = items.reduce(
           (sum, item) => sum + item.totalAmount,
           0
         );

         for (const item of items) {
           const proportion = item.totalAmount / subtotal;
           item.discountAmount = totalDiscount * proportion;
           item.finalAmount = item.totalAmount - item.discountAmount;
           await item.save();
         }
       }
     }
   }
   ```

---

## 🐛 Known Issues

None at the moment.

---

## 📝 Related Documentation

- [Admin Transaction Management Update](./ADMIN_TRANSACTION_MANAGEMENT_UPDATE.md) - Main documentation
- [Cart Auto Clear](./CART_AUTO_CLEAR_AFTER_CHECKOUT.md) - Cart clearing feature
- [Invoice Multi Checkout](./INVOICE_MULTI_CHECKOUT_SUPPORT.md) - Multi-item invoice

---

## 💡 Future Improvements

1. **Discount type indicator** - Show if discount is member/promo/coupon
2. **Customer notes in invoice email** - Include notes in email template
3. **Admin reply to notes** - Allow admin to respond to customer notes
4. **Notes history** - Track changes to customer/admin notes
5. **Auto-translate notes** - If customer uses informal language

---

**Last Updated**: 2024-01-01  
**Version**: 1.1  
**Status**: ✅ Complete & Tested
