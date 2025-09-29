// src/app/admin/layout.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

// Admin-specific styles - Clean Dark Theme
const adminStyles = `
  /* Reset all styling and apply clean admin theme */
  .admin-layout {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    background: #0f172a !important;
    color: #f1f5f9 !important;
    line-height: 1.6 !important;
  }
  
  .admin-layout *,
  .admin-layout *::before,
  .admin-layout *::after {
    box-sizing: border-box !important;
  }
  
  /* Reset all backgrounds to admin theme */
  .admin-layout * {
    background: transparent !important;
    background-image: none !important;
    background-color: transparent !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }
  
  /* Admin Layout Structure */
  .admin-layout {
    background: #0f172a !important;
  }
  
  .admin-layout .sidebar {
    background: #1e293b !important;
    border-right: 1px solid #334155 !important;
  }
  
  .admin-layout .header {
    background: #1e293b !important;
    border-bottom: 1px solid #334155 !important;
  }
  
  .admin-layout .main-content {
    background: #0f172a !important;
  }
  
  /* Navigation */
  .admin-layout .nav-item {
    color: #94a3b8 !important;
    padding: 0.75rem !important;
    margin: 0.25rem !important;
    border-radius: 0.5rem !important;
    transition: all 0.2s ease !important;
    background: transparent !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
  }
  
  .admin-layout .nav-item:hover {
    background: #334155 !important;
    color: #f1f5f9 !important;
  }
  
  .admin-layout .nav-item.active {
    background: #3b82f6 !important;
    color: #ffffff !important;
  }
  
  /* Content Cards */
  .admin-layout .admin-card {
    background: #1e293b !important;
    border: 1px solid #334155 !important;
    border-radius: 0.75rem !important;
    padding: 1.5rem !important;
    margin-bottom: 1rem !important;
    color: #f1f5f9 !important;
  }
  
  /* Text Styling */
  .admin-layout h1,
  .admin-layout h2,
  .admin-layout h3,
  .admin-layout h4,
  .admin-layout h5,
  .admin-layout h6 {
    color: #f1f5f9 !important;
    font-weight: 600 !important;
    margin: 0 0 1rem 0 !important;
    line-height: 1.4 !important;
  }
  
  .admin-layout p,
  .admin-layout span,
  .admin-layout div,
  .admin-layout label {
    color: #f1f5f9 !important;
    margin: 0 !important;
  }
  
  .admin-layout .text-muted,
  .admin-layout .admin-text-muted {
    color: #94a3b8 !important;
  }
  
  /* Form Elements */
  .admin-layout input,
  .admin-layout textarea,
  .admin-layout select {
    background: #334155 !important;
    border: 1px solid #475569 !important;
    border-radius: 0.5rem !important;
    padding: 0.75rem !important;
    color: #f1f5f9 !important;
    font-size: 0.875rem !important;
    transition: border-color 0.2s ease !important;
  }
  
  .admin-layout input:focus,
  .admin-layout textarea:focus,
  .admin-layout select:focus {
    border-color: #3b82f6 !important;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
  }
  
  .admin-layout input::placeholder,
  .admin-layout textarea::placeholder {
    color: #64748b !important;
  }
  
  /* Buttons */
  .admin-layout button {
    background: #3b82f6 !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 0.5rem !important;
    padding: 0.75rem 1.5rem !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
  }
  
  .admin-layout button:hover {
    background: #2563eb !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15) !important;
  }
  
  .admin-layout button:active {
    transform: translateY(0) !important;
  }
  
  .admin-layout .btn-secondary {
    background: #64748b !important;
    color: #f1f5f9 !important;
  }
  
  .admin-layout .btn-secondary:hover {
    background: #475569 !important;
  }
  
  .admin-layout .btn-danger {
    background: #dc2626 !important;
    color: #ffffff !important;
  }
  
  .admin-layout .btn-danger:hover {
    background: #b91c1c !important;
  }
  
  /* Tables */
  .admin-layout table {
    background: #1e293b !important;
    border: 1px solid #334155 !important;
    border-radius: 0.75rem !important;
    width: 100% !important;
    border-collapse: separate !important;
    border-spacing: 0 !important;
    overflow: hidden !important;
  }
  
  .admin-layout th {
    background: #334155 !important;
    color: #f1f5f9 !important;
    font-weight: 600 !important;
    padding: 1rem !important;
    text-align: left !important;
    border-bottom: 1px solid #475569 !important;
  }
  
  .admin-layout td {
    color: #f1f5f9 !important;
    padding: 1rem !important;
    border-bottom: 1px solid #334155 !important;
  }
  
  .admin-layout tr:last-child td {
    border-bottom: none !important;
  }
  
  /* Links */
  .admin-layout a {
    color: #60a5fa !important;
    text-decoration: none !important;
    transition: color 0.2s ease !important;
  }
  
  .admin-layout a:hover {
    color: #93c5fd !important;
    text-decoration: underline !important;
  }
  
  /* Badges and Tags */
  .admin-layout .badge {
    background: #334155 !important;
    color: #f1f5f9 !important;
    padding: 0.25rem 0.75rem !important;
    border-radius: 9999px !important;
    font-size: 0.75rem !important;
    font-weight: 500 !important;
  }
  
  .admin-layout .badge-success {
    background: #16a34a !important;
    color: #ffffff !important;
  }
  
  .admin-layout .badge-warning {
    background: #d97706 !important;
    color: #ffffff !important;
  }
  
  .admin-layout .badge-danger {
    background: #dc2626 !important;
    color: #ffffff !important;
  }
  
  /* Modals and Dropdowns */
  .admin-layout .modal,
  .admin-layout .dropdown {
    background: #1e293b !important;
    border: 1px solid #334155 !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3) !important;
  }
  
  /* Scrollbars */
  .admin-layout *::-webkit-scrollbar {
    width: 8px !important;
    height: 8px !important;
  }
  
  .admin-layout *::-webkit-scrollbar-track {
    background: #1e293b !important;
  }
  
  .admin-layout *::-webkit-scrollbar-thumb {
    background: #475569 !important;
    border-radius: 4px !important;
  }
  
  .admin-layout *::-webkit-scrollbar-thumb:hover {
    background: #64748b !important;
  }
`;

