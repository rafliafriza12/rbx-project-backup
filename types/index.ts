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

export interface GamepassDetails {
  gameName?: string;
  itemName?: string;
  gamepassId?: string;
  additionalInfo?: string;
}

export interface Rbx5Details {
  robuxAmount?: number;
  packageName?: string;
  selectedPlace?: {
    placeId: number;
    name: string;
    universeId: number;
  };
  gamepassAmount?: number;
  gamepassCreated?: boolean;
  gamepass?: {
    id: number;
    name: string;
    price: number;
    productId: number;
    sellerId: number;
  };
  pricePerRobux?: any;
  backupCode?: string;
}

export interface RobuxInstantDetails {
  notes?: string;
  additionalInfo?: string;
  robuxAmount?: number;
  productName?: string;
  description?: string;
}

export interface Transaction {
  _id: string;
  userId?: string | null;
  serviceType: "robux" | "gamepass" | "joki";
  serviceId: string;
  serviceName: string;
  serviceImage?: string;
  serviceCategory?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  // Discount Information
  discountPercentage?: number;
  discountAmount?: number;
  finalAmount?: number;
  // Payment Fee (for multi-checkout, stored in first transaction)
  paymentFee?: number;
  // Payment Method
  paymentMethodId?: string;
  paymentMethodName?: string;
  robloxUsername: string;
  robloxPassword?: string;
  jokiDetails?: JokiDetails;
  gamepassDetails?: GamepassDetails;
  rbx5Details?: Rbx5Details;
  robuxInstantDetails?: RobuxInstantDetails;
  gamepass?: any;
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
  customerNotes?: string;
  invoiceId: string;
  statusHistory: TransactionStatusHistory[];
  expiresAt?: string;
  // Midtrans Payment Data
  midtransOrderId?: string;
  midtransTransactionId?: string;
  snapToken?: string;
  redirectUrl?: string;
  // Duitku Payment Data
  duitkuOrderId?: string;
  duitkuReference?: string;
  duitkuPaymentUrl?: string;
  duitkuVaNumber?: string;
  duitkuQrString?: string;
  // Payment Gateway Info
  paymentGateway?: "midtrans" | "duitku";
  paidAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  // For grouped transactions (multi-checkout)
  relatedTransactions?: Transaction[];
  isMultiCheckout?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Review {
  _id: string;
  username: string;
  serviceType: "robux" | "gamepass" | "joki";
  serviceCategory?: "robux_instant" | "robux_5_hari";
  serviceId?: string;
  serviceName?: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewApiResponse extends ApiResponse<Review[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminReviewsResponse extends ApiResponse<Review[]> {
  stats: {
    total: number;
    approved: number;
    pending: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
