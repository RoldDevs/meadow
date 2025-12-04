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
 * Get all tasks
 */
export const getAllTasks = async () => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const q = query(tasksRef, orderBy('date', 'asc'));
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
 * Get a single task by ID
 */
export const getTaskById = async (taskId) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const taskSnap = await getDoc(taskRef);
    
    if (taskSnap.exists()) {
      const data = taskSnap.data();
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
 * Create a new task
 */
export const createTask = async (taskData) => {
  try {
    const tasksRef = collection(db, TASKS_COLLECTION);
    const newTask = {
      ...taskData,
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
 * Update an existing task
 */
export const updateTask = async (taskId, taskData) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    const updateData = {
      ...taskData,
      date: taskData.date ? convertToTimestamp(taskData.date) : undefined,
      updatedAt: Timestamp.now(),
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
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
 * Delete a task
 */
export const deleteTask = async (taskId) => {
  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time task updates
 */
export const subscribeToTasks = (callback) => {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const q = query(tasksRef, orderBy('date', 'asc'));
  
  return onSnapshot(q, (querySnapshot) => {
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
};

/**
 * Get all tags
 */
export const getAllTags = async () => {
  try {
    const tagsRef = collection(db, TAGS_COLLECTION);
    const querySnapshot = await getDocs(tagsRef);
    
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
 * Create a new tag
 */
export const createTag = async (tagData) => {
  try {
    const tagsRef = collection(db, TAGS_COLLECTION);
    const docRef = await addDoc(tagsRef, {
      ...tagData,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
};

/**
 * Update a tag
 */
export const updateTag = async (tagId, tagData) => {
  try {
    const tagRef = doc(db, TAGS_COLLECTION, tagId);
    await updateDoc(tagRef, {
      ...tagData,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    throw error;
  }
};

/**
 * Delete a tag
 */
export const deleteTag = async (tagId) => {
  try {
    const tagRef = doc(db, TAGS_COLLECTION, tagId);
    await deleteDoc(tagRef);
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw error;
  }
};

