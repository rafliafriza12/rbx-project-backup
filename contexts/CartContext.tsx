"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface CartItem {
  _id: string;
  // Primary fields (sesuai dengan Transaction model)
  serviceType: "robux" | "gamepass" | "joki";
  serviceId: string | number; // Allow both string and number
  serviceName: string;
  serviceImage: string;
  serviceCategory?: string; // For robux services

  // Legacy fields untuk backward compatibility
  type?: "rbx5" | "rbx-instant" | "gamepass" | "joki";
  gameId?: string;
  gameName: string;
  itemName: string;
  imgUrl: string;

  // Pricing (sesuai Transaction model)
  unitPrice: number;
  price: number; // Keep for backward compatibility
  quantity: number;
  totalAmount?: number;

  description?: string;

  // Service-specific fields
  gameType?: string;
  robuxAmount?: number;
  gamepassAmount?: number;
  estimatedTime?: string;
  additionalInfo?: string;

  // Service details (sesuai Transaction model)
  gamepass?: {
    id: number;
    name: string;
    price: number;
    productId: number;
    sellerId: number;
  };
  gamepassDetails?: {
    gameName: string;
    itemName: string;
    imgUrl: string;
    developer?: string;
    features?: string[];
    caraPesan?: string[];
  };
  jokiDetails?: {
    gameName?: string;
    itemName?: string;
    imgUrl?: string;
    description?: string;
    gameType?: string;
    targetLevel?: string;
    estimatedTime?: string;
    notes?: string;
    additionalInfo?: string;
    syaratJoki?: string[];
    prosesJoki?: string[];
    features?: string[];
  };
  robuxInstantDetails?: {
    notes?: string;
    additionalInfo?: string;
  };
  rbx5Details?: {
    robuxAmount?: number;
    packageName?: string;
    selectedPlace?: {
      placeId: number;
      name: string;
      universeId?: number;
    };
    gamepassAmount?: number;
    gamepassCreated?: boolean;
    gamepass?: {
      id: number;
      name: string;
      price: number;
      productId: number;
      sellerId: number;
    };
    pricePerRobux?: any;
    backupCode?: string;
  };

  // User credentials for service processing
  robloxUsername?: string;
  robloxPassword?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  loading: boolean;
  addToCart: (item: Omit<CartItem, "_id">) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!user) {
      setItems([]);
      setItemCount(0);
      return;
    }

    try {
      setLoading(true);

      const userId = (user as any)?.id || (user as any)?._id;
      if (!userId) {
        console.error("User ID not found");
        return;
      }

      const response = await fetch(`/api/cart?userId=${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setItemCount(
          data.items?.reduce(
            (total: number, item: CartItem) => total + item.quantity,
            0
          ) || 0
        );
      } else {
        console.error(
          "Failed to refresh cart:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error refreshing cart:", error);
      setItems([]);
      setItemCount(0);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (item: Omit<CartItem, "_id">): Promise<boolean> => {
    if (!user) return false;

    try {
      const userId = (user as any)?.id || (user as any)?._id;
      if (!userId) {
        console.error("User ID not found");
        return false;
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...item,
          userId,
        }),
      });

      if (response.ok) {
        await refreshCart();
        return true;
      } else {
        const errorData = await response.json();
        console.error("Failed to add to cart:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      return false;
    }
  };

  const updateQuantity = async (
    itemId: string,
    quantity: number
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const userId = (user as any)?.id || (user as any)?._id;
      if (!userId) {
        console.error("User ID not found");
        return false;
      }

      const response = await fetch("/api/cart/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, itemId, quantity }),
      });

      if (response.ok) {
        await refreshCart();
        return true;
      } else {
        const errorData = await response.json();
        console.error("Failed to update quantity:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      return false;
    }
  };

  const removeItem = async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const userId = (user as any)?.id || (user as any)?._id;
      if (!userId) {
        console.error("User ID not found");
        return false;
      }

      const response = await fetch(
        `/api/cart?userId=${encodeURIComponent(
          userId
        )}&itemId=${encodeURIComponent(itemId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        await refreshCart();
        return true;
      } else {
        const errorData = await response.json();
        console.error("Failed to remove item:", errorData);
        return false;
      }
    } catch (error) {
      console.error("Error removing item:", error);
      return false;
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const value: CartContextType = {
    items,
    itemCount,
    loading,
    addToCart,
    updateQuantity,
    removeItem,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
