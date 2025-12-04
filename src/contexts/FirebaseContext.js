import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

const FirebaseContext = createContext(null);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Test Firebase connection
    const testConnection = async () => {
      try {
        // Try to access Firestore to verify connection
        const testRef = collection(db, 'test');
        await getDocs(testRef);
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.warn('Firebase connection test failed:', err.message);
        // Don't set error for missing config - user needs to configure it
        if (err.message.includes('apiKey') || err.message.includes('projectId')) {
          setError('Firebase not configured. Please update src/firebase/config.js with your Firebase credentials.');
        } else {
          setError(err.message);
        }
        setIsInitialized(true); // Still mark as initialized so app can run
      }
    };

    testConnection();
  }, []);

  const value = {
    isInitialized,
    error,
    db,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

