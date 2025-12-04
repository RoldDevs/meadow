import React from 'react';
import { Appbar, Text, Card, Avatar, IconButton, ProgressBar, Checkbox, Button, FAB, Chip } from "react-native-paper";
import { useTheme } from "react-native-paper";

const ViewTask = () => {

  return(
    <View style={styles.taskCard}>
        {/* headers */}
        <View style={styles.taskHeader}>
          <NativeText style={styles.taskTitle}>{item.title}</NativeText>
          <NativeText style={styles.taskDate}>{item.date}</NativeText>
        </View>
         {/* tags */}
        <View style={styles.taskTags}>
          <NativeText style={styles.taskTag}>{item.priority}</NativeText>
          <NativeText style={styles.taskTag}>{item.category || "No Category"}</NativeText>
        </View>
        <ProgressBar progress={calculateProgress(item.subtasks)} color="#007bff" style={styles.progressBar} />
        <TouchableOpacity style={styles.toggleSubtasksButton} onPress={() => toggleSubtaskVisibility(item.id)}>
          <NativeText style={styles.toggleSubtasksButtonText}>
            {item.subtasksVisible ? "Hide Subtasks" : "Show Subtasks"}
          </NativeText>
        </TouchableOpacity>
        {item.subtasksVisible && (
          <FlatList
            data={item.subtasks}
            renderItem={({ item: subtask, index }) => (
              <View style={styles.subtask}>
                <Checkbox status={subtask.completed ? "checked" : "unchecked"} onPress={() => toggleSubtaskCompletion(item.id, index)} />
                <NativeText style={[styles.subtaskText, subtask.completed && styles.subtaskTextCompleted]}>
                  {subtask.title}
                </NativeText>
              </View>
            )}
          />
        )}
      </View>
  );
};

export default ViewTask;