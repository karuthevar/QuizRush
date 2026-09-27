import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID !== 'your_project_id'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (typeof window !== 'undefined' || isFirebaseConfigured) {
  try {
    if (isFirebaseConfigured) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      googleProvider = new GoogleAuthProvider();
      googleProvider.setCustomParameters({ prompt: 'select_account' });
    }
  } catch (error) {
    console.warn('Firebase initialization skipped or failed:', error);
  }
}

export { app, auth, db, googleProvider };

export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth || !googleProvider) {
    const defaultAdmin = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'karuthevar22@gmail.com';
    const mockUser: any = {
      uid: 'demo-organizer-' + Math.random().toString(36).substring(2, 7),
      displayName: 'Quiz Organizer (Admin Demo)',
      email: defaultAdmin,
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=organizer',
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem('quizrush_demo_user', JSON.stringify(mockUser));
      window.dispatchEvent(new Event('quizrush_auth_change'));
    }
    return mockUser as User;
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.error('Google Sign-In failed:', err);
    throw err;
  }
};

export const signOutUser = async (): Promise<void> => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('quizrush_demo_user');
    window.dispatchEvent(new Event('quizrush_auth_change'));
  }
  if (auth) {
    await signOut(auth);
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  if (typeof window === 'undefined') return () => {};

  if (isFirebaseConfigured && auth) {
    return onAuthStateChanged(auth, callback);
  }

  // Fallback demo auth subscription
  const checkDemoUser = () => {
    const stored = localStorage.getItem('quizrush_demo_user');
    if (stored) {
      try {
        callback(JSON.parse(stored));
      } catch {
        callback(null);
      }
    } else {
      callback(null);
    }
  };

  checkDemoUser();
  window.addEventListener('quizrush_auth_change', checkDemoUser);
  return () => {
    window.removeEventListener('quizrush_auth_change', checkDemoUser);
  };
};
