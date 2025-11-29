import crypto from "crypto";
import Settings from "@/models/Settings";

/**
 * Format Indonesian phone number for Duitku API
 * Duitku requires phone number in format: 08xxxxxxxxx or 628xxxxxxxxx
 */
function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // If phone starts with 62, keep it
  if (cleaned.startsWith("62")) {
    return cleaned;
  }

  // If phone starts with 0, it's already in local format
  if (cleaned.startsWith("0")) {
    return cleaned;
  }

  // If phone starts with 8, prepend 0 for local format
  if (cleaned.startsWith("8")) {
    return "0" + cleaned;
  }

  // For other cases, return as-is
  return cleaned;
}

// Duitku Payment Method Codes
export const DUITKU_PAYMENT_METHODS = {
  // Virtual Account
  BC: { name: "BCA Virtual Account", category: "bank_transfer" },
  M2: { name: "Mandiri Virtual Account", category: "bank_transfer" },
  VA: { name: "Maybank Virtual Account", category: "bank_transfer" },
  I1: { name: "BNI Virtual Account", category: "bank_transfer" },
  B1: { name: "CIMB Niaga Virtual Account", category: "bank_transfer" },
  BT: { name: "Permata Virtual Account", category: "bank_transfer" },
  A1: { name: "ATM Bersama", category: "bank_transfer" },

  // E-Wallet
  OV: { name: "OVO", category: "ewallet" },
  SA: { name: "ShopeePay", category: "ewallet" },
  LA: { name: "LinkAja", category: "ewallet" },
  DA: { name: "DANA", category: "ewallet" },

  // QRIS
  SP: { name: "ShopeePay QRIS", category: "qris" },
  LQ: { name: "LinkAja QRIS", category: "qris" },
  NQ: { name: "Nobu QRIS", category: "qris" },
  DQ: { name: "DANA QRIS", category: "qris" },
  SQ: { name: "ShopeePay QRIS", category: "qris" },

  // Credit Card
  VC: { name: "Credit Card (Visa/Master)", category: "credit_card" },

  // Retail
  FT: { name: "Pegadaian", category: "retail" },
  IR: { name: "Indomaret", category: "retail" },
  AG: { name: "Alfamart/Alfamidi", category: "retail" },
} as const;

export type DuitkuPaymentCode = keyof typeof DUITKU_PAYMENT_METHODS;

interface DuitkuItem {
  name: string;
  price: number;
  quantity: number;
}

interface DuitkuCustomerDetails {
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber: string;
}

interface DuitkuTransactionRequest {
  merchantOrderId: string;
  paymentAmount: number;
  paymentMethod: string;
  productDetails: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  itemDetails?: DuitkuItem[];
  returnUrl?: string;
  callbackUrl?: string;
  expiryPeriod?: number; // in minutes
}

interface DuitkuTransactionResponse {
  merchantCode: string;
  reference: string;
  paymentUrl: string;
  vaNumber?: string;
  qrString?: string;
  amount: string;
  statusCode: string;
  statusMessage: string;
}

interface DuitkuCallbackData {
  merchantCode: string;
  amount: string;
  merchantOrderId: string;
  productDetail: string;
  additionalParam: string;
  paymentCode: string;
  resultCode: string;
  merchantUserId: string;
  reference: string;
  signature: string;
  publisherOrderId: string;
  spUserHash: string;
  settlementDate: string;
  issuerCode: string;
}

class DuitkuService {
  private merchantCode: string = "";
  private apiKey: string = "";
  private isProduction: boolean = false;
  private baseUrl: string = "";
  private callbackUrl: string = "";
  private returnUrl: string = "";
  private expiryPeriod: number = 1440; // 24 hours default

  constructor() {
    // Config will be initialized when needed
  }

