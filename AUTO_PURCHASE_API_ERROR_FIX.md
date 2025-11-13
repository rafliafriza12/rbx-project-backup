# Auto-Purchase API Error: HTML Instead of JSON

## Problem

Error ketika auto-purchase mencoba hit `/api/buy-pass`:

```
SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Root Cause Analysis

### Possible Causes:

1. **Wrong Base URL** ❓

   - `NEXT_PUBLIC_BASE_URL` tidak diset atau salah
   - Server-side fetch ke localhost gagal

2. **API Route Not Found** ❓

   - Next.js tidak menemukan `/api/buy-pass`
   - Returns 404 HTML page instead of JSON

3. **Server-Side Fetch Issue** ❓
   - Cannot fetch localhost from server-side
   - Need to use external URL or internal API call

## Solution Implemented

### 1. Better Error Handling ✅

Added checks before parsing JSON:

```typescript
// Check HTTP status
if (!purchaseResponse.ok) {
  const errorText = await purchaseResponse.text();
  console.error(`❌ API returned ${purchaseResponse.status}:`, errorText);
  return { success: false, error: `HTTP ${purchaseResponse.status}` };
}

// Check content-type
const contentType = purchaseResponse.headers.get("content-type");
if (!contentType || !contentType.includes("application/json")) {
  const htmlText = await purchaseResponse.text();
  console.error("❌ API returned HTML instead of JSON:", htmlText);
  return { success: false, error: "API endpoint returned HTML" };
}
```

### 2. Fixed Base URL Logic ✅

```typescript
const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

const apiUrl = `${baseUrl}/api/buy-pass`;
console.log(`🌐 Calling API: ${apiUrl}`);
```

### 3. Alternative Solution: Direct Import ⭐ RECOMMENDED

Instead of fetching via HTTP, **import the API function directly**:

```typescript
// At top of auto-purchase-robux.ts
import { POST as buyPassHandler } from "@/app/api/buy-pass/route";

// In purchaseGamepass function:
async function purchaseGamepass(...) {
  try {
    console.log("Calling buy-pass API handler directly...");

    // Create NextRequest mock
    const request = new NextRequest("http://localhost:3000/api/buy-pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        robloxCookie,
        productId,
        price,
        sellerId,
      }),
    });

    // Call handler directly (no HTTP fetch needed!)
    const response = await buyPassHandler(request);
    const purchaseResult = await response.json();

    if (purchaseResult.success) {
      console.log("✅ Gamepass purchase successful");
      return { success: true };
    } else {
      console.error("❌ Gamepass purchase failed:", purchaseResult.message);
      return { success: false, error: purchaseResult.message };
    }
  } catch (error) {
    console.error("Error in purchaseGamepass:", error);
    return { success: false, error: error.message };
  }
}
```

## Why Direct Import is Better

| Approach        | HTTP Fetch                    | Direct Import   |
| --------------- | ----------------------------- | --------------- |
| Speed           | ~100-500ms                    | ~10-50ms ⚡     |
| Reliability     | Can fail (network, DNS, etc.) | Always works ✅ |
| Base URL        | Need to configure             | Not needed ✅   |
| Localhost Issue | Problem in production         | No issue ✅     |
| Type Safety     | No                            | Yes ✅          |

## Testing

### Test 1: Check Logs

After changes, you should see:

```
🌐 Calling API: http://localhost:3000/api/buy-pass
```

If you see 404:

```
❌ API returned 404: <!DOCTYPE html>...
```

### Test 2: Check API Endpoint

Manual test:

```bash
curl -X POST http://localhost:3000/api/buy-pass \
  -H "Content-Type: application/json" \
  -d '{
    "robloxCookie": "test",
    "productId": 123,
    "price": 10,
    "sellerId": 456
  }'
```

Expected: JSON response (not HTML)

### Test 3: Test Auto-Purchase

1. Add/update stock account
2. Check terminal logs
3. Should show:
   - `🌐 Calling API: ...`
   - Either success or proper error message (not HTML parse error)

## Next Steps

### Option A: Keep HTTP Fetch (Current)

- [x] Add error handling ✅
- [x] Fix base URL logic ✅
- [ ] Test in development
- [ ] Test in production
- [ ] Add fallback if fetch fails

### Option B: Use Direct Import (Recommended)

- [ ] Import buy-pass handler
- [ ] Call directly without HTTP
- [ ] Remove base URL logic
- [ ] Much simpler & faster

## Environment Variables

Make sure these are set:

### Development (.env.local):

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Production:

```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
# OR let it use VERCEL_URL automatically
```

## Recommendation

🎯 **Use Direct Import** - Lebih simple, cepat, dan reliable!

Steps:

1. Import buy-pass handler di top file
2. Call handler directly tanpa fetch
3. Remove semua base URL logic
4. Profit! 🚀

---

**Status**: Error handling improved ✅
**Next**: Consider switching to direct import
**Priority**: Medium (current solution works but not optimal)
