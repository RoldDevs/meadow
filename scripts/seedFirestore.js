/**
 * Firestore Seeding Script (Client-Side)
 * 
 * This script can be run in your React Native app to seed initial data.
 * It uses the Firebase JS SDK (not Admin SDK).
 * 
 * Usage: Import and call seedFirestore() from your app initialization
 */

import { 
  collection, 
  addDoc, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../src/firebase/config';

/**
 * Seed default tags
 */
export const seedTags = async () => {
  try {
    const tagsRef = collection(db, 'tags');
    const existingTags = await getDocs(tagsRef);
    
    if (!existingTags.empty) {
      console.log('Tags already exist. Skipping tag seeding.');
      return;
    }

    const defaultTags = [
      { label: "ITPE6", color: "#FF6B6B" },
      { label: "CHED Completion", color: "#4ECDC4" },
      { label: "Completion", color: "#45B7D1" },
      { label: "Graduation", color: "#FFA07A" },
      { label: "Year 3", color: "#98D8C8" },
      { label: "App Testing", color: "#F7DC6F" },
      { label: "programming", color: "#BB8FCE" },
      { label: "projects", color: "#85C1E2" },
      { label: "school", color: "#F8B739" },
      { label: "work", color: "#52BE80" },
      { label: "personal", color: "#EC7063" },
    ];

    for (const tag of defaultTags) {
      await addDoc(tagsRef, {
        ...tag,
        createdAt: Timestamp.now(),
      });
    }

    console.log(`Seeded ${defaultTags.length} tags`);
  } catch (error) {
    console.error('Error seeding tags:', error);
    throw error;
  }
};

/**
 * Seed sample tasks
 */
export const seedTasks = async () => {
  try {
    const tasksRef = collection(db, 'tasks');
    const existingTasks = await getDocs(tasksRef);
    
    if (!existingTasks.empty) {
      console.log('Tasks already exist. Skipping task seeding.');
      return;
    }

    const sampleTasks = [
      {
        title: "Welcome to Meadow!",
        completed: false,
        isUrgent: false,
        date: Timestamp.now(),
        tags: ["work", "personal"],
        subtasks: [
          {
            id: "subtask-1",
            title: "Explore the app",
            completed: false,
            subtasks: []
          },
          {
            id: "subtask-2",
            title: "Create your first task",
            completed: false,
            subtasks: []
          }
        ],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        title: "Set up your routines",
        completed: false,
        isUrgent: true,
        date: Timestamp.fromDate(new Date(Date.now() + 86400000)), // Tomorrow
        tags: ["personal"],
        subtasks: [],
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    ];

    for (const task of sampleTasks) {
      await addDoc(tasksRef, task);
    }

    console.log(`Seeded ${sampleTasks.length} sample tasks`);
  } catch (error) {
    console.error('Error seeding tasks:', error);
    throw error;
  }
};

/**
 * Seed sample routines
 */
export const seedRoutines = async () => {
  try {
    const routinesRef = collection(db, 'routines');
    const existingRoutines = await getDocs(routinesRef);
    
    if (!existingRoutines.empty) {
      console.log('Routines already exist. Skipping routine seeding.');
      return;
    }

    const sampleRoutines = [
      {
        name: "Morning Routine",
        startTime: "6:00 AM",
        endTime: "7:00 AM",
        days: ["Mon", "Wed", "Fri"],
        enabled: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        name: "Evening Reading",
        startTime: "8:00 PM",
        endTime: "9:00 PM",
        days: ["Tue", "Thu", "Sat"],
        enabled: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    ];

    for (const routine of sampleRoutines) {
      await addDoc(routinesRef, routine);
    }

    console.log(`Seeded ${sampleRoutines.length} sample routines`);
  } catch (error) {
    console.error('Error seeding routines:', error);
    throw error;
  }
};

/**
 * Seed sample notes
 */
export const seedNotes = async () => {
  try {
    const notesRef = collection(db, 'notes');
    const existingNotes = await getDocs(notesRef);
    
    if (!existingNotes.empty) {
      console.log('Notes already exist. Skipping note seeding.');
      return;
    }

    const sampleNotes = [
      {
        title: "Welcome Note",
        content: "Welcome to Meadow! This is your first smart note. You can organize your thoughts, ideas, and important information here.",
        tag: ["personal"],
        archived: false,
        deleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      },
      {
        title: "Getting Started",
        content: "Tips for using Meadow:\n• Create tasks with due dates\n• Set up routines for daily habits\n• Use tags to organize your content\n• Take smart notes for important information",
        tag: ["work", "personal"],
        archived: false,
        deleted: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }
    ];

    for (const note of sampleNotes) {
      await addDoc(notesRef, note);
    }

    console.log(`Seeded ${sampleNotes.length} sample notes`);
  } catch (error) {
    console.error('Error seeding notes:', error);
    throw error;
  }
};

/**
 * Seed all collections
 */
export const seedFirestore = async () => {
  try {
    console.log('Starting Firestore seeding...\n');
    
    await seedTags();
    await seedTasks();
    await seedRoutines();
    await seedNotes();
    
    console.log('\nFirestore seeding complete!');
  } catch (error) {
    console.error('Error seeding Firestore:', error);
    throw error;
  }
};

export default seedFirestore;

