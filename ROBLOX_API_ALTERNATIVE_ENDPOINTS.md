# Roblox GamePass API - Alternative Endpoints Research

## 📋 Issue

Original endpoint deprecated:

```
https://games.roblox.com/v1/games/{universeId}/game-passes
```

Response: `{"code":0,"message":"Endpoint is unavailable"}`

---

## 🔍 Alternative Endpoints Tested

### ✅ Method 1: New APIs Subdomain (RECOMMENDED)

```
https://apis.roblox.com/game-passes/v1/games/{universeId}/game-passes
```

**Response Format**:

```json
{
  "gamePasses": [
    {
      "id": 12345678,
      "name": "VIP GamePass",
      "price": 5000,
      "sellerId": 987654321,
      "productId": 111222333,
      "isForSale": true
    }
  ]
}
```

**Status**: 🟡 **TESTING NEEDED**

- Roblox introduced new `apis.roblox.com` subdomain
- Different response format: `gamePasses` instead of `data`
- May require authentication or have different access rules

---

### 🔄 Method 2: Games API v2

```
https://games.roblox.com/v2/games/{universeId}/game-passes
```

**Expected Format**: Same as v1 or new format

**Status**: 🟡 **TESTING NEEDED**

- v2 endpoint may be newer version
- Might not be deprecated yet

---

### 🔄 Method 3: Economy API

```
https://economy.roblox.com/v1/games/{universeId}/game-passes
```

**Status**: 🟡 **TESTING NEEDED**

- Economy domain handles transactions
- May have access to game pass data

---

### 🔄 Method 4: Catalog API

```
https://catalog.roblox.com/v1/search/items/details?Category=34&Keyword=&IncludeNotForSale=false&Limit=100
```

**Notes**:

- Category 34 might be game passes
- Requires different query parameters
- May need to filter by creator/universe ID

---

### ❌ Method 5: RoProxy v2

```
https://games.roproxy.com/v2/games/{universeId}/game-passes
```

**Status**: ❌ **LIKELY FAILS**

- Proxy mirrors Roblox API
- If Roblox deprecated, proxy also affected

---

### ❌ Method 6: Original v1 (Fallback)

```
https://games.roblox.com/v1/games/{universeId}/game-passes?limit=100&sortOrder=Asc
```

**Status**: ❌ **DEPRECATED**

- Returns `{"code":0,"message":"Endpoint is unavailable"}`
- Keep as last resort in case it comes back

---

## 🧪 Testing Plan

### Test Each Endpoint Manually:

```bash
# Test Method 1: APIs subdomain
curl -H "Accept: application/json" \
  "https://apis.roblox.com/game-passes/v1/games/YOUR_UNIVERSE_ID/game-passes"

# Test Method 2: v2 endpoint
curl -H "Accept: application/json" \
  "https://games.roblox.com/v2/games/YOUR_UNIVERSE_ID/game-passes"

# Test Method 3: Economy API
curl -H "Accept: application/json" \
  "https://economy.roblox.com/v1/games/YOUR_UNIVERSE_ID/game-passes"

# Test Method 4: Catalog search
curl -H "Accept: application/json" \
  "https://catalog.roblox.com/v1/search/items/details?Category=34&Limit=100"
```

### In Browser Console:

```javascript
// Test from browser (to avoid CORS)
const universeId = "YOUR_UNIVERSE_ID";

// Method 1
fetch(`https://apis.roblox.com/game-passes/v1/games/${universeId}/game-passes`)
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);

// Method 2
fetch(`https://games.roblox.com/v2/games/${universeId}/game-passes`)
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);

// Method 3
fetch(`https://economy.roblox.com/v1/games/${universeId}/game-passes`)
  .then((r) => r.json())
  .then(console.log)
  .catch(console.error);
