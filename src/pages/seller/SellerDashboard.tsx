import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Store,
  Package,
  Wallet,
  Clock,
  CheckCircle2,
  Truck,
  ArrowUpRight,
  ArrowLeft,
  TrendingUp,
  MessageSquare,
  Headphones,
  Maximize2,
  Send,
  DollarSign,
  Layers,
  LayoutGrid,
  Receipt,
  MoreHorizontal,
  Lock,
  X,
  Star,
  ChevronRight,
  ShoppingCart,
  Tag,
  Award,
  Settings,
  User,
  Plus,
  ArrowRight,
  ShieldCheck,
  Percent,
  Search,
  LogOut,
  Sparkles,
  Home,
  Moon,
  Sun,
  Landmark,
  Download,
  ChevronDown,
  ChevronUp,
  Archive,
  Menu,
  RotateCcw,
  RefreshCw,
  AlertCircle,
  Copy,
  Upload,
  Image as ImageIcon,
  FileText,
  Check,
  QrCode,
  Gift,
  Eye,
  ZoomIn,
  Camera,
  Pencil,
  Coins,
  Save,
  KeyRound,
  Mail,
  Phone,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/Badge';
import { Order, OrderStatus, WithdrawalMethod, Product, SellerWallet } from '../../types';
import { listenToSellerRatingInFirestore } from '../../services/firebaseKyc';

interface SellerDashboardProps {
  onNavigate?: (view: string) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({ onNavigate }) => {
  const {
    currentUser,
    switchUserRole,
    sellers,
    orders,
    products,
    categories,
    wallets,
    withdrawals,
    transactions,
    submitWithdrawalRequest,
    adjustSellerWallet,
    updateOrderStatus,
    messages,
    sendMessage,
    startOrGetSupportConversation,
    markConversationAsRead,
    listenToChatMessages,
    settings,
    updateSellerStatus,
    updateSellerProfile,
    addProduct,
    toggleSellerProductEligibility,
    addProductsToSeller,
    logoutSeller,
    sellerRemainingSeconds,
    approveSellerApplication,
    subscriptionPlan,
  } = useStore();

  const formatSellerCountdown = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  // Navigation tab for mobile verified dashboard - always starts at 'home' on refresh
  const [mobileTab, setMobileTab] = useState<
    'home' | 'products' | 'orders' | 'support' | 'more' | 'withdraw' | 'profile' | 'add-products'
  >('home');

  // Purge any stored sub-tab so browser refresh always lands on main seller dashboard overview
  useEffect(() => {
    try {
      localStorage.removeItem('nexus_seller_tab');
      sessionStorage.removeItem('nexus_seller_tab');
    } catch {}
  }, []);

  // Whenever user switches to withdraw or opens seller dashboard, ensure USDT is selected by default
  useEffect(() => {
    setWithdrawPaymentMethod('USDT');
    setWithdrawMethod('USDT (TRC20)');
  }, []);

  useEffect(() => {
    if (mobileTab === 'withdraw') {
      setWithdrawPaymentMethod('USDT');
      setWithdrawMethod('USDT (TRC20)');
    }
  }, [mobileTab]);

  // Auto-scroll to top whenever tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const contentEl = document.getElementById('seller-main-scroll-container');
    if (contentEl) {
      contentEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [mobileTab]);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [unverifiedNotice, setUnverifiedNotice] = useState<string | null>(null);
  const [liveRatingOverride, setLiveRatingOverride] = useState<number | null>(null);

  // Profile state matching user's Manage Profile screenshot
  const [profileName, setProfileName] = useState<string>('');
  const [profilePhone, setProfilePhone] = useState<string>('');
  const [profileEmail, setProfileEmail] = useState<string>('');
  const [profileCashPayment, setProfileCashPayment] = useState<boolean>(true);
  const [profileBankPayment, setProfileBankPayment] = useState<boolean>(true);
  const [profileUsdtPayment, setProfileUsdtPayment] = useState<boolean>(false);
  const [profileBankName, setProfileBankName] = useState<string>('');
  const [profileBankAccountName, setProfileBankAccountName] = useState<string>('');
  const [profileBankAccountNumber, setProfileBankAccountNumber] = useState<string>('');
  const [profileIfscCode, setProfileIfscCode] = useState<string>('');
  const [profileSaveToast, setProfileSaveToast] = useState<string | null>(null);

  // Sub-modals for Profile Actions
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileModalName, setEditProfileModalName] = useState('');
  const [editProfileModalPhone, setEditProfileModalPhone] = useState('');
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [changeEmailError, setChangeEmailError] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

  // New Wallet / Money Withdraw states matching screenshot
  const [withdrawInputAmount, setWithdrawInputAmount] = useState<string>('');
  const [withdrawPaymentMethod, setWithdrawPaymentMethod] = useState<'USDT' | 'Bitcoin' | 'Ethereum' | 'PayPal' | 'Bank'>('USDT');
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [paypalEmail, setPayPalEmail] = useState('');
  const [withdrawNoteInput, setWithdrawNoteInput] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  const [withdrawSuccessToast, setWithdrawSuccessToast] = useState<string | null>(null);
  const [withdrawErrorToast, setWithdrawErrorToast] = useState<string | null>(null);
  const [refreshingWithdrawals, setRefreshingWithdrawals] = useState(false);

