# 🔄 Server Restart Required

## ⚠️ Important: Model Update Detected

Perubahan telah dilakukan pada **Transaction Model** dengan menambahkan field baru:

- `paymentMethodId` (ObjectId reference to PaymentMethod)
- `paymentMethodName` (String)

## 🚨 Error yang Mungkin Terjadi

Jika server tidak di-restart, Anda akan mendapatkan error:

```
StrictPopulateError: Cannot populate path `paymentMethodId` because it is not in your schema.
```

Ini terjadi karena **Mongoose meng-cache model lama** di memory.

## ✅ Solusi: Restart Development Server

### Cara 1: Manual Restart

```bash
# Stop server (Ctrl+C di terminal yang menjalankan server)
# Kemudian jalankan lagi:
npm run dev
```

### Cara 2: Restart dari Terminal Baru

```bash
cd /home/whoami/Downloads/rbx-project/rbx-project/frontend

# Kill existing process
pkill -f "next dev"

# Start server again
npm run dev
```

### Cara 3: Restart dengan Script

```bash
# Di folder frontend
./restart-dev.sh
```

## 🎯 Setelah Restart

Server akan:

1. ✅ Load Transaction model dengan field baru (`paymentMethodId`, `paymentMethodName`)
2. ✅ API endpoints akan berfungsi normal
3. ✅ Admin transaction management akan menampilkan payment method
4. ✅ Tidak ada lagi error "Cannot populate path"

## 🧪 Cara Verifikasi

Setelah server restart, coba:

1. **Akses Admin Transactions Page**

   ```
   http://localhost:3000/admin/transactions
   ```

2. **Check Console Log**

   ```
   # Seharusnya tidak ada error StrictPopulateError
   # Transaksi akan ter-load dengan normal
   ```

3. **Create New Transaction**

   ```
   # Buat transaksi baru dari checkout
   # Payment method akan tersimpan
   ```

4. **Check Database (Optional)**

   ```javascript
   // Di MongoDB shell atau Compass
   db.transactions.findOne({}, { paymentMethodId: 1, paymentMethodName: 1 })

   // Seharusnya melihat field baru:
   {
     _id: ObjectId("..."),
     paymentMethodId: ObjectId("..."),
     paymentMethodName: "QRIS"
   }
   ```

## 📝 Catatan Penting

- ❌ **Jangan hapus** file `.next` secara manual (Next.js akan rebuild otomatis)
- ✅ **Restart server** setiap kali mengubah model/schema
- ✅ **Check terminal output** untuk memastikan tidak ada error saat startup
- ✅ **Clear browser cache** jika masih ada masalah di frontend

## 🐛 Troubleshooting

### Error masih muncul setelah restart?

1. **Hard restart:**

   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check Mongoose connection:**

   ```bash
   # Di terminal server, cari log:
   "MongoDB connected successfully"
   ```

3. **Check model file:**

   ```bash
   # Pastikan file models/Transaction.ts sudah disimpan
   cat models/Transaction.ts | grep -A 5 "paymentMethodId"
   ```

4. **Restart MongoDB (jika perlu):**

   ```bash
   # Jika menggunakan local MongoDB
   sudo systemctl restart mongodb

   # Atau Docker
   docker restart mongodb-container
   ```

## ✅ Status: Ready for Restart

Model sudah di-update. Silakan restart server development untuk menggunakan fitur baru!

---

**Last Updated**: 2024-01-01  
**Status**: ⚠️ Requires Server Restart
