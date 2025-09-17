# 🚀 Quick Setup - Email Invoice System

## ✅ Yang Sudah Dibuat:

1. **📧 EmailService** (`lib/email.ts`)

   - Service untuk mengirim email dengan Nodemailer
   - Template invoice HTML yang responsive dan professional
   - Dukungan multiple email providers

2. **🔧 Model Settings** (Updated)

   - Tambahan konfigurasi email (host, port, credentials, dll)
   - Support Gmail, Outlook, Yahoo, Custom SMTP

3. **📨 API Endpoints:**

   - `POST /api/email/invoice` - Kirim ulang invoice
   - `POST /api/email/test` - Test konfigurasi email

4. **🔗 Integrasi Transaksi**

   - Email invoice otomatis dikirim saat transaksi dibuat
   - Non-blocking: transaksi tetap berhasil meski email gagal

5. **⚙️ Admin Component**
   - `EmailSettingsForm.tsx` untuk konfigurasi email di admin

## 🛠️ Cara Setup:

### 1. **Setup Gmail (Recommended)**

1. **Buka Admin Settings** (implementasikan EmailSettingsForm di halaman admin)
2. **Pilih Provider**: Gmail
3. **Isi Konfigurasi:**

   ```
   Email User: your-email@gmail.com
   Email Password: [App Password - bukan password biasa]
   SMTP Host: smtp.gmail.com (auto-filled)
   Port: 587 (auto-filled)
   Secure: false (auto-set)
   ```

4. **Generate Gmail App Password:**
   - Google Account → Security → 2-Step Verification
   - App Passwords → Generate untuk "Mail"
   - Gunakan password yang digenerate

### 2. **Test Konfigurasi**

```bash
# Test via API
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"testEmail": "test@example.com"}'
```

### 3. **Test Invoice Email**

- Buat transaksi baru
- Email invoice akan dikirim otomatis ke customer
- Check console log untuk status pengiriman

## 📧 Template Email Features:

✅ **Professional Design** - Gradient header, responsive layout  
✅ **Complete Invoice Info** - ID, tanggal, status, customer info  
✅ **Roblox Account Info** - Username (password di-mask untuk keamanan)  
✅ **Service Details** - Robux/Gamepass/Joki dengan detail lengkap  
✅ **Payment Instructions** - Tombol bayar untuk transaksi pending  
✅ **Security Notes** - Panduan keamanan dan tips penting  
✅ **Contact Support** - Info WhatsApp, Discord, Email  
✅ **Mobile Responsive** - Perfect di semua device

## 🔧 Untuk Developer:

### Integrasikan EmailSettingsForm ke Admin:

```tsx
// pages/admin/settings.tsx
import EmailSettingsForm from "@/components/admin/EmailSettingsForm";

const AdminSettings = () => {
  const handleSaveEmailSettings = async (settings: any) => {
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    // Handle response
  };

  return (
    <div>
      <EmailSettingsForm onSave={handleSaveEmailSettings} />
    </div>
  );
};
```

### Custom Email Template:

```typescript
// Modify lib/email.ts
private static generateCustomTemplate(data: any): string {
  return `
    <html>
      <!-- Your custom template -->
    </html>
  `;
}
```

### Manual Send Invoice:

```typescript
import EmailService from "@/lib/email";

const resendInvoice = async (transactionId: string) => {
  const transaction = await Transaction.findById(transactionId);
  const emailSent = await EmailService.sendInvoiceEmail(transaction);
  return emailSent;
};
```

## 🎯 Next Steps:

1. **Implementasikan EmailSettingsForm** di admin dashboard
2. **Setup Gmail App Password** untuk production
3. **Test dengan transaksi real**
4. **Monitor email delivery** via console logs
5. **Customize template** sesuai branding

## 🐛 Troubleshooting:

**Email tidak terkirim?**

- Check konfigurasi email di settings
- Pastikan Gmail App Password benar
- Test dengan `/api/email/test` endpoint

**Template rusak?**

- Check console log untuk HTML errors
- Test di HTML validator

**Performance issue?**

- Email dikirim async, tidak block transaksi
- Consider email queue untuk volume tinggi

---

**Status**: ✅ **READY TO USE**  
**Estimasi Setup**: 15 menit  
**Requirements**: Gmail account + App Password
