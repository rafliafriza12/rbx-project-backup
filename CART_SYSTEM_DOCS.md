# 🛒 Keranjang Belanja - Cart System Documentation

## Overview

Sistem keranjang belanja terintegrasi dengan tema purple neon website yang mendukung 4 kategori produk: RBX5, RBX Instant, Gamepass, dan Joki.

## ✨ Features

### 🎯 **Core Functionality**

- ✅ **Add to Cart** - Tambah item dengan kategori berbeda
- ✅ **Update Quantity** - Ubah jumlah item di keranjang
- ✅ **Remove Items** - Hapus item dari keranjang
- ✅ **Select Items** - Pilih item untuk checkout
- ✅ **Real-time Updates** - Sinkronisasi otomatis dengan database

### 🔐 **Authentication Integration**

- ✅ **Login Required** - Hanya user yang login bisa akses keranjang
- ✅ **User-specific Cart** - Setiap user memiliki keranjang terpisah
- ✅ **Session Persistence** - Keranjang tersimpan antar session

### 📱 **Responsive Design**

- ✅ **Desktop** - Floating cart button di pojok kanan bawah
- ✅ **Mobile** - Cart icon di navbar mobile menu
- ✅ **Cart Page** - Responsive layout untuk semua device

## 🎨 Design System

### **Purple Neon Theme**

```css
/* Primary Colors */
from-primary-100 to-primary-200  /* Main gradient */
bg-gradient-to-br from-[#22102A] via-[#22102A] to-[#3D1A78]  /* Background */

/* Glassmorphism Effects */
bg-white/5 backdrop-blur-lg border border-white/10  /* Cards */
hover:shadow-2xl hover:shadow-primary-100/30  /* Hover effects */
```

### **Category Icons & Colors**

- 🎮 **RBX5** - "Rbx 5 Hari"
- ⚡ **RBX Instant** - "Rbx Instant"
- 🎫 **Gamepass** - "Gamepass"
- 🎯 **Joki** - "Joki"

## 🔧 Implementation Guide

### **1. Using AddToCartButton Component**

```tsx
import AddToCartButton from "@/components/AddToCartButton";

// Basic Usage
<AddToCartButton
  type="gamepass"
  gameId="game123"
  gameName="Pet Simulator X"
  itemName="VIP Gamepass"
  imgUrl="/gamepass-image.jpg"
  price={50000}
  description="VIP access with exclusive pets"
/>

// Custom Styling
<AddToCartButton
  type="joki"
  gameName="Brookhaven"
  itemName="Level 100 Boost"
  imgUrl="/joki-image.jpg"
  price={25000}
  className="w-full py-3"
>
  <Plus className="w-4 h-4" />
  <span>Tambah Joki</span>
</AddToCartButton>
```

### **2. Using Cart Context**

```tsx
import { useCart } from "@/contexts/CartContext";

function MyComponent() {
  const {
    items, // Cart items array
    itemCount, // Total item count
    loading, // Loading state
    addToCart, // Add item function
    updateQuantity, // Update quantity function
    removeItem, // Remove item function
    refreshCart, // Refresh cart data
  } = useCart();

  // Add item programmatically
  const handleAddItem = async () => {
    const success = await addToCart({
      type: "rbx-instant",
      gameName: "Roblox",
      itemName: "1000 Robux",
      imgUrl: "/robux.jpg",
      price: 100000,
      quantity: 1,
    });

    if (success) {
      toast.success("Item added to cart!");
    }
  };
}
```

### **3. Cart Navigation Integration**

**Desktop Floating Button:**

- Automatically shows when user is logged in
- Hidden on mobile (< 1024px)
- Shows item count badge
- Located at bottom-right corner

**Mobile Navbar:**

- Cart icon in mobile menu
- Only visible when user is logged in
- Shows "Keranjang" text with icon

## 📡 API Endpoints

### **GET /api/cart**

Fetch user's cart items

```typescript
Response: {
  items: CartItem[],
  total: number
}
```

### **POST /api/cart**

Add item to cart

```typescript
Body: {
  type: "rbx5" | "rbx-instant" | "gamepass" | "joki",
  gameId?: string,
  gameName: string,
  itemName: string,
  imgUrl: string,
  price: number,
  quantity?: number,
  description?: string
}
```

### **PUT /api/cart/update**

Update item quantity

```typescript
Body: {
  itemId: string,
  quantity: number
}
```

### **DELETE /api/cart/remove**

Remove item from cart

```typescript
Body: {
  itemId: string;
}
```

### **GET /api/cart/count**

Get cart item count

```typescript
Response: {
  count: number;
}
```

## 🗃️ Database Schema

### **Cart Model (MongoDB)**

```typescript
interface ICart {
  userId: ObjectId; // Reference to User
  items: ICartItem[]; // Array of cart items
  createdAt: Date;
  updatedAt: Date;
}

interface ICartItem {
  _id?: ObjectId;
  type: "rbx5" | "rbx-instant" | "gamepass" | "joki";
  gameId?: string; // Optional game reference
  gameName: string; // Display name
  itemName: string; // Item display name
  imgUrl: string; // Item image
  price: number; // Price in rupiah
  quantity: number; // Item quantity
  description?: string; // Optional description
}
```

## 🚀 Key Features Implemented

### **✅ Completed Features:**

1. **Full Cart System** - Add, update, remove, select items
2. **Purple Neon Theme** - Consistent dengan website
3. **Responsive Design** - Desktop floating button + mobile navbar
4. **Authentication Integration** - Login required
5. **Real-time Updates** - CartContext dengan auto-sync
6. **Category Support** - RBX5, RBX Instant, Gamepass, Joki
7. **API Routes** - Complete CRUD operations
8. **Database Models** - Mongoose schema with validation
9. **Error Handling** - Toast notifications
10. **Performance** - Optimized with loading states

### **📋 Ready to Use:**

- Halaman Cart: `/cart`
- AddToCartButton component
- FloatingCartButton (desktop)
- Cart icon di navbar (mobile)
- CartContext untuk state management
- Complete API backend

### **🔄 Next Steps:**

1. Integrate dengan payment system
2. Add checkout functionality
3. Implement order history
4. Add cart persistence across devices
5. Enhanced cart analytics

## 🎯 Usage Examples

**Gamepass Page Integration:**

```tsx
// Di halaman gamepass detail
<AddToCartButton
  type="gamepass"
  gameId={gamepass._id}
  gameName={gamepass.gameName}
  itemName={item.itemName}
  imgUrl={item.imgUrl}
  price={item.price}
  className="w-full mt-4"
/>
```

**Joki Service Integration:**

```tsx
// Di halaman joki detail
<AddToCartButton
  type="joki"
  gameId={joki._id}
  gameName={joki.gameName}
  itemName={service.serviceName}
  imgUrl={joki.imgUrl}
  price={service.price}
  description={service.description}
/>
```

**RBX Products Integration:**

```tsx
// Di halaman RBX5 atau RBX Instant
<AddToCartButton
  type="rbx5"
  gameName="Roblox"
  itemName="1000 Robux (5 Hari)"
  imgUrl="/robux-5-hari.jpg"
  price={robuxPrice}
  className="btn-primary"
/>
```

---

**🚀 Keranjang belanja sekarang siap digunakan dengan tema purple neon yang konsisten!** ✨
