# Admin Panel Visual Guide - Payment Methods

## 🎨 Interface Overview

### Dashboard View

```
╔═══════════════════════════════════════════════════════════════════════╗
║  Payment Methods                          [+ Tambah Payment Method]   ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      ║
║  │  💳              │  │  ✓              │  │  🔗             │      ║
║  │  Total Methods  │  │  Active Methods │  │  Midtrans      │      ║
║  │      12         │  │       10        │  │  Enabled: 8    │      ║
║  └─────────────────┘  └─────────────────┘  └─────────────────┘      ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║  Payment Method     │ Category     │ Fee      │ Status  │ Actions    ║
╠═══════════════════════════════════════════════════════════════════════╣
║  💚 GoPay          │ E-Wallet     │ Rp 2,500 │ Active  │ Edit  Del  ║
║  GOPAY             │              │          │         │            ║
╟───────────────────────────────────────────────────────────────────────╢
║  🛒 ShopeePay      │ E-Wallet     │ Rp 2,500 │ Active  │ Edit  Del  ║
║  SHOPEEPAY         │              │          │         │            ║
╟───────────────────────────────────────────────────────────────────────╢
║  📱 QRIS           │ QRIS         │ 0.7%     │ Active  │ Edit  Del  ║
║  QRIS              │              │          │         │            ║
╟───────────────────────────────────────────────────────────────────────╢
║  🏦 BCA VA         │ Bank Trans   │ Rp 4,000 │ Active  │ Edit  Del  ║
║  BCA_VA            │              │          │         │            ║
╟───────────────────────────────────────────────────────────────────────╢
║  🏪 Indomaret      │ Retail       │ Rp 2,500 │ Inactive│ Edit  Del  ║
║  INDOMARET         │              │          │         │            ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## ➕ Create Payment Method Modal

### Modal Layout

```
╔═══════════════════════════════════════════════════════════════╗
║  Tambah Payment Method Baru                              [×]  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────┐  ┌─────────────────────────┐   ║
║  │ Kode Payment Method *   │  │ Nama Payment Method *   │   ║
║  │ [GOPAY____________]     │  │ [GoPay_____________]    │   ║
║  │ Kode untuk Midtrans     │  └─────────────────────────┘   ║
║  └─────────────────────────┘                                 ║
║                                                               ║
║  ┌─────────────────────────┐  ┌─────────────────────────┐   ║
║  │ Kategori *              │  │ Icon (Emoji)            │   ║
║  │ [E-Wallet      ▼]       │  │ [💚]                    │   ║
║  └─────────────────────────┘  └─────────────────────────┘   ║
║                                                               ║
║  ┌─────────────────────────┐  ┌─────────────────────────┐   ║
║  │ Tipe Fee *              │  │ Fee Amount *            │   ║
║  │ [Fixed (Rupiah)▼]       │  │ [2500____________]      │   ║
║  └─────────────────────────┘  │ Dalam Rupiah            │   ║
║                               └─────────────────────────┘   ║
║  ┌─────────────────────────┐  ┌─────────────────────────┐   ║
║  │ Urutan Tampilan         │  │ Minimal Transaksi       │   ║
║  │ [0]                     │  │ [10000____________]     │   ║
║  └─────────────────────────┘  └─────────────────────────┘   ║
║                                                               ║
║  ┌───────────────────────────────────────────────────────┐   ║
║  │ Deskripsi                                             │   ║
║  │ [Transfer langsung ke GoPay___________________]       │   ║
║  └───────────────────────────────────────────────────────┘   ║
║                                                               ║
║  ┌───────────────────────────────────────────────────────┐   ║
║  │ Instruksi Pembayaran (Opsional)                      │   ║
║  │ [1. Pilih GoPay                                       │   ║
║  │  2. Scan QR Code                                      │   ║
║  │  3. Confirm payment_________________________]         │   ║
║  └───────────────────────────────────────────────────────┘   ║
║                                                               ║
║  [✓] Aktifkan payment method ini                            ║
║  [✓] Integrasi dengan Midtrans                              ║
║                                                               ║
║  ┌────────────────────────────────────────────────────────┐  ║
║  │ 📘 Referensi Kode Midtrans                             │  ║
║  │ ┌──────────┬──────────┬──────────┬──────────┐         │  ║
║  │ │ GOPAY    │ SHOPEEPAY│ QRIS     │ BCA_VA   │         │  ║
║  │ │ GoPay    │ ShopeePay│ QRIS     │ BCA VA   │         │  ║
║  │ ├──────────┼──────────┼──────────┼──────────┤         │  ║
║  │ │ BNI_VA   │ BRI_VA   │ ECHANNEL │ INDOMARET│         │  ║
║  │ │ BNI VA   │ BRI VA   │ Mandiri  │ Indomaret│         │  ║
║  │ └──────────┴──────────┴──────────┴──────────┘         │  ║
║  └────────────────────────────────────────────────────────┘  ║
║                                                               ║
║                               [Batal]  [Simpan]              ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🎯 Checkout Page View

