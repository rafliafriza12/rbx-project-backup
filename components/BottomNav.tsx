"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  MessageCircle,
  Receipt,
  User,
  LogIn,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Chat",
      href: user ? "/chat" : "/login",
      icon: MessageCircle,
      isActive: pathname === "/chat",
    },
    {
      label: "Transaksi",
      href: "/riwayat",
      icon: Receipt,
      isActive: pathname === "/riwayat" || pathname === "/track-order",
    },
    {
      label: user ? "Profil" : "Login",
      href: user ? "/profile" : "/login",
      icon: user ? User : LogIn,
      isActive: pathname === "/profile" || pathname === "/login",
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-tertiary/95 backdrop-blur-lg border-t border-white/10">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[60px] ${
              item.isActive
                ? "text-primary-100"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.isActive ? "drop-shadow-[0_0_6px_rgba(246,58,230,0.5)]" : ""}`} />
            <span className={`text-[10px] font-semibold ${item.isActive ? "text-primary-100" : ""}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Safe area for phones with home indicator */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
