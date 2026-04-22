import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAsSwfz3X-sQ0j_5rQBfWv9UfwRvTnbqck",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "byers-12ff3.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "byers-12ff3",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "byers-12ff3.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "464385040440",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:464385040440:web:c686fef4287d4d74ad06cd",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-1T3MFFC9YK"
};


// Initialize Firebase (singleton pattern to avoid re-initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent local cache for fast subsequent loads
let db: ReturnType<typeof initializeFirestore>;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  // If already initialized (e.g. hot reload), just get the existing instance
  const { getFirestore } = require("firebase/firestore");
  db = getFirestore(app);
}

// Initialize Auth
const auth = getAuth(app);

// Initialize Storage
const storage = getStorage(app);

// Lazy-load Analytics only when needed (not blocking initial load)
let analytics: any = null;
export function getAnalyticsInstance() {
  if (typeof window !== "undefined" && !analytics) {
    import("firebase/analytics").then(({ getAnalytics, isSupported }) => {
      isSupported().then((supported) => {
        if (supported) {
          analytics = getAnalytics(app);
        }
      });
    });
  }
  return analytics;
}

export { app, db, auth, storage };
