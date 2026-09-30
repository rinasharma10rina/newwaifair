import React, { useState } from 'react';
import { useStore, DEFAULT_SUBSCRIPTION_PLAN } from '../../context/StoreContext';
import {
  Award,
  Save,
  RotateCcw,
  CheckCircle2,
  Headphones,
  Search,
  Edit2,
  Calendar,
  DollarSign,
  Info,
  Sparkles,
  Users,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { SellerProfile } from '../../types';

interface SubscriptionPlanManagerProps {
  onNavigate?: (view: string) => void;
}

export const SubscriptionPlanManager: React.FC<SubscriptionPlanManagerProps> = ({ onNavigate }) => {
  const {
    subscriptionPlan,
    updateSubscriptionPlan,
    sellers,
    updateSellerSubscription,
  } = useStore();

  // Global Plan Form State
  const [planName, setPlanName] = useState(subscriptionPlan?.planName || DEFAULT_SUBSCRIPTION_PLAN.planName);
  const [price, setPrice] = useState(subscriptionPlan?.price || DEFAULT_SUBSCRIPTION_PLAN.price);
  const [message, setMessage] = useState(subscriptionPlan?.message || DEFAULT_SUBSCRIPTION_PLAN.message);
  const [buttonText, setButtonText] = useState(
    subscriptionPlan?.buttonText || DEFAULT_SUBSCRIPTION_PLAN.buttonText || 'Current Plan is Active'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [searchSeller, setSearchSeller] = useState('');
  const [editingSeller, setEditingSeller] = useState<SellerProfile | null>(null);
  const [sellerPlanName, setSellerPlanName] = useState('');
  const [sellerPrice, setSellerPrice] = useState('');
  const [sellerMessage, setSellerMessage] = useState('');
  const [sellerSavedToast, setSellerSavedToast] = useState<string | null>(null);

  const handleSaveGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    updateSubscriptionPlan({
      planName: planName.trim() || 'Platinum Merchant',
      price: price.trim() || '$29 / mo',
      message: message.trim(),
      buttonText: buttonText.trim() || 'Current Plan is Active',
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset subscription plan settings to platform default?')) {
      setPlanName(DEFAULT_SUBSCRIPTION_PLAN.planName);
      setPrice(DEFAULT_SUBSCRIPTION_PLAN.price);
      setMessage(DEFAULT_SUBSCRIPTION_PLAN.message);
      setButtonText(DEFAULT_SUBSCRIPTION_PLAN.buttonText || 'Current Plan is Active');
      updateSubscriptionPlan(DEFAULT_SUBSCRIPTION_PLAN);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const openEditSellerPlan = (seller: SellerProfile) => {
    setEditingSeller(seller);
    setSellerPlanName(seller.subscriptionPlanName || planName);
    setSellerPrice(seller.subscriptionPrice || price);
    setSellerMessage(seller.subscriptionMessage || message);
  };

  const handleSaveSellerPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeller) return;
    updateSellerSubscription(editingSeller.id, {
      subscriptionPlanName: sellerPlanName.trim(),
      subscriptionPrice: sellerPrice.trim(),
      subscriptionMessage: sellerMessage.trim(),
    });
    setSellerSavedToast(`Updated subscription plan for ${editingSeller.shopName || editingSeller.sellerName}!`);
    setEditingSeller(null);
    setTimeout(() => setSellerSavedToast(null), 3500);
  };

  const handleResetSellerToDefault = (sellerId: string, shopName: string) => {
    if (window.confirm(`Reset ${shopName} to follow the Global Default subscription plan?`)) {
      updateSellerSubscription(sellerId, {
        subscriptionPlanName: '',
        subscriptionPrice: '',
        subscriptionMessage: '',
      });
      setSellerSavedToast(`Reset ${shopName} to default subscription plan.`);
      setTimeout(() => setSellerSavedToast(null), 3000);
    }
  };

  // Filter approved or active sellers
  const filteredSellers = sellers
    .filter((s) => s.applicationStatus !== 'REJECTED')
    .filter((s) => {
      if (!searchSeller.trim()) return true;
      const q = searchSeller.toLowerCase();
      return (
        (s.shopName && s.shopName.toLowerCase().includes(q)) ||
        (s.sellerName && s.sellerName.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q))
      );
    });

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#EE4932]" />
            <span>Subscription & Merchant Plan Settings</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure the subscription plan title, amount/pricing, active date details, and customer care redirection.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold shadow-2xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {sellerSavedToast && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-300 text-sky-800 rounded-xl text-xs font-bold shadow-2xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
            <span>{sellerSavedToast}</span>
          </div>
        )}
      </div>

      {/* Grid: Global Settings & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Global Editor Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-red-50 text-[#EE4932] border border-red-200">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Default Global Subscription Plan</h3>
                <p className="text-[11px] text-slate-500">
                  Applies to all sellers by default across the platform.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>

          <form onSubmit={handleSaveGlobal} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Plan Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plan Name / Title
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g. Platinum Merchant"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EE4932]/30 focus:border-[#EE4932]"
                  />
                </div>
              </div>

              {/* Price / Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Price / Amount
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. $29 / mo or 50 USDT"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EE4932]/30 focus:border-[#EE4932]"
                  />
                </div>
              </div>
            </div>

            {/* Active until & Description message */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Active Until & Description Message</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Editable date & plan privileges
                </span>
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Active until 16 Feb 2026. Includes 1000 items, verified check badge, and 0% additional listing fees."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EE4932]/30 focus:border-[#EE4932] leading-relaxed resize-none"
              />
            </div>

            {/* Bottom Button Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Action Button Text (Redirects to Customer Care)</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Headphones className="w-3 h-3" />
                  Links directly to Customer Care chat
                </span>
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="Current Plan is Active"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EE4932]/30 focus:border-[#EE4932]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Global Subscription Settings</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Seller Modal Preview */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between text-white space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Seller Live Modal Preview</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                Live View
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              This preview reflects exactly what merchants see when clicking "Current Plan" in their Seller Dashboard:
            </p>
          </div>

          {/* Simulated Modal Card */}
          <div className="bg-white rounded-3xl p-5 text-slate-900 shadow-2xl border border-slate-100 space-y-3.5 my-auto max-w-sm mx-auto w-full">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#EE4932]" />
                <span>Subscription Plans</span>
              </h3>
              <span className="text-slate-400 text-xs font-bold">✕</span>
            </div>

            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{planName || 'Platinum Merchant'}</span>
                <span className="text-xs font-bold text-[#EE4932]">{price || '$29 / mo'}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">
                {message || 'Active until 16 Feb 2026. Includes 1000 items, verified check badge, and 0% additional listing fees.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onNavigate) onNavigate('conversations');
              }}
              className="w-full py-2.5 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
              title="Clicking this opens Customer Care"
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>{buttonText || 'Current Plan is Active'}</span>
            </button>
            <p className="text-[10px] text-center text-slate-400">
              * Clicking button directs merchant straight to Customer Care
            </p>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Changes persist immediately to Firebase and sync in real time across all open tabs.</span>
          </div>
        </div>
      </div>

      {/* Seller Specific Customization Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Customize Plan Per Seller (Optional)</h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchSeller}
              onChange={(e) => setSearchSeller(e.target.value)}
              placeholder="Search seller by shop, name or email..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Shop / Merchant</th>
                <th className="py-2.5 px-3">Assigned Plan</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Active / Benefit Details</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-400">
                    No matching sellers found.
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => {
                  const isCustom = Boolean(
                    seller.subscriptionPlanName || seller.subscriptionPrice || seller.subscriptionMessage
                  );
                  const sPlan = seller.subscriptionPlanName || planName;
                  const sPrice = seller.subscriptionPrice || price;
                  const sMsg = seller.subscriptionMessage || message;

                  return (
                    <tr key={seller.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{seller.shopName || seller.sellerName}</div>
                        <div className="text-[11px] text-slate-400">{seller.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <span>{sPlan}</span>
                          {isCustom ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                              Custom
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-100 text-slate-600">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#EE4932]">{sPrice}</td>
                      <td className="py-3 px-3 max-w-xs truncate text-[11px] text-slate-500" title={sMsg}>
                        {sMsg}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditSellerPlan(seller)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleResetSellerToDefault(seller.id, seller.shopName || seller.sellerName)}
                            className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium rounded-lg text-[11px] transition-colors cursor-pointer"
                            title="Reset to default global plan"
                          >
                            Reset
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit Single Seller Plan */}
      {editingSeller && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-5 space-y-4 border border-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Edit Plan for {editingSeller.shopName || editingSeller.sellerName}
                </h3>
                <p className="text-[11px] text-slate-400">{editingSeller.email}</p>
              </div>
              <button
                onClick={() => setEditingSeller(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSellerPlan} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Plan Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={sellerPlanName}
                  onChange={(e) => setSellerPlanName(e.target.value)}
                  placeholder="e.g. Platinum Merchant"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EE4932]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Price / Amount
                </label>
                <input
                  type="text"
                  required
                  value={sellerPrice}
                  onChange={(e) => setSellerPrice(e.target.value)}
                  placeholder="e.g. $29 / mo or 100 USDT"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EE4932]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Active Until & Benefits Message
                </label>
                <textarea
                  rows={3}
                  required
                  value={sellerMessage}
                  onChange={(e) => setSellerMessage(e.target.value)}
                  placeholder="Active until..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#EE4932]/30 leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSeller(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EE4932] hover:bg-[#d83a24] text-white rounded-xl text-xs font-extrabold shadow-sm cursor-pointer transition-all active:scale-95"
                >
                  Save Seller Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
