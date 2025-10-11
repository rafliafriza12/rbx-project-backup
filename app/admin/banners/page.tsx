"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "react-toastify";

interface Banner {
  _id: string;
  imageUrl: string;
  link: string;
  alt: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function BannersManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    imageUrl: "",
    link: "",
    alt: "",
    isActive: true,
    order: 0,
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/banners");
      const data = await response.json();

      if (data.success) {
        setBanners(data.data);
      } else {
        toast.error(data.error || "Gagal mengambil data banner");
      }
    } catch (error) {
      console.error("Error fetching banners:", error);
      toast.error("Terjadi kesalahan saat mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("File harus berupa gambar");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async (): Promise<string> => {
    if (!imageFile) {
      throw new Error("Tidak ada file yang dipilih");
    }

    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);

      const response = await fetch("/api/upload/banner", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Gagal mengupload gambar");
      }

      return data.data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenModal = (banner?: Banner) => {
    if (banner) {
      setSelectedBanner(banner);
      setFormData({
        imageUrl: banner.imageUrl,
        link: banner.link,
        alt: banner.alt,
        isActive: banner.isActive,
        order: banner.order,
      });
      setImagePreview(banner.imageUrl);
    } else {
      setSelectedBanner(null);
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBanner(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      imageUrl: "",
      link: "",
      alt: "",
      isActive: true,
      order: 0,
    });
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;

      // Upload image if new file selected
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary();
      }

      const submitData = {
        ...formData,
        imageUrl,
      };

      const url = selectedBanner
        ? `/api/banners/${selectedBanner._id}`
        : "/api/banners";

      const method = selectedBanner ? "PUT" : "POST";

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
          selectedBanner
            ? "Banner berhasil diupdate!"
            : "Banner berhasil ditambahkan!"
        );
        setShowModal(false);
        resetForm();
        fetchBanners();
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
    if (!confirm("Apakah Anda yakin ingin menghapus banner ini?")) {
      return;
    }

    try {
      const response = await fetch(`/api/banners/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Banner berhasil dihapus!");
        fetchBanners();
      } else {
        throw new Error(result.error || "Terjadi kesalahan");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat menghapus");
    }
  };

  const handleToggleActive = async (banner: Banner) => {
    try {
      const response = await fetch(`/api/banners/${banner._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...banner,
          isActive: !banner.isActive,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          `Banner ${!banner.isActive ? "diaktifkan" : "dinonaktifkan"}!`
        );
        fetchBanners();
      } else {
        throw new Error(result.error || "Terjadi kesalahan");
      }
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  return (
    <div className="min-h-screen  text-[#f1f5f9] rounded-2xl p-6">
      <div className="">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Management Banner</h1>
            <p className="text-[#94a3b8]">
              Kelola banner yang tampil di halaman beranda
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-[#f1f5f9] px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tambah Banner
          </button>
        </div>

        {/* Banners List */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : banners.length === 0 ? (
          <div className="bg-[#1e293b] rounded-xl p-12 text-center">
            <div className="text-[#94a3b8] mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-xl font-semibold">Belum ada banner</p>
              <p className="mt-2">Klik tombol "Tambah Banner" untuk memulai</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div
                key={banner._id}
                className="bg-[#1e293b] rounded-xl overflow-hidden border border-[#334155] hover:border-purple-500 transition-all duration-300"
              >
                {/* Banner Image */}
                <div className="relative aspect-[16/9] bg-[#334155]">
                  <Image
                    src={banner.imageUrl}
                    alt={banner.alt}
                    fill
                    className="object-cover"
                  />
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        banner.isActive
                          ? "bg-green-500 text-[#f1f5f9]"
                          : "bg-[#64748b] text-[#e2e8f0]"
                      }`}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {/* Order Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-[#f1f5f9]">
                      Order: {banner.order}
                    </span>
                  </div>
                </div>

                {/* Banner Info */}
                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-sm text-[#94a3b8] mb-1">Alt Text</p>
                    <p className="font-semibold text-[#f1f5f9]">{banner.alt}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-[#94a3b8] mb-1">Link Tujuan</p>
                    <p className="text-sm text-purple-400 truncate">
                      {banner.link}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                        banner.isActive
                          ? "bg-[#334155] hover:bg-[#475569] text-[#e2e8f0]"
                          : "bg-green-600 hover:bg-green-700 text-[#f1f5f9]"
                      }`}
                    >
                      {banner.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                    <button
                      onClick={() => handleOpenModal(banner)}
                      className="px-4 py-2 bg-[#3b82f6] hover:bg-[#1d4ed8] text-[#f1f5f9] rounded-lg text-sm font-semibold transition-all duration-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(banner._id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-[#f1f5f9] rounded-lg text-sm font-semibold transition-all duration-300"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-[#334155]">
                <h2 className="text-2xl font-bold">
                  {selectedBanner ? "Edit Banner" : "Tambah Banner Baru"}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors"
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
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Gambar Banner *
                  </label>
                  <div className="space-y-3">
                    {imagePreview && (
                      <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-[#334155]">
                        <Image
                          src={imagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-[#f1f5f9] hover:file:bg-purple-700"
                    />
                    <p className="text-xs text-[#94a3b8]">
                      Format: JPG, PNG, WebP. Ukuran maksimal: 5MB. Rekomendasi
                      rasio 16:9
                    </p>
                  </div>
                </div>

                {/* Alt Text */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Alt Text (Deskripsi Gambar) *
                  </label>
                  <input
                    type="text"
                    value={formData.alt}
                    onChange={(e) =>
                      setFormData({ ...formData, alt: e.target.value })
                    }
                    placeholder="Contoh: Banner Gamepass Terbaru"
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* Link */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Link Tujuan *
                  </label>
                  <input
                    type="text"
                    value={formData.link}
                    onChange={(e) =>
                      setFormData({ ...formData, link: e.target.value })
                    }
                    placeholder="Contoh: /gamepass atau https://..."
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Urutan (Order)
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#334155] border border-[#334155] text-[#f1f5f9] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Banner dengan order lebih kecil akan tampil lebih dulu
                  </p>
                </div>

                {/* Is Active */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 bg-[#334155] border-[#334155] rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label
                    htmlFor="isActive"
                    className="ml-3 text-sm font-medium text-[#cbd5e1]"
                  >
                    Tampilkan banner di halaman beranda
                  </label>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 bg-[#334155] hover:bg-[#475569] text-[#f1f5f9] rounded-lg font-semibold transition-all duration-300"
                    disabled={isSubmitting || uploadingImage}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-[#f1f5f9] rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || uploadingImage}
                  >
                    {uploadingImage
                      ? "Mengupload gambar..."
                      : isSubmitting
                      ? "Menyimpan..."
                      : selectedBanner
                      ? "Update Banner"
                      : "Tambah Banner"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
