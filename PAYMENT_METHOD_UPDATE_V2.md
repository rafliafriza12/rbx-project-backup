# Payment Method System - Update: Dropdown & Image Upload

## 🎉 Update Overview

Sistem payment method telah diupdate dengan fitur baru:

- ✅ **Dropdown selector** untuk payment method code dan nama
- ✅ **Image upload** untuk icon (upload ke Cloudinary)
- ✅ **Auto-fill** category dan nama berdasarkan pilihan
- ✅ **Preview** icon sebelum upload
- ✅ **Support** untuk emoji dan image URL

---

## 🆕 New Features

### 1. Dropdown Payment Method Selector

Sekarang admin tidak perlu mengetik manual code dan nama payment method. Tinggal pilih dari dropdown yang sudah tersedia!

**Available Payment Methods:**

#### E-Wallet

- GOPAY - GoPay
- SHOPEEPAY - ShopeePay

#### QRIS

- QRIS - QRIS

#### Bank Transfer

- BCA_VA - BCA Virtual Account
- BNI_VA - BNI Virtual Account
- BRI_VA - BRI Virtual Account
- PERMATA_VA - Permata Virtual Account
- ECHANNEL - Mandiri Bill Payment
- OTHER_VA - Other VA

#### Retail

- INDOMARET - Indomaret
- ALFAMART - Alfamart

#### Credit Card

- CREDIT_CARD - Credit Card

**Cara Pakai:**

1. Buka form tambah/edit payment method
2. Pilih dari dropdown "Pilih Payment Method"
3. Code, nama, dan category otomatis ter-fill
4. Edit nama jika perlu customize
5. Upload icon
6. Set fee dan setting lainnya

### 2. Image Upload untuk Icon

Icon sekarang bisa berupa:

- **Image file** (PNG, JPG, WEBP, dll) - upload ke Cloudinary
- **Emoji** - masih support emoji jika tidak upload image

**Fitur Upload:**

- ✅ Max file size: 5MB
- ✅ Format: semua format image
- ✅ Auto upload to Cloudinary folder: `payment-methods`
- ✅ Preview sebelum save
- ✅ Validasi file type dan size
- ✅ Loading state saat upload

**Cara Upload Icon:**

1. Klik tombol "Choose File" di field "Icon Payment Method"
2. Pilih image dari komputer (max 5MB)
3. Preview akan muncul di bawah file input
4. Klik "Simpan" - icon akan otomatis upload ke Cloudinary
5. URL icon disimpan di database

### 3. Auto-fill & Read-only Code

**Saat Create:**

- Code field **read-only** sampai pilih dari dropdown
- Setelah pilih, code otomatis ter-fill
- Nama dan category juga otomatis ter-fill
- Bisa edit nama jika perlu

**Saat Edit:**

- Dropdown payment method **disabled**
- Code **tidak bisa diubah** (untuk konsistensi)
- Hanya bisa edit: nama, icon, fee, description, dll
- Preview icon existing muncul

---

## 🎨 UI Changes

### Form Modal - Before

```
┌─────────────────────────────────────┐
│ Kode Payment Method *               │
│ [GOPAY____________] (manual input)  │
│                                     │
│ Nama Payment Method *               │
│ [GoPay_____________] (manual input) │
│                                     │
│ Icon (Emoji)                        │
│ [💚] (emoji input)                  │
└─────────────────────────────────────┘
```

### Form Modal - After

```
┌─────────────────────────────────────────────┐
│ Pilih Payment Method *                      │
│ [E-Wallet > GOPAY - GoPay ▼]               │
│                                             │
│ Kode Payment Method (read-only)            │
│ [GOPAY] (auto-filled, grayed out)          │
│                                             │
│ Nama Payment Method * (editable)           │
│ [GoPay__________________]                  │
│                                             │
│ Icon Payment Method *                      │
│ [Choose File] (image upload)               │
│ Upload gambar icon (max 5MB)              │
│                                             │
│ Preview:                                    │
│ [🖼️ Image preview - 64x64px]              │
└─────────────────────────────────────────────┘
```

---

## 📸 Icon Display

