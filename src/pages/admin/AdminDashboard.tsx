import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Menu,
  Home,
  ArrowLeft,
  Package,
  ShoppingBag,
  ShoppingCart,
  Landmark,
  MessageSquare,
  Headphones,
  Store,
  Users,
  UserCheck,
  PlusCircle,
  RefreshCw,
  Eye,
  Check,
  X,
  Plus,
  Minus,
  GripVertical,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Search,
  DollarSign,
  TrendingUp,
  Settings,
  Send,
  Lock,
  ArrowUpRight,
  Shield,
  Layers,
  Phone,
  Mail,
  MapPin,
  Calendar,
  LogOut,
  AlertCircle,
  EyeOff,
  CheckCheck,
  Clock,
  Sparkles,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Wallet,
  CreditCard,
  FileText,
  CheckCircle,
  ShieldCheck,
  FileCheck,
  ZoomIn,
  Volume2,
  VolumeX,
  KeyRound,
  Key,
  Star,
  AlertTriangle,
  Maximize2,
  Image as ImageIcon,
  Award,
} from 'lucide-react';
import {
  DEFAULT_ADMIN_EMAIL,
} from '../../services/adminAuth';
import {
  getFirestorePermissionStatus,
} from '../../services/firebaseKyc';
import {
  playNotificationBeep,
  testNotificationBeep,
  isSoundEnabled,
  setSoundEnabled,
} from '../../utils/audioAlert';
import { StatusBadge } from '../../components/common/Badge';
import { StoreMainPageManager } from '../../components/admin/StoreMainPageManager';
import { StoreContactsManager } from '../../components/admin/StoreContactsManager';
import { SellerLoginSessionsView } from '../../components/admin/SellerLoginSessionsView';
import { SubscriptionPlanManager } from '../../components/admin/SubscriptionPlanManager';
import {
  Product,
  Order,
  OrderStatus,
  SellerProfile,
  WithdrawalRequest,
  ProductStatus,
  Conversation,
} from '../../types';

interface AdminDashboardProps {
  onNavigate?: (view: string) => void;
}

