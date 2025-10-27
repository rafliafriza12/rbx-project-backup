# 📄 Profile Page - Reseller Display Update

## ✅ Perubahan yang Diterapkan

Profile page (`/app/(public)/profile/page.tsx`) telah diupdate untuk menampilkan **data reseller** user.

---

## 🔄 Interface Update

### **SEBELUM (memberRole system):**

```typescript
interface MemberRole {
  _id: string;
  member: string;
  diskon: number;
  description?: string;
  isActive: boolean;
}

interface UserProfile {
  memberRole: MemberRole | null;
}
```

### **SESUDAH (reseller tier system):**

```typescript
interface UserProfile {
  resellerTier?: number; // 0-3
  resellerExpiry?: Date | string; // Expiry date
  resellerPackageId?: string; // Package reference
  diskon?: number; // Discount from API
}
```

---

## 🎨 Display Changes

### **1. Diskon Display**

**SEBELUM:**

```tsx
{profileData.memberRole ? profileData.memberRole.diskon : 0}%
```

**SESUDAH:**

```tsx
{profileData.diskon || 0}%
```

Discount sekarang diambil langsung dari field `diskon` yang sudah dihitung di API `/api/user/profile`.

---

### **2. Reseller Status Display**

#### **A. Jika User PUNYA Reseller (resellerTier > 0):**

**Reseller Status Badge:**

```
👑 Reseller Status
   [Tier 2]  ← Badge dengan gradient
```

**Expiry Date:**

```
🕐 Berlaku Hingga
   27 Oktober 2025  ← Hijau jika aktif
   27 Oktober 2025 (Expired)  ← Merah jika expired
```

---

#### **B. Jika User TIDAK PUNYA Reseller (resellerTier = 0 atau null):**

```
👑 Reseller Status
   [Upgrade ke Reseller]  ← Button link ke /reseller
```

User bisa langsung klik button untuk upgrade.

---

## 📊 Contoh Display

### **User dengan Reseller Aktif:**

```
┌─────────────────────────────────────┐
│ 💼 Total Pengeluaran                │
│    Rp 5.000.000                     │
├─────────────────────────────────────┤
│ 📈 Diskon                           │
│    10%  ← Hijau                     │
├─────────────────────────────────────┤
│ 👑 Reseller Status                  │
│    [Tier 2]  ← Badge gradient       │
├─────────────────────────────────────┤
│ 🕐 Berlaku Hingga                   │
│    27 Desember 2025  ← Hijau        │
└─────────────────────────────────────┘
```

### **User dengan Reseller Expired:**

```
┌─────────────────────────────────────┐
│ 📈 Diskon                           │
│    0%  ← Hijau (tapi 0)             │
├─────────────────────────────────────┤
│ 👑 Reseller Status                  │
│    [Tier 1]  ← Badge gradient       │
├─────────────────────────────────────┤
│ 🕐 Berlaku Hingga                   │
│    27 Oktober 2025 (Expired) ← Merah│
└─────────────────────────────────────┘
```

### **User tanpa Reseller:**

```
┌─────────────────────────────────────┐
│ 📈 Diskon                           │
│    0%                               │
├─────────────────────────────────────┤
│ 👑 Reseller Status                  │
│    [Upgrade ke Reseller]  ← Button  │
└─────────────────────────────────────┘
```

---

## 🔍 Data Source

Profile data berasal dari API `/api/user/profile`:

```typescript
// GET /api/user/profile?email=user@example.com

Response:
{
  "success": true,
  "data": {
    "id": "67...",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "resellerTier": 2,
    "resellerExpiry": "2025-12-27T00:00:00.000Z",
    "resellerPackageId": "67...abc",
    "diskon": 10,  // Calculated from ResellerPackage
    "spendedMoney": 5000000,
    ...
  }
}
```

**Calculation di API:**

```typescript
// If user has active reseller
if (
  user.resellerPackageId &&
  user.resellerExpiry &&
  new Date(user.resellerExpiry) > new Date()
) {
  const resellerPackage = await ResellerPackage.findById(
    user.resellerPackageId
  );
  if (resellerPackage && resellerPackage.isActive) {
    diskon = resellerPackage.discount; // e.g., 10
  }
}
```

---

## 🎯 Features

### **1. Dynamic Status Badge**

- Menampilkan "Tier X" sesuai `resellerTier`
- Gradient background untuk visual menarik
- Hanya muncul jika user punya reseller

