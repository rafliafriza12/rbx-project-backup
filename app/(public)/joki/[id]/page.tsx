"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  X,
  Check,
  Gem,
  FileText,
  User,
  Sparkles,
  Star,
  Crown,
  Zap,
  Heart,
  Gift,
  Lock,
  Shield,
  Info,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ReviewSection from "@/components/ReviewSection";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

interface JokiItem {
  itemName: string;
  imgUrl: string;
  price: number;
  description: string;
  syaratJoki: string[];
  prosesJoki: string[];
}

interface Joki {
  _id: string;
  gameName: string;
  imgUrl: string;
  developer: string;
  caraPesan: string[];
  item: JokiItem[];
}

export default function JokiDetailPage() {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const [isShowReview, setIsShowReview] = useState<boolean>(false);
  const [joki, setJoki] = useState<Joki | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>(
    {}
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  // User search states
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  // Item search timeout
  const [itemSearchTimeout, setItemSearchTimeout] =
    useState<NodeJS.Timeout | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedItemModal, setSelectedItemModal] = useState<JokiItem | null>(
    null
  );
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Get requirements and process for specific item from database
  const getItemRequirements = (itemName: string): string[] => {
    if (!joki) return [];
    const item = joki.item.find((i) => i.itemName === itemName);
    return item?.syaratJoki || [];
  };

  const getItemProcess = (itemName: string): string[] => {
    if (!joki) return [];
    const item = joki.item.find((i) => i.itemName === itemName);
    return item?.prosesJoki || [];
  };

  const params = useParams();
  const router = useRouter();
  const jokiId = params.id as string;
  const userId = "guest"; // Simplified for now

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

  // Check if all required fields are filled
  // Computed values for multi-select
  const selectedItemsArray = Object.keys(selectedItems).filter(
    (itemName) => selectedItems[itemName] > 0
  );
  const hasSelectedItems = selectedItemsArray.length > 0;
  const totalPrice = joki
    ? selectedItemsArray.reduce((total, itemName) => {
        const item = joki.item.find((i) => i.itemName === itemName);
        return total + (item ? item.price * selectedItems[itemName] : 0);
      }, 0)
    : 0;
  const totalQuantity = Object.values(selectedItems).reduce(
    (sum, qty) => sum + qty,
    0
  );

  const isFormValid =
    hasSelectedItems &&
    username.trim() !== "" &&
    password.trim() !== "" &&
    userInfo !== null;

  // Filter items based on debounced search query
  const filteredItems = joki
    ? joki.item.filter((item) => {
        const searchLower = debouncedSearchQuery.toLowerCase();
        return (
          item.itemName.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower) ||
          item.syaratJoki.some((req) =>
            req.toLowerCase().includes(searchLower)
          ) ||
          item.prosesJoki.some((proc) =>
            proc.toLowerCase().includes(searchLower)
          )
        );
      })
    : [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Debounced search effect for item search
  useEffect(() => {
    // Clear previous timeout
    if (itemSearchTimeout) {
      clearTimeout(itemSearchTimeout);
    }

    // Set new timeout for 1 second delay
    const newTimeout = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000);

    setItemSearchTimeout(newTimeout);

    // Cleanup function
    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout);
      }
    };
  }, [searchQuery]);

  // Reset to page 1 when debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Cleanup item search timeout on unmount
  useEffect(() => {
    return () => {
      if (itemSearchTimeout) {
        clearTimeout(itemSearchTimeout);
      }
    };
  }, []);

  // Helper functions for multi-select
  const updateQuantity = (itemName: string, change: number) => {
    setSelectedItems((prev) => {
      const currentQty = prev[itemName] || 0;
      const newQty = Math.max(0, Math.min(99, currentQty + change));

      if (newQty === 0) {
        const { [itemName]: removed, ...rest } = prev;
        return rest;
      }

      return { ...prev, [itemName]: newQty };
    });
  };

  const removeItem = (itemName: string) => {
    setSelectedItems((prev) => {
      const { [itemName]: removed, ...rest } = prev;
      return rest;
    });
  };

  useEffect(() => {
    if (jokiId) {
      fetchJoki();
    }
  }, [jokiId]);

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

  const fetchJoki = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/joki/${jokiId}`);
      const data = await response.json();

      if (response.ok) {
        setJoki(data.joki);
      } else {
        setError(data.error || "Joki service tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetching joki service:", error);
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isFormValid || !hasSelectedItems || !joki) {
      toast.error("Mohon lengkapi semua data!");
      return;
    }

    // Check if user is logged in
    if (!user) {
      toast.error(
        "Silakan login terlebih dahulu untuk menambahkan ke keranjang"
      );
      router.push("/login");
      return;
    }

    setIsAddingToCart(true);

    try {
      // Add each selected item to cart
      for (const itemName of selectedItemsArray) {
        const item = joki.item.find((i) => i.itemName === itemName);
        if (!item) continue;

        const cartItem = {
          userId: user.id, // Add userId from auth context
          serviceType: "joki",
          serviceId: joki._id,
          serviceName: `${joki.gameName} - ${item.itemName}`,
          serviceImage: item.imgUrl, // Use item image, not game image
          imgUrl: item.imgUrl, // Use item image, not game image
          serviceCategory: "joki",
          quantity: selectedItems[itemName],
          unitPrice: item.price,
          description: item.description,
          robloxUsername: username,
          robloxPassword: password,
          jokiDetails: {
            gameName: joki.gameName,
            developer: joki.developer,
            itemName: item.itemName,
            imgUrl: item.imgUrl, // Add item image to jokiDetails
            description: item.description,
            notes: additionalInfo,
            additionalInfo: additionalInfo,
            syaratJoki: item.syaratJoki,
            prosesJoki: item.prosesJoki,
          },
        };

        console.log("=== JOKI ADD TO CART DEBUG ===");
        console.log("Sending cartItem:", JSON.stringify(cartItem, null, 2));

        const response = await fetch("/api/cart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cartItem),
        });

        const data = await response.json();
        console.log("Response status:", response.status);
        console.log("Response data:", data);

        if (!response.ok) {
          console.error("Error response:", data);
          throw new Error(data.error || "Gagal menambahkan ke keranjang");
        }
      }

      toast.success(
        `${selectedItemsArray.length} item berhasil ditambahkan ke keranjang!`
      );

      // Refresh cart to update UI
      await refreshCart();

      // Reset form
      setSelectedItems({});
      setUsername("");
      setPassword("");
      setAdditionalInfo("");
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error.message || "Gagal menambahkan ke keranjang");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handlePurchase = () => {
    console.log("=== JOKI PURCHASE DEBUG START ===");
    console.log("1. handlePurchase called");
    console.log("2. Form validation:", {
      isFormValid,
      hasSelectedItems,
      selectedItemsArray,
      joki: !!joki,
    });

    if (!isFormValid || !hasSelectedItems || !joki) {
      console.log("3. Validation failed, aborting purchase");
      return;
    }

    console.log("4. Creating checkout data...");
    // Create items array for multi-select checkout
    const checkoutItems = selectedItemsArray
      .map((itemName) => {
        const item = joki.item.find((i) => i.itemName === itemName);
        if (!item) return null;

        return {
          serviceType: "joki",
          serviceId: joki._id,
          serviceName: `${joki.gameName} - ${item.itemName}`,
          serviceImage: joki.imgUrl,
          serviceCategory: "joki", // Add serviceCategory
          quantity: selectedItems[itemName],
          unitPrice: item.price,
          description: item.description,
          gameType: joki.gameName,
          robloxUsername: username,
          robloxPassword: password,
          jokiDetails: {
            gameName: joki.gameName,
            developer: joki.developer,
            itemName: item.itemName,
            description: item.description,
            notes: additionalInfo,
            additionalInfo: additionalInfo,
            syaratJoki: item.syaratJoki,
            prosesJoki: item.prosesJoki,
          },
        };
      })
      .filter(Boolean);

    console.log("5. Checkout items prepared:", checkoutItems);

    // Check sessionStorage availability
    const isSessionStorageAvailable = () => {
      try {
        const test = "__test__";
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch (e) {
        return false;
      }
    };

    console.log("6. SessionStorage available:", isSessionStorageAvailable());

    // Store in sessionStorage for checkout page
    try {
      console.log("7. Attempting to store data in sessionStorage...");
      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutItems));
      console.log("8. Data stored successfully");

      // Verify data was stored
      const stored = sessionStorage.getItem("checkoutData");
      console.log("9. Verified stored data:", stored);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log("10. Parsed stored data successfully:", parsed);
        } catch (parseError) {
          console.error("11. Error parsing stored data:", parseError);
        }
      } else {
        console.error("11. No data found after storage attempt");
      }
    } catch (storageError) {
      console.error("7. Error storing data in sessionStorage:", storageError);
    }

    // Create URL params as backup
    const urlParams = new URLSearchParams({
      userId: userId || "guest",
      items: JSON.stringify(checkoutItems),
      totalPrice: totalPrice.toString(),
      totalQuantity: totalQuantity.toString(),
    });

    console.log("12. URL params created as backup:", urlParams.toString());

    // Navigate with both sessionStorage and URL params
    console.log("13. Navigating to checkout page...");

    // Use setTimeout to ensure sessionStorage is properly set before navigation
    setTimeout(() => {
      console.log("14. Delayed navigation executing...");
      router.push(`/checkout?${urlParams.toString()}`);
    }, 100);

    console.log("=== JOKI PURCHASE DEBUG END ===");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-primary-100/20 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 bg-primary-200/15 rounded-full blur-lg animate-bounce delay-300"></div>
          <div className="absolute bottom-32 left-40 w-28 h-28 bg-primary-100/10 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute bottom-20 right-20 w-20 h-20 bg-primary-200/20 rounded-full blur-lg animate-bounce delay-1000"></div>
        </div>

        <div className="text-center relative z-10">
          <div className="relative">
            {/* Outer ring */}
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-100/20 mx-auto mb-6"></div>
            {/* Inner ring */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 animate-spin rounded-full h-16 w-16 border-4 border-primary-100 border-t-transparent"></div>
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary-100 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
              Loading Joki Service
            </h3>
            <div className="flex items-center justify-center gap-1">
              <div className="w-2 h-2 bg-primary-100 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary-100 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-primary-100 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4 text-xl">{error}</div>
          <div className="space-x-4">
            <button
              onClick={() => router.back()}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={fetchJoki}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!joki) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-primary-300 text-xl mb-4">
            Joki service tidak ditemukan
          </p>
          <button
            onClick={() => router.push("/joki")}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Kembali ke Daftar Joki
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideUpModal {
          from {
            transform: translateY(100%) scale(0.98);
            opacity: 0;
            box-shadow: 0 -10px 50px rgba(246, 58, 230, 0.1);
          }
          60% {
            transform: translateY(-2%) scale(1.01);
            opacity: 0.9;
            box-shadow: 0 -20px 60px rgba(246, 58, 230, 0.3);
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
            box-shadow: 0 -25px 80px rgba(246, 58, 230, 0.2);
          }
        }

        @keyframes slideUpModalSm {
          from {
            transform: scale(0.9) translateY(30px);
            opacity: 0;
            box-shadow: 0 10px 40px rgba(246, 58, 230, 0.1);
          }
          70% {
            transform: scale(1.02) translateY(-5px);
            opacity: 0.95;
            box-shadow: 0 20px 60px rgba(246, 58, 230, 0.25);
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
            box-shadow: 0 25px 80px rgba(246, 58, 230, 0.2);
          }
        }

        @keyframes fadeInBackdrop {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(8px);
          }
        }

        @keyframes sparkleAnimation {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .modal-backdrop {
          animation: fadeInBackdrop 0.4s ease-out;
        }

        .modal-content {
          animation: slideUpModal 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity, box-shadow;
        }

        @media (min-width: 640px) {
          .modal-content {
            animation: slideUpModalSm 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          }
        }

        .modal-sparkle {
          animation: sparkleAnimation 2s ease-in-out infinite;
        }

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

      <main className="text-white relative overflow-hidden">
        {/* Floating Background Elements */}
        {/* <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-100/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-primary-200/8 rounded-full blur-2xl animate-bounce delay-1000"></div>
        <div className="absolute bottom-40 left-32 w-28 h-28 bg-primary-100/6 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-40 w-20 h-20 bg-primary-200/10 rounded-full blur-xl animate-bounce delay-1500"></div>

        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary-100/60 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-primary-200/70 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary-100/50 rounded-full animate-ping delay-1000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-primary-200/60 rounded-full animate-ping delay-1300"></div>
      </div> */}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-4 py-4 sm:py-6 md:py-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {/* Left Column - Game Info */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Game Image & Info */}
              <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl md:shadow-2xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.01] md:hover:scale-[1.02] overflow-hidden">
                {/* Enhanced Background Effects */}
                {/* <div className="absolute inset-0 bg-gradient-to-br from-primary-100/10 via-transparent to-primary-200/10 rounded-3xl"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-full blur-3xl animate-pulse group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-tr from-primary-200/15 to-primary-100/10 rounded-full blur-2xl animate-pulse delay-500 group-hover:scale-110 transition-transform duration-700"></div> */}

                {/* Sparkle effects */}
                <div className="absolute top-8 right-8 w-2 h-2 bg-primary-100 rounded-full animate-ping opacity-75"></div>
                <div className="absolute top-12 right-16 w-1 h-1 bg-primary-200 rounded-full animate-ping delay-300 opacity-60"></div>
                <div className="absolute bottom-12 left-8 w-1.5 h-1.5 bg-primary-100/80 rounded-full animate-ping delay-700"></div>

                <div className="relative z-10">
                  {/* Game Image */}
                  <div className="relative w-full h-40 sm:h-48 md:h-56 rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6 md:mb-8 border-2 border-primary-100/30 shadow-lg group-hover:shadow-xl transition-all duration-500">
                    <Image
                      src={joki.imgUrl}
                      alt={joki.gameName}
                      fill
                      className="object-fill group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 via-transparent to-primary-100/20"></div>

                    {/* Joki Service badge */}
                    <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full text-white text-xs font-bold shadow-lg">
                      JOKI SERVICE
                    </div>

                    {/* Professional badge */}
                    <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 p-1.5 sm:p-2 bg-primary-100/20 backdrop-blur-sm rounded-lg border border-primary-100/40">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary-100" />
                    </div>
                  </div>

                  {/* Game Info */}
                  <div className="text-center mb-4 sm:mb-6 md:mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl text-white font-bold mb-2 sm:mb-3">
                      Jasa Joki {joki.gameName}
                    </h1>
                    <div className="flex items-center justify-center gap-1 sm:gap-2 text-primary-200">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                      <span className="text-xs sm:text-sm font-medium">
                        Professional Gaming Service
                      </span>
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                    </div>
                  </div>

                  {/* Features */}
                  {/* <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                      <div className="p-1.5 sm:p-2 bg-primary-100/20 rounded-lg">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-100" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-white">
                        Epic Features
                      </h3>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      {joki.features.map((feature, index) => (
                        <div
                          key={index}
                          className="group/feature flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 bg-primary-800/30 rounded-lg sm:rounded-xl border border-primary-100/20 hover:border-primary-100/40 hover:bg-primary-800/50 transition-all duration-300"
                        >
                          <span className="text-xs sm:text-sm text-white font-medium leading-relaxed">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div> */}
                </div>
                <button
                  onClick={() => setIsShowReview(!isShowReview)}
                  className="w-full py-1.5 sm:py-2 md:py-3 px-1.5 sm:px-2 md:px-4 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 hover:scale-[1.01] shadow hover:shadow-lg md:hover:shadow-primary-100/30 flex items-center justify-center gap-1 text-xs sm:text-xs md:text-base mt-4"
                >
                  {isShowReview ? "Sembunyikan" : "Lihat"} Review
                </button>
              </div>

              {/* Requirements Section */}
            </div>

            {/* Right Column - Order Form & Pricing */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Account Info Form */}
              <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl md:shadow-2xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.005] md:hover:scale-[1.01] overflow-hidden">
                {/* Enhanced Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/10 via-transparent to-primary-200/10 rounded-2xl md:rounded-3xl"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-full blur-3xl animate-pulse group-hover:scale-110 transition-transform duration-700"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
                    <div className="p-1.5 sm:p-2 bg-primary-100/20 rounded-lg">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-100" />
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      Account Information
                    </h2>
                  </div>

                  <div className="space-y-4 sm:space-y-5 md:space-y-6">
                    {/* Username */}
                    <div>
                      <label className="block text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                        Username RBX *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 sm:left-4 top-3 sm:top-4 w-4 h-4 sm:w-5 sm:h-5 text-primary-200 z-10" />
                        <input
                          type="text"
                          placeholder="Masukkan Username RBX"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 bg-primary-800/30 border-2 rounded-lg sm:rounded-xl text-white placeholder-primary-200/60 focus:ring-2 focus:ring-primary-100/20 focus:outline-none transition-all duration-300 text-sm sm:text-base ${
                            userInfo
                              ? "border-emerald-500/60 bg-emerald-500/10"
                              : username && userSearchError
                              ? "border-red-500/60 bg-red-500/10"
                              : "border-primary-100/40 focus:border-primary-100"
                          }`}
                        />
                        {/* Status Icon */}
                        <div className="absolute right-3 sm:right-4 top-3 sm:top-4">
                          {isSearchingUser ? (
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary-100" />
                          ) : userInfo ? (
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                          ) : username && userSearchError ? (
                            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
                          ) : (
                            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-primary-200/60" />
                          )}
                        </div>
                      </div>

                      {/* Status Messages */}
                      {username && username.length >= 2 && (
                        <div className="mt-2">
                          {isSearchingUser && (
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-yellow-400">
                              <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                              <span>Mencari username...</span>
                            </div>
                          )}
                          {!isSearchingUser && userInfo && (
                            <div className="flex items-center gap-3 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg sm:rounded-xl">
                              {/* User Avatar */}
                              {userInfo.avatar ? (
                                <img
                                  src={userInfo.avatar}
                                  alt={userInfo.username}
                                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-slate-600 ring-2 ring-emerald-400/60 object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-500/20 flex items-center justify-center ring-2 ring-emerald-400/60 flex-shrink-0">
                                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                                </div>
                              )}

                              {/* User Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm sm:text-base text-white font-bold truncate">
                                  {userInfo.username}
                                </p>
                                <p className="text-xs text-emerald-300">
                                  ID: {userInfo.id}
                                </p>
                                {userInfo.displayName &&
                                  userInfo.displayName !==
                                    userInfo.username && (
                                    <p className="text-xs text-emerald-300 truncate">
                                      Display: {userInfo.displayName}
                                    </p>
                                  )}
                              </div>

                              {/* Check Icon */}
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 flex-shrink-0" />
                            </div>
                          )}
                          {!isSearchingUser && userSearchError && (
                            <div className="flex items-start gap-2 p-2 sm:p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm text-red-400 font-semibold">
                                  User tidak ditemukan
                                </p>
                                <p className="text-xs text-white/70 mt-1">
                                  API Robloxxnya Lagi Limit, Coba Sebentar Lagi
                                  Ya
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Helper Text */}
                      {(!username || username.length < 2) && (
                        <p className="text-xs sm:text-sm text-primary-200/70 mt-2">
                          Ketik minimal 2 karakter untuk mencari username
                        </p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                        Password RBX *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 sm:left-4 top-3 sm:top-4 w-4 h-4 sm:w-5 sm:h-5 text-primary-200" />
                        <input
                          type="password"
                          placeholder="Masukkan Password RBX"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-primary-800/30 border-2 border-primary-100/40 rounded-lg sm:rounded-xl text-white placeholder-primary-200/60 focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 focus:outline-none transition-all duration-300 text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    {/* Backup Code */}
                    <div>
                      <label className="block text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
                        Backup Code
                        <span className="text-xs text-primary-200/70 font-normal ml-2">
                          (Opsional)
                        </span>
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-3 sm:left-4 top-3 sm:top-4 w-4 h-4 sm:w-5 sm:h-5 text-primary-200" />
                        <textarea
                          placeholder="Masukkan backup code jika akun memiliki 2-step verification"
                          value={additionalInfo}
                          onChange={(e) => setAdditionalInfo(e.target.value)}
                          rows={3}
                          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-primary-800/30 border-2 border-primary-100/40 rounded-lg sm:rounded-xl text-white placeholder-primary-200/60 focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 focus:outline-none transition-all duration-300 resize-none text-sm sm:text-base"
                        />
                      </div>
                      <p className="text-xs sm:text-sm text-primary-200/70 mt-2">
                        Cara lihat backup code:{" "}
                        <button
                          onClick={() => setShowVideoModal(true)}
                          className="text-primary-100 hover:text-primary-200 underline transition-colors cursor-pointer"
                        >
                          Klik di sini →
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Selection */}
              <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl md:shadow-2xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.005] md:hover:scale-[1.01] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100/10 via-transparent to-primary-200/10 rounded-2xl sm:rounded-3xl"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
                    <div className="p-1.5 sm:p-2 bg-primary-100/20 rounded-lg">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-primary-100" />
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      Pilih Layanan Joki
                    </h2>
                  </div>

                  {/* Search Bar for Items */}
                  {joki.item.length > 0 && (
                    <div className="mb-4 sm:mb-6">
                      <div className="relative group/search">
                        <input
                          type="text"
                          placeholder="Cari layanan atau item..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-9 sm:pl-11 pr-10 bg-primary-800/30 border-2 border-primary-100/40 rounded-lg sm:rounded-xl text-white placeholder-white/50 focus:border-primary-100 focus:ring-2 focus:ring-primary-100/20 focus:outline-none transition-all duration-300 text-xs sm:text-sm"
                        />
                        <svg
                          className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-primary-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-primary-100/20 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4 text-white/60 hover:text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                      {searchQuery && (
                        <div className="mt-2 text-xs sm:text-sm text-white/70">
                          Ditemukan{" "}
                          <span className="font-bold text-primary-100">
                            {filteredItems.length}
                          </span>{" "}
                          hasil
                        </div>
                      )}
                    </div>
                  )}

                  {joki.item.length > 0 ? (
                    <>
                      {filteredItems.length === 0 ? (
                        <div className="text-center py-12">
                          <svg
                            className="w-16 h-16 sm:w-20 sm:h-20 text-primary-200/50 mx-auto mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                          </svg>
                          <p className="text-white/70 mb-2">
                            Tidak ada hasil untuk &quot;{searchQuery}&quot;
                          </p>
                          <p className="text-white/50 text-sm mb-4">
                            Coba gunakan kata kunci lain
                          </p>
                          <button
                            onClick={() => setSearchQuery("")}
                            className="px-6 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-white rounded-lg hover:shadow-lg hover:shadow-primary-100/30 transition-all duration-300 font-semibold text-sm"
                          >
                            Tampilkan Semua
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 auto-rows-fr ">
                          {paginatedItems.map((item, idx) => {
                            const quantity = selectedItems[item.itemName] || 0;
                            const isSelected = quantity > 0;

                            return (
                              <div
                                key={idx}
                                className={`group/item relative bg-gradient-to-br from-primary-800/40 to-primary-700/30 border-2 rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-6 transition-all duration-500 overflow-hidden flex flex-col items-center gap-3 h-full min-h-[180px] sm:min-h-[200px] md:min-h-[280px] w-full ${
                                  isSelected
                                    ? "border-primary-100 bg-gradient-to-br from-primary-500/30 to-primary-600/20 shadow-xl md:shadow-2xl shadow-primary-100/20 md:shadow-primary-100/30 scale-[1.01] md:scale-105"
                                    : "border-primary-100/30 hover:border-primary-100/60 hover:bg-gradient-to-br hover:from-primary-800/60 hover:to-primary-700/50 hover:scale-[1.005] md:hover:scale-102"
                                }`}
                              >
                                {/* Card glow effect */}
                                <div
                                  className={`absolute inset-0 bg-gradient-to-br from-primary-100/10 to-primary-200/5 rounded-2xl transition-opacity duration-300 ${
                                    isSelected
                                      ? "opacity-100"
                                      : "opacity-0 group-hover/item:opacity-100"
                                  }`}
                                ></div>

                                {/* Floating particles for selected items */}
                                {isSelected && (
                                  <>
                                    <div className="absolute top-4 left-4 w-1 h-1 bg-primary-100/70 rounded-full animate-ping"></div>
                                    <div className="absolute top-6 left-8 w-1.5 h-1.5 bg-primary-200/60 rounded-full animate-ping delay-300"></div>
                                    <div className="absolute bottom-4 right-4 w-1 h-1 bg-primary-100/80 rounded-full animate-ping delay-500"></div>
                                  </>
                                )}

                                {/* Requirements Icon Only */}
                                <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 md:top-4 md:right-4 z-20">
                                  {/* Icon Syarat & Proses */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedItemModal(item);
                                      setShowModal(true);
                                    }}
                                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 hover:border-blue-400/60 rounded sm:rounded-md md:rounded-lg text-blue-400 hover:text-blue-300 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
                                    title="Lihat Syarat & Proses"
                                  >
                                    <FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                                  </button>
                                </div>

                                {/* Item Image */}
                                <div className="relative w-full h-20 sm:h-24 md:h-36 rounded-md sm:rounded-lg md:rounded-xl overflow-hidden mb-1.5 sm:mb-2 md:mb-4 border border-primary-100/20 shadow group-hover/item:shadow-lg transition-all duration-300">
                                  <Image
                                    src={item.imgUrl}
                                    alt={item.itemName}
                                    fill
                                    loading="lazy"
                                    className="object-fill group-hover/item:scale-110 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 via-transparent to-primary-100/10"></div>
                                </div>

                                {/* Item Info */}
                                <div className="relative z-10 flex-1 flex flex-col items-center gap-2 w-full">
                                  <h4 className="font-bold text-center text-white mb-1 sm:mb-1.5 md:mb-2 text-xs sm:text-sm md:text-lg line-clamp-1 sm:line-clamp-2 leading-tight">
                                    {item.itemName}
                                  </h4>

                                  <div className="flex items-center justify-center mb-1 sm:mb-2 md:mb-4">
                                    <div className="flex items-center gap-0.5 sm:gap-1">
                                      {/* <Gem className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-primary-100" /> */}
                                      <span className="text-white font-bold text-xs sm:text-xs md:text-lg">
                                        Rp {item.price.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Spacer untuk push button ke bawah */}
                                  <div className="flex-1 min-h-[1px]"></div>

                                  {/* Tombol Pilih / Selected Status - Always at bottom */}
                                  <div className="mt-auto w-full">
                                    {!isSelected ? (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateQuantity(item.itemName, 1);
                                        }}
                                        className="w-full py-1.5 sm:py-2 md:py-3 px-1.5 sm:px-2 md:px-4 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 hover:scale-105 shadow hover:shadow-lg md:hover:shadow-primary-100/30 flex items-center justify-center gap-1 text-xs sm:text-xs md:text-base"
                                      >
                                        <span className="inline">Pilih</span>
                                        {/* <span className="sm:hidden">+</span> */}
                                      </button>
                                    ) : (
                                      <div className="w-full p-1 sm:p-1.5 md:p-3 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/40 rounded-md sm:rounded-lg md:rounded-xl">
                                        <div className="flex items-center justify-center gap-1 text-green-400">
                                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5" />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Quantity Controls - Only show when selected */}
                                  {isSelected && (
                                    <div className="w-full mt-1 sm:mt-2 md:mt-4 p-1.5 sm:p-2 md:p-4 bg-gradient-to-r from-primary-500/30 to-primary-600/20 rounded-md sm:rounded-lg md:rounded-xl border border-primary-100/40 backdrop-blur-sm">
                                      <div className="flex items-center justify-between mb-1 sm:mb-1.5 md:mb-3">
                                        <span className="text-xs md:text-sm font-bold text-primary-100 flex items-center gap-0.5 sm:gap-1">
                                          <span className="hidden sm:inline">
                                            Qty:
                                          </span>
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeItem(item.itemName);
                                          }}
                                          className="px-1 sm:px-1.5 md:px-3 py-0.5 md:py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 hover:border-red-400/60 rounded text-red-400 hover:text-red-300 transition-all duration-300 text-xs font-medium flex items-center gap-0.5 sm:gap-1"
                                        >
                                          <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                          <span className="hidden md:inline">
                                            Batal
                                          </span>
                                        </button>
                                      </div>
                                      <div className="flex items-center justify-center gap-1 sm:gap-2 md:gap-3">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateQuantity(item.itemName, -1);
                                          }}
                                          className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 bg-gradient-to-r from-red-500/30 to-red-600/30 hover:from-red-600/30 hover:to-red-700/30 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow hover:shadow-lg md:hover:shadow-xl hover:scale-110"
                                        >
                                          <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5" />
                                        </button>
                                        <div className="w-6 h-5 sm:w-7 sm:h-6 md:w-12 md:h-10 bg-gradient-to-r from-primary-100/30 to-primary-200/30 border border-primary-100 rounded sm:rounded-md md:rounded-lg flex items-center justify-center">
                                          <span className="font-black text-white text-xs sm:text-sm md:text-lg">
                                            {quantity}
                                          </span>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateQuantity(item.itemName, 1);
                                          }}
                                          className="w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 bg-gradient-to-r from-green-500/30  to-green-600/30 hover:from-green-600/30 hover:to-green-700/30 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow hover:shadow-lg md:hover:shadow-xl hover:scale-110"
                                        >
                                          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-5 md:h-5" />
                                        </button>
                                      </div>

                                      {/* Subtotal */}
                                      <div className="mt-1 sm:mt-1.5 md:mt-3 pt-1 sm:pt-1.5 md:pt-3 border-t border-primary-100/30">
                                        <div className="flex flex-col items-start md:items-center">
                                          <span className="text-primary-200 text-xs md:text-sm">
                                            Total:
                                          </span>
                                          <span className="text-primary-100 font-bold text-xs sm:text-sm md:text-lg">
                                            Rp{" "}
                                            {(
                                              item.price * quantity
                                            ).toLocaleString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Pagination Controls */}
                      {filteredItems.length > ITEMS_PER_PAGE && (
                        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3">
                          {/* Previous Button */}
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className={`group/nav flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all duration-300 text-xs sm:text-base ${
                              currentPage === 1
                                ? "bg-primary-800/30 text-primary-300/50 cursor-not-allowed"
                                : "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 hover:from-primary-200 hover:to-primary-100 hover:scale-105 shadow-lg hover:shadow-primary-100/30"
                            }`}
                          >
                            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>

                          {/* Page Numbers with Ellipsis */}
                          <div className="flex items-center gap-1 sm:gap-2">
                            {/* First Page */}
                            <button
                              onClick={() => setCurrentPage(1)}
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-bold transition-all duration-300 text-xs sm:text-base ${
                                currentPage === 1
                                  ? "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 shadow-lg shadow-primary-100/30 scale-110"
                                  : "bg-primary-800/30 text-white hover:bg-primary-700/50 hover:scale-105"
                              }`}
                            >
                              1
                            </button>

                            {/* Left Ellipsis */}
                            {currentPage > 2 && (
                              <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white text-xs sm:text-base">
                                ...
                              </span>
                            )}

                            {/* Desktop: Show 3 pages centered on current (only if not first or last) */}
                            <div className="hidden sm:flex items-center gap-2">
                              {currentPage > 2 &&
                                currentPage < totalPages - 1 && (
                                  <>
                                    {currentPage > 2 && (
                                      <button
                                        onClick={() =>
                                          setCurrentPage(currentPage - 1)
                                        }
                                        className="w-10 h-10 rounded-xl font-bold transition-all duration-300 bg-primary-800/30 text-white hover:bg-primary-700/50 hover:scale-105"
                                      >
                                        {currentPage - 1}
                                      </button>
                                    )}
                                    <button
                                      onClick={() =>
                                        setCurrentPage(currentPage)
                                      }
                                      className="w-10 h-10 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 shadow-lg shadow-primary-100/30 scale-110"
                                    >
                                      {currentPage}
                                    </button>
                                    {currentPage < totalPages - 1 && (
                                      <button
                                        onClick={() =>
                                          setCurrentPage(currentPage + 1)
                                        }
                                        className="w-10 h-10 rounded-xl font-bold transition-all duration-300 bg-primary-800/30 text-white hover:bg-primary-700/50 hover:scale-105"
                                      >
                                        {currentPage + 1}
                                      </button>
                                    )}
                                  </>
                                )}
                              {currentPage === 2 && totalPages > 2 && (
                                <button
                                  onClick={() => setCurrentPage(2)}
                                  className="w-10 h-10 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 shadow-lg shadow-primary-100/30 scale-110"
                                >
                                  2
                                </button>
                              )}
                              {currentPage === totalPages - 1 &&
                                totalPages > 2 && (
                                  <button
                                    onClick={() =>
                                      setCurrentPage(totalPages - 1)
                                    }
                                    className="w-10 h-10 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 shadow-lg shadow-primary-100/30 scale-110"
                                  >
                                    {totalPages - 1}
                                  </button>
                                )}
                            </div>

                            {/* Mobile: Show only current page (only if not first or last) */}
                            <div className="flex sm:hidden items-center gap-1">
                              {currentPage > 1 && currentPage < totalPages && (
                                <button
                                  onClick={() => setCurrentPage(currentPage)}
                                  className="w-8 h-8 rounded-lg font-bold transition-all duration-300 text-xs bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 shadow-lg shadow-primary-100/30 scale-110"
                                >
                                  {currentPage}
                                </button>
                              )}
                            </div>

                            {/* Right Ellipsis */}
                            {currentPage < totalPages - 1 && (
                              <span className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-white text-xs sm:text-base">
                                ...
                              </span>
                            )}

                            {/* Last Page */}
                            {totalPages > 1 && (
                              <button
                                onClick={() => setCurrentPage(totalPages)}
                                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl font-bold transition-all duration-300 text-xs sm:text-base ${
                                  currentPage === totalPages
                                    ? "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 shadow-lg shadow-primary-100/30 scale-110"
                                    : "bg-primary-800/30 text-white hover:bg-primary-700/50 hover:scale-105"
                                }`}
                              >
                                {totalPages}
                              </button>
                            )}
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className={`group/nav flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold transition-all duration-300 text-xs sm:text-base ${
                              currentPage === totalPages
                                ? "bg-primary-800/30 text-primary-300/50 cursor-not-allowed"
                                : "bg-gradient-to-r from-primary-100 to-primary-200 text-primary-900 hover:from-primary-200 hover:to-primary-100 hover:scale-105 shadow-lg hover:shadow-primary-100/30"
                            }`}
                          >
                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      )}

                      {/* Pagination Info */}
                      {filteredItems.length > 0 && (
                        <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-primary-200">
                          Menampilkan {startIndex + 1}-
                          {Math.min(endIndex, filteredItems.length)} dari{" "}
                          {filteredItems.length} item
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Gem className="w-16 h-16 text-primary-200/50 mx-auto mb-4" />
                      <p className="text-white/70 text-lg">
                        Belum ada layanan tersedia untuk game ini
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning */}
              <div className="group relative bg-gradient-to-br from-red-900/60 via-red-800/40 to-red-700/50 backdrop-blur-2xl border-2 border-red-400/40 rounded-3xl p-8 shadow-2xl shadow-red-400/20 transition-all duration-500 hover:shadow-red-400/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/8 via-transparent to-red-500/8 rounded-3xl"></div>

                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="p-2 hidden md:block bg-red-500/20 rounded-lg flex-shrink-0">
                      <Shield className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-3">
                        Perhatian!
                      </h3>
                      <p className="text-white/90 leading-relaxed">
                        Pastikan akun RBX Anda aman dan tidak sedang digunakan
                        oleh orang lain. Kami tidak bertanggung jawab atas
                        kehilangan item atau ban yang disebabkan oleh
                        pelanggaran Terms of Service RBX.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary & Purchase Button */}
              {hasSelectedItems && (
                <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-8 shadow-2xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 overflow-hidden">
                  {/* Enhanced Background Effects */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-100/10 via-transparent to-primary-200/10 rounded-3xl"></div>
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-full blur-3xl animate-pulse group-hover:scale-110 transition-transform duration-700"></div>

                  {/* Sparkle effects */}
                  <div className="absolute top-6 right-6 w-1.5 h-1.5 bg-primary-100/80 rounded-full animate-ping delay-300"></div>
                  <div className="absolute bottom-8 left-6 w-1 h-1 bg-primary-200/70 rounded-full animate-ping delay-700"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-primary-100/20 rounded-lg">
                        <ShoppingCart className="w-6 h-6 text-primary-100" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        Order Summary
                      </h3>
                      <div className="ml-auto px-3 py-1 bg-primary-100/20 rounded-full text-primary-100 text-sm font-bold">
                        {selectedItemsArray.length} items
                      </div>
                    </div>

                    {/* Selected Items List */}
                    <div className="space-y-4 mb-6">
                      {selectedItemsArray.map((itemName) => {
                        const item = joki!.item.find(
                          (i) => i.itemName === itemName
                        );
                        const quantity = selectedItems[itemName];
                        if (!item) return null;

                        return (
                          <div
                            key={itemName}
                            className="group/summary-item flex items-center justify-between p-4 bg-primary-800/30 rounded-xl border border-primary-100/20 hover:border-primary-100/40 hover:bg-primary-800/50 transition-all duration-300"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-primary-100/30 flex-shrink-0">
                                <Image
                                  src={item.imgUrl}
                                  alt={item.itemName}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover group-hover/summary-item:scale-110 transition-transform duration-300"
                                />
                              </div>
                              <div>
                                <h4 className="text-white font-semibold">
                                  {item.itemName}
                                </h4>
                                <p className="text-primary-200/70 text-sm">
                                  Rp {item.price.toLocaleString()} × {quantity}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-bold">
                                Rp {(item.price * quantity).toLocaleString()}
                              </p>
                              <button
                                onClick={() => removeItem(itemName)}
                                className="text-red-400 hover:text-red-300 text-sm transition-colors flex items-center gap-1 mt-1"
                              >
                                <X className="w-3 h-3" />
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Total */}
                    <div className="border-t border-primary-100/20 pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-primary-200">Total Items:</span>
                        <span className="text-white font-semibold">
                          {totalQuantity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-2xl font-bold p-4 bg-primary-100/10 rounded-xl border border-primary-100/30">
                        <span className="text-white">Total Price:</span>
                        <span className="text-primary-100 flex items-center gap-2">
                          <Gem className="w-6 h-6" />
                          Rp {totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!isFormValid || isAddingToCart}
                  className={`group/btn relative flex-1 font-bold py-6 px-8 rounded-2xl transition-all duration-500 overflow-hidden ${
                    isFormValid && !isAddingToCart
                      ? "bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 hover:from-primary-700 hover:via-primary-600 hover:to-primary-700 text-white shadow-2xl shadow-primary-600/40 hover:shadow-primary-600/60 transform hover:scale-105 hover:-translate-y-1"
                      : "bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  {isFormValid && !isAddingToCart && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute top-2 left-4 w-1 h-1 bg-primary-100/60 rounded-full animate-ping"></div>
                      <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-primary-200/70 rounded-full animate-ping delay-300"></div>
                      <div className="absolute bottom-2 left-8 w-1 h-1 bg-primary-100/50 rounded-full animate-ping delay-500"></div>
                    </>
                  )}

                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <ShoppingCart className="w-6 h-6" />
                    <span className="text-lg">
                      {isAddingToCart
                        ? "Menambahkan..."
                        : "Tambah ke Keranjang"}
                    </span>
                  </div>
                </button>

                {/* Buy Now Button */}
                <button
                  onClick={handlePurchase}
                  disabled={!isFormValid}
                  className={`group/btn relative flex-1 font-bold py-6 px-8 rounded-2xl transition-all duration-500 overflow-hidden ${
                    isFormValid
                      ? "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-primary-900 shadow-2xl shadow-primary-100/40 hover:shadow-primary-100/60 transform hover:scale-105 hover:-translate-y-1"
                      : "bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-50"
                  }`}
                >
                  {/* Enhanced button effects */}
                  {isFormValid && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-primary-100/10 to-primary-200/10"></div>
                    </>
                  )}

                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <Zap className="w-6 h-6" />
                    <span className="text-lg">
                      {hasSelectedItems
                        ? `Beli Sekarang`
                        : "Pilih layanan terlebih dahulu"}
                    </span>
                    {isFormValid && hasSelectedItems && (
                      <div className="px-3 py-1 bg-primary-900/30 backdrop-blur-sm rounded-lg border border-primary-900/40">
                        <span className="text-sm font-black">
                          Rp {totalPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sparkle effects */}
                  {isFormValid && (
                    <>
                      <div className="absolute top-2 right-2 w-1 h-1 bg-primary-900 rounded-full animate-ping"></div>
                      <div className="absolute bottom-2 left-2 w-1 h-1 bg-primary-900 rounded-full animate-ping delay-500"></div>
                    </>
                  )}
                </button>
              </div>

              {/* Review Section */}
              {joki && isShowReview && (
                <ReviewSection
                  serviceType="joki"
                  serviceId={joki._id}
                  serviceName={joki.gameName}
                  title={`Reviews ${joki.gameName}`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Modal untuk Syarat & Proses */}
        {showModal && selectedItemModal && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4 modal-backdrop"
            onClick={() => setShowModal(false)}
          >
            <div
              className="group relative bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-700/95 backdrop-blur-2xl border-2 border-primary-100/40 rounded-t-2xl sm:rounded-3xl w-full max-w-4xl max-h-[90vh] sm:max-h-[85vh] shadow-2xl shadow-primary-100/20 z-[9999] transform-gpu modal-content flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Enhanced Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-100/10 via-transparent to-primary-200/10 rounded-t-2xl sm:rounded-3xl"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-tr from-primary-200/15 to-primary-100/10 rounded-full blur-2xl animate-pulse delay-500"></div>

              {/* Enhanced Sparkle effects with modal animation */}
              <div className="absolute top-8 right-8 w-2 h-2 bg-primary-100 rounded-full modal-sparkle opacity-75"></div>
              <div className="absolute top-12 right-16 w-1 h-1 bg-primary-200 rounded-full modal-sparkle delay-300 opacity-60"></div>
              <div className="absolute bottom-12 left-8 w-1.5 h-1.5 bg-primary-100/80 rounded-full modal-sparkle delay-700"></div>
              <div className="absolute top-20 left-12 w-1 h-1 bg-primary-200/70 rounded-full modal-sparkle delay-1000"></div>
              <div className="absolute bottom-20 right-12 w-1.5 h-1.5 bg-primary-100/60 rounded-full modal-sparkle delay-500"></div>
              <div className="absolute top-1/3 right-8 w-1 h-1 bg-primary-100/50 rounded-full modal-sparkle delay-1200"></div>

              {/* Modal Layout with Fixed Header & Footer */}
              <div className="relative z-10 flex flex-col flex-1 min-h-0">
                {/* Fixed Header */}
                <div className="flex-shrink-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-700/95 backdrop-blur-xl border-b border-primary-100/20">
                  <div className="flex items-center justify-between p-3 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-4">
                      <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border-2 border-primary-100/30">
                        <Image
                          src={selectedItemModal.imgUrl}
                          alt={selectedItemModal.itemName}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-1 truncate">
                          {selectedItemModal.itemName}
                        </h3>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-primary-100 fill-current flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-primary-200 font-medium truncate">
                            Premium Service
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 sm:p-3 hover:bg-red-500/20 rounded-lg sm:rounded-xl transition-colors duration-300 group/close flex-shrink-0 ml-2"
                    >
                      <X className="w-4 h-4 sm:w-6 sm:h-6 text-red-400 group-hover/close:text-red-300" />
                    </button>
                  </div>
                </div>

                {/* Scrollable Content Area - This is the scrollable part */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-6 md:p-8">
                  <div className="space-y-3 sm:space-y-6">
                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
                      {/* Deskripsi & Syarat */}
                      <div className="group/section relative bg-gradient-to-br from-primary-800/40 to-primary-700/30 rounded-lg sm:rounded-2xl p-3 sm:p-6 border border-primary-100/20">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                          <div className="p-1 sm:p-2 bg-blue-500/20 rounded-lg">
                            <FileText className="w-3 h-3 sm:w-5 sm:h-5 text-blue-400" />
                          </div>
                          <h4 className="text-sm sm:text-lg font-bold text-white">
                            Deskripsi & Syarat
                          </h4>
                        </div>
                        <div className="space-y-2 sm:space-y-4">
                          {/* Deskripsi */}
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-primary-100 mb-1 sm:mb-2">
                              Deskripsi Layanan:
                            </h5>
                            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
                              {selectedItemModal.description}
                            </p>
                          </div>

                          {/* Syarat */}
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-red-400 mb-1 sm:mb-2">
                              Syarat Joki:
                            </h5>
                            <ul className="space-y-1 sm:space-y-2">
                              {getItemRequirements(
                                selectedItemModal.itemName
                              ).map((requirement, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 sm:gap-3"
                                >
                                  <span className="flex-shrink-0 w-3 h-3 sm:w-4 sm:h-4 bg-red-500/20 rounded-full flex items-center justify-center text-red-400 font-bold text-xs mt-0.5">
                                    {index + 1}
                                  </span>
                                  <span className="text-white/90 text-xs sm:text-sm leading-relaxed break-words">
                                    {requirement}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Proses Joki */}
                      <div className="group/section relative bg-gradient-to-br from-primary-800/40 to-primary-700/30 rounded-lg sm:rounded-2xl p-3 sm:p-6 border border-primary-100/20">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                          <div className="p-1 sm:p-2 bg-green-500/20 rounded-lg">
                            <Zap className="w-3 h-3 sm:w-5 sm:h-5 text-green-400" />
                          </div>
                          <h4 className="text-sm sm:text-lg font-bold text-white">
                            Proses Joki
                          </h4>
                        </div>
                        <div>
                          <ul className="space-y-1 sm:space-y-2">
                            {getItemProcess(selectedItemModal.itemName).map(
                              (process, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 sm:gap-3"
                                >
                                  <span className="flex-shrink-0 w-4 h-4 sm:w-5 sm:h-5 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold text-xs mt-0.5">
                                    {index + 1}
                                  </span>
                                  <span className="text-white/90 text-xs sm:text-sm leading-relaxed break-words">
                                    {process}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fixed Footer */}
                <div className="flex-shrink-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-700/95 backdrop-blur-xl border-t border-primary-100/20">
                  <div className="p-3 sm:p-6 md:p-8 space-y-2 sm:space-y-4">
                    {/* Price Info */}
                    <div className="flex items-center justify-between p-2 sm:p-4 bg-primary-100/10 rounded-lg sm:rounded-xl border border-primary-100/30">
                      <span className="text-white font-semibold text-xs sm:text-base">
                        Harga Service:
                      </span>
                      <span className="text-lg sm:text-2xl font-bold text-primary-100">
                        Rp {selectedItemModal.price.toLocaleString()}
                      </span>
                    </div>

                    {/* Close Button */}
                    <div className="text-center">
                      <button
                        onClick={() => setShowModal(false)}
                        className="w-full sm:w-auto px-4 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary-100/30 text-sm sm:text-base"
                      >
                        Mengerti
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Tutorial Modal */}
        {showVideoModal && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowVideoModal(false)}
            style={{
              animation: "fadeIn 0.3s ease-out",
            }}
          >
            <div
              className="relative w-full max-w-2xl bg-gradient-to-br from-primary-500/30 to-primary-600/30 backdrop-blur-xl rounded-2xl shadow-2xl border border-primary-100/20 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              style={{
                animation: "scaleIn 0.3s ease-out",
              }}
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-100 via-primary-200 to-primary-100"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-100/20 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary-200/20 rounded-full blur-3xl"></div>

              {/* Header */}
              <div className="relative p-6 border-b border-primary-100/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100/20 rounded-lg">
                    <svg
                      className="w-6 h-6 text-primary-100"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">
                      Tutorial Backup Code
                    </h3>
                    <p className="text-sm text-white/60 mt-1">
                      Pelajari cara mendapatkan backup code
                    </p>
                  </div>
                  <button
                    onClick={() => setShowVideoModal(false)}
                    className="p-2 hover:bg-primary-100/10 rounded-lg transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-white/60 hover:text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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
              </div>

              {/* Video Content */}
              <div className="relative p-6">
                <div className="relative aspect-video bg-black/30 rounded-xl overflow-hidden border border-primary-100/10">
                  <iframe
                    width="100%"
                    height="360"
                    src="https://www.youtube.com/embed/0N-1478Qki0"
                    title="Tutorial Backup Code"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                </div>

                {/* Info Box */}
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <svg
                        className="w-5 h-5 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white/80 leading-relaxed">
                        <span className="font-semibold text-white">
                          Penting:
                        </span>{" "}
                        Backup code diperlukan jika akun Anda menggunakan
                        verifikasi 2 langkah (2FA). Ikuti tutorial video di atas
                        untuk mendapatkan backup code dari akun Roblox Anda.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="relative p-6 border-t border-primary-100/20 bg-primary-500/10">
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-primary-100/30"
                >
                  Mengerti
                </button>
              </div>

              {/* Sparkle Effects */}
              <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-pulse"></div>
              <div
                className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary-100 rounded-full"
                style={{
                  animation: "sparkleAnimation 2s ease-in-out infinite",
                }}
              ></div>
              <div
                className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-primary-200 rounded-full"
                style={{
                  animation: "sparkleAnimation 2.5s ease-in-out infinite",
                }}
              ></div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
