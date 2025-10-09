# Cart UI Enhancement: Accordion & Image Improvements

## 🎨 Updates Overview

Updated cart page with accordion layout for each category and improved image display logic.

**Last Updated:** October 6, 2025

---

## ✨ New Features

### 1. **Accordion Layout for Categories**

Each service category (Robux 5 Hari, Robux Instant, Gamepass, Joki) now has its own collapsible accordion section.

**Benefits:**

- ✅ Better organization
- ✅ Cleaner UI when cart has many items
- ✅ Easy to focus on specific category
- ✅ Auto-expanded on first load

**Visual:**

```
┌─────────────────────────────────────────┐
│ 💎 ROBUX 5 HARI (2 items)     [▼]      │
│    ☐ Pilih Semua                        │
├─────────────────────────────────────────┤
│  ☐ [💲] 1000 Robux - 5 Hari             │
│  ☐ [💲] 500 Robux - 5 Hari              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🎯 JOKI (3 items)              [▼]      │
│    ☐ Pilih Semua                        │
├─────────────────────────────────────────┤
│  ☐ [📷] PUBG - Crown                    │
│  ☐ [📷] PUBG - Ace                      │
│  ☐ [📷] Mobile Legends - Mythic         │
└─────────────────────────────────────────┘
```

---

### 2. **Smart Image Display Logic**

Images now display based on service category:

#### **Robux Services (5 Hari & Instant)**

- ✅ Use **DollarSign icon** from Lucide React
- ✅ Green gradient background
- ✅ No game-specific images needed

```tsx
<div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20">
  <DollarSign className="w-10 h-10 text-green-400" />
</div>
```

#### **Gamepass & Joki Services**

- ✅ Use **item image** from gamepassDetails/jokiDetails
- ✅ Fallback to root game image if item image not available
- ✅ Shows actual item/character user is buying

**Priority:**

1. Try `item.gamepassDetails.imgUrl` (for Gamepass)
2. Try `item.jokiDetails.imgUrl` (for Joki)
3. Fallback to `item.imgUrl` (root game image)
4. Fallback to category icon emoji

---

## 🔧 Technical Implementation

### New Imports

```typescript
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  DollarSign, // ✅ Added for Robux icon
  ChevronDown, // ✅ Added for accordion
  ChevronUp, // ✅ Added for accordion
} from "lucide-react";
```

---

### State Management

```typescript
const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

// Toggle accordion for category
const toggleCategory = (category: string) => {
  setExpandedCategories((prev) =>
    prev.includes(category)
      ? prev.filter((c) => c !== category)
      : [...prev, category]
  );
};
```

---

### Auto-Expand on Load

```typescript
useEffect(() => {
  const categories = Object.keys(groupedItems);
  if (categories.length > 0 && expandedCategories.length === 0) {
    setExpandedCategories(categories);
  }
}, [groupedItems]);
```

**Behavior:**

- First time user opens cart → All categories expanded
- User manually collapses/expands → State preserved until page reload
- Clean slate on every new session

---

### Accordion Header

```tsx
<div
  onClick={() => toggleCategory(category)}
  className="bg-gradient-to-r from-primary-100/10 to-primary-200/10 backdrop-blur-lg border-b border-primary-100/30 p-4 cursor-pointer hover:from-primary-100/15 hover:to-primary-200/15 transition-all duration-300"
>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="text-2xl">{getCategoryIcon(category)}</div>
      <div>
        <h3 className="text-white font-bold text-lg">
          {getCategoryDisplayName(category)}
        </h3>
        <p className="text-white/60 text-sm">
          {items.length} item{items.length > 1 ? "s" : ""}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <label
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-2 cursor-pointer"
      >
        <input
          type="checkbox"
          checked={allCategorySelected}
          onChange={() => toggleSelectAll(category)}
        />
        <span>Pilih Semua</span>
      </label>
      {isExpanded ? <ChevronUp /> : <ChevronDown />}
    </div>
  </div>
</div>
```

**Features:**

