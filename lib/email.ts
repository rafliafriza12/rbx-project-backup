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
  // Tidak perlu cache transporter, selalu buat baru dengan config terbaru

  private static async getEmailConfig(): Promise<EmailConfig> {
    const settings = await Settings.getSiteSettings();

    const port = settings.emailPort || 587;
    // Port 465 = SSL (secure: true), Port 587 = STARTTLS (secure: false)
    const secure =
      settings.emailSecure !== undefined ? settings.emailSecure : port === 465;

    return {
      host: settings.emailHost || "smtp.gmail.com",
      port: port,
      secure: secure,
      auth: {
        user: settings.emailUser || "",
        pass: settings.emailPassword || "",
      },
    };
  }

  private static async createTransporter(): Promise<nodemailer.Transporter> {
    // Selalu buat transporter baru dengan config terbaru dari database
    const config = await this.getEmailConfig();

    console.log("📧 Email config:", {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
    });

    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    });
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
        from: `${settings.emailFromName || "RBXNET"} <${
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

      // Check if this is a single transaction or array of transactions (multi-checkout)
      const isMultiTransaction = Array.isArray(transactionData);
      const transactions = isMultiTransaction
        ? transactionData
        : [transactionData];

      // Use first transaction for basic info (they share same customer, invoice, etc)
      const firstTransaction = transactions[0];

      const invoiceHtml = this.generateInvoiceTemplate(
        transactions,
        settings,
        isMultiTransaction,
      );

      const emailOptions: EmailOptions = {
        to: firstTransaction.customerInfo.email,
        subject: `Invoice #${firstTransaction.invoiceId} - ${
          settings.siteName || "RBXNET"
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
    transactions: any[],
    settings: any,
    isMultiTransaction: boolean = false,
  ): string {
    // Use first transaction for common info (they share same invoice ID, customer, etc)
    const firstTransaction = transactions[0];

    // Calculate grand total from all transactions
    const grandTotal = transactions.reduce(
      (sum, txn) => sum + (txn.totalAmount || 0),
      0,
    );

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

    // Generate items rows HTML
    const itemsRows = transactions
      .map(
        (txn) => `
      <tr>
        <td>${txn.serviceName}</td>
        <td>${getServiceTypeLabel(txn.serviceType)}</td>
        <td>${txn.quantity.toLocaleString("id-ID")}</td>
        <td>${formatCurrency(txn.unitPrice)}</td>
        <td>${formatCurrency(txn.unitPrice * txn.quantity)}</td>
      </tr>
    `,
      )
      .join("");

    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${firstTransaction.invoiceId}</title>
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
        .roblox-info-item {
            background: #f0fdfa;
            border: 1px solid #99f6e4;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .roblox-info-item:last-child {
            margin-bottom: 0;
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
        .multi-badge {
            background: #f59e0b;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: 600;
            display: inline-block;
            margin-left: 10px;
        }
        
        /* Responsive Design - Mobile First Approach */
        
        /* Small phones: 320px - 480px */
        @media (max-width: 480px) {
            body {
                padding: 5px;
                font-size: 14px;
            }
            
            .invoice-container {
                border-radius: 5px;
            }
            
            .header {
                padding: 20px 15px;
            }
            
            .header h1 {
                font-size: 1.8em;
            }
            
            .header p {
                font-size: 0.95em;
            }
            
            .multi-badge {
                display: block;
                margin: 10px 0 0 0;
                width: fit-content;
            }
            
            .content {
                padding: 15px;
            }
            
            .invoice-info {
                flex-direction: column;
            }
            
            .invoice-info div {
                min-width: 100%;
                margin-bottom: 15px;
            }
            
            .info-label {
                font-size: 0.9em;
            }
            
            .info-value {
                font-size: 1em;
            }
            
            .status-badge {
                padding: 6px 12px;
                font-size: 0.75em;
            }
            
            .table-container {
                padding: 10px;
                margin: 15px 0;
                overflow-x: auto;
            }
            
            .table {
                font-size: 0.85em;
                min-width: 500px;
            }
            
            .table th,
            .table td {
                padding: 10px 8px;
            }
            
            .total-row {
                font-size: 1em;
            }
            
            .customer-info,
            .roblox-info,
            .roblox-info-item,
            .joki-details,
            .important-note,
            .payment-instruction {
                padding: 15px;
                margin: 15px 0;
            }
            
            .customer-info h3,
            .roblox-info h3,
            .joki-details h3 {
                font-size: 1.1em;
            }
            
            .customer-info p,
            .roblox-info p,
            .roblox-info-item p {
                font-size: 0.9em;
                word-break: break-word;
            }
            
            .roblox-info-item {
                padding: 12px;
                margin-bottom: 12px;
            }
            
            .footer {
                padding: 20px 15px;
            }
            
            .contact-info {
                flex-direction: column;
                gap: 10px;
            }
            
            .btn {
                padding: 10px 20px;
                font-size: 0.9em;
                display: block;
                text-align: center;
            }
            
            .important-note ul,
            .payment-instruction ul {
                padding-left: 20px;
            }
            
            .important-note li,
            .payment-instruction li {
                font-size: 0.9em;
                margin-bottom: 8px;
            }
        }
        
        /* Medium phones: 481px - 600px */
        @media (min-width: 481px) and (max-width: 600px) {
            body {
                padding: 10px;
            }
            
            .header {
                padding: 25px 20px;
            }
            
            .header h1 {
                font-size: 2em;
            }
            
            .content {
                padding: 20px;
            }
            
            .invoice-info {
                flex-direction: column;
            }
            
            .invoice-info div {
                min-width: 100%;
            }
            
            .table-container {
                overflow-x: auto;
            }
            
            .table {
                min-width: 550px;
            }
            
            .contact-info {
                flex-direction: column;
                gap: 10px;
            }
        }
        
        /* Tablets: 601px - 768px */
        @media (min-width: 601px) and (max-width: 768px) {
            body {
                padding: 15px;
            }
            
            .header h1 {
                font-size: 2.2em;
            }
            
            .invoice-info div {
                min-width: 200px;
            }
            
            .table {
                font-size: 0.95em;
            }
            
            .table th,
            .table td {
                padding: 12px;
            }
        }
        
        /* Small laptops: 769px - 1024px */
        @media (min-width: 769px) and (max-width: 1024px) {
            body {
                max-width: 750px;
            }
        }
        
        /* Print styles for when user prints invoice */
        @media print {
            body {
                background-color: white;
                padding: 0;
                max-width: 100%;
            }
            
            .invoice-container {
                box-shadow: none;
                border-radius: 0;
            }
            
            .btn {
                display: none;
            }
            
            .payment-instruction {
                display: none;
            }
            
            .table tr:hover {
                background: transparent;
            }
            
            /* Prevent page breaks inside important sections */
            .customer-info,
            .roblox-info,
            .table-container {
                page-break-inside: avoid;
            }
        }
        
        /* Dark mode support for email clients that support it */
        @media (prefers-color-scheme: dark) {
            body {
                background-color: #1a202c;
            }
            
            .invoice-container {
                background: #2d3748;
                color: #e2e8f0;
            }
            
            .info-label {
                color: #a0aec0;
            }
            
            .info-value {
                color: #e2e8f0;
            }
            
            .customer-info,
            .table-container {
                background: #374151;
            }
            
            .customer-info h3 {
                color: #cbd5e0;
                border-bottom-color: #4a5568;
            }
            
            .table th {
                background: #4a5568;
                color: #e2e8f0;
            }
            
            .table td {
                border-bottom-color: #4a5568;
            }
            
            .table tr:hover {
                background: #374151;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="header">
            <h1>${settings.siteName || "RBXNET"}</h1>
            <p>Invoice Pembelian ${
              isMultiTransaction
                ? "Multi-Item"
                : getServiceTypeLabel(firstTransaction.serviceType)
            }
            ${
              isMultiTransaction
                ? `<span class="multi-badge">${transactions.length} Items</span>`
                : ""
            }</p>
        </div>

        <!-- Content -->
        <div class="content">
            <!-- Invoice Info -->
            <div class="invoice-info">
                <div>
                    <div class="info-label">Invoice ID</div>
                    <div class="info-value">#${firstTransaction.invoiceId}</div>
                </div>
                <div>
                    <div class="info-label">Tanggal Dibuat</div>
                    <div class="info-value">${formatDate(
                      firstTransaction.createdAt,
                    )}</div>
                </div>
                <div>
                    <div class="info-label">Status Pembayaran</div>
                    <div class="info-value">
                        <span class="status-badge" style="background-color: ${getStatusColor(
                          firstTransaction.paymentStatus,
                        )}">
                            ${getStatusLabel(firstTransaction.paymentStatus)}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Customer Info -->
            <div class="customer-info">
                <h3>📋 Informasi Customer</h3>
                <p><strong>Nama:</strong> ${
                  firstTransaction.customerInfo.name || "Guest"
                }</p>
                <p><strong>Email:</strong> ${
                  firstTransaction.customerInfo.email
                }</p>
                ${
                  firstTransaction.customerInfo.phone
                    ? `<p><strong>Telepon:</strong> ${firstTransaction.customerInfo.phone}</p>`
                    : ""
                }
            </div>

            <!-- Roblox Account Info for Multi-Checkout -->
            ${
              isMultiTransaction
                ? `
            <div class="roblox-info">
                <h3>🎮 Informasi Akun RBX (Per Item)</h3>
                <p style="color: #0891b2; margin-bottom: 15px;"><em>Setiap item menggunakan akun berbeda sesuai yang Anda tentukan:</em></p>
                ${transactions
                  .map(
                    (txn, index) => `
                <div class="roblox-info-item">
                    <p style="margin: 0 0 8px 0;"><strong>Item ${index + 1}: ${
                      txn.serviceName
                    }</strong></p>
                    <p style="margin: 5px 0;"><strong>Username:</strong> ${
                      txn.robloxUsername
                    }</p>
                    ${
                      txn.robloxPassword
                        ? '<p style="margin: 5px 0;"><strong>Password:</strong> ••••••••••</p>'
                        : ""
                    }
                </div>
                `,
                  )
                  .join("")}
                <p style="margin-top: 15px; color: #0f766e;"><em>Data akun Anda aman dan tidak akan disalahgunakan.</em></p>
            </div>
            `
                : `
            <!-- Roblox Account Info for Single Item -->
            <div class="roblox-info">
                <h3>🎮 Informasi Akun RBX</h3>
                <p><strong>Username:</strong> ${
                  firstTransaction.robloxUsername
                }</p>
                ${
                  firstTransaction.robloxPassword
                    ? "<p><strong>Password:</strong> ••••••••••</p>"
                    : ""
                }
                <p><em>Data akun Anda aman dan tidak akan disalahgunakan.</em></p>
            </div>
            `
            }

            <!-- Order Details -->
            <div class="table-container">
                <h3>📦 Detail Pesanan ${
                  isMultiTransaction ? `(${transactions.length} Items)` : ""
                }</h3>
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
                        ${itemsRows}
                        <tr class="total-row">
                            <td colspan="4"><strong>TOTAL PEMBAYARAN</strong></td>
                            <td><strong>${formatCurrency(
                              grandTotal,
                            )}</strong></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Payment Instructions -->
            ${
              firstTransaction.paymentStatus === "pending"
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
                  firstTransaction.redirectUrl
                    ? `
                <p style="text-align: center; margin-top: 20px;">
                    <a href="${firstTransaction.redirectUrl}" class="btn">💳 Bayar Sekarang</a>
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
                    <li>Jangan bagikan informasi akun RBX kepada orang lain</li>
                    <li>Proses pesanan akan dimulai setelah pembayaran dikonfirmasi</li>
                    <li>Hubungi customer service jika ada pertanyaan atau kendala</li>
                    ${
                      isMultiTransaction
                        ? "<li>Setiap item akan diproses ke akun RBX yang berbeda sesuai data Anda</li>"
                        : ""
                    }
                    ${
                      firstTransaction.expiresAt
                        ? `<li>Invoice ini berlaku hingga ${formatDate(
                            firstTransaction.expiresAt,
                          )}</li>`
                        : ""
                    }
                </ul>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <h3>${settings.siteName || "RBXNET"}</h3>
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
                  settings.siteName || "RBXNET"
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
