import Settings from "@/models/Settings";

interface MidtransItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
  brand?: string;
  category?: string;
}

interface MidtransCustomerDetails {
  first_name: string;
  email: string;
  phone: string;
}

interface MidtransTransactionDetails {
  order_id: string;
  gross_amount: number;
}

interface MidtransSnapRequest {
  transaction_details: MidtransTransactionDetails;
  item_details: MidtransItem[];
  customer_details: MidtransCustomerDetails;
  enabled_payments?: string[];
  expiry?: {
    start_time: string;
    unit: string;
    duration: number;
  };
  callbacks?: {
    finish: string;
    error: string;
    pending: string;
  };
}

class MidtransService {
  private serverKey: string = "";
  private clientKey: string = "";
  private isProduction: boolean = false;
  private snapApiUrl: string = "";
  private coreApiUrl: string = "";
  private configInitialized: boolean = false;

  constructor() {
    // Don't call async in constructor - will be called when needed
  }

  async initializeConfig() {
    if (this.configInitialized) return; // Already initialized

    try {
      // Coba ambil dari database Settings
      const settings = await Settings.getSiteSettings();

      // Gunakan environment variables sebagai fallback jika database kosong
      this.serverKey =
        settings.midtransServerKey || process.env.MIDTRANS_SERVER_KEY || "";
      this.clientKey =
        settings.midtransClientKey || process.env.MIDTRANS_CLIENT_KEY || "";
      this.isProduction =
        (settings.midtransMode || process.env.MIDTRANS_MODE) === "production";

      console.log("=== MIDTRANS CONFIG DEBUG ===");
      console.log("Database settings:", {
        serverKey: settings.midtransServerKey ? "[PRESENT]" : "[MISSING]",
        clientKey: settings.midtransClientKey ? "[PRESENT]" : "[MISSING]",
        mode: settings.midtransMode,
      });
      console.log("Environment variables:", {
        serverKey: process.env.MIDTRANS_SERVER_KEY ? "[PRESENT]" : "[MISSING]",
        clientKey: process.env.MIDTRANS_CLIENT_KEY ? "[PRESENT]" : "[MISSING]",
        mode: process.env.MIDTRANS_MODE,
      });
      console.log("Final config:", {
        serverKey: this.serverKey ? "[PRESENT]" : "[MISSING]",
        clientKey: this.clientKey ? "[PRESENT]" : "[MISSING]",
        isProduction: this.isProduction,
      });

      // Set API URLs based on mode
      if (this.isProduction) {
        this.snapApiUrl = "https://app.midtrans.com/snap/v1/transactions";
        this.coreApiUrl = "https://api.midtrans.com/v2";
      } else {
        this.snapApiUrl =
          "https://app.sandbox.midtrans.com/snap/v1/transactions";
        this.coreApiUrl = "https://api.sandbox.midtrans.com/v2";
      }

      this.configInitialized = true;

      if (!this.serverKey || !this.clientKey) {
        console.warn("Midtrans keys not configured properly");
      }
    } catch (error) {
      console.error("Failed to initialize Midtrans config:", error);

      // Fallback ke environment variables
      this.serverKey = process.env.MIDTRANS_SERVER_KEY || "";
      this.clientKey = process.env.MIDTRANS_CLIENT_KEY || "";
      this.isProduction = process.env.MIDTRANS_MODE === "production";

      if (this.isProduction) {
        this.snapApiUrl = "https://app.midtrans.com/snap/v1/transactions";
        this.coreApiUrl = "https://api.midtrans.com/v2";
      } else {
        this.snapApiUrl =
          "https://app.sandbox.midtrans.com/snap/v1/transactions";
        this.coreApiUrl = "https://api.sandbox.midtrans.com/v2";
      }

      this.configInitialized = true;

      if (!this.serverKey || !this.clientKey) {
        throw new Error(
          "Midtrans configuration not found in database or environment variables",
        );
      }
    }
  }

  private getAuthHeader(): string {
    if (!this.serverKey) {
      throw new Error("Midtrans server key not configured");
    }
    const auth = Buffer.from(this.serverKey + ":").toString("base64");
    return `Basic ${auth}`;
  }

  private formatExpiryTime(hours: number = 24): string {
    const now = new Date();
    const expiry = new Date(now.getTime() + hours * 60 * 60 * 1000);

    // Format: yyyy-MM-dd hh:mm:ss Z (eg 2020-06-09 15:07:00 +0700)
    const year = expiry.getFullYear();
    const month = String(expiry.getMonth() + 1).padStart(2, "0");
    const day = String(expiry.getDate()).padStart(2, "0");
    const hour = String(expiry.getHours()).padStart(2, "0");
    const minute = String(expiry.getMinutes()).padStart(2, "0");
    const second = String(expiry.getSeconds()).padStart(2, "0");

    const formatted = `${year}-${month}-${day} ${hour}:${minute}:${second} +0700`;
    console.log("Formatted expiry time:", formatted);
    return formatted;
  }

