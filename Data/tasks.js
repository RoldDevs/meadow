//ofc we will implement a more robust way to reference these tasks
export const dummy_tags = [
  "ITPE6", "CHED Completion", "Completion", 
  "Graduation", "Year 3", "App Testing",
  "stuff", "💻programming", "auq naaaaaa 💀💀💀", "projects", "school",
  "cleanupday", "reset", "energycheck", "mentalnote",
  "windowtime", "🍔foodbreak", "brainfog", "distracted",
  "sidequest", "grind", "newgame", "modding", "🌿cozygame",
  "storymode", "🎮multiplayer", "settings-tweak",
  "grass-touching"
];

export default dummy_tasks = [
  {
    id: 1,
    completed: false,
    isUrgent: true,
    tags: [dummy_tags[0],dummy_tags[1],dummy_tags[2]],
    title: "IOT Prototype and Module Completion",
    date: "2024-11-25T00:00:00+08:00",
    subtasks: [
      { id: 1, completed: true, title: "Test The Prototype", 
        subtasks:[
          { id:1, completed: true, title:"Verify Power and Connectivity", subtasks:[] },
          { id:2, completed: true, title:"Check Sensor Functionality", subtasks:[] },
          { id:3, completed: true, title:"Validate Data Transmission", subtasks:[] },
          { id:4, completed: true, title:"Test Response to Inputs", subtasks:[] },
          { id:5, completed: true, title:"Assess Power Consumption", subtasks:[] },
          { id:6, completed: true, title:"Ensure Module Integration", subtasks:[] },
        ]
      },
      { id: 2, completed: true, title: "Schedule Completion Appointment", subtasks: []},
      { id: 3, completed: false, title: "Finish Module 6 Exercise", subtasks: [] },
      { id: 4, completed: false, title: "Finish Module 7", subtasks: [] },
    ]
  },
  {
    id: 2,
    completed: false,
    isUrgent: true,
    tags:[dummy_tags[4],dummy_tags[2]],
    title: "Finish meadow",
    date: "2025-04-15T00:00:00+08:00",
    subtasks: [
      { id: 1, completed: true, title: "Test The Prototype", subtasks: [] },
      { id: 2, completed: false, title: "Schedule Completion Appointment", subtasks: [] },
      { id: 3, completed: false, title: "Finish Module 6 Exercise", subtasks: [] },
      { id: 4, completed: false, title: "Finish Module 7", subtasks: [] },
    ]
  },
  {
    id: 3,
    completed: false,
    isUrgent: false,
    tags: [dummy_tags[5]],
    title: "Task with no sub tasks",
    date: "2077-04-14T00:00:00+08:00",
    subtasks: []
  },
  {
    id: 4,
    completed: false,
    isUrgent: false,
    tags: [],
    title: "Task with no sub tasks AND no tags",
    date: "2077-04-15T00:00:00+08:00",
    subtasks: []
  },
  {
    id: 5,
    completed: false,
    isUrgent: true,
    tags: [dummy_tags[19],dummy_tags[20],dummy_tags[17],dummy_tags[12],dummy_tags[5]],
    title: "Urgent task with tags but no sub tasks",
    date: "2025-12-25T00:00:00+08:00",
    subtasks: []
  },
  {
    id: 6,
    completed: true,
    isUrgent: false,
    tags: [dummy_tags[27],],
    title: "Task that is already completed",
    date: "2025-12-25T00:00:00+08:00",
    subtasks: []
  },
  {
    id: 7,
    completed: false,
    isUrgent: false,
    tags: [dummy_tags[3],dummy_tags[5],dummy_tags[7]],
    title: "Not urgent task with subtasks",
    date: "2025-05-10T00:00:00+08:00",
    subtasks: [
      { id: 1, completed: false, title: "this first", subtasks: [] },
      { id: 2, completed: false, title: "then this", subtasks: [] },
      { id: 3, completed: false, title: "finally this", subtasks: [] },
    ]
  },
  {
    id: 9,
    completed: false,
    isUrgent: true,
    tags: [dummy_tags[5],dummy_tags[8]],
    title: "Urgent task that is last on the data list but should be sorted first according to its date",
    date: "2024-01-03T00:00:00+08:00",
    subtasks:[]
  },
  {
    id: 8,
    completed: false,
    isUrgent: true,
    tags: [dummy_tags[5],dummy_tags[8]],
    title: "Tasks where all subtasks are already completed",
    date: "2025-02-13T00:00:00+08:00",
    subtasks:[
      { id: 1, completed: true, title: "subtask1", subtasks: []},
      { id: 2, completed: true, title: "subtask2", subtasks: []},
      { id: 3, completed: true, title: "subtask3", subtasks: []},
      { id: 4, completed: true, title: "subtask4", subtasks: []},
      { id: 5, completed: true, title: "subtask5", subtasks: []},
    ]
  }
]

export const dummy_generated_tasks = [
  { id: 1, completed: true, title: "Test The Prototype", subtasks:[]},
  { id: 2, completed: true, title: "Schedule Completion Appointment", subtasks: []},
  { id: 3, completed: false, title: "Finish Module 6 Exercise", subtasks: [] },
  { id: 4, completed: false, title: "Finish Module 7", subtasks: [] },
  { id: 5, completed: false, title: "Finish Module 7", subtasks: [] },
  { id: 6, completed: false, title: "Finish Module 7", subtasks: [] },
]