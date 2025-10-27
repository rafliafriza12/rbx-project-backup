# 🔍 Troubleshooting: Reseller Package List Tidak Muncul di Modal Edit

## 🚨 Masalah

List reseller packages tidak muncul di dropdown saat modal edit user dibuka.

## ✅ Solusi yang Sudah Diterapkan

### **1. Debugging Console Logs**

Saya sudah menambahkan console logs di beberapa tempat:

**a) Saat fetch data:**

```typescript
const fetchResellerPackages = async () => {
  try {
    const response = await fetch("/api/reseller-packages");
    if (response.ok) {
      const data = await response.json();
      console.log("Reseller Packages API Response:", data); // ✅ CEK INI
      // ...
    }
  }
}
```

**b) Saat pilih package:**

```typescript
onChange={(e) => {
  console.log("Selected Package ID:", e.target.value);
  console.log("All Reseller Packages:", resellerPackages); // ✅ CEK INI
}
```

### **2. Visual Indicator di Label**

Label sekarang menampilkan jumlah packages:

```
Reseller Package (3 packages available)
```

### **3. Warning Messages**

- **Jika tidak ada packages sama sekali:**

  ```
  ⚠️ No reseller packages available. Please create packages first.
  ```

- **Jika ada packages tapi tidak ada yang active:**
  ```
  ⚠️ No active reseller packages. Please activate packages in settings.
  ```

---

## 🔍 Langkah Troubleshooting

### **Step 1: Buka Browser Console**

1. Buka page `/admin/users`
2. Buka Developer Tools (F12)
3. Klik tab **Console**
4. Reload page
5. **Cari log:** `"Reseller Packages API Response:"`

### **Step 2: Cek Response API**

Anda harus melihat output seperti ini:

```javascript
Reseller Packages API Response: {
  packages: [
    {
      _id: "67abc123...",
      name: "Reseller Tier 1",
      tier: 1,
      discount: 5,
      duration: 30,
      features: [...],
      isActive: true
    },
    // ... more packages
  ]
}
```

**❌ JIKA RESPONSE KOSONG atau ERROR:**

- Artinya API `/api/reseller-packages` bermasalah
- Lanjut ke **Step 3**

**✅ JIKA RESPONSE ADA DATA:**

- Artinya API OK, masalah di frontend
- Lanjut ke **Step 4**

---

### **Step 3: Test API Reseller Packages**

#### **A. Cek API Route Exists**

```bash
# File harus ada:
/app/api/reseller-packages/route.ts
```

#### **B. Test API Langsung**

Buka terminal dan jalankan:

```bash
curl http://localhost:3000/api/reseller-packages
```

Atau buka browser:

```
http://localhost:3000/api/reseller-packages
```

**Expected Response:**

```json
{
  "packages": [
    {
      "_id": "67abc123...",
      "name": "Reseller Tier 1",
      "tier": 1,
      "discount": 5,
      "isActive": true
    }
  ]
}
```

#### **C. Jika API Error 404 (Not Found):**

Buat file `/app/api/reseller-packages/route.ts`:

```typescript
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import ResellerPackage from "@/models/ResellerPackage";

export async function GET() {
  try {
    await dbConnect();

    const packages = await ResellerPackage.find({}).sort({ tier: 1 }).lean();

    return NextResponse.json({ packages }, { status: 200 });
  } catch (error) {
    console.error("Get reseller packages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reseller packages" },
      { status: 500 }
    );
  }
}
```

#### **D. Jika API Error 500 (Server Error):**

Cek:

1. MongoDB connection
2. ResellerPackage model exists di `/models/ResellerPackage.ts`
3. Database memiliki collection `resellerpackages`

---

### **Step 4: Cek Database**

#### **A. Verifikasi Reseller Packages Exists di DB**

**Menggunakan MongoDB Compass:**

1. Connect ke database Anda
2. Cari collection `resellerpackages`
3. Cek ada data atau tidak

**Menggunakan MongoDB Shell:**

```bash
mongosh

use your_database_name

db.resellerpackages.find().pretty()
```

**Expected Output:**

```json
{
  "_id": ObjectId("67abc123..."),
  "name": "Reseller Tier 1",
  "tier": 1,
  "price": 100000,
  "discount": 5,
  "duration": 30,
  "features": ["5% discount", "24/7 support"],
  "isActive": true,
  "createdAt": ISODate("2025-10-27T..."),
  "updatedAt": ISODate("2025-10-27T...")
}
```

#### **B. Jika Database Kosong - Create Sample Data**

Jalankan di MongoDB shell:

