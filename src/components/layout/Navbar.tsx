import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingCart,
  Search,
  Bell,
  User,
  Shield,
  Store,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Package,
  Heart,
  HelpCircle,
  TrendingDown,
  Layers,
  Percent,
  LogIn,
  LogOut,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '../common/Badge';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../../services/adminAuth';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

const TOP_ANNOUNCEMENTS = [
  { title: 'Tech Megasale! ⚡', description: 'Up to 40% OFF on Gaming Laptops, RTX GPUs & High-End PC Parts!', color: 'bg-indigo-700' },
  { title: 'Weekend Flash Deals! 🚀', description: 'Instant savings on 5G Smartphones, OLED Monitors & Audio Gear', color: 'bg-blue-700' },
  { title: 'New Customer Bonus! 🎁', description: 'Get $50 OFF with code ALLINONE on orders over $300 + Free Express Delivery', color: 'bg-emerald-700' },
  { title: 'All-In-One Superstore! 🌟', description: 'Verified Authentic Electronics, Smart Home Appliances, Fashion & Living', color: 'bg-amber-600' },
];

const WAYFAIR_NAV_CATEGORIES = [
  { id: 'cat_laptops', name: 'Laptops & PCs', slug: 'laptops' },
  { id: 'cat_gpus', name: 'Graphics Cards', slug: 'graphic-cards' },
  { id: 'cat_smartphones', name: 'Phones & Tablets', slug: 'smartphones' },
  { id: 'cat_electronics', name: 'Electronics & Audio', slug: 'electronics' },
  { id: 'cat_gaming', name: 'Gaming Consoles', slug: 'gaming' },
  { id: 'cat_appliances', name: 'Smart Appliances', slug: 'appliances' },
  { id: 'cat_fashion', name: 'Fashion & Watches', slug: 'fashion' },
  { id: 'cat_furniture', name: 'Furniture & Living', slug: 'furniture' },
  { id: 'cat_mattresses', name: 'Mattresses & Bedding', slug: 'mattresses' },
  { id: 'deals', name: 'Mega Deals %', slug: 'deals', isSpecial: true },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCart,
  onOpenAuth,
}) => {
  const {
    currentUser,
    switchUserRole,
    loginAdmin,
    logoutUser,
    cartCount,
    notifications,
    markNotificationAsRead,
    clearAllNotifications,
    sellers,
    users,
    sellerSession,
  } = useStore();

  // Active logged-in seller detection (from currentUser or persistent sellerSession)
  const activeSeller = useMemo(() => {
    // 1. Direct role check
    if (currentUser && currentUser.role === 'SELLER') {
      const match = sellers.find(
        (s) =>
          s &&
          (s.userId === currentUser.id ||
            s.id === currentUser.id ||
            (s.email && currentUser.email && s.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim()))
      );
      if (match) return match;
    }

    // 2. Active seller session check
    if (sellerSession && sellerSession.expiresAt > Date.now()) {
      const match = sellers.find(
        (s) =>
          s &&
          (s.userId === sellerSession.userId || s.id === sellerSession.userId)
      );
      if (match) return match;
    }

    // 3. LocalStorage seller session check
    try {
      const sessStr = localStorage.getItem('nexus_seller_session');
      if (sessStr) {
        const parsed = JSON.parse(sessStr);
        if (parsed && parsed.expiresAt > Date.now()) {
          const match = sellers.find(
            (s) =>
              s &&
              (s.userId === parsed.userId ||
                s.id === parsed.userId ||
                (parsed.email && s.email && s.email.toLowerCase().trim() === String(parsed.email).toLowerCase().trim()))
          );
          if (match) return match;
        }
      }
    } catch {}

    return null;
  }, [currentUser, sellerSession, sellers]);

  const isSellerLoggedIn = Boolean(currentUser?.role === 'SELLER' || activeSeller);

  const handleOpenSellerDashboard = () => {
    if (currentUser?.role !== 'SELLER') {
      switchUserRole('SELLER');
    }
    onNavigate('seller');
  };

  const isUserLoggedIn = Boolean(
    currentUser &&
    currentUser.id !== 'guest_visitor' &&
    currentUser.id !== 'user_customer_guest' &&
    currentUser.id !== 'user_admin_legacy' &&
    currentUser.email &&
    currentUser.email.trim() !== '' &&
    currentUser.name &&
    currentUser.name !== 'Guest Shopper' &&
    currentUser.name !== 'Customer Guest' &&
    currentUser.name !== 'Alex Carter'
  );

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking anywhere outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setNotifDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Rotate top announcement bar
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % TOP_ANNOUNCEMENTS.length);
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const userNotifs = notifications.filter(
    (n) =>
      n.recipientId === currentUser.id ||
      (currentUser.role === 'ADMIN' && n.recipientId === 'user_admin')
  );
  const unreadNotifCount = userNotifs.filter((n) => !n.isRead).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onNavigate(`shop?q=${encodeURIComponent(searchTerm.trim())}`);
      setMobileMenuOpen(false);
    } else {
      onNavigate('shop');
    }
  };

  const activeAnnouncement = TOP_ANNOUNCEMENTS[announcementIdx];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 shadow-md">
      {/* 1. Top Rotating Promo Bar */}
      <div className="bg-gradient-to-r from-[#0a0f1d] via-slate-950 to-[#0a0f1d] text-slate-200 text-xs py-1 px-4 font-semibold border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto sm:mx-0 truncate">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
              {activeAnnouncement.title}
            </span>
            <span className="text-slate-300 truncate text-[11px] sm:text-xs">
              {activeAnnouncement.description}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-[11px] text-slate-400">
            {isSellerLoggedIn ? (
              <button
                type="button"
                onClick={handleOpenSellerDashboard}
                className="text-amber-300 hover:text-white transition-colors flex items-center gap-1.5 font-bold bg-amber-400/20 hover:bg-amber-400/30 px-2.5 py-0.5 rounded-full border border-amber-400/40 cursor-pointer shadow-xs"
                title="Enter Seller Dashboard without signing in"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                <span>Shop Active: <strong className="text-white">{activeSeller?.shopName || 'Dashboard'}</strong> • Enter Dashboard</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('become-seller')}
                className="hover:text-amber-400 transition-colors flex items-center gap-1 font-bold cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Sell on Waifair</span>
              </button>
            )}
            <span>|</span>
            <button
              type="button"
              onClick={() => onNavigate('customer')}
              className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Customer Help & Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-3 sm:gap-6">
          {/* Waifair Logo */}
          <button
            id="brand-logo-btn"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 focus:outline-none group text-left shrink-0"
          >
            {/* Waifair Emblem Cube/Gradient Icon */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform font-bold">
              <span className="font-serif font-black text-2xl tracking-tighter leading-none text-slate-950">W</span>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white font-serif flex items-center">
                Waifair<span className="text-amber-400 ml-0.5">.</span>
              </span>
              <span className="block text-[9px] font-bold text-amber-400/90 uppercase tracking-widest -mt-1.5">
                Premium Store
              </span>
            </div>
          </button>

          {/* Primary Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-2">
            <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
              <input
                id="header-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search laptops, RTX graphic cards, smartphones, tech, appliances..."
                className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-slate-950/80 hover:bg-slate-950 focus:bg-slate-950 text-white placeholder-slate-400 border border-slate-700/80 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 rounded-full text-xs font-black transition-all shadow-md cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>

          {/* Right Action Icons & Dropdowns */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Notifications */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                id="notif-bell-btn"
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setUserDropdownOpen(false);
                }}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl relative transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-sm">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Marketplace Alerts
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {unreadNotifCount} unread alert{unreadNotifCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {unreadNotifCount > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-amber-400 hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800">
                    {userNotifs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No notifications at this time.
                      </div>
                    ) : (
                      userNotifs.slice(0, 6).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            markNotificationAsRead(notif.id);
                            if (notif.link) {
                              onNavigate(notif.link.replace('/', ''));
                            }
                            setNotifDropdownOpen(false);
                          }}
                          className={`p-3 text-left hover:bg-slate-800/70 cursor-pointer transition-colors ${
                            !notif.isRead ? 'bg-slate-800/40' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-100">{notif.title}</span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(notif.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Cart Button */}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className="p-2 text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl relative flex items-center gap-1.5 transition-colors font-bold text-xs"
            >
              <ShoppingCart className="w-5 h-5 text-slate-300" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="w-5 h-5 bg-amber-400 text-slate-950 text-xs font-black rounded-full flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Top Seller Dashboard Button (Instant Access without signin) */}
            {isSellerLoggedIn && (
              <button
                id="mobile-top-seller-dash-btn"
                type="button"
                onClick={handleOpenSellerDashboard}
                className="flex md:hidden items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-full shadow-md shadow-amber-400/20 shrink-0 ring-2 ring-amber-400/50 cursor-pointer active:scale-95 transition-all"
                title="Open your Seller Dashboard without signing in"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <span className="font-black text-[11px] tracking-tight">Dashboard</span>
              </button>
            )}

            {/* Seller Hub / Dashboard Quick Button */}
            {isSellerLoggedIn ? (
              <button
                id="header-seller-dash-btn"
                type="button"
                onClick={handleOpenSellerDashboard}
                className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-400/25 ring-2 ring-amber-400/50 transition-all transform hover:scale-[1.03] active:scale-95 cursor-pointer shrink-0"
                title="Open your Seller Dashboard directly without signing in"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                <span className="truncate max-w-[170px] font-black">
                  {activeSeller?.shopName ? `${activeSeller.shopName} Dashboard` : 'Seller Dashboard'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
              </button>
            ) : (
              <button
                id="header-seller-dash-btn"
                type="button"
                onClick={() => onNavigate('become-seller')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors cursor-pointer"
                title="Seller Portal"
              >
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Sell on Waifair</span>
              </button>
            )}

            {/* User Account / Dropdown */}
            <div className="relative" ref={userDropdownRef}>
              <button
                id="user-profile-menu-btn"
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setNotifDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1.5 px-2.5 rounded-full hover:bg-slate-800 border border-slate-700 transition-colors"
              >
                {isUserLoggedIn ? (
                  currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-amber-400/40"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center ring-2 ring-amber-400/40">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600 text-slate-300">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <span className="hidden xl:inline text-xs font-bold text-slate-200 max-w-[110px] truncate">
                  {isUserLoggedIn ? currentUser.name.split(' ')[0] : 'Sign In'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                  {isUserLoggedIn ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/70">
                        <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                        <div className="mt-1">
                          <StatusBadge status={currentUser.role} />
                        </div>
                      </div>

                      <div className="py-1 text-xs text-slate-300">
                        {currentUser.role === 'ADMIN' && (
                          <button
                            onClick={() => {
                              onNavigate('admin');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-slate-800 hover:text-amber-300 font-bold flex items-center gap-2 text-amber-400"
                          >
                            <Shield className="w-4 h-4 text-amber-400" />
                            Admin Control Panel
                          </button>
                        )}

                        {isSellerLoggedIn && (
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenSellerDashboard();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-amber-400/15 hover:text-amber-300 font-bold flex items-center justify-between gap-2 text-amber-400 cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <LayoutDashboard className="w-4 h-4 text-amber-400" />
                              <span>Seller Dashboard ({activeSeller?.shopName || 'Active'})</span>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onNavigate('customer');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-slate-800 flex items-center gap-2 font-medium text-slate-200"
                        >
                          <Package className="w-4 h-4 text-slate-400" />
                          My Orders & Support Chat
                        </button>

                        <div className="border-t border-slate-800 my-1" />

                        <button
                          onClick={() => {
                            logoutUser();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 font-bold"
                        >
                          <LogOut className="w-4 h-4 text-rose-400" />
                          Log Out
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3.5 text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center text-amber-400">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-white">Welcome Guest</p>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Sign in to manage orders, track deliveries, and access your account.
                        </p>
                      </div>

                      <button
                        id="guest-signin-modal-btn"
                        onClick={() => {
                          onOpenAuth();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In / Register</span>
                      </button>

                      <div className="border-t border-slate-800 pt-2 space-y-1 text-left">
                        <button
                          onClick={() => {
                            onNavigate('become-seller');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                        >
                          <Store className="w-3.5 h-3.5 text-amber-400" />
                          <span>Seller Portal & Login</span>
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('customer');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-2"
                        >
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span>Track Order</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row (Always accessible on phone screens) */}
        <div className="md:hidden pb-3 pt-0.5">
          <form onSubmit={handleSearchSubmit} className="relative w-full flex items-center">
            <input
              id="mobile-header-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search laptops, GPUs, phones, tech..."
              className="w-full pl-9 pr-20 py-2 text-xs bg-slate-950/90 text-white placeholder-slate-400 border border-slate-700/80 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all shadow-inner"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1 top-1 px-3 py-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 rounded-full text-[11px] font-black transition-all shadow-xs cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* 3. Category Navigation Sub-Bar */}
      <div className="border-t border-slate-800 bg-slate-950/90 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-semibold overflow-x-auto py-2.5 gap-4 scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2">
            {WAYFAIR_NAV_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  if (cat.slug === 'deals') {
                    onNavigate('shop');
                  } else {
                    onNavigate(`shop?cat=${cat.slug}`);
                  }
                }}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                  cat.isSpecial
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-black flex items-center gap-1 shadow-xs'
                    : 'text-slate-300 hover:text-amber-400 hover:bg-slate-800/80'
                }`}
              >
                {cat.isSpecial && <Percent className="w-3 h-3 text-slate-950" />}
                <span>{cat.name}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => onNavigate('shop')}
            className="text-amber-400 hover:text-amber-300 hover:underline whitespace-nowrap font-bold shrink-0 text-xs flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explore All</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-5 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search mattresses, furniture..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-950 text-white border border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2">
            {WAYFAIR_NAV_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onNavigate(`shop?cat=${c.slug}`);
                  setMobileMenuOpen(false);
                }}
                className="p-2 text-left rounded-lg bg-slate-800/70 hover:bg-slate-800 text-slate-200 hover:text-amber-300 transition-colors truncate"
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-3 space-y-1 text-xs font-bold">
            {/* Direct Seller Portal Button */}
            {isSellerLoggedIn ? (
              <button
                type="button"
                onClick={() => {
                  handleOpenSellerDashboard();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black flex items-center justify-between gap-2 shadow-md cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Go to Seller Dashboard ({activeSeller?.shopName || 'Active'})</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onNavigate('become-seller');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl bg-slate-800 text-blue-300 hover:bg-slate-700 flex items-center gap-2 transition-colors border border-slate-700 cursor-pointer"
              >
                <Store className="w-4 h-4 text-blue-400" />
                <span>Merchant Seller Hub</span>
              </button>
            )}

            <button
              onClick={() => {
                onNavigate('customer');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl bg-slate-800 text-emerald-300 hover:bg-slate-700 flex items-center gap-2 border border-slate-700"
            >
              <Package className="w-4 h-4 text-emerald-400" /> Customer Account & Orders
            </button>

            <button
              onClick={() => {
                onNavigate('become-seller');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-xl text-amber-300 bg-slate-800/90 hover:bg-slate-700 flex items-center gap-2 border border-amber-400/20"
            >
              <Store className="w-4 h-4 text-amber-400" /> Become a Waifair Seller
            </button>

            {isUserLoggedIn ? (
              <button
                onClick={() => {
                  logoutUser();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 flex items-center gap-2 border border-rose-500/20 font-bold"
              >
                <LogOut className="w-4 h-4 text-rose-400" /> Log Out ({currentUser.name})
              </button>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-slate-950 bg-amber-400 hover:bg-amber-300 flex items-center gap-2 font-bold"
              >
                <LogIn className="w-4 h-4 text-slate-950" /> Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
