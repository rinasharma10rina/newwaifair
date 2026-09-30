import React, { useState } from 'react';
import { useStore, DEFAULT_STORE_CONTACTS } from '../../context/StoreContext';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Save,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';

interface StoreContactsManagerProps {
  onNavigate?: (view: string) => void;
}

export const StoreContactsManager: React.FC<StoreContactsManagerProps> = ({ onNavigate }) => {
  const { storeContacts, updateStoreContacts } = useStore();

  const [phone, setPhone] = useState(storeContacts?.phone || '+1 6574906103');
  const [email, setEmail] = useState(storeContacts?.email || 'support@waifair.com');
  const [address, setAddress] = useState(
    storeContacts?.address || '4 Copley Place, Floor 7, Boston, MA 02116, USA'
  );
  const [whatsapp, setWhatsapp] = useState(storeContacts?.whatsapp || '+1 6574906103');
  const [workingHours, setWorkingHours] = useState(
    storeContacts?.workingHours || '24/7 Live Customer Desk & Order Support'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreContacts({
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      whatsapp: whatsapp.trim(),
      workingHours: workingHours.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset store contact details to default values?')) {
      setPhone(DEFAULT_STORE_CONTACTS.phone);
      setEmail(DEFAULT_STORE_CONTACTS.email);
      setAddress(DEFAULT_STORE_CONTACTS.address);
      setWhatsapp(DEFAULT_STORE_CONTACTS.whatsapp);
      setWorkingHours(DEFAULT_STORE_CONTACTS.workingHours);
      updateStoreContacts(DEFAULT_STORE_CONTACTS);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const cleanWhatsAppNumber = (whatsapp || phone || '').replace(/[^0-9]/g, '');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-400/10 text-amber-600 border border-amber-400/20">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900">Store Contacts & Footer Settings</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Edit the official phone number, support email, physical store address, WhatsApp hotline, and operating hours shown in the website footer and seller portals.
          </p>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('shop')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors cursor-pointer w-fit"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Storefront</span>
          </button>
        )}
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs font-bold">Store Contacts Updated Successfully!</p>
              <p className="text-[11px] text-emerald-700">
                Your changes have been saved and are now live across all website footers and pages.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100/70 px-2.5 py-1 rounded-lg">
            Live
          </span>
        </div>
      )}

      {/* Main Grid: Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Contact Form */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Update Contact Details</span>
              </h3>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium cursor-pointer"
                title="Reset to factory default contacts"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>

            {/* 1. Phone Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <span>Official Contact Phone Number</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +1 6574906103"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-900 text-xs sm:text-sm font-medium transition-all"
                required
              />
              <p className="text-[11px] text-slate-400">
                Customers and sellers can tap this number directly to call your store.
              </p>
            </div>

            {/* 2. Official Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <span>Official Support Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. support@waifair.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-900 text-xs sm:text-sm font-medium transition-all"
                required
              />
              <p className="text-[11px] text-slate-400">
                Official store mailbox for buyer inquiries, returns, and dispute notices.
              </p>
            </div>

            {/* 3. Physical Office / Store Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>Store / Head Office Address</span>
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="e.g. 4 Copley Place, Floor 7, Boston, MA 02116, USA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-900 text-xs sm:text-sm font-medium transition-all resize-none"
                required
              />
              <p className="text-[11px] text-slate-400">
                Printed on customer invoices and shown at the footer of the site.
              </p>
            </div>

            {/* 4. WhatsApp Support Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>WhatsApp Hotline Number</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. +1 6574906103"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-900 text-xs sm:text-sm font-medium transition-all"
              />
              <p className="text-[11px] text-slate-400">
                Creates a 1-click chat link (<span className="text-emerald-600 font-mono">wa.me</span>) for instant customer mobile support.
              </p>
            </div>

            {/* 5. Working Hours */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Customer Desk Working Hours</span>
              </label>
              <input
                type="text"
                value={workingHours}
                onChange={(e) => setWorkingHours(e.target.value)}
                placeholder="e.g. 24/7 Live Customer Desk & Order Support"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-slate-900 text-xs sm:text-sm font-medium transition-all"
              />
              <p className="text-[11px] text-slate-400">
                Displayed in the footer guarantee bar and contact block.
              </p>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
              <button
                type="submit"
                id="admin-save-contacts-btn"
                className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Contact Details</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (5 cols): Live Footer Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Live Footer Preview</h4>
              </div>
              <span className="text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-bold border border-slate-700">
                Public View
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                  Official Contacts
                </span>
              </div>

              {/* Address */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Address</span>
                  <span className="text-xs text-slate-200 font-medium leading-relaxed">
                    {address || 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Phone</span>
                  <span className="text-xs text-slate-200 font-bold">{phone || 'Not specified'}</span>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Email</span>
                  <span className="text-xs text-slate-200 font-medium">{email || 'Not specified'}</span>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-400 block">WhatsApp Support</span>
                  <span className="text-xs text-emerald-400 font-bold">
                    {whatsapp || 'Not specified'}
                  </span>
                </div>
              </div>

              {/* Working hours */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-slate-400 block">Support Desk Hours</span>
                  <span className="text-xs text-slate-300">{workingHours || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Synchronized with Footer</span>
              </div>
              <span>Instant Refresh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
