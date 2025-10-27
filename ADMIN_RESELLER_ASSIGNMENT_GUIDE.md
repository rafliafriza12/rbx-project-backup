# 📋 Admin Manual Reseller Assignment - Quick Guide

## 🎯 Cara Assign Reseller Manual untuk User

### **Updated Behavior:**

Admin sekarang assign reseller dengan memilih **Reseller Package** dari database, bukan manual input tier.

---

## 🔧 Cara Kerja Baru

### **1. Form Reseller Assignment:**

**Dropdown: Reseller Package**

- Admin memilih dari list package yang ada di database
- Dropdown menampilkan: `{name} - Tier {tier} ({discount}% discount)`
- Contoh: `Reseller Tier 1 - Tier 1 (5% discount)`

**Behavior:**

- Jika pilih **"No Reseller"** → `resellerPackageId = null`, `resellerTier = 0`, `resellerExpiry = null`
- Jika pilih **package** → `resellerPackageId = package._id`, `resellerTier = package.tier` (otomatis)

**Input: Reseller Expiry Date**

- Hanya muncul jika sudah pilih package
- Admin set expiry date manual
- **Required** jika package dipilih

---

## 📊 Flow di Admin Users Page

### **Create New User dengan Reseller:**

1. Klik **"Add User"** atau **"Add Admin"**
2. Isi **First Name**, **Last Name**, **Email**, **Password**
3. Di dropdown **"Reseller Package"**, pilih package yang diinginkan
   - Misal: `Reseller Tier 2 - Tier 2 (10% discount)`
4. Otomatis field **"Reseller Expiry Date"** muncul
5. Set tanggal expiry (misal: 30 hari dari sekarang)
6. Klik **Save**

**Result:**

```json
{
  "resellerPackageId": "67...abc", // ID dari package yang dipilih
  "resellerTier": 2, // Otomatis dari package.tier
  "resellerExpiry": "2025-11-27" // Tanggal yang admin set
}
```

---

### **Edit Existing User - Tambah Reseller:**

1. Klik **Edit** di user yang mau diberi reseller
2. Di dropdown **"Reseller Package"**, pilih package
3. Set **"Reseller Expiry Date"**
4. Klik **Save**

---

### **Edit Existing User - Hapus Reseller:**

1. Klik **Edit** di user yang mau dihapus resellernya
2. Di dropdown **"Reseller Package"**, pilih **"No Reseller"**
3. Field expiry date otomatis hilang
4. Klik **Save**

**Result:**

```json
{
  "resellerPackageId": null,
  "resellerTier": 0,
  "resellerExpiry": null
}
```

---

### **Edit Existing User - Ganti Package/Extend Expiry:**

1. Klik **Edit** di user
2. **Ganti package:** Pilih package lain di dropdown
3. **Extend expiry:** Ubah tanggal di "Reseller Expiry Date"
4. Klik **Save**

---

## 🎨 Display di Table

### **User dengan Reseller:**

```
👤 John Doe
📧 john@example.com
🏅 Tier 2 - Exp: 27/11/2025
```

### **User dengan Reseller Expired:**

```
👤 Jane Smith
📧 jane@example.com
🏅 Tier 1 (Expired)
```

### **User tanpa Reseller:**

```
👤 Bob Johnson
📧 bob@example.com
No Reseller
```

---

## 📝 Example Scenario

### **Scenario 1: Berikan Reseller Tier 1 untuk New User**

1. Admin buka **Users tab** → klik **Add User**
2. Isi form:
   - First Name: `Ahmad`
   - Last Name: `Rizki`
   - Email: `ahmad@example.com`
   - Password: `password123`
   - Phone: `08123456789`
3. Di **Reseller Package**, pilih: `Reseller Tier 1 - Tier 1 (5% discount)`
4. Di **Reseller Expiry Date**, set: `2025-12-31`
5. Klik **Save**

**Database Result:**

```json
{
  "_id": "67...new",
  "firstName": "Ahmad",
  "lastName": "Rizki",
  "email": "ahmad@example.com",
  "resellerPackageId": "67...pkg1", // ID dari "Reseller Tier 1"
  "resellerTier": 1, // Otomatis dari package
  "resellerExpiry": "2025-12-31",
  "accessRole": "user"
}
```

**Saat user login:**

- Auth route akan fetch `ResellerPackage` dengan ID `67...pkg1`
- Set `user.diskon = 5` (dari package.discount)
- User dapat **5% discount** di checkout

---

### **Scenario 2: Upgrade User dari Tier 1 ke Tier 3**

