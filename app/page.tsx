"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
// 1. Import useRef dari React
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Marquee from "react-fast-marquee";
import "./globals.css";
import PublicLayout from "@/app/(public)/layout";

interface RBX5Stats {
  totalStok: number;
  totalOrder: number;
  totalTerjual: number;
  hargaPer100Robux: number;
}

interface Gamepass {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  showOnHomepage: boolean;
  developer: string;
  item: {
    itemName: string;
    imgUrl: string;
    price: number;
  }[];
}

export default function HomePage() {
  //ini baru ditambahkan
  const [user, setUser] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const router = useRouter();

  // RBX5 Stats state
  const [rbx5Stats, setRbx5Stats] = useState<RBX5Stats>({
    totalStok: 0,
    totalOrder: 0,
    totalTerjual: 0,
    hargaPer100Robux: 13000,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Gamepass state
  const [gamepasses, setGamepasses] = useState<Gamepass[]>([]);
  const [loadingGamepasses, setLoadingGamepasses] = useState(true);

  // Robux input state
  const [robuxAmount, setRobuxAmount] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  useEffect(() => {
    // Check if user logged in
    const token = localStorage.getItem("auth_token");
    if (token) {
      // Get user data to check discount
      fetch("/api/me", {
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

    // Fetch RBX5 statistics
    fetchRbx5Stats();

    // Fetch homepage gamepasses
    fetchHomepageGamepasses();
  }, []);

  // Function to fetch RBX5 statistics
  const fetchRbx5Stats = async () => {
    try {
      const response = await fetch("/api/rbx5-stats");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setRbx5Stats(data.data);
        }
      } else {
        console.error("Failed to fetch RBX5 stats");
      }
    } catch (error) {
      console.error("Error fetching RBX5 stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Function to fetch homepage gamepasses
  const fetchHomepageGamepasses = async () => {
    try {
      const response = await fetch("/api/gamepass");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Filter only gamepasses that should be shown on homepage
          const homepageGamepasses = data.data.filter(
            (gamepass: Gamepass) => gamepass.showOnHomepage
          );
          setGamepasses(homepageGamepasses);
        }
      } else {
        console.error("Failed to fetch gamepasses");
      }
    } catch (error) {
      console.error("Error fetching gamepasses:", error);
    } finally {
      setLoadingGamepasses(false);
    }
  };

  // Function to calculate price based on robux amount
  const calculateTotalPrice = (robux: number) => {
    if (robux <= 0 || !rbx5Stats.hargaPer100Robux) return 0;

    // Calculate base price: (robux / 100) * price per 100 robux
    const basePrice = Math.ceil((robux / 100) * rbx5Stats.hargaPer100Robux);

    // Apply discount if user is logged in
    if (discount > 0) {
      const discountAmount = (basePrice * discount) / 100;
      return basePrice - discountAmount;
    }

    return basePrice;
  };

  // Fetch RBX5 stats on component mount
  // useEffect(() => {
  //   fetchRbx5Stats();
  // }, [fetchRbx5Stats]);

  // Handle robux input change
  const handleRobuxChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setRobuxAmount(numValue);
    setTotalPrice(calculateTotalPrice(numValue));
  };

  // Handle redirect to RBX5 page with robux amount
  const handleBuyNow = () => {
    if (robuxAmount <= 0) {
      toast.error("Silakan masukkan jumlah Robux yang valid");
      return;
    }

    console.log("Preparing data for RBX5:", { robuxAmount, totalPrice });

    // Prepare data for RBX5 page
    const rbx5Data = {
      robuxAmount: robuxAmount,
      totalPrice: totalPrice,
      fromHomePage: true,
    };

    // Store in sessionStorage for RBX5 page
    if (typeof window !== "undefined") {
      sessionStorage.setItem("rbx5InputData", JSON.stringify(rbx5Data));
      console.log("Data stored in sessionStorage:", rbx5Data);
    }

    // Redirect to RBX5 page
    router.push("/rbx5");
  };

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // 3. Buat fungsi untuk menangani scroll
  const handleScrollToPembelian = () => {
    pembelianRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center", // Bisa juga 'start' atau 'end'
    });
  };

  return (
    <PublicLayout>
      {/* Modern Background Elements */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-ocean opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-emerald opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-lavender opacity-5 rounded-full blur-3xl"></div>
      </div> */}

      {/* Hero Section - E-commerce Style */}
      <section className="relative  py-20 lg:py-28">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-cyan-400/20 border border-cyan-400/30 rounded-full text-sm text-cyan-400 font-medium mb-8">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
              #1 Platform Robux Terpercaya di Indonesia
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Jual Beli <span className="text-cyan-400">Robux</span>
              <br />
              Terpercaya & Termurah
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Dapatkan Robux dengan harga terbaik, proses instan, dan keamanan
              terjamin. Bergabung dengan 50.000+ player yang sudah mempercayai
              RobuxID.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={handleScrollToPembelian}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-400/25"
              >
                Beli Robux Sekarang
              </button>
              <Link
                href="/track-order"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:bg-white/20"
              >
                Lacak Pesanan
              </Link>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-sm border border-cyan-400/30 rounded-xl p-6 text-center duration-500 hover:-translate-y-3 hover:shadow-xl hover:shadow-cyan-400/25 group">
                <div className="w-12 h-12 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-cyan-400 text-2xl">💎</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1 animate-pulse">
                  {rbx5Stats.totalStok.toLocaleString()}
                </div>
                <div className="text-cyan-300 text-sm">R$ Tersedia</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-600/20 backdrop-blur-sm border border-emerald-400/30 rounded-xl p-6 text-center duration-500 hover:-translate-y-3 hover:shadow-xl hover:shadow-emerald-400/25 group">
                <div className="w-12 h-12 bg-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-emerald-400 text-2xl">🚀</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {rbx5Stats.totalTerjual.toLocaleString()}
                </div>
                <div className="text-emerald-300 text-sm">R$ Terjual</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm border border-purple-400/30 rounded-xl p-6 text-center duration-500 hover:-translate-y-3 hover:shadow-xl hover:shadow-purple-400/25 group">
                <div className="w-12 h-12 bg-purple-400/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-purple-400 text-2xl">👥</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">50K+</div>
                <div className="text-purple-300 text-sm">Customers</div>
              </div>

              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-600/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-6 text-center duration-500 hover:-translate-y-3 hover:shadow-xl hover:shadow-yellow-400/25 group">
                <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <span className="text-yellow-400 text-2xl">⭐</span>
                </div>
                <div className="text-2xl font-bold text-white mb-1">99.9%</div>
                <div className="text-yellow-300 text-sm">Success Rate</div>
              </div>
            </div>

            {/* Real-time Transaction Ticker */}
            <div className="mt-16 max-w-6xl mx-auto">
              <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 backdrop-blur-md border border-cyan-400/30 rounded-xl p-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-pulse"></div>
                <div className="relative">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                    <h3 className="text-lg font-semibold text-white">
                      🔥 Transaksi Real-time
                    </h3>
                  </div>

                  <Marquee
                    speed={40}
                    pauseOnHover={true}
                    gradient={true}
                    gradientColor="rgb(15, 23, 42)"
                    gradientWidth={80}
                  >
                    <div className="flex items-center bg-white/5 backdrop-blur-sm border border-cyan-400/20 rounded-lg p-4 mx-3 min-w-[280px] hover:bg-white/10 hover:border-cyan-400/40 transition-all duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-lg">💎</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">r*******</div>
                        <div className="text-cyan-300 text-sm">1,000 R$</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium text-sm">
                          ✓ Berhasil
                        </div>
                        <div className="text-gray-400 text-xs">2 min lalu</div>
                      </div>
                    </div>

                    <div className="flex items-center bg-white/5 backdrop-blur-sm border border-emerald-400/20 rounded-lg p-4 mx-3 min-w-[300px] hover:bg-white/10 hover:border-emerald-400/40 transition-all duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-lg">🎮</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">a*******</div>
                        <div className="text-emerald-300 text-sm">2,500 R$</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium text-sm">
                          ✓ Berhasil
                        </div>
                        <div className="text-gray-400 text-xs">5 min lalu</div>
                      </div>
                    </div>

                    <div className="flex items-center bg-white/5 backdrop-blur-sm border border-purple-400/20 rounded-lg p-4 mx-3 min-w-[270px] hover:bg-white/10 hover:border-purple-400/40 transition-all duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-lg">⚡</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">m*******</div>
                        <div className="text-purple-300 text-sm">800 R$</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium text-sm">
                          ✓ Berhasil
                        </div>
                        <div className="text-gray-400 text-xs">8 min lalu</div>
                      </div>
                    </div>

                    <div className="flex items-center bg-white/5 backdrop-blur-sm border border-rose-400/20 rounded-lg p-4 mx-3 min-w-[290px] hover:bg-white/10 hover:border-rose-400/40 transition-all duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-lg">💎</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">s*******</div>
                        <div className="text-rose-300 text-sm">1,500 R$</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium text-sm">
                          ✓ Berhasil
                        </div>
                        <div className="text-gray-400 text-xs">12 min lalu</div>
                      </div>
                    </div>

                    <div className="flex items-center bg-white/5 backdrop-blur-sm border border-teal-400/20 rounded-lg p-4 mx-3 min-w-[310px] hover:bg-white/10 hover:border-teal-400/40 transition-all duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-lg">🎮</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">d*******</div>
                        <div className="text-teal-300 text-sm">
                          Gamepass VIP
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium text-sm">
                          ✓ Berhasil
                        </div>
                        <div className="text-gray-400 text-xs">15 min lalu</div>
                      </div>
                    </div>

                    <div className="flex items-center bg-white/5 backdrop-blur-sm border border-amber-400/20 rounded-lg p-4 mx-3 min-w-[285px] hover:bg-white/10 hover:border-amber-400/40 transition-all duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-lg">💎</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">b*******</div>
                        <div className="text-amber-300 text-sm">3,200 R$</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium text-sm">
                          ✓ Berhasil
                        </div>
                        <div className="text-gray-400 text-xs">18 min lalu</div>
                      </div>
                    </div>

                    <div className="flex items-center bg-white/5 backdrop-blur-sm border border-indigo-400/20 rounded-lg p-4 mx-3 min-w-[295px] hover:bg-white/10 hover:border-indigo-400/40 transition-all duration-300">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white text-lg">🚀</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-semibold">l*******</div>
                        <div className="text-indigo-300 text-sm">
                          Joki Service
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-medium text-sm">
                          ✓ Berhasil
                        </div>
                        <div className="text-gray-400 text-xs">22 min lalu</div>
                      </div>
                    </div>
                  </Marquee>

                  <div className="text-center mt-4">
                    <div className="text-sm text-cyan-300">
                      <span className="animate-pulse">●</span> Live - Hover
                      untuk memperlambat
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-cyan-400/20 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-xl"></div>
      </section>

      {/* Products Section */}
      <section ref={pembelianRef} className="py-20 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Pilih <span className="text-cyan-400">Jumlah RBX</span> Terbaik
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Dapatkan Robux dengan harga terjangkau dan proses super cepat.
              Pilih paket yang sesuai dengan kebutuhan gaming kamu.
            </p>
          </div>

          {/* Quick Purchase Card */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-xl  p-8 mb-12 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-sm text-cyan-400 font-medium mb-4">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                Robux Premium - GamePass Official
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">
                Beli Robux Instan
              </h3>
              <p className="text-white/70">
                Robux akan otomatis ditambahkan ke akun kamu melalui gamepass
                resmi
              </p>
            </div>

            {/* Input Form */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-white">
                  Jumlah Robux
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Masukkan jumlah Robux"
                    value={robuxAmount === 0 ? "" : robuxAmount.toString()}
                    onChange={(e) => handleRobuxChange(e.target.value)}
                    className="w-full px-4 py-4 border-2 border-gray-300 rounded-lg text-white/70 placeholder-gray-500 focus:border-cyan-400 focus:outline-none transition-colors text-lg pr-12"
                    min="1"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white font-medium">
                    R$
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-white">
                  Total Harga
                </label>
                <div className="bg-cyan-400/10 border-2 border-cyan-400/20 rounded-lg py-3 px-4 ">
                  <div className="text-2xl font-bold text-cyan-400">
                    {loadingStats ? (
                      <span className="text-lg text-white/70">Loading...</span>
                    ) : totalPrice > 0 ? (
                      <>
                        Rp {totalPrice.toLocaleString()}
                        {discount > 0 && (
                          <div className="text-sm text-cyan-400 font-normal mt-1">
                            Hemat {discount}% - Diskon diterapkan!
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">Rp 0</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <button
                onClick={handleBuyNow}
                disabled={robuxAmount <= 0 || loadingStats}
                className={`px-12 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform inline-flex items-center gap-3 w-full md:w-auto justify-center ${
                  robuxAmount <= 0 || loadingStats
                    ? "bg-gray-400 text-white/70 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white hover:scale-105 shadow-lg hover:shadow-cyan-400/25"
                }`}
              >
                <Image
                  src="/cart.png"
                  alt="Cart Icon"
                  width={20}
                  height={20}
                  className="brightness-0 invert"
                />
                {robuxAmount > 0 ? `Beli RBX` : "Beli RBX"}
              </button>

              {robuxAmount > 0 && (
                <p className="text-sm text-white/70 mt-4">
                  ⚡ Robux akan dikirim dalam 5 hari setelah pembayaran berhasil
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-400/10 hover:-translate-y-2">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
                    <Image
                      src="/stk.png"
                      alt="stok"
                      width={16}
                      height={16}
                      className="sm:w-5 sm:h-5 "
                    />
                  </div>
                  <div className="text-sm font-medium text-white/70">
                    Total Stock
                  </div>
                </div>
                <div className="text-lg font-bold text-white">
                  {loadingStats
                    ? "..."
                    : `${rbx5Stats.totalStok.toLocaleString()} R$`}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-400/10 hover:-translate-y-2">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
                    <Image
                      src="/tjl.png"
                      alt="terjual"
                      width={16}
                      height={16}
                      className="sm:w-5 sm:h-5"
                    />
                  </div>
                  <div className="text-sm font-medium text-white/70">
                    Terjual
                  </div>
                </div>
                <div className="text-lg font-bold text-white">
                  {loadingStats
                    ? "..."
                    : `${rbx5Stats.totalTerjual.toLocaleString()} R$`}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-400/10 hover:-translate-y-2">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
                    <Image src="/ord.png" alt="order" width={16} height={16} />
                  </div>
                  <div className="text-sm font-medium text-white/70">
                    Total Order
                  </div>
                </div>
                <div className="text-lg font-bold text-white">
                  {loadingStats ? "..." : rbx5Stats.totalOrder.toLocaleString()}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-cyan-400 hover:bg-cyan-400/10 hover:-translate-y-2">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-cyan-400 rounded-lg flex items-center justify-center">
                    <Image
                      src="/rux.png"
                      alt="harga robux"
                      width={16}
                      height={16}
                    />
                  </div>
                  <div className="text-sm font-medium text-white/70">
                    Harga Robux
                  </div>
                </div>
                <div className="text-lg font-bold text-white">
                  {loadingStats ? (
                    "..."
                  ) : (
                    <>
                      Rp.{rbx5Stats.hargaPer100Robux.toLocaleString()}{" "}
                      <span className="text-xs font-medium text-gray-500">
                        / 100R$
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Tersedia */}
      <section className="py-20 relative overflow-hidden">
        {/* <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-blue-900/10"></div> */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 border border-cyan-400/30 text-cyan-400 rounded-full text-sm font-medium mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3 animate-pulse"></span>
              🎮 Gamepass & Avatar Premium
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Game Populer{" "}
              <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">
                Tersedia
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Dapatkan gamepass eksklusif dan avatar premium dari game-game
              populer. Wujudkan impian Roblox kamu dengan koleksi item
              terlengkap dan harga terbaik.
            </p>
          </div>

          {loadingGamepasses ? (
            <div className="flex flex-col justify-center items-center py-20">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4  border-t-cyan-400"></div>
              </div>
              <div className="text-center">
                <div className="text-white font-semibold text-lg mb-2">
                  Memuat Game Populer
                </div>
                <div className="text-gray-400 text-sm">
                  Sedang mengambil data terbaru...
                </div>
              </div>
            </div>
          ) : gamepasses.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24  rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎮</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Belum Ada Game Tersedia
              </h3>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                Game populer akan segera hadir. Pantau terus untuk update
                terbaru!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {gamepasses.map((gamepass, index) => (
                <div
                  key={gamepass._id}
                  onClick={() => router.push(`/gamepass/${gamepass._id}`)}
                  className="group cursor-pointer focus:outline-none h-full"
                >
                  {/* Modern Sleek Card */}
                  <div className="relative bg-gradient-to-b from-slate-800/50 to-slate-900/80 backdrop-blur-lg border border-slate-700/50 rounded-xl lg:rounded-2xl overflow-hidden transition-all duration-500 hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-400/20 hover:-translate-y-1 h-full flex flex-col">
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                      <img
                        src={gamepass.imgUrl}
                        alt={gamepass.gameName}
                        className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                      />

                      {/* Modern Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60"></div>

                      {/* Top Badge - Only Items Count */}
                      <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                        <div className="bg-gradient-to-r from-cyan-500/90 to-blue-600/90 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-md shadow-lg">
                          {gamepass.item?.length || 0} items
                        </div>
                      </div>

                      {/* Game Title Overlay - Mobile */}
                      <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 lg:hidden">
                        <h3 className="text-white font-bold text-sm sm:text-base leading-tight mb-1 drop-shadow-lg line-clamp-2">
                          {gamepass.gameName}
                        </h3>
                        <div className="flex items-center gap-2 opacity-90">
                          <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                          <p className="text-gray-200 text-xs font-medium truncate">
                            {gamepass.developer}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-3 sm:p-4 lg:p-5 flex-1 flex flex-col">
                      {/* Desktop Title */}
                      <div className="hidden lg:block mb-3">
                        <h3 className="text-white font-bold text-lg xl:text-xl leading-tight mb-2 group-hover:text-cyan-400 transition-colors duration-300 line-clamp-2">
                          {gamepass.gameName}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                          <span className="text-sm font-medium">
                            {gamepass.developer}
                          </span>
                        </div>
                      </div>

                      {/* Features Tags */}
                      {gamepass.features && gamepass.features.length > 0 && (
                        <div className="mb-3 lg:mb-4">
                          <div className="flex flex-wrap gap-1.5">
                            {gamepass.features
                              .slice(0, 2)
                              .map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block bg-slate-700/50 border border-slate-600/50 text-slate-300 text-xs px-2 py-0.5 rounded-md truncate max-w-[100px] sm:max-w-[120px]"
                                  title={feature}
                                >
                                  {feature}
                                </span>
                              ))}
                            {gamepass.features.length > 2 && (
                              <span className="inline-block bg-slate-600/50 border border-slate-500/50 text-slate-400 text-xs px-2 py-0.5 rounded-md">
                                +{gamepass.features.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Price Section */}
                      {gamepass.item && gamepass.item.length > 0 && (
                        <div className="mb-3 lg:mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm text-slate-400">
                              Mulai dari
                            </span>
                            <div className="text-right">
                              <div className="text-cyan-400 font-bold text-sm sm:text-base">
                                Rp{" "}
                                {Math.min(
                                  ...gamepass.item.map((item) => item.price)
                                ).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bottom Action - Push to bottom */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 mt-auto">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-emerald-400 text-xs font-medium">
                            Available
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-400 group-hover:text-cyan-400 transition-colors duration-300">
                          <span className="text-xs font-medium">View</span>
                          <svg
                            className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-cyan-400/10 text-cyan-400 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
              Keunggulan RobuxID
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Kenapa Pilih <span className="text-cyan-400">RobuxID</span>?
            </h2>
            <p className="text-lg text-white/70 max-w-3xl mx-auto leading-relaxed">
              Keamanan akun dan kepuasan pelanggan adalah prioritas utama kami.
              Dengan proses yang transparan, sistem keamanan berlapis, dan
              dukungan 24/7.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Proses Instan */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-cyan-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-cyan-400/20 transition-all duration-300">
                <Image
                  src="/rocket.png"
                  width={40}
                  height={40}
                  alt="Proses Instan"
                  className="filter-cyan-400"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Proses Instan
              </h3>
              <p className="text-white/70 leading-relaxed">
                Robux langsung masuk ke akun dalam hitungan detik setelah
                pembayaran berhasil dikonfirmasi.
              </p>
            </div>

            {/* Pelayanan Terbaik */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-cyan-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-cyan-400/20 transition-all duration-300">
                <Image
                  src="/jempol.png"
                  width={40}
                  height={40}
                  alt="Pelayanan Terbaik"
                  className="filter-cyan-400"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Pelayanan Terbaik
              </h3>
              <p className="text-white/70 leading-relaxed">
                Tim customer service profesional siap membantu 24/7 untuk
                menyelesaikan setiap kendala Anda.
              </p>
            </div>

            {/* Aman & Terpercaya */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-cyan-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-cyan-400/20 transition-all duration-300">
                <Image
                  src="/gembok.png"
                  width={40}
                  height={40}
                  alt="Aman & Terpercaya"
                  className="filter-cyan-400"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Aman & Terpercaya
              </h3>
              <p className="text-white/70 leading-relaxed">
                Sistem keamanan berlapis dengan enkripsi tingkat bank untuk
                melindungi data dan transaksi Anda.
              </p>
            </div>

            {/* Pembayaran Lengkap */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-cyan-400/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-cyan-400/20 transition-all duration-300">
                <Image
                  src="/card.png"
                  width={40}
                  height={40}
                  alt="Pembayaran Lengkap"
                  className="filter-cyan-400"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">
                Pembayaran Lengkap
              </h3>
              <p className="text-white/70 leading-relaxed">
                Metode pembayaran lengkap dari e-wallet, bank transfer, QRIS,
                hingga virtual account semua ada.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-sm border border-cyan-400  rounded-3xl  p-8 lg:p-16 ">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <div className="inline-flex items-center px-4 py-2 bg-cyan-400/10 text-cyan-400 rounded-full text-sm font-medium mb-6">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
                  Siap Mulai Gaming?
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Mulai Petualangan{" "}
                  <span className="text-cyan-400">Roblox</span> Sekarang
                </h2>

                <p className="text-lg text-white/70 mb-8 leading-relaxed">
                  Bergabung dengan ribuan player yang sudah mempercayai RobuxID.
                  Dapatkan Robux dengan proses termudah, tercepat, dan teraman.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={handleScrollToPembelian}
                    className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-cyan-500 hover:-translate-y-2 transition-all duration-300 shadow-lg"
                  >
                    Beli Robux Sekarang
                  </button>
                  <Link
                    href="/gamepass"
                    className=" border-2 border-cyan-400 text-cyan-400 px-8 py-4 rounded-2xl font-semibold text-lg hover:-translate-y-2  transition-all duration-300 text-center shadow-lg"
                  >
                    Lihat Gamepass
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center lg:justify-start gap-8 mt-8 text-sm text-white/70">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    Proses Instan
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    Aman & Terpercaya
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    Support 24/7
                  </div>
                </div>
              </div>

              {/* Character Image */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <Image
                    src="/char3.png"
                    alt="RobuxID Character"
                    width={500}
                    height={400}
                    className="mx-auto max-w-full h-auto"
                  />

                  {/* Floating badge */}
                  <div className="absolute top-8 -left-4 bg-white border-2 border-cyan-400 rounded-xl p-3 text-sm font-medium text-cyan-400 transform rotate-12 shadow-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🚀</span>
                      <div>
                        <div className="font-bold">Super Fast!</div>
                        <div className="text-xs text-gray-500">
                          Delivery in seconds
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-20 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-cyan-400/10 text-cyan-400 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
                Butuh Bantuan?
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Tim Support Siap <span className="text-cyan-400">Membantu</span>
              </h2>

              <p className="text-lg text-white/70 mb-8 leading-relaxed">
                Mengalami kendala saat melakukan pembelian? Tim customer service
                profesional kami siap membantu Anda 24/7 melalui berbagai
                platform komunikasi.
              </p>

              {/* Contact Methods */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className=" rounded-2xl p-4 text-center group hover:shadow-lg transition-all duration-300 border border-white/40 hover:border-cyan-400">
                  <div className="w-12 h-12 bg-cyan-400/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-cyan-400/20 transition-all duration-300">
                    <Image
                      src="/wa.png"
                      alt="WhatsApp"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="text-sm font-medium text-white">WhatsApp</div>
                  <div className="text-xs text-gray-500">Chat Langsung</div>
                </div>

                <div className=" rounded-2xl p-4 text-center group hover:shadow-lg transition-all duration-300 border border-white/40 hover:border-cyan-400">
                  <div className="w-12 h-12 bg-cyan-400/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-cyan-400/20 transition-all duration-300">
                    <Image
                      src="/discord.png"
                      alt="Discord"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="text-sm font-medium text-white">Discord</div>
                  <div className="text-xs text-gray-500">Server Community</div>
                </div>

                <div className=" rounded-2xl p-4 text-center group hover:shadow-lg transition-all duration-300 border border-white/40 hover:border-cyan-400">
                  <div className="w-12 h-12 bg-cyan-400/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-cyan-400/20 transition-all duration-300">
                    <Image
                      src="/ig.png"
                      alt="Instagram"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="text-sm font-medium text-white">
                    Instagram
                  </div>
                  <div className="text-xs text-gray-500">DM Support</div>
                </div>

                <div className=" rounded-2xl p-4 text-center group hover:shadow-lg transition-all duration-300 border border-white/40 hover:border-cyan-400">
                  <div className="w-12 h-12 bg-cyan-400/10 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-cyan-400/20 transition-all duration-300">
                    <span className="text-cyan-400 text-xl">📚</span>
                  </div>
                  <div className="text-sm font-medium text-white">Panduan</div>
                  <div className="text-xs text-gray-500">Step by Step</div>
                </div>
              </div>

              {/* Quick Contact Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="bg-cyan-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-cyan-500 hover:-translate-y-1 transition-all duration-300 shadow-lg">
                  Hubungi Support
                </button>
                {/* <button className=" border-1 border-cyan-400 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:-translate-y-1  transition-all duration-300 text-center shadow-lg">
                  Lihat Panduan
                </button> */}
              </div>
            </div>

            {/* Character Illustration */}
            <div className="relative">
              <div className=" rounded-3xl p-8  relative overflow-hidden">
                <Image
                  src="/char4.png"
                  alt="Support Character"
                  width={400}
                  height={400}
                  className="mx-auto max-w-full h-auto"
                />

                {/* Floating elements */}
                <div className="absolute top-4 right-4 bg-cyan-400/10 border border-cyan-400/30 rounded-xl p-2 text-xs font-medium text-cyan-400">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    Online 24/7
                  </div>
                </div>

                <div className="absolute bottom-4 left-4  border border-cyan-400/30 rounded-xl p-2 text-xs font-medium text-cyan-400 shadow-lg">
                  <div className="flex items-center gap-1">
                    <span>⚡</span>
                    Fast Response
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Marquee Section */}
      <section className="py-20 relative">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-sm text-cyan-400 font-medium mb-6">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
              Testimoni Pelanggan
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Apa Kata{" "}
              <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">
                Mereka?
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Ribuan gamer sudah merasakan pengalaman berbelanja terbaik bersama
              kami
            </p>
          </div>

          {/* Reviews Marquee */}
          <div className="mb-8 py-4">
            <Marquee
              speed={35}
              pauseOnHover={true}
              gradient={false}
              className="py-5"
            >
              {/* Review Card 1 */}
              <div className="bg-white/10 backdrop-blur-sm border border-cyan-400/20 rounded-xl p-4 mx-3 min-w-[280px] hover:bg-white/15 hover:border-cyan-400/40 hover:-translate-y-2 transition-all duration-500 hover:shadow-xl hover:shadow-cyan-400/10">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    R
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-white text-sm">
                      Rafi*****
                    </div>
                    <div className="flex text-yellow-400 text-xs">
                      {"⭐".repeat(5)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 italic mb-3 text-sm">
                  "Pelayanannya cepet banget! Robux langsung masuk dalam 2
                  hari."
                </p>
                <div className="text-xs text-cyan-300">
                  ✅ 2,500 R$ • 2 hari lalu
                </div>
              </div>

              {/* Review Card 2 */}
              <div className="bg-white/10 backdrop-blur-sm border border-emerald-400/20 rounded-xl p-4 mx-3 min-w-[290px] hover:bg-white/15 hover:border-emerald-400/40 hover:-translate-y-2 transition-all duration-500 hover:shadow-xl hover:shadow-emerald-400/10">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    A
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-white text-sm">
                      Alex*****
                    </div>
                    <div className="flex text-yellow-400 text-xs">
                      {"⭐".repeat(5)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 italic mb-3 text-sm">
                  "Harga paling murah dan amanah! Udah langganan dari tahun
                  lalu."
                </p>
                <div className="text-xs text-emerald-300">
                  ✅ 5,000 R$ • 1 minggu lalu
                </div>
              </div>

              {/* Review Card 3 */}
              <div className="bg-white/10 backdrop-blur-sm border border-purple-400/20 rounded-xl p-4 mx-3 min-w-[285px] hover:bg-white/15 hover:border-purple-400/40 hover:-translate-y-2 transition-all duration-500 hover:shadow-xl hover:shadow-purple-400/10">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    M
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-white text-sm">
                      Maya*****
                    </div>
                    <div className="flex text-yellow-400 text-xs">
                      {"⭐".repeat(5)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 italic mb-3 text-sm">
                  "CS nya ramah banget, dibantu sampe tuntas. Proses gampang!"
                </p>
                <div className="text-xs text-purple-300">
                  ✅ 1,000 R$ • 3 hari lalu
                </div>
              </div>

              {/* Review Card 4 */}
              <div className="bg-white/10 backdrop-blur-sm border border-yellow-400/20 rounded-xl p-4 mx-3 min-w-[275px] hover:bg-white/15 hover:border-yellow-400/40 hover:-translate-y-2 transition-all duration-500 hover:shadow-xl hover:shadow-yellow-400/10">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    D
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-white text-sm">
                      Dino*****
                    </div>
                    <div className="flex text-yellow-400 text-xs">
                      {"⭐".repeat(5)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 italic mb-3 text-sm">
                  "Gamepass langsung aktif sesuai jadwal. Mantap banget!"
                </p>
                <div className="text-xs text-yellow-300">
                  ✅ Gamepass • 5 hari lalu
                </div>
              </div>

              {/* Review Card 5 */}
              <div className="bg-white/10 backdrop-blur-sm border border-rose-400/20 rounded-xl p-4 mx-3 min-w-[300px] hover:bg-white/15 hover:border-rose-400/40 hover:-translate-y-2 transition-all duration-500 hover:shadow-xl hover:shadow-rose-400/10">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    S
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-white text-sm">
                      Sari*****
                    </div>
                    <div className="flex text-yellow-400 text-xs">
                      {"⭐".repeat(5)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 italic mb-3 text-sm">
                  "Pertama kali beli disini, ternyata legit dan terpercaya!"
                </p>
                <div className="text-xs text-rose-300">
                  ✅ 3,200 R$ • 1 hari lalu
                </div>
              </div>

              {/* Review Card 6 */}
              <div className="bg-white/10 backdrop-blur-sm border border-indigo-400/20 rounded-xl p-4 mx-3 min-w-[295px] hover:bg-white/15 hover:border-indigo-400/40 hover:-translate-y-2 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-400/10">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-white text-sm">
                    B
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-white text-sm">
                      Bayu*****
                    </div>
                    <div className="flex text-yellow-400 text-xs">
                      {"⭐".repeat(5)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-300 italic mb-3 text-sm">
                  "Website nya keren, sistemnya juga aman. Pokoknya top!"
                </p>
                <div className="text-xs text-indigo-300">
                  ✅ 4,500 R$ • 6 hari lalu
                </div>
              </div>
            </Marquee>
          </div>

          {/* Trust Indicators */}
          <div className="text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full px-8 py-4 backdrop-blur-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
              <span className="text-green-400 font-semibold text-lg">
                4.9/5 Rating
              </span>
              <span className="text-white/70 mx-3">•</span>
              <span className="text-white/70 text-lg">50,000+ Reviews</span>
              <span className="text-white/70 mx-3">•</span>
              <span className="text-cyan-400 font-semibold text-lg">
                Verified Customers
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-cyan-900/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-sm text-cyan-400 font-medium mb-6">
              <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2 animate-pulse"></span>
              Frequently Asked Questions
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Pertanyaan{" "}
              <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">
                Umum
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              Dapatkan jawaban cepat untuk pertanyaan yang sering ditanyakan
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {/* FAQ 1 */}
            <details className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer group-open:bg-cyan-400/10 transition-all">
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300">
                  Berapa lama waktu pengiriman Robux?
                </h3>
                <div className="w-6 h-6 text-cyan-400 group-open:rotate-180 transition-transform">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-300 leading-relaxed">
                  Robux akan dikirim maksimal dalam 5 hari kerja setelah
                  pembayaran dikonfirmasi. Pengiriman dilakukan melalui gamepass
                  resmi Roblox untuk memastikan keamanan akun Anda.
                </p>
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer group-open:bg-cyan-400/10 transition-all">
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300">
                  Apakah pembayaran aman dan terpercaya?
                </h3>
                <div className="w-6 h-6 text-cyan-400 group-open:rotate-180 transition-transform">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-300 leading-relaxed">
                  Ya, sangat aman! Kami menggunakan gateway pembayaran
                  terpercaya seperti Midtrans dengan enkripsi SSL. Semua
                  transaksi dilindungi dan data pembayaran Anda tidak akan
                  disimpan di server kami.
                </p>
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer group-open:bg-cyan-400/10 transition-all">
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300">
                  Bagaimana cara melacak status pesanan?
                </h3>
                <div className="w-6 h-6 text-cyan-400 group-open:rotate-180 transition-transform">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-300 leading-relaxed">
                  Anda bisa melacak pesanan melalui halaman "Lacak Pesanan"
                  dengan memasukkan Order ID yang dikirim via email. Atau
                  hubungi customer service kami di WhatsApp untuk update
                  real-time.
                </p>
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer group-open:bg-cyan-400/10 transition-all">
                <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300">
                  Apakah ada minimum pembelian Robux?
                </h3>
                <div className="w-6 h-6 text-cyan-400 group-open:rotate-180 transition-transform">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </summary>
              <div className="px-6 pb-6">
                <p className="text-gray-300 leading-relaxed">
                  Minimum pembelian adalah 100 Robux. Tidak ada batas maksimum,
                  jadi Anda bisa membeli sesuai kebutuhan. Semakin banyak yang
                  dibeli, semakin hemat harga per Robux-nya!
                </p>
              </div>
            </details>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 backdrop-blur-sm border border-cyan-400/30 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                Masih ada pertanyaan?
              </h3>
              <p className="text-gray-300 mb-6">
                Tim customer service kami siap membantu Anda 24/7
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/6285753305598"
                  target="_blank"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  <span>💬</span>
                  Chat WhatsApp
                </a>
                <Link
                  href="/track-order"
                  className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  <span>🔍</span>
                  Lacak Pesanan
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Product Showcase */}
    </PublicLayout>
  );
}
