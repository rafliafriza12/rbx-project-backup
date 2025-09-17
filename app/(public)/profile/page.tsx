"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

interface MemberRole {
  _id: string;
  member: string;
  diskon: number;
  description?: string;
  isActive: boolean;
}

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
  memberRole: MemberRole | null;
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
    status?: string;
    paymentStatus?: string;
  }>;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            countryCode: user.countryCode,
            avatar: "/char1.png",
            memberSince: "2024-01-15T00:00:00.000Z",
            totalTransactions: 0,
            spendedMoney: user.spendedMoney,
            isVerified: user.isVerified,
            memberRole: user.memberRole,
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

        // Update local profile data with response from API
        if (profileData) {
          setProfileData({
            ...profileData,
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            phone: result.data.phone,
            countryCode: result.data.countryCode,
          });
        }

        // Optionally refresh profile data from API
        fetchUserProfile();
      } else {
        toast.error(result.error || "Gagal memperbarui profil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Gagal memperbarui profil");
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-rose-600 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-gray-200">
          <p className="text-gray-600 text-lg">Gagal memuat data profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 ">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Profil Saya
          </h1>
          <p className="text-gray-600">
            Kelola informasi profil dan lihat statistik akun Anda
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <div className="text-center mb-6">
                {/* <div className="relative inline-block">
                  <Image
                    src={profileData.avatar || "/char1.png"}
                    alt="Profile Picture"
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-rose-200 shadow-lg"
                  />
                  {profileData.isVerified && (
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div> */}
                <h2 className="text-xl font-bold text-gray-900 mt-4">
                  {profileData.firstName} {profileData.lastName}
                </h2>
                <p className="text-gray-600">{profileData.email}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Member sejak {formatDate(profileData.memberSince)}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Transaksi</span>
                  <span className="font-semibold text-gray-900">
                    {profileData.totalTransactions}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Total Belanja</span>
                  <span className="font-semibold text-rose-600">
                    Rp {profileData.spendedMoney.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">Diskon</span>
                  <span className="font-semibold text-green-600">
                    {profileData.memberRole ? profileData.memberRole.diskon : 0}
                    %
                  </span>
                </div>
                {profileData.memberRole && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Member Role</span>
                    <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full capitalize">
                      {profileData.memberRole.member}
                    </span>
                  </div>
                )}
                {profileData.phone && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Telefon</span>
                    <span className="font-semibold text-gray-900">
                      {profileData.countryCode} {profileData.phone}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsEditing(!isEditing)}
                className="w-full mt-6 px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors font-medium"
              >
                {isEditing ? "Batal Edit" : "Edit Profil"}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Edit Form */}
            {isEditing && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Edit Profil
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Belakang
                      </label>
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, lastName: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nomor Telefon
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={editForm.countryCode}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            countryCode: e.target.value,
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                      >
                        <option value="+62">+62 (ID)</option>
                        <option value="+1">+1 (US)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+91">+91 (IN)</option>
                        <option value="+86">+86 (CN)</option>
                      </select>
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({ ...editForm, phone: e.target.value })
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                        placeholder="81234567890"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium"
                    >
                      Simpan Perubahan
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl mb-2">📋</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalOrders}
                  </div>
                  <div className="text-sm text-gray-600">Total Pesanan</div>
                </div>

                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl mb-2">⏳</div>
                  <div className="text-2xl font-bold text-amber-600">
                    {stats.pendingOrders}
                  </div>
                  <div className="text-sm text-gray-600">Pesanan Pending</div>
                </div>

                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.completedOrders}
                  </div>
                  <div className="text-sm text-gray-600">Pesanan Selesai</div>
                </div>

                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200 text-center">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-lg font-bold text-purple-600 capitalize">
                    {stats.favoriteService}
                  </div>
                  <div className="text-sm text-gray-600">Layanan Favorit</div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Aksi Cepat
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/riwayat"
                  className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  <div className="text-2xl">📊</div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Riwayat Transaksi
                    </div>
                    <div className="text-sm text-gray-600">
                      Lihat semua pesanan Anda
                    </div>
                  </div>
                </Link>

                <Link
                  href="/track-order"
                  className="flex items-center gap-3 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors border border-green-200"
                >
                  <div className="text-2xl">🔍</div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Lacak Pesanan
                    </div>
                    <div className="text-sm text-gray-600">
                      Cek status pesanan terbaru
                    </div>
                  </div>
                </Link>

                <Link
                  href="/rbx5"
                  className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors border border-purple-200"
                >
                  <div className="text-2xl">💎</div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Beli Robux
                    </div>
                    <div className="text-sm text-gray-600">
                      Dapatkan Robux dengan cepat
                    </div>
                  </div>
                </Link>

                <a
                  href="https://wa.me/6281234567890"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-rose-50 rounded-xl hover:bg-rose-100 transition-colors border border-rose-200"
                >
                  <div className="text-2xl">💬</div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Hubungi CS
                    </div>
                    <div className="text-sm text-gray-600">
                      Butuh bantuan? Chat kami
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* Recent Activity */}
            {stats && stats.recentActivity && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Aktivitas Terbaru
                </h3>

                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                          <span className="text-rose-600">💳</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {activity.action}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(activity.date)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-rose-600">
                          Rp {activity.amount.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/riwayat"
                  className="block text-center mt-4 text-rose-600 hover:text-rose-700 font-medium"
                >
                  Lihat Semua Aktivitas →
                </Link>
              </div>
            )}

            {/* Service Breakdown */}
            {stats && stats.serviceBreakdown && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Breakdown Layanan
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💎</span>
                      <span className="font-medium text-gray-900">Robux</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (stats.serviceBreakdown.robux /
                                stats.totalOrders) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8">
                        {stats.serviceBreakdown.robux}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎮</span>
                      <span className="font-medium text-gray-900">
                        Gamepass
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (stats.serviceBreakdown.gamepass /
                                stats.totalOrders) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8">
                        {stats.serviceBreakdown.gamepass}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🎯</span>
                      <span className="font-medium text-gray-900">Joki</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (stats.serviceBreakdown.joki /
                                stats.totalOrders) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8">
                        {stats.serviceBreakdown.joki}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
