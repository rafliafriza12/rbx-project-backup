"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface Promo {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  maxUses: number;
  maxUsesPerUser: number;
  currentUses: number;
  isActive: boolean;
  minPurchaseAmount: number;
  applicableTo?: string[];
  expiresAt?: string;
  createdAt: string;
}

export default function PromosAdmin() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: 0,
    maxUses: 0,
    maxUsesPerUser: 1,
    minPurchaseAmount: 0,
    applicableTo: [] as string[],
    expiresAt: "",
    isActive: true,
  });

  const fetchPromos = async () => {
    try {
      const res = await fetch("/api/admin/promos");
      const data = await res.json();
      if (data.success) {
        setPromos(data.data);
      } else {
        toast.error(data.error || "Gagal memuat data promo");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleOpenModal = (promo: Promo | null = null) => {
    if (promo) {
      setEditingPromo(promo);
      
      let localExpiresAt = "";
      if (promo.expiresAt) {
        const d = new Date(promo.expiresAt);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        localExpiresAt = d.toISOString().slice(0, 16);
      }

      setFormData({
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        maxUses: promo.maxUses,
        maxUsesPerUser: promo.maxUsesPerUser !== undefined ? promo.maxUsesPerUser : 1,
        minPurchaseAmount: promo.minPurchaseAmount,
        applicableTo: promo.applicableTo || [],
        expiresAt: localExpiresAt,
        isActive: promo.isActive,
      });
    } else {
      setEditingPromo(null);
      setFormData({
        code: "",
        discountType: "percentage",
        discountValue: 0,
        maxUses: 0,
        maxUsesPerUser: 1,
        minPurchaseAmount: 0,
        applicableTo: [] as string[],
        expiresAt: "",
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || formData.discountValue <= 0) {
      toast.error("Kode dan Nilai Diskon harus diisi!");
      return;
    }

    try {
      const url = editingPromo ? `/api/admin/promos/${editingPromo._id}` : "/api/admin/promos";
      const method = editingPromo ? "PUT" : "POST";

      const payload: any = { ...formData };
      if (payload.expiresAt) {
        payload.expiresAt = new Date(payload.expiresAt).toISOString();
      } else {
        payload.expiresAt = null;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingPromo ? "Promo berhasil diupdate" : "Promo berhasil ditambahkan");
        setShowModal(false);
        fetchPromos();
      } else {
        toast.error(data.error || "Gagal menyimpan promo");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus promo ini?")) return;

    try {
      const res = await fetch(`/api/admin/promos/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Promo berhasil dihapus");
        fetchPromos();
      } else {
        toast.error(data.error || "Gagal menghapus promo");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-white">Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gray-800/50 p-6 rounded-2xl border border-gray-700/50">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Manajemen Promo</h1>
          <p className="text-gray-400">Kelola kode diskon untuk pengguna</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>+ Tambah Promo</span>
        </button>
      </div>

      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-800/80 text-gray-300 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Diskon</th>
                <th className="px-6 py-4">Penggunaan (Max)</th>
                <th className="px-6 py-4">Max/User</th>
                <th className="px-6 py-4">Berlaku Untuk</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Kedaluwarsa</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {promos.map((promo) => (
                <tr key={promo._id} className="hover:bg-gray-700/20 transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{promo.code}</td>
                  <td className="px-6 py-4">
                    {promo.discountType === "percentage" ? `${promo.discountValue}%` : `Rp ${promo.discountValue.toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4">
                    {promo.currentUses} / {promo.maxUses === 0 ? "Unlimited" : promo.maxUses}
                  </td>
                  <td className="px-6 py-4">
                    {promo.maxUsesPerUser === 0 ? "Unlimited" : promo.maxUsesPerUser}
                  </td>
                  <td className="px-6 py-4">
                    {promo.applicableTo && promo.applicableTo.length > 0 
                      ? promo.applicableTo.map(s => s === 'rbx5' ? 'RBX 5 Hari' : s === 'robux_instant' ? 'Robux Instant' : 'Gamepass').join(', ')
                      : 'Semua Layanan'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${promo.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {promo.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString("id-ID") : "-"}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(promo)} className="text-blue-400 hover:text-blue-300">Edit</button>
                    <button onClick={() => handleDelete(promo._id)} className="text-red-400 hover:text-red-300">Hapus</button>
                  </td>
                </tr>
              ))}
              {promos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Belum ada promo yang dibuat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingPromo ? "Edit Promo" : "Tambah Promo Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Kode Promo</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  placeholder="MISAL: DISKON20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tipe Diskon</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="percentage">Persen (%)</option>
                    <option value="fixed">Nominal (Rp)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nilai Diskon</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value ? parseInt(e.target.value) : 0 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Penggunaan Global (0 = Unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : 0 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Max Klaim per User (0 = Unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.maxUsesPerUser}
                    onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value ? parseInt(e.target.value) : 0 })}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Minimal Belanja (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.minPurchaseAmount}
                  onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value ? parseInt(e.target.value) : 0 })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Berlaku Untuk Layanan (Kosongkan jika semua layanan)</label>
                <div className="flex flex-wrap gap-4">
                  {[
                    { id: 'rbx5', label: 'RBX 5 Hari' },
                    { id: 'robux_instant', label: 'Robux Instant' },
                    { id: 'gamepass', label: 'Gamepass' }
                  ].map(service => (
                    <label key={service.id} className="flex items-center gap-2 cursor-pointer bg-gray-900 border border-gray-700 rounded-lg px-4 py-2">
                      <input
                        type="checkbox"
                        checked={formData.applicableTo.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, applicableTo: [...formData.applicableTo, service.id] });
                          } else {
                            setFormData({ ...formData, applicableTo: formData.applicableTo.filter(id => id !== service.id) });
                          }
                        }}
                        className="w-4 h-4 rounded text-blue-600 bg-gray-800 border-gray-700"
                      />
                      <span className="text-sm text-gray-300">{service.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Berlaku Hingga (Opsional)</label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-300">Promo Aktif</label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
