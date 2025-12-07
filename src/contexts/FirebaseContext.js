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
    // Test Firebase connection with timeout
    const testConnection = async () => {
      // Mark as initialized immediately so app can run in offline mode
      setIsInitialized(true);
      
      // Test connection in background (non-blocking)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000)
      );
      
      try {
        // Try to access Firestore to verify connection with timeout
        const testRef = collection(db, 'test');
        await Promise.race([
          getDocs(testRef),
          timeoutPromise
        ]);
        console.log('Firebase connection successful');
        setError(null);
      } catch (err) {
        // Connection failed or timed out - app will work in offline mode
        const errorMessage = err.message || 'Unknown error';
        
        if (errorMessage.includes('apiKey') || errorMessage.includes('projectId')) {
          setError('Firebase not configured. Please update src/firebase/config.js with your Firebase credentials.');
        } else if (errorMessage.includes('timeout') || errorMessage.includes('Could not reach')) {
          // This is expected when offline - Firestore will work in offline mode
          console.log('Firebase offline mode - app will work with cached data');
          setError(null); // Don't show error for offline mode
        } else {
          console.warn('Firebase connection test failed:', errorMessage);
          // Only set error for critical issues, not for offline mode
          if (!errorMessage.includes('network') && !errorMessage.includes('internet')) {
            setError(errorMessage);
          }
        }
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

