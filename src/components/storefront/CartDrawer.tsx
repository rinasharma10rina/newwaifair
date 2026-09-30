import React from 'react';
import { useStore } from '../../context/StoreContext';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const {
    cart,
    cartSubtotal,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    settings,
  } = useStore();

  if (!isOpen) return null;

  const isFreeShipping = cartSubtotal >= settings.freeShippingThreshold;
  const progressToFreeShipping = Math.min(
    100,
    (cartSubtotal / settings.freeShippingThreshold) * 100
  );
  const remainingForFreeShipping = Math.max(0, settings.freeShippingThreshold - cartSubtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col text-slate-100">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Your Shopping Cart</h3>
                <p className="text-xs text-slate-400">{cart.length} unique item(s)</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Bar */}
          <div className="bg-slate-950/70 px-5 py-3 border-b border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
              <span>
                {isFreeShipping
                  ? '🎉 Free Shipping Unlocked!'
                  : `Add ${settings.currencySymbol}${remainingForFreeShipping.toFixed(
                      2
                    )} more for Free Shipping`}
              </span>
              <span className="text-[11px] text-amber-400 font-bold">
                {Math.round(progressToFreeShipping)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-300"
                style={{ width: `${progressToFreeShipping}%` }}
              />
            </div>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-800">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-slate-300 text-sm">Your cart is empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Explore our verified catalog and add premium electronics, fashion, and accessories to your cart.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="py-4 flex gap-4">
                  {/* Thumbnail */}
                  <img
                    src={
                      item.product.images[0] ||
                      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&auto=format&fit=crop&q=80'
                    }
                    alt={item.product.name}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-800 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white line-clamp-2">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        SKU: {item.product.sku}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-700 bg-slate-950 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            updateCartQuantity(item.product.id, item.quantity - 1)
                          }
                          className="p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(item.product.id, item.quantity + 1)
                          }
                          className="p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Total */}
                      <span className="text-sm font-black text-amber-400">
                        {settings.currencySymbol}
                        {(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Action */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-slate-800 bg-slate-950 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-bold text-slate-200">
                    {settings.currencySymbol}
                    {cartSubtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-slate-200">
                    {isFreeShipping ? (
                      <span className="text-emerald-400 font-bold">FREE</span>
                    ) : (
                      `${settings.currencySymbol}${settings.shippingFlatFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-black text-white">
                  <span>Total Due</span>
                  <span className="text-amber-400">
                    {settings.currencySymbol}
                    {(
                      cartSubtotal + (isFreeShipping ? 0 : settings.shippingFlatFee)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Protected order escrow guarantee. Assigned to approved sellers only.</span>
              </div>

              <div className="flex gap-2">
                <button
                  id="checkout-cta-btn"
                  onClick={() => {
                    onClose();
                    onCheckout();
                  }}
                  className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 rounded-xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
