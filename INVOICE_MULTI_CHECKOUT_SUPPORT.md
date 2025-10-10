# Invoice Template - Multi-Checkout Support

## Problem

Invoice email untuk multi-checkout hanya menampilkan 1 item saja, padahal user membeli beberapa items sekaligus dari cart.

## Root Cause

1. Multi-checkout API hanya mengirim `createdTransactions[0]` (transaction pertama) ke EmailService
2. Template invoice di-design untuk single transaction saja
3. Tidak ada handling untuk multiple items dengan credentials berbeda per item

## Solution

Upgrade email service dan template untuk support multi-checkout dengan menampilkan semua items yang dibeli.

---

## Changes Made

### 1. Email Service - Support Array of Transactions

**File**: `/lib/email.ts`

#### Method: `sendInvoiceEmail()`

**Before**:

```typescript
static async sendInvoiceEmail(transactionData: any): Promise<boolean> {
  const invoiceHtml = this.generateInvoiceTemplate(
    transactionData,  // Single transaction object
    settings
  );
  // ...
}
```

**After**:

```typescript
static async sendInvoiceEmail(transactionData: any): Promise<boolean> {
  // Check if this is a single transaction or array (multi-checkout)
  const isMultiTransaction = Array.isArray(transactionData);
  const transactions = isMultiTransaction ? transactionData : [transactionData];

  // Use first transaction for basic info (same customer, invoice, etc)
  const firstTransaction = transactions[0];

  const invoiceHtml = this.generateInvoiceTemplate(
    transactions,  // Always pass array
    settings,
    isMultiTransaction  // Flag for template
  );
  // ...
}
```

**Key Changes**:

- ✅ Accept both single transaction object or array of transactions
- ✅ Normalize to array format for consistency
- ✅ Pass `isMultiTransaction` flag to template
- ✅ Use first transaction for common info (invoice ID, customer email, etc)

---

### 2. Template Generator - Multi-Item Support

**File**: `/lib/email.ts`

#### Method: `generateInvoiceTemplate()`

**Signature Change**:

```typescript
// Before
private static generateInvoiceTemplate(
  transaction: any,    // Single transaction
  settings: any
): string

// After
private static generateInvoiceTemplate(
  transactions: any[],      // Array of transactions
  settings: any,
  isMultiTransaction: boolean = false  // Flag for multi-checkout
): string
```

#### Template Changes

**1. Header Section**:

```html
<!-- Before -->
<p>Invoice Pembelian Robux</p>

<!-- After -->
<p>
  Invoice Pembelian ${isMultiTransaction ? 'Multi-Item' : 'Robux'}
  ${isMultiTransaction ? `<span class="multi-badge"
    >${transactions.length} Items</span
  >` : ''}
</p>
```

**2. Roblox Account Info** - Different for Multi vs Single:

**Single Checkout**:

```html
<div class="roblox-info">
  <h3>🎮 Informasi Akun Roblox</h3>
  <p><strong>Username:</strong> user123</p>
  <p><strong>Password:</strong> ••••••••••</p>
</div>
```

**Multi Checkout** (NEW):

```html
<div class="roblox-info">
  <h3>🎮 Informasi Akun Roblox (Per Item)</h3>
  <p>
    <em>Setiap item menggunakan akun berbeda sesuai yang Anda tentukan:</em>
  </p>

  <!-- Item 1 -->
  <div class="roblox-info-item">
    <p><strong>Item 1: Robux 1000</strong></p>
    <p><strong>Username:</strong> user123</p>
    <p><strong>Password:</strong> ••••••••••</p>
  </div>

  <!-- Item 2 -->
  <div class="roblox-info-item">
    <p><strong>Item 2: Gamepass Premium</strong></p>
    <p><strong>Username:</strong> user456</p>
    <p><strong>Password:</strong> ••••••••••</p>
  </div>

  <!-- Item 3 -->
  <div class="roblox-info-item">
    <p><strong>Item 3: Joki Level 50</strong></p>
    <p><strong>Username:</strong> user789</p>
    <p><strong>Password:</strong> ••••••••••</p>
  </div>
</div>
```

**3. Order Details Table** - Display All Items:

**Before** (Single Item):

```html
<tbody>
  <tr>
    <td>Robux 1000</td>
    <td>Robux</td>
    <td>1</td>
    <td>Rp10.000</td>
    <td>Rp10.000</td>
  </tr>
  <tr class="total-row">
    <td colspan="4">TOTAL</td>
    <td>Rp10.000</td>
  </tr>
</tbody>
```

**After** (Multi Items):

```html
<tbody>
  <!-- Item 1 -->
  <tr>
    <td>Robux 1000</td>
    <td>Robux</td>
    <td>1</td>
    <td>Rp10.000</td>
    <td>Rp10.000</td>
  </tr>

  <!-- Item 2 -->
  <tr>
    <td>Gamepass Premium</td>
    <td>Gamepass</td>
    <td>1</td>
    <td>Rp25.000</td>
    <td>Rp25.000</td>
  </tr>

  <!-- Item 3 -->
  <tr>
    <td>Joki Level 50</td>
    <td>Jasa Joki</td>
    <td>1</td>
    <td>Rp50.000</td>
    <td>Rp50.000</td>
  </tr>

  <!-- Grand Total -->
  <tr class="total-row">
    <td colspan="4">TOTAL PEMBAYARAN</td>
    <td>Rp85.000</td>
  </tr>
</tbody>
```

