// src/app/admin/users/page.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  password?: string;
  accessRole: "user" | "admin";
  memberRole:
    | string
    | {
        _id: string;
        member: string;
        diskon: number;
        description?: string;
        isActive: boolean;
      }
    | null;
  spendedMoney: number;
  isVerified: boolean;
  googleId?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface Role {
  _id: string;
  member: string;
  diskon: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StockAccount {
  _id: string;
  userId: number;
  username: string;
  displayName: string;
  robloxCookie: string;
  robux: number;
  status: "active" | "inactive";
  lastChecked: string;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [stockAccounts, setStockAccounts] = useState<StockAccount[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedStockAccount, setSelectedStockAccount] =
    useState<StockAccount | null>(null);
  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+62",
    accessRole: "user" as "user" | "admin",
    memberRole: "",
    password: "",
    robloxCookie: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
    if (activeTab === "stock") {
      fetchStockAccounts();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setTableLoading(true);
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        // console.log("Users API Response:", data);

        if (data.users) {
          let filteredUsers = data.users;

          // Filter based on active tab
          if (activeTab === "users") {
            filteredUsers = data.users.filter(
              (user: User) => user.accessRole === "user"
            );
          } else if (activeTab === "admins") {
            filteredUsers = data.users.filter(
              (user: User) => user.accessRole === "admin"
            );
          }

          setUsers(filteredUsers);
        } else {
          toast.error(data.error || "No users data found");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Error fetching users");
    } finally {
      setTableLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/admin/roles");
      if (response.ok) {
        const data = await response.json();
        console.log("Roles API Response:", data);

        if (data.roles) {
          setRoles(data.roles.filter((role: Role) => role.isActive));
        } else {
          console.error("No roles data found");
          setRoles([]);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch roles:", errorData);
        setRoles([]);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    }
  };

  const fetchStockAccounts = async () => {
    try {
      const response = await fetch("/api/admin/stock-accounts");
      if (response.ok) {
        const data = await response.json();
        console.log("Stock Accounts API Response:", data);

        if (data.stockAccounts) {
          setStockAccounts(data.stockAccounts);
        } else {
          console.error("No stock accounts data found");
          setStockAccounts([]);
        }
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch stock accounts:", errorData);
        setStockAccounts([]);
      }
    } catch (error) {
      console.error("Error fetching stock accounts:", error);
      setStockAccounts([]);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      countryCode: user.countryCode,
      accessRole: user.accessRole,
      memberRole:
        typeof user.memberRole === "object" && user.memberRole
          ? user.memberRole._id
          : user.memberRole || "",
      password: "", // Always empty for security
      robloxCookie: "",
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: string, userRole: string) => {
    if (userRole === "admin") {
      toast.warning("Admin users require special permission to delete!");
      return;
    }
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("User deleted successfully");
          fetchUsers(); // Refresh the list
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to delete user");
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        toast.error("Error deleting user");
      }
    }
  };

  const handleEditStockAccount = (account: StockAccount) => {
    setSelectedStockAccount(account);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      countryCode: "+62",
      accessRole: "user",
      memberRole: "",
      password: "",
      robloxCookie: account.robloxCookie,
    });
    setShowModal(true);
  };

  const handleDeleteStockAccount = async (accountId: string) => {
    if (confirm("Are you sure you want to delete this stock account?")) {
      try {
        const response = await fetch(`/api/admin/stock-accounts/${accountId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Stock account deleted successfully");
          fetchStockAccounts();
        } else {
          const data = await response.json();
          toast.error(data.message || "Failed to delete stock account");
        }
      } catch (error) {
        console.error("Error deleting stock account:", error);
        toast.error("Error deleting stock account");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (activeTab === "stock") {
        // Handle stock account creation/update
        const url = selectedStockAccount
          ? `/api/admin/stock-accounts/${selectedStockAccount._id}`
          : "/api/admin/stock-accounts";
        const method = selectedStockAccount ? "PUT" : "POST";

        const payload = {
          robloxCookie: formData.robloxCookie,
        };

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success(
            selectedStockAccount
              ? "Stock account updated successfully"
              : "Stock account created successfully"
          );
          setShowModal(false);
          setSelectedStockAccount(null);
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            countryCode: "+62",
            accessRole: "user",
            memberRole: "",
            password: "",
            robloxCookie: "",
          });
          fetchStockAccounts();
        } else {
          const data = await response.json();
          toast.error(data.message || "Failed to save stock account");
        }
      } else {
        // Handle user creation/update
        const url = selectedUser
          ? `/api/admin/users/${selectedUser._id}`
          : "/api/admin/users";
        const method = selectedUser ? "PUT" : "POST";

        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          countryCode: formData.countryCode,
          accessRole: formData.accessRole,
          memberRole: formData.memberRole || null,
          ...(formData.password && { password: formData.password }),
        };

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          toast.success(
            selectedUser
              ? "User updated successfully"
              : "User created successfully"
          );
          setShowModal(false);
          setSelectedUser(null);
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            countryCode: "+62",
            accessRole: "user",
            memberRole: "",
            password: "",
            robloxCookie: "",
          });
          fetchUsers();
        } else {
          const data = await response.json();
          toast.error(data.error || "Failed to save user");
        }
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error saving data");
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const userColumns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "spending", label: "Total Spending" },
    { key: "memberRole", label: "Member Role" },
    { key: "joined", label: "Joined" },
  ];

  const adminColumns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Access Role" },
    { key: "joined", label: "Joined" },
  ];

  const stockColumns = [
    { key: "id", label: "User ID" },
    { key: "username", label: "Username" },
    { key: "displayName", label: "Display Name" },
    { key: "robux", label: "Robux" },
    { key: "status", label: "Status" },
    { key: "lastChecked", label: "Last Checked" },
    { key: "joined", label: "Added" },
  ];

  const getColumns = () => {
    if (activeTab === "users") return userColumns;
    if (activeTab === "stock") return stockColumns;
    return adminColumns;
  };

  const formatRobux = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="mt-1 text-sm text-gray-400">
            Manage buyers, admins, and stock accounts
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setSelectedStockAccount(null);
            setFormData({
              firstName: "",
              lastName: "",
              email: "",
              phone: "",
              countryCode: "+62",
              accessRole: activeTab === "admins" ? "admin" : "user",
              memberRole: "",
              password: "",
              robloxCookie: "",
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <svg
            className="w-5 h-5 mr-2"
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
          Add{" "}
          {activeTab === "users"
            ? "User"
            : activeTab === "stock"
            ? "Stock Account"
            : "Admin"}
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow">
        <div className="border-b border-gray-700">
          <nav className="flex -mb-px">
            <button
              onClick={() => {
                setActiveTab("users");
                setSearchTerm("");
              }}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === "users"
                  ? "border-b-2 border-blue-400 text-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <span className="mr-2">👥</span>
              Users
            </button>
            <button
              onClick={() => {
                setActiveTab("admins");
                setSearchTerm("");
              }}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === "admins"
                  ? "border-b-2 border-blue-400 text-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <span className="mr-2">🛡️</span>
              Admins
            </button>
            <button
              onClick={() => {
                setActiveTab("stock");
                setSearchTerm("");
              }}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === "stock"
                  ? "border-b-2 border-blue-400 text-blue-400"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              <span className="mr-2">💰</span>
              Stock Accounts
            </button>
          </nav>
        </div>

        {/* Stats for current tab */}
        <div className="p-6 border-b border-gray-700 bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activeTab === "users" ? (
              <>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 ">
                  <p className="text-sm text-white">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 ">
                  <p className="text-sm text-white">With Member Role</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {users.filter((u) => u.memberRole).length}
                  </p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 ">
                  <p className="text-sm text-white">Total Spending</p>
                  <p className="text-2xl font-bold text-purple-600">
                    Rp{" "}
                    {users
                      .reduce((sum, u) => sum + (u.spendedMoney || 0), 0)
                      .toLocaleString("id-ID")}
                  </p>
                </div>
              </>
            ) : activeTab === "stock" ? (
              <>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 ">
                  <p className="text-sm text-white">Total Accounts</p>
                  <p className="text-2xl font-bold">{stockAccounts.length}</p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 ">
                  <p className="text-sm text-white">Active Accounts</p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      stockAccounts.filter((acc) => acc.status === "active")
                        .length
                    }
                  </p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 ">
                  <p className="text-sm text-white">Total Robux</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stockAccounts
                      .reduce((sum, acc) => sum + (acc.robux || 0), 0)
                      .toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 ">
                  <p className="text-sm text-white">Avg. Robux</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stockAccounts.length > 0
                      ? Math.round(
                          stockAccounts.reduce(
                            (sum, acc) => sum + (acc.robux || 0),
                            0
                          ) / stockAccounts.length
                        ).toLocaleString("id-ID")
                      : "0"}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 ">
                  <p className="text-sm text-white">Total Admins</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-700">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 text-white bg-gray-700 placeholder-gray-400"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700 text-white">
            <thead className="bg-gray-800">
              <tr>
                {getColumns().map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 text-white divide-y divide-gray-700">
              {tableLoading ? (
                <tr>
                  <td
                    colSpan={getColumns().length + 1}
                    className="px-6 py-8 text-center"
                  >
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                      <span className="ml-2 text-gray-400">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : activeTab === "stock" ? (
                stockAccounts
                  .filter(
                    (account) =>
                      account.username
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                      account.displayName
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                  )
                  .map((account) => (
                    <tr key={account._id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {account.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                            {account.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-white">
                              {account.username}
                            </p>
                            <p className="text-xs text-gray-400">
                              ID: {account.userId}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {account.displayName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="font-semibold text-yellow-400">
                          {account.robux.toLocaleString("id-ID")} R$
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            account.status === "active"
                              ? "bg-green-800 text-green-300"
                              : "bg-red-800 text-red-300"
                          }`}
                        >
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(account.lastChecked).toLocaleDateString(
                          "id-ID"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(account.createdAt).toLocaleDateString(
                          "id-ID"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditStockAccount(account)}
                          className="text-blue-400 hover:text-blue-300 mr-3"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDeleteStockAccount(account._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-700">
                    {activeTab === "users" ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-white">
                                {user.firstName} {user.lastName}
                              </p>
                              {user.memberRole &&
                                typeof user.memberRole === "object" && (
                                  <p className="text-xs text-green-600">
                                    Member: {user.memberRole.member}
                                  </p>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.countryCode} {user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="font-semibold">
                            Rp{" "}
                            {(user.spendedMoney || 0).toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.memberRole &&
                          typeof user.memberRole === "object" ? (
                            <span className="bg-blue-800 text-blue-300 px-2 py-1 rounded text-xs">
                              {user.memberRole.member} ({user.memberRole.diskon}
                              %)
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">
                              No Role
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(user.createdAt).toLocaleDateString("id-ID")}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-white">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user.countryCode} {user.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              user.accessRole === "admin"
                                ? "bg-red-800 text-red-300"
                                : "bg-purple-800 text-purple-300"
                            }`}
                          >
                            {user.accessRole}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(user.createdAt).toLocaleDateString("id-ID")}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        Edit
                      </button>
                      {user.accessRole !== "admin" && (
                        <button
                          onClick={() =>
                            handleDelete(user._id, user.accessRole)
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-white">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {selectedUser || selectedStockAccount
                ? `Edit ${activeTab === "stock" ? "Stock Account" : "User"}`
                : `Add New ${
                    activeTab === "stock"
                      ? "Stock Account"
                      : activeTab === "admins"
                      ? "Admin"
                      : "User"
                  }`}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {activeTab === "stock" ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Roblox Cookie
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={formData.robloxCookie}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            robloxCookie: e.target.value,
                          })
                        }
                        placeholder="Paste your Roblox .ROBLOSECURITY cookie here..."
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400 resize-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        The system will automatically validate the cookie and
                        extract user information.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                      />
                    </div>
                  </>
                )}

                {activeTab === "admins" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Access Role
                    </label>
                    <select
                      value={formData.accessRole}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accessRole: e.target.value as "user" | "admin",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                {activeTab !== "stock" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required={!selectedUser}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder={
                        selectedUser
                          ? "Leave empty to keep current password"
                          : "Enter password"
                      }
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                )}

                {(activeTab === "users" || activeTab === "admins") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                )}

                {activeTab === "users" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Member Role
                    </label>
                    <select
                      value={formData.memberRole}
                      onChange={(e) =>
                        setFormData({ ...formData, memberRole: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                    >
                      <option value="">No Member Role</option>
                      {roles.map((role) => (
                        <option key={role._id} value={role._id}>
                          {role.member} ({role.diskon}% discount)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === "admins" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Access Role
                    </label>
                    <select
                      value={formData.accessRole}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accessRole: e.target.value as "user" | "admin",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                {!selectedUser && activeTab !== "stock" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required={!selectedUser}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                    />
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedUser(null);
                    setSelectedStockAccount(null);
                  }}
                  className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className={`px-4 py-2 text-white rounded-lg flex items-center ${
                    submitLoading
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {submitLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  {submitLoading
                    ? "Processing..."
                    : selectedUser || selectedStockAccount
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
