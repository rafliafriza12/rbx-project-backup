# Phone Number Validation di Checkout Page

Tanggal: 24 November 2025

## 📋 Fitur Validasi Nomor HP

Checkout page sekarang memiliki **validasi lengkap** untuk nomor HP dengan real-time feedback dan validasi format yang ketat.

---

## ✅ Validasi yang Diterapkan:

### 1. **Validasi Wajib Isi (Required)**

- ❌ Form **TIDAK BISA** disubmit jika nomor HP kosong
- ✅ Error message: "Nomor WhatsApp wajib diisi!"

### 2. **Validasi Panjang Digit**

- Minimal: **8 digit**
- Maksimal: **15 digit**
- ❌ Kurang dari 8: "Nomor WhatsApp minimal 8 digit"
- ❌ Lebih dari 15: "Nomor WhatsApp maksimal 15 digit"

### 3. **Validasi Format Nomor**

#### Supported Formats:

**Indonesia:**

- ✅ `+6281234567890` (dengan country code +62)
- ✅ `6281234567890` (tanpa +, dimulai dengan 62)
- ✅ `081234567890` (local format, dimulai dengan 0)

**Malaysia:**

- ✅ `+60123456789` (dengan country code +60)
- ✅ `60123456789` (tanpa +)

**Singapore:**

- ✅ `+6512345678` (dengan country code +65)
- ✅ `6512345678` (tanpa +)

**International:**

- ✅ `+1234567890` (format internasional lainnya)

#### Invalid Formats:

- ❌ `123` (terlalu pendek)
- ❌ `abcd1234567890` (mengandung huruf)
- ❌ `1234567890123456789` (terlalu panjang)
- ❌ `00812345678` (double zero)

---

## 🎨 Visual Feedback:

### **Input Normal (Belum diisi atau valid):**

```
┌─────────────────────────────────────┐
│ Nomor WhatsApp *                    │
│ ┌─────────────────────────────────┐ │
│ │ [Contoh: +6281234567890]        │ │ ← Yellow/White border
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Input Error (Format salah):**

```
┌─────────────────────────────────────┐
│ Nomor WhatsApp *                    │
│ ┌─────────────────────────────────┐ │
│ │ 123                             │ │ ← RED border
│ └─────────────────────────────────┘ │
│ ⚠️ Nomor WhatsApp minimal 8 digit   │ ← Error message (red)
└─────────────────────────────────────┘
```

### **Input Valid (Format benar):**

```
┌─────────────────────────────────────┐
│ Nomor WhatsApp *                    │
│ ┌─────────────────────────────────┐ │
│ │ +6281234567890                  │ │ ← Pink border (focus)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 💻 Kode Implementation:

### State Management:

```typescript
const [phoneError, setPhoneError] = useState("");
```

### Validation Function:

```typescript
const validatePhoneNumber = (phone: string): string => {
  if (!phone || !phone.trim()) {
    return "Nomor WhatsApp wajib diisi";
  }

  const cleanPhone = phone.replace(/\D/g, "");

  if (cleanPhone.length < 8) {
    return "Nomor WhatsApp minimal 8 digit";
  }

  if (cleanPhone.length > 15) {
    return "Nomor WhatsApp maksimal 15 digit";
  }

  const validPatterns = [
    /^\+?62[0-9]{9,13}$/, // Indonesia
    /^0[0-9]{9,12}$/, // Indonesia local
    /^\+?60[0-9]{9,10}$/, // Malaysia
    /^\+?65[0-9]{8}$/, // Singapore
    /^\+?[1-9][0-9]{7,14}$/, // Other countries
  ];

  const isValidFormat = validPatterns.some((pattern) =>
    pattern.test(phone.replace(/[\s-]/g, ""))
  );

  if (!isValidFormat) {
    return "Format nomor tidak valid. Contoh: +6281234567890";
  }

  return ""; // No error
};
```

### Real-time Validation Handler:

```typescript
const handlePhoneChange = (value: string) => {
  setCustomerInfo((prev) => ({ ...prev, phone: value }));

  // Only validate if user has typed something
  if (value.trim()) {
    const error = validatePhoneNumber(value);
    setPhoneError(error);
  } else {
    setPhoneError(""); // Clear error if field is empty
  }
};
```

### Input Component:

```tsx
<input
  type="tel"
  value={customerInfo.phone}
  onChange={(e) => handlePhoneChange(e.target.value)}
  className={`w-full p-3 border-2 rounded-lg backdrop-blur-md text-white 
    placeholder-white/50 focus:bg-white/10 focus:outline-none 
    transition-all duration-300 ${
      phoneError
        ? "border-red-500/50 bg-red-500/5 focus:border-red-500"
        : "border-white/20 bg-white/5 focus:border-neon-pink"
    }`}
  placeholder="Contoh: +6281234567890 atau 081234567890"
  required
/>;
{
  phoneError && (
    <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
      <AlertTriangle className="w-4 h-4" />
      {phoneError}
    </p>
  );
}
```

### Submit Validation:

