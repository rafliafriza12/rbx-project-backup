"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
const PublicAppHeader: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLinkClick = () => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  };

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [pathname]);
  return (
    <header className="flex w-full justify-between px-4 md:px-20 py-4 items-center sticky top-0 z-[9999] backdrop-blur-md bg-gradient-elegant-primary/95 shadow-lg border-b border-cyan-400/30 glass-card">
      <Image
        src="/logo.png"
        alt="RID Logo"
        width={100}
        height={40}
        className="object-contain"
      />

      <nav className="space-x-6 font-medium hidden md:flex">
        <Link
          href="/"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 ${
            pathname === "/"
              ? "text-cyan-400 font-bold drop-shadow-[0px_0px_9px_#00F5FF]"
              : "text-white hover:text-cyan-400 hover:drop-shadow-[0px_0px_6px_#00F5FF] font-medium"
          }`}
        >
          Home
        </Link>
        <Link
          href="/rbx5"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 ${
            pathname === "/rbx5"
              ? "text-cyan-400 font-bold drop-shadow-[0px_0px_9px_#00F5FF]"
              : "text-white hover:text-cyan-400 hover:drop-shadow-[0px_0px_6px_#00F5FF] font-medium"
          }`}
        >
          Robux 5 Hari
        </Link>
        <Link
          href="/robux-instant"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 ${
            pathname.includes("robux-instant")
              ? "text-cyan-400 font-bold drop-shadow-[0px_0px_9px_#00F5FF]"
              : "text-white hover:text-cyan-400 hover:drop-shadow-[0px_0px_6px_#00F5FF] font-medium"
          }`}
        >
          Robux Instan
        </Link>
        <Link
          href="/gamepass"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 ${
            pathname.includes("gamepass")
              ? "text-cyan-400 font-bold drop-shadow-[0px_0px_9px_#00F5FF]"
              : "text-white hover:text-cyan-400 hover:drop-shadow-[0px_0px_6px_#00F5FF] font-medium"
          }`}
        >
          Gamepass
        </Link>
        <Link
          href="/joki"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 ${
            pathname.includes("joki")
              ? "text-cyan-400 font-bold drop-shadow-[0px_0px_9px_#00F5FF]"
              : "text-white hover:text-cyan-400 hover:drop-shadow-[0px_0px_6px_#00F5FF] font-medium"
          }`}
        >
          Jasa Joki
        </Link>
        <Link
          href="/leaderboard"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 ${
            pathname.includes("leaderboard")
              ? "text-cyan-400 font-bold drop-shadow-[0px_0px_9px_#00F5FF]"
              : "text-white hover:text-cyan-400 hover:drop-shadow-[0px_0px_6px_#00F5FF] font-medium"
          }`}
        >
          Leaderboard
        </Link>
        <Link
          href="/track-order"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 ${
            pathname.includes("track-order")
              ? "text-cyan-400 font-bold drop-shadow-[0px_0px_9px_#00F5FF]"
              : "text-white hover:text-cyan-400 hover:drop-shadow-[0px_0px_6px_#00F5FF] font-medium"
          }`}
        >
          Cek Pesanan
        </Link>
      </nav>

      <div className="space-x-4 hidden md:flex items-center">
        {user ? (
          // Tampilan setelah login
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 focus:outline-none"
            >
              <Image
                src="/char1.png" // Ganti dengan path avatar pengguna
                alt="User Profile"
                width={40}
                height={40}
                className="rounded-full object-cover"
              />
              <span className="font-semibold">
                {user.firstName} {user.lastName}
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  isProfileOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Profile */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 glass-card bg-gradient-elegant-primary/95 rounded-lg shadow-xl z-50 py-2 border border-cyan-400/30 glow-cyan">
                <Link
                  href="/profile"
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-sm text-white hover:bg-cyan-400/20 hover:text-cyan-400 rounded-lg mx-2 transition-all duration-300"
                >
                  Profil Saya
                </Link>
                <Link
                  href="/riwayat"
                  onClick={handleLinkClick}
                  className="block px-4 py-2 text-sm text-white hover:bg-cyan-400/20 hover:text-cyan-400 rounded-lg mx-2 transition-all duration-300"
                >
                  Riwayat Pesanan
                </Link>
                {isAdmin() && (
                  <>
                    <hr className="my-1 border-cyan-400/30 mx-2" />
                    <Link
                      href="/admin/dashboard"
                      onClick={handleLinkClick}
                      className="block px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-400/20 hover:text-emerald-300 rounded-lg mx-2 transition-all duration-300"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={handleLinkClick}
                      className="block px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-400/20 hover:text-emerald-300 rounded-lg mx-2 transition-all duration-300"
                    >
                      Kelola Pengguna
                    </Link>
                  </>
                )}
                <hr className="my-1 border-cyan-400/30 mx-2" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-400/20 hover:text-rose-300 rounded-lg mx-2 transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          // Tampilan sebelum login
          <>
            <Link
              href={"/register"}
              className="bg-gradient-button-primary text-white px-6 py-2 rounded-lg font-semibold glow-cyan
                                   transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:brightness-110"
            >
              Sign up
            </Link>
            <Link
              href={"/login"}
              className="border-2 border-[#00FF88] text-[#00FF88] px-6 py-2 rounded-lg font-semibold
                                 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:glow-mint
                                 hover:bg-[#00FF88] hover:text-[#3E1E68]"
            >
              Login
            </Link>
          </>
        )}
      </div>

      <button
        className="md:hidden text-white focus:outline-none"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      <div
        className={`absolute top-full left-0 w-full z-50 md:hidden px-6 py-4
                              transform transition-all duration-300 ease-in-out
                              ${
                                isMenuOpen
                                  ? "opacity-100 translate-y-0"
                                  : "opacity-0 -translate-y-2 pointer-events-none"
                              }
                              glass-card bg-gradient-elegant-primary/95 backdrop-blur-md shadow-xl rounded-b-xl border border-cyan-400/30 glow-white`}
      >
        <Link
          href="/"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname === "/"
              ? "text-cyan-400 font-bold bg-cyan-400/20 glow-cyan"
              : "text-white hover:text-cyan-400 hover:bg-cyan-400/10"
          }`}
        >
          Home
        </Link>
        <Link
          href="/rbx5"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname === "/rbx5"
              ? "text-cyan-400 font-bold bg-cyan-400/20 glow-cyan"
              : "text-white hover:text-cyan-400 hover:bg-cyan-400/10"
          }`}
        >
          Robux 5 Hari
        </Link>
        <Link
          href="/robux-instant"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("robux-instant")
              ? "text-cyan-400 font-bold bg-cyan-400/20 glow-cyan"
              : "text-white hover:text-cyan-400 hover:bg-cyan-400/10"
          }`}
        >
          Robux Instan
        </Link>
        <Link
          href="/gamepass"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("gamepass")
              ? "text-cyan-400 font-bold bg-cyan-400/20 glow-cyan"
              : "text-white hover:text-cyan-400 hover:bg-cyan-400/10"
          }`}
        >
          Gamepass
        </Link>
        <Link
          href="/joki"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("joki")
              ? "text-cyan-400 font-bold bg-cyan-400/20 glow-cyan"
              : "text-white hover:text-cyan-400 hover:bg-cyan-400/10"
          }`}
        >
          Jasa Joki
        </Link>
        <Link
          href="/leaderboard"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("leaderboard")
              ? "text-cyan-400 font-bold bg-cyan-400/20 glow-cyan"
              : "text-white hover:text-cyan-400 hover:bg-cyan-400/10"
          }`}
        >
          Leaderboard
        </Link>
        <Link
          href="/track-order"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("track-order")
              ? "text-cyan-400 font-bold bg-cyan-400/20 glow-cyan"
              : "text-white hover:text-cyan-400 hover:bg-cyan-400/10"
          }`}
        >
          Lacak Pesanan
        </Link>

        <div className="flex flex-col gap-3 pt-4 border-t border-cyan-400/30 mt-2">
          {user ? (
            // Tampilan Profile di Mobile Menu
            <>
              <Link
                href="/profile"
                onClick={handleLinkClick}
                className="text-center bg-gradient-elegant-secondary text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:opacity-90 glow-emerald"
              >
                Profil Saya
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gradient-accent text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:opacity-90 glow-rose"
              >
                Logout
              </button>
            </>
          ) : (
            // Tampilan Tombol di Mobile Menu
            <>
              <Link
                href={"/register"}
                onClick={handleLinkClick}
                className="bg-gradient-elegant-primary text-white p-3 rounded-lg font-semibold glow-cyan text-center
                                    hover:opacity-90 transition-all duration-300 transform hover:scale-105"
              >
                Sign up
              </Link>
              <Link
                href={"/login"}
                onClick={handleLinkClick}
                className="border-2 border-emerald-400 text-emerald-400 p-3 rounded-lg font-semibold text-center
                                    hover:bg-emerald-400 hover:text-[#3E1E68] hover:glow-emerald transition-all duration-300 transform hover:scale-105"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicAppHeader;
