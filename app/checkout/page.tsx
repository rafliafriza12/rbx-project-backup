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
  Shield,
  DollarSign,
} from "lucide-react";

interface CheckoutItem {
  serviceType: string;
  serviceId: string;
  serviceName: string;
  serviceImage: string;
  serviceCategory?: string;
  description?: string;
  gameType?: string;
  quantity: number;
  unitPrice: number;
  robloxUsername?: string;
  robloxPassword?: string | null;
  // Service-specific details
  gamepassDetails?: any;
  jokiDetails?: any;
  robuxInstantDetails?: any;
  rbx5Details?: any;
}

interface CheckoutData {
  items: CheckoutItem[];
  totalAmount: number;
  discountPercentage?: number;
  discountAmount?: number;
  finalAmount?: number;
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

  // Track if this is a multi-checkout from cart with different credentials per item
  const [isMultiCheckoutFromCart, setIsMultiCheckoutFromCart] = useState(false);

  // Form data
  const [robloxUsername, setRobloxUsername] = useState("");
  const [robloxPassword, setRobloxPassword] = useState("");
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

  // Check if this is guest checkout - user bisa checkout tanpa login
  const isGuestCheckout = !user;

  // Payment methods state - fetch from database
  const [paymentCategories, setPaymentCategories] = useState<PaymentCategory[]>(
    []
  );

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

