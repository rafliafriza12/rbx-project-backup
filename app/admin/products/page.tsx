"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

interface Product {
  _id: string;
  name: string;
  description: string;
  robuxAmount: number;
  price: number;
  isActive: boolean;
  category: "robux_5_hari" | "robux_instant";
  createdAt: string;
  updatedAt: string;
}

interface RobuxPricing {
  _id: string;
  pricePerHundred: number;
  description: string;
}

interface FormData {
  name: string;
  description: string;
  robuxAmount: string;
  price: string;
  isActive: boolean;
  category: "robux_5_hari" | "robux_instant";
}

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<"robux_5_hari" | "robux_instant">(
    "robux_5_hari"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRobuxPricing, setCurrentRobuxPricing] =
    useState<RobuxPricing | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    robuxAmount: "",
    price: "",
    isActive: true,
    category: "robux_5_hari",
  });

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || user.accessRole !== "admin")) {
      router.push("/admin-login");
    }
  }, [user, authLoading, router]);

  // Fetch current robux pricing
  const fetchRobuxPricing = async () => {
    try {
      const response = await fetch("/api/robux-pricing");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setCurrentRobuxPricing(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching robux pricing:", error);
    }
  };

  // Calculate auto price for robux_5_hari
  const calculateAutoPrice = (robuxAmount: number): number => {
    if (!currentRobuxPricing || !robuxAmount) return 0;
    return Math.ceil((robuxAmount / 100) * currentRobuxPricing.pricePerHundred);
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products?admin=true");

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      const sortedProducts = (data.products || []).sort(
        (a: Product, b: Product) => a.robuxAmount - b.robuxAmount
      );
      setProducts(sortedProducts || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal mengambil data produk");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.accessRole === "admin") {
      fetchProducts();
      fetchRobuxPricing();
    }
  }, [user]);

  // Refresh data when coming back to this page
  useEffect(() => {
    const handleFocus = () => {
      if (user && user.accessRole === "admin") {
        fetchRobuxPricing(); // Refresh pricing in case it was updated
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user]);

  // Handle form changes
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      const newFormData = {
        ...formData,
        [name]: value,
      };

      // Auto-calculate price for robux_5_hari when robuxAmount changes
      if (name === "robuxAmount" && formData.category === "robux_5_hari") {
        const robuxAmount = parseInt(value) || 0;
        const autoPrice = calculateAutoPrice(robuxAmount);
        newFormData.price = autoPrice.toString();
      }

      // Auto-calculate price when category changes to robux_5_hari
      if (
        name === "category" &&
        value === "robux_5_hari" &&
        formData.robuxAmount
      ) {
        const robuxAmount = parseInt(formData.robuxAmount) || 0;
        const autoPrice = calculateAutoPrice(robuxAmount);
        newFormData.price = autoPrice.toString();
      }

      // Clear price when category changes to robux_instant
      if (name === "category" && value === "robux_instant") {
        newFormData.price = "";
      }

      setFormData(newFormData);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      robuxAmount: "",
      price: "",
      isActive: true,
      category: "robux_5_hari",
    });
    setSelectedProduct(null);
  };

  // Open modal for create
  const openCreateModal = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, category: activeTab }));
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      robuxAmount: product.robuxAmount.toString(),
      price: product.price.toString(),
      isActive: product.isActive,
      category: product.category,
    });
    setShowModal(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        robuxAmount: parseInt(formData.robuxAmount),
        price: parseFloat(formData.price),
        isActive: formData.isActive,
        category: formData.category,
      };

      const url = selectedProduct
        ? `/api/products/${selectedProduct._id}`
        : "/api/products";

      const method = selectedProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menyimpan produk");
      }

      toast.success(
        selectedProduct ? "Produk berhasil diupdate" : "Produk berhasil dibuat"
      );
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan produk"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete product
  const handleDelete = async (productId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus produk");
      }

      toast.success("Produk berhasil dihapus");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus produk"
      );
    }
  };

  // Toggle product status
  const toggleProductStatus = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...product,
          isActive: !product.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengubah status produk");
      }

      fetchProducts();
    } catch (error) {
      console.error("Error toggling product status:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mengubah status produk"
      );
    }
  };

  // Filter products by category
  const filteredProducts = products.filter(
    (product) => product.category === activeTab
  );

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  // Not admin
  if (!user || user.accessRole !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Kelola Produk</h1>
          {currentRobuxPricing && (
            <p className="text-gray-300 text-sm mt-1">
              Harga saat ini:{" "}
              {currentRobuxPricing.pricePerHundred.toLocaleString("id-ID")} per
              100 Robux untuk kategori 5 hari
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <a
            href="/admin/robux-pricing"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Atur Harga Robux
          </a>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Tambah Produk
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("robux_5_hari")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "robux_5_hari"
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            Robux Gamepass (5 Hari)
          </button>
          <button
            onClick={() => setActiveTab("robux_instant")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "robux_instant"
                ? "border-blue-400 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600"
            }`}
          >
            Robux Instant
          </button>
        </nav>
      </div>

      {/* Products Table */}
      <div className="bg-gray-800 border border-gray-700 shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-600">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Produk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Robux
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Harga
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Kategori
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-600">
            {filteredProducts.map((product) => (
              <tr key={product._id} className="hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-400 max-w-xs truncate">
                        {product.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {product.robuxAmount.toLocaleString()} R$
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <div>
                    <div className="font-medium">
                      Rp {product.price.toLocaleString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.category === "robux_5_hari"
                        ? "bg-purple-900 text-purple-300 border border-purple-700"
                        : "bg-green-900 text-green-300 border border-green-700"
                    }`}
                  >
                    {product.category === "robux_5_hari" ? "5 Hari" : "Instant"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => toggleProductStatus(product)}
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-red-100 text-red-800 hover:bg-red-200"
                    }`}
                  >
                    {product.isActive ? "Aktif" : "Nonaktif"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              Belum ada produk untuk kategori{" "}
              {activeTab === "robux_5_hari"
                ? "Robux Gamepass (5 Hari)"
                : "Robux Instant"}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-[5px] bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-lg shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedProduct ? "Edit Produk" : "Tambah Produk Baru"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="robux_5_hari">
                        Robux Gamepass (5 Hari)
                      </option>
                      <option value="robux_instant">Robux Instant</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jumlah Robux *
                    </label>
                    <input
                      type="number"
                      name="robuxAmount"
                      value={formData.robuxAmount}
                      onChange={handleInputChange}
                      required
                      min="1"
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Harga (Rp) *
                      {formData.category === "robux_5_hari" && (
                        <span className="text-xs text-blue-600 ml-1">
                          (Auto-calculated)
                        </span>
                      )}
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      readOnly={formData.category === "robux_5_hari"}
                      className={`w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formData.category === "robux_5_hari"
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      }`}
                    />
                    {formData.category === "robux_5_hari" &&
                      currentRobuxPricing && (
                        <p className="text-xs text-gray-600 mt-1">
                          Berdasarkan{" "}
                          {currentRobuxPricing.pricePerHundred.toLocaleString(
                            "id-ID"
                          )}{" "}
                          per 100 Robux.{" "}
                          <a
                            href="/admin/robux-pricing"
                            target="_blank"
                            className="text-blue-600 hover:underline"
                          >
                            Ubah harga
                          </a>
                        </p>
                      )}
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Produk Aktif
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                  >
                    {isSubmitting
                      ? "Menyimpan..."
                      : selectedProduct
                      ? "Update"
                      : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
