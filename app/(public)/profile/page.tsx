"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Crown,
  Package,
  Wallet,
  Edit,
  Save,
  X,
  ShoppingCart,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";

interface UserProfile {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  avatar?: string;
  memberSince: string;
  totalTransactions: number;
  spendedMoney: number;
  isVerified: boolean;
  resellerTier?: number;
  resellerExpiry?: Date | string;
  resellerPackageId?: string;
  diskon?: number; // Discount percentage from reseller package
}

interface ProfileStats {
  pendingOrders: number;
  completedOrders: number;
  totalOrders: number;
  cancelledOrders: number;
  favoriteService: string;
  monthlySpending: Array<{ month: string; amount: number }>;
  serviceBreakdown: Record<string, number>;
  recentActivity: Array<{
    id: string;
    action: string;
    date: string;
    amount: number;
    originalAmount?: number;
    discount?: number;
    status?: string;
    paymentStatus?: string;
    type?: "robux" | "gamepass" | "joki";
    description?: string;
  }>;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    countryCode: "",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        router.push("/login");
        return;
      }

      // Fetch user profile data from API using model
      fetchUserProfile();
    }
  }, [user, authLoading, router]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);

      // Fetch profile data from API with actual User model
      const profileResponse = await fetch(
        `/api/user/profile?email=${encodeURIComponent(user?.email || "")}`
      );
      const profileResult = await profileResponse.json();

      if (profileResult.success) {
        setProfileData(profileResult.data);
        setEditForm({
          firstName: profileResult.data.firstName || "",
          lastName: profileResult.data.lastName || "",
          phone: profileResult.data.phone || "",
          countryCode: profileResult.data.countryCode || "+62",
        });
      } else {
        // Fallback to AuthContext data if API fails
        if (user) {
          setProfileData({
            firstName: user.firstName,
            lastName: user.lastName || "",
            email: user.email,
            phone: user.phone,
            countryCode: user.countryCode,
            avatar: "/char1.png",
            memberSince: "2024-01-15T00:00:00.000Z",
            totalTransactions: 0,
            spendedMoney: user.spendedMoney,
            isVerified: user.isVerified,
            resellerTier: user.resellerTier,
            resellerExpiry: user.resellerExpiry,
            resellerPackageId: user.resellerPackageId,
            diskon: user.diskon || 0,
          });

          setEditForm({
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            phone: user.phone || "",
            countryCode: user.countryCode || "+62",
          });
        }

        console.error("Failed to fetch profile:", profileResult.error);
      }

      fetchUserStats();
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Get userId from profileData or user context
      const userId = profileData?.id || user?.id;

      if (!userId) {
        console.warn("No user ID available for stats");
        return;
      }

      const statsResponse = await fetch(
        `/api/user/stats?userId=${encodeURIComponent(userId)}`
      );
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data);

          // Update totalTransactions in profile data
          if (profileData) {
            setProfileData({
              ...profileData,
              totalTransactions: statsData.data.totalOrders || 0,
            });
          }
        } else {
          console.error("Failed to fetch stats:", statsData.error);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editForm,
          email: user?.email, // Send email to identify user
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Profil berhasil diperbarui");
        setIsEditing(false);

        // Update local profile data immediately with the updated data from API response
        if (profileData && result.data) {
          setProfileData((prev) =>
            prev
              ? {
                  ...prev,
                  firstName: result.data.firstName || editForm.firstName,
                  lastName: result.data.lastName || editForm.lastName,
                  phone: result.data.phone || editForm.phone,
                  countryCode: result.data.countryCode || editForm.countryCode,
                }
              : null
          );
        } else {
          // Fallback to form data if API doesn't return updated data
          if (profileData) {
            setProfileData((prev) =>
              prev
                ? {
                    ...prev,
                    firstName: editForm.firstName,
                    lastName: editForm.lastName,
                    phone: editForm.phone,
                    countryCode: editForm.countryCode,
                  }
                : null
            );
          }
        }

        // Don't fetch again immediately to avoid overwriting local changes
        // fetchUserProfile can be called after a short delay if needed
      } else {
        toast.error(result.error || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Gagal memperbarui profil");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary-100/50 border-t-primary-100 mx-auto mb-6"></div>
          <p className="text-white/70 text-lg">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden">
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-red-600/30 to-red-500/20 rounded-2xl blur-lg opacity-50"></div>
          <div className="relative">
            <p className="text-white/70 text-lg">Gagal memuat data profil</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen  py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary-100 via-white to-primary-200 bg-clip-text text-transparent mb-2">
            Profil Saya
          </h1>
          <p className="text-white/70 text-base sm:text-lg px-4 sm:px-0">
            Kelola informasi profil dan lihat statistik akun Anda
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 relative overflow-hidden z-0 mb-6 sm:mb-8">
          {/* Glow effect */}
          <div className="absolute z-[-1] -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>
          <div className="relative">
            <div className="text-center mb-6">
              <div className="mb-4 flex justify-center">
                <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2
                className="text-xl font-bold text-white mb-2 transition-all duration-300"
                key={`${profileData.firstName}-${profileData.lastName}`}
              >
                {profileData.firstName} {profileData.lastName}
              </h2>
              <p className="text-white/70 mb-1">{profileData.email}</p>
              <p className="text-white/50 text-sm flex items-center justify-center">
                <Calendar className="w-4 h-4 mr-2" />
                Member sejak {formatDate(profileData.memberSince)}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-white/70 flex items-center">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Total Transaksi
              </span>
              <span className="font-semibold text-white">
                {stats?.totalOrders}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-white/70 flex items-center">
                <Wallet className="w-4 h-4 mr-2" />
                Total Pengeluaran
              </span>
              <span className="font-semibold text-primary-100">
                Rp {profileData.spendedMoney.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-white/10">
              <span className="text-white/70 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Diskon
              </span>
              <span className="font-semibold text-green-400">
                {profileData.diskon || 0}%
              </span>
            </div>
            {profileData.resellerTier && profileData.resellerTier > 0 && (
              <>
                <div className="flex justify-between items-center py-3 border-b border-white/10">
                  <span className="text-white/70 flex items-center">
                    <Crown className="w-4 h-4 mr-2" />
                    Reseller Status
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-primary-100/20 to-primary-200/20 border border-primary-100/30 text-primary-100 text-xs font-medium rounded-full">
                    Tier {profileData.resellerTier}
                  </span>
                </div>
                {profileData.resellerExpiry && (
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-white/70 flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      Berlaku Hingga
                    </span>
                    <span
                      className={`font-semibold ${
                        new Date(profileData.resellerExpiry) > new Date()
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {new Date(profileData.resellerExpiry).toLocaleDateString(
                        "id-ID",
                        {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                      {new Date(profileData.resellerExpiry) <= new Date() &&
                        " (Expired)"}
                    </span>
                  </div>
                )}
              </>
            )}
            {(!profileData.resellerTier || profileData.resellerTier === 0) && (
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-white/70 flex items-center">
                  <Crown className="w-4 h-4 mr-2" />
                  Reseller Status
                </span>
                <Link
                  href="/reseller"
                  className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-primary-100 to-primary-200 text-white text-xs font-medium rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300"
                >
                  Upgrade ke Reseller
                </Link>
              </div>
            )}
            {profileData.phone && (
              <div className="flex justify-between items-center py-3">
                <span className="text-white/70 flex items-center">
                  <Phone className="w-4 h-4 mr-2" />
                  Telefon
                </span>
                <span
                  className="font-semibold text-white transition-all duration-300"
                  key={`${profileData.countryCode}-${profileData.phone}`}
                >
                  {profileData.countryCode} {profileData.phone}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-primary-100 to-primary-200 text-white rounded-xl hover:from-primary-100/80 hover:to-primary-200/80 transition-all duration-300 font-medium shadow-lg shadow-primary-100/25 flex items-center justify-center"
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Batal Edit
              </>
            ) : (
              <>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profil
              </>
            )}
          </button>
        </div>

        {/* Main Content */}
        <div className=" space-y-8 mt-8">
          {/* Edit Form */}
          {isEditing && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 relative overflow-hidden">
              {/* Glow effect */}
              <div className="relative">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
                  <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-100" />
                  Edit Profil
                </h3>

                <form
                  onSubmit={handleUpdateProfile}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80 mb-2 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Nama Depan
                      </label>
                      <input
                        type="text"
                        value={editForm.firstName}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            firstName: e.target.value,
                          })
                        }
                        disabled={submitting}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 transition-all duration-300 text-sm sm:text-base ${
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-white/80 mb-2 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Nama Belakang{" "}
                        <span className="text-white/40 text-xs font-normal ml-1">
                          (Opsional)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lastName: e.target.value })
                        }
                        disabled={submitting}
                        placeholder="Nama Belakang (Opsional)"
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 transition-all duration-300 text-sm sm:text-base ${
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 mb-2 flex items-center">
                      <Phone className="w-4 h-4 mr-2" />
                      Nomor Telefon
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <select
                        value={editForm.countryCode}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            countryCode: e.target.value,
                          })
                        }
                        disabled={submitting}
                        className={`w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-primary-100 focus:border-primary-100 transition-all duration-300 text-sm sm:text-base ${
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <option value="+62" className="bg-[#22102A] text-white">
                          +62 (Indonesia)
                        </option>
                        <option value="+1" className="bg-[#22102A] text-white">
                          +1 (United States)
                        </option>
                        <option value="+44" className="bg-[#22102A] text-white">
                          +44 (United Kingdom)
                        </option>
                        <option value="+91" className="bg-[#22102A] text-white">
                          +91 (India)
                        </option>
                        <option value="+86" className="bg-[#22102A] text-white">
                          +86 (China)
                        </option>
                      </select>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        disabled={submitting}
                        className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-primary-100 focus:border-primary-100 transition-all duration-300 text-sm sm:text-base ${
                          submitting ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        placeholder="81234567890"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`flex-1 px-4 sm:px-6 py-3 text-white rounded-lg transition-all duration-300 font-medium shadow-lg flex items-center justify-center text-sm sm:text-base ${
                        submitting
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-primary-100 to-primary-200 hover:from-primary-100/80 hover:to-primary-200/80 shadow-primary-100/25"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Simpan Perubahan
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={submitting}
                      className={`flex-1 px-4 sm:px-6 py-3 rounded-lg transition-all duration-300 font-medium flex items-center justify-center text-sm sm:text-base ${
                        submitting
                          ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                          : "bg-white/10 text-white/80 hover:bg-white/20"
                      }`}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-blue-600/30 to-blue-500/20 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative">
                  <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats.totalOrders}
                  </div>
                  <div className="text-sm text-white/70">Total Pesanan</div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-600/30 to-amber-500/20 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative">
                  <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats.pendingOrders}
                  </div>
                  <div className="text-sm text-white/70">Pesanan Pending</div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 via-green-600/30 to-green-500/20 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative">
                  <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {stats.completedOrders}
                  </div>
                  <div className="text-sm text-white/70">Pesanan Selesai</div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 text-center relative overflow-hidden">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-purple-600/30 to-purple-500/20 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative">
                  <div className="mb-4 flex justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="text-lg font-bold text-white mb-1 capitalize">
                    {stats.favoriteService}
                  </div>
                  <div className="text-sm text-white/70">Layanan Favorit</div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>
            <div className="relative">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <Award className="w-5 h-5 mr-2 text-primary-100" />
                Aksi Cepat
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Link
                  href="/riwayat"
                  className="flex items-center gap-4 p-6 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      Riwayat Transaksi
                    </div>
                    <div className="text-sm text-white/70">
                      Lihat semua pesanan Anda
                    </div>
                  </div>
                </Link>

                <Link
                  href="/track-order"
                  className="flex items-center gap-4 p-6 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      Lacak Pesanan
                    </div>
                    <div className="text-sm text-white/70">
                      Cek status pesanan terbaru
                    </div>
                  </div>
                </Link>

                <Link
                  href="/rbx5"
                  className="flex items-center gap-4 p-6 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">Beli Robux</div>
                    <div className="text-sm text-white/70">
                      Dapatkan Robux dengan cepat
                    </div>
                  </div>
                </Link>

                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-6 bg-white/5 border border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <Link href={'/chat'}>
                    <div className="font-semibold text-white">Hubungi CS</div>
                    <div className="text-sm text-white/70">
                      Butuh bantuan? Chat kami
                    </div>
                  </Link>
                </a>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {stats && stats.recentActivity && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 relative overflow-hidden mb-6 sm:mb-8">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-100" />
                  Aktivitas Terbaru
                </h3>

                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
                    >
                      {/* Mobile: Stack layout, Desktop: Flex layout */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Icon and main info */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm sm:text-base truncate">
                              {activity.action}
                            </div>
                            <div className="text-xs sm:text-sm text-white/70">
                              {formatDate(activity.date)}
                            </div>
                          </div>
                        </div>

                        {/* Price info - aligned right on desktop, below on mobile */}
                        <div className="text-left sm:text-right flex-shrink-0">
                          {activity.discount && activity.originalAmount ? (
                            <div className="space-y-1">
                              <div className="text-xs text-white/50 line-through">
                                Rp{" "}
                                {activity.originalAmount.toLocaleString(
                                  "id-ID"
                                )}
                              </div>
                              <div className="font-semibold text-primary-100 text-sm sm:text-base">
                                Rp {activity.amount.toLocaleString("id-ID")}
                              </div>
                              <div className="text-xs text-green-400 font-medium">
                                Hemat {activity.discount}%
                              </div>
                            </div>
                          ) : (
                            <div className="font-semibold text-primary-100 text-sm sm:text-base">
                              Rp {activity.amount.toLocaleString("id-ID")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/riwayat"
                  className="block text-center mt-6 text-primary-100 hover:text-primary-200 font-medium transition-colors duration-300"
                >
                  Lihat Semua Aktivitas →
                </Link>
              </div>
            </div>
          )}

          {/* Service Breakdown */}
          {stats && stats.serviceBreakdown && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-100/20 via-primary-200/30 to-primary-100/20 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-100" />
                  Rincian Layanan
                </h3>

                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-white">Robux</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-full sm:w-24 md:w-32 bg-white/20 rounded-full h-2 flex-1 sm:flex-initial">
                        <div
                          className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (stats.serviceBreakdown.robux /
                                stats.totalOrders) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-white min-w-[2rem] text-right">
                        {stats.serviceBreakdown.robux}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-white">Gamepass</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-full sm:w-24 md:w-32 bg-white/20 rounded-full h-2 flex-1 sm:flex-initial">
                        <div
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (stats.serviceBreakdown.gamepass /
                                stats.totalOrders) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-white min-w-[2rem] text-right">
                        {stats.serviceBreakdown.gamepass}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-white">Joki</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-full sm:w-24 md:w-32 bg-white/20 rounded-full h-2 flex-1 sm:flex-initial">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (stats.serviceBreakdown.joki /
                                stats.totalOrders) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-white min-w-[2rem] text-right">
                        {stats.serviceBreakdown.joki}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    // </div>
  );
}
