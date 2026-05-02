"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ReviewSection from "@/components/ReviewSection";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import OrderSummaryCard from "@/components/checkout/OrderSummaryCard";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPaymentSettings,
  fetchPaymentMethods,
  createTransaction,
} from "@/app/checkout/actions";
import { getProductsByCategory, getUserInfo, getPublicSettings, addToCartAction } from "@/app/lib/actions";
import { PaymentCategory, calculatePaymentFee } from "@/lib/payment-helpers";

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
  CreditCard
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
  productType?: "regular" | "premium";
  createdAt: string;
  updatedAt: string;
}

export default function RobuxInstan() {
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
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Wizard States
  const [currentStep, setCurrentStep] = useState(1);
  const [productType, setProductType] = useState<"regular" | "premium">("regular");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Checkout States
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [activePaymentGateway, setActivePaymentGateway] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [expandedCategory, setExpandedCategory] = useState<string>("qris");
  const [submitting, setSubmitting] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);

  const router = useRouter();

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
      setUserInfo(null);
    } finally {
      setIsSearchingUser(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const result = await getProductsByCategory("robux_instant");
        const sortedProducts = (result.products || []).sort(
          (a: Product, b: Product) => a.robuxAmount - b.robuxAmount,
        );
        setProducts(sortedProducts);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
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
            setPaymentCategories(Object.values(groupedMethods));
          }
        }
      } catch (error) {
      } finally {
        setPaymentMethodsLoading(false);
      }
    };
    loadPaymentData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getFinalPrice = (product: Product) => {
    if (product.discountPercentage) {
      return product.price * (1 - product.discountPercentage / 100);
    }
    return product.price;
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setRobux(product.robuxAmount);
  };

  const validatePhone = (value: string) => {
    if (!value) return true;
    const phoneRegex = /^[0-9]{10,13}$/;
    if (!phoneRegex.test(value)) {
      setPhoneError("Nomor WhatsApp tidak valid (10-13 digit angka)");
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

  const getPaymentFee = () => {
    if (selectedPaymentMethod && paymentCategories.length > 0) {
      const methodObj = paymentCategories.flatMap(c => c.methods || []).find(m => m.id === selectedPaymentMethod);
      if (methodObj) {
        const feeType = methodObj.feeType || "flat";
        const feeValue = Number(methodObj.fee) || 0;
        const price = selectedProduct ? Number(selectedProduct.price) : 0;
        if (feeType === "percent" || feeType === "percentage") {
          return Math.ceil((price * feeValue) / 100);
        } else {
          return feeValue;
        }
      }
    }
    return 0;
  };

  const getDiscountAmount = () => {
    if (user && selectedProduct) {
      return Math.round((selectedProduct.price * ((user as any).diskon || 0)) / 100);
    }
    return 0;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!selectedProduct) {
        toast.error("Pilih paket Robux terlebih dahulu!");
        return;
      }
    } else if (currentStep === 2) {
      if (!username || !password || !userInfo) {
        toast.error("Username, avatar, dan password harus dilengkapi!");
        return;
      }
      if (!email || !phone) {
        toast.error("Email dan nomor WhatsApp wajib diisi!");
        return;
      }
      if (phone && !validatePhone(phone)) {
        return;
      }
    } else if (currentStep === 3) {
      if (!selectedPaymentMethod) {
        toast.error("Pilih metode pembayaran terlebih dahulu!");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleApplyPromo = async () => {
    if (!user) {
      toast.error("Harap login terlebih dahulu untuk menggunakan kode promo");
      return;
    }
    if (!promoCode || !selectedProduct) return;
    try {
      const price = selectedProduct.price;
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, totalAmount: price, serviceType: "robux_instant" }),
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

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleAddToCart = async () => {
    if (!agreedToTerms || !selectedProduct) {
      toast.error("Mohon lengkapi pilihan dan setujui syarat & ketentuan!");
      return;
    }

    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk menambahkan ke keranjang");
      router.push("/login");
      return;
    }

    setIsAddingToCart(true);

    try {
      const cartItem = {
        userId: user.id,
        serviceType: "robux",
        serviceId: selectedProduct._id,
        serviceName: selectedProduct.name,
        serviceImage: "/robux-icon.png",
        imgUrl: "/robux-icon.png",
        serviceCategory: "robux_instant",
        quantity: 1,
        unitPrice: getFinalPrice(selectedProduct),
        robloxUsername: username,
        robloxPassword: password,
        robuxInstantDetails: {
          robuxAmount: selectedProduct.robuxAmount,
          productName: selectedProduct.name,
          description: selectedProduct.description,
          additionalInfo: additionalInfo,
          notes: additionalInfo,
        },
      };

      const result = await addToCartAction(cartItem);
      const data = result.data;

      if (!result.ok && !data?.success) {
        throw new Error(data?.error || "Gagal menambahkan ke keranjang");
      }

      toast.success("Produk berhasil ditambahkan ke keranjang!");
      router.push("/cart");
    } catch (error: any) {
      toast.error(error.message || "Gagal menambahkan ke keranjang");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleSubmitOrder = async () => {
    if (!agreedToTerms) {
      toast.error("Anda harus menyetujui syarat & ketentuan");
      return;
    }
    try {
      setSubmitting(true);
      const requestData = {
        serviceType: "robux",
        serviceId: selectedProduct!._id,
        serviceName: selectedProduct!.name,
        serviceImage: "/robux-icon.png",
        serviceCategory: "robux_instant",
        quantity: 1,
        robloxUsername: username,
        robloxPassword: password,
        robuxInstantDetails: {
          robuxAmount: selectedProduct!.robuxAmount,
          productName: selectedProduct!.name,
          description: selectedProduct!.description,
          additionalInfo: additionalInfo,
          notes: additionalInfo,
        },
        paymentMethodId: selectedPaymentMethod,
        promoCode: appliedPromoCode || undefined,
        customerInfo: !user
          ? { name: username, email: email, phone: phone }
          : {
            name: `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() || username,
            email: email || user.email,
            phone: phone || user.phone,
            userId: user.id,
          },
        userId: !user ? null : user.id,
      };

      const result = await createTransaction(requestData);
      if (result.success) {
        toast.success("Transaksi berhasil dibuat!");
        if (result.data?.qrCodeUrl) {
          router.push(result.data?.transaction?._id ? `/riwayat/${result.data.transaction._id}` : "/riwayat");
        } else if (result.data?.redirectUrl) {
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
          router.push(result.data?.transaction?._id ? `/riwayat/${result.data.transaction._id}` : "/riwayat");
        }
      } else {
        toast.error(result.error || "Gagal membuat transaksi");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-100 shadow-lg shadow-primary-100/50"></div>
          <p className="mt-4 text-lg font-medium text-white drop-shadow-lg">Memuat data...</p>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(p => (p.productType || "regular") === productType);

  return (
    <main className="px-4 sm:px-6 md:px-8">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
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
          <div className="absolute inset-0 bg-gradient-to-r from-primary-100/10 via-transparent to-primary-200/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      </div>

      <section className="max-w-6xl mx-auto mt-4 sm:mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Kiri: Hero Section */}
        <section className="relative min-h-[200px] sm:min-h-[250px] w-full">
          <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-3xl p-4 sm:p-6 shadow-lg transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-100/5 via-transparent to-primary-200/5 rounded-3xl"></div>
            <div className="relative z-10 flex flex-col gap-4 sm:gap-6 items-center">
              <div className="flex-shrink-0 group/icon">
                <div className="relative w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]">
                  <div className="relative w-full h-full bg-gradient-to-br from-primary-100/25 via-primary-200/15 to-primary-100/20 rounded-xl flex items-center justify-center transform transition-all duration-500 group-hover/icon:scale-110 group-hover/icon:rotate-3 border border-primary-100/30 shadow-inner">
                    <div className="relative z-10 group-hover/icon:animate-bounce flex items-center justify-center">
                      <Image 
                        src="/icon/icons8-robux-48 (2).png" 
                        alt="Robux Icon" 
                        width={80} 
                        height={80} 
                        className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_10px_20px_rgba(246,58,230,0.5)]"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 text-center ">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[0.9] tracking-tight">
                  Robux <span className="text-primary-100">Instant</span>
                </h1>
                <p className="text-lg sm:text-base text-white/80 max-w-3xl mb-8 font-light">
                  Dapatkan <span className="text-primary-100 font-medium">Robux</span> langsung ke akun Anda dalam <span className="text-primary-200 font-medium">hitungan menit</span>!
                </p>

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

        {/* Kanan: Wizard Section */}
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
                      {currentStep > s.step ? <CheckCircle2 className="w-5 h-5" /> : s.step}
                    </div>
                    <span className={`text-xs sm:text-sm font-semibold ${currentStep >= s.step ? "text-white" : "text-white/40"}`}>
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 1: Pilih Nominal */}
          {currentStep === 1 && (
            <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-4 sm:p-5 shadow-lg transition-all duration-300 overflow-hidden animate-fadeIn">
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 leading-tight text-center lg:text-left">
                  Pilih Jumlah <span className="text-primary-100">Robux</span>
                </h2>

                <div className="flex gap-4 mb-8 bg-black/20 p-2 rounded-2xl border border-white/5">
                  <button
                    onClick={() => { setProductType("regular"); setSelectedProduct(null); }}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all ${productType === "regular"
                        ? "bg-gradient-to-r from-primary-100 to-primary-200 text-white shadow-lg shadow-primary-100/20"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    RBX Regular
                  </button>
                  <button
                    onClick={() => { setProductType("premium"); setSelectedProduct(null); }}
                    className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${productType === "premium"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    RBX Plus
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 justify-center">
                  {filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className={`group/prod relative p-4 rounded-xl border cursor-pointer transition-all duration-300 hover:scale-105 ${selectedProduct?._id === product._id
                          ? "bg-gradient-to-br from-primary-100/20 via-primary-200/10 to-primary-100/20 border-primary-100/60 backdrop-blur-xl shadow-lg"
                          : "bg-gradient-to-br from-white/10 via-transparent to-white/5 border-white/20 backdrop-blur-xl hover:border-primary-100/40"
                        }`}
                      onClick={() => handleProductSelect(product)}
                    >
                      {selectedProduct?._id === product._id && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-primary-100 rounded-full p-1.5 shadow-md">
                            <CheckCircle2 className="w-4 h-4 text-primary-900" />
                          </div>
                        </div>
                      )}
                      {product.discountPercentage && (
                        <div className="absolute -top-1 -left-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                          -{product.discountPercentage}%
                        </div>
                      )}
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-white/80 text-xs mb-2 justify-center">
                          {productType === "regular" ? (
                            <Image 
                              src="/icon/icons8-robux-96.png" 
                              alt="Robux" 
                              width={20} 
                              height={20} 
                              className="w-5 h-5"
                              style={{ filter: "brightness(0) saturate(100%) invert(43%) sepia(85%) saturate(2250%) hue-rotate(264deg) brightness(97%) contrast(106%) drop-shadow(0 0 4px rgba(246,58,230,0.5))" }}
                            />
                          ) : (
                            <Image 
                              src="/icon/RblxPlusLogo.webp" 
                              alt="Premium" 
                              width={20} 
                              height={20} 
                              className="w-5 h-5"
                              style={{ filter: "brightness(0) saturate(100%) invert(43%) sepia(85%) saturate(2250%) hue-rotate(264deg) brightness(97%) contrast(106%) drop-shadow(0 0 4px rgba(246,58,230,0.5))" }}
                            />
                          )}
                          <span className="text-white font-medium">{product.robuxAmount} R$</span>
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
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={nextStep}
                    disabled={!selectedProduct}
                    className="flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold rounded-xl transition-all disabled:opacity-50 hover:shadow-lg"
                  >
                    Lanjut Isi Data
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Detail Informasi */}
          {currentStep === 2 && (
            <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-4 sm:p-5 shadow-lg overflow-hidden animate-fadeIn space-y-6">
              <div className="relative z-10 grid grid-cols-1 gap-5">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <User className="w-6 h-6 text-primary-100" />
                    Detail Informasi
                  </h2>
                  <button onClick={prevStep} className="text-sm font-medium text-white/60 hover:text-white px-3 py-1 bg-white/5 rounded-lg">Kembali</button>
                </div>

                <div className="group/field">
                  <label className="flex items-center gap-2 text-sm font-bold mb-2 text-white">
                    <User className="w-4 h-4 text-primary-100" /> Username <span className="text-red-400">*</span>
                  </label>
                  <div className={`flex items-center border rounded-lg overflow-hidden bg-gradient-to-r from-primary-900/50 to-primary-800/50 backdrop-blur-sm w-full transition-all ${userInfo ? "border-emerald-500/60 bg-emerald-500/10" : username && userSearchError ? "border-red-500/60 bg-red-500/10" : "border-primary-100/30 focus-within:border-primary-100/80"
                    }`}>
                    <input
                      type="text"
                      placeholder="Masukkan Username RBX"
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
                      <img src={userInfo.avatar || userInfo.avatarUrl} alt={userInfo.username || userInfo.name} className="w-10 h-10 rounded-lg ring-2 ring-emerald-400/60 object-cover" />
                      <div>
                        <p className="text-sm text-white font-bold">{userInfo.username || userInfo.displayName}</p>
                        <p className="text-xs text-emerald-300">@{userInfo.name || userInfo.username}</p>
                      </div>
                    </div>
                  )}
                  {userSearchError && (
                    <p className="text-xs text-red-400 mt-2">{userSearchError}</p>
                  )}
                </div>

                <div className="group/field">
                  <label className="flex items-center gap-2 text-sm font-bold mb-2 text-white">
                    <Lock className="w-4 h-4 text-primary-100" /> Password <span className="text-red-400">*</span>
                  </label>
                  <div className="flex items-center border border-primary-100/30 rounded-lg overflow-hidden bg-gradient-to-r from-primary-900/50 to-primary-800/50 backdrop-blur-sm w-full focus-within:border-primary-100/80 transition-all">
                    <input
                      type="password"
                      placeholder="Masukkan Password RBX"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="py-3 px-4 outline-none text-sm text-white placeholder-white/50 flex-1 bg-transparent w-full"
                    />
                  </div>
                </div>

                <div className="group/field">
                  <label className="flex items-center gap-2 text-sm font-bold mb-2 text-white">
                    <Shield className="w-4 h-4 text-primary-100" /> Backup Code <span className="text-xs text-white/60 font-normal">(Opsional)</span>
                  </label>
                  <textarea
                    placeholder="Masukkan backup code RBX jika akun memiliki 2-step verification"
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    rows={2}
                    className="w-full py-3 px-4 outline-none text-sm text-white placeholder-white/50 border border-primary-100/30 rounded-lg bg-gradient-to-br from-primary-900/50 to-primary-800/50 focus:border-primary-100/80 resize-none transition-all"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Info className="w-3 h-3 text-blue-400" />
                    <p className="text-xs text-white/70">
                      Cara lihat backup code: <button onClick={() => setShowVideoModal(true)} className="underline text-primary-100 hover:text-primary-200 transition-colors">Klik di sini</button>
                    </p>
                  </div>
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
                  disabled={!username || !password || !userInfo || (!user && (!email || !phone))}
                  className="flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold rounded-xl transition-all disabled:opacity-50 hover:shadow-lg"
                >
                  Pilih Pembayaran
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Pembayaran */}
          {currentStep === 3 && selectedProduct && (
            <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-4 sm:p-5 shadow-lg overflow-hidden animate-fadeIn space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-primary-100" />
                  Metode Pembayaran
                </h2>
                <button onClick={prevStep} className="text-sm font-medium text-white/60 hover:text-white px-3 py-1 bg-white/5 rounded-lg">Kembali</button>
              </div>

              <div className="bg-gradient-to-r from-primary-900/50 to-primary-800/50 border border-primary-500/20 rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100/20 rounded-xl flex items-center justify-center border border-primary-100/30">
                    <Gem className="w-6 h-6 text-primary-200" />
                  </div>
                  <div>
                    <p className="text-white/60 text-sm">Total Pembayaran</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(getFinalPrice(selectedProduct))}
                    </p>
                  </div>
                </div>
                {selectedProduct.discountPercentage && (
                  <div className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium text-sm">
                    Hemat {selectedProduct.discountPercentage}%
                  </div>
                )}
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
                  baseAmount={getFinalPrice(selectedProduct)}
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
                  Konfirmasi Pesanan
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Summary & Submit */}
          {currentStep === 4 && selectedProduct && (
            <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-xl p-4 sm:p-5 shadow-lg overflow-hidden animate-fadeIn space-y-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6 text-primary-100" />
                  Konfirmasi Order
                </h2>
                <button onClick={prevStep} className="text-sm font-medium text-white/60 hover:text-white px-3 py-1 bg-white/5 rounded-lg">Kembali</button>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="p-5 rounded-2xl bg-black/20 border border-white/5">
                  <h3 className="text-sm font-bold text-white/40 uppercase mb-4 tracking-wider">Item & Akun</h3>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100/10 flex items-center justify-center">
                        <Image src="/robux-icon.png" alt="Robux" width={24} height={24} />
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">{selectedProduct.name}</div>
                        <div className="text-primary-100 font-semibold text-sm">
                          {productType === "premium" ? "Premium" : "Reguler"}
                        </div>
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
                  baseAmount={selectedProduct.price}
                  details={[
                    { label: "Layanan", value: selectedProduct.name },
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
                />

                <div className="mt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-1">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded border-2 border-white/20 peer-checked:bg-primary-100 peer-checked:border-primary-100 transition-colors flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
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
                      {isAddingToCart ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : <><ShoppingCart className="w-5 h-5" /> Masukkan Keranjang</>}
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={submitting || !agreedToTerms}
                      className="w-full py-4 bg-gradient-to-r from-primary-100 to-primary-200 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary-100/25 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>
                      ) : (
                        <><ShoppingCart className="w-5 h-5" /> Bayar Sekarang</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          {isShowReview && (
            <div className="w-full mt-8">
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
        >
          <div
            className="relative w-full max-w-2xl bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-700/95 backdrop-blur-xl rounded-3xl border-2 border-primary-100/40 shadow-2xl shadow-primary-100/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative z-10 flex items-center justify-between p-6 border-b border-primary-100/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-100" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Tutorial Backup Code</h3>
                  <p className="text-sm text-white/60">Cara mendapatkan backup code untuk 2FA</p>
                </div>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="group w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/40 transition-all duration-300 hover:scale-110"
              >
                <span className="text-2xl text-white/80 group-hover:text-red-400 transition-colors">×</span>
              </button>
            </div>
            <div className="relative z-10 p-6">
              <div className="rounded-2xl overflow-hidden border-2 border-primary-100/30 shadow-xl">
                <iframe
                  width="100%"
                  height="360"
                  src="https://www.youtube.com/embed/wzC3Nddtia0?si=DSqSh47qvVFZpdfx"
                  title="Tutorial Backup Code RBX"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full bg-black aspect-video"
                ></iframe>
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-blue-200 font-semibold text-sm mb-1">Catatan Penting</h4>
                    <p className="text-blue-100/80 text-xs leading-relaxed">
                      Backup code diperlukan jika akun Roblox Anda menggunakan 2-Step Verification (2FA). Jika tidak ada 2FA, Anda bisa langsung checkout tanpa mengisi backup code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
}
