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

const NOTES_COLLECTION = 'notes';

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
 * Get all notes
 */
export const getAllNotes = async (includeArchived = false, includeDeleted = false) => {
  try {
    const notesRef = collection(db, NOTES_COLLECTION);
    let q = query(notesRef, orderBy('createdAt', 'desc'));
    
    // Filter out archived and deleted notes if needed
    if (!includeArchived) {
      q = query(q, where('archived', '==', false));
    }
    if (!includeDeleted) {
      q = query(q, where('deleted', '==', false));
    }
    
    const querySnapshot = await getDocs(q);
    
    const notes = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notes.push({
        id: doc.id,
        ...data,
        date: convertTimestamp(data.date || data.createdAt),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    
    return notes;
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
};

/**
 * Get a single note by ID
 */
export const getNoteById = async (noteId) => {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const noteSnap = await getDoc(noteRef);
    
    if (noteSnap.exists()) {
      const data = noteSnap.data();
      return {
        id: noteSnap.id,
        ...data,
        date: convertTimestamp(data.date || data.createdAt),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      };
    } else {
      throw new Error('Note not found');
    }
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
};

/**
 * Create a new note
 */
export const createNote = async (noteData) => {
  try {
    const notesRef = collection(db, NOTES_COLLECTION);
    const newNote = {
      title: noteData.title || '',
      content: noteData.content || '',
      tag: noteData.tag || [],
      archived: noteData.archived || false,
      deleted: noteData.deleted || false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await addDoc(notesRef, newNote);
    return docRef.id;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

/**
 * Update an existing note
 */
export const updateNote = async (noteId, noteData) => {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const updateData = {
      ...noteData,
      updatedAt: Timestamp.now(),
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    await updateDoc(noteRef, updateData);
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

/**
 * Delete a note (soft delete by setting deleted flag)
 */
export const deleteNote = async (noteId, hardDelete = false) => {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    
    if (hardDelete) {
      // Permanently delete
      await deleteDoc(noteRef);
    } else {
      // Soft delete
      await updateDoc(noteRef, {
        deleted: true,
        updatedAt: Timestamp.now(),
      });
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

/**
 * Archive a note
 */
export const archiveNote = async (noteId, archived = true) => {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    await updateDoc(noteRef, {
      archived,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error archiving note:', error);
    throw error;
  }
};

/**
 * Subscribe to real-time note updates
 */
export const subscribeToNotes = (callback, includeArchived = false, includeDeleted = false) => {
  const notesRef = collection(db, NOTES_COLLECTION);
  let q = query(notesRef, orderBy('createdAt', 'desc'));
  
  if (!includeArchived) {
    q = query(q, where('archived', '==', false));
  }
  if (!includeDeleted) {
    q = query(q, where('deleted', '==', false));
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const notes = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      notes.push({
        id: doc.id,
        ...data,
        date: convertTimestamp(data.date || data.createdAt),
        createdAt: convertTimestamp(data.createdAt),
        updatedAt: convertTimestamp(data.updatedAt),
      });
    });
    callback(notes);
  }, (error) => {
    console.error('Error in notes subscription:', error);
    callback([], error);
  });
};

