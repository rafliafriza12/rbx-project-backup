"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Trash2,
  Crown,
  Shield,
  Award,
  Eye,
  EyeOff,
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
  createdAt?: string;
  updatedAt?: string;
}

const tierIcons = {
  1: Award,
  2: Shield,
  3: Crown,
};

export default function AdminResellerPage() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<ResellerPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ResellerPackage | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    tier: 1,
    price: 0,
    duration: 1,
    discount: 0,
    features: [""],
    isActive: true,
  });

  useEffect(() => {
    if (user?.accessRole === "admin") {
      fetchPackages();
    }
  }, [user]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reseller-packages?admin=true");
      const data = await response.json();

      if (data.success) {
        setPackages(data.data);
      } else {
        toast.error(data.error || "Gagal memuat paket reseller");
      }
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast.error("Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      name: "",
      tier: 1,
      price: 0,
      duration: 1,
      discount: 0,
      features: [""],
      isActive: true,
    });
    setShowModal(true);
  };

  const openEditModal = (pkg: ResellerPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      tier: pkg.tier,
      price: pkg.price,
      duration: pkg.duration,
      discount: pkg.discount,
      features: pkg.features.length > 0 ? pkg.features : [""],
      isActive: pkg.isActive,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingPackage
        ? `/api/reseller-packages/${editingPackage._id}`
        : "/api/reseller-packages";

      const method = editingPackage ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          features: formData.features.filter((f) => f.trim() !== ""),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingPackage
            ? "Paket berhasil diperbarui!"
            : "Paket berhasil dibuat!"
        );
        setShowModal(false);
        fetchPackages();
      } else {
        toast.error(data.error || "Gagal menyimpan paket");
      }
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Terjadi kesalahan saat menyimpan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus paket ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reseller-packages/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Paket berhasil dihapus!");
        fetchPackages();
      } else {
        toast.error(data.error || "Gagal menghapus paket");
      }
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Terjadi kesalahan saat menghapus");
    }
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, ""],
    });
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      setFormData({
        ...formData,
        features: formData.features.filter((_, i) => i !== index),
      });
    }
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({
      ...formData,
      features: newFeatures,
    });
  };

  if (user?.accessRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <div className="text-center">
          <p className="text-red-400 text-xl">
            Akses ditolak. Halaman ini hanya untuk admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: "transparent" }}
      className="min-h-screen  text-white p-6"
    >
      <div className="max-w-7xl mx-auto p-6 rounded-xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manajemen Paket Reseller</h1>
          <p className="text-gray-400">
            Kelola paket reseller dan tingkatannya
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1e293b] rounded-lg p-6 border border-[#334155]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm mb-1">Total Paket</p>
                <p className="text-2xl font-bold text-[#f1f5f9]">
                  {packages.length}
                </p>
              </div>
              <Crown className="w-8 h-8 text-[#60a5fa]" />
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-lg p-6 border border-[#334155]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm mb-1">Paket Aktif</p>
                <p className="text-2xl font-bold text-[#10b981]">
                  {packages.filter((p) => p.isActive).length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-[#10b981]" />
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-lg p-6 border border-[#334155]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm mb-1">Paket Nonaktif</p>
                <p className="text-2xl font-bold text-[#ef4444]">
                  {packages.filter((p) => !p.isActive).length}
                </p>
              </div>
              <EyeOff className="w-8 h-8 text-[#ef4444]" />
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-lg p-6 border border-[#334155]">
            <button
              onClick={openCreateModal}
              className="w-full h-full flex items-center justify-center gap-2 text-[#60a5fa] hover:text-[#93c5fd] transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="font-bold">Tambah Paket</span>
            </button>
          </div>
        </div>

        {/* Packages Table */}
        <div className="bg-[#1e293b] rounded-lg shadow border border-[#334155]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-[#334155]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Nama Paket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Harga
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Durasi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Diskon
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[#1e293b] divide-y divide-[#334155]">
                {packages.map((pkg) => {
                  const IconComponent =
                    tierIcons[pkg.tier as keyof typeof tierIcons];
                  return (
                    <tr key={pkg._id} className="hover:bg-[#334155]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-5 h-5 text-[#60a5fa]" />
                          <span className="text-sm font-medium text-[#f1f5f9]">
                            Tier {pkg.tier}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#f1f5f9]">
                          {pkg.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#f1f5f9]">
                          Rp {pkg.price.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#cbd5e1]">
                          {pkg.duration} bulan
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-[#10b981]">
                          {pkg.discount}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full `}
                        >
                          {pkg.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openEditModal(pkg)}
                          className="text-[#60a5fa] hover:text-[#93c5fd] mr-4"
                        >
                          <Edit2 className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(pkg._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {packages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#94a3b8] mb-4">Belum ada paket reseller</p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb]"
              >
                Tambah Paket Pertama
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e293b] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#334155]">
              <h2 className="text-2xl font-bold text-[#f1f5f9]">
                {editingPackage
                  ? "Edit Paket Reseller"
                  : "Tambah Paket Reseller"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Nama Paket *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  placeholder="Reseller Tier 1"
                  required
                />
              </div>

              {/* Tier */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Tier *
                </label>
                <select
                  value={formData.tier}
                  onChange={(e) =>
                    setFormData({ ...formData, tier: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  required
                >
                  <option value={1}>Tier 1</option>
                  <option value={2}>Tier 2</option>
                  <option value={3}>Tier 3</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    min="0"
                    required
                  />
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Durasi (bulan) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    min="1"
                    required
                  />
                </div>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Diskon (%) *
                </label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  min="0"
                  max="100"
                  required
                />
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Fitur
                </label>
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                        placeholder={`Fitur ${index + 1}`}
                      />
                      {formData.features.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                        >
                          -
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb]"
                  >
                    + Tambah Fitur
                  </button>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#cbd5e1]">Paket Aktif</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 bg-[#334155] text-[#f1f5f9] rounded-md hover:bg-[#475569]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb]"
                >
                  {editingPackage ? "Perbarui" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
