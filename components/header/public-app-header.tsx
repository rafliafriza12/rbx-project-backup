"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShoppingCart } from "lucide-react";
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
    <header className="flex w-full justify-between px-4 lg:px-20 py-4 items-center sticky top-0 z-[9998] backdrop-blur-md  shadow-neon-purple border-b border-primary-100  duration-500 bg-[#22102A]">
      <Link href={"/"} className=" relative w-[50px] h-[50px] ">
        <Image src="/logo.png" alt="RID Logo" fill className="object-contain" />
      </Link>

      <nav className="space-x-6 font-medium hidden lg:flex">
        <Link
          href="/"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 rounded-lg ${
            pathname === "/"
              ? "text-[#f63ae6] font-bold text-drop-shadow-sm bg-[#f63ae6]/8"
              : "text-white hover:text-[#f63ae6] font-medium hover:bg-[#f63ae6]/5 hover:text-drop-shadow-sm"
          }`}
        >
          Home
        </Link>
        <Link
          href="/rbx"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 rounded-lg ${
            pathname.includes("/rbx") ||
            pathname === "/rbx5" ||
            pathname.includes("/robux-instant")
              ? "text-[#f63ae6] font-bold text-drop-shadow-sm bg-[#f63ae6]/8"
              : "text-white hover:text-[#f63ae6] font-medium hover:bg-[#f63ae6]/5 hover:text-drop-shadow-sm"
          }`}
        >
          RBX
        </Link>
        <Link
          href="/gamepass"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 rounded-lg ${
            pathname.includes("gamepass")
              ? "text-[#f63ae6] font-bold text-drop-shadow-sm bg-[#f63ae6]/8"
              : "text-white hover:text-[#f63ae6] font-medium hover:bg-[#f63ae6]/5 hover:text-drop-shadow-sm"
          }`}
        >
          Gamepass
        </Link>
        {/* JOKI MENU - TEMPORARILY DISABLED */}
        {/* <Link
          href="/joki"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 rounded-lg ${
            pathname.includes("joki")
              ? "text-[#f63ae6] font-bold text-drop-shadow-sm bg-[#f63ae6]/8"
              : "text-white hover:text-[#f63ae6] font-medium hover:bg-[#f63ae6]/5 hover:text-drop-shadow-sm"
          }`}
        >
          Jasa Joki
        </Link> */}
        <Link
          href="/reseller"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 rounded-lg ${
            pathname.includes("reseller")
              ? "text-[#f63ae6] font-bold text-drop-shadow-sm bg-[#f63ae6]/8"
              : "text-white hover:text-[#f63ae6] font-medium hover:bg-[#f63ae6]/5 hover:text-drop-shadow-sm"
          }`}
        >
          Reseller
        </Link>
        <Link
          href="/leaderboard"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 rounded-lg ${
            pathname.includes("leaderboard")
              ? "text-[#f63ae6] font-bold text-drop-shadow-sm bg-[#f63ae6]/8"
              : "text-white hover:text-[#f63ae6] font-medium hover:bg-[#f63ae6]/5 hover:text-drop-shadow-sm"
          }`}
        >
          Leaderboard
        </Link>
        <Link
          href="/track-order"
          onClick={handleLinkClick}
          className={`transition-all duration-300 px-3 py-2 rounded-lg ${
            pathname.includes("track-order")
              ? "text-[#f63ae6] font-bold text-drop-shadow-sm bg-[#f63ae6]/8"
              : "text-white hover:text-[#f63ae6] font-medium hover:bg-[#f63ae6]/5 hover:text-drop-shadow-sm"
          }`}
        >
          Cek Pesanan
        </Link>
      </nav>

      <div className="space-x-4 hidden lg:flex items-center">
        {user && (
          <>
            <Link
              href="/chat"
              onClick={handleLinkClick}
              className={`relative p-2 rounded-lg transition-all duration-300 ${
                pathname === "/chat"
                  ? "text-neon-pink bg-neon-pink/10"
                  : "text-white hover:text-neon-pink hover:bg-neon-pink/5"
              }`}
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </Link>
            <Link
              href="/cart"
              onClick={handleLinkClick}
              className={`relative p-2 rounded-lg transition-all duration-300 ${
                pathname === "/cart"
                  ? "text-neon-pink bg-neon-pink/10"
                  : "text-white hover:text-neon-pink hover:bg-neon-pink/5"
              }`}
            >
              <ShoppingCart className="w-6 h-6" />
              {/* Cart count badge can be added here */}
            </Link>
          </>
        )}

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

            {/* Enhanced Dropdown Profile */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-48 neon-card backdrop-blur-md rounded-xl shadow-neon-purple z-50 py-2 border border-neon-purple/30 overflow-hidden">
                <Link
                  href="/profile"
                  onClick={handleLinkClick}
                  className="block px-4 py-2.5 text-sm text-white hover:bg-neon-purple/20 hover:text-neon-purple hover:pl-6 rounded-lg mx-2 transition-all duration-300 hover:shadow-[inset_0_0_10px_rgba(168,85,247,0.3)]"
                >
                  Profil Saya
                </Link>
                <Link
                  href="/riwayat"
                  onClick={handleLinkClick}
                  className="block px-4 py-2.5 text-sm text-white hover:bg-neon-pink/20 hover:text-neon-pink hover:pl-6 rounded-lg mx-2 transition-all duration-300 hover:shadow-[inset_0_0_10px_rgba(246,58,230,0.3)]"
                >
                  Riwayat Pesanan
                </Link>
                {isAdmin() && (
                  <>
                    <hr className="my-1 border-neon-purple/30 mx-2" />
                    <Link
                      href="/admin/dashboard"
                      onClick={handleLinkClick}
                      className="block px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-400/20 hover:text-emerald-300 hover:pl-6 rounded-lg mx-2 transition-all duration-300 hover:shadow-[inset_0_0_10px_rgba(52,211,153,0.3)]"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/admin/users"
                      onClick={handleLinkClick}
                      className="block px-4 py-2.5 text-sm text-emerald-400 hover:bg-emerald-400/20 hover:text-emerald-300 hover:pl-6 rounded-lg mx-2 transition-all duration-300 hover:shadow-[inset_0_0_10px_rgba(52,211,153,0.3)]"
                    >
                      Kelola Pengguna
                    </Link>
                  </>
                )}
                <hr className="my-1 border-neon-purple/30 mx-2" />
                <button
                  onClick={handleLogout}
                  className="w-[calc(100%-30px)] text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-400/20 hover:text-rose-300 hover:translate-x-2 rounded-lg mx-2 transition-all duration-300 hover:shadow-[inset_0_0_10px_rgba(251,113,133,0.3)]"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          // Enhanced Auth Buttons for Desktop
          <>
            <Link
              href={"/register"}
              className="relative px-6 py-2.5 btn-neon-primary text-white font-bold rounded-xl border border-neon-purple/50 hover:border-neon-pink/50 transition-all duration-300  group overflow-hidden"
            >
              <span className="relative z-10">Daftar</span>
              <div className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-purple opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>

            <Link
              href={"/login"}
              className="relative px-6 py-2.5 border-2 border-neon-purple text-neon-purple font-bold rounded-xl hover:bg-neon-purple hover:text-white transition-all duration-300 group overflow-hidden backdrop-blur-sm"
            >
              <span className="relative z-10">Masuk</span>
              <div className="absolute inset-0 bg-neon-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </>
        )}
      </div>

      <button
        className="lg:hidden text-white focus:outline-none"
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
        className={`absolute top-full left-0 w-full z-50 lg:hidden px-6 py-4
                              transform transition-all duration-300 ease-in-out
                              ${
                                isMenuOpen
                                  ? "opacity-100 translate-y-0"
                                  : "opacity-0 -translate-y-2 pointer-events-none"
                              }
                              neon-card backdrop-blur-md shadow-neon-purple rounded-b-xl border border-neon-pink/30`}
      >
        <Link
          href="/"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname === "/"
              ? "text-[#f63ae6] font-bold bg-[#f63ae6]/20 text-drop-shadow-sm"
              : "text-white hover:text-[#f63ae6] hover:bg-[#f63ae6]/10"
          }`}
        >
          Home
        </Link>
        <Link
          href="/rbx"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("/rbx") ||
            pathname === "/rbx5" ||
            pathname.includes("/robux-instant")
              ? "text-[#f63ae6] font-bold bg-[#f63ae6]/20 text-drop-shadow-sm"
              : "text-white hover:text-[#f63ae6] hover:bg-[#f63ae6]/10"
          }`}
        >
          RBX
        </Link>
        <Link
          href="/gamepass"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("gamepass")
              ? "text-[#f63ae6] font-bold bg-[#f63ae6]/20 text-drop-shadow-sm"
              : "text-white hover:text-[#f63ae6] hover:bg-[#f63ae6]/10"
          }`}
        >
          Gamepass
        </Link>
        {/* JOKI MENU - TEMPORARILY DISABLED */}
        {/* <Link
          href="/joki"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("joki")
              ? "text-[#f63ae6] font-bold bg-[#f63ae6]/20 text-drop-shadow-sm"
              : "text-white hover:text-[#f63ae6] hover:bg-[#f63ae6]/10"
          }`}
        >
          Jasa Joki
        </Link> */}
        <Link
          href="/reseller"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("reseller")
              ? "text-[#f63ae6] font-bold bg-[#f63ae6]/20 text-drop-shadow-sm"
              : "text-white hover:text-[#f63ae6] hover:bg-[#f63ae6]/10"
          }`}
        >
          Reseller
        </Link>
        <Link
          href="/leaderboard"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("leaderboard")
              ? "text-[#f63ae6] font-bold bg-[#f63ae6]/20 text-drop-shadow-sm"
              : "text-white hover:text-[#f63ae6] hover:bg-[#f63ae6]/10"
          }`}
        >
          Leaderboard
        </Link>
        <Link
          href="/track-order"
          onClick={handleLinkClick}
          className={`block font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
            pathname.includes("track-order")
              ? "text-[#f63ae6] font-bold bg-[#f63ae6]/20 text-drop-shadow-sm"
              : "text-white hover:text-[#f63ae6] hover:bg-[#f63ae6]/10"
          }`}
        >
          Lacak Pesanan
        </Link>

        {user && (
          <>
            <Link
              href="/chat"
              onClick={handleLinkClick}
              className={`flex items-center gap-2 font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
                pathname === "/chat"
                  ? "text-neon-pink font-bold bg-neon-pink/20 text-drop-shadow-sm"
                  : "text-white hover:text-neon-pink hover:bg-neon-pink/10"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Chat
            </Link>
            <Link
              href="/cart"
              onClick={handleLinkClick}
              className={`flex items-center gap-2 font-medium py-3 px-3 rounded-lg transition-all duration-300 ${
                pathname === "/cart"
                  ? "text-neon-pink font-bold bg-neon-pink/20 text-drop-shadow-sm"
                  : "text-white hover:text-neon-pink hover:bg-neon-pink/10"
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              Keranjang
            </Link>
          </>
        )}

        <div className="flex flex-col gap-3 pt-4 border-t border-neon-purple/30 mt-2">
          {user ? (
            // Tampilan Profile di Mobile Menu
            <>
              <Link
                href="/profile"
                onClick={handleLinkClick}
                className="text-center bg-gradient-to-r from-neon-purple/80 to-neon-pink/80 text-white py-3 rounded-lg font-semibold transition-all duration-300 hover:from-neon-purple hover:to-neon-pink shadow-[0_0_15px_rgba(179,84,195,0.4)]"
              >
                Profil Saya
              </Link>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-rose-500/80 to-red-600/80 hover:from-rose-500 hover:to-red-600 text-white py-3 rounded-lg font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]"
              >
                Logout
              </button>
            </>
          ) : (
            // Enhanced Mobile Auth Buttons
            <>
              <Link
                href={"/register"}
                onClick={handleLinkClick}
                className="relative btn-neon-primary text-white py-3 px-4 rounded-xl font-bold text-center
                                    transition-all duration-300 shadow-[0_0_20px_rgba(179,84,195,0.4)] hover:shadow-[0_0_30px_rgba(246,58,230,0.6)] 
                                    border border-neon-purple/50 hover:border-neon-pink/50 group overflow-hidden"
              >
                <span className="relative z-10">Daftar</span>
                <div className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-purple opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Link>

              <Link
                href={"/login"}
                onClick={handleLinkClick}
                className="relative border-2 border-neon-purple text-neon-purple py-3 px-4 rounded-xl font-bold text-center
                                    hover:bg-neon-purple hover:text-white transition-all duration-300 group overflow-hidden backdrop-blur-sm"
              >
                <span className="relative z-10">Masuk</span>
                <div className="absolute inset-0 bg-neon-purple opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default PublicAppHeader;
