export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';

export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FROZEN';

export type ProductStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export type OrderStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_BY_SELLER'
  | 'PROCESSING'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PAID' | 'PENDING' | 'CASH_ON_DELIVERY';

export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export type WithdrawalMethod =
  | 'USDT (TRC20)'
  | 'Bitcoin'
  | 'Ethereum'
  | 'PayPal'
  | 'Bank Transfer'
  | 'BANK_TRANSFER'
  | 'PAYPAL'
  | 'STRIPE'
  | 'EASYPAISA'
  | 'WIRE_TRANSFER'
  | string;

export type TransactionType =
  | 'CREDIT_ORDER_DELIVERED'
  | 'CREDIT_ORDER_PENDING'
  | 'CREDIT_RECHARGE'
  | 'DEBIT_WITHDRAWAL'
  | 'REFUND_ADJUSTMENT'
  | 'MANUAL_CREDIT'
  | 'MANUAL_DEBIT'
  | 'ADMIN_ADJUSTMENT';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  walletBalance?: number;
  balance?: number;
}

export type KycDocumentType =
  | 'ID Card'
  | 'Passport'
  | 'Driving License'
  | 'Social Card'
  | 'Social Security Card'
  | string;

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycDocument {
  documentType: KycDocumentType;
  frontImage: string;
  backImage: string;
  status: VerificationStatus;
  submittedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  storagePathFront?: string;
  storagePathBack?: string;
}

export interface SellerProfile {
  id: string;
  userId: string;
  shopName: string;
  sellerName: string;
  businessName?: string;
  email: string;
  password?: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  withdrawalMethod: WithdrawalMethod;
  payoutDetails: string;
  applicationStatus: ApplicationStatus;
  isFrozen?: boolean;
  status?: string;
  rejectionReason?: string;
  joinedDate: string;
  approvedAt?: string;
  rating?: number;
  starRating?: number; // 0 to 7 stars rating managed by admin
  totalSalesVolume?: number;
  walletBalance?: number;
  selectedProductIds?: string[];
  productsCount?: number;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  cashPaymentEnabled?: boolean;
  bankPaymentEnabled?: boolean;
  usdtPaymentEnabled?: boolean;
  // KYC Document Verification Fields
  documentType?: KycDocumentType;
  frontImage?: string;
  backImage?: string;
  verificationStatus?: VerificationStatus;
  kycDocument?: KycDocument;
  kycDocumentType?: KycDocumentType;
  kycFrontImageUrl?: string;
  kycBackImageUrl?: string;
  kycDocuments?: {
    documentType?: KycDocumentType;
    frontImageUrl?: string;
    backImageUrl?: string;
  };
  subscriptionPlanName?: string;
  subscriptionPrice?: string;
  subscriptionMessage?: string;
}

export interface SubscriptionPlanSettings {
  planName: string;
  price: string;
  message: string;
  buttonText?: string;
}

export interface SellerLoginSession {
  id: string;
  sellerId?: string;
  sellerName: string;
  email: string;
  phone?: string;
  shopName?: string;
  deviceType: string;
  deviceCategory?: 'mobile' | 'tablet' | 'desktop';
  browser: string;
  userAgent: string;
  ip: string;
  location: string;
  loginTime: string;
  timestamp: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  itemCount?: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName?: string;
  category?: string;
  sellerId?: string;
  price: number;
  originalPrice?: number;
  costPrice?: number;
  stock: number;
  images: string[];
  status: ProductStatus;
  sellerCommission?: number; // Seller commission %
  commissionRate?: number;
  customAdminCommissionPct?: number; // Override if present
  associatedSellerIds: string[]; // Sellers authorized for this product
  rating: number;
  reviewCount: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  zipCode?: string;
  country: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  appliedCommissionPct: number; // Historical snapshot
  adminProfit: number; // Historical snapshot
  sellerEarning: number; // Historical snapshot
  sellerId?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  totalAdminProfit: number;
  totalSellerEarning: number;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  assignedSellerId?: string;
  assignedSellerName?: string;
  assignedAt?: string;
  pickedAt?: string;
  costDeductedFromSeller?: boolean;
  costDeductedAmount?: number;
  source?: string;
  timeline: OrderTimelineEvent[];
  customerNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SellerWallet {
  sellerId: string;
  availableBalance: number;
  balance?: number;
  walletBalance?: number;
  pendingBalance: number;
  totalEarnings: number;
  totalWithdrawn: number;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  sellerId: string;
  orderId?: string;
  withdrawalId?: string;
  type: TransactionType;
  amount: number;
  description: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  date: string;
  isAdminDeposit?: boolean;
  source?: 'ADMIN' | 'ORDER' | 'WITHDRAWAL' | 'RECHARGE';
}

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  amount: number;
  method: WithdrawalMethod;
  payoutAccount: string;
  payoutDetails?: string;
  sellerNote?: string;
  adminNote?: string;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  recipientId?: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  type: 'CUSTOMER_SUPPORT' | 'SELLER_ADMIN';
  participantOneId: string;
  participantOneName: string;
  participantOneRole: UserRole;
  participantTwoId: string;
  participantTwoName: string;
  participantTwoRole: UserRole;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCountParticipantOne: number;
  unreadCountParticipantTwo: number;
}

export interface PlatformSettings {
  globalCommissionPct: number;
  minWithdrawalAmount: number;
  marketplaceName: string;
  supportEmail: string;
  currencySymbol: string;
  shippingFlatFee: number;
  freeShippingThreshold: number;
  categories?: Category[];
}

export interface NotificationItem {
  id: string;
  recipientId: string; // or 'ADMIN' | 'SELLER_ALL'
  title: string;
  message: string;
  type: 'ORDER' | 'WALLET' | 'APPLICATION' | 'SUPPORT' | 'SYSTEM';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuthSession {
  role: UserRole;
  userId: string;
  loginTime: number;
  expiresAt: number;
}

export interface StoreContactSettings {
  phone: string;
  email: string;
  address: string;
  workingHours: string;
  whatsapp?: string;
}
