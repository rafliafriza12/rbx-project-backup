"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPaymentSettings,
  fetchPaymentMethods,
  createTransaction,
} from "@/app/checkout/actions";
import {
  getPublicSettings,
  getProductsByCategory,
  getRobuxPricing,
  getRbx5Stats,
  getUserPlaces,
  getUserInfo,
  checkGamepass,
  addToCartAction,
} from "@/app/lib/actions";
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
  Wallet,
  Building2,
  QrCode,
  Store,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ReviewSection from "@/components/ReviewSection";
import AddToCartButton from "@/components/AddToCartButton";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import OrderSummaryCard from "@/components/checkout/OrderSummaryCard";
import {
  PaymentCategory,
  calculatePaymentFee,
  formatCurrency
} from "@/lib/payment-helpers";

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

interface SiteSettings {
  whatsappNumber?: string;
  instagramUrl?: string;
  discordInvite?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  youtubeUrl?: string;
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
  const [currentStep, setCurrentStep] = useState(1);
  const [showEstimasiPopup, setShowEstimasiPopup] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPlacePopup, setShowPlacePopup] = useState(false);

  const sliderRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbLeft, setThumbLeft] = useState("0px");
  const [isFromHomepage, setIsFromHomepage] = useState(false);
  const [showEwalletOptions, setShowEwalletOptions] = useState(false);
  const [showQrisOptions, setShowQrisOptions] = useState(false);
  const [showVaOptions, setShowVaOptions] = useState(false);
  const [showMinimarketOptions, setShowMinimarketOptions] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Added Checkout State
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [promoDiscount, setPromoDiscount] = useState<number>(0);
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>([]);
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
  const [activePaymentGateway, setActivePaymentGateway] = useState<string>("");
  const [coinSpendValue, setCoinSpendValue] = useState<number>(1000);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [expandedCategory, setExpandedCategory] = useState<string>("qris");
  const [submitting, setSubmitting] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const [settings, setSettings] = useState<SiteSettings>({});

  const router = useRouter();

  const fetchSettings = async () => {
    try {
      const data = await getPublicSettings();
      if (data.success) {
        setSettings({
          whatsappNumber: data.settings.whatsappNumber,
          instagramUrl: data.settings.instagramUrl,
          discordInvite: data.settings.discordInvite,
          facebookUrl: data.settings.facebookUrl,
          twitterUrl: data.settings.twitterUrl,
          youtubeUrl: data.settings.youtubeUrl,
        });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch user places
  const fetchUserPlaces = async (userId: number) => {
    setIsLoadingPlaces(true);
    setPlacesError(null);

    try {
      const { ok, data } = await getUserPlaces(userId);

      if (data.success) {
        setUserPlaces(data.data || []);
        setPlacesError(null);
      } else {
        setUserPlaces([]);
        setPlacesError(data.message || "Gagal mengambil data place");
      }
    } catch (error) {
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
      const { ok, data } = await getUserInfo(username.trim());

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

        if (storedData) {
          const data = JSON.parse(storedData);

          if (data.fromHomePage && data.robuxAmount) {
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

              return `${offset}px`;
            };

            const newThumbLeft = calculateThumbPosition(data.robuxAmount);
            setThumbLeft(newThumbLeft);

            // Clear the data so it doesn't persist on page refresh
            sessionStorage.removeItem("rbx5InputData");
          } else {
            setHomepageDataProcessed(true);
          }
        } else {
          setHomepageDataProcessed(true);
        }
      } catch (error) {
        setHomepageDataProcessed(true);
      }
    };

    checkHomepageData();
    // fetchSettings();
  }, []);

  // Fetch products from database
  useEffect(() => {
    // Wait for homepage data to be processed first
    if (!homepageDataProcessed) return;

    const fetchProducts = async () => {
      try {
        const result = await getProductsByCategory("robux_5_hari");
        const sortedProducts = (result.products || []).sort(
          (a: Product, b: Product) => a.robuxAmount - b.robuxAmount,
        );
        setProducts(sortedProducts);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    const fetchRobuxPricingData = async () => {
      try {
        const result = await getRobuxPricing();
        if (result.success && result.data) {
          setCurrentRobuxPricing(result.data);
        }
      } catch (error) { }
    };

    const fetchStats = async () => {
      try {
        const result = await getRbx5Stats();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
      } finally {
        setLoadingStats(false);
      }
    };

    fetchProducts();
    fetchRobuxPricingData();
    fetchStats();
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
        "Jumlah RBX telah diubah. Silakan cek GamePass ulang untuk melanjutkan.",
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        },
      );
    }
  }, [robux, lastCheckedRobuxAmount]);

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
          if (settingsRes.settings.coinSpendValue) {
            setCoinSpendValue(settingsRes.settings.coinSpendValue);
          }

          const methodsRes = await fetchPaymentMethods(gateway);
          if (methodsRes.success && methodsRes.data) {
            // Group payment methods by category like checkout/page.tsx does
            const groupedMethods = methodsRes.data.reduce((acc: any, method: any) => {
              const category = method.category || "Lainnya";
              if (!acc[category]) {
                acc[category] = {
                  id: category,
                  name: category,
                  methods: [],
                };
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
      } catch (err) {
        console.error("Error loading payment methods:", err);
      } finally {
        setPaymentMethodsLoading(false);
      }
    };

    loadPaymentData();
  }, [user]);

  // Auto-select product when slider changes to match robux amount
  useEffect(() => {
    if (robux > 0 && products.length > 0) {
      const matchingProduct = products.find(
        (product) => product.robuxAmount === robux,
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

  const getAllMethods = () => {
    return paymentCategories.flatMap((category) => category.methods);
  };

  const getPaymentFee = () => {
    const method = getAllMethods().find((m) => m.id === selectedPaymentMethod);
    if (!method) return 0;
    return calculatePaymentFee(getCurrentPrice(), method);
  };

  const formatCurrencyLocal = (amount: number) => {
    return formatCurrency(amount);
  };

  // Get final price with discount
  const getFinalPrice = (product: Product) => {
    if (product.discountPercentage) {
      return product.price * (1 - product.discountPercentage / 100);
    }
    return product.price;
  };

  const getDiscountAmount = () => {
    if (!user) return 0;
    return Math.round((getCurrentPrice() * ((user as any).diskon || 0)) / 100);
  };

  const getPpnAmount = () => {
    return Math.round((getCurrentPrice() - getDiscountAmount() - promoDiscount) * 0.11);
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

  // Calculate gamepass amount (robux + Roblox tax fee)
  const getGamepassAmount = () => {
    if (robux <= 0) return 0;
    const feeMultiplier = parseFloat(
      process.env.NEXT_PUBLIC_GAMEPASS_FEE_MULTIPLIER || "1.43",
    );
    return Math.ceil(robux * feeMultiplier);
  };

  // Function to check if gamepass exists
  const checkGamepassExists = async () => {
    if (!selectedPlace || robux <= 0) return;

    setIsCheckingGamepass(true);
    setGamepassCheckResult(null);

    try {
      const expectedRobux = getGamepassAmount();
      const placeId = selectedPlace.placeId;

      if (!placeId) {
        toast.error("Place ID tidak ditemukan. Mohon pilih game terlebih dahulu.");
        setIsCheckingGamepass(false);
        return;
      }

      const { ok, data } = await checkGamepass(placeId, expectedRobux);

      if (!ok || !data) {
        throw new Error(data?.message ? String(data.message) : "Gagal memeriksa gamepass");
      }

      setGamepassCheckResult(data);

      if (data.success) {
        setGamepassInstructionShown(true);
        setShowGamepassModal(false);
        setLastCheckedRobuxAmount(robux);

        toast.success(
          `GamePass berhasil ditemukan! Nama: ${data.gamepass?.name || 'Unknown'}, Harga: ${data.gamepass?.price || expectedRobux} Robux`,
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
        let errorMessage = data.message ? String(data.message) : "GamePass tidak ditemukan.";
        if (data.allGamepasses && Array.isArray(data.allGamepasses) && data.allGamepasses.length > 0) {
          errorMessage += `. Pastikan GamePass dengan harga ${expectedRobux} RBX sudah dibuat dan aktif.`;
        } else {
          errorMessage += ` Belum ada GamePass di game ini. Silakan buat GamePass dengan harga ${expectedRobux} RBX terlebih dahulu.`;
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
    } catch (error: any) {
      console.error("Error in checkGamepassExists:", error);
      toast.error(
        error?.message ? String(error.message) : "Terjadi kesalahan saat memeriksa GamePass. Silakan coba lagi.",
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
      className={`transition-transform duration-300 ${open ? "rotate-180" : ""
        }`}
    >
      ⌄
    </span>
  );

  useEffect(() => {
    const updateThumb = () => {
      const slider = sliderRef.current;
      if (!slider) {
        return;
      }

      const maxRobux = 1000;
      const percent = Math.min(robux / maxRobux, 1);
      const sliderWidth = slider.offsetWidth;
      const thumbWidth = 50;
      const offset = percent * (sliderWidth - thumbWidth);

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

  // Validation per step
  const isStep1Valid =
    robux > 0 &&
    username.trim() !== "" &&
    userInfo !== null &&
    phone.trim() !== "" &&
    !phoneError &&
    email.trim() !== "";

  const isStep2Valid =
    selectedPlace !== null &&
    gamepassInstructionShown &&
    currentRobuxPricing !== null &&
    lastCheckedRobuxAmount === robux; // Ensure current robux amount matches the checked amount

  const isStep3Valid = selectedPaymentMethod !== "";

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
        body: JSON.stringify({ code: promoCode, totalAmount: price, serviceType: "rbx5" }),
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
    if (!isStep1Valid || !isStep2Valid || robux <= 0) {
      toast.error("Mohon lengkapi data dan pilih gamepass terlebih dahulu!");
      return;
    }

    if (!user) {
      toast.error("Silakan login terlebih dahulu untuk menambahkan ke keranjang");
      router.push("/login");
      return;
    }

    setIsAddingToCart(true);

    try {
      const sanitizeRbx5Details = () => {
        return {
          robuxAmount: robux,
          packageName: selectedPackage?.name || `Custom ${robux} Robux`,
          selectedPlace: selectedPlace
            ? {
              placeId: selectedPlace.placeId,
              name: selectedPlace.name,
            }
            : undefined,
          gamepassCreated: gamepassInstructionShown,
          backupCode: "",
          gamepass: gamepassCheckResult?.gamepass
            ? {
              id: gamepassCheckResult.gamepass.id,
              name: gamepassCheckResult.gamepass.name,
              productId: gamepassCheckResult.gamepass.productId,
              sellerId: gamepassCheckResult.gamepass.sellerId,
            }
            : undefined,
        };
      };

      const cartItem = {
        userId: user.id,
        serviceType: "robux",
        serviceId: selectedPackage?._id || `custom_${robux}`,
        serviceName: selectedPackage?.name || `${robux} Robux (5 Hari)`,
        serviceImage: "/robux-icon.png",
        imgUrl: "/robux-icon.png",
        serviceCategory: "robux_5_hari",
        quantity: 1,
        unitPrice: getCurrentPrice(),
        robloxUsername: username,
        robloxPassword: null,
        rbx5Details: sanitizeRbx5Details(),
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

  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid || robux <= 0 || submitting) return;

    setSubmitting(true);
    try {
      const price = getCurrentPrice();
      const fee = getPaymentFee();
      const finalAmountWithFee = price + fee;

      // Helper: strip sensitive price fields from rbx5Details before sending
      // Server will recalculate: unitPrice, gamepassAmount, pricePerRobux from DB
      const sanitizeRbx5Details = () => {
        return {
          robuxAmount: robux,
          packageName: selectedPackage?.name || `Custom ${robux} Robux`,
          selectedPlace: selectedPlace
            ? {
              placeId: selectedPlace.placeId,
              name: selectedPlace.name,
            }
            : undefined,
          gamepassCreated: gamepassInstructionShown,
          backupCode: "",
          // Gamepass: only send identifiers, server recalculates price
          gamepass: gamepassCheckResult?.gamepass
            ? {
              id: gamepassCheckResult.gamepass.id,
              name: gamepassCheckResult.gamepass.name,
              productId: gamepassCheckResult.gamepass.productId,
              sellerId: gamepassCheckResult.gamepass.sellerId,
            }
            : undefined,
        };
      };

      // Prepare request data based on single checkout format
      const requestData = {
        serviceType: "robux",
        serviceId: selectedPackage?._id || `custom_${robux}`,
        serviceName: selectedPackage?.name || `${robux} Robux (5 Hari)`,
        serviceImage: "/robux-icon.png",
        serviceCategory: "robux_5_hari",
        quantity: 1,
        robloxUsername: username,
        robloxPassword: null,
        rbx5Details: sanitizeRbx5Details(),
        paymentMethodId: selectedPaymentMethod,
        promoCode: appliedPromoCode || undefined,
        customerInfo: !user
          ? {
            name: username,
            email: email,
            phone: phone,
          }
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

        // Redirect to payment page based on response from API
        if (result.data?.qrCodeUrl) {
          if (result.data?.transaction?._id) {
            router.push(`/riwayat/${result.data.transaction._id}`);
          } else {
            router.push("/riwayat");
          }
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
      const result = await getRbx5Stats();
      if (result.success && result.data) {
        setStats(result.data);
      }
      toast.success("Statistik berhasil diperbarui!", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
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
                RBX Premium - GamePass Official
              </div>

              {/* Enhanced Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[0.9] tracking-tight">
                RBX <span className="text-primary-100">5 Hari</span>{" "}
              </h1>

              {/* Enhanced Description */}
              <p className="text-lg sm:text-base text-white/80 max-w-3xl mx-auto mb-8 font-light">
                RBX akan otomatis ditambahkan ke akunmu melalui{" "}
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

        {/* Stepper UI */}
        <section className="max-w-4xl mx-auto px-4 mt-8 mb-4">
          <div className="flex items-center justify-between relative">
            {/* Connecting lines */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-primary-900/50 -z-10 rounded-full"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-primary-100 to-primary-200 -z-10 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
            ></div>

            {[
              { num: 1, label: "Detail Informasi" },
              { num: 2, label: "Buat Gamepass" },
              { num: 3, label: "Metode Pembayaran" },
              { num: 4, label: "Konfirmasi Order" }
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${currentStep >= step.num
                    ? "bg-gradient-to-br from-primary-100 to-primary-200 text-white shadow-lg shadow-primary-100/30"
                    : "bg-primary-900/80 text-white/40 border border-primary-200/20"
                    }`}
                >
                  {step.num}
                </div>
                <div className={`text-xs font-medium hidden sm:block ${currentStep >= step.num ? "text-primary-100" : "text-white/40"
                  }`}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STEP 1: Detail Informasi */}
        {currentStep === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">

            <section className="max-w-4xl mx-auto mt-8 px-4">
              <div className="bg-gradient-to-br from-primary-900/30 via-primary-800/20 to-primary-700/30 backdrop-blur-xl border border-primary-100/20 rounded-2xl p-6 sm:p-10 shadow-xl shadow-primary-100/10">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-white">
                    <span className="text-transparent bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text">Detail Informasi</span>
                  </h2>
                </div>

                <div className="space-y-6 max-w-3xl mx-auto">

                  {/* Username Input */}
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                      {userInfo ? (
                        <img src={userInfo.avatar} alt="Avatar" className="w-8 h-8 rounded-full ring-2 ring-emerald-400/50" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-800/80 border border-primary-200/20 flex items-center justify-center">
                          <Users className="w-4 h-4 text-white/50" />
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Masukan Username RBX"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full py-4 pl-14 sm:pl-16 pr-10 sm:pr-12 rounded-xl text-white font-medium outline-none transition-all duration-300 backdrop-blur-xl ${userInfo
                        ? "bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-400/60"
                        : username && userSearchError
                          ? "bg-gradient-to-r from-red-500/20 to-red-600/10 border-2 border-red-400/60"
                          : "bg-gradient-to-r from-primary-600/20 to-primary-700/10 border-2 border-primary-200/50 focus:border-primary-100/80"
                        } placeholder:text-white/50 text-sm sm:text-lg`}
                    />
                    {userInfo ? (
                      <CheckCircle2 className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400" />
                    ) : isSearchingUser ? (
                      <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 animate-spin text-primary-100" />
                    ) : null}
                  </div>

                  {userSearchError && username && username.length >= 2 && !isSearchingUser && (
                    <div className="text-red-400 text-sm mt-1">{userSearchError}</div>
                  )}

                  {/* Robux & Price */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative flex rounded-xl overflow-hidden backdrop-blur-xl border border-primary-200/40 focus-within:border-primary-100/60 transition-all duration-300">
                      <div className="bg-gradient-to-r from-primary-100/30 to-primary-200/20 px-4 sm:px-5 flex items-center justify-center border-r border-primary-200/30">
                        <div
                          className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-100 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]"
                          style={{
                            maskImage: 'url(/robux.png)',
                            WebkitMaskImage: 'url(/robux.png)',
                            maskSize: 'contain',
                            WebkitMaskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            WebkitMaskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskPosition: 'center',
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Contoh: 100 R$"
                        value={robux || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "") { setRobux(0); return; }
                          const numValue = parseInt(value.replace(/\D/g, ""));
                          if (!isNaN(numValue)) setRobux(numValue);
                        }}
                        onBlur={() => {
                          if (robux < 25) setRobux(25);
                          else if (robux > 5000) setRobux(5000);
                        }}
                        className="flex-1 bg-gradient-to-r from-primary-600/10 to-primary-700/5 text-white text-lg font-bold outline-none px-4 py-4 placeholder:text-white/40"
                      />
                    </div>

                    <div className="relative flex rounded-xl overflow-hidden backdrop-blur-xl border border-emerald-400/40">
                      <div className="flex-1 bg-gradient-to-r from-emerald-500/10 to-green-500/5 text-emerald-300 text-lg font-bold px-4 py-4 flex items-center">
                        {formatCurrency(getCurrentPrice())}
                      </div>
                      <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/10 px-5 flex items-center justify-center border-l border-emerald-400/30">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                  </div>

                  {/* Slider */}
                  <div className="py-2 px-2 mt-4">
                    <div className="flex justify-between items-center mb-8">
                      <div className="text-white/70 text-sm font-medium">Atur jumlah RBX:</div>
                    </div>
                    <div className="relative w-full">
                      {/* Moving Tooltip */}
                      <div
                        className="absolute -top-10 transition-all duration-200 ease-out z-10 pointer-events-none"
                        style={{
                          left: `calc(${Math.min(robux / 5000, 1) * 100}% - ${Math.min(robux / 5000, 1) * 24}px + 12px)`,
                          transform: "translateX(-50%)",
                        }}
                      >
                        <div className="bg-gradient-to-r from-primary-100 to-primary-200 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-primary-100/20 whitespace-nowrap">
                          {robux.toLocaleString()} R$
                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-primary-100/90"></div>
                        </div>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={5000}
                        step={50}
                        value={robux}
                        onChange={(e) => setRobux(Number(e.target.value))}
                        className="w-full h-3 rounded-full appearance-none cursor-pointer slider-custom"
                      />
                      <style jsx>{`
                    .slider-custom {
                      -webkit-appearance: none;
                      appearance: none;
                      background: linear-gradient(
                        to right,
                        #a855f7 0%,
                        #a855f7 ${(robux / 5000) * 100}%,
                        rgba(168, 85, 247, 0.2) ${(robux / 5000) * 100}%,
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
                    .slider-custom::-moz-range-thumb {
                      height: 24px;
                      width: 24px;
                      background: #a855f7;
                      border-radius: 6px;
                      border: 2px solid white;
                      cursor: pointer;
                      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.5);
                    }
                  `}</style>
                    </div>
                  </div>

                  {/* Customer Info Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 pt-6 border-t border-primary-100/10">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-primary-700/5 rounded-2xl"></div>
                      <div className="relative">
                        <label className="block text-sm font-semibold text-primary-200/90 mb-2 px-1">
                          Nomor WhatsApp
                        </label>
                        <div className="relative">
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
                            className={`w-full py-4 px-5 rounded-xl text-white font-medium outline-none transition-all duration-300 backdrop-blur-xl bg-gradient-to-r from-primary-600/10 to-primary-700/5 border-2 ${phoneError ? "border-red-400/60" : "border-primary-200/30 focus:border-primary-100/80"
                              } placeholder-white/30`}
                          />
                          {phoneError && (
                            <p className="text-red-400 text-xs mt-1.5 ml-1 absolute">{phoneError}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 to-primary-700/5 rounded-2xl"></div>
                      <div className="relative">
                        <label className="block text-sm font-semibold text-primary-200/90 mb-2 px-1">
                          Email Aktif
                        </label>
                        <input
                          type="email"
                          placeholder="Email untuk invoice"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full py-4 px-5 rounded-xl text-white font-medium outline-none transition-all duration-300 backdrop-blur-xl bg-gradient-to-r from-primary-600/10 to-primary-700/5 border-2 border-primary-200/30 focus:border-primary-100/80 placeholder-white/30"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Catatan Minimalis */}
                  <div className="mt-8 bg-gradient-to-br from-primary-800/20 to-primary-900/20 border border-primary-100/10 rounded-xl p-5">
                    <h4 className="font-semibold text-white/70 mb-2 text-xs uppercase tracking-wider">Catatan Estimasi</h4>
                    <ul className="list-disc pl-4 text-white/50 text-xs space-y-1.5">
                      <li><span className="text-white/70">2-3 hari pertama:</span> Robux status pending.</li>
                      <li><span className="text-white/70">±5 hari berikutnya:</span> Robux masuk ke akun.</li>
                    </ul>
                    <p className="text-white/50 text-[11px] mt-3 italic">Total estimasi 7-9 hari sejak pembayaran.</p>
                  </div>

                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <section className="max-w-4xl mx-auto mt-6 px-4 flex justify-end gap-4">
              <button
                onClick={() => {
                  if (isStep1Valid) setShowEstimasiPopup(true);
                  else toast.error("Mohon lengkapi semua data dengan benar.");
                }}
                disabled={!isStep1Valid}
                className={`font-bold py-3.5 px-12 rounded-xl transition-all shadow-lg ${isStep1Valid
                  ? "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white hover:scale-105"
                  : "bg-gray-600/50 text-gray-400 cursor-not-allowed"
                  }`}
              >
                Lanjutkan
              </button>
            </section>

          </div>
        )}

        {/* STEP 2: Buat Gamepass */}
        {currentStep === 2 && selectedPlace && (
          <section className="max-w-3xl mx-auto px-4 pb-8 mt-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-primary-900/30 via-primary-800/20 to-primary-700/30 backdrop-blur-xl border border-primary-100/20 rounded-2xl p-6 sm:p-8 shadow-xl shadow-primary-100/10">

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  <span className="bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                    Buat Gamepass Senilai {getGamepassAmount().toLocaleString()} R$
                  </span>
                </h3>
                <p className="text-white/70">Ikuti instruksi di bawah ini untuk menerima Robux kamu.</p>
              </div>

              {/* Amount Info */}
              <div className="bg-gradient-to-br from-primary-100/20 via-primary-200/10 to-primary-100/20 border border-primary-100/40 rounded-xl p-6 text-center backdrop-blur-sm mb-6">
                <div className="text-sm text-primary-200 mb-1 font-medium">Harga Gamepass yang harus dibuat</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gem className="w-6 h-6 text-primary-100" />
                  <div className="text-4xl font-black bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text text-transparent">
                    {getGamepassAmount().toLocaleString()} R$
                  </div>
                </div>
                <div className="bg-gradient-to-r from-primary-600/30 to-primary-700/20 rounded-lg px-3 py-1 text-sm text-white/80 inline-block mt-2">
                  Kamu akan menerima: {robux.toLocaleString()} R$
                </div>
              </div>

              {/* Tutorial Video */}
              <div className="mb-6 rounded-xl overflow-hidden border border-primary-100/20 shadow-lg">
                <iframe
                  width="100%"
                  height="250"
                  src="https://www.youtube.com/embed/MGG2oGEYF3Y?si=SDo3Yow64Dpbz9co"
                  title="Tutorial Cara Membuat GamePass"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full bg-black"
                ></iframe>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href={`https://create.roblox.com/dashboard/creations/experiences/${selectedPlace.placeId}/monetization/passes`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-4 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:scale-105"
                >
                  <Gamepad2 className="w-5 h-5" />
                  Buat GamePass Sekarang
                </a>

                <button
                  onClick={checkGamepassExists}
                  disabled={isCheckingGamepass}
                  className={`flex-1 py-4 px-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${gamepassInstructionShown && lastCheckedRobuxAmount === robux
                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white"
                    : isCheckingGamepass
                      ? "bg-primary-600/50 text-white/70"
                      : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:scale-105"
                    }`}
                >
                  {isCheckingGamepass ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sedang Mengecek...</>
                  ) : gamepassInstructionShown && lastCheckedRobuxAmount === robux ? (
                    <><CheckCircle2 className="w-5 h-5" /> Gamepass Ditemukan</>
                  ) : (
                    <><RefreshCw className="w-5 h-5" /> Cek Gamepass</>
                  )}
                </button>
              </div>

              {/* Warning for gamepass recheck */}
              {lastCheckedRobuxAmount !== null && lastCheckedRobuxAmount !== robux && robux > 0 && (
                <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-400/60 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-400" />
                    <div>
                      <div className="text-sm font-bold text-white">Perhatian</div>
                      <div className="text-xs text-orange-300">Jumlah RBX telah diubah. Silakan buat GamePass baru dan cek ulang.</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-primary-100/20 gap-4">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="w-full sm:w-auto font-bold py-3 px-6 rounded-xl bg-primary-800/50 text-white/80 hover:bg-primary-700 hover:text-white transition-all order-2 sm:order-1"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!isStep2Valid}
                  className={`w-full sm:w-auto font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 order-1 sm:order-2 ${isStep2Valid
                    ? "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white shadow-lg hover:scale-105"
                    : "bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-50"
                    }`}
                >
                  <span>Lanjutkan</span>
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* STEP 3: Metode Pembayaran */}
        {currentStep === 3 && (
          <section className="max-w-3xl mx-auto px-4 pb-8 mt-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-primary-900/30 via-primary-800/20 to-primary-700/30 backdrop-blur-xl border border-primary-100/20 rounded-2xl p-6 sm:p-8 shadow-xl shadow-primary-100/10">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Metode Pembayaran</h3>
              </div>
              {paymentCategories.length > 0 ? (
                <PaymentMethodSelector
                  categories={paymentCategories}
                  loading={paymentMethodsLoading}
                  selectedMethod={selectedPaymentMethod}
                  onSelectMethod={setSelectedPaymentMethod}
                  expandedCategory={expandedCategory}
                  onToggleCategory={(id) => setExpandedCategory(expandedCategory === id ? "" : id)}
                  baseAmount={getCurrentPrice()}
                />
              ) : (
                <div className="text-center py-10 text-white/50">Tidak ada metode pembayaran tersedia</div>
              )}

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-6 border-t border-primary-100/20 gap-4">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto font-bold py-3 px-6 rounded-xl bg-primary-800/50 text-white/80 hover:bg-primary-700 hover:text-white transition-all order-2 sm:order-1"
                >
                  Kembali
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  disabled={!isStep3Valid}
                  className={`w-full sm:w-auto font-bold py-3 px-8 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 order-1 sm:order-2 ${isStep3Valid
                    ? "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white shadow-lg hover:scale-105"
                    : "bg-gray-600/50 text-gray-400 cursor-not-allowed opacity-50"
                    }`}
                >
                  <span>Lanjutkan</span>
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* STEP 4: Konfirmasi Order */}
        {currentStep === 4 && (
          <section className="max-w-4xl mx-auto px-4 pb-8 mt-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-primary-900/30 via-primary-800/20 to-primary-700/30 backdrop-blur-xl border border-primary-100/20 rounded-2xl p-6 sm:p-10 shadow-xl shadow-primary-100/10">

              <div className="text-center mb-8">
                <h3 className="text-3xl font-black text-white">
                  <span className="text-transparent bg-gradient-to-r from-primary-100 to-primary-200 bg-clip-text">Ringkasan Pesanan</span>
                </h3>
              </div>

              <OrderSummaryCard
                details={[
                  { label: "Username Roblox", value: username },
                  { label: "Nomor Whatsapp", value: phone },
                  { label: "List Item", value: `${robux} Robux (Gamepass)` }
                ]}
                baseAmount={getCurrentPrice()}
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



              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-1/3 py-4 rounded-xl font-bold bg-blue-300 text-blue-900 hover:bg-blue-400 transition-colors"
                  disabled={submitting}
                >
                  Kembali
                </button>
                <div className="flex flex-col sm:flex-row w-full sm:w-2/3 gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-primary-800/50 border border-primary-100/30 text-primary-100 transition-all hover:bg-primary-800 hover:border-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingToCart ? <><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</> : <><ShoppingCart className="w-5 h-5" /> Masukkan Keranjang</>}
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${submitting
                      ? "bg-primary-600/50 text-white/50 cursor-not-allowed"
                      : "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-200 hover:to-primary-100 text-white shadow-lg shadow-primary-100/20 hover:scale-105"
                      }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>Bayar Sekarang</span>
                      </>
                    )}
                  </button>
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
            title="Reviews RBX 5 Hari"
          />
        </div>
      </main>


      {/* Popups */}
      {showEstimasiPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-3 sm:p-4 animate-in fade-in-0 duration-300">
          <div className="bg-gradient-to-br from-primary-900/95 to-primary-800/95 border border-primary-100/20 backdrop-blur-xl rounded-3xl sm:rounded-[2rem] max-w-md w-full max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl shadow-primary-100/10 animate-in slide-in-from-bottom-4 duration-300 p-5 sm:p-8 relative">
            <h3 className="text-lg sm:text-xl font-bold text-center text-white mb-3 sm:mb-4">Estimasi Pengiriman Robux Gamepass</h3>

            <div className="flex justify-center mb-4 sm:mb-6">
              <img src="/Maskot/mascot-pointing.webp" alt="Mascot" className="h-20 sm:h-24 object-contain drop-shadow-2xl" />
            </div>

            <p className="text-[13px] sm:text-sm text-white/90 mb-3 text-center">
              Estimasi pengiriman Robux Gamepass setelah pembayaran:<br /><strong>7-9 hari</strong>.
            </p>
            <p className="text-[13px] sm:text-sm text-white/90 mb-2 font-semibold">Rincian proses:</p>
            <ul className="list-disc pl-5 text-[13px] sm:text-sm text-white/80 mb-5 sm:mb-6 space-y-1.5 sm:space-y-2">
              <li><strong>2-3 hari pertama:</strong> Robux pending di akunmu.</li>
              <li><strong>±5 hari berikutnya:</strong> Robux masuk dan siap digunakan.</li>
            </ul>
            <p className="text-[11px] sm:text-xs text-white/50 mb-5 sm:mb-6 text-center">
              Waktu ini diperlukan agar transaksi diproses dengan aman oleh Tim Rbxnet
            </p>

            <label className="group flex items-start sm:items-center justify-center gap-3 cursor-pointer mb-5 sm:mb-6 mx-auto w-full max-w-[90%] sm:max-w-fit bg-primary-900/40 py-2.5 px-4 sm:px-5 rounded-xl sm:rounded-full border border-primary-100/20 hover:border-primary-100/50 hover:bg-primary-800/40 transition-all">
              <div className="relative flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <input type="checkbox" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="peer sr-only" />
                <div className="w-4 h-4 rounded-[4px] border border-white/30 peer-checked:bg-primary-100 peer-checked:border-primary-100 transition-all flex items-center justify-center shadow-inner">
                  <svg className={`w-2.5 h-2.5 text-white transition-transform duration-200 ${agreedToTerms ? "scale-100" : "scale-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-xs sm:text-[13px] leading-relaxed font-medium text-white/70 group-hover:text-white/90">
                Saya setuju dengan <span className="text-primary-100">syarat dan ketentuan</span>
              </span>
            </label>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button onClick={() => setShowEstimasiPopup(false)} className="w-full sm:flex-1 py-3 sm:py-3.5 rounded-xl bg-primary-700/50 border border-primary-200/20 text-white font-bold hover:bg-primary-600/50 transition-colors shadow-sm text-sm sm:text-base order-2 sm:order-1">
                Kembali
              </button>
              <button
                onClick={() => {
                  if (agreedToTerms) {
                    setShowEstimasiPopup(false);
                    setShowPlacePopup(true);
                  }
                }}
                disabled={!agreedToTerms}
                className={`w-full sm:flex-1 py-3 sm:py-3.5 rounded-xl font-bold text-white transition-all shadow-sm text-sm sm:text-base order-1 sm:order-2 ${agreedToTerms ? "bg-gradient-to-r from-primary-100 to-primary-200 hover:scale-[1.02] shadow-primary-100/30" : "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30"}`}
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlacePopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in-0 duration-300">
          <div className="bg-gradient-to-br from-primary-900/95 to-primary-800/95 border border-primary-100/20 backdrop-blur-xl rounded-[2rem] max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl shadow-primary-100/10 animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
            <div className="p-6 text-center border-b border-primary-100/10">
              <h3 className="text-xl font-bold text-white">Pilih Salah Satu Game Kamu</h3>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {isLoadingPlaces ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary-100" /></div>
              ) : userPlaces.length === 0 ? (
                <div className="text-center p-8 text-white/50">Tidak ada game ditemukan.</div>
              ) : (
                <div className="space-y-3">
                  {userPlaces.map((place) => (
                    <button
                      key={place.placeId}
                      onClick={() => setSelectedPlace(place)}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all duration-300 flex items-center justify-between group ${selectedPlace?.placeId === place.placeId
                        ? "border-primary-100 bg-gradient-to-r from-primary-100/20 to-primary-200/10 shadow-lg shadow-primary-100/20"
                        : "border-primary-600/30 hover:border-primary-100/40 bg-primary-800/20 hover:bg-primary-800/40"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        {place.thumbnail ? (
                          <img src={place.thumbnail} alt={place.name} className="w-14 h-14 rounded-xl object-cover shadow-sm ring-2 ring-primary-100/20" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-primary-800/50 flex items-center justify-center shadow-sm border border-primary-200/20"><Gamepad2 className="w-6 h-6 text-white/50" /></div>
                        )}
                        <div>
                          <div className="font-bold text-white text-sm mb-0.5">{place.name}</div>
                          <div className="text-xs text-primary-200/70 font-medium">{place.visits.toLocaleString()} visits</div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedPlace?.placeId === place.placeId ? "border-primary-100 bg-primary-900/50" : "border-white/20"}`}>
                        {selectedPlace?.placeId === place.placeId && <div className="w-3 h-3 bg-primary-100 rounded-full shadow-[0_0_8px_rgba(179,84,195,0.8)]"></div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 flex gap-4 border-t border-primary-100/10">
              <button onClick={() => setShowPlacePopup(false)} className="flex-1 py-3.5 rounded-xl bg-primary-700/50 border border-primary-200/20 text-white font-bold hover:bg-primary-600/50 transition-colors shadow-sm">
                Kembali
              </button>
              <button
                onClick={() => {
                  if (selectedPlace) {
                    setShowPlacePopup(false);
                    setCurrentStep(2); // Go to Buat Gamepass
                  } else {
                    toast.error("Pilih game terlebih dahulu");
                  }
                }}
                disabled={!selectedPlace}
                className={`flex-1 py-3.5 rounded-xl font-bold text-white transition-all shadow-sm ${selectedPlace ? "bg-gradient-to-r from-primary-100 to-primary-200 hover:scale-105 shadow-primary-100/30" : "bg-gray-700/50 text-gray-500 cursor-not-allowed border border-gray-600/30"}`}
              >
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

