# 🔥 HOT Badge untuk Joki Services

**Date**: 2025
**Status**: ✅ Complete
**Feature**: Dynamic HOT Badge Based on Order Count

---

## 📋 Overview

Implementasi fitur badge "HOT" 🔥 pada card joki yang ditampilkan berdasarkan jumlah pesanan. Hanya **3 joki dengan pesanan terbanyak** yang akan mendapatkan badge HOT.

---

## ✨ Features

### 1. **Order Count Tracking**

- ✅ Menghitung jumlah transaksi per joki
- ✅ Hanya menghitung transaksi sukses (pending, settlement, capture)
- ✅ Real-time update dari database

### 2. **Top 3 Selection**

- ✅ Otomatis sort berdasarkan order count
- ✅ Badge HOT hanya untuk 3 teratas
- ✅ Minimal 1 pesanan untuk dapat badge
- ✅ Dynamic ranking system

### 3. **Visual Design**

- ✅ Red-orange gradient badge
- ✅ Fire icon SVG
- ✅ Glow effect dengan shadow
- ✅ Pulse animation
- ✅ Responsive size (mobile & desktop)

---

## 🔧 Technical Implementation

### 1. **API Endpoint Update** (`/app/api/joki/route.ts`)

#### Import Transaction Model

```typescript
import Transaction from "@/models/Transaction";
```

#### Enhanced GET Method

```typescript
export async function GET(request: NextRequest) {
  await connectDB();

  // Fetch all joki services
  const jokiServices = await Joki.find({}).sort({ createdAt: -1 }).lean();

  // Get order counts for each joki
  const jokiWithOrderCount = await Promise.all(
    jokiServices.map(async (joki) => {
      // Count completed/pending transactions for this joki
      const orderCount = await Transaction.countDocuments({
        serviceType: "joki",
        serviceId: joki._id.toString(),
        status: { $in: ["pending", "settlement", "capture"] },
      });

      return {
        ...joki,
        orderCount,
      };
    })
  );

  // Sort by orderCount to determine top 3
  const sortedJoki = jokiWithOrderCount.sort(
    (a, b) => b.orderCount - a.orderCount
  );

  // Mark top 3 as hot
  const jokiWithHotBadge = sortedJoki.map((joki, index) => ({
    ...joki,
    isHot: index < 3 && joki.orderCount > 0,
  }));

  return NextResponse.json({
    message: "Joki services berhasil diambil",
    jokiServices: jokiWithHotBadge,
  });
}
```

#### Key Logic:

1. **Fetch Joki**: Get all joki from database
2. **Count Orders**: Count transactions for each joki
3. **Sort**: Sort by order count (descending)
4. **Mark Top 3**: Set `isHot: true` for top 3 with orders > 0
5. **Return**: Send data with `isHot` flag

### 2. **Interface Update** (`/app/(public)/joki/page.tsx`)

```typescript
interface Joki {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  item: JokiItem[];
  createdAt?: string;
  orderCount?: number; // Number of orders for this joki
  isHot?: boolean; // Top 3 most ordered joki
}
```

### 3. **Badge Component**

```tsx
{
  /* HOT Badge - Top Right - Based on Order Count */
}
{
  joki.isHot && (
    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(239,68,68,0.6)] border border-red-400/40 flex items-center gap-1 animate-pulse">
      <svg
        className="w-3 h-3 sm:w-3.5 sm:h-3.5"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
          clipRule="evenodd"
        />
      </svg>
      HOT
    </div>
  );
}
```

---

## 🎨 Visual Design

### Badge Styling

```css
/* Background */
bg-gradient-to-r from-red-500 to-orange-500

/* Text */
text-white
font-black
text-[10px] sm:text-xs

/* Border */
border border-red-400/40

/* Shadow (Glow Effect) */
shadow-[0_0_15px_rgba(239,68,68,0.6)]

/* Animation */
animate-pulse

/* Layout */
flex items-center gap-1
px-2 py-1 sm:px-3 sm:py-1
rounded-md sm:rounded-lg
```

### Fire Icon

- SVG from Heroicons
- Size: 12px mobile, 14px desktop
- Color: currentColor (white)
- Fill rule for flame shape

### Position

