type NotificationType =
  | "new_transaction"
  | "payment_status"
  | "order_status"
  | "transaction_cancelled";

interface TransactionData {
  invoiceId: string;
  serviceName: string;
  serviceType: string;
  serviceCategory?: string;
  quantity: number;
  totalAmount: number;
  finalAmount: number;
  discountPercentage?: number;
  discountAmount?: number;
  paymentMethodName?: string;
  paymentGateway?: string;
  paymentStatus: string;
  orderStatus: string;
  robloxUsername?: string;
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

// Format currency to IDR
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// Get color based on notification type and status
function getEmbedColor(type: NotificationType, status?: string): number {
  switch (type) {
    case "new_transaction":
      return 0x3498db; // Blue
    case "payment_status":
      switch (status) {
        case "settlement":
          return 0x2ecc71; // Green
        case "expired":
        case "failed":
          return 0xe74c3c; // Red
        case "cancelled":
          return 0x95a5a6; // Gray
        default:
          return 0xf39c12; // Orange (pending)
      }
    case "order_status":
      switch (status) {
        case "completed":
          return 0x2ecc71; // Green
        case "processing":
        case "in_progress":
          return 0xf39c12; // Orange
        case "cancelled":
        case "failed":
          return 0xe74c3c; // Red
        default:
          return 0x3498db; // Blue
      }
    case "transaction_cancelled":
      return 0xe74c3c; // Red
    default:
      return 0x3498db; // Blue
  }
}

// Get emoji for status
function getStatusEmoji(type: string, status: string): string {
  if (type === "payment") {
    switch (status) {
      case "settlement":
        return "✅";
      case "pending":
        return "⏳";
      case "expired":
        return "⏰";
      case "cancelled":
        return "❌";
      case "failed":
        return "💥";
      default:
        return "📋";
    }
  } else {
    switch (status) {
      case "completed":
        return "✅";
      case "processing":
        return "🔄";
      case "in_progress":
        return "🛠️";
      case "waiting_payment":
        return "⏳";
      case "pending":
        return "📋";
      case "cancelled":
        return "❌";
      case "failed":
        return "💥";
      default:
        return "📋";
    }
  }
}

// Get title based on notification type
function getTitle(type: NotificationType, status?: string): string {
  switch (type) {
    case "new_transaction":
      return "🆕 Transaksi Baru";
    case "payment_status":
      return `${getStatusEmoji("payment", status || "")} Status Pembayaran Diubah`;
    case "order_status":
      return `${getStatusEmoji("order", status || "")} Status Pesanan Diubah`;
    case "transaction_cancelled":
      return "❌ Transaksi Dibatalkan";
    default:
      return "📋 Update Transaksi";
  }
}

// Build embed fields from transaction data
function buildFields(
  type: NotificationType,
  transaction: TransactionData,
  extra?: {
    oldPaymentStatus?: string;
    oldOrderStatus?: string;
    newPaymentStatus?: string;
    newOrderStatus?: string;
    notes?: string;
  },
): Array<{ name: string; value: string; inline: boolean }> {
  const fields: Array<{ name: string; value: string; inline: boolean }> = [];

  // Transaction Code
  fields.push({
    name: "📝 Kode Transaksi",
    value: `\`${transaction.invoiceId}\``,
    inline: false,
  });

  // Service Info
  fields.push({
    name: "🎮 Layanan",
    value: transaction.serviceName,
    inline: true,
  });

  fields.push({
    name: "📦 Tipe",
    value: transaction.serviceType.toUpperCase(),
    inline: true,
  });

  fields.push({
    name: "🔢 Jumlah",
    value: `${transaction.quantity}`,
    inline: true,
  });

  // Amount info
  if (transaction.discountPercentage && transaction.discountPercentage > 0) {
    fields.push({
      name: "💰 Subtotal",
      value: formatCurrency(transaction.totalAmount),
      inline: true,
    });
    fields.push({
      name: "🏷️ Diskon",
      value: `${transaction.discountPercentage}% (-${formatCurrency(transaction.discountAmount || 0)})`,
      inline: true,
    });
    fields.push({
      name: "💵 Total Bayar",
      value: `**${formatCurrency(transaction.finalAmount)}**`,
      inline: true,
    });
  } else {
    fields.push({
      name: "💵 Total Bayar",
      value: `**${formatCurrency(transaction.finalAmount)}**`,
      inline: true,
    });
  }

  // Payment method
  if (transaction.paymentMethodName) {
    fields.push({
      name: "💳 Metode Pembayaran",
      value: transaction.paymentMethodName,
      inline: true,
    });
  }

  // Status changes for update notifications
  if (type === "payment_status" && extra) {
    fields.push({
      name: "📊 Perubahan Status Pembayaran",
      value: `${getStatusEmoji("payment", extra.oldPaymentStatus || "")} \`${extra.oldPaymentStatus || "N/A"}\` → ${getStatusEmoji("payment", extra.newPaymentStatus || "")} \`${extra.newPaymentStatus || "N/A"}\``,
      inline: false,
    });
  }

  if (type === "order_status" && extra) {
    fields.push({
      name: "📊 Perubahan Status Pesanan",
      value: `${getStatusEmoji("order", extra.oldOrderStatus || "")} \`${extra.oldOrderStatus || "N/A"}\` → ${getStatusEmoji("order", extra.newOrderStatus || "")} \`${extra.newOrderStatus || "N/A"}\``,
      inline: false,
    });
  }

  // Current status for new transaction
  if (type === "new_transaction") {
    fields.push({
      name: "💳 Status Pembayaran",
      value: `${getStatusEmoji("payment", transaction.paymentStatus)} \`${transaction.paymentStatus}\``,
      inline: true,
    });
    fields.push({
      name: "📦 Status Pesanan",
      value: `${getStatusEmoji("order", transaction.orderStatus)} \`${transaction.orderStatus}\``,
      inline: true,
    });
  }

  // Roblox username
  if (transaction.robloxUsername) {
    fields.push({
      name: "👤 Roblox Username",
      value: `\`${transaction.robloxUsername}\``,
      inline: true,
    });
  }

  // Customer info
  if (transaction.customerInfo) {
    const customerParts = [];
    if (transaction.customerInfo.name)
      customerParts.push(`👤 ${transaction.customerInfo.name}`);
    if (transaction.customerInfo.email)
      customerParts.push(`📧 ${transaction.customerInfo.email}`);
    if (transaction.customerInfo.phone)
      customerParts.push(`📱 ${transaction.customerInfo.phone}`);

    if (customerParts.length > 0) {
      fields.push({
        name: "🧑 Customer",
        value: customerParts.join("\n"),
        inline: false,
      });
    }
  }

  // Notes
  if (extra?.notes) {
    fields.push({
      name: "📝 Catatan",
      value: extra.notes,
      inline: false,
    });
  }

  return fields;
}

/**
 * Send Discord webhook notification for transaction events
 */
export async function sendDiscordNotification(
  type: NotificationType,
  transaction: TransactionData,
  extra?: {
    oldPaymentStatus?: string;
    oldOrderStatus?: string;
    newPaymentStatus?: string;
    newOrderStatus?: string;
    notes?: string;
  },
): Promise<boolean> {
  try {
    // Get webhook URL from environment variable
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.log("DISCORD_WEBHOOK_URL not configured, skipping notification");
      return false;
    }

    const statusForColor =
      extra?.newPaymentStatus ||
      extra?.newOrderStatus ||
      transaction.paymentStatus;

    const embed = {
      title: getTitle(type, statusForColor),
      color: getEmbedColor(type, statusForColor),
      fields: buildFields(type, transaction, extra),
      footer: {
        text: `RBXNET • ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}`,
      },
      timestamp: new Date().toISOString(),
    };

    const payload = {
      embeds: [embed],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(
        `Discord webhook failed: ${response.status} ${response.statusText}`,
      );
      return false;
    }

    console.log(
      `✅ Discord notification sent: ${type} for ${transaction.invoiceId}`,
    );
    return true;
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    return false;
  }
}

