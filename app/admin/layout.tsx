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
  .admin-layout label {
    color: #f1f5f9 !important;
  }
  
  .admin-layout p {
    margin-bottom: 0.5rem !important;
  }
  
  .admin-layout label {
    margin-bottom: 0.5rem !important;
    display: inline-block !important;
  }
  
  .admin-layout .text-muted,
  .admin-layout .admin-text-muted {
    color: #94a3b8 !important;
  }
  
  /* Spacing utilities - preserve Tailwind spacing */
  .admin-layout .space-y-1 > * + * {
    margin-top: 0.25rem !important;
  }
  
  .admin-layout .space-y-2 > * + * {
    margin-top: 0.5rem !important;
  }
  
  .admin-layout .space-y-3 > * + * {
    margin-top: 0.75rem !important;
  }
  
  .admin-layout .space-y-4 > * + * {
    margin-top: 1rem !important;
  }
  
  .admin-layout .space-y-6 > * + * {
    margin-top: 1.5rem !important;
  }
  
  .admin-layout .space-y-8 > * + * {
    margin-top: 2rem !important;
  }
  
  /* Horizontal spacing */
  .admin-layout .space-x-1 > * + * {
    margin-left: 0.25rem !important;
  }
  
  .admin-layout .space-x-2 > * + * {
    margin-left: 0.5rem !important;
  }
  
  .admin-layout .space-x-3 > * + * {
    margin-left: 0.75rem !important;
  }
  
  .admin-layout .space-x-4 > * + * {
    margin-left: 1rem !important;
  }
  
  /* Gap utilities for flex/grid */
  .admin-layout .gap-1 {
    gap: 0.25rem !important;
  }
  
  .admin-layout .gap-2 {
    gap: 0.5rem !important;
  }
  
  .admin-layout .gap-3 {
    gap: 0.75rem !important;
  }
  
  .admin-layout .gap-4 {
    gap: 1rem !important;
  }
  
  .admin-layout .gap-5 {
    gap: 1.25rem !important;
  }
  
  .admin-layout .gap-6 {
    gap: 1.5rem !important;
  }
  
  .admin-layout .gap-8 {
    gap: 2rem !important;
  }
  
  /* Margin utilities */
  .admin-layout .mb-1 { margin-bottom: 0.25rem !important; }
  .admin-layout .mb-2 { margin-bottom: 0.5rem !important; }
  .admin-layout .mb-3 { margin-bottom: 0.75rem !important; }
  .admin-layout .mb-4 { margin-bottom: 1rem !important; }
  .admin-layout .mb-5 { margin-bottom: 1.25rem !important; }
  .admin-layout .mb-6 { margin-bottom: 1.5rem !important; }
  .admin-layout .mb-8 { margin-bottom: 2rem !important; }
  
  .admin-layout .mt-1 { margin-top: 0.25rem !important; }
  .admin-layout .mt-2 { margin-top: 0.5rem !important; }
  .admin-layout .mt-3 { margin-top: 0.75rem !important; }
  .admin-layout .mt-4 { margin-top: 1rem !important; }
  .admin-layout .mt-6 { margin-top: 1.5rem !important; }
  .admin-layout .mt-8 { margin-top: 2rem !important; }
  
  .admin-layout .mr-1 { margin-right: 0.25rem !important; }
  .admin-layout .mr-2 { margin-right: 0.5rem !important; }
  .admin-layout .mr-3 { margin-right: 0.75rem !important; }
  .admin-layout .mr-4 { margin-right: 1rem !important; }
  
  .admin-layout .ml-2 { margin-left: 0.5rem !important; }
  .admin-layout .ml-3 { margin-left: 0.75rem !important; }
  
  /* Padding utilities */
  .admin-layout .p-2 { padding: 0.5rem !important; }
  .admin-layout .p-3 { padding: 0.75rem !important; }
  .admin-layout .p-4 { padding: 1rem !important; }
  .admin-layout .p-6 { padding: 1.5rem !important; }
  .admin-layout .p-8 { padding: 2rem !important; }
  
  .admin-layout .px-2 { padding-left: 0.5rem !important; padding-right: 0.5rem !important; }
  .admin-layout .px-3 { padding-left: 0.75rem !important; padding-right: 0.75rem !important; }
  .admin-layout .px-4 { padding-left: 1rem !important; padding-right: 1rem !important; }
  .admin-layout .px-6 { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
  
  .admin-layout .py-1 { padding-top: 0.25rem !important; padding-bottom: 0.25rem !important; }
  .admin-layout .py-2 { padding-top: 0.5rem !important; padding-bottom: 0.5rem !important; }
  .admin-layout .py-3 { padding-top: 0.75rem !important; padding-bottom: 0.75rem !important; }
  .admin-layout .py-4 { padding-top: 1rem !important; padding-bottom: 1rem !important; }
  .admin-layout .py-6 { padding-top: 1.5rem !important; padding-bottom: 1.5rem !important; }
  
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
  .admin-layout .dropdown,
  .admin-layout [class*="modal"],
  .admin-layout [class*="Modal"] {
    background: #1e293b !important;
    border: 1px solid #334155 !important;
    border-radius: 0.75rem !important;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5) !important;
  }
  
  /* Modal Overlay/Backdrop */
  .admin-layout .bg-opacity-75 {
    background-color: rgba(17, 24, 39, 0.75) !important;
  }
  
  .admin-layout .fixed.inset-0 {
    background-color: rgba(0, 0, 0, 0.75) !important;
  }
  
  /* Specific classes for cards and containers */
  .admin-layout .bg-gray-800 {
    background-color: #1e293b !important;
  }
  
  .admin-layout .bg-gray-900 {
    background-color: #0f172a !important;
  }
  
  .admin-layout .bg-gray-700 {
    background-color: #334155 !important;
  }
  
  .admin-layout .bg-white {
    background-color: #1e293b !important;
  }
  
  .admin-layout .bg-blue-900 {
    background-color: #1e3a8a !important;
  }
  
  .admin-layout .bg-green-900 {
    background-color: #14532d !important;
  }
  
  .admin-layout .bg-purple-900 {
    background-color: #581c87 !important;
  }
  
  .admin-layout .bg-green-600 {
    background-color: #16a34a !important;
  }
  
  .admin-layout .bg-blue-600 {
    background-color: #2563eb !important;
  }
  
  .admin-layout .bg-yellow-500 {
    background-color: #eab308 !important;
  }
  
  .admin-layout .bg-green-500 {
    background-color: #22c55e !important;
  }
  
  .admin-layout .bg-red-500 {
    background-color: #ef4444 !important;
  }
  
  .admin-layout .bg-red-900\/50,
  .admin-layout .bg-red-900 {
    background-color: rgba(127, 29, 29, 0.5) !important;
  }
  
  /* Divide colors for tables */
  .admin-layout .divide-gray-700 > * + * {
    border-color: #334155 !important;
  }
  
  /* Border colors */
  .admin-layout .border-gray-700 {
    border-color: #334155 !important;
  }
  
  .admin-layout .border-gray-600 {
    border-color: #475569 !important;
  }
  
  .admin-layout .border-blue-700 {
    border-color: #1d4ed8 !important;
  }
  
  .admin-layout .border-green-700 {
    border-color: #15803d !important;
  }
  
  .admin-layout .border-purple-700 {
    border-color: #7e22ce !important;
  }
  
  .admin-layout .border-blue-500 {
    border-color: #3b82f6 !important;
  }
  
  .admin-layout .border-green-500 {
    border-color: #22c55e !important;
  }
  
  .admin-layout .border-red-500 {
    border-color: #ef4444 !important;
  }
  
  /* Hover states */
  .admin-layout .hover\:bg-gray-700:hover {
    background-color: #334155 !important;
  }
  
  .admin-layout .hover\:bg-green-700:hover {
    background-color: #15803d !important;
  }
  
  .admin-layout .hover\:bg-blue-700:hover {
    background-color: #1d4ed8 !important;
  }
  
  /* Ensure proper backgrounds for specific components */
  .admin-layout div[class*="rounded"],
  .admin-layout div[class*="shadow"] {
    background: inherit !important;
  }
  
  .admin-layout div[class*="p-"][class*="bg-"],
  .admin-layout section[class*="bg-"] {
    background: #1e293b !important;
  }
  
  /* Stats Cards */
  .admin-layout [class*="stat"],
  .admin-layout [class*="card"] {
    background: #1e293b !important;
    border: 1px solid #334155 !important;
  }
  
  /* Image containers should have transparent background */
  .admin-layout img {
    background: transparent !important;
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
  
  /* Fix for transparent elements that should have background */
  .admin-layout .max-w-4xl,
  .admin-layout .max-w-6xl,
  .admin-layout .max-w-7xl {
    background: #1e293b !important;
  }
  
  /* Grid utilities */
  .admin-layout .grid {
    display: grid !important;
  }
  
  .admin-layout .grid-cols-1 {
    grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
  }
  
  .admin-layout .grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
  
  .admin-layout .grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
  }
  
  @media (min-width: 768px) {
    .admin-layout .md\\:grid-cols-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
    
    .admin-layout .md\\:grid-cols-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
    
    .admin-layout .md\\:space-x-3 > * + * {
      margin-left: 0.75rem !important;
    }
  }
  
  /* Flex utilities */
  .admin-layout .flex {
    display: flex !important;
  }
  
  .admin-layout .inline-flex {
    display: inline-flex !important;
  }
  
  .admin-layout .flex-1 {
    flex: 1 1 0% !important;
  }
  
  .admin-layout .items-center {
    align-items: center !important;
  }
  
  .admin-layout .justify-center {
    justify-content: center !important;
  }
  
  .admin-layout .justify-between {
    justify-content: space-between !important;
  }
  
  /* Rounded utilities */
  .admin-layout .rounded {
    border-radius: 0.25rem !important;
  }
  
  .admin-layout .rounded-md {
    border-radius: 0.375rem !important;
  }
  
  .admin-layout .rounded-lg {
    border-radius: 0.5rem !important;
  }
  
  .admin-layout .rounded-full {
    border-radius: 9999px !important;
  }
  
  /* Shadow utilities */
  .admin-layout .shadow {
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1) !important;
  }
  
  .admin-layout .shadow-sm {
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
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
  { title: "Banner", icon: "🎨", href: "/admin/banners" },
  { title: "Metode Pembayaran", icon: "💳", href: "/admin/payment-methods" },
  { title: "Email Management", icon: "📧", href: "/admin/email-management" },
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
