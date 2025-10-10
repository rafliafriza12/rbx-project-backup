"use client";

import { useState } from "react";
import { toast } from "react-toastify";

interface ResendInvoiceForm {
  transactionId: string;
  invoiceId: string;
  email: string;
}

export default function EmailManagementPage() {
  const [isResending, setIsResending] = useState(false);
  const [form, setForm] = useState<ResendInvoiceForm>({
    transactionId: "",
    invoiceId: "",
    email: "",
  });
  const [searchType, setSearchType] = useState<"transactionId" | "invoiceId">(
    "invoiceId"
  );

  const handleInputChange = (field: keyof ResendInvoiceForm, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleResendInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.transactionId && !form.invoiceId) {
      toast.error("Silakan masukkan Transaction ID atau Invoice ID");
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch("/api/email/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId: form.transactionId || undefined,
          invoiceId: form.invoiceId || undefined,
          email: form.email || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Email invoice berhasil dikirim ke ${data.sentTo}`);
        // Reset form
        setForm({
          transactionId: "",
          invoiceId: "",
          email: "",
        });
      } else {
        toast.error(data.error || "Gagal mengirim email invoice");
      }
    } catch (error) {
      console.error("Error resending invoice:", error);
      toast.error("Terjadi kesalahan saat mengirim email");
    } finally {
      setIsResending(false);
    }
  };

  const clearForm = () => {
    setForm({
      transactionId: "",
      invoiceId: "",
      email: "",
    });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1e293b] rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-[#f1f5f9] flex items-center gap-3">
              <svg
                className="w-8 h-8"
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
              📧 Email Invoice Management
            </h1>
            <p className="text-blue-100 mt-1">
              Kirim ulang email invoice ke customer
            </p>
          </div>

          <div className="p-6">
            {/* Info Card */}
            <div className="bg-[#1e3a8a]/20 border border-[#1d4ed8] rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  className="w-6 h-6 text-[#60a5fa] mt-0.5"
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
                    Kapan menggunakan fitur ini?
                  </h3>
                  <ul className="text-[#93c5fd] text-sm space-y-1">
                    <li>• Customer kehilangan email invoice</li>
                    <li>• Customer mengganti email address</li>
                    <li>• Email gagal terkirim saat transaksi dibuat</li>
                    <li>• Testing template email invoice</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Resend Invoice Form */}
            <form onSubmit={handleResendInvoice} className="space-y-6">
              {/* Search Type Selection */}
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-3">
                  Cari Transaksi Berdasarkan:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="invoiceId"
                      checked={searchType === "invoiceId"}
                      onChange={(e) => {
                        setSearchType(e.target.value as "invoiceId");
                        clearForm();
                      }}
                      className="w-4 h-4 text-[#3b82f6] bg-[#334155] border-[#334155] focus:ring-[#3b82f6]"
                    />
                    <span className="ml-2 text-[#cbd5e1]">Invoice ID</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="transactionId"
                      checked={searchType === "transactionId"}
                      onChange={(e) => {
                        setSearchType(e.target.value as "transactionId");
                        clearForm();
                      }}
                      className="w-4 h-4 text-[#3b82f6] bg-[#334155] border-[#334155] focus:ring-[#3b82f6]"
                    />
                    <span className="ml-2 text-[#cbd5e1]">Transaction ID</span>
                  </label>
                </div>
              </div>

              {/* Transaction/Invoice ID Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {searchType === "invoiceId" ? (
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                      Invoice ID *
                    </label>
                    <input
                      type="text"
                      value={form.invoiceId}
                      onChange={(e) =>
                        handleInputChange("invoiceId", e.target.value)
                      }
                      placeholder="INV-1234567890-ABC123"
                      className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                      required
                    />
                    <p className="text-xs text-[#94a3b8] mt-1">
                      Format: INV-timestamp-random (contoh:
                      INV-1694621234567-ABC123)
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                      Transaction ID *
                    </label>
                    <input
                      type="text"
                      value={form.transactionId}
                      onChange={(e) =>
                        handleInputChange("transactionId", e.target.value)
                      }
                      placeholder="60f7b3b3b3b3b3b3b3b3b3b3"
                      className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                      required
                    />
                    <p className="text-xs text-[#94a3b8] mt-1">
                      MongoDB ObjectID (24 karakter hexadecimal)
                    </p>
                  </div>
                )}

                {/* Email Override */}
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                    Email Tujuan (Opsional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full p-3 bg-[#334155] border border-[#334155] rounded-lg focus:ring-[#3b82f6] focus:border-[#3b82f6] text-[#f1f5f9] placeholder-[#94a3b8]"
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Kosongkan untuk menggunakan email dari transaksi
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isResending}
                  className="flex-1 md:flex-none px-8 py-3 bg-[#3b82f6] text-[#f1f5f9] rounded-lg hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {isResending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Mengirim Email...
                    </>
                  ) : (
                    <>
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
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Kirim Email Invoice
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={clearForm}
                  className="px-6 py-3 bg-[#475569] text-[#f1f5f9] rounded-lg hover:bg-[#334155] transition-colors"
                >
                  Clear Form
                </button>
              </div>
            </form>

            {/* Instructions */}
            <div className="mt-8 border-t border-[#334155] pt-6">
              <h3 className="text-lg font-semibold text-[#cbd5e1] mb-4">
                📋 Cara Menggunakan:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-[#94a3b8]">
                    1. Cari Invoice ID:
                  </h4>
                  <ul className="text-sm text-[#64748b] space-y-1 list-disc list-inside">
                    <li>Buka halaman Transactions di admin</li>
                    <li>Copy Invoice ID (contoh: INV-1234567890-ABC123)</li>
                    <li>Paste ke form di atas</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-[#94a3b8]">
                    2. Override Email (Opsional):
                  </h4>
                  <ul className="text-sm text-[#64748b] space-y-1 list-disc list-inside">
                    <li>Kosongkan untuk email dari database</li>
                    <li>Isi jika customer ganti email</li>
                    <li>Email akan tersimpan di database</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-6 bg-[#1e293b]/50 rounded-lg p-4">
              <h4 className="font-medium text-[#94a3b8] mb-3">❓ FAQ:</h4>
              <div className="space-y-2 text-sm">
                <details className="text-[#64748b]">
                  <summary className="cursor-pointer text-[#94a3b8] hover:text-[#cbd5e1]">
                    Email tidak terkirim, apa yang harus dicek?
                  </summary>
                  <div className="mt-2 pl-4 border-l-2 border-[#334155]">
                    <p>
                      1. Pastikan konfigurasi email sudah benar di Settings →
                      Email Settings
                    </p>
                    <p>2. Test email configuration dulu</p>
                    <p>3. Check console log untuk error details</p>
                    <p>4. Untuk Gmail, pastikan menggunakan App Password</p>
                  </div>
                </details>

                <details className="text-[#64748b]">
                  <summary className="cursor-pointer text-[#94a3b8] hover:text-[#cbd5e1]">
                    Bisakah mengirim ke email yang berbeda dari transaksi?
                  </summary>
                  <div className="mt-2 pl-4 border-l-2 border-[#334155]">
                    <p>
                      Ya, masukkan email baru di field "Email Tujuan". Email
                      baru akan tersimpan di database menggantikan email lama.
                    </p>
                  </div>
                </details>

                <details className="text-[#64748b]">
                  <summary className="cursor-pointer text-[#94a3b8] hover:text-[#cbd5e1]">
                    Apakah template email bisa dikustomisasi?
                  </summary>
                  <div className="mt-2 pl-4 border-l-2 border-[#334155]">
                    <p>
                      Ya, edit file{" "}
                      <code className="bg-[#334155] px-1 rounded">
                        lib/email.ts
                      </code>{" "}
                      pada method{" "}
                      <code className="bg-[#334155] px-1 rounded">
                        generateInvoiceTemplate()
                      </code>{" "}
                      untuk mengubah template.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