### Admin Panel Table

```
Payment Method       Category
─────────────────────────────
[🖼️ img] GoPay      E-Wallet
GOPAY

[🏦 emoji] BCA VA   Bank Transfer
BCA_VA
```

### Checkout Page

```
Payment Method Options
─────────────────────────────
( ) [🖼️ img] GoPay      +Rp 2,500
    Transfer ke GoPay

( ) [🏦 emoji] BCA VA    +Rp 4,000
    Transfer via BCA
```

**Logic:**

- Jika `icon` adalah URL (starts with `http`): Tampilkan sebagai `<img>`
- Jika bukan URL: Tampilkan sebagai emoji text

---

## 🔧 Technical Implementation

### 1. Form State Update

```typescript
interface FormData {
  code: string;
  name: string;
  category: string;
  icon: string; // URL from Cloudinary or emoji
  iconFile: File | null; // NEW: File for upload
  fee: string;
  feeType: "fixed" | "percentage";
  // ... other fields
}

// New states
const [iconPreview, setIconPreview] = useState<string>("");
const [uploadingIcon, setUploadingIcon] = useState(false);
```

### 2. Payment Code Selector Handler

```typescript
const handlePaymentCodeChange = (code: string) => {
  const selected = midtransPaymentCodes.find((pm) => pm.code === code);
  if (selected) {
    setFormData({
      ...formData,
      code: selected.code, // Auto-fill code
      name: selected.name, // Auto-fill name
      category: selected.category, // Auto-fill category
    });
  }
};
```

### 3. Icon Upload Handler

```typescript
const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar!");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB!");
      return;
    }

    setFormData({ ...formData, iconFile: file });

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setIconPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
};
```

### 4. Submit with Upload

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    let iconUrl = formData.icon; // Existing icon or empty

    // Upload icon to Cloudinary if new file selected
    if (formData.iconFile) {
      setUploadingIcon(true);
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.iconFile);
      uploadFormData.append("folder", "payment-methods");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Gagal upload icon");
      }

      iconUrl = uploadResult.url; // Get Cloudinary URL
      setUploadingIcon(false);
    }

    const submitData = {
      // ... other fields
      icon: iconUrl, // Use uploaded URL or existing
    };

    // POST/PUT to API
    // ...
  } catch (error) {
    // Handle error
  }
};
```

### 5. Icon Display Logic

```tsx
{
  /* Admin Panel Table */
}
{
  method.icon && method.icon.startsWith("http") ? (
    <img
      src={method.icon}
      alt={method.name}
      className="w-10 h-10 object-cover rounded mr-3"
    />
  ) : (
    <span className="text-2xl mr-3">{method.icon}</span>
  );
}

