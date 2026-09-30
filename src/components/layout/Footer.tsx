import React from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Lock,
  Store,
  Shield,
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { storeContacts } = useStore();

  const cleanWhatsAppNumber = (storeContacts.whatsapp || storeContacts.phone || '').replace(/[^0-9]/g, '');

  return (
    <footer className="bg-slate-950 text-slate-300 text-sm mt-auto border-t border-slate-800">
      {/* 1. Value Proposition Strip */}
      <div className="border-b border-slate-800 bg-slate-900/90 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400/10 text-amber-400 rounded-2xl border border-amber-400/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">Waifair Quality Guarantee</h5>
              <p className="text-xs text-slate-400">Verified authentic laptops, tech & goods</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">Fast 24-48h Dispatch</h5>
              <p className="text-xs text-slate-400">Directly routed to certified sellers</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">Escrow Wallet Protection</h5>
              <p className="text-xs text-slate-400">100% secure buyer & seller payments</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-400/10 text-amber-300 rounded-2xl border border-amber-400/20">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h5 className="font-bold text-white text-sm">24/7 Live Customer Desk</h5>
              <p className="text-xs text-slate-400">{storeContacts.workingHours || 'Instant chat assistance & order updates'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links & Contacts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-serif font-black text-xl shadow-md">
                W
              </div>
              <span className="text-2xl font-serif font-black tracking-tight text-white">
                Waifair<span className="text-amber-400">.</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Waifair Shopping Store — An all-in-one verified destination for laptops, graphic cards, smartphones, high-performance tech, smart home appliances, and lifestyle goods.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-slate-300 font-medium">Waifair Network Operational</span>
            </div>
            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Buyer Protection & SSL</span>
              </div>
              <p className="text-[11px] text-slate-500">30-Day Easy Returns Guarantee</p>
            </div>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <span>Customer Help</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Shop All Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('customer')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Track Order & Shipment
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('customer')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Customer Support Chat
                </button>
              </li>
              <li>
                <span className="text-slate-500">Shipping & Fast 24h Delivery</span>
              </li>
              <li>
                <span className="text-slate-500">30-Day Money Back Guarantee</span>
              </li>
            </ul>
          </div>

          {/* Seller Program */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Waifair Sellers</span>
            </h4>
            <div className="mb-3">
              <button
                id="footer-apply-now-btn"
                onClick={() => onNavigate('become-seller')}
                className="w-full px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Apply Now</span>
                <span>→</span>
              </button>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('become-seller')}
                  className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                >
                  Seller Benefits & Requirements
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('seller')}
                  className="hover:text-white transition-colors"
                >
                  Merchant Seller Portal
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('seller')}
                  className="hover:text-white transition-colors"
                >
                  Seller Escrow Wallets
                </button>
              </li>
              <li>
                <span className="text-slate-500">Fast Payouts (Bank, Crypto USDT)</span>
              </li>
            </ul>
          </div>

          {/* Contact Us (Dynamic from Admin Settings) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Contacts</span>
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              {storeContacts.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span className="leading-snug text-slate-300">{storeContacts.address}</span>
                </div>
              )}

              {storeContacts.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 shrink-0 text-amber-400" />
                  <a
                    href={`tel:${storeContacts.phone}`}
                    className="text-slate-200 hover:text-amber-400 font-medium transition-colors"
                  >
                    {storeContacts.phone}
                  </a>
                </div>
              )}

              {storeContacts.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 shrink-0 text-amber-400" />
                  <a
                    href={`mailto:${storeContacts.email}`}
                    className="text-slate-200 hover:text-amber-400 font-medium transition-colors"
                  >
                    {storeContacts.email}
                  </a>
                </div>
              )}

              {storeContacts.whatsapp && (
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                  <a
                    href={`https://wa.me/${cleanWhatsAppNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors flex items-center gap-1"
                  >
                    <span>WhatsApp Support</span>
                    <span className="text-slate-400 font-normal">({storeContacts.whatsapp})</span>
                  </a>
                </div>
              )}

              {storeContacts.workingHours && (
                <div className="flex items-start gap-2.5 pt-1 text-slate-400">
                  <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span className="text-[11px] leading-tight">{storeContacts.workingHours}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p
            onClick={(e) => {
              // Stealth triple-click trigger for owner to access admin without any visible button
              if (e.detail === 3) {
                onNavigate('admin');
              }
            }}
            className="cursor-default select-none"
            title="Waifair Store"
          >
            © 2016 Waifair Shopping Store. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Use</span>
            <span>•</span>
            <span>Buyer Protection Guarantee</span>
            <span>•</span>
            <button
              onClick={() => onNavigate('admin')}
              className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Admin Portal
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

