"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/AuthContext";
import GamepassManager from "@/components/admin/GamepassManager";

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

export default function AdminGamepassPage() {
  const [gamepasses, setGamepasses] = useState<GamepassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGamepass, setEditingGamepass] = useState<GamepassData | null>(
    null
  );
  const { user } = useAuth();

  // Fetch gamepasses
  const fetchGamepasses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/gamepass?admin=true");
      const data = await response.json();

      if (data.success) {
        setGamepasses(data.data);
      } else {
        setError(data.error || "Gagal memuat gamepass");
      }
    } catch (error) {
      console.error("Error fetching gamepasses:", error);
      setError("Terjadi kesalahan saat memuat gamepass");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.accessRole === "admin") {
      fetchGamepasses();
    }
  }, [user]);

  // Create gamepass
  const handleCreate = async (gamepassData: GamepassData) => {
    try {
      const response = await fetch("/api/gamepass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gamepassData),
      });

      const data = await response.json();

      if (data.success) {
        setGamepasses([data.data, ...gamepasses]);
        setShowCreateModal(false);
        toast.success("Gamepass berhasil dibuat!");
      } else {
        toast.error(data.error || "Gagal membuat gamepass");
      }
    } catch (error) {
      console.error("Error creating gamepass:", error);
      toast.error("Terjadi kesalahan saat membuat gamepass");
    }
  };

  // Update gamepass
  const handleUpdate = async (updatedGamepass: GamepassData) => {
    try {
      console.log("Updating gamepass with data:", updatedGamepass);

      const response = await fetch(`/api/gamepass/${updatedGamepass._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedGamepass),
      });

      const data = await response.json();
      console.log("Update response:", data);

      if (data.success) {
        setGamepasses(
          gamepasses.map((gp) =>
            gp._id === updatedGamepass._id ? data.data : gp
          )
        );
        setEditingGamepass(null);
        toast.success("Gamepass berhasil diperbarui!");
      } else {
        toast.error(data.error || "Gagal memperbarui gamepass");
      }
    } catch (error) {
      console.error("Error updating gamepass:", error);
      toast.error("Terjadi kesalahan saat memperbarui gamepass");
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

      const data = await response.json();

      if (data.success) {
        setGamepasses(gamepasses.filter((gp) => gp._id !== id));
        toast.success("Gamepass berhasil dihapus!");
      } else {
        toast.error(data.error || "Gagal menghapus gamepass");
      }
    } catch (error) {
      console.error("Error deleting gamepass:", error);
      toast.error("Terjadi kesalahan saat menghapus gamepass");
    }
  };

  // Toggle homepage status
  const toggleHomepage = async (id: string, currentStatus: boolean) => {
    // Check if trying to enable homepage when already at limit
    const currentHomepageCount = gamepasses.filter(
      (gp) => gp.showOnHomepage
    ).length;
    if (!currentStatus && currentHomepageCount >= 3) {
      toast.warning("Maksimal 3 gamepass yang dapat ditampilkan di homepage");
      return;
    }

    try {
      const response = await fetch(`/api/gamepass/${id}/homepage`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ showOnHomepage: !currentStatus }),
      });

      const data = await response.json();

      if (data.success) {
        setGamepasses(
          gamepasses.map((gp) =>
            gp._id === id ? { ...gp, showOnHomepage: !currentStatus } : gp
          )
        );
        toast.success(
          `Gamepass ${
            !currentStatus ? "ditambahkan ke" : "dihapus dari"
          } homepage`
        );
      } else {
        toast.error(
          data.message || data.error || "Gagal mengubah status homepage"
        );
      }
    } catch (error) {
      console.error("Error toggling homepage:", error);
      toast.error("Terjadi kesalahan saat mengubah status homepage");
    }
  };

  if (user?.accessRole !== "admin") {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">
            Akses Ditolak
          </h1>
          <p className="text-[#94a3b8]">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f172a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#3b82f6] mx-auto"></div>
          <p className="mt-4 text-[#94a3b8]">Memuat gamepass...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f5f9]">Kelola Gamepass</h1>
            <p className="mt-2 text-[#94a3b8]">
              Kelola semua gamepass yang tersedia di platform
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#3b82f6] text-[#f1f5f9] rounded-lg hover:bg-[#1d4ed8] transition-colors font-medium"
            >
              + Tambah Gamepass
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 rounded-lg bg-[#1e293b] shadow-lg">
            <h3 className="text-sm font-medium text-[#94a3b8]">
              Total Gamepass
            </h3>
            <p className="text-2xl font-bold text-[#f1f5f9]">{gamepasses.length}</p>
          </div>

          <div className="p-6 rounded-lg bg-[#1e293b] shadow-lg">
            <h3 className="text-sm font-medium text-[#94a3b8]">
              Ditampilkan di Homepage
            </h3>
            <p className="text-2xl font-bold text-[#f1f5f9]">
              {gamepasses.filter((gp) => gp.showOnHomepage).length} / 3
            </p>
            <p className="text-xs text-[#64748b] mt-1">Maksimal 3 gamepass</p>
          </div>

          <div className="p-6 rounded-lg bg-[#1e293b] shadow-lg">
            <h3 className="text-sm font-medium text-[#94a3b8]">Total Items</h3>
            <p className="text-2xl font-bold text-[#f1f5f9]">
              {gamepasses.reduce((acc, gp) => acc + gp.item.length, 0)}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}

        {/* Gamepass List */}
        <div className="rounded-lg bg-[#1e293b] shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#334155]">
              <thead className="bg-[#334155]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Game
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Homepage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Tanggal
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[#cbd5e1]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155] bg-[#1e293b]">
                {gamepasses.map((gamepass) => (
                  <tr key={gamepass._id} className="hover:bg-[#334155]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={gamepass.imgUrl}
                          alt={gamepass.gameName}
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#f1f5f9]">
                            {gamepass.gameName}
                          </div>
                          <div className="text-sm text-[#94a3b8]">
                            {gamepass.features.length} fitur
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#f1f5f9]">
                        {gamepass.item.length} items
                      </div>
                      <div className="text-sm text-[#94a3b8]">
                        Rp{" "}
                        {gamepass.item
                          .reduce((acc, item) => acc + item.price, 0)
                          .toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const currentHomepageCount = gamepasses.filter(
                          (gp) => gp.showOnHomepage
                        ).length;
                        const canToggle =
                          gamepass.showOnHomepage || currentHomepageCount < 3;

                        return (
                          <button
                            onClick={() =>
                              toggleHomepage(
                                gamepass._id!,
                                gamepass.showOnHomepage
                              )
                            }
                            disabled={!canToggle}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              gamepass.showOnHomepage
                                ? "bg-green-100 text-green-800"
                                : canToggle
                                ? "bg-gray-100 text-[#1e293b] hover:bg-gray-200"
                                : "bg-red-100 text-red-800 cursor-not-allowed opacity-60"
                            }`}
                            title={
                              !canToggle
                                ? "Maksimal 3 gamepass di homepage"
                                : ""
                            }
                          >
                            {gamepass.showOnHomepage
                              ? "Aktif"
                              : canToggle
                              ? "Nonaktif"
                              : "Limit"}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#f1f5f9]">
                        {gamepass.createdAt
                          ? new Date(gamepass.createdAt).toLocaleDateString(
                              "id-ID"
                            )
                          : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingGamepass(gamepass)}
                        className="text-[#60a5fa] hover:text-[#93c5fd] mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(gamepass._id!)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {gamepasses.length === 0 && (
            <div className="text-center py-12">
              <div className="text-[#64748b]">
                <svg
                  className="mx-auto h-12 w-12 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8v2m0 0V9m0-2h2m-2 0H10"
                  />
                </svg>
                <h3 className="text-lg font-medium text-[#cbd5e1]">
                  Belum ada gamepass
                </h3>
                <p className="mt-1 text-[#94a3b8]">
                  Mulai dengan membuat gamepass pertama Anda.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg bg-[#1e293b]">
            <GamepassManager
              isCreate={true}
              onCreate={handleCreate}
              onClose={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingGamepass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg bg-[#1e293b]">
            <GamepassManager
              gamepass={editingGamepass}
              onUpdate={handleUpdate}
              onClose={() => setEditingGamepass(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
