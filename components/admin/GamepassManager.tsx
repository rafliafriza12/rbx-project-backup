"use client";

import { useState, useEffect } from "react";

interface GamepassItem {
  itemName: string;
  imgUrl: string;
  price: number;
}

interface GamepassData {
  _id?: string;
  gameName: string;
  imgUrl: string;
  caraPesan: string[];
  features: string[];
  showOnHomepage: boolean;
  developer: string;
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
}

export default function GamepassManager({
  gamepass,
  onUpdate,
  onDelete,
  onCreate,
  onClose,
  isCreate = false,
}: GamepassManagerProps) {
  const [editedGamepass, setEditedGamepass] = useState<GamepassData>(
    gamepass || {
      gameName: "",
      imgUrl: "",
      caraPesan: [""],
      features: [""],
      showOnHomepage: false,
      developer: "",
      item: [{ itemName: "", imgUrl: "", price: 0 }],
    }
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // File states
  const [gameImageFile, setGameImageFile] = useState<File | null>(null);
  const [itemImageFiles, setItemImageFiles] = useState<{
    [index: number]: File;
  }>({});
  const [gameImagePreview, setGameImagePreview] = useState(
    gamepass?.imgUrl || ""
  );
  const [itemImagePreviews, setItemImagePreviews] = useState<{
    [index: number]: string;
  }>({});

  useEffect(() => {
    if (gamepass) {
      setEditedGamepass(gamepass);
      setGameImagePreview(gamepass.imgUrl);

      // Set item image previews
      const previews: { [index: number]: string } = {};
      gamepass.item.forEach((item, index) => {
        previews[index] = item.imgUrl;
      });
      setItemImagePreviews(previews);
    }
  }, [gamepass]);

  // Upload image to cloudinary
  const uploadImage = async (
    file: File,
    folder: string = "gamepass"
  ): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to upload image");
    }

    return data.url;
  };

  // Handle game image file change
  const handleGameImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGameImageFile(file);
      const preview = URL.createObjectURL(file);
      setGameImagePreview(preview);
    }
  };

  // Handle item image file change
  const handleItemImageChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setItemImageFiles((prev) => ({ ...prev, [index]: file }));
      const preview = URL.createObjectURL(file);
      setItemImagePreviews((prev) => ({ ...prev, [index]: preview }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      let gamepassData = { ...editedGamepass };

      // Upload game image if new file is selected
      if (gameImageFile) {
        const gameImageUrl = await uploadImage(gameImageFile, "gamepass/games");
        gamepassData.imgUrl = gameImageUrl;
      }

      // Upload item images if new files are selected
      const updatedItems = await Promise.all(
        editedGamepass.item.map(async (item, index) => {
          let itemData = { ...item };

          if (itemImageFiles[index]) {
            const itemImageUrl = await uploadImage(
              itemImageFiles[index],
              "gamepass/items"
            );
            itemData.imgUrl = itemImageUrl;
          }

          return itemData;
        })
      );

      gamepassData.item = updatedItems;

      console.log("Sending gamepass data:", gamepassData);

      if (isCreate) {
        onCreate?.(gamepassData);
      } else {
        onUpdate?.(gamepassData);
      }
    } catch (error: any) {
      console.error("Error saving gamepass:", error);
      setError(error.message || "Terjadi kesalahan saat menyimpan gamepass");
    } finally {
      setIsLoading(false);
    }
  };

  // Add new cara pesan
  const addCaraPesan = () => {
    setEditedGamepass({
      ...editedGamepass,
      caraPesan: [...editedGamepass.caraPesan, ""],
    });
  };

  // Remove cara pesan
  const removeCaraPesan = (index: number) => {
    setEditedGamepass({
      ...editedGamepass,
      caraPesan: editedGamepass.caraPesan.filter((_, i) => i !== index),
    });
  };

  // Add new feature
  const addFeature = () => {
    setEditedGamepass({
      ...editedGamepass,
      features: [...editedGamepass.features, ""],
    });
  };

  // Remove feature
  const removeFeature = (index: number) => {
    setEditedGamepass({
      ...editedGamepass,
      features: editedGamepass.features.filter((_, i) => i !== index),
    });
  };

  // Add new item
  const addItem = () => {
    setEditedGamepass({
      ...editedGamepass,
      item: [...editedGamepass.item, { itemName: "", imgUrl: "", price: 0 }],
    });
  };

  // Remove item
  const removeItem = (index: number) => {
    setEditedGamepass({
      ...editedGamepass,
      item: editedGamepass.item.filter((_, i) => i !== index),
    });

    // Clean up file states
    const newItemImageFiles = { ...itemImageFiles };
    delete newItemImageFiles[index];
    setItemImageFiles(newItemImageFiles);

    const newItemImagePreviews = { ...itemImagePreviews };
    delete newItemImagePreviews[index];
    setItemImagePreviews(newItemImagePreviews);
  };

  return (
    <div className="bg-gray-900 text-white p-6">
      {/* Header with Close Button */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {isCreate ? "Buat Gamepass Baru" : "Edit Gamepass"}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-2"
          title="Tutup"
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

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Game Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nama Game *
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
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            />
          </div>

          {/* Developer */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Developer *
            </label>
            <input
              type="text"
              value={editedGamepass.developer}
              onChange={(e) =>
                setEditedGamepass({
                  ...editedGamepass,
                  developer: e.target.value,
                })
              }
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              required
            />
          </div>

          {/* Homepage Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tampilkan di Homepage
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editedGamepass.showOnHomepage}
                onChange={(e) =>
                  setEditedGamepass({
                    ...editedGamepass,
                    showOnHomepage: e.target.checked,
                  })
                }
                className="rounded bg-gray-800 border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-300">
                Ya, tampilkan di homepage
              </span>
            </label>
          </div>
        </div>

        {/* Game Image */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Gambar Game *
          </label>
          <div className="space-y-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleGameImageChange}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white file:bg-gray-700 file:border-0 file:text-gray-300 file:py-2 file:px-4 file:rounded file:mr-4"
              required={isCreate && !gameImagePreview}
            />
            {gameImagePreview && (
              <div className="relative w-32 h-32">
                <img
                  src={gameImagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Cara Pesan */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Cara Pesan *
          </label>
          <div className="space-y-2">
            {editedGamepass.caraPesan.map((cara, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={cara}
                  onChange={(e) => {
                    const newCaraPesan = [...editedGamepass.caraPesan];
                    newCaraPesan[index] = e.target.value;
                    setEditedGamepass({
                      ...editedGamepass,
                      caraPesan: newCaraPesan,
                    });
                  }}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder={`Cara pesan ${index + 1}`}
                  required
                />
                {editedGamepass.caraPesan.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCaraPesan(index)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    -
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addCaraPesan}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Tambah Cara Pesan
            </button>
          </div>
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Fitur *
          </label>
          <div className="space-y-2">
            {editedGamepass.features.map((feature, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => {
                    const newFeatures = [...editedGamepass.features];
                    newFeatures[index] = e.target.value;
                    setEditedGamepass({
                      ...editedGamepass,
                      features: newFeatures,
                    });
                  }}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                  placeholder={`Fitur ${index + 1}`}
                  required
                />
                {editedGamepass.features.length > 1 && (
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Tambah Fitur
            </button>
          </div>
        </div>

        {/* Items */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Items *
          </label>
          <div className="space-y-4">
            {editedGamepass.item.map((item, index) => (
              <div
                key={index}
                className="p-4 bg-gray-800 border border-gray-600 rounded-lg"
              >
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-medium text-white">
                    Item {index + 1}
                  </h4>
                  {editedGamepass.item.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                    >
                      Hapus Item
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Item Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nama Item *
                    </label>
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => {
                        const newItems = [...editedGamepass.item];
                        newItems[index].itemName = e.target.value;
                        setEditedGamepass({
                          ...editedGamepass,
                          item: newItems,
                        });
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      required
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Harga (Rp) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...editedGamepass.item];
                        newItems[index].price = parseFloat(e.target.value) || 0;
                        setEditedGamepass({
                          ...editedGamepass,
                          item: newItems,
                        });
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      required
                    />
                  </div>

                  {/* Item Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Gambar Item *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleItemImageChange(index, e)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white file:bg-gray-600 file:border-0 file:text-gray-300 file:py-1 file:px-2 file:rounded file:mr-2 text-sm"
                      required={isCreate && !itemImagePreviews[index]}
                    />
                  </div>
                </div>

                {/* Item Image Preview */}
                {itemImagePreviews[index] && (
                  <div className="mt-4">
                    <img
                      src={itemImagePreviews[index]}
                      alt={`Preview ${item.itemName}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + Tambah Item
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-600">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Menyimpan..."
              : isCreate
              ? "Buat Gamepass"
              : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
