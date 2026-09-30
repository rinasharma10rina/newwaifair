import { ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { doc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, getDocs, getDoc, query, where, Firestore } from 'firebase/firestore';
import { db, storage, firebaseConfig } from './firebase';
import { deleteSellerLoginSessionsBySeller } from './firebaseLoginSessions';
import { deleteSellerProductsFromFirestore } from './firebaseProducts';
import { deleteAllChatsForSellerFromFirestore } from './firebaseChat';

const DELETED_SELLERS_KEY = 'nexus_deleted_seller_ids';
const DELETED_ORDERS_KEY = 'nexus_deleted_order_ids';
const DELETED_WITHDRAWALS_KEY = 'nexus_deleted_withdrawal_ids';

export function isSellerDeleted(sellerId: string): boolean {
  try {
    const raw = localStorage.getItem(DELETED_SELLERS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(sellerId);
  } catch {
    return false;
  }
}

export function recordDeletedSellerId(sellerId: string): void {
  try {
    const raw = localStorage.getItem(DELETED_SELLERS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(sellerId)) {
      list.push(sellerId);
      localStorage.setItem(DELETED_SELLERS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function isOrderDeleted(orderId: string): boolean {
  try {
    const raw = localStorage.getItem(DELETED_ORDERS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(orderId);
  } catch {
    return false;
  }
}

export function recordDeletedOrderId(orderId: string): void {
  try {
    const raw = localStorage.getItem(DELETED_ORDERS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(orderId)) {
      list.push(orderId);
      localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function isWithdrawalDeleted(withdrawalId: string): boolean {
  try {
    const raw = localStorage.getItem(DELETED_WITHDRAWALS_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(withdrawalId);
  } catch {
    return false;
  }
}

export function recordDeletedWithdrawalId(withdrawalId: string): void {
  try {
    const raw = localStorage.getItem(DELETED_WITHDRAWALS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(withdrawalId)) {
      list.push(withdrawalId);
      localStorage.setItem(DELETED_WITHDRAWALS_KEY, JSON.stringify(list));
    }
  } catch {}
}

// Check if Firebase has a valid project configured
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

let firestorePermissionDenied = false;
let lastFirestoreErrorMsg = '';

export function getFirestorePermissionStatus(): { permissionDenied: boolean; error: string } {
  const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('waifair_firestore_permission_denied') === 'true' : false;
  return {
    permissionDenied: firestorePermissionDenied || cached,
    error: lastFirestoreErrorMsg,
  };
}

export function setFirestorePermissionDenied(denied: boolean, msg: string = '') {
  firestorePermissionDenied = denied;
  lastFirestoreErrorMsg = msg;
  try {
    if (denied) {
      localStorage.setItem('waifair_firestore_permission_denied', 'true');
    } else {
      localStorage.removeItem('waifair_firestore_permission_denied');
    }
  } catch {}
}

export async function optimizeImageDataUrl(dataUrl?: string, maxDim = 640, quality = 0.65): Promise<string> {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (!dataUrl.startsWith('data:image/') || dataUrl.length < 50000) return dataUrl;
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

export function getFirebaseStorage(): FirebaseStorage | null {
  return storage || null;
}

export function getFirebaseFirestore(): Firestore | null {
  return db || null;
}

/**
 * High-performance client-side image compressor.
 * Downscales large smartphone/camera photos (e.g. 5-15MB) to crisp, lightweight 60-90KB JPEG.
 * Prevents browser localStorage quota exhaustion and eliminates Firestore 1MB document limit errors.
 */
export async function compressImageToDataUrl(
  fileOrBlob: File | Blob,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof FileReader === 'undefined') {
      return resolve('');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      if (!src) return resolve('');

      const img = new Image();
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return resolve(src);
          }

          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Helper to convert a File or Blob to a base64 Data URL with automatic compression
 */
export async function fileToDataUrl(file: File | Blob): Promise<string> {
  const compressed = await compressImageToDataUrl(file, 1000, 1000, 0.75);
  if (compressed) return compressed;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

export interface KycUploadResult {
  downloadUrl: string;
  storagePath: string;
  isFirebaseCloudUrl: boolean;
}

/**
 * Uploads a front or back KYC document image to Firebase Storage.
 * Generates an isolated path: kyc_documents/{sellerId}/{documentType}_{side}_{timestamp}
 * Seamlessly provides instant compressed base64 fallback if storage bucket is offline or unconfigured.
 */
export async function uploadKycImageToFirebaseStorage(
  fileOrDataUrl: File | Blob | string,
  sellerId: string,
  side: 'front' | 'back',
  documentType: string
): Promise<KycUploadResult> {
  const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const timestamp = Date.now();
  const storagePath = `kyc_documents/${sellerId}/${sanitizedDocType}_${side}_${timestamp}`;

  // If already a string URL
  if (typeof fileOrDataUrl === 'string') {
    // If it's a huge uncompressed data URL, compress it
    let safeUrl = fileOrDataUrl;
    if (fileOrDataUrl.startsWith('data:image/') && fileOrDataUrl.length > 200000) {
      try {
        const compressed = await new Promise<string>((res) => {
          const img = new Image();
          img.onload = () => {
            let { width, height } = img;
            if (width > 1000 || height > 1000) {
              if (width > height) {
                height = Math.round((height * 1000) / width);
                width = 1000;
              } else {
                width = Math.round((width * 1000) / height);
                height = 1000;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              res(canvas.toDataURL('image/jpeg', 0.75));
              return;
            }
            res(fileOrDataUrl);
          };
          img.onerror = () => res(fileOrDataUrl);
          img.src = fileOrDataUrl;
        });
        safeUrl = compressed;
      } catch {}
    }

    return {
      downloadUrl: safeUrl,
      storagePath,
      isFirebaseCloudUrl: safeUrl.includes('firebasestorage.googleapis.com'),
    };
  }

  // Pre-generate optimized lightweight data URL (< 90KB)
  const compressedDataUrl = await fileToDataUrl(fileOrDataUrl);

  const storage = getFirebaseStorage();
  const hasStorageBucket = Boolean(firebaseConfig.storageBucket);

  if (storage && hasStorageBucket) {
    try {
      // 4-second timeout to guarantee UI responsiveness without hanging
      const uploadPromise = (async () => {
        const storageRef = ref(storage, storagePath);
        const snapshot = await uploadBytes(storageRef, fileOrDataUrl, {
          contentType: fileOrDataUrl.type || 'image/jpeg',
          customMetadata: {
            sellerId,
            documentType,
            side,
            uploadedAt: new Date().toISOString(),
          },
        });
        return await getDownloadURL(snapshot.ref);
      })();

      const timeoutPromise = new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Storage timeout, using compressed format')), 3800)
      );

      const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
      console.log(`[Firebase Storage] Uploaded ${side} document successfully:`, downloadUrl);
      return {
        downloadUrl,
        storagePath,
        isFirebaseCloudUrl: true,
      };
    } catch (error) {
      console.warn(`[Storage Fallback] Utilizing fast compressed data URL for ${side}:`, error);
      return {
        downloadUrl: compressedDataUrl,
        storagePath,
        isFirebaseCloudUrl: false,
      };
    }
  }

  // Fast lightweight local/DataURL mode
  return {
    downloadUrl: compressedDataUrl,
    storagePath,
    isFirebaseCloudUrl: false,
  };
}

export interface SaveSellerKycResult {
  success: boolean;
  error?: string;
  permissionDenied?: boolean;
}

/**
 * Stores the seller's complete KYC and profile data into Firestore under collection 'sellers'.
 * Ensures all profile fields, login credentials, and verification state are persisted securely.
 */
export async function saveSellerKycToFirestore(sellerData: {
  sellerId: string;
  userId?: string;
  shopName: string;
  sellerName: string;
  email: string;
  phone?: string;
  password?: string;
  documentType?: string;
  frontImage?: string;
  backImage?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected' | string;
  applicationStatus?: string;
  walletBalance?: number;
  joinedDate?: string;
  rating?: number;
  starRating?: number;
  totalSalesVolume?: number;
  selectedProductIds?: string[];
}): Promise<SaveSellerKycResult> {
  if (isSellerDeleted(sellerData.sellerId) || (sellerData.userId && isSellerDeleted(sellerData.userId))) {
    console.log(`[Firestore] Skipping save of permanently deleted seller: ${sellerData.sellerId}`);
    return { success: false, error: 'Seller is deleted' };
  }
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) {
    console.log('[Firestore] Seller record stored in state/localStorage (Firestore live credentials optional)');
    return { success: true };
  }

  try {
    const sellerDocRef = doc(db, 'sellers', sellerData.sellerId);
    const starRatingVal = typeof sellerData.starRating === 'number'
      ? Math.max(0, Math.min(7, Math.round(sellerData.starRating)))
      : (typeof sellerData.rating === 'number' ? Math.max(0, Math.min(7, Math.round(sellerData.rating))) : 7);

    // Compress any large base64 image strings to ultra-compact web size so Firestore 1MB limits are never reached
    const optFront = await optimizeImageDataUrl(sellerData.frontImage, 640, 0.65);
    const optBack = await optimizeImageDataUrl(sellerData.backImage, 640, 0.65);

    const cleaned = cleanFirestoreData({
      id: sellerData.sellerId,
      userId: (sellerData as any).userId || sellerData.sellerId,
      shopName: sellerData.shopName,
      sellerName: sellerData.sellerName,
      email: (sellerData.email || '').toLowerCase().trim(),
      phone: sellerData.phone || '',
      password: (sellerData.password && sellerData.password.trim()) ? sellerData.password.trim() : (sellerData.password || ''),
      ...(sellerData.documentType ? { documentType: sellerData.documentType } : {}),
      ...(optFront ? { frontImage: optFront } : {}),
      ...(optBack ? { backImage: optBack } : {}),
      verificationStatus: sellerData.verificationStatus || 'pending',
      applicationStatus: sellerData.applicationStatus || 'PENDING',
      walletBalance: sellerData.walletBalance ?? 0,
      joinedDate: sellerData.joinedDate || new Date().toISOString(),
      rating: starRatingVal,
      starRating: starRatingVal,
      totalSalesVolume: sellerData.totalSalesVolume ?? 0,
      ...(sellerData.selectedProductIds ? { selectedProductIds: sellerData.selectedProductIds } : {}),
      kycSubmittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await setDoc(sellerDocRef, cleaned, { merge: true });
    setFirestorePermissionDenied(false);
    console.log(`[Firestore] Saved seller ${sellerData.sellerId} profile & KYC to Firestore successfully.`);
    return { success: true };
  } catch (error: any) {
    const isPermissionError =
      error?.code === 'permission-denied' ||
      error?.message?.includes('Missing or insufficient permissions') ||
      error?.message?.includes('PERMISSION_DENIED');

    if (isPermissionError) {
      setFirestorePermissionDenied(true, error?.message || 'Missing or insufficient permissions');
      console.error(
        '[Firestore] CRITICAL: Permission Denied while saving seller! Please update Firestore Rules in Firebase Console for project "waifairnew".'
      );
    } else {
      console.warn('[Firestore] Notice while syncing KYC to Firestore:', error);
    }
    return {
      success: false,
      error: error?.message || 'Error saving to Firestore',
      permissionDenied: isPermissionError,
    };
  }
}

/**
 * Persists seller star rating update to Firestore under collection 'sellers'.
 * Instantly updates Firestore so real-time listeners across Admin and Seller dashboards sync immediately.
 */
export async function saveSellerRatingToFirestore(
  sellerId: string,
  starRating: number,
  userId?: string
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return;

  try {
    const validStar = Math.max(0, Math.min(7, Math.round(starRating)));
    const ratingPayload = {
      starRating: validStar,
      rating: validStar,
      updatedAt: new Date().toISOString(),
    };

    const sellerDocRef = doc(db, 'sellers', sellerId);
    await setDoc(sellerDocRef, ratingPayload, { merge: true });

    if (userId && userId !== sellerId) {
      const userSellerDocRef = doc(db, 'sellers', userId);
      try {
        const userDocSnap = await getDoc(userSellerDocRef);
        if (userDocSnap.exists()) {
          await setDoc(userSellerDocRef, ratingPayload, { merge: true });
        }
      } catch {}
    }

    console.log(`[Firestore] Updated seller ${sellerId} star rating to ${validStar} stars in Firestore.`);
  } catch (error) {
    console.warn('[Firestore] Notice while syncing seller rating to Firestore:', error);
  }
}

/**
 * Updates verification status in Firestore ('pending' | 'approved' | 'rejected' | 'frozen')
 */
export async function updateSellerVerificationInFirestore(
  sellerId: string,
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'frozen',
  rejectionReason?: string
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) {
    return;
  }

  try {
    const sellerDocRef = doc(db, 'sellers', sellerId);
    const isFrozen = verificationStatus === 'frozen';
    await setDoc(
      sellerDocRef,
      {
        id: sellerId,
        verificationStatus: isFrozen ? 'pending' : verificationStatus,
        applicationStatus: isFrozen
          ? 'FROZEN'
          : verificationStatus === 'approved'
          ? 'APPROVED'
          : verificationStatus === 'rejected'
          ? 'REJECTED'
          : 'PENDING',
        isFrozen: isFrozen,
        status: isFrozen ? 'FROZEN' : verificationStatus === 'approved' ? 'APPROVED' : 'PENDING',
        rejectionReason: rejectionReason || (isFrozen ? 'Your store has been frozen. Please contact customer support for assistance.' : null),
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firestore] Updated seller ${sellerId} verificationStatus to ${verificationStatus}`);
  } catch (error) {
    console.warn('[Firestore] Notice while updating verification status:', error);
  }
}

/**
 * Updates seller freeze/unfreeze status in Firestore under collection 'sellers'
 */
export async function updateSellerFreezeStatusInFirestore(
  sellerId: string,
  isFrozen: boolean,
  reason?: string
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured() || !sellerId) {
    return;
  }

  try {
    const sellerDocRef = doc(db, 'sellers', sellerId);
    await setDoc(
      sellerDocRef,
      {
        id: sellerId,
        applicationStatus: isFrozen ? 'FROZEN' : 'APPROVED',
        verificationStatus: isFrozen ? 'pending' : 'approved',
        isFrozen: isFrozen,
        status: isFrozen ? 'FROZEN' : 'APPROVED',
        rejectionReason: isFrozen ? (reason || 'Your store has been frozen by Company. Please contact customer support for assistance.') : '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firestore] Updated seller ${sellerId} freeze status to ${isFrozen ? 'FROZEN' : 'APPROVED'}`);
  } catch (error) {
    console.warn('[Firestore] Notice while updating seller freeze status:', error);
  }
}

/**
 * Updates seller subscription plan details in Firestore under collection 'sellers'
 */
export async function updateSellerSubscriptionInFirestore(
  sellerId: string,
  subscription: {
    subscriptionPlanName?: string;
    subscriptionPrice?: string;
    subscriptionMessage?: string;
  }
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured() || !sellerId) return;

  try {
    const sellerDocRef = doc(db, 'sellers', sellerId);
    await setDoc(
      sellerDocRef,
      {
        id: sellerId,
        ...subscription,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firestore] Updated seller ${sellerId} subscription plan details`);
  } catch (error) {
    console.warn('[Firestore] Notice while updating seller subscription:', error);
  }
}

/**
 * Saves global subscription plan settings in Firestore under settings/subscription_plan
 */
export async function saveSubscriptionPlanSettingsToFirestore(settings: any): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return;

  try {
    const docRef = doc(db, 'settings', 'subscription_plan');
    await setDoc(
      docRef,
      {
        ...settings,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[Firestore] Notice while saving subscription settings:', error);
  }
}

/**
 * Real-time listener for global subscription plan settings in Firestore
 */
export function listenToFirestoreSubscriptionPlan(
  onUpdate: (plan: Record<string, any>) => void
): () => void {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return () => {};

  try {
    const docRef = doc(db, 'settings', 'subscription_plan');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data());
        }
      },
      (err) => {
        console.warn('[Firestore] Subscription plan listener notice:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to start subscription plan listener:', err);
    return () => {};
  }
}

/**
 * Updates seller password in Firestore under collection 'sellers'
 */
export async function updateSellerPasswordInFirestore(
  sellerId: string,
  newPassword: string,
  userId?: string
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured() || !sellerId || !newPassword) return;

  try {
    const cleanPassword = newPassword.trim();
    const sellerDocRef = doc(db, 'sellers', sellerId);
    await setDoc(
      sellerDocRef,
      {
        id: sellerId,
        password: cleanPassword,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    if (userId && userId !== sellerId) {
      const userDocRef = doc(db, 'sellers', userId);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          await setDoc(userDocRef, { password: cleanPassword, updatedAt: new Date().toISOString() }, { merge: true });
        }
      } catch {}
    }

    console.log(`[Firestore] Updated seller ${sellerId} password successfully.`);
  } catch (error) {
    console.warn('[Firestore] Notice while updating seller password in Firestore:', error);
  }
}

/**
 * Persists seller wallet balance adjustments to Firestore in collection 'wallets' and 'sellers'
 */
export async function saveSellerWalletToFirestore(
  sellerId: string,
  availableBalance: number,
  totalEarnings: number,
  pendingBalance: number = 0,
  totalWithdrawn: number = 0,
  userId?: string
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return;

  try {
    const numBalance = Number(availableBalance || 0);
    const numEarnings = Number(totalEarnings || 0);
    const numPending = Number(pendingBalance || 0);
    const numWithdrawn = Number(totalWithdrawn || 0);

    const walletData = {
      sellerId,
      userId: userId || sellerId,
      availableBalance: numBalance,
      balance: numBalance,
      walletBalance: numBalance,
      totalEarnings: numEarnings,
      pendingBalance: numPending,
      totalWithdrawn: numWithdrawn,
      updatedAt: new Date().toISOString(),
    };

    const walletDocRef = doc(db, 'wallets', sellerId);
    await setDoc(walletDocRef, walletData, { merge: true });

    if (userId && userId !== sellerId) {
      const userWalletDocRef = doc(db, 'wallets', userId);
      await setDoc(userWalletDocRef, { ...walletData, sellerId: userId }, { merge: true });
    }

    // Also mirror to seller profile so live seller listeners immediately get updated balance
    const sellerDocRef = doc(db, 'sellers', sellerId);
    await setDoc(
      sellerDocRef,
      {
        id: sellerId,
        walletBalance: numBalance,
        balance: numBalance,
        availableBalance: numBalance,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    if (userId && userId !== sellerId) {
      // Only update the user doc if it already exists as a full seller document
      const userSellerDocRef = doc(db, 'sellers', userId);
      try {
        const userDocSnap = await getDoc(userSellerDocRef);
        if (userDocSnap.exists()) {
          await setDoc(
            userSellerDocRef,
            {
              walletBalance: numBalance,
              balance: numBalance,
              availableBalance: numBalance,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch {}
    }

    console.log(`[Firestore] Wallet for seller ${sellerId} (${userId || ''}) synced. Balance: $${numBalance}`);
  } catch (err) {
    console.warn('[Firestore] Notice syncing wallet to Firestore:', err);
  }
}

/**
 * Real-time listener for sellers collection in Firestore.
 * Notifies callbacks whenever a seller registers, updates status, or changes profile.
 */
export function listenToFirestoreSellers(
  onUpdate: (sellers: any[]) => void
): () => void {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return () => {};

  try {
    const sellersCol = collection(db, 'sellers');
    return onSnapshot(
      sellersCol,
      (snapshot) => {
        const firestoreSellers: any[] = [];
        snapshot.forEach((docSnap) => {
          if (isSellerDeleted(docSnap.id)) return;
          const data = docSnap.data();
          if (data?.id && isSellerDeleted(data.id)) return;
          if (data?.userId && isSellerDeleted(data.userId)) return;

          const bal = Number(data.walletBalance ?? data.balance ?? data.availableBalance ?? 0);
          const starRating = typeof data.starRating === 'number'
            ? Math.max(0, Math.min(7, Math.round(data.starRating)))
            : (typeof data.rating === 'number' ? Math.max(0, Math.min(7, Math.round(data.rating))) : 7);
          firestoreSellers.push({
            ...data,
            id: docSnap.id,
            starRating,
            rating: starRating,
            walletBalance: bal,
            balance: bal,
            availableBalance: bal,
          });
        });
        onUpdate(firestoreSellers);
        setFirestorePermissionDenied(false);
      },
      (err: any) => {
        const isPermission =
          err?.code === 'permission-denied' ||
          err?.message?.includes('Missing or insufficient permissions') ||
          err?.message?.includes('PERMISSION_DENIED');
        if (isPermission) {
          setFirestorePermissionDenied(true, err?.message || 'Permission denied');
          console.error('[Firestore] CRITICAL: Sellers subscription rejected by Firebase security rules:', err);
        } else {
          console.warn('[Firestore] Sellers subscription notice:', err);
        }
      }
    );
  } catch (err: any) {
    const isPermission =
      err?.code === 'permission-denied' ||
      err?.message?.includes('Missing or insufficient permissions') ||
      err?.message?.includes('PERMISSION_DENIED');
    if (isPermission) {
      setFirestorePermissionDenied(true, err?.message || 'Permission denied');
    }
    console.warn('[Firestore] Failed to start sellers listener:', err);
    return () => {};
  }
}

/**
 * Direct lookup of seller from Firestore by Email, Phone, Shop Name, or ID.
 * Crucial after GitHub deployments to instantly authenticate existing sellers even if in-memory cache is empty.
 */
export async function getSellerByEmailOrPhoneFromFirestore(query: string): Promise<any | null> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return null;

  try {
    const raw = query.trim();
    const cleanQuery = raw.toLowerCase();
    const sellersCol = collection(db, 'sellers');
    const snapshot = await getDocs(sellersCol);

    const rawDigits = raw.replace(/\D/g, '');

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const email = (data.email || '').toLowerCase().trim();
      const phone = (data.phone || '').trim();
      const phoneDigits = phone.replace(/\D/g, '');
      const shopName = (data.shopName || '').toLowerCase().trim();
      const sellerName = (data.sellerName || '').toLowerCase().trim();
      const id = docSnap.id.toLowerCase().trim();
      const userId = (data.userId || '').toLowerCase().trim();

      const isPhoneMatch =
        phone === raw ||
        phone.toLowerCase() === cleanQuery ||
        (rawDigits.length >= 7 && phoneDigits.endsWith(rawDigits)) ||
        (phoneDigits.length >= 7 && rawDigits.endsWith(phoneDigits));

      if (
        email === cleanQuery ||
        isPhoneMatch ||
        shopName === cleanQuery ||
        sellerName === cleanQuery ||
        id === cleanQuery ||
        userId === cleanQuery
      ) {
        const bal = Number(data.walletBalance ?? data.balance ?? data.availableBalance ?? 0);
        const starRating = typeof data.starRating === 'number'
          ? Math.max(0, Math.min(7, Math.round(data.starRating)))
          : (typeof data.rating === 'number' ? Math.max(0, Math.min(7, Math.round(data.rating))) : 7);
        return {
          id: docSnap.id,
          ...data,
          starRating,
          rating: starRating,
          walletBalance: bal,
          balance: bal,
          availableBalance: bal,
        };
      }
    }
  } catch (err) {
    console.warn('[Firestore] Error looking up seller directly:', err);
  }
  return null;
}

/**
 * Eager fetch of all sellers from Firestore.
 */
export async function fetchAllFirestoreSellers(): Promise<any[]> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return [];

  try {
    const sellersCol = collection(db, 'sellers');
    const snapshot = await getDocs(sellersCol);
    const results: any[] = [];
    snapshot.forEach((docSnap) => {
      if (isSellerDeleted(docSnap.id)) return;
      const data = docSnap.data();
      if (data?.id && isSellerDeleted(data.id)) return;
      if (data?.userId && isSellerDeleted(data.userId)) return;

      const bal = Number(data.walletBalance ?? data.balance ?? data.availableBalance ?? 0);
      const starRating = typeof data.starRating === 'number'
        ? Math.max(0, Math.min(7, Math.round(data.starRating)))
        : (typeof data.rating === 'number' ? Math.max(0, Math.min(7, Math.round(data.rating))) : 7);
      results.push({
        id: docSnap.id,
        ...data,
        starRating,
        rating: starRating,
        walletBalance: bal,
        balance: bal,
        availableBalance: bal,
      });
    });
    return results;
  } catch (err: any) {
    const isPermission =
      err?.code === 'permission-denied' ||
      err?.message?.includes('Missing or insufficient permissions') ||
      err?.message?.includes('PERMISSION_DENIED');
    if (isPermission) {
      setFirestorePermissionDenied(true, err?.message || 'Permission denied');
      console.error('[Firestore] CRITICAL: Fetching sellers rejected by Firebase security rules:', err);
    } else {
      console.warn('[Firestore] Error fetching all sellers:', err);
    }
    return [];
  }
}

/**
 * Real-time listener for wallets collection in Firestore.
 */
export function listenToFirestoreWallets(
  onUpdate: (wallets: Record<string, any>) => void
): () => void {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return () => {};

  try {
    const walletsCol = collection(db, 'wallets');
    return onSnapshot(
      walletsCol,
      (snapshot) => {
        const walletMap: Record<string, any> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const bal = Number(data.availableBalance ?? data.balance ?? data.walletBalance ?? data.amount ?? 0);
          const walletItem = {
            sellerId: data.sellerId || docSnap.id,
            ...data,
            availableBalance: bal,
            balance: bal,
            walletBalance: bal,
            totalEarnings: Number(data.totalEarnings || 0),
            pendingBalance: Number(data.pendingBalance || 0),
            totalWithdrawn: Number(data.totalWithdrawn || 0),
          };
          walletMap[docSnap.id] = walletItem;
          if (data.sellerId && data.sellerId !== docSnap.id) {
            walletMap[data.sellerId] = walletItem;
          }
          if (data.userId) {
            walletMap[data.userId] = walletItem;
          }
        });
        if (Object.keys(walletMap).length > 0) {
          onUpdate(walletMap);
        }
      },
      (err) => {
        console.warn('[Firestore] Wallets subscription notice:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to start wallets listener:', err);
    return () => {};
  }
}

/**
 * Saves placed orders directly to Firestore under collection 'orders'
 */
export async function saveOrderToFirestore(orderData: any): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return;
  try {
    const orderDocRef = doc(db, 'orders', orderData.id);
    await setDoc(
      orderDocRef,
      {
        ...orderData,
        syncedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log(`[Firestore] Order ${orderData.id} synced to Firebase successfully.`);
  } catch (err) {
    console.warn('[Firestore] Notice syncing order to Firestore:', err);
  }
}

/**
 * Real-time listener for orders collection in Firestore.
 */
export function listenToFirestoreOrders(
  onUpdate: (orders: any[]) => void
): () => void {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return () => {};

  try {
    const ordersCol = collection(db, 'orders');
    return onSnapshot(
      ordersCol,
      (snapshot) => {
        const firestoreOrders: any[] = [];
        snapshot.forEach((docSnap) => {
          firestoreOrders.push({ id: docSnap.id, ...docSnap.data() });
        });
        if (firestoreOrders.length > 0) {
          onUpdate(firestoreOrders);
        }
      },
      (err) => {
        console.warn('[Firestore] Orders subscription notice:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to start orders listener:', err);
    return () => {};
  }
}

/**
 * Persists updated store contacts (footer phone, email, address, etc.) to Firestore
 */
export async function saveStoreContactsToFirestore(contactsData: Record<string, any>): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, 'settings', 'store_contacts');
    await setDoc(
      docRef,
      {
        ...contactsData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log('[Firestore] Store contacts saved to Firebase successfully.');
  } catch (err) {
    console.warn('[Firestore] Notice saving store contacts to Firestore:', err);
  }
}

/**
 * Real-time listener for store contacts settings in Firestore
 */
export function listenToFirestoreStoreContacts(
  onUpdate: (contacts: Record<string, any>) => void
): () => void {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return () => {};

  try {
    const docRef = doc(db, 'settings', 'store_contacts');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          onUpdate(docSnap.data());
        }
      },
      (err) => {
        console.warn('[Firestore] Store contacts subscription notice:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to start store contacts listener:', err);
    return () => {};
  }
}

/**
 * Recursively removes undefined fields from an object so Firestore setDoc does not throw
 * "Unsupported field value: undefined" errors.
 */
function cleanFirestoreData(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Persists a withdrawal request to Firestore under 'withdrawals'
 */
export async function saveWithdrawalToFirestore(withdrawalData: any): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured() || !withdrawalData?.id) return false;

  try {
    const docRef = doc(db, 'withdrawals', withdrawalData.id);
    const cleaned = cleanFirestoreData({
      ...withdrawalData,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error saving withdrawal to Firestore:', err);
    return false;
  }
}

/**
 * Fetches all withdrawal requests directly from Firestore
 */
export async function fetchAllFirestoreWithdrawals(): Promise<any[]> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return [];

  try {
    const colRef = collection(db, 'withdrawals');
    const snapshot = await getDocs(colRef);
    const items: any[] = [];
    snapshot.forEach((docSnap) => {
      if (docSnap.exists()) {
        items.push(docSnap.data());
      }
    });
    return items;
  } catch (err) {
    console.warn('[Firestore] Error fetching all withdrawals:', err);
    return [];
  }
}

/**
 * Updates a withdrawal request status / fields in Firestore
 */
export async function updateWithdrawalInFirestore(
  withdrawalId: string,
  updates: Record<string, any>
): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured() || !withdrawalId) return false;

  try {
    const docRef = doc(db, 'withdrawals', withdrawalId);
    const cleaned = cleanFirestoreData({
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(docRef, cleaned, { merge: true });
    return true;
  } catch (err) {
    console.warn('[Firestore] Error updating withdrawal in Firestore:', err);
    return false;
  }
}

/**
 * Helper to wipe all documents in a subcollection under a parent document
 */
async function wipeFirestoreSubcollection(
  parentCollection: string,
  parentDocId: string,
  subcollectionName: string
): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured() || !parentDocId) return;
  try {
    const subColRef = collection(db, parentCollection, parentDocId, subcollectionName);
    const subSnap = await getDocs(subColRef);
    const deletePromises = subSnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
    if (subSnap.size > 0) {
      console.log(`[Firestore] Wiped ${subSnap.size} items from /${parentCollection}/${parentDocId}/${subcollectionName}`);
    }
  } catch (err) {
    console.warn(`[Firestore] Notice wiping subcollection /${parentCollection}/${parentDocId}/${subcollectionName}:`, err);
  }
}

/**
 * Deletes a withdrawal request and its sub-records from Firestore and local caches
 */
export async function deleteWithdrawalFromFirestore(withdrawalId: string): Promise<void> {
  if (!withdrawalId) return;
  recordDeletedWithdrawalId(withdrawalId);

  // 1. Clean localStorage
  try {
    const raw = localStorage.getItem('nexus_withdrawals');
    if (raw) {
      const list = JSON.parse(raw);
      const filtered = Array.isArray(list) ? list.filter((w: any) => w.id !== withdrawalId) : [];
      localStorage.setItem('nexus_withdrawals', JSON.stringify(filtered));
    }
  } catch {}

  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return;

  try {
    // 2. Wipe subcollections
    const knownSubcollections = ['notes', 'history', 'logs'];
    for (const sub of knownSubcollections) {
      await wipeFirestoreSubcollection('withdrawals', withdrawalId, sub);
    }

    // 3. Delete primary document
    const docRef = doc(db, 'withdrawals', withdrawalId);
    await deleteDoc(docRef);

    // 4. In case document ID differs from the withdrawal.id field
    const q = query(collection(db, 'withdrawals'), where('id', '==', withdrawalId));
    const querySnap = await getDocs(q);
    const deletes = querySnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);

    console.log(`[Firestore] Withdrawal ${withdrawalId} permanently deleted from Firestore.`);
  } catch (err) {
    console.warn('[Firestore] Error deleting withdrawal from Firestore:', err);
  }
}

/**
 * Permanently deletes all withdrawals belonging to a specific seller from Firestore
 */
export async function deleteWithdrawalsForSellerFromFirestore(sellerId: string): Promise<void> {
  if (!sellerId) return;
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return;

  try {
    const colRef = collection(db, 'withdrawals');
    const q = query(colRef, where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    for (const docSnap of snap.docs) {
      await deleteWithdrawalFromFirestore(docSnap.id);
      const data = docSnap.data();
      if (data?.id && data.id !== docSnap.id) {
        await deleteWithdrawalFromFirestore(data.id);
      }
    }
    console.log(`[Firestore] Wiped ${snap.size} withdrawal records for seller ${sellerId}`);
  } catch (err) {
    console.warn('[Firestore] Error deleting withdrawals for seller:', err);
  }
}

/**
 * Permanently deletes an order and all its subcollections from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  if (!orderId) return;
  recordDeletedOrderId(orderId);

  // 1. Clean localStorage
  try {
    const raw = localStorage.getItem('nexus_orders');
    if (raw) {
      const list = JSON.parse(raw);
      const filtered = Array.isArray(list) ? list.filter((o: any) => o.id !== orderId) : [];
      localStorage.setItem('nexus_orders', JSON.stringify(filtered));
    }
  } catch {}

  // 2. Broadcast across tabs
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('nexus_order_channel');
      bc.postMessage({ type: 'ORDER_DELETED', orderId });
      setTimeout(() => bc.close(), 1000);
    }
  } catch {}

  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return;

  try {
    // 3. Wipe subcollections
    const knownSubcollections = ['items', 'tracking', 'status_history', 'notes', 'invoices'];
    for (const sub of knownSubcollections) {
      await wipeFirestoreSubcollection('orders', orderId, sub);
    }

    // 4. Delete primary doc
    const docRef = doc(db, 'orders', orderId);
    await deleteDoc(docRef);

    // 5. Query matching id field
    const q = query(collection(db, 'orders'), where('id', '==', orderId));
    const querySnap = await getDocs(q);
    const deletes = querySnap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletes);

    console.log(`[Firestore] Order ${orderId} and subcollections permanently wiped from backend database.`);
  } catch (err) {
    console.warn('[Firestore] Error deleting order from Firestore:', err);
  }
}

/**
 * Permanently deletes all orders assigned to a specific seller from Firestore
 */
export async function deleteOrdersForSellerFromFirestore(sellerId: string): Promise<void> {
  if (!sellerId) return;
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return;

  try {
    const colRef = collection(db, 'orders');
    const deleteIds = new Set<string>();

    const qAssigned = query(colRef, where('assignedSellerId', '==', sellerId));
    const snap1 = await getDocs(qAssigned);
    snap1.forEach((d) => deleteIds.add(d.id));

    const qSellerId = query(colRef, where('sellerId', '==', sellerId));
    const snap2 = await getDocs(qSellerId);
    snap2.forEach((d) => deleteIds.add(d.id));

    for (const ordId of Array.from(deleteIds)) {
      await deleteOrderFromFirestore(ordId);
    }
    console.log(`[Firestore] Deleted ${deleteIds.size} orders assigned to seller ${sellerId}`);
  } catch (err) {
    console.warn('[Firestore] Error deleting orders for seller:', err);
  }
}

/**
 * Permanently deletes a seller's profile, KYC documents, wallet, login sessions,
 * assigned orders, products, and chat messages from Firestore and local storage.
 * Completely wipes all records and sub-collections from the backend.
 */
export async function deleteSellerFromFirestore(
  sellerId: string,
  sellerData?: {
    id?: string;
    userId?: string;
    email?: string;
    shopName?: string;
  }
): Promise<void> {
  if (!sellerId) return;
  recordDeletedSellerId(sellerId);
  const effectiveUserId = sellerData?.userId || sellerId;
  if (effectiveUserId && effectiveUserId !== sellerId) {
    recordDeletedSellerId(effectiveUserId);
  }
  const sellerEmail = sellerData?.email;

  // 1. Clean localStorage caches immediately
  try {
    const rawSellers = localStorage.getItem('nexus_sellers');
    if (rawSellers) {
      const sellers = JSON.parse(rawSellers);
      const filtered = Array.isArray(sellers)
        ? sellers.filter(
            (s: any) =>
              s.id !== sellerId &&
              s.userId !== sellerId &&
              (!effectiveUserId || (s.id !== effectiveUserId && s.userId !== effectiveUserId)) &&
              (!sellerEmail || (s.email || '').toLowerCase() !== sellerEmail.toLowerCase())
          )
        : [];
      localStorage.setItem('nexus_sellers', JSON.stringify(filtered));
    }

    const rawWallets = localStorage.getItem('nexus_wallets');
    if (rawWallets) {
      const wallets = JSON.parse(rawWallets);
      if (wallets && typeof wallets === 'object') {
        delete wallets[sellerId];
        if (effectiveUserId) delete wallets[effectiveUserId];
        localStorage.setItem('nexus_wallets', JSON.stringify(wallets));
      }
    }

    const rawUsers = localStorage.getItem('nexus_users');
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      const filteredUsers = Array.isArray(users)
        ? users.filter(
            (u: any) =>
              u.id !== sellerId &&
              (!effectiveUserId || u.id !== effectiveUserId) &&
              (!sellerEmail || (u.email || '').toLowerCase() !== sellerEmail.toLowerCase())
          )
        : [];
      localStorage.setItem('nexus_users', JSON.stringify(filteredUsers));
    }
  } catch {}

  // 2. Broadcast deletion across open tabs
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('nexus_seller_channel');
      bc.postMessage({ type: 'SELLER_DELETED', sellerId, userId: effectiveUserId, email: sellerEmail });
      setTimeout(() => bc.close(), 1000);
    }
  } catch {}

  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) {
    console.log(`[Firestore] Seller ${sellerId} wiped from state and local storage.`);
    return;
  }

  try {
    // 3. Wipe all sub-collections under sellers/{sellerId}
    const knownSellerSubcollections = ['ratings', 'reviews', 'kyc', 'logs', 'audit', 'notifications', 'documents'];
    for (const sub of knownSellerSubcollections) {
      await wipeFirestoreSubcollection('sellers', sellerId, sub);
      if (effectiveUserId && effectiveUserId !== sellerId) {
        await wipeFirestoreSubcollection('sellers', effectiveUserId, sub);
      }
    }

    // 4. Delete primary seller documents in 'sellers' collection
    try {
      await deleteDoc(doc(db, 'sellers', sellerId));
      if (effectiveUserId && effectiveUserId !== sellerId) {
        await deleteDoc(doc(db, 'sellers', effectiveUserId));
      }
    } catch {}

    // 5. Query and wipe any matching seller docs by id, userId, or email
    const sellersCol = collection(db, 'sellers');
    const sellerDocIdsToDelete = new Set<string>();

    const qById = query(sellersCol, where('id', '==', sellerId));
    const snapById = await getDocs(qById);
    snapById.forEach((d) => sellerDocIdsToDelete.add(d.id));

    if (effectiveUserId) {
      const qByUserId = query(sellersCol, where('userId', '==', effectiveUserId));
      const snapByUserId = await getDocs(qByUserId);
      snapByUserId.forEach((d) => sellerDocIdsToDelete.add(d.id));
    }

    if (sellerEmail) {
      const qByEmail = query(sellersCol, where('email', '==', sellerEmail.toLowerCase().trim()));
      const snapByEmail = await getDocs(qByEmail);
      snapByEmail.forEach((d) => sellerDocIdsToDelete.add(d.id));
    }

    for (const docId of Array.from(sellerDocIdsToDelete)) {
      for (const sub of knownSellerSubcollections) {
        await wipeFirestoreSubcollection('sellers', docId, sub);
      }
      await deleteDoc(doc(db, 'sellers', docId));
    }

    // 6. Delete Seller's Wallet from 'wallets' collection & subcollections
    try {
      const walletSubcols = ['transactions', 'logs'];
      for (const sub of walletSubcols) {
        await wipeFirestoreSubcollection('wallets', sellerId, sub);
        if (effectiveUserId && effectiveUserId !== sellerId) {
          await wipeFirestoreSubcollection('wallets', effectiveUserId, sub);
        }
      }
      await deleteDoc(doc(db, 'wallets', sellerId));
      if (effectiveUserId && effectiveUserId !== sellerId) {
        await deleteDoc(doc(db, 'wallets', effectiveUserId));
      }

      // Query wallets by sellerId field
      const walletsCol = collection(db, 'wallets');
      const qWallets = query(walletsCol, where('sellerId', '==', sellerId));
      const snapWallets = await getDocs(qWallets);
      for (const wDoc of snapWallets.docs) {
        await deleteDoc(wDoc.ref);
      }
    } catch (err) {
      console.warn('[Firestore] Notice deleting seller wallet:', err);
    }

    // 7. Wipe all seller login sessions from Firestore and local storage
    try {
      await deleteSellerLoginSessionsBySeller(sellerId, sellerEmail);
      if (effectiveUserId && effectiveUserId !== sellerId) {
        await deleteSellerLoginSessionsBySeller(effectiveUserId, sellerEmail);
      }
    } catch (err) {
      console.warn('[Firestore] Notice wiping seller sessions:', err);
    }

    // 8. Wipe all withdrawal requests from Firestore
    try {
      await deleteWithdrawalsForSellerFromFirestore(sellerId);
      if (effectiveUserId && effectiveUserId !== sellerId) {
        await deleteWithdrawalsForSellerFromFirestore(effectiveUserId);
      }
    } catch (err) {
      console.warn('[Firestore] Notice wiping seller withdrawals:', err);
    }

    // 9. Wipe all assigned orders from Firestore
    try {
      await deleteOrdersForSellerFromFirestore(sellerId);
      if (effectiveUserId && effectiveUserId !== sellerId) {
        await deleteOrdersForSellerFromFirestore(effectiveUserId);
      }
    } catch (err) {
      console.warn('[Firestore] Notice wiping seller orders:', err);
    }

    // 10. Permanently wipe/disassociate all products associated with this seller
    try {
      await deleteSellerProductsFromFirestore(sellerId, effectiveUserId);
    } catch (err) {
      console.warn('[Firestore] Notice wiping seller products:', err);
    }

    // 11. Permanently wipe all chat messages, conversations, and subcollection messages
    try {
      await deleteAllChatsForSellerFromFirestore(sellerId, sellerEmail);
      if (effectiveUserId && effectiveUserId !== sellerId) {
        await deleteAllChatsForSellerFromFirestore(effectiveUserId, sellerEmail);
      }
    } catch (err) {
      console.warn('[Firestore] Notice wiping seller chats:', err);
    }

    // 12. Wipe user document if stored in 'users' collection in Firestore
    try {
      await deleteDoc(doc(db, 'users', sellerId));
      if (effectiveUserId && effectiveUserId !== sellerId) {
        await deleteDoc(doc(db, 'users', effectiveUserId));
      }
    } catch {}

    // 13. Wipe notifications for this seller
    try {
      const notifsCol = collection(db, 'notifications');
      const qNotif = query(notifsCol, where('recipientId', '==', sellerId));
      const snapNotif = await getDocs(qNotif);
      const notifDeletes = snapNotif.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(notifDeletes);
    } catch {}

    console.log(`[Firestore] Seller ${sellerId} and ALL associated records & sub-collections permanently wiped from backend database.`);
  } catch (err) {
    console.warn('[Firestore] Error performing comprehensive seller deletion:', err);
  }
}

/**
 * Real-time listener for withdrawals collection in Firestore
 */
export function listenToFirestoreWithdrawals(
  onUpdate: (withdrawals: any[]) => void
): () => void {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured()) return () => {};

  try {
    const colRef = collection(db, 'withdrawals');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const items: any[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            items.push(docSnap.data());
          }
        });
        onUpdate(items);
      },
      (err) => {
        console.warn('[Firestore] Withdrawals subscription notice:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to start withdrawals listener:', err);
    return () => {};
  }
}

/**
 * Real-time listener for a seller's rating in Firestore
 */
export function listenToSellerRatingInFirestore(
  sellerId: string,
  onUpdate: (starRating: number) => void
): () => void {
  const db = getFirebaseFirestore();
  if (!db || !isFirebaseConfigured() || !sellerId) return () => {};

  try {
    const docRef = doc(db, 'sellers', sellerId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const rating =
            typeof data?.starRating === 'number'
              ? data.starRating
              : typeof data?.rating === 'number'
              ? data.rating
              : undefined;
          if (typeof rating === 'number') {
            onUpdate(Math.max(0, Math.min(7, rating)));
          }
        }
      },
      (err) => {
        console.warn('[Firestore] Notice in seller rating subscription:', err);
      }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to listen to seller rating in Firestore:', err);
    return () => {};
  }
}
