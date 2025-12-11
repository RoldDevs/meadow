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
    // Ensure notifications are not sticky (can be dismissed)
    ...(Platform.OS === 'android' && {
      sticky: false,
      autoDismiss: true,
    }),
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
 * Uses calendar triggers to ensure notifications only fire at the exact scheduled time
 * @param {Object} routine - The routine object
 * @returns {Promise<string|null>} - The notification identifier or null
 */
export const scheduleRoutineNotification = async (routine) => {
  try {
    if (!routine.enabled) {
      return null; // Don't schedule if routine is disabled
    }

    // Parse start time (format: "HH:MM AM/PM" or "HH:MM")
    const timeString = routine.startTime.trim();
    const parts = timeString.split(' ');
    const [hours, minutes] = parts[0].split(':').map(Number);
    const period = parts[1]; // May be undefined for 24-hour format
    
    // Convert to 24-hour format
    let hour24 = hours;
    if (period) {
      if (period.toUpperCase() === 'PM' && hours !== 12) {
        hour24 = hours + 12;
      } else if (period.toUpperCase() === 'AM' && hours === 12) {
        hour24 = 0;
      }
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

    // Day mapping: JS getDay() to day name
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get current date and time
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    console.log('Scheduling routine:', routine.name);
    console.log('Notification time:', notifHour, ':', notifMinute);
    console.log('Current:', dayNames[currentDayIndex], currentHour, ':', currentMinute);

    const notificationIds = [];
    
    // Schedule a separate notification for each day
    for (const day of routine.days) {
      const targetDayIndex = dayNames.indexOf(day);
      
      if (targetDayIndex === -1) {
        console.log(`❌ Invalid day: ${day}`);
        continue;
      }

      // Calculate days until next occurrence
      let daysUntilNext = targetDayIndex - currentDayIndex;
      
      // If it's today but time has passed, schedule for next week
      if (daysUntilNext === 0) {
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const notifTimeInMinutes = notifHour * 60 + notifMinute;
        
        if (currentTimeInMinutes >= notifTimeInMinutes) {
          console.log(`${day}: Time passed today, scheduling for next week`);
          daysUntilNext = 7;
        } else {
          console.log(`${day}: Scheduling for today`);
        }
      } else if (daysUntilNext < 0) {
        // Day is earlier in the week, schedule for next week
        daysUntilNext += 7;
        console.log(`${day}: Scheduling for next week (+${daysUntilNext} days)`);
      } else {
        console.log(`${day}: Scheduling for this week (+${daysUntilNext} days)`);
      }

      // Calculate the exact date and time for the notification
      const notificationDate = new Date(now);
      notificationDate.setDate(now.getDate() + daysUntilNext);
      notificationDate.setHours(notifHour, notifMinute, 0, 0);

      // Use calendar trigger with repeats for weekly recurrence
      const trigger = {
        type: 'calendar',
        repeats: true,
        hour: notifHour,
        minute: notifMinute,
        weekday: targetDayIndex + 1, // expo-notifications: Sunday = 1, Monday = 2, etc.
      };

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Routine Reminder',
          body: `${routine.name} starts in 5 minutes`,
          data: { 
            routineId: routine.id, 
            routineName: routine.name,
            day: day 
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'routine-reminder',
        },
        trigger,
      });

      notificationIds.push(identifier);
      console.log(`Scheduled for ${day} at ${notifHour}:${notifMinute.toString().padStart(2, '0')}`);
    }

    console.log(`Total notifications scheduled: ${notificationIds.length}`);
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

/**
 * Create or update a persistent notification for the focus timer
 * @param {string} phase - "Work" or "Break"
 * @param {number} remainingTime - Time remaining in seconds
 * @returns {Promise<void>}
 */
export const showTimerNotification = async (phase, remainingTime) => {
  try {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: phase === 'Work' ? '🎯 Focus Time' : '☕ Break Time',
        body: `${timeString} remaining`,
        data: { type: 'timer', phase, remainingTime },
        sound: false,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: 'timer',
        sticky: true,
        ...(Platform.OS === 'android' && {
          channelId: 'timer-ongoing',
        }),
      },
      trigger: null, // Show immediately
      identifier: 'timer-notification', // Fixed ID to update the same notification
    });
  } catch (error) {
    console.error('Error showing timer notification:', error);
  }
};

/**
 * Dismiss the timer notification
 */
export const dismissTimerNotification = async () => {
  try {
    await Notifications.dismissNotificationAsync('timer-notification');
  } catch (error) {
    console.error('Error dismissing timer notification:', error);
  }
};

/**
 * Setup notification channels for Android
 */
export const setupNotificationChannels = async () => {
  if (Platform.OS === 'android') {
    try {
      // Channel for routine reminders
      await Notifications.setNotificationChannelAsync('routine-reminders', {
        name: 'Routine Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
      });

      // Channel for ongoing timer notifications
      await Notifications.setNotificationChannelAsync('timer-ongoing', {
        name: 'Focus Timer',
        importance: Notifications.AndroidImportance.MAX,
        sound: null, // No sound for ongoing updates
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      
      console.log('Notification channels created successfully');
    } catch (error) {
      console.error('Error setting up notification channels:', error);
    }
  }
};

