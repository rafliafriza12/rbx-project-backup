# Button Disabled Validation - Checkout Page

Tanggal: 24 November 2025

## 📋 Fitur yang Diimplementasikan

Button "Bayar Sekarang" sekarang **di-disable otomatis** jika form belum valid atau masih ada error validasi, dengan **helper text** yang informatif untuk memberi tahu user apa yang perlu diperbaiki.

---

## ✅ Kondisi Button Disabled:

Button "Bayar Sekarang" akan **DISABLED** jika salah satu kondisi berikut terpenuhi:

### 1. **Terms & Conditions Belum Disetujui**

- ❌ Checkbox "Syarat dan Ketentuan" belum dicentang
- 💡 Helper text: "Harap setujui syarat dan ketentuan"

### 2. **Payment Method Belum Dipilih**

- ❌ User belum memilih metode pembayaran
- 💡 Helper text: "Pilih metode pembayaran terlebih dahulu"

### 3. **Nomor WhatsApp Kosong**

- ❌ Field nomor WhatsApp masih kosong
- 💡 Helper text: "Nomor WhatsApp wajib diisi"

### 4. **Format Nomor WhatsApp Salah**

- ❌ Ada error validasi pada nomor HP (`phoneError` !== "")
- 💡 Helper text: "Perbaiki format nomor WhatsApp"
- Error ditampilkan di bawah input field dengan icon ⚠️

### 5. **Guest Checkout - Nama Kosong**

- ❌ User belum login dan field nama lengkap kosong
- 💡 Helper text: "Nama lengkap wajib diisi"

### 6. **Guest Checkout - Email Kosong**

- ❌ User belum login dan field email kosong
- 💡 Helper text: "Email wajib diisi"

### 7. **Username Roblox Kosong** (untuk non-reseller)

- ❌ Single checkout & bukan reseller package & username kosong
- 💡 Helper text: "Username Roblox wajib diisi"

### 8. **Password Roblox Kosong** (untuk Joki & Robux Instant)

- ❌ Service memerlukan password tapi field password kosong
- 💡 Helper text: "Lengkapi semua field yang diperlukan"

---

## 🎨 Visual Indicators:

### **Button Enabled (Form Valid):**

```
┌────────────────────────────────────────────┐
│  ✓ Bayar Sekarang - Rp 50.000             │  ← Pink gradient, hoverable
│     (with glow effect)                      │
└────────────────────────────────────────────┘
```

### **Button Disabled (Form Invalid):**

```
┌────────────────────────────────────────────┐
│  ✓ Bayar Sekarang - Rp 50.000             │  ← Gray, cursor not-allowed
│     (no hover effect)                       │
└────────────────────────────────────────────┘
        ⚠️ Pilih metode pembayaran terlebih dahulu
```

---

## 💻 Kode Implementation:

### Function `isFormValid()`:

```typescript
const isFormValid = () => {
  // Check basic requirements
  if (!acceptTerms || !selectedPaymentMethod) return false;

  // Check phone number
  if (!customerInfo.phone || !customerInfo.phone.trim()) return false;

  // Check if there's phone error
  if (phoneError) return false;

  // Validate phone format
  const phoneValidationError = validatePhoneNumber(customerInfo.phone);
  if (phoneValidationError) return false;

  // Check guest checkout fields
  if (isGuestCheckout) {
    if (!customerInfo.name.trim() || !customerInfo.email.trim()) return false;
  }

  // Check Roblox credentials (jika bukan multi-checkout dan bukan reseller)
  if (!isMultiCheckoutFromCart && checkoutData) {
    const isResellerPurchase = checkoutData.items.some(
      (item) => item.serviceType === "reseller"
    );

    if (!isResellerPurchase && !robloxUsername.trim()) return false;

    // Check password requirement
    const requiresPassword = checkoutData.items.some((item) => {
      return (
        item.serviceType === "joki" ||
        (item.serviceType === "robux" && item.robuxInstantDetails)
      );
    });

    if (requiresPassword && !robloxPassword.trim()) return false;
  }

  return true;
};
```

### Button Component:

```tsx
<button
  type="submit"
  disabled={submitting || !isFormValid()}
  className={`group relative px-8 py-4 rounded-2xl font-bold text-lg 
    transition-all duration-500 transform inline-flex items-center gap-3 
    w-full md:w-auto justify-center shadow-xl ${
      submitting || !isFormValid()
        ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600"
        : "btn-neon-primary hover:scale-105 glow-neon-pink active:scale-95"
    }`}
>
  {/* Button content */}
</button>
```

### Helper Text Component:

```tsx
{
  !isFormValid() && !submitting && (
    <div className="mt-4 text-center">
      <p className="text-sm text-yellow-400 flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4" />
        <span>
          {!acceptTerms
            ? "Harap setujui syarat dan ketentuan"
            : !selectedPaymentMethod
            ? "Pilih metode pembayaran terlebih dahulu"
            : phoneError
            ? "Perbaiki format nomor WhatsApp"
            : !customerInfo.phone || !customerInfo.phone.trim()
            ? "Nomor WhatsApp wajib diisi"
            : isGuestCheckout && !customerInfo.name.trim()
            ? "Nama lengkap wajib diisi"
            : isGuestCheckout && !customerInfo.email.trim()
            ? "Email wajib diisi"
            : !isMultiCheckoutFromCart &&
              checkoutData &&
              !checkoutData.items.some(
                (item) => item.serviceType === "reseller"
              ) &&
              !robloxUsername.trim()
            ? "Username Roblox wajib diisi"
            : "Lengkapi semua field yang diperlukan"}
        </span>
      </p>
    </div>
  );
}
```

