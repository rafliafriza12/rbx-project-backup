# ⚠️ Feature: Robux 5 Hari - Single Item Selection Limit

> **🆕 UPDATED:** Backend validation telah ditambahkan! Lihat **[ROBUX_5_HARI_SINGLE_ITEM_VALIDATION.md](./ROBUX_5_HARI_SINGLE_ITEM_VALIDATION.md)** untuk dokumentasi lengkap.

## 🎯 Overview

Implemented special selection rule for Robux 5 Hari category where users can only select 1 item per checkout.

**Last Updated:** October 10, 2025  
**Status:** ✅ **FULLY VALIDATED** (Frontend + Backend)

---

## 📋 Business Logic

### Why This Restriction?

**Problem:**

- Robux 5 Hari requires **gamepass automation** per transaction
- Webhook/admin must process gamepass creation individually using Roblox API
- Multiple items would cause automation conflicts (which gamepass to create?)
- Each transaction needs unique gamepass data (placeId, productId, sellerId)

**Solution:**

- Limit to **1 Rbx 5 Hari item** per checkout (enforced in frontend AND backend)
- Users can still add multiple Rbx 5 Hari items to cart
- But can only checkout 1 at a time
- API validates and rejects if multiple Rbx5 items detected

---

## ✅ **VALIDATION LAYERS**

| Layer                         | Status         | Documentation                                                                          |
| ----------------------------- | -------------- | -------------------------------------------------------------------------------------- |
| Frontend - Cart UI            | ✅ Implemented | This file (below)                                                                      |
| Frontend - RBX5 Page          | ✅ Implemented | Always sends 1 item                                                                    |
| Backend - Multi Checkout API  | ✅ Implemented | See [ROBUX_5_HARI_SINGLE_ITEM_VALIDATION.md](./ROBUX_5_HARI_SINGLE_ITEM_VALIDATION.md) |
| Backend - Direct Purchase API | ✅ Implemented | See [ROBUX_5_HARI_SINGLE_ITEM_VALIDATION.md](./ROBUX_5_HARI_SINGLE_ITEM_VALIDATION.md) |

---

## ✨ Implementation

### 1. **Updated Selection Logic**

**File:** `app/(public)/cart/page.tsx`

```typescript
const toggleSelectItem = (itemId: string) => {
  const item = cartItems.find((i) => i._id === itemId);
  if (!item) return;

  const itemCategory = getServiceCategory(item);
  const currentSelectedCategory = getSelectedCategory();

  // Special rule for Robux 5 Hari: only 1 item can be selected
  if (itemCategory === "robux_5_hari") {
    // If trying to select and already have one selected
    if (selectedItems.length > 0 && !selectedItems.includes(itemId)) {
      toast.error(
        "Robux 5 Hari hanya bisa memilih 1 item per checkout. Hapus pilihan sebelumnya untuk memilih item lain."
      );
      return;
    }
    // Toggle selection (select or deselect)
    setSelectedItems((prev) => (prev.includes(itemId) ? [] : [itemId]));
    return;
  }

  // ... rest of selection logic for other categories
};
```

**Behavior:**

- If user clicks on Robux 5 Hari item #1 → Selected ✅
- If user clicks on Robux 5 Hari item #2 → Error toast ❌
- User must deselect item #1 first before selecting item #2

---

### 2. **Updated "Pilih Semua" Logic**

```typescript
const toggleSelectAll = (category?: string) => {
  if (category) {
    // Special rule for Robux 5 Hari: only 1 item allowed
    if (category === "robux_5_hari") {
      const categoryItems = groupedItems[category] || [];
      const categoryItemIds = categoryItems.map((item) => item._id);

      // Check if any item is selected
      const anySelected = categoryItemIds.some((id) =>
        selectedItems.includes(id)
      );

      if (anySelected) {
        // Deselect all
        setSelectedItems([]);
      } else {
        // Select only the first item
        if (categoryItemIds.length > 0) {
          setSelectedItems([categoryItemIds[0]]);
          toast.info(
            "Robux 5 Hari: Hanya 1 item yang dapat dipilih per checkout"
          );
        }
      }
      return;
    }

    // ... rest of select all logic for other categories
  }
};
```

**Behavior:**

- Click "Pilih Semua" on Robux 5 Hari → Only first item selected
- Shows info toast explaining limitation
- If any item already selected → Deselect all

