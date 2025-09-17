// src/app/admin/payment-methods/page.tsx
"use client";

import { useState, useEffect } from "react";

interface PaymentMethod {
  id: number;
  name: string;
  type: string;
  code: string;
  min_amount: number;
  max_amount: number;
  fee_type: "fixed" | "percentage";
  fee_amount: number;
  status: string;
  icon?: string;
  instructions?: string;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    type: "e-wallet",
    code: "",
    min_amount: "",
    max_amount: "",
    fee_type: "fixed",
    fee_amount: "",
    status: "active",
    instructions: "",
  });

  const paymentTypes = [
    "e-wallet",
    "bank_transfer",
    "virtual_account",
    "qris",
    "convenience_store",
  ];

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    const mockData: PaymentMethod[] = [
      {
        id: 1,
        name: "GoPay",
        type: "e-wallet",
        code: "GOPAY",
        min_amount: 10000,
        max_amount: 10000000,
        fee_type: "fixed",
        fee_amount: 1000,
        status: "active",
      },
      {
        id: 2,
        name: "DANA",
        type: "e-wallet",
        code: "DANA",
        min_amount: 10000,
        max_amount: 10000000,
        fee_type: "fixed",
        fee_amount: 1000,
        status: "active",
      },
      {
        id: 3,
        name: "BCA Virtual Account",
        type: "virtual_account",
        code: "BCA_VA",
        min_amount: 10000,
        max_amount: 50000000,
        fee_type: "fixed",
        fee_amount: 4000,
        status: "active",
      },
      {
        id: 4,
        name: "QRIS",
        type: "qris",
        code: "QRIS",
        min_amount: 1000,
        max_amount: 10000000,
        fee_type: "percentage",
        fee_amount: 0.7,
        status: "active",
      },
      {
        id: 5,
        name: "Indomaret",
        type: "convenience_store",
        code: "INDOMARET",
        min_amount: 10000,
        max_amount: 5000000,
        fee_type: "fixed",
        fee_amount: 5000,
        status: "active",
      },
    ];
    setMethods(mockData);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowModal(false);
    fetchMethods();
  };

  const handleToggleStatus = async (method: PaymentMethod) => {
    const newStatus = method.status === "active" ? "inactive" : "active";
    setMethods(
      methods.map((m) => (m.id === method.id ? { ...m, status: newStatus } : m))
    );
  };

  const handleDelete = async (id: number) => {
    if (confirm("Delete this payment method?")) {
      setMethods(methods.filter((m) => m.id !== id));
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "e-wallet":
        return "💳";
      case "bank_transfer":
        return "🏦";
      case "virtual_account":
        return "🏧";
      case "qris":
        return "📱";
      case "convenience_store":
        return "🏪";
      default:
        return "💰";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 bg-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Payment Methods</h2>
          <p className="mt-1 text-sm text-gray-400">
            Configure available payment methods and fees
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedMethod(null);
            setFormData({
              name: "",
              type: "e-wallet",
              code: "",
              min_amount: "",
              max_amount: "",
              fee_type: "fixed",
              fee_amount: "",
              status: "active",
              instructions: "",
            });
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center border border-blue-500"
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
          Add Method
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="bg-blue-900 rounded-lg p-3 text-2xl border border-blue-700">
              💳
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-300">Total Methods</p>
              <p className="text-2xl font-bold text-white">{methods.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="bg-green-900 rounded-lg p-3 text-2xl border border-green-700">
              ✅
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-300">Active</p>
              <p className="text-2xl font-bold text-white">
                {methods.filter((m) => m.status === "active").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="bg-purple-900 rounded-lg p-3 text-2xl border border-purple-700">
              💰
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-300">E-Wallets</p>
              <p className="text-2xl font-bold text-white">
                {methods.filter((m) => m.type === "e-wallet").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="bg-yellow-900 rounded-lg p-3 text-2xl border border-yellow-700">
              🏦
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-300">Bank Transfer</p>
              <p className="text-2xl font-bold text-white">
                {
                  methods.filter(
                    (m) =>
                      m.type === "bank_transfer" || m.type === "virtual_account"
                  ).length
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods List */}
      <div className="bg-gray-800 rounded-lg shadow border border-gray-700">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
            {methods.map((method) => (
              <div
                key={method.id}
                className="border border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center text-white">
                    <span className="text-3xl mr-3">
                      {getTypeIcon(method.type)}
                    </span>
                    <div>
                      <h3 className="font-semibold text-lg ">{method.name}</h3>
                      <p className="text-sm text-gray-400">
                        Code: {method.code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={method.status === "active"}
                        onChange={() => handleToggleStatus(method)}
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 mb-3 text-white">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Type:</span>
                    <span className="font-medium capitalize">
                      {method.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Min Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(method.min_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Max Amount:</span>
                    <span className="font-medium">
                      {formatCurrency(method.max_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Fee:</span>
                    <span className="font-medium">
                      {method.fee_type === "fixed"
                        ? formatCurrency(method.fee_amount)
                        : `${method.fee_amount}%`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                        method.status === "active"
                          ? "bg-green-900 text-green-300 border-green-700"
                          : "bg-gray-900 text-gray-400 border-gray-600"
                      }`}
                    >
                      {method.status}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedMethod(method);
                      setFormData({
                        name: method.name,
                        type: method.type,
                        code: method.code,
                        min_amount: method.min_amount.toString(),
                        max_amount: method.max_amount.toString(),
                        fee_type: method.fee_type,
                        fee_amount: method.fee_amount.toString(),
                        status: method.status,
                        instructions: method.instructions || "",
                      });
                      setShowModal(true);
                    }}
                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm border border-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="flex-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm border border-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-white">
              {selectedMethod ? "Edit Payment Method" : "Add Payment Method"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {paymentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Min Amount
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.min_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, min_amount: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Max Amount
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.max_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, max_amount: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Fee Type
                    </label>
                    <select
                      value={formData.fee_type}
                      onChange={(e) =>
                        setFormData({ ...formData, fee_type: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="fixed">Fixed</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Fee Amount {formData.fee_type === "percentage" && "(%)"}
                    </label>
                    <input
                      type="number"
                      step={formData.fee_type === "percentage" ? "0.1" : "1"}
                      required
                      value={formData.fee_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, fee_amount: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Instructions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData({ ...formData, instructions: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Payment instructions for users..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 border border-gray-500 text-white rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 border border-blue-500"
                >
                  {selectedMethod ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
