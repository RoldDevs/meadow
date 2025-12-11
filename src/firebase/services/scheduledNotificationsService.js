/**
 * Firestore-based Scheduled Notifications Service
 * 
 * This service manages notification schedules in Firestore instead of using
 * local device scheduling. A background task checks Firestore for pending
 * notifications and fires them when due.
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  onSnapshot,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../config';
import { getDeviceId } from '../../services/deviceService';

const SCHEDULED_NOTIFICATIONS_COLLECTION = 'scheduledNotifications';

/**
 * Calculate next occurrence of a weekly notification
 * @param {number} dayOfWeek - 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 * @param {number} hour - Hour in 24-hour format (0-23)
 * @param {number} minute - Minute (0-59)
 * @returns {Date} Next occurrence
 */
function getNextOccurrence(dayOfWeek, hour, minute) {
  const now = new Date();
  const currentDay = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Calculate days until target day
  let daysUntil = dayOfWeek - currentDay;
  
  // If target day is today but time has passed, schedule for next week
  if (daysUntil === 0) {
    const targetTime = hour * 60 + minute;
    const currentTime = currentHour * 60 + currentMinute;
    
    if (currentTime >= targetTime) {
      daysUntil = 7; // Next week
    }
  } else if (daysUntil < 0) {
    daysUntil += 7; // Next week
  }
  
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysUntil);
  nextDate.setHours(hour, minute, 0, 0);
  
  return nextDate;
}

/**
 * Day name to day index mapping
 */
const DAY_MAP = {
  'Sun': 0,
  'Mon': 1,
  'Tue': 2,
  'Wed': 3,
  'Thu': 4,
  'Fri': 5,
  'Sat': 6
};

/**
 * Create scheduled notifications for a routine in Firestore
 * @param {Object} routine - Routine object with id, name, startTime, days, enabled
 * @returns {Promise<Array<string>>} Array of notification document IDs
 */
export async function createScheduledNotifications(routine) {
  try {
    if (!routine.enabled) {
      return [];
    }
    
    const deviceId = await getDeviceId();
    
    // Parse start time (format: "HH:MM")
    const [hours, minutes] = routine.startTime.split(':').map(num => parseInt(num, 10));
    
    if (isNaN(hours) || isNaN(minutes)) {
      console.error('Invalid time format:', routine.startTime);
      return [];
    }
    
    // Calculate reminder time (5 minutes before)
    let reminderHour = hours;
    let reminderMinute = minutes - 5;
    
    if (reminderMinute < 0) {
      reminderMinute += 60;
      reminderHour -= 1;
      if (reminderHour < 0) {
        reminderHour = 23;
      }
    }
    
    const notificationIds = [];
    const notificationsRef = collection(db, SCHEDULED_NOTIFICATIONS_COLLECTION);
    
    // Create notifications for each selected day
    for (const dayName of routine.days) {
      const dayOfWeek = DAY_MAP[dayName];
      
      if (dayOfWeek === undefined) {
        console.warn(`Invalid day: ${dayName}`);
        continue;
      }
      
      // Create reminder notification (5 minutes before)
      const reminderTime = getNextOccurrence(dayOfWeek, reminderHour, reminderMinute);
      const reminderDoc = await addDoc(notificationsRef, {
        routineId: routine.id,
        routineName: routine.name,
        deviceId,
        type: 'reminder',
        dayOfWeek,
        dayName,
        hour: reminderHour,
        minute: reminderMinute,
        scheduledFor: Timestamp.fromDate(reminderTime),
        message: `${routine.name} starts in 5 minutes`,
        title: 'Routine Reminder',
        fired: false,
        recurring: true,
        createdAt: Timestamp.now(),
      });
      notificationIds.push(reminderDoc.id);
      
      // Create start notification
      const startTime = getNextOccurrence(dayOfWeek, hours, minutes);
      const startDoc = await addDoc(notificationsRef, {
        routineId: routine.id,
        routineName: routine.name,
        deviceId,
        type: 'start',
        dayOfWeek,
        dayName,
        hour: hours,
        minute: minutes,
        scheduledFor: Timestamp.fromDate(startTime),
        message: `${routine.name} starts now`,
        title: 'Routine Start',
        fired: false,
        recurring: true,
        createdAt: Timestamp.now(),
      });
      notificationIds.push(startDoc.id);
      
      console.log(`Created notifications for ${dayName}: reminder at ${reminderHour}:${reminderMinute.toString().padStart(2, '0')}, start at ${hours}:${minutes.toString().padStart(2, '0')}`);
    }
    
    console.log(`Total scheduled notifications created: ${notificationIds.length}`);
    return notificationIds;
  } catch (error) {
    console.error('Error creating scheduled notifications:', error);
    return [];
  }
}

