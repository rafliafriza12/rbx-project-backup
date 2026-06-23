"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, CheckCircle2, ShoppingCart, User, Phone, Wallet, AlertCircle, Coins, Receipt } from "lucide-react";
import { getProductsByCategory } from "@/app/lib/actions";
import {
  fetchPaymentSettings,
  fetchPaymentMethods,
  createTransaction,
} from "@/app/checkout/actions";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import OrderSummaryCard from "@/components/checkout/OrderSummaryCard";
import {
  PaymentCategory,
  calculatePaymentFee,
  formatCurrency as formatCurrencyHelper
} from "@/lib/payment-helpers";

interface Product {
  _id: string;
  name: string;
  description: string;
  robuxAmount: number;
  price: number;
  bonusAmount?: number;
  isActive: boolean;
  category: "coin";
}

export default function TopupCoinPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [coinTopupPrice, setCoinTopupPrice] = useState<number>(1000);
  const [coinBonusTiers, setCoinBonusTiers] = useState<any[]>([]);
  const [customCoinAmount, setCustomCoinAmount] = useState<number>(50);
  const [isCustom, setIsCustom] = useState<boolean>(true);

  // Checkout States
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [activePaymentGateway, setActivePaymentGateway] = useState<string>("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [expandedCategory, setExpandedCategory] = useState<string>("qris");
  const [submitting, setSubmitting] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Silakan login terlebih dahulu untuk mengakses Top Up Credits");
      router.push("/login?redirect=/topup");
    }
  }, [user, authLoading, router]);

  // Load products & settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const result = await getProductsByCategory("coin");
        if (result.products) {
          const sortedProducts = result.products.sort(
            (a: Product, b: Product) => a.robuxAmount - b.robuxAmount
          );
          setProducts(sortedProducts);
        }

        // Fetch settings for coin price
        const settingsRes = await fetch("/api/settings/public");
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.data) {
          setCoinTopupPrice(settingsData.data.coinTopupPrice || 1000);
          setCoinBonusTiers(settingsData.data.coinBonusTiers || []);
        }
      } catch (error) {
        toast.error("Gagal memuat data credits");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      if (user.email && !email) setEmail(user.email);
      if (user.phone && !phone) setPhone(user.phone);
    }
  }, [user]);

  // Fetch payment methods
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
      } catch (err) {
        console.error("Error loading payment methods:", err);
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

  const getCurrentPrice = () => {
    if (isCustom) {
      return customCoinAmount * coinTopupPrice;
    }
    return selectedProduct ? selectedProduct.price : 0;
  };

  const getCoinQuantity = () => {
    if (isCustom) return customCoinAmount;
    return selectedProduct ? selectedProduct.robuxAmount : 0;
  };

  const getBonusInfo = () => {
    let amount = 0;
    let percentage = 0;

    if (!isCustom) {
      amount = selectedProduct?.bonusAmount || 0;
      percentage = selectedProduct?.robuxAmount ? (amount / selectedProduct.robuxAmount) * 100 : 0;
      return { amount, percentage: parseFloat(percentage.toFixed(2)) };
    }

    // Cek apakah angka custom sama persis dengan angka salah satu paket yang terdaftar
    const matchingProduct = products.find(p => p.robuxAmount === customCoinAmount);
    if (matchingProduct && !matchingProduct.useBonusTiers) {
      amount = matchingProduct.customBonusAmount || 0;
      percentage = customCoinAmount > 0 ? (amount / customCoinAmount) * 100 : 0;
      return { amount, percentage: parseFloat(percentage.toFixed(2)) };
    }

    // Calculate custom bonus based on tiers
    if (coinBonusTiers.length > 0 && customCoinAmount > 0) {
      let applicableTier = null;
      for (const tier of coinBonusTiers) {
        if (customCoinAmount >= tier.minAmount) {
          if (!applicableTier || tier.minAmount > applicableTier.minAmount) {
            applicableTier = tier;
          }
        }
      }

      if (applicableTier) {
        if (applicableTier.bonusType === "fixed") {
          amount = applicableTier.fixedBonus || 0;
          percentage = customCoinAmount > 0 ? (amount / customCoinAmount) * 100 : 0;
        } else {
          amount = Math.floor(customCoinAmount * ((applicableTier.percentage || 0) / 100));
          percentage = applicableTier.percentage || 0;
        }
      }
    }
    return { amount, percentage: parseFloat(percentage.toFixed(2)) };
  };

  const getCalculatedBonus = () => getBonusInfo().amount;

  const handleApplyPromo = async () => {
    if (!user) {
      toast.error("Harap login terlebih dahulu untuk menggunakan kode promo");
      return;
    }
    if (!promoCode) return;
    try {
      const price = getCurrentPrice();
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, totalAmount: price, serviceType: "coin_topup" }),
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
  
    const getPpnAmount = () => {
      return 0; // PPN dinonaktifkan
    };
  
    const handleSubmitOrder = async () => {
    if (getCoinQuantity() <= 0) {
      toast.error("Jumlah credits tidak valid");
      return;
    }

    if (!email || !phone) {
      toast.error("Mohon lengkapi email dan nomor telepon");
      return;
    }

    if (phoneError) {
      toast.error("Nomor WhatsApp tidak valid");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }

    setSubmitting(true);
    try {
      const price = getCurrentPrice();

      const requestData = {
        serviceType: "coin_topup",
        serviceId: isCustom ? "custom_coin" : (selectedProduct?._id || "custom_coin"),
        serviceName: isCustom ? "Top Up Custom Credits" : (selectedProduct?.name || "Top Up Credits"),
        serviceImage: "/icon/dollar.png",
        serviceCategory: "coin",
        quantity: getCoinQuantity(),
        unitPrice: isCustom ? coinTopupPrice : (price / getCoinQuantity()),
        robloxUsername: null,
        robloxPassword: null,
        paymentMethodId: selectedPaymentMethod,
        promoCode: appliedPromoCode || undefined,
        customerInfo: !user
          ? {
            name: "Guest",
            email: email,
            phone: phone,
          }
          : {
            name: `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() || user.username || "User",
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
          router.push(`/riwayat/${result.data.transaction?._id || ""}`);
        } else if (result.data?.redirectUrl) {
          window.location.href = result.data.redirectUrl;
        } else if (result.data?.duitkuPaymentUrl) {
          window.location.href = result.data.duitkuPaymentUrl;
        } else if (result.data?.transaction?._id) {
          router.push(`/transaction?order_id=${result.data.transaction.invoiceId}&transaction_status=settlement`);
        } else {
          router.push("/riwayat");
        }
      } else {
        toast.error(result.error || "Gagal membuat transaksi");
        setSubmitting(false);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Terjadi kesalahan sistem");
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (getCoinQuantity() <= 0) {
        toast.error("Pilih paket credits atau masukkan jumlah terlebih dahulu");
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2) {
      if (!email || !phone) {
        toast.error("Mohon lengkapi email dan nomor telepon");
        return;
      }
      if (phoneError) {
        toast.error("Nomor WhatsApp tidak valid");
        return;
      }
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3) {
      if (!selectedPaymentMethod) {
        toast.error("Pilih metode pembayaran terlebih dahulu");
        return;
      }
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading || authLoading || !user) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-fuchsia-400"></div>
          <p className="mt-4 text-lg font-medium text-white drop-shadow-lg">
            {authLoading || !user ? "Mengecek otorisasi..." : "Memuat paket credits..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Header Banner - Retained the original background as requested */}
      <div className="w-full bg-[#13081b] bg-gradient-to-r from-purple-900/40 via-purple-800/20 to-transparent border-b border-purple-500/20 py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Image src="/icon/dollar.png" alt="CoinBg" width={300} height={300} className="w-64 h-64 blur-sm object-cover" />
        </div>
        <div className="max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 bg-fuchsia-500/20 rounded-full flex items-center justify-center border border-fuchsia-400/30 p-2 shadow-[0_0_30px_rgba(217,70,239,0.3)]">
            <Image src="/icon/dollar.png" alt="Coin" width={80} height={80} className="w-full h-full drop-shadow-xl" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">
              Top Up <span className="text-fuchsia-400 drop-shadow-[0_0_10px_rgba(217,70,239,0.5)]">RBXNET Credits</span>
            </h1>
            <p className="text-fuchsia-100/70 max-w-xl text-sm sm:text-base">
              Gunakan Credits untuk bertransaksi lebih cepat tanpa potongan biaya admin dan proses yang sepenuhnya instan!
            </p>
          </div>
        </div>
      </div>

      {/* Stepper UI */}
      {currentStep > 1 && (
        <section className="max-w-4xl mx-auto px-4 mt-8 mb-4">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto">
            {/* Connecting lines */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-purple-900/50 -z-10 rounded-full"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-purple-400 to-purple-600 -z-10 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>

            {[
              { num: 1, label: "Pilih Nominal" },
              { num: 2, label: "Detail Info" },
              { num: 3, label: "Pembayaran" },
              { num: 4, label: "Konfirmasi" },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep >= step.num
                    ? "bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/30"
                    : "bg-purple-900/80 text-white/40 border border-purple-500/20"
                    }`}
                >
                  {step.num}
                </div>
                <div className={`text-xs font-medium hidden sm:block ${currentStep >= step.num ? "text-purple-300" : "text-white/40"
                  }`}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-4 mt-8 mb-8">
        {/* STEP 1: PILIH PAKET & ATUR JUMLAH KOIN */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white/5 backdrop-blur-md border border-purple-500/30 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden space-y-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="relative z-10 space-y-10">
                {/* Packages Section */}
                <div>
                  <div className="flex justify-between items-end mb-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Paket Credits <span className="text-fuchsia-400">Tersedia</span>
                    </h2>
                    {user && (
                      <div className="bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-full px-4 py-2 flex items-center gap-2">
                        <span className="text-sm text-fuchsia-100/70">Saldo Anda:</span>
                        <span className="font-bold text-fuchsia-400 text-lg flex items-center gap-1">
                          <Image src="/icon/dollar.png" alt="Coin" width={20} height={20} className="w-5 h-5 drop-shadow-sm" />
                          {user.balance || 0}
                        </span>
                      </div>
                    )}
                  </div>

                  {products.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/50 backdrop-blur-sm">
                      Belum ada paket credits yang tersedia.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {products.map((product) => (
                        <div
                          key={product._id}
                          onClick={() => {
                            setSelectedProduct(product);
                            setIsCustom(false);
                            setCustomCoinAmount(product.robuxAmount);
                          }}
                          className={`group relative p-5 rounded-2xl border cursor-pointer transition-all duration-300 backdrop-blur-md ${!isCustom && selectedProduct?._id === product._id
                            ? "bg-fuchsia-500/10 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.2)] transform -translate-y-1"
                            : "bg-white/5 border-white/10 hover:border-fuchsia-400/50 hover:bg-fuchsia-500/5"
                            }`}
                        >
                          {!isCustom && selectedProduct?._id === product._id && (
                            <div className="absolute -top-3 -right-3 bg-fuchsia-400 rounded-full p-1 shadow-lg z-10">
                              <CheckCircle2 className="w-6 h-6 text-fuchsia-950" />
                            </div>
                          )}

                          {product.bonusAmount && product.bonusAmount > 0 && (
                            <div className="absolute top-0 left-0 w-full overflow-hidden rounded-t-2xl">
                              <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-[10px] font-bold text-center py-1 tracking-wider uppercase">
                                Bonus +{product.bonusAmount} Credits
                              </div>
                            </div>
                          )}

                          <div className={`text-center ${product.bonusAmount && product.bonusAmount > 0 ? "pt-4" : ""}`}>
                            <div className="w-16 h-16 mx-auto mb-3 relative">
                              <Image src="/icon/dollar.png" alt="Coin" fill className="object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1 flex justify-center items-center gap-1">
                              {product.robuxAmount} Credits
                            </h3>
                            <div className="text-fuchsia-400 font-bold text-lg">
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Coin Input & Slider */}
                <div className="pt-8 border-t border-white/10 mt-8">
                  <div className="flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-full md:w-2/3">
                      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        Atur Jumlah <span className="text-purple-400">Credits</span>
                      </h2>
                      <p className="text-purple-200/60 text-sm mb-6">
                        Geser slider atau ketik jumlah credits secara spesifik jika tidak ada paket yang sesuai.
                      </p>

                      <div className="flex rounded-xl shadow-inner bg-black/20 border border-purple-500/30 overflow-hidden focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400 transition-all mb-8">
                        <span className="inline-flex items-center px-4 bg-purple-900/30 text-purple-300 font-bold border-r border-purple-500/30">
                          <Image src="/icon/dollar.png" alt="Coin" width={24} height={24} className="w-6 h-6" />
                        </span>
                        <input
                          type="number"
                          min="1"
                          value={customCoinAmount || ""}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCustomCoinAmount(isNaN(val) ? 0 : val);
                            setIsCustom(true);
                            setSelectedProduct(null);
                          }}
                          onClick={() => {
                            setIsCustom(true);
                            setSelectedProduct(null);
                          }}
                          className="flex-1 block w-full bg-transparent text-white text-xl font-bold px-4 py-4 outline-none placeholder:text-purple-300/30"
                          placeholder="Cth: 150"
                        />
                      </div>

                      {/* Slider UI */}
                      <div className="relative w-full px-2">
                        <div
                          className="absolute -top-10 transition-all duration-200 ease-out z-10 pointer-events-none"
                          style={{
                            left: `calc(${Math.min(customCoinAmount / 10000, 1) * 100}% - ${Math.min(customCoinAmount / 10000, 1) * 24}px + 12px)`,
                            transform: "translateX(-50%)",
                          }}
                        >
                          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-purple-500/20 whitespace-nowrap">
                            {customCoinAmount.toLocaleString()} Credits
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-600/90"></div>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={10000}
                          step={50}
                          value={customCoinAmount}
                          onChange={(e) => {
                            setCustomCoinAmount(Number(e.target.value));
                            setIsCustom(true);
                            setSelectedProduct(null);
                          }}
                          className="w-full h-3 rounded-full appearance-none cursor-pointer slider-custom"
                        />
                        <style jsx>{`
                      .slider-custom {
                        -webkit-appearance: none;
                        appearance: none;
                        background: linear-gradient(
                          to right,
                          #a855f7 0%,
                          #a855f7 ${(customCoinAmount / 10000) * 100}%,
                          rgba(168, 85, 247, 0.2) ${(customCoinAmount / 10000) * 100}%,
                          rgba(168, 85, 247, 0.2) 100%
                        );
                      }
                      .slider-custom::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        height: 24px;
                        width: 24px;
                        background: #a855f7;
                        border-radius: 20px;
                        border: 2px solid white;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(168, 85, 247, 0.5);
                      }
                    `}</style>
                      </div>
                    </div>

                    <div className="w-full md:w-1/3 flex justify-center md:justify-end">
                      <div className={`text-center p-6 rounded-xl border transition-all duration-300 w-full ${getCoinQuantity() > 0
                        ? "bg-purple-900/20 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        : "bg-black/20 border-white/10 opacity-50"
                        }`}>
                        <p className="text-sm text-purple-200/60 mb-1">Total Harga</p>
                        <div className="text-3xl font-black text-white mb-2">
                          {getCoinQuantity() > 0
                            ? formatCurrency(getCurrentPrice())
                            : "Rp 0"}
                        </div>
                        <div className="text-sm font-medium text-fuchsia-400 flex items-center justify-center gap-1">
                          <Image src="/icon/dollar.png" alt="Coin" width={16} height={16} />
                          {getCoinQuantity()} Credits {getCalculatedBonus() > 0 && <span className="text-green-400 font-bold">(+{getCalculatedBonus()} Bonus)</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bonus Display Banner */}
                {getCoinQuantity() > 0 && (
                  <div className="mt-8 border border-yellow-500 bg-[#232014] rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center shadow-lg gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center shadow-inner shrink-0">
                        <span className="text-white font-black text-2xl">$</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🎉</span>
                          <span className="text-yellow-500 font-bold text-lg">
                            {getBonusInfo().percentage > 0 ? `Bonus ${getBonusInfo().percentage}%!` : "Tanpa Bonus"}
                          </span>
                        </div>
                        <div className="text-white/80 text-sm mt-0.5">
                          Kamu mendapat +{getCalculatedBonus()} Credits gratis
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end">
                      <span className="text-white/80 text-sm mb-1">Total Credits:</span>
                      <span className="text-yellow-500 font-bold text-2xl">
                        {(getCoinQuantity() + getCalculatedBonus()).toLocaleString("id-ID")} Credits
                      </span>
                    </div>
                  </div>
                )}

                {/* Next Step Button */}
                <div className="flex justify-end pt-8 border-t border-white/10 mt-8">
                  <button
                    onClick={nextStep}
                    disabled={getCoinQuantity() <= 0}
                    className="flex items-center justify-center gap-2 px-10 py-4 w-full md:w-auto bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:-translate-y-1"
                  >
                    Lanjutkan
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: INFORMASI KONTAK */}
        {currentStep === 2 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto space-y-8">
            <div className="bg-white/5 backdrop-blur-md border border-purple-500/30 rounded-2xl p-6 md:p-8 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="w-6 h-6 text-purple-400" />
                Informasi Kontak
              </h3>
              <p className="text-purple-200/60 text-sm mb-6">
                Mohon lengkapi informasi kontak Anda di bawah ini untuk pengiriman detail pesanan.
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-purple-200/90 mb-2">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9+]/g, "");
                      setPhone(val);
                      if (val && !/^(?:\+62|62|0)[2-9][0-9]{7,11}$/.test(val)) {
                        setPhoneError("Format nomor WhatsApp tidak valid");
                      } else {
                        setPhoneError("");
                      }
                    }}
                    className={`w-full py-4 px-5 rounded-xl text-white font-medium outline-none transition-all duration-300 bg-black/20 border ${phoneError ? "border-red-400" : "border-purple-500/30 focus:border-purple-400"
                      } placeholder-white/30`}
                  />
                  {phoneError && (
                    <p className="text-red-400 text-xs mt-1.5 ml-1 absolute">{phoneError}</p>
                  )}
                </div>
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-purple-200/90 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Email untuk invoice"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-4 px-5 rounded-xl text-white font-medium outline-none transition-all duration-300 bg-black/20 border border-purple-500/30 focus:border-purple-400 placeholder-white/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-8 py-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors order-2 sm:order-1"
              >
                Kembali
              </button>
              <button
                onClick={nextStep}
                disabled={!email || !phone || phoneError !== ""}
                className="flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:-translate-y-1 order-1 sm:order-2"
              >
                Lanjutkan ke Pembayaran
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PILIH METODE PEMBAYARAN */}
        {currentStep === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-4xl mx-auto space-y-8">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-purple-500/30 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-purple-400" />
                Pilih Metode Pembayaran
              </h3>

              {paymentMethodsLoading ? (
                <div className="flex justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                </div>
              ) : (
                <PaymentMethodSelector
                  categories={paymentCategories}
                  loading={false}
                  selectedMethod={selectedPaymentMethod}
                  onSelectMethod={setSelectedPaymentMethod}
                  expandedCategory={expandedCategory}
                  onToggleCategory={setExpandedCategory}
                  baseAmount={getCurrentPrice() - promoDiscount}
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-8 py-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors order-2 sm:order-1"
              >
                Kembali
              </button>
              <button
                onClick={nextStep}
                disabled={!selectedPaymentMethod}
                className="flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:-translate-y-1 order-1 sm:order-2"
              >
                Lanjutkan Konfirmasi
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: KONFIRMASI ORDERAN */}
        {currentStep === 4 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">Konfirmasi Order</h2>
              <p className="text-purple-200/70">Periksa kembali detail pesanan Anda sebelum melakukan pembayaran.</p>
            </div>

            <OrderSummaryCard
              details={[
                { label: "Produk", value: isCustom ? "Top Up Custom Credits" : (selectedProduct?.name || "Top Up Credits") },
                ...(getCalculatedBonus() > 0 ? [{ label: "Bonus Credits", value: <span className="text-green-400 font-bold">+{getCalculatedBonus()} Credits</span> }] : []),
                { label: "Total Credits (termasuk Bonus)", value: `${getCoinQuantity() + getCalculatedBonus()}` },
                { label: "Metode Pembayaran", value: paymentCategories.flatMap(c => c.methods).find(m => m.id === selectedPaymentMethod)?.name || "-" },
                { label: "Email", value: email },
                { label: "No. WA", value: phone },
              ]}
              baseAmount={getCurrentPrice()}
              discountPercentage={user?.diskon || 0}
              discount={Math.round((getCurrentPrice() * (user?.diskon || 0)) / 100)}
              paymentFee={paymentCategories.flatMap(c => c.methods).find(m => m.id === selectedPaymentMethod) ? calculatePaymentFee(getCurrentPrice() - Math.round((getCurrentPrice() * (user?.diskon || 0)) / 100) - promoDiscount, paymentCategories.flatMap(c => c.methods).find(m => m.id === selectedPaymentMethod)!) : 0}
              promoCode={promoCode}
              onPromoCodeChange={setPromoCode}
              appliedPromoCode={appliedPromoCode || undefined}
              promoDiscount={promoDiscount}
              onApplyPromo={handleApplyPromo}
              ppnAmount={getPpnAmount()}
            />

            {/* Custom display for coin quantity in summary */}
            <div className="mt-4 bg-white/5 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center shadow-lg gap-4">
              <span className="text-purple-200/70 font-medium">Total Credits yang Diterima</span>
              <div className="flex flex-col items-center sm:items-end">
                <span className="text-fuchsia-400 font-bold flex items-center gap-2 text-2xl">
                  <Image src="/icon/dollar.png" alt="Coin" width={24} height={24} />
                  {getCoinQuantity() + getCalculatedBonus()}
                </span>
                {getCalculatedBonus() > 0 ? (
                  <span className="text-xs text-green-400 font-medium mt-1">
                    (Termasuk Bonus +{getCalculatedBonus()} Credits)
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-8 py-4 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors order-2 sm:order-1"
              >
                Kembali ke Pembayaran
              </button>
              <button
                onClick={handleSubmitOrder}
                disabled={submitting}
                className="flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:-translate-y-1 order-1 sm:order-2"
              >
                {submitting ? "Memproses..." : "Bayar Sekarang"}
                {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