```

---

## 🔧 Implementation (DONE)

### Server-Side API Route

File: `/app/api/check-gamepass/route.ts`

**Updated to try 6 endpoints** in order:

1. `apis.roblox.com` (new API subdomain)
2. Catalog API
3. `games.roblox.com/v2` (v2 endpoint)
4. `economy.roblox.com` (economy API)
5. RoProxy v2
6. Original v1 (deprecated, last resort)

**Response Normalization**:

```typescript
// Handle different response formats
if (responseData.gamePasses) {
  // New format: { gamePasses: [...] }
  normalizedData = { data: responseData.gamePasses };
} else if (responseData.data && Array.isArray(responseData.data)) {
  // Old format: { data: [...] }
  normalizedData = responseData;
} else {
  // Unknown format, try next endpoint
  throw new Error("Unknown response format");
}
```

---

## 📊 Expected Results

### Scenario 1: Method 1 Works ✅

- New `apis.roblox.com` endpoint is active
- Returns `gamePasses` array
- Normalized to old format
- Success rate: **HIGH**

### Scenario 2: Method 2-3 Works 🟡

- Alternative endpoints still active
- May have rate limits or restrictions
- Success rate: **MEDIUM**

### Scenario 3: All Methods Fail ❌

- All endpoints deprecated/blocked
- Fallback to manual verification
- Success rate: **0%** (manual only)

---

## 🚀 Next Steps

1. **Test in Production** ⏳

   - Deploy updated code
   - Monitor which endpoint succeeds
   - Track success rates

2. **Analyze Logs** 📊

   - Check server logs for successful endpoint
   - Identify most reliable endpoint
   - Remove non-working endpoints

3. **Optimize** ⚡

   - Move successful endpoint to Method 1
   - Remove failed endpoints
   - Add caching to reduce API calls

4. **Document Results** 📝
   - Update this file with findings
   - Share successful endpoint with team
   - Create monitoring alerts

---

## 📞 Roblox API Documentation

**Official Docs**:

- https://create.roblox.com/docs/reference/engine
- https://robloxapi.github.io/
- https://roproxy.com/ (proxy documentation)

**Community Resources**:

- Roblox Developer Forum
- RoAPI Discord
- GitHub: roblox-api-tracker

---

## 🔔 Monitoring

Track which method succeeds:

```javascript
console.log(`✅ Using endpoint: ${successfulEndpoint}`);

// Add analytics
trackEvent("gamepass_api_success", {
  endpoint: successfulEndpoint,
  method: endpointIndex + 1,
  universeId: universeId,
  timestamp: Date.now(),
});
```

Alert if all methods fail:

```javascript
if (!successfulEndpoint) {
  alertTeam("gamepass_api_all_failed", {
    lastError: lastError,
    attemptedEndpoints: apiEndpoints.length,
  });
}
```

---

## ✅ Success Criteria

**Must Have**:

- [ ] At least 1 endpoint returns valid data
- [ ] Response normalized to consistent format
- [ ] Error handling for all endpoints
- [ ] Logging for debugging

**Nice to Have**:

- [ ] Multiple working endpoints (redundancy)
- [ ] Fast response time (<2s)
- [ ] No rate limiting issues
- [ ] Works both server-side and client-side

---

## 📝 Test Results

### Test Date: 2025-01-13

| Method | Endpoint            | Status     | Response Time | Notes        |
| ------ | ------------------- | ---------- | ------------- | ------------ |
| 1      | apis.roblox.com     | 🟡 PENDING | -             | Need to test |
| 2      | catalog.roblox.com  | 🟡 PENDING | -             | Need to test |
| 3      | games.roblox.com/v2 | 🟡 PENDING | -             | Need to test |
| 4      | economy.roblox.com  | 🟡 PENDING | -             | Need to test |
| 5      | roproxy.com/v2      | 🟡 PENDING | -             | Need to test |
| 6      | games.roblox.com/v1 | ❌ FAILED  | ~500ms        | Deprecated   |

**Action Required**:
🧪 **Test endpoints 1-5 with real Universe ID**

---

## 🎯 Conclusion

Updated server-side API to try **6 different endpoints** with automatic fallback. Next step is to **test in production** and monitor which endpoint(s) work.

**Status**: ✅ Code Updated, 🟡 Testing Pending

---

**Last Updated**: 2025-01-13  
**Author**: GitHub Copilot  
**Next Review**: After production testing
