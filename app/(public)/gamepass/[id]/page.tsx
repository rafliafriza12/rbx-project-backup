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
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import ReviewSection from "@/components/ReviewSection";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";

interface GamepassItem {
  itemName: string;
  imgUrl: string;
  price: number;
}

interface SelectedItem extends GamepassItem {
  quantity: number;
}

interface Gamepass {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  showOnHomepage: boolean;
  developer: string;
  item: GamepassItem[];
}

export default function GamepassDetailPage() {
  const { user } = useAuth();
  const [isShowReview, setIsShowReview] = useState<boolean>(false);
  const [gamepass, setGamepass] = useState<Gamepass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [username, setUsername] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState("");

  // User search states
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  const params = useParams();
  const router = useRouter();
  const gamepassId = params.id as string;

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
  const isFormValid =
    selectedItems.length > 0 && username.trim() !== "" && userInfo !== null;

  // Calculate total price
  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  // Function to handle item selection
  const handleItemSelect = (item: GamepassItem) => {
    const existingIndex = selectedItems.findIndex(
      (selected) => selected.itemName === item.itemName
    );

    if (existingIndex >= 0) {
      // Item already selected, remove it
      setSelectedItems((prev) =>
        prev.filter((_, index) => index !== existingIndex)
      );
    } else {
      // Add new item with quantity 1
      setSelectedItems((prev) => [...prev, { ...item, quantity: 1 }]);
    }
  };

  // Function to update quantity
  const updateQuantity = (itemName: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Remove item if quantity becomes 0
      setSelectedItems((prev) =>
        prev.filter((item) => item.itemName !== itemName)
      );
      return;
    }

    setSelectedItems((prev) =>
      prev.map((item) =>
        item.itemName === itemName ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Function to check if item is selected
  const isItemSelected = (itemName: string) => {
    return selectedItems.some((item) => item.itemName === itemName);
  };

  // Function to get selected item quantity
  const getSelectedQuantity = (itemName: string) => {
    const item = selectedItems.find((item) => item.itemName === itemName);
    return item?.quantity || 0;
  };

  // Filter items based on search query
  const filteredItems =
    gamepass?.item.filter((item) => {
      const searchLower = itemSearchQuery.toLowerCase();
      return (
        item.itemName.toLowerCase().includes(searchLower) ||
        item.price.toString().includes(searchLower)
      );
    }) || [];

  useEffect(() => {
    if (gamepassId) {
      fetchGamepass();
    }
  }, [gamepassId]);

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

  const fetchGamepass = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gamepass/${gamepassId}`);
      const data = await response.json();

      if (data.success) {
        setGamepass(data.data);
      } else {
        setError(data.error || "Gamepass tidak ditemukan");
      }
    } catch (error) {
      console.error("Error fetching gamepass:", error);
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isFormValid || selectedItems.length === 0 || !gamepass) {
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
      for (const item of selectedItems) {
        const cartItem = {
          userId: user.id, // Add userId from auth context
          serviceType: "gamepass",
          serviceId: gamepass._id,
          serviceName: `${gamepass.gameName} - ${item.itemName}`,
          serviceImage: item.imgUrl, // Use item image, not game image
          imgUrl: item.imgUrl, // Use item image, not game image
          serviceCategory: "gamepass",
          quantity: item.quantity,
          unitPrice: item.price,
          robloxUsername: username,
          robloxPassword: null,
          gamepassDetails: {
            gameName: gamepass.gameName,
            itemName: item.itemName,
            imgUrl: item.imgUrl,
            developer: gamepass.developer,
            caraPesan: gamepass.caraPesan,
          },
        };

        console.log("=== GAMEPASS ADD TO CART DEBUG ===");
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
        `${selectedItems.length} item berhasil ditambahkan ke keranjang!`
      );

      // Reset form
      setSelectedItems([]);
      setUsername("");
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error(error.message || "Gagal menambahkan ke keranjang");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handlePurchase = () => {
    if (!isFormValid || selectedItems.length === 0 || !gamepass) return;

    // Create array of checkout items for multi-item support
    const checkoutItems = selectedItems.map((item) => ({
      serviceType: "gamepass",
      serviceId: gamepass._id,
      serviceName: `${gamepass.gameName} - ${item.itemName}`,
      serviceImage: gamepass.imgUrl,
      serviceCategory: "gamepass", // Add serviceCategory
      quantity: item.quantity,
      unitPrice: item.price,
      robloxUsername: username,
      robloxPassword: null, // Gamepass tidak memerlukan password
      gamepassDetails: {
        gameName: gamepass.gameName,
        itemName: item.itemName,
        imgUrl: item.imgUrl,
        developer: gamepass.developer,
        caraPesan: gamepass.caraPesan,
      },
    }));

    // Store in sessionStorage for checkout page
    sessionStorage.setItem("checkoutData", JSON.stringify(checkoutItems));

    // Debug log
    console.log("Gamepass checkout data:", checkoutItems);

    router.push("/checkout");
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
              Loading Gamepass
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
              onClick={fetchGamepass}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!gamepass) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-primary-300 text-xl mb-4">
            Gamepass tidak ditemukan
          </p>
          <button
            onClick={() => router.push("/gamepass")}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Kembali ke Daftar Gamepass
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="text-white relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-100/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-primary-200/8 rounded-full blur-2xl animate-bounce delay-1000"></div>
        <div className="absolute bottom-40 left-32 w-28 h-28 bg-primary-100/6 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-40 w-20 h-20 bg-primary-200/10 rounded-full blur-xl animate-bounce delay-1500"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-primary-100/60 rounded-full animate-ping delay-300"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-primary-200/70 rounded-full animate-ping delay-700"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-primary-100/50 rounded-full animate-ping delay-1000"></div>
        <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-primary-200/60 rounded-full animate-ping delay-1300"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Game Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Game Image & Info */}
            <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-8 shadow-2xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.02] overflow-hidden">
              {/* Enhanced Background Effects */}
              <div className="absolute z-[-1] inset-0 bg-gradient-to-br from-primary-100/10 via-transparent to-primary-200/10 rounded-3xl"></div>
              <div className="absolute z-[-2] -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-full blur-3xl animate-pulse group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute z-[-3] -bottom-20 -left-20 w-32 h-32 bg-gradient-to-tr from-primary-200/15 to-primary-100/10 rounded-full blur-2xl animate-pulse delay-500 group-hover:scale-110 transition-transform duration-700"></div>

              {/* Sparkle effects */}
              <div className="absolute top-8 right-8 w-2 h-2 bg-primary-100 rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-12 right-16 w-1 h-1 bg-primary-200 rounded-full animate-ping delay-300 opacity-60"></div>
              <div className="absolute bottom-12 left-8 w-1.5 h-1.5 bg-primary-100/80 rounded-full animate-ping delay-700"></div>

              <div className="relative z-10">
                {/* Game Image */}
                <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-8 border-2 border-primary-100/30 shadow-lg group-hover:shadow-xl transition-all duration-500">
                  <Image
                    src={gamepass.imgUrl}
                    alt={gamepass.gameName}
                    fill
                    className="object-fill group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 via-transparent to-primary-100/20"></div>

                  {/* Premium badge */}
                  {/* <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full text-white text-xs font-bold shadow-lg">
                    New
                  </div> */}
                </div>

                {/* Game Info */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl text-white font-bold mb-3">
                    {gamepass.gameName}
                  </h1>
                  <div className="flex items-center justify-center gap-2 text-primary-200">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">
                      {gamepass.developer}
                    </span>
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary-100/20 rounded-lg">
                      <Zap className="w-5 h-5 text-primary-100" />
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      Epic Features
                    </h3>
                  </div>
                  {/* <div className="space-y-3">
                    {gamepass.features.map((feature, index) => (
                      <div
                        key={index}
                        className="group/feature flex items-center gap-4 p-3 bg-primary-800/30 rounded-xl border border-primary-100/20 hover:border-primary-100/40 hover:bg-primary-800/50 transition-all duration-300"
                      >
                        <span className="text-sm text-white font-medium">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div> */}
                </div>
              </div>
              <button
                onClick={() => setIsShowReview(!isShowReview)}
                className="w-full py-1.5 sm:py-2 md:py-3 px-1.5 sm:px-2 md:px-4 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 hover:scale-[1.01] shadow hover:shadow-lg md:hover:shadow-primary-100/30 flex items-center justify-center gap-1 text-xs sm:text-xs md:text-base mt-4"
              >
                {isShowReview ? "Sembunyikan" : "Lihat"} Review
              </button>
            </div>
          </div>

          {/* Right Column - Items & Purchase */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cara Pesan Section */}
            <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-8 shadow-2xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.01] overflow-hidden">
              {/* Enhanced Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/8 via-transparent to-primary-200/8 rounded-3xl"></div>
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-200/15 to-primary-100/10 rounded-full blur-3xl animate-pulse delay-1000 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-gradient-to-tr from-primary-100/20 to-primary-200/10 rounded-full blur-2xl animate-pulse delay-500 group-hover:scale-110 transition-transform duration-700"></div>

              {/* Floating sparkles */}
              <div className="absolute top-6 right-12 w-1.5 h-1.5 bg-primary-100/70 rounded-full animate-ping delay-200"></div>
              <div className="absolute top-12 right-6 w-1 h-1 bg-primary-200/80 rounded-full animate-ping delay-600"></div>
              <div className="absolute bottom-8 left-12 w-1.5 h-1.5 bg-primary-100/60 rounded-full animate-ping delay-1000"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-2xl border border-primary-100/30 group-hover:scale-110 transition-transform duration-300">
                    <Gift className="w-7 h-7 text-primary-100" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      Cara Pesan
                    </h3>
                    <p className="text-white/80 text-sm">
                      Ikuti langkah mudah berikut
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gamepass.caraPesan.map((cara, index) => (
                    <div
                      key={index}
                      className="group/step relative flex items-start gap-4 p-4 bg-gradient-to-r from-primary-800/40 to-primary-700/30 rounded-2xl border border-primary-100/20 hover:border-primary-100/50 hover:bg-gradient-to-r hover:from-primary-800/60 hover:to-primary-700/50 transition-all duration-300 overflow-hidden"
                    >
                      {/* Step glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-100/5 to-primary-200/5 rounded-2xl opacity-0 group-hover/step:opacity-100 transition-opacity duration-300"></div>

                      <div className="relative flex-shrink-0 w-8 h-8 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg group-hover/step:scale-110 group-hover/step:shadow-primary-100/50 transition-all duration-300">
                        {index + 1}
                      </div>
                      <div className="relative">
                        <span className="text-base text-white leading-relaxed font-medium">
                          {cara}
                        </span>
                      </div>

                      {/* Step completion checkmark */}
                      <div className="absolute top-2 right-2 w-4 h-4 bg-primary-100/20 rounded-full flex items-center justify-center opacity-0 group-hover/step:opacity-100 transition-opacity duration-300">
                        <Check className="w-2.5 h-2.5 text-primary-100" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Username Input with Validation */}
            <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-8 shadow-2xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.01] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/8 via-transparent to-primary-200/8 rounded-3xl"></div>
              <div className="absolute -top-10 -right-10 w-20 h-20 bg-primary-100/10 rounded-full blur-xl animate-pulse"></div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-2xl border border-primary-100/30 group-hover:scale-110 transition-transform duration-300">
                    <User className="w-6 h-6 text-primary-100" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Username RBX <span className="text-red-400">*</span>
                    </h3>
                    <p className="text-white/80 text-sm">
                      Masukkan username Roblox Anda
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Input Field with Dynamic Border */}
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username Roblox..."
                      className={`w-full px-6 py-4 pr-14 bg-gradient-to-r from-primary-800/40 to-primary-700/30 border-2 rounded-2xl text-white placeholder-primary-300 focus:outline-none focus:ring-4 transition-all duration-300 text-lg font-medium ${
                        userInfo
                          ? "border-emerald-500 focus:border-emerald-400 focus:ring-emerald-500/20"
                          : userSearchError
                          ? "border-red-500 focus:border-red-400 focus:ring-red-500/20"
                          : "border-primary-100/30 focus:border-primary-100/70 focus:ring-primary-100/20"
                      }`}
                    />

                    {/* Status Icon */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      {isSearchingUser && (
                        <Loader2 className="w-5 h-5 text-primary-100 animate-spin" />
                      )}
                      {!isSearchingUser && userInfo && (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      )}
                      {!isSearchingUser && userSearchError && (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      {!isSearchingUser &&
                        !userInfo &&
                        !userSearchError &&
                        username.length >= 2 && (
                          <Search className="w-5 h-5 text-primary-200" />
                        )}
                    </div>
                  </div>

                  {/* Status Messages */}
                  <div className="min-h-[24px]">
                    {isSearchingUser && (
                      <div className="flex items-center gap-2 text-primary-200 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mencari username...</span>
                      </div>
                    )}

                    {!isSearchingUser && userInfo && (
                      <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        <span>Username ditemukan!</span>
                      </div>
                    )}

                    {!isSearchingUser && userSearchError && (
                      <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          API Robloxxnya Lagi Limit, Coba Sebentar Lagi Ya
                        </span>
                      </div>
                    )}

                    {!isSearchingUser &&
                      !userInfo &&
                      !userSearchError &&
                      username.length > 0 &&
                      username.length < 2 && (
                        <p className="text-primary-300 text-sm">
                          Minimal 2 karakter untuk pencarian
                        </p>
                      )}
                  </div>

                  {/* User Avatar Card */}
                  {userInfo && (
                    <div className="relative bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border-2 border-emerald-400/30 rounded-2xl p-4 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent"></div>

                      <div className="relative flex items-center gap-4">
                        {/* Avatar */}
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {userInfo.avatar ? (
                            <div className="relative w-full h-full rounded-xl overflow-hidden ring-2 ring-emerald-400/50">
                              <img
                                src={userInfo.avatar}
                                alt={userInfo.username}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center ring-2 ring-emerald-400/50">
                              <User className="w-6 h-6 text-white" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-primary-800 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-white font-bold text-base truncate">
                              {userInfo.username}
                            </p>
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          </div>
                          <p className="text-emerald-300 text-sm">
                            ID: {userInfo.id}
                          </p>
                          {userInfo.displayName &&
                            userInfo.displayName !== userInfo.username && (
                              <p className="text-primary-200 text-xs mt-0.5">
                                Display: {userInfo.displayName}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Grid */}
            <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-8 shadow-2xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.01] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-100/8 via-transparent to-primary-200/8 rounded-3xl"></div>
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-primary-100/15 to-primary-200/10 rounded-full blur-3xl animate-pulse group-hover:scale-110 transition-transform duration-700"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-2xl border border-primary-100/30 group-hover:scale-110 transition-transform duration-300">
                    <ShoppingCart className="w-7 h-7 text-primary-100" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      Pilih Item Gamepass
                    </h3>
                    <p className="text-primary-200 text-sm">
                      Pilih item yang ingin Anda beli (bisa lebih dari satu)
                    </p>
                  </div>
                </div>

                {/* Item Search Bar */}
                {gamepass.item.length > 0 && (
                  <div className="mb-6">
                    <div className="relative group/search">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-100/10 to-primary-200/10 rounded-xl blur-lg group-hover/search:blur-xl transition-all duration-300"></div>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari item gamepass..."
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          className="w-full px-4 py-3 pl-12 pr-10 bg-primary-800/30 backdrop-blur-sm border-2 border-primary-100/30 rounded-xl text-white placeholder-white/40 focus:border-primary-100/60 focus:ring-2 focus:ring-primary-100/20 focus:outline-none transition-all duration-300 text-sm"
                        />
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-200" />
                        {itemSearchQuery && (
                          <button
                            onClick={() => setItemSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-primary-100/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-white/60 hover:text-white" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Search Results Info */}
                    {itemSearchQuery && (
                      <div className="mt-2 text-xs text-white/60">
                        Ditemukan{" "}
                        <span className="font-bold text-primary-100">
                          {filteredItems.length}
                        </span>{" "}
                        dari {gamepass.item.length} item
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                  {filteredItems.length === 0 && itemSearchQuery ? (
                    <div className="col-span-full text-center py-12">
                      <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
                        <Search className="w-12 h-12 text-primary-100/50 mx-auto mb-3" />
                        <p className="text-white/70 mb-2">
                          Tidak ada item untuk &quot;{itemSearchQuery}&quot;
                        </p>
                        <button
                          onClick={() => setItemSearchQuery("")}
                          className="mt-3 px-4 py-2 bg-gradient-to-r from-primary-100 to-primary-200 text-white text-sm rounded-lg hover:from-primary-100/80 hover:to-primary-200/80 transition-all duration-300"
                        >
                          Hapus Pencarian
                        </button>
                      </div>
                    </div>
                  ) : (
                    filteredItems.map((item, index) => {
                      const isSelected = isItemSelected(item.itemName);
                      const quantity = getSelectedQuantity(item.itemName);

                      return (
                        <div
                          key={index}
                          className={`group/item relative bg-gradient-to-br from-primary-800/40 to-primary-700/30 border-2 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center justify-start gap-3 ${
                            isSelected
                              ? "border-primary-100 bg-gradient-to-br from-primary-500/30 to-primary-600/20 shadow-2xl shadow-primary-100/30 scale-105"
                              : "border-primary-100/30 hover:border-primary-100/60 hover:bg-gradient-to-br hover:from-primary-800/60 hover:to-primary-700/50 hover:scale-102"
                          }`}
                          onClick={() => handleItemSelect(item)}
                        >
                          {/* Card glow effect */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br from-primary-100/10 to-primary-200/5 rounded-xl sm:rounded-2xl transition-opacity duration-300 ${
                              isSelected
                                ? "opacity-100"
                                : "opacity-0 group-hover/item:opacity-100"
                            }`}
                          ></div>

                          {/* Floating particles for selected items */}
                          {isSelected && (
                            <>
                              <div className="absolute top-2 sm:top-4 left-2 sm:left-4 w-1 h-1 bg-primary-100/70 rounded-full animate-ping"></div>
                              <div className="absolute top-3 sm:top-6 left-4 sm:left-8 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-primary-200/60 rounded-full animate-ping delay-300"></div>
                              <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 w-1 h-1 bg-primary-100/80 rounded-full animate-ping delay-500"></div>
                            </>
                          )}

                          {/* Selection Indicator */}
                          <div
                            className={`absolute z-[3] top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-lg ${
                              isSelected
                                ? "border-primary-100 bg-gradient-to-r from-primary-100 to-primary-200 scale-110"
                                : "border-primary-100/60 bg-primary-800/50 group-hover/item:border-primary-100 group-hover/item:bg-primary-700/70"
                            }`}
                          >
                            {isSelected ? (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary-900 font-bold" />
                            ) : (
                              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary-100 group-hover/item:scale-110 transition-transform duration-300" />
                            )}
                          </div>

                          {/* Item Image */}
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full overflow-hidden mb-2 sm:mb-3 md:mb-4 border-2 border-primary-100/20 shadow-lg group-hover/item:shadow-xl transition-all duration-300 flex-shrink-0">
                            <Image
                              src={item.imgUrl}
                              alt={item.itemName}
                              fill
                              className="object-fill group-hover/item:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary-900/60 via-transparent to-primary-100/10"></div>
                          </div>

                          {/* Item Info - Always centered */}
                          <div className="relative z-10 w-full flex flex-col items-center text-center gap-3">
                            <h4 className="font-black text-white mb-1 sm:mb-2 text-xs sm:text-sm md:text-base line-clamp-2">
                              {item.itemName}
                            </h4>

                            <div className="flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                              <div className="flex items-center gap-1">
                                <Gem className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-primary-100" />
                                <span className="text-white font-bold text-xs sm:text-sm md:text-base">
                                  {item.price.toLocaleString()}
                                </span>
                              </div>
                            </div>

                            {/* Quantity Controls - Only show when selected */}
                            {isSelected && (
                              <div className="mt-2 sm:mt-3 md:mt-4 p-2 sm:p-3 md:p-3.5 bg-gradient-to-r from-primary-500/30 to-primary-600/20 rounded-lg sm:rounded-xl border border-primary-100/40 backdrop-blur-sm w-full">
                                <div className="flex flex-col gap-2 sm:gap-2.5 md:gap-3">
                                  <span className="text-[10px] sm:text-xs md:text-sm font-bold text-primary-100 flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2">
                                    <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 fill-current" />
                                    Quantity
                                  </span>
                                  <div className="flex items-center justify-center gap-1.5 sm:gap-2 md:gap-2.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateQuantity(
                                          item.itemName,
                                          quantity - 1
                                        );
                                      }}
                                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110"
                                    >
                                      <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                                    </button>
                                    <div className="w-7 h-6 sm:w-8 sm:h-7 md:w-9 md:h-8 bg-gradient-to-r from-primary-100 to-primary-200 rounded-md flex items-center justify-center">
                                      <span className="font-black text-primary-900 text-xs sm:text-sm md:text-base">
                                        {quantity}
                                      </span>
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateQuantity(
                                          item.itemName,
                                          quantity + 1
                                        );
                                      }}
                                      className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110"
                                    >
                                      <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Subtotal */}
                                <div className="mt-2 sm:mt-2.5 md:mt-3 pt-2 sm:pt-2.5 md:pt-3 border-t border-primary-100/30">
                                  <div className="flex flex-col sm:flex-row justify-between items-center gap-0.5 sm:gap-1">
                                    <span className="text-primary-200 text-[10px] sm:text-xs md:text-sm">
                                      Subtotal:
                                    </span>
                                    <span className="text-primary-100 font-bold text-xs sm:text-sm md:text-base">
                                      Rp{" "}
                                      {(item.price * quantity).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Selected Items Summary */}
            {selectedItems.length > 0 && (
              <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-8 shadow-2xl shadow-primary-100/20 transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.01] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-100/8 via-transparent to-primary-200/8 rounded-3xl"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary-100/10 rounded-full blur-2xl animate-pulse"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl border border-green-400/30">
                      <Check className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">
                        Ringkasan Pesanan
                      </h3>
                      <p className="text-primary-200 text-sm">
                        {selectedItems.length} item dipilih
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {selectedItems.map((item, index) => (
                      <div
                        key={index}
                        className="group/summary flex justify-between items-center bg-gradient-to-r from-primary-500/30 to-primary-600/20 rounded-2xl p-4 border border-primary-100/20 hover:border-primary-100/40 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-primary-900 font-black text-lg">
                            {item.quantity}
                          </div>
                          <div>
                            <p className="font-bold text-white">
                              {item.itemName}
                            </p>
                            <p className="text-sm text-primary-200">
                              {item.quantity} × Rp {item.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3">
                          <div>
                            <p className="font-black text-primary-100 text-lg">
                              Rp {(item.price * item.quantity).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleItemSelect(item)}
                            className="w-8 h-8 bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 hover:border-red-400/60 rounded-lg flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Total Section */}
                    <div className="mt-6 pt-6 border-t-2 border-primary-100/30">
                      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-2xl border border-primary-100/40">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-r from-primary-100 to-primary-200 rounded-lg">
                            <Gem className="w-6 h-6 text-primary-900" />
                          </div>
                          <span className="text-xl font-black text-white">
                            Total Pembayaran:
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-3xl font-black bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                            Rp {totalPrice.toLocaleString()}
                          </span>
                          <p className="text-sm text-primary-200 mt-1">
                            Sudah termasuk semua biaya
                          </p>
                        </div>
                      </div>
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
                className={`group relative flex-1 py-6 px-8 rounded-2xl font-black text-lg transition-all duration-500 overflow-hidden ${
                  isFormValid && !isAddingToCart
                    ? "bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 hover:from-primary-700 hover:via-primary-600 hover:to-primary-700 text-white shadow-2xl shadow-primary-600/40 hover:shadow-primary-600/60 transform hover:scale-105 hover:-translate-y-1"
                    : "bg-gradient-to-r from-gray-600/50 to-gray-700/50 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isFormValid && !isAddingToCart && (
                  <>
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary-100/20 via-primary-200/10 to-primary-100/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Floating particles */}
                    <div className="absolute top-2 left-4 w-1 h-1 bg-primary-100/60 rounded-full animate-ping"></div>
                    <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-primary-200/70 rounded-full animate-ping delay-300"></div>
                    <div className="absolute bottom-2 left-8 w-1 h-1 bg-primary-100/50 rounded-full animate-ping delay-500"></div>
                  </>
                )}

                <div className="relative flex items-center justify-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isFormValid && !isAddingToCart
                        ? "bg-white/20 group-hover:bg-white/30 group-hover:scale-110"
                        : "bg-gray-500/20"
                    }`}
                  >
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <span className="group-hover:scale-105 transition-transform duration-300">
                    {isAddingToCart ? "Menambahkan..." : "Tambah ke Keranjang"}
                  </span>
                </div>
              </button>

              {/* Buy Now Button */}
              <button
                onClick={handlePurchase}
                disabled={!isFormValid}
                className={`group relative flex-1 py-6 px-8 rounded-2xl font-black text-lg transition-all duration-500 overflow-hidden ${
                  isFormValid
                    ? "bg-gradient-to-r from-primary-100 via-primary-200 to-primary-100 hover:from-primary-200 hover:via-primary-100 hover:to-primary-200 text-primary-900 shadow-2xl shadow-primary-100/40 hover:shadow-primary-100/60 transform hover:scale-105 hover:-translate-y-1"
                    : "bg-gradient-to-r from-gray-600/50 to-gray-700/50 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isFormValid && (
                  <>
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Success particles */}
                    <div className="absolute top-2 right-4 w-1 h-1 bg-primary-900/60 rounded-full animate-bounce"></div>
                    <div className="absolute top-4 left-6 w-1.5 h-1.5 bg-primary-800/70 rounded-full animate-bounce delay-200"></div>
                    <div className="absolute bottom-2 right-8 w-1 h-1 bg-primary-900/50 rounded-full animate-bounce delay-400"></div>
                  </>
                )}

                <div className="relative flex items-center justify-center gap-3">
                  <div
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isFormValid
                        ? "bg-primary-900/20 group-hover:bg-primary-900/30 group-hover:scale-110"
                        : "bg-gray-500/20"
                    }`}
                  >
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="group-hover:scale-105 transition-transform duration-300">
                      Beli Sekarang
                    </span>
                    {isFormValid && (
                      <div className="px-3 py-1 bg-primary-900/30 backdrop-blur-sm rounded-lg border border-primary-900/40 group-hover:bg-primary-900/40 transition-all duration-300">
                        <span className="text-sm font-black">
                          Rp {totalPrice.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
            {isShowReview && (
              <div className="w-full">
                <ReviewSection
                  serviceType="gamepass"
                  title={`Reviews ${gamepass.gameName}`}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
    </main>
  );
}
