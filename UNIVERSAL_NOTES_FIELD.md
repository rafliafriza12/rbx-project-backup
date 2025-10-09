# Universal Notes Field - Dokumentasi (Updated)

## 📋 Overview

Sistem ini memiliki **dua field terpisah**:

1. **Backup Code** - Di halaman pemesanan (Joki & Robux Instant) - **Opsional**
2. **Catatan Tambahan** - Di halaman checkout (Semua layanan) - **Opsional**

## 🎯 Field Structure

### 1. **Backup Code Field** (Service Pages Only)

**Lokasi**: Halaman Joki & Robux Instant  
**Status**: Opsional  
**Purpose**: Untuk menyimpan backup code Roblox jika akun memiliki 2FA

#### **Joki Page** (`app/(public)/joki/[id]/page.tsx`)

```tsx
<label>
  Backup Code
  <span className="text-xs text-primary-200/70 font-normal ml-2">
    (Opsional)
  </span>
</label>
<textarea
  placeholder="Masukkan backup code jika akun memiliki 2-step verification"
  value={additionalInfo}
  onChange={(e) => setAdditionalInfo(e.target.value)}
  rows={3}
/>
<p className="text-xs sm:text-sm text-primary-200/70 mt-2">
  Cara lihat backup code: <Link href="...">Klik di sini →</Link>
</p>
```

#### **Robux Instant Page** (`app/(public)/robux-instant/page.tsx`)

```tsx
<label>
  Backup Code
  <span className="text-xs text-white/60 font-normal">
    (Opsional)
  </span>
</label>
<textarea
  placeholder="Masukkan backup code Roblox jika akun memiliki 2-step verification"
  value={additionalInfo}
  onChange={(e) => setAdditionalInfo(e.target.value)}
  rows={3}
/>
<p className="text-xs text-white/70">
  Cara lihat backup code: <Link href="...">Klik di sini →</Link>
</p>
```

---

### 2. **Catatan Tambahan Field** (Checkout Page - Universal)

**Lokasi**: Halaman Checkout (semua layanan)  
**Status**: Opsional  
**Purpose**: Untuk instruksi khusus, request, atau catatan tambahan dari user

#### **Checkout Page** (`app/checkout/page.tsx`)

```tsx
<div className="neon-card rounded-2xl p-5">
  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
    <Sparkles className="w-4 h-4 text-neon-pink" />
    Catatan Tambahan
    <span className="text-xs text-white/60 font-normal ml-2">(Opsional)</span>
  </h3>

  {/* Info box with tips based on service type */}
  <div className="bg-gradient-to-r from-primary-600/20 to-primary-700/20">
    <p className="font-medium mb-2 text-white">💡 Tips Catatan Tambahan:</p>
    <ul className="text-white/70 space-y-1 text-xs">
      {/* Dynamic tips based on service type */}
      {checkoutData.items.some((item) => item.serviceType === "joki") && (
        <>
          <li>• Target rank atau level yang diinginkan</li>
          <li>• Waktu pengerjaan yang diharapkan</li>
          <li>• Instruksi khusus untuk joki</li>
        </>
      )}
      {/* ... other service types ... */}
      <li>• Atau catatan lainnya yang perlu diketahui admin</li>
    </ul>
  </div>

  <textarea
    value={additionalNotes}
    onChange={(e) => setAdditionalNotes(e.target.value)}
    rows={4}
    placeholder="Dynamic placeholder based on service type..."
  />
</div>
```

---

## 🔄 Data Flow

### **Service Page → Checkout**

```typescript
// Joki & Robux Instant: Backup code disimpan di service details
const checkoutItems = [
  {
    serviceType: "robux",
    // ... other fields
    robuxInstantDetails: {
      // ...
      additionalInfo: additionalInfo, // BACKUP CODE dari service page
      notes: additionalInfo,
    },
  },
];

// OR for Joki
const checkoutItems = selectedItemsArray.map((itemName) => ({
  serviceType: "joki",
  // ... other fields
  jokiDetails: {
    // ...
    notes: additionalInfo, // BACKUP CODE dari service page
    additionalInfo: additionalInfo,
  },
}));
```

### **Checkout → Transaction API**

```typescript
const requestData = {
  items: itemsWithCredentials, // Items with backup code from service page
  // ... other fields
  additionalNotes: additionalNotes.trim() || undefined, // CATATAN TAMBAHAN dari checkout
  customerInfo: { ... },
  userId: ...
};
```

---

## 📊 Field Comparison

