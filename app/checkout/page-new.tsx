"use client";

// Force dynamic rendering to avoid suspense issues
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import Link from "next/link";
import {
  Wallet,
  QrCode,
  Building2,
  Store,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ShoppingCart,
  User,
  Gamepad2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Gem,
  Sparkles,
} from "lucide-react";

interface CheckoutData {
  serviceType: string;
  serviceId: string;
  serviceName: string;
  serviceImage: string;
  serviceCategory?: string;
  description?: string;
  gameType?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  discountPercentage?: number;
  discountAmount?: number;
  finalAmount?: number;
}

interface JokiDetails {
  description: string;
  gameType: string;
  estimatedTime: string;
  notes: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  fee: number;
  feeType: "fixed" | "percentage";
  description: string;
}

interface PaymentCategory {
  id: string;
  name: string;
  icon: any;
  description: string;
  methods: PaymentMethod[];
}

function CheckoutContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [robloxUsername, setRobloxUsername] = useState("");
  const [robloxPassword, setRobloxPassword] = useState("");
  const [jokiDetails, setJokiDetails] = useState<JokiDetails>({
    description: "",
    gameType: "",
    estimatedTime: "",
    notes: "",
  });
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [expandedCategory, setExpandedCategory] = useState<string>("ewallet");

  // Check if this is guest checkout
  const isGuestCheckout = !user;

  // Payment methods data dengan kategori
  const paymentCategories: PaymentCategory[] = [
    {
      id: "ewallet",
      name: "E-Wallet",
      icon: Wallet,
      description: "Transfer langsung ke e-wallet",
      methods: [
        {
          id: "dana",
          name: "DANA",
          icon: "💳",
          fee: 2500,
          feeType: "fixed",
          description: "Transfer langsung ke DANA",
        },
        {
          id: "gopay",
          name: "GoPay",
          icon: "💚",
          fee: 2500,
          feeType: "fixed",
          description: "Transfer langsung ke GoPay",
        },
        {
          id: "shopeepay",
          name: "ShopeePay",
          icon: "🛒",
          fee: 2500,
          feeType: "fixed",
          description: "Transfer langsung ke ShopeePay",
        },
      ],
    },
    {
      id: "qris",
      name: "QRIS",
      icon: QrCode,
      description: "Scan QR Code untuk pembayaran instant",
      methods: [
        {
          id: "qris_all",
          name: "QRIS",
          icon: "📱",
          fee: 0.7,
          feeType: "percentage",
          description: "Scan QR Code untuk pembayaran instant",
        },
      ],
    },
    {
      id: "virtual_account",
      name: "Virtual Account",
      icon: Building2,
      description: "Transfer melalui ATM/Mobile Banking",
      methods: [
        {
          id: "bca_va",
          name: "BCA Virtual Account",
          icon: "🏦",
          fee: 4000,
          feeType: "fixed",
          description: "Transfer melalui ATM/Mobile Banking BCA",
        },
        {
          id: "bni_va",
          name: "BNI Virtual Account",
          icon: "🏦",
          fee: 4000,
          feeType: "fixed",
          description: "Transfer melalui ATM/Mobile Banking BNI",
        },
        {
          id: "bri_va",
          name: "BRI Virtual Account",
          icon: "🏦",
          fee: 4000,
          feeType: "fixed",
          description: "Transfer melalui ATM/Mobile Banking BRI",
        },
      ],
    },
    {
      id: "retail",
      name: "Minimarket",
      icon: Store,
      description: "Bayar di kasir minimarket terdekat",
      methods: [
        {
          id: "indomaret",
          name: "Indomaret",
          icon: "🏪",
          fee: 2500,
          feeType: "fixed",
          description: "Bayar di kasir Indomaret terdekat",
        },
        {
          id: "alfamart",
          name: "Alfamart",
          icon: "🏪",
          fee: 2500,
          feeType: "fixed",
          description: "Bayar di kasir Alfamart terdekat",
        },
      ],
    },
  ];

  // Fungsi untuk menghitung biaya payment method
  const calculatePaymentFee = (baseAmount: number, method: PaymentMethod) => {
    if (method.feeType === "percentage") {
      return Math.round((baseAmount * method.fee) / 100);
    }
    return method.fee;
  };

  // Fungsi untuk mendapatkan method dari semua kategori
  const getAllMethods = (): PaymentMethod[] => {
    return paymentCategories.flatMap((category) => category.methods);
  };

  // Fungsi untuk menghitung total dengan biaya payment method
  const calculateFinalAmount = () => {
    const baseAmount =
      checkoutData?.finalAmount || checkoutData?.totalAmount || 0;
    if (!selectedPaymentMethod) return baseAmount;

    const allMethods = getAllMethods();
    const paymentMethod = allMethods.find(
      (pm) => pm.id === selectedPaymentMethod
    );
    if (!paymentMethod) return baseAmount;

    const paymentFee = calculatePaymentFee(baseAmount, paymentMethod);
    return baseAmount + paymentFee;
  };

  // Fungsi untuk menghitung diskon
  const calculateDiscount = (amount: number) => {
    console.log("=== CALCULATE DISCOUNT DEBUG ===");
    console.log("User object:", user);
    console.log("User memberRole:", user?.memberRole);
    console.log("User diskon from memberRole:", user?.memberRole?.diskon || 0);
    console.log("Amount to calculate:", amount);

    if (!user) {
      console.log("No user logged in, no discount applied");
      return {
        discountPercentage: 0,
        discountAmount: 0,
        finalAmount: amount,
      };
    }

    const discountPercentage = user.memberRole ? user.memberRole.diskon : 0;
    const discountAmount = Math.round((amount * discountPercentage) / 100);
    const finalAmount = amount - discountAmount;

    console.log("Calculated discount:", {
      discountPercentage,
      discountAmount,
      finalAmount,
    });

    return {
      discountPercentage,
      discountAmount,
      finalAmount,
    };
  };

  useEffect(() => {
    console.log("=== CHECKOUT PAGE DEBUG START ===");
    console.log(user?.id);
    console.log("1. Component mounted, checking sessionStorage...");

    // Pre-fill customer info if user is logged in
    if (user && !isGuestCheckout) {
      console.log("2. User is logged in, pre-filling customer info...");
      setCustomerInfo({
        name: (user as any).name || "",
        email: (user as any).email || "",
        phone: (user as any).phone || "",
      });
    }

    // Get checkout data from sessionStorage
    const sessionData = sessionStorage.getItem("checkoutData");
    console.log("3. SessionStorage data:", sessionData);

    if (sessionData) {
      try {
        console.log("4. Parsing sessionStorage data...");
        const parsedData = JSON.parse(sessionData);
        console.log("5. Parsed data:", parsedData);

        // Calculate discount if user is logged in
        const baseAmount = parsedData.quantity * parsedData.unitPrice;
        console.log("6. Base amount calculated:", baseAmount);

        const discount = calculateDiscount(baseAmount);
        console.log("7. Discount calculated:", discount);

        setCheckoutData({
          ...parsedData,
          totalAmount: baseAmount,
          discountPercentage: discount.discountPercentage,
          discountAmount: discount.discountAmount,
          finalAmount: discount.finalAmount,
        });

        console.log("8. Checkout data set successfully");

        // Pre-fill form data from session
        if (parsedData.robloxUsername) {
          console.log(
            "9. Pre-filling roblox username:",
            parsedData.robloxUsername
          );
          setRobloxUsername(parsedData.robloxUsername);
        }

        // Only set password for services that require it
        if (
          parsedData.serviceType !== "gamepass" &&
          !(
            parsedData.serviceType === "robux" &&
            parsedData.serviceCategory === "robux_5_hari"
          )
        ) {
          if (parsedData.robloxPassword) {
            console.log("10. Pre-filling roblox password: [HIDDEN]");
            setRobloxPassword(parsedData.robloxPassword);
          }
        } else {
          console.log(
            "10. Gamepass or Robux 5 Hari detected - clearing password field"
          );
          setRobloxPassword("");
        }

        if (parsedData.jokiDetails) {
          console.log("11. Pre-filling joki details:", parsedData.jokiDetails);
          setJokiDetails(parsedData.jokiDetails);
        } else if (parsedData.serviceType === "joki") {
          console.log("11. Auto-filling joki details from service data");
          setJokiDetails((prev) => ({
            ...prev,
            description:
              parsedData.description ||
              parsedData.jokiDetails?.description ||
              prev.description,
            gameType:
              parsedData.gameType ||
              parsedData.jokiDetails?.gameName ||
              prev.gameType,
          }));
        }

        if (parsedData.additionalInfo) {
          console.log(
            "12. Pre-filling additional notes:",
            parsedData.additionalInfo
          );
          setAdditionalNotes(parsedData.additionalInfo);
        } else if (parsedData.jokiDetails?.notes) {
          console.log(
            "12. Pre-filling notes from joki details:",
            parsedData.jokiDetails.notes
          );
          setAdditionalNotes(parsedData.jokiDetails.notes);
        } else if (parsedData.jokiDetails?.additionalInfo) {
          console.log(
            "12. Pre-filling additional info from joki details:",
            parsedData.jokiDetails.additionalInfo
          );
          setAdditionalNotes(parsedData.jokiDetails.additionalInfo);
        }

        console.log(
          "13. Data loaded successfully, sessionStorage will be cleared on successful payment"
        );
      } catch (error) {
        console.error("8. Error parsing sessionStorage data:", error);
        toast.error("Data checkout tidak valid");
        router.push("/");
      }
    } else {
      // Fallback ke URL params
      console.log(
        "13. No session data found, checking URL params as fallback..."
      );
      const serviceType = searchParams.get("serviceType");
      const serviceId = searchParams.get("serviceId");
      const serviceName = searchParams.get("serviceName");
      const serviceImage = searchParams.get("serviceImage");
      const quantity = parseInt(searchParams.get("quantity") || "1");
      const unitPrice = parseInt(searchParams.get("unitPrice") || "0");

      console.log("14. URL params found:", {
        serviceType,
        serviceId,
        serviceName,
        serviceImage,
        quantity,
        unitPrice,
      });

      if (serviceType && serviceId && serviceName && unitPrice) {
        console.log("15. URL params are valid, setting checkout data from URL");
        const baseAmount = quantity * unitPrice;
        const discount = calculateDiscount(baseAmount);

        setCheckoutData({
          serviceType,
          serviceId,
          serviceName,
          serviceImage: serviceImage || "",
          quantity,
          unitPrice,
          totalAmount: baseAmount,
          discountPercentage: discount.discountPercentage,
          discountAmount: discount.discountAmount,
          finalAmount: discount.finalAmount,
        });
      } else {
        console.log("16. No valid data found in sessionStorage or URL params");
        console.log("17. Missing required data - redirecting to home page");
        toast.error(
          "Data checkout tidak ditemukan. Silakan pilih produk terlebih dahulu."
        );
        router.push("/");
      }
    }

    setLoading(false);
    console.log("=== CHECKOUT PAGE DEBUG END ===");
  }, [user, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkoutData) {
      toast.error("Data checkout tidak valid");
      return;
    }

    // Validation
    if (!robloxUsername.trim()) {
      toast.error("Username Roblox harus diisi");
      return;
    }

    // Only require password for robux instant and joki services
    if (
      ((checkoutData.serviceType === "robux" &&
        checkoutData.serviceCategory === "robux_instant") ||
        checkoutData.serviceType === "joki") &&
      !robloxPassword.trim()
    ) {
      toast.error("Password Roblox harus diisi untuk layanan ini");
      return;
    }

    // Guest checkout validation
    if (isGuestCheckout) {
      if (
        !customerInfo.name.trim() ||
        !customerInfo.email.trim() ||
        !customerInfo.phone.trim()
      ) {
        toast.error("Semua field customer harus diisi untuk guest checkout");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerInfo.email)) {
        toast.error("Format email tidak valid");
        return;
      }
    }

    if (!selectedPaymentMethod) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }

    if (!acceptTerms) {
      toast.error("Anda harus menyetujui syarat dan ketentuan");
      return;
    }

    if (checkoutData.serviceType === "joki") {
      if (!jokiDetails.description || !jokiDetails.gameType) {
        toast.error("Deskripsi dan jenis game harus diisi untuk layanan joki");
        return;
      }
    }

    setSubmitting(true);

    const allMethods = getAllMethods();
    const selectedPayment = allMethods.find(
      (pm) => pm.id === selectedPaymentMethod
    );
    const paymentFee = selectedPayment
      ? calculatePaymentFee(
          checkoutData.finalAmount || checkoutData.totalAmount,
          selectedPayment
        )
      : 0;

    const requestData = {
      serviceType: checkoutData.serviceType,
      serviceId: checkoutData.serviceId,
      serviceName: checkoutData.serviceName,
      serviceImage: checkoutData.serviceImage,
      serviceCategory: checkoutData.serviceCategory,
      quantity: checkoutData.quantity,
      unitPrice: checkoutData.unitPrice,
      totalAmount: checkoutData.totalAmount,
      discountPercentage: checkoutData.discountPercentage || 0,
      discountAmount: checkoutData.discountAmount || 0,
      finalAmount:
        (checkoutData.finalAmount || checkoutData.totalAmount) + paymentFee,
      paymentMethod: selectedPaymentMethod,
      paymentFee: paymentFee,
      robloxUsername,
      robloxPassword:
        checkoutData.serviceType === "gamepass" ||
        (checkoutData.serviceType === "robux" &&
          checkoutData.serviceCategory === "robux_5_hari")
          ? ""
          : robloxPassword,
      jokiDetails:
        checkoutData.serviceType === "joki" ? jokiDetails : undefined,
      robuxInstantDetails:
        checkoutData.serviceType === "robux" &&
        checkoutData.serviceCategory === "robux_instant" &&
        additionalNotes.trim()
          ? { notes: additionalNotes.trim() }
          : undefined,
      gamepass:
        checkoutData.serviceType === "robux" &&
        checkoutData.serviceCategory === "robux_5_hari" &&
        (checkoutData as any).gamepass
          ? (checkoutData as any).gamepass
          : undefined,
      customerInfo: {
        ...customerInfo,
        ...(user && !isGuestCheckout ? { userId: (user as any)?.id } : {}),
      },
      userId: isGuestCheckout ? null : (user as any)?.id,
    };

    try {
      console.log("Submitting transaction:", requestData);

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();
      console.log("Transaction response:", result);

      if (result.success) {
        // Clear sessionStorage on successful transaction
        sessionStorage.removeItem("checkoutData");

        toast.success("Transaksi berhasil dibuat!");

        // Redirect to transaction detail or success page
        if (result.data?._id) {
          router.push(`/transaction/${result.data._id}`);
        } else {
          router.push("/riwayat");
        }
      } else {
        toast.error(
          result.message || "Terjadi kesalahan saat membuat transaksi"
        );
      }
    } catch (error) {
      console.error("Error creating transaction:", error);
      toast.error("Terjadi kesalahan saat membuat transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto mb-4"></div>
          <p className="text-primary-100 font-medium">
            Memuat halaman checkout...
          </p>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
        <div className="text-center max-w-md mx-auto p-8 neon-card rounded-xl">
          <div className="text-neon-pink mb-6">
            <AlertTriangle className="w-20 h-20 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-primary-100 mb-4">
            Data Checkout Tidak Ditemukan
          </h1>
          <p className="text-primary-200 mb-6">
            Tidak dapat menemukan data checkout yang diperlukan.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="w-full btn-neon-primary px-6 py-3 rounded-lg font-medium"
            >
              🏠 Pilih Produk dari Beranda
            </button>
            <button
              onClick={() => router.back()}
              className="w-full btn-neon-secondary px-6 py-3 rounded-lg font-medium"
            >
              ← Kembali ke Halaman Sebelumnya
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 py-8">
      {/* Background Effects */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-neon-pink/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-neon-purple/20 rounded-full blur-xl animate-pulse"></div>

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-neon-pink/10 to-neon-purple/10 border border-neon-pink/30 rounded-2xl text-sm text-neon-pink font-semibold mb-6 backdrop-blur-sm">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Checkout Pembayaran
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white mb-4">
            Selesaikan <span className="text-neon-pink">Pesanan</span>
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Lengkapi data untuk melanjutkan pembayaran dengan aman
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary - Left Column */}
          <div className="lg:col-span-1">
            <div className="neon-card rounded-3xl p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                <div className="w-8 h-8 bg-neon-pink/20 rounded-lg flex items-center justify-center mr-3">
                  <Gem className="w-5 h-5 text-neon-pink" />
                </div>
                Ringkasan Pesanan
              </h2>

              <div className="neon-card-secondary rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4 mb-4">
                  {checkoutData.serviceImage && (
                    <img
                      src={checkoutData.serviceImage}
                      alt={checkoutData.serviceName}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-neon-purple/30"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">
                      {checkoutData.serviceName}
                    </h3>
                    <p className="text-sm text-primary-300 capitalize mb-2">
                      {checkoutData.serviceType}
                      {checkoutData.serviceCategory &&
                        checkoutData.serviceType === "robux" && (
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              checkoutData.serviceCategory === "robux_5_hari"
                                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                            }`}
                          >
                            {checkoutData.serviceCategory === "robux_5_hari"
                              ? "5 Hari"
                              : "Instant"}
                          </span>
                        )}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary-300">
                        Qty: {checkoutData.quantity}
                      </span>
                      <span className="font-medium text-white">
                        Rp {checkoutData.unitPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neon-purple/20 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary-300">Subtotal:</span>
                    <span className="text-white">
                      Rp {checkoutData.totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {(checkoutData.discountPercentage || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-400">
                        Diskon Member ({checkoutData.discountPercentage}%):
                      </span>
                      <span className="text-green-400">
                        - Rp{" "}
                        {(checkoutData.discountAmount || 0).toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  )}

                  {selectedPaymentMethod && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary-300">Biaya Admin:</span>
                      <span className="text-white">
                        + Rp{" "}
                        {(() => {
                          const allMethods = getAllMethods();
                          const method = allMethods.find(
                            (pm) => pm.id === selectedPaymentMethod
                          );
                          return method
                            ? calculatePaymentFee(
                                checkoutData.finalAmount ||
                                  checkoutData.totalAmount,
                                method
                              ).toLocaleString("id-ID")
                            : "0";
                        })()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-neon-purple/20 pt-3">
                    <span className="font-bold text-white">Total Bayar:</span>
                    <span className="font-bold text-xl text-neon-pink">
                      Rp {calculateFinalAmount().toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mr-3 mt-0.5" />
                  <div className="text-sm text-amber-300">
                    <p className="font-medium">🔐 Keamanan Data Terjamin</p>
                    <p className="text-amber-400 mt-1">
                      Kami tidak menyimpan password Roblox Anda. Data hanya
                      digunakan untuk proses transaksi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form - Right Columns */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Payment Method Selection */}
              <div className="neon-card rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <div className="w-10 h-10 bg-neon-purple/20 rounded-xl flex items-center justify-center mr-4">
                    <CreditCard className="w-6 h-6 text-neon-purple" />
                  </div>
                  Pilih Metode Pembayaran
                </h3>

                <div className="space-y-4">
                  {paymentCategories.map((category) => (
                    <div
                      key={category.id}
                      className="neon-card-secondary rounded-xl overflow-hidden"
                    >
                      {/* Category Header */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCategory(
                            expandedCategory === category.id ? "" : category.id
                          )
                        }
                        className="w-full p-6 flex items-center justify-between text-left hover:bg-primary-600/20 transition-colors"
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-neon-pink/10 rounded-xl flex items-center justify-center mr-4">
                            <category.icon className="w-6 h-6 text-neon-pink" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white">
                              {category.name}
                            </h4>
                            <p className="text-sm text-primary-300">
                              {category.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-neon-purple">
                          {expandedCategory === category.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </button>

                      {/* Category Methods */}
                      {expandedCategory === category.id && (
                        <div className="border-t border-neon-purple/20 p-6 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.methods.map((method) => {
                              const fee = calculatePaymentFee(
                                checkoutData.finalAmount ||
                                  checkoutData.totalAmount,
                                method
                              );
                              return (
                                <div
                                  key={method.id}
                                  onClick={() =>
                                    setSelectedPaymentMethod(method.id)
                                  }
                                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                                    selectedPaymentMethod === method.id
                                      ? "border-neon-pink bg-neon-pink/10 shadow-lg glow-neon-pink"
                                      : "border-primary-600/50 bg-primary-700/20 hover:border-neon-purple/50 hover:bg-primary-600/20"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center">
                                      <span className="text-2xl mr-3">
                                        {method.icon}
                                      </span>
                                      <span className="font-semibold text-white">
                                        {method.name}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm text-primary-300">
                                        +{" "}
                                        {method.feeType === "percentage"
                                          ? `${method.fee}%`
                                          : `Rp ${fee.toLocaleString("id-ID")}`}
                                      </div>
                                    </div>
                                  </div>
                                  <p className="text-xs text-primary-300">
                                    {method.description}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Information */}
              {(!user || isGuestCheckout) && (
                <div className="neon-card rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <div className="w-10 h-10 bg-neon-pink/20 rounded-xl flex items-center justify-center mr-4">
                      <User className="w-6 h-6 text-neon-pink" />
                    </div>
                    Informasi Pelanggan
                  </h3>
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Nama Lengkap <span className="text-neon-pink">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                        placeholder="Masukkan nama lengkap Anda"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Email <span className="text-neon-pink">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                        placeholder="contoh@email.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Nomor WhatsApp <span className="text-neon-pink">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) =>
                          setCustomerInfo((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                        placeholder="08123456789"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Roblox Account */}
              <div className="neon-card rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <div className="w-10 h-10 bg-neon-purple/20 rounded-xl flex items-center justify-center mr-4">
                    <Gamepad2 className="w-6 h-6 text-neon-purple" />
                  </div>
                  Data Akun Roblox
                </h3>
                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-primary-200 mb-2">
                      Username Roblox <span className="text-neon-pink">*</span>
                    </label>
                    <input
                      type="text"
                      value={robloxUsername}
                      onChange={(e) => setRobloxUsername(e.target.value)}
                      className="w-full p-4 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                      placeholder="Masukkan username Roblox"
                      required
                    />
                  </div>
                  {/* Password hanya diperlukan untuk robux instant dan joki */}
                  {((checkoutData.serviceType === "robux" &&
                    checkoutData.serviceCategory === "robux_instant") ||
                    checkoutData.serviceType === "joki") && (
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Password Roblox{" "}
                        <span className="text-neon-pink">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={robloxPassword}
                          onChange={(e) => setRobloxPassword(e.target.value)}
                          className="w-full p-4 pr-12 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                          placeholder="Masukkan password Roblox"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-primary-400 hover:text-neon-pink transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Joki Details (conditionally rendered) */}
              {checkoutData.serviceType === "joki" && (
                <div className="neon-card rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <div className="w-10 h-10 bg-neon-pink/20 rounded-xl flex items-center justify-center mr-4">
                      <Sparkles className="w-6 h-6 text-neon-pink" />
                    </div>
                    Detail Layanan Joki
                  </h3>
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Deskripsi Layanan{" "}
                        <span className="text-neon-pink">*</span>
                      </label>
                      <textarea
                        value={
                          checkoutData.description || jokiDetails.description
                        }
                        onChange={(e) =>
                          setJokiDetails((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full p-4 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                        placeholder="Deskripsi layanan akan terisi otomatis..."
                        disabled={true}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Jenis Game <span className="text-neon-pink">*</span>
                      </label>
                      <input
                        type="text"
                        value={checkoutData.gameType || jokiDetails.gameType}
                        onChange={(e) =>
                          setJokiDetails((prev) => ({
                            ...prev,
                            gameType: e.target.value,
                          }))
                        }
                        className="w-full p-4 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                        placeholder="Jenis game akan terisi otomatis..."
                        disabled={true}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Catatan Tambahan
                      </label>
                      <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={3}
                        className="w-full p-4 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                        placeholder="Tambahkan catatan khusus jika diperlukan..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Notes for Robux Instant */}
              {checkoutData.serviceType === "robux" &&
                checkoutData.serviceCategory === "robux_instant" && (
                  <div className="neon-card rounded-3xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-6">
                      Kode Keamanan Roblox
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        <span className="text-primary-300 text-xs">
                          Klik link berikut untuk melihat kode keamanan anda.{" "}
                          <Link
                            className="underline text-neon-pink hover:text-neon-purple transition-colors"
                            href={
                              "https://youtu.be/0N-1478Qki0?si=Z2g_AuTIOQPn5kDC"
                            }
                            target="_blank"
                          >
                            Kode keamanan
                          </Link>
                        </span>
                      </label>
                      <textarea
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        rows={3}
                        className="w-full p-4 border-2 border-white/20 rounded-xl bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                        placeholder="Masukkan kode keamanan Roblox Anda di sini..."
                      />
                    </div>
                  </div>
                )}

              {/* Terms */}
              <div className="neon-card rounded-3xl p-8">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 mr-4 w-5 h-5 text-neon-pink bg-primary-700 border-primary-600 rounded focus:ring-neon-pink focus:ring-2"
                    required
                  />
                  <label className="text-primary-200">
                    Saya menyetujui{" "}
                    <a
                      href="#"
                      className="text-neon-pink hover:text-neon-purple hover:underline transition-colors"
                    >
                      syarat dan ketentuan
                    </a>{" "}
                    serta{" "}
                    <a
                      href="#"
                      className="text-neon-pink hover:text-neon-purple hover:underline transition-colors"
                    >
                      kebijakan privasi
                    </a>{" "}
                    yang berlaku.
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={
                    submitting || !acceptTerms || !selectedPaymentMethod
                  }
                  className={`group relative px-16 py-6 rounded-3xl font-black text-xl transition-all duration-500 transform inline-flex items-center gap-4 w-full md:w-auto justify-center shadow-2xl ${
                    submitting || !acceptTerms || !selectedPaymentMethod
                      ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600"
                      : "btn-neon-primary hover:scale-110 glow-neon-pink active:scale-95"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-4">
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                        <span>
                          Bayar Sekarang - Rp{" "}
                          {calculateFinalAmount().toLocaleString("id-ID")}
                        </span>
                        <Sparkles className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink mx-auto mb-4"></div>
            <p className="text-primary-100">Memuat halaman checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
