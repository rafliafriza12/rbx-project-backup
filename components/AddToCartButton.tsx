"use client";
import { useState } from "react";
import { ShoppingCart, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { toast } from "react-toastify";

interface AddToCartButtonProps {
  // Primary fields (sesuai Transaction model)
  serviceType?: "robux" | "gamepass" | "joki";
  serviceId: string | number;
  serviceName: string;
  serviceImage: string;
  serviceCategory?: string; // For robux services

  // Legacy fields untuk backward compatibility
  type?: "rbx5" | "rbx-instant" | "gamepass" | "joki";
  gameId?: string;
  gameName: string;
  itemName: string;
  imgUrl: string;

  // Pricing
  unitPrice?: number; // Sesuai Transaction model
  price: number; // Keep for backward compatibility
  quantity?: number;

  description?: string;
  className?: string;
  children?: React.ReactNode;

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
  jokiDetails?: {
    description?: string;
    gameType?: string;
    targetLevel?: string;
    estimatedTime?: string;
    notes?: string;
  };
  robuxInstantDetails?: {
    notes?: string;
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
  };

  // User credentials
  robloxUsername?: string;
  robloxPassword?: string;
}

export default function AddToCartButton({
  serviceType,
  serviceId,
  serviceName,
  serviceImage,
  serviceCategory,
  type,
  gameId,
  gameName,
  itemName,
  imgUrl,
  unitPrice,
  price,
  description,
  quantity = 1,
  className = "",
  children,
  gameType,
  robuxAmount,
  gamepassAmount,
  estimatedTime,
  additionalInfo,
  gamepass,
  jokiDetails,
  robuxInstantDetails,
  rbx5Details,
  robloxUsername,
  robloxPassword,
}: AddToCartButtonProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    setIsLoading(true);

    try {
      // Map legacy type ke serviceType jika perlu
      let finalServiceType = serviceType;
      if (!finalServiceType && type) {
        switch (type) {
          case "rbx5":
          case "rbx-instant":
            finalServiceType = "robux";
            break;
          case "gamepass":
            finalServiceType = "gamepass";
            break;
          case "joki":
            finalServiceType = "joki";
            break;
        }
      }

      const success = await addToCart({
        serviceType: finalServiceType || "robux",
        serviceId,
        serviceName,
        serviceImage,
        serviceCategory,
        type,
        gameId,
        gameName,
        itemName,
        imgUrl,
        unitPrice: unitPrice || price,
        price,
        totalAmount: (unitPrice || price) * quantity,
        description,
        quantity,
        gameType,
        robuxAmount,
        gamepassAmount,
        estimatedTime,
        additionalInfo,
        gamepass,
        jokiDetails,
        robuxInstantDetails,
        rbx5Details,
        robloxUsername,
        robloxPassword,
      });

      if (success) {
        toast.success("Item berhasil ditambahkan ke keranjang!");
      } else {
        toast.error("Gagal menambahkan item ke keranjang");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error instanceof Error && error.message.includes("authentication")) {
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
      } else {
        toast.error("Terjadi kesalahan saat menambahkan ke keranjang");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading}
      className={`relative group flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-primary-100/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${className}`}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Menambahkan...</span>
        </>
      ) : (
        <>
          {children || (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>Tambah ke Keranjang</span>
            </>
          )}
        </>
      )}
    </button>
  );
}
