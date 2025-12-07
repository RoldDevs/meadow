import React, { useState, useEffect, useCallback } from "react";
import { BackHandler, StyleSheet, View, FlatList, Alert} from "react-native";
import { Text, Card, Avatar, IconButton, ProgressBar, Checkbox, Button, FAB, Chip, SegmentedButtons, Surface, Menu, ActivityIndicator } from "react-native-paper";
import { useTheme } from "react-native-paper";
import { getAllTasks, deleteTask, subscribeToTasks, updateTask } from "../firebase/services/tasksService";

//components
import TopAppBar from "../TopAppBar";
import TagChipList from "../components/TagChipList";

//dummy data
import dummy_tasks from "../../Data/tasks";
import {dummy_tags} from "../../Data/tasks"

const TaskScreen = ({ navigation }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const [selectModeEnabled, setSelectModeEnabled] = useState(false);
  const [selectedTasks, setSelectedTasks] = []; //this is for the select mode (like, for deleting tasks, and stuff)

  const rightButtons = (
    selectModeEnabled
    ? [
        {icon:"delete"},
        {icon:"close", action: () => disableSelectMode()}
      ]
    : [
        {icon:"magnify"},
        {icon:"dots-vertical", action: () => openOptions()}
      ]
  );

  // headerMenu (menu when the three-dots is pressed)
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const openOptions = () => setHeaderMenuVisible(true);
  const closeOptions = () => setHeaderMenuVisible(false); 

  //
  //TASKS
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load tasks from Firebase with real-time updates
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToTasks((firebaseTasks, error) => {
      if (error) {
        console.error('Error loading tasks:', error);
        setLoading(false);
        return;
      }
      // Sort by date (ascending - earliest first)
      const sortedTasks = [...firebaseTasks].sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA - dateB;
      });
      setTasks(sortedTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  //filters
  //changing this should change what task cards get displayed
  const [filters, setFilters] = useState({
    taskDisplayMode: "urgent",
    tag: [] //this is unused, for now...
  });

  // Tags State (for filtering tags)
  const [taskTags, setTaskTags] = useState(dummy_tags);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsVisible, setTagsVisible] = useState(false);
  

  //handler when the tag chips are selected
  const handleTagSelection = (tag) => {
    setSelectedTags((prevSelectedTags) => 
      prevSelectedTags.includes(tag)
        ? prevSelectedTags.filter((item) => item !== tag)
        : [...prevSelectedTags, tag]
    );
  };

  const clearAllTags = () => {
    setSelectedTags([]);
  }

  const toggleSubtaskCompletion = async (taskId, subtaskIndex) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedSubtasks = (task.subtasks || []).map((subtask, index) =>
        index === subtaskIndex
          ? { ...subtask, completed: !subtask.completed }
          : subtask
      );

      await updateTask(taskId, { subtasks: updatedSubtasks });
      // Real-time subscription will update the state automatically
    } catch (error) {
      console.error('Error updating subtask:', error);
      Alert.alert('Error', 'Failed to update subtask');
    }
  };

  //Filter tasks based on priority and category
  // * Tasks should be sorted by their due date by default
  const filteredTasks = tasks.filter((task) => {
    let isUrgent;
    if(filters.taskDisplayMode === "urgent"){
      isUrgent = true
    }
    else if(filters.taskDisplayMode === "not_urgent"){
      isUrgent = false;
    }

    const matchesPriority = (isUrgent === task.isUrgent && task.completed === false) || (filters.taskDisplayMode === "completed" && task.completed === true);
    // Handle tags - they can be strings or objects with label property
    const taskTagsArray = (task.tags || []).map(tag => typeof tag === 'string' ? tag : tag.label || tag);
    const selectedTagsArray = selectedTags.map(tag => typeof tag === 'string' ? tag : tag.label || tag);
    const matchesCategory = !selectedTagsArray.length || selectedTagsArray.every(tag => taskTagsArray.includes(tag));
    return matchesPriority && matchesCategory;
  });

  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formatDate = (date) => {
    if (!date) return 'No date';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateFormatter.format(dateObj);
  };

  const getSubtaskCompletedCount = (subtasks) => {
    return subtasks.reduce((count, task) => count + (task.completed ? 1 : 0), 0);
  };

  // Calculation for the progress bar renderer
  const calculateProgress = useCallback((subtasks) => {
    if (!subtasks || subtasks.length === 0) {
      return 0;
    }
    const completed = getSubtaskCompletedCount(subtasks);
    const progress = completed / subtasks.length;
    // Clamp between 0 and 1 to ensure valid progress value
    // Use Math.round to avoid floating point precision issues when converting to native
    const clampedProgress = Math.max(0, Math.min(1, progress));
    // Round to 6 decimal places to avoid precision loss during native conversion
    return Math.round(clampedProgress * 1000000) / 1000000;
  }, []);

  const enableSelectMode = (taskID) => {
    console.log("The id of the selected task is " + taskID);
    setSelectModeEnabled(true);
  };
  const disableSelectMode = () => {
    setSelectModeEnabled(false);
  }

  const deleteTasks = () => {

  }

  const DELETE_ALL_TASKS = async () => {
    try {
      // Delete all tasks
      const deletePromises = tasks.map(task => deleteTask(task.id));
      await Promise.all(deletePromises);
      setHeaderMenuVisible(false);
    } catch (error) {
      console.error('Error deleting tasks:', error);
      Alert.alert('Error', 'Failed to delete all tasks');
    }
  };

  //* BackHandler
  useEffect(() => {
    const backAction = () => {
      if(selectModeEnabled){
        setSelectModeEnabled(false);
        return true
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [selectModeEnabled]);

  //! Reusable Task Card component
  const RenderTaskCard = ({ item }) => {
    const subtasks = item.subtasks || [];
    const finishedTasks = getSubtaskCompletedCount(subtasks);
    const tasksLength = subtasks.length;
    return (
      <Card 
        onLongPress={() => !selectModeEnabled && enableSelectMode(item.id)}
      >
        <Card.Content style={styles.taskCard}>
          <Text variant="titleLarge">{item.title}</Text>
          <Text variant="bodyMedium">
            {
              formatDate(item.date)
            }
          </Text>
          { tasksLength > 0 && (
            <View style={styles.progressGroupContainer}>
              <ProgressBar
                progress={calculateProgress(subtasks)}
                style={styles.progressBar}
                fillStyle={{ borderRadius: 4 }}
              />
              <Text variant="labelMedium" style={{color: theme.colors.primary}}>
                { finishedTasks === tasksLength 
                  ? "All subtasks completed"
                  : `${finishedTasks}/${tasksLength} subtasks completed`
                }
              </Text>
            </View>
          )}
          <View style={styles.chipContainer}>
            {(item.tags || []).map((tag, index) => {
              const tagLabel = typeof tag === 'string' ? tag : tag.label || tag;
              const tagValue = typeof tag === 'string' ? tag : tag.id || tag;
              return (
                <Chip 
                  compact="true" 
                  key={index}
                  selected={selectedTags.includes(tagValue) || selectedTags.includes(tagLabel)}
                  onPress={() => handleTagSelection(tagValue)}
                  showSelectedCheck={false}
                >
                  {tagLabel}
                </Chip>
              );
            })}
          </View>
        </Card.Content>
      </Card>
    );
  };

  //! change the name >:( !!!!
  const selectedTagsDebug = () => {
    console.log('selected tags are: ' + selectedTags)
    console.log('datatype: ' + typeof(selectedTags))
    console.log(taskTags)
  };

  const printAllFirebaseData = () => {
    console.log('All tasks:', tasks);
  };

  // ! Main Renderer !
  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Tasks"
        rightButtons={rightButtons}
      />
      {(true && selectModeEnabled) && (
        <View style={{backgroundColor: theme.colors.errorContainer}}>
          <Text style={{color: theme.colors.onError,textAlign: "center",margin:3}}>
            Select mode enabled
          </Text>
        </View>
      )}
      <Menu
        visible={headerMenuVisible}
        onDismiss={closeOptions}
        anchor={{x: 1000, y: 80}}
        style={{alignItems:"right"}}
      >
        <Menu.Item onPress={() => {}} leadingIcon="tag" title="Manage Tags" />
        <Menu.Item onPress={() => {}} leadingIcon="help-circle-outline" title="How to use this?" />
        <Menu.Item onPress={DELETE_ALL_TASKS} leadingIcon="delete" title="DELETE ALL TASKS (NO CONFIRM)"/>
      </Menu>
      <View style={styles.container}>
        {/* DEBUGGING */}
        {false && (
          <Surface style={{backgroundColor: theme.colors.errorContainer, borderRadius: 8, padding: 8, gap:5}}>
            <Text variant="labelSmall">
              Debooging
            </Text>
            <Button mode="contained-tonal" onPress={selectedTagsDebug} style={{backgroundColor:theme.colors.error}} textColor={theme.colors.onError}>
              Print selected tags to console
            </Button>
            <Button mode="contained-tonal" onPress={printAllFirebaseData} style={{backgroundColor:theme.colors.error}} textColor={theme.colors.onError}>
              Print all Firebase data
            </Button>
          </Surface>
        )}

        {/*Tasks display selector*/}
        <SegmentedButtons
          value={filters.taskDisplayMode}
          //this looks sooo dumb but it's 4 in the am and my brain is not braining anymore 💀💀💀
          onValueChange={(value) => {
              setFilters(prevState => ({
                ...prevState,
                taskDisplayMode: value
              }))
            }}
          buttons={[
            {
              value: "urgent",
              label: "Urgent"
            },
            {
              value: "not_urgent",
              label: "Not Urgent"
            },
            {
              value: "completed",
              label: "Completed"
            }
          ]}
        />

        {/*Filter Chips*/}
        <TagChipList 
          tags={taskTags}
          selectedTags={selectedTags}
          mode="single"
          whenTagSelected={handleTagSelection}
          showTags={tagsVisible}
          setShowTags={setTagsVisible}
          clearAllTagsBehavior={clearAllTags}
        />
        
        {/* Task List */}
        {loading ? (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <ActivityIndicator size="large" />
            <Text style={{marginTop: 10}}>Loading tasks...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTasks}
            renderItem={RenderTaskCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.taskList}
            ListEmptyComponent={()=>(
              <Text style={styles.emptyTaskText}> You have no tasks yet. </Text>
            )}
          />
        )}

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate("Create")}
        />
      </View>
    </>
  );
};

const createStyles = (theme) => 
  StyleSheet.create({
    container: { 
      flex: 1, 
      padding: 16, 
      paddingTop: 0,
      paddingBottom: 0, 
      backgroundColor: theme.colors.background, 
      gap: 10 
    },
    taskList:{ 
      gap: 8,
      paddingLeft: 8,
      paddingRight: 8
    },
    progressGroupContainer:{
      marginVertical: 5,
      gap: 8
    },
    progressBar: { 
      borderRadius: 4 
    },
    fab:{
      position: 'absolute',
      margin: 16,
      right: 0,
      bottom: 0,
    },
    taskCard:{
      gap: 4
    },
    chipContainer:{
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 4,
      gap: 8
    },
    emptyTaskText:{
      textAlign:"center",
      fontSize: 18,
      marginTop: 4
    }
  });

export default TaskScreen;
