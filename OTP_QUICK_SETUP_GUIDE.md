# Quick Setup Guide - OTP Email Verification 🚀

**Setup Time**: ~5 minutes  
**Difficulty**: Easy ⭐  
**Configuration**: Via Admin Panel (Database Settings)

---

## ✅ Prerequisites

- ✅ Gmail account (or other SMTP provider)
- ✅ 2-Factor Authentication enabled
- ✅ Internet connection
- ✅ Admin access to dashboard

---

## 📋 Step-by-Step Setup

### 1. **Enable Gmail 2-Factor Authentication** (if not already)

1. Go to: https://myaccount.google.com/security
2. Scroll to "Signing in to Google"
3. Click "2-Step Verification"
4. Follow the setup wizard
5. Verify with your phone

⏱️ **Time**: ~2 minutes

---

### 2. **Generate Gmail App Password**

1. Visit: https://myaccount.google.com/apppasswords
2. You'll be asked to sign in again
3. Select:
   - **Select app**: Mail
   - **Select device**: Other (Custom name)
4. Type: `RBXNET` (or any name you prefer)
5. Click **Generate**
6. **Copy the 16-character password**  
   Example: `abcd efgh ijkl mnop`
7. **IMPORTANT**: Save this password, you'll need it for admin panel

⏱️ **Time**: ~1 minute

---

### 3. **Configure Email Settings in Admin Panel**

1. **Login to admin dashboard**:

   ```
   http://localhost:3000/admin/login
   ```

2. **Navigate to Settings**:

   - Click **Settings** or **Pengaturan** in sidebar
   - Or go to: `http://localhost:3000/admin/settings`

3. **Find Email Configuration section**

4. **Fill in the email settings**:

   ```
   Email Provider:     smtp (or gmail)
   Email Host:         smtp.gmail.com
   Email Port:         587
   Email User:         your-email@gmail.com
   Email Password:     abcd efgh ijkl mnop  (app password from step 2)
   Email From Name:    RBXNET
   Email From Address: noreply@rbxnet.com (optional)
   Email Secure:       false (unchecked for port 587)
   ```

5. **Click Save** or **Simpan**

⏱️ **Time**: ~2 minutes

---

### 4. **Test the Setup**

1. **Start development server** (if not running):

   ```bash
   pnpm dev
   ```

2. **Open registration page**:

   ```
   http://localhost:3000/register
   ```

