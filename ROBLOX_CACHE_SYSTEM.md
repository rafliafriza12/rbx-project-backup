# Roblox User Cache System

## Overview

The Roblox User Cache system is implemented to improve performance and reduce API calls to Roblox servers by caching user information in MongoDB.

## Features

### 🚀 **Performance Improvements**

- **10-minute TTL Cache**: User data is cached for 10 minutes using MongoDB TTL indexes
- **Instant Response**: Cached users return immediately without API calls
- **Reduced Latency**: No waiting for Roblox API responses on subsequent requests

### 🎯 **Smart Caching Logic**

1. **Cache Check**: First checks MongoDB for existing user data
2. **API Fallback**: If not cached, fetches from Roblox API
3. **Auto-Cache**: Automatically stores new data with TTL expiration
4. **Case Insensitive**: Stores usernames in lowercase for consistent lookup

### 📊 **Data Stored**

```typescript
interface IRobloxCache {
  username: string; // Lowercase username for consistent lookup
  userId: number; // Roblox user ID
  displayName: string; // User's display name
  avatarUrl: string; // Avatar thumbnail URL
  updatedAt: Date; // Last update timestamp (TTL expires after 10 minutes)
}
```

## API Endpoint

### `GET /api/user-info?username={username}`

#### Request

```
GET /api/user-info?username=builderman
```

#### Response (Cached)

```json
{
  "success": true,
  "cached": true,
  "id": 156,
  "username": "builderman",
  "displayName": "builderman",
  "avatar": "https://tr.rbxcdn.com/..."
}
```

#### Response (Fresh from API)

```json
{
  "success": true,
  "cached": false,
  "id": 156,
  "username": "builderman",
  "displayName": "builderman",
  "avatar": "https://tr.rbxcdn.com/..."
}
```

## Implementation Details

### Database Model

- **Collection**: `robloxcaches`
- **Index**: `username` field with unique constraint
- **TTL**: 600 seconds (10 minutes) auto-expiration
- **Connection**: Uses existing `dbConnect()` function

### Error Handling

- **Invalid Username**: Returns 400 with error message
- **User Not Found**: Returns 404 when Roblox API finds no user
- **API Errors**: Returns 500 for network or database errors
- **Graceful Degradation**: If avatar fetch fails, user data is still cached

### Performance Benefits

- **First Request**: ~500-1000ms (Roblox API call)
- **Cached Request**: ~50-100ms (MongoDB lookup)
- **API Rate Limiting**: Reduces calls to Roblox API
- **Server Load**: Decreases external API dependencies

## Usage in Frontend

The cache is transparent to frontend users. The rbx5 page will:

1. Show loading indicator during search
2. Display user info when found (cached or fresh)
3. Enable form submission only with valid cached user

## Monitoring

Check console logs for cache performance:

```
Cache hit for username: builderman
Cache miss for username: newuser, fetching from Roblox API
Cached new user data for: newuser
```

## Benefits for Users

- ⚡ **Faster Search**: Instant results for recently searched users
- 🎯 **Reliable Service**: Less dependency on external API availability
- 💰 **Cost Effective**: Reduces API quota usage
- 🔄 **Fresh Data**: 10-minute TTL ensures data isn't stale

The caching system provides a seamless experience while maintaining data freshness and improving application performance!
