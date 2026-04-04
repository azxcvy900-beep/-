import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAsSwfz3X-sQ0j_5rQBfWv9UfwRvTnbqck",
  authDomain: "byers-12ff3.firebaseapp.com",
  projectId: "byers-12ff3",
  storageBucket: "byers-12ff3.firebasestorage.app",
  messagingSenderId: "464385040440",
  appId: "1:464385040440:web:c686fef4287d4d74ad06cd",
  measurementId: "G-1T3MFFC9YK"
};

// Initialize Firebase (singleton pattern to avoid re-initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

import { getFirestore } from "firebase/firestore";

// Initialize Analytics client-side only
let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

// Initialize Firestore
const db = getFirestore(app);

export { app, analytics, db };
