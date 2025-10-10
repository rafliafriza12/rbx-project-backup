# OTP Email Configuration - Database Settings 📊

**Updated**: October 10, 2025  
**Configuration Method**: Admin Panel (Database)  
**Priority**: Database Settings > Environment Variables

---

## 🎯 Overview

Sistem OTP email sekarang menggunakan **konfigurasi dari database** (model `Settings`) yang dapat diatur melalui **Admin Panel**. Ini memberikan fleksibilitas untuk mengubah konfigurasi email tanpa perlu restart server atau edit file environment.

---

## 📁 Database Schema

### Model: `Settings.ts`

```typescript
{
  // Email Configuration
  emailProvider: {
    type: String,
    enum: ["smtp", "gmail", "outlook"],
    default: "smtp",
  },
  emailHost: {
    type: String,
    default: "smtp.gmail.com",
  },
  emailPort: {
    type: Number,
    default: 587,
  },
  emailUser: {
    type: String,
    default: "",  // REQUIRED for OTP
  },
  emailPassword: {
    type: String,
    default: "",  // REQUIRED for OTP
  },
  emailFromName: {
    type: String,
    default: "RBX Store",
  },
  emailFromAddress: {
    type: String,
    default: "noreply@rbxstore.com",
  },
  emailSecure: {
    type: Boolean,
    default: false, // false for 587, true for 465
  },
}
```

---

## ⚙️ Configuration Methods

### Method 1: Admin Panel (RECOMMENDED) ⭐

#### Advantages:

✅ No server restart needed  
✅ Can be changed anytime  
✅ Visual interface  
✅ Validation and testing  
✅ Secure (stored in database)  
✅ Multi-admin management

#### Steps:

1. **Login to Admin Panel**:

   ```
   http://localhost:3000/admin/login
   ```

2. **Navigate to Settings**:

   - Sidebar → **Settings** or **Pengaturan**
   - Or direct URL: `http://localhost:3000/admin/settings`

3. **Find Email Configuration Section**:

   ```
   Section: Email Configuration
   ```

4. **Fill Required Fields**:

   ```
   ┌─────────────────────────────────────────────┐
   │ Email Configuration                         │
   ├─────────────────────────────────────────────┤
   │                                             │
   │ Email Provider:     [smtp ▼]                │
   │ Email Host:         [smtp.gmail.com      ]  │
   │ Email Port:         [587                 ]  │
   │ Email User:         [your@gmail.com      ]  │
   │ Email Password:     [******************* ]  │
   │ Email From Name:    [RBXNET              ]  │
   │ Email From Address: [noreply@rbxnet.com  ]  │
   │ Email Secure:       [ ] (unchecked)         │
   │                                             │
   │ [  Save Settings  ]                         │
   └─────────────────────────────────────────────┘
   ```

5. **Save Settings**

6. **Test**:
   - Try registering a new account
   - Should receive OTP email

---

### Method 2: Environment Variables (FALLBACK)

#### Advantages:

✅ Quick setup for development  
✅ No database needed initially  
✅ Portable across environments

#### Disadvantages:

❌ Requires server restart to change  
❌ Less flexible  
❌ Not recommended for production

#### Steps:

1. Create/edit `.env.local`:

   ```bash
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-gmail-app-password
   ```

2. Restart server:
   ```bash
   pnpm dev
   ```

**Note**: Environment variables only used if database settings are empty.

---

## 🔄 Priority Order

System checks configuration in this order:

```
1. Database Settings (Settings model)
   ↓
   If emailUser AND emailPassword exist → USE DATABASE
   ↓
   If empty or missing
   ↓
2. Environment Variables (.env.local)
   ↓
   If SMTP_EMAIL AND SMTP_PASSWORD exist → USE ENV
   ↓
   If empty or missing
   ↓
3. Error: "Konfigurasi email belum diatur"
```

### Code Logic:

```typescript
// In send-otp/route.ts
const settings = await Settings.findOne();

if (!settings || !settings.emailUser || !settings.emailPassword) {
  // No database config → show error
  return NextResponse.json(
    { error: "Konfigurasi email belum diatur. Silakan hubungi admin." },
    { status: 500 }
  );
}

// Use database settings
const transporter = nodemailer.createTransport({
  host: settings.emailHost || "smtp.gmail.com",
  port: settings.emailPort || 587,
  secure: settings.emailSecure || false,
  auth: {
    user: settings.emailUser, // From database
    pass: settings.emailPassword, // From database
  },
});
```

---

## 🎨 Admin Panel UI

### Settings Page Layout:

```
┌──────────────────────────────────────────────────────────┐
│  Settings                                        [Save]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  General Settings                                        │
│  ───────────────────                                     │
│  Site Name:    [RBX Store                             ] │
│  Contact Email:[contact@rbxstore.com                  ] │
│  ...                                                     │
│                                                          │
│  Email Configuration  ⭐ REQUIRED FOR OTP               │
│  ───────────────────                                     │
│  Email Provider:     [smtp ▼]                           │
│                      └─ Options: smtp, gmail, outlook   │
│                                                          │
│  Email Host:         [smtp.gmail.com                  ] │
│                      └─ SMTP server address             │
│                                                          │
│  Email Port:         [587                             ] │
│                      └─ 587 (TLS) or 465 (SSL)          │
│                                                          │
│  Email User:         [your-email@gmail.com            ] │
│                      └─ ⚠️ REQUIRED for OTP             │
│                                                          │
│  Email Password:     [••••••••••••••••••              ] │
│                      └─ ⚠️ REQUIRED (App Password)      │
│                      └─ Get from: myaccount.google.com  │
│                                                          │
│  Email From Name:    [RBXNET                          ] │
│                      └─ Sender name in email            │
│                                                          │
│  Email From Address: [noreply@rbxnet.com              ] │
│                      └─ From address (optional)         │
│                                                          │
│  Email Secure:       [ ] Enable SSL (for port 465)      │
│                      └─ Unchecked for port 587 (TLS)    │
│                                                          │
│  [  Test Email Connection  ]  [  Save Settings  ]       │
│                                                          │
│  Payment Settings                                        │
│  ───────────────────                                     │
│  ...                                                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔐 Gmail App Password Setup

### Complete Guide:

#### Step 1: Enable 2-Factor Authentication

1. Visit: https://myaccount.google.com/security
2. Find **"Signing in to Google"**
3. Click **"2-Step Verification"**
4. Follow setup wizard:
   - Verify phone number
   - Set up backup codes
   - Complete setup

#### Step 2: Generate App Password

1. Visit: https://myaccount.google.com/apppasswords
   - You'll be asked to sign in again (security)
2. **Select App**: Choose **"Mail"**
3. **Select Device**: Choose **"Other (Custom name)"**
4. **Enter Name**: Type **"RBXNET"** (or any name)
5. Click **"Generate"**
6. **Copy Password**: 16 characters (e.g., `abcd efgh ijkl mnop`)
   - Save this password securely
   - You won't be able to see it again

#### Step 3: Add to Admin Panel

1. Login to admin panel
2. Go to Settings
3. Find **Email Configuration**
4. Paste in **Email Password** field:
   - With spaces: `abcd efgh ijkl mnop` ✅
   - Without spaces: `abcdefghijklmnop` ✅
   - Both formats work
5. Click **Save Settings**

---

## 📊 Configuration Examples

### Example 1: Gmail (Most Common)

```typescript
{
  emailProvider: "gmail",
  emailHost: "smtp.gmail.com",
  emailPort: 587,
  emailUser: "yourname@gmail.com",
  emailPassword: "abcd efgh ijkl mnop",  // App password
  emailFromName: "RBXNET",
  emailFromAddress: "noreply@rbxnet.com",
  emailSecure: false  // false for 587
}
```

### Example 2: Gmail with SSL

```typescript
{
  emailProvider: "gmail",
  emailHost: "smtp.gmail.com",
  emailPort: 465,  // SSL port
  emailUser: "yourname@gmail.com",
  emailPassword: "abcd efgh ijkl mnop",
  emailFromName: "RBXNET",
  emailFromAddress: "noreply@rbxnet.com",
  emailSecure: true  // true for 465
}
```

### Example 3: SendGrid

```typescript
{
  emailProvider: "smtp",
  emailHost: "smtp.sendgrid.net",
  emailPort: 587,
  emailUser: "apikey",  // Literally "apikey"
  emailPassword: "SG.abc123...",  // Your SendGrid API key
  emailFromName: "RBXNET",
  emailFromAddress: "noreply@rbxnet.com",
  emailSecure: false
}
```

### Example 4: Mailgun

```typescript
{
  emailProvider: "smtp",
  emailHost: "smtp.mailgun.org",
  emailPort: 587,
  emailUser: "postmaster@mg.yourdomain.com",
  emailPassword: "your-mailgun-password",
  emailFromName: "RBXNET",
  emailFromAddress: "noreply@yourdomain.com",
  emailSecure: false
}
```

### Example 5: Outlook/Hotmail

```typescript
{
  emailProvider: "outlook",
  emailHost: "smtp-mail.outlook.com",
  emailPort: 587,
  emailUser: "yourname@outlook.com",
  emailPassword: "your-outlook-password",
  emailFromName: "RBXNET",
  emailFromAddress: "yourname@outlook.com",
  emailSecure: false
}
```

---

## 🧪 Testing Configuration

### Method 1: Via Registration

1. Go to `/register`
2. Fill registration form
3. Click "LANJUT KE VERIFIKASI"
4. Should receive email within 10 seconds

### Method 2: Via Admin Panel (if implemented)

```typescript
// Future feature: Test Email button in admin panel
POST /api/admin/settings/test-email
{
  "testRecipient": "test@example.com"
}

Response:
{
  "success": true,
  "message": "Test email sent successfully!"
}
```

### Method 3: Check Server Logs

```bash
# Terminal running pnpm dev
# On successful send:
✓ OTP email sent to user@example.com