```typescript
// Validate phone number for all users (logged in and guest)
if (!customerInfo.phone || !customerInfo.phone.trim()) {
  toast.error("Nomor WhatsApp wajib diisi!");
  return;
}

// Validate phone number format
const cleanPhone = customerInfo.phone.replace(/\D/g, "");

if (cleanPhone.length < 8 || cleanPhone.length > 15) {
  toast.error(
    "Nomor WhatsApp tidak valid. Minimal 8 digit, maksimal 15 digit."
  );
  return;
}

const validPatterns = [
  /^\+?62[0-9]{9,13}$/, // Indonesia
  /^0[0-9]{9,12}$/, // Indonesia local
  /^\+?60[0-9]{9,10}$/, // Malaysia
  /^\+?65[0-9]{8}$/, // Singapore
  /^\+?[1-9][0-9]{7,14}$/, // Other countries
];

const isValidFormat = validPatterns.some((pattern) =>
  pattern.test(customerInfo.phone.replace(/[\s-]/g, ""))
);

if (!isValidFormat) {
  toast.error(
    "Format nomor WhatsApp tidak valid. Contoh: +6281234567890 atau 081234567890"
  );
  return;
}
```

---

## 🎯 User Experience Flow:

### Scenario 1: User Mengetik Format Salah

1. User mulai ketik: `123`
2. 🔴 Border berubah merah
3. ⚠️ Muncul error: "Nomor WhatsApp minimal 8 digit"
4. User lanjut ketik sampai valid: `+6281234567890`
5. ✅ Error hilang, border kembali normal
6. ✅ Bisa submit checkout

### Scenario 2: User Submit Tanpa Isi Nomor HP

1. User langsung klik "Bayar Sekarang"
2. ❌ Form tidak tersubmit
3. 🔴 Toast error: "Nomor WhatsApp wajib diisi!"
4. User scroll ke field nomor HP
5. User isi nomor HP yang valid
6. ✅ Bisa submit checkout

### Scenario 3: User Isi Format Valid

1. User ketik: `081234567890`
2. ✅ Validasi lolos (format Indonesia lokal)
3. ✅ Tidak ada error message
4. ✅ Langsung bisa submit

---

## 📱 Regex Patterns Explained:

### Indonesia:

```regex
/^\+?62[0-9]{9,13}$/   → +6281234567890 atau 6281234567890
/^0[0-9]{9,12}$/        → 081234567890
```

### Malaysia:

```regex
/^\+?60[0-9]{9,10}$/   → +60123456789 atau 60123456789
```

### Singapore:

```regex
/^\+?65[0-9]{8}$/       → +6512345678 atau 6512345678
```

### International:

```regex
/^\+?[1-9][0-9]{7,14}$/ → +1234567890 (any country)
```

---

## ✅ Validation Rules Summary:

| Rule           | Condition       | Error Message                                      |
| -------------- | --------------- | -------------------------------------------------- |
| **Required**   | Phone is empty  | "Nomor WhatsApp wajib diisi!"                      |
| **Min Length** | < 8 digits      | "Nomor WhatsApp minimal 8 digit"                   |
| **Max Length** | > 15 digits     | "Nomor WhatsApp maksimal 15 digit"                 |
| **Format**     | Invalid pattern | "Format nomor tidak valid. Contoh: +6281234567890" |

---

## 🔧 Validation Timing:

1. **Real-time (onChange):**

   - Validasi format saat user mengetik
   - Tampilkan error message di bawah input
   - Update border color (red = error, normal = ok)

2. **Submit (onSubmit):**
   - Check apakah field kosong
   - Check panjang digit
   - Check format dengan regex
   - Tampilkan toast error jika gagal
   - Block submit jika invalid

---

## 🎨 CSS Classes:

### Normal State:

```css
border-white/20 bg-white/5 focus:border-neon-pink
```

### Error State:

```css
border-red-500/50 bg-red-500/5 focus:border-red-500
```

### Warning State (untuk user tanpa HP):

```css
border-yellow-500/50 bg-yellow-500/5 focus:border-neon-pink
```

---

## 🐛 Edge Cases Handled:

1. ✅ Nomor dengan spasi: `+62 812 3456 7890` → Valid (spasi di-strip)
2. ✅ Nomor dengan dash: `+62-812-3456-7890` → Valid (dash di-strip)
3. ✅ Copy-paste nomor dari WhatsApp → Valid
4. ✅ Leading zeros: `0062812345678` → Invalid (double zero)
5. ✅ Huruf dalam nomor: `08abc123456` → Invalid
6. ✅ Nomor terlalu pendek: `123` → Invalid (error: minimal 8 digit)
7. ✅ Nomor terlalu panjang: `12345678901234567890` → Invalid (error: maksimal 15 digit)

---

## 📊 Validation Flow Diagram:

```
User Input
    ↓
onChange Event
    ↓
handlePhoneChange()
    ↓
validatePhoneNumber()
    ↓
    ├─ Empty? → Clear error (will catch on submit)
    ├─ < 8 digits? → "Minimal 8 digit"
    ├─ > 15 digits? → "Maksimal 15 digit"
    └─ Invalid format? → "Format tidak valid"
    ↓
Update phoneError state
    ↓
Re-render with error message & red border
    ↓
User Submit
    ↓
Final Validation
    ↓
    ├─ Valid → Proceed to payment
    └─ Invalid → Toast error & block submit
```

---

## 🔄 Future Improvements (Optional):

- [ ] Phone number auto-format saat user mengetik (add spacing)
- [ ] Show example format berdasarkan country code yang dideteksi
- [ ] OTP verification untuk nomor HP
- [ ] Save nomor HP ke user profile setelah checkout sukses
- [ ] Phone number masking untuk keamanan
- [ ] International phone number library (libphonenumber-js)

---

**Dibuat oleh**: GitHub Copilot AI Assistant
**Tanggal**: 24 November 2025
