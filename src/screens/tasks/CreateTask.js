import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList, Alert, BackHandler, ScrollView, Pressable } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Appbar, useTheme, TextInput, Text, Switch, SegmentedButtons, Button, Surface, Chip, ActivityIndicator, Portal, Dialog, Checkbox, IconButton } from "react-native-paper";
import { DatePickerInput} from "react-native-paper-dates";
import { createTask, updateTask, getAllTags } from '../../firebase/services/tasksService';
import { generateSubtasks, generateNestedSubtasks } from '../../services/openRouterService';

import TagChipList from "../../components/TagChipList";
import TopAppBar from "../../TopAppBar";

import { dummy_tags } from "../../../Data/tasks"

const CreateScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const { task, isEdit } = route.params || {};
  const [saving, setSaving] = useState(false);

  //inputs state
  const [fields, setFields] = useState({
    taskTitle: '',
    dueDate: new Date(),
    isUrgent: true,
    selectedTags: [],
    generatedSubtasks: [],
  });

  // Load task data if editing
  useEffect(() => {
    if (isEdit && task) {
      setFields({
        taskTitle: task.title || '',
        dueDate: task.date instanceof Date ? task.date : new Date(task.date),
        isUrgent: task.isUrgent || false,
        selectedTags: task.tags || [],
        generatedSubtasks: task.subtasks || [],
      });
      if (task.subtasks && task.subtasks.length > 0) {
        setSubtasksVisible(true);
      }
    }
  }, [isEdit, task]);

  // Load tags from Firebase
  useEffect(() => {
    const loadTags = async () => {
      try {
        const firebaseTags = await getAllTags();
        // Keep full tag objects with {id, label, color}
        setTags(firebaseTags);
        // Set most used tags to first 6
        setMostUsedTags(firebaseTags.slice(0, 6));
      } catch (error) {
        console.error('Error loading tags:', error);
        // Fallback to dummy tags
        setTags(dummy_tags);
        setMostUsedTags([dummy_tags[0],dummy_tags[1],dummy_tags[2],dummy_tags[3],dummy_tags[4],dummy_tags[5]]);
      }
    };
    loadTags();
  }, []);

  const handleFieldChange = (field, value) => {
    setFields(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  //handler when the tag chips are selected
  const handleTagSelection = (tag) => {
    const newTags = fields.selectedTags.includes(tag)
      ? fields.selectedTags.filter((item) => item !== tag)
      : [...fields.selectedTags, tag];

    handleFieldChange("selectedTags", newTags);
  };

  //tag details
  const [taskTags, setTags] = useState(dummy_tags);
  const [mostUsedTags, setMostUsedTags] = useState([dummy_tags[0],dummy_tags[1],dummy_tags[2],dummy_tags[3],dummy_tags[4],dummy_tags[5]]); //TODO: Create a separate object for most used tags in storage
  const [tagsVisible, setTagsVisible] = useState(false); //TODO: make it so that this stays to whatever it is set to when the user last used it (save in preferences)
  // const [selectedTags, setSelectedTags] = useState([]);

  //states for subtask rendering
  const [subtasksVisible, setSubtasksVisible] = useState(false);
  const [subtasksLoading, setSubtasksLoading] = useState(false);
  const [generatingNestedFor, setGeneratingNestedFor] = useState(null);
  
  // Manual subtask input states
  const [manualSubtaskDialogVisible, setManualSubtaskDialogVisible] = useState(false);
  const [manualSubtaskInput, setManualSubtaskInput] = useState('');
  
  // Subtask selection mode states
  const [subtaskSelectMode, setSubtaskSelectMode] = useState(false);
  const [selectedSubtasks, setSelectedSubtasks] = useState([]);
  const [selectedNestedSubtasks, setSelectedNestedSubtasks] = useState({}); // {parentIndex: [nestedIndex1, nestedIndex2]}
  
  // Nested subtask manual input states
  const [nestedSubtaskDialogVisible, setNestedSubtaskDialogVisible] = useState(false);
  const [nestedSubtaskInput, setNestedSubtaskInput] = useState('');
  const [currentParentIndex, setCurrentParentIndex] = useState(null);

  const doSubtaskGeneration = async () => {
    if (!fields.taskTitle.trim()) {
      invalidInputDialog("Please enter a task title first");
      return;
    }

    setSubtasksVisible(true);
    setSubtasksLoading(true);

    try {
      const newSubtasks = await generateSubtasks(fields.taskTitle, fields.generatedSubtasks);
      // Append new subtasks to existing ones instead of replacing
      const updatedSubtasks = [...fields.generatedSubtasks, ...newSubtasks];
      handleFieldChange("generatedSubtasks", updatedSubtasks);
    } catch (error) {
      console.error("Error generating subtasks:", error);
      invalidInputDialog("Failed to generate subtasks. Please try again.");
      if (fields.generatedSubtasks.length === 0) {
        setSubtasksVisible(false);
      }
    } finally {
      setSubtasksLoading(false);
    }
  };

  const cancelSubtaskGeneration = () => {
    setSubtasksVisible(false);
    setSubtasksLoading(false);
  };

  // Add manual subtask
  const handleAddManualSubtask = () => {
    if (!manualSubtaskInput.trim()) {
      return;
    }

    const newSubtask = {
      id: `subtask-${Date.now()}`,
      title: manualSubtaskInput.trim(),
      completed: false,
      subtasks: [],
    };

    const updatedSubtasks = [...fields.generatedSubtasks, newSubtask];
    handleFieldChange("generatedSubtasks", updatedSubtasks);
    
    setManualSubtaskInput('');
    setManualSubtaskDialogVisible(false);
    
    // Show subtasks if not already visible
    if (!subtasksVisible) {
      setSubtasksVisible(true);
    }
  };

  // Add manual nested subtask
  const handleAddManualNestedSubtask = () => {
    if (!nestedSubtaskInput.trim() || currentParentIndex === null) {
      return;
    }

    const newNestedSubtask = {
      id: `subtask-${Date.now()}`,
      title: nestedSubtaskInput.trim(),
      completed: false,
      subtasks: [],
    };

    const updatedSubtasks = [...fields.generatedSubtasks];
    const parentSubtask = updatedSubtasks[currentParentIndex];
    
    updatedSubtasks[currentParentIndex] = {
      ...parentSubtask,
      subtasks: [...(parentSubtask.subtasks || []), newNestedSubtask],
    };
    
    handleFieldChange("generatedSubtasks", updatedSubtasks);
    
    setNestedSubtaskInput('');
    setNestedSubtaskDialogVisible(false);
    setCurrentParentIndex(null);
  };

  const handleGenerateNestedSubtasks = async (parentSubtaskIndex) => {
    const parentSubtask = fields.generatedSubtasks[parentSubtaskIndex];
    if (!parentSubtask) return;

    setGeneratingNestedFor(parentSubtaskIndex);

    try {
      const nestedSubtasks = await generateNestedSubtasks(parentSubtask.title);
      const updatedSubtasks = [...fields.generatedSubtasks];
      updatedSubtasks[parentSubtaskIndex] = {
        ...parentSubtask,
        // Append new nested subtasks to existing ones
        subtasks: [...(parentSubtask.subtasks || []), ...nestedSubtasks],
      };
      handleFieldChange("generatedSubtasks", updatedSubtasks);
    } catch (error) {
      console.error("Error generating nested subtasks:", error);
      Alert.alert("Error", "Failed to generate nested subtasks. Please try again.");
    } finally {
      setGeneratingNestedFor(null);
    }
  };

  const toggleSubtaskCompletion = (subtaskIndex) => {
    const updatedSubtasks = [...fields.generatedSubtasks];
    updatedSubtasks[subtaskIndex] = {
      ...updatedSubtasks[subtaskIndex],
      completed: !updatedSubtasks[subtaskIndex].completed,
    };
    handleFieldChange("generatedSubtasks", updatedSubtasks);
  };

  const toggleNestedSubtaskCompletion = (subtaskIndex, nestedIndex) => {
    const updatedSubtasks = [...fields.generatedSubtasks];
    if (!updatedSubtasks[subtaskIndex].subtasks) return;
    
    updatedSubtasks[subtaskIndex].subtasks[nestedIndex] = {
      ...updatedSubtasks[subtaskIndex].subtasks[nestedIndex],
      completed: !updatedSubtasks[subtaskIndex].subtasks[nestedIndex].completed,
    };
    handleFieldChange("generatedSubtasks", updatedSubtasks);
  };

  const toggleChipList = ()=>{
    setTagsVisible(prev => !prev);
  }

  const handleSubtaskGeneration = () => {
    // * display the view, then send a req to the server (which would be the dummy loading for now)
    setSubtasksVisible(true);
    setSubtasksLoading(true);
  };

  const invalidInputDialog = (contentText) => {
    setDialogData({
        title: "Fields needed",
        content: contentText,
        buttons: {
          yes: { text: "Ok", action: () => hideDialog()},
          no: { show: false }
        }
      });

      showDialog();
  }

  // * Main function for the storage of task
  const saveTask = async () => {
    console.log(fields.taskTitle.trim());

    //* INPUT VALIDATION HERE
    if (fields.taskTitle.trim() === "") {
      invalidInputDialog("Please enter a Title for your task");
      return;
    }
    if(fields.dueDate === null){
      invalidInputDialog("Please enter a completion date for your task");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && task) {
        // Update existing task
        await updateTaskInDB(
          task.id,
          fields.taskTitle, 
          fields.isUrgent, 
          fields.dueDate, 
          fields.selectedTags, 
          fields.generatedSubtasks
        );
      } else {
        // Create new task
        await writeToDB(
          fields.taskTitle, 
          fields.isUrgent, 
          fields.dueDate, 
          fields.selectedTags, 
          fields.generatedSubtasks
        );
      }
      navigation.goBack(); // Go back after saving the task
    } catch (error) {
      console.error('Error saving task:', error);
      invalidInputDialog("Failed to save task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Recursively format subtasks to ensure nested structure is preserved
  const formatSubtasksForFirestore = (subtasks) => {
    if (!subtasks || !Array.isArray(subtasks)) {
      return [];
    }

    return subtasks.map((subtask, index) => ({
      id: subtask.id || `subtask-${Date.now()}-${index}`,
      title: subtask.title || '',
      completed: subtask.completed || false,
      subtasks: formatSubtasksForFirestore(subtask.subtasks) // Recursively format nested subtasks
    }));
  };

  const updateTaskInDB = async (taskId, title, isUrgent, date, tags, subtasks) => {
    // Convert subtasks to proper format for Firebase (handles nested subtasks recursively)
    const formattedSubtasks = formatSubtasksForFirestore(subtasks);

    // Update task in Firebase
    await updateTask(taskId, {
      title,
      isUrgent,
      date,
      tags,
      subtasks: formattedSubtasks,
      completed: false,
    });
  };

  const writeToDB = async (title, isUrgent, date, tags, subtasks) => {
    // Convert subtasks to proper format for Firebase (handles nested subtasks recursively)
    const formattedSubtasks = formatSubtasksForFirestore(subtasks);

    // Create task in Firebase
    await createTask({
      title,
      completed: false,
      isUrgent,
      date: date instanceof Date ? date : new Date(date),
      tags: tags || [],
      subtasks: formattedSubtasks
    });
  };

  const [dialogShown, setDialogShown] = useState(false);
  const showDialog = () => setDialogShown(true);
  const hideDialog = () => setDialogShown(false);

  const [dialogData, setDialogData] = useState({
    title: "",
    content: "",
    buttons: {
      yes: { text: "Yes", action: () => navigation.goBack() },
      no: { show: true, text: "No", action: () => hideDialog() }
    }
  });

  //* back button behavior
  useEffect(() => {
    const backAction = () => {
      console.log("back button pressed.");

      if (!dialogShown && (subtasksLoading || fields.taskTitle.trim() !== "")) {
        setDialogData({
          title: "Are you sure?",
          content: "You have unsaved changes.",
          buttons: {
            yes: { text: "Yes", action: () => {
              setDialogShown(false)
              navigation.goBack()
            }},
            no: { show:true, text: "No", action: () => hideDialog() }
          }
        });

        showDialog();
        return true; // prevent default back behavior
      }

      return false; // allow default back behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [fields, subtasksLoading, dialogShown]);

  const formDebugging = () => {
    console.log(
      "title: " + fields.taskTitle + "\n" +
      "isUrgent: " + fields.isUrgent + "\n" +
      "DueDate: " + fields.dueDate + "\n" +
      "Type of DueDate: " + typeof(fields.dueDate) + "\n" +
      "Tags: " + (fields.selectedTags || "none") + "\n" +
      "Subtasks: " + (fields.generatedSubtasks || "none")
    );
  };

  // Subtask selection mode functions
  const enableSubtaskSelectMode = (subtaskIndex) => {
    setSubtaskSelectMode(true);
    setSelectedSubtasks([subtaskIndex]);
    setSelectedNestedSubtasks({});
  };

  const enableNestedSubtaskSelectMode = (parentIndex, nestedIndex) => {
    setSubtaskSelectMode(true);
    setSelectedSubtasks([]);
    setSelectedNestedSubtasks({ [parentIndex]: [nestedIndex] });
  };

  const disableSubtaskSelectMode = () => {
    setSubtaskSelectMode(false);
    setSelectedSubtasks([]);
    setSelectedNestedSubtasks({});
  };

  const toggleSubtaskSelection = (subtaskIndex) => {
    setSelectedSubtasks(prev => {
      if (prev.includes(subtaskIndex)) {
        return prev.filter(i => i !== subtaskIndex);
      } else {
        return [...prev, subtaskIndex];
      }
    });
  };

  const toggleNestedSubtaskSelection = (parentIndex, nestedIndex) => {
    setSelectedNestedSubtasks(prev => {
      const parentSelections = prev[parentIndex] || [];
      if (parentSelections.includes(nestedIndex)) {
        const updated = parentSelections.filter(i => i !== nestedIndex);
        if (updated.length === 0) {
          const { [parentIndex]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [parentIndex]: updated };
      } else {
        return { ...prev, [parentIndex]: [...parentSelections, nestedIndex] };
      }
    });
  };

  const deleteSelectedSubtasks = () => {
    const totalSelected = selectedSubtasks.length + 
      Object.values(selectedNestedSubtasks).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalSelected === 0) return;

    Alert.alert(
      'Delete Subtasks',
      `Are you sure you want to delete ${totalSelected} subtask(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => {
            let updatedSubtasks = [...fields.generatedSubtasks];
            
            // Delete nested subtasks first
            Object.keys(selectedNestedSubtasks).forEach(parentIndex => {
              const nestedIndices = selectedNestedSubtasks[parentIndex];
              const parent = updatedSubtasks[parentIndex];
              if (parent && parent.subtasks) {
                updatedSubtasks[parentIndex] = {
                  ...parent,
                  subtasks: parent.subtasks.filter((_, idx) => !nestedIndices.includes(idx))
                };
              }
            });
            
            // Then delete parent subtasks
            updatedSubtasks = updatedSubtasks.filter((_, index) => !selectedSubtasks.includes(index));
            
            handleFieldChange("generatedSubtasks", updatedSubtasks);
            disableSubtaskSelectMode();
          },
          style: 'destructive',
        },
      ]
    );
  };

  //! main renderer
  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title={isEdit ? "Edit Task" : "Create a task"}
        rightButtons={
          subtaskSelectMode
            ? [
                { 
                  icon: "delete", 
                  action: deleteSelectedSubtasks, 
                  disabled: selectedSubtasks.length === 0 && Object.keys(selectedNestedSubtasks).length === 0 
                },
                { icon: "close", action: disableSubtaskSelectMode }
              ]
            : [{ icon: "check", action: saveTask, disabled: saving }]
        }
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.container}>
        

        <TextInput
          mode="outlined"
          label="Task Title"
          value={fields.taskTitle}
          onChangeText={(newTitle) => handleFieldChange("taskTitle", newTitle)}
        />
        
        {/* MD3 date picker hell yeah*/}
        {/* doing it this way because the date picker stretches across the screen for some reason and also also setting the presentationstyle to pagesheet does nothing why why why i wished it just worked the way i wanted to why don't computers just listen to their humanoid overloards i wished knew why omg why do i need to do this why do people trust me in doing this they say that im good even do i dont know jack about what im doing maybe i do but i also idk why why why did god curse me this way i toil as i am forced to cram once more suffering the same pain inflicted on my colleagues as we try rush all the things needed for us to graduate from this godforsaken curriculum*/}
        <View style={styles.datePickerContainer}> 
          <DatePickerInput
            locale="en"
            mode="outlined"
            label="Due Date"
            value={fields.dueDate}
            onChange={(d) => handleFieldChange("dueDate", d)}
            inputMode="start"
            startYear={1945}
            endYear={2100}
            style={{width:200}}
            animationType="fade"
            presentationStyle="formSheet"
          />
        </View>
        
        <Text variant="labelMedium">
          Urgency
        </Text>
        <SegmentedButtons
          value={fields.isUrgent}
          onValueChange={(v)=>handleFieldChange("isUrgent",v)}
          buttons={[
            {
              value: true,
              label: 'Urgent'
            },
            {
              value: false,
              label: 'Not Urgent'
            }
          ]}
        />

        {/* Tags - label and a container for all the possible tags. */}
        <Text variant="labelMedium">
          Tags
        </Text>
        <TagChipList 
          tags={taskTags}
          mostUsedTags={mostUsedTags}
          selectedTags={fields.selectedTags}
          mode="double"
          whenTagSelected={handleTagSelection}
          createTagAlwaysVisible={true}
          showTags={tagsVisible}
          setShowTags={setTagsVisible}
          onCreateTag={() => navigation.navigate("Tags")}
        />

        {/* Subtask Generation */}
        <Text variant="labelMedium" style={{marginTop: 8}}>
          Subtasks
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <Button 
            icon="auto-fix" 
            mode="contained-tonal" 
            disabled={!fields.taskTitle.trim() || subtasksLoading} 
            onPress={doSubtaskGeneration}
            loading={subtasksLoading}
            style={{ flex: 1 }}
          >
            AI Generate
          </Button>
          <Button 
            icon="plus" 
            mode="outlined" 
            onPress={() => setManualSubtaskDialogVisible(true)}
            style={{ flex: 1 }}
          >
            Add Manually
          </Button>
        </View>
        {subtasksLoading && (
          <Button 
            icon="close" 
            mode="outlined" 
            onPress={cancelSubtaskGeneration}
            disabled={!subtasksLoading}
          >
            Cancel
          </Button>
        )}
        
        {/* Display the generated subtasks */}
        {subtasksVisible && (
          subtasksLoading ? (
            <View style={[styles.horizontalContainer, {justifyContent:'center', alignItems:"center", gap:20, paddingVertical: 20}]}> 
              <Text variant="labelLarge">
                Generating Subtasks...
              </Text>
              <ActivityIndicator animating={true} color={theme.colors.primary} style={styles.subtaskLoadingCircle}/>
            </View>
          ) : fields.generatedSubtasks.length > 0 ? (
            <View style={styles.subtasksContainer}>
              {fields.generatedSubtasks.map((subtask, index) => {
                const isSelected = selectedSubtasks.includes(index);
                return (
                  <Pressable
                    key={subtask.id || index}
                    onLongPress={() => !subtaskSelectMode && enableSubtaskSelectMode(index)}
                    onPress={() => {
                      if (subtaskSelectMode) {
                        toggleSubtaskSelection(index);
                      }
                    }}
                  >
                    <Surface
                      style={[
                        styles.subtaskItem,
                        isSelected && subtaskSelectMode && {
                          borderWidth: 2,
                          borderColor: theme.colors.primary
                        }
                      ]}
                      elevation={isSelected && subtaskSelectMode ? 2 : 0}
                    >
                      <View style={styles.subtaskRow}>
                        {subtaskSelectMode && (
                          <Checkbox
                            status={isSelected ? 'checked' : 'unchecked'}
                            onPress={() => toggleSubtaskSelection(index)}
                          />
                        )}
                        {!subtaskSelectMode && (
                          <Checkbox
                            status={subtask.completed ? "checked" : "unchecked"}
                            onPress={() => toggleSubtaskCompletion(index)}
                          />
                        )}
                        <Text 
                          variant="bodyMedium" 
                          style={[
                            styles.subtaskText,
                            subtask.completed && styles.subtaskTextCompleted
                          ]}
                        >
                          {subtask.title}
                        </Text>
                        {!subtaskSelectMode && (
                          <IconButton
                            icon="auto-fix"
                            size={20}
                            onPress={() => handleGenerateNestedSubtasks(index)}
                            disabled={generatingNestedFor === index}
                          />
                        )}
                      </View>
                      {/* Nested Subtasks */}
                      {subtask.subtasks && subtask.subtasks.length > 0 && (
                        <View style={styles.nestedSubtasksContainer}>
                          {subtask.subtasks.map((nestedSubtask, nestedIndex) => {
                            const isNestedSelected = selectedNestedSubtasks[index]?.includes(nestedIndex);
                            return (
                              <Pressable
                                key={nestedSubtask.id || nestedIndex}
                                onLongPress={() => !subtaskSelectMode && enableNestedSubtaskSelectMode(index, nestedIndex)}
                                onPress={() => {
                                  if (subtaskSelectMode) {
                                    toggleNestedSubtaskSelection(index, nestedIndex);
                                  }
                                }}
                              >
                                <View style={[
                                  styles.nestedSubtaskItem,
                                  isNestedSelected && subtaskSelectMode && {
                                    backgroundColor: theme.colors.primaryContainer,
                                    borderRadius: 4,
                                    padding: 4,
                                    marginHorizontal: -4,
                                  }
                                ]}>
                                  {subtaskSelectMode && (
                                    <Checkbox
                                      status={isNestedSelected ? 'checked' : 'unchecked'}
                                      onPress={() => toggleNestedSubtaskSelection(index, nestedIndex)}
                                    />
                                  )}
                                  {!subtaskSelectMode && (
                                    <Checkbox
                                      status={nestedSubtask.completed ? "checked" : "unchecked"}
                                      onPress={() => toggleNestedSubtaskCompletion(index, nestedIndex)}
                                    />
                                  )}
                                  <Text 
                                    variant="bodySmall" 
                                    style={[
                                      styles.nestedSubtaskText,
                                      nestedSubtask.completed && styles.subtaskTextCompleted
                                    ]}
                                  >
                                    {nestedSubtask.title}
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          })}
                          {!subtaskSelectMode && (
                            <IconButton
                              icon="plus"
                              size={16}
                              mode="contained-tonal"
                              onPress={() => {
                                setCurrentParentIndex(index);
                                setNestedSubtaskDialogVisible(true);
                              }}
                              style={styles.addNestedSubtaskButton}
                            />
                          )}
                        </View>
                      )}
                      {/* Show add button even if no nested subtasks exist */}
                      {(!subtask.subtasks || subtask.subtasks.length === 0) && !subtaskSelectMode && (
                        <View style={styles.nestedSubtasksContainer}>
                          <IconButton
                            icon="plus"
                            size={16}
                            mode="contained-tonal"
                            onPress={() => {
                              setCurrentParentIndex(index);
                              setNestedSubtaskDialogVisible(true);
                            }}
                            style={styles.addNestedSubtaskButton}
                          />
                        </View>
                      )}
                    </Surface>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text variant="bodySmall" style={{textAlign: 'center', paddingVertical: 10}}>
              No subtasks generated yet. Click "Generate Subtasks" to create them.
            </Text>
          )
        )}

        <Portal>
          <Dialog visible={dialogShown} onDismiss={hideDialog}>
            {dialogData.title && (
              <Dialog.Title> 
                {dialogData.title}
              </Dialog.Title>
            )}
            <Dialog.Content>
              <Text variant="bodyMedium">
                {dialogData.content}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              {dialogData.buttons.no.show && (
                <Button onPress={() => dialogData.buttons.no.action()}>{dialogData.buttons.no.text}</Button>
              )}
              <Button onPress={() => dialogData.buttons.yes.action()}>{dialogData.buttons.yes.text}</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* FOR DEBUGGING */}
        {false && (
          <Surface style={{backgroundColor: theme.colors.errorContainer, borderRadius: 8, padding: 4}}>
            <Text variant="labelSmall">
              Debooging
            </Text>
            <Button mode="text" onPress={()=>console.log('selected tags are: ' + fields.selectedTags)}>
              Print all selected tags to console
            </Button>
            <Button mode="text" onPress={formDebugging}>
              Print the whole form in the console
            </Button>
          </Surface>
        )}

      {/*Subtasks
        <View style={styles.addContainer}>
          <TouchableOpacity onPress={() => setShowSubtaskInput(true)} style={styles.addButton}>
            <MaterialIcons name="add" size={20} color="white" />
          </TouchableOpacity>
          {showSubtaskInput && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Subtask"
                value={newSubtask}
                onChangeText={setNewSubtask}
                onSubmitEditing={() => {
                  if (addItem(setSubtasks, newSubtask, true)) {
                    setNewSubtask(""); // Clear input after adding subtask
                    setShowSubtaskInput(false); // Hide input field after adding
                  }
                }}
              />
            </View>
          )}
        </View>

        <FlatList
          data={subtasks}
          renderItem={({ item, index }) => (
            <View style={styles.item}>
              <Text style={styles.itemText}>{item.title}</Text>
              <TouchableOpacity onPress={() => removeItem(setSubtasks, index)}>
                <MaterialIcons name="delete" size={20} color="red" />
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
        */}
      </View>
      </ScrollView>

      {/* Manual Subtask Input Dialog */}
      <Portal>
        <Dialog 
          visible={manualSubtaskDialogVisible} 
          onDismiss={() => {
            setManualSubtaskDialogVisible(false);
            setManualSubtaskInput('');
          }}
          dismissable={true}
        >
          <Dialog.Title>Add Subtask</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Subtask"
              placeholder="Enter subtask name..."
              value={manualSubtaskInput}
              onChangeText={setManualSubtaskInput}
              autoFocus={false}
              returnKeyType="done"
              onSubmitEditing={handleAddManualSubtask}
              selectTextOnFocus={true}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setManualSubtaskDialogVisible(false);
              setManualSubtaskInput('');
            }}>Cancel</Button>
            <Button 
              onPress={handleAddManualSubtask}
              disabled={!manualSubtaskInput.trim()}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Manual Nested Subtask Input Dialog */}
      <Portal>
        <Dialog 
          visible={nestedSubtaskDialogVisible} 
          onDismiss={() => {
            setNestedSubtaskDialogVisible(false);
            setNestedSubtaskInput('');
            setCurrentParentIndex(null);
          }}
          dismissable={true}
        >
          <Dialog.Title>Add Nested Subtask</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Nested Subtask"
              placeholder="Enter nested subtask name..."
              value={nestedSubtaskInput}
              onChangeText={setNestedSubtaskInput}
              autoFocus={false}
              returnKeyType="done"
              onSubmitEditing={handleAddManualNestedSubtask}
              selectTextOnFocus={true}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setNestedSubtaskDialogVisible(false);
              setNestedSubtaskInput('');
              setCurrentParentIndex(null);
            }}>Cancel</Button>
            <Button 
              onPress={handleAddManualNestedSubtask}
              disabled={!nestedSubtaskInput.trim()}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const createStyles = (theme) =>  
  StyleSheet.create({
    scrollView: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
    },
    container: { 
      flex: 1,
      padding: 20,
      paddingTop: 0,
      gap: 8, 
      backgroundColor: theme.colors.background 
    },
    buttons:{
      alignSelf:"flex-start"
    },
    datePickerContainer:{
      marginTop: 28, 
      marginBottom: 29
    },
    subtaskLoadingCircle:{
      height: 40
    },
    horizontalContainer:{
      flexDirection:"row"
    },
    subtasksContainer: {
      marginTop: 8,
      padding: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
    },
    subtaskItem: {
      marginBottom: 12,
    },
    subtaskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    subtaskText: {
      flex: 1,
    },
    subtaskTextCompleted: {
      textDecorationLine: 'line-through',
      opacity: 0.6,
    },
    nestedSubtasksContainer: {
      marginLeft: 40,
      marginTop: 8,
      paddingLeft: 8,
      borderLeftWidth: 2,
      borderLeftColor: theme.colors.outline,
    },
    nestedSubtaskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    nestedSubtaskText: {
      flex: 1,
    },
    addNestedSubtaskButton: {
      marginTop: 4,
      marginLeft: -8,
    },
  });

export default CreateScreen;