  async createSnapTransaction(params: {
    orderId: string;
    amount: number;
    items: MidtransItem[];
    customer: MidtransCustomerDetails;
    expiryHours?: number;
    enabledPayments?: string[]; // ✅ NEW: Array of enabled payment methods
    callbackUrls?: {
      finish?: string;
      error?: string;
      pending?: string;
    };
  }): Promise<{
    token: string;
    redirect_url: string;
  }> {
    await this.initializeConfig();

    const requestBody: MidtransSnapRequest = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      item_details: params.items,
      customer_details: params.customer,
      // Only include enabled_payments if specifically provided
      // If undefined, Midtrans will show ALL ACTIVE payment methods automatically
      ...(params.enabledPayments && params.enabledPayments.length > 0
        ? { enabled_payments: params.enabledPayments }
        : {}),
      expiry: {
        start_time: this.formatExpiryTime(0),
        unit: "hours",
        duration: params.expiryHours || 24,
      },
    };

    // Add callbacks if provided
    if (params.callbackUrls) {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

      requestBody.callbacks = {
        finish: params.callbackUrls.finish || `${baseUrl}/transaction`,
        error: params.callbackUrls.error || `${baseUrl}/transaction`,
        pending: params.callbackUrls.pending || `${baseUrl}/transaction`,
      };

      console.log("=== MIDTRANS CALLBACKS DEBUG ===");
      console.log("Callbacks configured:", requestBody.callbacks);
    }

    try {
      const response = await fetch(this.snapApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Midtrans API Error: ${
            errorData.error_messages?.join(", ") || response.statusText
          }`,
        );
      }

      const data = await response.json();

      return {
        token: data.token,
        redirect_url: data.redirect_url,
      };
    } catch (error) {
      console.error("Midtrans Snap API Error:", error);
      throw error;
    }
  }

  // Map payment method ID to Midtrans enabled_payments codes
  static mapPaymentMethodToMidtrans(
    paymentMethodId: string,
  ): string[] | undefined {
    // Convert to lowercase for case-insensitive matching
    const normalizedId = paymentMethodId?.toLowerCase() || "";

    // Mapping berdasarkan payment method ID dari database
    // Keys are lowercase for matching, values are Midtrans API codes
    const mapping: { [key: string]: string[] } = {
      // E-Wallets
      gopay: ["gopay"],
      shopeepay: ["shopeepay"],
      dana: ["shopeepay"],
      ovo: ["credit_card"],
      linkaja: ["credit_card"],

      // Virtual Account - support both formats (with and without _va suffix)
      bca_va: ["bca_va"],
      bca: ["bca_va"],
      bni_va: ["bni_va"],
      bni: ["bni_va"],
      bri_va: ["bri_va"],
      bri: ["bri_va"],
      mandiri_va: ["echannel"],
      mandiri: ["echannel"],
      echannel: ["echannel"],
      permata_va: ["permata_va"],
      permata: ["permata_va"],
      cimb_va: ["other_va"],
      cimb: ["other_va"],
      cimb_niaga: ["other_va"],
      danamon_va: ["other_va"],
      danamon: ["other_va"],
      bsi: ["other_va"],
      bsi_va: ["other_va"],

      // QRIS - include both qris and gopay for maximum compatibility
      qris: ["qris", "gopay"],

      // Retail
      indomaret: ["indomaret"],
      alfamart: ["alfamart"],

      // Credit Card
      credit_card: ["credit_card"],
    };

    // Return mapped payment method or undefined if not found (let Midtrans show all active methods)
    return mapping[normalizedId] || undefined;
  }

  async getTransactionStatus(orderId: string): Promise<{
    transaction_status: string;
    payment_type: string;
    transaction_id: string;
    gross_amount: string;
    fraud_status?: string;
    status_code: string;
    status_message: string;
  }> {
    await this.initializeConfig();

    try {
      const response = await fetch(`${this.coreApiUrl}/${orderId}/status`, {
        method: "GET",
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Midtrans Status API Error: ${
            errorData.error_messages?.join(", ") || response.statusText
          }`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Midtrans Status API Error:", error);
      throw error;
    }
  }

