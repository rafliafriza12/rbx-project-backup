# Admin Theme Guide

## Overview

Admin area menggunakan tema dark minimal yang hanya mengoverride elemen yang konflicting dengan tema public. Untuk elemen cards/sections, gunakan class khusus admin.

## Admin Classes

### Cards & Containers

```tsx
<div className="admin-card p-6">// Content here</div>
```

### Text Colors

```tsx
<h1 className="admin-text-primary">Primary Text (White)</h1>
<p className="admin-text-secondary">Secondary Text (Light Gray)</p>
<span className="admin-text-muted">Muted Text (Dark Gray)</span>
```

### Buttons

```tsx
<button className="admin-btn-primary">Primary Action</button>
<button className="admin-btn-secondary">Secondary Action</button>
```

## What Gets Auto-Overridden

- `bg-primary-*` classes → Dark gray background
- `bg-gradient-*` classes → Solid dark background
- `text-primary-*` classes → White text
- `shadow-primary-*` classes → Dark shadows

## Manual Styling Needed For

- Regular divs without background classes
- Sections that need card appearance
- Custom components

## Best Practices

### ✅ DO - Use admin classes for cards:

```tsx
<div className="admin-card p-6 mb-4">
  <h2 className="admin-text-primary text-xl font-bold">Dashboard Stats</h2>
  <p className="admin-text-secondary">System overview</p>
</div>
```

### ❌ DON'T - Rely on auto-override:

```tsx
<div className="p-6 mb-4">
  {" "}
  {/* Won't get styled automatically */}
  <h2>Title</h2>
</div>
```

## Color Palette

- **admin-card**: `#1f2937` background, `#374151` border
- **admin-text-primary**: `#ffffff` (white)
- **admin-text-secondary**: `#9ca3af` (light gray)
- **admin-text-muted**: `#6b7280` (dark gray)
- **admin-btn-primary**: `#3b82f6` (blue)
- **admin-btn-secondary**: `#6b7280` (gray)
