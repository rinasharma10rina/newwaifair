import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Configuration priority:
// 1. Vite environment variables (VITE_FIREBASE_*) - essential for Vercel/GitHub deployments
// 2. Bundled firebase-applet-config.json - provided automatically by AI Studio
export const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    firebaseConfigJson.apiKey ||
    'AIzaSyBDO28n99MVyjyQCSTDM7S0JWLSLM9oJ4k',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    firebaseConfigJson.authDomain ||
    'waifairnew.firebaseapp.com',
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID ||
    firebaseConfigJson.projectId ||
    'waifairnew',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    firebaseConfigJson.storageBucket ||
    'waifairnew.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    firebaseConfigJson.messagingSenderId ||
    '348813153425',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    firebaseConfigJson.appId ||
    '1:348813153425:web:3532a91594a89f8148db30',
};

export const FIRESTORE_DATABASE_ID =
  import.meta.env.VITE_FIREBASE_DATABASE_ID ||
  firebaseConfigJson.firestoreDatabaseId ||
  '(default)';

// Initialize singletons
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Auth instance
export const auth: Auth = getAuth(app);

// Firestore instance (with databaseId support if custom, or default)
export const db: Firestore =
  FIRESTORE_DATABASE_ID && FIRESTORE_DATABASE_ID !== '(default)'
    ? getFirestore(app, FIRESTORE_DATABASE_ID)
    : getFirestore(app);

// Storage instance
export const storage: FirebaseStorage = getStorage(app);

export default app;
