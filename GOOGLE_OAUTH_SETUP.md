# Google OAuth Setup untuk RobuxID

## Instalasi

Package yang diperlukan sudah diinstall:

```bash
pnpm add @react-oauth/google
```

## Konfigurasi Google OAuth

### 1. Buat Project di Google Cloud Console

1. Kunjungi [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih project yang sudah ada
3. Aktifkan Google+ API dan Google OAuth2 API

### 2. Buat OAuth 2.0 Client ID

1. Pergi ke **APIs & Services** > **Credentials**
2. Klik **Create Credentials** > **OAuth client ID**
3. Pilih **Web application**
4. Isi nama aplikasi
5. Tambahkan **Authorized JavaScript origins**:
   - `http://localhost:3000` (untuk development)
   - `https://yourdomain.com` (untuk production)
6. Tambahkan **Authorized redirect URIs**:
   - `http://localhost:3000` (untuk development)
   - `https://yourdomain.com` (untuk production)

### 3. Update Environment Variables

Tambahkan Google Client ID ke file `.env.local`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-actual-google-client-id-here
```

**Ganti `your-actual-google-client-id-here` dengan Client ID yang didapat dari Google Cloud Console**

## Fitur yang Diimplementasi

### 1. Google Login untuk Login Page

- Tombol "Masuk dengan Google"
- Otomatis redirect setelah login berhasil
- Error handling untuk login gagal

### 2. Google Login untuk Register Page

- Tombol "Daftar dengan Google"
- Otomatis membuat akun baru jika belum ada
- Otomatis login jika akun sudah ada

### 3. Integrasi Database

- Field `googleId` dan `profilePicture` ditambahkan ke User model
- Field `phone` dan `password` tidak wajib untuk akun Google
- Akun Google otomatis ter-verified

## Komponen yang Dibuat

### GoogleAuthProvider

Provider yang membungkus aplikasi dengan Google OAuth context.

### GoogleLoginButton

Komponen reusable untuk tombol Google login/register dengan props:

- `onSuccess`: callback ketika login berhasil
- `onError`: callback ketika login gagal
- `text`: teks yang ditampilkan di tombol
- `width`: lebar tombol ("full" atau "auto")

## API Routes

### `/api/auth/google`

Endpoint untuk menangani autentikasi Google OAuth:

- Menerima data user dari Google
- Membuat akun baru atau login ke akun yang sudah ada
- Mengembalikan JWT token

## Cara Penggunaan

### Di Login Page:

```tsx
<GoogleLoginButton
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  text="Masuk dengan Google"
  width="full"
/>
```

### Di Register Page:

```tsx
<GoogleLoginButton
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  text="Daftar dengan Google"
  width="full"
/>
```

## Testing

1. Pastikan Google Client ID sudah diset di `.env.local`
2. Jalankan aplikasi: `pnpm dev`
3. Buka halaman login/register
4. Klik tombol Google OAuth
5. Login dengan akun Google
6. Verifikasi user berhasil login dan data tersimpan di database

## Catatan Penting

- **Client ID harus valid** dan sesuai dengan domain yang digunakan
- Untuk production, pastikan menggunakan HTTPS
- Google OAuth hanya bekerja di domain yang sudah didaftarkan
- Jangan commit Client ID ke repository public