  async cancelTransaction(orderId: string): Promise<{
    status_code: string;
    status_message: string;
  }> {
    await this.initializeConfig();

    try {
      const response = await fetch(`${this.coreApiUrl}/${orderId}/cancel`, {
        method: "POST",
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Midtrans Cancel API Error: ${
            errorData.error_messages?.join(", ") || response.statusText
          }`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Midtrans Cancel API Error:", error);
      throw error;
    }
  }

  // Utility method untuk mapping status Midtrans ke status internal
  mapMidtransStatus(
    midtransStatus: string,
    fraudStatus?: string,
  ): {
    paymentStatus: string;
    orderStatus: string;
  } {
    switch (midtransStatus) {
      case "capture":
        if (fraudStatus === "accept") {
          return { paymentStatus: "settlement", orderStatus: "processing" };
        } else {
          return { paymentStatus: "pending", orderStatus: "waiting_payment" };
        }

      case "settlement":
        return { paymentStatus: "settlement", orderStatus: "processing" };

      case "pending":
        return { paymentStatus: "pending", orderStatus: "waiting_payment" };

      case "deny":
      case "cancel":
        return { paymentStatus: "cancelled", orderStatus: "cancelled" };

      case "expire":
        return { paymentStatus: "expired", orderStatus: "cancelled" };

      case "failure":
        return { paymentStatus: "failed", orderStatus: "failed" };

      default:
        return { paymentStatus: "pending", orderStatus: "waiting_payment" };
    }
  }

  // Verify notification signature
  verifyNotificationSignature(
    orderId: string,
    statusCode: string,
    grossAmount: string,
    signature: string,
  ): boolean {
    const crypto = require("crypto");
    const hash = crypto
      .createHash("sha512")
      .update(orderId + statusCode + grossAmount + this.serverKey)
      .digest("hex");

    return hash === signature;
  }

  getClientKey(): string {
    return this.clientKey;
  }

  getSnapUrl(): string {
    return this.isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
  }

  // Async versions that ensure config is loaded first
  async getClientKeyAsync(): Promise<string> {
    await this.initializeConfig();
    return this.clientKey;
  }

  async getSnapUrlAsync(): Promise<string> {
    await this.initializeConfig();
    return this.isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
  }

  // Check if service is configured
  async isConfigured(): Promise<boolean> {
    await this.initializeConfig();
    return !!(this.serverKey && this.clientKey);
  }

  /**
   * Create GoPay/QRIS transaction using Core API
   * This returns the QR code directly instead of redirecting to Midtrans page
   */
  async createGopayTransaction(params: {
    orderId: string;
    amount: number;
    items: MidtransItem[];
    customer: MidtransCustomerDetails;
    callbackUrl?: string;
  }): Promise<{
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_status: string;
    actions: Array<{
      name: string;
      method: string;
      url: string;
    }>;
    qr_string?: string;
  }> {
    await this.initializeConfig();

    const requestBody = {
      payment_type: "gopay",
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      item_details: params.items,
      customer_details: params.customer,
      gopay: {
        enable_callback: true,
        callback_url:
          params.callbackUrl ||
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/transaction`,
      },
    };

    console.log("=== MIDTRANS GOPAY CORE API REQUEST ===");
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(`${this.coreApiUrl}/charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("=== MIDTRANS GOPAY CORE API RESPONSE ===");
      console.log("Response:", JSON.stringify(data, null, 2));

      if (!response.ok || data.status_code !== "201") {
        throw new Error(
          `Midtrans GoPay API Error: ${
            data.status_message ||
            data.error_messages?.join(", ") ||
            response.statusText
          }`,
        );
      }

      return data;
    } catch (error) {
      console.error("Midtrans GoPay Core API Error:", error);
      throw error;
    }
  }

  /**
   * Create QRIS transaction using Core API
   * This returns the QR code string directly
   */
  async createQrisTransaction(params: {
    orderId: string;
    amount: number;
    items: MidtransItem[];
    customer: MidtransCustomerDetails;
  }): Promise<{
    transaction_id: string;
    order_id: string;
    gross_amount: string;
    payment_type: string;
    transaction_status: string;
    actions: Array<{
      name: string;
      method: string;
      url: string;
    }>;
    qr_string?: string;
    acquirer?: string;
  }> {
    await this.initializeConfig();

    const requestBody = {
      payment_type: "qris",
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.amount,
      },
      item_details: params.items,
      customer_details: params.customer,
      qris: {
        acquirer: "gopay", // Use GoPay as QRIS acquirer for dynamic QR
      },
    };

    console.log("=== MIDTRANS QRIS CORE API REQUEST ===");
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(`${this.coreApiUrl}/charge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: this.getAuthHeader(),
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log("=== MIDTRANS QRIS CORE API RESPONSE ===");
      console.log("Response:", JSON.stringify(data, null, 2));

      if (
        !response.ok ||
        (data.status_code !== "201" && data.status_code !== "200")
      ) {
        throw new Error(
          `Midtrans QRIS API Error: ${
            data.status_message ||
            data.error_messages?.join(", ") ||
            response.statusText
          }`,
        );
      }

      return data;
    } catch (error) {
      console.error("Midtrans QRIS Core API Error:", error);
      throw error;
    }
  }

  /**
   * Extract QR code URL from GoPay/QRIS response actions
   */
  extractQrCodeUrl(
    actions: Array<{ name: string; method: string; url: string }>,
  ): string | null {
    // Look for generate-qr-code action first (for QR image URL)
    const qrAction = actions.find(
      (action) => action.name === "generate-qr-code" && action.method === "GET",
    );
    if (qrAction) return qrAction.url;

    // Fallback to deeplink-redirect for mobile
    const deeplinkAction = actions.find(
      (action) =>
        action.name === "deeplink-redirect" && action.method === "GET",
    );
    if (deeplinkAction) return deeplinkAction.url;

    return null;
  }

  /**
   * Extract deeplink URL for mobile app redirect
   */
  extractDeeplinkUrl(
    actions: Array<{ name: string; method: string; url: string }>,
  ): string | null {
    const deeplinkAction = actions.find(
      (action) =>
        action.name === "deeplink-redirect" && action.method === "GET",
    );
    return deeplinkAction?.url || null;
  }
}

export const midtransService = new MidtransService();
export default MidtransService;
