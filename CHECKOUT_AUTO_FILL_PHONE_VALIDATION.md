# Auto-Fill Customer Info di Checkout dengan Validasi Phone Number

Tanggal: 24 November 2025

## 📋 Fitur yang Diimplementasikan

Checkout page sekarang memiliki **auto-fill** untuk informasi customer dari data user yang sudah login, dengan **validasi khusus** untuk nomor HP.

---

## ✨ Cara Kerja:

### 1. **User Sudah Login:**

#### Jika User Memiliki Nomor HP:

- ✅ **Nama Lengkap** → Auto-filled dari `firstName + lastName` (Read-only, ditampilkan dalam box hijau)
- ✅ **Email** → Auto-filled dari `user.email` (Read-only, ditampilkan dalam box hijau)
- ✅ **Nomor WhatsApp** → Auto-filled dan diformat otomatis (Read-only, ditampilkan dalam box hijau)
  - Format otomatis: `+62`, `+60`, `+65` dll
  - Contoh: `081234567890` → `+6281234567890`

#### Jika User TIDAK Memiliki Nomor HP:

- ✅ **Nama Lengkap** → Auto-filled (Read-only)
- ✅ **Email** → Auto-filled (Read-only)
- ⚠️ **Nomor WhatsApp** → **Field tetap EDITABLE** dengan:
  - Border kuning untuk menandakan perlu diisi
  - Background kuning transparan
  - Label menampilkan "(Harap isi nomor HP)"
  - Placeholder: "Contoh: +6281234567890 atau 081234567890"
  - **Required field** - harus diisi sebelum checkout

### 2. **Guest Checkout (User Belum Login):**

- Semua field tetap editable
- User harus mengisi manual:
  - Nama Lengkap
  - Email
  - Nomor WhatsApp

---

## 🎨 Visual Indicators:

### User Logged In - Dengan Nomor HP:

```
┌─────────────────────────────────────────┐
│ 👤 Informasi Pelanggan   [Auto-filled] │
├─────────────────────────────────────────┤
│ Nama Lengkap                            │
│ ┌─────────────────────────────────────┐ │
│ │ John Doe                            │ │ ← Green border, read-only
│ └─────────────────────────────────────┘ │
│                                         │
│ Email                                   │
│ ┌─────────────────────────────────────┐ │
│ │ john@example.com                    │ │ ← Green border, read-only
│ └─────────────────────────────────────┘ │
│                                         │
│ Nomor WhatsApp                          │
│ ┌─────────────────────────────────────┐ │
│ │ +6281234567890                      │ │ ← Green border, read-only
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### User Logged In - TANPA Nomor HP:

```
┌─────────────────────────────────────────┐
│ 👤 Informasi Pelanggan   [Auto-filled] │
├─────────────────────────────────────────┤
│ Nama Lengkap                            │
│ ┌─────────────────────────────────────┐ │
│ │ John Doe                            │ │ ← Green border, read-only
│ └─────────────────────────────────────┘ │
│                                         │
│ Email                                   │
│ ┌─────────────────────────────────────┐ │
│ │ john@example.com                    │ │ ← Green border, read-only
│ └─────────────────────────────────────┘ │
│                                         │
│ Nomor WhatsApp * (Harap isi nomor HP)  │
│ ┌─────────────────────────────────────┐ │
│ │ [Input field - editable]            │ │ ← Yellow border, EDITABLE
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 💻 Kode Implementation:

### State Management:

```typescript
const [customerInfo, setCustomerInfo] = useState({
  name: "",
  email: "",
  phone: "",
});
```

### Auto-Fill Logic:

```typescript
// Pre-fill customer info if user is logged in
if (user && !isGuestCheckout) {
  const formattedPhone = formatPhoneNumber(user.phone || "", user.countryCode);

  const newCustomerInfo = {
    name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "",
    email: user.email || "",
    phone: formattedPhone,
  };

  setCustomerInfo(newCustomerInfo);

  // Check if user doesn't have phone number
  if (!user.phone || user.phone.trim() === "") {
    console.log("⚠️ User doesn't have phone number - field will be editable");
  }
}
```

### Conditional Rendering:

