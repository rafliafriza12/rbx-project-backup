"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import Link from "next/link";

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

export default function CheckoutPage() {
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
      finalAmount: checkoutData.finalAmount || checkoutData.totalAmount,
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
      customerInfo: {
        ...customerInfo,
        // Tambahkan userId ke customerInfo jika user sudah login
        ...(user && !isGuestCheckout ? { userId: (user as any)?.id } : {}),
      },
      userId: isGuestCheckout ? null : (user as any)?.id, // null untuk guest, gunakan id bukan _id
    };

    console.log("=== CHECKOUT SUBMIT DEBUG ===");
    console.log("Service Type:", checkoutData.serviceType);
    console.log("Is gamepass:", checkoutData.serviceType === "gamepass");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-rose-700 font-medium">
            Memuat halaman checkout...
          </p>
        </div>
      </div>
    );
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white">
        <div className="text-center max-w-md mx-auto p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-rose-200">
          <div className="text-rose-500 mb-6">
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
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Data Checkout Tidak Ditemukan
          </h1>
          <p className="text-gray-600 mb-6">
            Tidak dapat menemukan data checkout yang diperlukan. Hal ini bisa
            terjadi karena:
          </p>
          <div className="text-left text-sm text-gray-600 mb-8 bg-rose-50/80 p-4 rounded-lg border border-rose-200">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="text-rose-500 mr-2">•</span>
                <span>Anda mengakses halaman checkout secara langsung</span>
              </li>
              <li className="flex items-start">
                <span className="text-rose-500 mr-2">•</span>
                <span>Data checkout telah kedaluwarsa</span>
              </li>
              <li className="flex items-start">
                <span className="text-rose-500 mr-2">•</span>
                <span>Browser tidak mendukung sessionStorage</span>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-rose-600 hover:to-pink-700 transition-all duration-200 font-medium shadow-md"
            >
              🏠 Pilih Produk dari Beranda
            </button>
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              ← Kembali ke Halaman Sebelumnya
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white px-6 py-3 rounded-lg hover:from-orange-500 hover:to-pink-600 transition-all duration-200 font-medium text-sm shadow-md"
            >
              🔄 Refresh Halaman
            </button>
          </div>
          <div className="mt-6 p-4 bg-rose-50/80 rounded-lg border border-rose-200">
            <p className="text-xs text-rose-700">
              💡 <strong>Tip:</strong> Buka console browser (F12) untuk melihat
              detail debugging
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9d6db] via-[#f5b8c6] to-white py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden border border-rose-200">
          {/* Header */}
          <div className="bg-[#CE3535]/50 text-gray-800 p-6">
            <h1 className="text-2xl font-bold">Checkout Pembayaran</h1>
            <p className="text-gray-700 mt-1">
              Lengkapi data untuk melanjutkan pembayaran
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Order Summary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Ringkasan Pesanan
              </h2>

              <div className="bg-gradient-to-br from-[#f9d6db]/40 to-[#f5b8c6]/40 rounded-xl p-4 mb-6 border border-rose-200">
                <div className="flex items-start gap-4">
                  {checkoutData.serviceImage && (
                    <img
                      src={checkoutData.serviceImage}
                      alt={checkoutData.serviceName}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-rose-200"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">
                      {checkoutData.serviceName}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {checkoutData.serviceType}
                      {checkoutData.serviceCategory &&
                        checkoutData.serviceType === "robux" && (
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                              checkoutData.serviceCategory === "robux_5_hari"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {checkoutData.serviceCategory === "robux_5_hari"
                              ? "5 Hari"
                              : "Instant"}
                          </span>
                        )}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">
                        Qty: {checkoutData.quantity}
                      </span>
                      <span className="font-medium text-gray-800">
                        Rp {checkoutData.unitPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-rose-200 mt-4 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-800">
                      Rp {checkoutData.totalAmount.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {(checkoutData.discountPercentage || 0) > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600">
                        Diskon Member ({checkoutData.discountPercentage}%):
                      </span>
                      <span className="text-green-600">
                        - Rp{" "}
                        {(checkoutData.discountAmount || 0).toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center border-t border-rose-200 pt-2">
                    <span className="font-semibold text-gray-800">
                      Total Bayar:
                    </span>
                    <span className="font-bold text-xl text-rose-600">
                      Rp{" "}
                      {(
                        checkoutData.finalAmount || checkoutData.totalAmount
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex">
                  <svg
                    className="w-5 h-5 text-amber-500 mr-3 mt-0.5"
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

            {/* Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Info */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-800">
                      Informasi Pembeli
                    </h3>
                    {user ? (
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-green-600 font-medium">
                          Login sebagai {(user as any)?.username}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-orange-600 font-medium">
                          Guest Checkout
                        </span>
                      </div>
                    )}
                  </div>

                  {!user && (
                    <div className="bg-rose-50/60 backdrop-blur-sm border border-rose-200 rounded-xl p-4 mb-4">
                      <div className="flex">
                        <svg
                          className="w-5 h-5 text-rose-500 mr-3 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-rose-800">
                            Checkout sebagai Guest
                          </h4>
                          <p className="text-sm text-rose-700 mt-1">
                            Anda dapat melakukan pembelian tanpa login. Namun
                            untuk pengalaman yang lebih baik,
                            <button
                              type="button"
                              onClick={() => router.push("/login")}
                              className="text-rose-800 font-medium underline ml-1 hover:text-rose-900"
                            >
                              silakan login terlebih dahulu
                            </button>
                            .
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Lengkap{" "}
                        {!user && <span className="text-red-500">*</span>}
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
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-black transition-colors ${
                          user
                            ? "border-rose-200 bg-[#f9d6db]/30"
                            : "border-gray-300 focus:border-rose-400 bg-white/70"
                        }`}
                        placeholder={
                          user
                            ? "Terisi otomatis dari profil"
                            : "Masukkan nama lengkap Anda"
                        }
                        required={!user}
                        readOnly={user ? true : false}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email {!user && <span className="text-red-500">*</span>}
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
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-black transition-colors ${
                          user
                            ? "border-rose-200 bg-[#f9d6db]/30"
                            : "border-gray-300 focus:border-rose-400 bg-white/70"
                        }`}
                        placeholder={
                          user
                            ? "Terisi otomatis dari profil"
                            : "contoh@email.com"
                        }
                        required={!user}
                        readOnly={user ? true : false}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nomor WhatsApp{" "}
                        {!user && <span className="text-red-500">*</span>}
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
                        className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-black transition-colors ${
                          user
                            ? "border-rose-200 bg-[#f9d6db]/30"
                            : "border-gray-300 focus:border-rose-400 bg-white/70"
                        }`}
                        placeholder={
                          user ? "Terisi otomatis dari profil" : "08123456789"
                        }
                        required={!user}
                        readOnly={user ? true : false}
                      />
                    </div>
                  </div>
                </div>

                {/* Roblox Account */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4">
                    Data Akun Roblox
                  </h3>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Username Roblox *
                      </label>
                      <input
                        type="text"
                        value={robloxUsername}
                        onChange={(e) => setRobloxUsername(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-black transition-colors bg-white/70"
                        placeholder="Masukkan username Roblox"
                        required
                      />
                    </div>
                    {/* Password hanya diperlukan untuk robux instant dan joki, tidak untuk robux 5 hari */}
                    {((checkoutData.serviceType === "robux" &&
                      checkoutData.serviceCategory === "robux_instant") ||
                      checkoutData.serviceType === "joki") && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password Roblox *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={robloxPassword}
                            onChange={(e) => setRobloxPassword(e.target.value)}
                            className="w-full p-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-black transition-colors bg-white/70"
                            placeholder="Masukkan password Roblox"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-rose-600 transition-colors"
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
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                      Detail Layanan Joki
                    </h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Deskripsi Layanan *
                          <span className="text-gray-500 text-xs ml-2">
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
                          className="w-full p-3 border border-rose-200 rounded-xl bg-[#f9d6db]/20 text-black cursor-not-allowed"
                          placeholder="Deskripsi layanan akan terisi otomatis..."
                          disabled={true}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Jenis Game *
                          <span className="text-gray-500 text-xs ml-2">
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
                          className="w-full p-3 border border-rose-200 rounded-xl bg-[#f9d6db]/20 text-black cursor-not-allowed"
                          placeholder="Jenis game akan terisi otomatis..."
                          disabled={true}
                          required
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-4">
                          Kode Keamanan (Opsional)
                        </h3>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <span className="text-gray-500 text-xs ml-2">
                            Klik link berikut untuk melihat kode keamanan anda.{" "}
                            <Link
                              className="underline text-blue-500"
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
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-black transition-colors bg-white/70"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional Notes only for Robux Instant */}
                {checkoutData.serviceType === "robux" &&
                  checkoutData.serviceCategory === "robux_instant" && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
                        Kode Keamanan (Opsional)
                      </h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <span className="text-gray-500 text-xs ml-2">
                            Klik link berikut untuk melihat kode keamanan anda.{" "}
                            <Link
                              className="underline text-blue-500"
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
                          className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-black transition-colors bg-white/70"
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
                    className="mt-1 mr-3 w-4 h-4 text-rose-600 bg-gray-100 border-gray-300 rounded focus:ring-0 "
                    required
                  />
                  <label className="text-sm text-gray-600">
                    Saya menyetujui{" "}
                    <a
                      href="#"
                      className="text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      syarat dan ketentuan
                    </a>{" "}
                    serta{" "}
                    <a
                      href="#"
                      className="text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      kebijakan privasi
                    </a>{" "}
                    yang berlaku.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !acceptTerms}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-black transition-all duration-200 shadow-lg ${
                    submitting || !acceptTerms
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#CE3535]/50 text-gray-800  transform hover:scale-[1.02] "
                  }`}
                >
                  {submitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800 mr-2"></div>
                      Memproses...
                    </div>
                  ) : (
                    `💳 Bayar Sekarang - Rp ${(
                      checkoutData.finalAmount || checkoutData.totalAmount
                    ).toLocaleString("id-ID")}`
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