3. **Fill the form**:

   - First Name: `Test`
   - Last Name: `User`
   - Email: Your email (that you'll check)
   - Phone: Any valid phone
   - Password: `test123456`
   - Confirm Password: `test123456`
   - ✅ Check terms agreement

4. **Click**: `LANJUT KE VERIFIKASI`

5. **Check your email**:

   - Should receive within 10 seconds
   - Subject: "Kode Verifikasi OTP - RBXNET"
   - Look for 6-digit code

6. **Enter OTP code**:

   - Type the 6 digits
   - Click: `Verifikasi & Daftar`

7. **Success!**:
   - Account created
   - Redirected to dashboard

⏱️ **Time**: ~2 minutes

---

## ✅ Verification Checklist

After testing, verify these:

- [ ] Email settings saved in admin panel
- [ ] Email received within 10 seconds
- [ ] Email design looks professional (dark theme, neon accents)
- [ ] OTP code is 6 digits
- [ ] OTP step UI shows correctly
- [ ] Can enter 6-digit code
- [ ] Auto-focus between inputs works
- [ ] Valid OTP creates account
- [ ] Invalid OTP shows error
- [ ] Can resend OTP after 60 seconds
- [ ] Account appears in database
- [ ] Redirected to dashboard after registration

---

## 🐛 Troubleshooting

### Problem 1: "Konfigurasi email belum diatur"

**Error message**: "Konfigurasi email belum diatur. Silakan hubungi admin."

**Cause**: Email settings not configured in database

**Solution**:

1. Login to admin panel
2. Go to Settings
3. Fill in Email Configuration section
4. Make sure **Email User** and **Email Password** are filled
5. Click Save

---

### Problem 2: Email not received

**Possible causes**:

1. ❌ Email settings incorrect in admin panel
2. ❌ App password wrong
3. ❌ Email in spam folder
4. ❌ Gmail account suspended

**Solutions**:

```bash
# Check database settings
# Login to admin panel → Settings → Email Configuration

# Verify these fields are filled:
- Email User: youremail@gmail.com
- Email Password: xxxx xxxx xxxx xxxx (16-char app password)
- Email Host: smtp.gmail.com
- Email Port: 587
```

**Still not working?**

- Check spam/junk folder in email
- Generate new app password
- Try with different Gmail account
- Check server logs for errors

---

### Problem 3: "Error sending email"

**Check server logs**:

```bash
# In terminal running `pnpm dev`, look for:
Error sending email: { ... }
```

**Common errors**:

#### "Invalid login"

```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Fix**:

- App password is wrong in admin panel
- Generate new one from Google
- Update in Settings
- Copy without spaces: `abcdefghijklmnop`

#### "Connection timeout"

```
Error: Connection timeout
```

**Fix**:

- Check internet connection
- Verify Email Host is correct: `smtp.gmail.com`
- Verify Email Port is correct: `587`

---

### Problem 4: Can't access admin panel

**Solution**:

1. Make sure you have admin account
2. Create admin user if needed:
   ```bash
   # Run in terminal or create via register then promote to admin in database
   ```
3. Login at: `http://localhost:3000/admin/login`

---

## 🔄 Alternative: Environment Variables (Fallback)

If you prefer using environment variables (not recommended, but supported as fallback):

### Update `.env.local`:

```bash
# SMTP Email Configuration (Fallback only)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
```

**Note**: Database settings will override environment variables if configured.

---

## 📊 Expected Results

### Successful Flow:

```
1. Admin configures email in Settings
   ✅ Email User filled
   ✅ Email Password filled
   ✅ Settings saved

2. User fills form
   ✅ All fields valid
   ✅ Email not registered yet

3. User clicks "LANJUT KE VERIFIKASI"
   ✅ System loads email settings from database
   ✅ OTP generated
   ✅ Email sent (2-5 seconds)
   ✅ UI switches to OTP step

4. User receives email
   ✅ Within 10 seconds
   ✅ Professional design
   ✅ 6-digit code visible
   ✅ Instructions clear

5. User enters OTP
   ✅ 6 input boxes
   ✅ Auto-focus works
   ✅ Can type numbers only

6. User clicks "Verifikasi & Daftar"
   ✅ OTP verified
   ✅ Account created
   ✅ Logged in automatically
   ✅ Redirected to dashboard

7. Check database
   ✅ User record exists
   ✅ Email matches
   ✅ Settings record has email config
```

---

## 📝 Quick Reference

### Admin Panel Settings:

```
Path: /admin/settings
Section: Email Configuration

Required fields:
- Email User (your-email@gmail.com)
- Email Password (16-char app password)
- Email Host (smtp.gmail.com)
- Email Port (587)
```

### API Endpoints:

```
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/register
```

### Key Files:

```
/app/api/auth/send-otp/route.ts  (loads settings from DB)
/app/api/auth/verify-otp/route.ts
/app/(auth)/register/page.tsx
/models/Settings.ts (email config schema)
```

### Important URLs:

```
Admin Panel: http://localhost:3000/admin
Settings: http://localhost:3000/admin/settings
Register: http://localhost:3000/register

Gmail 2FA: https://myaccount.google.com/security
App Passwords: https://myaccount.google.com/apppasswords
```

---

## ✅ Setup Complete!

Once everything is working:

1. ✅ Email settings configured in admin panel
2. ✅ Email sending works
3. ✅ OTP verification works
4. ✅ Account creation works
5. ✅ No errors in console

You're ready for production! 🎉

---

## 🚀 Next Steps

1. **Test thoroughly** with different emails
2. **Backup database** settings
3. **Document credentials** securely
4. **Set up monitoring** for email delivery
5. **Add rate limiting** to prevent abuse
6. **Consider Redis** for OTP storage (production)

---

## 📞 Need Help?

**Common Issues**: See troubleshooting section above  
**Gmail Issues**: https://support.google.com/accounts  
**Admin Panel Issues**: Check user role in database  
**Project Issues**: Check `OTP_EMAIL_VERIFICATION_SYSTEM.md`

---

**Last Updated**: October 10, 2025  
**Configuration**: Database Settings (Admin Panel)  
**Estimated Setup Time**: 5 minutes  
**Difficulty**: ⭐ Easy

1. **Start development server**:

   ```bash
   pnpm dev
   ```

2. **Open registration page**:

   ```
   http://localhost:3000/register
   ```

3. **Fill the form**:

   - First Name: `Test`
   - Last Name: `User`
   - Email: Your email (that you'll check)
   - Phone: Any valid phone
   - Password: `test123456`
   - Confirm Password: `test123456`
   - ✅ Check terms agreement

4. **Click**: `LANJUT KE VERIFIKASI`

5. **Check your email**:

   - Should receive within 10 seconds
   - Subject: "Kode Verifikasi OTP - RBXNET"
   - Look for 6-digit code

6. **Enter OTP code**:

   - Type the 6 digits
   - Click: `Verifikasi & Daftar`

7. **Success!**:
   - Account created
   - Redirected to dashboard

⏱️ **Time**: ~2 minutes

---

## ✅ Verification Checklist

After testing, verify these:

- [ ] Email received within 10 seconds
- [ ] Email design looks professional (dark theme, neon accents)
- [ ] OTP code is 6 digits
- [ ] OTP step UI shows correctly
- [ ] Can enter 6-digit code
- [ ] Auto-focus between inputs works
- [ ] Valid OTP creates account
- [ ] Invalid OTP shows error
- [ ] Can resend OTP after 60 seconds
- [ ] Account appears in database
- [ ] Redirected to dashboard after registration

---

## 🐛 Troubleshooting

### Problem 1: Email not received

**Possible causes**:

1. ❌ SMTP credentials wrong
2. ❌ App password incorrect
3. ❌ Email in spam folder
4. ❌ Gmail account suspended

**Solutions**:

```bash
# Check environment variables
cat .env.local | grep SMTP

# Should show:
# SMTP_EMAIL=youremail@gmail.com
# SMTP_PASSWORD=xxxx xxxx xxxx xxxx

# If empty or wrong, fix them
```

**Still not working?**

- Check spam/junk folder in email
- Generate new app password
- Try with different Gmail account
- Check server logs for errors

---

### Problem 2: "Error sending email"

**Check server logs**:

```bash
# In terminal running `pnpm dev`, look for:
Error sending email: { ... }
```

**Common errors**:

#### "Invalid login"

```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Fix**:

- App password is wrong
- Generate new one
- Copy without spaces: `abcdefghijklmnop`

#### "Connection timeout"

```
Error: Connection timeout
```

**Fix**:

- Check internet connection
- Check firewall settings
- Try different network

#### "Service not enabled"

```
Error: Please log in via your web browser
```

**Fix**:

- Open Gmail in browser
- Check for security alerts
- Approve the sign-in attempt

---

### Problem 3: OTP expired

**Error**: "Kode OTP sudah kadaluarsa"

**Cause**: OTP valid for 5 minutes only

**Solution**:

1. Click "Kirim Ulang Kode OTP"
2. Wait for new email
3. Enter new OTP quickly

---

### Problem 4: Can't click resend button

**Cause**: 60-second cooldown timer

**Solution**:

- Wait for countdown to finish
- "Kirim ulang dalam X detik" → "Kirim Ulang Kode OTP"
- Then you can click

---

## 🔄 Alternative: Using SendGrid (Free Tier)

If Gmail doesn't work, use SendGrid:

### 1. Sign up:

- Visit: https://sendgrid.com/
- Free tier: 100 emails/day

### 2. Get API Key:

- Dashboard → Settings → API Keys
- Create API Key
- Copy the key

### 3. Update `.env.local`:

```bash
# Remove or comment Gmail config
# SMTP_EMAIL=...
# SMTP_PASSWORD=...

# Add SendGrid config
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_EMAIL=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

### 4. Update API code:

In `/app/api/auth/send-otp/route.ts`, change:

```typescript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});
```

---

## 📊 Expected Results

### Successful Flow:

```
1. User fills form
   ✅ All fields valid
   ✅ Email not registered yet

2. User clicks "LANJUT KE VERIFIKASI"
   ✅ Form validated
   ✅ OTP generated
   ✅ Email sent (2-5 seconds)
   ✅ UI switches to OTP step

3. User receives email
   ✅ Within 10 seconds
   ✅ Professional design
   ✅ 6-digit code visible
   ✅ Instructions clear

4. User enters OTP
   ✅ 6 input boxes
   ✅ Auto-focus works
   ✅ Can type numbers only

5. User clicks "Verifikasi & Daftar"
   ✅ OTP verified
   ✅ Account created
   ✅ Logged in automatically
   ✅ Redirected to dashboard

6. Check database
   ✅ User record exists
   ✅ Email matches
   ✅ Password hashed
   ✅ createdAt timestamp
```

---

## 📝 Quick Reference

### Environment Variables:

```bash
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=16-char-app-password
```

### API Endpoints:

```
POST /api/auth/send-otp
POST /api/auth/verify-otp
POST /api/auth/register
```

### Key Files:

```
/app/api/auth/send-otp/route.ts
/app/api/auth/verify-otp/route.ts
/app/(auth)/register/page.tsx
.env.local
```

### Important URLs:

```
Gmail 2FA: https://myaccount.google.com/security
App Passwords: https://myaccount.google.com/apppasswords
SendGrid: https://sendgrid.com/
```

---

## ✅ Setup Complete!

Once everything is working:

1. ✅ Email sending works
2. ✅ OTP verification works
3. ✅ Account creation works
4. ✅ No errors in console

You're ready for production! 🎉

---

## 🚀 Next Steps

1. **Test thoroughly** with different emails
2. **Configure production SMTP** (SendGrid/Mailgun)
3. **Set up Redis** for OTP storage (optional but recommended)
4. **Add rate limiting** to prevent abuse
5. **Monitor email delivery** rates
6. **Set up alerts** for failures

---

## 📞 Need Help?

**Common Issues**: See troubleshooting section above  
**Gmail Issues**: https://support.google.com/accounts  
**SendGrid Issues**: https://docs.sendgrid.com  
**Project Issues**: Check `OTP_EMAIL_VERIFICATION_SYSTEM.md`

---

**Last Updated**: October 10, 2025  
**Estimated Setup Time**: 5 minutes  
**Difficulty**: ⭐ Easy