1. Admin klik **Edit** di user Ahmad
2. Di **Reseller Package**, ganti dari `Tier 1` ke `Reseller Tier 3 - Tier 3 (20% discount)`
3. **Reseller Expiry Date** tetap atau bisa extend
4. Klik **Save**

**Database Update:**

```json
{
  "resellerPackageId": "67...pkg3", // Ganti ke ID package Tier 3
  "resellerTier": 3, // Otomatis update ke 3
  "resellerExpiry": "2025-12-31" // Bisa tetap atau diubah
}
```

**Saat user login berikutnya:**

- Fetch `ResellerPackage` dengan ID baru
- Set `user.diskon = 20` (dari package Tier 3)
- User dapat **20% discount**

---

### **Scenario 3: Hapus Reseller dari User**

1. Admin klik **Edit** di user Ahmad
2. Di **Reseller Package**, pilih **"No Reseller"**
3. Klik **Save**

**Database Update:**

```json
{
  "resellerPackageId": null,
  "resellerTier": 0,
  "resellerExpiry": null
}
```

**Saat user login:**

- Tidak ada reseller package
- `user.diskon = 0`
- User **tidak dapat discount**

---

## ⚙️ Backend API Support

### **POST /api/admin/users (Create User)**

```json
{
  "firstName": "Ahmad",
  "lastName": "Rizki",
  "email": "ahmad@example.com",
  "password": "password123",
  "resellerPackageId": "67...pkg1", // ID dari package
  "resellerTier": 1, // Dari package.tier
  "resellerExpiry": "2025-12-31"
}
```

### **PUT /api/admin/users/[id] (Update User)**

```json
{
  "resellerPackageId": "67...pkg3", // Ganti package
  "resellerTier": 3, // Update tier
  "resellerExpiry": "2026-01-31" // Extend expiry
}
```

### **PUT /api/admin/users/[id] (Remove Reseller)**

```json
{
  "resellerPackageId": null,
  "resellerTier": 0,
  "resellerExpiry": null
}
```

---

## 🔍 Validasi di Auth

**File: `/app/api/auth/me/route.ts`**

```typescript
// Check if user has active reseller
if (
  user.resellerPackageId &&
  user.resellerExpiry &&
  new Date(user.resellerExpiry) > new Date()
) {
  // Fetch package from DB
  const resellerPackage = await ResellerPackage.findById(
    user.resellerPackageId
  );

  if (resellerPackage && resellerPackage.isActive) {
    user.diskon = resellerPackage.discount; // Set discount
  }
} else {
  user.diskon = 0; // Expired or no reseller
}
```

**Keuntungan:**

1. ✅ Discount selalu sync dengan package di database
2. ✅ Admin update discount di package → otomatis apply ke semua user dengan package tersebut
3. ✅ Tier konsisten dengan package
4. ✅ Expiry check otomatis setiap login

---

## 🎯 Key Points

### **Yang Berubah:**

- ❌ **Dulu:** Admin input tier manual (1-3), lalu pilih package
- ✅ **Sekarang:** Admin pilih package, tier otomatis mengikuti package

### **Kenapa Lebih Baik:**

1. **Konsistensi:** Tier selalu match dengan package
2. **No Human Error:** Admin tidak bisa salah input tier
3. **Easy Management:** Admin tinggal pilih package, data lengkap otomatis terisi
4. **Scalable:** Jika ada package baru, langsung muncul di dropdown

### **Flow Sederhana:**

```
Admin pilih package → Tier otomatis set → Set expiry date → Save
```

---

## 📌 Notes

- **Dropdown filter:** Hanya menampilkan package yang `isActive: true`
- **Package display:** Format `{name} - Tier {tier} ({discount}% discount)`
- **Expiry required:** Jika pilih package, expiry date **wajib** diisi
- **Tier read-only:** Tier tidak bisa diedit manual, ikuti package
- **Package reference:** Simpan `resellerPackageId` untuk maintain relationship

---

## ✅ Testing Checklist

- [ ] Create user baru dengan reseller package
- [ ] Edit user, tambah reseller package
- [ ] Edit user, ganti ke package tier berbeda
- [ ] Edit user, extend expiry date
- [ ] Edit user, hapus reseller (pilih "No Reseller")
- [ ] Verify tier otomatis update saat ganti package
- [ ] Verify discount applied saat user login
- [ ] Verify discount hilang jika pilih "No Reseller"
- [ ] Verify table menampilkan tier dengan benar
- [ ] Verify stats menghitung active resellers dengan benar

---

**Last Updated:** 27 Oktober 2025  
**Status:** ✅ Implemented & Ready for Testing