  // Auto-fill customer info for logged in users
  useEffect(() => {
    if (user && !isGuestCheckout) {
      setCustomerInfo({
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
  }, [user, isGuestCheckout]);

  // Load Midtrans Snap script
  useEffect(() => {
    const midtransScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

    let scriptTag = document.querySelector(
      `script[src="${midtransScriptUrl}"]`
    ) as HTMLScriptElement;

    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.src = midtransScriptUrl;
      scriptTag.setAttribute("data-client-key", clientKey);
      scriptTag.async = true;

      scriptTag.onload = () => {
        console.log("Midtrans Snap script loaded successfully");
      };

      scriptTag.onerror = () => {
        console.error("Failed to load Midtrans Snap script");
      };

      document.body.appendChild(scriptTag);
    }

    return () => {
      // Cleanup if needed
    };
  }, []);

  useEffect(() => {
    console.log("=== CHECKOUT PAGE DEBUG START ===");
    console.log("User ID:", user?.id);
    console.log("Is Guest Checkout:", !user);
    console.log("1. Component mounted, checking sessionStorage...");

    // Pre-fill customer info if user is logged in
    if (user && !isGuestCheckout) {
      console.log("2. User is logged in, pre-filling customer info...");
      console.log("User data:", user);
      setCustomerInfo({
        name: (user as any).name || "",
        email: (user as any).email || "",
        phone: (user as any).phone || "",
      });
    } else {
      console.log("2. Guest checkout - customer info will be manually filled");
    }

    // Get checkout data from sessionStorage
    const sessionData = sessionStorage.getItem("checkoutData");
    console.log("3. SessionStorage data:", sessionData);

    if (sessionData) {
      try {
        console.log("4. Parsing sessionStorage data...");
        const parsedData = JSON.parse(sessionData);
        console.log("5. Parsed data:", parsedData);

        // Handle both old single object and new array format
        const itemsArray = Array.isArray(parsedData)
          ? parsedData
          : [parsedData];
        console.log("6. Items array:", itemsArray);

        // Check if this is multi-checkout from cart with different credentials
        // Multi-checkout from cart: items already have robloxUsername/Password
        const hasItemCredentials = itemsArray.some(
          (item: any) => item.robloxUsername || item.robloxPassword
        );
        const isMultiCheckout = itemsArray.length > 1 && hasItemCredentials;

        console.log("6.1. Checkout type check:", {
          itemCount: itemsArray.length,
          hasItemCredentials,
          isMultiCheckout,
        });

        setIsMultiCheckoutFromCart(isMultiCheckout);

        // Calculate total amount from all items
        const baseAmount = itemsArray.reduce((sum: number, item: any) => {
          return sum + item.quantity * item.unitPrice;
        }, 0);
        console.log("7. Base amount calculated:", baseAmount);

        const discount = calculateDiscount(baseAmount);
        console.log("8. Discount calculated:", discount);

        setCheckoutData({
          items: itemsArray,
          totalAmount: baseAmount,
          discountPercentage: discount.discountPercentage,
          discountAmount: discount.discountAmount,
          finalAmount: discount.finalAmount,
        });

        console.log("9. Checkout data set successfully");

        // DEBUG: Check backup code in loaded data
        itemsArray.forEach((item: any, index: number) => {
          console.log(`[DEBUG] Item ${index + 1} data check:`, {
            serviceType: item.serviceType,
            robloxUsername: item.robloxUsername,
            hasPassword: !!item.robloxPassword,
            jokiDetails: item.jokiDetails,
            robuxInstantDetails: item.robuxInstantDetails,
            jokiNotes: item.jokiDetails?.notes,
            jokiAdditionalInfo: item.jokiDetails?.additionalInfo,
            robuxNotes: item.robuxInstantDetails?.notes,
            robuxAdditionalInfo: item.robuxInstantDetails?.additionalInfo,
          });
        });

        // Pre-fill form data ONLY if NOT multi-checkout from cart
        // Multi-checkout dari cart: setiap item sudah punya data sendiri
        // Single checkout langsung: pakai form global
        if (!isMultiCheckout) {
          const firstItem = itemsArray[0];
          if (firstItem.robloxUsername) {
            console.log(
              "10. Pre-filling roblox username:",
              firstItem.robloxUsername
            );
            setRobloxUsername(firstItem.robloxUsername);
          }

          // Only set password for services that require it
          if (
            firstItem.serviceType !== "gamepass" &&
            !(firstItem.serviceType === "robux" && firstItem.rbx5Details)
          ) {
            if (firstItem.robloxPassword) {
              console.log("11. Pre-filling roblox password: [HIDDEN]");
              setRobloxPassword(firstItem.robloxPassword);
            }
          } else {
            console.log(
              "11. Gamepass or Robux 5 Hari detected - clearing password field"
            );
            setRobloxPassword("");
          }
        } else {
          console.log(
            "10-11. Multi-checkout from cart detected - using individual item credentials"
          );
        }

        // Data loaded successfully
        // Backup code for Joki and Robux Instant will stay in item.jokiDetails and item.robuxInstantDetails
        // Additional notes field is separate and universal for all services

        console.log(
          "14. Data loaded successfully, sessionStorage will be cleared on successful payment"
        );
      } catch (error) {
        console.error("Error parsing sessionStorage data:", error);
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

        // Convert URL params to items array format
        setCheckoutData({
          items: [
            {
              serviceType,
              serviceId,
              serviceName,
              serviceImage: serviceImage || "",
              quantity,
              unitPrice,
            },
          ],
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

  // Fetch payment methods from database
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/payment-methods?active=true");
        const result = await response.json();

        if (result.success && result.data) {
          // Group payment methods by category
          const groupedMethods: { [key: string]: any } = {};

          result.data.forEach((method: any) => {
            if (!groupedMethods[method.category]) {
              groupedMethods[method.category] = {
                id: method.category,
                name: getCategoryName(method.category),
                icon: getCategoryIcon(method.category),
                description: getCategoryDescription(method.category),
                methods: [],
              };
            }

            groupedMethods[method.category].methods.push({
              id: method.code.toLowerCase(),
              name: method.name,
              icon: method.icon,
              fee: method.fee,
              feeType: method.feeType,
              description: method.description,
            });
          });

          // Sort methods by display order within each category
          Object.values(groupedMethods).forEach((category: any) => {
            category.methods.sort((a: any, b: any) => {
              const methodA = result.data.find(
                (m: any) => m.code.toLowerCase() === a.id
              );
              const methodB = result.data.find(
                (m: any) => m.code.toLowerCase() === b.id
              );
              return (
                (methodA?.displayOrder || 0) - (methodB?.displayOrder || 0)
              );
            });
          });

          setPaymentCategories(Object.values(groupedMethods));
        }
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        // Set default payment methods if fetch fails
        setPaymentCategories([]);
      }
    };

    fetchPaymentMethods();
  }, []);

  // Helper functions for category mapping
  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      ewallet: "E-Wallet",
      bank_transfer: "Virtual Account",
      qris: "QRIS",
      retail: "Minimarket",
      credit_card: "Credit Card",
      other: "Lainnya",
    };
    return names[category] || category;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      ewallet: Wallet,
      bank_transfer: Building2,
      qris: QrCode,
      retail: Store,
      credit_card: CreditCard,
      other: Wallet,
    };
    return icons[category] || Wallet;
  };

  const getCategoryDescription = (category: string) => {
    const descriptions: { [key: string]: string } = {
      ewallet: "Transfer langsung ke e-wallet",
      bank_transfer: "Transfer melalui ATM/Mobile Banking",
      qris: "Scan QR Code untuk pembayaran instant",
      retail: "Bayar di kasir minimarket terdekat",
      credit_card: "Pembayaran dengan kartu kredit",
      other: "Metode pembayaran lainnya",
    };
    return descriptions[category] || "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkoutData) {
      toast.error("Data checkout tidak valid");
      return;
    }

    // Validation - hanya cek form jika bukan multi-checkout dari cart
    // Multi-checkout dari cart: data sudah ada di setiap item
    if (!isMultiCheckoutFromCart) {
      if (!robloxUsername.trim()) {
        toast.error("Username Roblox harus diisi");
        return;
      }

      // Check if any item requires password
      const requiresPassword = checkoutData.items.some((item) => {
        return (
          item.serviceType === "joki" ||
          (item.serviceType === "robux" && item.robuxInstantDetails)
        );
      });

      if (requiresPassword && !robloxPassword.trim()) {
        toast.error("Password Roblox harus diisi untuk layanan ini");
        return;
      }
    } else {
      // Multi-checkout: validasi setiap item punya credentials
      const missingCredentials = checkoutData.items.some(
        (item) => !item.robloxUsername
      );

      if (missingCredentials) {
        toast.error(
          "Ada item yang belum memiliki data Roblox. Silakan lengkapi di halaman cart."
        );
        return;
      }
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

    // For logged in users, ensure we have user data
    if (!isGuestCheckout && !user) {
      toast.error("Data user tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error("Pilih metode pembayaran terlebih dahulu");
      return;
    }

    if (!acceptTerms) {
      toast.error("Anda harus menyetujui syarat dan ketentuan");
      return;
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

    console.log("\n=== PREPARE ITEMS WITH CREDENTIALS ===");
    console.log("Original checkoutData.items:", checkoutData.items);
    console.log("isMultiCheckoutFromCart:", isMultiCheckoutFromCart);

    checkoutData.items.forEach((item: any, index: number) => {
      console.log(`[BEFORE MAP] Item ${index + 1}:`, {
        serviceType: item.serviceType,
        robloxUsername: item.robloxUsername,
        hasPassword: !!item.robloxPassword,
        jokiDetails: item.jokiDetails,
        robuxInstantDetails: item.robuxInstantDetails,
      });
    });

    // Prepare items for transaction
    // Multi-checkout dari cart: gunakan data dari setiap item
    // Single checkout langsung: gunakan data dari form global
    const itemsWithCredentials = checkoutData.items.map((item) => {
      // Jika multi-checkout dari cart, gunakan credentials dari item
      // Jika single checkout, gunakan credentials dari form
      const itemUsername = isMultiCheckoutFromCart
        ? item.robloxUsername
        : robloxUsername;
      const itemPassword = isMultiCheckoutFromCart
        ? item.robloxPassword
        : item.serviceType === "gamepass" || item.rbx5Details
        ? ""
        : robloxPassword;

      return {
        ...item,
        robloxUsername: itemUsername,
        robloxPassword: itemPassword,
        // Preserve joki details dengan backup code
        jokiDetails:
          item.serviceType === "joki" && item.jokiDetails
            ? {
                ...item.jokiDetails,
                notes:
                  item.jokiDetails.notes ||
                  item.jokiDetails.additionalInfo ||
                  "",
                additionalInfo:
                  item.jokiDetails.additionalInfo ||
                  item.jokiDetails.notes ||
                  "",
              }
            : item.jokiDetails,
        // Preserve robux instant details dengan backup code
        robuxInstantDetails: item.robuxInstantDetails
          ? {
              ...item.robuxInstantDetails,
              additionalInfo:
                item.robuxInstantDetails.additionalInfo ||
                item.robuxInstantDetails.notes ||
                "",
              notes:
                item.robuxInstantDetails.notes ||
                item.robuxInstantDetails.additionalInfo ||
                "",
            }
          : undefined,
        // Preserve rbx5 details dengan backup code
        rbx5Details: item.rbx5Details
          ? {
              ...item.rbx5Details,
              backupCode: item.rbx5Details.backupCode || "",
            }
          : undefined,
      };
    });

    const requestData = {
      items: itemsWithCredentials,
      totalAmount: checkoutData.totalAmount,
      discountPercentage: checkoutData.discountPercentage || 0,
      discountAmount: checkoutData.discountAmount || 0,
      finalAmount:
        (checkoutData.finalAmount || checkoutData.totalAmount) + paymentFee,
      paymentMethod: selectedPaymentMethod,
      paymentFee: paymentFee,
      additionalNotes: additionalNotes.trim() || undefined, // Universal additional notes from checkout
      customerInfo: isGuestCheckout
        ? {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          }
        : {
            name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            email: user.email,
            phone: user.phone,
            userId: user.id,
          },
      userId: isGuestCheckout ? null : user.id,
    };

    try {
      console.log("=== SUBMITTING TRANSACTION DEBUG ===");
      console.log("Full request data:", requestData);
      console.log("\n=== BACKUP CODE CHECK BEFORE API ===");
      itemsWithCredentials.forEach((item: any, index: number) => {
        console.log(`Item ${index + 1}:`, {
          serviceType: item.serviceType,
          serviceName: item.serviceName,
          jokiBackupCode:
            item.jokiDetails?.notes || item.jokiDetails?.additionalInfo,
          robuxBackupCode:
            item.robuxInstantDetails?.notes ||
            item.robuxInstantDetails?.additionalInfo,
          jokiDetails: item.jokiDetails,
          robuxInstantDetails: item.robuxInstantDetails,
        });
      });
      console.log("Universal additional notes:", requestData.additionalNotes);
      console.log("========================\n");
      itemsWithCredentials.forEach((item, index) => {
        if (item.jokiDetails) {
          console.log(
            `Item ${index} - Joki backup code (notes):`,
            item.jokiDetails.notes
          );
          console.log(
            `Item ${index} - Joki backup code (additionalInfo):`,
            item.jokiDetails.additionalInfo
          );
        }
        if (item.robuxInstantDetails) {
          console.log(
            `Item ${index} - Robux Instant backup code (notes):`,
            item.robuxInstantDetails.notes
          );
          console.log(
            `Item ${index} - Robux Instant backup code (additionalInfo):`,
            item.robuxInstantDetails.additionalInfo
          );
        }
      });
      console.log("Universal additional notes:", requestData.additionalNotes);
      console.log("========================");

      // Determine which API endpoint to use
      const isMultiTransaction = itemsWithCredentials.length > 1;
      const apiEndpoint = isMultiTransaction
        ? "/api/transactions/multi"
        : "/api/transactions";

      // Prepare request data based on transaction type
      const finalRequestData: any = isMultiTransaction
        ? {
            // Multi-checkout format
            items: itemsWithCredentials,
            totalAmount: checkoutData.totalAmount,
            discountPercentage: checkoutData.discountPercentage || 0,
            discountAmount: checkoutData.discountAmount || 0,
            finalAmount:
              (checkoutData.finalAmount || checkoutData.totalAmount) +
              paymentFee,
            paymentMethodId: selectedPaymentMethod,
            paymentFee: paymentFee,
            additionalNotes: additionalNotes.trim() || undefined,
            customerInfo: requestData.customerInfo,
            userId: requestData.userId,
          }
        : {
            // Single checkout format
            serviceType: itemsWithCredentials[0].serviceType,
            serviceId: itemsWithCredentials[0].serviceId,
            serviceName: itemsWithCredentials[0].serviceName,
            serviceImage: itemsWithCredentials[0].serviceImage || "",
            serviceCategory: itemsWithCredentials[0].serviceCategory,
            description: itemsWithCredentials[0].description,
            quantity: itemsWithCredentials[0].quantity,
            unitPrice: itemsWithCredentials[0].unitPrice,
            totalAmount: checkoutData.totalAmount,
            discountPercentage: checkoutData.discountPercentage || 0,
            discountAmount: checkoutData.discountAmount || 0,
            finalAmount:
              (checkoutData.finalAmount || checkoutData.totalAmount) +
              paymentFee,
            robloxUsername: itemsWithCredentials[0].robloxUsername,
            robloxPassword: itemsWithCredentials[0].robloxPassword || null,
            jokiDetails: itemsWithCredentials[0].jokiDetails,
            robuxInstantDetails: itemsWithCredentials[0].robuxInstantDetails,
            rbx5Details: itemsWithCredentials[0].rbx5Details,
            gamepassDetails: itemsWithCredentials[0].gamepassDetails,
            gamepass: itemsWithCredentials[0].rbx5Details?.gamepass || null,
            paymentMethodId: selectedPaymentMethod,
            paymentFee: paymentFee,
            additionalNotes: additionalNotes.trim() || undefined,
            customerInfo: requestData.customerInfo,
            userId: requestData.userId,
          };

      console.log("=== FINAL REQUEST DATA ===");
      console.log("API Endpoint:", apiEndpoint);
      console.log("Request:", JSON.stringify(finalRequestData, null, 2));

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(finalRequestData),
      });

      const result = await response.json();
      console.log("Transaction response:", result);

      if (result.success) {
        // Clear sessionStorage on successful transaction
        sessionStorage.removeItem("checkoutData");

        toast.success("Transaksi berhasil dibuat!");

        // Open Midtrans payment page
        if (result.data?.snapToken) {
          // Use Midtrans Snap
          const snapUrl = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${result.data.snapToken}`;
          window.location.href = result.data.redirectUrl || snapUrl;
        } else if (result.data?.transaction?._id) {
          // Fallback to transaction detail
          router.push(`/transaction/${result.data.transaction._id}`);
        } else if (result.data?.transactions?.[0]?._id) {
          // Multi-transaction: redirect to first transaction
          router.push(`/transaction/${result.data.transactions[0]._id}`);
        } else {
          router.push("/riwayat");
        }
      } else {
        toast.error(
          result.error ||
            result.message ||
            "Terjadi kesalahan saat membuat transaksi"
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
      <div className="min-h-screen flex items-center justify-center bg-[#22102A]">
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
      <div className="min-h-screen flex items-center justify-center bg-[#22102A]">
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
    <div className="min-h-screen bg-[#22102A] py-8">
      {/* Background Effects */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-neon-pink/20 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-neon-purple/20 rounded-full blur-xl animate-pulse"></div>

      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Selesaikan <span className="text-neon-pink">Pesanan</span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Lengkapi data untuk melanjutkan pembayaran dengan aman
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Summary & Payment - Left Column */}
          <div className="lg:col-span-1 space-y-5">
            {/* Order Summary */}
            <div className="neon-card rounded-2xl p-5">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                <div className="w-7 h-7 bg-neon-pink/20 rounded-lg flex items-center justify-center mr-3">
                  <Gem className="w-4 h-4 text-neon-pink" />
                </div>
                Ringkasan Pesanan
              </h2>

              <div className="neon-card-secondary rounded-xl p-6 mb-6 text-white">
                {/* Display all items */}
                <div className="space-y-4 mb-4">
                  {checkoutData.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 pb-4 border-b border-neon-purple/20 last:border-0 last:pb-0"
                    >
                      {/* Show dollar icon for rbx5 and robux instant, otherwise show image */}
                      {item.rbx5Details || item.robuxInstantDetails ? (
                        <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg border-2 border-green-500/30">
                          <DollarSign className="w-8 h-8 text-green-400" />
                        </div>
                      ) : (
                        item.serviceImage && (
                          <img
                            src={item.serviceImage}
                            alt={item.serviceName}
                            className="w-16 h-16 object-cover rounded-lg border-2 border-neon-purple/30"
                          />
                        )
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          {item.serviceName}
                        </h3>

                        {/* Show gamepassDetails if available */}
                        {item.gamepassDetails && (
                          <div className="text-xs text-white/70 mt-1">
                            <div>Game: {item.gamepassDetails.gameName}</div>
                            <div>Item: {item.gamepassDetails.itemName}</div>
                          </div>
                        )}

                        {/* Show jokiDetails if available */}
                        {item.jokiDetails && (
                          <div className="text-xs text-white/70 mt-1">
                            <div>Game: {item.jokiDetails.gameName}</div>
                            <div>Item: {item.jokiDetails.itemName}</div>
                          </div>
                        )}

                        <p className="text-sm text-white capitalize mb-2">
                          {item.serviceType}
                          {item.rbx5Details && (
                            <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              5 Hari
                            </span>
                          )}
                          {item.robuxInstantDetails && (
                            <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Instant
                            </span>
                          )}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-white">
                            Qty: {item.quantity}
                          </span>
                          <span className="font-medium text-white">
                            Rp {item.unitPrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-neon-purple/20 pt-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white">Subtotal:</span>
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
                      <span className="text-white">Biaya Admin:</span>
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

            {/* Payment Method Selection */}
            <div className="neon-card rounded-2xl p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                <div className="w-7 h-7 bg-neon-purple/20 rounded-lg flex items-center justify-center mr-3">
                  <CreditCard className="w-4 h-4 text-neon-purple" />
                </div>
                Pilih Metode Pembayaran
              </h3>

              <div className="space-y-3">
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
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-primary-600/20 transition-colors"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-neon-pink/10 rounded-lg flex items-center justify-center mr-3">
                          <category.icon className="w-4 h-4 text-neon-pink" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {category.name}
                          </h4>
                          <p className="text-xs text-white">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-neon-purple">
                        {expandedCategory === category.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {/* Category Methods */}
                    {expandedCategory === category.id && (
                      <div className="border-t border-neon-purple/20 p-4 pt-3">
                        <div className="grid grid-cols-1 gap-3">
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
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                                  selectedPaymentMethod === method.id
                                    ? "border-neon-pink bg-neon-pink/10 shadow-lg glow-neon-pink"
                                    : "border-primary-600/50 bg-primary-700/20 hover:border-neon-purple/50 hover:bg-primary-600/20"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center">
                                    {method.icon &&
                                    method.icon.startsWith("http") ? (
                                      <img
                                        src={method.icon}
                                        alt={method.name}
                                        className="w-6 h-6 object-cover rounded mr-2"
                                      />
                                    ) : (
                                      <span className="text-lg mr-2">
                                        {method.icon}
                                      </span>
                                    )}
                                    <span className="font-semibold text-white text-sm">
                                      {method.name}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-white">
                                      +{" "}
                                      {method.feeType === "percentage"
                                        ? `${method.fee}%`
                                        : `Rp ${fee.toLocaleString("id-ID")}`}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-white">
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
          </div>

          {/* Main Form - Right Column */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Information */}
              {isGuestCheckout && (
                <div className="neon-card rounded-2xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <div className="w-7 h-7 bg-neon-pink/20 rounded-lg flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-neon-pink" />
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
                        className="w-full p-3 border-2 border-white/20 rounded-lg bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
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
                        className="w-full p-3 border-2 border-white/20 rounded-lg bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
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
                        className="w-full p-3 border-2 border-white/20 rounded-lg bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                        placeholder="08123456789"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Information for Logged In Users (Read-only display) */}
              {!isGuestCheckout && user && (
                <div className="neon-card rounded-2xl p-5">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <div className="w-7 h-7 bg-neon-pink/20 rounded-lg flex items-center justify-center mr-3">
                      <User className="w-4 h-4 text-neon-pink" />
                    </div>
                    Informasi Pelanggan
                    <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                      Auto-filled
                    </span>
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Nama Lengkap
                      </label>
                      <div className="w-full p-3 border-2 border-green-500/30 rounded-lg bg-green-500/5 backdrop-blur-md text-white">
                        {`${user.firstName || ""} ${
                          user.lastName || ""
                        }`.trim() || "Tidak tersedia"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Email
                      </label>
                      <div className="w-full p-3 border-2 border-green-500/30 rounded-lg bg-green-500/5 backdrop-blur-md text-white">
                        {user.email || "Tidak tersedia"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Nomor WhatsApp
                      </label>
                      <div className="w-full p-3 border-2 border-green-500/30 rounded-lg bg-green-500/5 backdrop-blur-md text-white">
                        {user.phone || "Tidak tersedia"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Roblox Account */}
              <div className="neon-card rounded-2xl p-5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <div className="w-7 h-7 bg-neon-purple/20 rounded-lg flex items-center justify-center mr-3">
                    <Gamepad2 className="w-4 h-4 text-neon-purple" />
                  </div>
                  Data Akun Roblox
                  {isMultiCheckoutFromCart && (
                    <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Data dari Cart
                    </span>
                  )}
                </h3>

                {/* Info jika multi-checkout dari cart */}
                {isMultiCheckoutFromCart ? (
                  <div className="space-y-4">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-sm text-blue-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                          Anda checkout multiple items dari keranjang. Data
                          Roblox (username, password, backup code) untuk setiap
                          item sudah disimpan saat menambahkan ke keranjang.
                        </span>
                      </p>
                    </div>

                    {/* Show items dengan credentials */}
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-primary-200">
                        Items dengan Data Roblox:
                      </p>
                      {checkoutData.items.map((item, index) => {
                        // Extract backup code from different sources
                        const backupCode =
                          item.jokiDetails?.notes ||
                          item.jokiDetails?.additionalInfo ||
                          item.robuxInstantDetails?.notes ||
                          item.robuxInstantDetails?.additionalInfo ||
                          item.rbx5Details?.backupCode;

                        return (
                          <div
                            key={index}
                            className="bg-white/5 border border-white/10 rounded-lg p-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-neon-pink/20 to-neon-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-white">
                                  #{index + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                  {item.serviceName}
                                </p>
                                <div className="mt-2 space-y-1">
                                  <p className="text-xs text-primary-300">
                                    Username:{" "}
                                    <span className="text-green-400 font-medium">
                                      {item.robloxUsername || "Belum diisi"}
                                    </span>
                                  </p>
                                  {item.robloxPassword && (
                                    <p className="text-xs text-primary-300">
                                      Password:{" "}
                                      <span className="text-yellow-400 font-mono">
                                        ••••••••
                                      </span>
                                    </p>
                                  )}
                                  {backupCode && backupCode.trim() !== "" && (
                                    <p className="text-xs text-primary-300">
                                      Backup Code:{" "}
                                      <span className="text-blue-400 font-medium">
                                        {backupCode}
                                      </span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  // Form untuk single checkout
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-200 mb-2">
                        Username Roblox{" "}
                        <span className="text-neon-pink">*</span>
                      </label>
                      <input
                        type="text"
                        value={robloxUsername}
                        onChange={(e) => setRobloxUsername(e.target.value)}
                        className="w-full p-3 border-2 border-white/20 rounded-lg bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                        placeholder="Masukkan username Roblox"
                        required
                      />
                    </div>
                    {/* Password hanya diperlukan untuk robux instant dan joki */}
                    {checkoutData.items.some(
                      (item) =>
                        item.serviceType === "joki" ||
                        (item.serviceType === "robux" &&
                          item.robuxInstantDetails)
                    ) && (
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
                            className="w-full p-3 pr-12 border-2 border-white/20 rounded-lg bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                            placeholder="Masukkan password Roblox"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary-400 hover:text-neon-pink transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Display Backup Code if exists (read-only) */}
                    {checkoutData.items.some((item) => {
                      const backupCode =
                        item.jokiDetails?.notes ||
                        item.jokiDetails?.additionalInfo ||
                        item.robuxInstantDetails?.notes ||
                        item.robuxInstantDetails?.additionalInfo;
                      return backupCode && backupCode.trim() !== "";
                    }) && (
                      <div className="bg-gradient-to-r from-green-500/10 to-green-600/10 border-2 border-green-500/30 rounded-xl p-4">
                        <label className="text-sm font-medium text-green-300 mb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Backup Code (2FA)
                          <span className="text-xs text-green-400/70 font-normal">
                            - Dari halaman pemesanan
                          </span>
                        </label>
                        {(() => {
                          // Get backup code from first item that has it
                          const itemWithBackup = checkoutData.items.find(
                            (item) => {
                              const backupCode =
                                item.jokiDetails?.notes ||
                                item.jokiDetails?.additionalInfo ||
                                item.robuxInstantDetails?.notes ||
                                item.robuxInstantDetails?.additionalInfo;
                              return backupCode && backupCode.trim() !== "";
                            }
                          );

                          if (!itemWithBackup) return null;

                          const backupCode =
                            itemWithBackup.jokiDetails?.notes ||
                            itemWithBackup.jokiDetails?.additionalInfo ||
                            itemWithBackup.robuxInstantDetails?.notes ||
                            itemWithBackup.robuxInstantDetails?.additionalInfo;

                          return (
                            <div className="w-full p-3 border-2 border-green-500/40 rounded-lg bg-green-500/5 backdrop-blur-md text-green-200 font-mono">
                              {backupCode}
                            </div>
                          );
                        })()}
                        <p className="text-xs text-green-400/70 mt-2">
                          ℹ️ Backup code akan dikirim ke admin bersama pesanan
                          Anda
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Universal Additional Notes for All Services */}
              <div className="neon-card rounded-2xl p-5">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <div className="w-7 h-7 bg-neon-pink/20 rounded-lg flex items-center justify-center mr-3">
                    <Sparkles className="w-4 h-4 text-neon-pink" />
                  </div>
                  Catatan Tambahan
                  <span className="text-xs text-white/60 font-normal ml-2">
                    (Opsional)
                  </span>
                </h3>
                <div>
                  {/* Info box berdasarkan service type */}
                  <div className="bg-gradient-to-r from-primary-600/20 to-primary-700/20 border border-primary-200/30 rounded-xl p-4 mb-4">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-primary-200 mr-3 mt-0.5" />
                      <div className="text-sm text-white/80">
                        <p className="font-medium mb-2 text-white">
                          � Tips Catatan Tambahan:
                        </p>
                        <ul className="text-white/70 space-y-1 text-xs">
                          {checkoutData.items.some(
                            (item) => item.serviceType === "joki"
                          ) && (
                            <>
                              <li>• Target rank atau level yang diinginkan</li>
                              <li>• Waktu pengerjaan yang diharapkan</li>
                              <li>• Instruksi khusus untuk joki</li>
                            </>
                          )}
                          {checkoutData.items.some(
                            (item) => item.serviceType === "gamepass"
                          ) && (
                            <>
                              <li>• Request untuk proses lebih cepat</li>
                              <li>• Informasi tambahan tentang gamepass</li>
                            </>
                          )}
                          {checkoutData.items.some(
                            (item) =>
                              item.serviceType === "robux" && item.rbx5Details
                          ) && (
                            <>
                              <li>• Informasi tentang gamepass yang dibuat</li>
                              <li>• Instruksi khusus untuk proses</li>
                            </>
                          )}
                          {checkoutData.items.some(
                            (item) =>
                              item.serviceType === "robux" &&
                              item.robuxInstantDetails
                          ) && (
                            <>
                              <li>• Informasi akun tambahan</li>
                              <li>• Request khusus untuk proses</li>
                            </>
                          )}
                          <li>
                            • Atau catatan lainnya yang perlu diketahui admin
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <label className="block text-sm font-medium text-primary-200 mb-2">
                    Catatan Tambahan
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={4}
                    className="w-full p-3 border-2 border-white/20 rounded-lg bg-white/5 backdrop-blur-md text-white placeholder-white/50 focus:border-neon-pink focus:bg-white/10 focus:outline-none transition-all duration-300"
                    placeholder={
                      checkoutData.items.some(
                        (item) => item.serviceType === "joki"
                      )
                        ? "Contoh: Tolong dikerjakan malam hari, target Mythic dalam 3 hari, jangan gunakan voice chat..."
                        : checkoutData.items.some(
                            (item) => item.serviceType === "gamepass"
                          )
                        ? "Contoh: Mohon diproses secepatnya, saya akan online jam 8 malam..."
                        : checkoutData.items.some(
                            (item) =>
                              item.serviceType === "robux" && item.rbx5Details
                          )
                        ? "Contoh: Gamepass sudah dibuat dengan harga yang sesuai, mohon segera diproses..."
                        : "Tambahkan catatan atau instruksi khusus untuk pesanan Anda..."
                    }
                  />
                  <p className="text-xs text-white/60 mt-2">
                    💡 Catatan ini akan membantu kami memberikan layanan yang
                    lebih baik sesuai kebutuhan Anda
                  </p>
                </div>
              </div>

              {/* Terms */}
              <div className="neon-card rounded-2xl p-5">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-1 mr-3 w-4 h-4 text-neon-pink bg-primary-700 border-primary-600 rounded focus:ring-neon-pink focus:ring-2"
                    required
                  />
                  <label className="text-sm text-white">
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
                  className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 transform inline-flex items-center gap-3 w-full md:w-auto justify-center shadow-xl ${
                    submitting || !acceptTerms || !selectedPaymentMethod
                      ? "bg-gray-700/50 text-gray-400 cursor-not-allowed border border-gray-600"
                      : "btn-neon-primary hover:scale-105 glow-neon-pink active:scale-95"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/20 to-neon-purple/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                        <span>
                          Bayar Sekarang - Rp{" "}
                          {calculateFinalAmount().toLocaleString("id-ID")}
                        </span>
                        <Sparkles className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
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