---

### 3. **Visual Indicators**

#### A. Category Header Badge

```tsx
<p className="text-white/60 text-sm">
  {items.length} item{items.length > 1 ? "s" : ""}
  {category === "robux_5_hari" && (
    <span className="ml-2 text-yellow-400 text-xs">
      (Max 1 item per checkout)
    </span>
  )}
</p>
```

**Display:**

```
💎 ROBUX 5 HARI
2 items (Max 1 item per checkout)
```

#### B. Warning Banner

```tsx
{
  /* Special notice for Robux 5 Hari */
}
{
  groupedItems["robux_5_hari"] && groupedItems["robux_5_hari"].length > 0 && (
    <div className="bg-yellow-500/10 backdrop-blur-lg border border-yellow-500/30 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="text-yellow-400 text-xl">⚠️</div>
        <div className="flex-1">
          <p className="text-yellow-300 text-sm font-medium mb-1">
            Perhatian: Robux 5 Hari
          </p>
          <p className="text-yellow-200/70 text-xs">
            Untuk kategori Robux 5 Hari, Anda{" "}
            <strong>hanya dapat memilih 1 item</strong> per checkout. Ini karena
            sistem pemrosesan yang memerlukan waktu 5 hari per transaksi.
          </p>
        </div>
      </div>
    </div>
  );
}
```

**Display:**

```
┌────────────────────────────────────────────┐
│ ⚠️  Perhatian: Robux 5 Hari                │
│                                            │
│  Untuk kategori Robux 5 Hari, Anda        │
│  hanya dapat memilih 1 item per checkout. │
│  Ini karena sistem pemrosesan yang        │
│  memerlukan waktu 5 hari per transaksi.   │
└────────────────────────────────────────────┘
```

---

## 🎨 User Experience Flow

### Scenario 1: Select First Item

**User Actions:**

1. Cart has 3 Robux 5 Hari items
2. User clicks checkbox on Item #1

**Result:**

- ✅ Item #1 selected
- ⬜ Item #2 not selected
- ⬜ Item #3 not selected

---

### Scenario 2: Try to Select Second Item

**User Actions:**

1. Item #1 already selected
2. User clicks checkbox on Item #2

**Result:**

- ❌ Error toast appears
- 🔴 "Robux 5 Hari hanya bisa memilih 1 item per checkout. Hapus pilihan sebelumnya untuk memilih item lain."
- ✅ Item #1 remains selected
- ⬜ Item #2 not selected

---

### Scenario 3: Switch Selection

**User Actions:**

1. Item #1 selected
2. User deselects Item #1 (click checkbox again)
3. User selects Item #2

**Result:**

- ⬜ Item #1 deselected
- ✅ Item #2 selected
- ⬜ Item #3 not selected

---

### Scenario 4: Click "Pilih Semua"

**User Actions:**

1. Cart has 3 Robux 5 Hari items
2. User clicks "Pilih Semua" checkbox

**Result:**

- ✅ Only Item #1 (first item) selected
- ⬜ Item #2 not selected
- ⬜ Item #3 not selected
- ℹ️ Info toast: "Robux 5 Hari: Hanya 1 item yang dapat dipilih per checkout"

---

## 🧪 Testing Guide

### Test Case 1: Single Selection

**Steps:**

1. Add 3 different Robux 5 Hari items to cart
2. Go to cart page
3. Select Item #1
4. Try to select Item #2

**Expected Result:**

- ✅ Item #1 selected
- ❌ Error toast when trying to select Item #2
- ⬜ Item #2 remains unselected
- ⬜ Item #3 remains unselected

---

### Test Case 2: "Pilih Semua" Button

**Steps:**

1. Cart has 3 Robux 5 Hari items
2. All items unchecked
3. Click "Pilih Semua" checkbox in Robux 5 Hari accordion header

**Expected Result:**

- ✅ Only first item gets selected
- ℹ️ Info toast appears
- ⬜ Other items remain unselected

---

### Test Case 3: Deselect and Reselect

**Steps:**

1. Select Item #1 (1000 Robux)
2. Click Item #1 checkbox again to deselect
3. Select Item #2 (500 Robux)

**Expected Result:**

