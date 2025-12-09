import React, { useState, useEffect, useCallback } from "react";
import { BackHandler, StyleSheet, View, FlatList, Alert} from "react-native";
import { Text, Card, Avatar, IconButton, ProgressBar, Checkbox, Button, FAB, Chip, SegmentedButtons, Surface, Menu, ActivityIndicator, Searchbar } from "react-native-paper";
import { useTheme } from "react-native-paper";
import { getAllTasks, deleteTask, subscribeToTasks, updateTask, getAllTags } from "../firebase/services/tasksService";

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
  const [selectedTasks, setSelectedTasks] = useState([]); //this is for the select mode (like, for deleting tasks, and stuff)

  const rightButtons = (
    selectModeEnabled
    ? [
        {icon:"delete", action: () => deleteSelectedTasks()},
        {icon:"close", action: () => disableSelectMode()}
      ]
    : [
        {icon:"magnify", action: () => setSearchVisible(true)},
        {icon:"dots-vertical", action: () => openOptions()}
      ]
  );

  // headerMenu (menu when the three-dots is pressed)
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const openOptions = () => setHeaderMenuVisible(true);
  const closeOptions = () => setHeaderMenuVisible(false);
  
  // Search state
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 

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

  // Load tags from Firebase
  useEffect(() => {
    const loadTags = async () => {
      try {
        const firebaseTags = await getAllTags();
        // Keep full tag objects with {id, label, color}
        setTaskTags(firebaseTags);
      } catch (error) {
        console.error('Error loading tags:', error);
        // Fallback to dummy tags on error
        setTaskTags(dummy_tags);
      }
    };
    loadTags();
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

      // Check if all subtasks are completed
      const allSubtasksCompleted = updatedSubtasks.length > 0 && 
        updatedSubtasks.every(subtask => subtask.completed);

      // Update task with new subtask status and completion status
      await updateTask(taskId, { 
        subtasks: updatedSubtasks,
        completed: allSubtasksCompleted
      });
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
    
    // Handle tags - support both string tags and object tags with {id, label, color}
    // Task tags can be stored as strings or objects
    const taskTagIds = (task.tags || []).map(tag => {
      if (typeof tag === 'string') return tag;
      return tag.id || tag.label || tag;
    });
    
    // Check if task matches selected tags
    const matchesCategory = !selectedTags.length || selectedTags.every(selectedTag => {
      // selectedTag can be an id or label
      return taskTagIds.includes(selectedTag);
    });
    
    // Search filter
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.subtasks || []).some(subtask => 
        subtask.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    return matchesPriority && matchesCategory && matchesSearch;
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
    setSelectedTasks([taskID]);
  };
  
  const disableSelectMode = () => {
    setSelectModeEnabled(false);
    setSelectedTasks([]);
  }

  const toggleTaskSelection = (taskID) => {
    setSelectedTasks(prev => 
      prev.includes(taskID)
        ? prev.filter(id => id !== taskID)
        : [...prev, taskID]
    );
  };

  const deleteSelectedTasks = async () => {
    if (selectedTasks.length === 0) {
      Alert.alert("Error", "No tasks selected");
      return;
    }

    Alert.alert(
      "Delete Tasks",
      `Are you sure you want to delete ${selectedTasks.length} task(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const deletePromises = selectedTasks.map(taskId => deleteTask(taskId));
              await Promise.all(deletePromises);
              disableSelectMode();
              Alert.alert("Success", `${selectedTasks.length} task(s) deleted successfully`);
            } catch (error) {
              console.error('Error deleting tasks:', error);
              Alert.alert('Error', 'Failed to delete tasks');
            }
          }
        }
      ]
    );
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
    const isSelected = selectedTasks.includes(item.id);
    
    return (
      <Card 
        onLongPress={() => !selectModeEnabled && enableSelectMode(item.id)}
        onPress={() => {
          if (selectModeEnabled) {
            toggleTaskSelection(item.id);
          } else {
            // Navigate to task details or edit screen
            navigation.navigate("Create", { task: item, isEdit: true });
          }
        }}
        style={[
          isSelected && selectModeEnabled && { 
            borderWidth: 2, 
            borderColor: theme.colors.primary 
          }
        ]}
      >
        <Card.Content style={styles.taskCard}>
          <View style={styles.taskHeader}>
            {selectModeEnabled ? (
              <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => toggleTaskSelection(item.id)}
              />
            ) : (
              <Checkbox
                status={item.completed ? 'checked' : 'unchecked'}
                onPress={async () => {
                  try {
                    await updateTask(item.id, { completed: !item.completed });
                  } catch (error) {
                    console.error('Error updating task completion:', error);
                    Alert.alert('Error', 'Failed to update task');
                  }
                }}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text variant="titleLarge" style={item.completed && { textDecorationLine: 'line-through', opacity: 0.6 }}>
                {item.title}
              </Text>
              <Text variant="bodyMedium">
                {formatDate(item.date)}
              </Text>
            </View>
          </View>
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
              // If tag is a string (ID), find the matching tag object from taskTags array
              let tagLabel, tagValue, tagColor;
              
              if (typeof tag === 'string') {
                // Tag is an ID, find the matching tag object
                const tagObj = taskTags.find(t => t.id === tag || t.label === tag);
                if (tagObj) {
                  tagLabel = tagObj.label;
                  tagValue = tagObj.id || tagObj.label;
                  tagColor = tagObj.color;
                } else {
                  // If not found, just display the string
                  tagLabel = tag;
                  tagValue = tag;
                  tagColor = undefined;
                }
              } else {
                // Tag is already an object
                tagLabel = tag.label || tag;
                tagValue = tag.id || tag;
                tagColor = tag.color;
              }
              
              return (
                <Chip 
                  compact="true" 
                  key={index}
                  selected={selectedTags.includes(tagValue) || selectedTags.includes(tagLabel)}
                  onPress={() => !selectModeEnabled && handleTagSelection(tagValue)}
                  showSelectedCheck={false}
                  style={tagColor ? { backgroundColor: tagColor } : undefined}
                  textStyle={tagColor ? { color: '#FFFFFF' } : undefined}
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
        <Menu.Item 
          onPress={() => {
            closeOptions();
            navigation.navigate("Tags");
          }} 
          leadingIcon="tag" 
          title="Manage Tags" 
        />
        <Menu.Item onPress={() => {}} leadingIcon="help-circle-outline" title="How to use this?" />
        <Menu.Item onPress={DELETE_ALL_TASKS} leadingIcon="delete" title="DELETE ALL TASKS (NO CONFIRM)"/>
      </Menu>
      <View style={styles.container}>
        {/* Search Bar */}
        {searchVisible && (
          <Searchbar
            placeholder="Search tasks..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            onIconPress={() => {
              setSearchVisible(false);
              setSearchQuery('');
            }}
            onClearIconPress={() => setSearchQuery('')}
            style={styles.searchBar}
          />
        )}

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
          onCreateTag={() => navigation.navigate("Tags")}
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
      paddingTop: 8,
      paddingBottom: 0, 
      backgroundColor: theme.colors.background, 
      gap: 12 
    },
    searchBar: {
      marginBottom: 8,
    },
    taskList:{ 
      gap: 8,
      paddingLeft: 8,
      paddingRight: 8,
      paddingBottom: 80,
    },
    progressGroupContainer:{
      marginVertical: 8,
      gap: 8,
      marginBottom: 12
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
      gap: 8
    },
    taskHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8
    },
    chipContainer:{
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 8,
      gap: 8
    },
    emptyTaskText:{
      textAlign:"center",
      fontSize: 18,
      marginTop: 4
    },
    searchBar: {
      marginBottom: 8
    }
  });

export default TaskScreen;
