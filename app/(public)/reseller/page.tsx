"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import {
  Crown,
  Check,
  Sparkles,
  Zap,
  Star,
  TrendingUp,
  Shield,
  Award,
  Gem,
} from "lucide-react";

interface ResellerPackage {
  _id: string;
  name: string;
  tier: number;
  price: number;
  duration: number;
  discount: number;
  features: string[];
  isActive: boolean;
}

const tierColors = {
  1: {
    bg: "from-emerald-900/60 via-emerald-800/40 to-emerald-700/50",
    border: "border-emerald-500/40",
    glow: "shadow-emerald-500/20",
    badge: "from-emerald-500 to-emerald-600",
    text: "text-emerald-400",
    icon: "text-emerald-400",
  },
  2: {
    bg: "from-slate-900/60 via-slate-800/40 to-slate-700/50",
    border: "border-slate-400/40",
    glow: "shadow-slate-400/20",
    badge: "from-slate-400 to-slate-500",
    text: "text-slate-300",
    icon: "text-slate-400",
  },
  3: {
    bg: "from-yellow-900/60 via-yellow-800/40 to-yellow-700/50",
    border: "border-yellow-500/40",
    glow: "shadow-yellow-500/20",
    badge: "from-yellow-500 to-yellow-600",
    text: "text-yellow-400",
    icon: "text-yellow-400",
  },
};

const tierIcons = {
  1: Award,
  2: Shield,
  3: Crown,
};

