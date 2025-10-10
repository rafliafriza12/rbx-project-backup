# OTP Registration Flow - Visual Guide 🎨

**Visual representation of the OTP email verification system**

---

## 📊 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER REGISTRATION FLOW                       │
│                      with OTP Verification                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   USER       │
│   ARRIVES    │
│   /register  │
└──────┬───────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  STEP 1: Registration Form                          │
│  ═══════════════════════════                        │
│  • First Name                                       │
│  • Last Name (Username)                             │
│  • Email                                            │
│  • Phone (with country code)                        │
│  • Password                                         │
│  • Confirm Password                                 │
│  • Terms Agreement ✓                                │
│                                                     │
│  [   LANJUT KE VERIFIKASI   ]  ← Submit           │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│  VALIDATION                                         │
│  • Password match?                                  │
│  • Terms agreed?                                    │
│  • All fields filled?                               │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│  API: POST /api/auth/send-otp                       │
│  • Check email not registered                       │
│  • Generate 6-digit OTP                             │
│  • Store OTP (email → {code, expiresAt})           │
│  • Send email via nodemailer                        │
└─────────────┬───────────────────────────────────────┘
              │
              ├─────────────────┐
              │                 │
              ▼                 ▼
    ┌─────────────┐   ┌─────────────────────────────┐
    │   SUCCESS   │   │  📧 EMAIL SENT TO USER      │
    │   Response  │   │  ═════════════════════       │
    └──────┬──────┘   │  Subject: Kode Verifikasi   │
           │          │  Content: HTML Template      │
           │          │  OTP Code: [123456]          │
           │          │  Valid: 5 minutes            │
           │          └─────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────┐
│  STEP 2: OTP Verification Screen                    │
│  ════════════════════════════                       │
│                                                     │
│  📧 Kode OTP telah dikirim ke email Anda           │
│  Cek inbox atau folder spam                         │
│                                                     │
│  Masukkan Kode OTP (6 digit):                       │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐            │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │            │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘            │
│  ↑ Auto-focus between boxes                         │
│                                                     │
│  ⏱️ Kode OTP berlaku selama 5 menit               │
│                                                     │
│  [  🛡️ VERIFIKASI & DAFTAR  ]  ← Submit          │
│                                                     │
│  Tidak menerima kode?                               │
│  • Kirim ulang dalam 60 detik (countdown)           │
│  • [Kirim Ulang Kode OTP] (after countdown)        │
│                                                     │
│  ← Kembali ke Form                                  │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│  USER ENTERS OTP                                    │
│  • Types 6 digits                                   │
│  • Clicks Verify button                             │
└─────────────┬───────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────┐
│  API: POST /api/auth/verify-otp                     │
│  • Retrieve stored OTP                              │
│  • Check OTP exists                                 │
│  • Check not expired (<5 min)                       │
│  • Compare with user input                          │
│  • Delete OTP if valid                              │
└─────────────┬───────────────────────────────────────┘
              │
              ├──────────────┬──────────────┐
              │              │              │
              ▼              ▼              ▼
        ┌─────────┐    ┌─────────┐    ┌──────────┐
        │ INVALID │    │ EXPIRED │    │  VALID   │
        │   OTP   │    │   OTP   │    │   OTP    │
        └────┬────┘    └────┬────┘    └────┬─────┘
             │              │              │
             ▼              ▼              ▼
        Show error     Show error     Continue ✓
             │              │              │
             └──────────────┴──────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │ API: POST /api/auth/register│
              │ • Hash password             │
              │ • Create user in DB         │
              │ • Generate JWT token        │
              │ • Set auth cookie           │
              └─────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │    REGISTRATION SUCCESS     │
              │    • Account created ✓      │
              │    • Logged in ✓            │
              │    • JWT token set ✓        │
              └─────────────┬───────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │   REDIRECT TO DASHBOARD     │
              │   🎉 Welcome to RBXNET!     │
              └─────────────────────────────┘
