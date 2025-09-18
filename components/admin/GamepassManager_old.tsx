"use client";

import { useState, useEffect } from "react";

interface GamepassItem {
  itemName: string;
  imgUrl: string;
  price: number;
  developer: string;
}

interface GamepassData {
  _id?: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  showOnHomepage: boolean;
  item: GamepassItem[];
  createdAt?: string;
  updatedAt?: string;
}

interface GamepassManagerProps {
  gamepass?: GamepassData;
  onUpdate?: (gamepass: GamepassData) => void;
  onDelete?: (id: string) => void;
  onCreate?: (gamepass: GamepassData) => void;
  onClose?: () => void;
  isCreate?: boolean;
  isDarkMode?: boolean;
}

export default function GamepassManager({
  gamepass,
  onUpdate,
  onDelete,
  onCreate,
  onClose,
  isCreate = false,
  isDarkMode = true, // Always dark mode
}: GamepassManagerProps) {
  const [editedGamepass, setEditedGamepass] = useState<GamepassData>(
    gamepass || {
      gameName: "",
      imgUrl: "",
      caraPesan: [""],
      features: [""],
      showOnHomepage: false,
      item: [{ itemName: "", imgUrl: "", price: 0, developer: "" }],
    }
  );
  const [isEditing, setIsEditing] = useState(isCreate);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (gamepass) {
      setEditedGamepass(gamepass);
    }
  }, [gamepass]);

  // Dark theme classes (permanent)
  const themeClasses = {
    container: "bg-gray-800 border-gray-700",
    text: "text-white",
    textSecondary: "text-gray-300",
    input:
      "bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400",
    button: {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      secondary: "bg-gray-600 hover:bg-gray-700 text-white border-gray-600",
      danger: "bg-red-600 hover:bg-red-700 text-white",
      success: "bg-green-600 hover:bg-green-700 text-white",
    },
    badge: {
      active: "bg-green-800 text-green-200",
      inactive: "bg-gray-700 text-gray-300",
    },
  };

  const handleToggleHomepage = async () => {
    if (!gamepass?._id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/gamepass/${gamepass._id}/homepage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          showOnHomepage: !gamepass.showOnHomepage,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onUpdate?.(result.data);
        alert("Status homepage berhasil diperbarui");
      } else {
        const result = await response.json();
        alert(result.message || "Gagal mengubah status homepage");
      }
    } catch (error) {
      console.error("Error toggling homepage:", error);
      alert("Terjadi kesalahan saat mengubah status homepage");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const url = isCreate ? "/api/gamepass" : `/api/gamepass/${gamepass?._id}`;
      const method = isCreate ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editedGamepass),
      });

      if (response.ok) {
        const result = await response.json();
        if (isCreate) {
          onCreate?.(result.data || result);
          alert("Gamepass berhasil dibuat");
        } else {
          onUpdate?.(result.data || result);
          alert("Gamepass berhasil diperbarui");
          setIsEditing(false);
        }
      } else {
        const result = await response.json();
        alert(result.error || "Gagal menyimpan gamepass");
      }
    } catch (error) {
      console.error("Error saving gamepass:", error);
      alert("Terjadi kesalahan saat menyimpan gamepass");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!gamepass?._id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/gamepass/${gamepass._id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onDelete?.(gamepass._id);
        alert("Gamepass berhasil dihapus");
      } else {
        const result = await response.json();
        alert(result.error || "Gagal menghapus gamepass");
      }
    } catch (error) {
      console.error("Error deleting gamepass:", error);
      alert("Terjadi kesalahan saat menghapus gamepass");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const addCaraPesan = () => {
    setEditedGamepass({
      ...editedGamepass,
      caraPesan: [...editedGamepass.caraPesan, ""],
    });
  };

  const removeCaraPesan = (index: number) => {
    setEditedGamepass({
      ...editedGamepass,
      caraPesan: editedGamepass.caraPesan.filter((_, i) => i !== index),
    });
  };

  const updateCaraPesan = (index: number, value: string) => {
    const updated = [...editedGamepass.caraPesan];
    updated[index] = value;
    setEditedGamepass({
      ...editedGamepass,
      caraPesan: updated,
    });
  };

  const addFeature = () => {
    setEditedGamepass({
      ...editedGamepass,
      features: [...editedGamepass.features, ""],
    });
  };

  const removeFeature = (index: number) => {
    setEditedGamepass({
      ...editedGamepass,
      features: editedGamepass.features.filter((_, i) => i !== index),
    });
  };

  const updateFeature = (index: number, value: string) => {
    const updated = [...editedGamepass.features];
    updated[index] = value;
    setEditedGamepass({
      ...editedGamepass,
      features: updated,
    });
  };

  const addItem = () => {
    setEditedGamepass({
      ...editedGamepass,
      item: [
        ...editedGamepass.item,
        { itemName: "", imgUrl: "", price: 0, developer: "" },
      ],
    });
  };

  const removeItem = (index: number) => {
    setEditedGamepass({
      ...editedGamepass,
      item: editedGamepass.item.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: keyof GamepassItem, value: any) => {
    const updated = [...editedGamepass.item];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setEditedGamepass({
      ...editedGamepass,
      item: updated,
    });
  };

  if (isCreate || isEditing) {
    return (
      <div className={`rounded-lg shadow p-6 mb-4 ${themeClasses.container}`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-lg font-semibold ${themeClasses.text}`}>
            {isCreate ? "Buat Gamepass Baru" : "Edit Gamepass"}
          </h3>
          <button
            onClick={() => {
              if (isCreate) {
                onClose?.();
              } else {
                setIsEditing(false);
                setEditedGamepass(gamepass!);
              }
            }}
            className="text-gray-400 hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Game Name */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${themeClasses.text}`}
            >
              Nama Game
            </label>
            <input
              type="text"
              value={editedGamepass.gameName}
              onChange={(e) =>
                setEditedGamepass({
                  ...editedGamepass,
                  gameName: e.target.value,
                })
              }
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${themeClasses.input}`}
              placeholder="Masukkan nama game"
            />
          </div>

          {/* Image URL */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${themeClasses.text}`}
            >
              URL Gambar Game
            </label>
            <input
              type="text"
              value={editedGamepass.imgUrl}
              onChange={(e) =>
                setEditedGamepass({
                  ...editedGamepass,
                  imgUrl: e.target.value,
                })
              }
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${themeClasses.input}`}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Show on Homepage */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showOnHomepage"
              checked={editedGamepass.showOnHomepage}
              onChange={(e) =>
                setEditedGamepass({
                  ...editedGamepass,
                  showOnHomepage: e.target.checked,
                })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="showOnHomepage"
              className={`ml-2 block text-sm ${themeClasses.text}`}
            >
              Tampilkan di Homepage
            </label>
          </div>

          {/* Cara Pesan */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${themeClasses.text}`}
            >
              Cara Pesan
            </label>
            {editedGamepass.caraPesan.map((cara, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={cara}
                  onChange={(e) => updateCaraPesan(index, e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 ${themeClasses.input}`}
                  placeholder={`Langkah ${index + 1}`}
                />
                <button
                  onClick={() => removeCaraPesan(index)}
                  className="px-3 py-2 text-red-400 hover:text-red-300"
                  disabled={editedGamepass.caraPesan.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addCaraPesan}
              className={`text-sm px-3 py-1 rounded ${themeClasses.button.primary}`}
            >
              + Tambah Langkah
            </button>
          </div>

          {/* Features */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${themeClasses.text}`}
            >
              Fitur
            </label>
            {editedGamepass.features.map((feature, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => updateFeature(index, e.target.value)}
                  className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 ${themeClasses.input}`}
                  placeholder={`Fitur ${index + 1}`}
                />
                <button
                  onClick={() => removeFeature(index)}
                  className="px-3 py-2 text-red-400 hover:text-red-300"
                  disabled={editedGamepass.features.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={addFeature}
              className={`text-sm px-3 py-1 rounded ${themeClasses.button.primary}`}
            >
              + Tambah Fitur
            </button>
          </div>

          {/* Items */}
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${themeClasses.text}`}
            >
              Items
            </label>
            {editedGamepass.item.map((item, index) => (
              <div
                key={index}
                className={`p-4 border rounded mb-4 ${themeClasses.container}`}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${themeClasses.text}`}
                    >
                      Nama Item
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) =>
                        updateItem(index, "itemName", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${themeClasses.input}`}
                      placeholder="Nama item"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${themeClasses.text}`}
                    >
                      URL Gambar Item
                    </label>
                    <input
                      type="text"
                      value={item.imgUrl}
                      onChange={(e) =>
                        updateItem(index, "imgUrl", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${themeClasses.input}`}
                      placeholder="https://example.com/item.jpg"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${themeClasses.text}`}
                    >
                      Harga
                    </label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "price",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${themeClasses.input}`}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-sm font-medium mb-1 ${themeClasses.text}`}
                    >
                      Developer
                    </label>
                    <input
                      type="text"
                      value={item.developer}
                      onChange={(e) =>
                        updateItem(index, "developer", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${themeClasses.input}`}
                      placeholder="Nama developer"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => removeItem(index)}
                    className="px-3 py-1 text-red-400 hover:text-red-300"
                    disabled={editedGamepass.item.length === 1}
                  >
                    Hapus Item
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addItem}
              className={`text-sm px-3 py-1 rounded ${themeClasses.button.primary}`}
            >
              + Tambah Item
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                if (isCreate) {
                  onClose?.();
                } else {
                  setIsEditing(false);
                  setEditedGamepass(gamepass!);
                }
              }}
              className={`px-4 py-2 rounded border ${themeClasses.button.secondary}`}
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`px-4 py-2 rounded disabled:opacity-50 ${themeClasses.button.primary}`}
            >
              {loading ? "Menyimpan..." : isCreate ? "Buat" : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow p-6 mb-4 ${themeClasses.container}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-3">
            <img
              src={gamepass?.imgUrl}
              alt={gamepass?.gameName}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <h3 className={`text-xl font-semibold ${themeClasses.text}`}>
                {gamepass?.gameName}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  gamepass?.showOnHomepage
                    ? themeClasses.badge.active
                    : themeClasses.badge.inactive
                }`}
              >
                {gamepass?.showOnHomepage
                  ? "Tampil di Homepage"
                  : "Tidak Tampil"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cara Pesan */}
            <div>
              <h4 className={`font-medium mb-2 ${themeClasses.text}`}>
                Cara Pesan:
              </h4>
              <ol
                className={`list-decimal list-inside space-y-1 ${themeClasses.textSecondary}`}
              >
                {gamepass?.caraPesan.map((cara, index) => (
                  <li key={index}>{cara}</li>
                ))}
              </ol>
            </div>

            {/* Features */}
            <div>
              <h4 className={`font-medium mb-2 ${themeClasses.text}`}>
                Fitur:
              </h4>
              <ul
                className={`list-disc list-inside space-y-1 ${themeClasses.textSecondary}`}
              >
                {gamepass?.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Items */}
          <div className="mt-6">
            <h4 className={`font-medium mb-3 ${themeClasses.text}`}>
              Items ({gamepass?.item.length}):
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gamepass?.item.map((item, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${themeClasses.container} border-gray-600`}
                >
                  <img
                    src={item.imgUrl}
                    alt={item.itemName}
                    className="w-full h-24 object-cover rounded mb-2"
                  />
                  <h5 className={`font-medium ${themeClasses.text}`}>
                    {item.itemName}
                  </h5>
                  <p className={`text-sm ${themeClasses.textSecondary}`}>
                    by {item.developer}
                  </p>
                  <p className={`text-sm font-medium ${themeClasses.text}`}>
                    Rp {item.price.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          <button
            onClick={handleToggleHomepage}
            disabled={loading}
            className={`px-3 py-1 text-xs rounded disabled:opacity-50 ${
              gamepass?.showOnHomepage
                ? themeClasses.button.secondary
                : themeClasses.button.success
            }`}
          >
            {loading
              ? "Loading..."
              : gamepass?.showOnHomepage
              ? "Sembunyikan"
              : "Tampilkan"}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className={`px-3 py-1 text-xs rounded ${themeClasses.button.primary}`}
          >
            Edit
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className={`px-3 py-1 text-xs rounded ${themeClasses.button.danger}`}
          >
            Hapus
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`rounded-lg p-6 max-w-md w-full mx-4 ${themeClasses.container}`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${themeClasses.text}`}>
              Konfirmasi Hapus
            </h3>
            <p className={`mb-6 ${themeClasses.textSecondary}`}>
              Apakah Anda yakin ingin menghapus gamepass "{gamepass?.gameName}"?
              Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2 rounded border ${themeClasses.button.secondary}`}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className={`px-4 py-2 rounded disabled:opacity-50 ${themeClasses.button.danger}`}
              >
                {loading ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
