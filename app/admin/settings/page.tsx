"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";

interface TabContent {
  id: string;
  label: string;
  icon: any;
}

interface Settings {
  // General Settings
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  discordInvite: string;
  businessHours: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;

  // Payment Gateway Settings
  midtransServerKey: string;
  midtransClientKey: string;
  midtransMode: string;

  // API External Settings
  robuxApiKey: string;
  robuxApiUrl: string;
  gamepassApiKey: string;
  gamepassApiUrl: string;
  discordWebhookUrl: string;
  telegramBotToken: string;
  telegramChatId: string;

  // Email Settings
  emailNotifications: boolean;
  emailProvider: string;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFromName: string;
  emailFromAddress: string;
  emailSecure: boolean;

  // Social Media Settings
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showServerKey, setShowServerKey] = useState(false);
  const [showClientKey, setShowClientKey] = useState(false);
  const [showRobuxApiKey, setShowRobuxApiKey] = useState(false);
  const [showGamepassApiKey, setShowGamepassApiKey] = useState(false);
  const [showTelegramBotToken, setShowTelegramBotToken] = useState(false);

  // Email testing states
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const tabs: TabContent[] = [
    {
      id: "general",
      label: "General Settings",
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      id: "payment",
      label: "Payment Gateway",
      icon: (
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      id: "api",
      label: "API External",
      icon: (
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
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      id: "email",
      label: "Email Settings",
      icon: (
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
            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      id: "social",
      label: "Social Media",
      icon: (
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
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
          />
        </svg>
      ),
    },
  ];

  // Fetch settings data
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings");
      const data = await response.json();

      if (response.ok) {
        setSettings(data.settings);
      } else {
        toast.error("Error loading settings: " + data.error);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    if (!settings) return;

    setSettings((prev) => ({
      ...prev!,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Settings berhasil disimpan!");
        setHasChanges(false);
        setSettings(data.settings);
      } else {
        toast.error("Error menyimpan settings: " + data.error);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Gagal menyimpan settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Yakin ingin reset semua settings ke default? Aksi ini tidak bisa dibatalkan."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/settings", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Settings berhasil direset!");
        setSettings(data.settings);
        setHasChanges(false);
      } else {
        toast.error("Error reset settings: " + data.error);
      }
    } catch (error) {
      console.error("Error resetting settings:", error);
      toast.error("Gagal reset settings");
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setTestResult({
        success: false,
        message: "Silakan masukkan email untuk test",
      });
      return;
    }

    setIsTestingEmail(true);
    setTestResult(null);

    try {
      // Save current settings first
      await handleSave();

      // Then test email
      const response = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({ success: true, message: data.message });
        toast.success("Test email berhasil dikirim!");
      } else {
        setTestResult({
          success: false,
          message: data.error || "Test email gagal",
        });
        toast.error("Test email gagal: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Terjadi kesalahan saat test email",
      });
      toast.error("Terjadi kesalahan saat test email");
    } finally {
      setIsTestingEmail(false);
    }
  };

  const renderTabContent = () => {
    if (!settings) return null;

    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Nama Website
                </label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) =>
                    handleInputChange("siteName", e.target.value)
                  }
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  placeholder="RBX Store"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Email Kontak
                </label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) =>
                    handleInputChange("contactEmail", e.target.value)
                  }
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  placeholder="contact@rbxstore.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={settings.contactPhone}
                  onChange={(e) =>
                    handleInputChange("contactPhone", e.target.value)
                  }
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  placeholder="+62812345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) =>
                    handleInputChange("whatsappNumber", e.target.value)
                  }
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  placeholder="+628123456789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Link Discord
                </label>
                <input
                  type="url"
                  value={settings.discordInvite}
                  onChange={(e) =>
                    handleInputChange("discordInvite", e.target.value)
                  }
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  placeholder="https://discord.gg/rbxstore"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Jam Operasional
                </label>
                <input
                  type="text"
                  value={settings.businessHours}
                  onChange={(e) =>
                    handleInputChange("businessHours", e.target.value)
                  }
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  placeholder="24/7"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Deskripsi Website
              </label>
              <textarea
                value={settings.siteDescription}
                onChange={(e) =>
                  handleInputChange("siteDescription", e.target.value)
                }
                rows={3}
                className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                placeholder="Platform jual beli Robux, Gamepass, dan Jasa Joki terpercaya"
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) =>
                    handleInputChange("maintenanceMode", e.target.checked)
                  }
                  className="mr-3"
                />
                <label className="text-sm font-medium text-[#cbd5e1]">
                  Mode Maintenance
                </label>
              </div>

              {settings.maintenanceMode && (
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Pesan Maintenance
                  </label>
                  <textarea
                    value={settings.maintenanceMessage}
                    onChange={(e) =>
                      handleInputChange("maintenanceMessage", e.target.value)
                    }
                    rows={2}
                    className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                    placeholder="Situs sedang dalam pemeliharaan. Silakan coba lagi nanti."
                  />
                </div>
              )}
            </div>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-blue-800 font-semibold mb-2">
                ⚙️ Konfigurasi Midtrans Payment Gateway
              </h3>
              <p className="text-[#3b82f6] text-sm">
                Silakan masukkan kredensial Midtrans untuk mengaktifkan payment
                gateway
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Midtrans Server Key
                </label>
                <div className="relative">
                  <input
                    type={showServerKey ? "text" : "password"}
                    value={settings.midtransServerKey}
                    onChange={(e) =>
                      handleInputChange("midtransServerKey", e.target.value)
                    }
                    className="w-full p-3 pr-12 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                    placeholder="Masukkan Server Key Midtrans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowServerKey(!showServerKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94a3b8] hover:text-[#475569]"
                  >
                    {showServerKey ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Midtrans Client Key
                </label>
                <div className="relative">
                  <input
                    type={showClientKey ? "text" : "password"}
                    value={settings.midtransClientKey}
                    onChange={(e) =>
                      handleInputChange("midtransClientKey", e.target.value)
                    }
                    className="w-full p-3 pr-12 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                    placeholder="Masukkan Client Key Midtrans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClientKey(!showClientKey)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94a3b8] hover:text-[#475569]"
                  >
                    {showClientKey ? (
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
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                        />
                      </svg>
                    ) : (
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Mode Midtrans
                </label>
                <select
                  value={settings.midtransMode}
                  onChange={(e) =>
                    handleInputChange("midtransMode", e.target.value)
                  }
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9]"
                >
                  <option value="sandbox">Sandbox (Testing)</option>
                  <option value="production">Production (Live)</option>
                </select>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-yellow-800 font-medium mb-2">
                ⚠️ Petunjuk Konfigurasi
              </h4>
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>
                  • Daftar akun di{" "}
                  <a
                    href="https://midtrans.com"
                    className="text-[#3b82f6] underline"
                    target="_blank"
                  >
                    Midtrans.com
                  </a>
                </li>
                <li>
                  • Ambil Server Key dan Client Key dari dashboard Midtrans
                </li>
                <li>• Gunakan mode Sandbox untuk testing</li>
                <li>• Pindah ke Production ketika sudah siap live</li>
              </ul>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="text-green-800 font-semibold mb-2">
                🔌 API External Configuration
              </h3>
              <p className="text-green-600 text-sm">
                Konfigurasi API eksternal untuk integrasi dengan layanan lain
              </p>
            </div>

            {/* Robux API */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-[#1e293b] mb-4">
                🎮 Robux API
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Robux API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showRobuxApiKey ? "text" : "password"}
                      value={settings.robuxApiKey}
                      onChange={(e) =>
                        handleInputChange("robuxApiKey", e.target.value)
                      }
                      className="w-full p-3 pr-12 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                      placeholder="API Key untuk layanan Robux"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRobuxApiKey(!showRobuxApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94a3b8] hover:text-[#475569]"
                    >
                      {showRobuxApiKey ? (
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
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Robux API URL
                  </label>
                  <input
                    type="url"
                    value={settings.robuxApiUrl}
                    onChange={(e) =>
                      handleInputChange("robuxApiUrl", e.target.value)
                    }
                    className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                    placeholder="https://api.robux-provider.com"
                  />
                </div>
              </div>
            </div>

            {/* Gamepass API */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-[#1e293b] mb-4">
                🎯 Gamepass API
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Gamepass API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showGamepassApiKey ? "text" : "password"}
                      value={settings.gamepassApiKey}
                      onChange={(e) =>
                        handleInputChange("gamepassApiKey", e.target.value)
                      }
                      className="w-full p-3 pr-12 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                      placeholder="API Key untuk layanan Gamepass"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGamepassApiKey(!showGamepassApiKey)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94a3b8] hover:text-[#475569]"
                    >
                      {showGamepassApiKey ? (
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
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                          />
                        </svg>
                      ) : (
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Gamepass API URL
                  </label>
                  <input
                    type="url"
                    value={settings.gamepassApiUrl}
                    onChange={(e) =>
                      handleInputChange("gamepassApiUrl", e.target.value)
                    }
                    className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                    placeholder="https://api.gamepass-provider.com"
                  />
                </div>
              </div>
            </div>

            {/* Notification APIs */}
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold text-[#1e293b] mb-4">
                📢 Notification APIs
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Discord Webhook URL
                  </label>
                  <input
                    type="url"
                    value={settings.discordWebhookUrl}
                    onChange={(e) =>
                      handleInputChange("discordWebhookUrl", e.target.value)
                    }
                    className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                      Telegram Bot Token
                    </label>
                    <div className="relative">
                      <input
                        type={showTelegramBotToken ? "text" : "password"}
                        value={settings.telegramBotToken}
                        onChange={(e) =>
                          handleInputChange("telegramBotToken", e.target.value)
                        }
                        className="w-full p-3 pr-12 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                        placeholder="Bot Token dari @BotFather"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowTelegramBotToken(!showTelegramBotToken)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94a3b8] hover:text-[#475569]"
                      >
                        {showTelegramBotToken ? (
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
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                            />
                          </svg>
                        ) : (
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                      Telegram Chat ID
                    </label>
                    <input
                      type="text"
                      value={settings.telegramChatId}
                      onChange={(e) =>
                        handleInputChange("telegramChatId", e.target.value)
                      }
                      className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                      placeholder="Chat ID untuk notifikasi"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "email":
        return (
          <div className="space-y-6">
            <div className="bg-[#1e3a8a]/20 border border-[#1d4ed8] rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <svg
                  className="w-6 h-6 text-[#60a5fa]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-[#60a5fa]">
                    📧 Konfigurasi Email Invoice
                  </h3>
                  <p className="text-[#93c5fd] text-sm">
                    Atur pengiriman email invoice otomatis untuk customer
                  </p>
                </div>
              </div>
            </div>

            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#1e293b] rounded-lg border border-[#334155]">
              <div>
                <label className="font-semibold text-[#cbd5e1]">
                  Notifikasi Email
                </label>
                <p className="text-sm text-[#94a3b8]">
                  Aktifkan pengiriman email invoice dan notifikasi
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications || false}
                  onChange={(e) =>
                    handleInputChange("emailNotifications", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#475569] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1e293b] after:border-[#334155] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b82f6]"></div>
              </label>
            </div>

            {/* Email Provider */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Provider Email
              </label>
              <select
                value={settings.emailProvider || "smtp"}
                onChange={(e) => {
                  const provider = e.target.value;
                  handleInputChange("emailProvider", provider);

                  // Auto-fill based on provider
                  const presets: any = {
                    gmail: {
                      emailHost: "smtp.gmail.com",
                      emailPort: 587,
                      emailSecure: false,
                    },
                    outlook: {
                      emailHost: "smtp-mail.outlook.com",
                      emailPort: 587,
                      emailSecure: false,
                    },
                    yahoo: {
                      emailHost: "smtp.mail.yahoo.com",
                      emailPort: 587,
                      emailSecure: false,
                    },
                    smtp: { emailHost: "", emailPort: 587, emailSecure: false },
                  };

                  if (presets[provider]) {
                    Object.keys(presets[provider]).forEach((key) => {
                      handleInputChange(key, presets[provider][key]);
                    });
                  }
                }}
                className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9]"
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="yahoo">Yahoo Mail</option>
                <option value="smtp">Custom SMTP</option>
              </select>
            </div>

            {/* SMTP Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  SMTP Host
                </label>
                <input
                  type="text"
                  value={settings.emailHost || ""}
                  onChange={(e) =>
                    handleInputChange("emailHost", e.target.value)
                  }
                  placeholder="smtp.gmail.com"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  SMTP Port
                </label>
                <input
                  type="number"
                  value={settings.emailPort || 587}
                  onChange={(e) =>
                    handleInputChange("emailPort", parseInt(e.target.value))
                  }
                  placeholder="587"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  required
                />
              </div>
            </div>

            {/* Email Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Email User
                </label>
                <input
                  type="email"
                  value={settings.emailUser || ""}
                  onChange={(e) =>
                    handleInputChange("emailUser", e.target.value)
                  }
                  placeholder="your-email@gmail.com"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Email Password
                </label>
                <input
                  type="password"
                  value={settings.emailPassword || ""}
                  onChange={(e) =>
                    handleInputChange("emailPassword", e.target.value)
                  }
                  placeholder="App Password atau Password Email"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  required
                />
                <p className="text-xs text-yellow-400 mt-1">
                  💡 Untuk Gmail, gunakan App Password bukan password biasa
                </p>
              </div>
            </div>

            {/* From Email Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Nama Pengirim
                </label>
                <input
                  type="text"
                  value={settings.emailFromName || "RBX Store"}
                  onChange={(e) =>
                    handleInputChange("emailFromName", e.target.value)
                  }
                  placeholder="RBX Store"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Email Pengirim
                </label>
                <input
                  type="email"
                  value={settings.emailFromAddress || ""}
                  onChange={(e) =>
                    handleInputChange("emailFromAddress", e.target.value)
                  }
                  placeholder="noreply@rbxstore.com"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  required
                />
              </div>
            </div>

            {/* SSL/TLS Configuration */}
            {/* <div className="flex items-center justify-between p-4 bg-[#1e293b] rounded-lg border border-[#334155]">
              <div>
                <label className="font-semibold text-[#cbd5e1]">
                  SSL/TLS Secure
                </label>
                <p className="text-sm text-[#94a3b8]">
                  Aktifkan untuk port 465 (SSL). Nonaktifkan untuk port 587
                  (STARTTLS)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailSecure || false}
                  onChange={(e) =>
                    handleInputChange("emailSecure", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#475569] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#1e293b] after:border-[#334155] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3b82f6]"></div>
              </label>
            </div> */}

            {/* Test Email Section */}
            {/* <div className="border-t border-[#334155] pt-6">
              <h3 className="text-lg font-semibold mb-4 text-[#cbd5e1]">
                🧪 Test Konfigurasi Email
              </h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="flex-1 p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={isTestingEmail || !testEmail}
                  className="px-6 py-3 bg-[#3b82f6] text-[#f1f5f9] rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {isTestingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Test Email
                    </>
                  )}
                </button>
              </div>

              {testResult && (
                <div
                  className={`mt-3 p-3 rounded-lg border ${
                    testResult.success
                      ? "bg-green-900/20 border-green-700 text-green-400"
                      : "bg-red-900/20 border-red-700 text-red-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{testResult.success ? "✅" : "❌"}</span>
                    <span>{testResult.message}</span>
                  </div>
                </div>
              )}
            </div> */}

            {/* Info Section */}
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-400 mb-2">
                📋 Petunjuk Setup Gmail:
              </h4>
              <ol className="text-sm text-yellow-300 space-y-1 list-decimal list-inside">
                <li>Buka Google Account → Security → 2-Step Verification</li>
                <li>Scroll ke bawah dan pilih "App passwords"</li>
                <li>Generate app password untuk "Mail"</li>
                <li>
                  Gunakan app password tersebut, bukan password Google biasa
                </li>
                <li>Host: smtp.gmail.com, Port: 587, Secure: false</li>
              </ol>
            </div>
          </div>
        );

      case "social":
        return (
          <div className="space-y-6">
            <div className="bg-[#1e3a8a]/20 border border-[#1d4ed8] rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#60a5fa] mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="font-semibold text-[#60a5fa] mb-1">
                    Social Media Links
                  </h3>
                  <p className="text-sm text-[#94a3b8]">
                    Konfigurasi link social media yang akan ditampilkan di
                    footer website. Link ini akan otomatis muncul jika diisi.
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-semibold text-[#cbd5e1] mb-2">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={settings.whatsappNumber || ""}
                  onChange={(e) =>
                    handleInputChange("whatsappNumber", e.target.value)
                  }
                  placeholder="+628123456789"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Format: +62xxx (dengan kode negara)
                </p>
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-semibold text-[#cbd5e1] mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.instagramUrl || ""}
                  onChange={(e) =>
                    handleInputChange("instagramUrl", e.target.value)
                  }
                  placeholder="https://instagram.com/username"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Kosongkan jika tidak ingin ditampilkan
                </p>
              </div>

              {/* Discord */}
              <div>
                <label className="block text-sm font-semibold text-[#cbd5e1] mb-2">
                  Discord Invite URL
                </label>
                <input
                  type="url"
                  value={settings.discordInvite || ""}
                  onChange={(e) =>
                    handleInputChange("discordInvite", e.target.value)
                  }
                  placeholder="https://discord.gg/yourserver"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Link invite Discord server Anda
                </p>
              </div>

              {/* Facebook */}
              <div>
                <label className="block text-sm font-semibold text-[#cbd5e1] mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settings.facebookUrl || ""}
                  onChange={(e) =>
                    handleInputChange("facebookUrl", e.target.value)
                  }
                  placeholder="https://facebook.com/yourpage"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Kosongkan jika tidak ingin ditampilkan
                </p>
              </div>

              {/* Twitter/X */}
              <div>
                <label className="block text-sm font-semibold text-[#cbd5e1] mb-2">
                  Twitter/X URL
                </label>
                <input
                  type="url"
                  value={settings.twitterUrl || ""}
                  onChange={(e) =>
                    handleInputChange("twitterUrl", e.target.value)
                  }
                  placeholder="https://twitter.com/username"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Kosongkan jika tidak ingin ditampilkan
                </p>
              </div>

              {/* YouTube */}
              <div>
                <label className="block text-sm font-semibold text-[#cbd5e1] mb-2">
                  YouTube URL
                </label>
                <input
                  type="url"
                  value={settings.youtubeUrl || ""}
                  onChange={(e) =>
                    handleInputChange("youtubeUrl", e.target.value)
                  }
                  placeholder="https://youtube.com/@channel"
                  className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                />
                <p className="text-xs text-[#94a3b8] mt-1">
                  Kosongkan jika tidak ingin ditampilkan
                </p>
              </div>
            </div>

            {/* Preview Section */}
            <div className="border-t border-[#334155] pt-6">
              <h3 className="text-lg font-semibold mb-4 text-[#cbd5e1]">
                👁️ Preview Social Media Icons
              </h3>
              <div className="bg-[#1e293b] rounded-lg p-6 border border-[#334155]">
                <p className="text-sm text-[#94a3b8] mb-4">
                  Icon yang akan tampil di footer:
                </p>
                <div className="flex gap-4">
                  {settings.whatsappNumber && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-400/30">
                        <span className="text-green-400">📱</span>
                      </div>
                      <span className="text-xs text-[#94a3b8]">WhatsApp</span>
                    </div>
                  )}
                  {settings.instagramUrl && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center border border-pink-400/30">
                        <span className="text-pink-400">📷</span>
                      </div>
                      <span className="text-xs text-[#94a3b8]">Instagram</span>
                    </div>
                  )}
                  {settings.discordInvite && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-400/30">
                        <span className="text-blue-400">💬</span>
                      </div>
                      <span className="text-xs text-[#94a3b8]">Discord</span>
                    </div>
                  )}
                  {settings.facebookUrl && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                        <span className="text-blue-500">👥</span>
                      </div>
                      <span className="text-xs text-[#94a3b8]">Facebook</span>
                    </div>
                  )}
                  {settings.twitterUrl && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-sky-500/20 rounded-xl flex items-center justify-center border border-sky-400/30">
                        <span className="text-sky-400">🐦</span>
                      </div>
                      <span className="text-xs text-[#94a3b8]">Twitter/X</span>
                    </div>
                  )}
                  {settings.youtubeUrl && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-400/30">
                        <span className="text-red-400">▶️</span>
                      </div>
                      <span className="text-xs text-[#94a3b8]">YouTube</span>
                    </div>
                  )}
                  {!settings.whatsappNumber &&
                    !settings.instagramUrl &&
                    !settings.discordInvite &&
                    !settings.facebookUrl &&
                    !settings.twitterUrl &&
                    !settings.youtubeUrl && (
                      <div className="text-[#94a3b8] text-sm italic">
                        Belum ada social media yang dikonfigurasi
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">💡 Tips:</h4>
              <ul className="text-sm text-blue-300 space-y-1 list-disc list-inside">
                <li>Gunakan URL lengkap (termasuk https://)</li>
                <li>
                  WhatsApp harus menggunakan format internasional (+62xxx)
                </li>
                <li>Icon hanya akan muncul jika URL diisi</li>
                <li>Simpan perubahan sebelum meninggalkan halaman</li>
              </ul>
            </div>
          </div>
        );

      default:
        return <div>Tab tidak ditemukan</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-[#0f172a]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        <span className="ml-3 text-[#94a3b8]">Memuat settings...</span>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12 bg-[#0f172a]">
        <p className="text-[#94a3b8] mb-4">Gagal memuat settings</p>
        <button
          onClick={fetchSettings}
          className="bg-[#3b82f6] text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#0f172a] min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#f1f5f9]">
            Pengaturan Website
          </h1>
          <p className="text-[#94a3b8] mt-1">
            Kelola konfigurasi website, payment gateway, dan API eksternal
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="bg-red-600 text-[#f1f5f9] px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Reset Default
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-4 py-2 rounded-lg transition-colors ${
              saving || !hasChanges
                ? "bg-[#475569] text-[#94a3b8] cursor-not-allowed"
                : "bg-[#3b82f6] text-[#f1f5f9] hover:bg-[#1d4ed8]"
            }`}
          >
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg shadow">
        <div className="border-b border-[#334155]">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? "border-blue-400 text-[#60a5fa]"
                    : "border-transparent text-[#94a3b8] hover:text-[#cbd5e1] hover:border-[#334155]"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>
      </div>

      {/* Changes indicator */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-900 border border-yellow-700 text-yellow-300 px-4 py-2 rounded-lg shadow-lg">
          Ada perubahan yang belum disimpan
        </div>
      )}
    </div>
  );
}