```tsx
{
  /* Customer Information for Logged In Users */
}
{
  !isGuestCheckout && user && (
    <div className="neon-card rounded-2xl p-5">
      {/* Name - Always read-only */}
      <div>...</div>

      {/* Email - Always read-only */}
      <div>...</div>

      {/* Phone - Conditional: read-only if exists, editable if empty */}
      <div>
        <label>
          Nomor WhatsApp <span className="text-neon-pink">*</span>
          {!customerInfo.phone && (
            <span className="text-yellow-400">(Harap isi nomor HP)</span>
          )}
        </label>

        {customerInfo.phone ? (
          // Read-only display
          <div className="border-green-500/30 bg-green-500/5">
            {customerInfo.phone}
          </div>
        ) : (
          // Editable input
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) =>
              setCustomerInfo((prev) => ({
                ...prev,
                phone: e.target.value,
              }))
            }
            className="border-yellow-500/50 bg-yellow-500/5"
            placeholder="Contoh: +6281234567890 atau 081234567890"
            required
          />
        )}
      </div>
    </div>
  );
}
```

---

## 🔧 Phone Number Formatting:

### Auto-Detection Country Code:

```typescript
const formatPhoneNumber = (phone: string, countryCode?: string) => {
  if (!phone) return "";

  // If phone already starts with +, return as is
  if (phone.startsWith("+")) return phone;

  let cleanPhone = phone.replace(/\D/g, "");
  let detectedCountryCode = countryCode || "+62";

  // Indonesia: 62 or 0
  if (cleanPhone.startsWith("62")) {
    detectedCountryCode = "+62";
    cleanPhone = cleanPhone.substring(2);
  } else if (cleanPhone.startsWith("0")) {
    detectedCountryCode = "+62";
    cleanPhone = cleanPhone.substring(1);
  }
  // Malaysia: 60
  else if (cleanPhone.startsWith("60")) {
    detectedCountryCode = "+60";
    cleanPhone = cleanPhone.substring(2);
  }
  // Singapore: 65
  else if (cleanPhone.startsWith("65")) {
    detectedCountryCode = "+65";
    cleanPhone = cleanPhone.substring(2);
  }

  return `${detectedCountryCode}${cleanPhone}`;
};
```

### Supported Formats:

- ✅ `081234567890` → `+6281234567890` (Indonesia)
- ✅ `62812345678` → `+6281234567890` (Indonesia)
- ✅ `+6281234567890` → `+6281234567890` (Already formatted)
- ✅ `601234567890` → `+601234567890` (Malaysia)
- ✅ `6512345678` → `+6512345678` (Singapore)

---

## ✅ Validation Rules:

### Form Submit Validation:

```typescript
// Check phone number for logged-in users
if (!isGuestCheckout && !customerInfo.phone.trim()) {
  toast.error("Nomor WhatsApp wajib diisi!");
  return;
}
```

### Required Fields:

1. **Nama Lengkap** (auto-filled untuk logged-in user)
2. **Email** (auto-filled untuk logged-in user)
3. **Nomor WhatsApp** (auto-filled jika ada, HARUS DIISI jika kosong)
4. **Payment Method**
5. **Terms & Conditions** checkbox

---

## 🎯 User Experience Flow:

### Scenario 1: User dengan HP Lengkap

1. User login
2. Buka checkout page
3. ✅ Semua data auto-filled (termasuk HP)
4. ✅ Langsung bisa pilih payment method
5. ✅ Checkout tanpa input manual

### Scenario 2: User tanpa HP (Google OAuth)

1. User login via Google
2. Buka checkout page
3. ⚠️ Nama & Email auto-filled
4. ⚠️ **Field HP muncul editable** dengan warning kuning
5. 👉 User **HARUS** isi nomor HP
6. ✅ Setelah isi HP, bisa checkout

### Scenario 3: Guest Checkout

1. User belum login
2. Buka checkout page
3. 📝 Semua field editable
4. 👉 User isi manual semua data
5. ✅ Checkout tanpa akun

---

## 📱 Mobile Responsive:

- Input phone number menggunakan `type="tel"` untuk mobile keyboard
- Placeholder yang jelas: "Contoh: +6281234567890 atau 081234567890"
- Visual indicator kuning untuk field yang perlu diisi

---

## 🐛 Known Behaviors:

1. **Auto-fill hanya terjadi sekali** saat component mount
2. **Phone number validation** dilakukan saat submit, bukan real-time
3. **Format phone** otomatis mendeteksi country code dari pattern
4. **Guest user** tidak mendapat auto-fill (expected behavior)

---

## 🔄 Future Improvements (Optional):

- [ ] Real-time validation untuk format nomor HP
- [ ] Simpan nomor HP ke database setelah checkout berhasil
- [ ] Country code selector dropdown
- [ ] Phone verification via OTP
- [ ] Edit button untuk user yang sudah punya nomor HP

---

**Dibuat oleh**: GitHub Copilot AI Assistant
**Tanggal**: 24 November 2025
