/**
 * Foreground Notification Checker Service
 * 
 * This service runs periodically (when app is active) to check Firestore 
 * for pending notifications and fires them using local Expo Notifications.
 * 
 * This is a simpler alternative to background tasks that works reliably
 * without requiring additional expo packages.
 */

import * as Notifications from 'expo-notifications';
import { getPendingNotifications, markNotificationFired } from '../firebase/services/scheduledNotificationsService';
import { AppState } from 'react-native';

const CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds
let checkInterval = null;
let appStateSubscription = null;

/**
 * Configure notification handler
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Check for pending notifications and fire them
 */
async function checkAndFireNotifications() {
  try {
    console.log('[Notification Checker] Checking for pending notifications...');
    
    const pendingNotifications = await getPendingNotifications();
    
    if (pendingNotifications.length === 0) {
      console.log('[Notification Checker] No pending notifications');
      return;
    }
    
    console.log(`[Notification Checker] Found ${pendingNotifications.length} pending notification(s)`);
    
    const now = new Date();
    
    for (const notification of pendingNotifications) {
      const scheduledFor = notification.scheduledFor.toDate();
      
      // Check if notification is due (scheduled time has passed)
      if (now >= scheduledFor) {
        console.log(`[Notification Checker] Firing notification: ${notification.title} - ${notification.message}`);
        
        // Fire the local notification
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.message,
            data: {
              routineId: notification.routineId,
              routineName: notification.routineName,
              type: notification.type,
              dayName: notification.dayName
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // Fire immediately
        });
        
        // Mark as fired and reschedule if recurring
        await markNotificationFired(notification.id, notification);
      }
    }
  } catch (error) {
    console.error('[Notification Checker] Error:', error);
  }
}

/**
 * Start the notification checker service
 * This will check for notifications every minute while the app is active
 */
export function startNotificationService() {
  if (checkInterval) {
    console.log('[Notification Service] Already running');
    return;
  }
  
  console.log('[Notification Service] Starting...');
  
  // Check immediately on start
  checkAndFireNotifications();
  
  // Then check every minute
  checkInterval = setInterval(() => {
    checkAndFireNotifications();
  }, CHECK_INTERVAL);
  
  // Listen to app state changes
  appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('[Notification Service] App became active, checking notifications...');
      checkAndFireNotifications();
    }
  });
}

/**
 * Stop the notification checker service
 */
export function stopNotificationService() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('[Notification Service] Stopped interval checking');
  }
  
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
    console.log('[Notification Service] Stopped app state listener');
  }
}

/**
 * Manual check for pending notifications
 * Can be called manually when needed
 */
export async function checkNow() {
  console.log('[Notification Service] Manual check requested');
  return await checkAndFireNotifications();
}