### **2. Expiry Date Display**

- Format Indonesia: "27 Oktober 2025"
- **Hijau** jika masih aktif (belum expired)
- **Merah** jika sudah expired dengan label "(Expired)"
- Hanya muncul jika user punya reseller

### **3. Upgrade Button**

- Muncul jika user belum punya reseller
- Link ke `/reseller` untuk upgrade
- Gradient button dengan hover effect
- CTA jelas: "Upgrade ke Reseller"

### **4. Discount Percentage**

- Langsung dari API (real-time calculation)
- Hijau untuk konsistensi dengan tema
- 0% jika tidak ada reseller atau expired

---

## 🧪 Testing Scenarios

### **Test 1: User dengan Reseller Aktif**

1. Login sebagai user yang sudah beli reseller
2. Buka `/profile`
3. **Verify:**
   - ✅ Diskon tampil sesuai package (e.g., 10%)
   - ✅ Badge "Tier X" muncul
   - ✅ Expiry date tampil dengan warna hijau
   - ✅ Tidak ada button "Upgrade ke Reseller"

### **Test 2: User dengan Reseller Expired**

1. Login sebagai user dengan reseller expired
2. Buka `/profile`
3. **Verify:**
   - ✅ Diskon = 0%
   - ✅ Badge "Tier X" masih muncul
   - ✅ Expiry date tampil dengan warna merah + "(Expired)"
   - ✅ Tidak ada button upgrade (masih show badge)

### **Test 3: User tanpa Reseller**

1. Login sebagai user biasa (belum pernah beli)
2. Buka `/profile`
3. **Verify:**
   - ✅ Diskon = 0%
   - ✅ Tidak ada badge tier
   - ✅ Tidak ada expiry date
   - ✅ Button "Upgrade ke Reseller" muncul
   - ✅ Klik button → redirect ke `/reseller`

### **Test 4: Fallback ke AuthContext**

1. API `/api/user/profile` error atau gagal
2. **Verify:**
   - ✅ Data diambil dari AuthContext
   - ✅ Reseller info tetap muncul jika ada di AuthContext
   - ✅ Display konsisten dengan data API

---

## 💡 Business Logic

### **Kapan Discount Muncul?**

```
IF resellerPackageId EXISTS
  AND resellerExpiry > now
  AND package.isActive = true
THEN
  diskon = package.discount
ELSE
  diskon = 0
```

### **Kapan Badge Tier Muncul?**

```
IF resellerTier > 0
THEN
  Show badge "Tier {resellerTier}"
ELSE
  Show "Upgrade ke Reseller" button
```

### **Warna Expiry Date:**

```
IF resellerExpiry > now
THEN
  Color = green (aktif)
ELSE
  Color = red + text "(Expired)"
```

---

## 🎨 Styling

### **Reseller Status Badge:**

```css
bg-gradient-to-r from-primary-100/20 to-primary-200/20
border border-primary-100/30
text-primary-100
px-3 py-1 rounded-full
```

### **Upgrade Button:**

```css
bg-gradient-to-r from-primary-100 to-primary-200
text-white
px-3 py-1 rounded-full
hover:shadow-lg hover:scale-105
transition-all duration-300
```

### **Expiry Date (Active):**

```css
text-green-400 font-semibold
```

### **Expiry Date (Expired):**

```css
text-red-400 font-semibold
```

---

## 📝 Notes

- **Backward Compatible:** Jika API masih return `memberRole`, tidak akan error (sudah dihapus dari interface)
- **Real-time Discount:** Discount dihitung di API setiap kali fetch profile
- **User-Friendly:** Button "Upgrade ke Reseller" memudahkan user untuk upgrade
- **Visual Feedback:** Warna hijau/merah langsung memberikan info status aktif/expired
- **Consistent:** Format tanggal menggunakan Indonesian locale untuk konsistensi

---

## 🚀 Next Steps

Setelah update ini, user dapat:

1. ✅ Melihat status reseller mereka (tier dan expiry)
2. ✅ Mengetahui discount yang mereka dapat
3. ✅ Langsung upgrade via button jika belum punya reseller
4. ✅ Mengetahui apakah reseller mereka masih aktif atau expired

---

**Last Updated:** 27 Oktober 2025  
**Status:** ✅ Implemented & Ready for Testing
