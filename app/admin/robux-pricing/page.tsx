"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface RobuxPricing {
  _id: string;
  pricePerHundred: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function RobuxPricingPage() {
  const [pricing, setPricing] = useState<RobuxPricing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    pricePerHundred: "",
    description: "",
  });

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

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pricePerHundred || Number(formData.pricePerHundred) <= 0) {
      toast.error("Harga per 100 Robux harus lebih dari 0");
      return;
    }

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
            formData.description || "Harga per 100 Robux untuk kategori 5 hari",
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.updatedProductsCount > 0) {
          toast.success(`${data.message}`, { autoClose: 5000 });
        } else {
          toast.success(data.message);
        }
        setIsEditing(false);
        fetchPricing();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error saving pricing:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    }
  };

  const handleCancel = () => {
    if (pricing) {
      setFormData({
        pricePerHundred: pricing.pricePerHundred.toString(),
        description: pricing.description || "",
      });
    } else {
      setFormData({
        pricePerHundred: "",
        description: "",
      });
    }
    setIsEditing(false);
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
      <div className="flex justify-center items-center min-h-screen bg-[#0f172a]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-[#0f172a] min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#f1f5f9]">
          Pengaturan Harga Robux
        </h1>
        <p className="text-[#cbd5e1] mt-2">
          Kelola harga per 100 Robux untuk kategori 5 hari. Harga ini akan
          digunakan untuk menghitung otomatis harga produk robux 5 hari.
        </p>
        <div className="mt-3 p-3 bg-[#1e3a8a]/20 border-l-4 border-blue-400 rounded-md">
          <p className="text-blue-200 text-sm">
            <strong>Catatan:</strong> Mengubah harga per 100 Robux akan otomatis
            memperbarui harga semua produk robux 5 hari yang sudah ada di
            database.
          </p>
        </div>
      </div>

      {/* Current Pricing Display */}
      <div className="bg-[#1e293b] rounded-lg shadow-md p-6 mb-6 border border-[#334155]">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-[#f1f5f9] mb-4">
              {pricing ? "Harga Saat Ini" : "Belum Ada Harga"}
            </h2>

            {pricing ? (
              <div className="space-y-3">
                <div>
                  <span className="text-3xl font-bold text-green-400">
                    {formatCurrency(pricing.pricePerHundred)}
                  </span>
                  <span className="text-lg text-[#cbd5e1] ml-2">
                    per 100 Robux
                  </span>
                </div>

                <div className="text-sm text-[#cbd5e1]">
                  <strong>Deskripsi:</strong> {pricing.description}
                </div>

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

                {/* Example Calculation */}
                <div className="mt-4 p-3 bg-[#1e3a8a]/20 rounded-lg border border-[#3b82f6]/30">
                  <h4 className="font-medium text-[#93c5fd] mb-2">
                    Contoh Perhitungan:
                  </h4>
                  <div className="text-sm text-blue-200 space-y-1">
                    <div>
                      • 100 Robux = {formatCurrency(pricing.pricePerHundred)}
                    </div>
                    <div>
                      • 250 Robux ={" "}
                      {formatCurrency(
                        Math.ceil((250 / 100) * pricing.pricePerHundred)
                      )}
                    </div>
                    <div>
                      • 500 Robux ={" "}
                      {formatCurrency(
                        Math.ceil((500 / 100) * pricing.pricePerHundred)
                      )}
                    </div>
                    <div>
                      • 1000 Robux ={" "}
                      {formatCurrency(
                        Math.ceil((1000 / 100) * pricing.pricePerHundred)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[#94a3b8]">
                <p className="mb-4">
                  Belum ada harga yang diatur. Silakan tambahkan harga per 100
                  Robux untuk memulai.
                </p>
                <div className="p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                  <p className="text-yellow-200 text-sm">
                    <strong>Catatan:</strong> Setelah harga diatur, semua produk
                    robux 5 hari akan dihitung otomatis berdasarkan harga ini.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#3b82f6] text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            {pricing ? "Edit Harga" : "Atur Harga"}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-[#1e293b] rounded-lg shadow-md p-6 border border-[#334155]">
          <h3 className="text-lg font-semibold text-[#f1f5f9] mb-4">
            {pricing ? "Edit Harga Robux" : "Atur Harga Robux"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Harga per 100 Robux (IDR) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94a3b8]">
                  Rp
                </span>
                <input
                  type="number"
                  value={formData.pricePerHundred}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pricePerHundred: e.target.value,
                    })
                  }
                  className="w-full pl-10 pr-3 py-3 border border-[#334155] bg-[#334155] text-[#f1f5f9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent text-lg"
                  placeholder="13000"
                  required
                  min="1"
                />
              </div>
              <p className="text-xs text-[#94a3b8] mt-1">
                Contoh: 13000 (untuk Rp 13.000 per 100 Robux)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Deskripsi (Opsional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-[#334155] bg-[#334155] text-[#f1f5f9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
                placeholder="Deskripsi harga ini..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-[#3b82f6] text-[#f1f5f9] py-2 px-6 rounded-lg hover:bg-[#1d4ed8] transition-colors font-medium"
              >
                {pricing ? "Update Harga" : "Simpan Harga"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-[#475569] text-[#e2e8f0] py-2 px-6 rounded-lg hover:bg-[#64748b] transition-colors font-medium"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
