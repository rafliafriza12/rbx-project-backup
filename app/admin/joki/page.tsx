"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

interface JokiItem {
  itemName: string;
  imgUrl: string;
  price: number;
  description: string;
}

interface Joki {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  requirements: string[];
  item: JokiItem[];
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  gameName: string;
  caraPesan: string[];
  features: string[];
  requirements: string[];
  items: {
    itemName: string;
    price: string;
    description: string;
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
    requirements: [""],
    items: [{ itemName: "", price: "", description: "", imageFile: undefined }],
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
      requirements: [""],
      items: [
        { itemName: "", price: "", description: "", imageFile: undefined },
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
    setSelectedJoki(joki);
    setFormData({
      gameName: joki.gameName,
      caraPesan: joki.caraPesan.length > 0 ? joki.caraPesan : [""],
      features: joki.features.length > 0 ? joki.features : [""],
      requirements: joki.requirements.length > 0 ? joki.requirements : [""],
      items: joki.item.map((item) => ({
        itemName: item.itemName,
        price: item.price.toString(),
        description: item.description,
        imgUrl: item.imgUrl,
      })),
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
    field: "caraPesan" | "features" | "requirements",
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
  const addArrayField = (field: "caraPesan" | "features" | "requirements") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  // Remove array field
  const removeArrayField = (
    field: "caraPesan" | "features" | "requirements",
    index: number
  ) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
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
        { itemName: "", price: "", description: "", imageFile: undefined },
      ],
    }));
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
      submitData.append(
        "requirements",
        JSON.stringify(formData.requirements.filter((item) => item.trim()))
      );

      // Add game image if provided
      if (formData.gameImageFile) {
        submitData.append("gameImage", formData.gameImageFile);
      }

      // Add items
      const itemsData = formData.items.map((item, index) => ({
        itemName: item.itemName,
        price: parseFloat(item.price),
        description: item.description,
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

      const url = selectedJoki
        ? `/api/joki?id=${selectedJoki._id}`
        : "/api/joki";

      const method = selectedJoki ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          selectedJoki
            ? "Joki service berhasil diupdate!"
            : "Joki service berhasil ditambahkan!"
        );
        setShowModal(false);
        resetForm();
        fetchJokiServices();
      } else {
        throw new Error(data.error || "Terjadi kesalahan");
      }
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
      const response = await fetch(`/api/joki?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Joki service berhasil dihapus!");
        fetchJokiServices();
      } else {
        throw new Error(data.error || "Terjadi kesalahan");
      }
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
        <p className="text-gray-400">Silakan login terlebih dahulu</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 bg-gray-900"></div>
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
              className="inline-flex items-center text-sm font-medium text-gray-300 hover:text-blue-400"
            >
              Dashboard
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-400 md:ml-2">
                Joki Services
              </span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Kelola Joki Services</h1>
        <div className="flex gap-2">
          <button
            onClick={createSampleData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors border border-green-500"
          >
            Buat Sample Data
          </button>
          <button
            onClick={openCreateModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors border border-blue-500"
          >
            Tambah Joki Service
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-900 text-blue-400 border border-blue-700">
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
              <p className="text-sm font-medium text-gray-300">
                Total Joki Services
              </p>
              <p className="text-2xl font-bold text-white">
                {jokiServices.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
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
              <p className="text-sm font-medium text-gray-300">Total Items</p>
              <p className="text-2xl font-bold text-white">
                {jokiServices.reduce((sum, joki) => sum + joki.item.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
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
              <p className="text-sm font-medium text-gray-300">
                Rata-rata Harga
              </p>
              <p className="text-2xl font-bold text-white">
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
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                  Game
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                  Jumlah Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                  Requirements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                  Features
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                  Tanggal Dibuat
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider border-b border-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {jokiServices.map((joki) => (
                <tr key={joki._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={joki.imgUrl}
                        alt={joki.gameName}
                        className="h-12 w-12 rounded-lg object-cover mr-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {joki.gameName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {joki.caraPesan.length} cara pesan
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {joki.item.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {joki.requirements.length} requirements
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {joki.features.length} features
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(joki.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(joki)}
                      className="text-blue-400 hover:text-blue-300 mr-4 border border-blue-500 px-3 py-1 rounded"
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
              <p className="text-gray-400 mb-4">Belum ada joki service</p>
              <button
                onClick={createSampleData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors border border-green-500"
              >
                Buat Sample Data
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">
                {selectedJoki
                  ? "Edit Joki Service"
                  : "Tambah Joki Service Baru"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-200"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nama Game *
                </label>
                <input
                  type="text"
                  value={formData.gameName}
                  onChange={(e) =>
                    handleInputChange("gameName", e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Game Image */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gambar Game {!selectedJoki ? "*" : ""}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleInputChange("gameImageFile", e.target.files?.[0])
                  }
                  required={!selectedJoki}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField("caraPesan", index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 border border-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField("caraPesan")}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 border border-blue-500"
                >
                  Tambah Langkah
                </button>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
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
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField("features", index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 border border-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField("features")}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 border border-blue-500"
                >
                  Tambah Feature
                </button>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Requirements *
                </label>
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={requirement}
                      onChange={(e) =>
                        handleArrayChange("requirements", index, e.target.value)
                      }
                      placeholder={`Requirement ${index + 1}`}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayField("requirements", index)}
                      className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 border border-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField("requirements")}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 border border-blue-500"
                >
                  Tambah Requirement
                </button>
              </div>

              {/* Items */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Items *
                </label>
                {formData.items.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-600 p-4 rounded-md mb-4 bg-gray-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Nama Item
                        </label>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) =>
                            handleItemChange(index, "itemName", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Harga (Rp)
                        </label>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) =>
                            handleItemChange(index, "price", e.target.value)
                          }
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
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
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
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
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="mt-3 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 border border-red-500"
                    >
                      Hapus Item
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 border border-blue-500"
                >
                  Tambah Item
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 border border-gray-500"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 border border-blue-500"
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