**4. New CSS Classes**:

```css
.multi-badge {
  background: #f59e0b;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85em;
  font-weight: 600;
  display: inline-block;
  margin-left: 10px;
}

.roblox-info-item {
  background: #f0fdfa;
  border: 1px solid #99f6e4;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}
```

**5. Important Notes** - Added Multi-Checkout Note:

```html
<ul>
  <li>Simpan invoice ini sebagai bukti transaksi</li>
  <li>Jangan bagikan informasi akun Roblox kepada orang lain</li>
  <li>Proses pesanan akan dimulai setelah pembayaran dikonfirmasi</li>

  <!-- NEW for multi-checkout -->
  ${isMultiTransaction ? '
  <li>
    Setiap item akan diproses ke akun Roblox yang berbeda sesuai data Anda
  </li>
  ' : ''}
</ul>
```

---

### 3. Multi Transaction API Update

**File**: `/app/api/transactions/multi/route.ts`

**Before**:

```typescript
// Send email for the first transaction as a summary
const emailSent = await EmailService.sendInvoiceEmail(
  createdTransactions[0] // ❌ Only first transaction
);
```

**After**:

```typescript
// Send email with all transactions (multi-checkout invoice)
const emailSent = await EmailService.sendInvoiceEmail(
  createdTransactions // ✅ Array of all transactions
);

console.log("Number of transactions in invoice:", createdTransactions.length);
```

**Key Changes**:

- ✅ Pass entire `createdTransactions` array instead of just first element
- ✅ Email service will detect it's an array and use multi-checkout template
- ✅ All items and their credentials shown in invoice

---

## Visual Comparison

### Single Checkout Invoice

```
┌─────────────────────────────────────────────────┐
│  ROBUXID - Invoice Pembelian Robux              │
├─────────────────────────────────────────────────┤
│  Invoice: #INV-001                              │
│  Date: 10 Oktober 2025                          │
│  Status: Menunggu Pembayaran                    │
├─────────────────────────────────────────────────┤
│  Customer Info                                  │
│  - Name: John Doe                               │
│  - Email: john@example.com                      │
├─────────────────────────────────────────────────┤
│  Roblox Account                                 │
│  - Username: john_roblox                        │
│  - Password: ••••••••••                         │
├─────────────────────────────────────────────────┤
│  Order Details                                  │
│  ┌──────────────┬────────┬──────┬──────────┐   │
│  │ Item         │ Type   │ Qty  │ Total    │   │
│  ├──────────────┼────────┼──────┼──────────┤   │
│  │ Robux 1000   │ Robux  │ 1    │ Rp10.000 │   │
│  ├──────────────┴────────┴──────┴──────────┤   │
│  │ TOTAL                        │ Rp10.000 │   │
│  └──────────────────────────────┴──────────┘   │
└─────────────────────────────────────────────────┘
```

### Multi Checkout Invoice (NEW)

```
┌─────────────────────────────────────────────────┐
│  ROBUXID - Invoice Pembelian Multi-Item  [3]   │
├─────────────────────────────────────────────────┤
│  Invoice: #INV-002                              │
│  Date: 10 Oktober 2025                          │
│  Status: Menunggu Pembayaran                    │
├─────────────────────────────────────────────────┤
│  Customer Info                                  │
│  - Name: John Doe                               │
│  - Email: john@example.com                      │
├─────────────────────────────────────────────────┤
│  Roblox Account Info (Per Item)                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Item 1: Robux 1000                       │  │
│  │ Username: john_roblox1                   │  │
│  │ Password: ••••••••••                     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ Item 2: Gamepass Premium                 │  │
│  │ Username: john_roblox2                   │  │
│  │ Password: ••••••••••                     │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ Item 3: Joki Level 50                    │  │
│  │ Username: john_roblox3                   │  │
│  │ Password: ••••••••••                     │  │
│  └──────────────────────────────────────────┘  │
├─────────────────────────────────────────────────┤
│  Order Details (3 Items)                        │
│  ┌──────────────┬──────────┬─────┬──────────┐  │
│  │ Item         │ Type     │ Qty │ Total    │  │
│  ├──────────────┼──────────┼─────┼──────────┤  │
│  │ Robux 1000   │ Robux    │ 1   │ Rp10.000 │  │
│  │ Gamepass     │ Gamepass │ 1   │ Rp25.000 │  │
│  │ Joki Lv 50   │ Joki     │ 1   │ Rp50.000 │  │
│  ├──────────────┴──────────┴─────┴──────────┤  │
│  │ TOTAL PEMBAYARAN             │ Rp85.000 │  │
│  └──────────────────────────────┴──────────┘  │
│                                                 │
│  ⚠️ Important:                                  │
│  - Setiap item akan diproses ke akun Roblox    │
│    yang berbeda sesuai data Anda                │
└─────────────────────────────────────────────────┘
```

