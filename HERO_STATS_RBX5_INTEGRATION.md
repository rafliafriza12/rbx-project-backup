# 📊 Hero Stats RBX5 Integration

## ✅ Update yang Dilakukan

### 1. **Menghubungkan Section Stats dengan Data RBX5**

- Section "Total Orders" sekarang menampilkan data dari **transaksi robux_5_hari**
- Data diambil dari API `/api/rbx5-stats` yang menghitung transaksi dengan `serviceCategory: "robux_5_hari"`

### 2. **Format Angka dengan Singkatan "K"**

- Ditambahkan fungsi `formatNumber()` untuk format angka otomatis
- Jika angka ≥ 10,000 → ditampilkan dengan suffix "k"
- Contoh:
  - `12,345` → `12.3k`
  - `50,000` → `50.0k`
  - `5,432` → `5,432` (tanpa k karena < 10k)

---

## 📝 Kode yang Diubah

### **File**: `app/page.tsx`

#### **1. Helper Function - Format Number**

```tsx
// Helper function to format numbers with "k" suffix
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toLocaleString();
};
```

**Penjelasan**:

- Fungsi ini mengecek jika angka ≥ 10,000
- Jika ya: bagi dengan 1000, ambil 1 desimal, tambah suffix "k"
- Jika tidak: format dengan `.toLocaleString()` untuk separator ribuan

---

#### **2. Update Stats Card - "Total Orders"**

**SEBELUM**:

```tsx
<div className="text-3xl font-black text-white mb-2">
  50K+
</div>
<div className="text-white/70 text-sm font-medium">
  Customers
</div>
```

**SESUDAH**:

```tsx
<div className="text-3xl font-black text-white mb-2">
  {loadingStats ? "..." : formatNumber(rbx5Stats.totalOrder)}
</div>
<div className="text-white/70 text-sm font-medium">
  Total Orders
</div>
```

**Perubahan**:

- ✅ Hardcoded `50K+` → Dynamic `rbx5Stats.totalOrder`
- ✅ Label "Customers" → "Total Orders" (lebih sesuai)
- ✅ Loading state: tampilkan `"..."` saat fetch data
- ✅ Format otomatis dengan `formatNumber()`

---

## 🔍 Cara Kerja Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User buka homepage                                       │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. useEffect() memanggil fetchRbx5Stats()                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GET /api/rbx5-stats                                      │
│    - Query Transaction collection                           │
│    - Filter: serviceCategory === "robux_5_hari"             │
│    - Count total documents                                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Return response:                                         │
│    {                                                        │
│      totalStok: number,                                     │
│      totalOrder: number,  ← Count transaksi RBX5            │
│      totalTerjual: number,                                  │
│      hargaPer100Robux: number                               │
│    }                                                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. setRbx5Stats(data)                                       │
│    - Update state dengan data dari API                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Stats Card re-render                                     │
│    - formatNumber(rbx5Stats.totalOrder)                     │
│    - Jika ≥ 10k → tampilkan dengan suffix "k"               │
│    - Contoh: 50,000 → "50.0k"                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 API Endpoint - `/api/rbx5-stats`

### **Query untuk Total Order**:

```typescript
const totalOrder = await Transaction.countDocuments({
  $or: [
    { serviceCategory: "robux_5_hari" },
    { serviceType: "robux", serviceCategory: "robux_5_hari" },
  ],
});
```

**Penjelasan**:

- Menghitung semua transaksi dengan `serviceCategory === "robux_5_hari"`
- `$or` operator untuk handle dua format data:
  1. Direct field: `serviceCategory: "robux_5_hari"`
  2. Nested dengan type: `serviceType: "robux" AND serviceCategory: "robux_5_hari"`

---

## 🎨 Visual Preview

### **Loading State**:

```
┌─────────────────────────────────────────┐
│           [Users Icon]                  │
│              ...                        │
│         Total Orders                    │
└─────────────────────────────────────────┘
```

