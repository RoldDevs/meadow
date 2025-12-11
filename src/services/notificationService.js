import * as Notifications from 'expo-notifications';

// Lazy import Platform to avoid initialization issues
let Platform = null;

// Flag to track if notification handler has been set up
let notificationHandlerSetup = false;

// Get Platform safely
const getPlatform = () => {
  if (!Platform) {
    try {
      Platform = require('react-native').Platform;
    } catch (error) {
      console.warn('Could not load Platform:', error);
      // Return a safe fallback
      return { OS: 'unknown' };
    }
  }
  return Platform;
};

// Configure notification handler lazily
// This ensures notifications are NOT persistent and can be dismissed
const setupNotificationHandler = () => {
  if (notificationHandlerSetup) return;
  
  try {
    const platform = getPlatform();
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        // Don't make notifications persistent/ongoing
        priority: Notifications.AndroidNotificationPriority.HIGH,
        // Ensure notifications are not sticky (can be dismissed)
        ...(platform.OS === 'android' && {
          sticky: false,
          autoDismiss: true,
        }),
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
    // Setup notification handler first
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
    const platform = getPlatform();
    if (platform.OS === 'android') {
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
 * Schedule notifications for a routine
 * Schedules TWO notifications per day:
 * 1. 5 minutes before start time (reminder)
 * 2. At exact start time (start notification)
 * Uses weekday triggers for weekly recurring notifications
 * @param {Object} routine - The routine object
 * @returns {Promise<string|null>} - Comma-separated notification identifiers or null
 */
export const scheduleRoutineNotification = async (routine) => {
  try {
    // Setup notification handler first
    setupNotificationHandler();
    
    if (!routine.enabled) {
      return null; // Don't schedule if routine is disabled
    }
    
    // CRITICAL: Cancel any existing notifications for this routine first
    // This prevents duplicate notifications when editing or re-scheduling
    if (routine.notificationIds) {
      await cancelRoutineNotification(routine.notificationIds);
      console.log('Cancelled existing notifications before scheduling new ones');
    }

    // Parse start time (format: "HH:MM" in 24-hour format, or "HH:MM AM/PM")
    const timeString = routine.startTime.trim();
    
    // Handle different time formats
    let startHour24, minutes;
    
    if (timeString.includes(' ')) {
      // Format: "HH:MM AM/PM"
      const parts = timeString.split(' ');
      const timeParts = parts[0].split(':');
      const hours = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
      const period = parts[1];
      
      // Convert to 24-hour format
      if (period && period.toUpperCase() === 'PM' && hours !== 12) {
        startHour24 = hours + 12;
      } else if (period && period.toUpperCase() === 'AM' && hours === 12) {
        startHour24 = 0;
      } else {
        startHour24 = hours;
      }
    } else {
      // Format: "HH:MM" (24-hour)
      const timeParts = timeString.split(':');
      startHour24 = parseInt(timeParts[0], 10);
      minutes = parseInt(timeParts[1], 10);
    }
    
    // Validate parsed values
    if (isNaN(startHour24) || isNaN(minutes)) {
      console.error('Failed to parse time:', timeString);
      return null;
    }

    // Calculate reminder time (5 minutes before)
    let reminderHour = startHour24;
    let reminderMinute = minutes - 5;
    
    if (reminderMinute < 0) {
      reminderMinute += 60;
      reminderHour -= 1;
      if (reminderHour < 0) {
        reminderHour = 23;
      }
    }

    // Day mapping: JS getDay() to day name
    // Expo Notifications uses weekday: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get current date and time
    const now = new Date();
    const currentDayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    console.log('Scheduling routine:', routine.name);
    console.log('Start time:', startHour24, ':', minutes);
    console.log('Reminder time:', reminderHour, ':', reminderMinute);
    console.log('Current:', dayNames[currentDayIndex], currentHour, ':', currentMinute);

    const notificationIds = [];
    
    // Schedule notifications for each selected day
    for (const day of routine.days) {
      const targetDayIndex = dayNames.indexOf(day);
      
      if (targetDayIndex === -1) {
        console.log(`Invalid day: ${day}, skipping`);
        continue;
      }

      // Expo Notifications weekday: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
      const expoWeekday = targetDayIndex + 1;
      const isToday = (targetDayIndex === currentDayIndex);
      
      // Calculate times in minutes for comparison
      const reminderTimeInMinutes = reminderHour * 60 + reminderMinute;
      const startTimeInMinutes = startHour24 * 60 + minutes;
      
      // Helper function to schedule a notification with weekday trigger
      // The weekday trigger with repeats=true will automatically handle weekly recurrence
      // It will fire on the next occurrence of that weekday at the specified time
      const scheduleWeeklyNotification = async (hour, minute, message, type) => {
        // Use weekday trigger with repeats for weekly recurrence
        // Expo Notifications handles the scheduling automatically:
        // - If it's today and time hasn't passed, it fires today
        // - If it's today and time has passed, or if it's a future day, it fires on the next occurrence
        // - With repeats=true, it continues weekly
        const identifier = await Notifications.scheduleNotificationAsync({
          content: {
            title: type === 'reminder' ? 'Routine Reminder' : 'Routine Start',
            body: message,
            data: { 
              routineId: routine.id, 
              routineName: routine.name,
              day: day,
              type: type
            },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'routine-reminder',
          },
          trigger: {
            hour: hour,
            minute: minute,
            weekday: expoWeekday,
            repeats: true,
          },
        });
        
        return identifier;
      };

      // Schedule reminder notification (5 minutes before)
      try {
        const reminderId = await scheduleWeeklyNotification(
          reminderHour,
          reminderMinute,
          `${routine.name} starts in 5 minutes`,
          'reminder'
        );
        notificationIds.push(reminderId);
        
        // Calculate next occurrence for logging
        let daysUntilNext = targetDayIndex - currentDayIndex;
        if (daysUntilNext < 0) daysUntilNext += 7;
        if (isToday && currentTimeInMinutes >= reminderTimeInMinutes) {
          daysUntilNext = 7; // Time passed today, next week
        }
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysUntilNext);
        nextDate.setHours(reminderHour, reminderMinute, 0, 0);
        
        console.log(`Scheduled reminder for ${day} at ${reminderHour}:${reminderMinute.toString().padStart(2, '0')} (next: ${nextDate.toLocaleDateString()}, weekly recurring)`);
      } catch (error) {
        console.error(`Error scheduling reminder for ${day}:`, error);
      }

      // Schedule start notification (exact time)
      try {
        const startId = await scheduleWeeklyNotification(
          startHour24,
          minutes,
          `${routine.name} starts now`,
          'start'
        );
        notificationIds.push(startId);
        
        // Calculate next occurrence for logging
        let daysUntilNext = targetDayIndex - currentDayIndex;
        if (daysUntilNext < 0) daysUntilNext += 7;
        if (isToday && currentTimeInMinutes >= startTimeInMinutes) {
          daysUntilNext = 7; // Time passed today, next week
        }
        const nextDate = new Date(now);
        nextDate.setDate(now.getDate() + daysUntilNext);
        nextDate.setHours(startHour24, minutes, 0, 0);
        
        console.log(`Scheduled start notification for ${day} at ${startHour24}:${minutes.toString().padStart(2, '0')} (next: ${nextDate.toLocaleDateString()}, weekly recurring)`);
      } catch (error) {
        console.error(`Error scheduling start notification for ${day}:`, error);
      }
    }

    console.log(`Total notifications scheduled: ${notificationIds.length} (${notificationIds.length / routine.days.length} per day)`);
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
    // Setup notification handler first
    setupNotificationHandler();
    
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: phase === 'Work' ? 'Focus Time' : 'Break Time',
        body: `${timeString} remaining`,
        data: { type: 'timer', phase, remainingTime },
        sound: false,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: 'timer',
        sticky: true,
        ...(getPlatform().OS === 'android' && {
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
  // Setup notification handler first
  setupNotificationHandler();
  
  const platform = getPlatform();
  if (platform.OS === 'android') {
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

