# Review System Documentation

## Overview

Sistem review telah diimplementasikan untuk semua service (robux, gamepass, joki) dengan fitur:

- Review publik dengan approval admin
- Review spesifik untuk setiap gamepass/joki
- Management admin dengan bulk actions
- Rating sistem 1-5 bintang

## Components

### 1. ReviewSection Component

**Location**: `components/ReviewSection.tsx`

**Props**:

```typescript
interface ReviewSectionProps {
  serviceType: "robux" | "gamepass" | "joki";
  serviceCategory?: "robux_instant" | "robux_5_hari"; // For robux only
  serviceId?: string; // For gamepass and joki
  serviceName?: string; // For gamepass and joki
  title?: string; // Optional custom title
}
```

**Features**:

- ⭐ Star rating display and input
- 📝 Review form with username, rating, comment
- 📊 Average rating calculation
- ✅ Automatic approval workflow
- 📱 Responsive design

### 2. Admin Review Management

**Location**: `app/admin/reviews/page.tsx`

**Features**:

- 📋 Review listing with pagination
- 🔍 Filter by status (pending/approved) and service type
- ✅ Bulk approve/reject/delete actions
- 📊 Statistics dashboard
- 🔄 Real-time status updates

## API Endpoints

### Public API

#### Get Reviews

```
GET /api/reviews
```

**Query Parameters**:

- `serviceType`: 'robux' | 'gamepass' | 'joki'
- `serviceCategory`: 'robux_instant' | 'robux_5_hari' (for robux)
- `serviceId`: string (for specific gamepass/joki)
- `page`: number (default: 1)
- `limit`: number (default: 10)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "username": "johndoe",
      "serviceType": "gamepass",
      "serviceId": "64f123...",
      "serviceName": "Blox Fruits Premium Pass",
      "rating": 5,
      "comment": "Great gamepass!",
      "isApproved": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

#### Create Review

```
POST /api/reviews
```

**Body**:

```json
{
  "username": "johndoe",
  "serviceType": "gamepass",
  "serviceId": "64f123...", // Required for gamepass/joki
  "serviceName": "Blox Fruits Premium Pass", // Required for gamepass/joki
  "rating": 5,
  "comment": "Great service!"
}
```

### Admin API

#### Get All Reviews (Admin)

```
GET /api/admin/reviews
```

**Query Parameters**:

- `status`: 'all' | 'approved' | 'pending'
- `serviceType`: 'robux' | 'gamepass' | 'joki'
- `page`: number
- `limit`: number

**Response**:

```json
{
  "success": true,
  "data": [...],
  "stats": {
    "total": 100,
    "approved": 85,
    "pending": 15
  },
  "pagination": {...}
}
```

#### Bulk Actions

```
PUT /api/admin/reviews
```

**Body**:

```json
{
  "reviewIds": ["64f123...", "64f456..."],
  "action": "approve" // or "reject"
}
```

```
DELETE /api/admin/reviews
```

**Body**:

```json
{
  "reviewIds": ["64f123...", "64f456..."]
}
```

#### Single Review Actions

```
PUT /api/admin/reviews/[id]
DELETE /api/admin/reviews/[id]
```

## Implementation Examples

### 1. Robux Reviews (Home Page)

```tsx
<ReviewSection
  serviceType="robux"
  serviceCategory="robux_instant"
  title="Reviews Robux Instant"
/>
```

### 2. Robux 5 Hari Reviews

```tsx
<ReviewSection
  serviceType="robux"
  serviceCategory="robux_5_hari"
  title="Reviews Robux 5 Hari"
/>
```

### 3. Specific Gamepass Reviews

```tsx
<ReviewSection
  serviceType="gamepass"
  serviceId={gamepass._id}
  serviceName={gamepass.gameName}
  title={`Reviews ${gamepass.gameName}`}
/>
```

### 4. Specific Joki Reviews

```tsx
<ReviewSection
  serviceType="joki"
  serviceId={joki._id}
  serviceName={joki.gameName}
  title={`Reviews ${joki.gameName}`}
/>
```

### 5. General Service Reviews

```tsx
<ReviewSection serviceType="gamepass" title="Reviews Gamepass" />
```

## Database Schema

```typescript
interface Review {
  _id: string;
  username: string;
  serviceType: "robux" | "gamepass" | "joki";
  serviceCategory?: "robux_instant" | "robux_5_hari";
  serviceId?: string;
  serviceName?: string;
  rating: number; // 1-5
  comment: string;
  isApproved: boolean; // Default: false
  createdAt: Date;
  updatedAt: Date;
}
```

## Admin Features

### Statistics

- 📊 Total reviews count
- ✅ Approved reviews count
- ⏳ Pending reviews count

### Filtering

- 🔍 Filter by approval status
- 🎮 Filter by service type
- 📄 Pagination support

### Bulk Actions

- ✅ Bulk approve reviews
- ❌ Bulk reject reviews
- 🗑️ Bulk delete reviews

### Individual Actions

- ✅ Approve single review
- ❌ Reject single review
- 🗑️ Delete single review

## Workflow

1. **User submits review** → Review created with `isApproved: false`
2. **Admin reviews** → Admin can approve/reject via admin panel
3. **Approved reviews** → Show on public pages
4. **Rejected reviews** → Hidden from public, can be deleted

## Security & Validation

- ✅ Input validation (username, rating 1-5, comment length)
- ✅ Required fields validation
- ✅ Service-specific validation (serviceId for gamepass/joki)
- ✅ Admin-only approval workflow
- ✅ MongoDB indexes for performance

## Files Modified/Created

### New Files:

- `components/ReviewSection.tsx` - Main review component
- `app/api/admin/reviews/route.ts` - Admin bulk operations
- `app/api/admin/reviews/[id]/route.ts` - Admin single operations
- `app/admin/reviews/page.tsx` - Admin management interface
- `models/Review.ts` - Database model
- `examples/review-usage.md` - Usage examples

### Updated Files:

- `app/api/reviews/route.ts` - Enhanced with serviceId filtering
- `types/index.ts` - Added Review interfaces
- `app/admin/layout.tsx` - Added Reviews menu item
- All service pages - Added ReviewSection components

## Next Steps

1. **Styling**: Customize review component styling to match your design
2. **Email Notifications**: Add email notifications for new reviews
3. **Reply System**: Allow admin replies to reviews
4. **Analytics**: Add detailed review analytics
5. **Moderation**: Add automated content moderation
6. **Mobile**: Optimize mobile experience
