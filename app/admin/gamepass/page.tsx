"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

interface GamepassItem {
  itemName: string;
  imgUrl: string;
  price: number;
}

interface Gamepass {
  _id: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  item: GamepassItem[];
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
    imageFile?: File;
    imgUrl?: string;
  }[];
  gameImageFile?: File;
}

export default function GamepassPage() {
  const { user } = useAuth();
  const [gamepasses, setGamepasses] = useState<Gamepass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedGamepass, setSelectedGamepass] = useState<Gamepass | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    gameName: "",
    caraPesan: [""],
    features: [""],
    items: [{ itemName: "", price: "", imageFile: undefined }],
    gameImageFile: undefined,
  });

  useEffect(() => {
    if (user) {
      fetchGamepasses();
    }
  }, [user]);

  const fetchGamepasses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gamepass?admin=true");
      const data = await response.json();

      if (response.ok) {
        setGamepasses(data.gamepasses);
      } else {
        console.error("Error fetching gamepasses:", data.error);
      }
    } catch (error) {
      console.error("Error fetching gamepasses:", error);
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
      items: [{ itemName: "", price: "", imageFile: undefined }],
      gameImageFile: undefined,
    });
    setSelectedGamepass(null);
  };

  // Open modal for create
  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (gamepass: Gamepass) => {
    setSelectedGamepass(gamepass);
    setFormData({
      gameName: gamepass.gameName,
      caraPesan: gamepass.caraPesan,
      features: gamepass.features,
      items: gamepass.item.map((item) => ({
        itemName: item.itemName,
        price: item.price.toString(),
        imgUrl: item.imgUrl,
        imageFile: undefined,
      })),
      gameImageFile: undefined,
    });
    setShowModal(true);
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle array input changes
  const handleArrayInputChange = (
    field: keyof FormData,
    index: number,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).map((item, i) =>
        i === index ? value : item
      ),
    }));
  };

  // Add array item
  const addArrayItem = (field: keyof FormData) => {
    if (field === "items") {
      setFormData((prev) => ({
        ...prev,
        [field]: [
          ...prev[field],
          { itemName: "", price: "", imageFile: undefined },
        ],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: [...(prev[field] as string[]), ""],
      }));
    }
  };

  // Remove array item
  const removeArrayItem = (field: keyof FormData, index: number) => {
    if (field === "items") {
      setFormData((prev) => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: (prev[field] as string[]).filter((_, i) => i !== index),
      }));
    }
  };

  // Handle item changes
  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("gameName", formData.gameName);
      formDataToSend.append(
        "caraPesan",
        JSON.stringify(formData.caraPesan.filter((item) => item.trim()))
      );
      formDataToSend.append(
        "features",
        JSON.stringify(formData.features.filter((item) => item.trim()))
      );

      // Process items
      const itemsData = formData.items.map((item) => ({
        itemName: item.itemName,
        price: item.price,
        imgUrl: item.imgUrl || "", // For edit mode
      }));
      formDataToSend.append("items", JSON.stringify(itemsData));

      // Add game image
      if (formData.gameImageFile) {
        formDataToSend.append("gameImage", formData.gameImageFile);
      }

      // Add item images
      formData.items.forEach((item, index) => {
        if (item.imageFile) {
          formDataToSend.append(`itemImage_${index}`, item.imageFile);
        }
      });

      const url = selectedGamepass
        ? `/api/gamepass/${selectedGamepass._id}`
        : "/api/gamepass";

      const method = selectedGamepass ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        alert(
          selectedGamepass
            ? "Gamepass berhasil diupdate"
            : "Gamepass berhasil dibuat"
        );
        setShowModal(false);
        resetForm();
        fetchGamepasses();
      } else {
        alert(data.error || "Terjadi kesalahan");
      }
    } catch (error) {
      console.error("Error saving gamepass:", error);
      toast.error("Terjadi kesalahan saat menyimpan");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete gamepass
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus gamepass ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/gamepass/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Gamepass berhasil dihapus");
        fetchGamepasses();
      } else {
        const data = await response.json();
        alert(data.error || "Gagal menghapus gamepass");
      }
    } catch (error) {
      console.error("Error deleting gamepass:", error);
      toast.error("Terjadi kesalahan saat menghapus");
    }
  };

  // Create sample data
  const createSampleData = async () => {
    try {
      const response = await fetch("/api/gamepass/sample", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Sample data berhasil dibuat: ${data.count} gamepass`);
        fetchGamepasses();
      } else {
        alert(data.error || "Gagal membuat sample data");
      }
    } catch (error) {
      console.error("Error creating sample data:", error);
      toast.error("Terjadi kesalahan saat membuat sample data");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 bg-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Kelola Gamepass</h1>
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
            Tambah Gamepass
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
                Total Gamepass
              </p>
              <p className="text-2xl font-bold text-white">
                {gamepasses.length}
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
                {gamepasses.reduce(
                  (sum, gamepass) => sum + gamepass.item.length,
                  0
                )}
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
                {gamepasses.length > 0
                  ? Math.round(
                      gamepasses.reduce(
                        (sum, gamepass) =>
                          sum +
                          gamepass.item.reduce(
                            (itemSum, item) => itemSum + item.price,
                            0
                          ),
                        0
                      ) /
                        gamepasses.reduce(
                          (sum, gamepass) => sum + gamepass.item.length,
                          0
                        )
                    ).toLocaleString()
                  : "0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gamepass List */}
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
              {gamepasses.map((gamepass) => (
                <tr key={gamepass._id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={gamepass.imgUrl}
                        alt={gamepass.gameName}
                        className="h-12 w-12 rounded-lg object-cover mr-4"
                      />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {gamepass.gameName}
                        </div>
                        <div className="text-sm text-gray-400">
                          {gamepass.caraPesan.length} cara pesan
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {gamepass.item.length} items
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {gamepass.features.length} features
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(gamepass.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(gamepass)}
                      className="text-blue-400 hover:text-blue-300 mr-4 border border-blue-500 px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(gamepass._id)}
                      className="text-red-400 hover:text-red-300 border border-red-500 px-3 py-1 rounded"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {gamepasses.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">Belum ada gamepass</p>
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
                {selectedGamepass ? "Edit Gamepass" : "Tambah Gamepass Baru"}
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
                  Gambar Game {!selectedGamepass ? "*" : ""}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleInputChange("gameImageFile", e.target.files?.[0])
                  }
                  required={!selectedGamepass}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {selectedGamepass && (
                  <div className="mt-2">
                    <img
                      src={selectedGamepass.imgUrl}
                      alt="Current"
                      className="h-20 w-32 object-cover rounded"
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
                        handleArrayInputChange(
                          "caraPesan",
                          index,
                          e.target.value
                        )
                      }
                      placeholder={`Langkah ${index + 1}`}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.caraPesan.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("caraPesan", index)}
                        className="px-3 py-2 text-red-400 border border-red-600 rounded-md hover:bg-red-900 hover:bg-opacity-20"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem("caraPesan")}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  + Tambah Langkah
                </button>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fitur *
                </label>
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) =>
                        handleArrayInputChange(
                          "features",
                          index,
                          e.target.value
                        )
                      }
                      placeholder={`Fitur ${index + 1}`}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("features", index)}
                        className="px-3 py-2 text-red-400 border border-red-600 rounded-md hover:bg-red-900 hover:bg-opacity-20"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem("features")}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  + Tambah Fitur
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
                    className="border border-gray-600 bg-gray-700 rounded-lg p-4 mb-4"
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
                          required
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
                          required
                          min="0"
                          className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Gambar Item{" "}
                        {!selectedGamepass || !item.imgUrl ? "*" : ""}
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
                        required={!selectedGamepass || !item.imgUrl}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {item.imgUrl && (
                        <img
                          src={item.imgUrl}
                          alt="Current"
                          className="mt-2 h-20 w-20 object-cover rounded"
                        />
                      )}
                    </div>
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem("items", index)}
                        className="mt-2 text-red-400 hover:text-red-300 text-sm border border-red-500 px-2 py-1 rounded"
                      >
                        Hapus Item
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem("items")}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  + Tambah Item
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-300 border border-gray-600 rounded-md hover:bg-gray-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 border border-blue-500"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : selectedGamepass
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
