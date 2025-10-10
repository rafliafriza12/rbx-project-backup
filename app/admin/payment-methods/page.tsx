"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

interface PaymentMethod {
  _id: string;
  code: string;
  name: string;
  category: string;
  icon: string;
  fee: number;
  feeType: "fixed" | "percentage";
  description: string;
  isActive: boolean;
  displayOrder: number;
  midtransEnabled: boolean;
  minimumAmount?: number;
  maximumAmount?: number;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  code: string;
  name: string;
  category: string;
  icon: string;
  iconFile: File | null;
  fee: string;
  feeType: "fixed" | "percentage";
  description: string;
  isActive: boolean;
  displayOrder: string;
  midtransEnabled: boolean;
  minimumAmount: string;
  maximumAmount: string;
  instructions: string;
}

export default function PaymentMethodsPage() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    code: "",
    name: "",
    category: "ewallet",
    icon: "",
    iconFile: null,
    fee: "0",
    feeType: "fixed",
    description: "",
    isActive: true,
    displayOrder: "0",
    midtransEnabled: true,
    minimumAmount: "",
    maximumAmount: "",
    instructions: "",
  });
  const [iconPreview, setIconPreview] = useState<string>("");
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const categoryOptions = [
    { value: "ewallet", label: "E-Wallet" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "qris", label: "QRIS" },
    { value: "retail", label: "Retail/Minimarket" },
    { value: "credit_card", label: "Credit Card" },
    { value: "other", label: "Lainnya" },
  ];

  const midtransPaymentCodes = [
    { code: "GOPAY", name: "GoPay", category: "ewallet" },
    { code: "SHOPEEPAY", name: "ShopeePay", category: "ewallet" },
    { code: "QRIS", name: "QRIS", category: "qris" },
    { code: "BCA_VA", name: "BCA Virtual Account", category: "bank_transfer" },
    { code: "BNI_VA", name: "BNI Virtual Account", category: "bank_transfer" },
    { code: "BRI_VA", name: "BRI Virtual Account", category: "bank_transfer" },
    {
      code: "PERMATA_VA",
      name: "Permata Virtual Account",
      category: "bank_transfer",
    },
    {
      code: "ECHANNEL",
      name: "Mandiri Bill Payment",
      category: "bank_transfer",
    },
    { code: "OTHER_VA", name: "Other VA", category: "bank_transfer" },
    { code: "INDOMARET", name: "Indomaret", category: "retail" },
    { code: "ALFAMART", name: "Alfamart", category: "retail" },
    { code: "CREDIT_CARD", name: "Credit Card", category: "credit_card" },
  ];

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/payment-methods");
      const result = await response.json();

      if (result.success) {
        setPaymentMethods(result.data || []);
      } else {
        console.error("Error fetching payment methods:", result.error);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      category: "ewallet",
      icon: "",
      iconFile: null,
      fee: "0",
      feeType: "fixed",
      description: "",
      isActive: true,
      displayOrder: "0",
      midtransEnabled: true,
      minimumAmount: "",
      maximumAmount: "",
      instructions: "",
    });
    setIconPreview("");
    setSelectedMethod(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormData({
      code: method.code,
      name: method.name,
      category: method.category,
      icon: method.icon,
      iconFile: null,
      fee: method.fee.toString(),
      feeType: method.feeType,
      description: method.description,
      isActive: method.isActive,
      displayOrder: method.displayOrder.toString(),
      midtransEnabled: method.midtransEnabled,
      minimumAmount: method.minimumAmount?.toString() || "",
      maximumAmount: method.maximumAmount?.toString() || "",
      instructions: method.instructions || "",
    });
    setIconPreview(method.icon); // Set existing icon as preview
    setShowModal(true);
  };

  // Handle payment code selection
  const handlePaymentCodeChange = (code: string) => {
    const selected = midtransPaymentCodes.find((pm) => pm.code === code);
    if (selected) {
      setFormData({
        ...formData,
        code: selected.code,
        name: selected.name,
        category: selected.category,
      });
    } else {
      setFormData({
        ...formData,
        code: "",
        name: "",
      });
    }
  };

  // Handle icon file upload
  const handleIconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar!");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 2MB!");
        return;
      }

      setFormData({ ...formData, iconFile: file });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let iconUrl = formData.icon;

      // Upload icon to Cloudinary if new file selected
      if (formData.iconFile) {
        setUploadingIcon(true);
        const uploadFormData = new FormData();
        uploadFormData.append("file", formData.iconFile);
        uploadFormData.append("folder", "payment-methods");

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Gagal upload icon");
        }

        iconUrl = uploadResult.url;
        setUploadingIcon(false);
      }

      const submitData = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        category: formData.category,
        icon: iconUrl,
        fee: parseFloat(formData.fee) || 0,
        feeType: formData.feeType,
        description: formData.description,
        isActive: formData.isActive,
        displayOrder: parseInt(formData.displayOrder) || 0,
        midtransEnabled: formData.midtransEnabled,
        minimumAmount: formData.minimumAmount
          ? parseFloat(formData.minimumAmount)
          : undefined,
        maximumAmount: formData.maximumAmount
          ? parseFloat(formData.maximumAmount)
          : undefined,
        instructions: formData.instructions,
      };

      const url = selectedMethod
        ? `/api/payment-methods/${selectedMethod._id}`
        : "/api/payment-methods";

      const method = selectedMethod ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          selectedMethod
            ? "Payment method berhasil diupdate!"
            : "Payment method berhasil ditambahkan!"
        );
        setShowModal(false);
        resetForm();
        fetchPaymentMethods();
      } else {
        throw new Error(result.error || "Terjadi kesalahan");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus payment method ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Payment method berhasil dihapus!");
        fetchPaymentMethods();
      } else {
        throw new Error(result.error || "Terjadi kesalahan");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus");
    }
  };

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const response = await fetch(`/api/payment-methods/${method._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...method,
          isActive: !method.isActive,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Payment method ${!method.isActive ? "diaktifkan" : "dinonaktifkan"}!`
        );
        fetchPaymentMethods();
      } else {
        throw new Error(result.error || "Terjadi kesalahan");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">Payment Methods</h1>
        <button
          onClick={openCreateModal}
          className="bg-green-600 text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-green-700 transition-colors border border-green-500"
        >
          + Tambah Payment Method
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1e293b] p-6 rounded-lg shadow border border-[#334155]">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[#1e3a8a] text-[#60a5fa] border border-[#1d4ed8]">
              💳
            </div>
            <div className="ml-4">
              <p className="text-sm text-[#94a3b8]">Total Methods</p>
              <h3 className="text-2xl font-bold text-[#f1f5f9]">
                {paymentMethods.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-lg shadow border border-[#334155]">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-900 text-green-400 border border-green-700">
              ✓
            </div>
            <div className="ml-4">
              <p className="text-sm text-[#94a3b8]">Active Methods</p>
              <h3 className="text-2xl font-bold text-[#f1f5f9]">
                {paymentMethods.filter((m) => m.isActive).length}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-lg shadow border border-[#334155]">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-900 text-purple-400 border border-purple-700">
              🔗
            </div>
            <div className="ml-4">
              <p className="text-sm text-[#94a3b8]">Midtrans Enabled</p>
              <h3 className="text-2xl font-bold text-[#f1f5f9]">
                {paymentMethods.filter((m) => m.midtransEnabled).length}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] rounded-lg shadow border border-[#334155]">
        <table className="min-w-full divide-y divide-[#334155]">
          <thead className="bg-[#334155]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                Payment Method
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                Midtrans
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#1e293b] divide-y divide-[#334155]">
            {paymentMethods.map((method) => (
              <tr key={method._id} className="hover:bg-[#334155]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {method.icon && method.icon.startsWith("http") ? (
                      <img
                        src={method.icon}
                        alt={method.name}
                        className="w-10 h-10 object-cover rounded mr-3"
                      />
                    ) : (
                      <span className="text-2xl mr-3">{method.icon}</span>
                    )}
                    <div>
                      <div className="text-sm font-medium text-[#f1f5f9]">
                        {method.name}
                      </div>
                      <div className="text-sm text-[#94a3b8]">{method.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f1f5f9] capitalize">
                  {method.category.replace("_", " ")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f1f5f9]">
                  {method.feeType === "percentage"
                    ? `${method.fee}%`
                    : `Rp ${method.fee.toLocaleString("id-ID")}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(method)}
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      method.isActive
                        ? "bg-green-900 text-green-200 border border-green-700"
                        : "bg-red-900 text-red-200 border border-red-700"
                    }`}
                  >
                    {method.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f1f5f9]">
                  {method.midtransEnabled ? "✓ Yes" : "✗ No"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openEditModal(method)}
                    className="text-[#60a5fa] hover:text-[#93c5fd] mr-4 border border-[#3b82f6] px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(method._id)}
                    className="text-red-400 hover:text-red-300 border border-red-500 px-3 py-1 rounded"
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paymentMethods.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#94a3b8] mb-4">Belum ada payment method</p>
            <button
              onClick={openCreateModal}
              className="bg-green-600 text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-green-700 transition-colors border border-green-500"
            >
              Tambah Payment Method Pertama
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a] bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[#334155]">
            <div className="flex items-center justify-between p-6 border-b border-[#334155]">
              <h3 className="text-lg font-medium text-[#f1f5f9]">
                {selectedMethod
                  ? "Edit Payment Method"
                  : "Tambah Payment Method Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#94a3b8] hover:text-[#e2e8f0]"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Payment Method Selector */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Pilih Payment Method *
                  </label>
                  <select
                    value={formData.code}
                    onChange={(e) => handlePaymentCodeChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    required
                    disabled={!!selectedMethod}
                  >
                    <option value="">-- Pilih Payment Method --</option>
                    <optgroup label="E-Wallet">
                      {midtransPaymentCodes
                        .filter((pm) => pm.category === "ewallet")
                        .map((pm) => (
                          <option key={pm.code} value={pm.code}>
                            {pm.code} - {pm.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="QRIS">
                      {midtransPaymentCodes
                        .filter((pm) => pm.category === "qris")
                        .map((pm) => (
                          <option key={pm.code} value={pm.code}>
                            {pm.code} - {pm.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Bank Transfer">
                      {midtransPaymentCodes
                        .filter((pm) => pm.category === "bank_transfer")
                        .map((pm) => (
                          <option key={pm.code} value={pm.code}>
                            {pm.code} - {pm.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Retail">
                      {midtransPaymentCodes
                        .filter((pm) => pm.category === "retail")
                        .map((pm) => (
                          <option key={pm.code} value={pm.code}>
                            {pm.code} - {pm.name}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Credit Card">
                      {midtransPaymentCodes
                        .filter((pm) => pm.category === "credit_card")
                        .map((pm) => (
                          <option key={pm.code} value={pm.code}>
                            {pm.code} - {pm.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  {selectedMethod && (
                    <p className="text-xs text-yellow-400 mt-1">
                      Kode tidak dapat diubah saat edit
                    </p>
                  )}
                </div>

                {/* Code (Read Only) */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Kode Payment Method
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    readOnly
                    className="w-full px-3 py-2 bg-[#475569] border border-[#334155] text-[#cbd5e1] rounded-md cursor-not-allowed"
                    placeholder="Pilih payment method dulu"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Nama Payment Method *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    placeholder="e.g., GoPay, BCA Virtual Account"
                    required
                  />
                </div>

                {/* Category (Auto-filled, can edit) */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Kategori *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    required
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Icon Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Icon Payment Method *
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconFileChange}
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-[#3b82f6] file:text-[#f1f5f9] hover:file:bg-[#1d4ed8]"
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Upload gambar icon (max 2MB)
                  </p>
                  {iconPreview && (
                    <div className="mt-2">
                      <p className="text-xs text-[#94a3b8] mb-1">Preview:</p>
                      <img
                        src={iconPreview}
                        alt="Icon Preview"
                        className="w-16 h-16 object-cover rounded border border-[#334155]"
                      />
                    </div>
                  )}
                </div>

                {/* Fee Type */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Tipe Fee *
                  </label>
                  <select
                    value={formData.feeType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        feeType: e.target.value as "fixed" | "percentage",
                      })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    required
                  >
                    <option value="fixed">Fixed (Nominal Rupiah)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                {/* Fee */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Fee Amount *
                  </label>
                  <input
                    type="number"
                    value={formData.fee}
                    onChange={(e) =>
                      setFormData({ ...formData, fee: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    placeholder={
                      formData.feeType === "fixed" ? "e.g., 2500" : "e.g., 0.7"
                    }
                    step={formData.feeType === "fixed" ? "1" : "0.01"}
                    min="0"
                    required
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    {formData.feeType === "fixed"
                      ? "Dalam Rupiah"
                      : "Dalam persen (e.g., 0.7 untuk 0.7%)"}
                  </p>
                </div>

                {/* Display Order */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Urutan Tampilan
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        displayOrder: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    placeholder="0"
                    min="0"
                  />
                </div>

                {/* Minimum Amount */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Minimal Transaksi (Opsional)
                  </label>
                  <input
                    type="number"
                    value={formData.minimumAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minimumAmount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    placeholder="e.g., 10000"
                    min="0"
                  />
                </div>

                {/* Maximum Amount */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Maksimal Transaksi (Opsional)
                  </label>
                  <input
                    type="number"
                    value={formData.maximumAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maximumAmount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                    placeholder="e.g., 5000000"
                    min="0"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  placeholder="Deskripsi singkat metode pembayaran"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Instruksi Pembayaran (Opsional)
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData({ ...formData, instructions: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  placeholder="Instruksi langkah-langkah pembayaran"
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-[#3b82f6] bg-[#334155] border-[#334155] rounded focus:ring-[#3b82f6]"
                  />
                  <label className="ml-2 text-sm text-[#cbd5e1]">
                    Aktifkan payment method ini
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.midtransEnabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        midtransEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-[#3b82f6] bg-[#334155] border-[#334155] rounded focus:ring-[#3b82f6]"
                  />
                  <label className="ml-2 text-sm text-[#cbd5e1]">
                    Integrasi dengan Midtrans
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSubmitting || uploadingIcon}
                  className="px-6 py-2 border border-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#334155] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingIcon}
                  className="px-6 py-2 bg-[#3b82f6] text-[#f1f5f9] rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingIcon
                    ? "Uploading icon..."
                    : isSubmitting
                    ? "Menyimpan..."
                    : selectedMethod
                    ? "Update"
                    : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