---

## 🎯 User Experience Flow:

### Scenario 1: User Baru Buka Checkout

1. ❌ Button **DISABLED** (gray)
2. ⚠️ Helper text: "Pilih metode pembayaran terlebih dahulu"
3. User tidak bisa klik button

### Scenario 2: User Pilih Payment, Tapi Belum Centang Terms

1. ❌ Button masih **DISABLED**
2. ⚠️ Helper text: "Harap setujui syarat dan ketentuan"
3. User centang terms → button masih disabled

### Scenario 3: User Centang Terms, Tapi Nomor HP Kosong

1. ❌ Button masih **DISABLED**
2. ⚠️ Helper text: "Nomor WhatsApp wajib diisi"
3. User isi nomor HP

### Scenario 4: User Isi Nomor HP, Tapi Format Salah

1. ❌ Button masih **DISABLED**
2. 🔴 Input field border merah
3. ⚠️ Error di bawah input: "Nomor WhatsApp minimal 8 digit"
4. ⚠️ Helper text button: "Perbaiki format nomor WhatsApp"
5. User perbaiki format → error hilang

### Scenario 5: Semua Valid

1. ✅ Button **ENABLED** (pink gradient with glow)
2. ✅ No helper text
3. ✅ User bisa klik button
4. ✅ Form tersubmit

---

## 📊 Validation Priority (Top to Bottom):

```
Priority 1: Terms & Conditions
    ↓
Priority 2: Payment Method
    ↓
Priority 3: Phone Error (format salah)
    ↓
Priority 4: Phone Empty
    ↓
Priority 5: Guest - Name Empty
    ↓
Priority 6: Guest - Email Empty
    ↓
Priority 7: Roblox Username Empty
    ↓
Priority 8: Roblox Password Empty (jika required)
```

Helper text menampilkan error **tertinggi** yang ditemukan.

---

## 🎨 CSS Classes:

### Button Enabled:

```css
btn-neon-primary
hover:scale-105
glow-neon-pink
active:scale-95
```

### Button Disabled:

```css
bg-gray-700/50
text-gray-400
cursor-not-allowed
border border-gray-600
```

### Helper Text:

```css
text-sm
text-yellow-400
flex items-center justify-center gap-2
```

---

## ✅ Validation Rules Summary:

| Field               | Condition                  | Helper Text                               |
| ------------------- | -------------------------- | ----------------------------------------- |
| **Terms**           | Not checked                | "Harap setujui syarat dan ketentuan"      |
| **Payment**         | Not selected               | "Pilih metode pembayaran terlebih dahulu" |
| **Phone Error**     | Has validation error       | "Perbaiki format nomor WhatsApp"          |
| **Phone Empty**     | Empty or whitespace        | "Nomor WhatsApp wajib diisi"              |
| **Name (Guest)**    | Empty                      | "Nama lengkap wajib diisi"                |
| **Email (Guest)**   | Empty                      | "Email wajib diisi"                       |
| **Roblox Username** | Empty (non-reseller)       | "Username Roblox wajib diisi"             |
| **Roblox Password** | Empty (joki/robux instant) | "Lengkapi semua field yang diperlukan"    |

---

## 🔄 Real-time Validation:

### onChange Events:

- **Phone number**: Validasi format real-time, update `phoneError`
- **Checkbox terms**: Update `acceptTerms`
- **Payment method**: Update `selectedPaymentMethod`
- **Any input**: Trigger `isFormValid()` re-evaluation

### Auto Re-render:

- Setiap kali state berubah, React otomatis re-render
- `isFormValid()` dipanggil ulang
- Button disabled state di-update
- Helper text di-update

---

## 🐛 Edge Cases Handled:

1. ✅ User ketik nomor HP valid lalu hapus → Button disabled
2. ✅ User pilih payment lalu uncheck terms → Button disabled
3. ✅ Multi-checkout dari cart → Skip Roblox username validation
4. ✅ Reseller package → Skip Roblox username & password validation
5. ✅ Gamepass/RBX5 → Skip password validation
6. ✅ User submit saat validasi => Button sudah disabled, tidak bisa submit
7. ✅ Submitting state → Button tetap disabled dengan text "Memproses..."

---

## 💡 Benefits:

1. **Better UX**: User tahu persis apa yang harus dilakukan
2. **Prevent Invalid Submit**: Form tidak bisa disubmit jika belum valid
3. **Visual Feedback**: Button disabled dengan warna gray yang jelas
4. **Informative Messages**: Helper text yang spesifik dan helpful
5. **Real-time Validation**: Instant feedback saat user mengisi form
6. **Accessibility**: Clear disabled state untuk screen readers

---

## 🔮 Future Improvements (Optional):

- [ ] Scroll to field yang error saat button diklik
- [ ] Highlight field yang error dengan border merah
- [ ] Progress indicator (1/5 fields completed)
- [ ] Checklist UI untuk menampilkan semua requirements
- [ ] Tooltip pada disabled button yang menjelaskan kenapa disabled
- [ ] Animation pada helper text saat muncul/hilang

---

**Dibuat oleh**: GitHub Copilot AI Assistant
**Tanggal**: 24 November 2025
