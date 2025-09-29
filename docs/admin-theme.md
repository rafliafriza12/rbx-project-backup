# Admin Theme Documentation

## Overview

Tema admin telah dibuat ulang dengan dark theme yang bersih dan profesional. Tema ini sepenuhnya terpisah dari tema public yang menggunakan warna purple/violet dengan gradient.

## Color Scheme

### Main Colors

- **Background Primary**: `#0f172a` (slate-900) - Background utama
- **Background Secondary**: `#1e293b` (slate-800) - Cards, header, sidebar
- **Background Tertiary**: `#334155` (slate-700) - Form elements, borders
- **Background Accent**: `#475569` (slate-600) - Hover states

### Text Colors

- **Primary Text**: `#f1f5f9` (slate-100) - Text utama
- **Secondary Text**: `#94a3b8` (slate-400) - Text muted
- **Muted Text**: `#64748b` (slate-500) - Placeholder, disabled

### Accent Colors

- **Primary Blue**: `#3b82f6` (blue-500) - Active states, buttons
- **Primary Blue Hover**: `#2563eb` (blue-600) - Hover states
- **Success**: `#16a34a` (green-600)
- **Warning**: `#d97706` (amber-600)
- **Danger**: `#dc2626` (red-600)

## Layout Structure

### Main Layout

```
.admin-layout
├── .sidebar (Background: #1e293b)
│   ├── Navigation items
│   └── Logout button
├── .header (Background: #1e293b)
│   └── Page title
└── .main-content (Background: #0f172a)
    └── Page content
```

### CSS Classes

#### Utility Classes

- `.admin-card` - Standard card styling
- `.admin-text-primary` - Primary text color
- `.admin-text-secondary` - Secondary text color
- `.admin-text-muted` - Muted text color

#### Button Classes

- Default button - Primary blue styling
- `.btn-secondary` - Gray secondary button
- `.btn-danger` - Red danger button

## Component Usage

### AdminCard

```tsx
import { AdminCard } from "@/components/admin/AdminCard";

<AdminCard title="Dashboard Stats">
  <p>Your content here</p>
</AdminCard>;
```

### AdminStatsCard

```tsx
import { AdminStatsCard } from "@/components/admin/AdminCard";

<AdminStatsCard
  title="Total Users"
  value="1,234"
  trend="up"
  trendValue="+12%"
/>;
```

### AdminButton

```tsx
import { AdminButton } from "@/components/admin/AdminCard";

<AdminButton variant="primary" size="md">
  Save Changes
</AdminButton>;
```

### AdminTable

```tsx
import {
  AdminTable,
  AdminTableRow,
  AdminTableCell,
} from "@/components/admin/AdminCard";

<AdminTable headers={["Name", "Email", "Status"]}>
  <AdminTableRow>
    <AdminTableCell>John Doe</AdminTableCell>
    <AdminTableCell>john@example.com</AdminTableCell>
    <AdminTableCell>Active</AdminTableCell>
  </AdminTableRow>
</AdminTable>;
```

## Form Elements

### Input Styling

- Background: `#334155`
- Border: `#475569`
- Focus Border: `#3b82f6`
- Text: `#f1f5f9`
- Placeholder: `#64748b`

### Button Styling

- Primary: Background `#3b82f6`, Hover `#2563eb`
- Secondary: Background `#64748b`, Hover `#475569`
- Danger: Background `#dc2626`, Hover `#b91c1c`

## Override System

Tema admin menggunakan sistem override yang komprehensif untuk memastikan tidak ada kontaminasi dari tema public:

1. **Reset Global**: Menghapus semua background, gradient, dan styling dari tema public
2. **Specific Targeting**: Menggunakan `.admin-layout` sebagai scope utama
3. **Important Declarations**: Menggunakan `!important` untuk memastikan override berhasil
4. **Component Isolation**: Setiap komponen admin memiliki styling tersendiri

## Best Practices

1. **Gunakan Admin Components**: Selalu gunakan komponen admin yang sudah dibuat untuk konsistensi
2. **Avoid Inline Styles**: Gunakan CSS classes yang sudah disediakan
3. **Test Theme Isolation**: Pastikan tidak ada styling public yang bocor ke admin
4. **Consistent Spacing**: Gunakan padding/margin yang konsisten (0.75rem, 1rem, 1.5rem)
5. **Accessible Colors**: Pastikan kontras warna memenuhi standar aksesibilitas

## Migration Notes

Jika ada komponen admin yang masih menggunakan tema lama:

1. Wrap dengan `admin-card` class
2. Gunakan admin color utilities
3. Ganti button dengan `AdminButton` component
4. Update table dengan `AdminTable` component
5. Test untuk memastikan tidak ada kontaminasi tema

## Examples

### Dashboard Page

```tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <AdminCard title="Overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminStatsCard
            title="Users"
            value="1,234"
            trend="up"
            trendValue="+5%"
          />
          <AdminStatsCard
            title="Orders"
            value="567"
            trend="down"
            trendValue="-2%"
          />
          <AdminStatsCard
            title="Revenue"
            value="$12,345"
            trend="up"
            trendValue="+15%"
          />
        </div>
      </AdminCard>

      <AdminCard title="Recent Activities">
        <AdminTable headers={["Time", "Action", "User"]}>
          <AdminTableRow>
            <AdminTableCell>10:30 AM</AdminTableCell>
            <AdminTableCell>User Registration</AdminTableCell>
            <AdminTableCell>john@example.com</AdminTableCell>
          </AdminTableRow>
        </AdminTable>
      </AdminCard>
    </div>
  );
}
```

Tema admin sekarang sudah benar-benar terpisah dan memiliki identitas visual yang kuat dengan dark theme yang profesional.