/**
 * Send notification for a new transaction (accepts Mongoose document or plain object)
 */
export async function notifyNewTransaction(transaction: any): Promise<boolean> {
  return sendDiscordNotification("new_transaction", {
    invoiceId: transaction.invoiceId,
    serviceName: transaction.serviceName,
    serviceType: transaction.serviceType,
    serviceCategory: transaction.serviceCategory,
    quantity: transaction.quantity,
    totalAmount: transaction.totalAmount,
    finalAmount: transaction.finalAmount,
    discountPercentage: transaction.discountPercentage,
    discountAmount: transaction.discountAmount,
    paymentMethodName: transaction.paymentMethodName,
    paymentGateway: transaction.paymentGateway,
    paymentStatus: transaction.paymentStatus,
    orderStatus: transaction.orderStatus,
    robloxUsername: transaction.robloxUsername,
    customerInfo: transaction.customerInfo,
  });
}

/**
 * Send notification for payment status change
 */
export async function notifyPaymentStatusChange(
  transaction: any,
  oldStatus: string,
  newStatus: string,
  notes?: string,
): Promise<boolean> {
  return sendDiscordNotification(
    "payment_status",
    {
      invoiceId: transaction.invoiceId,
      serviceName: transaction.serviceName,
      serviceType: transaction.serviceType,
      serviceCategory: transaction.serviceCategory,
      quantity: transaction.quantity,
      totalAmount: transaction.totalAmount,
      finalAmount: transaction.finalAmount,
      discountPercentage: transaction.discountPercentage,
      discountAmount: transaction.discountAmount,
      paymentMethodName: transaction.paymentMethodName,
      paymentGateway: transaction.paymentGateway,
      paymentStatus: newStatus,
      orderStatus: transaction.orderStatus,
      robloxUsername: transaction.robloxUsername,
      customerInfo: transaction.customerInfo,
    },
    {
      oldPaymentStatus: oldStatus,
      newPaymentStatus: newStatus,
      notes,
    },
  );
}

/**
 * Send notification for order status change
 */
export async function notifyOrderStatusChange(
  transaction: any,
  oldStatus: string,
  newStatus: string,
  notes?: string,
): Promise<boolean> {
  return sendDiscordNotification(
    "order_status",
    {
      invoiceId: transaction.invoiceId,
      serviceName: transaction.serviceName,
      serviceType: transaction.serviceType,
      serviceCategory: transaction.serviceCategory,
      quantity: transaction.quantity,
      totalAmount: transaction.totalAmount,
      finalAmount: transaction.finalAmount,
      discountPercentage: transaction.discountPercentage,
      discountAmount: transaction.discountAmount,
      paymentMethodName: transaction.paymentMethodName,
      paymentGateway: transaction.paymentGateway,
      paymentStatus: transaction.paymentStatus,
      orderStatus: newStatus,
      robloxUsername: transaction.robloxUsername,
      customerInfo: transaction.customerInfo,
    },
    {
      oldOrderStatus: oldStatus,
      newOrderStatus: newStatus,
      notes,
    },
  );
}
