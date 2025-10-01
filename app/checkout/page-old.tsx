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
  Sparkles
} from "lucide-react";

interface CheckoutData {
  serviceType: string;
  serviceId: string;
  serviceName: string;
  serviceImage: string;
  serviceCategory?: string; // Untuk membedakan robux_5_hari dan robux_instant
  description?: string; // Untuk joki service description
  gameType?: string; // Untuk joki game type
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
  type: string;
  icon: string;
  fee: number;
  feeType: 'fixed' | 'percentage';
  description: string;
  minAmount?: number;
  maxAmount?: number;
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  // Check if this is guest checkout
  const isGuestCheckout = !user;

  // Payment methods data
  const paymentMethods: PaymentMethod[] = [
    // E-Wallet
    {
      id: "dana",
      name: "DANA",
      type: "ewallet",
      icon: "/dana.png",
      fee: 2500,
      feeType: "fixed",
      description: "Transfer langsung ke DANA"
    },
    {
      id: "gopay",
      name: "GoPay",
      type: "ewallet", 
      icon: "/gopay.png",
      fee: 2500,
      feeType: "fixed",
      description: "Transfer langsung ke GoPay"
    },
    {
      id: "shopeepay",
      name: "ShopeePay",
      type: "ewallet",
      icon: "/shopepay.png",
      fee: 2500,
      feeType: "fixed",
      description: "Transfer langsung ke ShopeePay"
    },
    // QRIS
    {
      id: "qris",
      name: "QRIS",
      type: "qris",
      icon: "/qr.png",
      fee: 0.7,
      feeType: "percentage",
      description: "Scan QR Code untuk pembayaran instant"
    },
    // Virtual Account
    {
      id: "bca_va",
      name: "BCA Virtual Account",
      type: "virtual_account",
      icon: "/virtual.png",
      fee: 4000,
      feeType: "fixed",
      description: "Transfer melalui ATM/Mobile Banking BCA"
    },
    {
      id: "bni_va",
      name: "BNI Virtual Account", 
      type: "virtual_account",
      icon: "/virtual.png",
      fee: 4000,
      feeType: "fixed",
      description: "Transfer melalui ATM/Mobile Banking BNI"
    },
    {
      id: "bri_va",
      name: "BRI Virtual Account",
      type: "virtual_account", 
      icon: "/virtual.png",
      fee: 4000,
      feeType: "fixed",
      description: "Transfer melalui ATM/Mobile Banking BRI"
    },
    // Minimarket
    {
      id: "indomaret",
      name: "Indomaret",
      type: "retail",
      icon: "/minimarket.png", 
      fee: 2500,
      feeType: "fixed",
      description: "Bayar di kasir Indomaret terdekat"
    },
    {
      id: "alfamart",
      name: "Alfamart",
      type: "retail",
      icon: "/minimarket.png",
      fee: 2500, 
      feeType: "fixed",
      description: "Bayar di kasir Alfamart terdekat"
    }
  ];

  // Fungsi untuk menghitung biaya payment method
  const calculatePaymentFee = (baseAmount: number, paymentMethod: PaymentMethod) => {
    if (paymentMethod.feeType === 'percentage') {
      return Math.round((baseAmount * paymentMethod.fee) / 100);
    }
    return paymentMethod.fee;
  };

