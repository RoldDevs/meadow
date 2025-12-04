import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp,
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../config';

const ROUTINES_COLLECTION = 'routines';

/**
 * Get all routines
 */
export const getAllRoutines = async () => {
  try {
    const routinesRef = collection(db, ROUTINES_COLLECTION);
    const q = query(routinesRef, orderBy('name', 'asc'));
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
 * Get a single routine by ID
 */
export const getRoutineById = async (routineId) => {
  try {
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    const routineSnap = await getDoc(routineRef);
    
    if (routineSnap.exists()) {
      const data = routineSnap.data();
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
 * Create a new routine
 */
export const createRoutine = async (routineData) => {
  try {
    const routinesRef = collection(db, ROUTINES_COLLECTION);
    const newRoutine = {
      ...routineData,
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
 * Update an existing routine
 */
export const updateRoutine = async (routineId, routineData) => {
  try {
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    const updateData = {
      ...routineData,
      updatedAt: Timestamp.now(),
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
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
 * Delete a routine
 */
export const deleteRoutine = async (routineId) => {
  try {
    const routineRef = doc(db, ROUTINES_COLLECTION, routineId);
    await deleteDoc(routineRef);
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time routine updates
 */
export const subscribeToRoutines = (callback) => {
  const routinesRef = collection(db, ROUTINES_COLLECTION);
  const q = query(routinesRef, orderBy('name', 'asc'));
  
  return onSnapshot(q, (querySnapshot) => {
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
};

