"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

interface StatsConfig {
  mode: "auto" | "manual";
  manualTotalStok: number;
  manualTotalTerjual: number;
  manualTotalCustomers: number;
  trackedTotalTerjual: number;
  trackedTotalCustomers: number;
  updatedBy: string;
  updatedAt: string;
}

interface LiveStats {
  totalStok: number;
  totalOrder: number;
  totalTerjual: number;
  hargaPer100Robux: number;
  mode: string;
}

export default function AdminRbx5StatsPage() {
  const [config, setConfig] = useState<StatsConfig | null>(null);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [manualTotalStok, setManualTotalStok] = useState(0);
  const [manualTotalTerjual, setManualTotalTerjual] = useState(0);
  const [manualTotalCustomers, setManualTotalCustomers] = useState(0);

  // Helper: handle number input tanpa leading zeros
  const handleNumberChange = (value: string, setter: (v: number) => void) => {
    // Hapus leading zeros, kosong = 0
    const cleaned = value.replace(/^0+(?=\d)/, "") || "0";
    setter(Math.max(0, Number(cleaned)));
  };

  const fetchConfig = useCallback(async () => {
    try {
      const [configRes, liveRes] = await Promise.all([
        fetch("/api/admin/rbx5-stats"),
        fetch("/api/rbx5-stats"),
      ]);

      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData.success) {
          setConfig(configData.data);
          setMode(configData.data.mode);
          setManualTotalStok(configData.data.manualTotalStok);
          setManualTotalTerjual(configData.data.manualTotalTerjual);
          setManualTotalCustomers(configData.data.manualTotalCustomers);
        }
      }

      if (liveRes.ok) {
        const liveData = await liveRes.json();
        if (liveData.success) {
          setLiveStats(liveData.data);
        }
      }
    } catch (error) {
      toast.error("Gagal memuat konfigurasi statistik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/rbx5-stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          manualTotalStok,
          manualTotalTerjual,
          manualTotalCustomers,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Konfigurasi statistik berhasil disimpan");
        setConfig(data.data);
        // Refresh live stats
        const liveRes = await fetch("/api/rbx5-stats");
        if (liveRes.ok) {
          const liveData = await liveRes.json();
          if (liveData.success) {
            setLiveStats(liveData.data);
          }
        }
      } else {
        toast.error(data.message || "Gagal menyimpan");
      }
    } catch (error) {
      toast.error("Gagal menyimpan konfigurasi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="admin-card p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Memuat konfigurasi statistik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Konfigurasi Statistik RBX5
        </h1>
        <p className="text-gray-400 mt-1">
          Atur mode tampilan statistik di homepage — otomatis dari database atau
          manual
        </p>
      </div>

      {/* Live Preview */}
      <div className="admin-card">
        <h2 className="text-lg font-semibold text-white mb-4">
          Preview Statistik (Yang Ditampilkan di Homepage)
        </h2>
        <div className="text-xs text-gray-500 mb-3">
          Mode aktif:{" "}
          <span
            className={`font-bold ${liveStats?.mode === "manual" ? "text-yellow-400" : "text-green-400"}`}
          >
            {liveStats?.mode === "manual" ? "🔧 MANUAL" : "⚡ AUTO"}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-blue-400">
              {liveStats?.totalStok?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-400 mt-1">R$ Tersedia</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-green-400">
              {liveStats?.totalTerjual?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-400 mt-1">R$ Terjual</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-purple-400">
              {liveStats?.totalOrder?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-400 mt-1">Customers</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="text-2xl font-bold text-yellow-400">
              Rp {liveStats?.hargaPer100Robux?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-400 mt-1">Per 100 R$</div>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="admin-card">
        <h2 className="text-lg font-semibold text-white mb-4">
          Mode Statistik
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Auto Mode */}
          <button
            onClick={() => setMode("auto")}
            className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
              mode === "auto"
                ? "border-green-500 bg-green-500/10"
                : "border-slate-400/50 bg-slate-800/30 hover:border-green-400 hover:bg-green-500/5"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold text-white">Otomatis</span>
              {mode === "auto" && (
                <span className="ml-auto text-green-400 text-sm font-medium">
                  ✓ Aktif
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Stok dihitung dari total robux akun stok aktif. Terjual &
              customers dihitung dari transaksi completed di database.
            </p>
          </button>

          {/* Manual Mode */}
          <button
            onClick={() => setMode("manual")}
            className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
              mode === "manual"
                ? "border-yellow-500 bg-yellow-500/10"
                : "border-slate-400/50 bg-slate-800/30 hover:border-yellow-400 hover:bg-yellow-500/5"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-bold text-white">Manual</span>
              {mode === "manual" && (
                <span className="ml-auto text-yellow-400 text-sm font-medium">
                  ✓ Aktif
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400">
              Admin set angka sendiri. Saat ada purchase, stok otomatis
              berkurang & terjual/customers otomatis bertambah.
            </p>
          </button>
        </div>

        {/* Manual Values - hanya tampil saat mode manual */}
        {mode === "manual" && (
          <div className="space-y-4 p-5 bg-slate-800/30 rounded-xl border border-yellow-500/20">
            <h3 className="text-md font-semibold text-yellow-400 mb-3">
              Nilai Manual
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Set nilai awal di bawah ini. Saat ada purchase, Total Stok
              otomatis berkurang dan Total Terjual & Customers otomatis
              bertambah.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Stok (R$)
                </label>
                <input
                  type="number"
                  value={manualTotalStok || ""}
                  onChange={(e) =>
                    handleNumberChange(e.target.value, setManualTotalStok)
                  }
                  onBlur={() => {
                    if (!manualTotalStok) setManualTotalStok(0);
                  }}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  min={0}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Jumlah R$ yang ditampilkan sebagai stok tersedia
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Terjual (R$)
                </label>
                <input
                  type="number"
                  value={manualTotalTerjual || ""}
                  onChange={(e) =>
                    handleNumberChange(e.target.value, setManualTotalTerjual)
                  }
                  onBlur={() => {
                    if (!manualTotalTerjual) setManualTotalTerjual(0);
                  }}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  min={0}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Jumlah R$ yang ditampilkan sebagai total terjual
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Total Customers
                </label>
                <input
                  type="number"
                  value={manualTotalCustomers || ""}
                  onChange={(e) =>
                    handleNumberChange(e.target.value, setManualTotalCustomers)
                  }
                  onBlur={() => {
                    if (!manualTotalCustomers) setManualTotalCustomers(0);
                  }}
                  placeholder="0"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  min={0}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Jumlah customer yang ditampilkan
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>

          {config && (
            <span className="text-xs text-gray-500">
              Terakhir diupdate:{" "}
              {new Date(config.updatedAt).toLocaleString("id-ID")}
              {config.updatedBy !== "system" && ` oleh ${config.updatedBy}`}
            </span>
          )}
        </div>
      </div>

      {/* Info Card */}
    </div>
  );
}