export default function ResellerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [packages, setPackages] = useState<ResellerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Silakan login terlebih dahulu untuk mengakses halaman ini");
      router.push("/login?redirect=/reseller");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchPackages();
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reseller-packages");
      const data = await response.json();

      if (data.success) {
        setPackages(data.data);
      } else {
        setError(data.error || "Gagal memuat paket reseller");
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      setError("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPackage = (pkg: ResellerPackage) => {
    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      router.push("/login?redirect=/reseller");
      return;
    }

    // Check if user is already an active reseller
    const isActiveReseller =
      user.resellerTier &&
      user.resellerExpiry &&
      new Date(user.resellerExpiry) > new Date();

    if (isActiveReseller) {
      toast.info("Anda sudah menjadi reseller aktif");
      return;
    }

    // Create checkout data for reseller package
    const checkoutData = {
      serviceType: "reseller",
      serviceId: pkg._id,
      serviceName: pkg.name,
      serviceImage: "", // No image for reseller packages
      serviceCategory: "reseller",
      quantity: 1,
      unitPrice: pkg.price,
      resellerDetails: {
        tier: pkg.tier,
        duration: pkg.duration,
        discount: pkg.discount,
        features: pkg.features,
      },
    };

    // Store in sessionStorage
    sessionStorage.setItem("checkoutData", JSON.stringify([checkoutData]));

    // Redirect to checkout
    router.push("/checkout");
  };

  // Show loading while checking authentication
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-primary-100/20 mx-auto mb-6"></div>
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 animate-spin rounded-full h-16 w-16 border-4 border-primary-100 border-t-transparent"></div>
          </div>
          <h3 className="text-xl font-bold text-primary-100">
            {authLoading ? "Memeriksa Autentikasi..." : "Memuat Paket Reseller"}
          </h3>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/80 mb-4">Mengalihkan ke halaman login...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchPackages}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-100/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-primary-200/8 rounded-full blur-2xl animate-bounce delay-1000"></div>
        <div className="absolute bottom-40 left-32 w-28 h-28 bg-primary-100/6 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-40 w-20 h-20 bg-primary-200/10 rounded-full blur-xl animate-bounce delay-1500"></div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/30 rounded-full mb-6">
            <Crown className="w-5 h-5 text-primary-100" />
            <span className="text-sm font-medium text-primary-100">
              Program Reseller
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-200">
            Jadilah Reseller RBXNET
          </h1>

          <p className="text-lg text-white/80 max-w-3xl mx-auto leading-relaxed mb-4">
            Dapatkan keuntungan lebih dengan menjadi reseller resmi RBXNET.
            Nikmati diskon eksklusif untuk semua produk dan tingkatkan bisnis
            Anda!
          </p>

          {user?.resellerTier &&
            user?.resellerExpiry &&
            new Date(user.resellerExpiry) > new Date() && (
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500/20 to-green-600/20 border-2 border-green-400/30 rounded-2xl">
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-bold">
                  Anda sudah menjadi Reseller Tier {user.resellerTier}
                </span>
              </div>
            )}
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {packages.map((pkg) => {
            const colors = tierColors[pkg.tier as keyof typeof tierColors];
            const IconComponent = tierIcons[pkg.tier as keyof typeof tierIcons];

            return (
              <div
                key={pkg._id}
                className={`group relative bg-gradient-to-br ${colors.bg} backdrop-blur-2xl border-2 ${colors.border} rounded-3xl p-8 shadow-2xl ${colors.glow} transition-all duration-500 hover:shadow-primary-100/30 hover:scale-[1.02] overflow-hidden`}
              >
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary-100/8 via-transparent to-primary-200/8 rounded-3xl"></div>
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-primary-100/20 to-primary-200/10 rounded-full blur-3xl animate-pulse group-hover:scale-110 transition-transform duration-700"></div>

                {/* Badge/Icon */}
                <div className="relative z-10 flex justify-center mb-6">
                  <div
                    className={`w-24 h-24 rounded-full bg-gradient-to-br ${colors.badge} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <IconComponent className="w-12 h-12 text-white" />
                  </div>
                </div>

                {/* Package Info */}
                <div className="relative z-10 text-center mb-6">
                  <h3
                    className={`text-2xl font-black mb-2 ${colors.text} uppercase`}
                  >
                    {pkg.name}
                  </h3>
                  <div className="text-white/80 text-sm mb-4">
                    {pkg.duration} BULAN
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-4xl font-black text-white">
                      RP{pkg.price.toLocaleString()}
                    </div>
                  </div>

                  {/* Discount Badge */}
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${colors.badge} rounded-full mb-6`}
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-white font-bold">
                      Diskon {pkg.discount}%
                    </span>
                  </div>
                </div>

                {/* Features */}
                <div className="relative z-10 space-y-3 mb-8">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`}
                      />
                      <span className="text-white/90 text-sm leading-relaxed">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => handleBuyPackage(pkg)}
                  disabled={
                    !!(
                      user?.resellerTier &&
                      user?.resellerExpiry &&
                      new Date(user.resellerExpiry) > new Date()
                    )
                  }
                  className={`relative z-10 w-full py-4 rounded-2xl font-black text-lg transition-all duration-300 ${
                    user?.resellerTier &&
                    user?.resellerExpiry &&
                    new Date(user.resellerExpiry) > new Date()
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : `bg-gradient-to-r ${colors.badge} text-white hover:shadow-lg hover:scale-105`
                  }`}
                >
                  {user?.resellerTier &&
                  user?.resellerExpiry &&
                  new Date(user.resellerExpiry) > new Date()
                    ? "Sudah Aktif"
                    : "BELI PAKET"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-primary-700/50 backdrop-blur-2xl border-2 border-primary-100/40 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-3xl font-black text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-primary-100 to-primary-200">
            Keuntungan Menjadi Reseller
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: TrendingUp,
                title: "Diskon Eksklusif",
                description:
                  "Dapatkan diskon untuk semua produk sesuai tier Anda",
              },
              {
                icon: Zap,
                title: "Proses Cepat",
                description: "Sistem otomatis dan transaksi langsung diproses",
              },
              {
                icon: Star,
                title: "Prioritas Support",
                description: "Dukungan khusus untuk reseller via WhatsApp",
              },
              {
                icon: Gem,
                title: "Potensi Untung",
                description: "Margin keuntungan tinggi dari setiap penjualan",
              },
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-primary-800/40 to-primary-700/30 border border-primary-100/20 rounded-2xl p-6 hover:border-primary-100/40 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-primary-100 to-primary-200 rounded-xl flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {benefit.title}
                </h3>
                <p className="text-white/70 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
