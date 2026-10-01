import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Send,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Headphones,
  Lock,
  LogOut,
} from 'lucide-react';

interface SellerSupportChatPageProps {
  onNavigate: (view: string) => void;
}

export const SellerSupportChatPage: React.FC<SellerSupportChatPageProps> = ({ onNavigate }) => {
  const {
    currentUser,
    sellers,
    messages,
    sendMessage,
    startOrGetSupportConversation,
    markConversationAsRead,
    updateSellerStatus,
    listenToChatMessages,
    logoutSeller,
  } = useStore();

  const [inputText, setInputText] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [showVerificationAlert, setShowVerificationAlert] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Find active seller profile
  const currentSeller =
    (currentUser?.id && currentUser.id !== 'guest_visitor' && sellers.find((s) => s.userId === currentUser.id || s.id === currentUser.id)) ||
    (currentUser?.email && sellers.find((s) => (s.email || '').toLowerCase().trim() === currentUser.email.toLowerCase().trim())) ||
    (() => {
      try {
        const sessStr = localStorage.getItem('nexus_seller_session');
        if (sessStr) {
          const sess = JSON.parse(sessStr);
          if (sess) {
            const match = sellers.find(
              (s) =>
                (sess.userId && (s.userId === sess.userId || s.id === sess.userId)) ||
                (sess.email && s.email && s.email.toLowerCase().trim() === sess.email.toLowerCase().trim())
            );
            if (match) return match;
          }
        }
      } catch {}
      return null;
    })() ||
    sellers.find((s) => !s.id.includes('dummy') && !s.id.includes('default')) ||
    sellers[0] || {
      id: currentUser.id ? `seller_${currentUser.id}` : 'seller_unregistered',
      userId: currentUser.id,
      shopName: currentUser.name ? `${currentUser.name}'s Shop` : 'Store',
      sellerName: currentUser.name || 'Seller',
      email: currentUser.email || 'seller@store.com',
      phone: currentUser.phone || '',
      address: '',
      city: '',
      country: '',
      withdrawalMethod: 'BANK_TRANSFER' as const,
      payoutDetails: 'Bank Transfer',
      applicationStatus: 'PENDING' as const,
      joinedDate: new Date().toISOString(),
      rating: 5.0,
      totalSalesVolume: 0,
    };

  const isFrozen = Boolean(
    currentUser.role !== 'ADMIN' &&
    (currentSeller?.applicationStatus === 'FROZEN' ||
      (currentSeller as any)?.isFrozen === true ||
      (currentSeller as any)?.status === 'FROZEN' ||
      (currentUser as any)?.isFrozen === true ||
      sellers.some(
        (s) =>
          (s.id === currentSeller?.id || s.userId === currentSeller?.userId || (s.email && currentUser.email && s.email.toLowerCase().trim() === currentUser.email.toLowerCase().trim())) &&
          (s.applicationStatus === 'FROZEN' || (s as any).isFrozen === true)
      ))
  );

  const isPending = !isFrozen && currentSeller?.applicationStatus === 'PENDING';

  const sellerIdentifier =
    currentSeller?.userId ||
    (currentUser.id !== 'guest_visitor' ? currentUser.id : currentSeller?.id) ||
    'seller_active';
  const sellerDisplayName = currentSeller?.shopName
    ? `${currentSeller.shopName} (${currentSeller.sellerName || currentUser.name || 'Merchant'})`
    : (currentUser.name || 'Merchant');

  // Get or initialize active conversation with Customer Care
  const activeConv = startOrGetSupportConversation(
    sellerIdentifier,
    sellerDisplayName,
    'SELLER'
  );

  // Real-time Firestore subcollection listener for this seller's chat thread
  useEffect(() => {
    if (!sellerIdentifier) return;
    const unsub = listenToChatMessages(sellerIdentifier, (liveMsgs) => {
      setRealtimeMessages(liveMsgs);
    });
    return () => unsub();
  }, [sellerIdentifier, listenToChatMessages]);

  // Filter & merge messages for this conversation
  const conversationMessages = React.useMemo(() => {
    const map = new Map<string, any>();
    messages
      .filter(
        (m) =>
          m.conversationId === activeConv.id ||
          m.conversationId === sellerIdentifier ||
          (currentSeller?.id && m.conversationId === currentSeller.id)
      )
      .forEach((m) => map.set(m.id, m));
    realtimeMessages.forEach((m) => map.set(m.id, m));
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages, activeConv.id, sellerIdentifier, currentSeller?.id, realtimeMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages, isAgentTyping]);

  // Mark as read when entering
  useEffect(() => {
    if (activeConv) {
      markConversationAsRead(activeConv.id, 'SELLER');
    }
  }, [activeConv.id, conversationMessages.length]);

  // Auto-adjust textarea height dynamically up to 130px
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 36), 130);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [inputText]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleBackClick = () => {
    if (isFrozen) {
      setShowVerificationAlert(true);
      return;
    }
    // Navigate back to seller dashboard
    onNavigate('seller');
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const messageContent = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!messageContent && !selectedImage) return;

    const imgPayload = selectedImage || undefined;

    // Send the seller's message directly to Firestore & admin
    sendMessage(activeConv.id, messageContent, imgPayload, {
      senderId: sellerIdentifier,
      senderName: sellerDisplayName,
      senderRole: 'SELLER',
    });

    setInputText('');
    setSelectedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // WhatsApp-style keyboard interaction:
  // Enter alone -> Send message
  // Shift + Enter -> Insert newline (multi-line typing)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift + Enter: Allow natural newline
        return;
      }
      // Enter alone: Send message
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 h-screen h-[100dvh] w-full bg-slate-200/80 flex flex-col items-center justify-center p-0 sm:p-3 md:p-5 overflow-hidden z-30 text-slate-800">
      {/* WhatsApp Frame Container (Pinned / Fixed in Viewport so only chat messages scroll) */}
      <div className="w-full max-w-4xl bg-white sm:rounded-3xl shadow-2xl flex flex-col h-full max-h-full sm:max-h-[calc(100dvh-2.5rem)] border border-slate-300/80 overflow-hidden relative font-sans">
        
        {/* ========================================================= */}
        {/* 1. TOP HEADER - WHATSAPP GREEN THEME (#008069)            */}
        {/* ========================================================= */}
        <header className="bg-[#008069] text-white px-3 sm:px-4 py-2.5 sm:py-3 shrink-0 shadow-md relative z-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Left: Back Arrow / Lock */}
            {isFrozen ? (
              <button
                onClick={() => setShowVerificationAlert(true)}
                aria-label="Dashboard Locked"
                title="Store Frozen - Dashboard Locked"
                className="p-1.5 -ml-1 text-amber-300 hover:text-amber-200 bg-black/20 hover:bg-black/30 rounded-full transition-colors cursor-pointer flex items-center justify-center"
              >
                <Lock className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleBackClick}
                aria-label="Back"
                className="p-1.5 -ml-1 text-white/90 hover:text-white hover:bg-black/10 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}

            {/* WhatsApp Profile Avatar */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm shadow-inner border border-white/30">
                <Headphones className="w-5 h-5" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#008069] rounded-full"></span>
            </div>

            {/* Contact Title & Subtitle */}
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight truncate flex items-center gap-1.5">
                <span>Customer Care</span>
              </h1>
              <p className="text-[11px] font-normal text-emerald-100 flex items-center gap-1 leading-none mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>online</span>
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              aria-label="Refresh Chat"
              title="Refresh Conversation"
              className="p-2 text-white/90 hover:text-white hover:bg-black/10 rounded-full transition-colors cursor-pointer"
            >
              <RotateCw className={`w-4 h-4 stroke-[2.5] ${isRefreshing ? 'animate-spin text-emerald-200' : ''}`} />
            </button>

            <button
              onClick={() => {
                logoutSeller('Logged out');
                onNavigate('home');
              }}
              aria-label="Sign Out"
              title="Sign Out"
              className="p-2 text-white/80 hover:text-rose-200 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. STATUS NOTICE BANNER (FROZEN / PENDING / APPROVED) */}
        {/* ========================================================= */}
        {isFrozen ? (
          <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-950 text-white px-4 py-3 shrink-0 shadow-md border-b-2 border-rose-500/60 text-center animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center justify-center gap-2">
              <span className="p-1 rounded-full bg-rose-500/30 text-rose-200 border border-rose-400/40">
                <Lock className="w-4 h-4 text-rose-300" />
              </span>
              <p className="text-xs sm:text-sm font-extrabold tracking-tight text-white uppercase">
                Your store has been frozen. Please contact Customer Care for assistance.
              </p>
            </div>
            <p className="text-[11px] text-rose-200/90 font-medium mt-1 max-w-xl mx-auto leading-relaxed">
              Your seller dashboard is temporarily locked by Company. Customer Care is active below to assist you with unfreezing your store.
            </p>
          </div>
        ) : !isPending ? (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2.5 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">Your Store is Active & Unfrozen</span>
            </div>
            <button
              onClick={() => onNavigate && onNavigate('seller')}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <span>Open Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center shrink-0">
            <p className="text-xs font-semibold text-amber-800 leading-snug">
              Your account is awaiting verification. Message us here if you need help.
            </p>
          </div>
        )}

        {/* Lock warning popup if user clicks back when not verified or frozen */}
        {showVerificationAlert && (
          <div className="absolute top-24 left-4 right-4 z-40 bg-rose-950 text-white text-xs p-3.5 rounded-2xl shadow-xl flex items-center justify-between border border-rose-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <span>
                {isFrozen
                  ? 'Your store has been frozen by Company. Please contact customer support for assistance.'
                  : 'Account unverified: You will remain on support until approved by Company.'}
              </span>
            </div>
            <button
              onClick={() => setShowVerificationAlert(false)}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Admin Quick Verification Switcher (if viewed by admin role) — No auto message */}
        {isPending && currentUser.role === 'ADMIN' && (
          <div className="bg-slate-900 text-slate-200 px-3 py-1.5 flex items-center justify-between text-[11px] shrink-0 border-b border-slate-800">
            <span className="text-slate-300">Status: <b className="text-amber-400">PENDING APPROVAL</b></span>
            <button
              onClick={() => {
                updateSellerStatus(currentSeller.id, 'APPROVED');
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] cursor-pointer transition-colors shadow-2xs"
            >
              ✓ Verify Store Now
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. WHATSAPP CHAT AREA WITH DOODLE WALLPAPER               */}
        {/* ========================================================= */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4 space-y-2.5 overscroll-contain"
          style={{
            backgroundColor: '#efeae2',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='0.035' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {/* Welcome Message Pill */}
          <div className="flex justify-center my-1">
            <span className="px-3.5 py-1 bg-[#ffffff]/90 text-slate-600 text-[11px] font-medium rounded-full shadow-2xs border border-slate-200/60 max-w-sm text-center">
              Messages are secured with end-to-end platform encryption.
            </span>
          </div>

          {/* Messages Loop */}
          {conversationMessages.map((msg, index) => {
            const isCustomerCare = msg.senderRole === 'ADMIN' || msg.senderId === 'user_admin';

            return (
              <div
                key={msg.id || index}
                className={`flex ${isCustomerCare ? 'justify-start' : 'justify-end'} mb-1.5`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 shadow-2xs relative ${
                    isCustomerCare
                      ? 'bg-white text-[#111b21] rounded-tl-xs border border-slate-200/50'
                      : 'bg-[#d9fdd3] text-[#111b21] rounded-tr-xs border border-emerald-200/40'
                  }`}
                >
                  {/* Customer Care Label on Incoming Message */}
                  {isCustomerCare && (
                    <p className="text-[11px] font-bold text-[#008069] mb-1 leading-tight">
                      Customer Care
                    </p>
                  )}

                  {/* Attached Media Photo */}
                  {msg.imageUrl && (
                    <div className="mb-1.5 rounded-xl overflow-hidden max-w-[280px] bg-slate-100">
                      <img
                        src={msg.imageUrl}
                        alt="Attached media"
                        className="w-full h-auto object-cover max-h-72"
                      />
                    </div>
                  )}

                  {/* Multi-line Formatted Message Body */}
                  {msg.text && (
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words select-text font-normal">
                      {msg.text}
                    </p>
                  )}

                  {/* NOTE: Timestamps, seen/read status, and delete options are strictly hidden for sellers as per requirements */}
                </div>
              </div>
            );
          })}

          {/* Customer Care Typing Animation */}
          {isAgentTyping && (
            <div className="flex justify-start mb-1.5">
              <div className="bg-white text-[#111b21] rounded-2xl rounded-tl-xs px-3.5 py-2 shadow-2xs border border-slate-200/50 flex items-center gap-1.5">
                <span className="text-xs text-[#008069] font-medium mr-1">Customer Care is typing</span>
                <span className="w-1.5 h-1.5 bg-[#008069] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#008069] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#008069] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Selected Image Preview before sending */}
        {selectedImage && (
          <div className="px-4 py-2 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-2">
            <div className="relative">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-14 h-14 object-cover rounded-xl border border-emerald-500/60 shadow-xs"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="absolute -top-1.5 -right-1.5 bg-slate-700 hover:bg-slate-900 text-white rounded-full p-0.5 cursor-pointer shadow-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-xs text-slate-600 font-medium">Ready to send photo</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. BOTTOM INPUT BAR - WHATSAPP STYLE & MULTI-LINE         */}
        {/* ========================================================= */}
        <div className="bg-[#f0f2f5] border-t border-slate-200 p-2.5 sm:p-3 shrink-0">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            {/* Image / Gallery Upload Icon */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              title="Attach photo"
              aria-label="Attach photo"
              className="p-2 text-[#54656f] hover:text-[#111b21] hover:bg-slate-200/60 rounded-full transition-colors cursor-pointer shrink-0 mb-0.5"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* WhatsApp White Textarea Container */}
            <div className="flex-1 bg-white border border-slate-300 rounded-2xl px-3.5 py-1.5 shadow-2xs flex items-center focus-within:ring-2 focus-within:ring-[#00a884]/40 transition-all">
              <textarea
                ref={textareaRef}
                id="seller-chat-input"
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message (Shift + Enter for new line)..."
                className="w-full bg-transparent border-0 p-0 text-[14px] font-medium text-black placeholder:text-slate-400 resize-none focus:outline-none focus:ring-0 leading-relaxed max-h-32 overflow-y-auto"
                style={{ color: '#000000', WebkitTextFillColor: '#000000', caretColor: '#000000' }}
              />
            </div>

            {/* WhatsApp Round Green Send Button */}
            <button
              id="seller-chat-send-btn"
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() && !selectedImage}
              aria-label="Send message"
              title="Send message (Enter)"
              className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-white flex items-center justify-center font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0 active:scale-95 shadow-sm mb-0.5"
            >
              <Send className="w-4 h-4 fill-current ml-0.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

