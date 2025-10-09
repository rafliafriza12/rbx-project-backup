"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Gem,
  Rocket,
  Users,
  Star,
  RefreshCw,
  Info,
  Coins,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Eye,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Play,
  Gamepad2,
  FileText,
  Sparkles,
} from "lucide-react";
import ReviewSection from "@/components/ReviewSection";
import AddToCartButton from "@/components/AddToCartButton";

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

interface UserPlace {
  placeId: number;
  name: string;
  description: string;
  visits: number;
  universeId: number;
  creator: any;
  thumbnail: string | null;
}

interface RBX5Stats {
  totalStok: number;
  totalOrder: number;
  totalTerjual: number;
  hargaPer100Robux: number;
}

interface StockAccountsInfo {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  totalRobux: number;
  averageRobuxPerAccount: number;
}

export default function Rbx5Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [robux, setRobux] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<Product | null>(null);
  const [username, setUsername] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);

  // Statistics state
  const [stats, setStats] = useState<RBX5Stats>({
    totalStok: 0,
    totalOrder: 0,
    totalTerjual: 0,
    hargaPer100Robux: 13000,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [stockAccountsInfo, setStockAccountsInfo] =
    useState<StockAccountsInfo | null>(null);
  const [showStockInfo, setShowStockInfo] = useState(false);

  // Place selection states
  const [userPlaces, setUserPlaces] = useState<UserPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<UserPlace | null>(null);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [showPlaceModal, setShowPlaceModal] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Gamepass creation modal
  const [showGamepassModal, setShowGamepassModal] = useState(false);
  const [gamepassInstructionShown, setGamepassInstructionShown] =
    useState(false);
  const [isCheckingGamepass, setIsCheckingGamepass] = useState(false);
  const [gamepassCheckResult, setGamepassCheckResult] = useState<any>(null);
  const [currentRobuxPricing, setCurrentRobuxPricing] = useState<any>(null);
  const [lastCheckedRobuxAmount, setLastCheckedRobuxAmount] = useState<
    number | null
  >(null); // Track robux amount that was checked
  const [homepageDataProcessed, setHomepageDataProcessed] = useState(false); // Track if homepage data was processed

  const sliderRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbLeft, setThumbLeft] = useState("0px");
  const [isFromHomepage, setIsFromHomepage] = useState(false);
  const [showEwalletOptions, setShowEwalletOptions] = useState(false);
  const [showQrisOptions, setShowQrisOptions] = useState(false);
  const [showVaOptions, setShowVaOptions] = useState(false);
  const [showMinimarketOptions, setShowMinimarketOptions] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const router = useRouter();

  // Function to fetch user places
  const fetchUserPlaces = async (userId: number) => {
    setIsLoadingPlaces(true);
    setPlacesError(null);

    try {
      const response = await fetch(`/api/get-user-places?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setUserPlaces(data.data || []);
        setPlacesError(null);
      } else {
        setUserPlaces([]);
        setPlacesError(data.message || "Gagal mengambil data place");
      }
    } catch (error) {
      console.error("Error fetching user places:", error);
      setUserPlaces([]);
      setPlacesError("Terjadi kesalahan saat mengambil data place");
    } finally {
      setIsLoadingPlaces(false);
    }
  };

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
        // Auto fetch user places when user is found
        fetchUserPlaces(data.id);
      } else {
        setUserInfo(null);
        setUserSearchError(data.message || "User tidak ditemukan");
        setUserPlaces([]);
        setSelectedPlace(null);
        setGamepassInstructionShown(false);
      }
    } catch (error) {
      console.error("Error searching user:", error);
      setUserInfo(null);
      setUserSearchError("Terjadi kesalahan saat mencari user");
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Debounced search effect
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
      setUserPlaces([]);
      setSelectedPlace(null);
      setPlacesError(null);
      setGamepassInstructionShown(false);
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

  // Check for data from homepage
  useEffect(() => {
    const checkHomepageData = () => {
      try {
        const storedData = sessionStorage.getItem("rbx5InputData");
        console.log("Checking for homepage data:", storedData);

        if (storedData) {
          const data = JSON.parse(storedData);
          console.log("Parsed homepage data:", data);

          if (data.fromHomePage && data.robuxAmount) {
            console.log(
              "Setting robux amount from homepage:",
              data.robuxAmount
            );
            setRobux(data.robuxAmount);
            setIsFromHomepage(true);
            setHomepageDataProcessed(true);

            // Immediately calculate and set thumb position
            const calculateThumbPosition = (robuxValue: number) => {
              const maxRobux = 1000;
              const percent = Math.min(robuxValue / maxRobux, 1);
              // Use a fixed width calculation since we don't have slider ref yet
              const estimatedSliderWidth = 740; // max-w-[740px] from CSS
              const thumbWidth = 50;
              const offset = percent * (estimatedSliderWidth - thumbWidth);

              console.log("Immediate thumb calculation:", {
                robux: robuxValue,
                percent,
                estimatedSliderWidth,
                thumbWidth,
                offset,
                finalPosition: `${offset}px`,
              });

              return `${offset}px`;
            };

            const newThumbLeft = calculateThumbPosition(data.robuxAmount);
            setThumbLeft(newThumbLeft);
            console.log("Set thumbLeft immediately to:", newThumbLeft);

            // Clear the data so it doesn't persist on page refresh
            sessionStorage.removeItem("rbx5InputData");
          } else {
            setHomepageDataProcessed(true);
          }
        } else {
          console.log("No homepage data found in sessionStorage");
          setHomepageDataProcessed(true);
        }
      } catch (error) {
        console.error("Error reading homepage data:", error);
        setHomepageDataProcessed(true);
      }
    };

    checkHomepageData();
  }, []);

  // Fetch products from database
  useEffect(() => {
    // Wait for homepage data to be processed first
    if (!homepageDataProcessed) return;

    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?category=robux_5_hari");
        if (response.ok) {
          const data = await response.json();
          // Sort products by robuxAmount ascending
          const sortedProducts = (data.products || []).sort(
            (a: Product, b: Product) => a.robuxAmount - b.robuxAmount
          );
          setProducts(sortedProducts);

          // Only set to 0 if no robux amount was set from homepage
          if (sortedProducts && sortedProducts.length > 0 && robux === 0) {
            // Don't override robux if it was set from homepage
            // setRobux(0); - Remove this line to avoid resetting homepage value
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

    const fetchRobuxPricing = async () => {
      try {
        const response = await fetch("/api/robux-pricing");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCurrentRobuxPricing(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching robux pricing:", error);
      }
    };

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/rbx5-stats");
        if (response.ok) {
          const data = await response.json();
          console.log("data rbx : ", data);
          if (data.success && data.data) {
            setStats(data.data);
            console.log("RBX5 Stats loaded:", data.data);
          } else {
            console.error("Failed to parse RBX5 stats:", data);
          }
        } else {
          console.error("Failed to fetch RBX5 stats, status:", response.status);
          const errorData = await response.json().catch(() => null);
          console.error("Error details:", errorData);
        }
      } catch (error) {
        console.error("Error fetching RBX5 stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    const fetchStockAccountsInfo = async () => {
      try {
        const response = await fetch("/api/stock-accounts");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.stats) {
            setStockAccountsInfo(data.stats);
            console.log("Stock accounts info loaded:", data.stats);
          }
        } else {
          console.error("Failed to fetch stock accounts info");
        }
      } catch (error) {
        console.error("Error fetching stock accounts info:", error);
      }
    };

    fetchProducts();
    fetchRobuxPricing();
    fetchStats();
    fetchStockAccountsInfo();
  }, [homepageDataProcessed, robux]); // Wait for homepage data and depend on robux value

  // Effect to detect robux amount changes and reset gamepass check status
  useEffect(() => {
    // If gamepass was previously checked and robux amount has changed, reset gamepass status
    if (
      lastCheckedRobuxAmount !== null &&
      robux !== lastCheckedRobuxAmount &&
      robux > 0
    ) {
      setGamepassInstructionShown(false);
      setGamepassCheckResult(null);
      setLastCheckedRobuxAmount(null);

      // Show warning toast
      toast.warning(
        "Jumlah Robux telah diubah. Silakan cek GamePass ulang untuk melanjutkan.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    }
  }, [robux, lastCheckedRobuxAmount]);

  // Auto-select product when slider changes to match robux amount
  useEffect(() => {
    if (robux > 0 && products.length > 0) {
      const matchingProduct = products.find(
        (product) => product.robuxAmount === robux
      );
      if (matchingProduct) {
        setSelectedPackage(matchingProduct);
      } else {
        setSelectedPackage(null);
      }
    } else {
      setSelectedPackage(null);
    }
  }, [robux, products]);

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

  // Calculate price based on robux amount and current pricing
  const calculatePriceFromRobux = (robuxAmount: number) => {
    if (!currentRobuxPricing || robuxAmount <= 0) return 0;

    // Calculate based on price per 100 robux
    return Math.ceil((robuxAmount / 100) * currentRobuxPricing.pricePerHundred);
  };

  // Get current price for display (use dynamic pricing if available)
  const getCurrentPrice = () => {
    if (robux > 0 && currentRobuxPricing) {
      return calculatePriceFromRobux(robux);
    }
    if (selectedPackage) {
      return getFinalPrice(selectedPackage);
    }
    return 0;
  };

  // Calculate gamepass amount (robux + 43% fee)
  const getGamepassAmount = () => {
    if (robux <= 0) return 0;
    return Math.ceil(robux * 1.43); // Add 43% fee
  };

  // Function to check if gamepass exists
  const checkGamepassExists = async () => {
    if (!selectedPlace || robux <= 0) return;

    setIsCheckingGamepass(true);
    setGamepassCheckResult(null);

    try {
      const expectedRobux = getGamepassAmount();
      const response = await fetch(
        `/api/check-gamepass?universeId=${selectedPlace.placeId}&expectedRobux=${expectedRobux}`
      );
      const data = await response.json();
      // console.log(data);
      setGamepassCheckResult(data);

      if (data.success) {
        // GamePass found, mark instruction as shown
        setGamepassInstructionShown(true);
        setShowGamepassModal(false);
        setLastCheckedRobuxAmount(robux); // Save the robux amount that was successfully checked

        // Show success message
        toast.success(
          `GamePass berhasil ditemukan! Nama: ${data.gamepass.name}, Harga: ${data.gamepass.price} Robux`,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      } else {
        // GamePass not found, show error with existing gamepasses
        let errorMessage = `${data.message}`;
        if (data.allGamepasses && data.allGamepasses.length > 0) {
          errorMessage += `. Pastikan GamePass dengan harga ${expectedRobux} Robux sudah dibuat dan aktif.`;
        } else {
          errorMessage += ` Belum ada GamePass di game ini. Silakan buat GamePass dengan harga ${expectedRobux} Robux terlebih dahulu.`;
        }
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error("Error checking gamepass:", error);
      toast.error(
        "Terjadi kesalahan saat memeriksa GamePass. Silakan coba lagi.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    } finally {
      setIsCheckingGamepass(false);
    }
  };

  const ArrowIcon = ({ open }: { open: boolean }) => (
    <span
      className={`transition-transform duration-300 ${
        open ? "rotate-180" : ""
      }`}
    >
      ⌄
    </span>
  );

  useEffect(() => {
    const updateThumb = () => {
      const slider = sliderRef.current;
      if (!slider) {
        console.log("Slider ref not found during regular update");
        return;
      }

      const maxRobux = 1000;
      const percent = Math.min(robux / maxRobux, 1);
      const sliderWidth = slider.offsetWidth;
      const thumbWidth = 50;
      const offset = percent * (sliderWidth - thumbWidth);

      console.log("Regular update calculation:", {
        robux,
        percent,
        sliderWidth,
        thumbWidth,
        offset,
        finalPosition: `${offset}px`,
      });

      setThumbLeft(`${offset}px`);
    };

    // Update immediately without timeout
    updateThumb();

    window.addEventListener("resize", updateThumb);
    return () => {
      window.removeEventListener("resize", updateThumb);
    };
  }, [robux]);

  // Reset homepage flag after regular update
  useEffect(() => {
    if (isFromHomepage) {
      setIsFromHomepage(false);
    }
  }, [thumbLeft]);

  // Check if all required fields are filled
  const isFormValid =
    robux > 0 &&
    username.trim() !== "" &&
    userInfo !== null &&
    selectedPlace !== null &&
    gamepassInstructionShown &&
    currentRobuxPricing !== null &&
    lastCheckedRobuxAmount === robux; // Ensure current robux amount matches the checked amount

  const handlePurchase = () => {
    if (!isFormValid || robux <= 0) return;

    const price = getCurrentPrice();

    // Create checkout items array (consistent format)
    const checkoutItems = [
      {
        serviceType: "robux",
        serviceId: selectedPackage?._id || `custom_${robux}`,
        serviceName: selectedPackage?.name || `${robux} Robux (5 Hari)`,
        serviceImage: "/robux-icon.png", // Default Robux icon
        serviceCategory: "robux_5_hari", // Move to root level
        quantity: 1,
        unitPrice: price,
        robloxUsername: username,
        robloxPassword: null, // RBX5 doesn't need password
        rbx5Details: {
          robuxAmount: robux,
          packageName: selectedPackage?.name || `Custom ${robux} Robux`,
          // Add place information
          selectedPlace: selectedPlace
            ? {
                placeId: selectedPlace.placeId,
                name: selectedPlace.name,
                universeId: selectedPlace.universeId,
              }
            : null,
          // Add gamepass information
          gamepassAmount: getGamepassAmount(),
          gamepassCreated: gamepassInstructionShown,
          // Add gamepass details from check result
          gamepass: gamepassCheckResult?.gamepass || null,
          pricePerRobux: currentRobuxPricing,
        },
      },
    ];

    // Store in sessionStorage for checkout page
    console.log("Storing RBX5 checkout data:", checkoutItems); // Debug log

    if (typeof window !== "undefined") {
      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutItems));

      // Verify data was stored
      const stored = sessionStorage.getItem("checkoutData");
      console.log("Verified stored RBX5 data:", stored); // Debug log
    }

    router.push("/checkout");
  };

  const handlePackageSelect = (product: Product) => {
    setSelectedPackage(product);
    setRobux(product.robuxAmount);

    // Reset gamepass status when selecting a different package
    if (
      lastCheckedRobuxAmount !== null &&
      product.robuxAmount !== lastCheckedRobuxAmount
    ) {
      setGamepassInstructionShown(false);
      setGamepassCheckResult(null);
      setLastCheckedRobuxAmount(null);
    }
  };

  // Function to refresh statistics
  const refreshStats = async () => {
    setLoadingStats(true);
    try {
      // Fetch both stats and stock accounts info in parallel
      const [statsResponse, stockResponse] = await Promise.all([
        fetch("/api/rbx5-stats"),
        fetch("/api/stock-accounts"),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      }

      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        if (stockData.success && stockData.stats) {
          setStockAccountsInfo(stockData.stats);
        }
      }

      toast.success("Statistik berhasil diperbarui!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error refreshing stats:", error);
      toast.error("Terjadi kesalahan saat memperbarui statistik");
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center ">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  return (
    <>
      <main className="min-h-screen">
        {/* Reduced floating elements */}

        {/* Hero Section */}
        <section className="relative py-8 lg:py-12">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              {/* Premium Badge */}
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 rounded-2xl text-sm text-white/80 font-semibold mb-8 backdrop-blur-sm shadow-lg hover:shadow-primary-100/20 transition-all duration-300">
                <div className="flex items-center mr-2">
                  {/* <span className="w-2 h-2 bg-primary-100 rounded-full animate-pulse mr-2"></span> */}
                  <DollarSign className="w-4 h-4" />
                </div>
                Robux Premium - GamePass Official
              </div>

              {/* Enhanced Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[0.9] tracking-tight">
                RBX <span className="text-primary-100">5 Hari</span>{" "}
              </h1>

              {/* Enhanced Description */}
              <p className="text-lg sm:text-base text-white/80 max-w-3xl mx-auto mb-8 font-light">
                Robux akan otomatis ditambahkan ke akunmu melalui{" "}
                <span className="text-primary-100 font-medium">
                  gamepass resmi
                </span>
                .
                <br className="hidden sm:block" />
                Proses{" "}
                <span className="text-primary-200 font-medium">
                  cepat
                </span>, <span className="text-white font-medium">aman</span>,
                dan{" "}
                <span className="text-primary-100 font-medium">terpercaya</span>
                .
              </p>
            </div>
          </div>
        </section>

        {/* Enhanced Stats Section */}
        <section className="relative py-6">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-200/20 to-primary-300/20 border border-primary-200/40 rounded-2xl text-sm text-white/80 font-medium mb-6 backdrop-blur-sm">
                Statistik Real-time
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-3 leading-tight">
                Data <span className="text-primary-100">Terkini</span>
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
              {[
                {
                  label: "Total Stok",
                  value: loadingStats ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-pulse bg-gray-300 h-4 w-16 rounded"></div>
                    </div>
                  ) : (
                    `${stats.totalStok.toLocaleString()} R$`
                  ),
                  img: "/stok.png",
                  hasInfo: true,
                  infoContent: stockAccountsInfo ? (
                    <div className="text-xs text-left">
                      <div className="font-semibold mb-1">
                        Detail Stok Akun:
                      </div>
                      <div>Total Akun: {stockAccountsInfo.totalAccounts}</div>
                      <div>Akun Aktif: {stockAccountsInfo.activeAccounts}</div>
                      <div>
                        Akun Nonaktif: {stockAccountsInfo.inactiveAccounts}
                      </div>
                      <div>
                        Rata-rata per Akun:{" "}
                        {stockAccountsInfo.averageRobuxPerAccount.toLocaleString()}{" "}
                        R$
                      </div>
                    </div>
                  ) : null,
                },
                {
                  label: "Total Order",
                  value: loadingStats ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-pulse bg-gray-300 h-4 w-16 rounded"></div>
                    </div>
                  ) : (
                    `${stats.totalOrder} Order`
                  ),
                  img: "/order.png",
                  hasInfo: false,
                },
                {
                  label: "Terjual",
                  value: loadingStats ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-pulse bg-gray-300 h-4 w-16 rounded"></div>
                    </div>
                  ) : (
                    `${stats.totalTerjual.toLocaleString()} R$`
                  ),
                  img: "/terjual.png",
                  hasInfo: false,
                },
                {
                  label: "Harga Robux",
                  value: loadingStats ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-pulse bg-gray-300 h-4 w-20 rounded"></div>
                    </div>
                  ) : (
                    `Rp.${stats.hargaPer100Robux.toLocaleString()} / 100 R$`
                  ),
                  img: "/harga.png",
                  hasInfo: false,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="group relative bg-gradient-to-br from-white/10 via-transparent to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center transition-all duration-700 hover:-translate-y-4 hover:shadow-2xl hover:shadow-white/20 hover:border-white/40"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-white/20 to-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      {i === 0 && <Gem className="text-white w-8 h-8" />}
                      {i === 1 && (
                        <ShoppingCart className="text-white w-8 h-8" />
                      )}
                      {i === 2 && <TrendingUp className="text-white w-8 h-8" />}
                      {i === 3 && <Coins className="text-white w-8 h-8" />}
                    </div>

                    {/* Info Icon for items with additional info */}
                    {item.hasInfo && item.infoContent && (
                      <div className="absolute top-3 right-3">
                        <div className="relative">
                          {/* <Info className="w-4 h-4 text-cyan-400 hover:text-cyan-300 cursor-help" /> */}

                          {/* Modern Tooltip */}
                          <div className="absolute bottom-full right-0 mb-2 w-48 bg-slate-800/90 backdrop-blur-lg border border-slate-600/50 text-white text-xs rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10 shadow-xl">
                            {item.infoContent}
                            <div className="absolute top-full right-4 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-600/50"></div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-center">
                      <div className="text-xl font-black text-white mb-2 group-hover:text-neon-pink transition-colors duration-300">
                        {typeof item.value === "string"
                          ? item.value
                          : item.value}
                      </div>
                      <div className="text-white/70 text-sm font-medium">
                        {item.label}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Enhanced Package Selection Section */}
        <section className="relative py-16 lg:py-20">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-100/10 to-primary-200/10 border border-primary-100/30 rounded-2xl text-sm text-white/80 font-semibold mb-6 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Paket Premium Robux
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
                Pilih <span className="text-primary-100">Paket Robux</span>
                <br />
                <span className="text-transparent bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text">
                  Terbaik
                </span>
              </h2>
              <p className="text-xl text-white/80 max-w-3xl mx-auto font-light">
                Pilih jumlah Robux yang sesuai dengan kebutuhanmu.{" "}
                <span className="text-primary-100 font-medium">
                  Proses instan
                </span>{" "}
                dan{" "}
                <span className="text-primary-200 font-medium">
                  harga terbaik
                </span>
                .
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 justify-center max-w-5xl mx-auto mb-8">
              {products.map((product, i) => (
                <button
                  key={product._id}
                  onClick={() => handlePackageSelect(product)}
                  className={`group relative backdrop-blur-xl border rounded-2xl p-4 sm:p-6 transition-all duration-700 hover:-translate-y-2 hover:shadow-xl ${
                    selectedPackage?._id === product._id
                      ? "bg-gradient-to-br from-primary-100/20 via-primary-200/10 to-primary-100/20 border-primary-100/60 shadow-lg shadow-primary-100/30"
                      : "bg-gradient-to-br from-white/10 via-transparent to-white/5 border-white/20 hover:border-white/40 hover:shadow-white/20"
                  }`}
                >
                  {selectedPackage?._id === product._id && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center shadow-lg shadow-primary-100/50">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-100/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                  <div className="relative flex flex-col items-center text-center">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br rounded-xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${
                        selectedPackage?._id === product._id
                          ? "from-primary-100/30 to-primary-200/20"
                          : "from-primary-100/20 to-primary-200/10"
                      }`}
                    >
                      <DollarSign
                        className={`w-5 h-5 sm:w-6 sm:h-6 ${
                          selectedPackage?._id === product._id
                            ? "text-white"
                            : "text-white"
                        }`}
                      />
                    </div>

                    <div
                      className={`text-lg sm:text-xl font-bold mb-2 group-hover:scale-105 transition-all duration-300 ${
                        selectedPackage?._id === product._id
                          ? "text-primary-100"
                          : "text-white "
                      }`}
                    >
                      {product.robuxAmount.toLocaleString()} R$
                    </div>

                    <div
                      className={`font-bold text-sm sm:text-base mb-2 px-2 sm:px-3 py-1 rounded-lg transition-all duration-300 ${
                        selectedPackage?._id === product._id
                          ? "text-primary-100 bg-gradient-to-r from-primary-100/20 to-primary-200/20"
                          : "text-white  group-hover:bg-gradient-to-r group-hover:from-primary-100/10 group-hover:to-primary-200/10"
                      }`}
                    >
                      {formatCurrency(getFinalPrice(product))}
                    </div>

                    {product.discountPercentage && (
                      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-2">
                        <div className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.price)}
                        </div>
                        <div className="bg-gradient-to-r from-primary-100 to-primary-200 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                          -{product.discountPercentage}%
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Slider Section */}
            <div className="mt-8 mb-8">
              <div className="text-center mb-8">
                {/* Section Badge */}
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-200/20 to-primary-300/20 border border-primary-200/40 rounded-2xl text-sm text-primary-200 font-medium mb-6 backdrop-blur-sm">
                  <span className="w-2 h-2 bg-primary-200 rounded-full mr-2 animate-pulse"></span>
                  Custom Amount
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Pilih Jumlah <span className="text-primary-100">Custom</span>
                </h3>
                <p className="text-white/70 text-base">
                  Geser untuk memilih jumlah Robux yang{" "}
                  <span className="text-primary-200 font-medium">
                    diinginkan
                  </span>
                </p>
              </div>

              <div className="relative w-full max-w-5xl mx-auto mb-16">
                <input
                  ref={sliderRef}
                  type="range"
                  min={0}
                  max={1000}
                  step={50}
                  value={robux}
                  onChange={(e) => setRobux(Number(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-primary-900/50 to-primary-800/50 rounded-full appearance-none cursor-pointer slider-custom"
                />

                {/* Moving Tooltip Below Slider */}
                <div
                  className="absolute top-10 transition-all duration-200 ease-out z-10 pointer-events-none"
                  style={{
                    left: `calc(${Math.min(robux / 1000, 1) * 100}% - ${
                      Math.min(robux / 1000, 1) * 24
                    }px + 12px)`,
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="bg-gradient-to-r from-primary-100/95 to-primary-200/95 backdrop-blur-sm text-white text-sm font-bold px-4 py-2 rounded-xl shadow-xl border border-primary-100/40 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Gem className="w-4 h-4" />
                      {robux.toLocaleString()} R$
                    </div>
                    {/* Arrow pointing up to slider */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary-100/95"></div>
                  </div>
                </div>

                {/* Simple Slider Styling */}
                <style jsx>{`
                  .slider-custom {
                    -webkit-appearance: none;
                    appearance: none;
                    outline: none;
                    background: linear-gradient(
                      to right,
                      #b354c3 0%,
                      #b354c3 ${(robux / 1000) * 100}%,
                      rgba(179, 84, 195, 0.2) ${(robux / 1000) * 100}%,
                      rgba(179, 84, 195, 0.2) 100%
                    );
                    border-radius: 50px;
                    border: 1px solid rgba(179, 84, 195, 0.3);
                  }

                  .slider-custom::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    height: 24px;
                    width: 24px;
                    background: linear-gradient(135deg, #b354c3, #f4c5e7);
                    border-radius: 50%;
                    border: 3px solid white;
                    cursor: grab;
                    box-shadow: 0 4px 12px rgba(179, 84, 195, 0.4);
                  }

                  .slider-custom::-webkit-slider-thumb:active {
                    cursor: grabbing;
                    transform: scale(1.1);
                  }

                  .slider-custom::-moz-range-thumb {
                    height: 24px;
                    width: 24px;
                    background: linear-gradient(135deg, #b354c3, #f4c5e7);
                    border-radius: 50%;
                    border: 3px solid white;
                    cursor: grab;
                    box-shadow: 0 4px 12px rgba(179, 84, 195, 0.4);
                    -moz-appearance: none;
                  }

                  .slider-custom::-moz-range-thumb:active {
                    cursor: grabbing;
                    transform: scale(1.1);
                  }

                  .slider-custom::-moz-range-track {
                    background: transparent;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Custom Robux Input Section */}
        <section className="max-w-5xl mx-auto mt-8 px-4">
          <div className="bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-2xl p-6 sm:p-8 shadow-xl shadow-primary-100/20 hover:shadow-primary-100/30 transition-all duration-500 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary-100/5 via-transparent to-primary-200/5 rounded-2xl"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-100/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-primary-200/10 rounded-full blur-2xl"></div>

            {/* Header Badge */}
            <div className="relative flex items-center justify-center mb-6">
              <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/40 rounded-2xl backdrop-blur-sm shadow-lg">
                <Sparkles className="w-5 h-5 text-primary-100 mr-2" />
                <span className="text-white font-bold text-sm tracking-wide">
                  MASUKAN JUMLAH CUSTOM
                </span>
              </div>
            </div>

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {/* Robux Amount Input */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-lg flex items-center justify-center">
                    <Gem className="w-4 h-4 text-primary-100" />
                  </div>
                  <h3 className="text-white font-bold text-base">
                    <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                      Jumlah Robux
                    </span>
                  </h3>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-xl blur-sm group-focus-within:blur-md transition-all duration-300"></div>
                  <div className="relative flex rounded-xl overflow-hidden backdrop-blur-xl border border-primary-200/40 group-focus-within:border-primary-100/60 transition-all duration-300">
                    <div className="bg-gradient-to-r from-primary-100/30 to-primary-200/20 text-white font-bold text-sm px-5 py-4 flex items-center justify-center border-r border-primary-200/30">
                      <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent font-extrabold">
                        R$
                      </span>
                    </div>
                    <input
                      type="number"
                      value={robux || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || value === "0") {
                          setRobux(0);
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue > 0) {
                            setRobux(numValue);
                          }
                        }
                      }}
                      min="1"
                      placeholder="Contoh: 500"
                      className="flex-1 bg-gradient-to-r from-primary-600/20 to-primary-700/10 text-white text-lg font-bold outline-none px-4 py-4 placeholder:text-white/50 focus:bg-primary-600/30 transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <div className="w-1 h-1 bg-primary-200 rounded-full animate-pulse"></div>
                  <p className="text-xs text-white/70">
                    Masukan jumlah Robux yang diinginkan (minimum 1 R$)
                  </p>
                </div>
              </div>

              {/* Price Display */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-primary-100" />
                  </div>
                  <h3 className="text-white font-bold text-base">
                    <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                      Harga Total
                    </span>
                  </h3>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 rounded-xl blur-sm transition-all duration-300"></div>
                  <div className="relative flex rounded-xl overflow-hidden backdrop-blur-xl border border-emerald-400/40">
                    <div className="bg-gradient-to-r from-emerald-500/30 to-green-500/20 text-white font-bold text-sm px-5 py-4 flex items-center justify-center border-r border-emerald-400/30">
                      <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent font-extrabold">
                        Rp
                      </span>
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-emerald-500/10 to-green-500/5 text-white text-lg font-bold px-4 py-4 flex items-center">
                      {getCurrentPrice() > 0 ? (
                        <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                          {formatCurrency(getCurrentPrice())
                            .replace("Rp", "")
                            .trim()}
                        </span>
                      ) : (
                        <span className="text-white/50">0</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></div>
                  <p className="text-xs text-white/70">
                    Harga akan otomatis terhitung berdasarkan jumlah Robux
                  </p>
                </div>
              </div>
            </div>

            {/* Price Info Banner */}
            {robux > 0 && (
              <div className="mt-6 bg-gradient-to-r from-primary-100/10 to-primary-200/10 border border-primary-100/30 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-3 text-center">
                  <TrendingUp className="w-5 h-5 text-primary-100" />
                  <span className="text-white font-medium">
                    Kamu akan mendapat{" "}
                    <span className="text-primary-100 font-bold">
                      {robux.toLocaleString()} R$
                    </span>{" "}
                    dengan harga{" "}
                    <span className="text-primary-200 font-bold">
                      {formatCurrency(getCurrentPrice())}
                    </span>
                  </span>
                  <Sparkles className="w-5 h-5 text-primary-200" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Simplified Form Section */}
        <section className="max-w-5xl mx-auto mt-8 px-4">
          <div className="bg-gradient-to-br from-primary-900/30 via-primary-800/20 to-primary-700/30 backdrop-blur-xl border border-primary-100/20 rounded-2xl p-6 shadow-xl shadow-primary-100/10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Username Input Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-100" />
                  </div>
                  <h3 className="text-white font-bold text-lg">
                    <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                      1. MASUKAN USERNAME
                    </span>
                  </h3>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Masukan Username Roblox"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full py-3 px-4 rounded-xl text-white font-medium pr-12 outline-none transition-all duration-300 backdrop-blur-xl ${
                      userInfo
                        ? "bg-gradient-to-r from-emerald-500/30 to-emerald-600/20 border-2 border-emerald-400/60"
                        : username && userSearchError
                        ? "bg-gradient-to-r from-red-500/30 to-red-600/20 border-2 border-red-400/60"
                        : "bg-gradient-to-r from-primary-600/30 to-primary-700/20 border-2 border-primary-200/50 focus:border-primary-100/80"
                    } placeholder:text-white/50`}
                  />
                  {isSearchingUser ? (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary-100" />
                  ) : (
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  )}
                </div>

                <p className="text-xs text-white/70">
                  Ketik minimal 2 karakter untuk mencari username secara
                  otomatis
                </p>

                {/* User Status Messages */}
                {userSearchError &&
                  username &&
                  username.length >= 2 &&
                  !isSearchingUser && (
                    <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-400/60 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-300">
                          {userSearchError}
                        </span>
                      </div>
                    </div>
                  )}

                {isSearchingUser && username && username.length >= 2 && (
                  <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-400/60 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-yellow-400" />
                      <span className="text-sm text-yellow-300">
                        Mencari user...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* User Info & Actions Section */}
              <div className="space-y-4 h-full">
                {userInfo ? (
                  <>
                    {/* User Info Display */}
                    <div className="bg-gradient-to-br h-full from-emerald-500/25 via-emerald-400/15 to-green-500/25 border border-emerald-400/60 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        {userInfo.avatar ? (
                          <img
                            src={userInfo.avatar}
                            alt="Avatar"
                            className="w-12 h-12 rounded-xl bg-slate-600 ring-2 ring-emerald-400/60"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-400/60">
                            <Users className="w-6 h-6 text-emerald-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-white font-bold">
                            {userInfo.username}
                          </div>
                          <div className="text-xs text-emerald-300">
                            ID: {userInfo.id}
                          </div>
                          {userInfo.displayName &&
                            userInfo.displayName !== userInfo.username && (
                              <div className="text-xs text-emerald-300">
                                Display: {userInfo.displayName}
                              </div>
                            )}
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-gradient-to-br from-primary-600/25 via-primary-500/15 to-primary-700/25 border border-primary-200/50 rounded-xl p-6 text-center">
                    <Users className="w-12 h-12 text-primary-200 mx-auto mb-3 opacity-50" />
                    <p className="text-white/70">
                      Masukan username untuk melihat info akun
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Place Selection and Purchase Actions - only show when user info exists */}
        {userInfo && (
          <section className="max-w-5xl mx-auto px-4 pb-8 mt-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Place Selection Section */}
              <div className="bg-gradient-to-br from-primary-900/30 via-primary-800/20 to-primary-700/30 backdrop-blur-xl border border-primary-100/20 rounded-2xl p-6 shadow-xl shadow-primary-100/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-xl flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-primary-100" />
                  </div>
                  <h3 className="text-white font-bold text-lg">
                    <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                      2. PILIH GAME/PLACE
                    </span>
                  </h3>
                </div>

                {isLoadingPlaces ? (
                  <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-400/60 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
                      <span className="text-white">
                        Mengambil daftar game...
                      </span>
                    </div>
                  </div>
                ) : placesError ? (
                  <div className="bg-gradient-to-br from-red-500/20 to-rose-500/20 border border-red-400/60 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-white">{placesError}</span>
                    </div>
                  </div>
                ) : userPlaces.length === 0 ? (
                  <div className="bg-gradient-to-br from-primary-600/20 to-primary-700/20 border border-primary-200/40 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-primary-200" />
                      <span className="text-white/80">
                        User ini tidak memiliki game yang dapat dipilih
                      </span>
                    </div>
                  </div>
                ) : selectedPlace ? (
                  <div className="bg-gradient-to-br from-emerald-500/25 to-green-500/25 border border-emerald-400/60 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      {selectedPlace.thumbnail ? (
                        <img
                          src={selectedPlace.thumbnail}
                          alt="Game thumbnail"
                          className="w-12 h-12 rounded-lg bg-slate-600 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 flex items-center justify-center">
                          <Gamepad2 className="w-6 h-6 text-emerald-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-white font-bold">
                          {selectedPlace.name}
                        </div>
                        <div className="text-xs text-emerald-300">
                          Visits: {selectedPlace.visits.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPlaceModal(true)}
                        className="bg-cyan-500/30 hover:bg-cyan-500/40 text-cyan-300 text-xs font-medium px-3 py-1 rounded-lg transition-all"
                      >
                        Ganti
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPlaceModal(true)}
                    className="w-full bg-gradient-to-br from-primary-600/30 to-primary-700/30 border border-primary-200/40 rounded-xl p-4 text-center hover:from-primary-500/30 hover:to-primary-600/30 transition-all"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Gamepad2 className="w-5 h-5 text-primary-200" />
                      <div>
                        <div className="text-white font-medium">
                          Pilih Game/Place
                        </div>
                        <div className="text-xs text-primary-300">
                          {userPlaces.length} game tersedia
                        </div>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Purchase Actions Section */}
              <div className="bg-gradient-to-br from-primary-900/30 via-primary-800/20 to-primary-700/30 backdrop-blur-xl border border-primary-100/20 rounded-2xl p-6 shadow-xl shadow-primary-100/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary-100" />
                  </div>
                  <h3 className="text-white font-bold text-lg">
                    <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                      3. LANJUTKAN PEMBELIAN
                    </span>
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Status Info */}
                  <div className="bg-gradient-to-br from-primary-600/25 to-primary-700/25 border border-primary-200/50 rounded-xl p-4">
                    <p className="text-sm text-white/80">
                      {!selectedPlace
                        ? "Pilih game/place tempat Robux akan dikirim."
                        : robux <= 0
                        ? "Pilih jumlah Robux yang ingin dibeli."
                        : !gamepassInstructionShown
                        ? "Buat gamepass sesuai instruksi untuk melanjutkan."
                        : "Semua data sudah lengkap. Klik tombol di bawah untuk melanjutkan ke pembayaran."}
                    </p>
                  </div>

                  {/* GamePass Button */}
                  {selectedPlace && robux > 0 && !gamepassInstructionShown && (
                    <button
                      onClick={() => setShowGamepassModal(true)}
                      className="w-full bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Gamepad2 className="w-5 h-5" />
                      <span>
                        Buat GamePass ({getGamepassAmount().toLocaleString()}{" "}
                        R$)
                      </span>
                    </button>
                  )}

                  {/* Warning for gamepass recheck */}
                  {lastCheckedRobuxAmount !== null &&
                    lastCheckedRobuxAmount !== robux &&
                    robux > 0 && (
                      <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-400/60 rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-400" />
                          <div>
                            <div className="text-sm font-medium text-white">
                              Perhatian
                            </div>
                            <div className="text-xs text-orange-300">
                              Jumlah Robux telah diubah. Silakan cek GamePass
                              ulang.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {/* Add to Cart Button */}
                    <AddToCartButton
                      serviceType="robux"
                      serviceId={selectedPackage?._id || `custom_${robux}`}
                      serviceName={
                        selectedPackage?.name || `${robux} Robux (5 Hari)`
                      }
                      serviceImage="/robux-icon.png" // Default Robux icon
                      serviceCategory="robux_5_hari"
                      type="rbx5"
                      gameId={selectedPlace?.placeId.toString() || ""}
                      gameName={selectedPlace?.name || "Roblox"}
                      itemName={`${robux} Robux (5 Hari)`}
                      imgUrl="/robux-icon.png" // Default Robux icon
                      unitPrice={getCurrentPrice()}
                      price={getCurrentPrice()}
                      description={`${robux} Robux untuk akun ${username} melalui gamepass di ${selectedPlace?.name}`}
                      quantity={1}
                      robuxAmount={robux}
                      gamepassAmount={getGamepassAmount()}
                      estimatedTime="5 hari"
                      additionalInfo={
                        selectedPlace
                          ? `Place: ${selectedPlace.name} (${selectedPlace.placeId})`
                          : ""
                      }
                      gamepass={gamepassCheckResult?.gamepass || undefined}
                      robloxUsername={username}
                      rbx5Details={{
                        robuxAmount: robux,
                        packageName:
                          selectedPackage?.name || `Custom ${robux} Robux`,
                        selectedPlace: selectedPlace
                          ? {
                              placeId: selectedPlace.placeId,
                              name: selectedPlace.name,
                              universeId: selectedPlace.universeId,
                            }
                          : undefined,
                        gamepassAmount: getGamepassAmount(),
                        gamepassCreated: gamepassInstructionShown,
                        gamepass: gamepassCheckResult?.gamepass || undefined,
                        pricePerRobux: currentRobuxPricing,
                      }}
                      className={`w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${
                        isFormValid
                          ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-600 text-white hover:scale-105 hover:shadow-xl"
                          : "bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <span>🛒 Tambah ke Keranjang</span>
                      {isFormValid && (
                        <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                          Rp {getCurrentPrice().toLocaleString()}
                        </span>
                      )}
                    </AddToCartButton>

                    {/* Purchase Button */}
                    <button
                      onClick={handlePurchase}
                      disabled={!isFormValid}
                      className={`w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${
                        isFormValid
                          ? "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white hover:scale-105 hover:shadow-xl"
                          : "bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>Beli Sekarang</span>
                      {isFormValid && (
                        <span className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                          Rp {getCurrentPrice().toLocaleString()}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Reviews Section */}
        <div className="max-w-4xl mx-auto">
          <ReviewSection
            serviceType="robux"
            serviceCategory="robux_5_hari"
            title="Reviews Robux 5 Hari"
          />
        </div>
      </main>

      {/* Enhanced Place Selection Modal */}
      {showPlaceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in-0 duration-300">
          <div className="bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-700/95 backdrop-blur-xl border border-primary-100/30 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl shadow-primary-100/20 animate-in slide-in-from-bottom-4 duration-300">
            {/* Enhanced Header */}
            <div className="relative bg-gradient-to-r from-primary-100/20 to-primary-200/20 p-6 border-b border-primary-100/20">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/5 to-primary-200/5"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100/30 to-primary-200/20 rounded-xl flex items-center justify-center">
                    <Gamepad2 className="w-5 h-5 text-primary-100" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                        Pilih Game/Place
                      </span>
                    </h3>
                    <p className="text-sm text-white/70 mt-1">
                      Pilih salah satu game/place dari{" "}
                      <span className="text-primary-200 font-medium">
                        {userInfo?.username}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPlaceModal(false)}
                  className="w-8 h-8 bg-gradient-to-br from-primary-600/30 to-primary-700/20 hover:from-primary-500/40 hover:to-primary-600/30 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group"
                >
                  <X className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            {/* Enhanced Content Area */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {userPlaces.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-primary-200" />
                  </div>
                  <p className="text-white/70 text-sm">
                    Tidak ada game yang tersedia
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    User belum memiliki game yang dapat dipilih
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userPlaces.map((place) => (
                    <button
                      key={place.placeId}
                      onClick={() => {
                        setSelectedPlace(place);
                        setShowPlaceModal(false);
                        // Show gamepass creation modal after place selection if robux is selected
                        if (robux > 0) {
                          setTimeout(() => setShowGamepassModal(true), 300);
                        }
                      }}
                      className={`w-full p-4 rounded-xl border text-left transition-all duration-300 group hover:scale-[1.02] ${
                        selectedPlace?.placeId === place.placeId
                          ? "border-primary-100/60 bg-gradient-to-br from-primary-100/20 via-primary-200/10 to-primary-100/20 shadow-lg shadow-primary-100/30"
                          : "border-primary-600/30 hover:border-primary-100/50 hover:bg-gradient-to-br hover:from-primary-600/20 hover:to-primary-700/20 bg-gradient-to-br from-primary-800/20 to-primary-900/20"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {place.thumbnail ? (
                          <div className="relative">
                            <img
                              src={place.thumbnail}
                              alt={place.name}
                              className="w-12 h-12 rounded-xl bg-primary-700/30 object-cover flex-shrink-0 ring-2 ring-primary-200/20"
                            />
                            {selectedPlace?.placeId === place.placeId && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full border-2 border-white flex items-center justify-center">
                                <CheckCircle2 className="w-2 h-2 text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ring-2 ${
                              selectedPlace?.placeId === place.placeId
                                ? "bg-gradient-to-br from-primary-100/30 to-primary-200/20 ring-primary-200/40"
                                : "bg-gradient-to-br from-primary-700/30 to-primary-800/20 ring-primary-200/20"
                            }`}
                          >
                            <Gamepad2
                              className={`w-6 h-6 ${
                                selectedPlace?.placeId === place.placeId
                                  ? "text-primary-100"
                                  : "text-primary-300"
                              }`}
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-white truncate group-hover:text-primary-100 transition-colors">
                            {place.name}
                          </h4>
                          <p className="text-sm text-primary-300 font-medium">
                            Visits: {place.visits.toLocaleString()}
                          </p>
                          <p className="text-xs text-white/50">
                            Place ID: {place.placeId}
                          </p>
                        </div>
                        {selectedPlace?.placeId === place.placeId && (
                          <div className="bg-gradient-to-br from-primary-100/20 to-primary-200/10 p-2 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-primary-100 flex-shrink-0" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Footer */}
            <div className="p-6 border-t border-primary-100/20 bg-gradient-to-r from-primary-800/20 to-primary-900/20">
              <button
                onClick={() => setShowPlaceModal(false)}
                className="w-full bg-gradient-to-r from-primary-600/50 to-primary-700/50 hover:from-primary-600/70 hover:to-primary-700/70 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary-100/20 hover:scale-105"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Gamepass Creation Modal - Compact Version */}
      {showGamepassModal && selectedPlace && robux > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in-0 duration-300">
          <div className="bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-700/95 backdrop-blur-xl border border-primary-100/30 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-primary-100/20 animate-in slide-in-from-bottom-4 duration-300 flex flex-col">
            {/* Compact Header */}
            <div className="relative bg-gradient-to-r from-primary-100/30 via-primary-200/20 to-primary-100/30 p-4 text-center overflow-hidden flex-shrink-0">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/10 to-primary-200/10"></div>

              {/* <button
                onClick={() => setShowGamepassModal(false)}
                className="absolute right-3 top-3 w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group backdrop-blur-sm"
              >
                <X className="w-3 h-3 text-white/70 group-hover:text-white transition-colors" />
              </button> */}

              <div className="relative flex items-center justify-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    <span className="bg-gradient-to-r from-white to-primary-100 bg-clip-text text-transparent">
                      Buat GamePass
                    </span>
                  </h3>
                  <p className="text-xs text-white/70 truncate max-w-[200px]">
                    {selectedPlace?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Compact Amount Display */}
              <div className="bg-gradient-to-br from-primary-100/20 via-primary-200/10 to-primary-100/20 border border-primary-100/40 rounded-xl p-4 text-center backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Gem className="w-5 h-5 text-primary-100" />
                  <div className="text-2xl font-black bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                    {getGamepassAmount().toLocaleString()} R$
                  </div>
                </div>
                <div className="bg-gradient-to-r from-primary-600/30 to-primary-700/20 rounded-lg px-2 py-1 text-xs text-white/80 inline-block">
                  {robux.toLocaleString()} R$ + 43% fee
                </div>
              </div>

              {/* Compact Video Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary-100" />
                  <h4 className="text-sm font-bold bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                    Tutorial GamePass
                  </h4>
                </div>
                <div className="rounded-xl overflow-hidden border border-primary-100/20">
                  <iframe
                    width="100%"
                    height="160"
                    src="https://www.youtube.com/embed/0N-1478Qki0"
                    title="Tutorial Cara Membuat GamePass"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full bg-black"
                  ></iframe>
                </div>
              </div>

              {/* Compact Instructions */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-100" />
                  <h4 className="text-sm font-bold bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                    Langkah Pembuatan
                  </h4>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      step: "1",
                      text: "Buka Roblox Studio → pilih game",
                    },
                    {
                      step: "2",
                      text: (
                        <span>
                          Create → Game Pass → set harga{" "}
                          <span className="text-primary-100 font-bold">
                            {getGamepassAmount().toLocaleString()} R$
                          </span>
                        </span>
                      ),
                    },
                    {
                      step: "3",
                      text: "Publish dan aktifkan GamePass",
                    },
                  ].map((instruction, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary-600/20 to-primary-700/10 rounded-lg border border-primary-200/20"
                    >
                      <div className="w-6 h-6 bg-gradient-to-br from-primary-100 to-primary-200 text-white rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {instruction.step}
                      </div>
                      <div className="text-white/90 text-xs leading-relaxed flex-1">
                        {instruction.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixed Action Buttons */}
            <div className="p-4 border-t border-primary-100/20 bg-gradient-to-r from-primary-800/20 to-primary-900/20 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={checkGamepassExists}
                  disabled={isCheckingGamepass}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm ${
                    lastCheckedRobuxAmount !== robux &&
                    lastCheckedRobuxAmount !== null
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white" // Orange if needs recheck
                      : "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white" // Primary if normal
                  }`}
                >
                  {isCheckingGamepass ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking...
                    </>
                  ) : lastCheckedRobuxAmount !== robux &&
                    lastCheckedRobuxAmount !== null ? (
                    <>
                      <AlertCircle className="w-4 h-4" />
                      Cek Ulang
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Sudah Buat
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowGamepassModal(false)}
                  className="px-4 bg-gradient-to-r from-primary-600/50 to-primary-700/50 hover:from-primary-600/70 hover:to-primary-700/70 text-white py-3 rounded-xl font-medium transition-all duration-300 text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
