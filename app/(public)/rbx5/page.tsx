"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import ReviewSection from "@/components/ReviewSection";

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

    // Redirect to new checkout system
    const checkoutData = {
      serviceType: "robux",
      serviceId: selectedPackage?._id || `custom_${robux}`,
      serviceName: selectedPackage?.name || `${robux} Robux (5 Hari)`,
      serviceImage: "", // Add image if available
      quantity: 1,
      unitPrice: price,
      robloxUsername: username,
      serviceCategory: "robux_5_hari",
      robuxAmount: robux,
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
    };

    // Store in sessionStorage for checkout page
    console.log("Storing RBX5 checkout data:", checkoutData); // Debug log

    if (typeof window !== "undefined") {
      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#67E8F9]"></div>
      </div>
    );
  }

  return (
    <>
      <main className="pt-6 sm:pt-8 md:pt-10 px-4 sm:px-6 md:px-8 min-h-screen relative">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px] pointer-events-none"></div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-20 left-0 w-80 h-80 bg-gradient-to-tr from-cyan-600/10 to-purple-600/5 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative z-10 p-8 rounded-2xl max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 text-white animate-in fade-in slide-in-from-top-5 duration-1000">
            Beli{" "}
            <span className="text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">
              Robux
            </span>
          </h1>
          <div className="flex items-center justify-center mb-4 max-w-4xl mx-auto">
            <p className="text-center text-sm sm:text-base text-gray-300">
              Robux akan otomatis di tambahkan ke akunmu melalui gamepass resmi.
            </p>
          </div>
          {/* <button
            onClick={refreshStats}
            disabled={loadingStats}
            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-button-primary text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loadingStats ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            {loadingStats ? "Memuat..." : "Refresh"}
          </button> */}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-6 max-w-4xl items-center mx-auto">
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
                  <div className="font-semibold mb-1">Detail Stok Akun:</div>
                  <div>Total Akun: {stockAccountsInfo.totalAccounts}</div>
                  <div>Akun Aktif: {stockAccountsInfo.activeAccounts}</div>
                  <div>Akun Nonaktif: {stockAccountsInfo.inactiveAccounts}</div>
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
              className="relative w-full h-auto bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-2 sm:px-3 py-2 md:py-5 flex items-center justify-center text-center group transition-all duration-500 ease-out hover:-translate-y-2 hover:scale-[1.02] hover:bg-white/20 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-400/10"
            >
              <img
                src={item.img}
                alt={item.label}
                className="absolute top-2 left-3 w-6 h-6 object-contain invert-[1]"
              />

              {/* Info Icon for items with additional info */}
              {item.hasInfo && item.infoContent && (
                <div className="absolute top-1 right-2">
                  <div className="relative">
                    <svg
                      className="w-4 h-4 text-gray-600 hover:text-gray-800 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>

                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-2 w-48 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      {item.infoContent}
                      <div className="absolute top-full right-4 border-l-4 border-r-4 border-t-4 border-transparent border-t-cyan-500/20"></div>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-[13px] leading-tight">
                <div className="text-gray-300">{item.label}</div>
                <div className="text-[#ffffff] font-extrabold text-sm ">
                  {typeof item.value === "string" ? item.value : item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-6">
          <h2 className="text-white text-sm sm:text-base font-bold mb-4 text-left max-w-4xl mx-auto">
            PILIH JUMLAH ROBUX
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 justify-center max-w-4xl mx-auto">
            {products.map((product, i) => (
              <button
                key={product._id}
                onClick={() => handlePackageSelect(product)}
                className={`w-full rounded-2xl px-3 py-2 flex flex-col justify-center transform transition duration-300 hover:scale-105  ${
                  selectedPackage?._id === product._id
                    ? "bg-cyan-400/20 backdrop-blur-sm border border-cyan-400/60"
                    : "bg-white/10 backdrop-blur-sm border border-white/20"
                }`}
              >
                <div className="flex items-center gap-2 text-gray-300 text-xs mb-[2px] justify-center">
                  <img
                    src="/money.png"
                    alt="money icon"
                    className="w-5 h-5 sm:w-6 sm:h-6 invert-[1]"
                  />
                  <span>{product.robuxAmount} R$</span>
                </div>
                <div className="text-white text-sm font-extrabold leading-tight ">
                  {formatCurrency(getFinalPrice(product))}
                  {product.discountPercentage && (
                    <div className="text-xs text-gray-400 line-through">
                      {formatCurrency(product.price)}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full max-w-[740px] mx-auto mt-10 mb-14">
          <div className="absolute top-1/2 -translate-y-1/2 w-full h-3 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-button-primary transition-all duration-300 ease-in-out"
              style={{
                width: `${(robux / 1000) * 100}%`,
              }}
            />
          </div>

          <input
            ref={sliderRef}
            type="range"
            min={0}
            max={1000}
            step={100}
            value={robux}
            onChange={(e) => setRobux(Number(e.target.value))}
            className="w-full h-3 bg-transparent appearance-none relative z-10"
            style={{
              WebkitAppearance: "none",
              MozAppearance: "none",
            }}
          />

          {/* Hide default thumb */}
          <style jsx>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              height: 0;
              width: 0;
              background: transparent;
              cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
              height: 0;
              width: 0;
              background: transparent;
              cursor: pointer;
            }
          `}</style>

          <div
            ref={thumbRef}
            className={`absolute top-1/2 -translate-y-1/2 text-nowrap bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[10px] font-bold h-[28px] px-3 rounded-lg flex items-center justify-center pointer-events-none z-20 ${
              isFromHomepage ? "" : "transition-all duration-300 ease-in-out"
            }`}
            style={{ left: thumbLeft }}
          >
            {robux} R$
          </div>
        </div>

        <div className="mt-8 sm:mt-10 md:mt-12 max-w-[740px] mx-auto px-2">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 sm:px-6 pt-6 pb-6 sm:pb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 min-h-[170px] relative transition-all duration-500  hover:border-cyan-400/30">
            <div className="w-fit text-white text-xs sm:text-sm font-bold rounded-md px-3 py-1 absolute left-2 top-2">
              MASUKAN JUMLAH CUSTOM
            </div>

            <div className="flex flex-col items-center justify-center pt-6">
              <div className="w-full max-w-[260px]">
                <p className="font-semibold text-sm mb-2 text-white ml-3">
                  Jumlah Robux
                </p>
                <div className="flex rounded overflow-hidden w-full">
                  <span className="bg-gradient-button-secondary text-white font-bold text-sm px-4 sm:px-5 py-3 flex items-center justify-center">
                    R$
                  </span>
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
                    placeholder="Cth. 100"
                    className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-base font-semibold outline-none px-3 sm:px-4 py-3 placeholder:!text-white/60  focus:border-cyan-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-cyan-400/10 transition-all duration-300 hover:border-cyan-400/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center pt-6 lg:pt-6">
              <div className="w-full max-w-[260px]">
                <p className="font-semibold text-sm mb-2 text-white ml-3">
                  Harga Total
                </p>
                <div className="flex rounded overflow-hidden w-full">
                  <span className="bg-gradient-button-secondary text-white font-bold text-sm px-4 sm:px-5 py-3 flex items-center justify-center">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={
                      getCurrentPrice() > 0
                        ? formatCurrency(getCurrentPrice())
                            .replace("Rp", "")
                            .trim()
                        : "0"
                    }
                    readOnly
                    className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-base font-semibold outline-none px-3 sm:px-4 py-3  focus:border-cyan-400/50 focus:bg-white/15 focus:shadow-lg focus:shadow-cyan-400/10 transition-all duration-300 hover:border-cyan-400/30"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="max-w-[740px] mx-auto mt-8 sm:mt-10 md:mt-12 px-4 flex flex-col lg:flex-row gap-6 sm:gap-8 items-start">
          <div className="w-full lg:w-[200px] flex justify-center lg:justify-start">
            <div className="bg-gradient-elegant-secondary/20 rounded-full w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] flex items-center justify-center border border-[#67E8F9]/30">
              <Image
                src="/koin.png"
                alt="coin icon"
                width={60}
                height={60}
                className="sm:w-20 sm:h-20"
              />
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-white font-bold text-sm mb-1">
              1. MASUKAN USERNAME
            </h3>
            <p className="text-sm text-gray-300 mb-3 max-w-md">
              Masukkan Username Anda untuk memastikan Robux akan dikirim ke akun
              yang benar.
            </p>

            <div className="relative mb-2 w-full max-w-md">
              <input
                type="text"
                placeholder="MASUKAN USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full py-3 px-4 rounded-md text-sm text-white font-medium pr-10 outline-none transition-all hover:scale-[1.02] focus:scale-[1.02] ${
                  userInfo
                    ? "bg-gradient-success/10 border-2 border-green-400/50"
                    : username && userSearchError
                    ? "bg-gradient-elegant-secondary/10 border-2 border-red-400/50"
                    : username
                    ? "bg-gradient-warning/10 border-2 border-yellow-400/50"
                    : "bg-gradient-elegant-secondary/10"
                }`}
              />
              {isSearchingUser ? (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                </div>
              ) : (
                <Image
                  src="/search.png"
                  alt="search icon"
                  width={16}
                  height={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                />
              )}
            </div>

            {/* User Info Display */}
            {userInfo && (
              <div className="bg-gradient-success/10 border-2 border-green-400/50 rounded-lg p-3 mb-3 w-full max-w-md">
                <div className="flex items-center gap-3">
                  {userInfo.avatar ? (
                    <img
                      src={userInfo.avatar}
                      alt="Avatar"
                      className="w-12 h-12 rounded-full bg-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 text-xs">No Avatar</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-sm font-bold text-green-700">
                      {userInfo.username}
                    </div>
                    {userInfo.displayName &&
                      userInfo.displayName !== userInfo.username && (
                        <div className="text-xs text-green-600">
                          Display Name: {userInfo.displayName}
                        </div>
                      )}
                    <div className="text-xs text-green-600">
                      ID: {userInfo.id}
                    </div>
                  </div>
                  <div className="text-green-500">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Place Selection */}
            {userInfo && (
              <div className="w-full max-w-md mb-3">
                <h4 className="text-sm font-bold text-white mb-2">
                  2. PILIH GAME/PLACE
                </h4>

                {isLoadingPlaces ? (
                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
                      <span className="text-sm text-yellow-700">
                        Mengambil daftar game...
                      </span>
                    </div>
                  </div>
                ) : placesError ? (
                  <div className="bg-gradient-elegant-secondary/10 border-2 border-red-400/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-red-500">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                      <span className="text-sm text-red-700">
                        {placesError}
                      </span>
                    </div>
                  </div>
                ) : userPlaces.length === 0 ? (
                  <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="text-gray-500">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600">
                        User ini tidak memiliki game yang dapat dipilih
                      </span>
                    </div>
                  </div>
                ) : selectedPlace ? (
                  <div className="bg-gradient-success/10 border-2 border-green-400/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      {selectedPlace.thumbnail ? (
                        <img
                          src={selectedPlace.thumbnail}
                          alt="Game thumbnail"
                          className="w-12 h-12 rounded bg-gray-200 object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 text-xs">No Img</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-bold text-green-700">
                          {selectedPlace.name}
                        </div>
                        <div className="text-xs text-green-600">
                          Visits: {selectedPlace.visits.toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600">
                          Place ID: {selectedPlace.placeId}
                        </div>
                      </div>
                      <button
                        onClick={() => setShowPlaceModal(true)}
                        className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                      >
                        Ganti
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPlaceModal(true)}
                    className="w-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-lg p-3 text-center hover:from-cyan-500/20 hover:to-blue-500/20 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      <span className="text-sm font-medium text-gray-700">
                        Pilih Game/Place ({userPlaces.length} tersedia)
                      </span>
                    </div>
                  </button>
                )}
              </div>
            )}

            {/* Error Display */}
            {userSearchError &&
              username &&
              username.length >= 2 &&
              !isSearchingUser && (
                <div className="bg-gradient-elegant-secondary/10 border-2 border-red-400/50 rounded-lg p-3 mb-3 w-full max-w-md">
                  <div className="flex items-center gap-2">
                    <div className="text-red-500">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                    </div>
                    <span className="text-sm text-red-700">
                      {userSearchError}
                    </span>
                  </div>
                </div>
              )}

            {/* Loading indicator for search */}
            {isSearchingUser && username && username.length >= 2 && (
              <div className="bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 mb-3 w-full max-w-md">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
                  <span className="text-sm text-yellow-700">
                    Mencari user...
                  </span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-white/70 mb-3 leading-tight">
              Ketik minimal 2 karakter untuk mencari Username. Tunggu 1 detik
              setelah selesai mengetik untuk mencari otomatis.
              <br />
              Kami hanya meminta username, bukan password. Pastikan Anda menulis
              Username dengan benar.
            </p>

            <div className="mt-6">
              <h3 className="text-white font-bold text-sm mb-3">
                3. LANJUTKAN PEMBELIAN
              </h3>
              <p className="text-sm text-gray-300 mb-4 max-w-md">
                {!userInfo
                  ? "Masukkan username terlebih dahulu untuk melanjutkan."
                  : !selectedPlace
                  ? "Pilih game/place tempat Robux akan dikirim."
                  : robux <= 0
                  ? "Pilih jumlah Robux yang ingin dibeli."
                  : !gamepassInstructionShown
                  ? "Buat gamepass sesuai instruksi untuk melanjutkan."
                  : "Semua data sudah lengkap. Klik tombol di bawah untuk melanjutkan ke pembayaran."}
              </p>

              {/* Tombol Buat GamePass */}
              {userInfo &&
                selectedPlace &&
                robux > 0 &&
                !gamepassInstructionShown && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowGamepassModal(true)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105"
                    >
                      📋 Buat GamePass ({getGamepassAmount().toLocaleString()}{" "}
                      R$)
                    </button>
                  </div>
                )}

              {/* Warning message if gamepass needs recheck */}
              {lastCheckedRobuxAmount !== null &&
                lastCheckedRobuxAmount !== robux &&
                robux > 0 && (
                  <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded-xl text-sm text-center mb-4">
                    ⚠️ Jumlah Robux telah diubah. Silakan cek GamePass ulang
                    sebelum melanjutkan pembelian.
                  </div>
                )}

              <button
                onClick={handlePurchase}
                disabled={!isFormValid}
                className={`font-bold py-3 px-6 rounded-xl w-full max-w-[300px] sm:max-w-[400px] lg:max-w-[750px] mx-auto flex items-center justify-center gap-2 transition-all duration-500 ease-out transform ${
                  isFormValid
                    ? "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white hover:scale-105 hover:shadow-xl hover:shadow-cyan-400/25 active:scale-95 cursor-pointer"
                    : "bg-gray-400 text-gray-600 cursor-not-allowed opacity-50"
                }`}
              >
                Beli Sekarang
                <Image
                  src="/beli.png"
                  alt="cart"
                  width={18}
                  height={18}
                  className="sm:w-5 sm:h-5"
                />
              </button>
            </div>
          </div>
        </section>
        <div className="max-w-4xl mx-auto">
          <ReviewSection
            serviceType="robux"
            serviceCategory="robux_5_hari"
            title="Reviews Robux 5 Hari"
          />
        </div>
      </main>

      {/* Place Selection Modal */}
      {showPlaceModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-[5px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  Pilih Game/Place
                </h3>
                <button
                  onClick={() => setShowPlaceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Pilih salah satu game/place dari {userInfo?.username}
              </p>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {userPlaces.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg
                      className="w-12 h-12 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600">Tidak ada game yang tersedia</p>
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
                      className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                        selectedPlace?.placeId === place.placeId
                          ? "border-green-400 bg-green-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {place.thumbnail ? (
                          <img
                            src={place.thumbnail}
                            alt={place.name}
                            className="w-12 h-12 rounded bg-gray-200 object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-600 text-xs">
                              No Img
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">
                            {place.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Visits: {place.visits.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Place ID: {place.placeId}
                          </p>
                        </div>
                        {selectedPlace?.placeId === place.placeId && (
                          <div className="text-green-500 flex-shrink-0">
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              ></path>
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-cyan-500/20">
              <button
                onClick={() => setShowPlaceModal(false)}
                className="w-full px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-base rounded-lg transition-all duration-300 hover:bg-white/20 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/10 focus:border-cyan-400/50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gamepass Creation Modal */}
      {showGamepassModal && selectedPlace && robux > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-[5px] flex items-center justify-center z-50 p-4">
          <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl shadow-cyan-400/10 animate-in zoom-in-95 duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-600 via-cyan-500 to-blue-600 p-4 text-white text-center relative">
              <button
                onClick={() => setShowGamepassModal(false)}
                className="absolute right-3 top-3 text-white hover:text-cyan-200 hover:rotate-90 transition-all duration-300 hover:scale-110"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gradient-primary">
                Buat GamePass
              </h3>
              <p className="text-sm text-cyan-300">
                di game {selectedPlace.name}
              </p>
            </div>

            <div className="p-6">
              {/* Amount Display */}
              <div className="bg-gradient-elegant-secondary/10 border-2 border-cyan-500/50 rounded-xl p-4 mb-4 text-center">
                <div className="text-2xl font-bold text-gradient-primary mb-1">
                  {getGamepassAmount().toLocaleString()} R$
                </div>
                <div className="text-xs text-neutral-base">
                  {robux.toLocaleString()} R$ + 43% fee
                </div>
              </div>

              {/* Tutorial Video */}
              <div className="mb-4">
                <h4 className="text-sm font-bold text-gradient-primary mb-2">
                  Tutorial Cara Membuat GamePass
                </h4>
                <div className="rounded-xl overflow-hidden">
                  <iframe
                    width="100%"
                    height="200"
                    src="https://www.youtube.com/embed/0N-1478Qki0"
                    title="Tutorial Cara Membuat GamePass"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full"
                  ></iframe>
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    1
                  </div>
                  <span className="text-base">
                    Buka Roblox Studio → pilih game "{selectedPlace.name}"
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    2
                  </div>
                  <span className="text-base">
                    Create → Game Pass → set harga{" "}
                    <strong className="text-gradient-primary">
                      {getGamepassAmount().toLocaleString()} Robux
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="bg-cyan-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    3
                  </div>
                  <span className="text-base">
                    Publish dan pastikan GamePass aktif
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={checkGamepassExists}
                  disabled={isCheckingGamepass}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    lastCheckedRobuxAmount !== robux &&
                    lastCheckedRobuxAmount !== null
                      ? "bg-gradient-warning text-white hover:opacity-90" // Orange if needs recheck
                      : "bg-gradient-button-primary text-white hover:opacity-90" // Red if normal
                  }`}
                >
                  {isCheckingGamepass ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Memeriksa...
                    </>
                  ) : lastCheckedRobuxAmount !== robux &&
                    lastCheckedRobuxAmount !== null ? (
                    "⚠️ Cek Ulang GamePass"
                  ) : (
                    "Sudah Buat GamePass"
                  )}
                </button>
                <button
                  onClick={() => setShowGamepassModal(false)}
                  className="px-6 glass-card glass-card-hover text-base py-3 rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Section */}
    </>
  );
}
