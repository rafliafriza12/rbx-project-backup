// src/app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  title: string;
  icon: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", icon: "📊", href: "/admin/dashboard" },
  { title: "Transaksi", icon: "📦", href: "/admin/transactions" },
  { title: "Users", icon: "👥", href: "/admin/users" },
  { title: "Produk Robux", icon: "🎮", href: "/admin/products" },
  { title: "Harga Robux", icon: "💰", href: "/admin/robux-pricing" },
  { title: "Gamepass", icon: "🎯", href: "/admin/gamepass" },
  { title: "Jasa Joki", icon: "🚀", href: "/admin/joki" },
  { title: "Email Management", icon: "📧", href: "/admin/email-management" },
  // { title: "Metode Pembayaran", icon: "💳", href: "/admin/payment-methods" },
  { title: "Pengaturan", icon: "⚙️", href: "/admin/settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userName, setUserName] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      // setSidebarOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    // Get user name from cookie
    const cookies = document.cookie.split(";");
    const userNameCookie = cookies.find((c) =>
      c.trim().startsWith("user_name=")
    );
    if (userNameCookie) {
      setUserName(decodeURIComponent(userNameCookie.split("=")[1]));
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#1D2938]">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 transition-all duration-300 ease-in-out border border-gray-800`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
            <h2
              className={`text-white font-bold text-xl ${
                !sidebarOpen && "hidden"
              }`}
            >
              RBX Admin
            </h2>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    sidebarOpen
                      ? "M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      : "M13 5l7 7-7 7M5 5l7 7-7 7"
                  }
                />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 border-b border-slate-800">
            <p className={`text-gray-400 text-sm ${!sidebarOpen && "hidden"}`}>
              Welcome back,
            </p>
            <p
              className={`text-white font-semibold ${!sidebarOpen && "hidden"}`}
            >
              {userName || "Admin"}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-3 mb-1 rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`ml-3 ${!sidebarOpen && "hidden"}`}>
                  {item.title}
                </span>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-3 py-3 text-gray-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
            >
              <span className="text-xl">🚪</span>
              <span className={`ml-3 ${!sidebarOpen && "hidden"}`}>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-white">
                {menuItems.find((item) => item.href === pathname)?.title ||
                  "Dashboard"}
              </h1>

              {/* Notification & Profile */}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