### **Loaded State (< 10k)**:

```
┌─────────────────────────────────────────┐
│           [Users Icon]                  │
│             5,432                       │
│         Total Orders                    │
└─────────────────────────────────────────┘
```

### **Loaded State (≥ 10k)**:

```
┌─────────────────────────────────────────┐
│           [Users Icon]                  │
│            50.0k                        │
│         Total Orders                    │
└─────────────────────────────────────────┘
```

---

## 🧪 Test Cases

### **Format Number Function**:

| Input    | Output   | Keterangan              |
| -------- | -------- | ----------------------- |
| `0`      | `0`      | Zero                    |
| `100`    | `100`    | Ratusan                 |
| `1234`   | `1,234`  | Ribuan dengan separator |
| `9999`   | `9,999`  | < 10k, pakai separator  |
| `10000`  | `10.0k`  | Tepat 10k → suffix k    |
| `12345`  | `12.3k`  | 1 desimal               |
| `50000`  | `50.0k`  | 50 ribu                 |
| `123456` | `123.5k` | Ratusan ribu            |

### **Test Skenario**:

#### **Scenario 1: Transaksi Sedikit**

- Total Order: `1,250`
- Expected Display: `1,250`
- Label: "Total Orders"

#### **Scenario 2: Transaksi Banyak**

- Total Order: `50,000`
- Expected Display: `50.0k`
- Label: "Total Orders"

#### **Scenario 3: Loading**

- State: `loadingStats === true`
- Expected Display: `...`
- Label: "Total Orders"

---

## ✨ Keunggulan Implementasi

### **1. Dynamic & Real-time**

- ✅ Data langsung dari database transaksi
- ✅ Auto-update setiap kali homepage dimuat
- ✅ Tidak perlu manual update angka

### **2. Smart Formatting**

- ✅ Angka kecil: tetap detail dengan separator
- ✅ Angka besar: otomatis pakai "k" untuk efisiensi
- ✅ Konsisten dengan standar internasional (10.0k, 50.0k)

### **3. User Experience**

- ✅ Loading state yang jelas
- ✅ Label yang informatif
- ✅ Visual yang konsisten dengan card lain

### **4. Maintenance**

- ✅ Fungsi reusable (`formatNumber`)
- ✅ Mudah di-extend untuk "M" (million) jika perlu
- ✅ Type-safe dengan TypeScript

---

## 🔧 Future Improvements

### **1. Extend Format Function untuk Million**

```tsx
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 10000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toLocaleString();
};
```

### **2. Add Percentage Change**

```tsx
<div className="text-sm text-green-400">+12.5% dari bulan lalu</div>
```

### **3. Real-time Counter Animation**

```tsx
import CountUp from "react-countup";

<CountUp end={rbx5Stats.totalOrder} duration={2} formattingFn={formatNumber} />;
```

---

## 📌 Summary

| Aspect            | Detail                            |
| ----------------- | --------------------------------- |
| **Data Source**   | API `/api/rbx5-stats`             |
| **Query Filter**  | `serviceCategory: "robux_5_hari"` |
| **Format Logic**  | `≥ 10,000 → [X.X]k`               |
| **Loading State** | `"..."`                           |
| **Label**         | "Total Orders"                    |
| **Auto Format**   | ✅ Yes                            |
| **Type Safe**     | ✅ TypeScript                     |

---

## ✅ Checklist

- [x] Tambah helper function `formatNumber()`
- [x] Update stats card dengan data dinamis
- [x] Ganti hardcoded "50K+" dengan `rbx5Stats.totalOrder`
- [x] Update label "Customers" → "Total Orders"
- [x] Test format angka < 10k
- [x] Test format angka ≥ 10k
- [x] Verify loading state
- [x] No TypeScript errors

---

**Status**: ✅ **COMPLETE**
**File Modified**: `app/page.tsx`
**Lines Changed**: ~20 lines
**Breaking Changes**: None
