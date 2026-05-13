"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import { fetchSettingsAdmin, updateSettingsAdmin } from "../settings/actions";
import { Coins, Save, Percent, RefreshCw, ShoppingCart, Plus, Edit, Trash2 } from "lucide-react";
import { fetchProductsAdmin, createProduct, updateProduct, deleteProduct } from "../products/actions";

interface CoinBonusTier {
  minAmount: number | undefined;
  bonusType?: "percentage" | "fixed";
  percentage?: number | undefined;
  fixedBonus?: number | undefined;
}

interface CoinSettings {
  coinTopupPrice: number | undefined;
  coinSpendValue: number | undefined;
  coinBonusTiers: CoinBonusTier[];
}

interface Product {
  _id: string;
  name: string;
  description: string;
  robuxAmount: number;
  price: number;
  isActive: boolean;
  category: "coin";
  customBonusAmount?: number;
  useBonusTiers?: boolean;
}

export default function CoinEconomyPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"economy" | "packages" | "bonuses">("economy");
  
  const [settings, setSettings] = useState<CoinSettings>({
    coinTopupPrice: 0,
    coinSpendValue: 0,
    coinBonusTiers: [],
  });

  const [originalSettings, setOriginalSettings] = useState<CoinSettings>({
    coinTopupPrice: 0,
    coinSpendValue: 0,
    coinBonusTiers: [],
  });

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    robuxAmount: "",
    customBonusAmount: "",
    useBonusTiers: false,
    isActive: true,
  });
  const [submittingProduct, setSubmittingProduct] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchCoinProducts();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { ok, data } = await fetchSettingsAdmin();

      if (ok) {
        const fetchedSettings = {
          coinTopupPrice: data.settings.coinTopupPrice || 0,
          coinSpendValue: data.settings.coinSpendValue || 0,
          coinBonusTiers: data.settings.coinBonusTiers || [],
        };
        setSettings(fetchedSettings);
        setOriginalSettings(fetchedSettings);
        setHasChanges(false);
      } else {
        toast.error("Error loading settings: " + data.error);
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchCoinProducts = async () => {
    try {
      const { ok, data } = await fetchProductsAdmin();
      if (ok && data.products) {
        const coinProducts = data.products
          .filter((p: any) => p.category === "coin")
          .sort((a: any, b: any) => a.robuxAmount - b.robuxAmount);
        setProducts(coinProducts);
      }
    } catch (error) {
      console.error("Error fetching coin products", error);
    }
  };

  const handleInputChange = (field: keyof CoinSettings, value: number) => {
    if (field === 'coinBonusTiers') return; // Handled separately
    setSettings((prev) => ({
      ...prev,
      [field]: isNaN(value) ? undefined : value,
    }));
    setHasChanges(true);
  };

  const addBonusTier = () => {
    setSettings((prev) => ({
      ...prev,
      coinBonusTiers: [...prev.coinBonusTiers, { minAmount: 100, bonusType: "percentage", percentage: 10, fixedBonus: 0 }],
    }));
    setHasChanges(true);
  };

  const removeBonusTier = (index: number) => {
    setSettings((prev) => {
      const newTiers = [...prev.coinBonusTiers];
      newTiers.splice(index, 1);
      return { ...prev, coinBonusTiers: newTiers };
    });
    setHasChanges(true);
  };

  const updateBonusTier = (index: number, field: keyof CoinBonusTier, value: any) => {
    setSettings((prev) => {
      const newTiers = [...prev.coinBonusTiers];
      if (field === "bonusType") {
        newTiers[index] = { ...newTiers[index], [field]: value };
      } else {
        newTiers[index] = { ...newTiers[index], [field]: isNaN(value) ? undefined : value };
      }
      return { ...prev, coinBonusTiers: newTiers };
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { ok, data } = await fetchSettingsAdmin();
      if (!ok) {
        toast.error("Error mengambil base settings: " + data.error);
        return;
      }
      
      const settingsToSave = {
        ...data.settings,
        coinTopupPrice: settings.coinTopupPrice,
        coinSpendValue: settings.coinSpendValue,
        coinBonusTiers: settings.coinBonusTiers,
      };

      const updateRes = await updateSettingsAdmin(settingsToSave);

      if (updateRes.ok) {
        toast.success("Pengaturan Credits berhasil disimpan!");
        setOriginalSettings(settings);
        setHasChanges(false);
      } else {
        toast.error("Error menyimpan settings: " + updateRes.data.error);
      }
    } catch (error) {
      toast.error("Gagal menyimpan settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  // Product Handlers
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setSelectedProduct(product);
      setProductForm({
        name: product.name,
        description: product.description,
        robuxAmount: product.robuxAmount.toString(),
        customBonusAmount: product.customBonusAmount?.toString() || "",
        useBonusTiers: product.useBonusTiers || false,
        isActive: product.isActive,
      });
    } else {
      setSelectedProduct(null);
      setProductForm({
        name: "",
        description: "",
        robuxAmount: "",
        customBonusAmount: "",
        useBonusTiers: false,
        isActive: true,
      });
    }
    setShowProductModal(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingProduct(true);
    try {
      // Base payload (price is 0 because it's auto-calculated on the backend based on settings)
      const payload = {
        name: productForm.name,
        description: productForm.description,
        robuxAmount: parseInt(productForm.robuxAmount) || 0,
        price: 0, 
        customBonusAmount: parseInt(productForm.customBonusAmount) || 0,
        useBonusTiers: productForm.useBonusTiers,
        isActive: productForm.isActive,
        category: "coin" as const,
      };

      let res;
      if (selectedProduct) {
        res = await updateProduct(selectedProduct._id, payload);
      } else {
        res = await createProduct(payload);
      }

      if (res.ok) {
        toast.success(`Paket Credits berhasil ${selectedProduct ? "diupdate" : "ditambahkan"}`);
        setShowProductModal(false);
        fetchCoinProducts();
      } else {
        toast.error(res.data?.error || "Gagal menyimpan Paket Credits");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menyimpan Paket Credits");
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleProductDelete = async (id: string) => {
    if (!confirm("Hapus Paket Credits ini?")) return;
    try {
      const res = await deleteProduct(id);
      if (res.ok) {
        toast.success("Paket Credits berhasil dihapus");
        fetchCoinProducts();
      } else {
        toast.error(res.data?.error || "Gagal menghapus");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan saat menghapus");
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const res = await updateProduct(product._id, { ...product, isActive: !product.isActive });
      if (res.ok) {
        fetchCoinProducts();
      } else {
        toast.error("Gagal mengubah status");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-fuchsia-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1e293b] p-6 rounded-xl border border-[#334155] shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-fuchsia-500/20 rounded-lg flex items-center justify-center border border-fuchsia-500/30">
              <Coins className="w-6 h-6 text-fuchsia-400" />
            </div>
            Pengaturan Ekonomi Credits
          </h1>
          <p className="text-[#94a3b8] mt-2 ml-[52px]">
            Kelola harga top-up, nilai tukar belanja, dan bonus credits.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={handleDiscard}
              disabled={saving}
              className="px-4 py-2 bg-[#334155] text-white rounded-lg hover:bg-[#475569] transition-colors"
            >
              Batal
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all shadow-lg ${
              hasChanges
                ? "bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 hover:from-fuchsia-400 hover:to-fuchsia-500 text-fuchsia-950 shadow-fuchsia-500/20"
                : "bg-[#334155] text-[#94a3b8] cursor-not-allowed opacity-70"
            }`}
          >
            {saving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Simpan Perubahan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#334155]">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("economy")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "economy"
                ? "border-fuchsia-400 text-fuchsia-400"
                : "border-transparent text-[#94a3b8] hover:text-[#cbd5e1] hover:border-[#334155]"
            }`}
          >
            <Coins className="w-4 h-4" />
            Pengaturan Ekonomi Credits
          </button>
          <button
            onClick={() => setActiveTab("packages")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "packages"
                ? "border-fuchsia-400 text-fuchsia-400"
                : "border-transparent text-[#94a3b8] hover:text-[#cbd5e1] hover:border-[#334155]"
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Daftar Paket Credits
          </button>
          <button
            onClick={() => setActiveTab("bonuses")}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
              activeTab === "bonuses"
                ? "border-fuchsia-400 text-fuchsia-400"
                : "border-transparent text-[#94a3b8] hover:text-[#cbd5e1] hover:border-[#334155]"
            }`}
          >
            <Percent className="w-4 h-4" />
            Tingkat Bonus
          </button>
        </nav>
      </div>

      {activeTab === "economy" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Top Up Settings */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="bg-[#0f172a] px-6 py-4 border-b border-[#334155] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Pembelian (Top Up)</h2>
            </div>
            
            <div className="p-6 space-y-6 flex-1">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Harga 1 Credits Top Up
                </label>
                <div className="flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-[#334155] bg-[#334155]/50 text-[#94a3b8] font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.coinTopupPrice ?? ""}
                    onChange={(e) => handleInputChange("coinTopupPrice", parseFloat(e.target.value))}
                    className="flex-1 block w-full min-w-0 rounded-none rounded-r-lg bg-[#0f172a] border border-[#334155] focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-white placeholder-[#475569] px-4 py-3"
                    placeholder="Contoh: 5000"
                  />
                </div>
                <p className="text-sm text-[#94a3b8] mt-2">
                  Harga ini digunakan sebagai *base multiplier* ketika sistem mengkalkulasi harga paket Top Up Credits.
                </p>
              </div>

            </div>
          </div>

          {/* Spend Settings */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="bg-[#0f172a] px-6 py-4 border-b border-[#334155] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <Coins className="w-4 h-4 text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Penggunaan (Belanja)</h2>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-white mb-2">
                  Nilai Tukar 1 Credits di Web
                </label>
                <div className="flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-[#334155] bg-[#334155]/50 text-[#94a3b8] font-bold">
                    Rp
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.coinSpendValue ?? ""}
                    onChange={(e) => handleInputChange("coinSpendValue", parseFloat(e.target.value))}
                    className="flex-1 block w-full min-w-0 rounded-none rounded-r-lg bg-[#0f172a] border border-[#334155] focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white placeholder-[#475569] px-4 py-3"
                    placeholder="Contoh: 5500"
                  />
                </div>
                <p className="text-sm text-[#94a3b8] mt-3">
                  Kekuatan beli dari 1 credits saat user melakukan checkout menggunakan metode pembayaran internal <code className="bg-[#0f172a] text-fuchsia-400 px-1.5 py-0.5 rounded border border-[#334155] text-xs">RBXNET_CREDITS</code>.
                </p>
              </div>
              
              <div className="mt-6 bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Percent className="w-4 h-4 text-purple-400" /> Simulasi Konversi
                </h4>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#94a3b8]">Produk Seharga Rp 100.000</span>
                  <span className="text-white font-mono bg-[#1e293b] px-2 py-1 rounded">
                    ÷ {(settings.coinSpendValue || 0).toLocaleString('id-ID')}
                  </span>
                  <span className="text-fuchsia-400 font-bold">
                    = {settings.coinSpendValue > 0 ? Number((100000 / settings.coinSpendValue).toFixed(2)) : 0} Credits
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Bonus Tiers Tab */}
      {activeTab === "bonuses" && (
        <div className="bg-[#1e293b] border border-[#334155] shadow-lg rounded-xl overflow-hidden mt-4">
          <div className="bg-[#0f172a] px-6 py-5 border-b border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Percent className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Tingkat Bonus Top Up</h2>
            </div>
            <button
              onClick={addBonusTier}
              className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Tingkat
            </button>
          </div>
          <div className="p-6">
            <p className="text-[#94a3b8] text-sm mb-6">
              Sistem secara otomatis akan memilih tingkat bonus dengan "Minimal Top Up" terbesar yang memenuhi syarat.
            </p>
            {(!settings.coinBonusTiers || settings.coinBonusTiers.length === 0) ? (
              <div className="text-center py-8 bg-[#0f172a] rounded-xl border border-dashed border-[#334155]">
                <p className="text-[#94a3b8]">Belum ada tingkat bonus credits. Tambahkan tingkat untuk mulai memberikan bonus!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {settings.coinBonusTiers.map((tier, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-end gap-4 bg-[#0f172a] p-4 rounded-xl border border-[#334155]">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-semibold text-white mb-2">Minimal Top Up (Credits)</label>
                      <div className="flex rounded-lg shadow-sm">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-[#334155] bg-[#334155]/50 text-[#94a3b8]">
                          <Coins className="w-4 h-4" />
                        </span>
                        <input
                          type="number"
                          value={tier.minAmount ?? ""}
                          onChange={(e) => updateBonusTier(index, "minAmount", parseInt(e.target.value))}
                          className="flex-1 block w-full min-w-0 rounded-none rounded-r-lg bg-[#1e293b] border border-[#334155] focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-white placeholder-[#475569] px-4 py-2"
                          placeholder="Contoh: 100"
                        />
                      </div>
                    </div>
                    <div className="flex-1 w-full max-w-[150px]">
                      <label className="block text-sm font-semibold text-white mb-2">Tipe Bonus</label>
                      <select
                        value={tier.bonusType || "percentage"}
                        onChange={(e) => updateBonusTier(index, "bonusType", e.target.value)}
                        className="w-full bg-[#1e293b] border border-[#334155] focus:ring-2 focus:ring-fuchsia-500 text-white rounded-lg px-3 py-2 outline-none"
                      >
                        <option value="percentage">Persen (%)</option>
                        <option value="fixed">Credits Tetap</option>
                      </select>
                    </div>
                    <div className="flex-[2] w-full">
                      <label className="block text-sm font-semibold text-white mb-2">
                        {tier.bonusType === "fixed" ? "Nominal Bonus Credits" : "Persentase Bonus (%)"}
                      </label>
                      <div className="flex rounded-lg shadow-sm">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-[#334155] bg-[#334155]/50 text-[#94a3b8]">
                          {tier.bonusType === "fixed" ? <Coins className="w-4 h-4" /> : <Percent className="w-4 h-4" />}
                        </span>
                        {tier.bonusType === "fixed" ? (
                          <input
                            type="number"
                            value={tier.fixedBonus ?? ""}
                            onChange={(e) => updateBonusTier(index, "fixedBonus", parseInt(e.target.value))}
                            className="flex-1 block w-full min-w-0 rounded-none rounded-r-lg bg-[#1e293b] border border-[#334155] focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-white placeholder-[#475569] px-4 py-2"
                            placeholder="Contoh: 5"
                          />
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={tier.percentage ?? ""}
                            onChange={(e) => updateBonusTier(index, "percentage", parseFloat(e.target.value))}
                            className="flex-1 block w-full min-w-0 rounded-none rounded-r-lg bg-[#1e293b] border border-[#334155] focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-white placeholder-[#475569] px-4 py-2"
                            placeholder="Contoh: 10"
                          />
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeBonusTier(index)}
                      className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20"
                      title="Hapus Tingkat"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coin Packages List */}
      {activeTab === "packages" && (
        <div className="bg-[#1e293b] border border-[#334155] shadow-lg rounded-xl overflow-hidden mt-4">
        <div className="bg-[#0f172a] px-6 py-5 border-b border-[#334155] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-fuchsia-500/20 flex items-center justify-center">
              <Coins className="w-4 h-4 text-fuchsia-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Daftar Paket Credits</h2>
          </div>
          <button
            onClick={() => handleOpenProductModal()}
            className="flex items-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Paket
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#334155]">
            <thead className="bg-[#1e293b]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Paket</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Jumlah Credits</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Harga Tampil (Estimasi)</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-[#1e293b] divide-y divide-[#334155]">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product._id} className="hover:bg-[#334155]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">{product.name}</div>
                      <div className="text-xs text-[#94a3b8] mt-1 line-clamp-1">{product.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-fuchsia-400">
                        <Coins className="w-4 h-4" />
                        {product.robuxAmount.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        Rp {(product.robuxAmount * (settings.coinTopupPrice || 0)).toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleProductStatus(product)}
                        className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full transition-colors ${
                          product.isActive
                            ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                        }`}
                      >
                        {product.isActive ? "Aktif" : "Nonaktif"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenProductModal(product)}
                          className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleProductDelete(product._id)}
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#94a3b8]">
                    Belum ada paket credits yang ditambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-[#334155] flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">
                {selectedProduct ? "Edit Paket Credits" : "Tambah Paket Credits"}
              </h3>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Nama Paket</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-white"
                  placeholder="Cth: Paket 10 Credits"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Jumlah Credits</label>
                <div className="flex rounded-lg shadow-sm">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-[#334155] bg-[#334155]/50 text-fuchsia-400">
                    <Coins className="w-4 h-4" />
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.robuxAmount}
                    onChange={(e) => setProductForm({ ...productForm, robuxAmount: e.target.value })}
                    className="flex-1 block w-full min-w-0 rounded-none rounded-r-lg bg-[#0f172a] border border-[#334155] focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-white px-4 py-2.5"
                    placeholder="10"
                  />
                </div>
                <p className="text-xs text-[#94a3b8] mt-2">
                  Harga final: <strong className="text-white">Rp {((parseInt(productForm.robuxAmount) || 0) * (settings.coinTopupPrice || 0)).toLocaleString('id-ID')}</strong> (dihitung otomatis dari Harga 1 Credits Top Up).
                </p>
              </div>

              <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
                <label className="block text-sm font-semibold text-white mb-3">Sumber Bonus Credits</label>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, useBonusTiers: true })}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      productForm.useBonusTiers 
                        ? "bg-purple-500/20 border-purple-500 text-purple-400" 
                        : "bg-[#0f172a] border-[#334155] text-[#94a3b8] hover:border-[#475569]"
                    }`}
                  >
                    Otomatis (Tingkat Bonus)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductForm({ ...productForm, useBonusTiers: false })}
                    className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      !productForm.useBonusTiers 
                        ? "bg-blue-500/20 border-blue-500 text-blue-400" 
                        : "bg-[#0f172a] border-[#334155] text-[#94a3b8] hover:border-[#475569]"
                    }`}
                  >
                    Manual (Ketik Angka)
                  </button>
                </div>

                {!productForm.useBonusTiers && (
                  <div>
                    <label className="block text-xs font-semibold text-[#94a3b8] mb-2">
                      Nominal Bonus Tetap
                    </label>
                    <div className="flex rounded-lg shadow-sm">
                      <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-[#334155] bg-[#334155]/50 text-blue-400">
                        <Plus className="w-4 h-4" />
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={productForm.customBonusAmount}
                        onChange={(e) => setProductForm({ ...productForm, customBonusAmount: e.target.value })}
                        className="flex-1 block w-full min-w-0 rounded-none rounded-r-lg bg-[#0f172a] border border-[#334155] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white px-4 py-2"
                        placeholder="Contoh: 5"
                      />
                    </div>
                  </div>
                )}
                
                {productForm.useBonusTiers && (
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-300">
                    Sistem akan menghitung bonus paket ini secara otomatis menggunakan pengaturan di tab "Tingkat Bonus" berdasarkan Jumlah Credits paket.
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-white mb-2">Deskripsi Pendek</label>
                <textarea
                  required
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-fuchsia-500 text-white resize-none"
                  placeholder="Cth: Cocok untuk top-up kecil"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                  <span className="ml-3 text-sm font-medium text-white">Aktifkan Paket</span>
                </label>
              </div>

              <div className="flex gap-3 pt-6 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 px-4 py-2.5 bg-[#334155] text-white rounded-lg hover:bg-[#475569] transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="flex-1 px-4 py-2.5 bg-fuchsia-500 hover:bg-fuchsia-400 text-fuchsia-950 rounded-lg transition-colors font-bold disabled:opacity-70 flex justify-center items-center"
                >
                  {submittingProduct ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Simpan Paket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
