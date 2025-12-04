/**
 * Device Service
 * Manages unique device identification for data isolation
 * Each device gets a unique ID that persists across app sessions
 * Works on web, iOS, and Android
 */

import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@meadow_device_id';

let cachedDeviceId = null;
let Application = null;
let AsyncStorage = null;

// Conditionally import platform-specific modules
if (Platform.OS !== 'web') {
  try {
    Application = require('expo-application');
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (error) {
    console.warn('Could not load native modules:', error);
  }
}

/**
 * Get storage interface based on platform
 */
const getStorage = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    return {
      getItem: async (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('localStorage.getItem error:', error);
          return null;
        }
      },
      setItem: async (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('localStorage.setItem error:', error);
        }
      },
      removeItem: async (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('localStorage.removeItem error:', error);
        }
      }
    };
  } else {
    // Use AsyncStorage for native platforms
    return AsyncStorage || {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {}
    };
  }
};

/**
 * Generate a unique device ID
 */
const generateDeviceId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const random2 = Math.random().toString(36).substring(2, 15);
  const random3 = Math.random().toString(36).substring(2, 15);
  return `device-${timestamp}-${random}-${random2}-${random3}`;
};

/**
 * Get or create a unique device ID
 * Uses expo-application's installation ID on native platforms
 * Uses localStorage on web
 * Falls back to a generated UUID if needed
 */
export const getDeviceId = async () => {
  // Return cached ID if available
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const storage = getStorage();
    
    // Try to get stored device ID
    const storedId = await storage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      cachedDeviceId = storedId;
      return storedId;
    }

    // Generate a new device ID
    let deviceId;
    
    // Try to use Expo's installation ID on native platforms
    if (Platform.OS !== 'web' && Application) {
      try {
        const installationId = await Application.getInstallationIdAsync();
        if (installationId) {
          deviceId = installationId;
        }
      } catch (error) {
        console.warn('Could not get installation ID:', error);
      }
    }

    // Fallback: Generate a UUID-like ID
    if (!deviceId) {
      deviceId = generateDeviceId();
    }

    // Store the device ID for future use
    await storage.setItem(DEVICE_ID_KEY, deviceId);
    cachedDeviceId = deviceId;

    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback: Generate a temporary ID
    const fallbackId = generateDeviceId();
    cachedDeviceId = fallbackId;
    return fallbackId;
  }
};

/**
 * Clear the device ID (useful for testing or reset)
 */
export const clearDeviceId = async () => {
  try {
    const storage = getStorage();
    await storage.removeItem(DEVICE_ID_KEY);
    cachedDeviceId = null;
  } catch (error) {
    console.error('Error clearing device ID:', error);
  }
};

/**
 * Initialize device ID on app start (call this early in your app)
 */
export const initializeDeviceId = async () => {
  return await getDeviceId();
};

