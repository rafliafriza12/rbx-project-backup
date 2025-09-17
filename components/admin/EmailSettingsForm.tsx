import { useState, useEffect } from "react";

interface EmailSettings {
  emailNotifications: boolean;
  emailProvider: string;
  emailHost: string;
  emailPort: number;
  emailUser: string;
  emailPassword: string;
  emailFromName: string;
  emailFromAddress: string;
  emailSecure: boolean;
}

interface EmailSettingsFormProps {
  onSave: (settings: Partial<EmailSettings>) => Promise<void>;
  isLoading?: boolean;
}

const EmailSettingsForm: React.FC<EmailSettingsFormProps> = ({
  onSave,
  isLoading = false,
}) => {
  const [settings, setSettings] = useState<EmailSettings>({
    emailNotifications: true,
    emailProvider: "smtp",
    emailHost: "smtp.gmail.com",
    emailPort: 587,
    emailUser: "",
    emailPassword: "",
    emailFromName: "RBX Store",
    emailFromAddress: "noreply@rbxstore.com",
    emailSecure: false,
  });

  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          const data = await response.json();
          setSettings((prev) => ({ ...prev, ...data.settings }));
        }
      } catch (error) {
        console.error("Error loading email settings:", error);
      }
    };
    loadSettings();
  }, []);

  const handleInputChange = (field: keyof EmailSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(settings);
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
      await onSave(settings);

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
      } else {
        setTestResult({
          success: false,
          message: data.error || "Test email gagal",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Terjadi kesalahan saat test email",
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const emailProviderPresets = {
    gmail: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
    },
    outlook: {
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false,
    },
    yahoo: {
      host: "smtp.mail.yahoo.com",
      port: 587,
      secure: false,
    },
    smtp: {
      host: "",
      port: 587,
      secure: false,
    },
  };

  const handleProviderChange = (provider: string) => {
    const preset =
      emailProviderPresets[provider as keyof typeof emailProviderPresets];
    if (preset) {
      setSettings((prev) => ({
        ...prev,
        emailProvider: provider,
        emailHost: preset.host,
        emailPort: preset.port,
        emailSecure: preset.secure,
      }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        ⚙️ Konfigurasi Email
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Notifications Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-semibold text-gray-700">
              Notifikasi Email
            </label>
            <p className="text-sm text-gray-600">
              Aktifkan pengiriman email invoice dan notifikasi
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                handleInputChange("emailNotifications", e.target.checked)
              }
            />
            <span className="slider round"></span>
          </label>
        </div>

        {/* Email Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Provider Email
          </label>
          <select
            value={settings.emailProvider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="gmail">Gmail</option>
            <option value="outlook">Outlook</option>
            <option value="yahoo">Yahoo Mail</option>
            <option value="smtp">Custom SMTP</option>
          </select>
        </div>

        {/* SMTP Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={settings.emailHost}
              onChange={(e) => handleInputChange("emailHost", e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              value={settings.emailPort}
              onChange={(e) =>
                handleInputChange("emailPort", parseInt(e.target.value))
              }
              placeholder="587"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Email Credentials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email User
            </label>
            <input
              type="email"
              value={settings.emailUser}
              onChange={(e) => handleInputChange("emailUser", e.target.value)}
              placeholder="your-email@gmail.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Password
            </label>
            <input
              type="password"
              value={settings.emailPassword}
              onChange={(e) =>
                handleInputChange("emailPassword", e.target.value)
              }
              placeholder="App Password atau Password Email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-yellow-600 mt-1">
              💡 Untuk Gmail, gunakan App Password bukan password biasa
            </p>
          </div>
        </div>

        {/* From Email Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Pengirim
            </label>
            <input
              type="text"
              value={settings.emailFromName}
              onChange={(e) =>
                handleInputChange("emailFromName", e.target.value)
              }
              placeholder="RBX Store"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Pengirim
            </label>
            <input
              type="email"
              value={settings.emailFromAddress}
              onChange={(e) =>
                handleInputChange("emailFromAddress", e.target.value)
              }
              placeholder="noreply@rbxstore.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* SSL/TLS Configuration */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="font-semibold text-gray-700">
              SSL/TLS Secure
            </label>
            <p className="text-sm text-gray-600">
              Aktifkan untuk port 465 (SSL). Nonaktifkan untuk port 587
              (STARTTLS)
            </p>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.emailSecure}
              onChange={(e) =>
                handleInputChange("emailSecure", e.target.checked)
              }
            />
            <span className="slider round"></span>
          </label>
        </div>

        {/* Test Email Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">
            🧪 Test Konfigurasi Email
          </h3>
          <div className="flex gap-3">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={handleTestEmail}
              disabled={isTestingEmail || !testEmail}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isTestingEmail ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Testing...
                </>
              ) : (
                "📧 Test Email"
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`mt-3 p-3 rounded-lg ${
                testResult.success
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{testResult.success ? "✅" : "❌"}</span>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Menyimpan...
              </>
            ) : (
              "💾 Simpan Konfigurasi"
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        .switch {
          position: relative;
          display: inline-block;
          width: 60px;
          height: 34px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: 0.4s;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 26px;
          width: 26px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.4s;
        }

        input:checked + .slider {
          background-color: #2196f3;
        }

        input:checked + .slider:before {
          transform: translateX(26px);
        }

        .slider.round {
          border-radius: 34px;
        }

        .slider.round:before {
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

export default EmailSettingsForm;
