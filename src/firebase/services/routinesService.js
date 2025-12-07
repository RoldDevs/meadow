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

const ROUTINES_COLLECTION = 'routines';

/**
 * Get all routines for the current device
 */
export const getAllRoutines = async () => {
  try {
    const deviceId = await getDeviceId();
    const routinesRef = collection(db, ROUTINES_COLLECTION);
    const q = query(
      routinesRef,
      where('deviceId', '==', deviceId),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    const routines = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      routines.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      });
    });
    
    return routines;
  } catch (error) {
    console.error('Error getting routines:', error);
    throw error;
  }
};

/**
 * Get a single routine by ID (only if it belongs to current device)
 */
export const getRoutineById = async (routineId) => {
  try {
    const deviceId = await getDeviceId();
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    const routineSnap = await getDoc(routineRef);
    
    if (routineSnap.exists()) {
      const data = routineSnap.data();
      // Verify the routine belongs to this device
      if (data.deviceId !== deviceId) {
        throw new Error('Routine not found or access denied');
      }
      return {
        id: routineSnap.id,
        ...data,
        createdAt: data.createdAt ? data.createdAt.toDate() : null,
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
      };
    } else {
      throw new Error('Routine not found');
    }
  } catch (error) {
    console.error('Error getting routine:', error);
    throw error;
  }
};

/**
 * Create a new routine (automatically adds deviceId)
 */
export const createRoutine = async (routineData) => {
  try {
    const deviceId = await getDeviceId();
    const routinesRef = collection(db, ROUTINES_COLLECTION);
    const newRoutine = {
      ...routineData,
      deviceId, // Add device ID to isolate data
      enabled: routineData.enabled !== undefined ? routineData.enabled : true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(routinesRef, newRoutine);
    return docRef.id;
  } catch (error) {
    console.error('Error creating routine:', error);
    throw error;
  }
};

/**
 * Update an existing routine (only if it belongs to current device)
 */
export const updateRoutine = async (routineId, routineData) => {
  try {
    const deviceId = await getDeviceId();
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    
    // Verify the routine belongs to this device
    const routineSnap = await getDoc(routineRef);
    if (!routineSnap.exists()) {
      throw new Error('Routine not found');
    }
    const existingData = routineSnap.data();
    if (existingData.deviceId !== deviceId) {
      throw new Error('Access denied: Routine does not belong to this device');
    }
    
    const updateData = {
      ...routineData,
      updatedAt: Timestamp.now(),
    };
    
    // Remove undefined fields and deviceId (should not be changed)
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined || key === 'deviceId') {
        delete updateData[key];
      }
    });
    
    await updateDoc(routineRef, updateData);
  } catch (error) {
    console.error('Error updating routine:', error);
    throw error;
  }
};

/**
 * Delete a routine (only if it belongs to current device)
 */
export const deleteRoutine = async (routineId) => {
  try {
    const deviceId = await getDeviceId();
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    
    // Verify the routine belongs to this device
    const routineSnap = await getDoc(routineRef);
    if (!routineSnap.exists()) {
      throw new Error('Routine not found');
    }
    const existingData = routineSnap.data();
    if (existingData.deviceId !== deviceId) {
      throw new Error('Access denied: Routine does not belong to this device');
    }
    
    await deleteDoc(routineRef);
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time routine updates (only for current device)
 */
export const subscribeToRoutines = (callback) => {
  let unsubscribe = null;
  
  // Get device ID and set up subscription
  getDeviceId().then((deviceId) => {
    const routinesRef = collection(db, ROUTINES_COLLECTION);
    const q = query(
      routinesRef,
      where('deviceId', '==', deviceId),
      orderBy('name', 'asc')
    );
    
    unsubscribe = onSnapshot(q, (querySnapshot) => {
      const routines = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        routines.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? data.createdAt.toDate() : null,
          updatedAt: data.updatedAt ? data.updatedAt.toDate() : null,
        });
      });
      callback(routines);
    }, (error) => {
      console.error('Error in routines subscription:', error);
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