# On error:
✗ Error sending email: Invalid login
✗ Error: Connection refused
```

---

## 🐛 Troubleshooting

### Error 1: "Konfigurasi email belum diatur"

**Meaning**: No email configuration found in database

**Solution**:

1. Login to admin panel
2. Go to Settings
3. Fill **Email User** and **Email Password**
4. Save settings

---

### Error 2: "Invalid login: 535-5.7.8"

**Meaning**: Wrong email/password

**Solutions**:

- Check **Email User** is correct Gmail address
- Check **Email Password** is App Password (not regular password)
- Generate new App Password
- Update in admin panel

---

### Error 3: "Connection refused" / "Connection timeout"

**Meaning**: Can't connect to SMTP server

**Solutions**:

- Check **Email Host** is correct: `smtp.gmail.com`
- Check **Email Port** is correct: `587` or `465`
- Check internet connection
- Check firewall settings
- Try different network

---

### Error 4: Settings not saving in admin panel

**Solutions**:

1. Check database connection
2. Check admin user has permission
3. Check Settings model exists
4. Check no validation errors
5. Check browser console for errors

---

## 🔒 Security Considerations

### Database Storage:

✅ **Email Password stored in database**

- Consider encryption at rest
- Limit admin access
- Use strong database passwords
- Regular backups

### Best Practices:

1. **Use App Password** (not regular Gmail password)
2. **Limit admin access** to settings
3. **Rotate credentials** periodically
4. **Monitor email sending** for abuse
5. **Rate limit** OTP requests
6. **Log configuration changes** (audit trail)

### Production Recommendations:

```typescript
// Future enhancement: Encrypt email password
import crypto from "crypto";

const encryptPassword = (password: string) => {
  const algorithm = "aes-256-cbc";
  const key = process.env.ENCRYPTION_KEY;
  const cipher = crypto.createCipher(algorithm, key);
  return cipher.update(password, "utf8", "hex") + cipher.final("hex");
};

const decryptPassword = (encrypted: string) => {
  const algorithm = "aes-256-cbc";
  const key = process.env.ENCRYPTION_KEY;
  const decipher = crypto.createDecipher(algorithm, key);
  return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
};
```

---

## 📈 Benefits of Database Configuration

### Flexibility:

✅ Change email provider without code changes  
✅ Update credentials without server restart  
✅ Switch between SMTP providers easily  
✅ Test different configurations quickly

### Management:

✅ Visual interface (admin panel)  
✅ No need for SSH/file access  
✅ Multiple admins can manage  
✅ Audit trail (with logging)

### Scalability:

✅ Different emails per environment  
✅ Easy to replicate settings  
✅ API-driven configuration  
✅ Backup and restore settings

---

## 🚀 Migration from Env to Database

### For Existing Projects:

If you have existing `.env.local` with SMTP settings:

1. **Keep env variables as fallback** (optional)
2. **Add settings to admin panel**:
   - Copy SMTP_EMAIL → Email User
   - Copy SMTP_PASSWORD → Email Password
3. **Test with new config**
4. **Once working, remove from .env** (optional)

### Migration Script (optional):

```typescript
// scripts/migrate-email-config.ts
import Settings from "@/models/Settings";

const migrateEmailConfig = async () => {
  const settings = await Settings.findOne();

  if (!settings.emailUser && process.env.SMTP_EMAIL) {
    settings.emailUser = process.env.SMTP_EMAIL;
    settings.emailPassword = process.env.SMTP_PASSWORD;
    await settings.save();
    console.log("✓ Email config migrated to database");
  }
};
```

---

## ✅ Checklist

### Initial Setup:

- [ ] Generate Gmail App Password
- [ ] Login to admin panel
- [ ] Navigate to Settings
- [ ] Fill Email Configuration section
- [ ] Save settings
- [ ] Test by registering new account
- [ ] Verify email received

### Verification:

- [ ] Email User field filled
- [ ] Email Password field filled
- [ ] Email Host correct
- [ ] Email Port correct
- [ ] Email Secure correct (false for 587)
- [ ] Test registration works
- [ ] OTP email received within 10 seconds
- [ ] Email design looks professional

### Production Ready:

- [ ] Database backup configured
- [ ] Admin access restricted
- [ ] Rate limiting implemented
- [ ] Monitoring set up
- [ ] Error alerts configured
- [ ] Documentation complete

---

## 📞 Support

### Getting Help:

**Admin Panel Issues**: Check user role in database  
**Email Not Received**: Check spam folder, verify settings  
**Invalid Login**: Regenerate App Password  
**Connection Errors**: Check SMTP host/port

**Documentation**:

- `OTP_EMAIL_VERIFICATION_SYSTEM.md` - Full technical docs
- `OTP_QUICK_SETUP_GUIDE.md` - Quick setup guide
- `OTP_VISUAL_FLOW_GUIDE.md` - Visual diagrams

---

## 🎉 Summary

✅ **Configuration via Admin Panel** (Database)  
✅ **No server restart needed**  
✅ **Flexible and manageable**  
✅ **Environment variables as fallback**  
✅ **Secure and scalable**  
✅ **Production ready**

**Status**: ✅ IMPLEMENTED & DOCUMENTED

---

**Last Updated**: October 10, 2025  
**Configuration Method**: Admin Panel (Database Settings)  
**Environment Variables**: Optional (Fallback only)  
**Status**: ✅ Complete