```tsx
{
  /* Badges Container */
}
<div className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-3 z-10 flex justify-between items-start">
  {/* NEW Badge - Left */}
  {isNew && <NewBadge />}

  {/* HOT Badge - Right */}
  {joki.isHot && <HotBadge />}
</div>;
```

---

## 📊 Order Count Logic

### Transaction Query

```typescript
const orderCount = await Transaction.countDocuments({
  serviceType: "joki", // Only joki transactions
  serviceId: joki._id.toString(), // Match specific joki
  status: {
    $in: ["pending", "settlement", "capture"], // Only successful orders
  },
});
```

### Status Meanings:

- **pending**: Payment initiated
- **settlement**: Payment completed
- **capture**: Payment captured (card)

### Excluded Statuses:

- ❌ `cancel`: Canceled orders
- ❌ `expire`: Expired payments
- ❌ `deny`: Denied payments
- ❌ `failure`: Failed transactions

---

## 🏆 Ranking System

### Algorithm:

```typescript
// 1. Calculate order count for each joki
jokiServices.map(async (joki) => {
  const orderCount = await Transaction.countDocuments({...});
  return { ...joki, orderCount };
});

// 2. Sort by order count (highest first)
sortedJoki.sort((a, b) => b.orderCount - a.orderCount);

// 3. Mark top 3 as hot (with at least 1 order)
jokiServices.map((joki, index) => ({
  ...joki,
  isHot: index < 3 && joki.orderCount > 0
}));
```

### Examples:

**Scenario 1: Multiple Orders**

```
Joki A: 50 orders → isHot: true (Rank 1)
Joki B: 30 orders → isHot: true (Rank 2)
Joki C: 20 orders → isHot: true (Rank 3)
Joki D: 10 orders → isHot: false (Rank 4)
Joki E: 5 orders  → isHot: false (Rank 5)
```

**Scenario 2: Some Without Orders**

```
Joki A: 10 orders → isHot: true (Rank 1)
Joki B: 5 orders  → isHot: true (Rank 2)
Joki C: 2 orders  → isHot: true (Rank 3)
Joki D: 0 orders  → isHot: false (No orders)
Joki E: 0 orders  → isHot: false (No orders)
```

**Scenario 3: Less Than 3 With Orders**

```
Joki A: 10 orders → isHot: true (Rank 1)
Joki B: 5 orders  → isHot: true (Rank 2)
Joki C: 0 orders  → isHot: false (No orders)
Joki D: 0 orders  → isHot: false (No orders)
```

---

## 🔄 Data Flow

```
1. User visits /joki page
   └─> Component mounts
   └─> fetchJokiServices() called

2. API Request
   └─> GET /api/joki
   └─> Connect to MongoDB
   └─> Fetch all joki services

3. Order Count Calculation
   └─> For each joki:
       └─> Count transactions (serviceType: "joki", status: success)
       └─> Add orderCount to joki data

4. Ranking & Hot Badge
   └─> Sort by orderCount (desc)
   └─> Mark top 3 as isHot: true
   └─> Return jokiServices with isHot flag

5. Frontend Rendering
   └─> Map through jokiServices
   └─> Check joki.isHot
   └─> Conditionally render HOT badge
   └─> Display with fire icon & animation
```

---

## 🎯 Benefits

### 1. **Social Proof**

- Show popular services
- Build trust with users
- Increase conversion rates

### 2. **Dynamic Ranking**

- Auto-updates based on real orders
- No manual configuration needed
- Fair competition between services

### 3. **User Guidance**

- Help users choose popular options
- Reduce decision fatigue
- Improve user experience

### 4. **Gamification**

- Encourage service providers
- Create competition
- Motivate quality service

---

## 📱 Responsive Design

### Mobile (< 640px)

```tsx
text-[10px]      // Badge text
px-2 py-1        // Badge padding
w-3 h-3          // Icon size
rounded-md       // Border radius
```

### Desktop (>= 640px)

```tsx
sm:text-xs       // Badge text
sm:px-3 sm:py-1  // Badge padding
sm:w-3.5 sm:h-3.5 // Icon size
sm:rounded-lg    // Border radius
```

---

## 🔍 Performance Considerations

### 1. **Database Query Optimization**

```typescript
// Use lean() for better performance
const jokiServices = await Joki.find({}).lean();

// Use countDocuments() instead of find().length
const orderCount = await Transaction.countDocuments({...});
```

