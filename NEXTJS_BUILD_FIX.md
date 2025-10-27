# Next.js Build Fix - API Routes Prerendering Issue

## 🐛 Original Problem

Build error terjadi:

```
Error occurred prerendering page "/api/auth/register".
PageNotFoundError: Cannot find module for page: /api/auth/register/route
```

**Root Cause:**

- Next.js 15 mencoba pre-render API routes sebagai static pages
- `trailingSlash: true` dalam config menyebabkan routing conflicts
- API routes seharusnya dynamic, tidak di-prerender

---

## ✅ Solutions Applied

### 1. **Remove `trailingSlash` Config** (`next.config.ts`)

**Before:**

```typescript
const nextConfig: NextConfig = {
  // ...
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // ...
};
```

**After:**

```typescript
const nextConfig: NextConfig = {
  // ...
  // trailingSlash: true,  // Removed
  // skipTrailingSlashRedirect: true,  // Removed
  // ...
};
```

**Why:** `trailingSlash: true` dapat menyebabkan Next.js mencoba pre-render API routes sebagai halaman static.

---

### 2. **Add Dynamic Config to API Routes** (`app/api/auth/register/route.ts`)

**Added:**

```typescript
// Force dynamic rendering for this API route
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
```

**Why:** Explicitly tell Next.js that this route should NEVER be statically generated.

---

### 3. **Create Global API Config** (`app/api/route.ts`)

**Created new file:**

```typescript
// Force all API routes to be dynamic (no static generation)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
```

**Why:** Apply dynamic rendering config to all API routes at once.

---

## 🔧 Build Commands

### Development:

```bash
pnpm dev
```

### Production Build:

```bash
pnpm build
```

### If build fails with Google Fonts timeout:

```bash
# This is network issue, not code issue
# Try:
1. Check internet connection
2. Use VPN if Google Fonts blocked
3. Or disable fonts temporarily in app/layout.tsx
```

---

## 📋 Next.js 15 API Route Best Practices

### All API routes should export:

```typescript
export const dynamic = "force-dynamic"; // Don't cache
export const runtime = "nodejs"; // Use Node.js runtime
```

### Why?

- API routes handle dynamic data (database queries, user auth)
- Should NEVER be statically generated
- Need full Node.js runtime for database connections

---

## 🧪 Testing

### 1. **Check if API routes work:**

```bash
# Start dev server
pnpm dev

# Test API endpoint
curl http://localhost:3000/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### 2. **Check build succeeds:**

```bash
pnpm build

# Should see:
# ✓ Compiled successfully
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization
```

### 3. **Check production server:**

```bash
pnpm start

# Test API in production mode
curl http://localhost:3000/api/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## ⚠️ Common Build Errors

### 1. **Google Fonts Timeout**

```
Failed to fetch `Geist` from Google Fonts.
```

**Solution:**

- Check internet connection
- Use VPN if needed
- Or comment out fonts temporarily in `app/layout.tsx`

### 2. **Duplicate Schema Index Warning**

```
[MONGOOSE] Warning: Duplicate schema index on {"userId":1}
```

**Solution:**

- Warning only, doesn't break build
- Can be fixed by removing duplicate index definitions in models
- Safe to ignore for now

### 3. **Prerender Error on API Routes**

```
Error occurred prerendering page "/api/..."
```

**Solution:**

- Already fixed with `export const dynamic = 'force-dynamic'`
- Ensure all API routes have this export

---

## 📝 Configuration Summary

| File                             | Change                          | Purpose                 |
| -------------------------------- | ------------------------------- | ----------------------- |
| `next.config.ts`                 | Remove `trailingSlash`          | Fix routing conflicts   |
| `app/api/route.ts`               | Add `dynamic = 'force-dynamic'` | Global API config       |
| `app/api/auth/register/route.ts` | Add `dynamic` export            | Force dynamic rendering |

---

## ✅ Result

✅ API routes no longer prerendered
✅ Build succeeds without route errors
✅ All API endpoints work in production
✅ No static generation conflicts

---

**Fixed:** 2025-10-27  
**Issue:** Next.js 15 prerendering API routes  
**Solution:** Remove trailingSlash, add dynamic exports  
**Status:** ✅ RESOLVED
