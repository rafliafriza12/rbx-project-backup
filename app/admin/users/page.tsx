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
  resellerTier?: number;
  resellerExpiry?: Date;
  resellerPackageId?: string;
  spendedMoney: number;
  isVerified: boolean;
  googleId?: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

interface ResellerPackage {
  _id: string;
  name: string;
  tier: number;
  discount: number;
  duration: number;
  features: string[];
  isActive: boolean;
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
  const [resellerPackages, setResellerPackages] = useState<ResellerPackage[]>(
    []
  );
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
    resellerTier: 0,
    resellerExpiry: "",
    resellerPackageId: "",
    password: "",
    robloxCookie: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchResellerPackages();
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

  const fetchResellerPackages = async () => {
    try {
      const response = await fetch("/api/reseller-packages");
      if (response.ok) {
        const result = await response.json();
        console.log("Reseller Packages API Response:", result);

        // Handle both response formats: {data: [...]} or {packages: [...]}
        const packagesData = result.data || result.packages || [];

        console.log("Extracted packages:", packagesData);
        console.log("Packages count:", packagesData.length);

        setResellerPackages(packagesData);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch reseller packages:", errorData);
        setResellerPackages([]);
      }
    } catch (error) {
      console.error("Error fetching reseller packages:", error);
      setResellerPackages([]);
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
      resellerTier: user.resellerTier || 0,
      resellerExpiry: user.resellerExpiry
        ? new Date(user.resellerExpiry).toISOString().split("T")[0]
        : "",
      resellerPackageId: user.resellerPackageId || "",
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
      resellerTier: 0,
      resellerExpiry: "",
      resellerPackageId: "",
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
            resellerTier: 0,
            resellerExpiry: "",
            resellerPackageId: "",
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
          resellerTier: formData.resellerTier || null,
          resellerExpiry: formData.resellerExpiry || null,
          resellerPackageId: formData.resellerPackageId || null,
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
            resellerTier: 0,
            resellerExpiry: "",
            resellerPackageId: "",
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
    { key: "resellerTier", label: "Reseller Tier" },
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
          <h2 className="text-2xl font-bold text-[#f1f5f9]">User Management</h2>
          <p className="mt-1 text-sm text-[#94a3b8]">
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
              resellerTier: 0,
              resellerExpiry: "",
              resellerPackageId: "",
              password: "",
              robloxCookie: "",
            });
            setShowModal(true);
          }}
          className="bg-[#3b82f6] text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-[#1d4ed8] flex items-center"
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
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow">
        <div className="border-b border-[#334155]">
          <nav className="flex -mb-px">
            <button
              onClick={() => {
                setActiveTab("users");
                setSearchTerm("");
              }}
              className={`py-2 px-6 text-sm font-medium ${
                activeTab === "users"
                  ? "border-b-2 border-blue-400 text-[#60a5fa]"
                  : "text-[#94a3b8] hover:text-[#cbd5e1]"
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
                  ? "border-b-2 border-blue-400 text-[#60a5fa]"
                  : "text-[#94a3b8] hover:text-[#cbd5e1]"
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
                  ? "border-b-2 border-blue-400 text-[#60a5fa]"
                  : "text-[#94a3b8] hover:text-[#cbd5e1]"
              }`}
            >
              <span className="mr-2">💰</span>
              Stock Accounts
            </button>
          </nav>
        </div>

        {/* Stats for current tab */}
        <div className="p-6 border-b border-[#334155] bg-[#1e293b]">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {activeTab === "users" ? (
              <>
                <div className="border border-[#334155] rounded-lg p-4 bg-[#334155] hover:bg-[#475569] transition-colors ">
                  <p className="text-sm text-[#f1f5f9]">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <div className="border border-[#334155] rounded-lg p-4 bg-[#334155] hover:bg-[#475569] transition-colors ">
                  <p className="text-sm text-[#f1f5f9]">Active Resellers</p>
                  <p className="text-2xl font-bold text-[#3b82f6]">
                    {
                      users.filter(
                        (u) =>
                          u.resellerTier &&
                          u.resellerExpiry &&
                          new Date(u.resellerExpiry) > new Date()
                      ).length
                    }
                  </p>
                </div>
                <div className="border border-[#334155] rounded-lg p-4 bg-[#334155] hover:bg-[#475569] transition-colors ">
                  <p className="text-sm text-[#f1f5f9]">Total Spending</p>
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
                <div className="border border-[#334155] rounded-lg p-4 bg-[#334155] hover:bg-[#475569] transition-colors ">
                  <p className="text-sm text-[#f1f5f9]">Total Accounts</p>
                  <p className="text-2xl font-bold">{stockAccounts.length}</p>
                </div>
                <div className="border border-[#334155] rounded-lg p-4 bg-[#334155] hover:bg-[#475569] transition-colors ">
                  <p className="text-sm text-[#f1f5f9]">Active Accounts</p>
                  <p className="text-2xl font-bold text-green-600">
                    {
                      stockAccounts.filter((acc) => acc.status === "active")
                        .length
                    }
                  </p>
                </div>
                <div className="border border-[#334155] rounded-lg p-4 bg-[#334155] hover:bg-[#475569] transition-colors ">
                  <p className="text-sm text-[#f1f5f9]">Total Robux</p>
                  <p className="text-2xl font-bold text-[#3b82f6]">
                    {stockAccounts
                      .reduce((sum, acc) => sum + (acc.robux || 0), 0)
                      .toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="border border-[#334155] rounded-lg p-4 bg-[#334155] hover:bg-[#475569] transition-colors ">
                  <p className="text-sm text-[#f1f5f9]">Avg. Robux</p>
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
                <div className="border border-[#334155] rounded-lg p-4 bg-[#334155] hover:bg-[#475569] transition-colors ">
                  <p className="text-sm text-[#f1f5f9]">Total Admins</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-[#334155]">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] text-[#f1f5f9] bg-[#334155] placeholder-[#94a3b8]"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#334155] text-[#f1f5f9]">
            <thead className="bg-[#1e293b]">
              <tr>
                {getColumns().map((column) => (
                  <th
                    key={column.key}
                    className="px-6 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider"
                  >
                    {column.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-[#94a3b8] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-[#1e293b] text-[#f1f5f9] divide-y divide-[#334155]">
              {tableLoading ? (
                <tr>
                  <td
                    colSpan={getColumns().length + 1}
                    className="px-6 py-8 text-center"
                  >
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                      <span className="ml-2 text-[#94a3b8]">Loading...</span>
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
                    <tr key={account._id} className="hover:bg-[#334155]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {account.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-[#f1f5f9] font-semibold">
                            {account.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-[#f1f5f9]">
                              {account.username}
                            </p>
                            <p className="text-xs text-[#94a3b8]">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#94a3b8]">
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
                          className="text-[#60a5fa] hover:text-[#93c5fd] mr-3"
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
                  <tr key={user._id} className="hover:bg-[#334155]">
                    {activeTab === "users" ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {user._id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-[#f1f5f9] font-semibold">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-[#f1f5f9]">
                                {user.firstName} {user.lastName}
                              </p>
                              {user.resellerTier &&
                                user.resellerExpiry &&
                                new Date(user.resellerExpiry) > new Date() && (
                                  <p className="text-xs text-green-600">
                                    Reseller Tier {user.resellerTier}
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
                          {user.resellerTier &&
                          user.resellerExpiry &&
                          new Date(user.resellerExpiry) > new Date() ? (
                            <span className="bg-[#1e40af] text-[#93c5fd] px-2 py-1 rounded text-xs">
                              Tier {user.resellerTier} - Exp:{" "}
                              {new Date(user.resellerExpiry).toLocaleDateString(
                                "id-ID"
                              )}
                            </span>
                          ) : user.resellerTier ? (
                            <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs">
                              Tier {user.resellerTier} (Expired)
                            </span>
                          ) : (
                            <span className="text-[#94a3b8] text-xs">
                              No Reseller
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
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center text-[#f1f5f9] font-semibold">
                              {user.firstName.charAt(0)}
                              {user.lastName.charAt(0)}
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-[#f1f5f9]">
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
                        className="text-[#60a5fa] hover:text-[#93c5fd] mr-3"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b]/70 backdrop-blur-2xl border border-white/10 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto text-[#f1f5f9] shadow-2xl">
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
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
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
                        className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9] placeholder-[#94a3b8] resize-none"
                      />
                      <p className="text-xs text-[#94a3b8] mt-1">
                        The system will automatically validate the cookie and
                        extract user information.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
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
                        className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9] placeholder-[#94a3b8]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9] placeholder-[#94a3b8]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9] placeholder-[#94a3b8]"
                      />
                    </div>
                  </>
                )}

                {activeTab === "admins" && (
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
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
                      className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9]"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                {activeTab !== "stock" && (
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
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
                      className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9] placeholder-[#94a3b8]"
                    />
                  </div>
                )}

                {(activeTab === "users" || activeTab === "admins") && (
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9] placeholder-[#94a3b8]"
                    />
                  </div>
                )}

                {activeTab === "users" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                        Reseller Package ({resellerPackages.length} packages
                        available)
                      </label>
                      <select
                        value={formData.resellerPackageId}
                        onChange={(e) => {
                          const selectedPackageId = e.target.value;
                          const selectedPackage = resellerPackages.find(
                            (pkg) => pkg._id === selectedPackageId
                          );

                          console.log(
                            "Selected Package ID:",
                            selectedPackageId
                          );
                          console.log("Selected Package:", selectedPackage);
                          console.log(
                            "All Reseller Packages:",
                            resellerPackages
                          );

                          if (selectedPackageId === "") {
                            // No reseller selected
                            setFormData({
                              ...formData,
                              resellerPackageId: "",
                              resellerTier: 0,
                              resellerExpiry: "",
                            });
                          } else {
                            // Package selected, set tier from package
                            setFormData({
                              ...formData,
                              resellerPackageId: selectedPackageId,
                              resellerTier: selectedPackage?.tier || 0,
                            });
                          }
                        }}
                        className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9]"
                      >
                        <option value="">No Reseller</option>
                        {resellerPackages
                          .filter((pkg) => pkg.isActive)
                          .map((pkg) => (
                            <option key={pkg._id} value={pkg._id}>
                              {pkg.name} - Tier {pkg.tier} ({pkg.discount}%
                              discount)
                            </option>
                          ))}
                      </select>
                      {resellerPackages.length === 0 && (
                        <p className="text-xs text-red-400 mt-1">
                          ⚠️ No reseller packages available. Please create
                          packages first.
                        </p>
                      )}
                      {resellerPackages.filter((pkg) => pkg.isActive).length ===
                        0 &&
                        resellerPackages.length > 0 && (
                          <p className="text-xs text-yellow-400 mt-1">
                            ⚠️ No active reseller packages. Please activate
                            packages in settings.
                          </p>
                        )}
                    </div>

                    {formData.resellerPackageId && (
                      <div>
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                          Reseller Expiry Date
                        </label>
                        <input
                          type="date"
                          value={formData.resellerExpiry}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              resellerExpiry: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9]"
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                {activeTab === "admins" && (
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
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
                      className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9]"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                )}

                {!selectedUser && activeTab !== "stock" && (
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required={!selectedUser}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-[#334155] rounded-lg focus:ring-2 focus:ring-[#3b82f6] bg-[#334155] text-[#f1f5f9] placeholder-[#94a3b8]"
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
                  className="px-4 py-2 border border-[#334155] rounded-lg hover:bg-[#334155] text-[#f1f5f9]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className={`px-4 py-2 text-[#f1f5f9] rounded-lg flex items-center ${
                    submitLoading
                      ? "bg-[#475569] cursor-not-allowed"
                      : "bg-[#3b82f6] hover:bg-[#1d4ed8]"
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
