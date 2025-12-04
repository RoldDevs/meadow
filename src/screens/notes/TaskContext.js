import React, { createContext, useState, useContext } from 'react';
import initialTaskData from '../../Data/notes';  // 👈 this is correct for your structure

const TaskContext = createContext();

export const useTasks = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const [taskData, setTaskData] = useState(initialTaskData);

  const addNote = (noteText, noteDay) => {
    const newTask = {
      title: 'Custom Note',
      category: 'Note',
      requirements: [],
      subTasks: [{ title: noteText, status: 'note', day: noteDay }],
    };
    setTaskData(prev => [...prev, newTask]);
  };

  return (
    <TaskContext.Provider value={{ taskData, addNote }}>
      {children}
    </TaskContext.Provider>
  );
};
