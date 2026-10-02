import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Package,
  MessageSquare,
  User,
  Clock,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronRight,
  MapPin,
  Calendar,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/Badge';
import { useChatAutoScroll } from '../../hooks/useChatAutoScroll';
import { Order, OrderStatus } from '../../types';


export const CustomerPortal: React.FC = () => {
  const {
    currentUser,
    orders,
    conversations,
    messages,
    sendMessage,
    startOrGetSupportConversation,
    markConversationAsRead,
    settings,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'support' | 'profile'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatInput, setChatInput] = useState('');

  // Orders for this customer
  const myOrders = orders.filter((o) => o.customerId === currentUser.id);

  // Active support conversation
  const supportConv = startOrGetSupportConversation(currentUser.id, currentUser.name, 'CUSTOMER');
  const supportMessages = messages.filter((m) => m.conversationId === supportConv.id);

  // Customer support chat ko latest msg pe rakhne ke liye hook
  const { containerRef, onScroll } = useChatAutoScroll(
    supportMessages.length,
    supportConv.id,
    activeTab === 'support'
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(supportConv.id, chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={
              currentUser.avatar ||
              'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
            }
            alt={currentUser.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-amber-400/40"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">{currentUser.name}</h1>
              <span className="px-2.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full text-xs font-bold">
                Customer Account
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.email}</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl gap-1 border border-slate-800">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({myOrders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('support');
              markConversationAsRead(supportConv.id, 'CUSTOMER');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'support'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Support Chat</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </div>
      </div>

      {/* TAB 1: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {myOrders.length === 0 ? (
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-12 text-center space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">You haven't placed any orders yet</h3>
              <p className="text-xs text-slate-400">
                Explore the marketplace catalog to place your first order.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-900 rounded-3xl border border-slate-800 shadow-sm p-6 hover:border-slate-700 transition-all space-y-4"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-xl">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-mono text-sm font-black text-white">
                          {order.id}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-slate-700"
                      >
                        <span>View Tracking & Timeline</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.productImage || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=80'}
                            alt={item.productName}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                          />
                          <div>
                            <h4 className="font-bold text-white">{item.productName}</h4>
                            <span className="text-slate-400 text-[11px]">
                              Qty: {item.quantity} × {settings.currencySymbol}{item.unitPrice.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <span className="font-black text-amber-400">
                          {settings.currencySymbol}{item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>Shipping to: <strong className="text-slate-200">{order.shippingAddress.city}, {order.shippingAddress.country}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span>Total Paid:</span>
                      <span className="text-sm font-black text-amber-400">
                        {settings.currencySymbol}{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE SUPPORT CHAT */}
      {activeTab === 'support' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-md overflow-hidden flex flex-col h-[520px]">
          {/* Support Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Waifair Support Desk</h3>
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online & Ready to help
                </p>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div ref={containerRef} onScroll={onScroll} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/60">
            {supportMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6">
                <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-300">No messages yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Ask any question regarding your order routing, delivery timelines, or product inquiries.
                </p>
              </div>
            ) : (
              supportMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-slate-400">
                        {isMe ? 'You' : msg.senderName}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-amber-400 text-slate-950 font-medium rounded-tr-none'
                          : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your message to Platform Support..."
              className="flex-1 px-4 py-2.5 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-slate-950 placeholder-slate-600"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-md max-w-2xl space-y-6">
          <h2 className="text-lg font-black text-white border-b border-slate-800 pb-3">
            Customer Profile & Preferences
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                readOnly
                value={currentUser.name}
                className="w-full px-3 py-2 border border-slate-800 rounded-xl bg-slate-950 text-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                readOnly
                value={currentUser.email}
                className="w-full px-3 py-2 border border-slate-800 rounded-xl bg-slate-950 text-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                readOnly
                value={currentUser.phone || '+1 (555) 902-1144'}
                className="w-full px-3 py-2 border border-slate-800 rounded-xl bg-slate-950 text-slate-200"
              />
            </div>

            <div className="p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl text-amber-300 font-medium">
              Your account is verified for secure purchasing with guaranteed escrow delivery.
            </div>
          </div>
        </div>
      )}

      {/* ORDER TIMELINE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedOrder(null)}
          />

          <div className="relative bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 z-10 border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-amber-400 font-mono">
                  {selectedOrder.id}
                </span>
                <h3 className="text-lg font-black text-white">Order Progress Timeline</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            {/* Timeline Stepper */}
            <div className="space-y-4">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {selectedOrder.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-xs">
                      ✓
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={event.status} />
                        <span className="text-[10px] text-slate-500">
                          {new Date(event.timestamp).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-1.5">{event.note}</p>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        Updated by: {event.actor}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-amber-400 text-slate-950 text-xs font-black rounded-xl hover:bg-amber-300 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