- Click anywhere on header to toggle
- "Pilih Semua" checkbox stops propagation (doesn't collapse accordion)
- Visual indicator (chevron) shows expand/collapse state
- Hover effect for better UX

---

### Image Display Logic

```typescript
{
  items.map((item) => {
    // Determine image source based on category
    let itemImage = item.imgUrl;

    // For gamepass and joki, use item image from details if available
    if (category === "gamepass" && item.gamepassDetails?.imgUrl) {
      itemImage = item.gamepassDetails.imgUrl;
    } else if (category === "joki" && item.jokiDetails?.imgUrl) {
      itemImage = item.jokiDetails.imgUrl;
    }

    return (
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100/20 to-primary-200/20">
        {/* For Robux services, use DollarSign icon */}
        {category === "robux_5_hari" || category === "robux_instant" ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-500/20">
            <DollarSign className="w-10 h-10 text-green-400" />
          </div>
        ) : itemImage ? (
          <Image
            src={itemImage}
            alt={item.itemName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {getCategoryIcon(item.type)}
          </div>
        )}
      </div>
    );
  });
}
```

---

## 🎯 Category-Specific Displays

### Robux 5 Hari

```
┌─────────────────────┐
│                     │
│        💲           │
│    (Green Icon)     │
│                     │
└─────────────────────┘
1000 Robux - 5 Hari
Rp 100,000
```

### Robux Instant

```
┌─────────────────────┐
│                     │
│        💲           │
│    (Green Icon)     │
│                     │
└─────────────────────┘
500 Robux - Instant
Rp 75,000
```

### Gamepass

```
┌─────────────────────┐
│                     │
│   [Item Image]      │
│   (Gamepass Icon)   │
│                     │
└─────────────────────┘
Blox Fruits - Leopard
Rp 150,000
```

### Joki

```
┌─────────────────────┐
│                     │
│   [Character Img]   │
│   (Rank Icon)       │
│                     │
└─────────────────────┘
PUBG - Crown
Rp 100,000
```

---

## 🧪 Testing Guide

### Test Case 1: Accordion Functionality

**Steps:**

1. Add items from multiple categories to cart
2. Open cart page
3. All accordions should be expanded by default
4. Click on "ROBUX 5 HARI" header
5. Section should collapse
6. Click again to expand

**Expected Result:**

- ✅ All sections expanded on first load
- ✅ Click header toggles expand/collapse
- ✅ Chevron icon changes (▼/▲)
- ✅ Smooth animation
- ✅ "Pilih Semua" checkbox doesn't collapse section

---

### Test Case 2: Robux Image Display

**Steps:**

1. Add "1000 Robux - 5 Hari" to cart
2. Add "500 Robux - Instant" to cart
3. Open cart page

**Expected Result:**

- ✅ Both items show green DollarSign ($) icon
- ✅ No game images
- ✅ Green gradient background
- ✅ Consistent styling

---

### Test Case 3: Joki/Gamepass Image Display

**Steps:**

1. Add PUBG - Crown (Joki) to cart
2. Add Blox Fruits - Leopard (Gamepass) to cart
3. Open cart page

**Expected Result:**

- ✅ Crown shows character/rank image (not PUBG logo)
- ✅ Leopard shows fruit image (not Blox Fruits logo)
- ✅ Images load correctly
- ✅ Fallback to root image if item image not available

---

### Test Case 4: Mixed Categories

**Steps:**

1. Add 2 Robux items
2. Add 3 Joki items
3. Add 1 Gamepass item
4. Open cart

**Expected Result:**

```
💎 ROBUX 5 HARI (1 item)              [▼]
  ☐ Pilih Semua
  ☐ [$] 1000 Robux...

⚡ ROBUX INSTANT (1 item)             [▼]
  ☐ Pilih Semua
  ☐ [$] 500 Robux...

🎯 JOKI (3 items)                     [▼]
  ☐ Pilih Semua
  ☐ [📷] PUBG - Crown
  ☐ [📷] PUBG - Ace
  ☐ [📷] Mobile Legends - Mythic

🎫 GAMEPASS (1 item)                  [▼]
  ☐ Pilih Semua
  ☐ [📷] Blox Fruits - Leopard
```

- ✅ All 4 categories displayed
- ✅ Correct item counts
- ✅ Correct images per category
- ✅ All expanded by default

---

### Test Case 5: Collapse/Expand States

**Steps:**

1. Cart has 3 categories
2. Collapse "ROBUX 5 HARI"
3. Collapse "JOKI"
4. Keep "GAMEPASS" expanded
5. Refresh page

**Expected Result:**

- ✅ Before refresh: 2 collapsed, 1 expanded
- ✅ After refresh: All expanded again (default state)
- ✅ State doesn't persist across sessions

---

## 📊 Before vs After

### Before

- ❌ Flat list of all items
- ❌ Hard to find items from specific category
- ❌ Robux items showed generic images
- ❌ Joki/Gamepass showed root game image
- ❌ Cluttered UI with many items

### After

- ✅ Organized by category with accordion
- ✅ Easy to focus on specific category
- ✅ Robux items show DollarSign icon
- ✅ Joki/Gamepass show actual item images
- ✅ Clean, collapsible UI

---

## 🎨 Visual Hierarchy

```
Cart Page
│
├── ROBUX 5 HARI Accordion
│   ├── [💲] Item 1 (DollarSign icon)
│   └── [💲] Item 2 (DollarSign icon)
│
├── ROBUX INSTANT Accordion
│   └── [💲] Item 1 (DollarSign icon)
│
├── GAMEPASS Accordion
│   ├── [📷] Item 1 (Actual gamepass image)
│   └── [📷] Item 2 (Actual gamepass image)
│
└── JOKI Accordion
    ├── [📷] Item 1 (Character/rank image)
    ├── [📷] Item 2 (Character/rank image)
    └── [📷] Item 3 (Character/rank image)
```

---

## 📝 Files Modified

1. ✅ `app/(public)/cart/page.tsx`
   - Added accordion state management
   - Added toggle functions
   - Updated imports (DollarSign, ChevronDown, ChevronUp)
   - Implemented smart image display logic
   - Added useEffect for auto-expand
   - Restructured category display with accordion

---

## 🚀 Benefits

### User Experience

- ✅ Better visual organization
- ✅ Easier to manage multiple categories
- ✅ Clear visual distinction between service types
- ✅ More intuitive image display

### Performance

- ✅ Same performance (no additional API calls)
- ✅ Images loaded on-demand per accordion
- ✅ Smooth animations

### Maintainability

- ✅ Clear separation of category logic
- ✅ Easy to add new categories
- ✅ Reusable accordion pattern

---

## 🎯 Status

✅ **COMPLETE** - Cart accordion and image improvements implemented

**Testing Checklist:**

- [ ] All categories show in accordion
- [ ] Expand/collapse works smoothly
- [ ] Robux items show DollarSign icon
- [ ] Joki items show character images
- [ ] Gamepass items show item images
- [ ] "Pilih Semua" works per category
- [ ] Accordion auto-expands on first load

---

**Last Updated:** October 6, 2025
