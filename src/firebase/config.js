import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATD9PODfmgaH75iea6ILgkR9cSKYif4zw",
  authDomain: "meadow-c8096.firebaseapp.com",
  projectId: "meadow-c8096",
  storageBucket: "meadow-c8096.firebasestorage.app",
  messagingSenderId: "480549784486",
  appId: "1:480549784486:web:40ce65fd5f70d7dc9f1d67",
  measurementId: "G-8M9VTV9CY4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with persistence enabled (works offline)
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // For better compatibility with React Native
});

// Initialize Auth (if you need authentication later)
const auth = getAuth(app);

// Initialize Analytics (only on web platform)
let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export { app, db, auth, analytics };

