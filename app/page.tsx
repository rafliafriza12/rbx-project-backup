"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
// 1. Import useRef dari React
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Marquee from "react-fast-marquee";
import {
  Gem,
  Rocket,
  Users,
  Star,
  Flame,
  Sparkles,
  CheckCircle,
  Zap,
  BookOpen,
  Gamepad2,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
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

interface LiveTransaction {
  id: string;
  username: string;
  displayName: string;
  displayQuantity: string;
  timeAgo: string;
  serviceType: string;
  colorScheme: string;
}

interface LiveReview {
  id: string;
  username: string;
  initial: string;
  rating: number;
  comment: string;
  serviceInfo: string;
  timeAgo: string;
  serviceType: string;
  colorScheme: string;
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

  // Helper function to format numbers with "k" suffix
  const formatNumber = (num: number): string => {
    if (num >= 10000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toLocaleString();
  };

  // Gamepass state
  const [gamepasses, setGamepasses] = useState<Gamepass[]>([]);
  const [loadingGamepasses, setLoadingGamepasses] = useState(true);

  // Banner state
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Live Transactions state
  const [liveTransactions, setLiveTransactions] = useState<LiveTransaction[]>(
    []
  );
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  // Reviews state
  const [liveReviews, setLiveReviews] = useState<LiveReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

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

    // Fetch active banners
    fetchActiveBanners();

    // Fetch live transactions
    fetchLiveTransactions();

    // Fetch live reviews
    fetchLiveReviews();
  }, []);

  // Scroll to section with offset when hash is present in URL
  useEffect(() => {
    const hashTarget = window.location.hash.replace("#", "");
    console.log("🔍 Hash target:", hashTarget);

    if (!hashTarget) return;

    const performScroll = () => {
      const OFFSET = 90; // navbar height
      const element = document.getElementById(hashTarget);
      console.log(
        "🎯 Attempting scroll to:",
        hashTarget,
        "Element found:",
        !!element
      );

      if (element) {
        const top =
          element.getBoundingClientRect().top + window.scrollY - OFFSET;
        console.log("✅ Scrolling to position:", top);
        window.scrollTo({ top, behavior: "smooth" });

        // Clean hash from URL after scroll
        setTimeout(() => {
          history.replaceState(null, "", window.location.pathname);
        }, 1000);
        return true;
      }
      return false;
    };

    // Try to scroll after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (performScroll()) {
        console.log("✅ Scroll successful");
      } else {
        // Retry if element not found
        console.log("⚠️ Element not found, retrying...");
        setTimeout(performScroll, 500);
      }
    }, 100);

    return () => clearTimeout(timer);
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

  // Function to fetch active banners
  const fetchActiveBanners = async () => {
    try {
      const response = await fetch("/api/banners?active=true");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          setBanners(data.data);
        } else {
          // Use default banners if no active banners from database
          setBanners([
            {
              id: 1,
              imageUrl: "/banner.webp",
              link: "/gamepass",
              alt: "Banner Gamepass Terbaru",
            },
            {
              id: 2,
              imageUrl: "/banner2.png",
              link: "/rbx5",
              alt: "Banner RBX Promo",
            },
            {
              id: 3,
              imageUrl: "/banner.png",
              link: "/joki",
              alt: "Banner Joki Service",
            },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      // Use default banners on error
      setBanners([
        {
          id: 1,
          imageUrl: "/banner.webp",
          link: "/gamepass",
          alt: "Banner Gamepass Terbaru",
        },
        {
          id: 2,
          imageUrl: "/banner2.png",
          link: "/rbx5",
          alt: "Banner RBX Promo",
        },
        {
          id: 3,
          imageUrl: "/banner.png",
          link: "/joki",
          alt: "Banner Joki Service",
        },
      ]);
    } finally {
      setLoadingBanners(false);
    }
  };

  // Function to fetch live transactions
  const fetchLiveTransactions = async () => {
    try {
      const response = await fetch("/api/live-transactions");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setLiveTransactions(data.data);
        }
      } else {
        console.error("Failed to fetch live transactions");
      }
    } catch (error) {
      console.error("Error fetching live transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  // Function to fetch live reviews
  const fetchLiveReviews = async () => {
    try {
      const response = await fetch("/api/reviews/live");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setLiveReviews(data.data);
        }
      } else {
        console.error("Failed to fetch live reviews");
      }
    } catch (error) {
      console.error("Error fetching live reviews:", error);
    } finally {
      setLoadingReviews(false);
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
      toast.error("Silakan masukkan jumlah RBX yang valid");
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

  // Auto-loop banner effect
  useEffect(() => {
    if (banners.length > 0) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prevIndex) =>
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
      }, 4000); // Change banner every 4 seconds

      return () => clearInterval(interval);
    }
  }, [banners]);

  return (
    <PublicLayout>
      {/* Banner Carousel Section */}
      <section className="relative w-full full aspect-[16/4] lg:aspect-auto lg:h-60 overflow-hidden">
        {loadingBanners ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-800/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-pink"></div>
          </div>
        ) : banners.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-neon-pink/20">
            <p className="text-white/60">Tidak ada banner tersedia</p>
          </div>
        ) : (
          <div className="relative w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center">
              {banners.map((banner, index) => {
                let position = index - currentBannerIndex;
                if (position < -1) position = banners.length + position;
                if (position > 1) position = position - banners.length;

                const getCardStyle = (pos: number) => {
                  switch (pos) {
                    case 0:
                      return {
                        transform: "translateX(0%) translateY(0%) scale(1)",
                        zIndex: 30,
                        opacity: 1,
                        filter: "brightness(1)",
                      };
                    case -1:
                      return {
                        transform: "translateX(-20%) translateY(0%) scale(0.8)",
                        zIndex: 10,
                        opacity: 0.7,
                        filter: "brightness(0.6)",
                      };
                    case 1:
                      return {
                        transform: "translateX(5.5%) translateY(0%) scale(0.8)",
                        zIndex: 10,
                        opacity: 0.7,
                        filter: "brightness(0.6)",
                      };
                    default:
                      return {
                        transform: "translateX(0%) translateY(0%) scale(0.5)",
                        zIndex: 0,
                        opacity: 0,
                        filter: "brightness(0.3)",
                      };
                  }
                };

                const cardStyle = getCardStyle(position);

                // Position classes based on card position
                const getPositionClasses = (pos: number) => {
                  switch (pos) {
                    case 0:
                      // Active: Full width on mobile, 80% on desktop
                      return "left-0 w-full lg:left-1/2 lg:-ml-[40%] lg:w-[80%]";
                    case -1:
                      // Left: Hidden on mobile, visible on desktop
                      return "left-[10%] w-[70%] opacity-0 lg:opacity-70";
                    case 1:
                      // Right: Hidden on mobile, visible on desktop
                      return "left-[30%] w-[70%] opacity-0 lg:opacity-70";
                    default:
                      return "left-0 w-full lg:left-1/2 lg:-ml-[35%] lg:w-[70%]";
                  }
                };

                return (
                  <div
                    key={banner.id}
                    className={`absolute top-0 bottom-0 transition-all duration-700 ease-out cursor-pointer ${getPositionClasses(
                      position
                    )}`}
                    style={{
                      transform: cardStyle.transform,
                      zIndex: cardStyle.zIndex,
                      filter: cardStyle.filter,
                    }}
                    onClick={() => {
                      if (position === 0) {
                        window.location.href = banner.link;
                      } else {
                        setCurrentBannerIndex(index);
                      }
                    }}
                  >
                    <div
                      className={`relative w-full h-full group ${
                        position === 0 ? "p-0 lg:p-4" : "p-2 sm:p-3 lg:p-4"
                      }`}
                    >
                      <div className="relative w-full h-full overflow-hidden rounded-lg lg:rounded-3xl">
                        <Image
                          src={banner.imageUrl}
                          alt={banner.alt}
                          fill
                          className={`object-fill transition-transform duration-700 ${
                            position === 0
                              ? "group-hover:scale-110"
                              : "group-hover:scale-105"
                          }`}
                          priority={index === 0}
                        />
                        {/* Purple neon overlay - stronger for side cards */}
                        <div
                          className={`absolute inset-0 transition-all duration-500 ${
                            position === 0
                              ? "bg-gradient-to-r from-primary-900/10 via-transparent to-primary-800/10 group-hover:from-primary-900/5 group-hover:to-primary-800/5"
                              : "bg-gradient-to-r from-primary-900/40 via-primary-800/30 to-primary-900/40"
                          }`}
                        ></div>
                        {/* Active card glow effect */}
                        {position === 0 && (
                          <>
                            <div className="absolute inset-0 bg-primary-100/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl sm:rounded-3xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Navigation Dots - Hidden on mobile, visible on desktop */}
            <div className="hidden lg:flex absolute bottom-4 left-1/2 transform -translate-x-1/2 gap-2 z-40">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === currentBannerIndex
                      ? "w-8 h-2 bg-gradient-to-r from-neon-pink to-neon-purple"
                      : "w-2 h-2 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Hero Section - Enhanced Modern Design */}
      <section className="relative pb-12 lg:pb-16 overflow-hidden z-0">
        {/* Enhanced Background Gradient */}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-1 justify-center px-6 py-3 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 border border-neon-pink/30 rounded-2xl text-sm text-neon-pink font-semibold mb-8 backdrop-blur-sm shadow-lg hover:shadow-neon-pink/20 transition-all duration-300">
              <div className="flex items-center fap-1">
                <Sparkles className="w-4 h-4" />
              </div>
              #1 Platform RBX Terpercaya di Indonesia
            </div>

            {/* Enhanced Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-extrabold text-white mb-8 leading-[0.9] tracking-tight">
              Jual Beli <span className="text-primary-100">RBX</span>
              <br />
              <span className="text-neon-purple">Terpercaya</span> &{" "}
              <span className="text-neon-pink">Termurah</span>
            </h1>

            {/* Enhanced Description */}
            <p className="text-xl sm:text-lg text-white/80 max-w-4xl mx-auto mb-8  font-light">
              Platform #1 Indonesia untuk transaksi RBX dengan{" "}
              <span className="text-neon-pink font-medium">harga terbaik</span>,{" "}
              <span className="text-neon-purple font-medium">
                proses instan
              </span>
              , dan{" "}
              <span className="text-white font-medium">keamanan terjamin</span>.
              <br className="hidden sm:block" />
              Bergabung dengan{" "}
              <span className="text-neon-pink font-semibold">50.000+</span>{" "}
              player yang sudah mempercayai kami.
            </p>

            {/* Enhanced CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <button
                onClick={handleScrollToPembelian}
                className="group relative btn-neon-primary text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-105 shadow-2xl hover:shadow-neon-pink/40"
              >
                <div className="flex items-center justify-center gap-3">
                  <Rocket className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  Beli RBX Sekarang
                </div>
              </button>
              <Link
                href="/track-order"
                className="group relative bg-white/10 backdrop-blur-md text-white border-2 border-white/20 hover:border-neon-purple/60 px-10 py-5 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-105 hover:bg-white/20"
              >
                <div className="flex items-center justify-center gap-3">
                  <BookOpen className="w-6 h-6 group-hover:rotate-6 transition-transform duration-300" />
                  Lacak Pesanan
                </div>
              </Link>
            </div>

            {/* Premium Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <div className="group relative bg-gradient-to-br from-primary-100/10 via-transparent to-primary-100/5 backdrop-blur-xl border border-primary-100/60 rounded-3xl p-8 text-center transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary-100/20 hover:border-primary-100/40">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100/20 to-primary-100/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Gem className="text-white w-8 h-8" />
                  </div>
                  <div className="text-3xl font-black text-white mb-2 group-hover:text-neon-pink transition-colors duration-300">
                    {rbx5Stats.totalStok.toLocaleString()}
                  </div>
                  <div className="text-white/70 text-sm font-medium">
                    R$ Tersedia
                  </div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-primary-100/10 via-transparent to-primary-100/5 backdrop-blur-xl border border-primary-100/60 rounded-3xl p-8 text-center transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary-100/20 hover:border-primary-100/40">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100/20 to-primary-100/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Rocket className="text-white w-8 h-8" />
                  </div>
                  <div className="text-3xl font-black text-white mb-2 group-hover:text-neon-pink transition-colors duration-300">
                    {rbx5Stats.totalTerjual.toLocaleString()}
                  </div>
                  <div className="text-white/70 text-sm font-medium">
                    R$ Terjual
                  </div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-primary-100/10 via-transparent to-primary-100/5 backdrop-blur-xl border border-primary-100/60 rounded-3xl p-8 text-center transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary-100/20 hover:border-primary-100/40">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100/20 to-primary-100/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Users className="text-white w-8 h-8" />
                  </div>
                  <div className="text-3xl font-black text-white mb-2 group-hover:text-neon-pink transition-colors duration-300">
                    {loadingStats ? "..." : formatNumber(rbx5Stats.totalOrder)}+
                  </div>
                  <div className="text-white/70 text-sm font-medium">
                    Customers
                  </div>
                </div>
              </div>

              <div className="group relative bg-gradient-to-br from-primary-100/10 via-transparent to-primary-100/5 backdrop-blur-xl border border-primary-100/60 rounded-3xl p-8 text-center transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl hover:shadow-primary-100/20 hover:border-primary-100/40">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100/20 to-primary-100/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <Star className="text-white w-8 h-8" />
                  </div>
                  <div className="text-3xl font-black text-white mb-2 group-hover:text-neon-pink transition-colors duration-300">
                    99.9%
                  </div>
                  <div className="text-white/70 text-sm font-medium">
                    Success Rate
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Transaction Ticker - Neon Theme */}
            <div className="mt-10 max-w-6xl mx-auto">
              <div className="neon-card rounded-xl p-6 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-pink/5 to-transparent animate-pulse"></div>
                <div className="relative">
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-3 h-3 bg-neon-pink rounded-full animate-pulse mr-3"></div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Flame className="text-neon-pink w-5 h-5" />
                      Transaksi Real-time
                    </h3>
                  </div>

                  {loadingTransactions ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-neon-pink/30 border-t-neon-pink"></div>
                    </div>
                  ) : liveTransactions.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-white/60">
                        Belum ada transaksi hari ini
                      </p>
                    </div>
                  ) : (
                    <Marquee
                      speed={40}
                      pauseOnHover={true}
                      className="py-5 overflow-hidden"
                      gradientWidth={80}
                    >
                      {liveTransactions.map((tx) => {
                        // Determine style based on colorScheme
                        const getCardStyle = () => {
                          switch (tx.colorScheme) {
                            case "pink":
                              return {
                                borderColor: "border-neon-pink/30",
                                hoverBorder: "hover:border-neon-pink/60",
                                bgGradient: "bg-gradient-neon-primary",
                                textColor: "text-neon-pink",
                                cardClass: "neon-card",
                              };
                            case "purple":
                              return {
                                borderColor: "border-neon-purple/30",
                                hoverBorder: "hover:border-neon-purple/60",
                                bgGradient: "bg-gradient-neon-secondary",
                                textColor: "text-neon-purple",
                                cardClass: "neon-card-secondary",
                              };
                            case "teal":
                              return {
                                borderColor: "border-teal-400/20",
                                hoverBorder: "hover:border-teal-400/40",
                                bgGradient:
                                  "bg-gradient-to-br from-teal-400 to-cyan-500",
                                textColor: "text-teal-300",
                                cardClass: "bg-white/5 backdrop-blur-sm",
                              };
                            case "amber":
                              return {
                                borderColor: "border-amber-400/20",
                                hoverBorder: "hover:border-amber-400/40",
                                bgGradient:
                                  "bg-gradient-to-br from-amber-400 to-yellow-500",
                                textColor: "text-amber-300",
                                cardClass: "bg-white/5 backdrop-blur-sm",
                              };
                            case "indigo":
                              return {
                                borderColor: "border-indigo-400/20",
                                hoverBorder: "hover:border-indigo-400/40",
                                bgGradient:
                                  "bg-gradient-to-br from-indigo-400 to-purple-500",
                                textColor: "text-indigo-300",
                                cardClass: "bg-white/5 backdrop-blur-sm",
                              };
                            default:
                              return {
                                borderColor: "border-neon-pink/30",
                                hoverBorder: "hover:border-neon-pink/60",
                                bgGradient: "bg-gradient-neon-primary",
                                textColor: "text-neon-pink",
                                cardClass: "neon-card",
                              };
                          }
                        };

                        const style = getCardStyle();

                        // Determine icon based on service type
                        const getIcon = () => {
                          switch (tx.serviceType) {
                            case "robux":
                              return <Gem className="text-white w-5 h-5" />;
                            case "gamepass":
                              return (
                                <Gamepad2 className="text-white w-5 h-5" />
                              );
                            case "joki":
                              return <Rocket className="text-white w-5 h-5" />;
                            default:
                              return <Zap className="text-white w-5 h-5" />;
                          }
                        };

                        return (
                          <div
                            key={tx.id}
                            className={`flex items-center ${style.cardClass} border ${style.borderColor} rounded-lg p-4 mx-3 min-w-[280px] ${style.hoverBorder} transition-all duration-300`}
                          >
                            <div
                              className={`w-10 h-10 ${style.bgGradient} rounded-full flex items-center justify-center mr-4`}
                            >
                              {getIcon()}
                            </div>
                            <div className="flex-1">
                              <div className="text-white font-semibold">
                                {tx.username}
                              </div>
                              <div className={`${style.textColor} text-sm`}>
                                {tx.displayQuantity}
                              </div>
                            </div>
                            <div className="text-right">
                              <div
                                className={`${style.textColor} font-medium text-sm flex items-center gap-1`}
                              >
                                <CheckCircle className="w-3 h-3" />
                                Berhasil
                              </div>
                              <div className="text-white/50 text-xs">
                                {tx.timeAgo}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </Marquee>
                  )}

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

        {/* Floating Elements - Neon Theme */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-neon-pink/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-neon-purple/20 rounded-full blur-xl animate-pulse"></div>
      </section>

      {/* Premium Products Section */}
      <section
        ref={pembelianRef}
        className="py-12 lg:py-16 relative overflow-hidden"
      >
        {/* Enhanced Background */}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1 px-6 py-3 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 border border-neon-pink/30 rounded-2xl text-sm text-neon-pink font-semibold mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 " />
              RBX Premium Experience
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              Pilih <span className="text-primary-100">RBX</span>
              <br />
              <span className="text-neon-purple">Terbaik</span> Untukmu
            </h2>
            <p className="text-xl sm:text-lg text-white/80 max-w-4xl mx-auto  font-light">
              Platform terdepan untuk mendapatkan RBX dengan{" "}
              <span className="text-neon-pink font-medium">
                harga terjangkau
              </span>{" "}
              dan{" "}
              <span className="text-neon-purple font-medium">
                proses instan
              </span>
              .
              <br className="hidden sm:block" />
              Pilih paket yang sempurna untuk petualangan gaming kamu.
            </p>
          </div>

          {/* Premium Purchase Card */}
          <div className="group relative bg-gradient-to-br from-white/5 via-neon-purple/5 to-neon-pink/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 mb-10 max-w-5xl mx-auto hover:border-neon-pink/30 transition-all duration-700 hover:shadow-2xl hover:shadow-neon-pink/20">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-pink/5 via-transparent to-neon-purple/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative text-center mb-10">
              <div className="inline-flex justify-center gap-1 items-center px-6 py-3 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border border-neon-pink/40 rounded-2xl text-sm text-neon-pink font-bold mb-6 backdrop-blur-sm shadow-lg">
                <div className="flex items-center ">
                  <Gem className="w-4 h-4" />
                </div>
                RBX Premium - GamePass Official
              </div>
              <h3 className="text-4xl sm:text-5xl font-black text-white mb-4">
                Beli <span className="text-primary-100">RBX</span> Instan
              </h3>
              <p className="text-xl text-white/80 max-w-2xl mx-auto ">
                RBX akan otomatis ditambahkan ke akun kamu melalui{" "}
                <span className="text-neon-pink font-semibold">
                  gamepass resmi
                </span>{" "}
                dalam hitungan menit
              </p>
            </div>

            {/* Premium Input Form */}
            <div className="grid md:grid-cols-2 gap-10 mb-10">
              <div className="space-y-6">
                <label className="flex items-center gap-2 text-lg font-bold text-white">
                  <Gem className="w-5 h-5 text-neon-pink" />
                  Jumlah RBX
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    placeholder="Masukkan jumlah RBX"
                    value={robuxAmount === 0 ? "" : robuxAmount.toString()}
                    onChange={(e) => handleRobuxChange(e.target.value)}
                    className="w-full px-6 py-5 border-2 border-white/20 rounded-2xl bg-white/5 backdrop-blur-md text-white text-xl placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300 pr-16 group-hover:border-neon-purple/40"
                    min="1"
                  />
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-neon-pink font-bold text-lg">
                    R$
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-neon-pink/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              <div className="space-y-6">
                <label className="flex items-center gap-2 text-lg font-bold text-white">
                  <Sparkles className="w-5 h-5 text-neon-purple" />
                  Total Harga
                </label>
                <div className="relative bg-gradient-to-br from-neon-pink/10 to-neon-purple/10 backdrop-blur-md border-2 border-neon-pink/30 rounded-2xl py-5 px-6 hover:border-neon-pink/50 transition-all duration-300">
                  <div className="text-xl font-black text-white">
                    {loadingStats ? (
                      <span className="text-xl text-white/70 font-medium">
                        Menghitung...
                      </span>
                    ) : totalPrice > 0 ? (
                      <>
                        <span className="text-primary-50">
                          Rp {totalPrice.toLocaleString()}
                        </span>
                        {discount > 0 && (
                          <div className="text-sm text-neon-purple font-semibold mt-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Hemat {discount}% - Diskon diterapkan!
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-white/40">Rp 0</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Action Button */}
            <div className="text-center">
              <button
                onClick={handleBuyNow}
                disabled={robuxAmount <= 0 || loadingStats}
                className={`group relative px-16 py-6 rounded-3xl font-black text-xl transition-all duration-500 transform inline-flex items-center gap-4 w-full md:w-auto justify-center shadow-2xl ${
                  robuxAmount <= 0 || loadingStats
                    ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600"
                    : "btn-neon-primary hover:scale-110 hover:shadow-neon-pink/50 active:scale-95"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center gap-4">
                  <span>
                    {robuxAmount > 0
                      ? `${robuxAmount.toLocaleString()} RBX`
                      : "Beli RBX Sekarang"}
                  </span>
                  {/* <Rocket className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" /> */}
                </div>
              </button>

              {robuxAmount > 0 && (
                <div className="mt-6 flex items-center justify-center gap-2 text-white/80">
                  <div className="flex items-center gap-2 px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 rounded-full">
                    <Zap className="w-4 h-4 text-neon-purple animate-pulse" />
                    <span className="text-sm font-medium">
                      Pengiriman dalam 5 hari kerja
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Mini Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              <div className="neon-card rounded-xl p-4 sm:p-5 shadow-neon-pink hover:shadow-neon-intense transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-neon-pink rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Image
                      src="/stk.png"
                      alt="stok"
                      width={16}
                      height={16}
                      className="sm:w-5 sm:h-5 brightness-0 invert"
                    />
                  </div>
                  <div className="text-sm font-medium text-white/60">
                    Total Stock
                  </div>
                </div>
                <div className="text-lg font-bold text-white">
                  {loadingStats
                    ? "..."
                    : `${rbx5Stats.totalStok.toLocaleString()} R$`}
                </div>
              </div>

              <div className="neon-card-secondary rounded-xl p-4 sm:p-5 shadow-neon-purple hover:shadow-neon-intense transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-neon-purple rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Image
                      src="/tjl.png"
                      alt="terjual"
                      width={16}
                      height={16}
                      className="sm:w-5 sm:h-5 brightness-0 invert"
                    />
                  </div>
                  <div className="text-sm font-medium text-white/60">
                    Terjual
                  </div>
                </div>
                <div className="text-lg font-bold text-white">
                  {loadingStats
                    ? "..."
                    : `${rbx5Stats.totalTerjual.toLocaleString()} R$`}
                </div>
              </div>

              <div className="neon-card rounded-xl p-4 sm:p-5 shadow-neon-pink hover:shadow-neon-intense transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-neon-pink rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Image
                      src="/ord.png"
                      alt="order"
                      width={16}
                      height={16}
                      className="brightness-0 invert"
                    />
                  </div>
                  <div className="text-sm font-medium text-white/60">
                    Total Order
                  </div>
                </div>
                <div className="text-lg font-bold text-white">
                  {loadingStats ? "..." : rbx5Stats.totalOrder.toLocaleString()}
                </div>
              </div>

              <div className="neon-card-secondary rounded-xl p-4 sm:p-5 shadow-neon-purple hover:shadow-neon-intense transition-all duration-300 hover:-translate-y-2 group">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="w-8 h-8 bg-neon-purple rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Image
                      src="/rux.png"
                      alt="harga rbx"
                      width={16}
                      height={16}
                      className="brightness-0 invert"
                    />
                  </div>
                  <div className="text-sm font-medium text-white/60">
                    Harga RBX
                  </div>
                </div>
                <div className="text-lg font-bold text-white">
                  {loadingStats ? (
                    "..."
                  ) : (
                    <>
                      Rp.{rbx5Stats.hargaPer100Robux.toLocaleString()}{" "}
                      <span className="text-xs font-medium text-primary-300">
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

      {/* Premium Gamepass Section */}
      <section className="py-12 lg:py-16 relative overflow-hidden">
        {/* Enhanced Background */}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Enhanced Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-purple/10 to-neon-pink/10 border border-neon-pink/30 text-neon-pink rounded-3xl text-sm font-bold mb-6 backdrop-blur-sm shadow-xl">
              <div className="flex items-center ">
                <Gamepad2 className="w-5 h-5" />
              </div>
              Gamepass
              {/* & Joki */}
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              <span className="text-neon-purple">Game</span> Populer
              <br />
              <span className="text-primary-100">Tersedia</span>
            </h2>
            <p className="text-xl sm:text-lg text-white/80 max-w-4xl mx-auto  font-light">
              Koleksi terlengkap{" "}
              <span className="text-neon-pink font-medium">
                gamepass eksklusif
              </span>{" "}
              dan{" "}
              <span className="text-neon-purple font-medium">
                avatar premium
              </span>{" "}
              dari game-game favorit.
              <br className="hidden sm:block" />
              Wujudkan impian RBX kamu dengan{" "}
              <span className="text-white font-semibold">harga terbaik</span>.
            </p>
          </div>

          {loadingGamepasses ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-neon-purple/30 border-t-neon-pink"></div>
              </div>
              <div className="text-center">
                <div className="text-white font-semibold text-lg mb-2">
                  Memuat Game Populer
                </div>
                <div className="text-white/60 text-sm">
                  Sedang mengambil data terbaru...
                </div>
              </div>
            </div>
          ) : gamepasses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 neon-card rounded-full flex items-center justify-center mx-auto mb-6">
                <Gamepad2 className="w-12 h-12 text-neon-pink" />
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {gamepasses.map((gamepass, index) => (
                <Link
                  key={gamepass._id}
                  href={`/gamepass/${gamepass._id}`}
                  className="group focus:outline-none h-full w-full block"
                >
                  {/* Mobile-Optimized Purple Neon Themed Gamepass Card */}
                  <div className="w-full relative h-full bg-gradient-to-br from-primary-600/80 via-primary-500/60 to-primary-700/80 backdrop-blur-xl border border-primary-200/20 rounded-lg sm:rounded-2xl overflow-hidden transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-primary-100/30 hover:border-primary-100 flex flex-col">
                    {/* Price Badge - Top Right Corner */}
                    {gamepass.item && gamepass.item.length > 0 && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
                        <div className="bg-gradient-to-r from-primary-100/50 to-primary-200/50 backdrop-blur-[3px] text-white/80 px-2 py-1 sm:px-3 sm:py-1 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-black shadow-[0_0_15px_rgba(246,58,230,0.5)] border border-primary-100/40">
                          <span className="hidden sm:inline">Mulai dari </span>
                          Rp{" "}
                          {Math.min(
                            ...gamepass.item.map((item) => item.price)
                          ).toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Game Image - Adjusted aspect ratio for mobile */}
                    <div className="relative aspect-[4/3] sm:aspect-[4/3] overflow-hidden flex-shrink-0">
                      <Image
                        src={gamepass.imgUrl}
                        alt={gamepass.gameName}
                        fill
                        className="object-contain transition-all duration-500 group-hover:scale-110"
                      />

                      {/* Purple gradient overlay for better contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-primary-800/90 via-primary-700/30 to-transparent"></div>
                    </div>

                    {/* Card Content - Optimized for mobile */}
                    <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 flex-grow flex flex-col">
                      {/* Game Title */}
                      <h3 className="text-primary-50 font-bold text-sm sm:text-lg leading-tight line-clamp-2 group-hover:text-primary-100 transition-colors duration-300">
                        {gamepass.gameName}
                      </h3>

                      {/* Game Items/Description - Hidden on mobile for space */}
                      <div className="space-y-1 sm:space-y-2 flex-grow">
                        {gamepass.item && gamepass.item.length > 0 && (
                          <p className=" text-white/80 text-sm leading-relaxed line-clamp-1">
                            {gamepass.item
                              .slice(0, 3)
                              .map((item) => item.itemName)
                              .join(", ")}
                            {gamepass.item.length > 3 && "..."}
                          </p>
                        )}
                      </div>

                      {/* Bottom section - Compact for mobile */}
                      <div className="space-y-2 sm:space-y-3 mt-auto w-full">
                        {/* Rating - More compact on mobile */}
                        <div className="flex items-center justify-between">
                          <span className="text-white/70 text-[10px] sm:text-xs">
                            {gamepass.item?.length || 0} items
                          </span>
                        </div>

                        {/* Action Button - Now serves as visual indicator */}
                        <div className="w-full bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold py-2 sm:py-3 px-2 sm:px-4 rounded-lg sm:rounded-xl transition-all duration-300 shadow-[0_0_15px_rgba(244,197,231,0.3)] border border-primary-100/30 transform  text-xs sm:text-sm text-center hover:-translate-y-1">
                          <span className="hidden sm:inline">
                            Lihat Game Pass
                          </span>
                          <span className="sm:hidden">Lihat</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="py-12 lg:py-16 relative overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(179,84,195,0.1),transparent_60%)]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-neon-purple/15 to-neon-pink/15 border border-neon-pink/40 text-neon-pink rounded-3xl text-sm font-bold mb-6 backdrop-blur-sm shadow-xl">
              <div className="flex items-center ">
                <Star className="w-5 h-5" />
              </div>
              Keunggulan Premium RBXNET
            </div>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight">
              <span className="text-neon-purple">Kenapa</span> Pilih
              <br />
              <span className="text-primary-100">RBXNET</span>?
            </h2>
            <p className="text-xl sm:text-lg text-white/80 max-w-4xl mx-auto  font-light">
              Keamanan tingkat militer, proses instan, dan kepuasan 100%
              terjamin.
              <br className="hidden sm:block" />
              Bergabung dengan{" "}
              <span className="text-neon-pink font-semibold">
                50.000+ gamer
              </span>{" "}
              yang mempercayai kami sebagai platform #1 Indonesia.
            </p>
          </div>

          {/* Premium Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Proses Instan */}
            <div className="group relative bg-gradient-to-br from-primary-200/5 via-transparent to-primary-200/10 backdrop-blur-xl border border-primary-200/20 rounded-3xl p-8 text-center transition-all duration-700 hover:-translate-y-6 hover:shadow-2xl hover:shadow-primary-200/30 hover:border-primary-200/40">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-200/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-200/30 to-primary-200/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Image
                    src="/rocket.png"
                    width={40}
                    height={40}
                    alt="Proses Instan"
                    className="brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-primary-200 transition-colors duration-300">
                  Proses Instan
                </h3>
                <p className="text-white/70  font-medium">
                  RBX langsung masuk ke akun dalam{" "}
                  <span className="text-primary-200 font-semibold">
                    hitungan detik
                  </span>{" "}
                  setelah pembayaran dikonfirmasi
                </p>
              </div>
            </div>

            {/* Pelayanan Terbaik */}
            <div className="group relative bg-gradient-to-br from-primary-300/5 via-transparent to-primary-300/10 backdrop-blur-xl border border-primary-300/20 rounded-3xl p-8 text-center transition-all duration-700 hover:-translate-y-6 hover:shadow-2xl hover:shadow-primary-300/30 hover:border-primary-300/40">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-300/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-300/30 to-primary-300/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Image
                    src="/jempol.png"
                    width={40}
                    height={40}
                    alt="Pelayanan Terbaik"
                    className="brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-primary-300 transition-colors duration-300">
                  Pelayanan Terbaik
                </h3>
                <p className="text-white/70  font-medium">
                  Tim customer service profesional siap membantu{" "}
                  <span className="text-primary-300 font-semibold">24/7</span>{" "}
                  untuk menyelesaikan setiap kendala
                </p>
              </div>
            </div>

            {/* Aman & Terpercaya */}
            <div className="group relative bg-gradient-to-br from-green-400/5 via-transparent to-green-400/10 backdrop-blur-xl border border-green-400/20 rounded-3xl p-8 text-center transition-all duration-700 hover:-translate-y-6 hover:shadow-2xl hover:shadow-green-400/30 hover:border-green-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400/30 to-green-400/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Image
                    src="/gembok.png"
                    width={40}
                    height={40}
                    alt="Aman & Terpercaya"
                    className="brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-green-400 transition-colors duration-300">
                  Aman & Terpercaya
                </h3>
                <p className="text-white/70  font-medium">
                  Sistem keamanan berlapis dengan{" "}
                  <span className="text-green-400 font-semibold">
                    enkripsi tingkat bank
                  </span>{" "}
                  untuk melindungi data dan transaksi
                </p>
              </div>
            </div>

            {/* Pembayaran Lengkap */}
            <div className="group relative bg-gradient-to-br from-blue-400/5 via-transparent to-blue-400/10 backdrop-blur-xl border border-blue-400/20 rounded-3xl p-8 text-center transition-all duration-700 hover:-translate-y-6 hover:shadow-2xl hover:shadow-blue-400/30 hover:border-blue-400/40">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400/30 to-blue-400/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <Image
                    src="/card.png"
                    width={40}
                    height={40}
                    alt="Pembayaran Lengkap"
                    className="brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity duration-300"
                  />
                </div>
                <h3 className="text-2xl font-black text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">
                  Pembayaran Lengkap
                </h3>
                <p className="text-white/70  font-medium">
                  Metode pembayaran lengkap dari{" "}
                  <span className="text-blue-400 font-semibold">
                    e-wallet, bank transfer, QRIS
                  </span>
                  , hingga virtual account
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Neon Theme */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 via-transparent to-neon-pink/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="neon-card rounded-3xl p-8 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <div className="text-center lg:text-left order-2 lg:order-1">
                <div className="inline-flex items-center px-4 py-2 neon-card-secondary border border-neon-pink/30 text-neon-pink rounded-full text-sm font-medium mb-6">
                  Siap Mulai Gaming?
                </div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                  <span className="text-neon-purple">Mulai</span> Petualangan{" "}
                  <span className="text-neon-pink">RBX</span> Sekarang
                </h2>

                <p className="text-lg text-white/70 mb-8 ">
                  Bergabung dengan ribuan player yang sudah mempercayai RBXNET.
                  Dapatkan RBX dengan proses termudah, tercepat, dan teraman.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <button
                    onClick={handleScrollToPembelian}
                    className="btn-neon-primary px-8 py-4 rounded-2xl font-semibold text-lg hover:-translate-y-2 transition-all duration-300"
                  >
                    Beli RBX Sekarang
                  </button>
                  <Link
                    href="/gamepass"
                    className="btn-neon-secondary px-8 py-4 rounded-2xl font-semibold text-lg hover:-translate-y-2 transition-all duration-300 text-center"
                  >
                    Lihat Gamepass
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center lg:justify-start gap-8 mt-8 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse"></div>
                    Proses Instan
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neon-purple rounded-full animate-pulse"></div>
                    Aman & Terpercaya
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-neon-pink rounded-full animate-pulse"></div>
                    Support 24/7
                  </div>
                </div>
              </div>

              {/* Character Image */}
              <div className="order-1 lg:order-2">
                <div className="relative">
                  <Image
                    src="/char3.png"
                    alt="RBXNET Character"
                    width={500}
                    height={400}
                    className="mx-auto max-w-full h-auto"
                  />

                  {/* Floating badge - Neon Style */}
                  {/* <div className="absolute hidden md:block top-8 -left-4 neon-card border-2 border-neon-pink rounded-xl p-3 text-sm font-medium text-neon-pink transform rotate-12 shadow-neon-pink">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-6 h-6" />
                      <div>
                        <div className="font-bold">Super Fast!</div>
                        <div className="text-xs text-white/50">
                          Delivery in seconds
                        </div>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Section - Neon Theme */}
      <section className="py-20 bg-gradient-dark-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 neon-card-secondary border border-neon-pink/30 text-neon-pink rounded-full text-sm font-medium mb-6">
                Butuh Bantuan?
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                <span className="text-neon-purple">Tim</span> Support Siap{" "}
                <span className="text-neon-pink">Membantu</span>
              </h2>

              <p className="text-lg text-white/70 mb-8 ">
                Mengalami kendala saat melakukan pembelian? Tim customer service
                profesional kami siap membantu Anda 24/7 melalui berbagai
                platform komunikasi.
              </p>

              {/* Contact Methods - Neon Theme */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                <div className="neon-card rounded-2xl p-4 text-center group hover:shadow-neon-pink transition-all duration-300">
                  <div className="w-12 h-12 neon-card-secondary rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-neon-pink transition-all duration-300">
                    <Image
                      src="/wa.png"
                      alt="WhatsApp"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="text-sm font-medium text-white">WhatsApp</div>
                  <div className="text-xs text-white/50">Chat Langsung</div>
                </div>

                <div className="neon-card-secondary rounded-2xl p-4 text-center group hover:shadow-neon-purple transition-all duration-300">
                  <div className="w-12 h-12 neon-card rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-neon-purple transition-all duration-300">
                    <Image
                      src="/discord.png"
                      alt="Discord"
                      width={24}
                      height={24}
                    />
                  </div>
                  <div className="text-sm font-medium text-white">Discord</div>
                  <div className="text-xs text-white/50">Server Community</div>
                </div>

                <div className="neon-card rounded-2xl p-4 text-center group hover:shadow-neon-pink transition-all duration-300">
                  <div className="w-12 h-12 neon-card-secondary rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-neon-pink transition-all duration-300">
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
                  <div className="text-xs text-white/50">DM Support</div>
                </div>

                <div className="neon-card-secondary rounded-2xl p-4 text-center group hover:shadow-neon-purple transition-all duration-300">
                  <div className="w-12 h-12 neon-card rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:shadow-neon-purple transition-all duration-300">
                    <BookOpen className="text-neon-purple w-6 h-6" />
                  </div>
                  <div className="text-sm font-medium text-white">Panduan</div>
                  <div className="text-xs text-white/50">Step by Step</div>
                </div>
              </div>

              {/* Quick Contact Button - Neon Style */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="btn-neon-primary px-8 py-4 rounded-2xl font-semibold text-lg hover:-translate-y-1 transition-all duration-300">
                  Hubungi Support
                </button>
              </div>
            </div>

            {/* Character Illustration - Neon Style */}
            <div className="relative">
              <div className="neon-card rounded-3xl p-8 relative overflow-hidden">
                <Image
                  src="/char4.png"
                  alt="Support Character"
                  width={400}
                  height={400}
                  className="mx-auto max-w-full h-auto"
                />

                {/* Floating elements - Neon Style */}
                <div className="absolute top-4 right-4 neon-card-secondary border border-neon-pink/30 rounded-xl p-2 text-xs font-medium text-neon-pink">
                  <div className="flex items-center gap-1">Online 24/7</div>
                </div>

                <div className="absolute bottom-4 left-4 neon-card border border-neon-purple/30 rounded-xl p-2 text-xs font-medium text-neon-purple shadow-neon-purple">
                  <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    Fast Response
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Marquee Section - Neon Theme */}
      <section className="py-12 relative bg-gradient-dark-secondary/30">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-4 py-2 neon-card-secondary border border-neon-pink/30 rounded-full text-sm text-neon-pink font-medium mb-6">
              Testimoni Pelanggan
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Apa Kata <span className="text-neon-pink">Mereka?</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
              Ribuan gamer sudah merasakan pengalaman berbelanja terbaik bersama
              kami
            </p>
          </div>

          {/* Reviews Marquee */}
          <div className="mb-8 py-4">
            {loadingReviews ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-neon-pink/30 border-t-neon-pink"></div>
              </div>
            ) : liveReviews.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-white/60">Belum ada review tersedia</p>
              </div>
            ) : (
              <Marquee
                speed={35}
                pauseOnHover={true}
                gradient={false}
                className="py-10"
              >
                {liveReviews.map((review) => {
                  // Determine card style based on colorScheme
                  const getCardStyle = () => {
                    switch (review.colorScheme) {
                      case "pink":
                        return {
                          cardClass: "neon-card",
                          hoverBorder: "hover:border-neon-pink/40",
                          hoverShadow: "hover:shadow-neon-pink",
                          bgGradient: "bg-gradient-neon-primary",
                          starColor: "text-neon-pink",
                          checkColor: "text-neon-pink",
                        };
                      case "purple":
                        return {
                          cardClass: "neon-card-secondary",
                          hoverBorder: "hover:border-neon-purple/40",
                          hoverShadow: "hover:shadow-neon-purple",
                          bgGradient: "bg-gradient-neon-secondary",
                          starColor: "text-neon-purple",
                          checkColor: "text-neon-purple",
                        };
                      case "amber":
                        return {
                          cardClass: "neon-card",
                          hoverBorder: "hover:border-amber-400/40",
                          hoverShadow: "hover:shadow-amber-400/20",
                          bgGradient:
                            "bg-gradient-to-br from-amber-400 to-yellow-500",
                          starColor: "text-amber-300",
                          checkColor: "text-amber-400",
                        };
                      case "teal":
                        return {
                          cardClass: "neon-card",
                          hoverBorder: "hover:border-teal-400/40",
                          hoverShadow: "hover:shadow-teal-400/20",
                          bgGradient:
                            "bg-gradient-to-br from-teal-400 to-cyan-500",
                          starColor: "text-teal-300",
                          checkColor: "text-teal-400",
                        };
                      case "indigo":
                        return {
                          cardClass: "neon-card",
                          hoverBorder: "hover:border-indigo-400/40",
                          hoverShadow: "hover:shadow-indigo-400/20",
                          bgGradient:
                            "bg-gradient-to-br from-indigo-400 to-purple-500",
                          starColor: "text-indigo-300",
                          checkColor: "text-indigo-400",
                        };
                      default:
                        return {
                          cardClass: "neon-card",
                          hoverBorder: "hover:border-neon-pink/40",
                          hoverShadow: "hover:shadow-neon-pink",
                          bgGradient: "bg-gradient-neon-primary",
                          starColor: "text-neon-pink",
                          checkColor: "text-neon-pink",
                        };
                    }
                  };

                  const style = getCardStyle();

                  return (
                    <div
                      key={review.id}
                      className={`${style.cardClass} rounded-xl p-4 mx-3 min-w-[280px] ${style.hoverBorder} hover:-translate-y-2 transition-all duration-500 ${style.hoverShadow}`}
                    >
                      <div className="flex items-center mb-3">
                        <div
                          className={`w-10 h-10 ${style.bgGradient} rounded-full flex items-center justify-center font-bold text-white text-sm`}
                        >
                          {review.initial}
                        </div>
                        <div className="ml-3">
                          <div className="font-semibold text-white text-sm">
                            {review.username}
                          </div>
                          <div className={`flex gap-0.5 ${style.starColor}`}>
                            {[...Array(review.rating)].map((_, index) => (
                              <Star
                                key={index}
                                className="w-3 h-3 fill-current"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-white/70 italic mb-3 text-sm line-clamp-3">
                        "{review.comment}"
                      </p>
                      <div className={`text-xs ${style.checkColor}`}>
                        <CheckCircle
                          className={`inline w-3 h-3 ${style.checkColor} mr-1`}
                        />{" "}
                        {review.serviceInfo.includes("Robux")
                          ? review.serviceInfo.replace("Robux", "RBX")
                          : review.serviceInfo}{" "}
                        • {review.timeAgo}
                      </div>
                    </div>
                  );
                })}
              </Marquee>
            )}
          </div>

          {/* Trust Indicators - Neon Style */}
        </div>
      </section>

      {/* Interactive FAQ Section - Neon Theme */}
      <section
        id="faq"
        className="py-12 bg-gradient-to-b from-transparent to-bg-secondary/10"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center px-4 py-2 neon-card-secondary border border-neon-pink/30 rounded-full text-sm text-neon-pink font-medium mb-6">
              Frequently Asked Questions
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
              Pertanyaan <span className="text-gradient-neon-pink">Umum</span>
            </h2>
            <p className="text-xl text-white/70">
              Dapatkan jawaban cepat untuk pertanyaan yang sering ditanyakan
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {/* FAQ 1 - Neon Style */}
            <details className="group neon-card rounded-xl overflow-hidden hover:border-neon-pink/30 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer group-open:bg-neon-pink/10 transition-all">
                <h3 className="text-lg font-semibold text-white ">
                  Berapa lama waktu pengiriman RBX?
                </h3>
                <div className="w-6 h-6 text-neon-pink group-open:rotate-180 transition-transform">
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
                <p className="text-white/70 ">
                  RBX akan dikirim maksimal dalam 5 hari kerja setelah
                  pembayaran dikonfirmasi. Pengiriman dilakukan melalui gamepass
                  resmi RBX untuk memastikan keamanan akun Anda.
                </p>
              </div>
            </details>

            {/* FAQ 2 - Updated Purple Neon Style */}
            <details className="group neon-card-secondary rounded-xl overflow-hidden hover:border-primary-300/30 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer group-open:bg-primary-300/10 transition-all">
                <h3 className="text-lg font-semibold text-white ">
                  Apakah pembayaran aman dan terpercaya?
                </h3>
                <div className="w-6 h-6 text-primary-300 group-open:rotate-180 transition-transform">
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
                <p className="text-white/70 ">
                  Ya, sangat aman! Kami menggunakan gateway pembayaran
                  terpercaya seperti Midtrans dengan enkripsi SSL. Semua
                  transaksi dilindungi dan data pembayaran Anda tidak akan
                  disimpan di server kami.
                </p>
              </div>
            </details>

            {/* FAQ 3 - Updated Purple Neon Theme */}
            <details className="group neon-card rounded-xl overflow-hidden hover:border-primary-200/30 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer group-open:bg-primary-200/10 transition-all">
                <h3 className="text-lg font-semibold text-white ">
                  Bagaimana cara melacak status pesanan?
                </h3>
                <div className="w-6 h-6 text-primary-200 group-open:rotate-180 transition-transform">
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
                <p className="text-white/70 ">
                  Anda bisa melacak pesanan melalui halaman "Lacak Pesanan"
                  dengan memasukkan Order ID yang dikirim via email. Atau
                  hubungi customer service kami di WhatsApp untuk update
                  real-time.
                </p>
              </div>
            </details>

            {/* FAQ 4 - Updated Purple Neon Theme */}
            <details className="group neon-card-secondary rounded-xl overflow-hidden hover:border-primary-300/30 transition-all duration-300">
              <summary className="flex items-center justify-between p-6 cursor-pointer group-open:bg-primary-300/10 transition-all">
                <h3 className="text-lg font-semibold text-white ">
                  Apakah ada minimum pembelian RBX?
                </h3>
                <div className="w-6 h-6 text-primary-300 group-open:rotate-180 transition-transform">
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
                <p className="text-white/70 ">
                  Minimum pembelian adalah 100 RBX. Tidak ada batas maksimum,
                  jadi Anda bisa membeli sesuai kebutuhan. Semakin banyak yang
                  dibeli, semakin hemat harga per RBX-nya!
                </p>
              </div>
            </details>
          </div>

          {/* CTA - Updated Purple Neon Theme */}
          <div id="contact" className="text-center mt-12">
            <div className="relative bg-gradient-to-r from-primary-600/20 via-primary-500/10 to-primary-700/20 backdrop-blur-xl border border-primary-200/30 rounded-3xl p-8 overflow-hidden group hover:border-primary-100/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary-100/20">
              {/* Background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/5 via-transparent to-primary-200/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 rounded-2xl text-sm text-primary-100 font-semibold mb-6 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center ">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  Butuh Bantuan?
                </div>

                <h3 className="text-3xl sm:text-4xl font-black text-white mb-4 group-hover:text-primary-50 transition-colors duration-300">
                  Masih ada <span className="text-primary-100">pertanyaan</span>
                  ?
                </h3>
                <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto font-light">
                  Tim customer service profesional kami siap membantu Anda{" "}
                  <span className="text-primary-100 font-semibold">24/7</span>{" "}
                  melalui berbagai platform komunikasi
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="https://wa.me/6285753305598"
                    target="_blank"
                    className="group relative inline-flex justify-center items-center gap-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-green-400/30"
                  >
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516z" />
                      </svg>
                    </div>
                    Chat WhatsApp
                  </a>
                  <Link
                    href="/track-order"
                    className="group relative inline-flex justify-center items-center gap-3 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-50 hover:to-primary-100 text-white px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary-100/30 border border-primary-100/30 hover:border-primary-50"
                  >
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    Lacak Pesanan
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-8 mt-8 text-sm text-white/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-100 rounded-full animate-pulse"></div>
                    Response Cepat
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-200 rounded-full animate-pulse"></div>
                    Support 24/7
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-100 rounded-full animate-pulse"></div>
                    Solusi Terpercaya
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Product Showcase */}
    </PublicLayout>
  );
}
