# Payment Method Management System

## 📋 Overview

Sistem manajemen metode pembayaran yang terintegrasi dengan Midtrans untuk RBX Project. Admin dapat mengelola metode pembayaran melalui panel admin, dan user dapat memilih metode pembayaran yang telah dikonfigurasi saat checkout.

## 🎯 Features

### Admin Panel (`/admin/payment-methods`)

- ✅ CRUD operations (Create, Read, Update, Delete)
- ✅ Dashboard statistik (Total, Active, Midtrans-enabled)
- ✅ Toggle active/inactive status
- ✅ Kategori payment method
- ✅ Fee configuration (fixed amount atau percentage)
- ✅ Midtrans integration toggle
- ✅ Display order untuk sorting
- ✅ Min/max transaction amount
- ✅ Payment instructions

### Checkout Integration (`/checkout`)

- ✅ Dynamic payment method fetch dari database
- ✅ Grouping by category (E-Wallet, QRIS, Virtual Account, dll)
- ✅ Automatic fee calculation
- ✅ Responsive payment method selection
- ✅ Real-time total update dengan fee

## 📊 Database Schema

### PaymentMethod Model (`models/PaymentMethod.ts`)

```typescript
{
  code: string;              // Kode untuk Midtrans (e.g., "GOPAY", "BCA_VA")
  name: string;              // Nama tampilan (e.g., "GoPay", "BCA Virtual Account")
  category: string;          // ewallet, bank_transfer, qris, retail, credit_card, other
  icon: string;              // Emoji icon (e.g., "💳", "🏦")
  fee: number;               // Nominal fee
  feeType: "fixed" | "percentage";  // Tipe fee
  description: string;       // Deskripsi metode pembayaran
  isActive: boolean;         // Status aktif/nonaktif
  displayOrder: number;      // Urutan tampilan (ascending)
  midtransEnabled: boolean;  // Integrasi dengan Midtrans
  minimumAmount?: number;    // Minimal transaksi (optional)
  maximumAmount?: number;    // Maksimal transaksi (optional)
  instructions?: string;     // Instruksi pembayaran (optional)
}
```

### Indexes

- `code` (unique, sparse)
- `category`
- `isActive`
- `displayOrder`

## 🔌 API Endpoints

### 1. Get All Payment Methods

```http
GET /api/payment-methods
Query Parameters:
  - active: boolean (filter hanya yang aktif)
  - category: string (filter by category)
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "code": "GOPAY",
      "name": "GoPay",
      "category": "ewallet",
      "icon": "💚",
      "fee": 2500,
      "feeType": "fixed",
      "description": "Transfer langsung ke GoPay",
      "isActive": true,
      "displayOrder": 0,
      "midtransEnabled": true
    }
  ]
}
```

### 2. Create Payment Method

```http
POST /api/payment-methods
Content-Type: application/json

Body:
{
  "code": "GOPAY",
  "name": "GoPay",
  "category": "ewallet",
  "icon": "💚",
  "fee": 2500,
  "feeType": "fixed",
  "description": "Transfer langsung ke GoPay",
  "isActive": true,
  "displayOrder": 0,
  "midtransEnabled": true
}
```

### 3. Get Single Payment Method

```http
GET /api/payment-methods/[id]
```

### 4. Update Payment Method

```http
PUT /api/payment-methods/[id]
Content-Type: application/json

Body: (same as create)
```

### 5. Delete Payment Method

```http
DELETE /api/payment-methods/[id]
```

## 💳 Midtrans Payment Codes Reference

### E-Wallet

- `GOPAY` - GoPay
- `SHOPEEPAY` - ShopeePay

### QRIS

- `QRIS` - QRIS

### Bank Transfer (Virtual Account)

- `BCA_VA` - BCA Virtual Account
- `BNI_VA` - BNI Virtual Account
- `BRI_VA` - BRI Virtual Account
- `PERMATA_VA` - Permata Virtual Account
- `ECHANNEL` - Mandiri Bill Payment
- `OTHER_VA` - Other VA

