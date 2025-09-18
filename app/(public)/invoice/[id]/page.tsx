"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { toast } from "react-toastify";

interface OrderData {
  type: "gamepass" | "robux5" | "robux-instant" | "joki";
  game?: string;
  package: string;
  price: number;
  quantity: number;
  description?: string;
  robuxAmount?: number;
  serviceType?: string;
}

function UniversalInvoiceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    robloxUsername: "",
    robloxPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Generate invoice number based on type
  const getInvoicePrefix = (type: string) => {
    switch (type) {
      case "gamepass":
        return "GP";
      case "robux5":
        return "R5";
      case "robux-instant":
        return "RI";
      case "joki":
        return "JK";
      default:
        return "OR";
    }
  };

  const invoiceNumber = orderData
    ? `${getInvoicePrefix(orderData.type)}-${Date.now().toString().slice(-8)}`
    : `OR-${Date.now().toString().slice(-8)}`;

  const orderDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Format currency
  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    // Get invoice ID
    const invoiceId = params.id as string;

    // Check if this is a redirect from old system (has URL params but no stored invoice)
    const hasUrlParams =
      searchParams.get("type") &&
      searchParams.get("package") &&
      searchParams.get("price");
    const storedInvoice = localStorage.getItem(`invoice_${invoiceId}`);

    if (!storedInvoice && hasUrlParams) {
      // This is a new order from old system, redirect to new checkout
      const typeParam = searchParams.get("type");
      const packageParam = searchParams.get("package");
      const priceParam = searchParams.get("price");
      const usernameParam = searchParams.get("username");
      const passwordParam = searchParams.get("password");

      const checkoutData: any = {
        serviceType:
          typeParam === "robux5"
            ? "robux"
            : typeParam === "robux-instant"
            ? "robux"
            : typeParam,
        serviceId: invoiceId,
        serviceName: packageParam,
        serviceImage: "",
        quantity: 1,
        unitPrice: parseInt(priceParam || "0"),
        robloxUsername: usernameParam || "",
        robloxPassword: passwordParam || "",
      };

      // Add specific data based on type
      if (typeParam === "joki") {
        checkoutData.jokiDetails = {
          additionalInfo: searchParams.get("additionalInfo") || "",
        };
      }

      sessionStorage.setItem("checkoutData", JSON.stringify(checkoutData));
      router.push("/checkout");
      return;
    }

    // Continue with existing invoice logic for stored invoices
    // Try localStorage first (for created invoices)
    if (storedInvoice) {
      const invoice = JSON.parse(storedInvoice);
      setOrderData({
        type: invoice.type,
        package:
          invoice.orderDetails[0]?.name || invoice.orderDetails[0]?.description,
        price: invoice.totalAmount,
        quantity: invoice.orderDetails[0]?.quantity || 1,
        game: invoice.orderDetails[0]?.name,
        description: invoice.orderDetails[0]?.description,
      });
      if (invoice.customerInfo) {
        setCustomerInfo({
          name: invoice.customerInfo.name,
          email: invoice.customerInfo.email,
          phone: invoice.customerInfo.phone,
          whatsapp: invoice.customerInfo.phone,
          robloxUsername: invoice.gameInfo?.username || "",
          robloxPassword: invoice.gameInfo?.password || "",
        });
      }
      setPaymentMethod(invoice.paymentMethod?.id || "");
      return;
    }

    // Get from URL params (for existing invoices that weren't redirected)
    const urlType = searchParams.get("type");
    const urlPackage = searchParams.get("package");
    const urlPrice = searchParams.get("price");
    const quantityParam = searchParams.get("quantity");
    const gameParam = searchParams.get("game");
    const amountParam = searchParams.get("amount");
    const serviceParam = searchParams.get("service");
    const urlUsername = searchParams.get("username");
    const urlPassword = searchParams.get("password");
    const additionalInfoParam = searchParams.get("additionalInfo");

    if (urlType && urlPackage && urlPrice) {
      setOrderData({
        type: urlType as OrderData["type"],
        package: urlPackage,
        price: parseInt(urlPrice),
        quantity: quantityParam ? parseInt(quantityParam) : 1,
        game: gameParam || undefined,
        robuxAmount: amountParam ? parseInt(amountParam) : undefined,
        serviceType: serviceParam || undefined,
      });

      // Set customer info from URL params
      if (urlUsername) {
        setCustomerInfo((prev) => ({
          ...prev,
          robloxUsername: urlUsername,
          robloxPassword: urlPassword || "",
        }));
      }
    }
  }, [searchParams, params.id]);

  const paymentMethods = [
    { id: "dana", name: "DANA", icon: "/dana.png", fee: 1000 },
    { id: "gopay", name: "GoPay", icon: "/gopay.png", fee: 1000 },
    { id: "shopee", name: "ShopeePay", icon: "/shopepay.png", fee: 1000 },
    { id: "ewallet", name: "E-Wallet", icon: "/ewalet.png", fee: 1000 },
    { id: "bca", name: "BCA Virtual Account", icon: "/virtual.png", fee: 2000 },
    { id: "bni", name: "BNI Virtual Account", icon: "/virtual.png", fee: 2000 },
    { id: "bri", name: "BRI Virtual Account", icon: "/virtual.png", fee: 2000 },
    { id: "alfamart", name: "Alfamart", icon: "/minimarket.png", fee: 2500 },
  ];

  const selectedPaymentMethod = paymentMethods.find(
    (method) => method.id === paymentMethod
  );
  const adminFee = selectedPaymentMethod?.fee || 0;
  const totalPrice = orderData ? orderData.price + adminFee : 0;

  const getOrderTitle = () => {
    if (!orderData) return "Loading...";

    switch (orderData.type) {
      case "gamepass":
        return `🎮 Invoice Gamepass`;
      case "robux5":
        return `💎 Invoice Robux 5 Hari`;
      case "robux-instant":
        return `⚡ Invoice Robux Instant`;
      case "joki":
        return `👤 Invoice Jasa Joki`;
      default:
        return `🧾 Invoice Pemesanan`;
    }
  };

  const getOrderDescription = () => {
    if (!orderData) return "";

    switch (orderData.type) {
      case "gamepass":
        return "Lengkapi data dan pilih metode pembayaran untuk mendapatkan gamepass";
      case "robux5":
        return "Lengkapi data dan pilih metode pembayaran untuk mendapatkan Robux dalam 5 hari";
      case "robux-instant":
        return "Lengkapi data dan pilih metode pembayaran untuk mendapatkan Robux instant";
      case "joki":
        return "Lengkapi data dan pilih metode pembayaran untuk layanan joki";
      default:
        return "Lengkapi data dan pilih metode pembayaran untuk menyelesaikan pesanan";
    }
  };

  const getRequiredFields = () => {
    if (!orderData) return [];

    const baseFields = ["name", "email"];

    switch (orderData.type) {
      case "gamepass":
      case "robux5":
      case "robux-instant":
        return [...baseFields, "robloxUsername"];
      case "joki":
        return [...baseFields, "robloxUsername", "robloxDisplayName"];
      default:
        return baseFields;
    }
  };

  const validateForm = () => {
    const required = getRequiredFields();
    return required.every(
      (field) => customerInfo[field as keyof typeof customerInfo]
    );
  };

  const handleCreateOrder = () => {
    if (!paymentMethod || !validateForm()) {
      toast.error("Mohon lengkapi semua data yang diperlukan");
      return;
    }

    setIsLoading(true);

    // Simulate order creation
    setTimeout(() => {
      setIsLoading(false);
      router.push(
        `/payment-success?type=${orderData?.type}&invoice=${invoiceNumber}`
      );
    }, 2000);
  };

  if (!orderData) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9C01] mx-auto mb-4"></div>
          <p className="text-white">Loading order data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen">
        <div className="px-4 sm:px-6 xl:px-0 max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8 pt-6 sm:pt-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
              {getOrderTitle()}
            </h1>
            <p className="text-sm sm:text-base">{getOrderDescription()}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-1 order-last">
              <div className="bg-[#CE3535]/50 rounded-xl p-6 border-2 border-[#CE3535] sticky top-28 shadow-xl">
                <h3 className="text-lg font-bold text-black mb-4">
                  📋 Ringkasan Pesanan
                </h3>

                <div className="space-y-4">
                  <div className="border-b border-[#CE3535] pb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-black">Invoice</span>
                      <span className="text-black font-mono font-bold">
                        {invoiceNumber}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Tanggal</span>
                      <span className="text-black font-semibold">
                        {orderDate}
                      </span>
                    </div>
                  </div>

                  <div className="border-b border-[#CE3535] pb-4">
                    <h4 className="text-black font-semibold mb-2">
                      {orderData.game || orderData.package}
                    </h4>
                    <p className="text-black text-sm mb-2 opacity-80">
                      {orderData.description || orderData.package}
                    </p>
                    {orderData.robuxAmount && (
                      <p className="text-black text-sm mb-2 font-bold">
                        💎 {orderData.robuxAmount.toLocaleString()} Robux
                      </p>
                    )}
                    {customerInfo.robloxUsername && (
                      <p className="text-black text-sm mb-2 font-bold">
                        👤 Username: {customerInfo.robloxUsername}
                      </p>
                    )}
                    {customerInfo.robloxPassword &&
                      orderData.type === "joki" && (
                        <p className="text-[#FF9C01] text-sm mb-2 font-bold">
                          🔒 Password:{" "}
                          {"*".repeat(customerInfo.robloxPassword.length)}
                        </p>
                      )}
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Quantity</span>
                      <span className="text-black font-semibold">
                        {orderData.quantity}x
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-black">Subtotal</span>
                      <span className="text-black font-semibold">
                        {formatRupiah(orderData.price)}
                      </span>
                    </div>
                    {adminFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-black">Biaya Admin</span>
                        <span className="text-black font-semibold">
                          {formatRupiah(adminFee)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t-2 border-[#CE3535] pt-2">
                      <span className="text-black">Total</span>
                      <span className="text-black text-xl">
                        {formatRupiah(totalPrice)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCreateOrder}
                  disabled={isLoading || !paymentMethod || !validateForm()}
                  className={`w-full py-4 rounded-lg font-semibold transition-all transform hover:scale-[1.01] mt-5 shadow-lg ${
                    isLoading || !paymentMethod || !validateForm()
                      ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                      : "bg-[#CE3535] text-white hover:bg-[#b12a2a] active:scale-95"
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Memproses...
                    </div>
                  ) : (
                    "Buat Pesanan & Bayar 🛒"
                  )}
                </button>
              </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <div className="bg-[#CE3535]/50 rounded-xl p-4 sm:p-6 border-2 border-[#CE3535] shadow-xl">
                <h3 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4">
                  👤 Informasi Pelanggan
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          name: e.target.value,
                        })
                      }
                      className="w-full bg-[#f8b8b8] border-2 border-[#CE3535] rounded-lg px-4 py-3 text-black placeholder-[#935656] placeholder-opacity-60 focus:border-[#FF9C01] focus:outline-none focus:bg-white transition-all"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          email: e.target.value,
                        })
                      }
                      className="w-full bg-[#f8b8b8] border-2 border-[#CE3535] rounded-lg px-4 py-3 text-black placeholder-[#935656] placeholder-opacity-60 focus:border-[#FF9C01] focus:outline-none focus:bg-white transition-all"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      No. WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.whatsapp}
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          whatsapp: e.target.value,
                        })
                      }
                      className="w-full bg-[#f8b8b8] border-2 border-[#CE3535] rounded-lg px-4 py-3 text-black placeholder-[#935656] placeholder-opacity-60 focus:border-[#FF9C01] focus:outline-none focus:bg-white transition-all"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>

                  {/* Roblox fields for gamepass, robux, and joki */}
                  {(orderData.type === "gamepass" ||
                    orderData.type === "robux5" ||
                    orderData.type === "robux-instant" ||
                    orderData.type === "joki") && (
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Username Roblox *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.robloxUsername}
                        disabled
                        className="w-full bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-600 cursor-not-allowed"
                        placeholder="RobloxUsername123"
                      />
                    </div>
                  )}

                  {/* Password field for joki specifically */}
                  {orderData.type === "joki" && (
                    <div>
                      <label className="block text-sm font-semibold text-black mb-2">
                        Password Roblox *
                      </label>
                      <input
                        type="password"
                        value={customerInfo.robloxPassword}
                        disabled
                        className="w-full bg-gray-100 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-600 cursor-not-allowed"
                        placeholder="Password Roblox"
                      />
                    </div>
                  )}
                </div>

                {/* Info section based on order type */}
                <div className="mt-4 p-4 bg-[#FF9C01]/20 rounded-lg border border-[#FF9C01]/30">
                  <div className="flex items-start gap-2">
                    <span className="text-[#FF9C01] text-sm">ℹ️</span>
                    <div className="text-black text-xs">
                      <strong>Penting:</strong>
                      {orderData.type === "gamepass" &&
                        " Pastikan username Roblox yang dimasukkan benar dan account tidak di-private. Game pass akan dikirim langsung ke account Roblox Anda."}
                      {orderData.type === "robux5" &&
                        " Robux akan dikirim dalam 5 hari kerja setelah pembayaran dikonfirmasi. Pastikan username Roblox benar."}
                      {orderData.type === "robux-instant" &&
                        " Robux akan dikirim dalam 5-15 menit setelah pembayaran dikonfirmasi. Pastikan username Roblox benar."}
                      {orderData.type === "joki" &&
                        " Pastikan username dan display name Roblox benar. Layanan joki akan dimulai setelah pembayaran dikonfirmasi."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-[#CE3535]/50 rounded-xl p-4 sm:p-6 border-2 border-[#CE3535] shadow-xl">
                <h3 className="text-base sm:text-lg font-bold text-black mb-3 sm:mb-4">
                  💳 Metode Pembayaran
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all transform hover:scale-[1.02] ${
                        paymentMethod === method.id
                          ? "border-[#FF9C01] bg-[#FF9C01]/10 shadow-lg"
                          : "border-[#CE3535] hover:border-[#FF9C01] bg-[#f8b8b8]/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="hidden"
                      />
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-[#CE3535]">
                        <Image
                          src={method.icon}
                          alt={method.name}
                          width={24}
                          height={24}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-black font-semibold text-sm">
                          {method.name}
                        </div>
                        <div className="text-black text-xs opacity-70">
                          +{formatRupiah(method.fee)} biaya admin
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 ${
                          paymentMethod === method.id
                            ? "border-[#FF9C01] bg-[#FF9C01]"
                            : "border-[#CE3535]"
                        }`}
                      >
                        {paymentMethod === method.id && (
                          <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}

              <div className="mt-4 p-4 bg-[#FF9C01]/20 rounded-lg border border-[#FF9C01]/30">
                <div className="flex items-start gap-2">
                  <span className="text-[#FF9C01] text-sm">ℹ️</span>
                  <div className="text-black text-xs">
                    <div className="font-semibold mb-1">Informasi Penting:</div>
                    <ul className="space-y-1">
                      <li>• Pembayaran harus selesai dalam 24 jam</li>
                      <li>
                        •{" "}
                        {orderData.type === "gamepass" &&
                          "Game pass akan aktif 5-15 menit setelah pembayaran dikonfirmasi"}
                        {orderData.type === "robux5" &&
                          "Robux akan dikirim dalam 5 hari kerja setelah pembayaran"}
                        {orderData.type === "robux-instant" &&
                          "Robux akan dikirim dalam 5-15 menit setelah pembayaran"}
                        {orderData.type === "joki" &&
                          "Layanan joki akan dimulai setelah pembayaran dikonfirmasi"}
                      </li>
                      <li>• Jika ada kendala, hubungi customer service kami</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cek Transaksi Link */}
              <div className="mt-4 text-center">
                <p className="text-black text-sm mb-2">
                  Sudah pernah pesan sebelumnya?
                </p>
                <Link
                  href="/cek-transaksi"
                  className="text-[#CE3535] hover:text-orange-300 text-sm font-semibold underline transition-colors"
                >
                  🔍 Cek Status Transaksi Lama
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function UniversalInvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#935656] via-[#b76b6b] to-[#935656]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF9C01] mx-auto mb-4"></div>
            <div className="text-white">Loading...</div>
          </div>
        </div>
      }
    >
      <UniversalInvoiceContent />
    </Suspense>
  );
}
