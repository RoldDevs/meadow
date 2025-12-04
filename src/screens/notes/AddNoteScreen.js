import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { TextInput, Chip, List, Icon, Button, useTheme, ActivityIndicator, Surface } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import TagChipList from "../../components/TagChipList"
import { createNote } from "../../firebase/services/notesService";
import { useNavigation } from '@react-navigation/native';
import TopAppBar from "../../TopAppBar";
import {
  summarizeNote,
  createShortSummary,
  generateBulletPoints,
  extractKeyTakeaways,
  expandNote,
  makeNoteCasual,
  makeNoteFormal,
  makeNoteProfessional,
  fixGrammar,
  reorganizeNote,
} from "../../services/openRouterService";

import {dummy_tags} from "../../../Data/tasks";

const AddNoteScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [lastAiAction, setLastAiAction] = useState(null);
  const [lastAiResult, setLastAiResult] = useState('');

  const [tags, setTags] = useState(dummy_tags);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsVisible, setTagsVisible] = useState(false);

  const handleTagSelection = (tag) => {
    setSelectedTags((prevSelectedTags) => 
      prevSelectedTags.includes(tag)
        ? prevSelectedTags.filter((item) => item !== tag)
        : [...prevSelectedTags, tag]
    );
  };

  // AI Action Handler
  const handleAiAction = async (actionFunction, actionName) => {
    if (!text.trim()) {
      Alert.alert("Error", "Please enter some note content first");
      return;
    }

    setAiProcessing(true);
    setLastAiAction(() => actionFunction);
    setLastAiResult('');

    try {
      const result = await actionFunction(text);
      setText(result);
      setLastAiResult(result);
    } catch (error) {
      console.error(`Error in ${actionName}:`, error);
      Alert.alert("Error", `Failed to ${actionName.toLowerCase()}. Please try again.`);
    } finally {
      setAiProcessing(false);
    }
  };

  // Retry last AI action
  const handleRetry = async () => {
    if (!lastAiAction || !text.trim()) {
      Alert.alert("Error", "No previous AI action to retry");
      return;
    }

    setAiProcessing(true);
    try {
      const result = await lastAiAction(text);
      setText(result);
      setLastAiResult(result);
    } catch (error) {
      console.error("Error retrying AI action:", error);
      Alert.alert("Error", "Failed to retry. Please try again.");
    } finally {
      setAiProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a title for your note");
      return;
    }

    setSaving(true);
    try {
      await createNote({
        title: title.trim(),
        content: text.trim(),
        tag: selectedTags,
        archived: false,
        deleted: false,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error creating note:', error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Add Smart Note"
        rightButtons={[{icon: "check", action: handleSave, disabled: saving}]}
      />
      <View style={styles.container}>
        <TextInput
          mode="outlined"
          label="Note Title"
          placeholder="Type something..."
          outlineColor="transparent"
          value={title}
          onChangeText={setTitle}
        />
      <Text variant="labelMedium" style={{color: theme.colors.onBackground, marginLeft:  15, marginTop: 10}}>
        Tags
      </Text>
      <TagChipList
        tags={tags}
        selectedTags={selectedTags}
        mode="single"
        showTags={tagsVisible}
        setShowTags={setTagsVisible}
        whenTagSelected={handleTagSelection}
      />
      <Text variant="labelMedium" style={{color: theme.colors.onBackground, marginLeft: 15, marginTop: 10}}>
        Note Content
      </Text>
      
      {/* AI Actions Section */}
      {text.trim().length > 0 && (
        <Surface style={styles.aiActionsContainer} elevation={1}>
          <Text variant="labelLarge" style={{marginBottom: 8, fontWeight: 'bold'}}>
            AI Actions
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.aiButtonsScroll}>
            <View style={styles.aiButtonsContainer}>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(summarizeNote, "Summarize")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                Summarize this
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(createShortSummary, "Create Short Summary")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                Short summary
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(generateBulletPoints, "Generate Bullet Points")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                Bullet points
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(extractKeyTakeaways, "Extract Key Takeaways")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                Key takeaways
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(expandNote, "Expand")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                Make this longer
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(makeNoteCasual, "Make Casual")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                More casual
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(makeNoteFormal, "Make Formal")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                More formal
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(makeNoteProfessional, "Make Professional")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                More professional
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(fixGrammar, "Fix Grammar")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                Fix my grammar
              </Button>
              <Button
                mode="outlined"
                compact
                onPress={() => handleAiAction(reorganizeNote, "Reorganize")}
                disabled={aiProcessing}
                style={styles.aiButton}
              >
                Reorganize flow
              </Button>
              {lastAiAction && (
                <Button
                  mode="contained-tonal"
                  compact
                  onPress={handleRetry}
                  disabled={aiProcessing}
                  style={styles.aiButton}
                  icon="refresh"
                >
                  Retry
                </Button>
              )}
            </View>
          </ScrollView>
          {aiProcessing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" />
              <Text variant="bodySmall" style={{marginLeft: 8}}>Processing...</Text>
            </View>
          )}
        </Surface>
      )}

      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Enter note here..."
        mode="outlined"
        outlineColor="transparent"
        style={styles.input}
        editable={!aiProcessing}
      />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
    gap: 8, 
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  categoryContainer: {
    flexDirection: "row", // make chips align horizontally
    flexWrap: "wrap",     // allow them to wrap to next line if needed
    gap: 8,
  },
  actionsContainer: {
    flexDirection: 'row',   // Place children side by side
    justifyContent: 'space-between',  // Optional: spread them out
    alignItems: 'center',
    marginTop: 10,
  },
  actionButton: {
    flex: 1, // Optional: make both buttons take equal space
    borderRadius: 0,
    alignItems: 'flex-start'
  },
  input: {
    textAlignVertical: 'top',
    paddingVertical: 5,
    overflow: 'hidden',
    minHeight: 200,
    flex: 1,
  },
  aiActionsContainer: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  aiButtonsScroll: {
    maxHeight: 120,
  },
  aiButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  aiButton: {
    marginRight: 4,
    marginBottom: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
});

export default AddNoteScreen;
