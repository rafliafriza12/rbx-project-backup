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
import {
  getUserInfo,
  addToCartAction,
  getRobuxUsernamePricing,
} from "@/app/lib/actions";
import { PaymentCategory, formatCurrency } from "@/lib/payment-helpers";

import {
  CheckCircle2,
  User,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Zap,
  FileText,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Clock,
  Coins,
  ChevronLeft,
  Plus,
  Minus,
  HelpCircle,
} from "lucide-react";

interface UsernamePricing {
  pricePerHundred: number;
  minRobux: number;
  maxRobux: number;
}

export default function RobuxViaUsernamePage() {
  const [isShowReview, setIsShowReview] = useState<boolean>(false);

  // Dynamic pricing state
  const [pricing, setPricing] = useState<UsernamePricing>({
    pricePerHundred: 13000,
    minRobux: 50,
    maxRobux: 10000,
  });
  const [pricingLoading, setPricingLoading] = useState(true);

  // Robux input state (dynamic, not fixed package)
  const [robux, setRobux] = useState<number>(50);
  const [robuxInput, setRobuxInput] = useState<string>("50");
  const [robuxError, setRobuxError] = useState<string>("");

  // Username & user search states
  const [username, setUsername] = useState("");
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchError, setUserSearchError] = useState<string | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState(1);
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

  // Fetch dynamic pricing from admin settings via Server Action
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        setPricingLoading(true);
        const res = await getRobuxUsernamePricing();
        if (res.success && res.data) {
          const minR = Number(res.data.minRobux) || 50;
          const maxR = Number(res.data.maxRobux) || 10000;
          const priceHundred = Number(res.data.pricePerHundred) || 13000;

          setPricing({
            pricePerHundred: priceHundred,
            minRobux: minR,
            maxRobux: maxR,
          });

          setRobux(minR);
          setRobuxInput(minR.toString());
        }
      } catch (err) {
        console.error("Gagal memuat harga Robux username:", err);
      } finally {
        setPricingLoading(false);
      }
    };
    fetchPricing();
  }, []);

  // Sync robux amount and validate
  const handleRobuxChange = (valStr: string) => {
    setRobuxInput(valStr);
    const cleaned = valStr.replace(/\D/g, "");
    if (!cleaned) {
      setRobux(0);
      setRobuxError(`Minimal pembelian ${pricing.minRobux} Robux`);
      return;
    }

    const val = parseInt(cleaned, 10);
    setRobux(val);

    if (val < pricing.minRobux) {
      setRobuxError(`Minimal pembelian ${pricing.minRobux} Robux`);
    } else if (val > pricing.maxRobux) {
      setRobuxError(`Maksimal pembelian ${pricing.maxRobux.toLocaleString("id-ID")} Robux`);
    } else {
      setRobuxError("");
    }
  };

  const handleSelectPreset = (amount: number) => {
    setRobux(amount);
    setRobuxInput(amount.toString());
    setRobuxError("");
  };

  const handleStepAmount = (delta: number) => {
    const current = robux || 0;
    const nextVal = Math.max(pricing.minRobux, Math.min(pricing.maxRobux, current + delta));
    setRobux(nextVal);
    setRobuxInput(nextVal.toString());
    setRobuxError("");
  };

  // Search Roblox User
  const searchUserInfo = async (uname: string) => {
    if (!uname || uname.trim().length < 2) {
      setUserInfo(null);
      setUserSearchError(null);
      return;
    }

    try {
      setIsSearchingUser(true);
      setUserSearchError(null);
      const res = await getUserInfo(uname.trim());
      const userData = res.data?.data || (res.data?.success ? res.data : null);
      if (res.ok && res.data?.success && userData) {
        setUserInfo(userData);
        setUserSearchError(null);
      } else {
        setUserInfo(null);
        setUserSearchError(res.data?.message || res.data?.error || "User tidak ditemukan di Roblox");
      }
    } catch (err: any) {
      setUserInfo(null);
      setUserSearchError("Gagal mencari user Roblox");
    } finally {
      setIsSearchingUser(false);
    }
  };

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    if (username.trim().length >= 2) {
      const timeout = setTimeout(() => {
        searchUserInfo(username.trim());
      }, 500);
      setSearchTimeout(timeout);
    } else {
      setUserInfo(null);
      setUserSearchError(null);
    }
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [username]);

  // Pre-fill user contact info
  useEffect(() => {
    if (user) {
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

  // Load payment methods
  useEffect(() => {
    const loadPaymentData = async () => {
      try {
        setPaymentMethodsLoading(true);
        const settingsRes = await fetchPaymentSettings();
        const settings = settingsRes?.settings || settingsRes?.data;
        const gateway = settings?.activePaymentGateway || "midtrans";
        setActivePaymentGateway(gateway);

        let methodsRes = await fetchPaymentMethods(gateway);
        let methodsList: any[] = methodsRes?.data || [];

        // Fallback: if selected gateway has no methods, try alternative gateway
        if (!methodsList || methodsList.length === 0) {
          const altGateway = gateway === "midtrans" ? "duitku" : "midtrans";
          const altRes = await fetchPaymentMethods(altGateway);
          if (altRes?.data && altRes.data.length > 0) {
            methodsList = altRes.data;
          }
        }

        const getCategoryDisplayName = (cat: string) => {
          const c = (cat || "").toLowerCase();
          if (c === "bank_transfer" || c.includes("va") || c.includes("transfer")) return "Virtual Account";
          if (c === "qris") return "QRIS";
          if (c === "ewallet" || c === "e-wallet") return "E-Wallet";
          if (c === "retail" || c === "cstore") return "Convenience Store / Retail";
          if (c === "credit_card" || c === "cc") return "Kartu Kredit";
          return (cat || "Lainnya").toUpperCase().replace(/_/g, " ");
        };

        const groupedMethods: Record<string, PaymentCategory> = {};

        if (Array.isArray(methodsList) && methodsList.length > 0) {
          methodsList.forEach((method: any) => {
            const rawCat = method.category || "other";
            if (!groupedMethods[rawCat]) {
              groupedMethods[rawCat] = {
                id: rawCat,
                name: getCategoryDisplayName(rawCat),
                icon: method.icon || "💳",
                description: "",
                methods: [],
              };
            }

            groupedMethods[rawCat].methods.push({
              id: method.code || method._id || method.id,
              name: method.name,
              icon: method.icon || "💳",
              fee: Number(method.fee) || 0,
              feeType: method.feeType || "fixed",
              description: method.description || "",
              minimumAmount: Number(method.minimumAmount) || 0,
              maximumAmount: Number(method.maximumAmount) || 0,
            });
          });
        }

        const categories = Object.values(groupedMethods);

        if (user) {
          const coinCategory: PaymentCategory = {
            id: "internal",
            name: "Saldo Internal",
            icon: "/icon/dollar.png",
            description: "Bayar menggunakan RBXNET Credits",
            methods: [
              {
                id: "RBXNET_COIN",
                name: "RBXNET Credits",
                icon: "/icon/dollar.png",
                fee: 0,
                feeType: "fixed" as const,
                description: `Saldo saat ini: ${user.balance || 0} Credits`,
                minimumAmount: 0,
                maximumAmount: 0,
              },
            ],
          };
          categories.unshift(coinCategory);
        }

        setPaymentCategories(categories);

        // Default select first available category & method
        if (categories.length > 0) {
          const firstWithMethods = categories.find((c) => c.methods && c.methods.length > 0);
          if (firstWithMethods) {
            setExpandedCategory(firstWithMethods.id);
            setSelectedPaymentMethod(firstWithMethods.methods[0].id);
          }
        }
      } catch (error) {
        console.error("Error loading payment data:", error);
      } finally {
        setPaymentMethodsLoading(false);
      }
    };

    loadPaymentData();
  }, [user]);

  // Calculate price dynamically from robux amount and admin rate
  const getCurrentPrice = () => {
    if (!robux || robux <= 0) return 0;
    return Math.ceil((robux / 100) * pricing.pricePerHundred);
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
      const methodObj = paymentCategories
        .flatMap((c) => c.methods || [])
        .find((m) => m.id === selectedPaymentMethod);
      if (methodObj) {
        const feeType = methodObj.feeType || "flat";
        const feeValue = Number(methodObj.fee) || 0;
        const price = getCurrentPrice();
        if ((feeType as string) === "percent" || feeType === "percentage") {
          return Math.ceil((price * feeValue) / 100);
        } else {
          return feeValue;
        }
      }
    }
    return 0;
  };

  const getDiscountAmount = () => {
    if (user) {
      return Math.round((getCurrentPrice() * ((user as any).diskon || 0)) / 100);
    }
    return 0;
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!robux || robux < pricing.minRobux) {
        toast.error(`Minimal pembelian adalah ${pricing.minRobux} Robux!`);
        return;
      }
      if (robux > pricing.maxRobux) {
        toast.error(`Maksimal pembelian adalah ${pricing.maxRobux.toLocaleString("id-ID")} Robux!`);
        return;
      }
    } else if (currentStep === 2) {
      if (!username || !userInfo) {
        toast.error("Username Roblox harus valid dan ditemukan!");
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
    setCurrentStep((prev) => Math.min(prev + 1, 3));
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleApplyPromo = async () => {
    if (!user) {
      toast.error("Harap login terlebih dahulu untuk menggunakan kode promo");
      return;
    }
    if (!promoCode || !robux) return;
    try {
      const price = getCurrentPrice();
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode,
          totalAmount: price,
          serviceType: "robux_instant",
        }),
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

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk menambahkan ke keranjang");
      router.push("/login");
      return;
    }

    if (!robux || robux < pricing.minRobux) {
      toast.error(`Minimal pembelian adalah ${pricing.minRobux} Robux!`);
      return;
    }

    if (!username || !userInfo) {
      toast.error("Username Roblox harus valid dan ditemukan!");
      return;
    }

    try {
      setIsAddingToCart(true);

      const cartItem = {
        userId: user.id,
        serviceType: "robux_instant",
        serviceId: `username_${robux}`,
        serviceName: `Topup RBX via Username - ${robux} Robux`,
        serviceImage: "/icon/icons8-robux-48 (2).png",
        imgUrl: "/icon/icons8-robux-48 (2).png",
        serviceCategory: "robux_username",
        quantity: 1,
        unitPrice: getCurrentPrice(),
        robloxUsername: username,
        robloxPassword: "",
        robuxInstantDetails: {
          robuxAmount: robux,
          productName: `${robux} Robux via Username`,
          description: `Transfer ${robux} Robux langsung ke akun ${username}`,
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
    if (!robux || robux < pricing.minRobux) {
      toast.error(`Minimal pembelian adalah ${pricing.minRobux} Robux!`);
      return;
    }
    if (!agreedToTerms) {
      toast.error("Anda harus menyetujui syarat & ketentuan");
      return;
    }
    try {
      setSubmitting(true);
      const requestData = {
        serviceType: "robux_instant",
        serviceId: `username_${robux}`,
        serviceName: `Topup RBX via Username - ${robux} Robux`,
        serviceImage: "/icon/icons8-robux-48 (2).png",
        serviceCategory: "robux_username",
        quantity: 1,
        robloxUsername: username,
        robloxPassword: "",
        robuxInstantDetails: {
          robuxAmount: robux,
          productName: `${robux} Robux via Username`,
          description: `Transfer ${robux} Robux langsung ke akun ${username}`,
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
              onSuccess: () => router.push(`/riwayat/${result.data.transaction._id}`),
              onPending: () => router.push(`/riwayat/${result.data.transaction._id}`),
              onError: () => toast.error("Pembayaran gagal!"),
              onClose: () => router.push(`/riwayat/${result.data.transaction._id}`),
            });
          }
        } else {
          router.push(result.data?.transaction?._id ? `/riwayat/${result.data.transaction._id}` : "/riwayat");
        }
      } else {
        toast.error(result.error || "Gagal membuat pesanan");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat memproses pesanan");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Preset Nominals (Popular options)
  const defaultPresets = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
  const activePresets = defaultPresets.filter(
    (p) => p >= (pricing?.minRobux || 50) && p <= (pricing?.maxRobux || 10000)
  );

  if (pricingLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary-100 shadow-lg shadow-primary-100/50"></div>
          <p className="mt-4 text-base font-medium text-white/80">Memuat layanan Robux...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="px-3 sm:px-6 md:px-8 pb-16 pt-2">

      {/* Banner Header */}
      <div className="max-w-6xl mx-auto px-2 mb-6">
        <div className="w-full h-[180px] sm:h-[230px] md:h-[270px] relative rounded-2xl overflow-hidden group border border-primary-100/20 shadow-2xl">
          <Image
            src="/rbx_instant.webp"
            alt="Robux Username Banner"
            fill
            className="object-cover transform transition-transform duration-700 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0718] via-[#0d0718]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d0718]/90 via-transparent to-[#0d0718]/90"></div>

          <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100/20 border border-primary-100/40 text-primary-50 text-xs font-semibold backdrop-blur-md mb-2 shadow-sm">
              <Zap className="w-3.5 h-3.5 text-primary-100 animate-pulse" />
              <span>Transfer Otomatis API • Tanpa Password</span>
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
              Top Up Robux via{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-100 via-primary-50 to-primary-200">
                Username
              </span>
            </h1>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Product Information & Live Rate / Summary */}
        <div className="space-y-4">
          <div className="group relative bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl border border-primary-100/30 rounded-3xl p-5 sm:p-6 shadow-xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-100/5 via-transparent to-primary-200/5 pointer-events-none"></div>

            {/* Service Brand Header */}
            <div className="flex items-center gap-4 pb-5 border-b border-primary-100/20">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100/25 via-primary-200/20 to-primary-100/15 border border-primary-100/40 flex items-center justify-center p-2 shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/icon/icons8-robux-48 (2).png"
                  alt="Robux Icon"
                  width={44}
                  height={44}
                  className="object-contain drop-shadow-[0_4px_12px_rgba(246,58,230,0.5)]"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary-100 animate-ping" />
                  Transfer Langsung
                </span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">Topup via Username</h3>
                <p className="text-xs text-white/60">Hanya butuh Username Roblox</p>
              </div>
            </div>

            {/* Feature Badges 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2 my-4">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <Zap className="w-3.5 h-3.5 text-primary-100 shrink-0" />
                <span className="text-white/80 font-medium">Proses Cepat</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="text-white/80 font-medium">100% Legal</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-white/80 font-medium">No Password</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-white/80 font-medium">24/7 Siap</span>
              </div>
            </div>

            {/* Price Rate Information */}
            <div className="bg-primary-950/60 border border-primary-100/20 rounded-2xl p-4 space-y-2 mb-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Harga per 100 Robux</span>
                <span className="font-bold text-primary-100">
                  {formatCurrency(pricing.pricePerHundred)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Harga per 1 Robux</span>
                <span className="font-medium text-white/90">
                  {formatCurrency(Math.ceil(pricing.pricePerHundred / 100))}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Minimal Order</span>
                <span className="font-semibold text-yellow-300">{pricing.minRobux} Robux</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-white/60">Maksimal Order</span>
                <span className="font-medium text-white/80">{pricing.maxRobux.toLocaleString("id-ID")} Robux</span>
              </div>
            </div>

            {/* Live Order Estimate Card */}
            <div className="bg-black/50 border border-primary-100/25 rounded-2xl p-4 mb-5">
              <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                <span>Ringkasan Pilihan:</span>
                <span className="text-primary-100 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-100 animate-pulse" />
                  Live Estimasi
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-black text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-primary-100" />
                  {robux ? robux.toLocaleString("id-ID") : "0"} Robux
                </span>
                <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-200">
                  {formatCurrency(getCurrentPrice())}
                </span>
              </div>
              {username && (
                <div className="mt-2.5 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-white/50">Akun Roblox:</span>
                  <span className="text-white font-medium truncate max-w-[150px]">
                    @{username}
                  </span>
                </div>
              )}
            </div>

            {/* Cara Order Guide */}
            <div className="space-y-2.5 pt-2">
              <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider mb-2">
                Cara Pemesanan:
              </h4>
              {[
                { step: 1, text: `Tentukan nominal Robux (Min. ${pricing.minRobux} Robux).` },
                { step: 2, text: "Ketik username Roblox akun penerima." },
                { step: 3, text: "Pilih metode pembayaran favorit Anda." },
                { step: 4, text: "Robux langsung terkirim otomatis ke akun!" },
              ].map((c) => (
                <div key={c.step} className="flex items-start gap-2.5 text-xs text-white/70">
                  <div className="w-5 h-5 rounded-full bg-primary-100/20 text-primary-100 border border-primary-100/30 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {c.step}
                  </div>
                  <span className="leading-snug">{c.text}</span>
                </div>
              ))}
            </div>

            {/* Review Button */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsShowReview(!isShowReview)}
                className="w-full py-2.5 px-4 rounded-xl border border-primary-100/30 hover:border-primary-100 bg-primary-950/40 hover:bg-primary-900/40 text-xs font-semibold text-white/80 hover:text-white transition-all text-center shadow-sm"
              >
                {isShowReview ? "Sembunyikan" : "Lihat"} Review Pembeli
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Wizard */}
        <div className="lg:col-span-2 space-y-5">
          {/* Stepper Header */}
          <div className="relative rounded-2xl border border-primary-100/30 bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl px-5 py-4 shadow-lg overflow-hidden">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 bg-primary-100/20 border border-primary-100/40 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-100" />
              </div>
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                Langkah Pemesanan
              </span>
            </div>

            <div className="flex justify-between items-center relative px-2">
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-white/10 rounded-full z-0" />
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full z-0 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 2) * 85}%` }}
              />

              {[
                { step: 1, label: "Nominal Robux" },
                { step: 2, label: "Data Akun" },
                { step: 3, label: "Pembayaran" },
              ].map((s) => (
                <div key={s.step} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      currentStep >= s.step
                        ? "bg-gradient-to-br from-primary-100 to-primary-200 text-white shadow-lg shadow-primary-100/40 font-black scale-105"
                        : "bg-primary-950/80 text-white/40 border border-white/10"
                    }`}
                  >
                    {currentStep > s.step ? <CheckCircle2 className="w-4 h-4 text-white" /> : s.step}
                  </div>
                  <span
                    className={`text-[11px] font-semibold tracking-tight ${
                      currentStep >= s.step ? "text-primary-100" : "text-white/40"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* STEP 1: PILIH NOMINAL ROBUX */}
          {currentStep === 1 && (
            <div className="animate-in fade-in duration-300 relative rounded-3xl border border-primary-100/30 bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl p-5 sm:p-7 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-primary-100/20">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Coins className="w-6 h-6 text-primary-100" />
                    Pilih Nominal <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-200">Robux</span>
                  </h2>
                  <p className="text-xs text-white/60 mt-1">
                    Bebas masukkan nominal Robux sesuai keinginan (Minimal {pricing.minRobux} Robux)
                  </p>
                </div>
                <div className="px-3 py-1 bg-primary-100/15 border border-primary-100/40 rounded-full text-xs font-bold text-primary-100">
                  Langkah 1 / 3
                </div>
              </div>

              {/* Custom Robux Number Input Card */}
              <div className="bg-primary-950/70 border border-primary-100/30 rounded-2xl p-4 sm:p-6 shadow-inner focus-within:border-primary-100 transition-colors">
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-2.5">
                  Ketik Jumlah Robux:
                </label>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center">
                      <Image
                        src="/icon/icons8-robux-48 (2).png"
                        alt="R$"
                        width={24}
                        height={24}
                        className="object-contain"
                      />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={robuxInput}
                      onChange={(e) => handleRobuxChange(e.target.value)}
                      placeholder={`Contoh: ${pricing.minRobux}`}
                      className="w-full bg-black/60 border border-white/20 focus:border-primary-100 focus:ring-1 focus:ring-primary-100/50 rounded-xl py-3 pl-12 pr-16 text-lg sm:text-xl font-bold text-white outline-none transition-all placeholder-white/30"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary-100">
                      ROBUX
                    </span>
                  </div>

                  {/* Stepper Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStepAmount(-100)}
                      disabled={robux <= pricing.minRobux}
                      className="flex items-center justify-center px-3 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/15 rounded-xl text-white font-bold transition-all text-xs cursor-pointer disabled:cursor-not-allowed"
                      title="Kurangi 100 Robux"
                    >
                      <Minus className="w-3.5 h-3.5 mr-0.5" /> 100
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepAmount(-50)}
                      disabled={robux <= pricing.minRobux}
                      className="flex items-center justify-center px-3 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/15 rounded-xl text-white font-bold transition-all text-xs cursor-pointer disabled:cursor-not-allowed"
                      title="Kurangi 50 Robux"
                    >
                      <Minus className="w-3.5 h-3.5 mr-0.5" /> 50
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepAmount(50)}
                      disabled={robux >= pricing.maxRobux}
                      className="flex items-center justify-center px-3 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/15 rounded-xl text-white font-bold transition-all text-xs cursor-pointer disabled:cursor-not-allowed"
                      title="Tambah 50 Robux"
                    >
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> 50
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepAmount(100)}
                      disabled={robux >= pricing.maxRobux}
                      className="flex items-center justify-center px-3 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/15 rounded-xl text-white font-bold transition-all text-xs cursor-pointer disabled:cursor-not-allowed"
                      title="Tambah 100 Robux"
                    >
                      <Plus className="w-3.5 h-3.5 mr-0.5" /> 100
                    </button>
                  </div>
                </div>

                {/* Validation Error / Calculation Hint */}
                {robuxError ? (
                  <p className="mt-2.5 text-xs text-red-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {robuxError}
                  </p>
                ) : (
                  <div className="mt-2.5 flex flex-wrap items-center justify-between text-xs text-white/60 gap-1">
                    <span>
                      Batas: <strong className="text-white/80">{pricing.minRobux} Robux</strong> s/d{" "}
                      <strong className="text-white/80">{pricing.maxRobux.toLocaleString("id-ID")} Robux</strong>
                    </span>
                    <span className="text-primary-100 font-bold">
                      = {formatCurrency(getCurrentPrice())}
                    </span>
                  </div>
                )}
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">
                  Atau Pilih Nominal Populer:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activePresets.map((preset) => {
                    const isSelected = robux === preset;
                    const presetPrice = Math.ceil((preset / 100) * pricing.pricePerHundred);
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={`group relative text-left rounded-2xl p-3.5 sm:p-4 transition-all duration-200 border flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-br from-primary-100/25 to-primary-200/20 border-primary-100 shadow-lg shadow-primary-100/30 ring-2 ring-primary-100/50"
                            : "bg-primary-950/40 border-primary-100/20 hover:border-primary-100/50 hover:bg-primary-900/30"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-base sm:text-lg font-black transition-colors ${
                            isSelected ? "text-white" : "text-white/90 group-hover:text-primary-100"
                          }`}>
                            {preset.toLocaleString("id-ID")} Robux
                          </span>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center">
                            {isSelected ? (
                              <CheckCircle className="w-4 h-4 text-primary-100" />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-white/20 group-hover:bg-primary-100/50" />
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-extrabold text-primary-100">
                          {formatCurrency(presetPrice)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 1 Next Button */}
              <div className="pt-4 border-t border-primary-100/20 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!robux || robux < pricing.minRobux || robux > pricing.maxRobux}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold text-sm sm:text-base rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 shadow-lg shadow-primary-100/30 cursor-pointer disabled:cursor-not-allowed"
                >
                  Lanjut ke Data Akun
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATA AKUN & USERNAME */}
          {currentStep === 2 && (
            <div className="animate-in fade-in duration-300 relative rounded-3xl border border-primary-100/30 bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl p-5 sm:p-7 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-primary-100/20">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                    <User className="w-6 h-6 text-primary-100" />
                    Username Roblox Penerima
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    Masukkan username akun Roblox yang akan menerima transfer Robux
                  </p>
                </div>
                <button
                  type="button"
                  onClick={prevStep}
                  className="text-xs font-semibold text-white/70 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Kembali
                </button>
              </div>

              {/* Username Input Field */}
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold mb-2 text-white">
                  <User className="w-4 h-4 text-primary-100" />
                  Username Roblox <span className="text-red-400">*</span>
                </label>
                <div
                  className={`flex items-center border rounded-xl overflow-hidden bg-black/50 transition-all ${
                    userInfo
                      ? "border-primary-100 bg-primary-100/10 shadow-md shadow-primary-100/20"
                      : username && userSearchError
                      ? "border-red-500/60 bg-red-500/10"
                      : "border-primary-100/30 focus-within:border-primary-100 focus-within:ring-1 focus-within:ring-primary-100/40"
                  }`}
                >
                  <input
                    type="text"
                    placeholder="Contoh: Builderman"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="py-3 px-4 outline-none text-sm text-white placeholder-white/40 flex-1 bg-transparent w-full font-medium"
                  />
                  <div className="px-4">
                    {isSearchingUser ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary-100" />
                    ) : userInfo ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : username && userSearchError ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : (
                      <Search className="w-4 h-4 text-white/40" />
                    )}
                  </div>
                </div>

                {/* Verified Roblox Avatar Preview */}
                {userInfo && (
                  <div className="mt-3.5 flex items-center justify-between p-3.5 bg-gradient-to-r from-primary-100/15 via-primary-200/10 to-primary-100/15 border border-primary-100/40 rounded-2xl animate-in fade-in duration-300">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={userInfo.avatar || userInfo.avatarUrl}
                        alt={userInfo.username || userInfo.name}
                        className="w-12 h-12 rounded-xl ring-2 ring-primary-100 object-cover bg-black/40 shrink-0 shadow-md"
                      />
                      <div className="overflow-hidden">
                        <p className="text-sm text-white font-extrabold truncate">
                          {userInfo.displayName || userInfo.username}
                        </p>
                        <p className="text-xs text-primary-100/90 font-medium">
                          @{userInfo.username || userInfo.name} • ID: {userInfo.userId || userInfo.id}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold rounded-full shrink-0">
                      Akun Terverifikasi
                    </span>
                  </div>
                )}

                {userSearchError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {userSearchError}
                  </p>
                )}
              </div>

              {/* Syarat Akun Penerima Robux */}
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/70 via-orange-950/50 to-amber-900/40 shadow-lg">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2.5 mb-3.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-base shrink-0 shadow-inner">
                      ⚠️
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-300 tracking-wide">
                        Syarat Wajib Akun Penerima Robux
                      </h4>
                      <p className="text-[11px] text-amber-400/70 mt-0.5">
                        Pastikan akun Roblox memenuhi syarat berikut agar proses transfer lancar
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-xs text-amber-100/90 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        1
                      </div>
                      <p>
                        Untuk akun <strong className="text-amber-300">Roblox Kids</strong> &amp;{" "}
                        <strong className="text-amber-300">Roblox Select</strong>, pastikan akun sudah punya{" "}
                        <strong className="text-amber-300">email pemulihan orang tua</strong> untuk klaim Robux.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        2
                      </div>
                      <p>
                        Pastikan akun sudah <strong className="text-amber-300">verifikasi umur 18+</strong> di Roblox.
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                        3
                      </div>
                      <p>
                        Pembelian di atas <strong className="text-amber-300">500 Robux per hari</strong> wajib mengaktifkan{" "}
                        <strong className="text-amber-300">verifikasi 2 langkah (2FA)</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-white mb-2">
                    Email Aktif <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full bg-black/50 border border-primary-100/30 focus:border-primary-100 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none transition-colors"
                  />
                  <span className="text-[10px] text-white/40 mt-1 block">
                    Untuk menerima invoice &amp; bukti transaksi
                  </span>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-white mb-2">
                    Nomor WhatsApp <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="08123456789"
                    className={`w-full bg-black/50 border ${
                      phoneError ? "border-red-500" : "border-primary-100/30 focus:border-primary-100"
                    } rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none transition-colors`}
                  />
                  {phoneError ? (
                    <span className="text-[10px] text-red-400 mt-1 block">{phoneError}</span>
                  ) : (
                    <span className="text-[10px] text-white/40 mt-1 block">
                      Untuk update status order otomatis
                    </span>
                  )}
                </div>
              </div>

              {/* Step 2 Action Button */}
              <div className="pt-4 border-t border-primary-100/20 flex justify-end">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!username || !userInfo || isSearchingUser || (!user && (!email || !phone))}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold text-sm sm:text-base rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 shadow-lg shadow-primary-100/30 cursor-pointer disabled:cursor-not-allowed"
                >
                  Pilih Pembayaran
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PEMBAYARAN & CHECKOUT */}
          {currentStep === 3 && (
            <div className="animate-in fade-in duration-300 relative rounded-3xl border border-primary-100/30 bg-gradient-to-br from-primary-900/40 via-primary-800/30 to-primary-700/40 backdrop-blur-xl p-5 sm:p-7 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-primary-100/20">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
                    <CreditCard className="w-6 h-6 text-primary-100" />
                    Pilih Metode Pembayaran
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    Selesaikan pesanan Anda dengan metode pembayaran yang tersedia
                  </p>
                </div>
                <button
                  type="button"
                  onClick={prevStep}
                  className="text-xs font-semibold text-white/70 hover:text-white px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Kembali
                </button>
              </div>

              {/* Payment Methods Component */}
              <PaymentMethodSelector
                categories={paymentCategories}
                selectedMethod={selectedPaymentMethod}
                onSelectMethod={setSelectedPaymentMethod}
                expandedCategory={expandedCategory}
                onToggleCategory={setExpandedCategory}
                loading={paymentMethodsLoading}
                baseAmount={getCurrentPrice()}
              />

              {/* Order Summary Component */}
              <OrderSummaryCard
                details={[
                  { label: "Layanan", value: "Topup Robux via Username" },
                  { label: "Nominal Robux", value: `${robux.toLocaleString("id-ID")} Robux` },
                  { label: "Username Roblox", value: `@${username}` },
                  { label: "Rate Harga", value: `${formatCurrency(pricing.pricePerHundred)} / 100 Robux` },
                ]}
                baseAmount={getCurrentPrice()}
                paymentFee={getPaymentFee()}
                discount={getDiscountAmount()}
                promoDiscount={promoDiscount}
                promoCode={promoCode}
                onPromoCodeChange={setPromoCode}
                onApplyPromo={handleApplyPromo}
                appliedPromoCode={appliedPromoCode || undefined}
                selectedPaymentMethod={selectedPaymentMethod}
              />

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none p-3.5 rounded-xl bg-black/40 border border-primary-100/20 hover:border-primary-100/40 transition-colors">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-primary-100/40 text-primary-100 focus:ring-primary-100 bg-black/60 cursor-pointer accent-[#f63ae6]"
                />
                <span className="text-xs text-white/80 leading-relaxed">
                  Saya sudah membaca dan menyetujui{" "}
                  <span className="text-primary-100 font-semibold">Syarat &amp; Ketentuan</span> serta memastikan akun Roblox penerima memenuhi syarat (email orang tua jika Kids/Select, umur 18+, dan 2FA jika &gt;500 Robux).
                </span>
              </label>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !agreedToTerms}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl border border-primary-100/30 bg-primary-950/40 hover:bg-primary-900/40 text-white font-bold text-sm transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isAddingToCart ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary-100" />
                  ) : (
                    <ShoppingCart className="w-4 h-4 text-primary-100" />
                  )}
                  Tambah ke Keranjang
                </button>

                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={submitting || !agreedToTerms || !selectedPaymentMethod}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white font-bold text-sm sm:text-base rounded-xl transition-all disabled:opacity-40 shadow-lg shadow-primary-100/30 cursor-pointer disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>Bayar Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Customer Reviews Section */}
          {isShowReview && (
            <div className="w-full mt-6">
              <ReviewSection
                serviceType="robux"
                serviceCategory="robux_instant"
                title="Reviews Robux via Username"
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
