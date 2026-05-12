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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ReviewSection from "@/components/ReviewSection";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import { getGamepassBySlug, getGamepassById, addToCartAction } from "@/app/lib/actions";
import { getUserInfo } from "@/app/lib/actions";

import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import OrderSummaryCard from "@/components/checkout/OrderSummaryCard";
import {
  fetchPaymentSettings,
  fetchPaymentMethods,
  createMultiTransaction,
} from "@/app/checkout/actions";
import { PaymentCategory } from "@/lib/payment-helpers";
import { CreditCard, ArrowRight } from "lucide-react";

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
  slug: string;
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
  const [itemSearchQuery, setItemSearchQuery] = useState("");
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");

  // User search states
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Item search timeout
  const [itemSearchTimeout, setItemSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Checkout States
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [activePaymentGateway, setActivePaymentGateway] = useState<string>("");
  const [coinSpendValue, setCoinSpendValue] = useState<number>(1000);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [expandedCategory, setExpandedCategory] = useState<string>("qris");
  const [submitting, setSubmitting] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  const params = useParams();
  const router = useRouter();
  const gamepassSlug = params.slug as string;

  useEffect(() => {
    if (user) {
      if (!email) setEmail(user.email || "");
      if (!phone) setPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    if (paymentCategories.length > 0 && activePaymentGateway === "duitku") {
      const categoryOrder = ["qris", "ewallet", "virtual_account", "retail"];
      for (const cat of categoryOrder) {
        if (paymentCategories.some((pc) => pc.id === cat)) {
          setExpandedCategory(cat);
          break;
        }
      }
    }
  }, [paymentCategories, activePaymentGateway]);

  useEffect(() => {
    const loadPaymentData = async () => {
      setPaymentMethodsLoading(true);
      try {
        const settingsRes = await fetchPaymentSettings();
        if (settingsRes.success && settingsRes.settings) {
          const gateway = settingsRes.settings.activePaymentGateway;
          setActivePaymentGateway(gateway);
          if (settingsRes.settings.coinSpendValue) {
            setCoinSpendValue(settingsRes.settings.coinSpendValue);
          }

          const methodsRes = await fetchPaymentMethods(gateway);
          if (methodsRes.success && methodsRes.data) {
            const groupedMethods = methodsRes.data.reduce((acc: any, method: any) => {
              const category = method.category || "Lainnya";
              if (!acc[category]) {
                acc[category] = { id: category, name: category, methods: [] };
              }
              acc[category].methods.push({
                id: method.code,
                name: method.name,
                icon: method.icon,
                fee: method.fee,
                feeType: method.feeType,
                minimumAmount: method.minimumAmount,
                maximumAmount: method.maximumAmount,
              });
              return acc;
            }, {});
            const categories = Object.values(groupedMethods);
            if (user) {
              const coinCategory = {
                id: "internal",
                name: "Saldo Internal",
                methods: [
                  {
                    id: "RBXNET_COIN",
                    name: "RBXNET Credits",
                    icon: "/icon/dollar.png",
                    fee: 0,
                    feeType: "fixed",
                    description: `Saldo saat ini: ${user.balance || 0} Credits`,
                    minimumAmount: 0,
                    maximumAmount: 0,
                  }
                ]
              };
              setPaymentCategories([coinCategory, ...categories]);
            } else {
              setPaymentCategories(categories);
            }
          }
        }
      } catch (error) {
      } finally {
        setPaymentMethodsLoading(false);
      }
    };
    loadPaymentData();
  }, []);

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
      const { ok, data } = await getUserInfo(username.trim());
      if (data.success) {
        setUserInfo(data);
        setUserSearchError(null);
      } else {
        setUserInfo(null);
        setUserSearchError(data.message || "User tidak ditemukan");
      }
    } catch (error) {
      setUserSearchError("Terjadi kesalahan saat mencari user");
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Calculate total price
  const totalPrice = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const getDiscountAmount = () => {
    if (!user || !(user as any).diskon) return 0;
    return Math.round((totalPrice * (user as any).diskon) / 100);
  };

  const getPpnAmount = () => {
    return Math.round((totalPrice - getDiscountAmount() - promoDiscount) * 0.11);
  };

  const getPaymentFee = () => {
    if (selectedPaymentMethod && paymentCategories.length > 0) {
      const methodObj = paymentCategories.flatMap(c => c.methods || []).find(m => m.id === selectedPaymentMethod);
      if (methodObj) {
        const feeType = methodObj.feeType || "flat";
        const feeValue = Number(methodObj.fee) || 0;
        const baseAmount = totalPrice - getDiscountAmount();
        
        if (feeType === "percentage") {
          return Math.round((baseAmount * feeValue) / 100);
        }
        return feeValue;
      }
    }
    return 0;
  };

  const validatePhone = (value: string) => {
    if (!value) return true;
    const phoneRegex = /^[0-9]{8,15}$/;
    if (!phoneRegex.test(value)) {
      setPhoneError("Nomor WhatsApp tidak valid (8-15 digit angka)");
      return false;
    }
    setPhoneError("");
    return true;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setPhone(value);
    if (value) validatePhone(value);
    else setPhoneError("");
  };

  const nextStep = () => {
    if (currentStep === 1 && selectedItems.length === 0) {
      toast.error("Pilih minimal satu item!");
      return;
    }
    if (currentStep === 2) {
      if (!username || !userInfo) {
        toast.error("Username Roblox tidak valid");
        return;
      }
      if (!user && (!email || !phone)) {
        toast.error("Email dan WhatsApp wajib diisi");
        return;
      }
      if (phoneError) {
        toast.error("Nomor WhatsApp tidak valid");
        return;
      }
    }
    if (currentStep === 3 && !selectedPaymentMethod) {
      toast.error("Pilih metode pembayaran");
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  // Function to handle item selection
  const handleItemSelect = (item: GamepassItem) => {
    const existingIndex = selectedItems.findIndex(
      (selected) => selected.itemName === item.itemName,
    );

    if (existingIndex >= 0) {
      // Item already selected, remove it
      setSelectedItems((prev) =>
        prev.filter((_, index) => index !== existingIndex),
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
        prev.filter((item) => item.itemName !== itemName),
      );
      return;
    }

    setSelectedItems((prev) =>
      prev.map((item) =>
        item.itemName === itemName ? { ...item, quantity: newQuantity } : item,
      ),
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

  // Filter items based on debounced search query
  const filteredItems =
    gamepass?.item.filter((item) => {
      const searchLower = debouncedItemSearch.toLowerCase();
      return (
        item.itemName.toLowerCase().includes(searchLower) ||
        item.price.toString().includes(searchLower)
      );
    }) || [];

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Debounced search effect for item search
  useEffect(() => {
    if (itemSearchTimeout) {
      clearTimeout(itemSearchTimeout);
    }
    const newTimeout = setTimeout(() => {
      setDebouncedItemSearch(itemSearchQuery);
    }, 1000);
    setItemSearchTimeout(newTimeout);
    return () => {
      if (newTimeout) clearTimeout(newTimeout);
    };
  }, [itemSearchQuery]);

  // Reset to page 1 when debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedItemSearch]);

  // Cleanup item search timeout on unmount
  useEffect(() => {
    return () => {
      if (itemSearchTimeout) clearTimeout(itemSearchTimeout);
    };
  }, []);

  useEffect(() => {
    if (gamepassSlug) {
      fetchGamepass();
    }
  }, [gamepassSlug]);

  // Debounced search effect for username
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    if (!username || username.trim().length < 2) {
      setUserInfo(null);
      setUserSearchError(null);
      setIsSearchingUser(false);
      return;
    }
    const newTimeout = setTimeout(() => {
      searchUserInfo(username);
    }, 1000);
    setSearchTimeout(newTimeout);
    return () => {
      if (newTimeout) clearTimeout(newTimeout);
    };
  }, [username]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, []);

  const fetchGamepass = async () => {
    try {
      setLoading(true);
      const data = await getGamepassBySlug(gamepassSlug);
      if (data.success) {
        setGamepass(data.data);
      } else {
        // Fallback: Check if it's an ID
        if (gamepassSlug.length === 24) {
          const idData = await getGamepassById(gamepassSlug);
          if (idData.success && idData.data && idData.data.slug) {
            router.replace(`/gamepass/${idData.data.slug}`);
            return;
          }
        }
        setError(data.error || "Gamepass tidak ditemukan");
      }
    } catch (error) {
      setError("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!agreedToTerms || selectedItems.length === 0 || !gamepass) {
      toast.error("Mohon setujui syarat & ketentuan!");
      return;
    }

    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk menambahkan ke keranjang");
      router.push("/login");
      return;
    }

    setIsAddingToCart(true);

    try {
      for (const item of selectedItems) {
        const cartItem = {
          userId: user.id,
          serviceType: "gamepass",
          serviceId: gamepass._id,
          serviceName: `${gamepass.gameName} - ${item.itemName}`,
          serviceImage: item.imgUrl,
          imgUrl: item.imgUrl,
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

        const result = await addToCartAction(cartItem);
        const data = result.data;

        if (!result.ok && !data?.success) {
          throw new Error(data?.error || "Gagal menambahkan ke keranjang");
        }
      }

      toast.success(`${selectedItems.length} item berhasil ditambahkan ke keranjang!`);
      router.push("/cart");
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan ke keranjang");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!user) {
      toast.error("Harap login terlebih dahulu untuk menggunakan kode promo");
      return;
    }
    if (!promoCode || selectedItems.length === 0) return;
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, totalAmount: totalPrice, serviceType: "gamepass" }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedPromoCode(data.data.code);
        setPromoDiscount(data.data.discountAmount);
        toast.success(`Promo berhasil digunakan! Diskon Rp ${data.data.discountAmount.toLocaleString()}`);
      } else {
        toast.error(data.error || "Kode promo tidak valid");
        setAppliedPromoCode(null);
        setPromoDiscount(0);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memvalidasi promo");
    }
  };

  const handleSubmitOrder = async () => {
    if (!agreedToTerms || !selectedPaymentMethod || selectedItems.length === 0 || !gamepass) return;

    setSubmitting(true);
    try {
      const checkoutItems = selectedItems.map((item) => ({
        serviceType: "gamepass",
        serviceId: gamepass._id,
        serviceName: `${gamepass.gameName} - ${item.itemName}`,
        serviceImage: item.imgUrl,
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
      }));

      const payload = {
        items: checkoutItems,
        customerInfo: !user
          ? { name: username, email: email, phone: phone }
          : {
              name: `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() || username,
              email: email || user.email,
              phone: phone || user.phone,
              userId: user.id,
            },
        userId: !user ? null : user.id,
        totalAmount: totalPrice,
        discountPercentage: user ? ((user as any).diskon || 0) : 0,
        discountAmount: getDiscountAmount(),
        finalAmount: totalPrice - getDiscountAmount(),
        paymentFee: getPaymentFee(),
        paymentMethodId: selectedPaymentMethod,
        activeGateway: activePaymentGateway,
        promoCode: appliedPromoCode || undefined,
      };

      const result = await createMultiTransaction(payload);
      
      if (result.success) {
        toast.success("Pesanan berhasil dibuat!");
        if (result.data?.redirectUrl) {
          window.location.href = result.data.redirectUrl;
        } else if (result.data?.snapToken) {
          if ((window as any).snap) {
            (window as any).snap.pay(result.data.snapToken, {
              onSuccess: () => { toast.success("Pembayaran berhasil!"); router.push("/riwayat"); },
              onPending: () => { toast.info("Menunggu pembayaran..."); router.push("/riwayat"); },
              onError: () => toast.error("Pembayaran gagal!"),
              onClose: () => { toast.warning("Anda menutup popup pembayaran"); router.push("/riwayat"); },
            });
          } else {
            toast.error("Midtrans Snap tidak tersedia");
            router.push("/riwayat");
          }
        } else {
          router.push(`/riwayat`);
        }
      } else {
        throw new Error(result.error || "Gagal membuat pesanan");
      }
    } catch (error: any) {
      toast.error(error.message || "Gagal memproses pembayaran");
    } finally {
      setSubmitting(false);
    }
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
              </div>
              <button
                onClick={() => setIsShowReview(!isShowReview)}
                className="w-full py-1.5 sm:py-2 md:py-3 px-1.5 sm:px-2 md:px-4 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 hover:scale-[1.01] shadow hover:shadow-lg md:hover:shadow-primary-100/30 flex items-center justify-center gap-1 text-xs sm:text-xs md:text-base mt-4"
              >
                {isShowReview ? "Sembunyikan" : "Lihat"} Review
              </button>
            </div>
          </div>

          {/* Right Column - Wizard */}
          <div className="lg:col-span-2 space-y-4">
            <div className="w-full group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl px-4 sm:px-6 py-4 shadow-lg overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-5 h-5 text-primary-100" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-lg sm:text-xl leading-tight">
                      <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                        Progress Checkout
                      </span>
                    </h2>
                  </div>
                </div>
                <div className="flex justify-between items-center relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full z-0"></div>
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-100 rounded-full z-0 transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                  ></div>

                  {[
                    { step: 1, label: "Pilih" },
                    { step: 2, label: "Detail" },
                    { step: 3, label: "Bayar" },
                    { step: 4, label: "Selesai" }
                  ].map((s) => (
                    <div key={s.step} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${currentStep >= s.step
                          ? "bg-primary-100 text-white shadow-[0_0_15px_rgba(var(--primary-100-rgb),0.5)]"
                          : "bg-[#1A1F2C] text-white/40 border-2 border-white/10"
                        }`}>
                        {currentStep > s.step ? <CheckCircle className="w-5 h-5" /> : s.step}
                      </div>
                      <span className={`text-xs sm:text-sm font-semibold ${currentStep >= s.step ? "text-white" : "text-white/40"}`}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 1: Pilih Item Gamepass */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                {/* Cara Pesan Section */}
                <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary-100/20">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-2xl border border-primary-100/30">
                      <Gift className="w-7 h-7 text-primary-100" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">Cara Pesan</h3>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gamepass.caraPesan.map((cara, index) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-primary-800/40 rounded-2xl border border-primary-100/20">
                        <div className="w-8 h-8 flex-shrink-0 bg-primary-100 rounded-full flex items-center justify-center text-white font-black text-sm">
                          {index + 1}
                        </div>
                        <span className="text-sm text-white/90 leading-relaxed">{cara}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Items Grid */}
                <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-primary-100/20">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-gradient-to-r from-primary-100/20 to-primary-200/20 rounded-2xl border border-primary-100/30">
                      <ShoppingCart className="w-7 h-7 text-primary-100" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">Pilih Item Gamepass</h3>
                    </div>
                  </div>

                  {/* Search Bar */}
                  {gamepass.item.length > 0 && (
                    <div className="mb-6 relative">
                      <input
                        type="text"
                        placeholder="Cari item..."
                        value={itemSearchQuery}
                        onChange={(e) => setItemSearchQuery(e.target.value)}
                        className="w-full px-4 py-3 pl-12 bg-primary-800/30 border-2 border-primary-100/30 rounded-xl text-white placeholder-white/40 focus:border-primary-100/60 focus:outline-none text-sm"
                      />
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-200" />
                      {itemSearchQuery && (
                        <button onClick={() => setItemSearchQuery("")} className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1">
                          <X className="w-4 h-4 text-white/60" />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                    {filteredItems.length === 0 && itemSearchQuery ? (
                      <div className="col-span-full text-center py-8 text-white/70">Tidak ada item ditemukan.</div>
                    ) : (
                      paginatedItems.map((item, index) => {
                        const isSelected = isItemSelected(item.itemName);
                        const quantity = getSelectedQuantity(item.itemName);
                        return (
                          <div
                            key={index}
                            className={`group/item relative bg-gradient-to-br from-primary-800/40 to-primary-700/30 border-2 rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col items-center justify-start gap-3 ${isSelected ? "border-primary-100 bg-gradient-to-br from-primary-500/30 to-primary-600/20 scale-105" : "border-primary-100/30 hover:border-primary-100/60"}`}
                            onClick={() => handleItemSelect(item)}
                          >
                            <div className={`absolute z-[3] top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-primary-100 bg-gradient-to-r from-primary-100 to-primary-200" : "border-primary-100/60 bg-primary-800/50"}`}>
                              {isSelected ? <Check className="w-4 h-4 text-primary-900 font-bold" /> : <Plus className="w-4 h-4 text-primary-100" />}
                            </div>

                            <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden mb-2 border-2 border-primary-100/20 shadow-lg">
                              <Image src={item.imgUrl} alt={item.itemName} fill className="object-fill" />
                            </div>

                            <div className="relative z-10 w-full flex flex-col items-center text-center gap-2">
                              <h4 className="font-black text-white text-xs sm:text-sm line-clamp-2">{item.itemName}</h4>
                              <span className="text-white font-bold text-xs sm:text-sm">Rp {item.price.toLocaleString()}</span>
                              
                              {isSelected && (
                                <div className="mt-2 p-2 bg-gradient-to-r from-primary-500/30 to-primary-600/20 rounded-lg border border-primary-100/40 w-full">
                                  <div className="flex items-center justify-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.itemName, quantity - 1); }} className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white"><Minus className="w-3 h-3" /></button>
                                    <span className="font-black text-primary-900 bg-primary-100 px-2 rounded">{quantity}</span>
                                    <button onClick={(e) => { e.stopPropagation(); updateQuantity(item.itemName, quantity + 1); }} className="w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white"><Plus className="w-3 h-3" /></button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {filteredItems.length > ITEMS_PER_PAGE && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 bg-primary-100/20 rounded-lg text-white disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
                      <span className="text-white font-bold">{currentPage} / {totalPages}</span>
                      <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 bg-primary-100/20 rounded-lg text-white disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  )}
                </div>

                {/* Selected Items Summary */}
                {selectedItems.length > 0 && (
                  <div className="group relative bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-2xl border border-green-400/30">
                        <Check className="w-7 h-7 text-green-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-white">Ringkasan Pesanan</h3>
                        <p className="text-primary-200 text-sm">{selectedItems.length} item dipilih</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {selectedItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-primary-500/20 rounded-xl p-4 border border-primary-100/20">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-900 font-black">{item.quantity}</div>
                            <div>
                              <p className="font-bold text-white">{item.itemName}</p>
                              <p className="text-sm text-primary-200">{item.quantity} × Rp {item.price.toLocaleString()}</p>
                            </div>
                          </div>
                          <p className="font-black text-primary-100 text-lg">Rp {(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="mt-6 pt-6 border-t-2 border-primary-100/30 flex justify-between items-center">
                        <span className="text-xl font-black text-white">Total:</span>
                        <span className="text-3xl font-black text-primary-100">Rp {totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={nextStep}
                    disabled={selectedItems.length === 0}
                    className="flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold rounded-xl transition-all disabled:opacity-50 hover:shadow-lg"
                  >
                    Lanjut Isi Data <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Detail Informasi */}
            {currentStep === 2 && (
              <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-4 sm:p-6 shadow-lg overflow-hidden animate-fadeIn space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <User className="w-6 h-6 text-primary-100" /> Detail Informasi
                  </h2>
                  <button onClick={prevStep} className="text-sm font-medium text-white/60 hover:text-white px-3 py-1 bg-white/5 rounded-lg">Kembali</button>
                </div>

                <div className="space-y-5">
                  <div className="group/field">
                    <label className="flex items-center gap-2 text-sm font-bold mb-2 text-white">
                      <User className="w-4 h-4 text-primary-100" /> Username RBX <span className="text-red-400">*</span>
                    </label>
                    <div className={`flex items-center border rounded-lg overflow-hidden bg-gradient-to-r from-primary-900/50 to-primary-800/50 backdrop-blur-sm w-full transition-all ${userInfo ? "border-emerald-500/60 bg-emerald-500/10" : username && userSearchError ? "border-red-500/60 bg-red-500/10" : "border-primary-100/30 focus-within:border-primary-100/80"}`}>
                      <input
                        type="text"
                        placeholder="Masukkan Username Roblox"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="py-3 px-4 outline-none text-sm text-white placeholder-white/50 flex-1 bg-transparent w-full"
                      />
                      <div className="px-4">
                        {isSearchingUser ? <Loader2 className="w-5 h-5 animate-spin text-primary-100" /> : userInfo ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : username && userSearchError ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Search className="w-5 h-5 text-primary-200/60" />}
                      </div>
                    </div>
                    {userInfo && (
                      <div className="mt-3 flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                        <img src={userInfo.avatar || userInfo.avatarUrl} alt={userInfo.username} className="w-10 h-10 rounded-lg ring-2 ring-emerald-400/60 object-cover" />
                        <div>
                          <p className="text-sm text-white font-bold">{userInfo.username || userInfo.displayName}</p>
                          <p className="text-xs text-emerald-300">ID: {userInfo.id}</p>
                        </div>
                      </div>
                    )}
                    {userSearchError && <p className="text-xs text-red-400 mt-2">{userSearchError}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">Email <span className="text-red-400">*</span></label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email aktif" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">WhatsApp <span className="text-red-400">*</span></label>
                      <input type="tel" value={phone} onChange={handlePhoneChange} placeholder="0812xxxx" className={`w-full bg-black/40 border ${phoneError ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary-100`} />
                      {phoneError && <span className="text-xs text-red-500 mt-1">{phoneError}</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={nextStep}
                    disabled={!username || !userInfo || (!user && (!email || !phone))}
                    className="flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold rounded-xl transition-all disabled:opacity-50 hover:shadow-lg"
                  >
                    Pilih Pembayaran <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Pembayaran */}
            {currentStep === 3 && (
              <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-4 sm:p-6 shadow-lg overflow-hidden animate-fadeIn space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-primary-100" /> Metode Pembayaran
                  </h2>
                  <button onClick={prevStep} className="text-sm font-medium text-white/60 hover:text-white px-3 py-1 bg-white/5 rounded-lg">Kembali</button>
                </div>

                <div className="bg-primary-900/50 border border-primary-500/20 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100/20 rounded-xl flex items-center justify-center border border-primary-100/30">
                      <Gem className="w-6 h-6 text-primary-200" />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Total Pembayaran</p>
                      {selectedPaymentMethod === "RBXNET_COIN" ? (
                        <div>
                          <p className="text-2xl font-bold text-yellow-400 flex items-center">
                            <img src="/icon/dollar.png" alt="Coin" className="w-6 h-6 mr-2 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                            {Number(((totalPrice - getDiscountAmount()) / coinSpendValue).toFixed(2))} Credits
                          </p>
                          <p className="text-xs text-white/50 mt-1">Setara Rp {(totalPrice - getDiscountAmount()).toLocaleString()}</p>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-white">
                          Rp {(totalPrice - getDiscountAmount()).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {paymentMethodsLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-100" />
                    <p className="text-white/60 mt-2">Memuat metode pembayaran...</p>
                  </div>
                ) : (
                  <PaymentMethodSelector
                    categories={paymentCategories}
                    loading={false}
                    selectedMethod={selectedPaymentMethod}
                    onSelectMethod={setSelectedPaymentMethod}
                    baseAmount={totalPrice - getDiscountAmount()}
                    expandedCategory={expandedCategory}
                    onToggleCategory={(cat) => setExpandedCategory(expandedCategory === cat ? "" : cat)}
                  />
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={nextStep}
                    disabled={!selectedPaymentMethod}
                    className="flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold rounded-xl transition-all disabled:opacity-50 hover:shadow-lg"
                  >
                    Konfirmasi Pesanan <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Konfirmasi */}
            {currentStep === 4 && (
              <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-4 sm:p-6 shadow-lg overflow-hidden animate-fadeIn space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <ShoppingCart className="w-6 h-6 text-primary-100" /> Konfirmasi Order
                  </h2>
                  <button onClick={prevStep} className="text-sm font-medium text-white/60 hover:text-white px-3 py-1 bg-white/5 rounded-lg">Kembali</button>
                </div>

                <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
                  <h3 className="text-sm font-bold text-white/40 uppercase mb-4 tracking-wider">Item & Akun</h3>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100/10 flex items-center justify-center overflow-hidden">
                        <Image src={gamepass.imgUrl} alt={gamepass.gameName} width={40} height={40} className="object-cover" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{gamepass.gameName}</div>
                        <div className="text-primary-100 font-semibold text-sm">{selectedItems.length} Item Terpilih</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {userInfo && <img src={userInfo.avatar || userInfo.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10 object-cover" />}
                    <div>
                      <div className="text-white font-bold">{username}</div>
                      <div className="text-xs text-white/50">Target Akun</div>
                    </div>
                  </div>
                </div>

                <OrderSummaryCard
                  baseAmount={totalPrice}
                  details={[
                    { label: "Layanan", value: `Gamepass (${selectedItems.length} item)` },
                    { label: "Target", value: username },
                    { label: "Email", value: email || "-" },
                    { label: "WhatsApp", value: phone || "-" },
                    {
                      label: "Pembayaran",
                      value: selectedPaymentMethod
                        ? paymentCategories.flatMap(c => c.methods || []).find(m => m.id === selectedPaymentMethod)?.name || selectedPaymentMethod
                        : "Belum dipilih"
                    }
                  ]}
                  adminFee={0}
                  discount={getDiscountAmount()}
                  discountPercentage={user ? ((user as any).diskon || 0) : 0}
                  paymentFee={getPaymentFee()}
                  promoCode={promoCode}
                  onPromoCodeChange={setPromoCode}
                  onApplyPromo={handleApplyPromo}
                  appliedPromoCode={appliedPromoCode || undefined}
                  promoDiscount={promoDiscount}
                  selectedPaymentMethod={selectedPaymentMethod}
                  coinSpendValue={coinSpendValue}
                  ppnAmount={getPpnAmount()}
                />

                <div className="mt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-1">
                      <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="peer sr-only" />
                      <div className="w-5 h-5 rounded border-2 border-white/20 peer-checked:bg-primary-100 peer-checked:border-primary-100 transition-colors flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <div className="text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
                      Saya menyetujui <a href="/terms" className="text-primary-100 hover:underline">Syarat dan Ketentuan</a> pembelian
                    </div>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <button
                      onClick={handleAddToCart}
                      disabled={isAddingToCart || !agreedToTerms}
                      className="w-full py-4 bg-primary-800/50 border border-primary-100/30 text-primary-100 font-bold rounded-xl transition-all hover:bg-primary-800 hover:border-primary-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isAddingToCart ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : <><Plus className="w-5 h-5" /> Masukkan Keranjang</>}
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={submitting || !agreedToTerms}
                      className="w-full py-4 bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-100/25 flex items-center justify-center gap-2"
                    >
                      {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : <><ShoppingCart className="w-5 h-5" /> Bayar Sekarang</>}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {isShowReview && (
              <div className="w-full mt-8">
                <ReviewSection serviceType="gamepass" title={`Reviews ${gamepass.gameName}`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
