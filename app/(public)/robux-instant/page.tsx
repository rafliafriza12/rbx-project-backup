"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReviewSection from "@/components/ReviewSection";
import AddToCartButton from "@/components/AddToCartButton";
import {
  DollarSign,
  CheckCircle2,
  User,
  Lock,
  Info,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  FileText,
  Gem,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface Product {
  _id: string;
  name: string;
  description: string;
  type: "gamepass" | "instant";
  robuxAmount: number;
  price: number;
  discountPercentage?: number;
  isActive: boolean;
  category: "robux_5_hari" | "robux_instant";
  createdAt: string;
  updatedAt: string;
}

const RobuxInstan: React.FC = () => {
  const [isShowReview, setIsShowReview] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [robux, setRobux] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);

  // User search states
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const router = useRouter();

  // Function to search for user info
  const searchUserInfo = async (username: string) => {
    if (!username || username.trim().length < 2) {
      setUserInfo(null);
      setUserSearchError(null);
      return;
    }

    setIsSearchingUser(true);
    setUserSearchError(null);

    try {
      const response = await fetch(
        `/api/user-info?username=${encodeURIComponent(username.trim())}`
      );
      const data = await response.json();

      if (data.success) {
        setUserInfo(data);
        setUserSearchError(null);
      } else {
        setUserInfo(null);
        setUserSearchError(data.message || "User tidak ditemukan");
      }
    } catch (error) {
      console.error("Error searching user:", error);
      setUserInfo(null);
      setUserSearchError("Terjadi kesalahan saat mencari user");
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?category=robux_instant");
        if (response.ok) {
          const data = await response.json();
          // Sort products by robuxAmount ascending
          const sortedProducts = (data.products || []).sort(
            (a: Product, b: Product) => a.robuxAmount - b.robuxAmount
          );
          setProducts(sortedProducts);

          // Set default values from first product
          if (sortedProducts && sortedProducts.length > 0) {
            setRobux(sortedProducts[0].robuxAmount);
            setSelectedProduct(sortedProducts[0]);
          }
        } else {
          console.error("Failed to fetch products");
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Debounced search effect for username
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Reset user info when input is cleared
    if (!username || username.trim().length < 2) {
      setUserInfo(null);
      setUserSearchError(null);
      setIsSearchingUser(false);
      return;
    }

    // Set new timeout for 1 second delay
    const newTimeout = setTimeout(() => {
      searchUserInfo(username);
    }, 1000);

    setSearchTimeout(newTimeout);

    // Cleanup function
    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout);
      }
    };
  }, [username]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Get final price with discount
  const getFinalPrice = (product: Product) => {
    if (product.discountPercentage) {
      return product.price * (1 - product.discountPercentage / 100);
    }
    return product.price;
  };

  // Check if all required fields are filled
  const isFormValid =
    selectedProduct !== null &&
    username.trim() !== "" &&
    password.trim() !== "" &&
    userInfo !== null; // Backup code is optional

  const handlePurchase = () => {
    if (!isFormValid || !selectedProduct) return;

    const price = getFinalPrice(selectedProduct);

    // Create checkout items array (consistent format)
    const checkoutItems = [
      {
        serviceType: "robux",
        serviceId: selectedProduct._id,
        serviceName: selectedProduct.name,
        serviceImage: "/robux-icon.png", // Default Robux icon
        serviceCategory: "robux_instant", // Move to root level
        quantity: 1,
        unitPrice: price,
        robloxUsername: username,
        robloxPassword: password,
        robuxInstantDetails: {
          robuxAmount: selectedProduct.robuxAmount,
          productName: selectedProduct.name,
          description: selectedProduct.description,
          additionalInfo: additionalInfo,
          notes: additionalInfo,
        },
      },
    ];

    // Store in sessionStorage for checkout page
    sessionStorage.setItem("checkoutData", JSON.stringify(checkoutItems));

    // Debug log
    console.log("Robux Instant checkout data:", checkoutItems);

    router.push("/checkout");
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setRobux(product.robuxAmount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-100 shadow-lg shadow-primary-100/50"></div>
          <p className="mt-4 text-lg font-medium text-white drop-shadow-lg">
            Memuat data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="px-4 sm:px-6 md:px-8">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-2">
        <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] relative rounded-lg overflow-hidden group">
          <Image
            src="/rbx_instant.png"
            alt="banner"
            fill
            className="object-cover transform transition-transform duration-700 group-hover:scale-110"
          />
          {/* Glow overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100/10 via-transparent to-primary-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>

      {/* Hero Section with enhanced styling */}
      {/* Enhanced Hero Section */}

      {/* Main Content Grid - Layout Asli */}
      <section className="max-w-6xl mx-auto mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cara Pesan Section - Di kiri */}
        <section className="relative min-h-[200px] sm:min-h-[250px] w-full">
          <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-3xl p-4 sm:p-6  shadow-lg transition-all duration-300 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-100/5 via-transparent to-primary-200/5 rounded-3xl"></div>

            {/* Multiple floating decorative elements */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-100/10 to-primary-200/5 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-primary-200/10 to-primary-100/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary-100/5 to-primary-200/5 rounded-full blur-2xl animate-pulse delay-500"></div>

            {/* Floating particles */}
            <div className="absolute top-8 right-16 w-2 h-2 bg-primary-100/60 rounded-full animate-bounce delay-300"></div>
            <div className="absolute top-20 right-32 w-1 h-1 bg-primary-200/80 rounded-full animate-bounce delay-700"></div>
            <div className="absolute bottom-12 left-20 w-1.5 h-1.5 bg-primary-100/70 rounded-full animate-bounce delay-1000"></div>
            <div className="absolute bottom-8 left-40 w-1 h-1 bg-primary-200/60 rounded-full animate-bounce delay-500"></div>

            <div className="relative z-10 flex flex-col gap-4 sm:gap-6 items-center">
              <div className="flex-shrink-0 group/icon">
                <div className="relative w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]">
                  {/* Glow effects */}
                  <div className="absolute -inset-4 bg-gradient-to-r from-primary-100/20 via-primary-200/15 to-primary-100/20 rounded-3xl blur-2xl opacity-40 group-hover/icon:opacity-80 transition-all duration-700"></div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary-100/30 via-primary-200/20 to-primary-100/30 rounded-2xl blur-xl opacity-50 group-hover/icon:opacity-70 transition-opacity duration-500"></div>

                  {/* Main icon container */}
                  <div className="relative w-full h-full bg-gradient-to-br from-primary-100/25 via-primary-200/15 to-primary-100/20 rounded-xl flex items-center justify-center transform transition-all duration-500 group-hover/icon:scale-110 group-hover/icon:rotate-3 border border-primary-100/30 shadow-inner">
                    {/* Icon with Lucide React */}
                    <div className="relative z-10 group-hover/icon:animate-bounce">
                      <DollarSign className="w-16 h-16 sm:w-20 sm:h-20 text-primary-100 drop-shadow-2xl" />
                    </div>

                    {/* Sparkle effects */}
                    <div className="absolute top-3 right-3 w-2 h-2 bg-primary-100 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute bottom-4 left-4 w-1 h-1 bg-primary-200 rounded-full animate-ping delay-500 opacity-60"></div>
                  </div>
                </div>
              </div>{" "}
              {/* Content */}
              <div className="flex-1 text-center ">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[0.9] tracking-tight">
                  Robux <span className="text-primary-100">Instant</span>
                  {/* Animated underline */}
                </h1>
                <p className="text-lg sm:text-base text-white/80 max-w-3xl mb-8 font-light">
                  Dapatkan{" "}
                  <span className="text-primary-100 font-medium">Robux</span>{" "}
                  langsung ke akun Anda dalam{" "}
                  <span className="text-primary-200 font-medium">
                    hitungan menit
                  </span>
                  !
                  <br className="hidden sm:block" />
                  Proses{" "}
                  <span className="text-primary-200 font-medium">cepat</span>,
                  <span className="text-white font-medium ml-1">aman</span>, dan
                  <span className="text-primary-100 font-medium ml-1">
                    terpercaya
                  </span>
                  .
                </p>

                {/* Enhanced Features with Lucide icons */}
                <div className=" gap-2 sm:gap-3 justify-center grid grid-cols-2">
                  <span className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500/25 via-emerald-500/20 to-green-500/25 border border-green-400/50 rounded-full text-xs sm:text-sm text-white/90 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <Zap className="w-3 h-3 text-green-400 group-hover:animate-bounce" />
                    <span className="font-medium">Proses Instan</span>
                  </span>

                  <span className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500/25 via-cyan-500/20 to-blue-500/25 border border-blue-400/50 rounded-full text-xs sm:text-sm text-white/90 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-sm">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                    <Shield className="w-3 h-3 text-blue-400 group-hover:animate-bounce" />
                    <span className="font-medium">100% Aman</span>
                  </span>

                  <span className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-100/25 via-primary-200/20 to-primary-100/25 border border-primary-100/50 rounded-full text-xs sm:text-sm text-white/90 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-sm">
                    <div className="w-2 h-2 bg-primary-100 rounded-full animate-pulse delay-700"></div>
                    <CheckCircle2 className="w-3 h-3 text-primary-100 group-hover:animate-bounce" />
                    <span className="font-medium">Terpercaya</span>
                  </span>

                  <span className="group relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500/25 via-violet-500/20 to-purple-500/25 border border-purple-400/50 rounded-full text-xs sm:text-sm text-white/90 backdrop-blur-sm hover:scale-105 transition-all duration-300 shadow-sm">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-1000"></div>
                    <Sparkles className="w-3 h-3 text-purple-400 group-hover:animate-bounce" />
                    <span className="font-medium">24/7 Support</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsShowReview(!isShowReview)}
                  className="w-full py-1.5 sm:py-2 md:py-3 px-1.5 sm:px-2 md:px-4 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 hover:scale-[1.01] shadow hover:shadow-lg md:hover:shadow-primary-100/30 flex items-center justify-center gap-1 text-xs sm:text-xs md:text-base mt-4"
                >
                  {isShowReview ? "Sembunyikan" : "Lihat"} Review
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Form and Product Section - Di kanan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="w-full group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl px-4 sm:px-6 py-4  h-auto lg:h-auto flex flex-col justify-start  lg:mx-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/5 via-transparent to-primary-200/5 rounded-xl"></div>

            <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-primary-100/15 to-primary-200/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-gradient-to-tr from-primary-200/12 to-primary-100/8 rounded-full blur-lg animate-pulse delay-500"></div>
            <div className="absolute top-1/2 right-0 w-12 h-12 bg-gradient-to-br from-primary-100/8 to-primary-200/6 rounded-full blur-md animate-pulse delay-1000"></div>

            <div className="absolute top-4 right-6 w-1 h-1 bg-primary-100/80 rounded-full animate-bounce delay-200"></div>
            <div className="absolute top-12 right-3 w-0.5 h-0.5 bg-primary-200/70 rounded-full animate-bounce delay-800"></div>
            <div className="absolute bottom-8 left-3 w-1 h-1 bg-primary-100/60 rounded-full animate-bounce delay-1200"></div>

            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-100/20 via-transparent to-primary-200/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 border border-primary-100/40"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-all duration-500 shadow-lg">
                    <FileText className="w-5 h-5 text-primary-100" />
                  </div>
                  {/* Decorative glow */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-xl blur opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div>
                  <h2 className="text-white font-black text-lg sm:text-xl leading-tight">
                    <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                      Cara Pesan
                    </span>
                  </h2>
                  <p className="text-white/60 text-xs mt-0.5">
                    Ikuti langkah mudah ini
                  </p>
                </div>
              </div>

              {/* Steps dalam 2 kolom dengan ukuran konsisten */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center lg:text-left">
                {/* Kolom Kiri */}
                {/* Step 1 */}
                <div className="group/step relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-primary-100/15 hover:to-primary-200/10 transition-all duration-300 border border-white/20 hover:border-primary-100/40 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-lg flex items-center justify-center group-hover/step:scale-105 transition-all duration-300">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-100 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-0.5 group-hover/step:text-primary-100 transition-colors duration-300">
                        Username RBX
                      </h3>
                      <p className="text-white/70 text-xs leading-relaxed">
                        Masukkan username akun RBX Anda
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="group/step relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-primary-100/15 hover:to-primary-200/10 transition-all duration-300 border border-white/20 hover:border-primary-100/40 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-lg flex items-center justify-center group-hover/step:scale-105 transition-all duration-300">
                        <Lock className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-100 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-0.5 group-hover/step:text-primary-100 transition-colors duration-300">
                        Password Akun
                      </h3>
                      <p className="text-white/70 text-xs leading-relaxed">
                        Password akun untuk verifikasi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 3 - Mobile only */}
                <div className="sm:hidden group/step relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-primary-100/15 hover:to-primary-200/10 transition-all duration-300 border border-white/20 hover:border-primary-100/40 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-lg flex items-center justify-center group-hover/step:scale-105 transition-all duration-300">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-100 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-0.5 group-hover/step:text-primary-100 transition-colors duration-300">
                        Kode Keamanan
                      </h3>
                      <p className="text-white/70 text-xs leading-relaxed">
                        Backup code jika ada 2FA (opsional)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan */}
                {/* Step 3 - Desktop only */}
                <div className="hidden sm:block group/step relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-primary-100/15 hover:to-primary-200/10 transition-all duration-300 border border-white/20 hover:border-primary-100/40 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-lg flex items-center justify-center group-hover/step:scale-105 transition-all duration-300">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-100 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-0.5 group-hover/step:text-primary-100 transition-colors duration-300">
                        Kode Keamanan
                      </h3>
                      <p className="text-white/70 text-xs leading-relaxed">
                        Backup code jika ada 2FA (opsional)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="group/step relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-primary-100/15 hover:to-primary-200/10 transition-all duration-300 border border-white/20 hover:border-primary-100/40 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-lg flex items-center justify-center group-hover/step:scale-105 transition-all duration-300">
                        <Gem className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-100 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-0.5 group-hover/step:text-primary-100 transition-colors duration-300">
                        Pilih Jumlah Robux
                      </h3>
                      <p className="text-white/70 text-xs leading-relaxed">
                        Tentukan paket Robux yang diinginkan
                      </p>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="group/step relative p-3 rounded-xl bg-gradient-to-r from-white/10 to-white/5 hover:from-primary-100/15 hover:to-primary-200/10 transition-all duration-300 border border-white/20 hover:border-primary-100/40 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-lg flex items-center justify-center group-hover/step:scale-105 transition-all duration-300">
                        <ShoppingCart className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary-100 text-white rounded-full flex items-center justify-center text-xs font-bold">
                        5
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-sm mb-0.5 group-hover/step:text-primary-100 transition-colors duration-300">
                        Beli Sekarang
                      </h3>
                      <p className="text-white/70 text-xs leading-relaxed">
                        Klik tombol untuk melanjutkan pembayaran
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer info yang simple dan konsisten */}
              <div className="mt-6 p-4 bg-gradient-to-r from-green-500/15 to-emerald-500/15 border border-green-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-400/20 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-green-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-green-200 font-semibold text-sm mb-1">
                      Proses Otomatis & Aman
                    </h4>
                    <p className="text-green-100/80 text-xs leading-relaxed">
                      Transaksi diproses dalam hitungan menit dengan sistem yang
                      terpercaya
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Form Input */}
          <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-3 sm:p-4 space-y-4 w-full mx-auto lg:mx-0 shadow-lg transition-all duration-300 overflow-hidden">
            {/* Enhanced Background Decorative Elements */}
            {/* <div className="absolute inset-0 bg-gradient-to-br from-primary-100/5 via-transparent to-primary-200/5 rounded-xl"></div> */}

            {/* Multiple floating background elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-100/12 to-primary-200/8 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-primary-200/10 to-primary-100/6 rounded-full blur-xl animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gradient-to-br from-primary-100/6 to-primary-200/4 rounded-full blur-lg animate-pulse delay-1000"></div>

            {/* Floating particles */}
            <div className="absolute top-6 right-8 w-1 h-1 bg-primary-100/70 rounded-full animate-bounce delay-300"></div>
            <div className="absolute top-16 right-20 w-0.5 h-0.5 bg-primary-200/60 rounded-full animate-bounce delay-900"></div>
            <div className="absolute bottom-10 left-12 w-1 h-1 bg-primary-100/60 rounded-full animate-bounce delay-1300"></div>

            {/* Border enhancement */}
            {/* <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-100/10 via-transparent to-primary-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div> */}

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="group/field">
                <label className="flex items-center gap-2 text-sm font-bold mb-2 text-white">
                  <div className="w-4 h-4 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded flex items-center justify-center">
                    <User className="w-3 h-3 text-primary-100" />
                  </div>
                  Username
                  <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div
                    className={`flex items-center border rounded-lg overflow-hidden bg-gradient-to-r from-primary-900/50 to-primary-800/50 backdrop-blur-sm w-full max-w-[520px] mx-auto lg:mx-0 group/input transition-all duration-300 hover:shadow-lg ${
                      userInfo
                        ? "border-emerald-500/60 bg-emerald-500/10 hover:border-emerald-500/80"
                        : username && userSearchError
                        ? "border-red-500/60 bg-red-500/10 hover:border-red-500/80"
                        : "border-primary-100/30 hover:border-primary-100/60 focus-within:border-primary-100/80 hover:shadow-primary-100/20"
                    }`}
                  >
                    <div
                      className={`px-3 py-2 border-r flex items-center justify-center group-hover/input:scale-110 transition-transform duration-300 ${
                        userInfo
                          ? "border-emerald-500/30 bg-gradient-to-r from-emerald-500/25 to-emerald-600/15"
                          : username && userSearchError
                          ? "border-red-500/30 bg-gradient-to-r from-red-500/25 to-red-600/15"
                          : "border-primary-100/30 bg-gradient-to-r from-primary-100/25 to-primary-200/15"
                      }`}
                    >
                      <User
                        className={`w-5 h-5 group-hover/input:animate-pulse ${
                          userInfo
                            ? "text-emerald-500"
                            : username && userSearchError
                            ? "text-red-500"
                            : "text-primary-100"
                        }`}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Masukkan Username RBX"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="py-2 px-3 outline-none text-sm text-white placeholder-white/50 flex-1 min-w-0 transition-all bg-transparent focus:ring-2 focus:ring-primary-100/50 focus:placeholder-white/70"
                    />
                    <div className="px-3">
                      {isSearchingUser ? (
                        <Loader2 className="w-4 h-4 animate-spin text-primary-100" />
                      ) : userInfo ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : username && userSearchError ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <Search className="w-4 h-4 text-primary-200/60" />
                      )}
                    </div>
                  </div>

                  {/* Status Messages */}
                  {username && username.length >= 2 && (
                    <div className="mt-2 max-w-[520px] mx-auto lg:mx-0">
                      {isSearchingUser && (
                        <div className="flex items-center gap-2 text-xs text-yellow-400 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Mencari username...</span>
                        </div>
                      )}
                      {!isSearchingUser && userInfo && (
                        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                          {/* User Avatar */}
                          {userInfo.avatar ? (
                            <img
                              src={userInfo.avatar}
                              alt={userInfo.username}
                              className="w-10 h-10 rounded-lg bg-slate-600 ring-2 ring-emerald-400/60 object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-400/60 flex-shrink-0">
                              <User className="w-5 h-5 text-emerald-400" />
                            </div>
                          )}

                          {/* User Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-bold truncate">
                              {userInfo.username}
                            </p>
                            <p className="text-xs text-emerald-300">
                              ID: {userInfo.id}
                            </p>
                            {userInfo.displayName &&
                              userInfo.displayName !== userInfo.username && (
                                <p className="text-xs text-emerald-300 truncate">
                                  Display: {userInfo.displayName}
                                </p>
                              )}
                          </div>

                          {/* Check Icon */}
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                        </div>
                      )}
                      {!isSearchingUser && userSearchError && (
                        <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-red-400 font-semibold">
                              User tidak ditemukan
                            </p>
                            <p className="text-xs text-white/70 mt-1">
                              API Robloxxnya Lagi Limit, Coba Sebentar Lagi Ya
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Helper Text */}
                  {(!username || username.length < 2) && (
                    <p className="text-xs text-primary-200/70 mt-2 max-w-[520px] mx-auto lg:mx-0">
                      Ketik minimal 2 karakter untuk mencari username
                    </p>
                  )}
                </div>
              </div>

              <div className="group/field">
                <label className="flex items-center gap-2 text-sm font-bold mb-2 text-white">
                  <div className="w-4 h-4 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded flex items-center justify-center">
                    <Lock className="w-3 h-3 text-primary-100" />
                  </div>
                  Password
                  <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="flex items-center border border-primary-100/30 rounded-lg overflow-hidden bg-gradient-to-r from-primary-900/50 to-primary-800/50 backdrop-blur-sm w-full max-w-[520px] mx-auto lg:mx-0 group/input hover:border-primary-100/60 focus-within:border-primary-100/80 transition-all duration-300 hover:shadow-lg hover:shadow-primary-100/20">
                    <div className="px-3 py-2 border-r border-primary-100/30 bg-gradient-to-r from-primary-100/25 to-primary-200/15 flex items-center justify-center group-hover/input:scale-110 transition-transform duration-300">
                      <Lock className="w-5 h-5 text-primary-100 group-hover/input:animate-pulse" />
                    </div>
                    <input
                      type="password"
                      placeholder="Masukkan Password RBX"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="py-2 px-3 outline-none text-sm text-white placeholder-white/50 flex-1 min-w-0 transition-all bg-transparent focus:ring-2 focus:ring-primary-100/50 focus:placeholder-white/70"
                    />
                    {password && (
                      <div className="px-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                      </div>
                    )}
                  </div>
                  {password && (
                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary-100/60 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 group/field">
                <label className="flex items-center gap-2 text-sm font-bold mb-2 text-white">
                  <div className="w-4 h-4 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded flex items-center justify-center">
                    <Shield className="w-3 h-3 text-primary-100" />
                  </div>
                  Backup Code
                  <span className="text-xs text-white/60 font-normal">
                    (Opsional)
                  </span>
                </label>
                <div className="relative">
                  <textarea
                    placeholder="Masukkan backup code RBX jika akun memiliki 2-step verification"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={3}
                    className="w-full py-3 px-3 outline-none text-sm text-white placeholder-white/50 border border-primary-100/30 rounded-lg bg-gradient-to-br from-primary-900/50 to-primary-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-100/50 focus:border-primary-100/80 transition-all resize-none hover:border-primary-100/60 hover:shadow-lg hover:shadow-primary-100/20 focus:placeholder-white/70"
                  />
                  {additionalInfo && (
                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary-100/60 to-transparent animate-pulse"></div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-3 h-3 bg-gradient-to-br from-blue-400/30 to-cyan-400/20 rounded flex items-center justify-center">
                    <Info className="w-2 h-2 text-blue-400" />
                  </div>
                  <p className="text-xs text-white/70">
                    Cara lihat backup code:{" "}
                    <button
                      onClick={() => setShowVideoModal(true)}
                      className="underline text-primary-100 hover:text-primary-200 transition-colors hover:glow font-medium cursor-pointer"
                    >
                      Klik di sini →
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-4 sm:p-5 shadow-lg transition-all duration-300 overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-100/5 via-transparent to-primary-200/5 rounded-xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-primary-200/10 to-primary-100/5 rounded-full blur-2xl"></div>

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-6 leading-tight text-center lg:text-left">
                Pilih Jumlah <span className="text-primary-100">Robux</span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 justify-center max-w-[740px] mx-auto">
                {products.map((product) => (
                  <div
                    key={product._id}
                    className={`group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedProduct?._id === product._id
                        ? "bg-gradient-to-br from-primary-100/20 via-primary-200/10 to-primary-100/20 border-primary-100/60 backdrop-blur-xl shadow-lg"
                        : "bg-gradient-to-br from-white/10 via-transparent to-white/5 border-white/20 backdrop-blur-xl hover:border-primary-100/40"
                    }`}
                    onClick={() => handleProductSelect(product)}
                  >
                    {/* Selection indicator */}
                    {selectedProduct?._id === product._id && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-primary-100 rounded-full p-1.5 shadow-md">
                          <CheckCircle2 className="w-4 h-4 text-primary-900" />
                        </div>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {product.discountPercentage && (
                      <div className="absolute -top-1 -left-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                        -{product.discountPercentage}%
                      </div>
                    )}

                    <div className="text-center">
                      <div className="flex items-center gap-2 text-white/80 text-xs mb-2 justify-center">
                        <Gem className="w-4 h-4 text-primary-100" />
                        <span className="text-white font-medium">
                          {product.robuxAmount} R$
                        </span>
                      </div>

                      <div className="text-white text-sm font-bold">
                        {formatCurrency(getFinalPrice(product))}
                        {product.discountPercentage && (
                          <div className="text-xs text-red-400 line-through opacity-75 mt-1">
                            {formatCurrency(product.price)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary-100/5 to-primary-200/5 pointer-events-none"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="text-center mt-4">
            <div className="flex flex-col gap-3 w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[750px] mx-auto">
              {/* Add to Cart Button */}
              <AddToCartButton
                serviceType="robux"
                serviceId={selectedProduct?._id || ""}
                serviceName={selectedProduct?.name || "Robux Instant"}
                serviceImage="/robux-icon.png" // Default Robux icon
                serviceCategory="robux_instant"
                type="rbx-instant"
                gameId="robux-instant"
                gameName="Roblox"
                itemName={selectedProduct?.name || "Robux Instant"}
                imgUrl="/robux-icon.png" // Default Robux icon
                unitPrice={selectedProduct ? getFinalPrice(selectedProduct) : 0}
                price={selectedProduct ? getFinalPrice(selectedProduct) : 0}
                description={`${
                  selectedProduct?.robuxAmount || 0
                } Robux Instant untuk akun ${username}`}
                quantity={1}
                robuxAmount={selectedProduct?.robuxAmount || 0}
                estimatedTime="Instant"
                additionalInfo={additionalInfo}
                robuxInstantDetails={
                  additionalInfo ? { notes: additionalInfo } : undefined
                }
                robloxUsername={username}
                robloxPassword={password}
                className={`group/btn font-bold py-3 px-6 rounded-xl w-full flex items-center justify-center gap-2 transition-all duration-300 ease-in-out transform shadow-lg relative overflow-hidden ${
                  isFormValid
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-600 text-white hover:scale-105 active:scale-95 hover:shadow-purple-600/50 cursor-pointer"
                    : "bg-gradient-to-r from-gray-600 to-gray-700 text-white cursor-not-allowed opacity-50"
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                  🛒 Tambah ke Keranjang
                  {isFormValid && selectedProduct && (
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-sm ml-2">
                      Rp {getFinalPrice(selectedProduct).toLocaleString()}
                    </span>
                  )}
                </span>
              </AddToCartButton>

              {/* Purchase Button */}
              <button
                onClick={handlePurchase}
                disabled={!isFormValid}
                className={`group/btn font-bold py-3 px-6 rounded-xl w-full flex items-center justify-center gap-2 transition-all duration-300 ease-in-out transform shadow-lg relative overflow-hidden ${
                  isFormValid
                    ? "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 hover:scale-105 active:scale-95 hover:shadow-primary-100/50 cursor-pointer"
                    : "bg-gradient-to-r from-gray-600 to-gray-700 text-white cursor-not-allowed opacity-50"
                }`}
              >
                {/* Button glow effect */}
                {isFormValid && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-xl blur-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                )}

                <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                  <ShoppingCart className="w-5 h-5" />
                  Beli Sekarang
                  <ArrowRight className="w-4 h-4 transform transition-transform duration-300 group-hover/btn:translate-x-1" />
                  {isFormValid && selectedProduct && (
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-sm ml-2">
                      Rp {getFinalPrice(selectedProduct).toLocaleString()}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Reviews Section */}
          {isShowReview && (
            <div className="w-full">
              <ReviewSection
                serviceType="robux"
                serviceCategory="robux_instant"
                title="Reviews Robux Instant"
              />
            </div>
          )}
        </div>
      </section>

      {/* Video Tutorial Modal */}
      {showVideoModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-opacity duration-300"
          onClick={() => setShowVideoModal(false)}
          style={{ animation: "fadeIn 0.3s ease-out" }}
        >
          <div
            className="relative w-full max-w-2xl bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-700/95 backdrop-blur-xl rounded-3xl border-2 border-primary-100/40 shadow-2xl shadow-primary-100/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "scaleIn 0.3s ease-out" }}
          >
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-100/5 via-transparent to-primary-200/5 pointer-events-none"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-tr from-primary-200/20 to-primary-100/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-6 border-b border-primary-100/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-100" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Tutorial Backup Code
                  </h3>
                  <p className="text-sm text-white/60">
                    Cara mendapatkan backup code untuk 2FA
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="group w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 transition-all duration-300 hover:scale-110"
              >
                <span className="text-2xl text-white/80 group-hover:text-red-400 transition-colors">
                  ×
                </span>
              </button>
            </div>

            {/* Video Content */}
            <div className="relative z-10 p-6">
              <div className="rounded-2xl overflow-hidden border-2 border-primary-100/30 shadow-xl">
                <iframe
                  width="100%"
                  height="360"
                  src="https://www.youtube.com/embed/0N-1478Qki0"
                  title="Tutorial Backup Code RBX"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full bg-black aspect-video"
                ></iframe>
              </div>

              {/* Info Box */}
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-blue-200 font-semibold text-sm mb-1">
                      Catatan Penting
                    </h4>
                    <p className="text-blue-100/80 text-xs leading-relaxed">
                      Backup code diperlukan jika akun Roblox Anda menggunakan
                      2-Step Verification (2FA). Jika tidak ada 2FA, Anda bisa
                      langsung checkout tanpa mengisi backup code.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="relative w-full z-10 flex items-center justify-end gap-3 p-6 border-t border-primary-100/20">
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-6 py-2.5 w-full bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary-100/30"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default RobuxInstan;
