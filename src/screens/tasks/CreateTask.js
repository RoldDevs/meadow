import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, FlatList, Alert, BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Appbar, useTheme, TextInput, Text, Switch, SegmentedButtons, Button, Surface, Chip, ActivityIndicator, Portal, Dialog } from "react-native-paper";
import { DatePickerInput} from "react-native-paper-dates";
import { createTask } from '../../firebase/services/tasksService';

import TagChipList from "../../components/TagChipList";
import TopAppBar from "../../TopAppBar";

import { dummy_tags } from "../../../Data/tasks"

const CreateScreen = ({ route, navigation }) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const [saving, setSaving] = useState(false);

  //inputs state
  const [fields, setFields] = useState({
    taskTitle: '',
    dueDate: new Date(),
    isUrgent: true,
    selectedTags: [],
    generatedSubtasks: [],
  });

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
  const [subtasksLoading, setSubtasksLoading] = useState(null);
  const [generatedSubtasks, setGeneratedSubtasks] = useState([]);

  // this is just to simulate the api requests, for now...
  const[dummySubtasks, setDummySubtasks] = useState([
    { id: 1, completed: false, title: "do this subtask first", subtasks:[]},
    { id: 2, completed: false, title: "then this one next", subtasks:[]},
    { id: 3, completed: false, title: "then this one...", subtasks:[]},
    { id: 4, completed: false, title: "then finally, this one :DD", subtasks:[]},
  ]);
  const doFakeSubtaskGeneration = () => {
    setSubtasksVisible(true);
    setSubtasksLoading(true);

    setTimeout(() => {
      setSubtasksLoading(false);
    }, 5000);
  };

  const cancelSubtaskGeneration = () => {
    setSubtasksVisible(false)
    setSubtasksLoading(false);
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
      await writeToDB(
        fields.taskTitle, 
        fields.isUrgent, 
        fields.dueDate, 
        fields.selectedTags, 
        fields.generatedSubtasks
      );
      navigation.goBack(); // Go back after saving the task
    } catch (error) {
      console.error('Error saving task:', error);
      invalidInputDialog("Failed to save task. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const writeToDB = async (title, isUrgent, date, tags, subtasks) => {
    // Convert subtasks to proper format for Firebase
    const formattedSubtasks = (subtasks || []).map((subtask, index) => ({
      id: subtask.id || `subtask-${Date.now()}-${index}`,
      title: subtask.title || '',
      completed: subtask.completed || false,
      subtasks: subtask.subtasks || []
    }));

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

  //! main renderer
  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Create a task"
        rightButtons={ [{icon:"check",action:saveTask, disabled: saving}] }//must be an array of objects with keys icon and action
      />
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
        />

        {/* Subtask Generation */}
        {/* //TODO: Add options for manual addtion of subtasks */}
        <Button 
          icon="auto-fix" 
          mode="contained-tonal" 
          disabled={!fields.taskTitle&&subtasksLoading} 
          onPress={doFakeSubtaskGeneration}
        >
          {!(subtasksVisible && !subtasksLoading) ? "Generate New Subtasks" : "Re-generate subtasks"}
        </Button>
        {subtasksLoading &&
          <Button 
            icon="close" 
            mode="contained-tonal" 
            onPress={cancelSubtaskGeneration} 
          >
            Cancel Subtask Generation
          </Button>
        }
        {/* Display the generated subtasks here */}
        {subtasksVisible && (
          subtasksLoading ? (
              <View style={[styles.horizontalContainer,{justifyContent:'center', alignItems:"center",gap:20}]}> 
                <Text variant="labelLarge">
                  Generating Subtasks
                </Text>
                <ActivityIndicator animating={true} color={theme.colors.primary} style={styles.subtaskLoadingCircle}/>
              </View>
            ):( 
              <>
                <FlatList
                  data={dummySubtasks}
                  style={{flexGrow:0}}
                />
                <Text>
                  {"Finished generating :D (just pretend for now plsplspls)"}
                </Text>
              </>
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
    </>
  );
};

const createStyles = (theme) =>  
  StyleSheet.create({
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
    }
  });

export default CreateScreen;