- Step 1: ✅ Item #1 selected
- Step 2: ⬜ Item #1 deselected
- Step 3: ✅ Item #2 selected
- ✅ No errors

---

### Test Case 4: Warning Banner Display

**Steps:**

1. Add Robux 5 Hari items to cart
2. Open cart page

**Expected Result:**

- ✅ Yellow warning banner visible at top
- ✅ Message explains 1 item limit
- ✅ Banner only shows when Robux 5 Hari items exist

---

### Test Case 5: Other Categories Unaffected

**Steps:**

1. Add 3 Joki items to cart
2. Select all 3 Joki items
3. Proceed to checkout

**Expected Result:**

- ✅ All 3 Joki items can be selected
- ✅ No 1-item restriction for other categories
- ✅ Normal multi-select behavior

---

### Test Case 6: Mixed Categories

**Steps:**

1. Cart has:
   - 2 Robux 5 Hari items
   - 3 Joki items
2. Select 1 Robux 5 Hari item
3. Try to select Joki item

**Expected Result:**

- ❌ Error: "Tidak bisa memilih item dari kategori berbeda"
- ✅ Original category restriction still applies

---

## 📊 Comparison with Other Categories

| Category         | Max Items per Checkout | "Pilih Semua" Behavior  |
| ---------------- | ---------------------- | ----------------------- |
| **Robux 5 Hari** | **1 item**             | Selects only first item |
| Robux Instant    | Unlimited              | Selects all items       |
| Gamepass         | Unlimited              | Selects all items       |
| Joki             | Unlimited              | Selects all items       |

---

## 💡 Error Messages

### 1. Try to Select Multiple Items

```
❌ Robux 5 Hari hanya bisa memilih 1 item per checkout.
   Hapus pilihan sebelumnya untuk memilih item lain.
```

### 2. Click "Pilih Semua"

```
ℹ️ Robux 5 Hari: Hanya 1 item yang dapat dipilih per checkout
```

---

## 🎯 Visual Elements

### Cart Page with Robux 5 Hari

```
┌─────────────────────────────────────────────┐
│ ⚠️  Perhatian: Robux 5 Hari                 │
│  Hanya 1 item per checkout                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 💎 ROBUX 5 HARI (3 items)         [▼]      │
│    (Max 1 item per checkout)                │
│    ☐ Pilih Semua                            │
├─────────────────────────────────────────────┤
│  ☑ [💲] 1000 Robux - 5 Hari                 │
│     Qty: 1         Rp 100,000               │
│                                             │
│  ☐ [💲] 500 Robux - 5 Hari                  │
│     Qty: 1         Rp 75,000                │
│                                             │
│  ☐ [💲] 2000 Robux - 5 Hari                 │
│     Qty: 1         Rp 180,000               │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🎯 JOKI (2 items)                  [▼]      │
│    ☐ Pilih Semua                            │
├─────────────────────────────────────────────┤
│  ☐ [📷] PUBG - Crown                        │
│  ☐ [📷] Mobile Legends - Mythic             │
└─────────────────────────────────────────────┘
```

---

## 📝 Files Modified

1. ✅ `app/(public)/cart/page.tsx`
   - Updated `toggleSelectItem()` with Robux 5 Hari check
   - Updated `toggleSelectAll()` with special handling
   - Added warning banner component
   - Added badge in category header

---

## 🚀 Benefits

### Business

- ✅ Prevents processing conflicts
- ✅ Clear communication to users
- ✅ Reduces support tickets
- ✅ Maintains service quality

### User Experience

- ✅ Clear visual indicators
- ✅ Helpful error messages
- ✅ Can't make mistakes
- ✅ Understands limitation upfront

### Technical

- ✅ Clean implementation
- ✅ Doesn't affect other categories
- ✅ Easy to maintain
- ✅ Consistent with existing patterns

---

## 🎯 Status

✅ **COMPLETE** - Robux 5 Hari single item selection implemented

**Testing Checklist:**

- [ ] Can select 1 Robux 5 Hari item
- [ ] Cannot select 2+ Robux 5 Hari items
- [ ] Error toast appears on invalid selection
- [ ] "Pilih Semua" only selects first item
- [ ] Warning banner displays correctly
- [ ] Badge shows in category header
- [ ] Other categories unaffected
- [ ] Can deselect and select different item

---

**Last Updated:** October 6, 2025
