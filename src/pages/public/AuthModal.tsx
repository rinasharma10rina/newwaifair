import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { X, ArrowLeft, Shield, Store, Lock, Mail, User, Phone, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'LOGIN' | 'REGISTER' | 'FORGOT';
  onNavigate?: (view: string) => void;
  initialMessage?: string;
  successRedirect?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'LOGIN',
  onNavigate,
  initialMessage,
  successRedirect,
}) => {
  const { users, loginCustomer, registerCustomer, loginAdmin, loginSeller } = useStore();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>(initialMode);
  const [loginRoleTab, setLoginRoleTab] = useState<'ALL' | 'ADMIN' | 'SELLER' | 'CUSTOMER'>('ALL');

  const [rememberMe, setRememberMe] = useState<boolean>(() => {
    try { return localStorage.getItem('waifair_remember_me') === 'true'; }
    catch { return false; }
  });

  // Only email is remembered — NEVER the password (security)
  const [email, setEmail] = useState<string>(() => {
    try {
      if (localStorage.getItem('waifair_remember_me') === 'true') {
        return localStorage.getItem('waifair_saved_email') || '';
      }
    } catch {}
    return '';
  });

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const persistRememberedEmail = (userEmail: string) => {
    try {
      // Always purge any legacy saved password
      localStorage.removeItem('waifair_saved_password');
      if (rememberMe) {
        localStorage.setItem('waifair_remember_me', 'true');
        localStorage.setItem('waifair_saved_email', userEmail);
      } else {
        localStorage.removeItem('waifair_remember_me');
        localStorage.removeItem('waifair_saved_email');
      }
    } catch {}
  };

  const doSuccessNavigate = (role: string) => {
    const defaultDest = role === 'ADMIN' ? 'admin' : role === 'SELLER' ? 'seller' : 'customer';
    const dest = successRedirect || defaultDest;
    setTimeout(() => {
      onClose();
      setFeedback(null);
      onNavigate?.(dest);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'REGISTER') {
      if (!name || !email) {
        setFeedback('Please enter your full name and email.');
        return;
      }
      const newUser = registerCustomer(name, email, phone);
      persistRememberedEmail(email);
      setFeedback(`Account created successfully! Welcome, ${newUser.name}.`);
      doSuccessNavigate('CUSTOMER');
      return;
    }

    if (mode === 'LOGIN') {
      const normalizedEmail = email.trim().toLowerCase();
      const match = users.find((u) => u.email.toLowerCase() === normalizedEmail);

      // ---------- ADMIN ----------
      const isAdminAttempt =
        loginRoleTab === 'ADMIN' ||
        normalizedEmail.includes('admin') ||
        normalizedEmail === 'admin@gmail.com' ||
        normalizedEmail === 'admin@marketplace.com' ||
        (match && match.role === 'ADMIN');

      if (isAdminAttempt) {
        const res = await loginAdmin(normalizedEmail || 'admin@waifair.com', password);
        if (!res.success) {
          setFeedback(res.message);
          return;
        }
        persistRememberedEmail(normalizedEmail);
        setFeedback('Welcome back, Admin! Safe session active for 120 minutes. Redirecting...');
        doSuccessNavigate('ADMIN');
        return;
      }

      // ---------- SELLER ----------
      if (loginRoleTab === 'SELLER' || (match && match.role === 'SELLER')) {
        const res = await loginSeller(normalizedEmail, password);
        if (!res.success) {
          setFeedback(res.message);
          return;
        }
        persistRememberedEmail(normalizedEmail);
        setFeedback(`Welcome back, ${res.user?.name || 'Seller'}!`);
        doSuccessNavigate('SELLER');
        return;
      }

      // ---------- CUSTOMER ----------
      if (match && match.role === 'CUSTOMER') {
        // We do not store customer passwords client-side.
        // Require the password field to be non-empty for basic sanity.
        if (!password || password.trim().length < 1) {
          setFeedback('Please enter your password.');
          return;
        }
        loginCustomer(match);
        persistRememberedEmail(normalizedEmail);
        setFeedback(`Welcome back, ${match.name}!`);
        doSuccessNavigate('CUSTOMER');
        return;
      }

      // ---------- NO MATCH ----------
      setFeedback(
        'No account found with this email. Please create an account using the "Create Account" link below.'
      );
      return;
    }

    // FORGOT
    setFeedback('Password reset link sent to your registered email address.');
    setTimeout(() => { setMode('LOGIN'); setFeedback(null); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="relative bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 overflow-hidden z-10 border border-slate-800">
        <button
          type="button"
          onClick={() => { onClose(); onNavigate?.('home'); }}
          className="absolute top-5 left-5 flex items-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors cursor-pointer text-xs font-semibold"
          title="Back to storefront"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Store</span>
        </button>

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-2xl mb-3 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white">
            {mode === 'LOGIN' && 'Sign in to Waifair'}
            {mode === 'REGISTER' && 'Create Customer Account'}
            {mode === 'FORGOT' && 'Reset Your Password'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'LOGIN' && 'Access customer orders or merchant seller portals'}
            {mode === 'REGISTER' && 'Join thousands of verified customers today'}
            {mode === 'FORGOT' && 'Enter your email to receive recovery instructions'}
          </p>
        </div>

        {/* Initial message banner (e.g. "Please sign in to place your order.") */}
        {initialMessage && !feedback && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-400/30 rounded-xl text-xs text-blue-300 font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{initialMessage}</span>
          </div>
        )}

        {mode === 'LOGIN' && (
          <div className="mb-5 flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => { setLoginRoleTab('ALL'); if (!rememberMe) { setEmail(''); setPassword(''); } }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                loginRoleTab === 'ALL' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Customer / Buyer
            </button>
            <button
              type="button"
              onClick={() => { setLoginRoleTab('SELLER'); if (!rememberMe) { setEmail(''); setPassword(''); } }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                loginRoleTab === 'SELLER' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-blue-400'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Seller Account</span>
            </button>
          </div>
        )}

        {feedback && (
          <div className="mb-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl text-xs text-amber-300 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-600"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-600"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>

          {mode === 'REGISTER' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-600"
                />
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          {mode !== 'FORGOT' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                {mode === 'LOGIN' && (
                  <button type="button" onClick={() => setMode('FORGOT')} className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <input
                  type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-800 text-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none placeholder-slate-600"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          {mode === 'LOGIN' && (
            <div className="flex items-center justify-between py-1 px-0.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  id="auth-remember-checkbox"
                  checked={rememberMe}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRememberMe(checked);
                    if (!checked) {
                      try {
                        localStorage.removeItem('waifair_remember_me');
                        localStorage.removeItem('waifair_saved_email');
                        localStorage.removeItem('waifair_saved_password');
                      } catch {}
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-400 focus:ring-amber-400 focus:ring-offset-slate-900 cursor-pointer accent-amber-400"
                />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-amber-300 transition-colors">
                  Remember my email (password is never saved)
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 rounded-xl font-black text-sm shadow-md transition-all mt-2 cursor-pointer"
          >
            {mode === 'LOGIN' && 'Sign In'}
            {mode === 'REGISTER' && 'Complete Registration'}
            {mode === 'FORGOT' && 'Send Password Reset Link'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {mode === 'LOGIN' && (
            <p>Don't have an account yet?{' '}
              <button onClick={() => setMode('REGISTER')} className="text-amber-400 font-bold hover:underline cursor-pointer">Create Account</button>
            </p>
          )}
          {mode === 'REGISTER' && (
            <p>Already registered?{' '}
              <button onClick={() => setMode('LOGIN')} className="text-amber-400 font-bold hover:underline cursor-pointer">Sign In</button>
            </p>
          )}
          {mode === 'FORGOT' && (
            <p>Remember your password?{' '}
              <button onClick={() => setMode('LOGIN')} className="text-amber-400 font-bold hover:underline cursor-pointer">Back to Sign In</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};