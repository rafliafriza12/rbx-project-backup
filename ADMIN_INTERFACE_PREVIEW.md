# 📸 Preview Interface Admin - Email Management

## 🎯 **Admin Settings - Tab Email Settings**

```
┌──────────────────────────────────────────────────────────────────┐
│ ⚙️ RBX Admin Settings                                           │
├──────────────────────────────────────────────────────────────────┤
│ [General Settings] [Payment Gateway] [API External] [📧 Email Settings] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 📧 Konfigurasi Email Invoice                                     │
│ Atur pengiriman email invoice otomatis untuk customer           │
│                                                                  │
│ Notifikasi Email                                    [ ●────○ ]   │
│ Aktifkan pengiriman email invoice dan notifikasi                │
│                                                                  │
│ Provider Email: [Gmail ▼]                                       │
│                                                                  │
│ SMTP Host: [smtp.gmail.com            ] Port: [587     ]       │
│                                                                  │
│ Email User: [your-email@gmail.com     ]                        │
│ Email Password: [••••••••••••••••••••  ]                       │
│ 💡 Untuk Gmail, gunakan App Password bukan password biasa      │
│                                                                  │
│ Nama Pengirim: [RBX Store             ]                        │
│ Email Pengirim: [noreply@rbxstore.com  ]                       │
│                                                                  │
│ SSL/TLS Secure                                      [ ○────● ]   │
│ Aktifkan untuk port 465 (SSL). Nonaktifkan untuk port 587      │
│                                                                  │
│ ───────────────────────────────────────────────────────────────  │
│ 🧪 Test Konfigurasi Email                                       │
│ [test@example.com              ] [📧 Test Email]               │
│                                                                  │
│ ✅ Test email berhasil dikirim ke test@example.com             │
│                                                                  │
│ 📋 Petunjuk Setup Gmail:                                        │
│ 1. Buka Google Account → Security → 2-Step Verification        │
│ 2. Scroll ke bawah dan pilih "App passwords"                   │
│ 3. Generate app password untuk "Mail"                          │
│ 4. Gunakan app password tersebut, bukan password Google biasa  │
│ 5. Host: smtp.gmail.com, Port: 587, Secure: false             │
│                                                                  │
│                                    [💾 Simpan Konfigurasi]     │
└──────────────────────────────────────────────────────────────────┘
```

## 📧 **Admin Email Management Page**

