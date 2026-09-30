import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  LayoutGrid,
  Package,
  Receipt,
  MessageSquare,
  MoreHorizontal,
  X,
  ShoppingCart,
  Truck,
  User,
  LogIn,
  LogOut,
  Store,
  ChevronRight,
  HelpCircle,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import { Order } from '../../types';

interface CustomerBottomNavProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenCart,
  onOpenAuth,
}) => {
    const {
    currentUser,
    orders,
    cartCount,
    cartSubtotal,
    logoutUser,
    sendMessage,
    startOrGetSupportConversation,
    messages,
    sellerSession,
  } = useStore();

  const isSellerLoggedIn = Boolean(
    currentUser?.role === 'SELLER' ||
    (sellerSession && sellerSession.expiresAt > Date.now()) ||
    (() => {
      try {
        const sessStr = localStorage.getItem('nexus_seller_session');
        if (sessStr) {
          const parsed = JSON.parse(sessStr);
          return Boolean(parsed && parsed.expiresAt > Date.now());
        }
      } catch {}
      return false;
    })()
  );

  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [showTrackOrderModal, setShowTrackOrderModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);

  // Track order state for guest or customer
  const [trackingInput, setTrackingInput] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [trackError, setTrackError] = useState('');

  // Support chat state
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  // Only calculate customer orders count if user is genuinely logged in (has email & not a generic guest)
  const isUserLoggedIn = Boolean(
    currentUser &&
    currentUser.email &&
    currentUser.id !== 'guest_visitor' &&
    currentUser.id !== 'user_customer_guest'
  );

  const customerOrders = isUserLoggedIn
    ? orders.filter(
        (o) =>
          o &&
          (o.customerId === currentUser.id ||
            (currentUser.email &&
              o.customerEmail &&
              o.customerEmail.toLowerCase().trim() === currentUser.email.toLowerCase().trim()))
      )
    : [];

  // Active / new pending orders placed by this logged in customer
  const activePendingOrders = customerOrders.filter(
    (o) => o && (o.status === 'PENDING' || o.status === 'PROCESSING')
  );

  // Badge count: ONLY show if logged in AND has new/pending orders. Never show fake/arbitrary badges.
  const displayOrdersBadgeCount = activePendingOrders.length;

  // Real unread support messages for this user
  const unreadSupportCount = isUserLoggedIn
    ? messages.filter(
        (m) => m.recipientId === currentUser.id && !m.isRead && m.senderId !== currentUser.id
      ).length
    : 0;

  const isHomeActive = currentView === 'home';
  const isProductsActive = currentView === 'shop' || currentView === 'product';
  const isOrdersActive = currentView === 'customer' || showTrackOrderModal;

  // Handle click on Orders tab
  const handleOrdersTabClick = () => {
    if (currentUser && currentUser.role === 'CUSTOMER') {
      onNavigate('customer');
    } else {
      // Guest or not logged in: show Track Order & Orders Modal
      setShowTrackOrderModal(true);
    }
  };

  // Handle click on Support tab
  const handleSupportTabClick = () => {
    setShowSupportModal(true);
  };

  // Track order submission
  const handleTrackSubmit = (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    const query = (customId || trackingInput).trim().toLowerCase();
    if (!query) {
      setTrackError('Please enter an Order ID to track.');
      return;
    }

    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === query ||
        (o.orderNumber || '').toLowerCase() === query ||
        o.id.toLowerCase().includes(query) ||
        (o.orderNumber || '').toLowerCase().includes(query)
    );

    if (found) {
      setSearchedOrder(found);
      setTrackError('');
    } else {
      setSearchedOrder(null);
      setTrackError(`No order found matching "${customId || trackingInput}". Please verify the number.`);
    }
  };

  // Send support message
  const handleSendSupportMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;

    try {
      const conv = startOrGetSupportConversation(currentUser.id || 'guest_user', currentUser.name || 'Customer Shopper', 'CUSTOMER');
      sendMessage(conv.id, supportMessage.trim());
      setSupportMessage('');
      setSupportSubmitted(true);
      setTimeout(() => setSupportSubmitted(false), 4000);
    } catch {
      setSupportSubmitted(true);
    }
  };

    // Navigate to seller portal — never blind-pick a seller identity
  const handleGoToSeller = () => {
    setShowMoreDrawer(false);
    if (isSellerLoggedIn) {
      onNavigate('seller');
    } else {
      onNavigate('seller-login');
    }
  };

  // Format order date
  const formatOrderDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently placed';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      {/* =================================================================== */}
      {/* 1. PERSISTENT CUSTOMER TOP NAVIGATION BAR (FOR DESKTOP / LAPTOPS)  */}
      {/* =================================================================== */}
      <nav
        id="customer-top-navigation"
        aria-label="Customer Quick Navigation"
        className="hidden md:block sticky top-0 z-40 bg-gradient-to-r from-slate-950 via-[#0e1628] to-slate-950 text-slate-200 border-b border-indigo-500/20 shadow-xs font-sans py-1.5 px-4 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Subtle Store Tagline / Live Status on Left */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300 font-semibold">Waifair Verified Superstore</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-[10px]">Laptops, GPUs, Tech & Electronics</span>
          </div>

          {/* Navigation Pill Buttons (Slim, Compact, Color Accented) */}
          <div className="flex items-center justify-end gap-2 overflow-x-auto scrollbar-none py-0.5">
            {/* 1. Home Tab */}
            <button
              id="customer-tab-home"
              type="button"
              onClick={() => onNavigate('home')}
              className={`flex items-center gap-1.5 py-1 px-3 rounded-full font-bold text-[11px] cursor-pointer transition-all shrink-0 ${
                isHomeActive
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Home</span>
            </button>

            {/* 2. Products Tab */}
            <button
              id="customer-tab-products"
              type="button"
              onClick={() => onNavigate('shop')}
              className={`flex items-center gap-1.5 py-1 px-3 rounded-full font-bold text-[11px] cursor-pointer transition-all shrink-0 ${
                isProductsActive
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Package className="w-3.5 h-3.5 stroke-[2]" />
              <span>Products</span>
            </button>

            {/* 3. Orders Tab with Badge */}
            <button
              id="customer-tab-orders"
              type="button"
              onClick={handleOrdersTabClick}
              className={`flex items-center gap-1.5 py-1 px-3 rounded-full font-bold text-[11px] cursor-pointer transition-all shrink-0 relative ${
                isOrdersActive
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 stroke-[2]" />
              <span>Orders</span>
              {displayOrdersBadgeCount > 0 && (
                <span className={`min-w-3.5 h-3.5 px-1 rounded-full text-[8px] font-black flex items-center justify-center ${
                  isOrdersActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-400 text-slate-950'
                }`}>
                  {displayOrdersBadgeCount}
                </span>
              )}
            </button>

            {/* 4. Support Tab with Dynamic Notification Badge */}
            <button
              id="customer-tab-support"
              type="button"
              onClick={handleSupportTabClick}
              className="flex items-center gap-1.5 py-1 px-3 rounded-full font-bold text-[11px] cursor-pointer transition-all shrink-0 text-slate-300 hover:text-white hover:bg-slate-800/70 relative"
            >
              <MessageSquare className="w-3.5 h-3.5 stroke-[2]" />
              <span>Support</span>
              {unreadSupportCount > 0 && (
                <span className="min-w-3.5 h-3.5 px-1 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black flex items-center justify-center shadow-xs">
                  {unreadSupportCount}
                </span>
              )}
            </button>

            {/* 5. More Tab */}
            <button
              id="customer-tab-more"
              type="button"
              onClick={() => setShowMoreDrawer(true)}
              className={`flex items-center gap-1.5 py-1 px-3 rounded-full font-bold text-[11px] cursor-pointer transition-all shrink-0 ${
                showMoreDrawer
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <MoreHorizontal className="w-3.5 h-3.5 stroke-[2]" />
              <span>More</span>
            </button>

            {/* 6. Quick Seller Dashboard Tab (When Seller is Logged In) */}
            {isSellerLoggedIn && (
              <button
                id="customer-tab-seller-dash"
                type="button"
                onClick={() => {
                  onNavigate('seller');
                }}
                className="flex items-center gap-1.5 py-1 px-3 rounded-full font-black text-[11px] cursor-pointer transition-all shrink-0 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-xs ring-1 ring-amber-400/50"
                title="Go to Seller Dashboard without signing in"
              >
                <LayoutDashboard className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Seller Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* 2. DEDICATED MOBILE BOTTOM NAVIGATION BAR (FIXED THUMB BAR FOR PHONES) */}
      {/* ===================================================================== */}
      <nav
        id="customer-bottom-navigation-mobile"
        aria-label="Mobile Quick Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl py-1 px-2 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {/* 1. Home */}
          <button
            id="mobile-nav-home"
            type="button"
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              isHomeActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isHomeActive ? 'bg-amber-400/15' : ''}`}>
              <LayoutGrid className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
          </button>

          {/* 2. Products */}
          <button
            id="mobile-nav-products"
            type="button"
            onClick={() => onNavigate('shop')}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              isProductsActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${isProductsActive ? 'bg-amber-400/15' : ''}`}>
              <Package className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Shop</span>
          </button>

          {/* 3. Orders */}
          <button
            id="mobile-nav-orders"
            type="button"
            onClick={handleOrdersTabClick}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer relative ${
              isOrdersActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg relative ${isOrdersActive ? 'bg-amber-400/15' : ''}`}>
              <Receipt className="w-4 h-4 stroke-[2]" />
              {displayOrdersBadgeCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 px-1 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black flex items-center justify-center shadow-xs">
                  {displayOrdersBadgeCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Orders</span>
          </button>

          {/* 4. Support / Chat */}
          <button
            id="mobile-nav-support"
            type="button"
            onClick={handleSupportTabClick}
            className="flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer text-slate-400 hover:text-slate-200 relative"
          >
            <div className="p-1 rounded-lg relative">
              <MessageSquare className="w-4 h-4 stroke-[2]" />
              {unreadSupportCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-3.5 h-3.5 px-1 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black flex items-center justify-center shadow-xs">
                  {unreadSupportCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">Support</span>
          </button>

          {/* 5. More */}
          <button
            id="mobile-nav-more"
            type="button"
            onClick={() => setShowMoreDrawer(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
              showMoreDrawer ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className={`p-1 rounded-lg ${showMoreDrawer ? 'bg-amber-400/15' : ''}`}>
              <MoreHorizontal className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* ===================================================================== */}
      {/* 2. CUSTOMER MORE SIDE-DRAWER (TAILORED FOR SHOPPERS & GUEST VISITORS) */}
      {/* ===================================================================== */}
      {showMoreDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          {/* Dark Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setShowMoreDrawer(false)}
          />

          {/* Left Slide-in Drawer Container */}
          <div className="fixed inset-y-0 left-0 max-w-[85%] w-72 sm:w-80 bg-slate-900 text-slate-100 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-200 border-r border-slate-800">
            {/* Top Content Area */}
            <div>
              {/* 1. Header Bar */}
              <div className="p-4 flex items-center justify-between border-b border-slate-800 bg-slate-950">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center font-bold text-base shadow-xs">
                      {isUserLoggedIn && currentUser?.name
                        ? currentUser.name.charAt(0).toUpperCase()
                        : <User className="w-5 h-5 text-amber-400" />}
                    </div>
                    {isUserLoggedIn && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <span className="font-bold text-white text-sm block truncate">
                      {isUserLoggedIn ? currentUser?.name : 'Guest Shopper'}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {isUserLoggedIn ? currentUser?.email : 'Welcome to Waifair Store'}
                    </span>
                  </div>
                </div>

                {/* Close Button (X) */}
                <button
                  type="button"
                  onClick={() => setShowMoreDrawer(false)}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Login / Register Prompt if not authenticated */}
              {!isUserLoggedIn && (
                <div className="p-3 mx-3 mt-3 bg-slate-950 border border-amber-400/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">Sign in for exclusive perks</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2.5">
                    Track orders easily, save delivery addresses, and get instant discounts.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreDrawer(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In or Register</span>
                  </button>
                </div>
              )}

              {/* Shopping Cart Quick Action */}
              <div className="px-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    onOpenCart();
                  }}
                  className="w-full p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shadow-xs">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white flex items-center gap-1.5">
                        <span>My Shopping Cart</span>
                        {cartCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                            {cartCount}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {cartCount === 0 ? 'Cart is empty' : `Subtotal: $${cartSubtotal.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* SHOPPING & BROWSING LINKS */}
              <div className="pt-3 pb-1">
                <div className="px-4 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  SHOP & EXPLORE
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    onNavigate('home');
                  }}
                  className={`w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isHomeActive
                      ? 'bg-amber-400/10 text-amber-400 font-bold border border-amber-400/20'
                      : 'text-slate-300 hover:bg-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <LayoutGrid className="w-4 h-4 text-amber-400" />
                    <span className="text-xs">Storefront Home</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    onNavigate('shop');
                  }}
                  className={`w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                    isProductsActive
                      ? 'bg-amber-400/10 text-amber-400 font-bold border border-amber-400/20'
                      : 'text-slate-300 hover:bg-slate-800 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-4 h-4 text-slate-400" />
                    <span className="text-xs">All Products & Deals</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    setShowTrackOrderModal(true);
                  }}
                  className="w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer text-slate-300 hover:bg-slate-800 font-medium transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Truck className="w-4 h-4 text-slate-400" />
                    <span className="text-xs">Track An Order</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>

              {/* CUSTOMER CARE & HELP */}
              <div className="pt-2 pb-1">
                <div className="px-4 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  CUSTOMER ASSISTANCE
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    setShowSupportModal(true);
                  }}
                  className="w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer text-slate-300 hover:bg-slate-800 font-medium transition-all"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs">24/7 Live Support Chat</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-1.5 py-0.5 rounded-full">
                    Online
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreDrawer(false);
                    setShowSupportModal(true);
                  }}
                  className="w-[calc(100%-1.5rem)] mx-3 mt-1 px-3.5 py-2.5 rounded-xl flex items-center justify-between cursor-pointer text-slate-300 hover:bg-slate-800 font-medium transition-all"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-xs">Help & Return Policies</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>

              {/* SELLER DASHBOARD QUICK ACCESS BANNER IF LOGGED IN */}
              {isSellerLoggedIn && (
                <div className="mx-3 mt-3 p-3 bg-gradient-to-r from-amber-400 to-amber-500 rounded-2xl text-slate-950 shadow-md">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-950">
                      ⚡ Seller Session Active
                    </span>
                    <span className="text-[10px] bg-slate-950 text-amber-400 font-black px-1.5 py-0.5 rounded-full">
                      Direct Access
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreDrawer(false);
                      onNavigate('seller');
                    }}
                    className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-900 active:scale-98 rounded-xl text-amber-400 font-black text-xs flex items-center justify-between cursor-pointer transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-amber-400" />
                      <span>Return to Seller Dashboard</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </button>
                </div>
              )}

              {/* MERCHANT & ADMIN DIRECT ACCESS (TESTING & ONBOARDING) */}
              <div className="mx-3 mt-3 p-3 bg-slate-950 rounded-2xl text-white shadow-sm border border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1.5">
                  🏪 Seller & Partner Portal
                </span>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMoreDrawer(false);
                      onNavigate('become-seller');
                    }}
                    className="w-full py-2 px-2.5 bg-amber-400 hover:bg-amber-300 active:scale-98 rounded-xl text-slate-950 font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-slate-950" />
                      <span>Sell On Waifair (Open Store)</span>
                    </div>
                    <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.5 rounded font-medium">Free</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGoToSeller}
                    className="w-full py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 active:scale-98 rounded-xl text-slate-200 font-semibold text-xs flex items-center justify-between cursor-pointer transition-all border border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span>Switch to Seller Dashboard</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Login</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Footer Area */}
            <div className="p-4 border-t border-slate-800 bg-slate-950">
              {isUserLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    logoutUser();
                    setShowMoreDrawer(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out ({currentUser?.name?.split(' ')[0]})</span>
                </button>
              ) : (
                <div className="text-center">
                  <p className="text-[11px] text-slate-500 font-medium">
                    Waifair Store • 100% Buyer Protection
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. TRACK ORDER & MY ORDERS MODAL */}
      {/* ===================================================================== */}
      {showTrackOrderModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                setShowTrackOrderModal(false);
                setSearchedOrder(null);
                setTrackError('');
              }}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0 shadow-xs">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">
                  Track Your Order
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your order number to check live shipping & delivery status.
                </p>
              </div>
            </div>

            {/* Track input form */}
            <form onSubmit={handleTrackSubmit} className="space-y-3 mb-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="e.g. #ORD-1788259293707-523"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Track
                </button>
              </div>

              {trackError && (
                <p className="text-xs text-rose-400 font-medium">{trackError}</p>
              )}

              {/* Sample 1-Click test order numbers */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Try Sample Orders (1-Click Test):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {orders.slice(0, 3).map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => {
                        setTrackingInput(sample.id);
                        handleTrackSubmit(undefined, sample.id);
                      }}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 hover:text-amber-400 border border-slate-800 rounded-lg text-[10px] font-mono font-medium text-slate-300 transition-colors cursor-pointer"
                    >
                      {sample.id}
                    </button>
                  ))}
                </div>
              </div>
            </form>

            {/* Found Order Details */}
            {searchedOrder ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">Order ID</span>
                    <span className="font-mono font-bold text-xs text-white">{searchedOrder.id}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {searchedOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Progress Steps */}
                <div className="py-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-2">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Placed
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Processing
                    </span>
                    <span className={searchedOrder.status === 'DELIVERED' ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-500'}>
                      {searchedOrder.status === 'DELIVERED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />} Delivered
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        searchedOrder.status === 'DELIVERED'
                          ? 'w-full bg-emerald-500'
                          : searchedOrder.status === 'ON_THE_WAY'
                          ? 'w-3/4 bg-amber-400'
                          : 'w-1/2 bg-amber-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Items preview */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
                    Order Items ({searchedOrder.items.length})
                  </span>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {searchedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {item.productImage && (
                            <img src={item.productImage} alt={item.productName} className="w-8 h-8 rounded-lg object-cover border border-slate-800" />
                          )}
                          <div className="truncate">
                            <p className="font-semibold text-white truncate">{item.productName}</p>
                            <p className="text-[10px] text-slate-400">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-bold text-amber-400 shrink-0 pl-2">
                          ${(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total & Shipping info */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{searchedOrder.shippingAddress?.city || 'Standard Delivery'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 mr-1">Total:</span>
                    <span className="font-black text-sm text-amber-400">${searchedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Recent Orders list if customer has orders */
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Your Recent Orders
                  </span>
                  {currentUser?.role !== 'CUSTOMER' && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowTrackOrderModal(false);
                        onOpenAuth();
                      }}
                      className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                    >
                      Sign In to view all
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {orders.slice(0, 3).map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setTrackingInput(ord.id);
                        setSearchedOrder(ord);
                      }}
                      className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-white">{ord.id}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                            {ord.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {formatOrderDate(ord.createdAt)} • {ord.items.length} item(s)
                        </span>
                      </div>
                      <span className="font-bold text-xs text-amber-400">${ord.totalAmount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. CUSTOMER 24/7 SUPPORT & HELP MODAL */}
      {/* ===================================================================== */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 relative animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">
                    Waifair Customer Support
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Online
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Ask us anything about products, delivery, orders, or payments.
                </p>
              </div>
            </div>

            {/* Quick FAQs */}
            <div className="mb-4 space-y-2">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
                <p className="font-bold text-amber-400">⚡ Fast Help Topics:</p>
                <ul className="text-slate-400 text-[11px] space-y-1 list-disc pl-4">
                  <li><strong className="text-slate-200">Delivery:</strong> Free 3-5 days delivery on orders above $50.</li>
                  <li><strong className="text-slate-200">Returns:</strong> 30-day hassle-free return guarantee on all items.</li>
                  <li><strong className="text-slate-200">Payment:</strong> Secure Visa, Mastercard, PayPal & Bank Transfer.</li>
                </ul>
              </div>
            </div>

            {/* Chat message form */}
            <form onSubmit={handleSendSupportMessage} className="space-y-3">
              <textarea
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="Type your message or question here..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-950 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500 resize-none"
              />

              {supportSubmitted && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Your message has been sent to our customer care team! We will reply promptly.</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowSupportModal(false);
                    onNavigate('customer');
                  }}
                  className="text-xs text-slate-400 hover:text-amber-400 font-semibold cursor-pointer underline"
                >
                  Open Full Customer Portal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
