"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function MidtransSetupPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    serverKey: "",
    clientKey: "",
    mode: "sandbox" as "sandbox" | "production",
  });
  const [currentConfig, setCurrentConfig] = useState<any>(null);

  useEffect(() => {
    fetchCurrentConfig();
  }, []);

  const fetchCurrentConfig = async () => {
    try {
      const response = await fetch("/api/midtrans-config");
      const data = await response.json();
      if (data.success) {
        setCurrentConfig(data.data);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/midtrans-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Midtrans configuration saved successfully!");
        fetchCurrentConfig();
        // Clear form
        setConfig({
          serverKey: "",
          clientKey: "",
          mode: "sandbox",
        });
      } else {
        toast.error(data.error || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    if (!config.serverKey || !config.clientKey) {
      toast.error("Please fill in server key and client key first");
      return;
    }

    setLoading(true);
    try {
      // Test by trying to create a test transaction
      const testData = {
        serviceType: "joki",
        serviceId: "test-connection",
        serviceName: "Test Connection",
        quantity: 1,
        unitPrice: 1000,
        robloxUsername: "testuser",
        robloxPassword: "testpass",
        customerInfo: {
          name: "Test User",
          email: "test@example.com",
          phone: "081234567890",
        },
        userId: null, // Guest checkout
      };

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });

      if (response.ok) {
        toast.success("Midtrans connection test successful!");
      } else {
        const error = await response.json();
        toast.error(`Connection test failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Test failed:", error);
      toast.error("Connection test failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Midtrans Configuration
          </h1>

          {/* Current Status */}
          {currentConfig && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                Current Configuration
              </h3>
              <div className="text-sm text-blue-700">
                <p>
                  Mode:{" "}
                  <span className="font-medium">
                    {currentConfig.midtransMode}
                  </span>
                </p>
                <p>
                  Server Key:{" "}
                  {currentConfig.hasServerKey ? "✅ Configured" : "❌ Not set"}
                </p>
                <p>
                  Client Key:{" "}
                  {currentConfig.hasClientKey ? "✅ Configured" : "❌ Not set"}
                </p>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">
              Setup Instructions
            </h3>
            <ol className="text-sm text-yellow-800 space-y-1">
              <li>
                1. Go to{" "}
                <a
                  href="https://dashboard.sandbox.midtrans.com/settings/config_info"
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Midtrans Sandbox Dashboard
                </a>
              </li>
              <li>2. Copy your Server Key and Client Key</li>
              <li>3. Paste them in the form below</li>
              <li>4. Click "Save Configuration"</li>
              <li>5. Test the connection</li>
            </ol>
          </div>

          {/* Configuration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode
              </label>
              <select
                value={config.mode}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    mode: e.target.value as "sandbox" | "production",
                  }))
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server Key
              </label>
              <input
                type="text"
                value={config.serverKey}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, serverKey: e.target.value }))
                }
                placeholder="SB-Mid-server-..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Key
              </label>
              <input
                type="text"
                value={config.clientKey}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, clientKey: e.target.value }))
                }
                placeholder="SB-Mid-client-..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Saving..." : "Save Configuration"}
              </button>

              <button
                type="button"
                onClick={testConnection}
                disabled={loading}
                className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Test Connection
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
