/**
 * Device Service - ANDROID ONLY
 * Manages unique device identification for data isolation
 * Each device gets a unique ID that persists across app sessions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

const DEVICE_ID_KEY = '@meadow_device_id';
let cachedDeviceId = null;

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
    // Try to get stored device ID
    const storedId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (storedId) {
      cachedDeviceId = storedId;
      return storedId;
    }

    // Generate a new device ID using Expo's installation ID
    let deviceId;
    try {
      const installationId = await Application.getInstallationIdAsync();
      if (installationId) {
        deviceId = installationId;
      }
    } catch (error) {
      console.warn('Could not get installation ID:', error);
    }

    // Fallback: Generate a UUID-like ID
    if (!deviceId) {
      deviceId = generateDeviceId();
    }

    // Store the device ID for future use
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
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
    await AsyncStorage.removeItem(DEVICE_ID_KEY);
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