  // Fungsi untuk menghitung total dengan biaya payment method
  const calculateFinalAmount = () => {
    const baseAmount = checkoutData?.finalAmount || checkoutData?.totalAmount || 0;
    if (!selectedPaymentMethod) return baseAmount;
    
    const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
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
    // console.log(user);
    // Debug sessionStorage availability
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

    // Get checkout data dari sessionStorage (prioritas pertama) atau URL params
    let sessionData = null;

    // Check if sessionStorage is available (client-side only)
    if (typeof window !== "undefined") {
      console.log(
        "2. Window is defined, checking sessionStorage availability..."
      );
      console.log("3. SessionStorage available:", isSessionStorageAvailable());

      // List all sessionStorage keys for debugging
      try {
        const allKeys = Object.keys(sessionStorage);
        console.log("4. All sessionStorage keys:", allKeys);

        sessionData = sessionStorage.getItem("checkoutData");
        console.log("5. Raw checkout data from sessionStorage:", sessionData);
      } catch (error) {
        console.error("6. Error accessing sessionStorage:", error);
      }
    } else {
      console.log("2. Window is not defined (SSR mode)");
    }

    console.log("7. Session data found:", sessionData);

    if (sessionData) {
      try {
        const parsedData = JSON.parse(sessionData);
        console.log("8. Parsed session data successfully:", parsedData);
        console.log("8a. Gamepass data check:", {
          hasGamepass: !!(parsedData as any).gamepass,
          gamepassData: (parsedData as any).gamepass,
          serviceCategory: parsedData.serviceCategory,
        });

        const baseAmount = parsedData.quantity * parsedData.unitPrice;
        const discount = calculateDiscount(baseAmount);

        setCheckoutData({
          serviceType: parsedData.serviceType,
          serviceId: parsedData.serviceId,
          serviceName: parsedData.serviceName,
          serviceImage: parsedData.serviceImage || "",
          serviceCategory: parsedData.serviceCategory || "", // Tambahan untuk kategori robux
          description:
            parsedData.description || parsedData.jokiDetails?.description || "", // Untuk joki
          gameType:
            parsedData.gameType || parsedData.jokiDetails?.gameName || "", // Untuk joki
          quantity: parsedData.quantity,
          unitPrice: parsedData.unitPrice,
          totalAmount: baseAmount,
          discountPercentage: discount.discountPercentage,
          discountAmount: discount.discountAmount,
          finalAmount: discount.finalAmount,
          // Include all additional data from rbx5 or other services
          ...((parsedData as any).gamepass && {
            gamepass: (parsedData as any).gamepass,
          }),
          ...((parsedData as any).selectedPlace && {
            selectedPlace: (parsedData as any).selectedPlace,
          }),
          ...((parsedData as any).robuxAmount && {
            robuxAmount: (parsedData as any).robuxAmount,
          }),
          ...((parsedData as any).gamepassAmount && {
            gamepassAmount: (parsedData as any).gamepassAmount,
          }),
          ...((parsedData as any).gamepassCreated && {
            gamepassCreated: (parsedData as any).gamepassCreated,
          }),
        });

        // Pre-fill form data if available
        if (parsedData.robloxUsername) {
          console.log(
            "9. Pre-filling roblox username:",
            parsedData.robloxUsername
          );
          setRobloxUsername(parsedData.robloxUsername);
        }

        // Handle password based on service type and category
        if (
          parsedData.serviceType === "gamepass" ||
          (parsedData.serviceType === "robux" &&
            parsedData.serviceCategory === "robux_5_hari")
        ) {
          console.log(
            "10. Gamepass or Robux 5 Hari detected - clearing password field"
          );
          setRobloxPassword(""); // Ensure password is empty for gamepass and robux 5 hari
        } else if (parsedData.robloxPassword) {
          console.log("10. Pre-filling roblox password: [HIDDEN]");
          setRobloxPassword(parsedData.robloxPassword);
        }

        if (parsedData.jokiDetails) {
          console.log("11. Pre-filling joki details:", parsedData.jokiDetails);
          setJokiDetails(parsedData.jokiDetails);
        } else if (parsedData.serviceType === "joki") {
          // Auto-fill joki details from service data
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

        // Pre-fill additional notes from any service
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

        // Don't clear sessionStorage immediately - keep it for potential refresh
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

        // Delay redirect sedikit untuk memberi waktu user melihat toast
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    }

    console.log("18. Setting loading to false");
    setLoading(false);
    console.log("=== CHECKOUT PAGE DEBUG END ===");
  }, [searchParams, router]);

  useEffect(() => {
    if (user) {
      // Auto-fill customer info from logged-in user data
      setCustomerInfo((prev) => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`.trim() || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  // Recalculate discount when user data is available
  useEffect(() => {
    if (user && checkoutData) {
      console.log("=== RECALCULATING DISCOUNT ===");
      console.log("User available:", user);
      console.log("Current checkout data:", checkoutData);

      const baseAmount = checkoutData.totalAmount;
      const discount = calculateDiscount(baseAmount);

      console.log("Updating checkout data with discount:", discount);

      setCheckoutData((prevData) => ({
        ...prevData!,
        discountPercentage: discount.discountPercentage,
        discountAmount: discount.discountAmount,
        finalAmount: discount.finalAmount,
      }));
    }
  }, [user, checkoutData?.totalAmount]);

  useEffect(() => {
    // Auto-fill joki details from checkout data for joki services
    if (
      checkoutData &&
      checkoutData.serviceType === "joki" &&
      checkoutData.description &&
      checkoutData.gameType
    ) {
      setJokiDetails((prev) => ({
        ...prev,
        description: checkoutData.description || "",
        gameType: checkoutData.gameType || "",
      }));
    }
  }, [checkoutData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guest checkout tidak perlu login
    const isGuestCheckout = !user;

    if (!checkoutData) {
      toast.error("Data checkout tidak valid");
      return;
    }

    if (!robloxUsername) {
      toast.error("Username Roblox harus diisi");
      return;
    }

    // Password hanya diperlukan untuk robux instant dan joki, tidak untuk gamepass dan robux 5 hari
    if (
      ((checkoutData.serviceType === "robux" &&
        checkoutData.serviceCategory === "robux_instant") ||
        checkoutData.serviceType === "joki") &&
      !robloxPassword
    ) {
      toast.error("Password Roblox harus diisi untuk layanan ini");
      return;
    }

    // Validasi customer info untuk guest checkout
    if (isGuestCheckout) {
      if (!customerInfo.name || !customerInfo.email) {
        toast.error("Nama dan email harus diisi untuk checkout");
        return;
      }

      // Validasi format email
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

    console.log("=== VALIDATION DEBUG ===");
    console.log("Is guest checkout:", isGuestCheckout);
    console.log("User:", user);
    console.log("User ID:", (user as any)?._id);
    console.log("Checkout data:", checkoutData);
    console.log("Roblox username:", robloxUsername);
    console.log("Roblox password length:", robloxPassword?.length);
    console.log("Customer info:", customerInfo);

    if (!acceptTerms) {
      toast.error("Anda harus menyetujui syarat dan ketentuan");
      return;
    }

    // Validasi khusus untuk joki
    if (checkoutData.serviceType === "joki") {
      if (!jokiDetails.description || !jokiDetails.gameType) {
        toast.error("Deskripsi dan jenis game harus diisi untuk layanan joki");
        return;
      }
    }

    setSubmitting(true);

    // Data yang akan dikirim ke API
    const selectedPayment = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
    const paymentFee = selectedPayment ? calculatePaymentFee(checkoutData.finalAmount || checkoutData.totalAmount, selectedPayment) : 0;
    
    const requestData = {
      serviceType: checkoutData.serviceType,
      serviceId: checkoutData.serviceId,
      serviceName: checkoutData.serviceName,
      serviceImage: checkoutData.serviceImage,
      serviceCategory: checkoutData.serviceCategory, // Tambahkan kategori
      quantity: checkoutData.quantity,
      unitPrice: checkoutData.unitPrice,
      totalAmount: checkoutData.totalAmount,
      discountPercentage: checkoutData.discountPercentage || 0,
      discountAmount: checkoutData.discountAmount || 0,
      finalAmount: (checkoutData.finalAmount || checkoutData.totalAmount) + paymentFee,
      paymentMethod: selectedPaymentMethod,
      paymentFee: paymentFee,
      robloxUsername,
      // Password: empty string untuk gamepass dan robux 5 hari, actual password untuk robux instant/joki
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
      // Add gamepass details for robux_5_hari service
      gamepass:
        checkoutData.serviceType === "robux" &&
        checkoutData.serviceCategory === "robux_5_hari" &&
        (checkoutData as any).gamepass
          ? (checkoutData as any).gamepass
          : undefined,
      customerInfo: {
        ...customerInfo,
        // Tambahkan userId ke customerInfo jika user sudah login
        ...(user && !isGuestCheckout ? { userId: (user as any)?.id } : {}),
      },
      userId: isGuestCheckout ? null : (user as any)?.id, // null untuk guest, gunakan id bukan _id
    };

    console.log("=== CHECKOUT SUBMIT DEBUG ===");
    console.log("Service Type:", checkoutData.serviceType);
    console.log("Service Category:", checkoutData.serviceCategory);
    console.log("Is gamepass:", checkoutData.serviceType === "gamepass");
    console.log(
      "Is robux_5_hari:",
      checkoutData.serviceType === "robux" &&
        checkoutData.serviceCategory === "robux_5_hari"
    );
    console.log(
      "Gamepass data in checkoutData:",
      (checkoutData as any).gamepass
    );
    console.log("RobloxPassword state value:", robloxPassword);
    console.log(
      "Will include password:",
      checkoutData.serviceType !== "gamepass"
    );
    console.log("User object:", user);
    console.log("User ID from user.id:", (user as any)?.id);
    console.log("User ID from user._id:", (user as any)?._id);
    console.log("Is guest checkout:", isGuestCheckout);
    console.log("Final request data:", {
      ...requestData,
      robloxPassword: requestData.robloxPassword
        ? "[PRESENT]"
        : "[NOT INCLUDED]",
    });

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear checkout data dari sessionStorage
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("checkoutData");
        }

        console.log("=== PAYMENT REDIRECT DEBUG ===");
        console.log("Transaction created successfully:", data);
        console.log("Snap Token:", data.data.snapToken);
        console.log("Redirect URL:", data.data.redirectUrl);

        // Check if we have redirectUrl for direct redirect (better UX on mobile)
        if (data.data.redirectUrl) {
          toast.success(
            "Transaksi berhasil dibuat! Mengalihkan ke halaman pembayaran..."
          );

          // Small delay to show the success message
          setTimeout(() => {
            // Direct redirect to Midtrans payment page
            window.location.href = data.data.redirectUrl;
          }, 1500);
        } else {
          // Fallback to Snap.js popup method
          toast.success(
            "Transaksi berhasil dibuat! Membuka halaman pembayaran..."
          );

          // Load Midtrans Snap
          const script = document.createElement("script");
          script.src =
            data.data.snapUrl ||
            "https://app.sandbox.midtrans.com/snap/snap.js";
          script.setAttribute("data-client-key", data.data.clientKey);

          script.onload = () => {
            // @ts-ignore
            window.snap.pay(data.data.snapToken, {
              onSuccess: function (result: any) {
                console.log("Payment success:", result);
                toast.success("Pembayaran berhasil!");
                router.push(
                  `/transaction/success?order_id=${data.data.transaction.midtransOrderId}`
                );
              },
              onPending: function (result: any) {
                console.log("Payment pending:", result);
                toast.info("Pembayaran sedang diproses");
                router.push(
                  `/transaction/pending?order_id=${data.data.transaction.midtransOrderId}`
                );
              },
              onError: function (result: any) {
                console.log("Payment error:", result);
                toast.error("Pembayaran gagal");
                router.push(
                  `/transaction/failed?order_id=${data.data.transaction.midtransOrderId}`
                );
              },
              onClose: function () {
                console.log("Payment popup closed");
                toast.info("Pembayaran dibatalkan");
                router.push(
                  `/transaction/pending?order_id=${data.data.transaction.midtransOrderId}`
                );
              },
            });
          };

          script.onerror = () => {
            console.error("Failed to load Midtrans Snap script");
            toast.error("Gagal memuat halaman pembayaran");
          };

          document.head.appendChild(script);
        }
      } else {
        toast.error(data.error || "Gagal membuat transaksi");
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
        <div className="text-center max-w-md mx-auto p-8 bg-primary-600/20 backdrop-blur-sm rounded-xl shadow-xl border border-neon-purple/30">
          <div className="text-neon-pink mb-6">
            <svg
              className="w-20 h-20 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary-100 mb-4">
            Data Checkout Tidak Ditemukan
          </h1>
          <p className="text-primary-200 mb-6">
            Tidak dapat menemukan data checkout yang diperlukan. Hal ini bisa
            terjadi karena:
          </p>
          <div className="text-left text-sm text-primary-200 mb-8 bg-primary-800/30 p-4 rounded-lg border border-neon-purple/20">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-neon-pink mr-2">•</span>
                <span>Anda mengakses halaman checkout secara langsung</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-pink mr-2">•</span>
                <span>Data checkout telah kedaluwarsa</span>
              </li>
              <li className="flex items-start">
                <span className="text-neon-pink mr-2">•</span>
                <span>Browser tidak mendukung sessionStorage</span>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white px-6 py-3 rounded-lg hover:from-neon-purple hover:to-neon-pink transition-all duration-200 font-medium shadow-lg hover:shadow-neon-pink/25"
            >
              🏠 Pilih Produk dari Beranda
            </button>
            <button
              onClick={() => router.back()}
              className="w-full bg-primary-600 text-primary-100 px-6 py-3 rounded-lg hover:bg-primary-500 transition-colors font-medium border border-neon-purple/30"
            >
              ← Kembali ke Halaman Sebelumnya
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 text-primary-100 px-6 py-3 rounded-lg hover:from-primary-500 hover:to-primary-400 transition-all duration-200 font-medium text-sm shadow-md"
            >
              🔄 Refresh Halaman
            </button>
          </div>
          <div className="mt-6 p-4 bg-primary-800/30 rounded-lg border border-neon-purple/20">
            <p className="text-xs text-primary-200">
              💡 <strong>Tip:</strong> Buka console browser (F12) untuk melihat
              detail debugging
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-primary-600/20 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-neon-purple/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 border-b border-neon-purple/30 p-6">
            <h1 className="text-3xl font-bold text-primary-100 mb-2">
              💳 Checkout Pembayaran
            </h1>
            <p className="text-primary-200">
              Lengkapi data untuk melanjutkan pembayaran
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 p-6">
            {/* Order Summary - Left Column */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-semibold text-primary-100 mb-6 flex items-center">
                <div className="w-8 h-8 bg-neon-pink/20 rounded-lg flex items-center justify-center mr-3">
                  📦
                </div>
                Ringkasan Pesanan
              </h2>

              <div className="bg-primary-700/30 rounded-xl p-6 mb-6 border border-neon-purple/20">
                <div className="flex items-start gap-4 mb-4">
                  {checkoutData.serviceImage && (
                    <img
                      src={checkoutData.serviceImage}
                      alt={checkoutData.serviceName}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-neon-purple/30"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-primary-100 mb-1">
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
                      <span className="font-medium text-primary-100">
                        Rp {checkoutData.unitPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-neon-purple/20 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-primary-300">Subtotal:</span>
                    <span className="text-primary-100">
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
                      <span className="text-primary-100">
                        + Rp {calculatePaymentFee(checkoutData.finalAmount || checkoutData.totalAmount, paymentMethods.find(pm => pm.id === selectedPaymentMethod)!).toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-neon-purple/20 pt-3">
                    <span className="font-semibold text-primary-100">
                      Total Bayar:
                    </span>
                    <span className="font-bold text-xl text-neon-pink">
                      Rp {calculateFinalAmount().toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-amber-400 mr-3 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">
                      Informasi Keamanan
                    </h4>
                    {checkoutData.serviceType === "robux" &&
                    checkoutData.serviceCategory === "robux_5_hari" ? (
                      <p className="text-sm text-amber-700 mt-1">
                        <strong>Robux 5 Hari:</strong> Anda hanya perlu
                        memberikan username Roblox. Password tidak diperlukan
                        karena sistem menggunakan GamePass untuk transfer Robux
                        secara aman.
                      </p>
                    ) : (
                      <p className="text-sm text-amber-700 mt-1">
                        Data akun Roblox Anda akan dienkripsi dan hanya
                        digunakan untuk proses layanan. Kami tidak akan
                        menyimpan atau membagikan informasi login Anda.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form - Right Columns */}
            <div className="lg:col-span-2 space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Payment Method Selection */}
                <div>
                  <h3 className="text-xl font-medium text-primary-100 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center mr-3">
                      💳
                    </div>
                    Pilih Metode Pembayaran
                  </h3>
                  
                  <div className="space-y-4">
                    {/* E-Wallet Section */}
                    <div>
                      <h4 className="text-lg font-medium text-primary-200 mb-3 flex items-center">
                        <span className="mr-2">📱</span>
                        E-Wallet
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {paymentMethods.filter(pm => pm.type === 'ewallet').map((method) => {
                          const fee = calculatePaymentFee(checkoutData.finalAmount || checkoutData.totalAmount, method);
                          return (
                            <div 
                              key={method.id}
                              onClick={() => setSelectedPaymentMethod(method.id)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                selectedPaymentMethod === method.id
                                  ? 'border-neon-pink bg-neon-pink/10 shadow-lg shadow-neon-pink/25'
                                  : 'border-primary-600/50 bg-primary-700/20 hover:border-neon-purple/50 hover:bg-primary-600/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <img 
                                    src={method.icon} 
                                    alt={method.name}
                                    className="w-8 h-8 mr-3"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <span className="font-medium text-primary-100">{method.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-primary-300">+ Rp {fee.toLocaleString('id-ID')}</div>
                                </div>
                              </div>
                              <p className="text-xs text-primary-300">{method.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* QRIS Section */}
                    <div>
                      <h4 className="text-lg font-medium text-primary-200 mb-3 flex items-center">
                        <span className="mr-2">📸</span>
                        QRIS
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {paymentMethods.filter(pm => pm.type === 'qris').map((method) => {
                          const fee = calculatePaymentFee(checkoutData.finalAmount || checkoutData.totalAmount, method);
                          return (
                            <div 
                              key={method.id}
                              onClick={() => setSelectedPaymentMethod(method.id)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                selectedPaymentMethod === method.id
                                  ? 'border-neon-pink bg-neon-pink/10 shadow-lg shadow-neon-pink/25'
                                  : 'border-primary-600/50 bg-primary-700/20 hover:border-neon-purple/50 hover:bg-primary-600/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-primary-600 rounded mr-3 flex items-center justify-center">
                                    <span className="text-xs">QR</span>
                                  </div>
                                  <span className="font-medium text-primary-100">{method.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-primary-300">+ {method.fee}%</div>
                                </div>
                              </div>
                              <p className="text-xs text-primary-300">{method.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Virtual Account Section */}
                    <div>
                      <h4 className="text-lg font-medium text-primary-200 mb-3 flex items-center">
                        <span className="mr-2">🏦</span>
                        Virtual Account
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {paymentMethods.filter(pm => pm.type === 'virtual_account').map((method) => {
                          const fee = calculatePaymentFee(checkoutData.finalAmount || checkoutData.totalAmount, method);
                          return (
                            <div 
                              key={method.id}
                              onClick={() => setSelectedPaymentMethod(method.id)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                selectedPaymentMethod === method.id
                                  ? 'border-neon-pink bg-neon-pink/10 shadow-lg shadow-neon-pink/25'
                                  : 'border-primary-600/50 bg-primary-700/20 hover:border-neon-purple/50 hover:bg-primary-600/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-primary-600 rounded mr-3 flex items-center justify-center">
                                    <span className="text-xs font-bold">{method.name.split(' ')[0]}</span>
                                  </div>
                                  <span className="font-medium text-primary-100">{method.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-primary-300">+ Rp {fee.toLocaleString('id-ID')}</div>
                                </div>
                              </div>
                              <p className="text-xs text-primary-300">{method.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Minimarket Section */}
                    <div>
                      <h4 className="text-lg font-medium text-primary-200 mb-3 flex items-center">
                        <span className="mr-2">🏪</span>
                        Minimarket
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {paymentMethods.filter(pm => pm.type === 'retail').map((method) => {
                          const fee = calculatePaymentFee(checkoutData.finalAmount || checkoutData.totalAmount, method);
                          return (
                            <div 
                              key={method.id}
                              onClick={() => setSelectedPaymentMethod(method.id)}
                              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                selectedPaymentMethod === method.id
                                  ? 'border-neon-pink bg-neon-pink/10 shadow-lg shadow-neon-pink/25'
                                  : 'border-primary-600/50 bg-primary-700/20 hover:border-neon-purple/50 hover:bg-primary-600/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-primary-600 rounded mr-3 flex items-center justify-center">
                                    <span className="text-xs">🏪</span>
                                  </div>
                                  <span className="font-medium text-primary-100">{method.name}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm text-primary-300">+ Rp {fee.toLocaleString('id-ID')}</div>
                                </div>
                              </div>
                              <p className="text-xs text-primary-300">{method.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Customer Information */}
                {(!user || isGuestCheckout) && (
                  <div>
                    <h3 className="text-xl font-medium text-primary-100 mb-6 flex items-center">
                      <div className="w-8 h-8 bg-neon-pink/20 rounded-lg flex items-center justify-center mr-3">
                        👤
                      </div>
                      Informasi Pelanggan
                    </h3>
                    <div className="grid gap-4">
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
                          className="w-full p-3 border border-primary-600/50 rounded-xl focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-primary-100 transition-colors bg-primary-700/20 placeholder-primary-400"
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
                          className="w-full p-3 border border-primary-600/50 rounded-xl focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-primary-100 transition-colors bg-primary-700/20 placeholder-primary-400"
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
                          className="w-full p-3 border border-primary-600/50 rounded-xl focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-primary-100 transition-colors bg-primary-700/20 placeholder-primary-400"
                          placeholder="08123456789"
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Roblox Account */}
                <div>
                  <h3 className="text-xl font-medium text-primary-100 mb-6 flex items-center">
                    <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center mr-3">
                      🎮
                    </div>
                    Data Akun Roblox
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Username Roblox <span className="text-neon-pink">*</span>
                      </label>
                      <input
                        type="text"
                        value={robloxUsername}
                        onChange={(e) => setRobloxUsername(e.target.value)}
                        className="w-full p-3 border border-primary-600/50 rounded-xl focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-primary-100 transition-colors bg-primary-700/20 placeholder-primary-400"
                        placeholder="Masukkan username Roblox"
                        required
                      />
                    </div>
                    {/* Password hanya diperlukan untuk robux instant dan joki, tidak untuk robux 5 hari */}
                    {((checkoutData.serviceType === "robux" &&
                      checkoutData.serviceCategory === "robux_instant") ||
                      checkoutData.serviceType === "joki") && (
                      <div>
                        <label className="block text-sm font-medium text-primary-200 mb-2">
                          Password Roblox <span className="text-neon-pink">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={robloxPassword}
                            onChange={(e) => setRobloxPassword(e.target.value)}
                            className="w-full p-3 pr-12 border border-primary-600/50 rounded-xl focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-primary-100 transition-colors bg-primary-700/20 placeholder-primary-400"
                            placeholder="Masukkan password Roblox"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-400 hover:text-neon-pink transition-colors"
                          >
                            {showPassword ? (
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
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                />
                              </svg>
                            ) : (
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Joki Details (conditionally rendered) */}
                {checkoutData.serviceType === "joki" && (
                  <div>
                    <h3 className="text-xl font-medium text-primary-100 mb-6 flex items-center">
                      <div className="w-8 h-8 bg-neon-pink/20 rounded-lg flex items-center justify-center mr-3">
                        ⚡
                      </div>
                      Detail Layanan Joki
                    </h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-primary-200 mb-2">
                          Deskripsi Layanan <span className="text-neon-pink">*</span>
                          <span className="text-primary-400 text-xs ml-2">
                            (Sesuai layanan yang dipilih)
                          </span>
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
                          className="w-full p-3 border border-primary-600/30 rounded-xl bg-primary-800/20 text-primary-200 cursor-not-allowed"
                          placeholder="Deskripsi layanan akan terisi otomatis..."
                          disabled={true}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-200 mb-2">
                          Jenis Game <span className="text-neon-pink">*</span>
                          <span className="text-primary-400 text-xs ml-2">
                            (Sesuai layanan yang dipilih)
                          </span>
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
                          className="w-full p-3 border border-primary-600/30 rounded-xl bg-primary-800/20 text-primary-200 cursor-not-allowed"
                          placeholder="Jenis game akan terisi otomatis..."
                          disabled={true}
                          required
                        />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-primary-200 mb-4">
                          Kode Keamanan (Opsional)
                        </h4>
                        <label className="block text-sm font-medium text-primary-300 mb-2">
                          <span className="text-primary-400 text-xs">
                            Klik link berikut untuk melihat kode keamanan Anda.{" "}
                            <Link
                              className="underline text-neon-purple hover:text-neon-pink transition-colors"
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
                          value={jokiDetails.notes}
                          onChange={(e) =>
                            setJokiDetails((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          rows={2}
                          className="w-full p-3 border border-primary-600/50 rounded-xl focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-primary-100 transition-colors bg-primary-700/20 placeholder-primary-400"
                          placeholder="Masukkan kode keamanan (opsional)"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Notes only for Robux Instant */}
                {checkoutData.serviceType === "robux" &&
                  checkoutData.serviceCategory === "robux_instant" && (
                    <div>
                      <h3 className="text-xl font-medium text-primary-100 mb-6 flex items-center">
                        <div className="w-8 h-8 bg-neon-purple/20 rounded-lg flex items-center justify-center mr-3">
                          🔒
                        </div>
                        Kode Keamanan (Opsional)
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-primary-300 mb-2">
                          <span className="text-primary-400 text-xs">
                            Klik link berikut untuk melihat kode keamanan Anda.{" "}
                            <Link
                              className="underline text-neon-purple hover:text-neon-pink transition-colors"
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
                          className="w-full p-3 border border-primary-600/50 rounded-xl focus:ring-2 focus:ring-neon-pink focus:border-neon-pink text-primary-100 transition-colors bg-primary-700/20 placeholder-primary-400"
                          placeholder="Masukkan kode keamanan (opsional)"
                        />
                      </div>
                    </div>
                  )}

                {/* Terms */}
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 mr-3 w-4 h-4 text-neon-pink bg-primary-700 border-primary-600 rounded focus:ring-neon-pink focus:ring-2"
                    required
                  />
                  <label className="text-sm text-primary-200">
                    Saya menyetujui{" "}
                    <a
                      href="#"
                      className="text-neon-purple hover:text-neon-pink hover:underline transition-colors"
                    >
                      syarat dan ketentuan
                    </a>{" "}
                    serta{" "}
                    <a
                      href="#"
                      className="text-neon-purple hover:text-neon-pink hover:underline transition-colors"
                    >
                      kebijakan privasi
                    </a>{" "}
                    yang berlaku.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !acceptTerms || !selectedPaymentMethod}
                  className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                    submitting || !acceptTerms || !selectedPaymentMethod
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:from-neon-purple hover:to-neon-pink transform hover:scale-[1.02] shadow-neon-pink/25"
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Memproses...
                    </div>
                  ) : (
                    `💳 Bayar Sekarang - Rp ${calculateFinalAmount().toLocaleString("id-ID")}`
                  )}
                </button>
              </form>
            </div>
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-pink"></div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