---

## Data Flow

### Single Checkout

```
API: /api/transactions
  ↓
Create 1 transaction
  ↓
EmailService.sendInvoiceEmail(transaction)
  ↓
Detects: Single object → isMultiTransaction = false
  ↓
Template: Show 1 item, 1 account
```

### Multi Checkout

```
API: /api/transactions/multi
  ↓
Create N transactions (e.g., 3)
  ↓
EmailService.sendInvoiceEmail([txn1, txn2, txn3])
  ↓
Detects: Array → isMultiTransaction = true
  ↓
Template: Show N items, N accounts
```

---

## Testing Scenarios

### Scenario 1: Single Item Checkout ✅

**Test**: Buy 1 Robux item directly  
**Expected Invoice**:

- Shows 1 item in table
- Shows 1 Roblox account (global)
- No multi-badge
- Normal header

### Scenario 2: Multi Checkout (2 Items) ✅

**Test**: Checkout 2 items from cart  
**Expected Invoice**:

- Shows 2 items in table
- Shows 2 Roblox accounts (per item, in boxes)
- Multi-badge: "2 Items"
- Header: "Invoice Pembelian Multi-Item"
- Important note about multiple accounts

### Scenario 3: Multi Checkout (5 Items) ✅

**Test**: Checkout 5 items from cart  
**Expected Invoice**:

- Shows 5 items in table
- Shows 5 Roblox accounts (per item, in boxes)
- Multi-badge: "5 Items"
- All items' credentials clearly separated
- Grand total sums all 5 items

### Scenario 4: Mixed Services Multi Checkout ✅

**Test**: Checkout 3 different service types (Robux + Gamepass + Joki)  
**Expected Invoice**:

- Shows 3 items with different service types
- Each item has correct type label
- Each item has its own credentials
- Grand total correct

---

## Benefits

### 1. Complete Information

- ✅ User dapat melihat semua items yang dibeli
- ✅ Tidak ada kebingungan "kok cuma 1 item?"
- ✅ Clear separation antara credentials per item

### 2. Better UX

- ✅ Visual badge menunjukkan jumlah items
- ✅ Boxed credentials per item (easy to read)
- ✅ Grand total menampilkan total semua items

### 3. Transparency

- ✅ User tahu setiap item akan ke akun berbeda
- ✅ Important note menjelaskan multi-account processing
- ✅ Professional invoice layout

### 4. Backward Compatible

- ✅ Single checkout tetap menggunakan template lama
- ✅ Tidak ada breaking changes
- ✅ Automatic detection (array vs object)

---

## Code Quality

### Type Safety

```typescript
// Support both single and array
transactionData: any; // Can be single object or array

// Normalize to array
const transactions = Array.isArray(transactionData)
  ? transactionData
  : [transactionData];
```

### Calculation Accuracy

```typescript
// Calculate grand total from all transactions
const grandTotal = transactions.reduce(
  (sum, txn) => sum + (txn.totalAmount || 0),
  0
);
```

### Template Generation

```typescript
// Generate items rows HTML dynamically
const itemsRows = transactions
  .map(
    (txn) => `
  <tr>
    <td>${txn.serviceName}</td>
    <td>${getServiceTypeLabel(txn.serviceType)}</td>
    <td>${txn.quantity.toLocaleString("id-ID")}</td>
    <td>${formatCurrency(txn.unitPrice)}</td>
    <td>${formatCurrency(txn.unitPrice * txn.quantity)}</td>
  </tr>
`
  )
  .join("");
```

---

## Console Logs

### Single Checkout

```
Sending invoice email to: user@example.com
Invoice email sent successfully
```

### Multi Checkout (NEW)

```
Sending invoice email to: user@example.com
Number of transactions in invoice: 3
Multi-checkout invoice email sent successfully
```

---

## Files Modified

1. ✅ `/lib/email.ts`

   - Updated `sendInvoiceEmail()` to accept array
   - Updated `generateInvoiceTemplate()` signature
   - Rewrote template to support multi-checkout
   - Added CSS for multi-checkout elements

2. ✅ `/app/api/transactions/multi/route.ts`
   - Changed to send all transactions array
   - Added logging for number of transactions
   - Updated success message

---

## Summary

**Problem**: Invoice hanya tampilkan 1 item untuk multi-checkout  
**Solution**: Support array of transactions in email template

**Impact**:

- ✅ Single checkout: Unchanged (works as before)
- ✅ Multi checkout: Shows all items + all credentials
- ✅ Visual improvement with badges and boxes
- ✅ Better user experience and clarity

**Testing Required**:

1. Test single item checkout → Verify normal invoice
2. Test 2-item multi checkout → Verify multi-item invoice
3. Test 5-item multi checkout → Verify all items shown
4. Test mixed services → Verify correct labels
5. Test email delivery → Verify HTML renders correctly