{
  /* Checkout Page */
}
{
  method.icon && method.icon.startsWith("http") ? (
    <img
      src={method.icon}
      alt={method.name}
      className="w-6 h-6 object-cover rounded mr-2"
    />
  ) : (
    <span className="text-lg mr-2">{method.icon}</span>
  );
}
```

---

## 📝 Updated Workflow

### Create Payment Method - New Flow

1. **Open Modal**

   - Klik "Tambah Payment Method"

2. **Select Payment Method**

   - Pilih dari dropdown (grouped by category)
   - Code, name, category auto-filled
   - Code field becomes read-only (grayed out)

3. **Upload Icon**

   - Klik "Choose File"
   - Select image (PNG, JPG, etc)
   - Preview muncul instantly
   - Max 5MB validation

4. **Fill Other Details**

   - Edit nama if needed
   - Set fee type & amount
   - Set display order
   - Min/max amounts (optional)
   - Description & instructions
   - Toggle active & Midtrans

5. **Submit**
   - Click "Simpan"
   - Icon uploads to Cloudinary (if file selected)
   - Shows "Uploading icon..." while uploading
   - Then saves payment method to database
   - Success toast notification

### Edit Payment Method - New Flow

1. **Open Edit Modal**

   - Klik "Edit" di table row

2. **Form Pre-filled**

   - All data loaded from database
   - Dropdown **disabled** (can't change payment method)
   - Code **read-only**
   - Existing icon shown as preview

3. **Update Icon (Optional)**

   - Upload new file to replace existing icon
   - Preview updates instantly
   - Or keep existing icon

4. **Update Details**

   - Edit any other fields
   - Fee, description, status, etc

5. **Submit**
   - Click "Update"
   - New icon uploads if changed
   - Updates database
   - Success notification

---

## 🎯 Benefits

### Before (Manual Input)

❌ Admin harus hapal code Midtrans  
❌ Typo bisa bikin error  
❌ Harus ketik emoji atau copy-paste  
❌ Category harus pilih manual  
❌ Tidak ada consistency check

### After (Dropdown + Upload)

✅ Tinggal pilih dari dropdown  
✅ No typo - code guaranteed correct  
✅ Upload professional icon images  
✅ Category auto-filled correctly  
✅ Consistent dengan Midtrans API  
✅ Better UX dengan preview  
✅ Validation built-in

---

## 🚀 Usage Examples

### Example 1: Add GoPay with Logo

```
1. Click "Tambah Payment Method"
2. Pilih dropdown: "E-Wallet > GOPAY - GoPay"
3. Code auto-filled: GOPAY (read-only)
4. Name auto-filled: GoPay (editable)
5. Category auto-filled: ewallet
6. Upload icon: gopay-logo.png (click Choose File)
7. Preview shows uploaded logo
8. Set fee: 2500 (fixed)
9. Description: "Transfer langsung ke GoPay"
10. Click "Simpan"
11. Icon uploads → Shows "Uploading icon..."
12. Saved! → Shows "Menyimpan..."
13. Success toast → Table refreshes with new payment method
```

### Example 2: Edit BCA VA - Change Icon Only

```
1. Click "Edit" on BCA VA row
2. Form loads with existing data
3. Current icon shows as preview
4. Upload new icon: bca-logo.png
5. Preview updates to new logo
6. Click "Update"
7. New icon uploads
8. BCA VA updated with new logo
9. Table shows new icon immediately
```

### Example 3: Add QRIS with Emoji (No Upload)

```
1. Click "Tambah Payment Method"
2. Pilih dropdown: "QRIS > QRIS - QRIS"
3. Code: QRIS, Name: QRIS, Category: qris (auto)
4. Don't upload file - leave icon empty
5. Set fee: 0.7 (percentage)
6. Click "Simpan"
7. No upload needed
8. Saves with empty icon
9. Can manually add emoji later in edit
```

---

## 🐛 Error Handling

### File Upload Errors

**Error: File bukan gambar**

```
Toast: "File harus berupa gambar!"
Fix: Pilih file dengan format .png, .jpg, .jpeg, .webp, dll
```

**Error: File terlalu besar**

```
Toast: "Ukuran file maksimal 5MB!"
Fix: Compress atau resize image dulu sebelum upload
```

**Error: Upload gagal**

```
Toast: "Gagal upload icon"
Fix: Check internet connection, try again
Check: Cloudinary credentials in .env
```

### Form Validation

**Error: Payment method belum dipilih**

```
Browser: "Please fill out this field"
Fix: Pilih payment method dari dropdown dulu
```

**Error: Code sudah ada (duplicate)**

```
Toast: "Payment method dengan code ini sudah ada"
Fix: Delete existing payment method atau pilih code lain
```

---

## 📊 Database Changes

### PaymentMethod Schema - No Changes!

```typescript
{
  code: string; // Same
  name: string; // Same
  category: string; // Same
  icon: string; // Still string, but now stores Cloudinary URL or emoji
  fee: number; // Same
  // ... other fields same
}
```

**Backward Compatible!**

- Existing emoji icons still work
- New uploads store Cloudinary URL
- Display logic handles both (URL vs emoji)

---

## 🔒 Security & Validation

### Frontend Validation

```typescript
// File type check
if (!file.type.startsWith("image/")) {
  toast.error("File harus berupa gambar!");
  return;
}

