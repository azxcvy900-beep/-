import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDjGUhA34AAvw0GcmB5hTwnZJqr78l5Cag",
    authDomain: "yafa-design.firebaseapp.com",
    projectId: "yafa-design",
    storageBucket: "yafa-design.firebasestorage.app",
    messagingSenderId: "117022652078",
    appId: "1:117022652078:web:e2ae9e864072bf279ddf3f",
    measurementId: "G-VZ6LR3XS4V"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
