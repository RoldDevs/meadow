export const TagSchema = {
  name:"Tag",
  primaryKey: "id",
  properties:{
    id: "objectId",
    label: "string",
    color: "string"
  }
};

export const SubtaskSchema = {
  name: "Subtask",
  primaryKey: "id",
  properties:{
    id: "objectId",
    title: "string",
    completed: "bool",
    subtasks: "Subtask[]"
  }
};

export const TaskSchema = {
  name: "Task",
  primaryKey: "id",
  properties: {
    id: "objectId",
    title: "string",
    completed: "bool",
    isUrgent: "bool",
    date:"date",
    tags: "Tag[]",
    subtasks: "Subtask[]"
  },
};