/**
 * Delete scheduled notifications for a routine
 * @param {string} routineId - Routine ID
 */
export async function deleteScheduledNotifications(routineId) {
  try {
    const deviceId = await getDeviceId();
    const notificationsRef = collection(db, SCHEDULED_NOTIFICATIONS_COLLECTION);
    
    const q = query(
      notificationsRef,
      where('routineId', '==', routineId),
      where('deviceId', '==', deviceId)
    );
    
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`Deleted ${snapshot.size} scheduled notifications for routine ${routineId}`);
  } catch (error) {
    console.error('Error deleting scheduled notifications:', error);
  }
}

/**
 * Get pending notifications that are due to fire (within the next 2 minutes)
 * @returns {Promise<Array>} Array of pending notifications
 */
export async function getPendingNotifications() {
  try {
    const deviceId = await getDeviceId();
    const now = new Date();
    const twoMinutesFromNow = new Date(now.getTime() + 2 * 60 * 1000);
    
    const notificationsRef = collection(db, SCHEDULED_NOTIFICATIONS_COLLECTION);
    const q = query(
      notificationsRef,
      where('deviceId', '==', deviceId),
      where('fired', '==', false),
      where('scheduledFor', '<=', Timestamp.fromDate(twoMinutesFromNow)),
      orderBy('scheduledFor', 'asc'),
      limit(50)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting pending notifications:', error);
    return [];
  }
}

/**
 * Mark notification as fired and schedule next occurrence if recurring
 * @param {string} notificationId - Notification document ID
 * @param {Object} notificationData - Original notification data
 */
export async function markNotificationFired(notificationId, notificationData) {
  try {
    const notificationRef = doc(db, SCHEDULED_NOTIFICATIONS_COLLECTION, notificationId);
    
    if (notificationData.recurring) {
      // Calculate next week's occurrence
      const nextOccurrence = getNextOccurrence(
        notificationData.dayOfWeek,
        notificationData.hour,
        notificationData.minute
      );
      
      // Add 7 days to get next week
      nextOccurrence.setDate(nextOccurrence.getDate() + 7);
      
      await updateDoc(notificationRef, {
        scheduledFor: Timestamp.fromDate(nextOccurrence),
        fired: false,
        lastFired: Timestamp.now()
      });
      
      console.log(`Rescheduled recurring notification for ${nextOccurrence.toLocaleString()}`);
    } else {
      // Mark as fired for non-recurring notifications
      await updateDoc(notificationRef, {
        fired: true,
        firedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error marking notification as fired:', error);
  }
}

/**
 * Update all notifications for a routine (when routine is edited)
 * @param {Object} routine - Updated routine object
 */
export async function updateScheduledNotifications(routine) {
  try {
    // Delete existing notifications
    await deleteScheduledNotifications(routine.id);
    
    // Create new notifications if routine is enabled
    if (routine.enabled) {
      return await createScheduledNotifications(routine);
    }
    
    return [];
  } catch (error) {
    console.error('Error updating scheduled notifications:', error);
    return [];
  }
}

/**
 * Get all scheduled notifications for the current device
 * @returns {Promise<Array>} Array of all scheduled notifications
 */
export async function getAllScheduledNotifications() {
  try {
    const deviceId = await getDeviceId();
    const notificationsRef = collection(db, SCHEDULED_NOTIFICATIONS_COLLECTION);
    
    const q = query(
      notificationsRef,
      where('deviceId', '==', deviceId),
      orderBy('scheduledFor', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Subscribe to pending notifications (real-time updates)
 * @param {Function} callback - Callback function to receive notifications
 * @returns {Function} Unsubscribe function
 */
export function subscribeToPendingNotifications(callback) {
  const deviceId = getDeviceId();
  
  return deviceId.then(id => {
    const notificationsRef = collection(db, SCHEDULED_NOTIFICATIONS_COLLECTION);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    const q = query(
      notificationsRef,
      where('deviceId', '==', id),
      where('fired', '==', false),
      where('scheduledFor', '<=', Timestamp.fromDate(fiveMinutesFromNow)),
      orderBy('scheduledFor', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(notifications);
    }, (error) => {
      console.error('Error in notification subscription:', error);
      callback([]);
    });
  });
}

