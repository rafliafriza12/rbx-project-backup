"use client";
import Image from "next/image";
import Link from "next/link";
// 1. Import useRef dari React
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
// import './globals.css'

export default function HomePage() {
  //ini baru ditambahkan
  const [user, setUser] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  useEffect(() => {
    // Check if user logged in
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Get user data to check discount
      fetch("http://localhost:8000/api/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setUser(data.data);
          setDiscount(data.data?.discount_percentage || 0);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem("auth_token");
        });
    }
  }, []);

  // Di bagian harga produk, tampilkan discount jika ada
  const calculatePrice = (basePrice: number) => {
    if (discount > 0) {
      const discountAmount = (basePrice * discount) / 100;
      return {
        original: basePrice,
        final: basePrice - discountAmount,
        saved: discountAmount,
      };
    }
    return { original: basePrice, final: basePrice, saved: 0 };
  };
  // 2. Buat ref untuk menargetkan section pembelian
  const pembelianRef = useRef<HTMLDivElement>(null);

  const games = [
    {
      title: "Strongest battleground",
      image: "/stonges.png",
    },
    {
      title: "Anime Last Stand",
      image: "/anime_last.png",
    },
    {
      title: "All Star Tower Defense",
      image: "/all_star.png",
    },
  ];

  const router = useRouter();

  // 3. Buat fungsi untuk menangani scroll
  const handleScrollToPembelian = () => {
    pembelianRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center", // Bisa juga 'start' atau 'end'
    });
  };

  return (
    <div className="bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white min-h-screen font-sans text-gray-800">
      {/* Navbar */}

      {/* Footer */}
      <footer className="bg-black text-white px-4 sm:px-6 md:px-16 py-8 sm:py-10 mt-8 sm:mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <Image
              src="/logo.png"
              alt="RID Logo"
              width={80}
              height={80}
              className="mb-3 sm:mb-4 mx-auto sm:mx-0"
            />
            <p className="text-xs sm:text-sm text-gray-400 pl-0 sm:pl-[4px] text-center sm:text-left leading-relaxed">
              RobuxID, kami mengutamakan kecepatan, keamanan, dan harga yang
              bersahabat. Beli Robux tanpa khawatir, nikmati pengiriman kilat,
              dan pilih metode pembayaran favorit Anda. Pengalaman bermain
              Roblox terbaik, dimulai dari sini!
            </p>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">
              Menu
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/rbx5"
                  className="hover:text-white transition-colors"
                >
                  Robux 5 Hari
                </Link>
              </li>
              <li>
                <Link
                  href="/robux-instant"
                  className="hover:text-white transition-colors"
                >
                  Robux Instant
                </Link>
              </li>
              <li>
                <Link
                  href="/gamepass"
                  className="hover:text-white transition-colors"
                >
                  Gamepass
                </Link>
              </li>
              <li>
                <Link
                  href="/joki"
                  className="hover:text-white transition-colors"
                >
                  Jasa Joki
                </Link>
              </li>
              <li>
                <Link
                  href="/track-order"
                  className="hover:text-white transition-colors"
                >
                  🔍 Lacak Pesanan
                </Link>
              </li>
              <li>
                <Link
                  href="/gamepass"
                  className="hover:text-white transition-colors"
                >
                  Gamepass
                </Link>
              </li>
              <li>
                <Link
                  href="/joki"
                  className="hover:text-white transition-colors"
                >
                  Jasa Joki
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">
              Dukungan
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Kontak
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Cara Beli
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-center sm:text-left">
            <h3 className="font-bold mb-3 sm:mb-4 text-sm sm:text-base">
              Legalitas
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors">
                  Affiliate
                </Link>
              </li>
            </ul>
            <div className="flex space-x-3 sm:space-x-4 mt-4 justify-center sm:justify-start">
              <Image
                src="/wa.png"
                alt="wa"
                width={20}
                height={20}
                className="sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer"
              />
              <Image
                src="/ig.png"
                alt="ig"
                width={20}
                height={20}
                className="sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer"
              />
              <Image
                src="/discord.png"
                alt="discord"
                width={20}
                height={20}
                className="sm:w-6 sm:h-6 hover:scale-110 transition-transform cursor-pointer"
              />
            </div>
          </div>
        </div>
        <p className="text-center text-gray-500 text-xs sm:text-sm mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-800">
          © 2025 RobuxID
        </p>
      </footer>
    </div>
  );
}
