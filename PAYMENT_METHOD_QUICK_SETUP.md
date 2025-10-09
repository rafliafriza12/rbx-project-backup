# Payment Method System - Quick Setup Guide

## 🚀 Quick Start

### Step 1: Database Setup

The PaymentMethod model is already created. MongoDB will automatically create the collection on first insert.

### Step 2: Access Admin Panel

```
Navigate to: http://localhost:3000/admin/payment-methods
```

### Step 3: Add Your First Payment Method

#### Example: GoPay

```
Click "Tambah Payment Method"

Fill the form:
- Kode Payment Method: GOPAY
- Nama Payment Method: GoPay
- Kategori: E-Wallet
- Icon: 💚
- Tipe Fee: Fixed (Nominal Rupiah)
- Fee Amount: 2500
- Deskripsi: Transfer langsung ke GoPay
- ✓ Aktifkan payment method ini
- ✓ Integrasi dengan Midtrans
- Urutan Tampilan: 0

Click "Simpan"
```

### Step 4: Verify in Checkout

```
1. Go to any product page
2. Click "Beli Sekarang"
3. Go to checkout page
4. Scroll to payment method section
5. You should see GoPay in E-Wallet category
```

## 📦 Sample Payment Methods to Add

### E-Wallet Methods

#### 1. GoPay

```
Code: GOPAY
Name: GoPay
Category: ewallet
Icon: 💚
Fee: 2500 (fixed)
Description: Transfer langsung ke GoPay
```

#### 2. ShopeePay

```
Code: SHOPEEPAY
Name: ShopeePay
Category: ewallet
Icon: 🛒
Fee: 2500 (fixed)
Description: Transfer langsung ke ShopeePay
```

#### 3. DANA

```
Code: DANA
Name: DANA
Category: ewallet
Icon: 💳
Fee: 2500 (fixed)
Description: Transfer langsung ke DANA
```

### QRIS

#### 4. QRIS

```
Code: QRIS
Name: QRIS
Category: qris
Icon: 📱
Fee: 0.7 (percentage)
Description: Scan QR Code untuk pembayaran instant
```

### Bank Transfer (Virtual Account)

#### 5. BCA Virtual Account

```
Code: BCA_VA
Name: BCA Virtual Account
Category: bank_transfer
Icon: 🏦
Fee: 4000 (fixed)
Description: Transfer melalui ATM/Mobile Banking BCA
```

#### 6. BNI Virtual Account

```
Code: BNI_VA
Name: BNI Virtual Account
Category: bank_transfer
Icon: 🏦
Fee: 4000 (fixed)
Description: Transfer melalui ATM/Mobile Banking BNI
```

#### 7. BRI Virtual Account

```
Code: BRI_VA
Name: BRI Virtual Account
Category: bank_transfer
Icon: 🏦
Fee: 4000 (fixed)
Description: Transfer melalui ATM/Mobile Banking BRI
```

#### 8. Mandiri Bill Payment

```
Code: ECHANNEL
Name: Mandiri Bill Payment
Category: bank_transfer
Icon: 🏦
Fee: 4000 (fixed)
Description: Transfer melalui ATM/Mobile Banking Mandiri
```

### Retail/Minimarket

#### 9. Indomaret

```
Code: INDOMARET
Name: Indomaret
Category: retail
Icon: 🏪
Fee: 2500 (fixed)
Description: Bayar di kasir Indomaret terdekat
```

#### 10. Alfamart

```
Code: ALFAMART
Name: Alfamart
Category: retail
Icon: 🏪
Fee: 2500 (fixed)
Description: Bayar di kasir Alfamart terdekat
```

## 🎯 Testing Workflow

### 1. Add Payment Methods

```bash
# Open admin panel
http://localhost:3000/admin/payment-methods

# Add at least one payment method from each category
# E-Wallet: GoPay
# QRIS: QRIS
# Bank Transfer: BCA VA
# Retail: Indomaret
```

### 2. Test Checkout

```bash
# Open a product page (e.g., Robux)
http://localhost:3000

# Add to cart and checkout
# Verify payment methods appear
# Select a payment method
# Check fee calculation
```

