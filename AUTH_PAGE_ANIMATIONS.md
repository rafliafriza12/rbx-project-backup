# Auth Page Animations Documentation

## Overview

Animasi transisi halaman telah ditambahkan ke halaman **Login** dan **Register** menggunakan Framer Motion untuk memberikan pengalaman pengguna yang lebih smooth dan modern.

---

## 🎬 Animasi yang Diterapkan

### 1. **Login Page** (`/login`)

#### **Full Page Fade In**

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
```

- Halaman muncul dengan fade in dari opacity 0 → 1
- Durasi: 300ms
- Smooth exit animation saat pindah halaman

#### **Left Section (Branding) - Slide from Left**

```tsx
<motion.div
  initial={{ opacity: 0, x: -50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
>
```

- Konten branding slide dari kiri (-50px)
- Fade in bersamaan
- Durasi: 500ms
- Delay: 200ms (muncul setelah background)

#### **Right Section (Form) - Slide from Right**

```tsx
<motion.div
  initial={{ opacity: 0, x: 50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.5, delay: 0.4 }}
>
```

- Form login slide dari kanan (+50px)
- Fade in bersamaan
- Durasi: 500ms
- Delay: 400ms (muncul terakhir)

---

### 2. **Register Page** (`/register`)

#### **Full Page Fade In**

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
```

- Sama seperti login page
- Konsisten untuk semua auth pages

#### **Left Section (Branding) - Slide from Left**

```tsx
<motion.div
  initial={{ opacity: 0, x: -50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.5, delay: 0.2 }}
>
```

- Konsisten dengan login page
- Branding muncul dari kiri

#### **Right Section (Form) - Slide from Right**

```tsx
<motion.div
  initial={{ opacity: 0, x: 50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.5, delay: 0.4 }}
>
```

- Form register slide dari kanan
- Timing sama dengan login

---

## ⏱️ Timeline Animasi

```
0ms     → Page starts loading
0-300ms → Background fade in (opacity 0 → 1)
200ms   → Left section starts (slide from left + fade)
400ms   → Right section starts (slide from right + fade)
700ms   → All animations complete
```

**Total Animation Duration: ~700ms**

---

## 📋 Implementation Details

### Dependencies

```json
{
  "framer-motion": "^10.x.x"
}
```

### Import Statement

```tsx
import { motion } from "framer-motion";
```

### Pattern Used

- **Fade In/Out**: opacity transition
- **Slide In**: x-axis translation (-50px or +50px)
- **Stagger Effect**: Sequential delays (0ms → 200ms → 400ms)

---

## 🎨 Animation Properties

| Property     | Value                           | Purpose                         |
| ------------ | ------------------------------- | ------------------------------- |
| `initial`    | `{ opacity: 0, x: -50 }`        | Starting state (hidden, offset) |
| `animate`    | `{ opacity: 1, x: 0 }`          | End state (visible, centered)   |
| `exit`       | `{ opacity: 0 }`                | Exit animation (fade out)       |
| `transition` | `{ duration: 0.5, delay: 0.2 }` | Animation timing                |

---

## ✅ Pages with Animations

- ✅ **Login Page** (`/login`)
- ✅ **Register Page** (`/register`)
- ❌ **Admin Login Page** (`/admin-login`) - No animations (as requested)

---

## 🚀 User Experience Benefits

1. **Smooth Transitions**: No jarring page loads
2. **Professional Feel**: Modern, polished interface
3. **Visual Hierarchy**: Content appears in logical order (branding → form)
4. **Attention Guiding**: Animations direct user focus
5. **Reduced Perceived Load Time**: Users engaged during load

---

## 🔧 Customization

### Adjust Animation Speed

```tsx
transition={{ duration: 0.3 }} // Faster (300ms)
transition={{ duration: 1.0 }} // Slower (1000ms)
```

### Adjust Slide Distance

```tsx
initial={{ opacity: 0, x: -100 }} // Slide further from left
initial={{ opacity: 0, x: -20 }}  // Slide less from left
```

### Remove Delay

```tsx
transition={{ duration: 0.5 }} // No delay
```

### Add Bounce Effect

```tsx
transition={{
  duration: 0.5,
  delay: 0.2,
  type: "spring",
  stiffness: 100
}}
```

---

## 📱 Responsive Behavior

Animasi tetap smooth di semua ukuran layar:

- **Mobile**: Animasi vertikal (stack layout)
- **Tablet**: Partial horizontal split
- **Desktop**: Full horizontal split dengan slide kiri-kanan

---

## 🐛 Troubleshooting

### Animation Not Working

1. Check Framer Motion is installed:

   ```bash
   npm install framer-motion
   ```

2. Verify import statement present

3. Check `motion.div` closing tags match

### Performance Issues

- Reduce animation duration
- Remove delays
- Simplify transitions

### Animation Conflicts

- Ensure no CSS transitions conflicting
- Remove `transition-all` from elements with motion

---

## 📝 Notes

- Admin login page deliberately excluded from animations
- Background effects (blur circles) remain CSS-based for performance
- Exit animations prepared for future routing transitions
- All timing values can be customized per requirements

---

**Last Updated**: October 13, 2025