### Retail/Minimarket

- `INDOMARET` - Indomaret
- `ALFAMART` - Alfamart

### Credit Card

- `CREDIT_CARD` - Credit Card

## 🎨 Admin Interface

### Stats Dashboard

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Total Methods   │ Active Methods  │ Midtrans Enabled│
│      12         │       10        │        8        │
└─────────────────┴─────────────────┴─────────────────┘
```

### Payment Methods Table

| Payment Method | Category      | Fee      | Status | Midtrans | Actions       |
| -------------- | ------------- | -------- | ------ | -------- | ------------- |
| 💚 GoPay       | E-Wallet      | Rp 2,500 | Active | ✓ Yes    | Edit / Delete |
| 🏦 BCA VA      | Bank Transfer | Rp 4,000 | Active | ✓ Yes    | Edit / Delete |

### Create/Edit Modal

- Full form dengan semua field
- Validasi input (required fields, fee limits)
- Midtrans code reference guide
- Category selection
- Fee type selection (fixed/percentage)
- Active toggle
- Midtrans integration toggle

## 💰 Fee Calculation

### Fixed Fee

```javascript
// Example: DANA with Rp 2,500 fee
baseAmount = 100000;
fee = 2500;
finalAmount = baseAmount + fee; // 102,500
```

### Percentage Fee

```javascript
// Example: QRIS with 0.7% fee
baseAmount = 100000;
fee = 0.7;
feeAmount = (baseAmount * fee) / 100; // 700
finalAmount = baseAmount + feeAmount; // 100,700
```

## 🔄 Checkout Integration Flow

### 1. Fetch Payment Methods

```typescript
// Checkout page loads
useEffect(() => {
  fetch("/api/payment-methods?active=true")
    .then((res) => res.json())
    .then((data) => {
      // Group by category
      // Set to state
    });
}, []);
```

### 2. Display Payment Options

- Group by category (E-Wallet, QRIS, Virtual Account, dll)
- Show icon, name, description, and fee
- Expandable categories
- Radio button selection

### 3. Calculate Total with Fee

```typescript
const calculateFinalAmount = () => {
  const baseAmount = checkoutData?.finalAmount || 0;
  if (!selectedPaymentMethod) return baseAmount;

  const method = getAllMethods().find((m) => m.id === selectedPaymentMethod);
  if (!method) return baseAmount;

  const fee = calculatePaymentFee(baseAmount, method);
  return baseAmount + fee;
};
```

### 4. Submit Transaction

- Selected payment method code dikirim ke backend
- Fee sudah terkalkulasi di frontend
- Backend create Midtrans transaction dengan payment method code

## 📝 Usage Examples

### Example 1: Add GoPay Payment Method

```javascript
POST /api/payment-methods
{
  "code": "GOPAY",
  "name": "GoPay",
  "category": "ewallet",
  "icon": "💚",
  "fee": 2500,
  "feeType": "fixed",
  "description": "Transfer langsung ke GoPay dengan instant notification",
  "isActive": true,
  "displayOrder": 0,
  "midtransEnabled": true,
  "minimumAmount": 10000,
  "instructions": "1. Pilih GoPay\n2. Scan QR Code\n3. Confirm payment"
}
```

### Example 2: Add QRIS with Percentage Fee

```javascript
POST /api/payment-methods
{
  "code": "QRIS",
  "name": "QRIS",
  "category": "qris",
  "icon": "📱",
  "fee": 0.7,
  "feeType": "percentage",
  "description": "Scan QR Code untuk pembayaran instant",
  "isActive": true,
  "displayOrder": 0,
  "midtransEnabled": true
}
```

### Example 3: Toggle Payment Method Status

```javascript
PUT /api/payment-methods/[id]
{
  ...existingData,
  "isActive": false  // Disable payment method
}
```

## 🎯 Admin Workflow

### Adding New Payment Method

1. Klik "Tambah Payment Method"
2. Isi form:
   - Kode (lihat referensi Midtrans)
   - Nama tampilan
   - Kategori
   - Icon (emoji)
   - Fee amount dan type
   - Description
   - Optional: Min/max amount, instructions
3. Toggle active & midtrans enabled
4. Klik "Simpan"
5. Payment method langsung tersedia di checkout page

### Editing Payment Method

1. Klik "Edit" di table
2. Modal muncul dengan data ter-prefill
3. Edit fields yang diperlukan
4. Klik "Update"
5. Changes langsung reflected di checkout page

### Disabling Payment Method

1. Klik status badge (Active/Inactive) di table
2. Confirmation
3. Status toggle
4. Payment method tidak tampil di checkout page

## 🔐 Security Considerations

### Admin Access

- Only authenticated admin users can access `/admin/payment-methods`
- CRUD operations require admin role
- Input validation on both frontend and backend

### API Security

- Mongoose schema validation
- Unique code constraint
- Fee validation (0-100 for percentage, no negative for fixed)
- Input sanitization

### Checkout Security

- Only fetch active payment methods
- Fee calculation validated on backend
- Payment method code validated against Midtrans

## 🚀 Future Enhancements

### Planned Features

- [ ] Payment method analytics (usage stats, revenue per method)
- [ ] Automatic fee adjustment based on time/promotions
- [ ] Payment method availability by region
- [ ] A/B testing for payment methods
- [ ] User payment method preferences
- [ ] Bulk import/export payment methods
- [ ] Payment method templates

### Integration Enhancements

- [ ] Connect to Midtrans API for real-time status
- [ ] Automatic enable/disable based on Midtrans maintenance
- [ ] Payment method recommendations based on transaction amount
- [ ] Dynamic fee calculation from Midtrans

## 🐛 Troubleshooting

### Payment Method Not Appearing in Checkout

1. Check `isActive` status in admin panel
2. Verify payment method saved successfully
3. Check browser console for fetch errors
4. Clear browser cache and reload

### Fee Calculation Incorrect

1. Verify `feeType` (fixed vs percentage)
2. Check fee amount in database
3. Test with different transaction amounts
4. Verify calculatePaymentFee function

### Midtrans Integration Not Working

1. Verify `midtransEnabled` is true
2. Check payment method `code` matches Midtrans codes
3. Test Midtrans credentials in lib/midtrans.ts
4. Check Midtrans dashboard for error logs

## 📚 Related Files

### Models

- `models/PaymentMethod.ts` - Payment method schema

### API Routes

- `app/api/payment-methods/route.ts` - GET, POST
- `app/api/payment-methods/[id]/route.ts` - GET, PUT, DELETE

### Admin Panel

- `app/admin/payment-methods/page.tsx` - Admin CRUD interface

### Checkout

- `app/checkout/page.tsx` - Checkout with dynamic payment methods

### Utilities

- `lib/midtrans.ts` - Midtrans integration service

## 💡 Tips & Best Practices

### For Admin

1. **Code Naming**: Use uppercase for consistency (e.g., "GOPAY" not "gopay")
2. **Display Order**: Use increments of 10 (0, 10, 20) for easier reordering
3. **Fee Setting**: Test with small amounts first
4. **Icons**: Use relevant emojis for better UX
5. **Testing**: Always test payment method in staging before production

### For Developers

1. **Validation**: Always validate input on both frontend and backend
2. **Error Handling**: Provide helpful error messages
3. **Logging**: Log payment method selection for analytics
4. **Caching**: Consider caching payment methods for better performance
5. **Fallback**: Provide default payment methods if API fails

## 📞 Support

For issues or questions:

1. Check this documentation
2. Review error logs in browser console
3. Check Midtrans documentation
4. Contact development team

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready ✅
