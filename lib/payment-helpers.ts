export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  fee: number;
  feeType: "fixed" | "percentage";
  description: string;
  minimumAmount?: number;
  maximumAmount?: number;
}

export interface PaymentCategory {
  id: string;
  name: string;
  icon: any; // React component or string
  description: string;
  methods: PaymentMethod[];
}

export const getTransactionLimitMessage = (
  method: PaymentMethod,
  amount: number,
): string | null => {
  if (method.minimumAmount && method.minimumAmount > 0) {
    if (amount < method.minimumAmount) {
      return `Min. Rp ${method.minimumAmount.toLocaleString("id-ID")}`;
    }
  }

  if (method.maximumAmount && method.maximumAmount > 0) {
    if (amount > method.maximumAmount) {
      return `Maks. Rp ${method.maximumAmount.toLocaleString("id-ID")}`;
    }
  }

  return null;
};

export const isPaymentMethodAvailable = (method: PaymentMethod, amount: number): boolean => {
  if (method.minimumAmount && method.minimumAmount > 0) {
    if (amount < method.minimumAmount) return false;
  }
  if (method.maximumAmount && method.maximumAmount > 0) {
    if (amount > method.maximumAmount) return false;
  }
  return true;
};

export const calculatePaymentFee = (baseAmount: number, method: PaymentMethod) => {
  if (method.feeType === "percentage") {
    return Math.round((baseAmount * method.fee) / 100);
  }
  return method.fee;
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
