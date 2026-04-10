"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

export default function FloatingCartButton() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const [isVisible, setIsVisible] = useState(true);

  // Hide on mobile and when user is not logged in
  useEffect(() => {
    const checkScreenSize = () => {
      setIsVisible(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!user || !isVisible) {
    return null;
  }

  return (
    <Link
      href="/cart"
      className="fixed bottom-6 right-6 z-50 group focus:outline-none"
    >
      <div className="relative bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white p-4 rounded-full shadow-lg hover:shadow-2xl hover:shadow-primary-100/40 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1">
        <ShoppingCart className="w-6 h-6" />

        {/* Cart Count Badge */}
        {itemCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
            {itemCount > 99 ? "99+" : itemCount}
          </div>
        )}

        {/* Floating animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-100/50 to-primary-200/50 rounded-full blur-lg opacity-60 group-hover:opacity-80 transition-opacity duration-300 -z-10"></div>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-sm text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
          Keranjang Belanja
          {itemCount > 0 && (
            <span className="ml-2 bg-primary-100 text-white px-2 py-0.5 rounded-full text-xs">
              {itemCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