### Payment Method Selection

```
╔═══════════════════════════════════════════════════════════════╗
║  4. Pilih Metode Pembayaran                                   ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐     ║
║  │ 💰 E-Wallet                                    [▼]  │     ║
║  │ Transfer langsung ke e-wallet                      │     ║
║  ├─────────────────────────────────────────────────────┤     ║
║  │ ( ) 💚 GoPay                         +Rp 2,500     │     ║
║  │     Transfer langsung ke GoPay                     │     ║
║  ├─────────────────────────────────────────────────────┤     ║
║  │ ( ) 🛒 ShopeePay                    +Rp 2,500     │     ║
║  │     Transfer langsung ke ShopeePay                 │     ║
║  └─────────────────────────────────────────────────────┘     ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐     ║
║  │ 📱 QRIS                                        [▼]  │     ║
║  │ Scan QR Code untuk pembayaran instant              │     ║
║  ├─────────────────────────────────────────────────────┤     ║
║  │ ( ) 📱 QRIS                          +Rp 700       │     ║
║  │     Scan QR Code instant payment                   │     ║
║  └─────────────────────────────────────────────────────┘     ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐     ║
║  │ 🏦 Virtual Account                             [▼]  │     ║
║  │ Transfer melalui ATM/Mobile Banking                │     ║
║  ├─────────────────────────────────────────────────────┤     ║
║  │ ( ) 🏦 BCA Virtual Account          +Rp 4,000     │     ║
║  │     Transfer via BCA ATM/M-Banking                 │     ║
║  ├─────────────────────────────────────────────────────┤     ║
║  │ ( ) 🏦 BNI Virtual Account          +Rp 4,000     │     ║
║  │     Transfer via BNI ATM/M-Banking                 │     ║
║  └─────────────────────────────────────────────────────┘     ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 💡 Step-by-Step Guide

### Step 1: Access Admin Panel

```
URL: http://localhost:3000/admin/payment-methods

You'll see:
- Stats dashboard at top
- Empty table (if no payment methods yet)
- "Tambah Payment Method" button
```

### Step 2: Add First Payment Method (GoPay)

```
1. Click "Tambah Payment Method"
2. Fill form:
   ┌─────────────────────────────────┐
   │ Kode: GOPAY                     │
   │ Nama: GoPay                     │
   │ Kategori: E-Wallet              │
   │ Icon: 💚                        │
   │ Tipe Fee: Fixed                 │
   │ Fee: 2500                       │
   │ Display Order: 0                │
   │ Deskripsi: Transfer ke GoPay    │
   │ [✓] Aktifkan                    │
   │ [✓] Midtrans Integration        │
   └─────────────────────────────────┘
3. Click "Simpan"
4. See success notification
5. GoPay appears in table
```

### Step 3: Verify in Checkout

```
1. Go to any product page
2. Click "Beli Sekarang"
3. Fill checkout form
4. Scroll to payment method section
5. See "E-Wallet" category
6. See "💚 GoPay +Rp 2,500" option
```

### Step 4: Test Fee Calculation

```
Example Transaction:
┌────────────────────────────────────┐
│ Product: 600 Robux                 │
│ Price: Rp 100,000                  │
│ Selected Payment: GoPay            │
│ Payment Fee: +Rp 2,500             │
│ ─────────────────────────────────  │
│ Total: Rp 102,500                  │
└────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Admin Panel

```
Background:     #1F2937 (gray-800)
Cards:          #374151 (gray-700)
Borders:        #4B5563 (gray-600)
Text:           #FFFFFF (white)
Text Secondary: #9CA3AF (gray-400)

Buttons:
- Create:  #16A34A (green-600)
- Edit:    #3B82F6 (blue-500)
- Delete:  #EF4444 (red-500)

Status:
- Active:   #166534 bg, #BBF7D0 text (green)
- Inactive: #991B1B bg, #FECACA text (red)
```