interface MenuItem {
  title: string;
  icon: string;
  href: string;
}

const menuItems: MenuItem[] = [
  { title: "Dashboard", icon: "📊", href: "/admin/dashboard" },
  { title: "Transaksi", icon: "📦", href: "/admin/transactions" },
  { title: "Users", icon: "👥", href: "/admin/users" },
  { title: "Reviews", icon: "⭐", href: "/admin/reviews" },
  { title: "Roles", icon: "🎭", href: "/admin/roles" },
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
    <>
      {/* Admin-specific styles */}
      <style jsx global>
        {adminStyles}
      </style>

      <div
        className="admin-layout flex h-screen"
        style={{ background: "#1a1a1a" }}
      >
        {/* Sidebar */}
        <aside
          className={`sidebar ${
            sidebarOpen ? "w-64" : "w-20"
          } transition-all duration-300 ease-in-out border-r`}
          style={{
            background: "#0f172a",
            borderColor: "#1e293b",
          }}
        >
          <div className="flex h-full flex-col">
            {/* Logo */}
            <div
              className="flex h-16 items-center justify-between px-6 border-b"
              style={{ borderColor: "#1e293b" }}
            >
              <h2
                className={`font-bold text-xl ${!sidebarOpen && "hidden"}`}
                style={{ color: "#ffffff" }}
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
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: "#1e293b" }}
            >
              <p
                className={`text-sm ${!sidebarOpen && "hidden"}`}
                style={{ color: "#9ca3af" }}
              >
                Welcome back,
              </p>
              <p
                className={`font-semibold ${!sidebarOpen && "hidden"}`}
                style={{ color: "#ffffff" }}
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
                  className={`nav-item flex items-center px-3 py-3 mb-1 rounded-lg transition-colors ${
                    pathname === item.href ? "active" : ""
                  }`}
                  style={{
                    backgroundColor:
                      pathname === item.href ? "#3b82f6" : "transparent",
                    color: pathname === item.href ? "#ffffff" : "#94a3b8",
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== item.href) {
                      e.currentTarget.style.backgroundColor = "#334155";
                      e.currentTarget.style.color = "#f1f5f9";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== item.href) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#94a3b8";
                    }
                  }}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className={`ml-3 ${!sidebarOpen && "hidden"}`}>
                    {item.title}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Logout */}
            <div
              className="px-3 py-4 border-t"
              style={{ borderColor: "#334155" }}
            >
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-3 rounded-lg transition-colors"
                style={{ color: "#94a3b8" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#334155";
                  e.currentTarget.style.color = "#f1f5f9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#94a3b8";
                }}
              >
                <span className="text-xl">🚪</span>
                <span className={`ml-3 ${!sidebarOpen && "hidden"}`}>
                  Logout
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header
            className="header shadow-sm border-b"
            style={{
              background: "#1e293b",
              borderColor: "#334155",
            }}
          >
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <h1
                  className="text-2xl font-semibold"
                  style={{ color: "#f1f5f9" }}
                >
                  {menuItems.find((item) => item.href === pathname)?.title ||
                    "Dashboard"}
                </h1>

                {/* Notification & Profile */}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main
            className="main-content flex-1 overflow-x-hidden overflow-y-auto"
            style={{ background: "#0f172a" }}
          >
            <div
              className="container mx-auto px-6 py-8 "
              style={{ color: "#f1f5f9" }}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
