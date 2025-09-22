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

  constructor() {
    this.initializeConfig();
  }

  private async initializeConfig() {
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

      if (!this.serverKey || !this.clientKey) {
        throw new Error(
          "Midtrans configuration not found in database or environment variables"
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
      enabled_payments: [
        "credit_card",
        "bca_va",
        "bni_va",
        "bri_va",
        "echannel",
        "permata_va",
        "other_va",
        "gopay",
        "qris",
        "shopeepay",
        "indomaret",
        "alfamart",
      ],
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
          }`
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
          }`
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
          }`
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
    fraudStatus?: string
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
    signature: string
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
}

export const midtransService = new MidtransService();
export default MidtransService;
