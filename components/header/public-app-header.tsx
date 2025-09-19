"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
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
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  return (
    <header className="flex justify-between px-4 md:px-20 py-4 items-center sticky z-[100] top-0 backdrop-blur-[5px]">
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
          className={`${
            pathname === "/" ? "text-red-500 font-bold" : "hover:text-red-600"
          }`}
        >
          Home
        </Link>
        <Link
          href="/rbx5"
          className={`${
            pathname === "/rbx5"
              ? "text-red-500 font-bold"
              : "hover:text-red-600"
          }`}
        >
          Robux 5 Hari
        </Link>
        <Link
          href="/robux-instant"
          className={`${
            pathname.includes("robux-instant")
              ? "text-red-500 font-bold"
              : "hover:text-red-600"
          }`}
        >
          Robux Instan
        </Link>
        <Link
          href="/gamepass"
          className={`${
            pathname.includes("gamepass")
              ? "text-red-500 font-bold"
              : "hover:text-red-600"
          }`}
        >
          Gamepass
        </Link>
        <Link
          href="/joki"
          className={`${
            pathname.includes("joki")
              ? "text-red-500 font-bold"
              : "hover:text-red-600"
          }`}
        >
          Jasa Joki
        </Link>
        <Link
          href="/leaderboard"
          className={`${
            pathname.includes("leaderboard")
              ? "text-red-500 font-bold"
              : "hover:text-red-600"
          }`}
        >
          Leaderboard
        </Link>
        <Link
          href="/track-order"
          className={`${
            pathname.includes("track-order")
              ? "text-red-500 font-bold"
              : "hover:text-red-600"
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
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 py-2">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profil Saya
                </Link>
                <Link
                  href="/riwayat"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Riwayat Pesanan
                </Link>
                {isAdmin() && (
                  <>
                    <hr className="my-1" />
                    <Link
                      href="/admin/dashboard"
                      className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                    >
                      Admin Dashboard
                    </Link>
                    <Link
                      href="/admin/users"
                      className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                    >
                      Kelola Pengguna
                    </Link>
                  </>
                )}
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
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
              className="bg-[#CE3535] text-white px-4 py-1 rounded-lg font-semibold
                                   transition duration-300 transform hover:scale-105 hover:shadow-lg hover:bg-[#b32f2f]"
            >
              Sign up
            </Link>
            <Link
              href={"/login"}
              className="border border-black text-black px-4 py-1 rounded-lg font-semibold
                                 transition duration-300 transform hover:scale-105 hover:shadow-lg
                                 hover:bg-black hover:text-white"
            >
              Login
            </Link>
          </>
        )}
      </div>

      <button
        className="md:hidden text-black focus:outline-none"
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
                              bg-[rgba(255,255,255,1)] backdrop-blur-md shadow-lg rounded-b-xl`}
      >
        <Link
          href="/"
          className={`block font-medium py-2 ${
            pathname === "/"
              ? "text-red-500 font-bold"
              : "text-black hover:text-red-600"
          }`}
        >
          Home
        </Link>
        <Link
          href="/rbx5"
          className={`block font-medium py-2 ${
            pathname === "/rbx5"
              ? "text-red-500 font-bold"
              : "text-black hover:text-red-600"
          }`}
        >
          Robux 5 Hari
        </Link>
        <Link
          href="/robux-instant"
          className={`block font-medium py-2 ${
            pathname === "#"
              ? "text-red-500 font-bold"
              : "text-black hover:text-red-600"
          }`}
        >
          Robux Instan
        </Link>
        <Link
          href="/gamepass"
          className={`block font-medium py-2 ${
            pathname === "/gamepass"
              ? "text-red-500 font-bold"
              : "text-black hover:text-red-600"
          }`}
        >
          Gamepass
        </Link>
        <Link
          href="/joki"
          className={`block font-medium py-2 ${
            pathname === "/joki"
              ? "text-red-500 font-bold"
              : "text-black hover:text-red-600"
          }`}
        >
          Jasa Joki
        </Link>
        <Link
          href="/leaderboard"
          className={`block font-medium py-2 ${
            pathname === "/leaderboard"
              ? "text-red-500 font-bold"
              : "text-black hover:text-red-600"
          }`}
        >
          Leaderboard
        </Link>
        <Link
          href="/track-order"
          className={`block font-medium py-2 ${
            pathname === "/track-order"
              ? "text-red-500 font-bold"
              : "text-black hover:text-red-600"
          }`}
        >
          Lacak Pesanan
        </Link>

        <div className="flex flex-col gap-2 pt-4">
          {user ? (
            // Tampilan Profile di Mobile Menu
            <>
              <Link
                href="/profile"
                className="text-center bg-gray-200 py-2 rounded-lg font-semibold"
              >
                Profil Saya
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white py-2 rounded-lg font-semibold"
              >
                Logout
              </button>
            </>
          ) : (
            // Tampilan Tombol di Mobile Menu
            <>
              <Link
                href={"/register"}
                className="bg-[#CE3535] text-white p-2 rounded-lg font-semibold 
                                    hover:bg-[#b32f2f] transition duration-300 transform hover:scale-105"
              >
                Sign up
              </Link>
              <Link
                href={"/login"}
                className="border border-black text-black p-2 rounded-lg font-semibold 
                                    hover:bg-black hover:text-white transition duration-300 transform hover:scale-105"
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
