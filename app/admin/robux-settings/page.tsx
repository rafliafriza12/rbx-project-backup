"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Coins,
  Save,
  RefreshCw,
  ArrowLeft,
  DollarSign,
  History,
  User,
} from "lucide-react";
import Link from "next/link";

interface RobuxSetting {
  _id: string;
  pricePerRobux: number;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function RobuxSettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [setting, setSetting] = useState<RobuxSetting | null>(null);
  const [pricePerRobux, setPricePerRobux] = useState<number>(100);

  useEffect(() => {
    if (user) {
      fetchSetting();
    }
  }, [user]);

  const fetchSetting = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/robux-setting");
      const result = await response.json();

      if (result.success) {
        setSetting(result.data);
        setPricePerRobux(result.data.pricePerRobux);
      } else {
        toast.error(result.error || "Gagal mengambil setting");
      }
    } catch (error) {
      console.error("Error fetching setting:", error);
      toast.error("Gagal mengambil setting");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (pricePerRobux <= 0) {
      toast.error("Harga per Robux harus lebih dari 0");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/robux-setting", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pricePerRobux,
          updatedBy: user?.email || "admin",
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Setting berhasil disimpan!");
        if (result.warning) {
          toast.warning(result.warning);
        }
        fetchSetting();
      } else {
        toast.error(result.error || "Gagal menyimpan setting");
      }
    } catch (error) {
      console.error("Error saving setting:", error);
      toast.error("Gagal menyimpan setting");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/gamepass"
            className="p-2 bg-[#1e293b] rounded-lg hover:bg-[#334155] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Coins className="w-7 h-7 text-yellow-500" />
              Pengaturan Harga Robux
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Atur harga per Robux untuk kalkulasi harga gamepass otomatis
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
          {/* Price Input Section */}
          <div className="p-6 border-b border-[#334155]">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Harga per 1 Robux (IDR)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DollarSign className="w-5 h-5 text-gray-500" />
              </div>
              <input
                type="number"
                value={pricePerRobux}
                onChange={(e) => setPricePerRobux(Number(e.target.value))}
                className="w-full pl-12 pr-4 py-4 bg-[#0f172a] border border-[#334155] rounded-xl text-white text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="100"
                min="1"
              />
            </div>
            <p className="text-gray-500 text-sm mt-2">
              Contoh: Jika diatur {formatCurrency(pricePerRobux)}, maka gamepass
              dengan 100 Robux akan berharga{" "}
              {formatCurrency(pricePerRobux * 100)}
            </p>
          </div>

          {/* Preview Section */}
          <div className="p-6 bg-[#0f172a]/50 border-b border-[#334155]">
            <h3 className="text-sm font-medium text-gray-400 mb-4">
              Preview Kalkulasi Harga
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[100, 500, 1000, 5000].map((robux) => (
                <div
                  key={robux}
                  className="bg-[#1e293b] rounded-lg p-4 text-center"
                >
                  <div className="text-yellow-500 font-bold text-lg">
                    {robux} R$
                  </div>
                  <div className="text-white font-semibold mt-1">
                    {formatCurrency(pricePerRobux * robux)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Update Info */}
          {setting && (
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <History className="w-4 h-4" />
                Informasi Update Terakhir
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-[#0f172a] rounded-lg p-3">
                  <User className="w-5 h-5 text-pink-500" />
                  <div>
                    <div className="text-xs text-gray-500">Diupdate oleh</div>
                    <div className="text-white">{setting.updatedBy}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-[#0f172a] rounded-lg p-3">
                  <History className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-xs text-gray-500">Waktu update</div>
                    <div className="text-white">
                      {formatDate(setting.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="p-6 flex items-center justify-between">
            <button
              onClick={fetchSetting}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#334155] text-gray-300 rounded-lg hover:bg-[#475569] transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button
              onClick={handleSave}
              disabled={saving || pricePerRobux <= 0}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <h4 className="text-blue-400 font-medium mb-2">ℹ️ Informasi</h4>
          <ul className="text-blue-300/80 text-sm space-y-1">
            <li>
              • Mengubah harga Robux akan otomatis mengupdate semua harga
              gamepass
            </li>
            <li>• Harga gamepass dihitung: Jumlah Robux × Harga per Robux</li>
            <li>• Perubahan akan langsung berlaku untuk semua gamepass</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