```
┌──────────────────────────────────────────────────────────────────┐
│ 📧 Email Invoice Management                                      │
│ Kirim ulang email invoice ke customer                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ℹ️  Kapan menggunakan fitur ini?                                │
│ • Customer kehilangan email invoice                             │
│ • Customer mengganti email address                              │
│ • Email gagal terkirim saat transaksi dibuat                   │
│ • Testing template email invoice                                │
│                                                                  │
│ Cari Transaksi Berdasarkan:                                    │
│ ● Invoice ID    ○ Transaction ID                               │
│                                                                  │
│ Invoice ID *                    Email Tujuan (Opsional)        │
│ [INV-1234567890-ABC123    ]    [customer@example.com     ]    │
│ Format: INV-timestamp-random    Kosongkan untuk email dari db  │
│                                                                  │
│ [🚀 Kirim Email Invoice] [Clear Form]                          │
│                                                                  │
│ ───────────────────────────────────────────────────────────────  │
│ 📋 Cara Menggunakan:                                            │
│                                                                  │
│ 1. Cari Invoice ID:              2. Override Email (Opsional): │
│ • Buka halaman Transactions      • Kosongkan untuk email dari  │
│ • Copy Invoice ID                  database                     │
│ • Paste ke form di atas          • Isi jika customer ganti     │
│                                    email                        │
│                                                                  │
│ ❓ FAQ:                                                         │
│ ▶ Email tidak terkirim, apa yang harus dicek?                  │
│ ▶ Bisakah mengirim ke email yang berbeda dari transaksi?       │
│ ▶ Apakah template email bisa dikustomisasi?                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## 📱 **Admin Sidebar (Updated)**

```
┌─────────────────────┐
│ RBX Admin    [≡]    │
├─────────────────────┤
│ Welcome, Admin      │
│ 👤 admin@rbx.com    │
├─────────────────────┤
│ 📊 Dashboard        │
│ 📦 Transaksi        │
│ 👥 Users            │
│ 🎮 Produk Robux     │
│ 🎯 Gamepass         │
│ 🚀 Jasa Joki        │
│ 📧 Email Management │ ← NEW!
│ ⚙️ Pengaturan       │
├─────────────────────┤
│ 👤 Profile          │
│ 🚪 Logout           │
└─────────────────────┘
```

## 📧 **Email Invoice Template Preview**

```
┌──────────────────────────────────────────────────────────────────┐
│                        📧 EMAIL INVOICE                          │
├──────────────────────────────────────────────────────────────────┤
│                          RBX STORE                               │
│                 Invoice Pembelian Robux                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Invoice ID: #INV-1694621234567-ABC123                           │
│ Tanggal: 13 September 2025, 14:30                              │
│ Status: [🟡 MENUNGGU PEMBAYARAN]                                │
│                                                                  │
│ 📋 Informasi Customer                                           │
│ Nama: John Doe                                                  │
│ Email: john@example.com                                         │
│ Telepon: +6281234567890                                         │
│                                                                  │
│ 🎮 Informasi Akun Roblox                                        │
│ Username: JohnDoe123                                            │
│ Password: ••••••••••                                            │
│ Data akun Anda aman dan tidak akan disalahgunakan.             │
│                                                                  │
│ 📦 Detail Pesanan                                               │
│ ┌────────────┬──────────┬─────────┬────────────┬──────────────┐ │
│ │ Item       │ Layanan  │ Qty     │ Harga      │ Total        │ │
│ ├────────────┼──────────┼─────────┼────────────┼──────────────┤ │
│ │ Robux      │ Robux    │ 1,000   │ Rp140,000  │ Rp140,000    │ │
│ │ Transfer   │          │         │            │              │ │
│ ├────────────┴──────────┴─────────┴────────────┼──────────────┤ │
│ │                    TOTAL PEMBAYARAN          │ Rp140,000    │ │
│ └──────────────────────────────────────────────┴──────────────┘ │
│                                                                  │
│ 💳 Instruksi Pembayaran                                         │
│ Silakan lakukan pembayaran untuk melanjutkan proses pesanan:    │
│ • Klik tombol "Bayar Sekarang" di bawah ini                    │
│ • Pilih metode pembayaran yang Anda inginkan                   │
│ • Ikuti instruksi pembayaran dari payment gateway              │
│                                                                  │
│                    [💳 Bayar Sekarang]                         │
│                                                                  │
│ ⚠️ Penting untuk Diperhatikan:                                 │
│ • Simpan invoice ini sebagai bukti transaksi                   │
│ • Jangan bagikan informasi akun Roblox kepada orang lain      │
│ • Proses pesanan akan dimulai setelah pembayaran dikonfirmasi  │
│ • Hubungi customer service jika ada pertanyaan atau kendala    │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│                          RBX STORE                               │
│        Platform jual beli Robux, Gamepass, dan Jasa Joki        │
│                                                                  │
│ 📧 contact@rbxstore.com  📱 +628123456789  💬 Discord Support    │
│                                                                  │
│            © 2025 RBX Store. Semua hak dilindungi.              │
└──────────────────────────────────────────────────────────────────┘
```

## 🎯 **User Flow:**

### **Setup (Admin):**

1. Login admin → Settings → Email Settings tab
2. Pilih Gmail → Isi credentials → Test email → Save
3. Email Management menu tersedia di sidebar

### **Auto Email (Customer):**

1. Customer buat transaksi → Email invoice terkirim otomatis
2. Customer terima email professional dengan payment button
3. Customer klik bayar → redirect ke payment gateway

### **Resend Email (Admin):**

1. Customer komplain email hilang
2. Admin → Email Management → Input Invoice ID → Send
3. Customer terima email ulang

### **Monitoring:**

- Console logs untuk tracking
- Test email functionality
- Error handling yang robust

---

**Status: ✅ READY TO USE!**  
**Setup Time**: 15 menit  
**Features**: Professional template, Auto-send, Resend capability, Test functionality