  // Modals
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(10);
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawalMethod>('USDT (TRC20)');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawFeedback, setWithdrawFeedback] = useState<string | null>(null);

  // Tracking modal for shipping
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('FedEx Express');

  // Plan upgrade modal
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Profile / Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editShopName, setEditShopName] = useState('');
  const [editSellerName, setEditSellerName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);

  // More Navigation Drawer (Left slide-over matching screenshot)
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [ordersDrawerAccordionOpen, setOrdersDrawerAccordionOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [installAppNotice, setInstallAppNotice] = useState<string | null>(null);

  // Add Product modal & Search/Filter states
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productMaxPrice, setProductMaxPrice] = useState<string>('');
  const [productFilterTab, setProductFilterTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'>('ALL');
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState<number>(49.99);
  const [newProductCategory, setNewProductCategory] = useState(categories[0]?.name || 'Laptops & Computers');
  const [newProductImage, setNewProductImage] = useState('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80');

  // Add Products Catalogue View state (Matching user screenshot)
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogHideAdded, setCatalogHideAdded] = useState(false);
  const [catalogSelectedIds, setCatalogSelectedIds] = useState<string[]>([]);

  // Chat state
  const [chatInput, setChatInput] = useState('');

  // Find seller record for current user
  const currentSeller =
    (currentUser?.id && currentUser.id !== 'guest_visitor' && sellers.find((s) => s.userId === currentUser.id || s.id === currentUser.id)) ||
    (currentUser?.email && sellers.find((s) => (s.email || '').toLowerCase() === currentUser.email.toLowerCase())) ||
    sellers.find((s) => !s.id.includes('dummy') && !s.id.includes('default')) ||
    sellers[0];

  const isStoreFrozen =
    currentSeller?.applicationStatus === 'FROZEN' ||
    (currentSeller as any)?.isFrozen === true ||
    (currentSeller as any)?.status === 'frozen' ||
    (currentSeller as any)?.status === 'FROZEN' ||
    Boolean(
      currentUser &&
      sellers.some(
        (s) =>
          (s.id === currentUser.id || s.userId === currentUser.id) &&
          (s.applicationStatus === 'FROZEN' || (s as any).isFrozen === true || (s as any).status === 'frozen')
      )
    );

  // When store is frozen, IMMEDIATELY redirect and lock to customer care chat box
  useEffect(() => {
    if (isStoreFrozen) {
      if (onNavigate) {
        onNavigate('seller-support');
      }
    }
  }, [isStoreFrozen, onNavigate]);

  // Helper to cleanly format shop name and merchant name without any "(Platform Admin)" or "(Admin)" text
  const rawShopName =
    currentSeller?.shopName ||
    (currentUser?.id && currentUser.id !== 'guest_visitor' ? `${currentUser.name}'s Store` : 'Official Store');
  const displayShopName =
    (rawShopName || 'Official Store')
      .replace(/\(Platform\s*Admin\)/gi, '')
      .replace(/\(Admin\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Official Store';

  const rawSellerName =
    currentSeller?.sellerName ||
    (currentUser?.id && currentUser.id !== 'guest_visitor' ? currentUser.name : '') ||
    'Store Merchant';
  const displaySellerName =
    (rawSellerName || 'Store Merchant')
      .replace(/\(Platform\s*Admin\)/gi, '')
      .replace(/\(Admin\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim() || 'Store Merchant';

  // Dynamic subscription plan settings configured via Admin Portal
  const effectivePlanName =
    currentSeller?.subscriptionPlanName ||
    subscriptionPlan?.planName ||
    'Platinum Merchant';
  const effectivePlanPrice =
    currentSeller?.subscriptionPrice ||
    subscriptionPlan?.price ||
    '$29 / mo';
  const effectivePlanMessage =
    currentSeller?.subscriptionMessage ||
    subscriptionPlan?.message ||
    'Active until 16 Feb 2026. Includes 1000 items, verified check badge, and 0% additional listing fees.';
  const effectivePlanButtonText =
    subscriptionPlan?.buttonText ||
    'Current Plan is Active';

  // Synchronize profile state with current seller & user data
  useEffect(() => {
    if (currentSeller) {
      if (currentSeller.sellerName) setProfileName(currentSeller.sellerName);
      else if (currentUser?.name && currentUser.id !== 'guest_visitor') setProfileName(currentUser.name);

      if (currentSeller.phone) setProfilePhone(currentSeller.phone);
      else if (currentUser?.phone) setProfilePhone(currentUser.phone);

      if (currentSeller.email) setProfileEmail(currentSeller.email);
      else if (currentUser?.email) setProfileEmail(currentUser.email);

      if (currentSeller.bankName) setProfileBankName(currentSeller.bankName);
      if (currentSeller.bankAccountName) setProfileBankAccountName(currentSeller.bankAccountName);
      if (currentSeller.bankAccountNumber) setProfileBankAccountNumber(currentSeller.bankAccountNumber);
      if (currentSeller.bankIfscCode) setProfileIfscCode(currentSeller.bankIfscCode);
    } else if (currentUser && currentUser.id !== 'guest_visitor') {
      if (currentUser.name) setProfileName(currentUser.name);
      if (currentUser.phone) setProfilePhone(currentUser.phone);
      if (currentUser.email) setProfileEmail(currentUser.email);
    }
  }, [
    currentSeller?.id,
    currentSeller?.sellerName,
    currentSeller?.phone,
    currentSeller?.email,
    currentSeller?.bankName,
    currentSeller?.bankAccountName,
    currentSeller?.bankAccountNumber,
    currentSeller?.bankIfscCode,
    currentUser?.id,
    currentUser?.name,
    currentUser?.phone,
    currentUser?.email,
  ]);

  const openSettingsModal = () => {
    setEditShopName(displayShopName);
    setEditSellerName(displaySellerName);
    setEditPhone(currentSeller?.phone || currentUser?.phone || '+1 (555) 019-2834');
    setSettingsSavedMessage(null);
    setShowSettingsModal(true);
  };

  const handleSaveProfile = () => {
    if (currentSeller) {
      updateSellerProfile(currentSeller.id, {
        sellerName: profileName.trim() || displaySellerName,
        phone: profilePhone.trim() || currentSeller.phone || '',
        email: profileEmail.trim() || currentSeller.email || '',
        bankName: profileBankName.trim(),
        bankAccountName: profileBankAccountName.trim(),
        bankAccountNumber: profileBankAccountNumber.trim(),
        bankIfscCode: profileIfscCode.trim(),
        cashPaymentEnabled: profileCashPayment,
        bankPaymentEnabled: profileBankPayment,
        usdtPaymentEnabled: profileUsdtPayment,
      });
    }
    setProfileSaveToast('✓ Profile & payment preferences saved successfully!');
    setTimeout(() => {
      setProfileSaveToast(null);
    }, 4000);
  };

  const handleConfirmChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmailInput.trim() || !newEmailInput.includes('@')) {
      setChangeEmailError('Please enter a valid email address.');
      return;
    }
    setProfileEmail(newEmailInput.trim());
    if (currentSeller) {
      updateSellerProfile(currentSeller.id, {
        email: newEmailInput.trim(),
      });
    }
    setShowChangeEmailModal(false);
    setChangeEmailError(null);
    setProfileSaveToast('✓ Email address updated successfully!');
    setTimeout(() => setProfileSaveToast(null), 4000);
  };

  const handleConfirmChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setChangePasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePasswordError('Passwords do not match.');
      return;
    }
    setShowChangePasswordModal(false);
    setCurrentPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setChangePasswordError(null);
    setProfileSaveToast('✓ Password updated successfully!');
    setTimeout(() => setProfileSaveToast(null), 4000);
  };

  const handleConfirmEditProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (editProfileModalName.trim()) {
      setProfileName(editProfileModalName.trim());
    }
    if (editProfileModalPhone.trim()) {
      setProfilePhone(editProfileModalPhone.trim());
    }
    if (currentSeller) {
      updateSellerProfile(currentSeller.id, {
        sellerName: editProfileModalName.trim() || profileName,
        phone: editProfileModalPhone.trim() || profilePhone,
      });
    }
    setShowEditProfileModal(false);
    setProfileSaveToast('✓ Profile updated successfully!');
    setTimeout(() => setProfileSaveToast(null), 4000);
  };

  let storageWallet: SellerWallet | undefined = undefined;
  try {
    const raw = localStorage.getItem('nexus_wallets');
    if (raw) {
      const parsed = JSON.parse(raw);
      storageWallet =
        (currentSeller?.id && parsed[currentSeller.id]) ||
        (currentSeller?.userId && parsed[currentSeller.userId]) ||
        (currentUser?.id && parsed[currentUser.id]);
    }
  } catch {}

  let storageSellerBalance: number | undefined = undefined;
  let storageSellerRating: number | undefined = undefined;
  try {
    const rawS = localStorage.getItem('nexus_sellers');
    if (rawS) {
      const parsedS = JSON.parse(rawS);
      if (Array.isArray(parsedS)) {
        const match = parsedS.find(
          (s: any) =>
            (currentSeller?.id && s.id === currentSeller.id) ||
            (currentSeller?.userId && s.userId === currentSeller.userId) ||
            (currentUser?.id && (s.id === currentUser.id || s.userId === currentUser.id)) ||
            (currentUser?.email && (s.email || '').toLowerCase() === (currentUser.email || '').toLowerCase())
        );
        if (match) {
          if (typeof match.walletBalance === 'number') {
            storageSellerBalance = match.walletBalance;
          }
          if (typeof match.starRating === 'number') {
            storageSellerRating = match.starRating;
          } else if (typeof match.rating === 'number') {
            storageSellerRating = match.rating;
          }
        }
      }
    }
  } catch {}

  const effectiveStarRating = Math.max(
    0,
    Math.min(
      7,
      liveRatingOverride ??
      currentSeller?.starRating ??
      storageSellerRating ??
      (typeof (currentSeller as any)?.rating === 'number' ? (currentSeller as any).rating : 7)
    )
  );

  const rawWallet =
    (currentSeller?.id && wallets[currentSeller.id]) ||
    (currentSeller?.userId && wallets[currentSeller.userId]) ||
    (currentUser?.id && wallets[currentUser.id]) ||
    storageWallet;

  const resolvedBalance = Number(
    rawWallet?.availableBalance ??
    rawWallet?.balance ??
    rawWallet?.walletBalance ??
    currentSeller?.walletBalance ??
    (currentSeller as any)?.balance ??
    storageSellerBalance ??
    0
  );

  const sellerWallet = {
    sellerId: currentSeller?.id,
    availableBalance: resolvedBalance,
    balance: resolvedBalance,
    walletBalance: resolvedBalance,
    pendingBalance: Number(rawWallet?.pendingBalance || 0),
    totalEarnings: Number(rawWallet?.totalEarnings || 0),
    totalWithdrawn: Number(rawWallet?.totalWithdrawn || 0),
    updatedAt: rawWallet?.updatedAt || new Date().toISOString(),
  };

  // Orders Tab specific state
  const [orderFilterTab, setOrderFilterTab] = useState<
    'ALL' | 'NEEDS_ACTION' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ASSIGNED_TO_ME' | 'DIRECT'
  >('ALL');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const [pickupOrderModal, setPickupOrderModal] = useState<Order | null>(null);
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState<{
    order: Order;
    required: number;
    available: number;
    shortfall: number;
  } | null>(null);
  const [pickupSuccessToast, setPickupSuccessToast] = useState<string | null>(null);
  const [pickupErrorToast, setPickupErrorToast] = useState<string | null>(null);
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  // Orders strictly assigned to this seller or direct orders belonging exclusively to this seller
  const sellerOrders = orders.filter((o) => {
    if (!currentSeller) return false;

    // Check if directly assigned to this seller by Admin
    const oSellerId = typeof o.assignedSellerId === 'string' ? o.assignedSellerId.toLowerCase().trim() : '';
    const oSellerName = typeof o.assignedSellerName === 'string' ? o.assignedSellerName.toLowerCase().trim() : '';
    const myEmail = typeof currentSeller.email === 'string' ? currentSeller.email.toLowerCase().trim() : '';
    const myShop = typeof currentSeller.shopName === 'string' ? currentSeller.shopName.toLowerCase().trim() : '';
    const myName = typeof currentSeller.sellerName === 'string' ? currentSeller.sellerName.toLowerCase().trim() : '';

    const isExplicitlyAssignedToMe = Boolean(
      (oSellerId && (
        o.assignedSellerId === currentSeller.id ||
        (currentSeller.userId && o.assignedSellerId === currentSeller.userId) ||
        (myEmail && oSellerId === myEmail) ||
        (currentUser?.id && o.assignedSellerId === currentUser.id)
      )) ||
      (oSellerName && (
        (myShop && oSellerName === myShop) ||
        (myName && oSellerName === myName) ||
        (myEmail && oSellerName === myEmail)
      ))
    );

    // CRITICAL (Multi-Vendor Order Isolation):
    // If an order has been assigned to a seller (e.g. by Admin), it MUST ONLY be visible
    // to that exact target seller. It must NEVER leak to other platform sellers!
    if (o.assignedSellerId || o.assignedSellerName) {
      return isExplicitlyAssignedToMe;
    }

    // For unassigned marketplace/direct orders: only visible if this seller is the direct owner of line items
    if (o.items && o.items.length > 0) {
      const hasMyDirectItem = o.items.some((item) => {
        const itemSeller = (item as any).sellerId;
        return (
          itemSeller &&
          (itemSeller === currentSeller.id ||
            (currentSeller.userId && itemSeller === currentSeller.userId) ||
            itemSeller === currentUser?.id)
        );
      });
      if (hasMyDirectItem) return true;
    }

    return false;
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  // Auto-approve seller if they have any assigned orders so they never get blocked by "awaiting approval"
  useEffect(() => {
    if (currentSeller && currentSeller.applicationStatus === 'PENDING' && sellerOrders.length > 0) {
      approveSellerApplication(currentSeller.id);
    }
  }, [currentSeller?.id, currentSeller?.applicationStatus, sellerOrders.length, approveSellerApplication]);

  // Order filtering based on tabs
  const getFilteredOrdersByTab = () => {
    return sellerOrders.filter((o) => {
      if (orderFilterTab === 'ALL') return true;
      if (orderFilterTab === 'NEEDS_ACTION')
        return o.status === 'PENDING' || o.status === 'ASSIGNED';
      if (orderFilterTab === 'IN_PROGRESS')
        return (
          o.status === 'PROCESSING' ||
          o.status === 'ON_THE_WAY' ||
          o.status === 'PICKED_BY_SELLER' ||
          o.status === 'ACCEPTED'
        );
      if (orderFilterTab === 'COMPLETED') return o.status === 'DELIVERED';
      if (orderFilterTab === 'CANCELLED') return o.status === 'CANCELLED';
      if (orderFilterTab === 'ASSIGNED_TO_ME') return !!o.assignedSellerId;
      if (orderFilterTab === 'DIRECT')
        return (
          o.source === 'Direct' ||
          !o.assignedSellerName ||
          o.assignedSellerId === currentSeller?.id
        );
      return true;
    }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  };

  const filteredOrders = getFilteredOrdersByTab();

  // Tab counts
  const countAll = sellerOrders.length;
  const countNeedsAction = sellerOrders.filter(
    (o) => o.status === 'PENDING' || o.status === 'ASSIGNED'
  ).length;
  const countInProgress = sellerOrders.filter(
    (o) =>
      o.status === 'PROCESSING' ||
      o.status === 'ON_THE_WAY' ||
      o.status === 'PICKED_BY_SELLER' ||
      o.status === 'ACCEPTED'
  ).length;
  const countCompleted = sellerOrders.filter((o) => o.status === 'DELIVERED').length;
  const countCancelled = sellerOrders.filter((o) => o.status === 'CANCELLED').length;
  const countAssigned = sellerOrders.length;
  const countDirect = sellerOrders.filter(
    (o) =>
      o.source === 'Direct' ||
      !o.assignedSellerName ||
      o.assignedSellerId === currentSeller?.id
  ).length;

  // Format date and time according to user device locale
  const formatOrderDateTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString || '';
    }
  };

  const handleRefreshOrders = () => {
    setRefreshingOrders(true);
    setTimeout(() => {
      setRefreshingOrders(false);
      setPickupSuccessToast('✓ Orders refreshed successfully');
      setTimeout(() => setPickupSuccessToast(null), 2000);
    }, 500);
  };

  const [walletRefreshCounter, setWalletRefreshCounter] = useState(0);

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('nexus_wallet_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'WALLET_UPDATED' || event.data?.type === 'SELLER_RATING_UPDATED') {
            if (event.data?.type === 'SELLER_RATING_UPDATED') {
              const { sellerId, userId, starRating } = event.data;
              if (typeof starRating === 'number') {
                const isTarget =
                  (currentSeller?.id && (sellerId === currentSeller.id || userId === currentSeller.id)) ||
                  (currentSeller?.userId && (sellerId === currentSeller.userId || userId === currentSeller.userId)) ||
                  (currentUser?.id && (sellerId === currentUser.id || userId === currentUser.id));
                if (isTarget) {
                  setLiveRatingOverride(starRating);
                }
              }
            }
            setWalletRefreshCounter((c) => c + 1);
          }
        };
      }
    } catch {}

    const handleRatingEvent = (e: any) => {
      const detail = e?.detail;
      if (detail && typeof detail.starRating === 'number') {
        const isTarget =
          (currentSeller?.id && (detail.sellerId === currentSeller.id || detail.userId === currentSeller.id)) ||
          (currentSeller?.userId && (detail.sellerId === currentSeller.userId || detail.userId === currentSeller.userId)) ||
          (currentUser?.id && (detail.sellerId === currentUser.id || detail.userId === currentUser.id));
        if (isTarget) {
          setLiveRatingOverride(detail.starRating);
        }
      }
      setWalletRefreshCounter((c) => c + 1);
    };
    window.addEventListener('seller_rating_updated', handleRatingEvent);

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'nexus_sellers' || e.key === 'nexus_wallets') {
        setWalletRefreshCounter((c) => c + 1);
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // Real-time Firestore subscription for immediate star rating sync
    const targetSellerId = currentSeller?.id || currentSeller?.userId || currentUser?.id;
    let unsubFirestoreRating: (() => void) | null = null;
    if (targetSellerId) {
      unsubFirestoreRating = listenToSellerRatingInFirestore(targetSellerId, (newRating) => {
        setLiveRatingOverride(newRating);
      });
    }
    let unsubFirestoreRatingUser: (() => void) | null = null;
    if (currentSeller?.userId && currentSeller.userId !== targetSellerId) {
      unsubFirestoreRatingUser = listenToSellerRatingInFirestore(currentSeller.userId, (newRating) => {
        setLiveRatingOverride(newRating);
      });
    }

    return () => {
      try {
        bc?.close();
      } catch {}
      window.removeEventListener('seller_rating_updated', handleRatingEvent);
      window.removeEventListener('storage', handleStorageEvent);
      if (unsubFirestoreRating) unsubFirestoreRating();
      if (unsubFirestoreRatingUser) unsubFirestoreRatingUser();
    };
  }, [currentSeller?.id, currentSeller?.userId, currentUser?.id]);

  const initiatePickup = (order: Order) => {
    if (sellerWallet.availableBalance < order.totalAmount) {
      const shortfall = order.totalAmount - sellerWallet.availableBalance;
      const errorMsg = `Insufficient wallet balance! Order #${order.id} requires $${order.totalAmount.toFixed(2)}, but your balance is $${sellerWallet.availableBalance.toFixed(2)} (Short by $${shortfall.toFixed(2)}).`;
      setPickupErrorToast(errorMsg);
      setWithdrawErrorToast(errorMsg);
      setInsufficientBalanceModal({
        order,
        required: order.totalAmount,
        available: sellerWallet.availableBalance,
        shortfall,
      });
      setTimeout(() => {
        setPickupErrorToast(null);
        setWithdrawErrorToast(null);
      }, 7000);
      return;
    }
    setPickupOrderModal(order);
  };

  const handleConfirmPickup = (order: Order) => {
    const targetSellerId = currentSeller?.id || currentUser.id || order.assignedSellerId;

    // Verify sufficient balance before pickup
    if (sellerWallet.availableBalance < order.totalAmount) {
      const shortfall = order.totalAmount - sellerWallet.availableBalance;
      const errorMsg = `Insufficient wallet balance! Picking up Order #${order.id} requires $${order.totalAmount.toFixed(2)}, but your balance is $${sellerWallet.availableBalance.toFixed(2)} (Short by $${shortfall.toFixed(2)}).`;
      setPickupErrorToast(errorMsg);
      setWithdrawErrorToast(errorMsg);
      setPickupOrderModal(null);
      setInsufficientBalanceModal({
        order,
        required: order.totalAmount,
        available: sellerWallet.availableBalance,
        shortfall,
      });
      setTimeout(() => {
        setPickupErrorToast(null);
        setWithdrawErrorToast(null);
      }, 7000);
      return;
    }

    // 1. Deduct order cost from seller's wallet balance
    if (targetSellerId) {
      const adjResult = adjustSellerWallet(
        targetSellerId,
        order.totalAmount,
        'DEDUCT',
        `Order #${order.id} pickup cost deducted ($${order.totalAmount.toFixed(2)})`
      );
      if (!adjResult.success) {
        setWithdrawErrorToast(adjResult.message);
        setPickupOrderModal(null);
        setTimeout(() => setWithdrawErrorToast(null), 5000);
        return;
      }
    }

    // 2. Set order status to PROCESSING (live sync to Firestore & Admin)
    updateOrderStatus(
      order.id,
      'PROCESSING',
      `Merchant picked up order #${order.id} and started fulfillment. Cost of $${order.totalAmount.toFixed(2)} deducted from wallet balance.`
    );

    const profitVal = Number((order.totalAmount * 0.21).toFixed(2));
    setPickupSuccessToast(
      `✓ Order #${order.id} Picked Up! Status shifted to Processing. -$${order.totalAmount.toFixed(2)} deducted from wallet. (+$${(order.totalAmount + profitVal).toFixed(2)} pending)`
    );
    setPickupOrderModal(null);
    if (selectedOrderDetails?.id === order.id) {
      setSelectedOrderDetails(null);
    }
    setTimeout(() => {
      setPickupSuccessToast(null);
    }, 4500);
  };

  // Calculate metrics
  const completedOrders = sellerOrders.filter((o) => o.status === 'DELIVERED');
  const processingOrders = sellerOrders.filter(
    (o) =>
      o.status === 'ASSIGNED' ||
      o.status === 'PROCESSING' ||
      o.status === 'ON_THE_WAY' ||
      o.status === 'PICKED_BY_SELLER' ||
      o.status === 'ACCEPTED'
  );
  const needsPickingOrders = sellerOrders.filter(
    (o) => o.status === 'ASSIGNED' || o.status === 'PENDING'
  );
  const onTheWayOrders = sellerOrders.filter((o) => o.status === 'ON_THE_WAY');
  const cancelledOrders = sellerOrders.filter((o) => o.status === 'CANCELLED');

  // Picked-up orders in transit / processing
  // User requirement: "Seller ke dashboard par pending amount section mein order ki amount aur profit dono aapas mein plus (sum) ho kar ek saath total pending amount show hone chahiye."
  const pickedUpInTransitOrders = sellerOrders.filter(
    (o) =>
      o.status === 'PROCESSING' ||
      o.status === 'ON_THE_WAY' ||
      o.status === 'PICKED_BY_SELLER' ||
      o.status === 'ACCEPTED'
  );
  const dynamicPendingEarnings = pickedUpInTransitOrders.reduce((sum, o) => {
    const profit = o.totalSellerEarning > 0 && o.totalSellerEarning <= o.totalAmount * 0.5
      ? o.totalSellerEarning
      : Number((o.totalAmount * 0.21).toFixed(2));
    const orderPendingTotal = o.totalAmount + profit;
    return sum + orderPendingTotal;
  }, 0);
  const displayPendingAmount =
    dynamicPendingEarnings > 0 ? dynamicPendingEarnings : (sellerWallet.pendingBalance || 0);

  const paymentMethodsList: Array<{ id: 'USDT' | 'Bitcoin' | 'Ethereum' | 'PayPal' | 'Bank'; name: string; sub: string }> = [
    { id: 'USDT', name: 'USDT', sub: 'TRC20' },
    { id: 'Bitcoin', name: 'Bitcoin', sub: 'BTC' },
    { id: 'Ethereum', name: 'Ethereum', sub: 'ETH' },
    { id: 'PayPal', name: 'PayPal', sub: 'Email' },
    { id: 'Bank', name: 'Bank', sub: 'Transfer' },
  ];

  // Withdrawals for this seller (latest/newest at the very top)
  const sellerWithdrawals = withdrawals
    .filter((w) => w.sellerId === currentSeller?.id)
    .sort(
      (a, b) =>
        new Date(b.requestedAt || (b as any).createdAt || 0).getTime() -
        new Date(a.requestedAt || (a as any).createdAt || 0).getTime()
    );

  // Helper to reliably check if a product is associated with the current seller across all identifier formats
  const isProductAssociatedWithCurrentSeller = (p: Product) => {
    if (!currentSeller) return false;
    if (currentSeller.id && p.associatedSellerIds?.includes(currentSeller.id)) return true;
    if (currentSeller.userId && p.associatedSellerIds?.includes(currentSeller.userId)) return true;
    if (currentSeller.selectedProductIds && currentSeller.selectedProductIds.includes(p.id)) return true;
    if (currentSeller.email && p.associatedSellerIds?.some((x) => typeof x === 'string' && x.toLowerCase() === currentSeller.email.toLowerCase())) return true;
    return false;
  };

  // Products assigned or in catalog
  const assignedProducts = products.filter(isProductAssociatedWithCurrentSeller);

  // Dynamic Category Wise Product Count based on actual Admin categories & catalog/shop products
  const categoryStats = useMemo(() => {
    return categories.map((cat) => {
      const catNameLower = (cat.name || '').toLowerCase().trim();
      const catSlugLower = (cat.slug || '').toLowerCase().trim();

      // Find all products belonging to this category in the catalog
      const matchingCatalog = products.filter((p) => {
        if (!p) return false;
        if (p.categoryId && p.categoryId === cat.id) return true;
        const pCatName = (p.categoryName || '').toLowerCase().trim();
        if (pCatName && catNameLower && (pCatName === catNameLower || pCatName === catSlugLower)) return true;
        const pCat = (p.category || '').toLowerCase().trim();
        if (pCat && catNameLower && (pCat === catNameLower || pCat === catSlugLower)) return true;
        if (cat.id === 'cat_gaming' && (pCatName.includes('gaming') || p.name.toLowerCase().includes('gaming'))) return true;
        if (
          cat.id === 'cat_fashion' &&
          (pCatName.includes('fashion') ||
            pCatName.includes('wearables') ||
            pCatName.includes('jewelry') ||
            pCatName.includes('apparel') ||
            p.categoryId === 'cat_wearables' ||
            p.categoryId === 'cat_jewelry' ||
            p.categoryId === 'cat_clothing' ||
            p.categoryId === 'cat_men' ||
            p.categoryId === 'cat_kids')
        )
          return true;
        return false;
      });

      // Find seller's own products in this category
      const matchingShop = assignedProducts.filter((p) => {
        if (!p) return false;
        if (p.categoryId && p.categoryId === cat.id) return true;
        const pCatName = (p.categoryName || '').toLowerCase().trim();
        if (pCatName && catNameLower && (pCatName === catNameLower || pCatName === catSlugLower)) return true;
        const pCat = (p.category || '').toLowerCase().trim();
        if (pCat && catNameLower && (pCat === catNameLower || pCat === catSlugLower)) return true;
        if (cat.id === 'cat_gaming' && (pCatName.includes('gaming') || p.name.toLowerCase().includes('gaming'))) return true;
        if (
          cat.id === 'cat_fashion' &&
          (pCatName.includes('fashion') ||
            pCatName.includes('wearables') ||
            pCatName.includes('jewelry') ||
            pCatName.includes('apparel') ||
            p.categoryId === 'cat_wearables' ||
            p.categoryId === 'cat_jewelry' ||
            p.categoryId === 'cat_clothing' ||
            p.categoryId === 'cat_men' ||
            p.categoryId === 'cat_kids')
        )
          return true;
        return false;
      });

      const catalogCount = matchingCatalog.length > 0 ? matchingCatalog.length : (cat.itemCount || 0);

      return {
        id: cat.id,
        name: cat.name,
        catalogCount,
        shopCount: matchingShop.length,
      };
    });
  }, [categories, products, assignedProducts]);

  // Support conversation
  const sellerConv = startOrGetSupportConversation(
    currentSeller?.userId || (currentUser.id !== 'guest_visitor' ? currentUser.id : currentSeller?.id) || 'seller_active',
    displayShopName ? `${displayShopName} (${displaySellerName})` : displaySellerName,
    'SELLER'
  );
  const sellerMessages = messages.filter((m) => m.conversationId === sellerConv.id);

  // Floating Customer Care Chat State (Fixed on screen during scroll)
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const [floatingChatInput, setFloatingChatInput] = useState('');
  const [floatingChatImage, setFloatingChatImage] = useState<string | null>(null);
  const [floatingRealtimeMsgs, setFloatingRealtimeMsgs] = useState<any[]>([]);
  const floatingMessagesEndRef = useRef<HTMLDivElement>(null);
  const floatingFileRef = useRef<HTMLInputElement>(null);
  const floatingTextareaRef = useRef<HTMLTextAreaElement>(null);

  const sellerIdentifier =
    currentSeller?.userId ||
    (currentUser.id !== 'guest_visitor' ? currentUser.id : currentSeller?.id) ||
    'seller_active';

  // Listen to live messages for this seller from Firestore
  useEffect(() => {
    if (!sellerIdentifier || !listenToChatMessages) return;
    const unsub = listenToChatMessages(sellerIdentifier, (liveMsgs) => {
      setFloatingRealtimeMsgs(liveMsgs);
    });
    return () => unsub();
  }, [sellerIdentifier, listenToChatMessages]);

  const mergedFloatingChatMessages = React.useMemo(() => {
    const map = new Map<string, any>();
    const sellerIds = new Set<string>([
      sellerConv.id,
      sellerIdentifier,
      sellerIdentifier.replace(/^conv_/, ''),
      `conv_${sellerIdentifier.replace(/^conv_/, '')}`,
    ]);
    if (currentSeller?.id) {
      sellerIds.add(currentSeller.id);
      sellerIds.add(`conv_${currentSeller.id}`);
    }
    if (currentSeller?.userId) {
      sellerIds.add(currentSeller.userId);
      sellerIds.add(`conv_${currentSeller.userId}`);
    }

    messages
      .filter(
        (m) =>
          sellerIds.has(m.conversationId) ||
          sellerIds.has(m.senderId) ||
          ((m as any).receiverId && sellerIds.has((m as any).receiverId)) ||
          ((m as any).recipientId && sellerIds.has((m as any).recipientId))
      )
      .forEach((m) => map.set(m.id, m));
    floatingRealtimeMsgs.forEach((m) => map.set(m.id, m));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages, sellerConv.id, sellerIdentifier, currentSeller?.id, currentSeller?.userId, floatingRealtimeMsgs]);

  useEffect(() => {
    if (isFloatingChatOpen) {
      floatingMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      markConversationAsRead(sellerConv.id, 'SELLER');
    }
  }, [isFloatingChatOpen, mergedFloatingChatMessages.length, markConversationAsRead, sellerConv.id]);

  const handleSendFloatingChat = () => {
    const textToSend = floatingChatInput.trim();
    if (!textToSend && !floatingChatImage) return;

    sendMessage(sellerConv.id, textToSend, floatingChatImage || undefined, {
      senderId: sellerIdentifier,
      senderName: displayShopName ? `${displayShopName} (${displaySellerName})` : displaySellerName,
      senderRole: 'SELLER',
    });

    setFloatingChatInput('');
    setFloatingChatImage(null);
    if (floatingTextareaRef.current) {
      floatingTextareaRef.current.style.height = 'auto';
    }
  };

  const handleFloatingImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFloatingChatImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewWithdrawalRequest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(withdrawInputAmount);
    if (isNaN(num) || num <= 0) {
      setWithdrawErrorToast('Please enter a valid withdrawal amount ($).');
      setTimeout(() => setWithdrawErrorToast(null), 3500);
      return;
    }
    if (num < 10) {
      setWithdrawErrorToast('Minimum withdrawal amount is $10.00.');
      setTimeout(() => setWithdrawErrorToast(null), 3500);
      return;
    }
    if (sellerWallet.availableBalance < 10) {
      setWithdrawErrorToast('Minimum available balance required to withdraw is $10.00.');
      setTimeout(() => setWithdrawErrorToast(null), 3500);
      return;
    }
    if (num > sellerWallet.availableBalance) {
      setWithdrawErrorToast(`Insufficient balance! Requested amount ($${num.toFixed(2)}) exceeds your available balance of $${sellerWallet.availableBalance.toFixed(2)}.`);
      setTimeout(() => setWithdrawErrorToast(null), 3500);
      return;
    }

    let accountDetails = '';
    let methodFormatted = '';

    if (withdrawPaymentMethod === 'Bank') {
      if (!bankName.trim()) {
        setWithdrawErrorToast('Please enter Bank Name.');
        setTimeout(() => setWithdrawErrorToast(null), 3500);
        return;
      }
      if (!bankAccountName.trim()) {
        setWithdrawErrorToast('Please enter Bank Account Name.');
        setTimeout(() => setWithdrawErrorToast(null), 3500);
        return;
      }
      if (!bankAccountNumber.trim()) {
        setWithdrawErrorToast('Please enter Bank Account Number.');
        setTimeout(() => setWithdrawErrorToast(null), 3500);
        return;
      }
      if (!bankIfscCode.trim()) {
        setWithdrawErrorToast('Please enter IFSC Code / SWIFT code.');
        setTimeout(() => setWithdrawErrorToast(null), 3500);
        return;
      }
      accountDetails = `Bank: ${bankName.trim()} | Account Name: ${bankAccountName.trim()} | A/C: ${bankAccountNumber.trim()} | IFSC: ${bankIfscCode.trim()}`;
      methodFormatted = 'Bank Transfer';
    } else if (withdrawPaymentMethod === 'PayPal') {
      if (!paypalEmail.trim() || !paypalEmail.includes('@')) {
        setWithdrawErrorToast('Please enter a valid PayPal Email Address.');
        setTimeout(() => setWithdrawErrorToast(null), 3500);
        return;
      }
      accountDetails = `PayPal: ${paypalEmail.trim()}`;
      methodFormatted = 'PayPal';
    } else if (withdrawPaymentMethod === 'USDT') {
      if (!cryptoAddress.trim()) {
        setWithdrawErrorToast('Please enter your USDT (TRC20) wallet address.');
        setTimeout(() => setWithdrawErrorToast(null), 3500);
        return;
      }
      accountDetails = `USDT (TRC20): ${cryptoAddress.trim()}`;
      methodFormatted = 'USDT (TRC20)';
    } else if (withdrawPaymentMethod === 'Bitcoin') {
      if (!cryptoAddress.trim()) {
        setWithdrawErrorToast('Please enter your Bitcoin (BTC) wallet address.');
        setTimeout(() => setWithdrawErrorToast(null), 3500);
        return;
      }
      accountDetails = `Bitcoin (BTC): ${cryptoAddress.trim()}`;
      methodFormatted = 'Bitcoin';
    } else if (withdrawPaymentMethod === 'Ethereum') {
      if (!cryptoAddress.trim()) {
        setWithdrawErrorToast('Please enter your Ethereum (ETH) wallet address.');
        setTimeout(() => setWithdrawErrorToast(null), 3500);
        return;
      }
      accountDetails = `Ethereum (ETH): ${cryptoAddress.trim()}`;
      methodFormatted = 'Ethereum';
    }

    setWithdrawSubmitting(true);
    const result = submitWithdrawalRequest({
      sellerId: currentSeller.id,
      amount: num,
      method: methodFormatted as WithdrawalMethod,
      payoutAccount: accountDetails,
      sellerNote: withdrawNoteInput.trim() || undefined,
    });
    setWithdrawSubmitting(false);

    if (result.success) {
      setWithdrawSuccessToast(`Withdrawal request of $${num.toFixed(2)} via ${methodFormatted} submitted successfully!`);
      setWithdrawInputAmount('');
      setBankName('');
      setBankAccountName('');
      setBankAccountNumber('');
      setBankIfscCode('');
      setCryptoAddress('');
      setPayPalEmail('');
      setWithdrawNoteInput('');
      setTimeout(() => setWithdrawSuccessToast(null), 5000);
    } else {
      setWithdrawErrorToast(result.message || 'Failed to submit withdrawal request.');
      setTimeout(() => setWithdrawErrorToast(null), 4000);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount < 10 || withdrawAmount > sellerWallet.availableBalance) {
      setWithdrawFeedback('Invalid withdrawal amount. Minimum is $10.00 and must not exceed available balance.');
      return;
    }
    submitWithdrawalRequest(currentSeller.id, withdrawAmount, withdrawMethod, withdrawDetails);
    setWithdrawFeedback('✓ Withdrawal request submitted to Platform Admin for approval.');
    setTimeout(() => {
      setShowWithdrawModal(false);
      setWithdrawFeedback(null);
    }, 2000);
  };

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus, note: string) => {
    updateOrderStatus(orderId, nextStatus, note);
  };

  const handleConfirmShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingOrder) return;
    updateOrderStatus(
      trackingOrder.id,
      'ON_THE_WAY',
      `Seller dispatched package via ${carrier} (Tracking: ${trackingNumber})`
    );
    setTrackingOrder(null);
    setTrackingNumber('');
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(sellerConv.id, chatInput.trim(), undefined, {
      senderId: currentSeller.userId || currentUser.id,
      senderName: currentSeller.shopName || currentUser.name,
      senderRole: 'SELLER',
    });
    setChatInput('');
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) return;
    const cat = (settings.categories || []).find((c) => c.name === newProductCategory) || (settings.categories || [])[0];
    const newProd: Product = {
      id: `prod_seller_${Date.now()}`,
      name: newProductName,
      description: `Premium quality item provided by ${currentSeller.shopName}. Fulfillable immediately upon order assignment.`,
      price: newProductPrice,
      rating: 4.8,
      reviewCount: 12,
      images: [newProductImage],
      categoryId: cat ? cat.id : 'cat_women',
      categoryName: newProductCategory,
      stock: 45,
      sku: `SKU-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'PUBLISHED',
      associatedSellerIds: [currentSeller.id],
      customAdminCommissionPct: 8,
    };
    addProduct(newProd);
    setShowAddProductModal(false);
    setNewProductName('');
  };

  // =========================================================================
  // SELLER DASHBOARD (FULL ACCESS WITH TESTING & DIRECT ADMIN BUTTONS)
  // =========================================================================
  const shopInitials = ((displayShopName || 'Z').trim().charAt(0) || 'Z').toUpperCase();
  const totalProductsCount = assignedProducts.length;
  const totalOrdersCount = sellerOrders.length;
  // Real product sales (actual sales volume from valid non-cancelled customer/assigned orders only - NEVER manual admin adjustments)
  const validProductSalesOrders = sellerOrders.filter((o) => o.status !== 'CANCELLED');
  const totalActualSalesAmount = validProductSalesOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  );
  const totalSalesFormatted = `$${totalActualSalesAmount.toFixed(2)}`;
  const needsPickingCount = needsPickingOrders.length;

  // Store Analytics timeframe filter: 'today' | '7d' | 'all'
  const [storeAnalyticsRange, setStoreAnalyticsRange] = useState<'today' | '7d' | 'all'>('today');

  // Compute orders filtered by storeAnalyticsRange
  const analyticsOrders = useMemo(() => {
    const now = new Date();
    return validProductSalesOrders.filter((o) => {
      if (storeAnalyticsRange === 'all') return true;

      const dateStr = o.createdAt || o.updatedAt || o.assignedAt || '';
      const orderDate = new Date(dateStr);
      if (isNaN(orderDate.getTime())) return false;

      if (storeAnalyticsRange === 'today') {
        return (
          orderDate.getFullYear() === now.getFullYear() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getDate() === now.getDate()
        );
      }

      if (storeAnalyticsRange === '7d') {
        const diffMs = now.getTime() - orderDate.getTime();
        const diffDays = diffMs / (1000 * 3600 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }

      return true;
    });
  }, [validProductSalesOrders, storeAnalyticsRange]);

  // Dynamic Total Sold for selected timeframe
  const storeAnalyticsTotalSold = useMemo(() => {
    return analyticsOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [analyticsOrders]);

  // Dynamic Net Profit for selected timeframe
  const storeAnalyticsNetProfit = useMemo(() => {
    return analyticsOrders.reduce((sum, o) => {
      const profit =
        o.totalSellerEarning > 0 && o.totalSellerEarning <= o.totalAmount * 0.5
          ? o.totalSellerEarning
          : Number((o.totalAmount * 0.21).toFixed(2));
      return sum + profit;
    }, 0);
  }, [analyticsOrders]);

  // Real unread support messages for this seller from store administration
  const unreadSellerSupportCount = messages.filter(
    (m) =>
      m.conversationId === sellerConv.id &&
      m.recipientId === (currentSeller?.userId || currentUser.id) &&
      !m.isRead &&
      m.senderId !== (currentSeller?.userId || currentUser.id)
  ).length;

  if (isStoreFrozen) {
    return (
      <div className="min-h-screen bg-slate-950 py-8 px-4 flex flex-col items-center justify-center font-sans">
        <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          
          {/* Lock Icon Emblem */}
          <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl ring-4 ring-rose-500/10">
            <Lock className="w-10 h-10 animate-pulse" />
          </div>

          {/* Heading & Standard English Notification */}
          <div className="space-y-2">
            <span className="inline-block px-3.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-extrabold rounded-full uppercase tracking-wider">
              Store Frozen ⚠️
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Store Access Restricted
            </h1>
            <p className="text-sm text-slate-200 font-medium leading-relaxed">
              Your store has been frozen by Company. Please contact customer support for assistance.
            </p>
          </div>

          {/* Store Details Card */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-left text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Store Name:</span>
              <span className="font-bold text-white truncate max-w-[180px]">{displayShopName}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Merchant Name:</span>
              <span className="font-semibold text-slate-300 truncate max-w-[180px]">{displaySellerName}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-rose-400 uppercase text-[11px] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                Frozen / Locked
              </span>
            </div>
            <div className="pt-1 text-slate-300">
              <span className="text-rose-400 font-bold block mb-1">Company Notice / Reason:</span>
              <span className="text-slate-300 bg-slate-900/90 p-2.5 rounded-xl block border border-slate-800 text-xs leading-relaxed">
                {currentSeller?.rejectionReason || 'Your store has been frozen by Company. Please contact customer support for assistance.'}
              </span>
            </div>
          </div>

          {/* Customer Care / Support Block Info */}
          <div className="bg-amber-400/10 border border-amber-400/25 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Customer Care Support Desk</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Our Customer Care team is available to assist you. All store features remain locked until your account is reviewed and unfreezed.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              id="frozen-contact-support-btn"
              onClick={() => onNavigate && onNavigate('seller-support')}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Customer Support Chat</span>
            </button>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl border border-slate-700 flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logoutSeller('Logged out successfully.');
                if (onNavigate) onNavigate('home');
              }}
              className="w-full py-2 text-slate-400 hover:text-rose-300 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Switch Account</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row font-sans relative">
      
      {/* ================================================================= */}
      {/* LAPTOP / DESKTOP SIDEBAR (Full Height Sticky Sidebar on lg+) */}
      {/* ================================================================= */}
      <aside className="hidden lg:flex w-64 xl:w-72 shrink-0 flex-col bg-slate-900/95 border-r border-slate-800 p-5 shadow-2xl space-y-4 text-slate-100 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto z-30">
          {/* Seller Header inside Laptop Sidebar */}
          <div className="bg-slate-950/90 p-2.5 rounded-2xl border border-slate-800 flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="font-bold text-slate-200 truncate text-xs">
              Seller: <span className="text-white">{displayShopName}</span>
            </span>
          </div>

          {/* Store Brand & Profile Card */}
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg ring-2 ring-amber-400/20 shrink-0">
                {shopInitials}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Verified Store
                </span>
                <h3 className="font-bold text-sm text-white truncate leading-tight">
                  {displayShopName}
                </h3>
                <p className="text-xs text-slate-400 truncate">{displaySellerName}</p>
              </div>
            </div>

            {/* 7-Star Rating Display */}
            <div className="pt-2 border-t border-slate-800/80 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Store Rating:</span>
                <span className="text-amber-300 font-black">
                  {effectiveStarRating.toFixed(1)} / 7.0
                </span>
              </div>
              <div className="flex text-amber-400 gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                  <Star
                    key={num}
                    className={`w-3.5 h-3.5 ${
                      num <= effectiveStarRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Wallet Balance Summary Widget */}
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                Available Balance
              </span>
              <span className="text-base font-black text-amber-400">
                ${sellerWallet.availableBalance.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('withdraw')}
              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              Withdraw
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1 flex-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 block mb-1">
              Dashboard Navigation
            </span>

            <button
              type="button"
              onClick={() => setMobileTab('home')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mobileTab === 'home'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4" />
                <span>Overview</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mobileTab === 'products'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>My Products</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 font-mono">
                {totalProductsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('add-products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mobileTab === 'add-products'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4" />
                <span>Add Products</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mobileTab === 'orders'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4" />
                <span>Orders</span>
              </div>
              {needsPickingCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                  {needsPickingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('withdraw')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mobileTab === 'withdraw'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4" />
                <span>Wallet & Withdraw</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('seller-support');
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer text-slate-300 hover:bg-slate-800/80 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                <span>Customer Care Chat</span>
              </div>
              {unreadSellerSupportCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black">
                  {unreadSellerSupportCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileTab('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mobileTab === 'profile'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4" />
                <span>Store Profile</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowMoreDrawer(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer text-slate-300 hover:bg-slate-800/80 hover:text-white"
            >
              <div className="flex items-center gap-2.5">
                <MoreHorizontal className="w-4 h-4" />
                <span>More Settings</span>
              </div>
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() => {
                logoutSeller('Logged out successfully.');
                if (onNavigate) onNavigate('home');
              }}
              className="w-full py-2 px-3 bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile / Laptop Main Workspace Container (Full Width Fluid) */}
        <div className="w-full flex-1 min-w-0 bg-slate-950 text-slate-100 flex flex-col relative min-h-screen lg:min-h-0">
          {/* Top Workspace Header (Store Info, Verification, Live Balance & Quick Controls) */}
          <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setShowMoreDrawer(true)}
                className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl cursor-pointer shrink-0"
                title="Open Navigation Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-black text-white truncate">{displayShopName}</h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Verified Seller
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                  Merchant: <span className="text-slate-300 font-medium">{displaySellerName}</span> • Rating: <span className="text-amber-400 font-bold">{effectiveStarRating.toFixed(1)} / 7.0 ★</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-amber-400/30 text-xs">
                <span className="text-slate-400 hidden sm:inline">Balance:</span>
                <span className="font-black text-amber-400">${sellerWallet.availableBalance.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => setMobileTab('withdraw')}
                  className="ml-1 px-2 py-0.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] transition cursor-pointer"
                >
                  Withdraw
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  logoutSeller('Logged out successfully.');
                  if (onNavigate) onNavigate('home');
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>
        
          {/* Scrollable Body Content: Natural fluid scrolling on mobile, bounded workspace on desktop */}
          <div id="seller-main-scroll-container" className="flex-1 w-full pb-36 lg:pb-12" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* ================================================================= */}
          {/* SPECIAL VIEW: STORE FROZEN BY COMPANY */}
          {/* ================================================================= */}
          {isStoreFrozen ? (
            <div className="p-5 flex flex-col items-center justify-center min-h-[700px] text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center text-rose-400 shadow-xl ring-4 ring-rose-500/10">
                <Lock className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2 max-w-sm">
                <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                  Store Frozen ⚠️
                </span>
                <h2 className="text-xl font-black text-white mt-2">
                  Store Access Restricted
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed px-2">
                  Your store has been frozen by Company. Please contact customer support for assistance.
                </p>
              </div>

              <div className="w-full max-w-xs bg-slate-900/90 rounded-2xl p-4 border border-rose-900/50 shadow-xl space-y-3 text-left">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Store Name:</span>
                  <span className="font-bold text-slate-100 truncate max-w-[150px]">{displayShopName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Merchant Name:</span>
                  <span className="font-semibold text-slate-300 truncate max-w-[150px]">{displaySellerName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-extrabold text-rose-400 uppercase text-[11px]">Store Frozen</span>
                </div>
                {currentSeller?.rejectionReason && (
                  <div className="text-xs pt-1 text-slate-400">
                    <span className="text-rose-400 font-semibold block mb-0.5">Company Notice:</span>
                    <span>{currentSeller.rejectionReason}</span>
                  </div>
                )}
              </div>

              <div className="w-full max-w-xs space-y-2.5">
                <button
                  type="button"
                  id="frozen-go-support-chat-btn"
                  onClick={() => onNavigate && onNavigate('seller-support')}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Contact Customer Care</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-700 flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logoutSeller('Logged out successfully.');
                    if (onNavigate) onNavigate('home');
                  }}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            </div>
          ) : (currentSeller?.applicationStatus === 'PENDING' && sellerOrders.length === 0) ? (
            <div className="p-5 flex flex-col items-center justify-center min-h-[700px] text-center space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border-2 border-amber-400/30 flex items-center justify-center text-amber-400 shadow-xl ring-4 ring-amber-400/10">
                <Clock className="w-10 h-10 animate-pulse" />
              </div>

              <div className="space-y-2 max-w-sm">
                <span className="inline-block px-3 py-1 bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                  Awaiting Admin Approval ⏳
                </span>
                <h2 className="text-xl font-black text-white mt-2">
                  Store Application Under Review
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed px-2">
                  Aapka store registration submit ho chuka hai aur store compliance review mein hai. Store approve hone tak aap Support Chat (Chatsport) mein wait kar sakte hain.
                </p>
              </div>

              <div className="w-full max-w-xs bg-slate-900/90 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-3 text-left">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Store Name:</span>
                  <span className="font-bold text-slate-100 truncate max-w-[150px]">{displayShopName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <span className="text-slate-400">Merchant Name:</span>
                  <span className="font-semibold text-slate-300 truncate max-w-[150px]">{displaySellerName}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-extrabold text-amber-400 uppercase text-[11px]">Pending Approval</span>
                </div>
              </div>

              <div className="w-full max-w-xs space-y-2.5">
                <button
                  type="button"
                  id="pending-go-support-chat-btn"
                  onClick={() => onNavigate && onNavigate('seller-support')}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Go to Support Chat (Chatsport)</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-700 flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check Approval Status</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logoutSeller('Logged out successfully.');
                    if (onNavigate) onNavigate('home');
                  }}
                  className="w-full py-2 text-slate-400 hover:text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ================================================================= */}
              {/* TAB: HOME (EXACT REPLICA OF USER'S LONG SCREENSHOT) */}
              {/* ================================================================= */}
              {mobileTab === 'home' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              
              {/* 1. Welcome Back Red Header Card */}
              <div
                onClick={() => setMobileTab('profile')}
                className="bg-gradient-to-r from-slate-900 via-[#141e33] to-slate-900 border border-amber-400/30 text-white p-4 sm:p-5 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  {/* Round Avatar with Initial */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg ring-2 ring-amber-400/30 shrink-0">
                    {shopInitials}
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-normal block leading-tight">
                      Welcome back
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white leading-tight mt-0.5">
                      {displayShopName}
                    </h2>
                    {/* 7-Star Rating managed by Admin */}
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex text-amber-400 gap-0.5">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                          const isFilled = num <= effectiveStarRating;
                          return (
                            <Star
                              key={num}
                              className={`w-3.5 h-3.5 ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-600'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[11px] text-amber-300 font-bold ml-1">
                        ({effectiveStarRating.toFixed(1)} / 7.0)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[11px] font-bold px-3 py-1 rounded-full">
                    Active
                  </span>
                  <ChevronRight className="w-4 h-4 text-amber-400/80" />
                </div>
              </div>

              {/* 2. Top 4 Metric Cards (2x2 on mobile, 4 in a row on laptop/desktop) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Products (Amber Accent) */}
                <div
                  onClick={() => setMobileTab('products')}
                  className="bg-slate-900/90 border border-slate-800 hover:border-amber-400/40 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                >
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Total Products</span>
                    <span className="text-2xl font-black block mt-0.5 text-white">{totalProductsCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>

                {/* Total Orders (Indigo Accent) */}
                <div
                  onClick={() => setMobileTab('orders')}
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-400/40 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                >
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Total Orders</span>
                    <span className="text-2xl font-black block mt-0.5 text-white">{totalOrdersCount}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>

                {/* Guarantee Money (Emerald Accent) */}
                <div
                  onClick={() => setMobileTab('withdraw')}
                  className="bg-slate-900/90 border border-slate-800 hover:border-emerald-400/40 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                >
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Guarantee Money</span>
                    <span className="text-2xl font-black block mt-0.5 text-white">0</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>

                {/* Total Sales (Sky Accent) */}
                <div
                  onClick={() => setMobileTab('withdraw')}
                  className="bg-slate-900/90 border border-slate-800 hover:border-sky-400/40 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                >
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 block">Total Sales</span>
                    <span className="text-xl font-black block mt-0.5 text-amber-300">{totalSalesFormatted}</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </div>
              </div>

              {/* Desktop 2-Column Row: Sales Stat & Orders Status side-by-side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 3. Sales Stat Card */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-400">Sales Stat</h3>
                    <span className="text-[11px] text-slate-400">All time</span>
                  </div>

                  <div>
                    <span className="text-3xl font-black text-white block">{totalSalesFormatted}</span>
                    <span className="text-xs text-slate-400 block mt-0.5">Total product sales</span>
                  </div>

                  {/* Horizontal Status Breakdown with Guide Lines */}
                  <div className="pt-2 relative">
                    <div className="space-y-3.5 relative z-10 text-xs">
                      {/* Needs picking */}
                      <div className="flex items-center">
                        <span className="w-28 text-slate-400 text-right pr-3 font-medium leading-none">
                          Needs picking
                        </span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-3 bg-amber-400 rounded-sm w-16"></div>
                          <span className="font-bold text-white">{needsPickingCount}</span>
                        </div>
                      </div>

                      {/* On the way */}
                      <div className="flex items-center">
                        <span className="w-28 text-slate-400 text-right pr-3 font-medium leading-none">
                          On the way
                        </span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-3 bg-sky-500 rounded-sm w-8"></div>
                          <span className="font-bold text-white">{onTheWayOrders.length}</span>
                        </div>
                      </div>

                      {/* Picked */}
                      <div className="flex items-center">
                        <span className="w-28 text-slate-400 text-right pr-3 font-medium leading-none">
                          Picked
                        </span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-3 bg-amber-500 rounded-sm w-12"></div>
                          <span className="font-bold text-amber-400">{pickedUpInTransitOrders.length}</span>
                        </div>
                      </div>

                      {/* Completed */}
                      <div className="flex items-center">
                        <span className="w-28 text-slate-400 text-right pr-3 font-medium leading-none">
                          Completed
                        </span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-3 bg-emerald-500 rounded-sm w-20"></div>
                          <span className="font-bold text-emerald-400">{completedOrders.length}</span>
                        </div>
                      </div>

                      {/* Cancelled */}
                      <div className="flex items-center">
                        <span className="w-28 text-slate-400 text-right pr-3 font-medium leading-none">
                          Cancelled
                        </span>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="h-3 bg-rose-500 rounded-sm w-4"></div>
                          <span className="font-bold text-rose-400">{cancelledOrders.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Orders Status Card */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-400">Order Management</h3>
                    <button
                      type="button"
                      onClick={() => setMobileTab('orders')}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Orders</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* New Order */}
                    <div
                      onClick={() => {
                        setStatusFilter('ASSIGNED');
                        setMobileTab('orders');
                      }}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-400/40 flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-tight">New Order</span>
                        <span className="text-base font-black text-white block mt-0.5">{needsPickingCount}</span>
                      </div>
                    </div>

                    {/* Cancelled */}
                    <div
                      onClick={() => {
                        setStatusFilter('CANCELLED');
                        setMobileTab('orders');
                      }}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                        <X className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-tight">Cancelled</span>
                        <span className="text-base font-black text-white block mt-0.5">{cancelledOrders.length}</span>
                      </div>
                    </div>

                    {/* On the way */}
                    <div
                      onClick={() => {
                        setStatusFilter('ON_THE_WAY');
                        setMobileTab('orders');
                      }}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-sky-500/40 flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-tight">On the way</span>
                        <span className="text-base font-black text-white block mt-0.5">{onTheWayOrders.length}</span>
                      </div>
                    </div>

                    {/* Completed */}
                    <div
                      onClick={() => {
                        setStatusFilter('DELIVERED');
                        setMobileTab('orders');
                      }}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/40 flex items-center gap-3 cursor-pointer transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block leading-tight">Completed</span>
                        <span className="text-base font-black text-white block mt-0.5">{completedOrders.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop 3-Column Row: Category Wise, Your Plan, Reach/Revenue */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* 4. Category Wise Product Count Card */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-400">Category wise product count</h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {categoryStats.length} {categoryStats.length === 1 ? 'category' : 'categories'}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-800 text-xs max-h-[380px] overflow-y-auto pr-1">
                    {categoryStats.length === 0 ? (
                      <div className="py-6 text-center text-slate-500 text-xs">
                        No categories found.
                      </div>
                    ) : (
                      categoryStats.map((cat) => (
                        <div
                          key={cat.id}
                          className="py-2.5 flex items-center justify-between group hover:bg-slate-800/30 px-1.5 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            <span className="text-slate-300 font-medium truncate group-hover:text-slate-100 transition-colors">
                              {cat.name}
                            </span>
                            {cat.shopCount > 0 && (
                              <span className="shrink-0 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50 font-medium">
                                {cat.shopCount} in shop
                              </span>
                            )}
                          </div>
                          <span className="font-bold text-amber-400 shrink-0 tabular-nums">
                            {cat.catalogCount}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 6. Your Plan Card */}
                <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-800 bg-slate-900/90 flex flex-col justify-between">
                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span className="text-xs font-bold tracking-wide">Your Plan</span>
                    </div>
                    <span className="bg-slate-950 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  {/* Plan Content */}
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                          CURRENT PACKAGE
                        </span>
                        <h4 className="text-base font-black text-white mt-0.5">{effectivePlanName} ({effectivePlanPrice})</h4>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Unlimited product uploads</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Valid for lifetime merchant</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-2 space-y-1.5 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>Top storefront placement</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>Dedicated merchant hotline</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setShowPlanModal(true)}
                        className="w-full text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-between cursor-pointer py-1"
                      >
                        <span>View plans & benefits</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 7 & 8. Reach and Sold Summary - Store Analytics */}
                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4 text-amber-400" />
                          <span>Store Analytics</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Real-time store traffic and revenue attribution
                        </p>
                      </div>

                      {/* Timeframe Selector Pills: Today | 7D | All Time */}
                      <div className="flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-slate-800 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setStoreAnalyticsRange('today')}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            storeAnalyticsRange === 'today'
                              ? 'bg-amber-400 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoreAnalyticsRange('7d')}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            storeAnalyticsRange === '7d'
                              ? 'bg-amber-400 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          7D
                        </button>
                        <button
                          type="button"
                          onClick={() => setStoreAnalyticsRange('all')}
                          className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            storeAnalyticsRange === 'all'
                              ? 'bg-amber-400 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          All Time
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Metric Blocks */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {/* Total Sold */}
                      <div
                        onClick={() => {
                          setMobileTab('orders');
                          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                          const contentEl = document.getElementById('seller-main-scroll-container');
                          if (contentEl) contentEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                        }}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-400/40 transition-all cursor-pointer group"
                        title="Click to view store orders"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 block group-hover:text-slate-300">Total Sold</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {analyticsOrders.length} ord{analyticsOrders.length === 1 ? '' : 's'}
                          </span>
                        </div>
                        <span className="text-lg font-black text-amber-400 block mt-0.5 tracking-tight">
                          ${storeAnalyticsTotalSold.toFixed(2)}
                        </span>
                      </div>

                      {/* Net Profit */}
                      <div
                        onClick={() => {
                          setMobileTab('withdraw');
                          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                          const contentEl = document.getElementById('seller-main-scroll-container');
                          if (contentEl) contentEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                        }}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-emerald-400/40 transition-all cursor-pointer group"
                        title="Click to view wallet balance and payouts"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 block group-hover:text-slate-300">Net Profit</span>
                          <span className="text-[10px] text-emerald-400/80 font-mono">
                            {storeAnalyticsTotalSold > 0
                              ? `${((storeAnalyticsNetProfit / storeAnalyticsTotalSold) * 100).toFixed(0)}%`
                              : '0%'}
                          </span>
                        </div>
                        <span className="text-lg font-black text-emerald-400 block mt-0.5 tracking-tight">
                          ${storeAnalyticsNetProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Quick Hint if 0 today but has all-time sales */}
                    {storeAnalyticsRange === 'today' && storeAnalyticsTotalSold === 0 && totalActualSalesAmount > 0 && (
                      <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                        <span>No new orders today.</span>
                        <button
                          type="button"
                          onClick={() => setStoreAnalyticsRange('all')}
                          className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                        >
                          View All Time (${totalActualSalesAmount.toFixed(2)})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Open Wallet & Payouts button */}
                  <div className="pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      id="seller-open-wallet-payouts-btn"
                      onClick={() => {
                        setMobileTab('withdraw');
                        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                        const contentEl = document.getElementById('seller-main-scroll-container');
                        if (contentEl) {
                          contentEl.scrollTo({ top: 0, left: 0, behavior: 'instant' });
                        }
                      }}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 active:scale-[0.99] text-slate-200 hover:text-white border border-slate-700 hover:border-amber-400/50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <DollarSign className="w-4 h-4 text-amber-400" />
                      <span>Open Wallet & Payouts</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 9. Quick Actions Section */}
              <div className="pt-2 space-y-3">
                <div>
                  <h3 className="text-base font-black text-white leading-tight">Quick Actions</h3>
                  <div className="w-10 h-0.5 bg-amber-400 rounded-full mt-1"></div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Action 1: Add Products */}
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSearch('');
                      setCatalogHideAdded(false);
                      setCatalogSelectedIds([]);
                      setMobileTab('add-products');
                    }}
                    className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-amber-400/40 shadow-lg flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all text-center cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400/15 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">Add Products</span>
                  </button>

                  {/* Action 2: View Orders */}
                  <button
                    type="button"
                    onClick={() => setMobileTab('orders')}
                    className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-amber-400/40 shadow-lg flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all text-center cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">View Orders</span>
                  </button>

                  {/* Action 3: Shop Settings */}
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-amber-400/40 shadow-lg flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all text-center cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">Shop Settings</span>
                  </button>

                  {/* Action 4: My Profile */}
                  <button
                    type="button"
                    onClick={() => setMobileTab('profile')}
                    className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 hover:border-amber-400/40 shadow-lg flex flex-col items-center justify-center gap-2.5 active:scale-95 transition-all text-center cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">My Profile</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: PRODUCTS (MATCHING EXACT USER SCREENSHOT) */}
          {/* ================================================================= */}
          {mobileTab === 'products' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 font-sans">
              <div>
                <h1 className="text-xl font-black text-slate-900 leading-tight">Products</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {assignedProducts.length} {assignedProducts.length === 1 ? 'product' : 'products'} in your shop
                </p>
              </div>

              {/* Big Red + Add products button */}
              <button
                type="button"
                onClick={() => {
                  setCatalogSearch('');
                  setCatalogHideAdded(false);
                  setCatalogSelectedIds([]);
                  setMobileTab('add-products');
                }}
                className="w-full py-3 bg-[#EE4932] hover:bg-[#d83a24] active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Add products</span>
              </button>

              {/* Search your products input */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="Search your products"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE4932] shadow-xs"
                />
              </div>

              {/* Max price filter */}
              <div className="w-36">
                <div className="relative">
                  <span className="text-xs text-slate-500 font-semibold absolute left-3 top-1/2 -translate-y-1/2">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={productMaxPrice}
                    onChange={(e) => setProductMaxPrice(e.target.value)}
                    placeholder="Max price"
                    className="w-full pl-6 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE4932] shadow-xs"
                  />
                </div>
              </div>

              {/* Filter Pills */}
              {(() => {
                const shopProductsList = assignedProducts;
                return (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setProductFilterTab('ALL')}
                      className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        productFilterTab === 'ALL'
                          ? 'bg-[#EE4932] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>All</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          productFilterTab === 'ALL' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {shopProductsList.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductFilterTab('ACTIVE')}
                      className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        productFilterTab === 'ACTIVE'
                          ? 'bg-[#EE4932] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>Active</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          productFilterTab === 'ACTIVE' ? 'bg-white/30 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {shopProductsList.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductFilterTab('PENDING')}
                      className={`px-3.5 py-1.5 rounded-full font-bold transition-colors cursor-pointer ${
                        productFilterTab === 'PENDING'
                          ? 'bg-[#EE4932] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>Pending</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProductFilterTab('INACTIVE')}
                      className={`px-3.5 py-1.5 rounded-full font-bold transition-colors cursor-pointer ${
                        productFilterTab === 'INACTIVE'
                          ? 'bg-[#EE4932] text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>Inactive</span>
                    </button>
                  </div>
                );
              })()}

              {/* 2-Column Product Grid */}
              {(() => {
                if (assignedProducts.length === 0) {
                  return (
                    <div className="py-12 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-red-50 text-[#EE4932] flex items-center justify-center mx-auto">
                        <Package className="w-6 h-6 stroke-[2]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-slate-900">No active products in your shop</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto">
                          Your new store currently has 0 active products. Browse the Master Catalog to list products into your shop.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogSearch('');
                          setCatalogHideAdded(false);
                          setCatalogSelectedIds([]);
                          setMobileTab('add-products');
                        }}
                        className="px-4 py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all active:scale-98"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Browse Master Catalog</span>
                      </button>
                    </div>
                  );
                }

                const shopProductsList = assignedProducts;
                const filtered = shopProductsList.filter((p) => {
                  if (productSearchQuery.trim()) {
                    const q = productSearchQuery.toLowerCase();
                    if (!p.name.toLowerCase().includes(q) && !p.categoryName?.toLowerCase().includes(q)) {
                      return false;
                    }
                  }
                  if (productMaxPrice.trim() && !isNaN(Number(productMaxPrice))) {
                    if (p.price > Number(productMaxPrice)) return false;
                  }
                  if (productFilterTab === 'ACTIVE') return true;
                  if (productFilterTab === 'PENDING') return false;
                  if (productFilterTab === 'INACTIVE') return false;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      No products found matching your search or filters.
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 pt-1">
                    {filtered.map((p) => {
                      const estimatedProfit = (p.price * 0.21).toFixed(2);
                      return (
                        <div
                          key={p.id}
                          className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden flex flex-col justify-between relative group hover:border-slate-200 transition-all"
                        >
                          {/* Active Green Badge in Top-Left */}
                          <span className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-[#E6F9EE] text-[#10B981] font-bold text-[10px] rounded-md shadow-xs">
                            Active
                          </span>

                          {/* Product Image */}
                          <div className="w-full aspect-square bg-[#F8F9FA] flex items-center justify-center overflow-hidden p-2">
                            <img
                              src={p.images[0]}
                              alt={p.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          {/* Details */}
                          <div className="p-3 pt-1.5 space-y-2">
                            <h3 className="font-bold text-slate-900 text-xs line-clamp-2 min-h-[32px] leading-snug">
                              {p.name}
                            </h3>

                            <div className="flex items-center justify-between pt-0.5">
                              <span className="font-black text-slate-900 text-sm">
                                ${p.price.toFixed(2)}
                              </span>
                              <span className="font-bold text-[#10B981] text-xs">
                                +${estimatedProfit}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: ADD PRODUCTS (EXACT MATCH TO USER SCREENSHOT) */}
          {/* ================================================================= */}
          {mobileTab === 'add-products' && (
            <div className="p-4 space-y-3 font-sans pb-10">
              {/* Top Navigation Bar: Back Arrow + "Add products" + "Add Selected (N)" */}
              <div className="flex items-center justify-between gap-2 pt-1 pb-1">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogSelectedIds([]);
                      setMobileTab('products');
                    }}
                    className="p-1.5 -ml-1 text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer"
                    title="Back to products"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
                  </button>
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">Add products</h1>
                </div>

                <button
                  type="button"
                  disabled={catalogSelectedIds.length === 0}
                  onClick={() => {
                    if (catalogSelectedIds.length > 0 && currentSeller) {
                      addProductsToSeller(catalogSelectedIds, currentSeller.id);
                      setCatalogSelectedIds([]);
                      setMobileTab('products');
                    }
                  }}
                  className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shadow-xs flex items-center gap-1.5 ${
                    catalogSelectedIds.length > 0
                      ? 'bg-[#EE4932] hover:bg-[#d83a24] text-white cursor-pointer active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Add Selected</span>
                  {catalogSelectedIds.length > 0 && (
                    <span className="bg-white/25 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                      {catalogSelectedIds.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Search Products Input Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EE4932] shadow-xs"
                />
              </div>

              {/* Filter / Toggle Bar: "Hide added products" checkbox + Select All button */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                {/* Hide added products Checkbox */}
                <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={catalogHideAdded}
                    onChange={(e) => setCatalogHideAdded(e.target.checked)}
                    className="w-4 h-4 text-[#EE4932] border-slate-300 rounded focus:ring-[#EE4932] accent-[#EE4932] cursor-pointer"
                  />
                  <span>Hide added products</span>
                </label>

                {/* Select All / Deselect All Toggle Button */}
                {(() => {
                  const availableToSelect = products.filter((p) => {
                    const isAlreadyAdded = isProductAssociatedWithCurrentSeller(p);
                    if (catalogHideAdded && isAlreadyAdded) return false;
                    if (catalogSearch.trim()) {
                      const q = catalogSearch.toLowerCase();
                      const matchName = p.name.toLowerCase().includes(q);
                      const matchCategory = p.categoryName?.toLowerCase().includes(q);
                      if (!matchName && !matchCategory) return false;
                    }
                    return !isAlreadyAdded;
                  });

                  const isAllSelected =
                    availableToSelect.length > 0 &&
                    availableToSelect.every((p) => catalogSelectedIds.includes(p.id));

                  return (
                    <button
                      type="button"
                      disabled={availableToSelect.length === 0}
                      onClick={() => {
                        if (isAllSelected) {
                          setCatalogSelectedIds([]);
                        } else {
                          setCatalogSelectedIds(availableToSelect.map((p) => p.id));
                        }
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isAllSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  );
                })()}
              </div>

              {/* Product Cards List (Matching the user's reference image) */}
              <div className="space-y-2.5 pt-1">
                {(() => {
                  const filteredProducts = products.filter((p) => {
                    const isAlreadyAdded = isProductAssociatedWithCurrentSeller(p);
                    if (catalogHideAdded && isAlreadyAdded) return false;
                    if (catalogSearch.trim()) {
                      const q = catalogSearch.toLowerCase();
                      const matchName = p.name.toLowerCase().includes(q);
                      const matchCategory = p.categoryName?.toLowerCase().includes(q);
                      if (!matchName && !matchCategory) return false;
                    }
                    return true;
                  });

                  if (filteredProducts.length === 0) {
                    return (
                      <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                        No products found matching your search.
                      </div>
                    );
                  }

                  return filteredProducts.map((p) => {
                    const isAlreadyAdded = isProductAssociatedWithCurrentSeller(p);
                    const isChecked = catalogSelectedIds.includes(p.id);
                    const estimatedProfit = (p.price * 0.21).toFixed(2);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isAlreadyAdded) return;
                          setCatalogSelectedIds((prev) =>
                            prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                          );
                        }}
                        className={`bg-white rounded-2xl p-3 border transition-all flex items-center justify-between gap-3 shadow-xs ${
                          isAlreadyAdded
                            ? 'border-slate-100 bg-slate-50/50 cursor-default'
                            : isChecked
                            ? 'border-[#EE4932] ring-1 ring-[#EE4932] cursor-pointer'
                            : 'border-slate-200/90 hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        {/* Left: Product Image + Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                            alt={p.name}
                            className="w-14 h-14 rounded-xl object-contain bg-[#F8F9FA] border border-slate-100 shrink-0 p-1"
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-xs text-slate-900 line-clamp-1">
                              {p.name}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-extrabold text-sm text-slate-900">
                                ${p.price.toFixed(2)}
                              </span>
                              <span className="text-xs font-semibold text-[#10B981]">
                                +${estimatedProfit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: State Checkbox OR "Added" Badge */}
                        <div className="shrink-0 flex items-center justify-center pl-2">
                          {isAlreadyAdded ? (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 font-semibold text-[11px] rounded-lg border border-slate-200">
                              Added
                            </span>
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                                isChecked
                                  ? 'bg-[#EE4932] border-[#EE4932] text-white'
                                  : 'border-slate-300 bg-white hover:border-slate-400'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          {/* ================================================================= */}
          {/* TAB: ORDERS */}
          {/* ================================================================= */}
          {mobileTab === 'orders' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Toast Notification */}
              {pickupSuccessToast && (
                <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span>{pickupSuccessToast}</span>
                  </div>
                  <button
                    onClick={() => setPickupSuccessToast(null)}
                    className="text-white/80 hover:text-white text-xs px-2 py-0.5"
                  >
                    ✕
                  </button>
                </div>
              )}

              {pickupErrorToast && (
                <div className="p-3.5 bg-rose-600 text-white rounded-2xl shadow-lg text-xs font-bold flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />
                    <span>{pickupErrorToast}</span>
                  </div>
                  <button
                    onClick={() => setPickupErrorToast(null)}
                    className="text-white/80 hover:text-white text-xs px-2 py-0.5 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Header section with Title, Count & Refresh */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMoreDrawer(true)}
                    className="p-2.5 bg-[#EE4932] text-white rounded-xl shadow-xs hover:bg-[#d83a24] transition-colors cursor-pointer"
                    title="Menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Orders</h1>
                    <p className="text-xs text-slate-500 font-medium">
                      {sellerOrders.length} {sellerOrders.length === 1 ? 'order' : 'orders'} in total
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshOrders}
                  disabled={refreshingOrders}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-60"
                >
                  <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${refreshingOrders ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Filter Pills Bar */}
              <div className="flex gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                <button
                  onClick={() => setOrderFilterTab('ALL')}
                  className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${
                    orderFilterTab === 'ALL'
                      ? 'bg-[#EE4932] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All {countAll}
                </button>
                <button
                  onClick={() => setOrderFilterTab('NEEDS_ACTION')}
                  className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${
                    orderFilterTab === 'NEEDS_ACTION'
                      ? 'bg-[#EE4932] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Needs action {countNeedsAction}
                </button>
                <button
                  onClick={() => setOrderFilterTab('IN_PROGRESS')}
                  className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${
                    orderFilterTab === 'IN_PROGRESS'
                      ? 'bg-[#EE4932] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  In progress {countInProgress}
                </button>
                <button
                  onClick={() => setOrderFilterTab('COMPLETED')}
                  className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${
                    orderFilterTab === 'COMPLETED'
                      ? 'bg-[#EE4932] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Completed {countCompleted}
                </button>
                <button
                  onClick={() => setOrderFilterTab('CANCELLED')}
                  className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${
                    orderFilterTab === 'CANCELLED'
                      ? 'bg-[#EE4932] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Cancelled {countCancelled > 0 ? countCancelled : ''}
                </button>
                <button
                  onClick={() => setOrderFilterTab('ASSIGNED_TO_ME')}
                  className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${
                    orderFilterTab === 'ASSIGNED_TO_ME'
                      ? 'bg-[#EE4932] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Assigned to me {countAssigned}
                </button>
                <button
                  onClick={() => setOrderFilterTab('DIRECT')}
                  className={`px-3.5 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer ${
                    orderFilterTab === 'DIRECT'
                      ? 'bg-[#EE4932] text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Direct {countDirect}
                </button>
              </div>

              {/* No Orders Empty State */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-slate-100 text-center space-y-3 shadow-xs">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Package className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">No orders in this status</h3>
                    <p className="text-xs text-slate-400 mt-1">Assigned customer orders and direct dispatches will appear here.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* ========================================================= */}
                  {/* 1. DESKTOP / WIDE SCREEN VIEW (Image 1 Format) */}
                  {/* ========================================================= */}
                  <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            <th className="py-3.5 px-4 font-semibold">ORDER</th>
                            <th className="py-3.5 px-4 font-semibold">DATE</th>
                            <th className="py-3.5 px-4 font-semibold">CUSTOMER</th>
                            <th className="py-3.5 px-4 font-semibold">AMOUNT</th>
                            <th className="py-3.5 px-4 font-semibold">PROFIT</th>
                            <th className="py-3.5 px-4 font-semibold">STATUS</th>
                            <th className="py-3.5 px-4 font-semibold">SOURCE</th>
                            <th className="py-3.5 px-4 font-semibold text-right">ACTION</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredOrders.map((order) => {
                            const profit = order.totalSellerEarning > 0 && order.totalSellerEarning <= order.totalAmount * 0.5
                              ? order.totalSellerEarning
                              : Number((order.totalAmount * 0.21).toFixed(2));
                            const isPending = order.status === 'PENDING' || order.status === 'ASSIGNED';
                            const isPicked = order.status === 'PICKED_BY_SELLER';
                            const isCompleted = order.status === 'DELIVERED';
                            const isInProgress = order.status === 'PROCESSING' || order.status === 'ON_THE_WAY' || order.status === 'ACCEPTED';

                            return (
                              <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-4 px-4 font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                                  {order.id}
                                </td>
                                <td className="py-4 px-4 text-slate-600 whitespace-nowrap font-medium">
                                  {formatOrderDateTime(order.createdAt)}
                                </td>
                                <td className="py-4 px-4 text-slate-700 font-medium whitespace-nowrap">
                                  {order.customerName || 'Anonymous'}
                                </td>
                                <td className="py-4 px-4 font-bold text-slate-900 whitespace-nowrap">
                                  ${order.totalAmount.toFixed(2)}
                                </td>
                                <td className="py-4 px-4 font-bold text-emerald-600 whitespace-nowrap">
                                  ${profit.toFixed(2)}
                                </td>
                                <td className="py-4 px-4 whitespace-nowrap">
                                  {isPending && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] inline-block">
                                      Pending
                                    </span>
                                  )}
                                  {isPicked && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-block">
                                      Picked by Seller
                                    </span>
                                  )}
                                  {isInProgress && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 inline-block">
                                      In Progress
                                    </span>
                                  )}
                                  {isCompleted && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 inline-block">
                                      Delivered
                                    </span>
                                  )}
                                  {order.status === 'CANCELLED' && (
                                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 inline-block">
                                      Cancelled
                                    </span>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">
                                  {order.source || 'Direct'}
                                </td>
                                <td className="py-4 px-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderDetails(order)}
                                      className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:underline font-bold text-xs cursor-pointer"
                                    >
                                      Details
                                    </button>
                                    {isPending && (
                                      <button
                                        type="button"
                                        onClick={() => initiatePickup(order)}
                                        className="px-4 py-1.5 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                      >
                                        Pick up
                                      </button>
                                    )}
                                    {(isPicked || isInProgress) && (
                                      <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap">
                                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                                        <span>{order.status === 'ON_THE_WAY' ? 'On The Way' : 'Processing'}</span>
                                      </span>
                                    )}
                                    {isCompleted && (
                                      <span className="text-xs font-bold text-emerald-600 px-2 py-1 flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* 2. MOBILE VIEW (Image 2 Format) */}
                  {/* ========================================================= */}
                  <div className="block md:hidden space-y-3">
                    {filteredOrders.map((order) => {
                      const profit = order.totalSellerEarning > 0 && order.totalSellerEarning <= order.totalAmount * 0.5
                        ? order.totalSellerEarning
                        : Number((order.totalAmount * 0.21).toFixed(2));
                      const isPending = order.status === 'PENDING' || order.status === 'ASSIGNED';
                      const isPicked = order.status === 'PICKED_BY_SELLER';
                      const isCompleted = order.status === 'DELIVERED';
                      const isInProgress = order.status === 'PROCESSING' || order.status === 'ON_THE_WAY' || order.status === 'ACCEPTED';

                      return (
                        <div
                          key={order.id}
                          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs space-y-2.5"
                        >
                          {/* Top line: Order ID and Status badge */}
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm font-bold text-slate-900 tracking-tight">
                              {order.id}
                            </span>
                            {isPending && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#D97706]">
                                Pending
                              </span>
                            )}
                            {isPicked && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Picked by Seller
                              </span>
                            )}
                            {isInProgress && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700">
                                In Progress
                              </span>
                            )}
                            {isCompleted && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                                Delivered
                              </span>
                            )}
                            {order.status === 'CANCELLED' && (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700">
                                Cancelled
                              </span>
                            )}
                          </div>

                          {/* Line 2: Customer Name and Date */}
                          <div className="text-xs text-slate-500 font-medium">
                            {order.customerName || 'Anonymous'} · {formatOrderDateTime(order.createdAt)}
                          </div>

                          {/* Line 3: Amount and Profit */}
                          <div className="flex items-baseline gap-2 pt-0.5">
                            <span className="font-black text-slate-900 text-lg">
                              ${order.totalAmount.toFixed(2)}
                            </span>
                            <span className="font-bold text-emerald-600 text-xs">
                              +${profit.toFixed(2)} profit
                            </span>
                          </div>

                          {/* Separator line & Bottom line */}
                          <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-medium">
                              {order.source ? `${order.source} order` : 'Direct order'}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderDetails(order)}
                                className="px-2 py-1 text-slate-600 hover:text-slate-900 font-bold text-xs cursor-pointer"
                              >
                                Details
                              </button>
                              {isPending && (
                                <button
                                  type="button"
                                  onClick={() => initiatePickup(order)}
                                  className="px-4 py-1.5 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                >
                                  Pick up
                                </button>
                              )}
                              {(isPicked || isInProgress) && (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 whitespace-nowrap">
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  <span>{order.status === 'ON_THE_WAY' ? 'On The Way' : 'Processing'}</span>
                                </span>
                              )}
                              {isCompleted && (
                                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Credited
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: MORE / SETTINGS / WALLET */}
          {/* ================================================================= */}
          {mobileTab === 'more' && (
            <div className="p-4 space-y-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#EE4932]/10 text-[#EE4932] flex items-center justify-center font-bold text-lg">
                  {shopInitials}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{displayShopName}</h3>
                  <p className="text-xs text-slate-500">{currentSeller.email || currentUser.email}</p>
                  <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold mt-1">
                    Verified Merchant
                  </span>
                </div>
              </div>

              {/* Wallet Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Available Payout Balance</span>
                  <Wallet className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-white">
                    ${sellerWallet.availableBalance.toFixed(2)}
                  </span>
                  <button
                    onClick={() => setMobileTab('withdraw')}
                    className="px-3 py-1.5 bg-[#EE4932] hover:bg-[#d83a24] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Menu list */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs divide-y divide-slate-100 text-xs">
                <button
                  onClick={openSettingsModal}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Shop & Contact Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => setShowPlanModal(true)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Award className="w-4 h-4 text-[#EE4932]" />
                    <span>Subscription Plan ({effectivePlanName})</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('seller-support')}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 font-medium text-slate-700 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-indigo-500" />
                    <span>Customer Care & Admin Desk</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    logoutSeller('Seller logged out successfully.');
                    if (onNavigate) onNavigate('home');
                  }}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 font-medium text-red-600 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Logout Seller</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: MONEY WITHDRAW / WALLET (EXACT MATCH OF USER'S SCREENSHOT) */}
          {/* ================================================================= */}
          {mobileTab === 'withdraw' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 font-sans animate-in fade-in duration-200">
              {/* 1. Header with Menu Icon, Title & Subtitle */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Wallet</h1>
                  <p className="text-xs text-slate-500 mt-0.5">Manage your store balance and request payouts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMoreDrawer(true)}
                  className="p-2 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  title="Open Navigation Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </div>

              {/* Toast Feedbacks */}
              {withdrawSuccessToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 shadow-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{withdrawSuccessToast}</span>
                </div>
              )}
              {withdrawErrorToast && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2 shadow-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{withdrawErrorToast}</span>
                </div>
              )}

              {/* Withdraw Money Header Tab Indicator */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <div className="w-full py-2 text-xs font-bold rounded-lg bg-white text-[#EE4932] shadow-xs text-center flex items-center justify-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-[#EE4932]" />
                  <span>Withdraw Money</span>
                </div>
              </div>

              {/* 2. Top Metric Cards: AVAILABLE and PENDING AMOUNT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Card 1: AVAILABLE (Exact from screenshot) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    AVAILABLE
                  </div>
                  <div className="text-3xl font-black text-[#0FA958] tracking-tight">
                    ${sellerWallet.availableBalance.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Ready for immediate payout
                  </div>
                </div>

                {/* Card 2: PENDING AMOUNT / IN TRANSIT (User requested: wo amount ho gi jo order pick he but deliver nhi huwa) */}
                <div className="bg-white rounded-2xl p-4 border border-amber-200/90 shadow-2xs space-y-1 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>PENDING / IN TRANSIT</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                      {pickedUpInTransitOrders.length} order(s)
                    </span>
                  </div>
                  <div className="text-3xl font-black text-amber-600 tracking-tight">
                    +${displayPendingAmount.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Total pending amount (Order cost + profit combined). Unlocks upon customer delivery.
                  </div>
                </div>
              </div>

              {/* 3. New request Card (Exact Form from screenshot) */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs space-y-4">
                <div className="text-sm font-bold text-slate-900">
                  New request
                </div>

                <form onSubmit={handleNewWithdrawalRequest} className="space-y-4">
                  {/* Amount to Withdraw ($) */}
                  <div className="space-y-1.5">
                    <div className="relative border border-slate-300 rounded-xl p-2.5 focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all bg-white">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-slate-600 block leading-tight">
                          Amount to Withdraw ($) *
                        </label>
                        <span className="text-[11px] font-bold text-slate-700">
                          Balance: <strong className="text-emerald-600 font-extrabold">${sellerWallet.availableBalance.toFixed(2)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-base font-bold text-slate-400 mr-1">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="10"
                          max={sellerWallet.availableBalance}
                          value={withdrawInputAmount}
                          onChange={(e) => setWithdrawInputAmount(e.target.value)}
                          placeholder="10.00"
                          className="w-full text-base font-bold text-slate-900 outline-none bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Balance Warnings / Info */}
                    {sellerWallet.availableBalance < 10 ? (
                      <div className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Available balance is ${sellerWallet.availableBalance.toFixed(2)}. Minimum withdrawal required is $10.00.</span>
                      </div>
                    ) : withdrawInputAmount && parseFloat(withdrawInputAmount) < 10 ? (
                      <div className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Minimum withdrawal is $10.00. Please enter $10.00 or more.</span>
                      </div>
                    ) : withdrawInputAmount && parseFloat(withdrawInputAmount) > sellerWallet.availableBalance ? (
                      <div className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Amount exceeds available balance (${sellerWallet.availableBalance.toFixed(2)}). Please enter a valid amount.</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 flex items-center justify-between">
                        <span>You can request up to ${sellerWallet.availableBalance.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-slate-600">Min: $10.00</span>
                      </div>
                    )}

                    {/* Quick Chips ($10, $50, $100, $500, Max) */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {[10, 50, 100, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          disabled={amt > sellerWallet.availableBalance}
                          onClick={() => setWithdrawInputAmount(amt.toString())}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            amt > sellerWallet.availableBalance
                              ? 'opacity-40 bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={sellerWallet.availableBalance < 10}
                        onClick={() => setWithdrawInputAmount(sellerWallet.availableBalance.toString())}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                          sellerWallet.availableBalance < 10
                            ? 'opacity-40 border border-slate-300 text-slate-400 cursor-not-allowed'
                            : 'text-[#EE4932] border border-[#EE4932] hover:bg-[#FFF1F0]'
                        }`}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* PAYMENT METHOD Grid (Exact 1:1 match of user screenshot) */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      PAYMENT METHOD
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {paymentMethodsList.map((m) => {
                        const isSelected = withdrawPaymentMethod === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setWithdrawPaymentMethod(m.id)}
                            className={`py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[66px] ${
                              isSelected
                                ? 'border-[#EE4932] bg-[#FFF5F4] text-[#EE4932] shadow-2xs'
                                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                            }`}
                          >
                            <span className={`text-sm font-bold leading-tight ${isSelected ? 'text-[#EE4932]' : 'text-slate-900'}`}>
                              {m.name}
                            </span>
                            <span className={`text-xs mt-0.5 leading-tight ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                              {m.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* DYNAMIC FORM BOXES ACCORDING TO SELECTED PAYMENT METHOD */}
                  {withdrawPaymentMethod === 'Bank' && (
                    <div className="space-y-3 pt-1">
                      {/* Bank Name * */}
                      <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="Bank Name *"
                          className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent"
                        />
                      </div>

                      {/* Bank Account Name * */}
                      <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                        <input
                          type="text"
                          required
                          value={bankAccountName}
                          onChange={(e) => setBankAccountName(e.target.value)}
                          placeholder="Bank Account Name *"
                          className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent"
                        />
                      </div>

                      {/* Bank Account Number * */}
                      <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                        <input
                          type="text"
                          required
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="Bank Account Number *"
                          className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent"
                        />
                      </div>

                      {/* IFSC Code * */}
                      <div>
                        <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                          <input
                            type="text"
                            required
                            value={bankIfscCode}
                            onChange={(e) => setBankIfscCode(e.target.value)}
                            placeholder="IFSC Code *"
                            className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent"
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 pl-1">
                          Bank routing or SWIFT/BIC code
                        </div>
                      </div>

                      {/* Note (Optional) */}
                      <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                        <textarea
                          rows={3}
                          value={withdrawNoteInput}
                          onChange={(e) => setWithdrawNoteInput(e.target.value)}
                          placeholder="Note (Optional)"
                          className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {withdrawPaymentMethod === 'USDT' && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                          <input
                            type="text"
                            required
                            value={cryptoAddress}
                            onChange={(e) => setCryptoAddress(e.target.value)}
                            placeholder="USDT (TRC20) Wallet Address *"
                            className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent"
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 pl-1">
                          Only TRC20 network USDT addresses are supported (Starts with T...)
                        </div>
                      </div>

                      {/* Note (Optional) */}
                      <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                        <textarea
                          rows={3}
                          value={withdrawNoteInput}
                          onChange={(e) => setWithdrawNoteInput(e.target.value)}
                          placeholder="Note (Optional)"
                          className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {withdrawPaymentMethod === 'Bitcoin' && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                          <input
                            type="text"
                            required
                            value={cryptoAddress}
                            onChange={(e) => setCryptoAddress(e.target.value)}
                            placeholder="Bitcoin (BTC) Wallet Address *"
                            className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent"
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 pl-1">
                          BTC network wallet address (Starts with 1, 3, or bc1...)
                        </div>
                      </div>

                      {/* Note (Optional) */}
                      <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                        <textarea
                          rows={3}
                          value={withdrawNoteInput}
                          onChange={(e) => setWithdrawNoteInput(e.target.value)}
                          placeholder="Note (Optional)"
                          className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {withdrawPaymentMethod === 'Ethereum' && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                          <input
                            type="text"
                            required
                            value={cryptoAddress}
                            onChange={(e) => setCryptoAddress(e.target.value)}
                            placeholder="Ethereum (ETH) Wallet Address *"
                            className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent"
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 pl-1">
                          ERC-20 / EVM network address (Starts with 0x...)
                        </div>
                      </div>

                      {/* Note (Optional) */}
                      <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                        <textarea
                          rows={3}
                          value={withdrawNoteInput}
                          onChange={(e) => setWithdrawNoteInput(e.target.value)}
                          placeholder="Note (Optional)"
                          className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {withdrawPaymentMethod === 'PayPal' && (
                    <div className="space-y-3 pt-1">
                      <div>
                        <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                          <input
                            type="email"
                            required
                            value={paypalEmail}
                            onChange={(e) => setPayPalEmail(e.target.value)}
                            placeholder="PayPal Email Address *"
                            className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent"
                          />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 pl-1">
                          Payout will be sent to your registered PayPal email account
                        </div>
                      </div>

                      {/* Note (Optional) */}
                      <div className="border border-slate-300 rounded-xl px-4 py-3 bg-white focus-within:border-[#EE4932] focus-within:ring-1 focus-within:ring-[#EE4932] transition-all">
                        <textarea
                          rows={3}
                          value={withdrawNoteInput}
                          onChange={(e) => setWithdrawNoteInput(e.target.value)}
                          placeholder="Note (Optional)"
                          className="w-full text-sm font-medium text-slate-800 placeholder:text-slate-500 outline-none bg-transparent resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* REQUEST WITHDRAWAL Button */}
                  <button
                    type="submit"
                    disabled={
                      withdrawSubmitting ||
                      !withdrawInputAmount ||
                      parseFloat(withdrawInputAmount) < 10 ||
                      parseFloat(withdrawInputAmount) > sellerWallet.availableBalance ||
                      sellerWallet.availableBalance < 10
                    }
                    className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      withdrawInputAmount &&
                      parseFloat(withdrawInputAmount) >= 10 &&
                      parseFloat(withdrawInputAmount) <= sellerWallet.availableBalance &&
                      sellerWallet.availableBalance >= 10
                        ? 'bg-[#EE4932] hover:bg-[#d83a24] text-white active:scale-[0.99]'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Landmark className="w-4 h-4" />
                    <span>{withdrawSubmitting ? 'Submitting...' : 'REQUEST WITHDRAWAL'}</span>
                  </button>
                </form>
              </div>

              {/* 4. Past requests Card (Exact from screenshot) */}
              <div className="bg-white rounded-2xl p-4.5 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Past requests</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setRefreshingWithdrawals(true);
                      setTimeout(() => setRefreshingWithdrawals(false), 600);
                    }}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${refreshingWithdrawals ? 'animate-spin text-[#EE4932]' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                {sellerWithdrawals.length === 0 ? (
                  /* Empty State matching user screenshot */
                  <div className="py-8 px-4 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                      <Landmark className="w-6 h-6 stroke-[1.8]" />
                    </div>
                    <div className="text-sm font-bold text-slate-900">
                      No withdrawals yet
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      Your requests will appear here once you make one. Complete orders to build up a balance you can withdraw.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRefreshingWithdrawals(true);
                          setTimeout(() => setRefreshingWithdrawals(false), 600);
                        }}
                        className="px-4 py-2 border border-[#EE4932] text-[#EE4932] hover:bg-[#FFF1F0] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        REFRESH HISTORY
                      </button>
                    </div>
                  </div>
                ) : (
                  /* List / Table of withdrawals if available */
                  <div className="divide-y divide-slate-100">
                    {sellerWithdrawals.map((w) => (
                      <div key={w.id} className="py-3.5 space-y-2 text-xs">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{w.method}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  w.status === 'APPROVED' || w.status === 'PAID'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : w.status === 'REJECTED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {w.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {w.id} • {new Date(w.requestedAt).toLocaleString()}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-sm font-black text-slate-900 block">
                              ${w.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Payout Account Box */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 space-y-1">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Payout Account
                          </div>
                          <div className="text-[11px] font-semibold text-slate-800 font-mono break-all select-all">
                            {w.payoutAccount}
                          </div>

                          {w.sellerNote && (
                            <div className="text-[10px] text-slate-500 pt-0.5">
                              <span className="font-semibold">Your Note: </span>
                              <span className="italic">{w.sellerNote}</span>
                            </div>
                          )}

                          {w.status === 'REJECTED' && w.adminNote && (
                            <div className="text-[11px] text-rose-700 bg-rose-50/80 border border-rose-200/70 rounded-lg p-1.5 mt-1">
                              <span className="font-bold">Rejection Reason: </span>
                              <span>{w.adminNote}</span>
                            </div>
                          )}

                          {(w.status === 'PAID' || w.status === 'APPROVED') && w.adminNote && (
                            <div className="text-[11px] text-emerald-700 bg-emerald-50/80 border border-emerald-200/70 rounded-lg p-1.5 mt-1">
                              <span className="font-bold">Disbursement Note: </span>
                              <span className="font-mono">{w.adminNote}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB: MANAGE PROFILE (MATCHING USER SCREENSHOT + SAVE BUTTON) */}
          {/* ================================================================= */}
          {mobileTab === 'profile' && (
            <div className="p-4 sm:p-6 lg:p-8 space-y-6 font-sans animate-in fade-in duration-150">
              {/* Top Title Header */}
              <div className="flex items-center justify-between pt-1 pb-0.5">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manage Profile</h1>
                <button
                  type="button"
                  onClick={() => setShowMoreDrawer(true)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200/90 hover:bg-slate-50 flex items-center justify-center text-slate-700 transition-colors cursor-pointer shadow-2xs"
                  title="Open Menu"
                >
                  <Menu className="w-5 h-5 stroke-[2.2]" />
                </button>
              </div>

              {/* Success Notification Banner if profile is saved */}
              {profileSaveToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{profileSaveToast}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProfileSaveToast(null)}
                    className="text-emerald-700 hover:text-emerald-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* 1. TOP PROFILE SUMMARY CARD */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
                <div className="flex items-center gap-3.5">
                  {/* Round Coral Avatar with Camera Badge */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 rounded-full bg-[#FFEAE8] text-[#EE4932] font-black text-2xl flex items-center justify-center shadow-inner">
                      {((profileName || 'Z').trim().charAt(0) || 'Z').toUpperCase()}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditProfileModalName(profileName);
                        setEditProfileModalPhone(profilePhone);
                        setShowEditProfileModal(true);
                      }}
                      className="w-5 h-5 rounded-full bg-[#EE4932] hover:bg-[#d83a24] text-white flex items-center justify-center border-2 border-white absolute bottom-0 right-0 shadow-xs cursor-pointer transition-colors"
                      title="Update avatar"
                    >
                      <Camera className="w-3 h-3 text-white" />
                    </button>
                  </div>

                  {/* Name + Red Stars Rating */}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-slate-900 truncate">
                      {profileName || 'Zahid'}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex text-[#EE4932] gap-0.5">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                          const isFilled = num <= effectiveStarRating;
                          return (
                            <Star
                              key={num}
                              className={`w-3.5 h-3.5 ${
                                isFilled
                                  ? 'fill-[#EE4932] text-[#EE4932]'
                                  : 'text-slate-200'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-xs text-slate-500 font-bold ml-0.5">
                        ({effectiveStarRating.toFixed(1)} / 7.0)
                      </span>
                    </div>
                  </div>
                </div>

                {/* EDIT PROFILE Outline Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditProfileModalName(profileName);
                      setEditProfileModalPhone(profilePhone);
                      setShowEditProfileModal(true);
                    }}
                    className="px-4 py-1.5 border border-[#EE4932] text-[#EE4932] hover:bg-[#EE4932]/5 active:scale-98 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                    <span>EDIT PROFILE</span>
                  </button>
                </div>
              </div>

              {/* 2. PERSONAL INFORMATION CARD */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-[#EE4932]">Personal information</h3>

                {/* Your Name Box */}
                <div>
                  <div className="relative border border-slate-300 focus-within:border-[#EE4932] rounded-xl px-3.5 pt-2 pb-2.5 bg-white transition-colors">
                    <label className="text-[11px] font-medium text-slate-500 block mb-0.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Zahid"
                      className="w-full text-slate-900 font-semibold text-sm bg-transparent outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-1 font-normal">
                    Optional: Enter your full name
                  </p>
                </div>

                {/* Your Phone Box */}
                <div>
                  <div className="relative border border-slate-300 focus-within:border-[#EE4932] rounded-xl px-3.5 pt-2 pb-2.5 bg-white transition-colors">
                    <label className="text-[11px] font-medium text-slate-500 block mb-0.5">
                      Your Phone
                    </label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+912323232323"
                      className="w-full text-slate-900 font-semibold text-sm bg-transparent outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 pl-1 font-normal">
                    Optional: Enter your contact number
                  </p>
                </div>
              </div>

              {/* 3. EMAIL ADDRESS CARD (Permanent, no change button) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-[#EE4932]">Email address</h3>
                  <p className="text-xs font-semibold text-slate-900 mt-1 truncate">
                    {currentSeller?.email || currentUser.email || profileEmail}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[11px] font-medium flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Permanent</span>
                </span>
              </div>

              {/* 4. PASSWORD CARD */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[#EE4932]">Password</h3>
                  <p className="text-sm font-black text-slate-900 mt-0.5 tracking-widest leading-none">
                    ••••••••
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                    setChangePasswordError(null);
                    setShowChangePasswordModal(true);
                  }}
                  className="px-3.5 py-1.5 border border-[#EE4932] text-[#EE4932] hover:bg-[#EE4932]/5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 active:scale-98"
                >
                  CHANGE
                </button>
              </div>

              {/* 5. PAYMENT METHODS CARD */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[#EE4932]">Payment methods</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select your preferred payment methods</p>
                </div>

                {/* Payment Options */}
                <div className="space-y-2.5">
                  {/* Cash Payment */}
                  <div
                    onClick={() => setProfileCashPayment(!profileCashPayment)}
                    className={`rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all border ${
                      profileCashPayment
                        ? 'border-[#F87171] bg-[#FFF5F5]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[#EE4932] font-black text-base w-5 text-center leading-none">
                        $
                      </span>
                      <span className="font-bold text-slate-900 text-xs">Cash Payment</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        profileCashPayment
                          ? 'bg-[#EE4932] text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {profileCashPayment && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* Bank Payment */}
                  <div
                    onClick={() => setProfileBankPayment(!profileBankPayment)}
                    className={`rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all border ${
                      profileBankPayment
                        ? 'border-[#F87171] bg-[#FFF5F5]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Landmark className="w-4 h-4 text-[#EE4932]" />
                      <span className="font-bold text-slate-900 text-xs">Bank Payment</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        profileBankPayment
                          ? 'bg-[#EE4932] text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {profileBankPayment && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* USDT Payment */}
                  <div
                    onClick={() => setProfileUsdtPayment(!profileUsdtPayment)}
                    className={`rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all border ${
                      profileUsdtPayment
                        ? 'border-[#F87171] bg-[#FFF5F5]'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Coins className="w-4 h-4 text-slate-600" />
                      <span className="font-medium text-slate-700 text-xs">USDT Payment</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                        profileUsdtPayment
                          ? 'bg-[#EE4932] text-white'
                          : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {profileUsdtPayment && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                </div>

                {/* Bank details sub-section */}
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Bank details</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Fill all bank details if you want to enable bank payments
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Bank Name */}
                    <div>
                      <input
                        type="text"
                        placeholder="Bank Name"
                        value={profileBankName}
                        onChange={(e) => setProfileBankName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-[#EE4932] focus:ring-1 focus:ring-[#EE4932] outline-none bg-white transition-colors"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 pl-1 font-normal">
                        Enter your bank name
                      </p>
                    </div>

                    {/* Bank Account Name */}
                    <div>
                      <input
                        type="text"
                        placeholder="Bank Account Name"
                        value={profileBankAccountName}
                        onChange={(e) => setProfileBankAccountName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-[#EE4932] focus:ring-1 focus:ring-[#EE4932] outline-none bg-white transition-colors"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 pl-1 font-normal">
                        Enter the name on your bank account
                      </p>
                    </div>

                    {/* Bank Account Number */}
                    <div>
                      <input
                        type="text"
                        placeholder="Bank Account Number"
                        value={profileBankAccountNumber}
                        onChange={(e) => setProfileBankAccountNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-[#EE4932] focus:ring-1 focus:ring-[#EE4932] outline-none bg-white transition-colors"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 pl-1 font-normal">
                        Enter your bank account number
                      </p>
                    </div>

                    {/* IFSC Code */}
                    <div>
                      <input
                        type="text"
                        placeholder="IFSC Code"
                        value={profileIfscCode}
                        onChange={(e) => setProfileIfscCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-800 font-medium placeholder:text-slate-400 focus:border-[#EE4932] focus:ring-1 focus:ring-[#EE4932] outline-none bg-white transition-colors"
                      />
                      <p className="text-[10px] text-slate-400 mt-1 pl-1 font-normal">
                        Enter your bank's IFSC code
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. SAVE BUTTON AT BOTTOM (REQUESTED BY USER) */}
              <div className="pt-2 pb-6">
                <button
                  type="button"
                  id="save-profile-btn"
                  onClick={handleSaveProfile}
                  className="w-full py-3.5 bg-[#EE4932] hover:bg-[#d83a24] active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

    </div>

        {/* =================================================================== */}
        {/* 3. PERSISTENT MOBILE BOTTOM NAVIGATION BAR (FIXED AT BOTTOM OF SCREEN AT ALL TIMES) */}
        {/* =================================================================== */}
        <nav
          id="seller-bottom-navigation-bar"
          className="lg:hidden fixed bottom-0 left-0 w-full z-[1000] bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-2xl font-sans"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: '100%',
            zIndex: 1000,
          }}
        >
          <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around w-full pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {/* 1. Home Tab */}
            <button
              id="seller-tab-home"
              type="button"
              onClick={() => setMobileTab('home')}
              className={`flex flex-col items-center justify-center gap-0.5 py-0.5 px-3 font-semibold text-[11px] cursor-pointer transition-colors ${
                mobileTab === 'home' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-5 h-5 stroke-[2.2]" />
              <span>Home</span>
            </button>

            {/* 2. Products Tab */}
            <button
              id="seller-tab-products"
              type="button"
              onClick={() => setMobileTab('products')}
              className={`flex flex-col items-center justify-center gap-0.5 py-0.5 px-3 font-medium text-[11px] cursor-pointer transition-colors ${
                mobileTab === 'products' || mobileTab === 'add-products' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-5 h-5 stroke-[1.9]" />
              <span>Products</span>
            </button>

            {/* 3. Orders Tab */}
            <button
              id="seller-tab-orders"
              type="button"
              onClick={() => setMobileTab('orders')}
              className={`flex flex-col items-center justify-center gap-0.5 py-0.5 px-3 font-medium text-[11px] cursor-pointer transition-colors relative ${
                mobileTab === 'orders' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Receipt className="w-5 h-5 stroke-[1.9]" />
                {needsPickingCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                    {needsPickingCount}
                  </span>
                )}
              </div>
              <span>Orders</span>
            </button>

            {/* 4. Support Tab */}
            <button
              id="seller-tab-support"
              type="button"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('seller-support');
                }
              }}
              className="flex flex-col items-center justify-center gap-0.5 py-0.5 px-3 font-medium text-[11px] cursor-pointer transition-colors text-slate-400 hover:text-amber-400 relative"
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5 stroke-[1.9]" />
                {unreadSellerSupportCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                    {unreadSellerSupportCount}
                  </span>
                )}
              </div>
              <span>Support</span>
            </button>

            {/* 5. More Tab */}
            <button
              id="seller-tab-more"
              type="button"
              onClick={() => setShowMoreDrawer(true)}
              className={`flex flex-col items-center justify-center gap-0.5 py-0.5 px-3 font-medium text-[11px] cursor-pointer transition-colors ${
                showMoreDrawer || mobileTab === 'more' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MoreHorizontal className="w-5 h-5 stroke-[1.9]" />
              <span>More</span>
            </button>
          </div>
        </nav>

      </div>

      {/* ===================================================================== */}
      {/* MORE SIDE-DRAWER MENU (EXACT MATCH OF USER SCREENSHOT) */}
      {/* ===================================================================== */}
      {showMoreDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Dark Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowMoreDrawer(false)}
          />

          {/* Left Slide-in Drawer Container */}
          <div className="fixed inset-y-0 left-0 max-w-[85%] w-72 sm:w-80 bg-slate-900 text-slate-100 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200 border-r border-slate-800">
            
            {/* Top Content Area */}
            <div>
              {/* 1. Header Bar: Avatar + Shop Name + Dark Mode Toggle + Close (X) */}
              <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar with Amber Gradient */}
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-lg">
                      {shopInitials}
                    </div>
                    {/* Green Online Indicator Badge */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950"></span>
                  </div>

                  {/* Shop Name */}
                  <span className="font-bold text-white text-sm truncate max-w-[130px]">
                    {displayShopName}
                  </span>
                </div>

                {/* Header Action Buttons: Moon & Close */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Close Button (X) */}
                  <button
                    type="button"
                    onClick={() => setShowMoreDrawer(false)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2.2]" />
                  </button>
                </div>
              </div>

              {/* Seller & Storefront Navigation inside Mobile Drawer */}
              <div className="mx-3 mt-3 p-2.5 bg-slate-950/90 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                  <span className="font-bold text-slate-200 truncate text-xs">
                    Seller: <span className="text-white">{displayShopName}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    if (onNavigate) onNavigate('home');
                  }}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg flex items-center gap-1 transition-colors text-xs cursor-pointer border border-slate-700 shrink-0"
                  title="Go to Customer Storefront"
                >
                  <Home className="w-3.5 h-3.5 text-amber-400" />
                  <span>Store</span>
                </button>
              </div>

              {/* Install App notification banner if clicked */}
              {installAppNotice && (
                <div className="mx-3 mt-2 p-2 bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 text-[11px] rounded-xl font-medium text-center animate-in fade-in">
                  {installAppNotice}
                </div>
              )}

              {/* 2. OVERVIEW SECTION */}
              <div className="pt-3 pb-1">
                <div className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  OVERVIEW
                </div>

                {/* Dashboard */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab('home');
                    setShowMoreDrawer(false);
                  }}
                  className={`w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                    mobileTab === 'home'
                      ? 'bg-amber-400/15 text-amber-300 font-bold border-l-4 border-amber-400'
                      : 'text-slate-300 hover:bg-slate-800/80 font-medium'
                  }`}
                >
                  <Home className={`w-4 h-4 ${mobileTab === 'home' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs">Dashboard</span>
                </button>

                {/* Products */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab('products');
                    setShowMoreDrawer(false);
                  }}
                  className={`w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer transition-all ${
                    mobileTab === 'products'
                      ? 'bg-amber-400/15 text-amber-300 font-bold border-l-4 border-amber-400'
                      : 'text-slate-300 hover:bg-slate-800/80 font-medium'
                  }`}
                >
                  <Archive className="w-4 h-4 text-slate-400" />
                  <span className="text-xs">Products</span>
                </button>
              </div>

              {/* 3. SALES SECTION */}
              <div className="pt-3 pb-1">
                <div className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  SALES
                </div>

                {/* Orders (With Red 1 Badge + Expandable Chevron) */}
                <div>
                  <button
                    type="button"
                    onClick={() => setOrdersDrawerAccordionOpen(!ordersDrawerAccordionOpen)}
                    className="w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer text-slate-200 hover:bg-slate-800/80 font-medium transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <ShoppingCart className="w-4 h-4 text-amber-400" />
                        {needsPickingCount > 0 && (
                          <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-amber-400 text-slate-950 text-[8px] font-bold flex items-center justify-center shadow-xs">
                            {needsPickingCount}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-white">Orders</span>
                    </div>

                    {ordersDrawerAccordionOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {/* Submenu Items */}
                  {ordersDrawerAccordionOpen && (
                    <div className="pl-11 pr-4 py-1 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('ALL');
                          setMobileTab('orders');
                          setShowMoreDrawer(false);
                        }}
                        className="w-full text-left py-1.5 text-xs text-slate-300 hover:text-amber-400 font-medium transition-colors cursor-pointer"
                      >
                        All Orders
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('PENDING');
                          setMobileTab('orders');
                          setShowMoreDrawer(false);
                        }}
                        className="w-full text-left py-1.5 text-xs text-slate-300 hover:text-amber-400 font-medium transition-colors cursor-pointer"
                      >
                        Direct Orders
                      </button>
                    </div>
                  )}
                </div>

                {/* Wallet & Withdrawals */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab('withdraw');
                    setShowMoreDrawer(false);
                  }}
                  className={`w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer font-medium transition-all ${
                    mobileTab === 'withdraw'
                      ? 'bg-amber-400/15 text-amber-300 font-bold border-l-4 border-amber-400'
                      : 'text-slate-200 hover:bg-slate-800/80'
                  }`}
                >
                  <Wallet className={`w-4 h-4 ${mobileTab === 'withdraw' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs">Wallet & Balance</span>
                </button>
              </div>

              {/* 4. ACCOUNT SECTION */}
              <div className="pt-3 pb-1">
                <div className="px-4 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ACCOUNT
                </div>

                {/* Customer Support */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    if (onNavigate) onNavigate('seller-support');
                  }}
                  className="w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer text-slate-200 hover:bg-slate-800/80 font-medium transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                    <span className="text-xs">Customer Support</span>
                  </div>
                  {unreadSellerSupportCount > 0 && (
                    <span className="min-w-4 h-4 px-1 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black flex items-center justify-center shadow-xs">
                      {unreadSellerSupportCount}
                    </span>
                  )}
                </button>

                {/* Manage Profile */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    setMobileTab('profile');
                  }}
                  className="w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer text-slate-200 hover:bg-slate-800/80 font-medium transition-all"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-xs">Manage Profile</span>
                </button>

                {/* Shop Setting */}
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    setMobileTab('profile');
                  }}
                  className="w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer text-slate-200 hover:bg-slate-800/80 font-medium transition-all"
                >
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span className="text-xs">Shop Setting</span>
                </button>

                {/* Install App */}
                <button
                  type="button"
                  onClick={() => {
                    setInstallAppNotice('✓ App is installed and ready on your home screen!');
                    setTimeout(() => setInstallAppNotice(null), 3000);
                  }}
                  className="w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center gap-3 cursor-pointer text-slate-200 hover:bg-slate-800/80 font-medium transition-all"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  <span className="text-xs">Install App</span>
                </button>
              </div>
            </div>

            {/* Bottom Area: Logout Card + Navigation Tip */}
            <div className="p-3 pt-2">
              {/* Logout Button Card */}
              <button
                type="button"
                onClick={() => {
                  logoutSeller('Seller logged out successfully.');
                  setShowMoreDrawer(false);
                  if (onNavigate) onNavigate('home');
                }}
                className="w-full p-3 border border-slate-800 bg-slate-950 rounded-2xl flex items-center gap-3 text-slate-300 hover:bg-rose-950/30 hover:border-rose-800/40 hover:text-rose-300 cursor-pointer transition-all shadow-xs"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold">Logout</span>
              </button>

              {/* Subtitle helper text */}
              <p className="text-center text-[10px] text-slate-400 mt-3 mb-1">
                Use the menu above to navigate
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS */}
      {/* ===================================================================== */}

      {/* 1. ADMIN MASTER CATALOG BROWSER & LISTING MODAL */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowAddProductModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 z-10 space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#EE4932]" />
                  <span>Master Catalog</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select and list verified products into your store
                </p>
              </div>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Notice Banner */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2.5 text-xs text-blue-800 shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                All catalog items are verified and supplied. Click <strong>&quot;List to Shop&quot;</strong> to activate items in your store.
              </span>
            </div>

            {/* Search */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={newProductName}
                onChange={(e) => setNewProductName(e.target.value)}
                placeholder="Search catalog products by name or category..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EE4932] focus:bg-white"
              />
            </div>

            {/* Products List from Admin Catalog */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
              {products
                .filter((p) => {
                  if (!newProductName.trim()) return true;
                  const q = newProductName.toLowerCase();
                  return p.name.toLowerCase().includes(q) || p.categoryName?.toLowerCase().includes(q);
                })
                .map((p) => {
                  const targetSellerId = currentSeller?.id || currentSeller?.userId || '';
                  const isListed = isProductAssociatedWithCurrentSeller(p);
                  const commission = ((p.price * 0.15)).toFixed(2);

                  return (
                    <div
                      key={p.id}
                      className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{p.name}</h4>
                          <p className="text-[11px] text-slate-500">{p.categoryName || 'General'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-black text-xs text-[#EE4932]">${p.price.toFixed(2)}</span>
                            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                              +${commission} profit
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSellerProductEligibility(p.id, targetSellerId)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs ${
                          isListed
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-[#EE4932] hover:bg-[#d83a24] text-white'
                        }`}
                      >
                        {isListed ? (
                          <>
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>Listed</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>List to Shop</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAddProductModal(false);
                  setNewProductName('');
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PLANS & UPGRADE MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowPlanModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 z-10 space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#EE4932]" />
                <span>Subscription Plans</span>
              </h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{effectivePlanName}</span>
                <span className="text-xs font-bold text-[#EE4932]">{effectivePlanPrice}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                {effectivePlanMessage}
              </p>
            </div>

            <button
              onClick={() => {
                setShowPlanModal(false);
                if (onNavigate) {
                  onNavigate('seller-support');
                }
              }}
              className="w-full py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{effectivePlanButtonText}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. SHOP SETTINGS / PROFILE MODAL (EDIT & SAVE SHOP NAME) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowSettingsModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 z-10 space-y-4 border border-slate-100 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#EE4932]" />
                <span>Shop Profile & Settings</span>
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {settingsSavedMessage && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-center animate-in fade-in">
                {settingsSavedMessage}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const cleanedShop = editShopName
                  .replace(/\(Platform\s*Admin\)/gi, '')
                  .replace(/\(Admin\)/gi, '')
                  .trim() || 'Zahid Traders';
                const cleanedSeller = editSellerName
                  .replace(/\(Platform\s*Admin\)/gi, '')
                  .replace(/\(Admin\)/gi, '')
                  .trim() || 'Merchant';

                updateSellerProfile(currentSeller.id, {
                  shopName: cleanedShop,
                  sellerName: cleanedSeller,
                  phone: editPhone.trim(),
                });
                setSettingsSavedMessage('✓ Shop name and profile saved successfully!');
                setTimeout(() => {
                  setShowSettingsModal(false);
                  setSettingsSavedMessage(null);
                }, 1200);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Shop / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#EE4932] outline-none"
                  placeholder="e.g. Zahid Traders"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Ye name aapke mobile dashboard aur customer orders per show hoga.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Merchant / Owner Name
                </label>
                <input
                  type="text"
                  value={editSellerName}
                  onChange={(e) => setEditSellerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#EE4932] outline-none font-medium"
                  placeholder="e.g. Alex Carter"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium select-none">
                  {currentSeller.email || currentUser.email}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#EE4932] outline-none font-medium"
                  placeholder="+92 300 1234567"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. WITHDRAWAL REQUEST MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setShowWithdrawModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 z-10 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Request Payout</span>
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs">
              <span className="text-emerald-900 font-medium">Available:</span>
              <span className="font-black text-emerald-700 text-sm">
                ${sellerWallet.availableBalance.toFixed(2)}
              </span>
            </div>

            {withdrawFeedback && (
              <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 font-semibold">
                {withdrawFeedback}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount ($) * (Min: $10.00)</label>
                <input
                  type="number"
                  min="10"
                  step="0.01"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#EE4932]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payout Method *</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value as WithdrawalMethod)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#EE4932] bg-white"
                >
                  <option value="USDT (TRC20)">USDT (TRC20)</option>
                  <option value="BANK_TRANSFER">Bank Wire / ACH</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="EASYPAISA">Easypaisa / Mobile Wallet</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {withdrawMethod === 'USDT (TRC20)' ? 'USDT (TRC20) Wallet Address *' : 'Account Details / IBAN *'}
                </label>
                <input
                  type="text"
                  required
                  value={withdrawDetails}
                  onChange={(e) => setWithdrawDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#EE4932]"
                  placeholder={withdrawMethod === 'USDT (TRC20)' ? 'TRC20 Wallet Address (Starts with T...)' : 'e.g. PK36UNIL01090002345678'}
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. COURIER TRACKING MODAL */}
      {trackingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setTrackingOrder(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-5 z-10 space-y-3 text-xs">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span>Add Courier Tracking</span>
            </h3>

            <form onSubmit={handleConfirmShipment} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="FedEx Express">FedEx Express</option>
                  <option value="DHL Worldwide">DHL Worldwide</option>
                  <option value="UPS Ground">UPS Ground</option>
                  <option value="TCS Express">TCS Express</option>
                  <option value="Local Courier Dispatch">Local Courier Dispatch</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tracking Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRK-9840291448"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTrackingOrder(null)}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Confirm Shipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. PICK UP ORDER CONFIRMATION MODAL */}
      {pickupOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setPickupOrderModal(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 z-10 space-y-4 border border-slate-100 text-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Admin Direct Order
                </span>
                <h3 className="text-sm font-black text-slate-900 font-mono">
                  {pickupOrderModal.id}
                </h3>
              </div>
              <button
                onClick={() => setPickupOrderModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Order Highlight Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Customer:</span>
                <span className="font-bold text-slate-800">
                  {pickupOrderModal.customerName || 'Anonymous'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Order Date:</span>
                <span className="font-semibold text-slate-700">
                  {formatOrderDateTime(pickupOrderModal.createdAt)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-700 font-bold">Order Value:</span>
                <span className="font-black text-slate-900 text-sm">
                  ${pickupOrderModal.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                <span className="text-emerald-800 font-bold">Guaranteed Profit (21%):</span>
                <span className="font-black text-emerald-600 text-sm">
                  +${(pickupOrderModal.totalSellerEarning > 0 && pickupOrderModal.totalSellerEarning <= pickupOrderModal.totalAmount * 0.5 ? pickupOrderModal.totalSellerEarning : pickupOrderModal.totalAmount * 0.21).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Products in this order */}
            <div>
              <span className="font-bold text-slate-700 mb-2 block">Order Items:</span>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {pickupOrderModal.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate text-[11px]">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-800 text-xs">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insufficient Balance warning inside modal if applicable */}
            {sellerWallet.availableBalance < pickupOrderModal.totalAmount && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1 text-rose-800">
                <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Insufficient Balance (${sellerWallet.availableBalance.toFixed(2)} available)</span>
                </div>
                <p className="text-[11px] text-rose-600 leading-tight">
                  This order requires <strong>${pickupOrderModal.totalAmount.toFixed(2)}</strong>. You need <strong>${(pickupOrderModal.totalAmount - sellerWallet.availableBalance).toFixed(2)}</strong> more in your wallet to pick up and fulfill this order.
                </p>
              </div>
            )}

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setPickupOrderModal(null)}
                className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              {sellerWallet.availableBalance < pickupOrderModal.totalAmount ? (
                <button
                  type="button"
                  onClick={() => {
                    const order = pickupOrderModal;
                    const shortfall = order.totalAmount - sellerWallet.availableBalance;
                    setPickupOrderModal(null);
                    setInsufficientBalanceModal({
                      order,
                      required: order.totalAmount,
                      available: sellerWallet.availableBalance,
                      shortfall,
                    });
                  }}
                  className="w-2/3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Insufficient Balance</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConfirmPickup(pickupOrderModal)}
                  className="w-2/3 py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Pick Up</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7b. DEDICATED INSUFFICIENT BALANCE NOTIFICATION MODAL POPUP */}
      {insufficientBalanceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setInsufficientBalanceModal(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 z-10 space-y-4 border border-rose-100 text-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                </div>
                <span>Insufficient Wallet Balance</span>
              </div>
              <button
                onClick={() => setInsufficientBalanceModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-rose-50/80 border border-rose-200/80 rounded-2xl p-4 space-y-3">
              <p className="text-slate-700 text-xs font-semibold leading-relaxed">
                Order <strong>#{insufficientBalanceModal.order.id}</strong> cannot be picked up because your wallet balance does not cover the required fulfillment cost.
              </p>

              <div className="pt-2 border-t border-rose-200/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Order Fulfillment Cost:</span>
                  <span className="font-bold text-slate-900">${insufficientBalanceModal.required.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Your Available Balance:</span>
                  <span className="font-bold text-slate-800">${insufficientBalanceModal.available.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 font-bold">
                  <span className="text-rose-700">Required Deposit / Shortfall:</span>
                  <span className="text-rose-700 text-sm font-black">-${insufficientBalanceModal.shortfall.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 text-[11px] text-slate-600 space-y-1 border border-slate-100">
              <span className="font-bold text-slate-800 block">How to pick up this order?</span>
              <p className="text-slate-500 leading-relaxed">
                Please add funds to your seller wallet or contact the Admin Desk to deposit the shortfall amount. Once credited, you can pick up and dispatch this order.
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setInsufficientBalanceModal(null)}
                className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Got It
              </button>
              <button
                type="button"
                onClick={() => {
                  setInsufficientBalanceModal(null);
                  if (onNavigate) {
                    onNavigate('seller-support');
                  } else {
                    setMobileTab('withdraw');
                  }
                }}
                className="w-1/2 py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl font-bold shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Desk</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSelectedOrderDetails(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-5 z-10 space-y-4 border border-slate-100 text-xs animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                  Order Details
                </span>
                <h3 className="text-sm font-black text-slate-900 font-mono">
                  {selectedOrderDetails.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Customer</span>
                <p className="font-bold text-slate-800">{selectedOrderDetails.customerName || 'Anonymous'}</p>
                <p className="text-[11px] text-slate-500">{selectedOrderDetails.customerPhone || 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Status & Source</span>
                <p className="font-bold text-slate-800">{selectedOrderDetails.source || 'Direct'}</p>
                <p className="text-[11px] font-bold text-amber-600 capitalize">
                  {(selectedOrderDetails.status || '').toLowerCase().replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div>
              <span className="font-bold text-slate-700 mb-2 block">Products in Order</span>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedOrderDetails.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-lg object-cover bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 truncate text-xs">{item.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 text-xs">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Total Amount:</span>
                <span className="font-bold text-white">${selectedOrderDetails.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-400 font-bold border-t border-slate-800 pt-1.5">
                <span>Estimated Merchant Profit:</span>
                <span>
                  +${(selectedOrderDetails.totalSellerEarning > 0 && selectedOrderDetails.totalSellerEarning <= selectedOrderDetails.totalAmount * 0.5 ? selectedOrderDetails.totalSellerEarning : selectedOrderDetails.totalAmount * 0.21).toFixed(2)} (21%)
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
              {(selectedOrderDetails.status === 'PENDING' || selectedOrderDetails.status === 'ASSIGNED') && (
                sellerWallet.availableBalance < selectedOrderDetails.totalAmount ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleConfirmPickup(selectedOrderDetails);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Insufficient Balance</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      handleConfirmPickup(selectedOrderDetails);
                    }}
                    className="px-4 py-2 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    Pick up Order
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 11. MODAL: EDIT PROFILE MODAL */}
      {/* =================================================================== */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#EE4932]" />
                <span>Edit Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmEditProfile} className="space-y-3.5 text-xs">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-[#FFEAE8] text-[#EE4932] font-black text-2xl flex items-center justify-center shadow-inner">
                    {(((editProfileModalName || profileName || 'Z') as string).trim().charAt(0) || 'Z').toUpperCase()}
                  </div>
                  <div className="w-6 h-6 rounded-full bg-[#EE4932] text-white flex items-center justify-center border-2 border-white absolute bottom-0 right-0 shadow-xs">
                    <Camera className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={editProfileModalName}
                  onChange={(e) => setEditProfileModalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-[#EE4932] outline-none"
                  placeholder="e.g. Zahid"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Phone Number</label>
                <input
                  type="text"
                  required
                  value={editProfileModalPhone}
                  onChange={(e) => setEditProfileModalPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-[#EE4932] outline-none"
                  placeholder="e.g. +912323232323"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 12. MODAL: CHANGE EMAIL MODAL */}
      {/* =================================================================== */}
      {showChangeEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#EE4932]" />
                <span>Change Email Address</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowChangeEmailModal(false)}
                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changeEmailError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {changeEmailError}
              </div>
            )}

            <form onSubmit={handleConfirmChangeEmail} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-[#EE4932] outline-none"
                  placeholder="e.g. Zahid962@gmail.com"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangeEmailModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 13. MODAL: CHANGE PASSWORD MODAL */}
      {/* =================================================================== */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#EE4932]" />
                <span>Change Password</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {changePasswordError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl">
                {changePasswordError}
              </div>
            )}

            <form onSubmit={handleConfirmChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPasswordInput}
                  onChange={(e) => setCurrentPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-[#EE4932] outline-none"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-[#EE4932] outline-none"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => setConfirmPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-[#EE4932] outline-none"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