| Field                | Location      | Services            | Status      | Purpose                       | Data Key                                                                        |
| -------------------- | ------------- | ------------------- | ----------- | ----------------------------- | ------------------------------------------------------------------------------- |
| **Backup Code**      | Service Pages | Joki, Robux Instant | ✅ Optional | Store 2FA backup code         | `additionalInfo` → `item.jokiDetails.notes` or `item.robuxInstantDetails.notes` |
| **Catatan Tambahan** | Checkout Page | All Services        | ✅ Optional | General instructions/requests | `additionalNotes` → `requestData.additionalNotes`                               |

---

## 🎨 UI Features

### **Service Pages (Joki & Robux Instant)**

**Features**:

- Label: "Backup Code (Opsional)"
- Simple textarea (3 rows)
- Link tutorial cara lihat backup code
- No validation (optional)

**Visual**:

- Themed input dengan icon Shield
- Clean dan simple
- No info box (just link)

---

### **Checkout Page (All Services)**

**Features**:

- Label: "Catatan Tambahan (Opsional)"
- Enhanced textarea (4 rows)
- Dynamic tips based on service type
- No validation (optional)

**Visual**:

- Gradient info box dengan tips
- Dynamic placeholder per service
- Icon Sparkles di header

**Dynamic Tips per Service**:

- **Joki**: Target rank, waktu pengerjaan, instruksi khusus
- **Gamepass**: Request proses cepat, info tambahan
- **RBX5**: Info gamepass, instruksi proses
- **Robux Instant**: Info akun, request khusus
- **All**: "Atau catatan lainnya yang perlu diketahui admin"

---

## ✅ Validation Rules

### **No Required Validation**

```typescript
// Both fields are OPTIONAL - no validation needed
// Users can submit without filling either field
```

### **Data Structure**

```typescript
// Transaction Request Data
{
  items: [
    {
      // ... service data
      jokiDetails: {
        // ... joki data
        notes: "backup_code_dari_service_page", // From Joki page
        additionalInfo: "backup_code_dari_service_page"
      }
    }
  ],
  additionalNotes: "catatan_tambahan_dari_checkout", // From Checkout page
  // ... other transaction data
}
```

---

## 🎯 Use Cases

### **Scenario 1: Joki dengan Backup Code & Catatan**

1. User di Joki page: Isi backup code → disimpan di `jokiDetails.notes`
2. User di Checkout: Isi "Tolong dikerjakan malam hari" → disimpan di `additionalNotes`
3. Result: Admin dapat backup code DAN instruksi khusus

### **Scenario 2: Robux Instant dengan Backup Code saja**

1. User di Robux Instant page: Isi backup code → disimpan di `robuxInstantDetails.notes`
2. User di Checkout: Skip catatan tambahan
3. Result: Admin hanya dapat backup code

### **Scenario 3: Gamepass dengan Catatan saja**