```

---

## 🎨 UI State Transitions

### State 1: Registration Form (Initial)

```
┌────────────────────────────────────────────────────┐
│  RBXNET                               [X] Close    │
│                                                    │
│  💎 Bergabung dengan RBXNET                        │
│  Platform terpercaya untuk jasa Robux...          │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  BUAT AKUN BARU                              │ │
│  │  Lengkapi data diri Anda untuk mendaftar    │ │
│  │                                              │ │
│  │  [  Sign in with Google 🔒  ]               │ │
│  │                                              │ │
│  │  ────────────── atau ──────────────          │ │
│  │                                              │ │
│  │  Nama Lengkap:  [________________]          │ │
│  │  Username:      [________________]          │ │
│  │  Email:         [________________]          │ │
│  │  Phone:  +62 ▼  [________________]          │ │
│  │  Password:      [________________] 👁       │ │
│  │  Confirm:       [________________] 👁       │ │
│  │                                              │ │
│  │  ☑ Saya menyetujui Syarat dan Ketentuan    │ │
│  │                                              │ │
│  │  [    LANJUT KE VERIFIKASI    ] ← Click    │ │
│  │                                              │ │
│  │  Sudah punya akun? Masuk Sekarang           │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
    showOTPStep = false
```

### State 2: OTP Verification (After Submit)

```
┌────────────────────────────────────────────────────┐
│  RBXNET                               [X] Close    │
│                                                    │
│  💎 Bergabung dengan RBXNET                        │
│  Platform terpercaya untuk jasa Robux...          │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │  VERIFIKASI EMAIL                            │ │
│  │  Masukkan kode OTP yang telah dikirim ke    │ │
│  │  user@example.com                            │ │
│  │                                              │ │
│  │  ┌────────────────────────────────────────┐ │ │
│  │  │ 📧 Kode OTP telah dikirim              │ │ │
│  │  │ Cek inbox atau folder spam             │ │ │
│  │  └────────────────────────────────────────┘ │ │
│  │                                              │ │
│  │  Masukkan Kode OTP (6 digit):               │ │
│  │  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐      │ │
│  │  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │      │ │
│  │  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘      │ │
│  │                                              │ │
│  │  ┌────────────────────────────────────────┐ │ │
│  │  │ ⏱️ Kode OTP berlaku selama 5 menit    │ │ │
│  │  └────────────────────────────────────────┘ │ │
│  │                                              │ │
│  │  [  🛡️ VERIFIKASI & DAFTAR  ] ← Click     │ │
│  │                                              │ │
│  │  Tidak menerima kode OTP?                   │ │
│  │  Kirim ulang dalam 45 detik                 │ │
│  │  (or: [Kirim Ulang Kode OTP] after timer)  │ │
│  │                                              │ │
│  │  ← Kembali ke Form                          │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
    showOTPStep = true
```

---

## 📧 Email Template Structure

```
┌─────────────────────────────────────────────────────┐
│                    EMAIL VIEW                        │
│                 Dark Theme Design                    │
└─────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════╗
║                                                   ║
║                      💎                           ║
║              [Gradient Logo Box]                  ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║         Halo, John! 👋                            ║
║                                                   ║
║    Terima kasih telah mendaftar di RBXNET        ║
║                                                   ║
║   ┌─────────────────────────────────────────┐    ║
║   │   Kode Verifikasi OTP Anda              │    ║
║   │                                         │    ║
║   │         1  2  3  4  5  6               │    ║
║   │      [LARGE PINK NUMBERS]               │    ║
║   │                                         │    ║
║   │      ⏱️ Berlaku selama 5 menit         │    ║
║   └─────────────────────────────────────────┘    ║
║                                                   ║
║   ┌─────────────────────────────────────────┐    ║
║   │ 📌 Petunjuk:                            │    ║
║   │  • Masukkan kode OTP di halaman...     │    ║
║   │  • Jangan bagikan kode ini...          │    ║
║   │  • Kode akan kadaluarsa dalam...       │    ║
║   └─────────────────────────────────────────┘    ║
║                                                   ║
║   ┌─────────────────────────────────────────┐    ║
║   │ ⚠️ Peringatan Keamanan:                │    ║
║   │ Tim RBXNET tidak akan pernah...        │    ║
║   └─────────────────────────────────────────┘    ║
║                                                   ║
║   Butuh bantuan? Hubungi kami:                   ║
║   📧 support@rbxnet.com                          ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║       © 2025 RBXNET. All rights reserved.        ║
║    Platform terpercaya untuk jasa Robux...       ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

---

## 🔄 OTP Input Behavior

### Initial State:

```
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│   │ │   │ │   │ │   │ │   │ │   │
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘
  ↑
Focus on first box
```

### User types "1":

```
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ 1 │ │   │ │   │ │   │ │   │ │   │
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘
        ↑
    Auto-focus next
```

