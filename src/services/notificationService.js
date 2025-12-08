import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
// This ensures notifications are NOT persistent and can be dismissed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    // Don't make notifications persistent/ongoing
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async () => {
  try {
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
    if (Platform.OS === 'android') {
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
 * Schedule a notification for a routine (5 minutes before start time)
 * @param {Object} routine - The routine object
 * @returns {Promise<string|null>} - The notification identifier or null
 */
export const scheduleRoutineNotification = async (routine) => {
  try {
    if (!routine.enabled) {
      return null; // Don't schedule if routine is disabled
    }

    // Parse start time (format: "HH:MM AM/PM" or "HH:MM")
    const [time, period] = routine.startTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    
    // Convert to 24-hour format
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) {
      hour24 = hours + 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }

    // Calculate notification time (5 minutes before)
    let notifHour = hour24;
    let notifMinute = minutes - 5;
    
    if (notifMinute < 0) {
      notifMinute += 60;
      notifHour -= 1;
      if (notifHour < 0) {
        notifHour = 23;
      }
    }

    // Get current day of week
    const dayMap = {
      'Sun': 1,
      'Mon': 2,
      'Tue': 3,
      'Wed': 4,
      'Thu': 5,
      'Fri': 6,
      'Sat': 7
    };

    // Schedule notification for each day the routine is active
    const notificationIds = [];
    
    for (const day of routine.days) {
      const weekday = dayMap[day];
      
      const trigger = {
        hour: notifHour,
        minute: notifMinute,
        weekday: weekday,
        repeats: true,
      };

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Routine Reminder',
          body: `${routine.name} starts in 5 minutes`,
          data: { routineId: routine.id, routineName: routine.name },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'routine-reminder',
        },
        trigger,
      });

      notificationIds.push(identifier);
    }

    return notificationIds.join(',');
  } catch (error) {
    console.error('Error scheduling routine notification:', error);
    return null;
  }
};

/**
 * Cancel all notifications for a routine
 * @param {string} notificationIds - Comma-separated notification IDs
 */
export const cancelRoutineNotification = async (notificationIds) => {
  try {
    if (!notificationIds) return;
    
    const ids = notificationIds.split(',');
    await Promise.all(ids.map(id => Notifications.cancelScheduledNotificationAsync(id)));
    
    console.log('Cancelled routine notifications:', ids);
  } catch (error) {
    console.error('Error cancelling routine notifications:', error);
  }
};

/**
 * Reschedule all routine notifications
 * @param {Array} routines - Array of routine objects
 */
export const rescheduleAllRoutineNotifications = async (routines) => {
  try {
    // Cancel all existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule new notifications for enabled routines
    const updates = [];
    for (const routine of routines) {
      if (routine.enabled) {
        const notificationIds = await scheduleRoutineNotification(routine);
        if (notificationIds && routine.id) {
          updates.push({ id: routine.id, notificationIds });
        }
      }
    }

    return updates;
  } catch (error) {
    console.error('Error rescheduling routine notifications:', error);
    return [];
  }
};

/**
 * Get all scheduled notifications (for debugging)
 */
export const getAllScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log('Scheduled notifications:', notifications);
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
  }
};

