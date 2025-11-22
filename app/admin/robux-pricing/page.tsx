"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Settings,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Gamepad2,
} from "lucide-react";

interface RobuxPricing {
  _id: string;
  pricePerHundred: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface RobuxSetting {
  _id: string;
  pricePerRobux: number;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function RobuxPricingPage() {
  const [pricing, setPricing] = useState<RobuxPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    pricePerHundred: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Gamepass Robux Setting States
  const [gamepassSetting, setGamepassSetting] = useState<RobuxSetting | null>(
    null
  );
  const [gamepassLoading, setGamepassLoading] = useState(true);
  const [gamepassPrice, setGamepassPrice] = useState("");
  const [isGamepassSaving, setIsGamepassSaving] = useState(false);

  const fetchPricing = async () => {
    try {
      const response = await fetch("/api/robux-pricing");
      const data = await response.json();

      if (data.success) {
        setPricing(data.data);
        if (data.data) {
          setFormData({
            pricePerHundred: data.data.pricePerHundred.toString(),
            description: data.data.description || "",
          });
        }
      } else {
        console.log("No pricing data found");
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
      toast.error("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Gamepass Robux Setting
  const fetchGamepassSetting = async () => {
    try {
      setGamepassLoading(true);
      const response = await fetch("/api/robux-setting");
      const data = await response.json();

      if (data.success) {
        setGamepassSetting(data.data);
        setGamepassPrice(data.data.pricePerRobux.toString());
      }
    } catch (error) {
      console.error("Error fetching gamepass setting:", error);
    } finally {
      setGamepassLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
    fetchGamepassSetting();
  }, []);

  const handleSubmit = async () => {
    if (!formData.pricePerHundred || Number(formData.pricePerHundred) <= 0) {
      toast.error("Harga per 100 Robux harus lebih dari 0");
      return;
    }

    setIsSaving(true);
    try {
      const method = pricing ? "PUT" : "POST";

      const response = await fetch("/api/robux-pricing", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pricePerHundred: Number(formData.pricePerHundred),
          description:
            formData.description || "Harga per 100 Robux untuk Robux Instant",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Setting Robux Instant berhasil diperbarui! Semua harga produk telah diupdate.",
          {
            autoClose: 5000,
          }
        );
        fetchPricing();
      } else {
        toast.error(data.message || "Gagal memperbarui setting");
      }
    } catch (error) {
      console.error("Error saving pricing:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Gamepass Setting Save
  const handleGamepassSave = async () => {
    if (!gamepassPrice || Number(gamepassPrice) <= 0) {
      toast.error("Harga per Robux harus lebih dari 0");
      return;
    }

    setIsGamepassSaving(true);
    try {
      const response = await fetch("/api/robux-setting", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pricePerRobux: Number(gamepassPrice),
          updatedBy: "admin",
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Setting Robux Gamepass berhasil diperbarui! Semua harga gamepass telah diupdate.",
          {
            autoClose: 5000,
          }
        );
        fetchGamepassSetting();
      } else {
        toast.error(data.error || "Gagal memperbarui setting");
      }
    } catch (error) {
      console.error("Error updating gamepass setting:", error);
      toast.error("Terjadi kesalahan saat memperbarui setting");
    } finally {
      setIsGamepassSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading || gamepassLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-[#0f172a] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#f1f5f9]">
          Pengaturan Harga Robux
        </h1>
        <p className="text-[#cbd5e1] mt-2">
          Kelola harga Robux untuk produk Robux instant dan gamepass. Setiap
          kategori memiliki pengaturan harga yang terpisah.
        </p>
      </div>

      {/* HORIZONTAL LAYOUT - 2 COLUMNS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT COLUMN - ROBUX 5 HARI */}
        <div className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-[#f1f5f9]">
                � Harga per 100 Robux (Robux Instant)
              </h2>
            </div>
            <div className="p-3 bg-blue-900/20 border-l-4 border-blue-400 rounded-md">
              <p className="text-blue-200 text-xs">
                <strong>Catatan:</strong> Mengubah harga akan otomatis
                memperbarui semua produk Robux Instant.
              </p>
            </div>
          </div>

          {/* Display Card & Edit Form - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Current Pricing Display */}
            <div className="bg-[#1e293b] rounded-lg shadow-md p-6 border border-[#334155]">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-[#f1f5f9] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  {pricing ? "Harga Saat Ini" : "Belum Ada Pengaturan"}
                </h3>
              </div>

              {pricing ? (
                <div className="space-y-4">
                  {/* Current Price Display */}
                  <div className="bg-gradient-to-br from-[#334155] to-[#1e293b] rounded-xl p-4 border border-[#475569]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-blue-400" />
                      </div>
                      <h4 className="text-sm font-medium text-[#94a3b8]">
                        Harga Saat Ini
                      </h4>
                    </div>
                    <p className="text-3xl font-bold text-blue-400">
                      {formatCurrency(pricing.pricePerHundred)}
                      <span className="text-lg text-[#94a3b8] ml-2">
                        / 100 Robux
                      </span>
                    </p>
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-[#94a3b8]">
                    Terakhir diupdate:{" "}
                    {new Date(pricing.updatedAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {/* Example Calculations */}
                  <div className="bg-[#0f172a] rounded-lg p-4 border border-[#1e293b]">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-400" />
                      <h4 className="font-medium text-[#cbd5e1] text-sm">
                        Contoh Perhitungan:
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg">
                        <span className="text-[#cbd5e1]">100 Robux</span>
                        <span className="font-semibold text-[#f1f5f9]">
                          {formatCurrency(pricing.pricePerHundred)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg">
                        <span className="text-[#cbd5e1]">250 Robux</span>
                        <span className="font-semibold text-[#f1f5f9]">
                          {formatCurrency(
                            Math.ceil((250 / 100) * pricing.pricePerHundred)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg">
                        <span className="text-[#cbd5e1]">500 Robux</span>
                        <span className="font-semibold text-[#f1f5f9]">
                          {formatCurrency(
                            Math.ceil((500 / 100) * pricing.pricePerHundred)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg">
                        <span className="text-[#cbd5e1]">1,000 Robux</span>
                        <span className="font-semibold text-[#f1f5f9]">
                          {formatCurrency(
                            Math.ceil((1000 / 100) * pricing.pricePerHundred)
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[#94a3b8]">
                  <p className="mb-4 text-sm">
                    Belum ada pengaturan harga. Silakan atur harga per 100 Robux
                    untuk Robux Instant.
                  </p>
                </div>
              )}
            </div>

            {/* Edit Form - Always Visible */}
            <div className="bg-[#1e293b] rounded-lg shadow-md p-6 border border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f1f5f9] mb-4">
                {pricing ? "Edit Harga Robux" : "Atur Harga Robux"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Harga per 100 Robux (IDR) *
                  </label>
                  <input
                    type="number"
                    value={formData.pricePerHundred}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pricePerHundred: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 border border-[#334155] bg-[#334155] text-[#f1f5f9] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="13000"
                    required
                    min="1"
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Contoh: 13000 (untuk Rp 13.000 per 100 Robux)
                  </p>
                </div>

                {/* Warning */}
                <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-500 mb-1">
                        Perhatian!
                      </h4>
                      <p className="text-sm text-yellow-200">
                        Mengubah harga per 100 Robux akan{" "}
                        <strong>secara otomatis memperbarui</strong> harga semua
                        item robux instant yang ada di database. Pastikan nilai
                        yang dimasukkan sudah benar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="w-full bg-blue-600 text-[#f1f5f9] py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSaving && (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    <span>
                      {isSaving
                        ? "Menyimpan..."
                        : pricing
                        ? "Update Harga"
                        : "Simpan Harga"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* END LEFT COLUMN */}

        {/* RIGHT COLUMN - GAMEPASS */}
        <div className="space-y-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-[#f1f5f9]">
                🎮 Harga per 1 Robux (Gamepass)
              </h2>
            </div>
            <div className="p-3 bg-purple-900/20 border-l-4 border-purple-400 rounded-md">
              <p className="text-purple-200 text-xs">
                <strong>Catatan:</strong> Mengubah harga akan otomatis
                memperbarui semua item gamepass.
              </p>
            </div>
          </div>

          {/* Display Card & Edit Form - Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gamepass Current Setting Display */}
            <div className="bg-[#1e293b] rounded-lg shadow-md p-6 border border-[#334155]">
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-[#f1f5f9] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                  {gamepassSetting ? "Harga Saat Ini" : "Belum Ada Pengaturan"}
                </h3>
              </div>

              {gamepassSetting ? (
                <div className="space-y-4">
                  {/* Current Price Display */}
                  <div className="bg-gradient-to-br from-[#334155] to-[#1e293b] rounded-xl p-4 border border-[#475569]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <DollarSign className="w-5 h-5 text-purple-400" />
                      </div>
                      <h4 className="text-sm font-medium text-[#94a3b8]">
                        Harga Saat Ini
                      </h4>
                    </div>
                    <p className="text-3xl font-bold text-purple-400">
                      {formatCurrency(gamepassSetting.pricePerRobux)}
                      <span className="text-lg text-[#94a3b8] ml-2">
                        / Robux
                      </span>
                    </p>
                  </div>

                  {/* Last Updated */}
                  <div className="text-xs text-[#94a3b8]">
                    Terakhir diupdate:{" "}
                    {new Date(gamepassSetting.updatedAt).toLocaleDateString(
                      "id-ID",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>

                  {/* Example Calculations */}
                  <div className="bg-[#0f172a] rounded-lg p-4 border border-[#1e293b]">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <h4 className="font-medium text-[#cbd5e1] text-sm">
                        Contoh Perhitungan:
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg">
                        <span className="text-[#cbd5e1]">100 Robux</span>
                        <span className="font-semibold text-[#f1f5f9]">
                          {formatCurrency(100 * gamepassSetting.pricePerRobux)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg">
                        <span className="text-[#cbd5e1]">250 Robux</span>
                        <span className="font-semibold text-[#f1f5f9]">
                          {formatCurrency(250 * gamepassSetting.pricePerRobux)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg">
                        <span className="text-[#cbd5e1]">500 Robux</span>
                        <span className="font-semibold text-[#f1f5f9]">
                          {formatCurrency(500 * gamepassSetting.pricePerRobux)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-[#1e293b] rounded-lg">
                        <span className="text-[#cbd5e1]">1,000 Robux</span>
                        <span className="font-semibold text-[#f1f5f9]">
                          {formatCurrency(1000 * gamepassSetting.pricePerRobux)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[#94a3b8]">
                  <p className="mb-4 text-sm">
                    Belum ada pengaturan harga. Silakan atur harga per Robux
                    untuk gamepass.
                  </p>
                </div>
              )}
            </div>

            {/* Gamepass Edit Form - Always Visible */}
            <div className="bg-[#1e293b] rounded-lg shadow-md p-6 border border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f1f5f9] mb-4">
                {gamepassSetting
                  ? "Edit Harga Robux Gamepass"
                  : "Atur Harga Robux Gamepass"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Harga per 1 Robux (IDR) *
                  </label>
                  <input
                    type="number"
                    value={gamepassPrice}
                    onChange={(e) => setGamepassPrice(e.target.value)}
                    className="w-full px-4 py-3 border border-[#334155] bg-[#334155] text-[#f1f5f9] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                    placeholder="100"
                    required
                    min="1"
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Contoh: 100 (untuk Rp 100 per 1 Robux)
                  </p>
                </div>

                {/* Warning */}
                <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-500 mb-1">
                        Perhatian!
                      </h4>
                      <p className="text-sm text-yellow-200">
                        Mengubah harga per Robux akan{" "}
                        <strong>secara otomatis memperbarui</strong> harga semua
                        item gamepass yang ada di database. Pastikan nilai yang
                        dimasukkan sudah benar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleGamepassSave}
                    disabled={isGamepassSaving}
                    className="w-full bg-purple-600 text-[#f1f5f9] py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGamepassSaving && (
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    <span>
                      {isGamepassSaving
                        ? "Menyimpan..."
                        : gamepassSetting
                        ? "Update Harga"
                        : "Simpan Harga"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* END RIGHT COLUMN */}
      </div>
      {/* END GRID */}
    </div>
  );
}
