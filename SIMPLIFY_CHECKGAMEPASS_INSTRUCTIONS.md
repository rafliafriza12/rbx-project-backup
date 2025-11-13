# INSTRUKSI: Simplify checkGamepassExists Function

## Location

File: `/app/(public)/rbx5/page.tsx`
Function: `checkGamepassExists`
Lines: 470-716

## What to Replace

### HAPUS seluruh code lines 477-569 (bagian fetchMethods array dan retry loop)

Mulai dari baris ini:

```typescript
const expectedRobux = getGamepassAmount();

console.log(
  `🔍 Checking gamepass for universeId: ${selectedPlace.placeId}, expected price: ${expectedRobux} Robux`
);

// IMPORTANT: Roblox deprecated the /game-passes endpoint
// Now using alternative APIs that still work

// Try multiple methods to fetch gamepass data
const fetchMethods = [
  // Method 1: Roblox APIs endpoint (newer API)
  ...
  // Method 2: CORS Anywhere proxy (public proxy)
  ...
  // Method 3: AllOrigins proxy
  ...
  // Method 4: Fallback to our server API (NEW: User-based API)
  ...
];

let gamepassData;
let lastError;

// Try each method until one succeeds
for (let i = 0; i < fetchMethods.length; i++) {
  ...
}

// If all methods failed, allow manual bypass
if (!gamepassData) {
  ...
}

// Check if gamepass with expected price exists
const matchingGamepass = gamepassData.data?.find(
  (gamepass: any) => gamepass.price === expectedRobux
);

let data;
if (matchingGamepass) {
  ...
} else {
  ...
}
```

### GANTI dengan code SIMPLE ini:

```typescript
const expectedRobux = getGamepassAmount();

// Get userId from userInfo
const userId = userInfo?.id;

if (!userId) {
  toast.error(
    "User ID tidak ditemukan. Mohon cari username Roblox terlebih dahulu."
  );
  setIsCheckingGamepass(false);
  return;
}

console.log(
  `🔍 Checking gamepass for User ID: ${userId}, expected price: ${expectedRobux} Robux`
);

// Use NEW stable API endpoint (User-based GamePass API)
const response = await fetch(
  `/api/check-gamepass?userId=${userId}&expectedRobux=${expectedRobux}`
);

if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

const data = await response.json();

// Log result
if (data.success) {
  console.log(
    `✅ GamePass found! Name: ${data.gamepass?.name}, Price: ${data.gamepass?.price} Robux`
  );
} else {
  console.log(
    `❌ GamePass not found. Total gamepasses: ${
      data.allGamepasses?.length || 0
    }`
  );
}
```

## Hasil Akhir

Function akan menjadi sangat simple:

- ✅ Hanya 1 API call (ke server-side yang sudah reliable)
- ✅ No more multi-method fallback
- ✅ No more manual verification fallback
- ✅ Clean & maintainable code
- ✅ Fast execution (~500ms)

## Testing After Changes

1. Buka halaman Robux 5 Hari
2. Input username Roblox
3. Pilih place
4. Masukkan jumlah Robux
5. Klik "Cek GamePass"
6. **Expected**: ✅ Langsung dapat hasil dari API baru (cepat & reliable)

## Code Size Comparison

- **Before**: ~250 lines (multi-method fallback)
- **After**: ~40 lines (single API call)
- **Reduction**: ~84% smaller! 🎉

---

**Status**: Ready to implement
**Benefit**: Simpler, faster, more maintainable
