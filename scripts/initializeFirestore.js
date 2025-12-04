/**
 * Firestore Initialization Script
 * 
 * This script initializes Firestore collections with sample data.
 * Run this in Node.js environment or use it as a reference for manual setup.
 * 
 * To run:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 * 3. Run: node scripts/initializeFirestore.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (requires service account)
// For client-side, use the Firebase JS SDK instead
if (admin.apps.length === 0) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    console.log('Note: This script requires Firebase Admin SDK.');
    console.log('For client-side initialization, use the Firebase JS SDK in your app.');
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Initialize Tags Collection
 */
async function initializeTags() {
  console.log('Initializing tags...');
  
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

  const batch = db.batch();
  const tagsRef = db.collection('tags');
  
  // Check if tags already exist
  const existingTags = await tagsRef.get();
  if (!existingTags.empty) {
    console.log('Tags already exist. Skipping tag initialization.');
    return;
  }

  defaultTags.forEach((tag, index) => {
    const tagRef = tagsRef.doc();
    batch.set(tagRef, {
      label: tag.label,
      color: tag.color,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`Initialized ${defaultTags.length} tags`);
}

/**
 * Initialize Sample Tasks
 */
async function initializeSampleTasks() {
  console.log('Initializing sample tasks...');
  
  const tasksRef = db.collection('tasks');
  const existingTasks = await tasksRef.get();
  
  if (!existingTasks.empty) {
    console.log('Tasks already exist. Skipping sample task initialization.');
    return;
  }

  const sampleTasks = [
    {
      title: "Welcome to Meadow!",
      completed: false,
      isUrgent: false,
      date: admin.firestore.Timestamp.fromDate(new Date()),
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      title: "Set up your routines",
      completed: false,
      isUrgent: true,
      date: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 86400000)), // Tomorrow
      tags: ["personal"],
      subtasks: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  ];

  const batch = db.batch();
  sampleTasks.forEach((task) => {
    const taskRef = tasksRef.doc();
    batch.set(taskRef, task);
  });

  await batch.commit();
  console.log(`Initialized ${sampleTasks.length} sample tasks`);
}

/**
 * Initialize Sample Routines
 */
async function initializeSampleRoutines() {
  console.log('Initializing sample routines...');
  
  const routinesRef = db.collection('routines');
  const existingRoutines = await routinesRef.get();
  
  if (!existingRoutines.empty) {
    console.log('Routines already exist. Skipping sample routine initialization.');
    return;
  }

  const sampleRoutines = [
    {
      name: "Morning Routine",
      startTime: "6:00 AM",
      endTime: "7:00 AM",
      days: ["Mon", "Wed", "Fri"],
      enabled: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      name: "Evening Reading",
      startTime: "8:00 PM",
      endTime: "9:00 PM",
      days: ["Tue", "Thu", "Sat"],
      enabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  ];

  const batch = db.batch();
  sampleRoutines.forEach((routine) => {
    const routineRef = routinesRef.doc();
    batch.set(routineRef, routine);
  });

  await batch.commit();
  console.log(`Initialized ${sampleRoutines.length} sample routines`);
}

/**
 * Initialize Sample Notes
 */
async function initializeSampleNotes() {
  console.log('Initializing sample notes...');
  
  const notesRef = db.collection('notes');
  const existingNotes = await notesRef.get();
  
  if (!existingNotes.empty) {
    console.log('Notes already exist. Skipping sample note initialization.');
    return;
  }

  const sampleNotes = [
    {
      title: "Welcome Note",
      content: "Welcome to Meadow! This is your first smart note. You can organize your thoughts, ideas, and important information here.",
      tag: ["personal"],
      archived: false,
      deleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    {
      title: "Getting Started",
      content: "Tips for using Meadow:\n• Create tasks with due dates\n• Set up routines for daily habits\n• Use tags to organize your content\n• Take smart notes for important information",
      tag: ["work", "personal"],
      archived: false,
      deleted: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  ];

  const batch = db.batch();
  sampleNotes.forEach((note) => {
    const noteRef = notesRef.doc();
    batch.set(noteRef, note);
  });

  await batch.commit();
  console.log(`Initialized ${sampleNotes.length} sample notes`);
}

/**
 * Main initialization function
 */
async function initializeFirestore() {
  try {
    console.log('Starting Firestore initialization...\n');
    
    await initializeTags();
    await initializeSampleTasks();
    await initializeSampleRoutines();
    await initializeSampleNotes();
    
    console.log('\nFirestore initialization complete!');
    console.log('\nCollections created:');
    console.log('  - tags');
    console.log('  - tasks');
    console.log('  - routines');
    console.log('  - notes');
    
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  initializeFirestore()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  initializeFirestore,
  initializeTags,
  initializeSampleTasks,
  initializeSampleRoutines,
  initializeSampleNotes,
};