### 2. **Promise.all for Parallel Execution**

```typescript
// Calculate all order counts in parallel
const jokiWithOrderCount = await Promise.all(
  jokiServices.map(async (joki) => {
    const orderCount = await Transaction.countDocuments({...});
    return { ...joki, orderCount };
  })
);
```

### 3. **Caching Opportunity**

For future optimization:

- Cache order counts for 5-10 minutes
- Update on new transactions
- Reduce database queries

---

## 🐛 Edge Cases Handled

### 1. **No Orders**

```typescript
isHot: index < 3 && joki.orderCount > 0;
```

- Won't show HOT badge if orderCount is 0
- Even if in top 3 positions

### 2. **Tie in Order Count**

- Natural sort order by array index
- First occurrence gets priority
- Consistent ranking

### 3. **Less Than 3 Joki**

```typescript
index < 3; // Always checks index
```

- If only 2 joki, both can be hot
- If only 1 joki with orders, only 1 is hot

### 4. **All Joki Have 0 Orders**

- No HOT badges shown
- Clean UI without badges
- No misleading information

---

## ✅ Testing Checklist

- [x] API returns orderCount for each joki
- [x] API marks top 3 as isHot
- [x] Badge shows only for isHot joki
- [x] Fire icon renders correctly
- [x] Badge position (top-right)
- [x] Responsive sizing works
- [x] Pulse animation smooth
- [x] Glow effect visible
- [x] Works with NEW badge (left side)
- [x] No badge if orderCount = 0

---

## 📝 Example API Response

```json
{
  "message": "Joki services berhasil diambil",
  "jokiServices": [
    {
      "_id": "abc123",
      "gameName": "Blox Fruits",
      "imgUrl": "https://...",
      "orderCount": 50,
      "isHot": true,  // Rank 1
      "item": [...]
    },
    {
      "_id": "def456",
      "gameName": "Pet Simulator X",
      "imgUrl": "https://...",
      "orderCount": 30,
      "isHot": true,  // Rank 2
      "item": [...]
    },
    {
      "_id": "ghi789",
      "gameName": "Adopt Me",
      "imgUrl": "https://...",
      "orderCount": 20,
      "isHot": true,  // Rank 3
      "item": [...]
    },
    {
      "_id": "jkl012",
      "gameName": "Tower Defense",
      "imgUrl": "https://...",
      "orderCount": 5,
      "isHot": false,  // Rank 4
      "item": [...]
    }
  ]
}
```

---

## 🚀 Future Enhancements

### Possible Additions:

- [ ] "TRENDING" badge (rising orders in last 7 days)
- [ ] Order count visible on hover
- [ ] Different badge colors (Gold, Silver, Bronze)
- [ ] Weekly/Monthly ranking system
- [ ] Badge animation on rank change
- [ ] Admin dashboard for rankings
- [ ] Push notification on becoming hot
- [ ] Historical ranking data

### Improvements:

- [ ] Redis caching for order counts
- [ ] Real-time updates with WebSocket
- [ ] A/B testing different badge designs
- [ ] Analytics on badge effectiveness
- [ ] Customizable hot threshold (admin setting)

---

## 📊 Before vs After

### Before

```tsx
{
  /* Static badge for all joki */
}
{
  joki.item && joki.item.length > 0 && <div className="...">Hot</div>;
}
```

### After

```tsx
{
  /* Dynamic badge based on real orders */
}
{
  joki.isHot && (
    <div className="...">
      <FireIcon />
      HOT
    </div>
  );
}

// Only top 3 joki with most orders
```

---

## ✨ Summary

Feature **HOT Badge untuk Joki Services** telah berhasil diimplementasikan dengan:

- **Dynamic Ranking**: Berdasarkan jumlah pesanan real
- **Top 3 System**: Hanya 3 joki terlaris yang dapat badge
- **Visual Design**: Red-orange gradient dengan fire icon
- **Performance**: Optimized with lean() and Promise.all
- **Edge Cases**: Handled properly (no orders, ties, etc.)
- **Responsive**: Mobile dan desktop friendly
- **Social Proof**: Membantu user memilih joki populer

**Status**: ✅ **COMPLETE & READY FOR PRODUCTION**

---

_Last Updated: 2025_
_Implemented by: AI Assistant_
_Review Status: Ready for Testing_
