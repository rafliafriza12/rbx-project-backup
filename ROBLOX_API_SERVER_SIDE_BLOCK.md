# Roblox API Server-Side Access Issue

## Problem Summary

**All Roblox API endpoints return 403 Forbidden when accessed from server-side (Next.js API route).**

### Errors Encountered:

```
Endpoint 1 (ro.py.ro): 403 Forbidden
Endpoint 2 (roproxy.com): 403 Forbidden
Endpoint 3 (rbxproxy.com): 403 Forbidden
Endpoint 4 (roblox.com): 403 Forbidden
```

---

## Root Cause

Roblox **aggressively blocks server-side API requests** because:

1. They detect Node.js/server User-Agents
2. Missing browser-specific headers/cookies
3. IP-based rate limiting for non-browser clients
4. Cloudflare protection on their endpoints

Even proxy services (roproxy, ro.py.ro) are getting blocked now.

---

## Alternative Solutions

### Option 1: Move to Client-Side (Recommended) ✅

**Fetch gamepass data directly from browser:**

```typescript
// In frontend component
const checkGamepass = async (universeId: string, expectedRobux: number) => {
  try {
    const response = await fetch(
      `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100&sortOrder=Asc`
    );
    const data = await response.json();

    const matchingGamepass = data.data.find(
      (gp: any) => gp.price === expectedRobux
    );

    return matchingGamepass;
  } catch (error) {
    console.error("Error fetching gamepass:", error);
  }
};
```

**Benefits:**

- ✅ No 403 errors (browser requests are allowed)
- ✅ No CORS issues
- ✅ Faster response (direct from client)
- ✅ No proxy needed

**Drawbacks:**

- ❌ API key exposed in client (but Roblox API is public anyway)
- ❌ Can't control/log on server

---

### Option 2: Use noblox.js Library

Install noblox.js for server-side Roblox API access:

```bash
npm install noblox.js
```

```typescript
// In API route
import noblox from "noblox.js";

export async function GET(request: NextRequest) {
  const { universeId, expectedRobux } = getParams(request);

  try {
    // Get game passes using noblox.js
    const gamepasses = await noblox.getGamePasses(universeId);

    const matchingGamepass = gamepasses.find(
      (gp) => gp.price === parseInt(expectedRobux)
    );

    return NextResponse.json({
      success: true,
      gamepass: matchingGamepass,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
```

**Benefits:**

- ✅ Purpose-built for Roblox API
- ✅ Handles authentication/cookies
- ✅ Better error handling

---

### Option 3: External API Service

Use third-party Roblox API services:

1. **RoAPI.io** - https://roapi.io/
2. **RoVer API** - https://verify.eryn.io/
3. **Bloxlink API** - https://blox.link/

Example with custom proxy service:

```typescript
const response = await fetch(
  `https://your-proxy-service.com/roblox/gamepasses?universeId=${universeId}`
);
```

---

### Option 4: Cache Data (Hybrid Approach)

**When user creates gamepass:**

1. Client fetches gamepass data from Roblox
2. Client sends data to your API
3. Server validates and caches in database
4. Future checks use cached data

```typescript
// Client-side: Fetch and send to server
const gamepassData = await fetchFromRoblox(universeId);
await fetch("/api/gamepass/cache", {
  method: "POST",
  body: JSON.stringify({ universeId, gamepassData }),
});

// Server-side: Use cached data
const cachedGamepass = await GamepassCache.findOne({ universeId });
```

---

### Option 5: Puppeteer/Playwright (Heavy Solution)

Use headless browser to scrape Roblox:

```typescript
import puppeteer from "puppeteer";

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto(`https://www.roblox.com/games/${universeId}/gamepasses`);

const gamepasses = await page.evaluate(() => {
  // Extract gamepass data from page
});
```

**Benefits:**

- ✅ Bypasses all API blocks
- ✅ Acts like real browser

**Drawbacks:**

- ❌ Very slow (~5-10s per request)
- ❌ Resource intensive
- ❌ Complex setup

---

## Recommended Implementation

### Immediate Fix: Client-Side Fetch

Move gamepass checking to client-side untuk bypass 403 errors.

**File: `/app/rbx5/page.tsx` (or wherever gamepass check happens)**

```typescript
"use client";

import { useState } from "react";

export default function GamepassChecker() {
  const [loading, setLoading] = useState(false);
  const [gamepass, setGamepass] = useState(null);

  const checkGamepass = async (universeId: string, expectedRobux: number) => {
    setLoading(true);
    try {
      // Fetch directly from client (no 403!)
      const response = await fetch(
        `https://games.roblox.com/v1/games/${universeId}/game-passes?limit=100&sortOrder=Asc`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      const matchingGamepass = data.data?.find(
        (gp: any) => gp.price === expectedRobux
      );

      if (matchingGamepass) {
        setGamepass(matchingGamepass);

        // Optional: Send to server for logging
        await fetch("/api/gamepass/log", {
          method: "POST",
          body: JSON.stringify({
            universeId,
            gamepassId: matchingGamepass.id,
            price: matchingGamepass.price,
          }),
        });
      }

      return matchingGamepass;
    } catch (error) {
      console.error("Error checking gamepass:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => checkGamepass("2148089088", 8)}>
        Check Gamepass
      </button>

      {loading && <p>Checking...</p>}

      {gamepass && (
        <div>
          <h3>Gamepass Found!</h3>
          <p>Name: {gamepass.name}</p>
          <p>Price: {gamepass.price} Robux</p>
        </div>
      )}
    </div>
  );
}
```

---

## Why Client-Side Works

| Server-Side (API Route)       | Client-Side (Browser)       |
| ----------------------------- | --------------------------- |
| ❌ Blocked by Roblox (403)    | ✅ Allowed                  |
| ❌ Detected as bot            | ✅ Detected as browser      |
| ❌ Missing browser context    | ✅ Has full browser context |
| ❌ Cloudflare challenges fail | ✅ Cloudflare allows        |
| ❌ No cookies                 | ✅ Can store cookies        |

---

## Implementation Steps

1. **Remove server-side endpoint** or keep as fallback
2. **Add client-side fetch** in React component
3. **Optional**: Send result to server for logging/caching
4. **Test**: Should work without 403 errors

---

## Testing Client-Side Approach

```bash
# Open browser console on your app
# Paste this:

fetch('https://games.roblox.com/v1/games/2148089088/game-passes?limit=100&sortOrder=Asc')
  .then(r => r.json())
  .then(data => console.log(data));

# Should return gamepass data without 403!
```

---

## Conclusion

**Best Solution:** Move gamepass checking to **client-side (browser)** since Roblox blocks all server-side requests.

**Quick Fix:**

1. Remove `/api/check-gamepass` route (or keep as backup)
2. Add client-side fetch in your React component
3. Enjoy working gamepass checks without 403! ✅