### Continues typing "2", "3", "4", "5", "6":

```
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘
                                  ↑
                          All filled, ready to verify
```

### Backspace on empty box:

```
User at box 4 (empty), presses Backspace
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ 1 │ │ 2 │ │ 3 │ │   │ │   │ │   │
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘
              ↑
        Goes back to box 3
```

---

## 🔐 Data Flow: OTP Storage

### In-Memory Map Structure:

```
otpStore (Map)
├─ "user1@example.com" → { code: "123456", expiresAt: 1696945200000 }
├─ "user2@example.com" → { code: "789012", expiresAt: 1696945260000 }
└─ "user3@example.com" → { code: "345678", expiresAt: 1696945320000 }

Auto-cleanup every 60 seconds:
  → Remove entries where expiresAt < Date.now()
```

### Timeline:

```
Time: 12:00:00  →  OTP sent
  otpStore.set("user@example.com", {
    code: "123456",
    expiresAt: 12:05:00  // +5 minutes
  })

Time: 12:02:30  →  User enters OTP
  ✓ OTP found
  ✓ Not expired (12:02:30 < 12:05:00)
  ✓ Code matches
  → Delete from store
  → Register user

Time: 12:06:00  →  Late verification attempt
  ✓ OTP found
  ✗ Expired! (12:06:00 > 12:05:00)
  → Delete from store
  → Show error: "Kode OTP sudah kadaluarsa"
```

---

## 🎯 Error Handling Flow

```
┌─────────────────┐
│  User Action    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Possible Error Scenarios:          │
├─────────────────────────────────────┤
│  1. Email already registered        │
│  2. Network error (send OTP)        │
│  3. Invalid OTP code                │
│  4. OTP expired                     │
│  5. OTP not found                   │
│  6. Network error (verify)          │
│  7. Email sending failed            │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│  Error Display:                      │
│  ┌────────────────────────────────┐  │
│  │ ⚠️ [Error Message]             │  │
│  │ • User-friendly description    │  │
│  │ • Action button if needed      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘

Examples:

1. Email already registered:
   ┌─────────────────────────────────────┐
   │ ⚠️ Email sudah terdaftar            │
   │ Gunakan email lain atau login      │
   └─────────────────────────────────────┘

2. Invalid OTP:
   ┌─────────────────────────────────────┐
   │ ⚠️ Kode OTP tidak valid             │
   │ Periksa kembali email Anda         │
   └─────────────────────────────────────┘

3. OTP expired:
   ┌─────────────────────────────────────┐
   │ ⚠️ Kode OTP sudah kadaluarsa        │
   │ [Kirim Ulang Kode OTP] ← Button    │
   └─────────────────────────────────────┘
```

---

## ⏱️ Timer Countdown Animation

```
Initial state (after OTP sent):
┌────────────────────────────────────┐
│ Tidak menerima kode OTP?           │
│ Kirim ulang dalam 60 detik         │
└────────────────────────────────────┘
canResendOTP = false

After 30 seconds:
┌────────────────────────────────────┐
│ Tidak menerima kode OTP?           │
│ Kirim ulang dalam 30 detik         │
└────────────────────────────────────┘
canResendOTP = false

After 60 seconds:
┌────────────────────────────────────┐
│ Tidak menerima kode OTP?           │
│ [Kirim Ulang Kode OTP] ← Enabled  │
└────────────────────────────────────┘
canResendOTP = true

After clicking resend:
┌────────────────────────────────────┐
│ ✓ Kode OTP baru telah dikirim!    │
│ Kirim ulang dalam 60 detik         │
└────────────────────────────────────┘
Timer resets, canResendOTP = false
```

---

## 🎨 Color-Coded Components