1. User di Gamepass page: Tidak ada field backup code (gamepass doesn't need it)
2. User di Checkout: Isi "Mohon diproses secepatnya" → disimpan di `additionalNotes`
3. Result: Admin hanya dapat catatan tambahan

### **Scenario 4: Tidak isi keduanya**

1. User skip backup code di service page
2. User skip catatan di checkout
3. Result: Transaction tetap bisa diproses (both optional)

---

## 📝 Summary

### **Key Points:**

1. ✅ **2 Field Terpisah**: Backup Code (service page) vs Catatan Tambahan (checkout)
2. ✅ **Both Optional**: Tidak ada yang wajib diisi
3. ✅ **Different Purpose**: Backup code untuk 2FA, catatan untuk instruksi
4. ✅ **Separate Storage**: Backup code di item details, catatan di root transaction
5. ✅ **Universal Checkout**: Semua layanan punya field catatan di checkout

### **Benefits:**

- 🔐 Backup code terpisah untuk keamanan
- 💬 Catatan tambahan untuk komunikasi lebih baik
- 🎯 Flexible - user bisa isi salah satu atau keduanya
- 📊 Clean data structure

---

**Status**: ✅ Complete & Corrected  
**Date**: 6 Oktober 2025  
**Version**: 2.0

### 1. **Universal Notes Field** (Checkout Page)

- ✅ Muncul untuk **semua layanan** (Gamepass, Joki, Robux Instant, RBX5)
- ✅ Label dan placeholder **dinamis** berdasarkan service type
- ✅ **Required** untuk Robux Instant (kode backup wajib)
- ✅ **Optional** untuk layanan lainnya

### 2. **Service-Specific Behavior**

#### **Robux Instant** 🔵

- **Label**: "Kode Backup Roblox" ⚠️ (Wajib)
- **Required**: ✅ Yes
- **Placeholder**: "Masukkan kode backup Roblox Anda di sini (wajib)..."
- **Info Box**: Blue themed dengan link tutorial backup code
- **Validation**: Field wajib diisi, jika kosong muncul error

#### **Joki** 🟣

- **Label**: "Catatan Tambahan untuk Joki"
- **Required**: ❌ No (Optional)
- **Placeholder**: "Contoh: Tolong dikerjakan malam hari, target Mythic dalam 3 hari..."
- **Info Box**: Purple themed dengan tips catatan joki
- **Content**: Backup code + instruksi khusus + target waktu

#### **Gamepass** 🟢

- **Label**: "Catatan Tambahan"
- **Required**: ❌ No (Optional)
- **Placeholder**: "Contoh: Mohon diproses secepatnya, atau informasi tambahan lainnya..."
- **Info Box**: General info
- **Content**: Instruksi atau request khusus

#### **RBX5** 🔷

- **Label**: "Catatan Tambahan"
- **Required**: ❌ No (Optional)
- **Placeholder**: "Tambahkan catatan atau instruksi khusus untuk pesanan Anda..."
- **Info Box**: General info
- **Content**: Informasi tambahan untuk proses gamepass

---

## 🎨 UI Implementation (Checkout Page)

### Dynamic Title

```tsx
{
  checkoutData.items.some(
    (item) => item.serviceType === "robux" && item.robuxInstantDetails
  )
    ? "Kode Backup & Catatan Tambahan"
    : checkoutData.items.some((item) => item.serviceType === "joki")
    ? "Catatan Tambahan untuk Joki"
    : "Catatan Tambahan";
}
```

### Service-Specific Info Boxes

**Robux Instant Info Box:**

```tsx
<div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
  <div className="flex items-start">
    <AlertTriangle className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
    <div className="text-sm text-blue-300">
      <p className="font-medium mb-2">📱 Kode Backup Roblox</p>
      <p className="text-blue-400">
        Silakan masukkan <span className="font-semibold">kode backup</span>{" "}
        Roblox Anda...
        <Link href="..." target="_blank">
          Cara melihat kode backup →
        </Link>
      </p>
    </div>
  </div>
</div>
```

**Joki Info Box:**

```tsx
<div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-4">
  <div className="flex items-start">
    <AlertTriangle className="w-5 h-5 text-purple-400 mr-3 mt-0.5" />
    <div className="text-sm text-purple-300">
      <p className="font-medium mb-2">🎮 Informasi Joki</p>
      <p className="text-purple-400">
        Tambahkan <span className="font-semibold">catatan khusus</span> atau
        <span className="font-semibold"> instruksi tambahan</span>...
      </p>
    </div>
  </div>
</div>
```

### Dynamic Placeholder

```tsx
placeholder={
  checkoutData.items.some((item) =>
    item.serviceType === "robux" && item.robuxInstantDetails
  )
    ? "Masukkan kode backup Roblox Anda di sini (wajib)..."
    : checkoutData.items.some((item) => item.serviceType === "joki")
    ? "Contoh: Tolong dikerjakan malam hari, target Mythic dalam 3 hari..."
    : checkoutData.items.some((item) => item.serviceType === "gamepass")
    ? "Contoh: Mohon diproses secepatnya, atau informasi tambahan lainnya..."
    : "Tambahkan catatan atau instruksi khusus untuk pesanan Anda..."
}
```

### Required Field Logic

```tsx
required={checkoutData.items.some((item) =>
  item.serviceType === "robux" && item.robuxInstantDetails
)}
```

---

## 🔧 Service Page Updates

### **Robux Instant Page** (`app/(public)/robux-instant/page.tsx`)

#### Changes:

1. **Label Updated**: "Backup Code" → "Kode Backup Roblox ⚠️ (Wajib)"
2. **Required**: Added `required` attribute
3. **Placeholder**: Updated to indicate mandatory field
4. **Info Box**: Enhanced with warning and detailed instructions
5. **Validation**: Updated `isFormValid` to check `additionalInfo.trim() !== ""`

#### Enhanced Info Box:

```tsx
<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
  <div className="flex items-start gap-2">
    <Info className="w-2 h-2 text-blue-400" />
    <div>
      <p className="text-xs text-blue-300 font-medium mb-1">
        📱 Cara Mendapatkan Kode Backup:
      </p>
      <p className="text-xs text-blue-400">
        Klik link berikut untuk melihat tutorial lengkap:
        <Link href="..." target="_blank">
          Lihat Panduan →
        </Link>
      </p>
      <p className="text-xs text-red-400 mt-1 font-medium">
        ⚠️ Kode backup diperlukan untuk memverifikasi akun Roblox Anda
      </p>
    </div>
  </div>
</div>
```

---

### **Joki Page** (`app/(public)/joki/[id]/page.tsx`)

#### Changes:

1. **Label Updated**: "Backup Code" → "Catatan Tambahan & Backup Code"
2. **Placeholder**: Enhanced with examples
3. **Rows**: Increased from 3 to 4 for more space
4. **Info Box**: Added purple-themed box with tips

#### Enhanced Info Box:

```tsx
<div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-2">
  <div className="flex items-start gap-2">
    <Info className="w-3 h-3 text-purple-400" />
    <div className="flex-1">
      <p className="text-xs sm:text-sm text-purple-300 mb-2">
        <span className="font-semibold">💡 Tips Catatan:</span>
      </p>
      <ul className="text-xs text-purple-400 space-y-1 list-disc list-inside">
        <li>Masukkan backup code jika akun memiliki 2FA</li>
        <li>Tambahkan instruksi khusus atau preferensi</li>
        <li>Sebutkan target waktu atau rank yang diinginkan</li>
      </ul>
      <p className="text-xs text-primary-200/70 mt-2">
        Cara lihat backup code: <Link href="...">Klik di sini →</Link>
      </p>
    </div>
  </div>
</div>
```

---

## ✅ Validation Rules

### Checkout Page (`handleSubmit`)

```typescript
// Check if robux instant requires backup code
const requiresBackupCode = checkoutData.items.some((item) => {
  return item.serviceType === "robux" && item.robuxInstantDetails;
});

if (requiresBackupCode && !additionalNotes.trim()) {
  toast.error("Kode backup Roblox harus diisi untuk Robux Instant");
  return;
}
```

### Robux Instant Page

```typescript
const isFormValid =
  selectedProduct !== null &&
  username.trim() !== "" &&
  password.trim() !== "" &&
  additionalInfo.trim() !== ""; // Kode backup wajib
```

---

## 📊 Data Flow

### 1. **Service Page → Checkout**

```typescript
// All services send additionalInfo/notes in checkoutItems
const checkoutItems = [
  {
    // ... other fields
    robuxInstantDetails: {
      // ...
      additionalInfo: additionalInfo,
      notes: additionalInfo,
    },
  },
];
```

### 2. **Checkout Page → Transaction API**

```typescript
const itemsWithCredentials = checkoutData.items.map((item) => ({
  ...item,
  // Add additional notes for robux instant
  robuxInstantDetails: item.robuxInstantDetails
    ? {
        ...item.robuxInstantDetails,
        notes: additionalNotes.trim() || item.robuxInstantDetails.notes,
      }
    : undefined,
}));
```

---

## 🎯 User Experience

### Benefits:

1. ✅ **Consistency** - Semua layanan punya field catatan
2. ✅ **Flexibility** - Placeholder dan label dinamis sesuai service
3. ✅ **Clear Instructions** - Info box yang jelas untuk setiap service
4. ✅ **Validation** - Required field untuk service yang memerlukan (Robux Instant)
5. ✅ **Better Communication** - User bisa kasih instruksi lebih detail

### Visual Indicators:

- 🔴 **Red asterisk (\*)** - Required fields
- 🔵 **Blue box** - Robux Instant info
- 🟣 **Purple box** - Joki info
- ⚠️ **Warning icon** - Important notices
- 💡 **Lightbulb** - Tips and suggestions

---

## 🚀 Testing Checklist

- [ ] **Robux Instant**: Field wajib, error jika kosong
- [ ] **Joki**: Field optional, bisa submit tanpa isi
- [ ] **Gamepass**: Field optional, placeholder sesuai
- [ ] **RBX5**: Field optional, placeholder sesuai
- [ ] **Multi-item**: Info box tampil sesuai service type
- [ ] **Data saved**: Notes tersimpan di transaction
- [ ] **Link works**: Tutorial backup code bisa dibuka

---

## 📝 Summary

| Service           | Field Label                    | Required | Placeholder                  | Info Box Color |
| ----------------- | ------------------------------ | -------- | ---------------------------- | -------------- |
| **Robux Instant** | Kode Backup Roblox \*          | ✅ Yes   | Masukkan kode backup...      | 🔵 Blue        |
| **Joki**          | Catatan Tambahan & Backup Code | ❌ No    | Contoh: Target Mythic...     | 🟣 Purple      |
| **Gamepass**      | Catatan Tambahan               | ❌ No    | Mohon diproses secepatnya... | -              |
| **RBX5**          | Catatan Tambahan               | ❌ No    | Tambahkan catatan...         | -              |

---

**Status**: ✅ Complete  
**Date**: 6 Oktober 2025  
**Version**: 1.0
