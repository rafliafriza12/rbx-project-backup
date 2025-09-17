export interface OrderDetail {
  name: string;
  description: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  icon: string;
}

export interface InvoiceData {
  id: string;
  type: "gamepass" | "joki" | "robux";
  orderDetails: OrderDetail[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  gameInfo?: {
    username: string;
    userId: string;
  };
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: "pending" | "paid" | "failed" | "expired";
  createdAt: string;
  expiredAt: string;
}

export const PAYMENT_METHODS = [
  { id: "dana", name: "DANA", type: "E-Wallet", icon: "/dana.png" },
  { id: "gopay", name: "GoPay", type: "E-Wallet", icon: "/gopay.png" },
  { id: "shopee", name: "ShopeePay", type: "E-Wallet", icon: "/shopepay.png" },
  { id: "ewallet", name: "E-Wallet", type: "E-Wallet", icon: "/ewalet.png" },
  {
    id: "qris",
    name: "QRIS Virtual Account",
    type: "Virtual Account",
    icon: "/qr.png",
  },
  {
    id: "minimarket",
    name: "Minimarket",
    type: "Retail",
    icon: "/minimarket.png",
  },
  {
    id: "bri",
    name: "BRI Virtual Account",
    type: "Virtual Account",
    icon: "/virtual.png",
  },
  { id: "alfamart", name: "Alfamart", type: "Retail", icon: "/minimarket.png" },
];

export const generateInvoiceId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp.slice(-6)}-${random}`;
};

export const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "text-yellow-600 bg-yellow-100 border-yellow-200";
    case "paid":
      return "text-green-600 bg-green-100 border-green-200";
    case "failed":
      return "text-red-600 bg-red-100 border-red-200";
    case "expired":
      return "text-gray-600 bg-gray-100 border-gray-200";
    default:
      return "text-gray-600 bg-gray-100 border-gray-200";
  }
};

export const createInvoice = (orderData: {
  type: "gamepass" | "joki" | "robux";
  orderDetails: OrderDetail[];
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  gameInfo?: {
    username: string;
    userId: string;
  };
  paymentMethodId: string;
}): InvoiceData => {
  const selectedPaymentMethod = PAYMENT_METHODS.find(
    (pm) => pm.id === orderData.paymentMethodId
  );
  const totalAmount = orderData.orderDetails.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const now = new Date();
  const expiredAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now

  return {
    id: generateInvoiceId(),
    type: orderData.type,
    orderDetails: orderData.orderDetails,
    customerInfo: orderData.customerInfo,
    gameInfo: orderData.gameInfo,
    totalAmount,
    paymentMethod: selectedPaymentMethod || PAYMENT_METHODS[0],
    status: "pending",
    createdAt: now.toISOString(),
    expiredAt: expiredAt.toISOString(),
  };
};