```
┌────────────────────────────────────────────────────┐
│  Component Color Guide                             │
├────────────────────────────────────────────────────┤
│  Background:    #0f172a (primary-900) - Dark navy │
│  Cards:         #1e293b (primary-800) - Lighter   │
│  Borders:       rgba(255,255,255,0.1) - Subtle    │
│                                                    │
│  Success:       #10b981 (emerald-500) - Green     │
│  Warning:       #f59e0b (amber-500) - Orange      │
│  Error:         #ef4444 (red-500) - Red           │
│  Info:          #3b82f6 (blue-500) - Blue         │
│                                                    │
│  Accent 1:      #ec4899 (neon-pink) - Pink        │
│  Accent 2:      #8b5cf6 (neon-purple) - Purple    │
│  Accent 3:      #f1f5f9 (primary-100) - Light     │
└────────────────────────────────────────────────────┘

Email Status Banner:
┌─────────────────────────────────────────────┐
│ 📧 Kode OTP telah dikirim                   │ ← Blue bg/border
│ Cek inbox atau folder spam                  │
└─────────────────────────────────────────────┘

Timer Warning:
┌─────────────────────────────────────────────┐
│ ⏱️ Kode OTP berlaku selama 5 menit         │ ← Amber bg/border
└─────────────────────────────────────────────┘

Error Message:
┌─────────────────────────────────────────────┐
│ ⚠️ Kode OTP tidak valid                    │ ← Red bg/border
└─────────────────────────────────────────────┘

Success (after resend):
┌─────────────────────────────────────────────┐
│ ✓ Kode OTP baru telah dikirim!             │ ← Green bg/border
└─────────────────────────────────────────────┘
```

---

## 🔄 Complete User Journey Map

```
START
  ↓
[Homepage] → Click "DAFTAR" → [Register Page]
  ↓
STEP 1: Fill Registration Form
  ├─ Option A: Google OAuth → Skip to Dashboard
  └─ Option B: Manual Form
       ↓
       Fill all fields
       ↓
       Check terms ✓
       ↓
       Click "LANJUT KE VERIFIKASI"
       ↓
STEP 2: Send OTP
       ↓
       Validate form
       ↓
       Check email available
       ↓
       Generate OTP (123456)
       ↓
       Send email
       ↓
       Show OTP screen
       ↓
STEP 3: Email Delivery
       ↓
       User checks inbox (2-10 seconds)
       ↓
       Reads OTP code from email
       ↓
STEP 4: Enter OTP
       ↓
       Type 6 digits: [1][2][3][4][5][6]
       ↓
       Click "VERIFIKASI & DAFTAR"
       ↓
STEP 5: Verify OTP
       ↓
       Check OTP valid
       ↓
       Check not expired
       ↓
STEP 6: Create Account
       ↓
       Hash password
       ↓
       Save to database
       ↓
       Generate JWT
       ↓
       Set auth cookie
       ↓
COMPLETE
       ↓
[Dashboard] - Welcome! 🎉
```

---

## 📊 State Management Diagram

```
React Component State:

┌────────────────────────────────────────────┐
│  RegisterPage Component                    │
├────────────────────────────────────────────┤
│                                            │
│  Form Data:                                │
│  • firstName, lastName, email, phone       │
│  • password, confirmPassword               │
│  • agreeToTerms                            │
│                                            │
│  UI States:                                │
│  • showOTPStep: boolean                    │
│  • isLoading: boolean                      │
│  • showPassword: boolean                   │
│  • showConfirmPassword: boolean            │
│                                            │
│  OTP States:                               │
│  • otpCode: string[6]                      │
│  • otpError: string                        │
│  • isVerifyingOTP: boolean                 │
│  • canResendOTP: boolean                   │
│  • resendTimer: number                     │
│                                            │
│  Error States:                             │
│  • error: string (form errors)             │
│  • otpError: string (OTP errors)           │
└────────────────────────────────────────────┘

State Transitions:

Initial:
  showOTPStep = false
  otpCode = ["","","","","",""]
  canResendOTP = false
  resendTimer = 60

After form submit:
  showOTPStep = true
  isLoading = false
  canResendOTP = false
  resendTimer = 60 → countdown starts

After OTP input:
  otpCode = ["1","2","3","4","5","6"]

After verify click:
  isVerifyingOTP = true

After success:
  → Redirect to dashboard

After error:
  otpError = "Error message"
  isVerifyingOTP = false
```

---

**Visual Guide Complete!** 🎉

This document provides visual representation of:

- ✅ Complete flow diagrams
- ✅ UI state transitions
- ✅ Email template structure
- ✅ OTP input behavior
- ✅ Data flow visualization
- ✅ Error handling paths
- ✅ Timer countdown animations
- ✅ Color-coded components
- ✅ User journey mapping
- ✅ State management diagrams

Use this guide for:

- **Understanding** the complete system
- **Debugging** issues
- **Training** new developers
- **Presenting** to stakeholders
- **Documentation** reference

---

**Last Updated**: October 10, 2025  
**Created By**: RBXNET Development Team