### 3. Test Fee Calculation

#### Fixed Fee Test

```
Product: Rp 100,000
Payment Method: GoPay (Rp 2,500 fixed)
Expected Total: Rp 102,500
```

#### Percentage Fee Test

```
Product: Rp 100,000
Payment Method: QRIS (0.7%)
Expected Fee: Rp 700
Expected Total: Rp 100,700
```

### 4. Test Toggle Active/Inactive

```bash
# In admin panel
1. Click status badge on any payment method
2. Confirm toggle
3. Go to checkout page
4. Verify payment method disappeared
5. Toggle back to active
6. Verify payment method reappeared
```

## 🔧 Configuration Tips

### Display Order

Use increments of 10 for easier reordering:

```
GoPay: 0
ShopeePay: 10
DANA: 20
QRIS: 30
BCA VA: 40
...
```

### Fee Strategy

#### For Popular Methods (GoPay, QRIS)

- Lower fees to encourage usage
- Or use percentage for fairness

#### For Bank Transfer

- Slightly higher fixed fee (covers processing cost)

#### For Retail

- Moderate fixed fee

### Min/Max Amounts

#### E-Wallet

```
Min: 10,000 (common minimum)
Max: 2,000,000 (wallet limits)
```

#### QRIS

```
Min: 1,000
Max: 10,000,000
```

#### Bank Transfer

```
Min: 10,000
Max: 50,000,000
```

## 📊 Monitoring

### Stats to Watch

```
Admin Dashboard shows:
- Total Methods: Should match your setup
- Active Methods: Methods visible to users
- Midtrans Enabled: Methods integrated with Midtrans
```

### Health Checks

```
Daily:
- Check if payment methods load in checkout
- Verify fee calculations
- Monitor transaction success rate

Weekly:
- Review payment method usage analytics
- Adjust fees if needed
- Add/remove methods based on demand
```

## ❗ Common Issues & Solutions

### Issue: Payment methods not showing in checkout

**Solution:**

1. Check `isActive` is true
2. Clear browser cache
3. Check browser console for errors

### Issue: Wrong fee calculation

**Solution:**

1. Verify `feeType` (fixed vs percentage)
2. Check `fee` value in database
3. Test with calculator to confirm

### Issue: Can't create payment method

**Solution:**

1. Check if code already exists
2. Verify all required fields filled
3. Check browser console for validation errors

### Issue: Midtrans transaction fails

**Solution:**

1. Verify `code` matches Midtrans codes (see reference)
2. Check Midtrans credentials in `.env`
3. Test Midtrans account in sandbox mode

## 🎓 Best Practices

### 1. Start Small

- Add 3-5 most popular payment methods first
- Test thoroughly
- Gradually add more

### 2. Monitor Usage

- Track which payment methods users prefer
- Remove unused methods
- Optimize fees based on data

### 3. User Experience

- Use clear, recognizable names
- Add helpful descriptions
- Keep fees transparent

### 4. Maintenance

- Regular fee reviews
- Update based on Midtrans changes
- Keep Midtrans integration active

### 5. Testing

- Always test in staging first
- Test with small amounts
- Verify with actual Midtrans transactions

## 🚦 Go-Live Checklist

Before going to production:

- [ ] Add all required payment methods
- [ ] Test each payment method in checkout
- [ ] Verify fee calculations
- [ ] Test toggle active/inactive
- [ ] Test edit functionality
- [ ] Verify Midtrans integration
- [ ] Test actual transactions (sandbox)
- [ ] Check mobile responsiveness
- [ ] Review admin permissions
- [ ] Backup database
- [ ] Monitor for first few transactions

## 📞 Need Help?

1. Read `PAYMENT_METHOD_SYSTEM.md` for detailed documentation
2. Check Midtrans documentation: https://docs.midtrans.com
3. Review code comments in:
   - `models/PaymentMethod.ts`
   - `app/api/payment-methods/route.ts`
   - `app/admin/payment-methods/page.tsx`
   - `app/checkout/page.tsx`

---

**Ready to start? Go to Step 1 above! 🚀**