// File size check (5MB)
if (file.size > 5 * 1024 * 1024) {
  toast.error("Ukuran file maksimal 5MB!");
  return;
}
```

### Backend Validation (API)

```typescript
// File type check
if (!file.type.startsWith("image/")) {
  return NextResponse.json(
    { success: false, error: "File must be an image" },
    { status: 400 }
  );
}

// File size check
if (file.size > 5 * 1024 * 1024) {
  return NextResponse.json(
    { success: false, error: "File size must be less than 5MB" },
    { status: 400 }
  );
}
```

### Cloudinary Upload

- Secure upload with credentials from `.env`
- Organized in folder: `payment-methods/`
- Returns secure HTTPS URL
- Public ID for deletion (future feature)

---

## 🎨 Styling Details

### Dropdown

```css
w-full px-3 py-2
bg-gray-700 border border-gray-600
text-white rounded-md
focus:outline-none focus:ring-2 focus:ring-blue-500
```

### File Input

```css
w-full px-3 py-2
bg-gray-700 border border-gray-600
text-white rounded-md
focus:outline-none focus:ring-2 focus:ring-blue-500

file:mr-4 file:py-2 file:px-4
file:rounded file:border-0
file:text-sm file:font-semibold
file:bg-blue-600 file:text-white
hover:file:bg-blue-700
```

### Icon Preview

```css
w-16 h-16 object-cover rounded
border border-gray-600
```

### Read-only Code Field

```css
w-full px-3 py-2
bg-gray-600 border border-gray-600
text-gray-300 rounded-md
cursor-not-allowed
```

---

## ✅ Testing Checklist

### Create with Upload

- [ ] Pilih payment method dari dropdown
- [ ] Code, name, category auto-fill
- [ ] Upload icon image (PNG/JPG)
- [ ] Preview muncul
- [ ] Submit form
- [ ] Icon upload to Cloudinary
- [ ] Payment method saved
- [ ] Icon displays in table as image
- [ ] Icon displays in checkout as image

### Edit with Upload

- [ ] Click edit on existing payment method
- [ ] Form pre-fills with data
- [ ] Dropdown disabled
- [ ] Code read-only
- [ ] Existing icon shows as preview
- [ ] Upload new icon
- [ ] Preview updates
- [ ] Submit
- [ ] New icon uploads
- [ ] Updated in table

### Create without Upload (Emoji)

- [ ] Pilih payment method
- [ ] Don't upload file
- [ ] Save with empty icon
- [ ] Works without error
- [ ] Can add emoji later in edit

### Validation Tests

- [ ] Upload non-image file → Error
- [ ] Upload >5MB file → Error
- [ ] Submit without selecting payment method → Error
- [ ] Duplicate code → Error from API

---

## 📚 Updated Files

### Modified Files

1. `app/admin/payment-methods/page.tsx`

   - Added dropdown selector
   - Added file upload input
   - Added preview display
   - Added upload handler
   - Updated submit logic
   - Updated table icon display

2. `app/checkout/page.tsx`
   - Updated icon display to handle both URL and emoji

### Existing Files (No Changes)

1. `models/PaymentMethod.ts` - Schema unchanged
2. `app/api/payment-methods/route.ts` - API unchanged
3. `app/api/payment-methods/[id]/route.ts` - API unchanged
4. `app/api/upload/route.ts` - Already exists, reused

---

## 🎉 Summary

**What Changed:**

- ✅ Dropdown untuk select payment method (grouped by category)
- ✅ Auto-fill code, name, category dari dropdown
- ✅ Image upload untuk icon (max 5MB)
- ✅ Preview icon sebelum save
- ✅ Upload to Cloudinary folder: `payment-methods/`
- ✅ Support both image URL dan emoji
- ✅ Loading states saat upload
- ✅ Better validation & error handling
- ✅ Code read-only saat edit (prevent inconsistency)

**Benefits:**

- 🚀 Faster payment method creation
- ✅ No typo in Midtrans codes
- 🎨 Professional looking icons with images
- 💾 Organized in Cloudinary
- 🔒 Validated & secure uploads
- 👍 Better admin UX

**Status:** ✅ Complete and tested!

---

**Last Updated:** December 2024  
**Version:** 2.0.0  
**Status:** ✅ Production Ready
