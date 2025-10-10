"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface Role {
  _id: string;
  member: string;
  diskon: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: "",
    isActive: "",
  });
  const [totalPages, setTotalPages] = useState(1);
  const [totalRoles, setTotalRoles] = useState(0);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    member: "",
    diskon: 0,
    description: "",
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchRoles();
  }, [currentPage, filters]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: filters.search,
        isActive: filters.isActive,
      });

      const response = await fetch(`/api/roles?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setRoles(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalRoles(data.pagination.total);
      } else {
        toast.error(data.error || "Failed to fetch roles");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    setCurrentPage(1);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters({ ...filters, [field]: value });
    setCurrentPage(1);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.member.trim()) {
      errors.member = "Nama member diperlukan";
    } else if (formData.member.length > 50) {
      errors.member = "Nama member tidak boleh lebih dari 50 karakter";
    }

    if (formData.diskon < 0 || formData.diskon > 100) {
      errors.diskon = "Diskon harus antara 0-100";
    }

    if (formData.description && formData.description.length > 200) {
      errors.description = "Deskripsi tidak boleh lebih dari 200 karakter";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch("/api/roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Role berhasil dibuat");
        setShowCreateModal(false);
        resetForm();
        fetchRoles();
      } else {
        toast.error(data.error || "Failed to create role");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to create role");
    }
  };

  const handleEdit = async () => {
    if (!validateForm() || !selectedRole) return;

    try {
      const response = await fetch(`/api/roles/${selectedRole._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Role berhasil diupdate");
        setShowEditModal(false);
        resetForm();
        fetchRoles();
      } else {
        toast.error(data.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update role");
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;

    try {
      const response = await fetch(`/api/roles/${selectedRole._id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Role berhasil dihapus");
        setShowDeleteModal(false);
        setSelectedRole(null);
        fetchRoles();
      } else {
        toast.error(data.error || "Failed to delete role");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete role");
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      member: role.member,
      diskon: role.diskon,
      description: role.description || "",
      isActive: role.isActive,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      member: "",
      diskon: 0,
      description: "",
      isActive: true,
    });
    setFormErrors({});
    setSelectedRole(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 bg-[#0f172a] min-h-screen p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">Role Management</h1>
          <p className="text-[#cbd5e1]">Kelola role member dan diskon</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#3b82f6] text-[#f1f5f9] px-4 py-2 rounded hover:bg-[#1d4ed8] border border-[#3b82f6]"
        >
          + Tambah Role
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#1e293b] rounded-lg shadow-lg p-4 border border-[#334155]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Cari role..."
              className="w-full border border-[#334155] bg-[#334155] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Status
            </label>
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange("isActive", e.target.value)}
              className="w-full border border-[#334155] bg-[#334155] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
            >
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchRoles}
              className="bg-[#475569] text-[#f1f5f9] px-4 py-2 rounded hover:bg-[#334155] border border-[#475569]"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#1e293b] rounded-lg shadow-lg p-4 border border-[#334155]">
        <div className="flex items-center justify-between">
          <span className="text-[#cbd5e1]">Total Roles:</span>
          <span className="font-bold text-xl text-[#f1f5f9]">{totalRoles}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] rounded-lg shadow-lg border border-[#334155] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#334155]">
            <thead className="bg-[#0f172a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                  Diskon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                  Deskripsi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                  Dibuat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#1e293b] divide-y divide-[#334155]">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-[#cbd5e1]"
                  >
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mr-2"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-[#cbd5e1]"
                  >
                    Tidak ada data role
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role._id} className="hover:bg-[#334155]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-[#f1f5f9]">
                        {role.member}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-green-900/20 text-green-300 px-2 py-1 rounded text-sm font-medium border border-green-500/30">
                        {role.diskon}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#cbd5e1] max-w-xs truncate">
                        {role.description || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          role.isActive
                            ? "bg-green-900/20 text-green-300 border border-green-500/30"
                            : "bg-red-900/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {role.isActive ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#cbd5e1]">
                      {formatDate(role.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(role)}
                          className="bg-[#3b82f6] hover:bg-[#1d4ed8] text-[#f1f5f9] px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openDeleteModal(role)}
                          className="bg-red-600 hover:bg-red-700 text-[#f1f5f9] px-3 py-1 rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-[#0f172a] px-6 py-3 flex items-center justify-between border-t border-[#334155]">
            <div className="text-sm text-[#cbd5e1]">
              Halaman {currentPage} dari {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-[#334155] text-[#f1f5f9] rounded hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-[#334155] text-[#f1f5f9] rounded hover:bg-[#475569] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-lg shadow-lg max-w-md w-full mx-4 border border-[#334155]">
            <div className="flex justify-between items-center p-4 border-b border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f1f5f9]">
                Tambah Role Baru
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#94a3b8] hover:text-[#f1f5f9]"
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

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Nama Member <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.member}
                  onChange={(e) =>
                    setFormData({ ...formData, member: e.target.value })
                  }
                  placeholder="Masukkan nama member"
                  className={`w-full border bg-[#334155] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] ${
                    formErrors.member ? "border-red-500" : "border-[#334155]"
                  }`}
                />
                {formErrors.member && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.member}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Diskon (%) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.diskon}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diskon: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className={`w-full border bg-[#334155] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] ${
                    formErrors.diskon ? "border-red-500" : "border-[#334155]"
                  }`}
                />
                {formErrors.diskon && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.diskon}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi role (opsional)"
                  rows={3}
                  className={`w-full border bg-[#334155] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] ${
                    formErrors.description
                      ? "border-red-500"
                      : "border-[#334155]"
                  }`}
                />
                {formErrors.description && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-[#3b82f6] focus:ring-[#3b82f6] border-[#334155] rounded bg-[#334155]"
                />
                <label
                  htmlFor="isActive"
                  className="ml-2 text-sm text-[#cbd5e1]"
                >
                  Role aktif
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-4 border-t border-[#334155]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-[#475569] text-[#f1f5f9] rounded hover:bg-[#334155]"
              >
                Batal
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-[#3b82f6] text-[#f1f5f9] rounded hover:bg-[#1d4ed8]"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-lg shadow-lg max-w-md w-full mx-4 border border-[#334155]">
            <div className="flex justify-between items-center p-4 border-b border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f1f5f9]">Edit Role</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-[#94a3b8] hover:text-[#f1f5f9]"
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

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Nama Member <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.member}
                  onChange={(e) =>
                    setFormData({ ...formData, member: e.target.value })
                  }
                  placeholder="Masukkan nama member"
                  className={`w-full border bg-[#334155] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] ${
                    formErrors.member ? "border-red-500" : "border-[#334155]"
                  }`}
                />
                {formErrors.member && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.member}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Diskon (%) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.diskon}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diskon: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  className={`w-full border bg-[#334155] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] ${
                    formErrors.diskon ? "border-red-500" : "border-[#334155]"
                  }`}
                />
                {formErrors.diskon && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.diskon}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Deskripsi
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Deskripsi role (opsional)"
                  rows={3}
                  className={`w-full border bg-[#334155] text-[#f1f5f9] rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3b82f6] ${
                    formErrors.description
                      ? "border-red-500"
                      : "border-[#334155]"
                  }`}
                />
                {formErrors.description && (
                  <p className="text-red-400 text-sm mt-1">
                    {formErrors.description}
                  </p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-[#3b82f6] focus:ring-[#3b82f6] border-[#334155] rounded bg-[#334155]"
                />
                <label
                  htmlFor="editIsActive"
                  className="ml-2 text-sm text-[#cbd5e1]"
                >
                  Role aktif
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-4 border-t border-[#334155]">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-[#475569] text-[#f1f5f9] rounded hover:bg-[#334155]"
              >
                Batal
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-[#3b82f6] text-[#f1f5f9] rounded hover:bg-[#1d4ed8]"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-lg shadow-lg max-w-md w-full mx-4 border border-[#334155]">
            <div className="flex justify-between items-center p-4 border-b border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f1f5f9]">Hapus Role</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#94a3b8] hover:text-[#f1f5f9]"
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

            <div className="p-4">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg
                    className="h-6 w-6 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-[#f1f5f9] mb-2">
                  Konfirmasi Hapus
                </h3>
                <p className="text-[#cbd5e1] mb-4">
                  Apakah Anda yakin ingin menghapus role{" "}
                  <span className="font-semibold">{selectedRole.member}</span>?
                  <br />
                  <span className="text-sm text-red-400">
                    Tindakan ini tidak dapat dibatalkan.
                  </span>
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 p-4 border-t border-[#334155]">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-[#475569] text-[#f1f5f9] rounded hover:bg-[#334155]"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-[#f1f5f9] rounded hover:bg-red-700"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
