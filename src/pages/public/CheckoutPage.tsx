import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  Lock,
  ArrowRight,
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';
import { ShippingAddress, Order } from '../../types';

interface CheckoutPageProps {
  onNavigate: (view: string, id?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { cart, cartSubtotal, createOrder, currentUser, settings, isAuthenticated } = useStore();

  // GUARD: If not authenticated, immediately redirect to home
  useEffect(() => {
    if (!isAuthenticated) {
      onNavigate('home');
    }
  }, [isAuthenticated, onNavigate]);

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: currentUser.name || 'Sarah Jenkins',
    email: currentUser.email || 'customer@domain.com',
    phone: currentUser.phone || '+1 (555) 902-1144',
    street: '742 Evergreen Terrace, Apt 3B',
    city: 'Portland',
    state: 'OR',
    postalCode: '97201',
    country: 'United States',
  });

  const [paymentMethod, setPaymentMethod] = useState<string>('Credit Card (Stripe Secured)');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isFreeShipping = cartSubtotal >= settings.freeShippingThreshold;
  const shippingFee = isFreeShipping ? 0 : settings.shippingFlatFee;
  const totalAmount = cartSubtotal + shippingFee;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!isAuthenticated) {
      onNavigate('home');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      try {
        const order = createOrder({
          shippingAddress: address,
          paymentMethod,
          notes: customerNotes,
        });
        setPlacedOrder(order);
      } catch (err: any) {
        console.error('Order creation failed:', err);
        alert(err?.message || 'Could not place order. Please sign in and try again.');
      } finally {
        setIsSubmitting(false);
      }
    }, 600);
  };

  // If order was successfully placed, show celebration receipt
  if (placedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-8 sm:p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <PackageCheck className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-full uppercase tracking-wider">
              Order Confirmed & Paid
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              Thank You For Your Order!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Order Reference ID:{' '}
              <strong className="text-amber-400 font-mono text-sm">{placedOrder.id}</strong>
            </p>
          </div>

          {/* Workflow Explanation Alert */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>What happens next?</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Your order has reached the <strong>Platform Admin</strong>. The Admin will assign this order to an authorized fulfillment seller who will pack and ship the products to:
            </p>
            <p className="font-semibold text-slate-200 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              {placedOrder.shippingAddress.fullName} — {placedOrder.shippingAddress.street},{' '}
              {placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.country}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => onNavigate('customer')}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Track in Customer Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('shop')}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs sm:text-sm border border-slate-700 transition-all cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-bold text-white">Your cart is empty</h2>
        <p className="text-xs text-slate-400">
          You don't have any products in your cart to checkout.
        </p>
        <button
          onClick={() => onNavigate('shop')}
          className="px-5 py-2.5 bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-sm hover:bg-amber-300 transition-colors cursor-pointer"
        >
          Browse Marketplace Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb */}
      <button
        onClick={() => onNavigate('shop')}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Shop</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Checkout Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl">
            <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <span>Shipping & Delivery Details</span>
            </h2>

            <form onSubmit={handlePlaceOrder} id="checkout-form" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Delivery Notes / Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Special instructions for the seller courier..."
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              {/* Payment Selector */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Select Payment Method</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'Credit Card (Stripe Secured)', label: 'Credit Card (Stripe)' },
                    { id: 'PayPal Express', label: 'PayPal' },
                    { id: 'Cash On Delivery', label: 'Cash on Delivery' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`p-3 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center text-center transition-all ${
                        paymentMethod === method.id
                          ? 'border-amber-400 bg-amber-400/10 text-amber-400 font-bold'
                          : 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-950'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="sr-only"
                      />
                      <span className="text-xs">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Order Review (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 shadow-xl space-y-5">
            <h3 className="font-black text-white text-base border-b border-slate-800 pb-3">
              Order Summary ({cart.length} items)
            </h3>

            {/* Items snippet */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="py-3 flex items-center gap-3 text-xs">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-200 truncate">{item.product.name}</h5>
                    <span className="text-[11px] text-slate-400">
                      Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                    </span>
                  </div>
                  <span className="font-black text-amber-400 shrink-0">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-bold text-slate-200">
                  {settings.currencySymbol}
                  {cartSubtotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Shipping Fee</span>
                <span className="font-bold text-slate-200">
                  {isFreeShipping ? (
                    <span className="text-emerald-400 font-bold">FREE</span>
                  ) : (
                    `${settings.currencySymbol}${shippingFee.toFixed(2)}`
                  )}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-black text-white">
                <span>Total Amount Due</span>
                <span className="text-amber-400">
                  {settings.currencySymbol}
                  {totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Platform Guarantee */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Payment is protected by marketplace escrow. Funds will be held safely until the assigned seller delivers your package.
              </span>
            </div>

            {/* Place Order CTA */}
            <button
              type="submit"
              form="checkout-form"
              disabled={isSubmitting}
              id="confirm-place-order-btn"
              className="w-full py-4 bg-amber-400 hover:bg-amber-300 active:scale-98 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <span>Processing Order...</span>
              ) : (
                <>
                  <span>Place Order ({settings.currencySymbol}{totalAmount.toFixed(2)})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
