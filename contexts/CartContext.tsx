"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCartItems,
  addToCartAction,
  updateCartQuantity,
  removeCartItem,
} from "@/app/lib/actions";

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
        return;
      }

      const result = await getCartItems();

      if (result.ok) {
        const data = result.data;
        setItems(data.items || []);
        setItemCount(
          data.items?.reduce(
            (total: number, item: CartItem) => total + item.quantity,
            0,
          ) || 0,
        );
      } else {
      }
    } catch (error) {
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
        return false;
      }

      const result = await addToCartAction({
        ...item,
        userId,
      });

      if (result.ok) {
        await refreshCart();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const updateQuantityFn = async (
    itemId: string,
    quantity: number,
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const userId = (user as any)?.id || (user as any)?._id;
      if (!userId) {
        return false;
      }

      const result = await updateCartQuantity(userId, itemId, quantity);

      if (result.ok) {
        await refreshCart();
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const removeItemFn = async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const userId = (user as any)?.id || (user as any)?._id;
      if (!userId) {
        return false;
      }

      const result = await removeCartItem(itemId);

      if (result.ok) {
        await refreshCart();
        return true;
      } else {
        return false;
      }
    } catch (error) {
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
    updateQuantity: updateQuantityFn,
    removeItem: removeItemFn,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
