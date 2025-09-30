# 🔄 Cart Data Structure Update - Integration with Checkout

## Overview

Data structure cart telah disesuaikan dengan format checkout untuk memastikan kompatibilitas seamless antara keranjang belanja dan proses pembayaran. Data yang disimpan di cart sekarang langsung compatible dengan format yang diperlukan halaman checkout.

## 🆕 **Updated Cart Data Structure**

### **ICartItem Interface (Updated)**

```typescript
interface ICartItem {
  _id?: mongoose.Types.ObjectId;
  type: "rbx5" | "rbx-instant" | "gamepass" | "joki";

  // Core service information (required for checkout)
  serviceId: string; // ID dari service/produk
  serviceName: string; // Nama layanan lengkap
  serviceImage: string; // URL gambar service
  serviceCategory?: string; // robux_5_hari, robux_instant, dll

  // Legacy fields (tetap ada untuk compatibility)
  gameId?: string;
  gameName: string;
  itemName: string;
  imgUrl: string;
  price: number;
  quantity: number;
  description?: string;

  // Additional service-specific fields
  gameType?: string; // Untuk joki (RPG, Action, dll)
  robuxAmount?: number; // Untuk robux services
  gamepassAmount?: number; // Untuk gamepass
  estimatedTime?: string; // Untuk joki (2-4 hours)
  additionalInfo?: string; // Info tambahan
}
```

## 🔧 **Updated Components**

### **1. AddToCartButton - New Required Props**

```tsx
<AddToCartButton
  // Required new props
  serviceId="gamepass_123" // Unique service ID
  serviceName="VIP Gamepass - Pet Sim X" // Full service name
  serviceImage="/gamepass-premium.jpg" // Service image URL
  // Optional category for robux services
  serviceCategory="robux_5_hari" // robux_5_hari | robux_instant
  // Existing props (unchanged)
  type="gamepass"
  gameName="Pet Simulator X"
  itemName="VIP Gamepass"
  imgUrl="/gamepass-image.jpg"
  price={50000}
  // Optional service-specific props
  gameType="Simulation" // For joki services
  robuxAmount={1000} // For robux services
  gamepassAmount={1} // For gamepass
  estimatedTime="Instant" // For joki services
  additionalInfo="Premium features" // Additional notes
/>
```

### **2. Cart Page - Checkout Integration**

```typescript
// Automatic data transformation for checkout
const handleCheckout = () => {
  const checkoutData = selectedItems.map((item) => ({
    serviceType:
      item.type === "rbx5"
        ? "robux"
        : item.type === "rbx-instant"
        ? "robux"
        : item.type,
    serviceId: item.serviceId,
    serviceName: item.serviceName,
    serviceImage: item.serviceImage || item.imgUrl,
    serviceCategory:
      item.type === "rbx5"
        ? "robux_5_hari"
        : item.type === "rbx-instant"
        ? "robux_instant"
        : item.serviceCategory,
    quantity: item.quantity,
    unitPrice: item.price,
    // ... all other checkout-required fields
  }));

  // Direct integration with checkout page
  sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData[0]));
  router.push("/checkout");
};
```

## 📋 **Service-Specific Examples**

### **1. Robux 5 Hari Service**

```tsx
<AddToCartButton
  type="rbx5"
  serviceId="rbx5_1000_robux"
  serviceName="1000 Robux (5 Hari)"
  serviceImage="/assets/robux-5-hari.png"
  serviceCategory="robux_5_hari"
  gameName="Roblox"
  itemName="1000 Robux"
  imgUrl="/assets/robux-5-hari.png"
  price={100000}
  robuxAmount={1000}
  additionalInfo="Delivered via GamePass system"
/>
```

### **2. Robux Instant Service**

```tsx
<AddToCartButton
  type="rbx-instant"
  serviceId="rbx_instant_500"
  serviceName="500 Robux (Instant)"
  serviceImage="/assets/robux-instant.png"
  serviceCategory="robux_instant"
  gameName="Roblox"
  itemName="500 Robux"
  imgUrl="/assets/robux-instant.png"
  price={75000}
  robuxAmount={500}
  additionalInfo="Instant delivery - requires password"
/>
```

### **3. Gamepass Service**

```tsx
<AddToCartButton
  type="gamepass"
  serviceId="gamepass_pet_sim_vip"
  serviceName="VIP Gamepass - Pet Simulator X"
  serviceImage="/assets/pet-sim-vip.jpg"
  serviceCategory="premium_gamepass"
  gameId="pet_simulator_x_123"
  gameName="Pet Simulator X"
  itemName="VIP Gamepass"
  imgUrl="/assets/pet-sim-vip.jpg"
  price={50000}
  gamepassAmount={1}
  description="Access to VIP area with exclusive pets"
/>
```

### **4. Joki Service**

```tsx
<AddToCartButton
  type="joki"
  serviceId="joki_brookhaven_level_boost"
  serviceName="Level 100 Boost - Brookhaven RP"
  serviceImage="/assets/brookhaven-joki.jpg"
  gameId="brookhaven_rp_456"
  gameName="Brookhaven RP"
  itemName="Level 100 Boost"
  imgUrl="/assets/brookhaven-joki.jpg"
  price={25000}
  description="Professional level boosting service"
  gameType="Roleplay"
  estimatedTime="2-4 hours"
  additionalInfo="Safe account boost with security measures"
/>
```

## 🔄 **Data Flow: Cart → Checkout**

### **Before (Manual Data Entry)**

```
Cart Item → User fills checkout form → Manual data entry
```

### **After (Seamless Integration)**

```
Cart Item → Select & Checkout → Auto-populated checkout → Payment
```

### **Checkout Data Transformation**

```typescript
// Cart data automatically transforms to checkout format:
Cart Item: {
  type: "rbx5",
  serviceId: "rbx5_1000",
  serviceName: "1000 Robux (5 Hari)",
  price: 100000,
  quantity: 1,
  robuxAmount: 1000
}

↓ Transforms to ↓

Checkout Data: {
  serviceType: "robux",
  serviceId: "rbx5_1000",
  serviceName: "1000 Robux (5 Hari)",
  serviceCategory: "robux_5_hari",
  unitPrice: 100000,
  quantity: 1,
  totalAmount: 100000,
  robuxAmount: 1000
}
```

## 🚀 **Benefits of Updated Structure**

### **1. Seamless Checkout Integration**

- ✅ No manual data re-entry in checkout
- ✅ Consistent service information
- ✅ Proper category mapping for different service types

### **2. Enhanced Service Support**

- ✅ Specific fields for each service type
- ✅ Detailed service metadata
- ✅ Flexible additional information storage

### **3. Better User Experience**

- ✅ One-click checkout from cart
- ✅ Pre-populated service details
- ✅ Accurate pricing and service info

### **4. Developer Experience**

- ✅ Type-safe data structures
- ✅ Clear service differentiation
- ✅ Easy service-specific handling

## 📝 **Migration Notes**

### **Existing Cart Items**

- Legacy cart items will continue to work
- New fields are optional with fallbacks
- Gradual migration as items are added/updated

### **API Compatibility**

- All existing API endpoints unchanged
- New fields stored automatically
- Backward compatibility maintained

### **Required Updates for New Services**

When adding items to cart, now include:

```typescript
// Minimum required for new structure:
{
  serviceId: "unique_service_id",
  serviceName: "Full Service Name",
  serviceImage: "/path/to/image.jpg"
}
```

---

**🎯 Cart system sekarang fully integrated dengan checkout process untuk seamless user experience!** ✨
