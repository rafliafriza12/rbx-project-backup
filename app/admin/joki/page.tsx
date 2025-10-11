"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

interface JokiItem {
  itemName: string;
  imgUrl: string;
  price: number;
  description: string;
  syaratJoki: string[];
  prosesJoki: string[];
}

interface Joki {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  item: JokiItem[];
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  gameName: string;
  caraPesan: string[];
  features: string[];
  items: {
    itemName: string;
    price: string;
    description: string;
    syaratJoki: string[];
    prosesJoki: string[];
    imageFile?: File;
    imgUrl?: string;
  }[];
  gameImageFile?: File;
}

export default function JokiPage() {
  const { user } = useAuth();
  const [jokiServices, setJokiServices] = useState<Joki[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedJoki, setSelectedJoki] = useState<Joki | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    gameName: "",
    caraPesan: [""],
    features: [""],
    items: [
      {
        itemName: "",
        price: "",
        description: "",
        syaratJoki: [""],
        prosesJoki: [""],
        imageFile: undefined,
      },
    ],
    gameImageFile: undefined,
  });

  useEffect(() => {
    if (user) {
      fetchJokiServices();
    }
  }, [user]);

  const fetchJokiServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/joki?admin=true");
      const data = await response.json();

      if (response.ok) {
        setJokiServices(data.jokiServices || []);
      } else {
        console.error("Error fetching joki services:", data.error);
      }
    } catch (error) {
      console.error("Error fetching joki services:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      gameName: "",
      caraPesan: [""],
      features: [""],
      items: [
        {
          itemName: "",
          price: "",
          description: "",
          syaratJoki: [""],
          prosesJoki: [""],
          imageFile: undefined,
        },
      ],
      gameImageFile: undefined,
    });
    setSelectedJoki(null);
  };

  // Open modal for create
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (joki: Joki) => {
    console.log("Opening edit modal for:", joki);
    setSelectedJoki(joki);
    const mappedItems = joki.item.map((item) => ({
      itemName: item.itemName,
      price: item.price.toString(),
      description: item.description,
      syaratJoki:
        item.syaratJoki && item.syaratJoki.length > 0 ? item.syaratJoki : [""],
      prosesJoki:
        item.prosesJoki && item.prosesJoki.length > 0 ? item.prosesJoki : [""],
      imgUrl: item.imgUrl,
    }));
    console.log("Mapped items:", mappedItems);
    setFormData({
      gameName: joki.gameName,
      caraPesan: joki.caraPesan.length > 0 ? joki.caraPesan : [""],
      features: joki.features.length > 0 ? joki.features : [""],
      items: mappedItems,
    });
    setShowModal(true);
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle array field changes
  const handleArrayChange = (
    field: "caraPesan" | "features",
    index: number,
    value: string
  ) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData((prev) => ({
      ...prev,
      [field]: newArray,
    }));
  };

  // Add array field
  const addArrayField = (field: "caraPesan" | "features") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  // Remove array field
  const removeArrayField = (field: "caraPesan" | "features", index: number) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter(
        (_: any, i: number) => i !== index
      );
      setFormData((prev) => ({
        ...prev,
        [field]: newArray,
      }));
    }
  };

  // Handle item changes
  const handleItemChange = (
    index: number,
    field: keyof FormData["items"][0],
    value: any
  ) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  // Add item
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemName: "",
          price: "",
          description: "",
          syaratJoki: [""],
          prosesJoki: [""],
          imageFile: undefined,
        },
      ],
    }));
  };

  // Handle item array changes (for syaratJoki and prosesJoki)
  const handleItemArrayChange = (
    itemIndex: number,
    field: "syaratJoki" | "prosesJoki",
    arrayIndex: number,
    value: string
  ) => {
    const newItems = [...formData.items];
    const newArray = [...newItems[itemIndex][field]];
    newArray[arrayIndex] = value;
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      [field]: newArray,
    };
    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  // Add item array field
  const addItemArrayField = (
    itemIndex: number,
    field: "syaratJoki" | "prosesJoki"
  ) => {
    const newItems = [...formData.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      [field]: [...newItems[itemIndex][field], ""],
    };
    setFormData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  // Remove item array field
  const removeItemArrayField = (
    itemIndex: number,
    field: "syaratJoki" | "prosesJoki",
    arrayIndex: number
  ) => {
    const newItems = [...formData.items];
    if (newItems[itemIndex][field].length > 1) {
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        [field]: newItems[itemIndex][field].filter(
          (_: any, i: number) => i !== arrayIndex
        ),
      };
      setFormData((prev) => ({
        ...prev,
        items: newItems,
      }));
    }
  };

  // Remove item
  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData((prev) => ({
        ...prev,
        items: newItems,
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = new FormData();

      // Add basic fields
      submitData.append("gameName", formData.gameName);
      submitData.append(
        "caraPesan",
        JSON.stringify(formData.caraPesan.filter((item) => item.trim()))
      );
      submitData.append(
        "features",
        JSON.stringify(formData.features.filter((item) => item.trim()))
      );

      // Add game image if provided
      if (formData.gameImageFile) {
        submitData.append("gameImage", formData.gameImageFile);
      }

      // Add items with syaratJoki and prosesJoki
      const itemsData = formData.items.map((item, index) => ({
        itemName: item.itemName,
        price: parseFloat(item.price),
        description: item.description,
        syaratJoki: item.syaratJoki.filter((s) => s.trim()),
        prosesJoki: item.prosesJoki.filter((p) => p.trim()),
        imgUrl: item.imgUrl,
        imageIndex: item.imageFile ? index : undefined,
      }));

      submitData.append("items", JSON.stringify(itemsData));

      // Add item images
      formData.items.forEach((item, index) => {
        if (item.imageFile) {
          submitData.append(`itemImage_${index}`, item.imageFile);
        }
      });

      const url = selectedJoki ? `/api/joki/${selectedJoki._id}` : "/api/joki";

      const method = selectedJoki ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: submitData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        throw new Error(errorData.error || "Terjadi kesalahan");
      }

      const data = await response.json();

      toast.success(
        selectedJoki
          ? "Joki service berhasil diupdate!"
          : "Joki service berhasil ditambahkan!"
      );
      setShowModal(false);
      resetForm();
      fetchJokiServices();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus joki service ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/joki/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delete error:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          throw new Error(`Server error: ${response.status}`);
        }
        throw new Error(errorData.error || "Terjadi kesalahan");
      }

      const data = await response.json();
      toast.success("Joki service berhasil dihapus!");
      fetchJokiServices();
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus");
    }
  };

  // Create sample data
  const createSampleData = async () => {
    try {
      const sampleData = {
        gameName: "Mobile Legends",
        caraPesan: ["Login akun", "Tunggu proses", "Selesai"],
        features: ["Rank up cepat", "Winrate tinggi", "Hero baru"],
        requirements: ["Username", "Password", "Rank target"],
        items: [
          {
            itemName: "Epic Rank Boost",
            price: 50000,
            description: "Boost rank dari Master ke Epic",
            imgUrl: "/joki1.png",
          },
          {
            itemName: "Legend Rank Boost",
            price: 100000,
            description: "Boost rank dari Epic ke Legend",
            imgUrl: "/joki2.png",
          },
        ],
      };

      const response = await fetch("/api/joki", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sampleData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Sample data berhasil dibuat!");
        fetchJokiServices();
      } else {
        throw new Error(data.error || "Terjadi kesalahan");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(
        error.message || "Terjadi kesalahan saat membuat sample data"
      );
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-[#94a3b8]">Silakan login terlebih dahulu</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 bg-[#0f172a]"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="flex mb-4" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <a
              href="/admin/dashboard"
              className="inline-flex items-center text-sm font-medium text-[#cbd5e1] hover:text-[#60a5fa]"
            >
              Dashboard
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-[#94a3b8]"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 text-sm font-medium text-[#94a3b8] md:ml-2">
                Joki Services
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#f1f5f9]">
          Kelola Joki Services
        </h1>
        <div className="flex gap-2">
          {/* <button
            onClick={createSampleData}
            className="bg-green-600 text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-green-700 transition-colors border border-green-500"
          >
            Buat Sample Data
          </button> */}
          <button
            onClick={openCreateModal}
            className="bg-[#3b82f6] text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition-colors border border-[#3b82f6]"
          >
            Tambah Joki Service
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1e293b] p-6 rounded-lg shadow border border-[#334155]">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-[#1e3a8a] text-[#60a5fa] border border-[#1d4ed8]">
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
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[#cbd5e1]">
                Total Joki Services
              </p>
              <p className="text-2xl font-bold text-[#f1f5f9]">
                {jokiServices.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-lg shadow border border-[#334155]">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-900 text-green-400 border border-green-700">
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[#cbd5e1]">Total Items</p>
              <p className="text-2xl font-bold text-[#f1f5f9]">
                {jokiServices.reduce((sum, joki) => sum + joki.item.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#1e293b] p-6 rounded-lg shadow border border-[#334155]">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-900 text-purple-400 border border-purple-700">
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-[#cbd5e1]">
                Rata-rata Harga
              </p>
              <p className="text-2xl font-bold text-[#f1f5f9]">
                Rp{" "}
                {jokiServices.length > 0
                  ? Math.round(
                      jokiServices.reduce(
                        (sum, joki) =>
                          sum +
                          joki.item.reduce(
                            (itemSum, item) => itemSum + item.price,
                            0
                          ),
                        0
                      ) /
                        jokiServices.reduce(
                          (sum, joki) => sum + joki.item.length,
                          0
                        )
                    ).toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Joki Services List */}
      <div className="bg-[#1e293b] rounded-lg shadow border border-[#334155]">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-[#334155]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider border-b border-[#334155]">
                  Game
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider border-b border-[#334155]">
                  Jumlah Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider border-b border-[#334155]">
                  Requirements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider border-b border-[#334155]">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider border-b border-[#334155]">
                  Tanggal Dibuat
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[#cbd5e1] uppercase tracking-wider border-b border-[#334155]">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#1e293b] divide-y divide-[#334155]">
              {jokiServices.map((joki) => (
                <tr key={joki._id} className="hover:bg-[#334155]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={joki.imgUrl}
                        alt={joki.gameName}
                        className="h-12 w-12 rounded-lg object-cover mr-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-[#f1f5f9]">
                          {joki.gameName}
                        </div>
                        <div className="text-sm text-[#94a3b8]">
                          {joki.caraPesan.length} cara pesan
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#f1f5f9]">
                    {joki.item.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#cbd5e1]">
                    {joki.features.length} features
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#cbd5e1]">
                    {new Date(joki.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(joki)}
                      className="text-[#60a5fa] hover:text-[#93c5fd] mr-4 border border-[#3b82f6] px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(joki._id)}
                      className="text-red-400 hover:text-red-300 border border-red-500 px-3 py-1 rounded"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {jokiServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#94a3b8] mb-4">Belum ada joki service</p>
              <button
                onClick={createSampleData}
                className="bg-green-600 text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-green-700 transition-colors border border-green-500"
              >
                Buat Sample Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b]/70 backdrop-blur-2xl rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#334155]">
              <h3 className="text-lg font-medium text-[#f1f5f9]">
                {selectedJoki
                  ? "Edit Joki Service"
                  : "Tambah Joki Service Baru"}
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
              {/* Game Name */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Nama Game *
                </label>
                <input
                  type="text"
                  value={formData.gameName}
                  onChange={(e) =>
                    handleInputChange("gameName", e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                />
              </div>

              {/* Game Image */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Gambar Game {!selectedJoki ? "*" : ""}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleInputChange("gameImageFile", e.target.files?.[0])
                  }
                  required={!selectedJoki}
                  className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                />
                {selectedJoki && (
                  <div className="mt-2">
                    <img
                      src={selectedJoki.imgUrl}
                      alt="Current"
                      className="h-20 w-20 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              {/* Cara Pesan */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Cara Pesan *
                </label>
                {formData.caraPesan.map((cara, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={cara}
                      onChange={(e) =>
                        handleArrayChange("caraPesan", index, e.target.value)
                      }
                      placeholder={`Langkah ${index + 1}`}
                      className="flex-1 px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField("caraPesan", index)}
                      className="px-3 py-2 bg-red-600 text-[#f1f5f9] rounded-md hover:bg-red-700 border border-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField("caraPesan")}
                  className="mt-2 px-4 py-2 bg-[#3b82f6] text-[#f1f5f9] rounded-md hover:bg-[#1d4ed8] border border-[#3b82f6]"
                >
                  Tambah Langkah
                </button>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Features *
                </label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) =>
                        handleArrayChange("features", index, e.target.value)
                      }
                      placeholder={`Feature ${index + 1}`}
                      className="flex-1 px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField("features", index)}
                      className="px-3 py-2 bg-red-600 text-[#f1f5f9] rounded-md hover:bg-red-700 border border-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField("features")}
                  className="mt-2 px-4 py-2 bg-[#3b82f6] text-[#f1f5f9] rounded-md hover:bg-[#1d4ed8] border border-[#3b82f6]"
                >
                  Tambah Feature
                </button>
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Items *
                </label>
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-[#334155] p-4 rounded-md mb-4 bg-[#334155]"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                          Nama Item
                        </label>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) =>
                            handleItemChange(index, "itemName", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-[#475569] border border-[#475569] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                          Harga (Rp)
                        </label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-[#475569] border border-[#475569] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                          Deskripsi
                        </label>
                        <textarea
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full px-3 py-2 bg-[#475569] border border-[#475569] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        />
                      </div>

                      {/* Syarat Joki */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                          Syarat Joki *
                        </label>
                        {item.syaratJoki.map((syarat, syaratIndex) => (
                          <div key={syaratIndex} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={syarat}
                              onChange={(e) =>
                                handleItemArrayChange(
                                  index,
                                  "syaratJoki",
                                  syaratIndex,
                                  e.target.value
                                )
                              }
                              placeholder={`Syarat ${syaratIndex + 1}`}
                              className="flex-1 px-3 py-2 bg-[#475569] border border-[#475569] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeItemArrayField(
                                  index,
                                  "syaratJoki",
                                  syaratIndex
                                )
                              }
                              className="px-3 py-2 bg-red-600 text-[#f1f5f9] rounded-md hover:bg-red-700 border border-red-500"
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addItemArrayField(index, "syaratJoki")}
                          className="mt-1 px-3 py-1.5 bg-green-600 text-[#f1f5f9] text-sm rounded-md hover:bg-green-700 border border-green-500"
                        >
                          Tambah Syarat
                        </button>
                      </div>

                      {/* Proses Joki */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                          Proses Joki *
                        </label>
                        {item.prosesJoki.map((proses, prosesIndex) => (
                          <div key={prosesIndex} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={proses}
                              onChange={(e) =>
                                handleItemArrayChange(
                                  index,
                                  "prosesJoki",
                                  prosesIndex,
                                  e.target.value
                                )
                              }
                              placeholder={`Proses ${prosesIndex + 1}`}
                              className="flex-1 px-3 py-2 bg-[#475569] border border-[#475569] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeItemArrayField(
                                  index,
                                  "prosesJoki",
                                  prosesIndex
                                )
                              }
                              className="px-3 py-2 bg-red-600 text-[#f1f5f9] rounded-md hover:bg-red-700 border border-red-500"
                            >
                              Hapus
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addItemArrayField(index, "prosesJoki")}
                          className="mt-1 px-3 py-1.5 bg-green-600 text-[#f1f5f9] text-sm rounded-md hover:bg-green-700 border border-green-500"
                        >
                          Tambah Proses
                        </button>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                          Gambar Item
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "imageFile",
                              e.target.files?.[0]
                            )
                          }
                          className="w-full px-3 py-2 bg-[#475569] border border-[#475569] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6]"
                        />
                        {item.imgUrl && (
                          <div className="mt-2">
                            <img
                              src={item.imgUrl}
                              alt="Current"
                              className="h-20 w-20 object-cover rounded"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="mt-3 px-3 py-2 bg-red-600 text-[#f1f5f9] rounded-md hover:bg-red-700 border border-red-500"
                    >
                      Hapus Item
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-[#3b82f6] text-[#f1f5f9] rounded-md hover:bg-[#1d4ed8] border border-[#3b82f6]"
                >
                  Tambah Item
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-[#334155]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#475569] text-[#f1f5f9] rounded-md hover:bg-[#334155] border border-[#475569]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#3b82f6] text-[#f1f5f9] rounded-md hover:bg-[#1d4ed8] disabled:bg-[#60a5fa] border border-[#3b82f6]"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : selectedJoki
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
