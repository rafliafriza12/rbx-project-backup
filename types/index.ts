export interface ILayoutProps {
  children: React.ReactNode;
}

export interface TransactionStatusHistory {
  status: string;
  updatedAt: string;
  updatedBy: string;
  notes?: string;
  rawStatus?: string;
}

export interface CustomerInfo {
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export interface JokiDetails {
  targetLevel?: number;
  currentLevel?: number;
  gameType?: string;
  description?: string;
  [key: string]: any;
}

export interface Transaction {
  _id: string;
  userId?: string | null;
  serviceType: "robux" | "gamepass" | "joki";
  serviceId: string;
  serviceName: string;
  serviceImage?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  // Discount Information
  discountPercentage?: number;
  discountAmount?: number;
  finalAmount?: number;
  robloxUsername: string;
  robloxPassword?: string;
  jokiDetails?: JokiDetails;
  paymentStatus: "pending" | "settlement" | "expired" | "cancelled" | "failed";
  orderStatus:
    | "waiting_payment"
    | "processing"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "failed";
  customerInfo: CustomerInfo;
  adminNotes?: string;
  invoiceId: string;
  statusHistory: TransactionStatusHistory[];
  expiresAt?: string;
  midtransOrderId?: string;
  midtransTransactionId?: string;
  snapToken?: string;
  redirectUrl?: string;
  paidAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