### Checkout

```
Categories:
- E-Wallet:       💰 Wallet icon
- QRIS:           📱 QR Code icon
- Bank Transfer:  🏦 Building icon
- Retail:         🏪 Store icon

Payment Cards:
- Background: White with border
- Hover: Light blue background
- Selected: Blue border
```

---

## 📊 Icon Reference

### Payment Method Icons

```
E-Wallet:
💳 Generic card
💰 Money bag
💚 Green heart (GoPay)
🛒 Shopping cart (ShopeePay)
💵 Dollar bill (DANA)

QRIS:
📱 Mobile phone
📲 Phone with arrow
🔲 QR code square

Bank Transfer:
🏦 Bank building
💼 Briefcase
💳 Credit card
🏧 ATM sign

Retail:
🏪 Convenience store
🏬 Department store
🛒 Shopping cart
```

### Category Icons (Component)

```tsx
ewallet       → <Wallet />
bank_transfer → <Building2 />
qris          → <QrCode />
retail        → <Store />
credit_card   → <CreditCard />
```

---

## 🔄 Workflow Diagrams

### Admin Creates Payment Method

```
┌─────────────┐
│ Admin Panel │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Click "Tambah"      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Fill Form           │
│ - Code: GOPAY       │
│ - Name: GoPay       │
│ - Category: ewallet │
│ - Fee: 2500 (fixed) │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Click "Simpan"      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ API POST Request    │
│ /api/payment-methods│
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Validate & Save     │
│ to MongoDB          │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Success Response    │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Show Toast          │
│ Refresh Table       │
└─────────────────────┘
```

### User Selects Payment

```
┌─────────────┐
│ Checkout    │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ Load Payment Methods│
│ GET /api/payment-   │
│ methods?active=true │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Group by Category   │
│ - E-Wallet: 3 items │
│ - QRIS: 1 item      │
│ - Bank: 4 items     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Display Options     │
│ with Fees           │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ User Selects GoPay  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Calculate Fee       │
│ Base: 100,000       │
│ Fee:  + 2,500       │
│ Total: 102,500      │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Update UI Total     │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│ Submit Transaction  │
│ with GOPAY code     │
└─────────────────────┘
```

---

## 📱 Responsive Design

### Desktop (> 768px)

```
╔════════════════════════════════════════════════════╗
║  Stats: 3 columns side by side                    ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐          ║
║  │ Total    │ │ Active   │ │ Midtrans │          ║
║  └──────────┘ └──────────┘ └──────────┘          ║
║                                                    ║
║  Table: Full width with all columns               ║
║  │Method│Category│Fee│Status│Midtrans│Actions│   ║
╚════════════════════════════════════════════════════╝
```

### Mobile (< 768px)

```
╔══════════════════════╗
║  Stats: 1 column     ║
║  ┌──────────────┐    ║
║  │ Total        │    ║
║  └──────────────┘    ║
║  ┌──────────────┐    ║
║  │ Active       │    ║
║  └──────────────┘    ║
║  ┌──────────────┐    ║
║  │ Midtrans     │    ║
║  └──────────────┘    ║
║                      ║
║  Table: Card layout  ║
║  ┌──────────────┐    ║
║  │ GoPay        │    ║
║  │ E-Wallet     │    ║
║  │ Rp 2,500     │    ║
║  │ [Edit][Del]  │    ║
║  └──────────────┘    ║
╚══════════════════════╝
```

---

## ✅ Visual Checklist

When adding payment method, you should see:

**In Admin Panel:**

- [ ] Modal opens with form
- [ ] All fields visible and editable
- [ ] Category dropdown works
- [ ] Fee type toggle works
- [ ] Checkboxes toggle
- [ ] Midtrans reference visible
- [ ] Save button enabled when form valid
- [ ] Success toast after save
- [ ] New row in table
- [ ] Stats update

**In Checkout:**

- [ ] Payment method category appears
- [ ] Method shows with icon
- [ ] Fee displays correctly
- [ ] Selection works with radio button
- [ ] Total updates when selected
- [ ] Fee adds to base amount

---

**Need help? See PAYMENT_METHOD_QUICK_SETUP.md for detailed steps!**