type AdminTab =
  | 'dashboard'
  | 'products'
  | 'sellers-products'
  | 'store-main-page'
  | 'store-contacts'
  | 'orders'
  | 'withdrawals'
  | 'conversations'
  | 'seller-profiles'
  | 'customer-profiles'
  | 'seller-logins'
  | 'add-money'
  | 'subscriptions';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const {
    currentUser,
    users,
    products,
    categories,
    sellers,
    orders,
    wallets,
    withdrawals,
    settings,
    conversations,
    messages,
    addProduct,
    updateProduct,
    deleteProduct,
    assignOrderToSeller,
    updateOrderStatus,
    deleteOrder,
    cart,
    cartSubtotal,
    cartCount,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    createOrder,
    approveSellerApplication,
    rejectSellerApplication,
    freezeSellerApplication,
    unfreezeSellerApplication,
    updateSellerStarRating,
    updateSellerPassword,
    deleteSeller,
    clearAllTestSellers,
    approveWithdrawalRequest,
    markWithdrawalAsPaid,
    rejectWithdrawalRequest,
    deleteWithdrawalRequest,
    refreshWithdrawals,
    adjustSellerWallet,
    transactions,
    deleteTransaction,
    updateSettings,
    sendMessage,
    startOrGetSupportConversation,
    markConversationAsRead,
    deleteSingleMessage,
    deleteConversationAndReset,
    deleteEntireConversation,
    listenToChatMessages,
    switchUserRole,
    loginAdmin,
    resetAdminPassword,
    logoutAdmin,
    adminRemainingSeconds,
    sessionNotice,
    sellerLoginSessions,
    refreshSellerLoginSessions,
    deleteSellerLoginSessionById,
    refreshAllCloudData,
  } = useStore();

  const [adminLoginEmail, setAdminLoginEmail] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Password Reset Modal states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetKhanPin, setResetKhanPin] = useState('');
  const [showResetPinText, setShowResetPinText] = useState(false);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPasswordText, setShowResetPasswordText] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const formatAdminCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await loginAdmin(adminLoginEmail, adminLoginPassword);
      if (res.success) {
        triggerToast('Admin logged in safely! Session active for 120 minutes.');
      } else {
        setAdminLoginError(res.message);
      }
    } catch (err: any) {
      setAdminLoginError(err?.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    const cleanPin = resetKhanPin.trim();
    if (!cleanPin) {
      setResetError('Security PIN is required to reset password.');
      return;
    }

    if (cleanPin !== '6492') {
      setResetError('Incorrect Security PIN! Access denied.');
      return;
    }

    if (!resetNewPassword) {
      setResetError('Please enter a new password.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      setIsResetting(true);
      const res = await resetAdminPassword(cleanPin, resetNewPassword);
      setIsResetting(false);

      if (res.success) {
        setResetSuccess('Old password deleted from database! New password is now active.');
        // Set new password into login box so admin can immediately log in
        setAdminLoginPassword(resetNewPassword);
        setAdminLoginEmail('admiz#@gmail.com');
        setAdminLoginError(null);
        setTimeout(() => {
          setShowResetModal(false);
          setResetKhanPin('');
          setResetNewPassword('');
          setResetConfirmPassword('');
          setResetSuccess(null);
          triggerToast('Password reset successfully! You can now log in.');
        }, 1200);
      } else {
        setResetError(res.message);
      }
    } catch {
      setIsResetting(false);
      setResetError('Failed to reset password. Please try again.');
    }
  };

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Password visibility map for seller table
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Product Form Modal state
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 49.99,
    originalPrice: 69.99,
    sellerCommission: 15,
    customAdminCommissionPct: 15,
    stock: 50,
    sku: '',
    categoryId: categories[0]?.id || '',
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
    status: 'PUBLISHED' as ProductStatus,
    featured: false,
    associatedSellerIds: [] as string[],
  });

  // Seller Details Modal
  const [selectedSellerDetail, setSelectedSellerDetail] = useState<SellerProfile | null>(null);

  // Keep selectedSellerDetail in sync with latest sellers state
  useEffect(() => {
    if (selectedSellerDetail) {
      const fresh = sellers.find((s) => s.id === selectedSellerDetail.id);
      if (
        fresh &&
        (fresh.starRating !== selectedSellerDetail.starRating ||
          fresh.walletBalance !== selectedSellerDetail.walletBalance ||
          fresh.applicationStatus !== selectedSellerDetail.applicationStatus)
      ) {
        setSelectedSellerDetail(fresh);
      }
    }
  }, [sellers]);

  // KYC Inspection Modal State
  const [kycInspectSeller, setKycInspectSeller] = useState<SellerProfile | null>(null);
  const [kycInspectSide, setKycInspectSide] = useState<'front' | 'back' | 'both'>('front');

  // Reject Seller Modal State & Pending Search
  const [rejectingSeller, setRejectingSeller] = useState<SellerProfile | null>(null);
  const [sellerRejectionReason, setSellerRejectionReason] = useState<string>('Incomplete or unreadable KYC verification documents');
  const [pendingSellerSearch, setPendingSellerSearch] = useState<string>('');

  // Assign Order Modal state
  const [assigningOrder, setAssigningOrder] = useState<Order | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');

  // Support conversation state
  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || '');
  const [adminChatInput, setAdminChatInput] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showSellerPicker, setShowSellerPicker] = useState(false);
  const [deleteConfirmConvId, setDeleteConfirmConvId] = useState<string | null>(null);
  const [liveChatMessages, setLiveChatMessages] = useState<any[]>([]);
  const adminTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Admin ka main chat box hamesha latest msg pe rakhne ke liye hook
  const mainChatScroll = useChatAutoScroll(
    messages.length + liveChatMessages.length,
    activeConvId,
    activeTab === 'conversations' && Boolean(activeConvId)
  );

  // Auto-resize admin textarea dynamically up to 130px
  useEffect(() => {
    if (adminTextareaRef.current) {
      adminTextareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(adminTextareaRef.current.scrollHeight, 36), 130);
      adminTextareaRef.current.style.height = `${newHeight}px`;
    }
  }, [adminChatInput]);

  // Subscribe to real-time chat messages subcollection for active conversation
  useEffect(() => {
    if (!activeConvId) return;
    setLiveChatMessages([]); // purani thread ke msgs saaf karo, warna ek pal ke liye dikhte hain
    const conv = conversations.find((c) => c.id === activeConvId);
    const sellerId =
      conv?.participantOneRole === 'SELLER'
        ? conv.participantOneId
        : conv?.participantTwoRole === 'SELLER'
        ? conv.participantTwoId
        : activeConvId;

    if (!sellerId) return;
    const unsub = listenToChatMessages(sellerId, (incoming) => {
      setLiveChatMessages(incoming);
    });
    return () => unsub();
  }, [activeConvId, conversations, listenToChatMessages]);

  // Search & Filter state
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [sellerSearch, setSellerSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Sellers Products Tab States
  const [selectedSellerEmail, setSelectedSellerEmail] = useState<string>('');
  const [sellerSearchQuery, setSellerSearchQuery] = useState<string>('');
  const [sellerProductsPage, setSellerProductsPage] = useState<number>(1);
  const [sellerProductsPerPage, setSellerProductsPerPage] = useState<number>(10);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
  );
  const [isRefreshingSellers, setIsRefreshingSellers] = useState<boolean>(false);
  const [isRefreshingOrders, setIsRefreshingOrders] = useState<boolean>(false);
  const [viewingAssignedOrder, setViewingAssignedOrder] = useState<Order | null>(null);
  const [editingAssignedOrder, setEditingAssignedOrder] = useState<Order | null>(null);
  const [orderStatusChangeVal, setOrderStatusChangeVal] = useState<OrderStatus>('PENDING');
  const [orderStatusChangeNote, setOrderStatusChangeNote] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  // Customer info for admin-created orders (so real emails show instead of placeholder)
  const [adminOrderCustomer, setAdminOrderCustomer] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
  });

  // Draggable Floating Cart State & Handlers
  const [cartPos, setCartPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('nexus_admin_floating_cart_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    return null;
  });
  const isDraggingCartRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number; moved: boolean }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false,
  });
  const cartBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!cartPos && typeof window !== 'undefined') {
      const defaultX = Math.max(16, window.innerWidth - 230);
      const defaultY = Math.max(16, window.innerHeight - 80);
      setCartPos({ x: defaultX, y: defaultY });
    }
    const handleResize = () => {
      setCartPos((prev) => {
        if (!prev) return null;
        const clampedX = Math.max(10, Math.min(window.innerWidth - 180, prev.x));
        const clampedY = Math.max(10, Math.min(window.innerHeight - 60, prev.y));
        return { x: clampedX, y: clampedY };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cartPos]);

  const handleCartPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    isDraggingCartRef.current = true;
    const currentX = cartPos?.x ?? Math.max(16, window.innerWidth - 230);
    const currentY = cartPos?.y ?? Math.max(16, window.innerHeight - 80);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
      moved: false,
    };
  };

  const handleCartPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCartRef.current) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.hypot(dx, dy) > 4) {
      dragStartRef.current.moved = true;
    }

    const btnWidth = cartBtnRef.current?.offsetWidth || 180;
    const btnHeight = cartBtnRef.current?.offsetHeight || 50;

    const newX = Math.max(8, Math.min(window.innerWidth - btnWidth - 8, dragStartRef.current.initialX + dx));
    const newY = Math.max(8, Math.min(window.innerHeight - btnHeight - 8, dragStartRef.current.initialY + dy));

    setCartPos({ x: newX, y: newY });
  };

  const handleCartPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCartRef.current) return;
    isDraggingCartRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (dragStartRef.current.moved) {
      if (cartPos) {
        try {
          localStorage.setItem('nexus_admin_floating_cart_pos', JSON.stringify(cartPos));
        } catch {}
      }
    } else {
      setIsCartOpen((prev) => !prev);
    }
  };

  // Manual Add / Deduct Money state
  const [walletAdjustmentMode, setWalletAdjustmentMode] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [selectedWalletSellerId, setSelectedWalletSellerId] = useState<string>('');
  const [addMoneySellerSearch, setAddMoneySellerSearch] = useState<string>('');
  const [manualMoneyAmount, setManualMoneyAmount] = useState<string>('');
  const [manualMoneyNote, setManualMoneyNote] = useState<string>('');

  // Money Withdrawals Management state
  const [withdrawalSearch, setWithdrawalSearch] = useState<string>('');
  const [withdrawalStatusFilter, setWithdrawalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'>('ALL');
  const [deleteConfirmWithdrawalId, setDeleteConfirmWithdrawalId] = useState<string | null>(null);
  const [rejectingWithdrawalId, setRejectingWithdrawalId] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('Account details verification failed');
  const [copiedWithdrawalField, setCopiedWithdrawalField] = useState<string | null>(null);
  const [selectedWithdrawalDetail, setSelectedWithdrawalDetail] = useState<WithdrawalRequest | null>(null);
  const [isRefreshingWithdrawals, setIsRefreshingWithdrawals] = useState(false);

  useEffect(() => {
    if (activeTab === 'withdrawals') {
      refreshWithdrawals();
    }
  }, [activeTab]);

  const handleRefreshWithdrawals = async () => {
    setIsRefreshingWithdrawals(true);
    await refreshWithdrawals();
    triggerToast('Withdrawals list synced from cloud!');
    setTimeout(() => setIsRefreshingWithdrawals(false), 500);
  };

  const handleCopyWithdrawalText = (text: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedWithdrawalField(id);
      triggerToast('Account details copied to clipboard!');
      setTimeout(() => setCopiedWithdrawalField(null), 2200);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Auto-select first conversation if none selected
  useEffect(() => {
    if ((!activeConvId || !conversations.some((c) => c.id === activeConvId)) && conversations.length > 0) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  // Audio Notification Watcher: Beep on any incoming message from a seller (regardless of active tab)
  const [soundEnabledState, setSoundEnabledState] = useState<boolean>(() => isSoundEnabled());
  const knownMsgIdsRef = useRef<Set<string>>(new Set(messages.map((m) => m.id)));

  useEffect(() => {
    const newMsgs = messages.filter((m) => !knownMsgIdsRef.current.has(m.id));
    if (newMsgs.length > 0) {
      newMsgs.forEach((m) => {
        knownMsgIdsRef.current.add(m.id);
        // If message is from a seller (or non-admin)
        if (m.senderRole === 'SELLER' || m.senderRole !== 'ADMIN') {
          playNotificationBeep();
          const sender = m.senderName || 'Seller';
          const snippet = m.text ? (m.text.length > 35 ? m.text.substring(0, 35) + '...' : m.text) : 'Sent a photo';
          triggerToast(`🔔 New message from ${sender}: "${snippet}"`);
        }
      });
    }
  }, [messages]);

  const handleToggleSound = () => {
    const next = !soundEnabledState;
    setSoundEnabledState(next);
    setSoundEnabled(next);
    if (next) {
      testNotificationBeep();
      triggerToast('🔔 Chat sound alerts ENABLED. You will hear a beep for every seller message.');
    } else {
      triggerToast('🔕 Chat sound alerts MUTED.');
    }
  };

  const handleTestBeep = () => {
    testNotificationBeep();
    triggerToast('🔔 Beep sound test played! This sound will play whenever a seller sends a message.');
  };

  // Metrics Calculations (Dynamic real counts)
  const totalCustomersCount = users.filter((u) => u.role === 'CUSTOMER').length;
  const activeSellersCount = sellers.filter((s) => s.applicationStatus === 'APPROVED').length;
  const totalOrdersCount = orders.length;
  const totalPlatformGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingSellers = sellers.filter((s) => s.applicationStatus === 'PENDING');
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'PENDING');
  const approvedSellers = sellers.filter((s) => s.applicationStatus === 'APPROVED');
  const customerUsers = users.filter((u) => u.role === 'CUSTOMER');

  // Toggle password visibility
  const togglePasswordVisibility = (sellerId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [sellerId]: !prev[sellerId],
    }));
  };

  // Filtered pending sellers for front dashboard
  const filteredPendingSellers = pendingSellers.filter((s) => {
    if (!pendingSellerSearch.trim()) return true;
    const q = pendingSellerSearch.toLowerCase().trim();
    return (
      (s.shopName || '').toLowerCase().includes(q) ||
      (s.sellerName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q)
    );
  });

  // Handlers for seller approvals
  const handleApproveSeller = (seller: SellerProfile) => {
    approveSellerApplication(seller.id);
    triggerToast(`Seller "${seller.shopName || seller.sellerName}" approved! Store is now active.`);
    if (selectedSellerDetail?.id === seller.id) {
      setSelectedSellerDetail((prev) => (prev ? { ...prev, applicationStatus: 'APPROVED' } : null));
    }
    if (kycInspectSeller?.id === seller.id) {
      setKycInspectSeller((prev) => (prev ? { ...prev, applicationStatus: 'APPROVED' } : null));
    }
  };

  const handleRejectSeller = (seller: SellerProfile) => {
    setRejectingSeller(seller);
    setSellerRejectionReason('Incomplete or unreadable KYC verification documents');
  };

  const confirmRejectSeller = () => {
    if (!rejectingSeller) return;
    const reason = sellerRejectionReason.trim() || 'Application requirements not met';
    rejectSellerApplication(rejectingSeller.id, reason);
    triggerToast(`Seller application for "${rejectingSeller.shopName || rejectingSeller.sellerName}" rejected.`);
    setRejectingSeller(null);
    if (selectedSellerDetail?.id === rejectingSeller.id) {
      setSelectedSellerDetail(null);
    }
    if (kycInspectSeller?.id === rejectingSeller.id) {
      setKycInspectSeller(null);
    }
  };

  const handleFreezeSeller = (seller: SellerProfile) => {
    freezeSellerApplication(seller.id, 'Your store has been frozen by Company. Please contact customer support for assistance.');
    triggerToast(`Seller ${seller.shopName || seller.sellerName} has been frozen!`);
    if (selectedSellerDetail?.id === seller.id) {
      setSelectedSellerDetail((prev) => (prev ? { ...prev, applicationStatus: 'FROZEN', isFrozen: true } as any : null));
    }
    if (kycInspectSeller?.id === seller.id) {
      setKycInspectSeller((prev) => (prev ? { ...prev, applicationStatus: 'FROZEN', isFrozen: true } as any : null));
    }
  };

  const handleUnfreezeSeller = (seller: SellerProfile) => {
    unfreezeSellerApplication(seller.id);
    triggerToast(`Seller "${seller.shopName || seller.sellerName}" has been unfrozen! Dashboard unlocked.`);
    if (selectedSellerDetail?.id === seller.id) {
      setSelectedSellerDetail((prev) => (prev ? { ...prev, applicationStatus: 'APPROVED', isFrozen: false } as any : null));
    }
    if (kycInspectSeller?.id === seller.id) {
      setKycInspectSeller((prev) => (prev ? { ...prev, applicationStatus: 'APPROVED', isFrozen: false } as any : null));
    }
  };

  // Handlers for products
  const handleOpenNewProduct = () => {
    setEditingProduct(null);
    const defaultComm = settings.globalCommissionPct || 15;
    setProductForm({
      name: '',
      description: '',
      price: 49.99,
      originalPrice: 69.99,
      sellerCommission: defaultComm,
      customAdminCommissionPct: defaultComm,
      stock: 40,
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      categoryId: categories[0]?.id || '',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      status: 'PUBLISHED',
      featured: false,
      associatedSellerIds: approvedSellers.map((s) => s.id),
    });
    setShowProductModal(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    const commPct = prod.sellerCommission ?? prod.customAdminCommissionPct ?? settings.globalCommissionPct ?? 15;
    setProductForm({
      name: prod.name,
      description: prod.description,
      price: prod.price,
      originalPrice: prod.originalPrice || prod.price,
      sellerCommission: commPct,
      customAdminCommissionPct: commPct,
      stock: prod.stock,
      sku: prod.sku,
      categoryId: prod.categoryId,
      images: prod.images,
      status: prod.status,
      featured: prod.featured || false,
      associatedSellerIds: prod.associatedSellerIds || [],
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === productForm.categoryId);
    const finalSku = productForm.sku || (editingProduct ? editingProduct.sku : `SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    const payload = {
      ...productForm,
      sku: finalSku,
      sellerCommission: productForm.sellerCommission,
      customAdminCommissionPct: productForm.sellerCommission,
      categoryName: cat?.name || 'General',
    };
    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
      triggerToast(`Product ${productForm.name} updated successfully!`);
    } else {
      addProduct(payload);
      triggerToast(`Product ${productForm.name} created successfully!`);
    }
    setShowProductModal(false);
  };

  const handleAssignOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningOrder || !selectedSellerId) return;
    assignOrderToSeller(assigningOrder.id, selectedSellerId);
    triggerToast(`Order #${assigningOrder.orderNumber} assigned to seller!`);
    setAssigningOrder(null);
    setSelectedSellerId('');
  };

  // Helper functions for Conversations
  const getParticipantEmail = (conv: any): string => {
    if (!conv) return '';
    const targetId = conv.participantTwoRole === 'ADMIN' ? conv.participantOneId : conv.participantTwoId;
    const seller = sellers.find(
      (s) =>
        s.userId === targetId ||
        s.id === targetId ||
        (s.email && (conv.participantOneName || '').toLowerCase().includes((s.sellerName || '').toLowerCase()))
    );
    if (seller && seller.email) return seller.email;
    const user = users.find((u) => u.id === targetId || u.name === conv.participantOneName);
    if (user && user.email) return user.email;
    const clean = (conv.participantOneName || 'seller')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    return `${clean || 'seller'}@gmail.com`;
  };

  const getParticipantShop = (conv: any): string => {
    if (!conv) return 'Seller';
    const targetId = conv.participantTwoRole === 'ADMIN' ? conv.participantOneId : conv.participantTwoId;
    const seller = sellers.find((s) => s.userId === targetId || s.id === targetId);
    if (seller && seller.shopName) return seller.shopName;
    return conv.participantOneName || 'Merchant Partner';
  };

  const getAdminUnreadCount = (conv: any): number => {
    if (!conv) return 0;
    const isParticipantTwoAdmin = conv.participantTwoRole === 'ADMIN';
    const recordedUnread = isParticipantTwoAdmin ? conv.unreadCountParticipantTwo : conv.unreadCountParticipantOne;
    if (typeof recordedUnread === 'number' && recordedUnread > 0) {
      return recordedUnread;
    }
    const unreadMsgs = messages.filter(
      (m) => m.conversationId === conv.id && m.senderRole !== 'ADMIN' && !m.isRead
    );
    return unreadMsgs.length;
  };

  const formatAdminMessageDateTime = (isoDateString?: string): string => {
    if (!isoDateString) return '';
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return '';

    const datePart = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timePart = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return `Today, ${timePart}`;
    }
    return `${datePart} • ${timePart}`;
  };

  // Group and unify conversations by seller so each seller only ever has ONE active thread in Admin Dashboard
  const unifiedConversations = useMemo(() => {
    const sellerGroupMap = new Map<
      string,
      {
        primaryConv: Conversation;
        allConvIds: Set<string>;
        sellerMatch?: SellerProfile;
      }
    >();

    conversations.forEach((conv) => {
      const targetId = conv.participantTwoRole === 'ADMIN' ? conv.participantOneId : conv.participantTwoId;
      const cleanTargetId = (targetId || '').replace(/^conv_/, '');
      const cleanConvId = (conv.id || '').replace(/^conv_/, '');

      const seller = sellers.find(
        (s) =>
          s.id === targetId ||
          s.userId === targetId ||
          s.id === cleanTargetId ||
          s.userId === cleanTargetId ||
          s.id === conv.id ||
          s.userId === conv.id ||
          s.id === cleanConvId ||
          s.userId === cleanConvId ||
          (s.email && getParticipantEmail(conv).toLowerCase() === s.email.toLowerCase()) ||
          (s.shopName && (conv.participantOneName || '').toLowerCase().includes(s.shopName.toLowerCase())) ||
          (s.sellerName && (conv.participantOneName || '').toLowerCase().includes(s.sellerName.toLowerCase()))
      );

      const groupKey = seller
        ? `seller_${seller.id || seller.userId}`
        : `email_${getParticipantEmail(conv).toLowerCase()}`;

      const existing = sellerGroupMap.get(groupKey);
      if (!existing) {
        sellerGroupMap.set(groupKey, {
          primaryConv: {
            ...conv,
            participantOneName: seller?.shopName || conv.participantOneName,
          },
          allConvIds: new Set(
            [conv.id, cleanConvId, `conv_${cleanConvId}`, targetId, cleanTargetId, `conv_${cleanTargetId}`].filter(
              Boolean
            ) as string[]
          ),
          sellerMatch: seller,
        });
      } else {
        existing.allConvIds.add(conv.id);
        if (cleanConvId) existing.allConvIds.add(cleanConvId);
        if (targetId) existing.allConvIds.add(targetId);
        if (cleanTargetId) existing.allConvIds.add(cleanTargetId);

        // Keep the latest message between the two
        const existingTime = new Date(existing.primaryConv.lastMessageTime || 0).getTime();
        const convTime = new Date(conv.lastMessageTime || 0).getTime();
        if (convTime > existingTime) {
          existing.primaryConv = {
            ...existing.primaryConv,
            lastMessageText: conv.lastMessageText || existing.primaryConv.lastMessageText,
            lastMessageTime: conv.lastMessageTime,
          };
        }
      }
    });

    return Array.from(sellerGroupMap.values())
      .map((g) => ({
        ...g.primaryConv,
        allConvIds: Array.from(g.allConvIds),
        sellerMatch: g.sellerMatch,
      }))
      .sort((a, b) => new Date(b.lastMessageTime || 0).getTime() - new Date(a.lastMessageTime || 0).getTime());
  }, [conversations, sellers, users]);

  const filteredConversations = useMemo(() => {
    return unifiedConversations.filter((c) => {
      const name = (c.participantOneName || '').toLowerCase();
      const shop = (getParticipantShop(c) || '').toLowerCase();
      const email = (getParticipantEmail(c) || '').toLowerCase();
      const query = chatSearchQuery.toLowerCase().trim();
      if (!query) return true;
      return name.includes(query) || shop.includes(query) || email.includes(query);
    });
  }, [unifiedConversations, chatSearchQuery]);

  const totalUnreadConversationsForAdmin = useMemo(() => {
    return unifiedConversations.reduce((acc, conv) => {
      return acc + getAdminUnreadCount(conv);
    }, 0);
  }, [unifiedConversations, messages]);

  const handleSelectConv = (convId: string) => {
    setActiveConvId(convId);
    markConversationAsRead(convId, 'ADMIN');
  };

  React.useEffect(() => {
    if (activeTab === 'conversations' && activeConvId) {
      markConversationAsRead(activeConvId, 'ADMIN');
    }
  }, [activeTab, activeConvId]);

  const handleSendAdminMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminChatInput.trim() || !activeConvId) return;
    sendMessage(activeConvId, adminChatInput.trim(), undefined, {
      senderId: 'user_admin',
      senderName: 'Platform Support Team',
      senderRole: 'ADMIN',
    });
    setAdminChatInput('');
    if (adminTextareaRef.current) {
      adminTextareaRef.current.style.height = 'auto';
    }
  };

  const handleAdminChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter allows natural newline (multi-line typing)
        return;
      }
      // Enter alone sends message
      e.preventDefault();
      handleSendAdminMessage();
    }
  };

  const handleDeleteAndResetChat = (convId: string) => {
    const targetConv = unifiedConversations.find((c) => c.id === convId || (c as any).allConvIds?.includes(convId));
    if (targetConv && (targetConv as any).allConvIds && (targetConv as any).allConvIds.length > 0) {
      const idsToWipe = new Set<string>(
        [
          ...(targetConv as any).allConvIds,
          (targetConv as any).sellerMatch?.id,
          (targetConv as any).sellerMatch?.userId,
        ].filter(Boolean) as string[]
      );
      idsToWipe.forEach((id: string) => deleteConversationAndReset(id));
    } else {
      deleteConversationAndReset(convId);
    }
    setDeleteConfirmConvId(null);
    triggerToast('Chat history cleared. You can manually type and send a reply.');
  };

  const handleDeleteSingleMsg = (msgId: string) => {
    // Seller ke saare possible chat-IDs jama karo (jaise display mein karte hain), taake har jagah se delete ho
    const convForDelete = unifiedConversations.find(
      (c) => c.id === activeConvId || (c as any).allConvIds?.includes(activeConvId)
    ) as any;
    const idsToClean = new Set<string>(
      [
        activeConvId,
        ...(convForDelete?.allConvIds || []),
        convForDelete?.sellerMatch?.id,
        convForDelete?.sellerMatch?.userId,
      ].filter(Boolean) as string[]
    );
    if (idsToClean.size === 0) {
      deleteSingleMessage(msgId);
    } else {
      idsToClean.forEach((id) => deleteSingleMessage(msgId, id));
    }
    triggerToast('Message deleted');
  };

  const handleStartChatWithSeller = (seller: SellerProfile) => {
    const conv = startOrGetSupportConversation(
      seller.userId || seller.id,
      seller.shopName || seller.sellerName,
      'SELLER'
    );
    setActiveConvId(conv.id);
    setShowSellerPicker(false);
    triggerToast(`Opened chat thread with ${seller.shopName || seller.sellerName}`);
  };

  const handleManualWalletAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(manualMoneyAmount);
    if (!selectedWalletSellerId) {
      triggerToast('Please select a seller account.');
      return;
    }
    if (!amt || isNaN(amt) || amt <= 0) {
      triggerToast('Please enter a valid amount greater than $0.00');
      return;
    }

    const targetSeller = sellers.find((s) => s.id === selectedWalletSellerId);
    const result = adjustSellerWallet(
      selectedWalletSellerId,
      amt,
      walletAdjustmentMode,
      manualMoneyNote.trim() || undefined
    );

    if (result.success) {
      triggerToast(result.message);
      setManualMoneyAmount('');
      setManualMoneyNote('');
    } else {
      triggerToast(result.message);
    }
  };

  const handleLogout = () => {
    logoutAdmin('Admin logged out successfully.');
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [showFirestoreRulesModal, setShowFirestoreRulesModal] = useState(false);
  const [rulesCopied, setRulesCopied] = useState(false);

  // Fixed Floating Customer Care Chat States for Admin
  const [isAdminFloatingChatOpen, setIsAdminFloatingChatOpen] = useState(false);
  const [adminFloatingChatInput, setAdminFloatingChatInput] = useState('');
  const [adminFloatingChatImage, setAdminFloatingChatImage] = useState<string | null>(null);
  const adminFloatingFileRef = useRef<HTMLInputElement>(null);
  const adminFloatingMessagesEndRef = useRef<HTMLDivElement>(null);

  // Floating chat ko latest msg pe rakhne ke liye hook
  const floatingChatScroll = useChatAutoScroll(
    messages.length + liveChatMessages.length,
    activeConvId,
    isAdminFloatingChatOpen
  );
  const adminFloatingTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRefreshData = async () => {
    setIsRefreshingData(true);
    try {
      const res = await refreshAllCloudData();
      if (res.success) {
        triggerToast(`Live sync complete! ${res.sellersCount} seller(s) active in database.`);
      } else {
        triggerToast(res.error || 'Permission error: Firestore rules blocked access.');
      }
    } catch (err: any) {
      triggerToast('Error refreshing data from cloud database.');
    } finally {
      setIsRefreshingData(false);
    }
  };

  const handleSendAdminFloatingChat = () => {
    const textToSend = adminFloatingChatInput.trim();
    if (!textToSend && !adminFloatingChatImage) return;

    const currentConv = conversations.find((c) => c.id === activeConvId) || conversations[0];
    if (!currentConv) {
      triggerToast('Please select a seller conversation first.');
      return;
    }

    sendMessage(currentConv.id, textToSend, adminFloatingChatImage || undefined, {
      senderId: 'user_admin',
      senderName: 'Customer Care & Admin',
      senderRole: 'ADMIN',
    });

    setAdminFloatingChatInput('');
    setAdminFloatingChatImage(null);
  };

  const handleAdminFloatingImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAdminFloatingChatImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Sellers Products Tab Helpers
  const formatOrderDateTime = (isoDateString?: string): string => {
    if (!isoDateString) return 'N/A';
    try {
      const date = new Date(isoDateString);
      if (isNaN(date.getTime())) return isoDateString;
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoDateString;
    }
  };

  const handleRefreshSellerProducts = () => {
    setIsRefreshingSellers(true);
    setTimeout(() => {
      setIsRefreshingSellers(false);
      setLastRefreshedTime(
        new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      triggerToast('Seller products updated.');
    }, 350);
  };

  const handleRefreshAssignedOrders = () => {
    setIsRefreshingOrders(true);
    setTimeout(() => {
      setIsRefreshingOrders(false);
      triggerToast('Assigned orders refreshed.');
    }, 350);
  };

  const handleRemoveProductFromSeller = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const targetEmail = (sellerSearchQuery.trim() || selectedSellerEmail).toLowerCase();
    const matchedSeller = sellers.find(
      (s) => (s.email && s.email.toLowerCase() === targetEmail) || s.userId === targetEmail || s.id === targetEmail
    );
    const sellerId = matchedSeller?.id || '';
    
    const updatedSellerIds = (prod.associatedSellerIds || []).filter(
      (id) => id !== sellerId && id.toLowerCase() !== targetEmail
    );

    updateProduct(productId, {
      associatedSellerIds: updatedSellerIds,
    });
    triggerToast(`Removed "${prod.name}" from seller listings.`);
  };

  const handleSaveEditedOrderStatus = () => {
    if (!editingAssignedOrder) return;
    updateOrderStatus(editingAssignedOrder.id, orderStatusChangeVal, orderStatusChangeNote || undefined);
    triggerToast(`Order #${editingAssignedOrder.id} updated to ${orderStatusChangeVal}`);
    setEditingAssignedOrder(null);
  };

  const handleDeleteAssignedOrder = (orderId: string) => {
    deleteOrder(orderId);
    triggerToast(`Order #${orderId} deleted.`);
  };

  const handleAssignCartToSeller = () => {
    if (cart.length === 0) return;
    const targetEmail = (sellerSearchQuery.trim() || selectedSellerEmail).toLowerCase();
    const matchedSeller = targetEmail
      ? sellers.find(
          (s) => (s.email && s.email.toLowerCase() === targetEmail) || s.userId === targetEmail || s.id === targetEmail
        )
      : null;
    const sellerId = matchedSeller?.id || '';

    if (!sellerId) {
      triggerToast('Please select a seller to assign this order.');
      return;
    }

    // Validate customer info — admin must enter real customer details
    const cleanCustName = adminOrderCustomer.fullName.trim();
    const cleanCustEmail = adminOrderCustomer.email.trim().toLowerCase();
    if (!cleanCustName || !cleanCustEmail || !cleanCustEmail.includes('@')) {
      triggerToast('Please enter the real customer name and valid email address before assigning the order.');
      return;
    }

    // Automatically approve seller so they are never blocked by awaiting approval
    approveSellerApplication(sellerId);

    const newOrder = createOrder({
      shippingAddress: {
        fullName: cleanCustName,
        email: cleanCustEmail,
        phone: adminOrderCustomer.phone.trim() || '+1 (555) 000-0000',
        street: adminOrderCustomer.street.trim() || 'Address on file',
        city: adminOrderCustomer.city.trim() || 'N/A',
        state: adminOrderCustomer.state.trim() || 'N/A',
        postalCode: adminOrderCustomer.postalCode.trim() || '00000',
        zipCode: adminOrderCustomer.postalCode.trim() || '00000',
        country: adminOrderCustomer.country.trim() || 'USA',
      },
      paymentMethod: 'ADMIN_ASSIGNED',
      notes: `Order created by Admin & assigned to ${targetEmail || matchedSeller?.shopName || 'Seller'}`,
      assignedSellerId: sellerId,
      assignedSellerName: matchedSeller?.shopName || matchedSeller?.sellerName,
    });

    if (newOrder) {
      if (sellerId) {
        assignOrderToSeller(newOrder.id, sellerId);
      }
      triggerToast(`Order #${newOrder.id} created & assigned to ${targetEmail || matchedSeller?.shopName || 'Seller'}!`);
      // Reset customer form
      setAdminOrderCustomer({
        fullName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA',
      });
      setIsCartOpen(false);
    }
  };

  // Nav Items definition
  const navItems = [
    {
      id: 'dashboard' as AdminTab,
      label: 'Dashboard',
      icon: Home,
      badge: pendingSellers.length > 0 ? pendingSellers.length : undefined,
      badgeColor: 'bg-[#F59E0B]',
    },
    { id: 'products' as AdminTab, label: 'Products', icon: Package },
    { id: 'sellers-products' as AdminTab, label: 'Sellers Products', icon: ShoppingBag },
    { id: 'store-main-page' as AdminTab, label: 'Store Main Page', icon: Store },
    { id: 'store-contacts' as AdminTab, label: 'Store Contacts & Footer', icon: Phone },
    {
      id: 'orders' as AdminTab,
      label: 'Orders',
      icon: ShoppingCart,
      badge: orders.length || 25,
      badgeColor: 'bg-[#EF4444]',
    },
    {
      id: 'withdrawals' as AdminTab,
      label: 'Money Withdraw',
      icon: Landmark,
      badge: pendingWithdrawals.length > 0 ? pendingWithdrawals.length : undefined,
      badgeColor: 'bg-[#F59E0B]',
    },
    {
      id: 'conversations' as AdminTab,
      label: 'Conversations',
      icon: MessageSquare,
      badge: totalUnreadConversationsForAdmin > 0 ? totalUnreadConversationsForAdmin : undefined,
      badgeColor: 'bg-[#EF4444]',
    },
    {
      id: 'seller-profiles' as AdminTab,
      label: 'View Seller Profile',
      icon: Store,
      badge: pendingSellers.length > 0 ? pendingSellers.length : undefined,
      badgeColor: 'bg-[#F59E0B]',
    },
    { id: 'customer-profiles' as AdminTab, label: 'Customer Profiles', icon: Users },
    { id: 'seller-logins' as AdminTab, label: 'Seller Login Sessions', icon: UserCheck },
    { id: 'add-money' as AdminTab, label: 'Add Money', icon: PlusCircle },
    { id: 'subscriptions' as AdminTab, label: 'Subscription Plans', icon: Award },
  ];

  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans admin-dashboard-scope">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Small Admin Login Card */}
        <div className="w-full max-w-sm bg-slate-900/95 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative z-10 space-y-5">
          {/* Logo & Header */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 via-purple-600 to-amber-500 shadow-md shadow-rose-500/20 mb-1">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">Admin Portal</h1>
            <p className="text-[11px] text-slate-400">
              High-security administrator credentials required
            </p>
          </div>

          {/* Session Notice / Expiration Alert */}
          {sessionNotice && (
            <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2.5 text-amber-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed">
                <span className="font-semibold block">Session Notice:</span>
                <span>{sessionNotice}</span>
              </div>
            </div>
          )}

          {/* Login Error Alert */}
          {adminLoginError && (
            <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-2.5 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-[11px] leading-relaxed font-medium">
                {adminLoginError}
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="admin-email-input"
                  type="email"
                  value={adminLoginEmail}
                  onChange={(e) => {
                    setAdminLoginEmail(e.target.value);
                    setAdminLoginError(null);
                  }}
                  placeholder="admin@gmail.com"
                  className="w-full bg-white border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-black placeholder-slate-400 outline-none transition font-semibold"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {/* Password Reset Trigger - Exactly as requested: Password Reset option */}
                <button
                  type="button"
                  id="admin-reset-password-btn"
                  onClick={() => {
                    setShowResetModal(true);
                    setResetError(null);
                    setResetSuccess(null);
                    setResetKhanPin('');
                    setResetNewPassword('');
                    setResetConfirmPassword('');
                  }}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition cursor-pointer underline underline-offset-2"
                >
                  Reset Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="admin-password-input"
                  type={showAdminPassword ? 'text' : 'password'}
                  value={adminLoginPassword}
                  onChange={(e) => {
                    setAdminLoginPassword(e.target.value);
                    setAdminLoginError(null);
                  }}
                  placeholder="Enter admin password"
                  className="w-full bg-white border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl pl-9 pr-10 py-2.5 text-xs sm:text-sm text-black placeholder-slate-400 outline-none transition font-semibold"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition cursor-pointer"
                  tabIndex={-1}
                >
                  {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-rose-600 via-[#EE4932] to-amber-600 hover:opacity-95 active:scale-98 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-600/25 transition cursor-pointer flex items-center justify-center gap-2 text-xs sm:text-sm mt-1"
            >
              {isLoggingIn ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>{isLoggingIn ? 'Authenticating...' : 'Login as Platform Admin'}</span>
            </button>
          </form>

          {/* Safe 120-min session security footer */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Protected Access
            </span>
            <button
              type="button"
              onClick={() => onNavigate && onNavigate('home')}
              className="text-slate-400 hover:text-white transition cursor-pointer underline"
            >
              Return Home
            </button>
          </div>
        </div>

        {/* Password Reset Modal (Using Khan PIN: 6492) */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Reset Admin Password</h3>
                    <p className="text-[10px] text-slate-400">Security authorization required</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resetError && (
                <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-2.5 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-medium">{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-2.5 text-emerald-200 text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] font-medium">{resetSuccess}</span>
                </div>
              )}

              <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
                {/* Security PIN Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Security PIN <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="admin-khan-pin-input"
                      type={showResetPinText ? 'text' : 'password'}
                      maxLength={8}
                      value={resetKhanPin}
                      onChange={(e) => {
                        setResetKhanPin(e.target.value);
                        setResetError(null);
                      }}
                      placeholder="Enter Security PIN"
                      className="w-full bg-white border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 pr-10 py-2 text-xs sm:text-sm text-black placeholder-slate-400 outline-none transition font-mono tracking-widest text-center font-bold"
                      style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPinText(!showResetPinText)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition cursor-pointer"
                      tabIndex={-1}
                    >
                      {showResetPinText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    New Admin Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="admin-reset-new-password-input"
                      type={showResetPasswordText ? 'text' : 'password'}
                      value={resetNewPassword}
                      onChange={(e) => {
                        setResetNewPassword(e.target.value);
                        setResetError(null);
                      }}
                      placeholder="Enter new password"
                      className="w-full bg-white border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-black placeholder-slate-400 outline-none transition pr-9 font-semibold"
                      style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPasswordText(!showResetPasswordText)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showResetPasswordText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Confirm New Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="admin-reset-confirm-password-input"
                    type={showResetPasswordText ? 'text' : 'password'}
                    value={resetConfirmPassword}
                    onChange={(e) => {
                      setResetConfirmPassword(e.target.value);
                      setResetError(null);
                    }}
                    placeholder="Confirm new password"
                    className="w-full bg-white border border-slate-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-black placeholder-slate-400 outline-none transition font-semibold"
                    style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Upon reset, the old password will be deleted from the database.
                  </p>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="w-1/2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="admin-reset-submit-btn"
                    type="submit"
                    disabled={isResetting}
                    className="w-1/2 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30"
                  >
                    {isResetting ? (
                      <span>Resetting...</span>
                    ) : (
                      <>
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col font-sans admin-dashboard-scope">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-amber-400/40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Top Navbar Header (Full Width Fluid) */}
      <header className="bg-gradient-to-r from-slate-950 via-[#0d1527] to-slate-950 text-white sticky top-0 z-40 border-b border-slate-800 shadow-xl w-full shrink-0">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-4">
          {/* Brand Logo and Title + Back to Storefront button */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Direct Back to Website Home Button */}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-400/30 transition-all cursor-pointer text-xs font-bold shrink-0 shadow-sm"
                title="Back to main website (Home)"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Back to Store</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none group truncate"
            >
              {/* Colorful / Distinctive Waifair emblem */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-lg sm:text-xl shadow-lg ring-2 ring-amber-400/30 group-hover:scale-105 transition-transform shrink-0">
                W
              </div>
              <div className="truncate">
                <div className="text-base sm:text-lg font-black tracking-wide text-white leading-tight font-serif truncate">
                  Waifair
                </div>
                <div className="text-[9px] sm:text-[10px] uppercase font-bold tracking-widest text-amber-400 -mt-0.5 truncate">
                  Admin Panel
                </div>
              </div>
            </button>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-bold tracking-wider uppercase shrink-0">
            {onNavigate && (
              <button
                onClick={() => onNavigate('home')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-400/30 transition-colors cursor-pointer text-[11px]"
                title="View storefront as customer"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Storefront</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hidden sm:inline-block px-2 py-1 hover:text-amber-300 transition-colors ${
                activeTab === 'dashboard' ? 'text-amber-400 underline underline-offset-4' : 'text-slate-300'
              }`}
            >
              DASHBOARD
            </button>
            <button
              id="admin-header-contacts-btn"
              type="button"
              onClick={() => setActiveTab('store-contacts')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer text-[11px] ${
                activeTab === 'store-contacts'
                  ? 'bg-amber-400 text-slate-950 border-amber-400 font-black'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border-slate-700 font-bold'
              }`}
              title="Change footer contacts and support info"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Footer Contacts</span>
            </button>

            {/* Admin Registered Date & Time Badge */}
            <div className="hidden xl:flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-700/80 text-[11px] normal-case tracking-normal">
              <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-slate-400">Admin Registered:</span>
              <span className="font-mono font-bold text-amber-300">
                {currentUser?.createdAt
                  ? new Date(currentUser.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : 'Platform Founder'}
              </span>
            </div>

            {/* Chat Sound Alert Controller (Mobile & Desktop) */}
            <div className="flex items-center gap-1 bg-slate-900/80 hover:bg-slate-800 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] font-bold normal-case tracking-normal">
              <button
                onClick={handleToggleSound}
                className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                  soundEnabledState ? 'text-emerald-300 hover:text-emerald-200' : 'text-slate-400 hover:text-white'
                }`}
                title={soundEnabledState ? 'Click to mute chat notification beep' : 'Click to unmute chat notification beep'}
              >
                {soundEnabledState ? <Volume2 className="w-3.5 h-3.5 text-emerald-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">Beep:</span>
                <span className={soundEnabledState ? 'text-emerald-400 uppercase font-black' : 'text-slate-400'}>
                  {soundEnabledState ? 'ON' : 'OFF'}
                </span>
              </button>
              <span className="text-slate-600">|</span>
              <button
                onClick={handleTestBeep}
                className="text-[10px] text-amber-300 hover:text-amber-200 underline cursor-pointer px-1 py-0.5 rounded hover:bg-slate-800 transition-colors"
                title="Test notification beep sound on this device"
              >
                Test
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="text-slate-300 hover:text-rose-400 transition-colors flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-xs"
              title="Logout from Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">LOGOUT</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Admin Workspace Layout: Sidebar + Main Content (Edge to Edge) */}
      <div className="flex flex-1 overflow-hidden w-full">
        {/* Left Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64 xl:w-72' : 'w-16'
          } hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 select-none shrink-0 shadow-xl`}
        >
          {/* Top Menu Button inside Sidebar */}
          <div className="p-3 border-b border-slate-800">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-400/20 rounded-lg flex items-center justify-center gap-2 font-bold text-xs shadow-xs transition-colors"
              title="Toggle Sidebar Menu"
            >
              <Menu className="w-4 h-4" />
              {sidebarOpen && <span>Menu</span>}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left relative ${
                    isActive
                      ? 'bg-amber-400/15 text-amber-300 font-bold border-l-4 border-amber-400 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-amber-400' : 'text-slate-400'
                    }`}
                  />
                  {sidebarOpen && (
                    <span className="flex-1 truncate text-xs">{item.label}</span>
                  )}
                  {sidebarOpen && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold text-white rounded-full ${
                        item.badgeColor || 'bg-rose-500'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 text-slate-100 h-full flex flex-col z-10 shadow-2xl">
              {/* Drawer Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-md">
                    A
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white leading-tight">Admin Control Panel</div>
                    <div className="text-[10px] font-semibold text-emerald-400">● Master Admin Online</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items (Touch-Friendly 44px+ height) */}
              <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
                <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                  Management Sections
                </div>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full min-h-[44px] flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                        isActive
                          ? 'bg-amber-400/15 text-amber-300 font-black border-l-4 border-amber-400 shadow-sm'
                          : 'text-slate-300 hover:bg-slate-800 active:bg-slate-750'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-extrabold text-white rounded-full ${
                            item.badgeColor || 'bg-rose-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Drawer Footer Quick Actions */}
              <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
                {onNavigate && (
                  <button
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      onNavigate('home');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 border border-amber-400/30 text-amber-300 font-bold text-xs hover:bg-slate-850 transition-colors"
                  >
                    <Store className="w-4 h-4 text-amber-400" />
                    <span>View Customer Storefront</span>
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Pane (Fluid Full Screen Layout, Fixed Viewport for Support Desk so only chat scrolls) */}
        <main
          className={`flex-1 w-full min-w-0 ${
            activeTab === 'conversations'
              ? 'overflow-hidden flex flex-col h-[calc(100dvh-64px)] p-2.5 sm:p-4 lg:p-6 pb-20 md:pb-4 space-y-3'
              : 'overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10 pb-24 md:pb-10 space-y-6'
          }`}
        >
          {/* Mobile Quick Section Bar */}
          <div className="md:hidden flex items-center justify-between bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-black text-white truncate">
                {navItems.find((n) => n.id === activeTab)?.label || activeTab}
              </span>
            </div>
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 px-3 py-1.5 rounded-xl transition-colors shrink-0"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>All Tabs</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* TAB 1: MAIN DASHBOARD OVERVIEW (MATCHES SCREENSHOT)       */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Title and Refresh Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h1 className="text-2xl font-black text-white tracking-tight">
                  Admin Dashboard
                </h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to clear all test sellers and start with a fresh state?')) {
                        clearAllTestSellers();
                        triggerToast('All test sellers cleared. Store is completely clean!');
                      }
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-700 hover:border-rose-500 hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
                    title="Clear test sellers to re-test clean flow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Test Sellers</span>
                  </button>
                  <button
                    onClick={handleRefreshData}
                    disabled={isRefreshingData}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-amber-400/40 text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 font-bold text-xs rounded-lg uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingData ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingData ? 'SYNCING...' : 'REFRESH DATA'}</span>
                  </button>
                </div>
              </div>

              {/* Firestore Security Rules Permission Banner (Visible if rules are not published yet in Firebase Console) */}
              {getFirestorePermissionStatus().permissionDenied && (
                <div className="bg-amber-500/15 border-2 border-amber-500/50 rounded-xl p-4 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-sm text-amber-300 flex items-center gap-2">
                        <span>Firebase Firestore Rules Locked (Permission Denied)</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider">
                          Action Required
                        </span>
                      </div>
                      <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                        Data is saving locally on your browser, but cannot sync between different devices or live visitors until you paste and publish the security rules in Firebase Console.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => setShowFirestoreRulesModal(true)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow cursor-pointer transition-colors"
                    >
                      View Fix (1-Min Guide)
                    </button>
                    <button
                      type="button"
                      onClick={handleRefreshData}
                      disabled={isRefreshingData}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-lg shadow cursor-pointer transition-colors"
                    >
                      {isRefreshingData ? 'Checking...' : 'Re-check Connection'}
                    </button>
                  </div>
                </div>
              )}

              {/* 4 Top Metric Cards (Exact Gradient Colors and Layout) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* 1. TOTAL CUSTOMERS (Green Gradient) */}
                <div className="bg-gradient-to-r from-[#22C55E] to-[#16A34A] rounded-xl p-5 text-white shadow-md flex items-center justify-between relative overflow-hidden">
                  <div>
                    <div className="text-3xl font-black tracking-tight">{totalCustomersCount}</div>
                    <div className="text-xs font-extrabold uppercase tracking-wider mt-1 text-emerald-100">
                      TOTAL CUSTOMERS
                    </div>
                  </div>
                  <div className="w-13 h-13 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                {/* 2. ACTIVE SELLERS (Sky Blue Gradient) */}
                <div className="bg-gradient-to-r from-[#38BDF8] to-[#0284C7] rounded-xl p-5 text-white shadow-md flex items-center justify-between relative overflow-hidden">
                  <div>
                    <div className="text-3xl font-black tracking-tight">{activeSellersCount}</div>
                    <div className="text-xs font-extrabold uppercase tracking-wider mt-1 text-sky-100">
                      ACTIVE SELLERS
                    </div>
                  </div>
                  <div className="w-13 h-13 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                </div>

                {/* 3. TOTAL ORDERS (Orange Gradient) */}
                <div className="bg-gradient-to-r from-[#FB923C] to-[#EA580C] rounded-xl p-5 text-white shadow-md flex items-center justify-between relative overflow-hidden">
                  <div>
                    <div className="text-3xl font-black tracking-tight">{totalOrdersCount}</div>
                    <div className="text-xs font-extrabold uppercase tracking-wider mt-1 text-orange-100">
                      TOTAL ORDERS
                    </div>
                  </div>
                  <div className="w-13 h-13 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                </div>

                {/* 4. TOTAL REVENUE (Light Green / Emerald Gradient) */}
                <div className="bg-gradient-to-r from-[#4ADE80] to-[#16A34A] rounded-xl p-5 text-white shadow-md flex items-center justify-between relative overflow-hidden">
                  <div>
                    <div className="text-3xl font-black tracking-tight">
                      ${totalPlatformGMV.toFixed(2)}
                    </div>
                    <div className="text-xs font-extrabold uppercase tracking-wider mt-1 text-emerald-100">
                      TOTAL REVENUE
                    </div>
                  </div>
                  <div className="w-13 h-13 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* ========================================================================= */}
              {/* SECTION: NEW SELLER REGISTRATIONS (AWAITING ADMIN APPROVAL)               */}
              {/* High-visibility section right on the main dashboard front page.           */}
              {/* Visible until approved or rejected; once approved, disappears immediately */}
              {/* ========================================================================= */}
              <div id="admin-pending-sellers-section" className="space-y-4">
                {/* Section Header */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3.5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                      pendingSellers.length > 0
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-lg shadow-amber-500/10'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                          New Seller Registrations
                        </h2>
                        {pendingSellers.length > 0 ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                            <span>{pendingSellers.length} Awaiting Your Approval</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>All Caught Up • 0 Pending</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Newly registered stores appear right here on your main dashboard until approved or rejected. Approving activates their merchant portal immediately.
                      </p>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                    {pendingSellers.length > 0 && (
                      <div className="relative w-full sm:w-56">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={pendingSellerSearch}
                          onChange={(e) => setPendingSellerSearch(e.target.value)}
                          placeholder="Search pending sellers..."
                          className="w-full bg-slate-950 border border-slate-700/80 focus:border-amber-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('seller-profiles')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700/80 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>All Stores ({sellers.length})</span>
                    </button>
                  </div>
                </div>

                {/* Empty State: When 0 pending sellers */}
                {pendingSellers.length === 0 && (
                  <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="max-w-md space-y-1">
                      <h3 className="text-sm sm:text-base font-extrabold text-white">
                        No Pending Seller Registrations
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        All store applications have been processed. When a new seller registers on the platform, their details, credentials, and verification documents will appear here instantly for your review.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('seller-profiles')}
                      className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Store className="w-3.5 h-3.5 text-[#0284C7]" />
                      <span>View Active Sellers ({approvedSellers.length})</span>
                    </button>
                  </div>
                )}

                {/* List of Pending Sellers */}
                {pendingSellers.length > 0 && (
                  <div className="space-y-4">
                    {filteredPendingSellers.length === 0 ? (
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-400">
                        No pending sellers match "{pendingSellerSearch}". Try clearing your search.
                      </div>
                    ) : (
                      filteredPendingSellers.map((seller) => {
                        const sellerCreatedDate = seller.joinedDate
                          ? new Date(seller.joinedDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Recent Application';

                        const kycFront = seller.kycFrontImageUrl || seller.frontImage || seller.kycDocuments?.frontImageUrl;
                        const kycBack = seller.kycBackImageUrl || seller.backImage || seller.kycDocuments?.backImageUrl;
                        const docType = seller.kycDocumentType || seller.documentType || seller.kycDocuments?.documentType || 'ID Card';
                        const isPassRevealed = !!revealedPasswords[seller.id];

                        return (
                          <div
                            key={seller.id}
                            className="bg-slate-900 border-2 border-amber-500/40 hover:border-amber-500/70 rounded-2xl p-5 sm:p-6 shadow-xl transition-all space-y-4 relative overflow-hidden"
                          >
                            {/* Accent Glow Strip */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>

                            {/* Top Details Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                              <div className="flex items-center gap-3.5">
                                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white font-black text-xl flex items-center justify-center shadow-md shrink-0">
                                  {(seller.shopName || seller.sellerName || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className="flex items-center gap-1.5 font-mono text-base sm:text-lg font-black text-sky-400 tracking-tight">
                                      <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                                      <span className="select-all">{seller.email}</span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                                      ● Pending Approval
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                                    <span className="text-slate-200 font-semibold">
                                      {seller.shopName || 'Store'} • {seller.sellerName || 'Merchant'}
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1 text-slate-400">
                                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Applied: {sellerCreatedDate}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-start sm:self-center">
                                <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                                  ID: {seller.id.slice(0, 12)}
                                </span>
                              </div>
                            </div>

                            {/* Middle Information Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                              {/* Contact Information */}
                              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-[#38BDF8]" />
                                  <span>Contact Details</span>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-slate-200">
                                    <span className="text-slate-400">Email:</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (navigator?.clipboard) {
                                          navigator.clipboard.writeText(seller.email);
                                          triggerToast('Email copied to clipboard!');
                                        }
                                      }}
                                      className="font-medium text-white hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
                                      title="Copy email"
                                    >
                                      <span>{seller.email}</span>
                                      <Copy className="w-3 h-3 text-slate-500" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-200">
                                    <span className="text-slate-400">Phone:</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (navigator?.clipboard && seller.phone) {
                                          navigator.clipboard.writeText(seller.phone);
                                          triggerToast('Phone number copied to clipboard!');
                                        }
                                      }}
                                      className="font-medium text-white hover:text-amber-400 transition flex items-center gap-1 cursor-pointer"
                                      title="Copy phone"
                                    >
                                      <span>{seller.phone || 'N/A'}</span>
                                      <Copy className="w-3 h-3 text-slate-500" />
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-200">
                                    <span className="text-slate-400">Location:</span>
                                    <span className="text-slate-300">
                                      {seller.city ? `${seller.city}, ${seller.country || 'USA'}` : 'Online Store'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Credentials & Payout Details */}
                              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Credentials & Payout</span>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Password:</span>
                                    <div className="flex items-center gap-1.5 font-mono text-xs">
                                      <span className="text-amber-300 font-bold">
                                        {isPassRevealed ? (seller.password || 'Not Set') : '••••••••••••'}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => togglePasswordVisibility(seller.id)}
                                        className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                                        title={isPassRevealed ? 'Hide Password' : 'Show Password'}
                                      >
                                        {isPassRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                      </button>
                                      {seller.password && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(seller.password!);
                                            triggerToast('Password copied to clipboard!');
                                          }}
                                          className="p-1 text-slate-400 hover:text-amber-300 rounded transition cursor-pointer"
                                          title="Copy Password"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-200">
                                    <span className="text-slate-400">Method:</span>
                                    <span className="text-slate-300 font-semibold">{seller.withdrawalMethod || 'Bank Transfer'}</span>
                                  </div>
                                  <div className="flex items-center justify-between text-slate-200">
                                    <span className="text-slate-400">Details:</span>
                                    <span className="text-slate-300 truncate max-w-[140px]" title={seller.payoutDetails}>
                                      {seller.payoutDetails || 'Auto-connected'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* KYC Documents Preview */}
                              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3.5 space-y-2 sm:col-span-2 lg:col-span-1">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>KYC Verification</span>
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                    {docType}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {kycFront ? (
                                    <div
                                      onClick={() => {
                                        setKycInspectSeller(seller);
                                        setKycInspectSide('front');
                                      }}
                                      className="flex-1 group relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 cursor-pointer aspect-video flex items-center justify-center"
                                      title="Click to view Front ID"
                                    >
                                      <img
                                        src={kycFront}
                                        alt="Front KYC"
                                        className="w-full h-full object-cover group-hover:scale-105 transition"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white gap-1 text-[10px] font-bold">
                                        <ZoomIn className="w-3 h-3" />
                                        <span>Front</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex-1 bg-slate-900 rounded-lg p-2 text-center text-[10px] text-slate-500 border border-slate-800">
                                      Front Attached
                                    </div>
                                  )}

                                  {kycBack ? (
                                    <div
                                      onClick={() => {
                                        setKycInspectSeller(seller);
                                        setKycInspectSide('back');
                                      }}
                                      className="flex-1 group relative rounded-lg overflow-hidden border border-slate-700 bg-slate-900 cursor-pointer aspect-video flex items-center justify-center"
                                      title="Click to view Back ID"
                                    >
                                      <img
                                        src={kycBack}
                                        alt="Back KYC"
                                        className="w-full h-full object-cover group-hover:scale-105 transition"
                                      />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white gap-1 text-[10px] font-bold">
                                        <ZoomIn className="w-3 h-3" />
                                        <span>Back</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex-1 bg-slate-900 rounded-lg p-2 text-center text-[10px] text-slate-500 border border-slate-800">
                                      Back Attached
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons Toolbar */}
                            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                {/* APPROVE BUTTON: Green, highly visible, immediately disappears upon click */}
                                <button
                                  type="button"
                                  onClick={() => handleApproveSeller(seller)}
                                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-102 active:scale-98 transition-all cursor-pointer"
                                  title="Approve and activate this store"
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                  <span>Approve & Activate Store</span>
                                </button>

                                {/* REJECT BUTTON: Red, opens rejection modal */}
                                <button
                                  type="button"
                                  onClick={() => handleRejectSeller(seller)}
                                  className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                                  title="Reject this seller application"
                                >
                                  <X className="w-4 h-4 stroke-[2.5]" />
                                  <span>Reject Application</span>
                                </button>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Inspect KYC Lightbox */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setKycInspectSeller(seller);
                                    setKycInspectSide('both');
                                  }}
                                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-sky-400 border border-sky-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <ZoomIn className="w-3.5 h-3.5" />
                                  <span>Inspect Documents</span>
                                </button>

                                {/* Start Live Chat */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleStartChatWithSeller(seller);
                                    setActiveTab('conversations');
                                  }}
                                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Chat</span>
                                </button>

                                {/* Full Profile */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedSellerDetail(seller)}
                                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Full Profile</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Website Footer Contacts Quick Action Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                      <span>Website Footer Contacts & Details</span>
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                        Admin Editable
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Change the official phone number, support email, physical store address, and WhatsApp contact shown in the footer anytime.
                    </p>
                  </div>
                </div>
                <button
                  id="admin-change-footer-contacts-btn"
                  type="button"
                  onClick={() => setActiveTab('store-contacts')}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shrink-0 active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  <span>Change Footer Contacts</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PRODUCTS CATALOG                                   */}
          {/* ========================================================= */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-black text-slate-900">Products Catalog Management</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0284C7]/10 text-[#0284C7] border border-[#0284C7]/20">
                      {products.length} Products
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Control global product listings, pricing, and admin commission rates
                  </p>
                </div>
                <button
                  onClick={handleOpenNewProduct}
                  className="w-full sm:w-auto justify-center px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Product</span>
                </button>
              </div>

              {/* Search & Filter */}
              <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search products by title, SKU, or category..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full text-xs font-semibold text-black placeholder:text-slate-400 bg-transparent focus:outline-none"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                />
              </div>

              {/* Products Table (Desktop) */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Price</th>
                        <th className="py-3 px-4">Commission</th>
                        <th className="py-3 px-4">Stock</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products
                        .filter(
                          (p) =>
                            p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                            (p.categoryName || '').toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                                  alt={prod.name}
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                                />
                                <div>
                                  <div className="font-bold text-slate-900 line-clamp-1">{prod.name}</div>
                                  <div className="text-[11px] text-slate-400">ID: {prod.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{prod.sku}</td>
                            <td className="py-3 px-4 text-slate-600">{prod.categoryName || 'General'}</td>
                            <td className="py-3 px-4 font-bold text-slate-900">${prod.price.toFixed(2)}</td>
                            <td className="py-3 px-4 font-bold text-emerald-600">
                              {prod.customAdminCommissionPct || settings.globalCommissionPct}%
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  prod.stock > 10
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {prod.stock} in stock
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                {prod.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleOpenEditProduct(prod)}
                                  className="p-1.5 text-slate-500 hover:text-[#0284C7] rounded hover:bg-slate-100 cursor-pointer"
                                  title="Edit Product"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
                                      deleteProduct(prod.id);
                                      triggerToast(`Deleted product ${prod.name}`);
                                    }
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded hover:bg-slate-100 cursor-pointer"
                                  title="Delete Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Products Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {products
                    .filter(
                      (p) =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                        (p.categoryName || '').toLowerCase().includes(productSearch.toLowerCase())
                    )
                    .map((prod) => (
                      <div key={prod.id} className="p-3.5 space-y-3 bg-white">
                        <div className="flex gap-3">
                          <img
                            src={prod.images[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'}
                            alt={prod.name}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="font-extrabold text-xs text-slate-900 line-clamp-2">{prod.name}</div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span>SKU: {prod.sku}</span>
                              <span>•</span>
                              <span>{prod.categoryName || 'General'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-slate-900">${prod.price.toFixed(2)}</span>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {prod.customAdminCommissionPct || settings.globalCommissionPct}% Comm.
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                prod.stock > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {prod.stock} in stock
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              {prod.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="px-3 py-1.5 text-xs font-bold text-[#0284C7] bg-sky-50 active:bg-sky-100 rounded-lg flex items-center gap-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${prod.name}?`)) {
                                  deleteProduct(prod.id);
                                  triggerToast(`Deleted product ${prod.name}`);
                                }
                              }}
                              className="p-1.5 text-rose-600 bg-rose-50 active:bg-rose-100 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SELLERS PRODUCTS                                   */}
          {/* ========================================================= */}
          {activeTab === 'sellers-products' && (() => {
            const allSellerEmails = Array.from(
              new Set([
                ...sellers.map((s) => s.email).filter(Boolean),
                ...users.filter((u) => u.role === 'SELLER').map((u) => u.email).filter(Boolean),
              ])
            );

            const rawTarget = (sellerSearchQuery.trim() || selectedSellerEmail || '').toLowerCase();
            const currentSellerObj = sellers.find(
              (s) =>
                s.email?.toLowerCase() === rawTarget ||
                s.userId?.toLowerCase() === rawTarget ||
                s.id?.toLowerCase() === rawTarget ||
                (rawTarget.length > 2 && (s.shopName?.toLowerCase().includes(rawTarget) || s.sellerName?.toLowerCase().includes(rawTarget)))
            );

            // Filter products matching seller or search query
            const activeSellerProducts = products.filter((p) => {
              if (!rawTarget) return true;

              if (currentSellerObj) {
                const sId = currentSellerObj.id;
                const uId = currentSellerObj.userId;
                const email = currentSellerObj.email?.toLowerCase();
                const isAssociated =
                  (sId && p.associatedSellerIds?.includes(sId)) ||
                  (uId && p.associatedSellerIds?.includes(uId)) ||
                  (email && p.associatedSellerIds?.some((x) => x.toLowerCase() === email)) ||
                  (currentSellerObj.selectedProductIds && currentSellerObj.selectedProductIds.includes(p.id)) ||
                  (p.sellerId && (p.sellerId === sId || p.sellerId === uId));
                return Boolean(isAssociated);
              }

              // General search fallback: matching product name, category, or seller tags
              return (
                p.name.toLowerCase().includes(rawTarget) ||
                (p.category || '').toLowerCase().includes(rawTarget) ||
                (p.sku || '').toLowerCase().includes(rawTarget) ||
                Boolean(p.associatedSellerIds?.some((id) => id.toLowerCase().includes(rawTarget)))
              );
            });

            // If none explicitly tagged, show empty list or active products
            const displayedSellerProducts = activeSellerProducts;
            const totalSellerProductsCount = displayedSellerProducts.length;
            const totalPages = Math.max(1, Math.ceil(totalSellerProductsCount / sellerProductsPerPage));
            const currentPage = Math.min(sellerProductsPage, totalPages);
            const startIndex = (currentPage - 1) * sellerProductsPerPage;
            const endIndex = Math.min(startIndex + sellerProductsPerPage, totalSellerProductsCount);
            const paginatedSellerProducts = displayedSellerProducts.slice(startIndex, endIndex);

            // Admin Assigned Orders for this seller (latest/newest at the very top)
            const activeSellerAssignedOrders = orders
              .filter((o) => {
                if (!rawTarget) return true;
                const sellerId = currentSellerObj?.id || '';
                const isAssigned =
                  (sellerId && o.assignedSellerId === sellerId) ||
                  (o.assignedSellerName && currentSellerObj?.shopName && o.assignedSellerName.toLowerCase().includes(currentSellerObj.shopName.toLowerCase()));
                return isAssigned;
              })
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

            const sellerDisplayEmail = sellerSearchQuery.trim() || selectedSellerEmail;

            return (
              <div className="space-y-6">
                {/* Title and Top Sub-Nav */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sellers Products</h1>
                    <div className="mt-3 border-b border-slate-200 flex gap-6">
                      <button className="pb-2.5 font-bold text-sm text-[#0284C7] border-b-2 border-[#0284C7] flex items-center gap-1.5 cursor-pointer">
                        All Sellers Products
                      </button>
                    </div>
                  </div>

                  {/* Header Cart Button */}
                  <button
                    onClick={() => setIsCartOpen(true)}
                    className="self-start sm:self-auto flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-sky-50/80 border border-sky-300 text-[#0284C7] rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer group"
                  >
                    <div className="relative">
                      <ShoppingCart className="w-4 h-4 text-[#0284C7] group-hover:scale-110 transition-transform" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                          {cartCount}
                        </span>
                      )}
                    </div>
                    <span>Cart: ${cartSubtotal.toFixed(2)}</span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-extrabold">
                      {cartCount} {cartCount === 1 ? 'item' : 'items'}
                    </span>
                  </button>
                </div>

                {/* Seller Filter Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                    {/* Select Seller (strictly A to Z) */}
                    <div className="flex-1">
                      <label className="text-xs font-bold text-[#0284C7] block mb-1.5 flex items-center justify-between">
                        <span>Select Seller (A to Z)</span>
                        <span className="text-[10px] font-semibold text-slate-400">Sorted A–Z</span>
                      </label>
                      <select
                        value={selectedSellerEmail}
                        onChange={(e) => {
                          setSelectedSellerEmail(e.target.value);
                          setSellerSearchQuery('');
                          setSellerProductsPage(1);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                      >
                        <option value="">-- All Sellers / Select Seller --</option>
                        {[...sellers]
                          .sort((a, b) => {
                            const nameA = (a.shopName || a.sellerName || a.email || '').trim().toLowerCase();
                            const nameB = (b.shopName || b.sellerName || b.email || '').trim().toLowerCase();
                            return nameA.localeCompare(nameB);
                          })
                          .map((s) => {
                            const count = products.filter(
                              (p) =>
                                p.associatedSellerIds?.includes(s.id) ||
                                (s.userId && p.associatedSellerIds?.includes(s.userId)) ||
                                (s.selectedProductIds && s.selectedProductIds.includes(p.id)) ||
                                (s.email && p.associatedSellerIds?.some((x) => x.toLowerCase() === s.email?.toLowerCase()))
                            ).length;
                            return (
                              <option key={s.id} value={s.email || s.id}>
                                {s.shopName || s.sellerName} ({s.email || s.id}) — {count} products
                              </option>
                            );
                          })}
                      </select>
                    </div>

                    {/* Search by Seller Email / Name (strictly Gmail A to Z suggestions) */}
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                        <span>Search by Seller Gmail / Name</span>
                        <span className="text-[10px] font-semibold text-sky-600">Gmail A–Z</span>
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          list="seller-products-search-suggestions"
                          placeholder="Type seller Gmail or name (A to Z)..."
                          value={sellerSearchQuery}
                          onChange={(e) => {
                            setSellerSearchQuery(e.target.value);
                            setSellerProductsPage(1);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2.5 text-xs font-semibold text-black placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                          style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                        />
                        {sellerSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setSellerSearchQuery('');
                              setSellerProductsPage(1);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <datalist id="seller-products-search-suggestions">
                          {[...sellers]
                            .sort((a, b) => {
                              const emailA = (a.email || '').trim().toLowerCase();
                              const emailB = (b.email || '').trim().toLowerCase();
                              return emailA.localeCompare(emailB);
                            })
                            .map((s) => (
                              <option key={s.id} value={s.email || s.id}>
                                {s.email} — {s.shopName || s.sellerName}
                              </option>
                            ))}
                        </datalist>
                      </div>
                    </div>

                    {/* REFRESH Button */}
                    <div className="sm:self-end">
                      <button
                        onClick={handleRefreshSellerProducts}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 border border-sky-400 text-[#0284C7] bg-sky-50/50 hover:bg-sky-100/70 rounded-xl text-xs font-bold uppercase transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSellers ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Products Grid - 4 per row */}
                  <div className="mt-6 pt-5 border-t border-slate-100">
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3">
                      {paginatedSellerProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-150 group"
                        >
                          <div>
                            {/* Product Image - Compact */}
                            <div className="h-28 sm:h-32 w-full flex items-center justify-center bg-slate-50/70 rounded-lg mb-2 overflow-hidden p-1.5 border border-slate-100/80">
                              <img
                                src={prod.images[0]}
                                alt={prod.name}
                                className="h-full w-full object-contain rounded-md group-hover:scale-105 transition-transform duration-200"
                              />
                            </div>

                            {/* Product Info */}
                            <h3 className="font-bold text-xs text-slate-900 line-clamp-1 leading-snug">
                              {prod.name}
                            </h3>
                            <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-tight">
                              {prod.description || 'Verified seller product item'}
                            </p>

                            {/* Price */}
                            <div className="text-sky-600 font-extrabold text-xs sm:text-sm mt-1.5">
                              ${prod.price.toFixed(2)}
                            </div>

                            {/* Seller line */}
                            <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                              Seller: {sellerDisplayEmail}
                            </div>
                          </div>

                          {/* Card Action Buttons */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            <button
                              onClick={() => handleRemoveProductFromSeller(prod.id)}
                              className="px-2 py-0.5 border border-red-200 text-red-500 hover:bg-red-50 rounded text-[10px] font-bold uppercase transition-colors"
                            >
                              Remove
                            </button>
                            <button
                              onClick={() => {
                                addToCart(prod, 1);
                                setIsCartOpen(true);
                                triggerToast(`Added "${prod.name}" to cart!`);
                              }}
                              className="px-2.5 py-1 bg-[#0284C7] hover:bg-sky-600 text-white rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer active:scale-95 shadow-xs"
                            >
                              <ShoppingCart className="w-3 h-3" />
                              <span>Cart</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Row */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <span>Rows per page:</span>
                        <select
                          value={sellerProductsPerPage}
                          onChange={(e) => {
                            setSellerProductsPerPage(Number(e.target.value));
                            setSellerProductsPage(1);
                          }}
                          className="border border-slate-200 rounded-lg px-2 py-1 bg-white text-xs text-slate-700 focus:outline-none focus:border-sky-500"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-4">
                        <span>
                          {totalSellerProductsCount > 0 ? startIndex + 1 : 0}–{endIndex} of {totalSellerProductsCount}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSellerProductsPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSellerProductsPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-status line */}
                <div className="text-xs text-slate-500 font-medium px-1">
                  {totalSellerProductsCount} products from seller &quot;{sellerDisplayEmail}&quot; (Last updated: {lastRefreshedTime})
                </div>

                {/* ======================================================= */}
                {/* ADMIN ASSIGNED ORDERS SECTION                           */}
                {/* ======================================================= */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <button className="font-bold text-sm text-[#0284C7] border-b-2 border-[#0284C7] pb-2 -mb-2 flex items-center gap-1.5">
                      Admin Assigned Orders
                    </button>
                    <button
                      onClick={handleRefreshAssignedOrders}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 border border-sky-400 text-[#0284C7] bg-sky-50/60 hover:bg-sky-100 rounded-xl text-xs font-bold uppercase transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin' : ''}`} />
                      <span>Refresh Orders</span>
                    </button>
                  </div>

                  {/* Orders Table */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Desktop Table View */}
                    <div className="overflow-x-auto hidden md:block">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            <th className="py-3 px-4">Order ID</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Seller</th>
                            <th className="py-3 px-4">Total</th>
                            <th className="py-3 px-4">Profit</th>
                            <th className="py-3 px-4">Status</th>
                            <th className="py-3 px-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {activeSellerAssignedOrders.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                                No assigned orders found for this seller yet.
                              </td>
                            </tr>
                          ) : (
                            activeSellerAssignedOrders.map((order) => (
                              <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                                  {order.id}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                                  {formatOrderDateTime(order.createdAt)}
                                </td>
                                <td className="py-3.5 px-4 font-mono text-slate-700">
                                  {sellerDisplayEmail}
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  ${order.totalAmount.toFixed(2)}
                                </td>
                                <td className="py-3.5 px-4 font-bold text-emerald-600">
                                  ${(order.totalSellerEarning || (order.totalAmount * 0.21)).toFixed(2)}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 lowercase">
                                    {(order.status || '').toLowerCase()}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => setViewingAssignedOrder(order)}
                                      className="p-1 text-[#0284C7] hover:bg-sky-50 rounded transition-colors cursor-pointer"
                                      title="View Order Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingAssignedOrder(order);
                                        setOrderStatusChangeVal(order.status);
                                        setOrderStatusChangeNote('');
                                      }}
                                      className="p-1 text-sky-500 hover:bg-sky-50 rounded transition-colors cursor-pointer"
                                      title="Edit Order Status"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAssignedOrder(order.id)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                      title="Delete Order"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Cards View */}
                    <div className="md:hidden divide-y divide-slate-100">
                      {activeSellerAssignedOrders.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No assigned orders found for this seller yet.
                        </div>
                      ) : (
                        activeSellerAssignedOrders.map((order) => (
                          <div key={order.id} className="p-3.5 space-y-2.5 bg-white">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-mono font-bold text-xs text-[#0284C7]">{order.id}</span>
                                <div className="text-[11px] text-slate-400 mt-0.5">{formatOrderDateTime(order.createdAt)}</div>
                              </div>
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 capitalize">
                                {order.status?.toLowerCase() || 'pending'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                              <div>
                                <span className="text-slate-400 text-[10px]">Seller</span>
                                <div className="font-mono text-slate-700 font-medium truncate max-w-[150px]">{sellerDisplayEmail}</div>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 text-[10px]">Total / Profit</span>
                                <div className="font-bold text-slate-900">
                                  ${order.totalAmount.toFixed(2)}{' '}
                                  <span className="text-emerald-600 font-semibold text-[11px]">
                                    (+${(order.totalSellerEarning || (order.totalAmount * 0.21)).toFixed(2)})
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Mobile Actions */}
                            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                              <button
                                onClick={() => setViewingAssignedOrder(order)}
                                className="px-3 py-1.5 bg-sky-50 text-[#0284C7] rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAssignedOrder(order);
                                  setOrderStatusChangeVal(order.status);
                                  setOrderStatusChangeNote('');
                                }}
                                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Status</span>
                              </button>
                              <button
                                onClick={() => handleDeleteAssignedOrder(order.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                title="Delete Order"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB: STORE MAIN PAGE (TITLE, PRICE, IMAGE URL, CATEGORY)  */}
          {/* ========================================================= */}
          {activeTab === 'store-main-page' && (
            <StoreMainPageManager onNavigate={onNavigate} />
          )}

          {/* ========================================================= */}
          {/* TAB: STORE CONTACTS & FOOTER SETTINGS                     */}
          {/* ========================================================= */}
          {activeTab === 'store-contacts' && (
            <StoreContactsManager onNavigate={onNavigate} />
          )}

          {/* ========================================================= */}
          {/* TAB: CUSTOMER ORDERS (STOREFRONT READ-ONLY DUMMY VIEW)    */}
          {/* ========================================================= */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>Customer Storefront Orders</span>
                    <span className="text-xs bg-sky-100 text-[#0284C7] px-2.5 py-0.5 rounded-full font-bold">
                      {orders.length} Received
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live feed of orders placed by storefront customers (Read-only dummy view — manual orders are dispatched directly to sellers via Sellers Products)
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Customer Feed Active</span>
                </div>
              </div>

              {/* Informational Banner */}
              <div className="bg-sky-50/80 border border-sky-200/80 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center shrink-0 mt-0.5">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-sky-950">
                    Customer Incoming Orders (Informational Display)
                  </div>
                  <p className="text-sky-800 leading-relaxed font-medium">
                    This table logs all customer-placed purchases from the storefront. Click actions are disabled as you assign and send orders manually to seller accounts directly through the <strong>Sellers Products</strong> catalog and <strong>Admin Assigned Orders</strong> cart.
                  </p>
                </div>
              </div>

              {/* Orders Search & Quick Stats */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search customer orders by order #, customer name, email, address, or product..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:bg-white focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] rounded-xl text-xs text-black font-semibold placeholder:text-slate-400 outline-none transition-all"
                      style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                    />
                    {orderSearch && (
                      <button
                        type="button"
                        onClick={() => setOrderSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Summary Pill */}
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 shrink-0">
                    <span className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                      Total Customer Sales: <strong className="text-slate-900 font-black">${orders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Orders Table (Read-Only Dummy View) */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-left text-xs border-collapse select-text">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-3.5 px-4">Order ID</th>
                        <th className="py-3.5 px-4">Customer & Contact</th>
                        <th className="py-3.5 px-4 min-w-[200px]">Ordered Items</th>
                        <th className="py-3.5 px-4">Total Amount</th>
                        <th className="py-3.5 px-4">Date Placed</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-center">Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const filteredCustomerOrders = orders
                          .filter((o) => {
                            if (!orderSearch.trim()) return true;
                            const q = orderSearch.toLowerCase().trim();
                            const orderNumMatch = (o.orderNumber || '').toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
                            const custNameMatch = (o.shippingAddress?.fullName || '').toLowerCase().includes(q);
                            const custEmailMatch = (o.customerEmail || '').toLowerCase().includes(q);
                            const cityMatch = (o.shippingAddress?.city || '').toLowerCase().includes(q);
                            const streetMatch = (o.shippingAddress?.street || '').toLowerCase().includes(q);
                            const itemMatch = o.items?.some((it) => it.productName.toLowerCase().includes(q));
                            return orderNumMatch || custNameMatch || custEmailMatch || cityMatch || streetMatch || itemMatch;
                          })
                          .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

                        if (filteredCustomerOrders.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="py-12 text-center text-slate-400">
                                <div className="space-y-2">
                                  <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                                  <div className="text-sm font-bold text-slate-700">No customer orders found</div>
                                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    When customers place orders on the storefront, they will automatically appear in this feed.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return filteredCustomerOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50/50 transition-colors cursor-default"
                          >
                            {/* 1. Order Number */}
                            <td className="py-3.5 px-4 align-top font-mono font-bold text-slate-900">
                              <span className="text-[#0284C7]">#{order.orderNumber}</span>
                              <div className="text-[10px] text-slate-400 font-normal font-mono">
                                ID: {order.id.slice(0, 12)}...
                              </div>
                            </td>

                            {/* 2. Customer & Contact */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800">
                                  {order.shippingAddress?.fullName || 'Store Customer'}
                                </div>
                                {order.customerEmail && (
                                  <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{order.customerEmail}</span>
                                  </div>
                                )}
                                <div className="text-[11px] text-slate-500">
                                  {order.shippingAddress?.street}, {order.shippingAddress?.city} ({order.shippingAddress?.state || order.shippingAddress?.country || 'Standard'})
                                </div>
                              </div>
                            </td>

                            {/* 3. Ordered Items List */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="space-y-1.5 max-w-xs">
                                {order.items && order.items.length > 0 ? (
                                  order.items.map((it, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-lg p-1.5"
                                    >
                                      {it.productImage && (
                                        <img
                                          src={it.productImage}
                                          alt={it.productName}
                                          className="w-7 h-7 object-cover rounded border border-slate-200 shrink-0"
                                        />
                                      )}
                                      <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-slate-800 truncate text-[11px]">
                                          {it.productName}
                                        </div>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                          Qty: {it.quantity} • ${(it.unitPrice || it.totalPrice / (it.quantity || 1)).toFixed(2)} ea
                                        </div>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-slate-400 italic text-[11px]">No item details</span>
                                )}
                              </div>
                            </td>

                            {/* 4. Total Amount */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="font-black text-slate-900 text-sm">
                                ${order.totalAmount.toFixed(2)}
                              </div>
                              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                                {order.paymentMethod || 'Online Checkout'}
                              </div>
                            </td>

                            {/* 5. Date & Time */}
                            <td className="py-3.5 px-4 align-top text-slate-600 whitespace-nowrap">
                              <div className="font-semibold text-slate-800 text-xs">
                                {formatOrderDateTime(order.createdAt)}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Timestamp verified
                              </div>
                            </td>

                            {/* 6. Status Badge */}
                            <td className="py-3.5 px-4 align-top">
                              <StatusBadge status={order.status} />
                            </td>

                            {/* 7. Read-Only Indicator Badge */}
                            <td className="py-3.5 px-4 align-top text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/90 text-slate-500 text-[11px] font-semibold select-none">
                                <span>Read-Only</span>
                              </span>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {(() => {
                    const filteredCustomerOrders = orders
                      .filter((o) => {
                        if (!orderSearch.trim()) return true;
                        const q = orderSearch.toLowerCase().trim();
                        const orderNumMatch = (o.orderNumber || '').toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
                        const custNameMatch = (o.shippingAddress?.fullName || '').toLowerCase().includes(q);
                        const custEmailMatch = (o.customerEmail || '').toLowerCase().includes(q);
                        const cityMatch = (o.shippingAddress?.city || '').toLowerCase().includes(q);
                        const streetMatch = (o.shippingAddress?.street || '').toLowerCase().includes(q);
                        const itemMatch = o.items?.some((it) => it.productName.toLowerCase().includes(q));
                        return orderNumMatch || custNameMatch || custEmailMatch || cityMatch || streetMatch || itemMatch;
                      })
                      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

                    if (filteredCustomerOrders.length === 0) {
                      return (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No customer orders found.
                        </div>
                      );
                    }

                    return filteredCustomerOrders.map((order) => (
                      <div key={order.id} className="p-3.5 space-y-3 bg-white">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-mono font-bold text-sm text-[#0284C7]">
                              #{order.orderNumber}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono font-medium">
                              {formatOrderDateTime(order.createdAt)}
                            </div>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>

                        <div className="bg-slate-50 rounded-xl p-2.5 space-y-1 text-xs text-slate-700 border border-slate-200/60">
                          <div className="font-bold text-slate-900">{order.shippingAddress?.fullName || 'Store Customer'}</div>
                          {order.customerEmail && (
                            <div className="text-[11px] text-slate-500 font-mono truncate">{order.customerEmail}</div>
                          )}
                          <div className="text-[11px] text-slate-500">
                            {order.shippingAddress?.street}, {order.shippingAddress?.city}
                          </div>
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5">
                          {order.items?.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg border border-slate-100 bg-white">
                              {it.productImage && (
                                <img src={it.productImage} alt={it.productName} className="w-8 h-8 rounded object-cover shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-slate-900 truncate">{it.productName}</div>
                                <div className="text-[10px] text-slate-500 font-mono">Qty: {it.quantity} • ${(it.unitPrice || 0).toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                          <span className="text-xs text-slate-500 font-medium">{order.paymentMethod || 'Online Checkout'}</span>
                          <span className="font-black text-sm text-slate-900">${order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 6: MONEY WITHDRAW                                     */}
          {/* ========================================================= */}
          {activeTab === 'withdrawals' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>Money Withdraw Requests</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                    {withdrawals.length} total
                  </span>
                  {pendingWithdrawals.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      {pendingWithdrawals.length} pending
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={handleRefreshWithdrawals}
                  disabled={isRefreshingWithdrawals}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-60 self-start sm:self-auto"
                  title="Sync and refresh all withdrawal requests"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshingWithdrawals ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingWithdrawals ? 'Syncing...' : 'Sync Requests'}</span>
                </button>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  {/* Status Filter Buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                    {(['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'] as const).map((st) => {
                      const count =
                        st === 'ALL'
                          ? withdrawals.length
                          : withdrawals.filter((w) => w.status === st).length;
                      const isActive = withdrawalStatusFilter === st;

                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setWithdrawalStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                            isActive
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                          }`}
                        >
                          <span>{st === 'ALL' ? 'All Requests' : st}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Input */}
                  <div className="relative min-w-[260px] md:w-80">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={withdrawalSearch}
                      onChange={(e) => setWithdrawalSearch(e.target.value)}
                      placeholder="Search by Seller, Gmail, Account, ID..."
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:bg-white focus:border-[#EE4932] focus:ring-1 focus:ring-[#EE4932] rounded-xl text-xs text-black font-semibold placeholder:text-slate-400 outline-none transition-all"
                      style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                    />
                    {withdrawalSearch && (
                      <button
                        type="button"
                        onClick={() => setWithdrawalSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Withdrawals Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {/* Desktop Table View */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                        <th className="py-3.5 px-4">Seller</th>
                        <th className="py-3.5 px-4">Amount & Method</th>
                        <th className="py-3.5 px-4 min-w-[280px]">Payment Details</th>
                        <th className="py-3.5 px-4">Status & Date</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(() => {
                        const filteredWithdrawals = withdrawals
                          .filter((w) => {
                            // Status Filter
                            if (withdrawalStatusFilter !== 'ALL' && w.status !== withdrawalStatusFilter) {
                              return false;
                            }
                            // Search Filter
                            if (withdrawalSearch.trim()) {
                              const query = withdrawalSearch.toLowerCase().trim();
                              const s = sellers.find((sel) => sel.id === w.sellerId);
                              const sellerNameMatch = (s?.sellerName || w.sellerName || '').toLowerCase().includes(query);
                              const shopNameMatch = (s?.shopName || '').toLowerCase().includes(query);
                              const emailMatch = (w.sellerEmail || s?.email || '').toLowerCase().includes(query);
                              const idMatch = (w.id || '').toLowerCase().includes(query);
                              const accountMatch = (w.payoutAccount || w.payoutDetails || '').toLowerCase().includes(query);
                              const methodMatch = (w.method || '').toLowerCase().includes(query);
                              return sellerNameMatch || shopNameMatch || emailMatch || idMatch || accountMatch || methodMatch;
                            }
                            return true;
                          })
                          .sort(
                            (a, b) =>
                              new Date(b.requestedAt || (b as any).createdAt || 0).getTime() -
                              new Date(a.requestedAt || (a as any).createdAt || 0).getTime()
                          );

                        if (filteredWithdrawals.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400">
                                <div className="space-y-2">
                                  <Landmark className="w-8 h-8 text-slate-300 mx-auto" />
                                  <div className="text-sm font-bold text-slate-700">No withdrawal records match your criteria</div>
                                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                                    {withdrawalSearch || withdrawalStatusFilter !== 'ALL'
                                      ? 'Try resetting search or switching status filter tabs.'
                                      : 'When sellers request cash payouts, they will be listed here with complete payment details.'}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          );
                        }

                        return filteredWithdrawals.map((w) => {
                          const s = sellers.find((sel) => sel.id === w.sellerId);
                          const sellerEmail = w.sellerEmail || s?.email || 'N/A';
                          const sellerDisplayName = s?.sellerName || w.sellerName || s?.shopName || 'Seller';
                          const paymentAccountText = w.payoutAccount || w.payoutDetails || 'No details provided';

                          return (
                            <tr key={w.id} className="hover:bg-slate-50/60 transition-colors">
                              {/* 1. Seller Gmail FIRST, then Name */}
                              <td className="py-4 px-4 align-middle">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-xs text-[#0284C7] font-mono font-bold">
                                    <Mail className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                                    <span className="select-all">{sellerEmail}</span>
                                  </div>
                                  <div className="font-semibold text-slate-800 text-[11px]">
                                    {sellerDisplayName}
                                  </div>
                                </div>
                              </td>

                              {/* 2. Amount & Method */}
                              <td className="py-4 px-4 align-middle">
                                <div className="space-y-1">
                                  <div className="text-sm font-black text-slate-900">
                                    ${w.amount.toFixed(2)}
                                  </div>
                                  <span
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  >
                                    <CreditCard className="w-2.5 h-2.5 shrink-0" />
                                    <span>{w.method}</span>
                                  </span>
                                </div>
                              </td>

                              {/* 3. Payment Details */}
                              <td className="py-4 px-4 align-middle">
                                <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                                  <div className="text-xs font-mono font-semibold text-slate-800 break-all select-all">
                                    {paymentAccountText}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyWithdrawalText(paymentAccountText, w.id)}
                                    className="p-1.5 bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-600 rounded-lg transition-colors cursor-pointer shrink-0 shadow-2xs"
                                    title="Copy payment details"
                                  >
                                    {copiedWithdrawalField === w.id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* 4. Status & Date */}
                              <td className="py-4 px-4 align-middle">
                                <div className="space-y-1">
                                  <div>
                                    <StatusBadge status={w.status} />
                                  </div>
                                  <div className="text-[11px] text-slate-500 font-medium">
                                    {new Date(w.requestedAt).toLocaleDateString()} at{' '}
                                    {new Date(w.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </td>

                              {/* 5. Actions */}
                              <td className="py-4 px-4 align-middle text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* 1. Paid Button */}
                                  {w.status === 'PAID' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-2xs select-none">
                                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Paid</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        markWithdrawalAsPaid(w.id, `TX-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
                                        triggerToast(`Withdrawal #${w.id} ($${w.amount.toFixed(2)}) marked as Paid!`);
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-2xs"
                                      title="Mark withdrawal as Paid / Disbursed"
                                    >
                                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Paid</span>
                                    </button>
                                  )}

                                  {/* 2. Reject Button */}
                                  {w.status === 'REJECTED' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-2xs select-none">
                                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Reject</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRejectingWithdrawalId(w.id);
                                        setRejectionReasonText('Account details verification failed');
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95 shadow-2xs"
                                      title="Reject withdrawal and refund balance to seller"
                                    >
                                      <X className="w-3.5 h-3.5 stroke-[2.5]" />
                                      <span>Reject</span>
                                    </button>
                                  )}

                                  {/* Delete Record Button */}
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmWithdrawalId(w.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-200 ml-1"
                                    title="Delete withdrawal record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View (Touch-Friendly for Sellers Payouts) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {(() => {
                    const filteredWithdrawals = withdrawals
                      .filter((w) => {
                        if (withdrawalStatusFilter !== 'ALL' && w.status !== withdrawalStatusFilter) {
                          return false;
                        }
                        if (withdrawalSearch.trim()) {
                          const query = withdrawalSearch.toLowerCase().trim();
                          const s = sellers.find((sel) => sel.id === w.sellerId);
                          const sellerNameMatch = (s?.sellerName || w.sellerName || '').toLowerCase().includes(query);
                          const shopNameMatch = (s?.shopName || '').toLowerCase().includes(query);
                          const emailMatch = (w.sellerEmail || s?.email || '').toLowerCase().includes(query);
                          const idMatch = (w.id || '').toLowerCase().includes(query);
                          const accountMatch = (w.payoutAccount || w.payoutDetails || '').toLowerCase().includes(query);
                          const methodMatch = (w.method || '').toLowerCase().includes(query);
                          return sellerNameMatch || shopNameMatch || emailMatch || idMatch || accountMatch || methodMatch;
                        }
                        return true;
                      })
                      .sort(
                        (a, b) =>
                          new Date(b.requestedAt || (b as any).createdAt || 0).getTime() -
                          new Date(a.requestedAt || (a as any).createdAt || 0).getTime()
                      );

                    if (filteredWithdrawals.length === 0) {
                      return (
                        <div className="p-6 text-center text-xs text-slate-400">
                          No withdrawal records match your criteria.
                        </div>
                      );
                    }

                    return filteredWithdrawals.map((w) => {
                      const s = sellers.find((sel) => sel.id === w.sellerId);
                      const sellerEmail = w.sellerEmail || s?.email || 'N/A';
                      const sellerDisplayName = s?.sellerName || w.sellerName || s?.shopName || 'Seller';
                      const paymentAccountText = w.payoutAccount || w.payoutDetails || 'No details provided';

                      return (
                        <div key={w.id} className="p-3.5 space-y-3 bg-white">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-bold text-xs text-[#0284C7] font-mono flex items-center gap-1">
                                <Mail className="w-3 h-3 text-[#0284C7] shrink-0" />
                                <span className="truncate max-w-[200px] select-all">{sellerEmail}</span>
                              </div>
                              <div className="font-semibold text-xs text-slate-800 mt-0.5">{sellerDisplayName}</div>
                            </div>
                            <StatusBadge status={w.status} />
                          </div>

                          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                            <div>
                              <div className="text-xs text-slate-500 font-medium">Requested Payout</div>
                              <div className="text-base font-black text-slate-900">${w.amount.toFixed(2)}</div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CreditCard className="w-3 h-3" />
                              <span>{w.method}</span>
                            </span>
                          </div>

                          {/* Payment Account Details Box with 1-tap Copy */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                            <div className="text-xs font-mono font-semibold text-slate-800 break-all select-all flex-1 min-w-0">
                              {paymentAccountText}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyWithdrawalText(paymentAccountText, w.id)}
                              className="p-2 bg-white hover:bg-slate-200/70 border border-slate-200 text-slate-600 rounded-lg shrink-0 shadow-2xs"
                              title="Copy"
                            >
                              {copiedWithdrawalField === w.id ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          <div className="text-[11px] text-slate-400">
                            Requested: {new Date(w.requestedAt).toLocaleDateString()} at {new Date(w.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>

                          {/* Mobile Action Buttons */}
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            {w.status === 'PAID' ? (
                              <span className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Paid</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  markWithdrawalAsPaid(w.id, `TX-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
                                  triggerToast(`Withdrawal #${w.id} ($${w.amount.toFixed(2)}) marked as Paid!`);
                                }}
                                className="flex-1 py-2 bg-emerald-600 active:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Paid</span>
                              </button>
                            )}

                            {w.status === 'REJECTED' ? (
                              <span className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1">
                                <X className="w-3.5 h-3.5" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingWithdrawalId(w.id);
                                  setRejectionReasonText('Account details verification failed');
                                }}
                                className="flex-1 py-2 bg-rose-50 text-rose-700 border border-rose-200 active:bg-rose-100 rounded-xl font-bold text-xs flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setDeleteConfirmWithdrawalId(w.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 7: CONVERSATIONS & SUPPORT CHAT                       */}
          {/* ========================================================= */}
          {activeTab === 'conversations' && (
            <div className="flex flex-col flex-1 min-h-0 h-full space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#0284C7]" />
                    Conversations & Seller Support Desk
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time communication with registered sellers showing live Gmail addresses, read status, and auto-dispatch
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
                    <button
                      onClick={handleToggleSound}
                      className="flex items-center gap-1.5 font-bold cursor-pointer hover:text-[#0284C7] transition-colors"
                      title={soundEnabledState ? 'Click to mute sound alerts' : 'Click to enable sound alerts'}
                    >
                      {soundEnabledState ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                      <span>
                        Beep Alert: <b className={soundEnabledState ? 'text-emerald-600 font-black' : 'text-slate-500'}>{soundEnabledState ? 'ON' : 'OFF'}</b>
                      </span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={handleTestBeep}
                      className="px-2 py-0.5 bg-sky-50 hover:bg-sky-100 text-[#0284C7] rounded-md font-bold text-[11px] cursor-pointer transition-colors"
                      title="Test beep sound on this device"
                    >
                      🔊 Test Beep
                    </button>
                  </div>
                  <button
                    onClick={() => setShowSellerPicker(true)}
                    className="px-3.5 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start Chat with Seller</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 flex-1 min-h-0 h-full max-h-full flex overflow-hidden shadow-xs relative">
                {/* Conversations Sidebar */}
                <div className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col h-full bg-slate-50/50 shrink-0 overflow-hidden ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
                  {/* Sidebar Header & Search */}
                  <div className="p-3.5 border-b border-slate-200 bg-white space-y-2.5 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                        <span>Active Seller Threads</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0284C7] text-[11px] font-bold">
                          {filteredConversations.length}
                        </span>
                      </span>
                      {totalUnreadConversationsForAdmin > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                          {totalUnreadConversationsForAdmin} new
                        </span>
                      )}
                    </div>
                    {/* Search by name or Gmail */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search seller name or Gmail..."
                        value={chatSearchQuery}
                        onChange={(e) => setChatSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-2 text-xs bg-white text-black font-semibold placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:border-[#0284C7] transition-all"
                        style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                      />
                      {chatSearchQuery && (
                        <button
                          onClick={() => setChatSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Threads List (Sorted Latest First, cleanly scrolls inside sidebar only) */}
                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain divide-y divide-slate-100">
                    {filteredConversations.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 space-y-2">
                        <MessageSquare className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                        <p className="text-xs font-semibold">No matching conversations</p>
                        <p className="text-[11px] text-slate-400">Click &quot;Start Chat with Seller&quot; to begin a conversation</p>
                      </div>
                    ) : (
                      filteredConversations.map((conv) => {
                        const isSelected = activeConvId === conv.id;
                        const participantName =
                          conv.participantTwoRole === 'ADMIN'
                            ? conv.participantOneName || 'Seller'
                            : conv.participantTwoName || conv.participantOneName || 'Seller';
                        const participantShop = getParticipantShop(conv);
                        const participantEmail = getParticipantEmail(conv);
                        const unreadCount = getAdminUnreadCount(conv);
                        const hasUnread = unreadCount > 0;
                        const initial = (participantShop || participantName || 'S').trim().charAt(0).toUpperCase() || 'S';
                        const lastText = conv.lastMessageText || 'Chat thread opened';
                        const lastTime = conv.lastMessageTime
                          ? new Date(conv.lastMessageTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '';

                        return (
                          <div
                            key={conv.id}
                            onClick={() => handleSelectConv(conv.id)}
                            className={`w-full p-3.5 text-left transition-all flex items-start gap-3 cursor-pointer group relative ${
                              isSelected
                                ? 'bg-[#EBF5FF] border-l-4 border-[#0284C7]'
                                : hasUnread
                                ? 'bg-amber-50/50 hover:bg-amber-100/50'
                                : 'hover:bg-slate-100/80 bg-white'
                            }`}
                          >
                            {/* Avatar with unread indicator badge */}
                            <div className="relative shrink-0">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                  isSelected
                                    ? 'bg-[#0284C7] text-white shadow-xs'
                                    : hasUnread
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {initial}
                              </div>
                              {hasUnread && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping" />
                              )}
                              {hasUnread && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span
                                  className={`text-xs truncate ${
                                    hasUnread || isSelected ? 'font-black text-slate-900' : 'font-bold text-slate-800'
                                  }`}
                                >
                                  {participantShop}
                                </span>
                                {lastTime && (
                                  <span
                                    className={`text-[10px] shrink-0 ${
                                      hasUnread ? 'font-bold text-red-600' : 'text-slate-400'
                                    }`}
                                  >
                                    {lastTime}
                                  </span>
                                )}
                              </div>

                              {/* Seller Gmail with Mail icon */}
                              <div className="flex items-center justify-between gap-1 mt-0.5">
                                <span className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate text-slate-600 font-semibold">{participantEmail}</span>
                                </span>

                                {/* Unread badge next to Gmail */}
                                {hasUnread && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">
                                    {unreadCount} new
                                  </span>
                                )}
                              </div>

                              {/* Last message preview */}
                              <p
                                className={`text-[11px] truncate mt-1 ${
                                  hasUnread ? 'font-bold text-slate-900' : 'text-slate-500'
                                }`}
                              >
                                {lastText}
                              </p>
                            </div>

                            {/* Quick Delete & Reset on Hover */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmConvId(conv.id);
                              }}
                              title="Delete & Reset Chat"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Main Chat Panel (Fixed height, only chat messages scroll) */}
                <div className={`flex-1 min-h-0 flex flex-col h-full bg-slate-50/50 min-w-0 overflow-hidden ${activeConvId ? 'flex' : 'hidden md:flex'}`}>
                  {(() => {
                    const currentActiveConv =
                      unifiedConversations.find((c) => c.id === activeConvId || (c as any).allConvIds?.includes(activeConvId)) ||
                      filteredConversations[0];
                    if (!currentActiveConv) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                          <MessageSquare className="w-12 h-12 text-slate-300 stroke-1 mb-2" />
                          <h3 className="font-bold text-slate-700 text-sm">Select a Conversation</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm">
                            Choose a seller conversation from the left sidebar or start a new direct chat with any merchant.
                          </p>
                        </div>
                      );
                    }

                    const activeShopName = getParticipantShop(currentActiveConv);
                    const activeSellerEmail = getParticipantEmail(currentActiveConv);
                    const activeParticipantName =
                      currentActiveConv.participantTwoRole === 'ADMIN'
                        ? currentActiveConv.participantOneName || 'Seller'
                        : currentActiveConv.participantTwoName || 'Seller';
                    const activeSellerId =
                      currentActiveConv.participantOneRole === 'SELLER'
                        ? currentActiveConv.participantOneId
                        : currentActiveConv.participantTwoRole === 'SELLER'
                        ? currentActiveConv.participantTwoId
                        : currentActiveConv.id;

                    const targetConvIds = new Set<string>((currentActiveConv as any)?.allConvIds || [currentActiveConv.id]);
                    if (activeSellerId) {
                      targetConvIds.add(activeSellerId);
                      targetConvIds.add(activeSellerId.replace(/^conv_/, ''));
                      targetConvIds.add(`conv_${activeSellerId.replace(/^conv_/, '')}`);
                    }
                    if ((currentActiveConv as any)?.sellerMatch?.id) targetConvIds.add((currentActiveConv as any).sellerMatch.id);
                    if ((currentActiveConv as any)?.sellerMatch?.userId) targetConvIds.add((currentActiveConv as any).sellerMatch.userId);

                    const activeConvMessagesMap = new Map<string, any>();
                    messages
                      .filter(
                        (m) =>
                          targetConvIds.has(m.conversationId) ||
                          targetConvIds.has(m.senderId) ||
                          ((m as any).receiverId && targetConvIds.has((m as any).receiverId))
                      )
                      .forEach((m) => activeConvMessagesMap.set(m.id, m));
                    liveChatMessages.forEach((m) => activeConvMessagesMap.set(m.id, m));
                    const activeConvMessages = Array.from(activeConvMessagesMap.values()).sort(
                      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                    );

                    return (
                      <>
                        {/* WhatsApp-Style Chat Header */}
                        <div className="p-3 sm:p-3.5 bg-[#f0f2f5] border-b border-slate-200 flex items-center justify-between shrink-0 shadow-2xs">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            {/* Mobile Back Button to thread list */}
                            <button
                              type="button"
                              onClick={() => setActiveConvId('')}
                              className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-full cursor-pointer"
                              title="Back to seller threads"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#008069] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                              {(activeShopName || 'S').trim().charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-slate-900 truncate">
                                  {activeShopName}
                                </h4>
                                <span className="text-xs text-slate-500 font-normal truncate hidden sm:inline">
                                  ({activeParticipantName})
                                </span>
                              </div>
                              {/* Gmail tag in header */}
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-slate-600 font-medium flex items-center gap-1 truncate">
                                  <Mail className="w-3.5 h-3.5 text-[#008069] shrink-0" />
                                  <span className="truncate">{activeSellerEmail}</span>
                                </span>
                                <span className="text-[11px] text-[#00a884] font-semibold flex items-center gap-1 shrink-0">
                                  <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
                                  <span>online</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Chat Actions: Admin-Only Delete Chat History */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmConvId(currentActiveConv.id)}
                              className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 hover:border-rose-200 cursor-pointer shadow-2xs"
                              title="Delete chat messages and send automatic greeting (Admin only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Delete Chat</span>
                            </button>
                          </div>
                        </div>

                        {/* WhatsApp Chat Area with Doodle Wallpaper (Only messages scroll) */}
                        <div
                          ref={mainChatScroll.containerRef}
                          onScroll={mainChatScroll.onScroll}
                          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-2.5"
                          style={{
                            backgroundColor: '#efeae2',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.035' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
                          }}
                        >
                          {activeConvMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                              <div className="w-12 h-12 rounded-full bg-white text-[#008069] flex items-center justify-center mb-3 shadow-xs">
                                <MessageCircle className="w-6 h-6" />
                              </div>
                              <p className="text-xs font-bold text-slate-700">No message history in this thread.</p>
                              <p className="text-[11px] text-slate-500 mt-1">
                                Send a message below or use quick templates to reply.
                              </p>
                            </div>
                          ) : (
                            activeConvMessages.map((msg) => {
                              const isAdmin = msg.senderRole === 'ADMIN';
                              const textContent = msg.text || (msg as any).content || '';
                              const msgTime = msg.timestamp || (msg as any).createdAt || new Date().toISOString();

                              return (
                                <div
                                  key={msg.id}
                                  className={`flex flex-col group ${isAdmin ? 'items-end' : 'items-start'} mb-1.5`}
                                >
                                  {/* Message Bubble + Delete Single Message Button (Admin Only) */}
                                  <div
                                    className={`flex items-end gap-1.5 max-w-[88%] sm:max-w-[75%] ${
                                      isAdmin ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                                  >
                                    <div
                                      className={`px-3.5 py-2 rounded-2xl shadow-2xs text-[13.5px] leading-relaxed relative ${
                                        isAdmin
                                          ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-emerald-200/40'
                                          : 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/60'
                                      }`}
                                    >
                                      {/* Sender Tag */}
                                      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold">
                                        {isAdmin ? (
                                          <span className="text-[#008069]">Platform Admin</span>
                                        ) : (
                                          <span className="text-[#008069] flex items-center gap-1">
                                            <span>{activeShopName}</span>
                                            <span className="text-slate-400 font-normal">({activeSellerEmail})</span>
                                          </span>
                                        )}
                                      </div>

                                      {msg.imageUrl && (
                                        <div className="mb-1.5 rounded-xl overflow-hidden max-w-[280px] bg-slate-100">
                                          <img
                                          src={msg.imageUrl}
                                          alt="Attachment"
                                          onLoad={mainChatScroll.onMediaLoad}
                                          className="max-h-64 w-full object-cover"
                                        />  
                                        </div>
                                      )}

                                      {/* Multi-line Formatted Text Body */}
                                      <p className="whitespace-pre-wrap break-words select-text font-normal">
                                        {textContent}
                                      </p>

                                      {/* Timestamp & Read/Seen Status for Admin */}
                                      <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-500 select-none">
                                        {/* Admin CAN see message timestamp */}
                                        <span>{formatAdminMessageDateTime(msgTime)}</span>

                                        {/* Admin CAN see Seen / Read status */}
                                        {isAdmin && (
                                          <span className="flex items-center gap-0.5 ml-0.5">
                                            {msg.isRead ? (
                                              <span className="text-[#53bdeb] flex items-center gap-0.5 font-bold" title="Seen by seller">
                                                <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                                <span>Seen</span>
                                              </span>
                                            ) : (
                                              <span className="text-slate-400 flex items-center gap-0.5" title="Delivered to seller">
                                                <Check className="w-3.5 h-3.5" />
                                                <span>Delivered</span>
                                              </span>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Admin Delete Button (Trash Sign) for Single Message */}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteSingleMsg(msg.id)}
                                      title="Delete this message (Admin only)"
                                      aria-label="Delete message"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0 cursor-pointer mb-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Quick Reply Chips */}
                        <div className="px-3.5 py-1.5 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0">
                          <span className="text-slate-500 font-bold shrink-0 text-[10px] uppercase tracking-wider">
                            Quick:
                          </span>
                          <button
                            type="button"
                            onClick={() => setAdminChatInput('How can I help you?')}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200/80 text-slate-700 rounded-full border border-slate-200/80 whitespace-nowrap transition-colors font-medium shrink-0 cursor-pointer shadow-2xs"
                          >
                            &ldquo;How can I help you?&rdquo;
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminChatInput('Your withdrawal request has been verified and processed.')}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200/80 text-slate-700 rounded-full border border-slate-200/80 whitespace-nowrap transition-colors font-medium shrink-0 cursor-pointer shadow-2xs"
                          >
                            &ldquo;Withdrawal processed&rdquo;
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdminChatInput('Please provide your shipment tracking number for the pending order.')}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200/80 text-slate-700 rounded-full border border-slate-200/80 whitespace-nowrap transition-colors font-medium shrink-0 cursor-pointer shadow-2xs"
                          >
                            &ldquo;Tracking number request&rdquo;
                          </button>
                        </div>

                        {/* WhatsApp Style Chat Input for Admin */}
                        <div className="p-2.5 sm:p-3 bg-[#f0f2f5] border-t border-slate-200 shrink-0">
                          <div className="flex items-end gap-2 max-w-4xl">
                            {/* WhatsApp White Textarea Container */}
                            <div className="flex-1 bg-white border border-slate-300 rounded-2xl px-3.5 py-1.5 shadow-2xs flex items-center focus-within:ring-2 focus-within:ring-[#00a884]/40 transition-all">
                              <textarea
                                id="admin-chat-input"
                                ref={adminTextareaRef}
                                rows={1}
                                placeholder="Type official reply to seller (Shift + Enter for new line)..."
                                value={adminChatInput}
                                onChange={(e) => setAdminChatInput(e.target.value)}
                                onKeyDown={handleAdminChatKeyDown}
                                className="w-full bg-transparent border-0 p-0 text-[14px] font-medium text-black placeholder:text-slate-400 resize-none focus:outline-none focus:ring-0 leading-relaxed max-h-32 overflow-y-auto"
                                style={{ color: '#000000', WebkitTextFillColor: '#000000', caretColor: '#000000' }}
                              />
                            </div>

                            {/* WhatsApp Round Green Send Button */}
                            <button
                              type="button"
                              onClick={() => handleSendAdminMessage()}
                              disabled={!adminChatInput.trim()}
                              title="Send message (Enter)"
                              aria-label="Send message"
                              className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] disabled:opacity-40 text-white flex items-center justify-center font-bold transition-all cursor-pointer disabled:cursor-not-allowed shrink-0 active:scale-95 shadow-sm mb-0.5"
                            >
                              <Send className="w-4 h-4 fill-current ml-0.5" />
                            </button>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL: DELETE & RESET CHAT CONFIRMATION                   */}
          {/* ========================================================= */}
          {deleteConfirmConvId && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Clear Seller Chat History</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Are you sure you want to delete message history for this conversation? All previous messages will be cleared. You can manually type and send a reply to the seller at any time.
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmConvId(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteAndResetChat(deleteConfirmConvId)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm & Reset Chat</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL: START CHAT WITH SELLER DIRECTORY                   */}
          {/* ========================================================= */}
          {showSellerPicker && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Start Direct Chat with Seller</h3>
                    <p className="text-xs text-slate-500">Select any registered merchant to open or start a live support thread</p>
                  </div>
                  <button
                    onClick={() => setShowSellerPicker(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {[...sellers]
                    .sort((a, b) => {
                      const nameA = (a.shopName || a.sellerName || a.email || '').trim().toLowerCase();
                      const nameB = (b.shopName || b.sellerName || b.email || '').trim().toLowerCase();
                      return nameA.localeCompare(nameB);
                    })
                    .map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleStartChatWithSeller(s)}
                      className="p-3 hover:bg-blue-50/60 rounded-xl flex items-center justify-between cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                          {(s.shopName || s.sellerName || 'S').trim().charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#0284C7] transition-colors">
                            {s.shopName || 'Store'}
                          </h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{s.email}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-[#0284C7] text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 8: VIEW SELLER PROFILE                                */}
          {/* ========================================================= */}
          {activeTab === 'seller-profiles' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Seller Profiles Directory</h2>
                <p className="text-xs text-slate-500">
                  Inspect seller profiles, verified shop details, balances, ratings, and performance
                </p>
              </div>

              {/* Search */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sellers by store name, owner, email, phone..."
                  value={sellerSearch}
                  onChange={(e) => setSellerSearch(e.target.value)}
                  className="w-full text-xs font-semibold text-black placeholder:text-slate-400 bg-transparent focus:outline-none"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sellers
                  .filter(
                    (s) =>
                      (s.shopName || '').toLowerCase().includes(sellerSearch.toLowerCase()) ||
                      (s.sellerName || '').toLowerCase().includes(sellerSearch.toLowerCase()) ||
                      (s.email || '').toLowerCase().includes(sellerSearch.toLowerCase())
                  )
                  .sort((a, b) => {
                    const timeA = new Date(a.joinedDate || (a as any).createdAt || 0).getTime();
                    const timeB = new Date(b.joinedDate || (b as any).createdAt || 0).getTime();
                    return timeB - timeA;
                  })
                  .map((s) => {
                    const isRecentlyJoined =
                      s.joinedDate &&
                      Date.now() - new Date(s.joinedDate).getTime() < 3 * 24 * 60 * 60 * 1000;
                    return (
                    <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 relative">
                      {isRecentlyJoined && (
                        <div className="absolute -top-2.5 right-4 z-10">
                          <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>New Registered</span>
                          </span>
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-300 flex items-center justify-center font-bold text-sm shrink-0">
                            {(s.email || s.sellerName || 'S').trim().charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1 font-bold font-mono text-xs sm:text-sm text-[#0284C7] truncate max-w-[220px]" title={s.email}>
                              <Mail className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                              <span className="truncate">{s.email}</span>
                            </div>
                            <p className="text-xs font-semibold text-slate-800 mt-0.5 truncate">{s.shopName || 'Store'} • {s.sellerName || 'Seller'}</p>
                          </div>
                        </div>
                        <StatusBadge status={s.applicationStatus} />
                      </div>

                      <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700 truncate">{s.shopName} ({s.sellerName})</span>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-lg px-2.5 py-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                          <div className="text-[11px] leading-tight truncate">
                            <span className="font-semibold text-slate-600">Registered: </span>
                            <span className="font-bold text-slate-900 font-mono">
                              {s.joinedDate
                                ? new Date(s.joinedDate).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true,
                                  })
                                : 'Recently Registered'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.city}, {s.country}</span>
                        </div>
                        <div className="flex items-center justify-between bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <Key className="w-3 h-3 text-amber-500" />
                            <span>Password:</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-700 text-xs">
                              {revealedPasswords[s.id] ? (s.password || 'Not Set') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePasswordVisibility(s.id);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
                              title={revealedPasswords[s.id] ? 'Hide Password' : 'Show Password'}
                            >
                              {revealedPasswords[s.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            {s.password && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(s.password!);
                                  triggerToast('Password copied to clipboard!');
                                }}
                                className="p-1 text-slate-400 hover:text-amber-600 rounded transition cursor-pointer"
                                title="Copy Password"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        {/* 7-Star Rating Display & Quick Admin Setter */}
                        <div className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-slate-700">Rating:</span>
                            <div className="flex text-amber-400 gap-0.5">
                              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateSellerStarRating(s.id, num);
                                    if (selectedSellerDetail?.id === s.id) {
                                      setSelectedSellerDetail((prev) => (prev ? { ...prev, starRating: num, rating: num } : null));
                                    }
                                    triggerToast(`Updated ${s.shopName} rating to ${num} of 7 stars!`);
                                  }}
                                  className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                                  title={`Click to set ${s.shopName} rating to ${num} stars`}
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 transition-colors ${
                                      num <= (s.starRating ?? 7)
                                        ? 'fill-amber-400 text-amber-400'
                                        : 'text-slate-300 hover:text-amber-300'
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <span className="text-[11px] font-black text-amber-600">
                            {(s.starRating ?? 7)} / 7
                          </span>
                        </div>
                      </div>

                      {/* KYC Verification Document Proof */}
                      <div className="pt-2.5 pb-1 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#0284C7]" />
                            <span>KYC: {s.kycDocumentType || s.kycDocuments?.documentType || 'ID Card'}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            s.applicationStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            s.applicationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {(s.applicationStatus || 'pending').toLowerCase()}
                          </span>
                        </div>

                        {/* Front & Back Thumbnails */}
                        <div className="flex items-center gap-2">
                          <div
                            onClick={() => {
                              setKycInspectSeller(s);
                              setKycInspectSide('front');
                            }}
                            className="group relative w-16 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:border-[#0284C7] cursor-pointer shadow-2xs"
                            title="Inspect Front Side"
                          >
                            {s.frontImage || s.kycFrontImageUrl || s.kycDocuments?.frontImageUrl ? (
                              <img
                                src={s.frontImage || s.kycFrontImageUrl || s.kycDocuments?.frontImageUrl}
                                alt="Front Side"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                              <ZoomIn className="w-3 h-3" />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-bold text-white text-center py-0.2">
                              Front
                            </span>
                          </div>

                          <div
                            onClick={() => {
                              setKycInspectSeller(s);
                              setKycInspectSide('back');
                            }}
                            className="group relative w-16 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 hover:border-[#0284C7] cursor-pointer shadow-2xs"
                            title="Inspect Back Side"
                          >
                            {s.backImage || s.kycBackImageUrl || s.kycDocuments?.backImageUrl ? (
                              <img
                                src={s.backImage || s.kycBackImageUrl || s.kycDocuments?.backImageUrl}
                                alt="Back Side"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition-opacity">
                              <ZoomIn className="w-3 h-3" />
                            </div>
                            <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-bold text-white text-center py-0.2">
                              Back
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setKycInspectSeller(s);
                              setKycInspectSide('both');
                            }}
                            className="ml-auto text-[11px] font-bold text-[#0284C7] hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        {(() => {
                          const sellerActualSales = orders
                            .filter(
                              (o) =>
                                (o.assignedSellerId === s.id ||
                                  o.assignedSellerId === s.userId ||
                                  (typeof o.assignedSellerId === 'string' && s.email && o.assignedSellerId.toLowerCase() === s.email.toLowerCase())) &&
                                o.status !== 'CANCELLED'
                            )
                            .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
                          return (
                            <span
                              className="text-xs font-bold text-slate-700"
                              title="Real Product Sales from customer orders (excludes manual admin wallet top-ups)"
                            >
                              Sales: ${sellerActualSales.toFixed(2)}
                            </span>
                          );
                        })()}
                        <div className="flex items-center gap-2">
                          {s.applicationStatus === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => handleApproveSeller(s)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Approve Store"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectSeller(s)}
                                className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                                title="Reject Application"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : s.applicationStatus === 'FROZEN' ? (
                            <button
                              onClick={() => handleUnfreezeSeller(s)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Unfreeze Store"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Unfreeze</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleFreezeSeller(s)}
                              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-bold text-xs transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                              title="Freeze Store"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Freeze</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete seller "${s.shopName || s.sellerName}" and all associated data?`)) {
                                deleteSeller(s.id);
                                triggerToast('Seller deleted from database.');
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            title="Delete Seller"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedSellerDetail(s)}
                            className="px-3 py-1.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-lg font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Profile</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 9: CUSTOMER PROFILES                                  */}
          {/* ========================================================= */}
          {activeTab === 'customer-profiles' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Customer Profiles Directory</h2>
                <p className="text-xs text-slate-500">
                  Registered customer accounts, contact information, and lifetime order histories
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                {/* Desktop View */}
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Orders Placed</th>
                        <th className="py-3 px-4">Joined Date</th>
                        <th className="py-3 px-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerUsers.map((cust) => {
                        const custOrders = orders.filter((o) => (o.shippingAddress?.fullName || '').toLowerCase() === (cust.name || '').toLowerCase());
                        return (
                          <tr key={cust.id} className="hover:bg-slate-50/80">
                            <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                              <img
                                src={cust.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                                alt={cust.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <span>{cust.name}</span>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600">{cust.email}</td>
                            <td className="py-3.5 px-4 text-slate-600">{cust.phone || 'N/A'}</td>
                            <td className="py-3.5 px-4 font-bold text-[#0284C7]">{custOrders.length || 1} Order(s)</td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {new Date(cust.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                                ACTIVE
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {customerUsers.map((cust) => {
                    const custOrders = orders.filter((o) => (o.shippingAddress?.fullName || '').toLowerCase() === (cust.name || '').toLowerCase());
                    return (
                      <div key={cust.id} className="p-3.5 space-y-2.5 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={cust.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                              alt={cust.name}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-bold text-xs text-slate-900">{cust.name}</div>
                              <div className="font-mono text-[11px] text-slate-500">{cust.email}</div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            ACTIVE
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 text-xs text-slate-600 border-t border-slate-100">
                          <span>{cust.phone || 'No phone'}</span>
                          <span className="font-bold text-[#0284C7]">{custOrders.length || 1} Order(s)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 10: SELLER LOGIN SESSIONS                              */}
          {/* ========================================================= */}
          {activeTab === 'seller-logins' && (
            <SellerLoginSessionsView
              sessions={sellerLoginSessions}
              sellers={sellers}
              onRefresh={refreshSellerLoginSessions}
              onDeleteSession={deleteSellerLoginSessionById}
              triggerToast={triggerToast}
              revealedPasswords={revealedPasswords}
              togglePasswordVisibility={togglePasswordVisibility}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 11: ADD / DEDUCT MONEY & SELLER DEPOSIT HISTORY        */}
          {/* ========================================================= */}
          {activeTab === 'add-money' && (() => {
            const currentSelectedSeller = selectedWalletSellerId
              ? sellers.find((s) => s.id === selectedWalletSellerId) || null
              : null;
            const currentSellerRawWallet = currentSelectedSeller
              ? wallets[currentSelectedSeller.id] ||
                (currentSelectedSeller.userId && wallets[currentSelectedSeller.userId]) ||
                null
              : null;
            const liveBalance = Number(
              currentSellerRawWallet?.availableBalance ??
              currentSellerRawWallet?.balance ??
              currentSellerRawWallet?.walletBalance ??
              currentSelectedSeller?.walletBalance ??
              0
            );
            // Calculate total amount added by Admin to this seller's account
            const totalAdminAdded = currentSelectedSeller
              ? transactions
                  .filter((t) => {
                    const isSellerMatch =
                      t.sellerId === currentSelectedSeller.id ||
                      t.sellerId === currentSelectedSeller.userId ||
                      (currentSelectedSeller.email &&
                        t.sellerId?.toLowerCase() === currentSelectedSeller.email.toLowerCase());

                    if (!isSellerMatch) return false;
                    if (t.orderId || t.withdrawalId || t.source === 'ORDER' || t.source === 'WITHDRAWAL') return false;
                    if (/#ORD/i.test(t.description || '') || /order/i.test(t.description || '')) return false;

                    return Boolean(
                      t.type === 'MANUAL_CREDIT' ||
                      t.type === 'CREDIT_RECHARGE' ||
                      t.isAdminDeposit === true ||
                      t.source === 'ADMIN'
                    );
                  })
                  .reduce((sum, t) => sum + Number(t.amount || 0), 0)
              : 0;

            const currentSellerWallet = currentSelectedSeller
              ? {
                  sellerId: currentSelectedSeller.id,
                  availableBalance: liveBalance,
                  balance: liveBalance,
                  walletBalance: liveBalance,
                  pendingBalance: Number(currentSellerRawWallet?.pendingBalance || 0),
                  totalEarnings: Number(currentSellerRawWallet?.totalEarnings || 0),
                  totalAdminAdded: totalAdminAdded,
                  totalWithdrawn: Number(currentSellerRawWallet?.totalWithdrawn || 0),
                  updatedAt: currentSellerRawWallet?.updatedAt || new Date().toISOString(),
                }
              : null;

            // Filter transactions for this seller that represent direct deposits/additions by Admin
            // Strictly exclude any order-related activities (order earnings, cancellations, pickup cost refunds) and customer withdrawals/refunds
            const sellerDepositHistory = currentSelectedSeller
              ? transactions.filter((t) => {
                  const isSellerMatch =
                    t.sellerId === currentSelectedSeller.id ||
                    t.sellerId === currentSelectedSeller.userId ||
                    (currentSelectedSeller.email &&
                      t.sellerId?.toLowerCase() === currentSelectedSeller.email.toLowerCase());

                  if (!isSellerMatch) return false;

                  // 1. Strictly exclude all order-related items (cancellations, order refunds, sales, pickup costs)
                  if (t.orderId || t.withdrawalId || t.source === 'ORDER' || t.source === 'WITHDRAWAL') return false;
                  if (
                    t.type === 'CREDIT_ORDER_DELIVERED' ||
                    t.type === 'CREDIT_ORDER_PENDING' ||
                    t.type === 'DEBIT_WITHDRAWAL' ||
                    t.type === 'REFUND_ADJUSTMENT'
                  ) {
                    return false;
                  }
                  if (
                    /#ORD/i.test(t.description || '') ||
                    /#WD/i.test(t.description || '') ||
                    /order/i.test(t.description || '') ||
                    /withdrawal/i.test(t.description || '') ||
                    /pickup cost/i.test(t.description || '') ||
                    /delivery/i.test(t.description || '') ||
                    /delivered/i.test(t.description || '') ||
                    /refund/i.test(t.description || '')
                  ) {
                    return false;
                  }

                  // 2. Strictly include ONLY balance added or manually adjusted by Admin
                  const isAdminAddition = Boolean(
                    t.isAdminDeposit === true ||
                    t.source === 'ADMIN' ||
                    t.type === 'MANUAL_CREDIT' ||
                    t.type === 'ADMIN_ADJUSTMENT' ||
                    t.type === 'CREDIT_RECHARGE' ||
                    t.type === 'MANUAL_DEBIT'
                  );

                  return isAdminAddition;
                })
              : [];

            return (
              <div className="space-y-6">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Add Money & Deposit History</h2>
                    <p className="text-xs text-slate-500">
                      Credit or deduct seller merchant wallets manually and manage balance logs.
                    </p>
                  </div>
                  {currentSelectedSeller && (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-50 border border-sky-200 rounded-xl text-xs font-bold text-sky-800">
                      <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                      <span>Active Seller: {currentSelectedSeller.shopName || currentSelectedSeller.sellerName}</span>
                    </div>
                  )}
                </div>

                {/* Main 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column (5 Cols): Balance Form & Wallet Overview */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Main Wallet Adjustment Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs">
                      <h3 className="text-center font-bold text-lg text-slate-900 mb-5">
                        {walletAdjustmentMode === 'ADD'
                          ? "Add Money to Seller's Wallet"
                          : "Deduct Money from Seller's Wallet"}
                      </h3>

                      {/* Toggle Switch: Add Money <-> Deduct Money */}
                      <div className="flex items-center justify-center gap-3.5 mb-6">
                        <button
                          type="button"
                          onClick={() => setWalletAdjustmentMode('ADD')}
                          className={`text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                            walletAdjustmentMode === 'ADD'
                              ? 'text-[#0284C7]'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Add Money
                        </button>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={walletAdjustmentMode === 'DEDUCT'}
                          onClick={() =>
                            setWalletAdjustmentMode(walletAdjustmentMode === 'ADD' ? 'DEDUCT' : 'ADD')
                          }
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            walletAdjustmentMode === 'DEDUCT' ? 'bg-[#D32F2F]' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              walletAdjustmentMode === 'DEDUCT' ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => setWalletAdjustmentMode('DEDUCT')}
                          className={`text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                            walletAdjustmentMode === 'DEDUCT'
                              ? 'text-[#D32F2F]'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Deduct Money
                        </button>
                      </div>

                      {/* Form */}
                      <form onSubmit={handleManualWalletAdjustment} className="space-y-4">
                        {/* Single Unified Seller Search & Select Bar (Gmail A to Z) */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Select Merchant Seller (Gmail A–Z)</span>
                            <span className="text-[10px] font-semibold text-sky-600">Gmail First</span>
                          </label>
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <select
                              value={selectedWalletSellerId}
                              onChange={(e) => {
                                const id = e.target.value;
                                setSelectedWalletSellerId(id);
                                const found = sellers.find((s) => s.id === id);
                                if (found) {
                                  setAddMoneySellerSearch(found.email || '');
                                } else {
                                  setAddMoneySellerSearch('');
                                }
                              }}
                              className="w-full pl-10 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 appearance-none focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-[#0284C7]/20 cursor-pointer shadow-xs font-mono"
                            >
                              <option value="">
                                -- Choose Seller by Gmail (Sorted A to Z) --
                              </option>
                              {[...sellers]
                                .sort((a, b) => {
                                  const emailA = (a.email || '').trim().toLowerCase();
                                  const emailB = (b.email || '').trim().toLowerCase();
                                  return emailA.localeCompare(emailB);
                                })
                                .map((s) => {
                                  const bal = Number(
                                    wallets[s.id]?.availableBalance ??
                                    (s.userId ? wallets[s.userId]?.availableBalance : undefined) ??
                                    wallets[s.id]?.balance ??
                                    s.walletBalance ??
                                    0
                                  );
                                  return (
                                    <option key={s.id} value={s.id}>
                                      {s.email} — {s.shopName || s.sellerName} (Balance: ${bal.toFixed(2)})
                                    </option>
                                  );
                                })}
                            </select>
                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        {/* Amount Input with Floating Outlined Label */}
                        <div className="relative border border-slate-300 rounded-xl px-3.5 pt-2 pb-2.5 focus-within:border-slate-500 bg-white shadow-xs">
                          <label className="absolute -top-2.5 left-3 bg-white px-1.5 text-[11px] font-semibold text-slate-500">
                            Amount to {walletAdjustmentMode === 'ADD' ? 'Add' : 'Deduct'} ($)
                          </label>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="text-slate-400 font-bold text-sm sm:text-base">$</span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="0.00"
                              value={manualMoneyAmount}
                              onChange={(e) => setManualMoneyAmount(e.target.value)}
                              className="w-full text-sm sm:text-base font-bold text-black bg-transparent focus:outline-none placeholder-slate-400"
                              style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                            />
                          </div>
                        </div>

                        {/* Optional Note */}
                        <div>
                          <input
                            type="text"
                            placeholder="Adjustment note / reason / reference (Optional)"
                            value={manualMoneyNote}
                            onChange={(e) => setManualMoneyNote(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-400"
                            style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                          />
                        </div>

                        {/* Action Button */}
                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={
                              !selectedWalletSellerId ||
                              !manualMoneyAmount ||
                              parseFloat(manualMoneyAmount) <= 0
                            }
                            className={`w-full py-3.5 rounded-xl font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-150 cursor-pointer shadow-xs ${
                              !selectedWalletSellerId ||
                              !manualMoneyAmount ||
                              parseFloat(manualMoneyAmount) <= 0
                                ? 'bg-[#E5E7EB] text-slate-400 cursor-not-allowed'
                                : walletAdjustmentMode === 'DEDUCT'
                                ? 'bg-[#D32F2F] hover:bg-red-700 text-white shadow-red-600/20 active:scale-[0.99]'
                                : 'bg-[#0284C7] hover:bg-sky-600 text-white shadow-sky-600/20 active:scale-[0.99]'
                            }`}
                          >
                            {walletAdjustmentMode === 'DEDUCT'
                              ? 'DEDUCT MONEY FROM WALLET'
                              : 'ADD MONEY TO WALLET'}
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Selected Seller Live Wallet Overview */}
                    {currentSelectedSeller && currentSellerWallet && (
                      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs border border-slate-800 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Selected Seller Wallet Overview
                            </span>
                            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-sky-400 truncate">
                              <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span className="truncate">{currentSelectedSeller.email}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-300 truncate mt-0.5">
                              {currentSelectedSeller.shopName || currentSelectedSeller.sellerName}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                            ID: {currentSelectedSeller.id}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-800/80 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Available Balance</span>
                            <span className="text-lg font-black text-emerald-400 font-mono">
                              ${currentSellerWallet.availableBalance.toFixed(2)}
                            </span>
                          </div>
                          <div className="bg-slate-800/80 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-400 block" title="Total amount added by Admin to this seller">
                              Total Added by Admin
                            </span>
                            <span className="text-lg font-black text-sky-400 font-mono">
                              ${currentSellerWallet.totalAdminAdded.toFixed(2)}
                            </span>
                          </div>
                          <div className="bg-slate-800/80 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Total Withdrawn</span>
                            <span className="text-sm font-bold text-slate-200 font-mono">
                              ${currentSellerWallet.totalWithdrawn.toFixed(2)}
                            </span>
                          </div>
                          <div className="bg-slate-800/80 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">Pending Clearance</span>
                            <span className="text-sm font-bold text-amber-300 font-mono">
                              ${currentSellerWallet.pendingBalance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column (7 Cols): Seller Deposit / Balance History Box & Table */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                      {/* Header with Title and Dynamic Badge */}
                      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[#0284C7]" />
                            <span>Deposit & Balance History</span>
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {currentSelectedSeller
                              ? `Admin balance additions and top-ups for ${currentSelectedSeller.email} (${currentSelectedSeller.shopName || currentSelectedSeller.sellerName})`
                              : 'Select a seller to review their transaction logs'}
                          </p>
                        </div>

                        {currentSelectedSeller && (
                          <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg shrink-0">
                            {sellerDepositHistory.length} Log{sellerDepositHistory.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>

                      {/* Admin Delete Notice Tip */}
                      <div className="bg-amber-50/70 border-b border-amber-100/80 px-4 py-2.5 flex items-start gap-2 text-[11px] text-amber-900">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <span>
                          <strong>Admin Add Money History:</strong> Shows only balance additions and top-ups added by Admin. Orders and withdrawals are excluded. Deleting an entry here removes it from this history table only. The seller's actual current wallet balance is <strong>never deducted or modified</strong>.
                        </span>
                      </div>

                      {/* History Table Content */}
                      {!currentSelectedSeller ? (
                        <div className="p-12 text-center text-xs text-slate-400">
                          Please select a seller from the form to view their deposit history.
                        </div>
                      ) : sellerDepositHistory.length === 0 ? (
                        <div className="py-14 px-6 text-center space-y-2.5">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                            <Clock className="w-6 h-6 stroke-[1.8]" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800">No deposit history found</h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            No previous deposits or balance additions recorded for {currentSelectedSeller?.shopName || 'this seller'} yet.
                          </p>
                        </div>
                      ) : (
                        <div>
                          {/* Desktop View */}
                          <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                                  <th className="py-3 px-4">Date & Time</th>
                                  <th className="py-3 px-4">Type & Amount</th>
                                  <th className="py-3 px-4">Reference / Notes</th>
                                  <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sellerDepositHistory.map((t, tIdx) => {
                                  const isDeduct = t.type === 'MANUAL_DEBIT' || t.type === 'DEBIT_WITHDRAWAL';
                                  const formattedDate = formatOrderDateTime(t.date);

                                  return (
                                    <tr key={`${t.id || 'tx'}-${tIdx}`} className="hover:bg-slate-50/80 transition-colors">
                                      {/* Date & Time */}
                                      <td className="py-3 px-4 whitespace-nowrap">
                                        <span className="font-semibold text-slate-800 block">
                                          {formattedDate}
                                        </span>
                                        <span className="font-mono text-[10px] text-slate-400">
                                          ID: {t.id}
                                        </span>
                                      </td>

                                      {/* Type & Amount */}
                                      <td className="py-3 px-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`text-sm font-black font-mono ${
                                              isDeduct ? 'text-rose-600' : 'text-emerald-600'
                                            }`}
                                          >
                                            {isDeduct ? '-' : '+'}${t.amount.toFixed(2)}
                                          </span>
                                        </div>
                                        <span
                                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                                            t.type === 'CREDIT_RECHARGE'
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                              : t.type === 'MANUAL_CREDIT'
                                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                              : t.type === 'MANUAL_DEBIT'
                                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                              : 'bg-slate-100 text-slate-700'
                                          }`}
                                        >
                                          {t.type === 'CREDIT_RECHARGE'
                                            ? 'USDT Deposit'
                                            : t.type === 'MANUAL_CREDIT'
                                            ? 'Admin Credit'
                                            : t.type === 'MANUAL_DEBIT'
                                            ? 'Admin Cut / Deduct'
                                            : t.type.replace(/_/g, ' ')}
                                        </span>
                                      </td>

                                      {/* Reference / Notes */}
                                      <td className="py-3 px-4 max-w-xs">
                                        <p className="text-slate-800 font-medium leading-relaxed truncate" title={t.description}>
                                          {t.description || 'Wallet balance adjustment'}
                                        </p>
                                      </td>

                                      {/* Actions: Admin Delete Log Button */}
                                      <td className="py-3 px-4 text-right whitespace-nowrap">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            deleteTransaction(t.id);
                                            triggerToast(
                                              `Deleted transaction log entry #${t.id}. Seller's balance remains untouched.`
                                            );
                                          }}
                                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 hover:border-rose-600 font-bold text-[11px] transition-all cursor-pointer shadow-2xs"
                                          title="Delete this history log (Keeps wallet balance intact)"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Delete</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Cards View */}
                          <div className="md:hidden divide-y divide-slate-100">
                            {sellerDepositHistory.map((t, tIdx) => {
                              const isDeduct = t.type === 'MANUAL_DEBIT' || t.type === 'DEBIT_WITHDRAWAL';
                              const formattedDate = formatOrderDateTime(t.date);

                              return (
                                <div key={`mob-${t.id || 'tx'}-${tIdx}`} className="p-3.5 space-y-2 bg-white">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <span className="text-slate-400 text-[10px]">{formattedDate}</span>
                                      <div className="font-bold text-xs text-slate-800 mt-0.5">{t.description || 'Wallet adjustment'}</div>
                                    </div>
                                    <div className="text-right">
                                      <span
                                        className={`text-sm font-black font-mono block ${
                                          isDeduct ? 'text-rose-600' : 'text-emerald-600'
                                        }`}
                                      >
                                        {isDeduct ? '-' : '+'}${t.amount.toFixed(2)}
                                      </span>
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                          t.type === 'CREDIT_RECHARGE'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : t.type === 'MANUAL_CREDIT'
                                            ? 'bg-sky-50 text-sky-700'
                                            : t.type === 'MANUAL_DEBIT'
                                            ? 'bg-rose-50 text-rose-700'
                                            : 'bg-slate-100 text-slate-700'
                                        }`}
                                      >
                                        {t.type === 'CREDIT_RECHARGE'
                                          ? 'USDT'
                                          : t.type === 'MANUAL_CREDIT'
                                          ? 'Credit'
                                          : t.type === 'MANUAL_DEBIT'
                                          ? 'Deduct'
                                          : t.type.replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                                    <span>ID: {t.id}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        deleteTransaction(t.id);
                                        triggerToast(
                                          `Deleted transaction log entry #${t.id}. Seller's balance remains untouched.`
                                        );
                                      }}
                                      className="inline-flex items-center gap-1 text-rose-600 font-bold px-2 py-1 bg-rose-50 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================= */}
          {/* TAB 12: SUBSCRIPTION PLANS MANAGER                         */}
          {/* ========================================================= */}
          {activeTab === 'subscriptions' && (
            <SubscriptionPlanManager onNavigate={onNavigate} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Quick Action Bar (Smartphone Friendly) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 px-2 py-1 flex items-center justify-around shadow-lg select-none">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#0284C7] font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setActiveTab('seller-profiles')}
          className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'seller-profiles' ? 'text-[#0284C7] font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Store className="w-5 h-5" />
          {pendingSellers.length > 0 && (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
              {pendingSellers.length}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Sellers</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'orders' ? 'text-[#0284C7] font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {orders.length > 0 && (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
              {orders.length}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`relative flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === 'withdrawals' ? 'text-[#0284C7] font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Landmark className="w-5 h-5" />
          {pendingWithdrawals.length > 0 && (
            <span className="absolute top-0.5 right-1.5 w-4 h-4 rounded-full bg-amber-500 text-white font-black text-[9px] flex items-center justify-center shadow-xs">
              {pendingWithdrawals.length}
            </span>
          )}
          <span className="text-[10px] mt-0.5">Withdraw</span>
        </button>

        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex flex-col items-center py-1 px-2.5 rounded-xl transition-all text-slate-600 hover:text-slate-900 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">All Tabs</span>
        </button>
      </nav>

      {/* ========================================================= */}
      {/* MODAL: SELLER DETAILS POPUP                               */}
      {/* ========================================================= */}
      {selectedSellerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setSelectedSellerDetail(null)}
          />
          <div className="relative bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 z-10 space-y-5 border border-slate-800 text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Seller Application & Profile Details</h3>
              </div>
              <button
                onClick={() => setSelectedSellerDetail(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Primary Login Identity: Gmail First */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-sky-500/30">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">Seller Registered Gmail (Login ID)</span>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="font-mono font-bold text-sky-300 text-sm sm:text-base select-all">{selectedSellerDetail.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-white">{selectedSellerDetail.shopName}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">{selectedSellerDetail.sellerName}</span>
                </div>
              </div>

              {/* Administrative Password Oversight */}
              <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-amber-400 block">Seller Password</span>
                    <span className="font-mono font-bold text-amber-200 text-sm">
                      {selectedSellerDetail.password || 'Not Set'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedSellerDetail.password && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedSellerDetail.password!);
                        triggerToast('Password copied to clipboard!');
                      }}
                      className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      Copy
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const newPass = window.prompt('Enter new password for seller:', selectedSellerDetail.password || '');
                      if (newPass && newPass.trim()) {
                        updateSellerPassword(selectedSellerDetail.id, newPass.trim());
                        setSelectedSellerDetail((prev: any) => prev ? { ...prev, password: newPass.trim() } : null);
                        triggerToast('Seller password updated successfully!');
                      }
                    }}
                    className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {/* Seller Registration Date & Time (High-Visibility Box for Admin) */}
                <div className="flex items-center justify-between py-2 px-3 bg-sky-950/40 rounded-xl border border-sky-500/40">
                  <span className="text-sky-300 font-bold flex items-center gap-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Seller Registration Date & Time:</span>
                  </span>
                  <span className="font-bold font-mono text-white text-xs bg-sky-900/60 px-2 py-0.5 rounded border border-sky-400/30">
                    {selectedSellerDetail.joinedDate
                      ? new Date(selectedSellerDetail.joinedDate).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : 'Recently Registered'}
                  </span>
                </div>

                {selectedSellerDetail.approvedAt && (
                  <div className="flex items-center justify-between py-2 px-3 bg-emerald-950/40 rounded-xl border border-emerald-500/40">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5 text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Admin Approval Date & Time:</span>
                    </span>
                    <span className="font-bold font-mono text-emerald-200 text-xs bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-400/30">
                      {new Date(selectedSellerDetail.approvedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Email Address:</span>
                  <span className="font-bold font-mono text-slate-200">{selectedSellerDetail.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-bold text-slate-200">{selectedSellerDetail.phone}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-bold text-slate-200">
                    {selectedSellerDetail.address}, {selectedSellerDetail.city}, {selectedSellerDetail.country}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Withdrawal Method:</span>
                  <span className="font-bold text-slate-200">{selectedSellerDetail.withdrawalMethod}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Payout Details:</span>
                  <span className="font-bold text-slate-200">{selectedSellerDetail.payoutDetails}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400">Application Status:</span>
                  <StatusBadge status={selectedSellerDetail.applicationStatus} />
                </div>

                {/* 7-Star Rating Management (Admin Control) */}
                <div className="py-2.5 px-3 bg-slate-900/90 rounded-xl border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>Manage Store Rating (7 Stars)</span>
                    </div>
                    <span className="text-xs font-black text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                      {(selectedSellerDetail.starRating ?? 7)} / 7 Stars
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Admin can set or change this seller store's official rating (1 to 7 stars):
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                      const isFilled = num <= (selectedSellerDetail.starRating ?? 7);
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            updateSellerStarRating(selectedSellerDetail.id, num);
                            setSelectedSellerDetail((prev) => (prev ? { ...prev, starRating: num, rating: num } : null));
                            triggerToast(`Updated ${selectedSellerDetail.shopName} rating to ${num} of 7 stars!`);
                          }}
                          className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-400 hover:scale-115 transition-all cursor-pointer group"
                          title={`Set to ${num} Stars`}
                        >
                          <Star
                            className={`w-5 h-5 transition-colors ${
                              isFilled
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                : 'text-slate-600 group-hover:text-amber-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Identity & Verification Documents (KYC) */}
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold text-white">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>KYC Verification Documents</span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                      <FileCheck className="w-3 h-3 text-amber-400" />
                      <span>{selectedSellerDetail.kycDocumentType || selectedSellerDetail.kycDocuments?.documentType || 'ID Card'}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Front Side */}
                    <div
                      onClick={() => {
                        setKycInspectSeller(selectedSellerDetail);
                        setKycInspectSide('front');
                      }}
                      className="group relative rounded-xl border border-slate-800 overflow-hidden bg-slate-950 cursor-pointer shadow-2xs hover:border-amber-400/50 transition-all"
                    >
                      <div className="h-28 w-full flex items-center justify-center bg-slate-950 overflow-hidden">
                        {(selectedSellerDetail.frontImage || selectedSellerDetail.kycFrontImageUrl || selectedSellerDetail.kycDocuments?.frontImageUrl) ? (
                          <img
                            src={selectedSellerDetail.frontImage || selectedSellerDetail.kycFrontImageUrl || selectedSellerDetail.kycDocuments?.frontImageUrl}
                            alt="Front Side"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="text-slate-500 text-xs flex flex-col items-center gap-1">
                            <FileText className="w-5 h-5 text-slate-600" />
                            <span>No Front Document</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <div className="flex items-center gap-1 text-[11px] font-bold bg-black/70 px-2 py-1 rounded-lg">
                          <ZoomIn className="w-3 h-3" />
                          <span>Inspect Front</span>
                        </div>
                      </div>
                      <div className="p-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-300">
                        <span>Front Side</span>
                        <span className="text-amber-400">Click to Zoom</span>
                      </div>
                    </div>

                    {/* Back Side */}
                    <div
                      onClick={() => {
                        setKycInspectSeller(selectedSellerDetail);
                        setKycInspectSide('back');
                      }}
                      className="group relative rounded-xl border border-slate-800 overflow-hidden bg-slate-950 cursor-pointer shadow-2xs hover:border-amber-400/50 transition-all"
                    >
                      <div className="h-28 w-full flex items-center justify-center bg-slate-950 overflow-hidden">
                        {(selectedSellerDetail.backImage || selectedSellerDetail.kycBackImageUrl || selectedSellerDetail.kycDocuments?.backImageUrl) ? (
                          <img
                            src={selectedSellerDetail.backImage || selectedSellerDetail.kycBackImageUrl || selectedSellerDetail.kycDocuments?.backImageUrl}
                            alt="Back Side"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="text-slate-500 text-xs flex flex-col items-center gap-1">
                            <FileText className="w-5 h-5 text-slate-600" />
                            <span>No Back Document</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <div className="flex items-center gap-1 text-[11px] font-bold bg-black/70 px-2 py-1 rounded-lg">
                          <ZoomIn className="w-3 h-3" />
                          <span>Inspect Back</span>
                        </div>
                      </div>
                      <div className="p-1.5 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-300">
                        <span>Back Side</span>
                        <span className="text-amber-400">Click to Zoom</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              {selectedSellerDetail.applicationStatus === 'PENDING' ? (
                <>
                  <button
                    onClick={() => {
                      handleApproveSeller(selectedSellerDetail);
                      setSelectedSellerDetail(null);
                    }}
                    className="flex-1 py-2.5 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve Store</span>
                  </button>
                  <button
                    onClick={() => {
                      handleFreezeSeller(selectedSellerDetail);
                      setSelectedSellerDetail(null);
                    }}
                    className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Freeze seller store"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Freeze</span>
                  </button>
                  <button
                    onClick={() => {
                      handleRejectSeller(selectedSellerDetail);
                      setSelectedSellerDetail(null);
                    }}
                    className="px-4 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject</span>
                  </button>
                </>
              ) : selectedSellerDetail.applicationStatus === 'FROZEN' ? (
                <button
                  onClick={() => {
                    handleUnfreezeSeller(selectedSellerDetail);
                    setSelectedSellerDetail(null);
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Unfreeze Store</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleFreezeSeller(selectedSellerDetail);
                    setSelectedSellerDetail(null);
                  }}
                  className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  title="Freeze seller store"
                >
                  <Lock className="w-4 h-4" />
                  <span>Freeze Store</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      `Permanently delete seller "${selectedSellerDetail.shopName || selectedSellerDetail.sellerName}" and wipe all backend database records, products, and documents?`
                    )
                  ) {
                    deleteSeller(selectedSellerDetail.id);
                    setSelectedSellerDetail(null);
                    triggerToast('Seller profile and all backend records permanently deleted.');
                  }
                }}
                className="px-3.5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Permanently delete seller"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Store</span>
              </button>
              <button
                onClick={() => setSelectedSellerDetail(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs ml-auto cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REJECT SELLER APPLICATION                          */}
      {/* ========================================================= */}
      {rejectingSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setRejectingSeller(null)}
          />
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 z-10 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold shrink-0">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Reject Seller Application
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {rejectingSeller.shopName || rejectingSeller.sellerName} ({rejectingSeller.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectingSeller(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Select or specify rejection reason:
              </label>

              {/* Preset reason chips */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Incomplete or unreadable KYC verification documents',
                  'Invalid or unverified phone number / store details',
                  'Document photo too blurry to verify identity',
                  'Application requirements not met',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setSellerRejectionReason(preset)}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                      sellerRejectionReason === preset
                        ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div>
                <textarea
                  value={sellerRejectionReason}
                  onChange={(e) => setSellerRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Additional explanation for the seller..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none font-medium"
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                The seller's status will be marked as <span className="text-rose-400 font-bold">REJECTED</span> and they will be removed from your dashboard's pending queue immediately.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRejectingSeller(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRejectSeller}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/30"
              >
                <X className="w-3.5 h-3.5" />
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: KYC HIGH-RES DOCUMENT INSPECTION LIGHTBOX         */}
      {/* ========================================================= */}
      {kycInspectSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setKycInspectSeller(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 z-10 space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#0284C7]" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    KYC Document Inspection
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 uppercase tracking-wide">
                    {kycInspectSeller.kycDocumentType || kycInspectSeller.kycDocuments?.documentType || 'ID Card'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Store: <strong className="text-slate-800">{kycInspectSeller.shopName}</strong> • Seller: {kycInspectSeller.sellerName} ({kycInspectSeller.email})
                </p>
              </div>
              <button
                onClick={() => setKycInspectSeller(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View Switcher Tabs: Front, Back, Both */}
            <div className="flex items-center justify-between bg-slate-100 p-1 rounded-xl">
              <div className="flex items-center gap-1 w-full">
                <button
                  onClick={() => setKycInspectSide('front')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    kycInspectSide === 'front'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1. Front Side View
                </button>
                <button
                  onClick={() => setKycInspectSide('back')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    kycInspectSide === 'back'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2. Back Side View
                </button>
                <button
                  onClick={() => setKycInspectSide('both')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    kycInspectSide === 'both'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Side-by-Side (Both)
                </button>
              </div>
            </div>

            {/* Document Image View */}
            <div className="space-y-4">
              {kycInspectSide === 'front' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                    <span>Front Side ({kycInspectSeller.kycDocumentType || kycInspectSeller.kycDocuments?.documentType || 'ID Card'})</span>
                    <span className="text-emerald-600 text-[11px] font-semibold">High Resolution Verified</span>
                  </div>
                  <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[280px] max-h-[460px]">
                    {(kycInspectSeller.frontImage || kycInspectSeller.kycFrontImageUrl || kycInspectSeller.kycDocuments?.frontImageUrl) ? (
                      <img
                        src={kycInspectSeller.frontImage || kycInspectSeller.kycFrontImageUrl || kycInspectSeller.kycDocuments?.frontImageUrl}
                        alt="Front Document"
                        className="max-h-[460px] w-auto object-contain"
                      />
                    ) : (
                      <div className="text-slate-400 text-sm flex flex-col items-center gap-2 p-8">
                        <FileText className="w-8 h-8 text-slate-500" />
                        <span>No Front Document Image Provided</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {kycInspectSide === 'back' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                    <span>Back Side ({kycInspectSeller.kycDocumentType || kycInspectSeller.kycDocuments?.documentType || 'ID Card'})</span>
                    <span className="text-emerald-600 text-[11px] font-semibold">High Resolution Verified</span>
                  </div>
                  <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center min-h-[280px] max-h-[460px]">
                    {(kycInspectSeller.backImage || kycInspectSeller.kycBackImageUrl || kycInspectSeller.kycDocuments?.backImageUrl) ? (
                      <img
                        src={kycInspectSeller.backImage || kycInspectSeller.kycBackImageUrl || kycInspectSeller.kycDocuments?.backImageUrl}
                        alt="Back Document"
                        className="max-h-[460px] w-auto object-contain"
                      />
                    ) : (
                      <div className="text-slate-400 text-sm flex flex-col items-center gap-2 p-8">
                        <FileText className="w-8 h-8 text-slate-500" />
                        <span>No Back Document Image Provided</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {kycInspectSide === 'both' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-700">1. Front Side</div>
                    <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center h-56">
                      {(kycInspectSeller.frontImage || kycInspectSeller.kycFrontImageUrl || kycInspectSeller.kycDocuments?.frontImageUrl) ? (
                        <img
                          src={kycInspectSeller.frontImage || kycInspectSeller.kycFrontImageUrl || kycInspectSeller.kycDocuments?.frontImageUrl}
                          alt="Front Side"
                          className="max-h-56 w-auto object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                          <FileText className="w-6 h-6 text-slate-500" />
                          <span>No Front Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-bold text-slate-700">2. Back Side</div>
                    <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center h-56">
                      {(kycInspectSeller.backImage || kycInspectSeller.kycBackImageUrl || kycInspectSeller.kycDocuments?.backImageUrl) ? (
                        <img
                          src={kycInspectSeller.backImage || kycInspectSeller.kycBackImageUrl || kycInspectSeller.kycDocuments?.backImageUrl}
                          alt="Back Side"
                          className="max-h-56 w-auto object-contain"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs flex flex-col items-center gap-1">
                          <FileText className="w-6 h-6 text-slate-500" />
                          <span>No Back Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Verification Controls / Action Toolbar */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <StatusBadge status={kycInspectSeller.applicationStatus} />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                {kycInspectSeller.applicationStatus === 'PENDING' ? (
                  <>
                    <button
                      onClick={() => {
                        handleApproveSeller(kycInspectSeller);
                        setKycInspectSeller(null);
                      }}
                      className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve KYC & Store</span>
                    </button>
                    <button
                      onClick={() => {
                        handleFreezeSeller(kycInspectSeller);
                        setKycInspectSeller(null);
                      }}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Freeze seller store"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Freeze Store</span>
                    </button>
                    <button
                      onClick={() => {
                        handleRejectSeller(kycInspectSeller);
                        setKycInspectSeller(null);
                      }}
                      className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject KYC</span>
                    </button>
                  </>
                ) : kycInspectSeller.applicationStatus === 'FROZEN' ? (
                  <button
                    onClick={() => {
                      handleUnfreezeSeller(kycInspectSeller);
                      setKycInspectSeller(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Unfreeze Store</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleFreezeSeller(kycInspectSeller);
                      setKycInspectSeller(null);
                    }}
                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    title="Freeze seller store"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Freeze Store</span>
                  </button>
                )}
                <button
                  onClick={() => setKycInspectSeller(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Done Inspecting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ASSIGN ORDER TO SELLER                             */}
      {/* ========================================================= */}
      {assigningOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setAssigningOrder(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Assign Order #{assigningOrder.orderNumber}
              </h3>
              <button
                onClick={() => setAssigningOrder(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignOrder} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Select Verified Seller
                </label>
                <select
                  required
                  value={selectedSellerId}
                  onChange={(e) => setSelectedSellerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
                >
                  <option value="">-- Choose Seller (Sorted A to Z) --</option>
                  {[...approvedSellers]
                    .sort((a, b) => {
                      const nameA = (a.shopName || a.sellerName || a.email || '').trim().toLowerCase();
                      const nameB = (b.shopName || b.sellerName || b.email || '').trim().toLowerCase();
                      return nameA.localeCompare(nameB);
                    })
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shopName || s.sellerName} ({s.email || s.id})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!selectedSellerId}
                  className="flex-1 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Confirm Assignment
                </button>
                <button
                  type="button"
                  onClick={() => setAssigningOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT                                 */}
      {/* ========================================================= */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setShowProductModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 z-10 space-y-4 my-8 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                {editingProduct ? 'Edit Catalog Product' : 'Add New Catalog Product'}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Memory Foam Plush Mattress"
                  className="w-full p-2.5 bg-white text-black font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Product description and details..."
                  className="w-full p-2.5 bg-white text-black font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white text-xs font-semibold text-black"
                    style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Seller Commission (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    value={productForm.sellerCommission}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setProductForm({
                        ...productForm,
                        sellerCommission: val,
                        customAdminCommissionPct: val,
                      });
                    }}
                    placeholder="e.g. 15"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white text-xs font-semibold text-black"
                    style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7] font-bold bg-white text-xs text-black"
                    style={{ color: '#000000' }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={productForm.stock}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white text-xs font-semibold text-black"
                    style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  required
                  value={productForm.images[0] || ''}
                  onChange={(e) => setProductForm({ ...productForm, images: [e.target.value] })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none font-mono text-[11px] bg-white text-black font-semibold"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl font-bold text-xs transition-colors"
                >
                  {editingProduct ? 'Save Changes' : 'Publish Product'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ASSIGNED ORDER MODAL */}
      {viewingAssignedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Order Details #{viewingAssignedOrder.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatOrderDateTime(viewingAssignedOrder.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setViewingAssignedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Customer</span>
                <p className="font-bold text-slate-800">{viewingAssignedOrder.customerName}</p>
                <p className="text-slate-600 font-mono text-[11px]">{viewingAssignedOrder.customerEmail}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Shipping Address</span>
                <p className="font-semibold text-slate-700">
                  {viewingAssignedOrder.shippingAddress?.street}, {viewingAssignedOrder.shippingAddress?.city}
                </p>
                <p className="text-slate-500 text-[11px]">
                  {viewingAssignedOrder.shippingAddress?.state} {viewingAssignedOrder.shippingAddress?.zipCode}, {viewingAssignedOrder.shippingAddress?.country}
                </p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-bold text-xs text-slate-700 mb-2 uppercase tracking-wider">Ordered Items</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {viewingAssignedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 border border-slate-100 rounded-xl bg-white">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-12 h-12 object-contain rounded-lg border border-slate-100 bg-slate-50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{item.productName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        ${item.unitPrice.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-xs text-slate-900">${item.totalPrice.toFixed(2)}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">+${item.sellerEarning?.toFixed(2)} seller</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials */}
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">${viewingAssignedOrder.subtotal?.toFixed(2) || viewingAssignedOrder.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Amount:</span>
                <span className="font-extrabold text-slate-900 text-sm">${viewingAssignedOrder.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Seller Profit (21%):</span>
                <span className="font-bold">${(viewingAssignedOrder.totalSellerEarning || (viewingAssignedOrder.totalAmount * 0.21)).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingAssignedOrder(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ASSIGNED ORDER STATUS MODAL */}
      {editingAssignedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Update Order Status
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  #{editingAssignedOrder.id}
                </p>
              </div>
              <button
                onClick={() => setEditingAssignedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Order Status
                </label>
                <select
                  value={orderStatusChangeVal}
                  onChange={(e) => setOrderStatusChangeVal(e.target.value as OrderStatus)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white font-semibold"
                >
                  <option value="PENDING">Pending</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="PROCESSING">Processing / Picked</option>
                  <option value="ON_THE_WAY">On The Way</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Package picked from local hub"
                  value={orderStatusChangeNote}
                  onChange={(e) => setOrderStatusChangeNote(e.target.value)}
                  className="w-full p-2.5 bg-white text-black font-semibold border border-slate-300 rounded-xl focus:outline-none"
                  style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={handleSaveEditedOrderStatus}
                  className="flex-1 py-2.5 bg-[#0284C7] hover:bg-sky-600 text-white rounded-xl font-bold text-xs transition-colors"
                >
                  Save Status
                </button>
                <button
                  type="button"
                  onClick={() => setEditingAssignedOrder(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING DRAGGABLE CORNER CART TRIGGER BUTTON */}
      <div
        ref={cartBtnRef}
        style={{
          left: cartPos ? `${cartPos.x}px` : undefined,
          top: cartPos ? `${cartPos.y}px` : undefined,
          right: cartPos ? 'auto' : '1.5rem',
          bottom: cartPos ? 'auto' : '1.5rem',
        }}
        onPointerDown={handleCartPointerDown}
        onPointerMove={handleCartPointerMove}
        onPointerUp={handleCartPointerUp}
        onPointerCancel={() => {
          isDraggingCartRef.current = false;
        }}
        className="fixed z-40 select-none touch-none cursor-grab active:cursor-grabbing transition-transform active:scale-95"
        title="Drag to move anywhere • Click to open cart"
      >
        <div className="flex items-center gap-2.5 px-4 py-3 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-full shadow-2xl border-2 border-white/90 backdrop-blur-xs">
          <GripVertical className="w-4 h-4 opacity-75 shrink-0 text-white/90" />
          <div className="relative shrink-0">
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 bg-amber-400 text-slate-900 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </div>
          <span className="font-bold text-xs whitespace-nowrap">
            Cart {cartCount > 0 ? `(${cartCount})` : ''} • ${cartSubtotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* SIDE CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-8 sm:pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-100 text-[#0284C7] flex items-center justify-center shadow-xs">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                      Shopping Cart
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800">
                        {cartCount} {cartCount === 1 ? 'item' : 'items'}
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Product quantity & order assignment
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {cart.length > 0 && (
                    <button
                      onClick={() => {
                        clearCart();
                        triggerToast('Cart cleared.');
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Clear Cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] hidden sm:inline">Clear</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Items Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
                {cart.length === 0 ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-400 flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Your Cart is Empty</h3>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Click the &quot;Cart&quot; button on any product card in the Sellers Products catalog to add items here.
                      </p>
                    </div>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 bg-white border border-slate-200/90 rounded-xl shadow-xs hover:border-slate-300 transition-all"
                    >
                      <div className="w-14 h-14 bg-slate-50 rounded-lg p-1 border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-sky-600 font-extrabold mt-0.5">
                          ${item.product.price.toFixed(2)} / unit
                        </p>

                        {/* Quantity Controller & Item Total */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                            <button
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  removeFromCart(item.product.id);
                                } else {
                                  updateCartQuantity(item.product.id, item.quantity - 1);
                                }
                              }}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                              title="Decrease quantity"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 py-0.5 text-xs font-extrabold text-slate-800 bg-white min-w-[24px] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              className="px-2 py-0.5 text-slate-600 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                              title="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="text-[11px] text-slate-600 font-bold">
                            = ${(item.product.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          removeFromCart(item.product.id);
                          triggerToast(`Removed "${item.product.name}" from cart.`);
                        }}
                        className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer / Financial Summary */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/90 space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Total Items ({cartCount} pcs):</span>
                      <span className="font-semibold text-slate-800">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Platform Order Fulfillment:</span>
                      <span className="font-semibold text-emerald-600">Standard Delivery</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Total Amount:</span>
                      <span className="text-base font-extrabold text-[#0284C7]">${cartSubtotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Customer Details for Admin-created Order */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
                      <span>Customer Details (Required)</span>
                      <span className="text-[10px] text-rose-600 font-semibold">Real email needed</span>
                    </div>
                    <input
                      type="text"
                      value={adminOrderCustomer.fullName}
                      onChange={(e) => setAdminOrderCustomer({ ...adminOrderCustomer, fullName: e.target.value })}
                      placeholder="Customer Full Name *"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-black font-medium focus:outline-none focus:border-[#0284C7]"
                      style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                    />
                    <input
                      type="email"
                      value={adminOrderCustomer.email}
                      onChange={(e) => setAdminOrderCustomer({ ...adminOrderCustomer, email: e.target.value })}
                      placeholder="Customer Real Email Address *"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-black font-medium focus:outline-none focus:border-[#0284C7]"
                      style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                    />
                    <input
                      type="tel"
                      value={adminOrderCustomer.phone}
                      onChange={(e) => setAdminOrderCustomer({ ...adminOrderCustomer, phone: e.target.value })}
                      placeholder="Customer Phone (Optional)"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-black font-medium focus:outline-none focus:border-[#0284C7]"
                      style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                    />
                    <input
                      type="text"
                      value={adminOrderCustomer.street}
                      onChange={(e) => setAdminOrderCustomer({ ...adminOrderCustomer, street: e.target.value })}
                      placeholder="Street Address (Optional)"
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-black font-medium focus:outline-none focus:border-[#0284C7]"
                      style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={adminOrderCustomer.city}
                        onChange={(e) => setAdminOrderCustomer({ ...adminOrderCustomer, city: e.target.value })}
                        placeholder="City"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-black font-medium focus:outline-none focus:border-[#0284C7]"
                        style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                      />
                      <input
                        type="text"
                        value={adminOrderCustomer.country}
                        onChange={(e) => setAdminOrderCustomer({ ...adminOrderCustomer, country: e.target.value })}
                        placeholder="Country"
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-black font-medium focus:outline-none focus:border-[#0284C7]"
                        style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
                      />
                    </div>
                  </div>

                  {/* Target Seller Selection for Cart Assignment (strictly A to Z) */}
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 block flex items-center justify-between">
                      <span>Assign to Seller (A to Z)</span>
                      <span className="text-[10px] text-[#0284C7] font-semibold">Sorted A–Z</span>
                    </label>
                    <select
                      value={selectedSellerEmail}
                      onChange={(e) => {
                        setSelectedSellerEmail(e.target.value);
                        setSellerSearchQuery('');
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0284C7]"
                    >
                      <option value="">-- Choose Seller by Gmail (A to Z) --</option>
                      {[...sellers]
                        .sort((a, b) => {
                          const emailA = (a.email || '').trim().toLowerCase();
                          const emailB = (b.email || '').trim().toLowerCase();
                          return emailA.localeCompare(emailB);
                        })
                        .map((s) => (
                          <option key={s.id} value={s.email || s.id}>
                            {s.email} — {s.shopName || s.sellerName}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      onClick={handleAssignCartToSeller}
                      className="w-full py-3 bg-[#0284C7] hover:bg-sky-600 text-white rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 transition-all cursor-pointer"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span>Assign & Create Order for Seller</span>
                    </button>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                      Continue Browsing
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRM DELETE WITHDRAWAL REQUEST RECORD           */}
      {/* ========================================================= */}
      {deleteConfirmWithdrawalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Delete Withdrawal Record
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to delete withdrawal request <span className="font-mono font-bold text-slate-900">#{deleteConfirmWithdrawalId}</span>?
                This action will remove the record completely from both the <strong className="text-slate-700">Admin Console</strong> and the <strong className="text-slate-700">Seller&apos;s Withdrawal History</strong>.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-amber-800 text-[11px] font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Note: Deleting a record is permanent. If this request was pending, the log entry will be removed.
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmWithdrawalId(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmWithdrawalId) {
                    deleteWithdrawalRequest(deleteConfirmWithdrawalId);
                    triggerToast(`Withdrawal #${deleteConfirmWithdrawalId} removed from admin & seller dashboards.`);
                    setDeleteConfirmWithdrawalId(null);
                  }
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REJECT WITHDRAWAL REQUEST WITH REASON               */}
      {/* ========================================================= */}
      {rejectingWithdrawalId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
              <XCircle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                Reject Withdrawal Request
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Provide a reason for rejecting request <span className="font-mono font-bold text-slate-900">#{rejectingWithdrawalId}</span>. The requested amount will be credited back to the seller&apos;s available wallet balance.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Rejection Reason (Visible to Seller)
              </label>
              <textarea
                rows={3}
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                placeholder="E.g., Bank account details do not match seller profile, or invalid IFSC / wallet address..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white text-black focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none font-semibold"
                style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingWithdrawalId(null);
                  setRejectionReasonText('Account details verification failed');
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (rejectingWithdrawalId) {
                    rejectWithdrawalRequest(
                      rejectingWithdrawalId,
                      rejectionReasonText.trim() || 'Account details verification failed'
                    );
                    triggerToast(`Withdrawal #${rejectingWithdrawalId} rejected and refunded.`);
                    setRejectingWithdrawalId(null);
                    setRejectionReasonText('Account details verification failed');
                  }
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Confirm Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* FLOATING FIXED CUSTOMER CARE CHAT WIDGET FOR ADMIN        */}
      {/* Pinned fixed on screen while scrolling any admin tab       */}
      {/* ========================================================= */}
      {activeTab !== 'conversations' && (
        isAdminFloatingChatOpen ? (
          <div className="fixed bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[440px] h-[550px] max-h-[calc(100dvh-4.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 font-sans">
            {/* Header with Seller Switcher */}
            <div className="bg-[#008069] text-white px-3.5 py-2.5 flex items-center justify-between shrink-0 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-xs border border-white/30">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border border-[#008069] rounded-full"></span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">Customer Care Desk</span>
                  </div>
                  {/* Active Seller Picker Dropdown */}
                  <select
                    value={activeConvId || unifiedConversations[0]?.id || ''}
                    onChange={(e) => setActiveConvId(e.target.value)}
                    className="w-full text-[11px] font-semibold bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 rounded px-1.5 py-0.5 border border-emerald-600/60 focus:outline-none cursor-pointer truncate mt-0.5"
                  >
                    {unifiedConversations.length === 0 ? (
                      <option value="">No active threads</option>
                    ) : (
                      unifiedConversations.map((c) => {
                        const sName = getParticipantShop(c);
                        const uCount = getAdminUnreadCount(c);
                        return (
                          <option key={c.id} value={c.id}>
                            {sName} {uCount > 0 ? `(${uCount} new)` : ''}
                          </option>
                        );
                      })
                    )}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1 ml-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminFloatingChatOpen(false);
                    setActiveTab('conversations');
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                  className="p-1.5 text-white/90 hover:text-white hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
                  title="Expand to full Conversations Desk"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminFloatingChatOpen(false)}
                  className="p-1.5 text-white/90 hover:text-white hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
                  title="Minimize chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Messages Area (ONLY messages scroll!) */}
            <div
              ref={floatingChatScroll.containerRef}
              onScroll={floatingChatScroll.onScroll}
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.035' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {(() => {
                const currentFloatingConv =
                  unifiedConversations.find((c) => c.id === activeConvId || (c as any).allConvIds?.includes(activeConvId)) ||
                  unifiedConversations[0];
                if (!currentFloatingConv) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                      <MessageSquare className="w-10 h-10 text-slate-400 mb-2" />
                      <p className="text-xs font-bold text-slate-700">No seller conversations yet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">When a seller contacts customer support, their thread will show here.</p>
                    </div>
                  );
                }

                const floatingSellerId =
                  currentFloatingConv.participantOneRole === 'SELLER'
                    ? currentFloatingConv.participantOneId
                    : currentFloatingConv.participantTwoRole === 'SELLER'
                    ? currentFloatingConv.participantTwoId
                    : currentFloatingConv.id;

                const targetFloatingConvIds = new Set<string>((currentFloatingConv as any)?.allConvIds || [currentFloatingConv.id]);
                if (floatingSellerId) {
                  targetFloatingConvIds.add(floatingSellerId);
                  targetFloatingConvIds.add(floatingSellerId.replace(/^conv_/, ''));
                  targetFloatingConvIds.add(`conv_${floatingSellerId.replace(/^conv_/, '')}`);
                }
                if ((currentFloatingConv as any)?.sellerMatch?.id) targetFloatingConvIds.add((currentFloatingConv as any).sellerMatch.id);
                if ((currentFloatingConv as any)?.sellerMatch?.userId) targetFloatingConvIds.add((currentFloatingConv as any).sellerMatch.userId);

                const floatingMessagesMap = new Map<string, any>();
                messages
                  .filter(
                    (m) =>
                      targetFloatingConvIds.has(m.conversationId) ||
                      targetFloatingConvIds.has(m.senderId) ||
                      ((m as any).receiverId && targetFloatingConvIds.has((m as any).receiverId))
                  )
                  .forEach((m) => floatingMessagesMap.set(m.id, m));
                liveChatMessages.forEach((m) => floatingMessagesMap.set(m.id, m));
                const threadMessages = Array.from(floatingMessagesMap.values()).sort(
                  (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                if (threadMessages.length === 0) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500">
                      <div className="w-10 h-10 rounded-full bg-white text-[#008069] flex items-center justify-center mb-2 shadow-xs">
                        <Headphones className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Chat with {getParticipantShop(currentFloatingConv)}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Send a message below to assist the merchant.</p>
                    </div>
                  );
                }

                return threadMessages.map((msg, index) => {
                  const isAdmin = msg.senderRole === 'ADMIN';
                  return (
                    <div
                      key={msg.id || index}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-1`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-1.5 shadow-2xs text-[13px] leading-relaxed relative ${
                          isAdmin
                            ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-emerald-200/40'
                            : 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/50'
                        }`}
                      >
                        <p className="text-[10px] font-bold text-[#008069] mb-0.5">
                          {isAdmin ? 'You (Admin)' : getParticipantShop(currentFloatingConv)}
                        </p>
                        {msg.imageUrl && (
                          <div className="mb-1 rounded-lg overflow-hidden max-w-[220px] bg-slate-100"><img src={msg.imageUrl} alt="attachment" onLoad={floatingChatScroll.onMediaLoad} className="w-full h-auto object-cover max-h-48" />
                          </div>
                        )}
                        {msg.text && (
                          <p className="whitespace-pre-wrap break-words select-text font-normal">{msg.text}</p>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
              <div ref={adminFloatingMessagesEndRef} />
            </div>

            {/* Attached image preview */}
            {adminFloatingChatImage && (
              <div className="px-3 py-1.5 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-2 shrink-0">
                <div className="relative">
                  <img src={adminFloatingChatImage} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-emerald-500" />
                  <button
                    type="button"
                    onClick={() => setAdminFloatingChatImage(null)}
                    className="absolute -top-1 -right-1 bg-slate-700 text-white rounded-full p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-[11px] text-slate-600 font-medium">Photo attached</span>
              </div>
            )}

            {/* Fixed Bottom Input Bar */}
            <div className="bg-[#f0f2f5] border-t border-slate-200 p-2 shrink-0">
              <div className="flex items-end gap-1.5">
                <input
                  type="file"
                  ref={adminFloatingFileRef}
                  accept="image/*"
                  onChange={handleAdminFloatingImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => adminFloatingFileRef.current?.click()}
                  title="Attach photo"
                  className="p-2 text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer shrink-0 mb-0.5"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                <div className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1 shadow-2xs flex items-center focus-within:ring-2 focus-within:ring-[#00a884]/40 transition-all">
                  <textarea
                    ref={adminFloatingTextareaRef}
                    rows={1}
                    value={adminFloatingChatInput}
                    onChange={(e) => setAdminFloatingChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendAdminFloatingChat();
                      }
                    }}
                    placeholder="Type reply to seller (Enter to send)..."
                    className="w-full bg-transparent border-0 p-0 text-[13px] font-medium text-black placeholder:text-slate-400 resize-none focus:outline-none focus:ring-0 leading-snug max-h-24 overflow-y-auto"
                    style={{ color: '#000000', WebkitTextFillColor: '#000000', caretColor: '#000000' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendAdminFloatingChat}
                  disabled={!adminFloatingChatInput.trim() && !adminFloatingChatImage}
                  className="w-9 h-9 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 active:scale-95 shadow-sm mb-0.5"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Floating Quick Support Desk Launcher Button (Fixed on Screen) */
          <button
            type="button"
            onClick={() => setIsAdminFloatingChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 bg-[#008069] hover:bg-[#02906f] text-white rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-2 border-2 border-white/40 cursor-pointer font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-emerald-950/20"
            title="Open Customer Care Chat (Fixed)"
          >
            <div className="relative">
              <Headphones className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-300 rounded-full animate-pulse border border-[#008069]"></span>
            </div>
            <span>Customer Care Desk</span>
            {totalUnreadConversationsForAdmin > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black animate-bounce">
                {totalUnreadConversationsForAdmin}
              </span>
            )}
          </button>
        )
      )}

      {/* ========================================================= */}
      {/* MODAL: FIRESTORE SECURITY RULES (LIVE DEPLOYMENT FIX)      */}
      {/* ========================================================= */}
      {showFirestoreRulesModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-slate-700 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Firebase Firestore Rules Setup
                  </h3>
                  <p className="text-xs text-slate-400">
                    Allow seller registration & chat data to sync live across devices
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFirestoreRulesModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2.5 text-xs">
              <p className="font-bold text-amber-300">
                Why was data not syncing to the Admin Panel?
              </p>
              <p className="text-slate-300 leading-relaxed">
                By default, new Firebase Firestore databases start in &quot;Locked Mode&quot; (rejecting all writes from public or unauthenticated web visitors). When a seller registers, Firebase rejects the write with <code className="bg-slate-800 text-rose-300 px-1 py-0.5 rounded font-mono">PERMISSION_DENIED</code>.
              </p>
              <p className="font-bold text-white pt-1">
                How to fix in 1 minute in Firebase Console:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                <li>Open <a href="https://console.firebase.google.com/project/waifairnew/firestore/rules" target="_blank" rel="noreferrer" className="text-sky-400 underline font-bold">Firebase Console &gt; Firestore &gt; Rules</a></li>
                <li>Copy the rules code below and paste it into the editor</li>
                <li>Click <strong className="text-emerald-400">Publish</strong></li>
              </ol>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 font-mono">firestore.rules</span>
                <button
                  type="button"
                  onClick={() => {
                    const rules = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}`;
                    navigator.clipboard.writeText(rules);
                    setRulesCopied(true);
                    setTimeout(() => setRulesCopied(false), 2500);
                  }}
                  className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{rulesCopied ? 'Copied to Clipboard!' : 'Copy Rules'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] text-emerald-400 border border-slate-800 overflow-x-auto leading-relaxed select-all">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`}
              </pre>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowFirestoreRulesModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleRefreshData();
                  setShowFirestoreRulesModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Test Connection Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
