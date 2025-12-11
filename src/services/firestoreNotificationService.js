/**
 * Firestore-based Notification Service
 * 
 * This replaces the local Expo Notifications scheduling with Firestore-based scheduling.
 * Notifications are stored in Firestore and checked periodically by the notification checker.
 */

import * as Notifications from 'expo-notifications';
import { 
  createScheduledNotifications, 
  deleteScheduledNotifications,
  updateScheduledNotifications 
} from '../firebase/services/scheduledNotificationsService';

// Configure notification handler
let notificationHandlerSetup = false;

const setupNotificationHandler = () => {
  if (notificationHandlerSetup) return;
  
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerSetup = true;
  } catch (error) {
    console.warn('Error setting up notification handler:', error);
  }
};

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
  try {
    setupNotificationHandler();
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    // Configure Android notification channel
    if (require('react-native').Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('routine-reminders', {
        name: 'Routine Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule notifications for a routine (creates entries in Firestore)
 * @param {Object} routine - The routine object
 * @returns {Promise<string|null>} - Success message or null
 */
export const scheduleRoutineNotification = async (routine) => {
  try {
    setupNotificationHandler();
    
    if (!routine.enabled) {
      return null;
    }
    
    console.log(`[Firestore Notifications] Scheduling notifications for routine: ${routine.name}`);
    
    // Create scheduled notifications in Firestore
    const notificationIds = await createScheduledNotifications(routine);
    
    if (notificationIds.length > 0) {
      console.log(`[Firestore Notifications] Created ${notificationIds.length} scheduled notifications`);
      return 'scheduled';
    }
    
    return null;
  } catch (error) {
    console.error('[Firestore Notifications] Error scheduling notifications:', error);
    return null;
  }
};

/**
 * Cancel all notifications for a routine
 * @param {string} routineId - Routine ID (not notification IDs in this version)
 */
export const cancelRoutineNotification = async (routineId) => {
  try {
    console.log(`[Firestore Notifications] Cancelling notifications for routine: ${routineId}`);
    await deleteScheduledNotifications(routineId);
    console.log('[Firestore Notifications] Notifications cancelled');
  } catch (error) {
    console.error('[Firestore Notifications] Error cancelling notifications:', error);
  }
};

/**
 * Reschedule all routine notifications
 * @param {Array} routines - Array of routine objects
 */
export const rescheduleAllRoutineNotifications = async (routines) => {
  try {
    console.log('[Firestore Notifications] Rescheduling all notifications...');
    
    const updates = [];
    for (const routine of routines) {
      if (routine.enabled) {
        await deleteScheduledNotifications(routine.id);
        const notificationIds = await createScheduledNotifications(routine);
        if (notificationIds.length > 0) {
          updates.push({ id: routine.id, status: 'scheduled' });
        }
      }
    }

    console.log(`[Firestore Notifications] Rescheduled ${updates.length} routine(s)`);
    return updates;
  } catch (error) {
    console.error('[Firestore Notifications] Error rescheduling notifications:', error);
    return [];
  }
};

/**
 * Setup notification channels for Android
 */
export const setupNotificationChannels = async () => {
  setupNotificationHandler();
  
  if (require('react-native').Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('routine-reminders', {
        name: 'Routine Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
      });
      
      console.log('[Firestore Notifications] Notification channels created');
    } catch (error) {
      console.error('[Firestore Notifications] Error setting up channels:', error);
    }
  }
};

