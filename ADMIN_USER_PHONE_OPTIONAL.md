# Admin User Update - Phone Number Optional

## 📋 Overview

Update endpoint admin untuk membuat nomor telepon (phone) menjadi **opsional** ketika admin melakukan update user. Ini memberikan fleksibilitas kepada admin untuk mengelola user tanpa harus memaksa user memiliki nomor telepon.

## ✅ Perubahan yang Dilakukan

### File: `/app/api/admin/users/[id]/route.ts`

#### 1. **Handle Phone as Optional**

```typescript
// Build update data
const updateData: any = {};

if (firstName) updateData.firstName = firstName;
if (lastName) updateData.lastName = lastName;
if (email) updateData.email = email;

// Phone is optional for admin update - allow empty string or actual value
if (phone !== undefined) {
  updateData.phone = phone.trim() || "";
}
if (countryCode !== undefined) {
  updateData.countryCode = countryCode || "";
}
if (accessRole) updateData.accessRole = accessRole;
```

**Changes:**

- Phone dapat di-set menjadi empty string `""`
- CountryCode juga bisa di-set menjadi empty string `""`
- Menggunakan `phone !== undefined` untuk allow null/empty values

#### 2. **Skip Validation for Admin Updates**

```typescript
// Update user without running validators (admin has full control)
// This allows phone to be optional when admin updates
const updatedUser = await User.findByIdAndUpdate(id, updateData, {
  new: true,
  runValidators: false, // Skip validation for admin updates
}).select("-password");
```

**Changes:**

- `runValidators: false` - Menonaktifkan validasi Mongoose
- Admin memiliki kontrol penuh untuk update user data
- Phone validation di model User tidak dijalankan saat admin update

## 🔄 Behavior Comparison

### Sebelum Update:

```
Admin Update User
    ↓
Phone Required (must have value)
    ↓
Validator checks phone format
    ↓
Error if phone empty or invalid
```

### Setelah Update:

```
Admin Update User
    ↓
Phone Optional (can be empty)
    ↓
No validation (runValidators: false)
    ↓
Update successful ✅
```

## 📊 Use Cases

### Use Case 1: Admin Removes Phone Number

```json
PUT /api/admin/users/{id}
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "",              // ✅ Empty allowed
  "countryCode": "",        // ✅ Empty allowed
  "accessRole": "user"
}
```

**Result:** User updated successfully, phone and countryCode set to empty string

### Use Case 2: Admin Updates Only Name

```json
PUT /api/admin/users/{id}
{
  "firstName": "Jane",
  "lastName": "Smith"
  // phone not included in payload
}
```

**Result:** Only name updated, phone remains unchanged

### Use Case 3: Admin Sets Phone Number

```json
PUT /api/admin/users/{id}
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "phone": "85275853215",
  "countryCode": "+62"
}
```

**Result:** User updated with phone number

## ⚠️ Important Notes

### 1. **Validation Still Applies for Regular Registration**

- User registration via `/api/auth/register` masih memerlukan phone
- Validasi di model User masih aktif untuk create operations
- Hanya admin update yang bypass validation

### 2. **Google OAuth Users**

- Google OAuth users sudah allowed untuk tidak punya phone
- Tidak ada perubahan untuk OAuth flow

### 3. **Database Consistency**

- Phone field di database bisa berisi empty string `""`
- CountryCode field di database bisa berisi empty string `""`
- Index pada `phone` dan `countryCode` tetap berfungsi

### 4. **Frontend Handling**

- Frontend admin page harus handle empty phone gracefully
- Display "Tidak tersedia" atau "-" jika phone kosong
- Form validation di frontend bisa lebih lenient untuk admin

## 🧪 Testing

### Test Case 1: Update User Without Phone

**Request:**

```bash
PUT /api/admin/users/123456
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "phone": "",
  "countryCode": "",
  "accessRole": "user"
}
```

**Expected Response:**

```json
{
  "message": "Pengguna berhasil diupdate",
  "user": {
    "_id": "123456",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "",
    "countryCode": "",
    "accessRole": "user",
    ...
  }
}
```

### Test Case 2: Update Only Email (Phone Not Included)

**Request:**

```bash
PUT /api/admin/users/123456
Content-Type: application/json

{
  "email": "newemail@example.com"
}
```

**Expected Response:**

```json
{
  "message": "Pengguna berhasil diupdate",
  "user": {
    "email": "newemail@example.com",
    "phone": "85275853215",  // unchanged
    ...
  }
}
```

### Test Case 3: Update Phone to New Number

**Request:**

```bash
PUT /api/admin/users/123456
Content-Type: application/json

{
  "phone": "81234567890",
  "countryCode": "+62"
}
```

**Expected Response:**

```json
{
  "message": "Pengguna berhasil diupdate",
  "user": {
    "phone": "81234567890",
    "countryCode": "+62",
    ...
  }
}
```

## 🔒 Security Considerations

1. **Admin Only**: Endpoint ini hanya bisa diakses oleh admin
2. **Token Verification**: Request harus punya valid admin token
3. **Email Uniqueness**: Email tetap harus unique (dicek sebelum update)
4. **Password Hashing**: Password tetap di-hash jika diupdate

## 📌 Frontend Integration

### Admin User Form:

```tsx
// Phone field di admin form
<input
  type="text"
  value={formData.phone}
  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
  placeholder="08123456789 (optional)"
  // NO required attribute
/>
```

### Display Phone in Table:

```tsx
// Show phone or fallback
<td>
  {user.phone || "-"}
</td>

// With country code
<td>
  {user.phone ? `${user.countryCode} ${user.phone}` : "-"}
</td>
```

## 🎯 Related Endpoints

### Regular User Registration (Still Requires Phone):

- `POST /api/auth/register` - Phone **required**
- Validation di model User tetap aktif

### User Profile Update (Requires Phone):

- `PUT /api/user/profile` - Phone **required**
- Regular users tidak bisa remove phone mereka sendiri

### Admin User Update (Phone Optional):

- `PUT /api/admin/users/[id]` - Phone **optional** ✅
- Admin bisa remove atau update phone

## 🔗 Related Files

- `/app/api/admin/users/[id]/route.ts` - Admin update endpoint (Modified)
- `/models/User.ts` - User model dengan validation
- `/app/admin/users/page.tsx` - Admin UI untuk manage users
- `/app/api/auth/register/route.ts` - Registration endpoint (Unchanged)

---

**Created:** November 20, 2025
**Status:** ✅ Implemented
**Impact:** Admin user management only
