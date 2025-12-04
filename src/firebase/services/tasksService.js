import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config';
import { getDeviceId } from '../../services/deviceService';

const TASKS_COLLECTION = 'tasks';
const TAGS_COLLECTION = 'tags';

/**
 * Convert Firestore timestamp to JavaScript Date
 */
const convertTimestamp = (timestamp) => {
  if (timestamp && timestamp.toDate) {
    return timestamp.toDate();
  }
  return timestamp;
};

/**
 * Convert JavaScript Date to Firestore timestamp
 */
const convertToTimestamp = (date) => {
  if (date instanceof Date) {
    return Timestamp.fromDate(date);
  }
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date));
  }
  return date;
};

/**
 * Get all tasks for the current device
 */
export const getAllTasks = async () => {
  try {
    const deviceId = await getDeviceId();
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(
      tasksRef, 
      where('deviceId', '==', deviceId),
      orderBy('date', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const tasks = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      tasks.push({
        id: doc.id,
        ...data,
        date: convertTimestamp(data.date),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    
    return tasks;
  } catch (error) {
    console.error('Error getting tasks:', error);
    throw error;
  }
};

/**
 * Get a single task by ID (only if it belongs to current device)
 */
export const getTaskById = async (taskId) => {
  try {
    const deviceId = await getDeviceId();
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskSnap = await getDoc(taskRef);
    
    if (taskSnap.exists()) {
      const data = taskSnap.data();
      // Verify the task belongs to this device
      if (data.deviceId !== deviceId) {
        throw new Error('Task not found or access denied');
      }
      return {
        id: taskSnap.id,
        ...data,
        date: convertTimestamp(data.date),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      };
    } else {
      throw new Error('Task not found');
    }
  } catch (error) {
    console.error('Error getting task:', error);
    throw error;
  }
};

/**
 * Create a new task (automatically adds deviceId)
 */
export const createTask = async (taskData) => {
  try {
    const deviceId = await getDeviceId();
    const tasksRef = collection(db, TASKS_COLLECTION);
    const newTask = {
      ...taskData,
      deviceId, // Add device ID to isolate data
      date: convertToTimestamp(taskData.date),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(tasksRef, newTask);
    return docRef.id;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

/**
 * Update an existing task (only if it belongs to current device)
 */
export const updateTask = async (taskId, taskData) => {
  try {
    const deviceId = await getDeviceId();
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    
    // Verify the task belongs to this device before updating
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) {
      throw new Error('Task not found');
    }
    const existingData = taskSnap.data();
    if (existingData.deviceId !== deviceId) {
      throw new Error('Access denied: Task does not belong to this device');
    }
    
    const updateData = {
      ...taskData,
      date: taskData.date ? convertToTimestamp(taskData.date) : undefined,
      updatedAt: Timestamp.now(),
    };
    
    // Remove undefined fields and deviceId (should not be changed)
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || key === 'deviceId') {
        delete updateData[key];
      }
    });
    
    await updateDoc(taskRef, updateData);
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

/**
 * Delete a task (only if it belongs to current device)
 */
export const deleteTask = async (taskId) => {
  try {
    const deviceId = await getDeviceId();
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    
    // Verify the task belongs to this device before deleting
    const taskSnap = await getDoc(taskRef);
    if (!taskSnap.exists()) {
      throw new Error('Task not found');
    }
    const existingData = taskSnap.data();
    if (existingData.deviceId !== deviceId) {
      throw new Error('Access denied: Task does not belong to this device');
    }
    
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time task updates (only for current device)
 */
export const subscribeToTasks = (callback) => {
  let unsubscribe = null;
  
  // Get device ID and set up subscription
  getDeviceId().then((deviceId) => {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(
      tasksRef,
      where('deviceId', '==', deviceId),
      orderBy('date', 'asc')
    );
    
    unsubscribe = onSnapshot(q, (querySnapshot) => {
      const tasks = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tasks.push({
          id: doc.id,
          ...data,
          date: convertTimestamp(data.date),
          createdAt: convertTimestamp(data.createdAt),
          updatedAt: convertTimestamp(data.updatedAt),
        });
      });
      callback(tasks);
    }, (error) => {
      console.error('Error in tasks subscription:', error);
      callback([], error);
    });
  }).catch((error) => {
    console.error('Error getting device ID for subscription:', error);
    callback([], error);
  });
  
  // Return a cleanup function
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

/**
 * Get all tags for the current device
 */
export const getAllTags = async () => {
  try {
    const deviceId = await getDeviceId();
    const tagsRef = collection(db, TAGS_COLLECTION);
    const q = query(tagsRef, where('deviceId', '==', deviceId));
    const querySnapshot = await getDocs(q);
    
    const tags = [];
    querySnapshot.forEach((doc) => {
      tags.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    
    return tags;
  } catch (error) {
    console.error('Error getting tags:', error);
    throw error;
  }
};

/**
 * Create a new tag (automatically adds deviceId)
 */
export const createTag = async (tagData) => {
  try {
    const deviceId = await getDeviceId();
    const tagsRef = collection(db, TAGS_COLLECTION);
    const docRef = await addDoc(tagsRef, {
      ...tagData,
      deviceId, // Add device ID to isolate data
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
};

/**
 * Update a tag (only if it belongs to current device)
 */
export const updateTag = async (tagId, tagData) => {
  try {
    const deviceId = await getDeviceId();
    const tagRef = doc(db, TAGS_COLLECTION, tagId);
    
    // Verify the tag belongs to this device
    const tagSnap = await getDoc(tagRef);
    if (!tagSnap.exists()) {
      throw new Error('Tag not found');
    }
    const existingData = tagSnap.data();
    if (existingData.deviceId !== deviceId) {
      throw new Error('Access denied: Tag does not belong to this device');
    }
    
    const updateData = {
      ...tagData,
      updatedAt: Timestamp.now(),
    };
    
    // Remove deviceId (should not be changed)
    delete updateData.deviceId;
    
    await updateDoc(tagRef, updateData);
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
};

/**
 * Delete a tag (only if it belongs to current device)
 */
export const deleteTag = async (tagId) => {
  try {
    const deviceId = await getDeviceId();
    const tagRef = doc(db, TAGS_COLLECTION, tagId);
    
    // Verify the tag belongs to this device
    const tagSnap = await getDoc(tagRef);
    if (!tagSnap.exists()) {
      throw new Error('Tag not found');
    }
    const existingData = tagSnap.data();
    if (existingData.deviceId !== deviceId) {
      throw new Error('Access denied: Tag does not belong to this device');
    }
    
    await deleteDoc(tagRef);
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