  async initializeConfig() {
    try {
      const settings = await Settings.getSiteSettings();

      this.merchantCode = settings.duitkuMerchantCode || "";
      this.apiKey = settings.duitkuApiKey || "";
      this.isProduction = settings.duitkuMode === "production";
      this.callbackUrl =
        settings.duitkuCallbackUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/transactions/webhook/duitku`;
      this.returnUrl =
        settings.duitkuReturnUrl ||
        `${process.env.NEXT_PUBLIC_BASE_URL}/transaction`;
      this.expiryPeriod = settings.duitkuExpiryPeriod || 1440;

      // Set API URL based on mode
      this.baseUrl = this.isProduction
        ? "https://passport.duitku.com/webapi/api/merchant"
        : "https://sandbox.duitku.com/webapi/api/merchant";

      console.log("=== DUITKU CONFIG DEBUG ===");
      console.log(
        "Merchant Code:",
        this.merchantCode ? "[PRESENT]" : "[MISSING]"
      );
      console.log("API Key:", this.apiKey ? "[PRESENT]" : "[MISSING]");
      console.log("Is Production:", this.isProduction);
      console.log("Base URL:", this.baseUrl);
      console.log("Callback URL:", this.callbackUrl);
      console.log("Return URL:", this.returnUrl);

      if (!this.merchantCode || !this.apiKey) {
        console.warn("Duitku credentials not configured properly");
      }
    } catch (error) {
      console.error("Failed to initialize Duitku config:", error);
      throw new Error("Duitku configuration failed");
    }
  }

  /**
   * Generate MD5 signature for Duitku API
   */
  private generateSignature(
    merchantCode: string,
    merchantOrderId: string,
    paymentAmount: number
  ): string {
    const signatureString = `${merchantCode}${merchantOrderId}${paymentAmount}${this.apiKey}`;
    return crypto.createHash("md5").update(signatureString).digest("hex");
  }

  /**
   * Generate MD5 signature for callback verification
   */
  generateCallbackSignature(
    merchantCode: string,
    amount: string,
    merchantOrderId: string
  ): string {
    const signatureString = `${merchantCode}${amount}${merchantOrderId}${this.apiKey}`;
    return crypto.createHash("md5").update(signatureString).digest("hex");
  }

  /**
   * Verify callback signature from Duitku
   */
  verifyCallbackSignature(
    merchantCode: string,
    amount: string,
    merchantOrderId: string,
    receivedSignature: string
  ): boolean {
    const expectedSignature = this.generateCallbackSignature(
      merchantCode,
      amount,
      merchantOrderId
    );
    return expectedSignature === receivedSignature;
  }

  /**
   * Create a new transaction in Duitku
   */
  async createTransaction(params: {
    orderId: string;
    amount: number;
    paymentMethod: string;
    productDetails: string;
    customer: DuitkuCustomerDetails;
    items?: DuitkuItem[];
    callbackUrl?: string;
    returnUrl?: string;
    expiryPeriod?: number;
  }): Promise<DuitkuTransactionResponse> {
    await this.initializeConfig();

    if (!this.merchantCode || !this.apiKey) {
      throw new Error("Duitku credentials not configured");
    }

    const signature = this.generateSignature(
      this.merchantCode,
      params.orderId,
      params.amount
    );

    const requestBody = {
      merchantCode: this.merchantCode,
      paymentAmount: params.amount,
      paymentMethod: params.paymentMethod,
      merchantOrderId: params.orderId,
      productDetails: params.productDetails,
      additionalParam: "",
      merchantUserInfo: params.customer.email,
      customerVaName:
        params.customer.firstName +
        (params.customer.lastName ? ` ${params.customer.lastName}` : ""),
      email: params.customer.email,
      phoneNumber: formatPhoneNumber(params.customer.phoneNumber || ""),
      itemDetails: params.items || [
        {
          name: params.productDetails,
          price: params.amount,
          quantity: 1,
        },
      ],
      callbackUrl: params.callbackUrl || this.callbackUrl,
      returnUrl: params.returnUrl || this.returnUrl,
      signature: signature,
      expiryPeriod: params.expiryPeriod || this.expiryPeriod,
    };

    console.log("=== DUITKU CREATE TRANSACTION DEBUG ===");
    console.log("Request URL:", `${this.baseUrl}/v2/inquiry`);
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    try {
      const response = await fetch(`${this.baseUrl}/v2/inquiry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("Duitku Response:", JSON.stringify(data, null, 2));

      if (data.statusCode !== "00") {
        // Provide more helpful error messages for common sandbox issues
        let errorMessage = data.statusMessage || "Unknown error";

        // Check if this is a sandbox limitation for e-wallet payments
        if (!this.isProduction && data.statusCode === "-100") {
          const paymentMethod = params.paymentMethod;
          const ewalletMethods = ["DA", "OV", "LA", "LF"]; // DANA, OVO, LinkAja

          if (ewalletMethods.includes(paymentMethod)) {
            errorMessage = `${errorMessage}. Note: E-wallet payment methods like DANA, OVO, LinkAja may not be available in sandbox mode. Please try Virtual Account or QRIS methods for testing, or switch to production mode.`;
          }
        }

        throw new Error(`Duitku API Error: ${errorMessage}`);
      }

      return {
        merchantCode: data.merchantCode,
        reference: data.reference,
        paymentUrl: data.paymentUrl,
        vaNumber: data.vaNumber,
        amount: data.amount,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
      };
    } catch (error) {
      console.error("Duitku Create Transaction Error:", error);
      throw error;
    }
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(merchantOrderId: string): Promise<{
    merchantOrderId: string;
    reference: string;
    amount: string;
    statusCode: string;
    statusMessage: string;
  }> {
    await this.initializeConfig();

    const signature = this.generateSignature(
      this.merchantCode,
      merchantOrderId,
      0 // Amount not needed for check status
    );

    // For check status, signature is different: MD5(merchantCode + merchantOrderId + apiKey)
    const checkSignature = crypto
      .createHash("md5")
      .update(`${this.merchantCode}${merchantOrderId}${this.apiKey}`)
      .digest("hex");

    const requestBody = {
      merchantCode: this.merchantCode,
      merchantOrderId: merchantOrderId,
      signature: checkSignature,
    };

    try {
      const response = await fetch(`${this.baseUrl}/transactionStatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      console.log("Duitku Check Status Response:", data);

      return {
        merchantOrderId: data.merchantOrderId,
        reference: data.reference,
        amount: data.amount,
        statusCode: data.statusCode,
        statusMessage: data.statusMessage,
      };
    } catch (error) {
      console.error("Duitku Check Status Error:", error);
      throw error;
    }
  }

  /**
   * Get available payment methods from Duitku
   */
  async getPaymentMethods(amount: number): Promise<
    Array<{
      paymentMethod: string;
      paymentName: string;
      paymentImage: string;
      totalFee: string;
    }>
  > {
    await this.initializeConfig();

    const datetime = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", " ")
      .substring(0, 17);

    // Signature for get payment method: MD5(merchantCode + amount + datetime + apiKey)
    const signature = crypto
      .createHash("md5")
      .update(`${this.merchantCode}${amount}${datetime}${this.apiKey}`)
      .digest("hex");

    const requestBody = {
      merchantcode: this.merchantCode,
      amount: amount,
      datetime: datetime,
      signature: signature,
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/paymentmethod/getpaymentmethod`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();

      console.log("Duitku Get Payment Methods Response:", data);

      if (data.responseCode !== "00") {
        throw new Error(
          `Duitku Get Payment Methods Error: ${
            data.responseMessage || "Unknown error"
          }`
        );
      }

      return data.paymentFee || [];
    } catch (error) {
      console.error("Duitku Get Payment Methods Error:", error);
      throw error;
    }
  }

  /**
   * Map Duitku status code to internal status
   *
   * Duitku Result Codes:
   * - 00: Success (Payment completed)
   * - 01: Pending (Waiting for payment)
   * - 02: Cancelled (Payment cancelled by user or expired)
   * - 03: Failed (Payment failed)
   */
  mapDuitkuStatus(resultCode: string): {
    paymentStatus: string;
    orderStatus: string;
  } {
    switch (resultCode) {
      case "00": // Success - Payment completed
        return { paymentStatus: "settlement", orderStatus: "processing" };

      case "01": // Pending - Waiting for payment
        return { paymentStatus: "pending", orderStatus: "waiting_payment" };

      case "02": // Cancelled - Payment cancelled or expired
        return { paymentStatus: "cancelled", orderStatus: "cancelled" };

      case "03": // Failed - Payment failed
        return { paymentStatus: "failed", orderStatus: "failed" };

      default:
        // Unknown status, treat as pending
        console.warn(`Unknown Duitku result code: ${resultCode}`);
        return { paymentStatus: "pending", orderStatus: "waiting_payment" };
    }
  }

  /**
   * Map internal payment method ID to Duitku payment code
   */
  static mapPaymentMethodToDuitku(paymentMethodCode: string): string {
    const mapping: { [key: string]: string } = {
      // Virtual Account
      bca_va: "BC",
      mandiri_va: "M2",
      maybank_va: "VA",
      bni_va: "I1",
      cimb_va: "B1",
      permata_va: "BT",
      atm_bersama: "A1",

      // E-Wallet
      ovo: "OV",
      shopeepay: "SA",
      linkaja: "LA",
      dana: "DA",

      // QRIS
      qris: "SP", // Default to ShopeePay QRIS
      qris_shopeepay: "SP",
      qris_linkaja: "LQ",
      qris_nobu: "NQ",
      qris_dana: "DQ",

      // Credit Card
      credit_card: "VC",

      // Retail
      indomaret: "IR",
      alfamart: "AG",
      pegadaian: "FT",
    };

    return mapping[paymentMethodCode] || paymentMethodCode.toUpperCase();
  }

  /**
   * Get merchant code
   */
  getMerchantCode(): string {
    return this.merchantCode;
  }

  /**
   * Get mode (sandbox/production)
   */
  getMode(): string {
    return this.isProduction ? "production" : "sandbox";
  }

  /**
   * Get base URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Check if Duitku is configured
   */
  async isConfigured(): Promise<boolean> {
    await this.initializeConfig();
    return !!(this.merchantCode && this.apiKey);
  }

  /**
   * Async method to get mode after config is loaded
   */
  async getModeAsync(): Promise<string> {
    await this.initializeConfig();
    return this.isProduction ? "production" : "sandbox";
  }

  /**
   * Async method to get base URL after config is loaded
   */
  async getBaseUrlAsync(): Promise<string> {
    await this.initializeConfig();
    return this.baseUrl;
  }
}

export const duitkuService = new DuitkuService();
export default DuitkuService;