```javascript
db.resellerpackages.insertMany([
  {
    name: "Reseller Tier 1",
    tier: 1,
    price: 100000,
    discount: 5,
    duration: 30,
    features: [
      "5% discount on all items",
      "24/7 support",
      "Priority processing",
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Reseller Tier 2",
    tier: 2,
    price: 200000,
    discount: 10,
    duration: 30,
    features: [
      "10% discount on all items",
      "24/7 priority support",
      "Fast processing",
      "Monthly report",
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: "Reseller Tier 3",
    tier: 3,
    price: 500000,
    discount: 20,
    duration: 30,
    features: [
      "20% discount on all items",
      "VIP support",
      "Instant processing",
      "Weekly report",
      "Custom features",
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);
```

---

### **Step 5: Cek Filter `isActive`**

Dropdown hanya menampilkan packages dengan `isActive: true`.

**Cek di console saat buka modal edit:**

```javascript
All Reseller Packages: [ ... ]  // Total packages
```

Lalu cek berapa yang `isActive: true`:

```javascript
resellerPackages.filter((pkg) => pkg.isActive);
```

**Solusi jika semua inactive:**
Update di database:

```javascript
db.resellerpackages.updateMany({}, { $set: { isActive: true } });
```

---

### **Step 6: Cek Modal Render**

#### **A. Pastikan Modal Terbuka di Tab Users**

- Dropdown reseller package **HANYA** muncul di `activeTab === "users"`
- Jika Anda buka modal di tab "Admins" atau "Stock", dropdown tidak akan muncul

#### **B. Verifikasi dengan Inspect Element**

1. Klik kanan di area dropdown
2. Pilih "Inspect"
3. Cari element `<select>` dengan label "Reseller Package"
4. Cek ada `<option>` selain "No Reseller" atau tidak

**Jika hanya ada 1 option:**

```html
<select>
  <option value="">No Reseller</option>
  <!-- SEHARUSNYA ADA OPTIONS LAIN DI SINI -->
</select>
```

→ Artinya filter `pkg.isActive` menghilangkan semua packages

**Jika ada banyak options:**

```html
<select>
  <option value="">No Reseller</option>
  <option value="67abc123...">Reseller Tier 1 - Tier 1 (5% discount)</option>
  <option value="67abc456...">Reseller Tier 2 - Tier 2 (10% discount)</option>
</select>
```

→ Artinya data sudah ada, coba select salah satu

---

## 🎯 Quick Checklist

Centang yang sudah Anda cek:

**API & Backend:**

- [ ] File `/app/api/reseller-packages/route.ts` exists
- [ ] API response sukses (200) saat hit endpoint
- [ ] Response memiliki property `packages` (array)

**Database:**

- [ ] Collection `resellerpackages` exists
- [ ] Collection memiliki minimal 1 document
- [ ] Minimal 1 document memiliki `isActive: true`

**Frontend:**

- [ ] Console log "Reseller Packages API Response" muncul
- [ ] Array `resellerPackages` memiliki data (cek di console)
- [ ] Label menampilkan "X packages available" dengan X > 0
- [ ] Modal dibuka di tab "Users" (bukan Admins/Stock)
- [ ] Inspect element menunjukkan ada `<option>` tags

**Browser:**

- [ ] Clear cache dan reload page
- [ ] Coba browser berbeda (jika masih error)

---

## 💡 Common Issues & Solutions

### **Issue 1: "0 packages available" di label**

**Cause:** API tidak return data atau fetch gagal  
**Solution:** Cek Step 3 (Test API)

### **Issue 2: Label tampil angka tapi dropdown kosong**

**Cause:** Semua packages `isActive: false`  
**Solution:** Update database, set `isActive: true`

### **Issue 3: Dropdown ada tapi tidak bisa select**

**Cause:** State management issue atau value tidak match  
**Solution:**

```typescript
// Cek di console saat select:
console.log("Selected Package ID:", selectedPackageId);
console.log(
  "Available Package IDs:",
  resellerPackages.map((p) => p._id)
);
```

### **Issue 4: Data ada tapi tidak persistent setelah save**

**Cause:** Backend API tidak handle reseller fields  
**Solution:** Cek API `/api/admin/users` dan `/api/admin/users/[id]` sudah accept `resellerPackageId`

---

## 🔧 Manual Test Steps

1. **Buka browser console** (F12)
2. **Navigate** ke `/admin/users`
3. **Cek console** untuk "Reseller Packages API Response"
4. **Klik Add User** atau **Edit user**
5. **Lihat dropdown** "Reseller Package"
6. **Cek label** menampilkan "X packages available"
7. **Klik dropdown** dan lihat options
8. **Select package** dan cek console logs
9. **Fill expiry date** (jika muncul)
10. **Click Save** dan verify data saved

---

## 📞 Next Steps

Jika setelah mengikuti semua step di atas masalah masih ada:

1. **Screenshot** console logs
2. **Screenshot** Network tab (response dari `/api/reseller-packages`)
3. **Screenshot** database (collection resellerpackages)
4. **Screenshot** modal dengan inspect element

Dengan informasi ini, kita bisa troubleshoot lebih detail.

---

**Last Updated:** 27 Oktober 2025  
**Status:** 🔍 Debugging Guide - Ready
