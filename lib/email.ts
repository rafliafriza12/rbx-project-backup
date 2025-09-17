import nodemailer from "nodemailer";
import Settings from "@/models/Settings";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  private static async getEmailConfig(): Promise<EmailConfig> {
    const settings = await Settings.getSiteSettings();

    return {
      host: settings.emailHost || "smtp.gmail.com",
      port: settings.emailPort || 587,
      secure: settings.emailSecure || false,
      auth: {
        user: settings.emailUser || "",
        pass: settings.emailPassword || "",
      },
    };
  }

  private static async createTransporter(): Promise<nodemailer.Transporter> {
    if (!this.transporter) {
      const config = await this.getEmailConfig();

      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    return this.transporter!;
  }

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const settings = await Settings.getSiteSettings();

      // Check if email notifications are enabled
      if (!settings.emailNotifications) {
        console.log("Email notifications are disabled");
        return false;
      }

      // Check if email configuration is complete
      if (!settings.emailUser || !settings.emailPassword) {
        console.error("Email configuration incomplete");
        return false;
      }

      const transporter = await this.createTransporter();

      const mailOptions = {
        from: `${settings.emailFromName || "RobuxID"} <${
          settings.emailFromAddress || settings.emailUser
        }>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      };

      const result = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);

      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  static async sendInvoiceEmail(transactionData: any): Promise<boolean> {
    try {
      const settings = await Settings.getSiteSettings();
      const invoiceHtml = this.generateInvoiceTemplate(
        transactionData,
        settings
      );

      const emailOptions: EmailOptions = {
        to: transactionData.customerInfo.email,
        subject: `Invoice #${transactionData.invoiceId} - ${
          settings.siteName || "RobuxID"
        }`,
        html: invoiceHtml,
      };

      return await this.sendEmail(emailOptions);
    } catch (error) {
      console.error("Error sending invoice email:", error);
      return false;
    }
  }

  private static generateInvoiceTemplate(
    transaction: any,
    settings: any
  ): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(amount);
    };

    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(date));
    };

    const getServiceTypeLabel = (type: string) => {
      const labels: { [key: string]: string } = {
        robux: "Robux",
        gamepass: "Gamepass",
        joki: "Jasa Joki",
      };
      return labels[type] || type;
    };

    const getStatusLabel = (status: string) => {
      const labels: { [key: string]: string } = {
        pending: "Menunggu Pembayaran",
        settlement: "Sudah Dibayar",
        expired: "Kadaluarsa",
        cancelled: "Dibatalkan",
        failed: "Gagal",
      };
      return labels[status] || status;
    };

    const getStatusColor = (status: string) => {
      const colors: { [key: string]: string } = {
        pending: "#f59e0b",
        settlement: "#10b981",
        expired: "#6b7280",
        cancelled: "#ef4444",
        failed: "#ef4444",
      };
      return colors[status] || "#6b7280";
    };

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${transaction.invoiceId}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .invoice-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .content {
            padding: 30px;
        }
        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        .invoice-info div {
            flex: 1;
            min-width: 250px;
            margin-bottom: 20px;
        }
        .info-label {
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 1.1em;
            color: #2d3748;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }
        .table-container {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
        }
        .table th {
            background: #e2e8f0;
            color: #4a5568;
            font-weight: 600;
            padding: 15px;
            text-align: left;
            border-bottom: 2px solid #cbd5e0;
        }
        .table td {
            padding: 15px;
            border-bottom: 1px solid #e2e8f0;
        }
        .table tr:hover {
            background: #f1f5f9;
        }
        .total-row {
            background: #667eea !important;
            color: white;
            font-weight: 600;
            font-size: 1.1em;
        }
        .total-row td {
            border-bottom: none;
        }
        .customer-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .customer-info h3 {
            margin-top: 0;
            color: #4a5568;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }
        .roblox-info {
            background: #e6fffa;
            border-left: 4px solid #38b2ac;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .joki-details {
            background: #fef5e7;
            border-left: 4px solid #f6ad55;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0 8px 8px 0;
        }
        .footer {
            background: #2d3748;
            color: white;
            padding: 30px;
            text-align: center;
        }
        .footer p {
            margin: 5px 0;
        }
        .contact-info {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
            flex-wrap: wrap;
        }
        .contact-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .important-note {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            color: #b91c1c;
        }
        .payment-instruction {
            background: #f0f9ff;
            border: 1px solid #bae6fd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .content {
                padding: 20px;
            }
            .invoice-info {
                flex-direction: column;
            }
            .contact-info {
                flex-direction: column;
                gap: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <h1>${settings.siteName || "RobuxID"}</h1>
            <p>Invoice Pembelian ${getServiceTypeLabel(
              transaction.serviceType
            )}</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Invoice Info -->
            <div class="invoice-info">
                <div>
                    <div class="info-label">Invoice ID</div>
                    <div class="info-value">#${transaction.invoiceId}</div>
                </div>
                <div>
                    <div class="info-label">Tanggal Dibuat</div>
                    <div class="info-value">${formatDate(
                      transaction.createdAt
                    )}</div>
                </div>
                <div>
                    <div class="info-label">Status Pembayaran</div>
                    <div class="info-value">
                        <span class="status-badge" style="background-color: ${getStatusColor(
                          transaction.paymentStatus
                        )}">
                            ${getStatusLabel(transaction.paymentStatus)}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Customer Info -->
            <div class="customer-info">
                <h3>📋 Informasi Customer</h3>
                <p><strong>Nama:</strong> ${
                  transaction.customerInfo.name || "Guest"
                }</p>
                <p><strong>Email:</strong> ${transaction.customerInfo.email}</p>
                ${
                  transaction.customerInfo.phone
                    ? `<p><strong>Telepon:</strong> ${transaction.customerInfo.phone}</p>`
                    : ""
                }
            </div>

            <!-- Roblox Account Info -->
            <div class="roblox-info">
                <h3>🎮 Informasi Akun Roblox</h3>
                <p><strong>Username:</strong> ${transaction.robloxUsername}</p>
                ${
                  transaction.robloxPassword
                    ? "<p><strong>Password:</strong> ••••••••••</p>"
                    : ""
                }
                <p><em>Data akun Anda aman dan tidak akan disalahgunakan.</em></p>
            </div>

            <!-- Joki Details (if applicable) -->
            ${
              transaction.serviceType === "joki" && transaction.jokiDetails
                ? `
            <div class="joki-details">
                <h3>🚀 Detail Jasa Joki</h3>
                ${
                  transaction.jokiDetails.gameType
                    ? `<p><strong>Jenis Game:</strong> ${transaction.jokiDetails.gameType}</p>`
                    : ""
                }
                ${
                  transaction.jokiDetails.targetLevel
                    ? `<p><strong>Target Level:</strong> ${transaction.jokiDetails.targetLevel}</p>`
                    : ""
                }
                ${
                  transaction.jokiDetails.estimatedTime
                    ? `<p><strong>Estimasi Waktu:</strong> ${transaction.jokiDetails.estimatedTime}</p>`
                    : ""
                }
                ${
                  transaction.jokiDetails.description
                    ? `<p><strong>Deskripsi:</strong> ${transaction.jokiDetails.description}</p>`
                    : ""
                }
                ${
                  transaction.jokiDetails.notes
                    ? `<p><strong>Catatan:</strong> ${transaction.jokiDetails.notes}</p>`
                    : ""
                }
            </div>
            `
                : ""
            }

            <!-- Order Details -->
            <div class="table-container">
                <h3>📦 Detail Pesanan</h3>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Jenis Layanan</th>
                            <th>Kuantitas</th>
                            <th>Harga Satuan</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${transaction.serviceName}</td>
                            <td>${getServiceTypeLabel(
                              transaction.serviceType
                            )}</td>
                            <td>${transaction.quantity.toLocaleString(
                              "id-ID"
                            )}</td>
                            <td>${formatCurrency(transaction.unitPrice)}</td>
                            <td>${formatCurrency(
                              transaction.unitPrice * transaction.quantity
                            )}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="4"><strong>TOTAL PEMBAYARAN</strong></td>
                            <td><strong>${formatCurrency(
                              transaction.totalAmount
                            )}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Payment Instructions -->
            ${
              transaction.paymentStatus === "pending"
                ? `
            <div class="payment-instruction">
                <h3>💳 Instruksi Pembayaran</h3>
                <p>Silakan lakukan pembayaran untuk melanjutkan proses pesanan Anda:</p>
                <ul>
                    <li>Klik tombol "Bayar Sekarang" di bawah ini</li>
                    <li>Pilih metode pembayaran yang Anda inginkan</li>
                    <li>Ikuti instruksi pembayaran dari payment gateway</li>
                    <li>Pesanan akan diproses setelah pembayaran berhasil</li>
                </ul>
                ${
                  transaction.redirectUrl
                    ? `
                <p style="text-align: center; margin-top: 20px;">
                    <a href="${transaction.redirectUrl}" class="btn">💳 Bayar Sekarang</a>
                </p>
                `
                    : ""
                }
            </div>
            `
                : ""
            }

            <!-- Important Notes -->
            <div class="important-note">
                <h4>⚠️ Penting untuk Diperhatikan:</h4>
                <ul>
                    <li>Simpan invoice ini sebagai bukti transaksi</li>
                    <li>Jangan bagikan informasi akun Roblox kepada orang lain</li>
                    <li>Proses pesanan akan dimulai setelah pembayaran dikonfirmasi</li>
                    <li>Hubungi customer service jika ada pertanyaan atau kendala</li>
                    ${
                      transaction.expiresAt
                        ? `<li>Invoice ini berlaku hingga ${formatDate(
                            transaction.expiresAt
                          )}</li>`
                        : ""
                    }
                </ul>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <h3>${settings.siteName || "RobuxID"}</h3>
            <p>${
              settings.siteDescription ||
              "Platform jual beli Robux, Gamepass, dan Jasa Joki terpercaya"
            }</p>
            
            <div class="contact-info">
                ${
                  settings.contactEmail
                    ? `
                <div class="contact-item">
                    <span>📧</span>
                    <span>${settings.contactEmail}</span>
                </div>
                `
                    : ""
                }
                ${
                  settings.whatsappNumber
                    ? `
                <div class="contact-item">
                    <span>📱</span>
                    <span>${settings.whatsappNumber}</span>
                </div>
                `
                    : ""
                }
                ${
                  settings.discordInvite
                    ? `
                <div class="contact-item">
                    <span>💬</span>
                    <a href="${settings.discordInvite}" style="color: white;">Discord Support</a>
                </div>
                `
                    : ""
                }
            </div>
            
            <p style="margin-top: 20px; opacity: 0.8; font-size: 0.9em;">
                © ${new Date().getFullYear()} ${
      settings.siteName || "RobuxID"
    }. Semua hak dilindungi.
            </p>
        </div>
    </div>
</body>
</html>
`;
  }
}

export default EmailService;
