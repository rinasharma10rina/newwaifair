import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  UploadCloud,
  FileText,
  Camera,
  Check,
  Trash2,
  ZoomIn,
  ShieldCheck,
  X,
  Loader2,
  RefreshCw,
  FileCheck,
  Clock,
} from 'lucide-react';
import {
  uploadKycImageToFirebaseStorage,
  fileToDataUrl,
} from '../../services/firebaseKyc';

interface BecomeSellerPageProps {
  onNavigate: (view: string) => void;
  initialMode?: 'register' | 'login';
}

export type DocumentType = 'ID Card' | 'Passport' | 'Driving License' | 'Social Card';

export const FIXED_SELLER_INVITE_CODE = '52013';

export const BecomeSellerPage: React.FC<BecomeSellerPageProps> = ({
  onNavigate,
  initialMode = 'register',
}) => {
  const { registerSeller, loginSeller, currentUser, switchUserRole, sellers, sessionNotice, storeContacts } = useStore();

  // Mode: Register vs Login
  const [authMode, setAuthMode] = useState<'register' | 'login'>(initialMode);

  // Step 1 Form States (Registration) - Start completely blank for fresh registration
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shopName, setShopName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [showInviteCode, setShowInviteCode] = useState(false);

  // Invitation Code Validation States (Fixed Code: 52013)
  const cleanInviteCode = invitationCode.trim();
  const isInviteCodeEntered = cleanInviteCode.length > 0;
  const isInviteCodeValid = cleanInviteCode === FIXED_SELLER_INVITE_CODE;
  const isInviteCodeInvalid = isInviteCodeEntered && !isInviteCodeValid;

  // Step 2 Form States (Password & Identity Verification)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Identity Verification & Document Upload States
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('ID Card');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Front & Back Document Upload States
  const [frontImageFile, setFrontImageFile] = useState<File | null>(null);
  const [frontImagePreview, setFrontImagePreview] = useState<string | null>(null);
  const [frontImageName, setFrontImageName] = useState<string>('');
  const [isFrontDragOver, setIsFrontDragOver] = useState(false);
  const frontInputRef = useRef<HTMLInputElement>(null);

  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string | null>(null);
  const [backImageName, setBackImageName] = useState<string>('');
  const [isBackDragOver, setIsBackDragOver] = useState(false);
  const backInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');
  const [previewModalImage, setPreviewModalImage] = useState<{ url: string; title: string } | null>(null);

  // Seller Login States
  const [loginEmailOrPhone, setLoginEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status & Feedback Messages
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Step 1 Continue Handler
  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();
    const cleanShop = shopName.trim();

    if (!cleanFullName) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your Full Name to register.',
      });
      return;
    }

    if (!cleanEmail) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your Seller Gmail / Email address.',
      });
      return;
    }

    if (!cleanPhone) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your phone number.',
      });
      return;
    }

    if (!cleanShop) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter a shop name for your store.',
      });
      return;
    }

    // Check if email or phone is already registered as a seller
    const alreadyRegistered = sellers.find(
      (s) =>
        (cleanEmail && s.email && s.email.toLowerCase() === cleanEmail) ||
        (cleanPhone && s.phone && s.phone === cleanPhone)
    );

    if (alreadyRegistered) {
      const isEmailMatch = alreadyRegistered.email && alreadyRegistered.email.toLowerCase() === cleanEmail;
      const conflictIdentifier = isEmailMatch ? cleanEmail : cleanPhone;
      setStatusMessage({
        type: 'error',
        text: `⚠️ Already Registered: An account with "${conflictIdentifier}" is already registered as a seller! Please switch to "Seller Sign In" to log in, or enter a new email/phone to register.`,
      });
      setLoginEmailOrPhone(conflictIdentifier);
      return;
    }

    if (invitationCode.trim() !== FIXED_SELLER_INVITE_CODE) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid invitation code! You cannot apply without entering a valid merchant invitation code.',
      });
      return;
    }

    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const documentOptions: DocumentType[] = [
    'ID Card',
    'Passport',
    'Driving License',
    'Social Card',
  ];
  const handleFrontFileChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please upload an image file (JPG, PNG, WEBP).' });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setFrontImageFile(file);
      setFrontImagePreview(dataUrl);
      setFrontImageName(file.name);
      setStatusMessage(null);
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to read front image file.' });
    }
  };

  const handleBackFileChange = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Please upload an image file (JPG, PNG, WEBP).' });
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setBackImageFile(file);
      setBackImagePreview(dataUrl);
      setBackImageName(file.name);
      setStatusMessage(null);
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to read back image file.' });
    }
  };

  // Final Registration Handler with Firebase Storage upload
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (invitationCode.trim() !== FIXED_SELLER_INVITE_CODE) {
      setStatusMessage({
        type: 'error',
        text: 'Invalid invitation code! You cannot apply without a valid merchant invitation code.',
      });
      return;
    }

    const cleanPassword = password.trim();
    if (!cleanPassword) {
      setStatusMessage({ type: 'error', text: 'Please enter a password for your seller account.' });
      return;
    }

    if (cleanPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (cleanPassword !== confirmPassword.trim()) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match. Please verify your password.' });
      return;
    }

    if (!acceptedTerms) {
      setStatusMessage({ type: 'error', text: 'Please read and accept the terms and conditions.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber.trim();

    // Check if email or phone is already registered
    const alreadyRegistered = sellers.find(
      (s) =>
        (cleanEmail && s.email && s.email.toLowerCase() === cleanEmail) ||
        (cleanPhone && s.phone && s.phone === cleanPhone)
    );

    if (alreadyRegistered) {
      setStatusMessage({
        type: 'error',
        text: `⚠️ Already Registered: An account with ${cleanEmail || cleanPhone} is already registered! Please switch to "Sign In to Store" to log in.`,
      });
      setLoginEmailOrPhone(cleanEmail || cleanPhone);
      return;
    }

    if (!frontImagePreview || !backImagePreview) {
      setStatusMessage({
        type: 'error',
        text: `Please upload both the Front Side and Back Side images of your ${selectedDocType}.`,
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatusText('Processing Registration...');

      const tempSellerId = `seller_${Date.now()}`;

      // Upload Front Side
      const frontUpload = await uploadKycImageToFirebaseStorage(
        frontImageFile || frontImagePreview,
        tempSellerId,
        'front',
        selectedDocType
      );

      setUploadStatusText('Processing Registration...');

      // Upload Back Side
      const backUpload = await uploadKycImageToFirebaseStorage(
        backImageFile || backImagePreview,
        tempSellerId,
        'back',
        selectedDocType
      );

      setUploadStatusText('Saving Store Profile to Database...');

      const res = await registerSeller({
        shopName: shopName.trim() || `${fullName.trim() || 'Merchant'}'s Store`,
        sellerName: fullName.trim() || 'Store Owner',
        email: cleanEmail,
        phone: cleanPhone,
        password: cleanPassword,
        invitationCode: invitationCode.trim(),
        documentType: selectedDocType,
        frontImage: frontUpload.downloadUrl,
        backImage: backUpload.downloadUrl,
        verificationStatus: 'pending',
      });

      setIsUploading(false);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `Registration submitted successfully! Your store "${shopName || 'Store'}" is under review. Redirecting to Support Chat to wait for store approval...`,
        });
        setTimeout(() => {
          onNavigate('seller-support');
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setIsUploading(false);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to complete registration. Please check your connection and try again.',
      });
    }
  };

  // Seller Login Handler
  const handleSellerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const query = loginEmailOrPhone.trim();
    if (!query) {
      setStatusMessage({ type: 'error', text: 'Please enter your registered seller email or phone number.' });
      return;
    }
    const res = await loginSeller(query, loginPassword);

    if (res.success) {
      const sellerProfile = res.seller || sellers.find((s) => s.userId === res.user?.id || s.email === res.user?.email);
      if (sellerProfile && sellerProfile.applicationStatus === 'PENDING') {
        setStatusMessage({
          type: 'success',
          text: `Login successful! Your store is currently under review by our verification team. Redirecting to Support Chat...`,
        });
        setTimeout(() => {
          onNavigate('seller-support');
        }, 700);
      } else {
        setStatusMessage({
          type: 'success',
          text: `Login successful! Welcome back ${res.user?.name || 'Seller'}. Redirecting to your dashboard...`,
        });
        setTimeout(() => {
          onNavigate('seller');
        }, 700);
      }
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. TOP HEADER BAR */}
      <header className="bg-slate-950 text-white px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs sticky top-0 z-30 border-b border-slate-800">
        {/* Left Logo + Back button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white border border-slate-800 transition-all cursor-pointer text-xs font-bold shrink-0 shadow-sm"
            title="Back to main website (Home)"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Back to Store</span>
          </button>

          <div
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform font-black">
              <ShoppingCart className="w-4 h-4 fill-current text-slate-950" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-serif">
              Waifair<span className="text-amber-400">.</span>
            </span>
          </div>
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center gap-2">
          {authMode === 'register' ? (
            <button
              onClick={() => {
                setAuthMode('login');
                setStatusMessage(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 sm:px-5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={() => {
                setAuthMode('register');
                setCurrentStep(1);
                setStatusMessage(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-4 sm:px-5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Apply Now
            </button>
          )}
        </div>
      </header>

      {/* 2. TOP HERO BANNER (MOBILE & RESPONSIVE) */}
      <div className="bg-slate-900 border-b border-slate-800 text-white p-5 sm:p-8 relative overflow-hidden">
        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          {/* Top Logo & Pill */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs">
                <ShoppingCart className="w-3.5 h-3.5 fill-current text-slate-950" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white font-serif">Waifair</span>
            </div>

            <div className="px-3 py-1 rounded-full border border-amber-400/30 bg-amber-400/10 text-amber-400 text-[10px] font-bold tracking-wider uppercase">
              {authMode === 'register' ? 'SELLER REGISTRATION' : 'SELLER LOGIN'}
            </div>
          </div>

          {/* Headline */}
          <div className="pt-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-white">
              {authMode === 'register'
                ? 'Start selling on Waifair.'
                : 'Sign in to your seller portal.'}
            </h1>
          </div>
        </div>

        {/* Faint Storefront Watermark Icon */}
        <div className="absolute right-2 -bottom-6 opacity-10 pointer-events-none text-amber-400 select-none">
          <svg
            className="w-36 h-36 sm:w-48 sm:h-48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
            <circle cx="12" cy="7" r="2" />
          </svg>
        </div>
      </div>

      {/* 3. MAIN FORM BODY SECTION */}
      <main className="flex-1 bg-slate-950 text-slate-100 py-6 px-4 sm:px-6">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Back Navigation Link */}
          <div>
            {authMode === 'login' ? (
              <button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to store</span>
              </button>
            ) : currentStep === 1 ? (
              <button
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to store</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to your details</span>
              </button>
            )}
          </div>

          {/* Prominent Mode Switcher: Sign In vs Register */}
          <div className="flex rounded-2xl bg-slate-900 p-1.5 border border-slate-800 shadow-lg">
            <button
              type="button"
              id="seller-tab-login"
              onClick={() => {
                setAuthMode('login');
                setStatusMessage(null);
              }}
              className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Seller Sign In (Login)</span>
            </button>
            <button
              type="button"
              id="seller-tab-register"
              onClick={() => {
                setAuthMode('register');
                setCurrentStep(1);
                setStatusMessage(null);
              }}
              className={`flex-1 py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Register New Store</span>
            </button>
          </div>

          {/* Form Header */}
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {authMode === 'register' ? 'Register your shop' : 'Seller Sign In'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {authMode === 'register'
                ? currentStep === 1
                  ? 'Tell us about you and your shop.'
                  : 'Choose a password and verify your identity.'
                : 'Enter your registered Gmail or phone and password to sign in.'}
            </p>
          </div>

          {/* Step Progress Bars (Only for Registration) */}
          {authMode === 'register' && (
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 flex gap-2">
                <div className="h-1 flex-1 bg-amber-400 rounded-full" />
                <div
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    currentStep === 2 ? 'bg-amber-400' : 'bg-slate-800'
                  }`}
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-semibold text-slate-400">
                  Step {currentStep} of 2
                </span>
                {currentStep === 1 && (fullName || email || phoneNumber || shopName || invitationCode) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFullName('');
                      setEmail('');
                      setPhoneNumber('');
                      setShopName('');
                      setInvitationCode('');
                      setStatusMessage(null);
                    }}
                    className="text-[11px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                  >
                    Clear Form
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Status / Alert Feedback */}
          {statusMessage && (
            <div
              className={`p-4 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span className="font-bold block text-white">
                  {statusMessage.type === 'success' ? 'Success' : 'Notice'}
                </span>
                <span>{statusMessage.text}</span>
                {statusMessage.text.includes('already registered') && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setStatusMessage(null);
                      }}
                      className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer"
                    >
                      Sign In to Store Now
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('');
                        setPhoneNumber('');
                        setStatusMessage(null);
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition cursor-pointer"
                    >
                      Use Different Email / Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* SELLER LOGIN FORM */}
          {/* ======================================================== */}
          {authMode === 'login' ? (
            <form onSubmit={handleSellerLogin} className="space-y-4 pt-1">
              {/* Session Expiry or Timeout Notice */}
              {sessionNotice && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-400/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-200">Session Info:</span>
                    <span>{sessionNotice}</span>
                  </div>
                </div>
              )}

              {/* Email / Phone */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Seller Gmail / Email or Phone Number *
                </label>
                <div className="relative">
                  <input
                    id="seller-login-email-input"
                    type="text"
                    value={loginEmailOrPhone}
                    onChange={(e) => setLoginEmailOrPhone(e.target.value)}
                    placeholder="e.g. seller@gmail.com or +1 6574906103"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:text-slate-500"
                  />
                  <Mail className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStatusMessage({
                        type: 'success',
                        text: 'Password reset link simulated: Please use your registered password or quick login.',
                      });
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="seller-login-password-input"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your seller password"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all pr-11 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  id="seller-remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-400 focus:ring-amber-400 cursor-pointer"
                />
                <label htmlFor="seller-remember-me" className="text-xs text-slate-400 cursor-pointer">
                  Remember me on this browser
                </label>
              </div>

              {/* Sign In Button */}
              <div className="pt-2">
                <button
                  id="seller-login-submit-btn"
                  type="submit"
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-sm sm:text-base rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>Sign In to Seller Dashboard</span>
                </button>
              </div>

              {/* Toggle to Registration */}
              <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>New to Waifair? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setCurrentStep(1);
                    setStatusMessage(null);
                  }}
                  className="text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Register your shop (Apply Now)
                </button>
              </div>
            </form>
          ) : /* ======================================================== */
          /* SELLER REGISTRATION FLOW */
          /* ======================================================== */
          currentStep === 1 ? (
            <form onSubmit={handleStep1Continue} className="space-y-4 pt-1">
              <div className="space-y-1">
                <label htmlFor="seller-full-name-input" className="block text-xs font-semibold text-slate-300">
                  Full Name <span className="text-amber-400">*</span>
                </label>
                <input
                  id="seller-full-name-input"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  placeholder="e.g. John Doe"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="seller-email-input" className="block text-xs font-semibold text-slate-300">
                  Seller Gmail / Email <span className="text-amber-400">*</span>
                </label>
                <input
                  id="seller-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="seller-phone-input" className="block text-xs font-semibold text-slate-300">
                  Phone Number <span className="text-amber-400">*</span>
                </label>
                <input
                  id="seller-phone-input"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  placeholder="e.g. +91 000 0000 00"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:text-slate-500"
                />
                <p className="text-[11px] text-slate-500">e.g. +91 000 0000 00</p>
              </div>

              <div className="space-y-1">
                <label htmlFor="seller-shop-name-input" className="block text-xs font-semibold text-slate-300">
                  Shop Name <span className="text-amber-400">*</span>
                </label>
                <input
                  id="seller-shop-name-input"
                  type="text"
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value);
                    if (statusMessage) setStatusMessage(null);
                  }}
                  placeholder="Shop Name *"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:text-slate-500"
                />
                <p className="text-[11px] text-slate-500">This is what customers will see</p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="seller-invite-code-input" className="block text-xs font-semibold text-slate-300">
                    Invitation Code <span className="text-amber-400">*</span>
                  </label>
                  {isInviteCodeValid && (
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" /> Code Verified
                    </span>
                  )}
                  {isInviteCodeInvalid && (
                    <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                      <X className="w-3.5 h-3.5 stroke-[3] text-rose-400" /> Invalid Code
                    </span>
                  )}
                </div>

                <div className="relative">
                  <input
                    id="seller-invite-code-input"
                    type={showInviteCode ? 'text' : 'password'}
                    value={invitationCode}
                    onChange={(e) => {
                      setInvitationCode(e.target.value);
                      if (statusMessage?.text?.includes('invitation code')) {
                        setStatusMessage(null);
                      }
                    }}
                    placeholder="Enter Invitation Code *"
                    style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff' }}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-semibold tracking-wider focus:outline-none transition-all pr-20 text-white dark-input ${
                      isInviteCodeValid
                        ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-slate-900 text-white'
                        : isInviteCodeInvalid
                        ? 'border-rose-500 ring-2 ring-rose-500/25 bg-slate-900 text-white'
                        : 'bg-slate-900 border-slate-800 text-white focus:ring-2 focus:ring-amber-400 placeholder:text-slate-500'
                    }`}
                  />

                  {/* Eye toggle and verification indicator */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowInviteCode(!showInviteCode)}
                      className="p-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      tabIndex={-1}
                    >
                      {showInviteCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    {isInviteCodeValid && (
                      <div
                        title="Invitation Code Verified"
                        className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      </div>
                    )}
                    {isInviteCodeInvalid && (
                      <div
                        title="Incorrect Invitation Code"
                        className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs"
                      >
                        <X className="w-3.5 h-3.5 text-white stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Status message */}
                {isInviteCodeValid && (
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    Invitation code verified. You can proceed.
                  </p>
                )}
                {isInviteCodeInvalid && (
                  <p className="text-[11px] text-rose-400 font-semibold flex items-center gap-1 mt-0.5">
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                    Invalid invitation code. Please enter the correct merchant invitation code.
                  </p>
                )}
                {!isInviteCodeEntered && (
                  <p className="text-[11px] text-slate-500">
                    Enter the authorized merchant invitation code to continue
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  id="seller-continue-step1-btn"
                  type="submit"
                  className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-sm sm:text-base rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Continue
                </button>
              </div>

              {/* Bottom Sign In Link */}
              <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>Already have a seller account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setStatusMessage(null);
                  }}
                  className="text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Password & Identity Verification */
            <form onSubmit={handleFinalSubmit} className="space-y-5 pt-1">
              {/* Password Field */}
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    id="seller-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password *"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all pr-11 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password strength indicator */}
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        password.length >= 6 ? 'bg-emerald-500 w-full' : 'bg-slate-700 w-1/4'
                      }`}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    At least 6
                  </span>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <div className="relative">
                  <input
                    id="seller-confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password *"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all pr-11 placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">Re-enter your password</p>
              </div>

              {/* Verify Your Identity Container Box */}
              <div className="border border-slate-800 rounded-2xl p-5 bg-slate-900 space-y-4 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <h3 className="text-base font-black text-white">
                      Verify your identity
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Choose any 1 of the 4 documents below and upload clear photos of both the <strong>Front Side</strong> and <strong>Back Side</strong>.
                  </p>
                </div>

                {/* 1. Document Selection (4 Options) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      SELECT DOCUMENT TYPE (ANY 1)
                    </label>
                    <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
                      Selected: {selectedDocType}
                    </span>
                  </div>

                  {/* 2x2 Grid of Document Type Selection */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {documentOptions.map((doc) => {
                      const isSelected = selectedDocType === doc;
                      return (
                        <button
                          key={doc}
                          type="button"
                          onClick={() => setSelectedDocType(doc)}
                          className={`py-3 px-3.5 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'border-amber-400 bg-amber-400/10 text-amber-400 font-bold shadow-xs'
                              : 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-950'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                          <span>{doc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. DYNAMIC TWO FILE UPLOAD DROPZONES (Front Side & Back Side) */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Upload Both Sides of {selectedDocType}
                    </span>
                    <span className="text-[11px] text-slate-500">JPG, PNG, WEBP</span>
                  </div>

                  {/* Hidden File Inputs */}
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFrontFileChange(e.target.files[0]);
                      }
                    }}
                  />
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleBackFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {/* Grid for Two Upload Buttons / Dropzones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* ZONE 1: UPLOAD FRONT SIDE */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <span>1. Front Side</span>
                          {frontImagePreview && (
                            <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              ✓ Ready
                            </span>
                          )}
                        </span>
                        {frontImagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setFrontImageFile(null);
                              setFrontImagePreview(null);
                              setFrontImageName('');
                            }}
                            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {!frontImagePreview ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsFrontDragOver(true);
                          }}
                          onDragLeave={() => setIsFrontDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsFrontDragOver(false);
                            if (e.dataTransfer.files?.[0]) {
                              handleFrontFileChange(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => frontInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                            isFrontDragOver
                              ? 'border-amber-400 bg-amber-400/5'
                              : 'border-slate-800 hover:border-amber-400 hover:bg-slate-800/40 bg-slate-950'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-900 shadow-xs border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:border-amber-400/30 transition-colors">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="inline-block px-3 py-1 bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs group-hover:bg-amber-300 transition-colors">
                              Upload Front Side
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1.5">
                              Click or drag & drop JPG / PNG
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-slate-800 rounded-xl p-3 bg-slate-950 flex items-center gap-3">
                          {/* Small Image Preview */}
                          <div
                            onClick={() =>
                              setPreviewModalImage({
                                url: frontImagePreview,
                                title: `${selectedDocType} (Front Side)`,
                              })
                            }
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0 cursor-pointer group shadow-2xs"
                          >
                            <img
                              src={frontImagePreview}
                              alt="Front Side Preview"
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <ZoomIn className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {frontImageName || `${selectedDocType} Front`}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Front side attached
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => frontInputRef.current?.click()}
                                className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                              >
                                Change
                              </button>
                              <span className="text-slate-600">•</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewModalImage({
                                    url: frontImagePreview,
                                    title: `${selectedDocType} (Front Side)`,
                                  })
                                }
                                className="text-[11px] text-slate-400 hover:underline cursor-pointer"
                              >
                                Preview
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ZONE 2: UPLOAD BACK SIDE */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-200 flex items-center gap-1">
                          <span>2. Back Side</span>
                          {backImagePreview && (
                            <span className="text-emerald-400 font-semibold text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                              ✓ Ready
                            </span>
                          )}
                        </span>
                        {backImagePreview && (
                          <button
                            type="button"
                            onClick={() => {
                              setBackImageFile(null);
                              setBackImagePreview(null);
                              setBackImageName('');
                            }}
                            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {!backImagePreview ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsBackDragOver(true);
                          }}
                          onDragLeave={() => setIsBackDragOver(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsBackDragOver(false);
                            if (e.dataTransfer.files?.[0]) {
                              handleBackFileChange(e.dataTransfer.files[0]);
                            }
                          }}
                          onClick={() => backInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group ${
                            isBackDragOver
                              ? 'border-amber-400 bg-amber-400/5'
                              : 'border-slate-800 hover:border-amber-400 hover:bg-slate-800/40 bg-slate-950'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-900 shadow-xs border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400 group-hover:border-amber-400/30 transition-colors">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="inline-block px-3 py-1 bg-amber-400 text-slate-950 text-xs font-bold rounded-lg shadow-xs group-hover:bg-amber-300 transition-colors">
                              Upload Back Side
                            </span>
                            <p className="text-[11px] text-slate-500 mt-1.5">
                              Click or drag & drop JPG / PNG
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-slate-800 rounded-xl p-3 bg-slate-950 flex items-center gap-3">
                          {/* Small Image Preview */}
                          <div
                            onClick={() =>
                              setPreviewModalImage({
                                url: backImagePreview,
                                title: `${selectedDocType} (Back Side)`,
                              })
                            }
                            className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0 cursor-pointer group shadow-2xs"
                          >
                            <img
                              src={backImagePreview}
                              alt="Back Side Preview"
                              className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <ZoomIn className="w-4 h-4" />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {backImageName || `${selectedDocType} Back`}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Back side attached
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                type="button"
                                onClick={() => backInputRef.current?.click()}
                                className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                              >
                                Change
                              </button>
                              <span className="text-slate-600">•</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewModalImage({
                                    url: backImagePreview,
                                    title: `${selectedDocType} (Back Side)`,
                                  })
                                }
                                className="text-[11px] text-slate-400 hover:underline cursor-pointer"
                              >
                                Preview
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload status indicator */}
                  {isUploading && (
                    <div className="flex items-center gap-2 p-3 bg-amber-400/10 border border-amber-400/20 rounded-xl text-xs text-amber-300 animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
                      <span>{uploadStatusText}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  id="accept-terms-checkbox"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-400 focus:ring-amber-400 cursor-pointer"
                />
                <label htmlFor="accept-terms-checkbox" className="text-xs text-slate-400 cursor-pointer">
                  I have read and accept the{' '}
                  <span className="text-amber-400 underline font-medium">
                    terms and conditions
                  </span>
                </label>
              </div>

              {/* Subtext info */}
              <div className="text-center">
                <p className="text-xs text-slate-500">
                  Choose which ID document you are uploading
                </p>
              </div>

              {/* Action Buttons: Back + Register as Seller */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors px-2 cursor-pointer"
                >
                  Back
                </button>
                <button
                  id="seller-register-btn"
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-98 disabled:opacity-60 text-slate-950 font-black text-sm sm:text-base rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Registration...</span>
                    </>
                  ) : (
                    <span>Register as Seller</span>
                  )}
                </button>
              </div>

              {/* Bottom Sign In Link */}
              <div className="pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>Already have a seller account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setStatusMessage(null);
                  }}
                  className="text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Sign in
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* 4. DARK LUXURY FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-300 pt-10 pb-8 px-6 sm:px-10 mt-auto">
        <div className="max-w-xl mx-auto space-y-8">
          {/* About Our Store */}
          <div className="space-y-2.5">
            <h3 className="text-xl font-bold tracking-tight text-white font-serif">
              About Waifair Store
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              We provide high-quality products from trusted sellers worldwide. Our mission is to connect buyers with the best products at great prices with 100% verified buyer protection.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-1">
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-colors border border-slate-700"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-colors border border-slate-700"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-colors border border-slate-700"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#social"
                onClick={(e) => e.preventDefault()}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-colors border border-slate-700"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold tracking-tight text-white">
              Quick Links
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-400">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-400 cursor-pointer transition-colors"
                >
                  Home Storefront
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('shop')}
                  className="hover:text-amber-400 cursor-pointer transition-colors"
                >
                  All Products & Deals
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-400 cursor-pointer transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-amber-400 cursor-pointer transition-colors"
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>

            {/* Amber "Apply Now" Button */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setAuthMode('register');
                  setCurrentStep(1);
                  setStatusMessage(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 transition-transform cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Apply as Seller</span>
              </button>
            </div>
          </div>

          {/* Contact Us */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold tracking-tight text-white">
              Contact Us
            </h3>
            <div className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{storeContacts?.address || '4 Copley Place, Floor 7, Boston, MA 02116, USA'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 shrink-0 text-amber-400" />
                <a href={`tel:${storeContacts?.phone}`} className="hover:text-amber-400 transition-colors">
                  {storeContacts?.phone || '+1 6574906103'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-amber-400" />
                <a href={`mailto:${storeContacts?.email}`} className="hover:text-amber-400 transition-colors">
                  {storeContacts?.email || 'support@waifair.com'}
                </a>
              </div>
            </div>
          </div>

          {/* APP DOWNLOAD */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold tracking-tight text-white uppercase">
              APP DOWNLOAD
            </h3>
            <p className="text-xs text-slate-400">
              Get our mobile app for a faster seller & shopping experience
            </p>

            {/* Google Play & App Store Badges */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {/* Google Play */}
              <div className="inline-flex items-center gap-2.5 bg-slate-950 text-white px-4 py-2 rounded-xl shadow-xs border border-slate-800 w-fit cursor-pointer hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a2.036 2.036 0 0 1-.22-.962V2.776c0-.361.08-.696.22-.962z" fill="#00E676" />
                  <path d="M17.477 8.315l-3.685 3.685 3.685 3.685 4.195-2.42c1.2-.693 1.2-1.838 0-2.53l-4.195-2.42z" fill="#FFD600" />
                  <path d="M3.609 1.814l10.183 10.186 3.685-3.685L5.753.805a2.022 2.022 0 0 0-2.144 1.009z" fill="#00B0FF" />
                  <path d="M13.792 12L3.61 22.186c.642.642 1.637.75 2.143.457l11.724-6.758-3.685-3.685z" fill="#FF3D00" />
                </svg>
                <div className="text-left">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 leading-none">
                    GET IT ON
                  </span>
                  <span className="block text-xs font-bold leading-tight">Google Play</span>
                </div>
              </div>

              {/* App Store */}
              <div className="inline-flex items-center gap-2.5 bg-slate-950 text-white px-4 py-2 rounded-xl shadow-xs border border-slate-800 w-fit cursor-pointer hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.65-.79 1.1-1.89.98-2.99-1 .04-2.19.67-2.88 1.48-.61.71-1.15 1.83-1.01 2.91 1.12.09 2.26-.61 2.91-1.4" />
                </svg>
                <div className="text-left">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400 leading-none">
                    Download on the
                  </span>
                  <span className="block text-xs font-bold leading-tight">App Store</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Lightbox / Full Size Document Modal */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  {previewModalImage.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center flex-1 overflow-auto max-h-[70vh]">
              <img
                src={previewModalImage.url}
                alt={previewModalImage.title}
                className="max-h-full max-w-full object-contain rounded-lg shadow-md"
              />
            </div>
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Document Preview</span>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="px-4 py-1.5 bg-amber-400 text-slate-950 rounded-xl font-bold hover:bg-amber-300 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
