import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Button, useTheme, ActivityIndicator, Surface, Dialog, Portal } from 'react-native-paper';
import TagChipList from "../../components/TagChipList";
import { createNote, updateNote } from "../../firebase/services/notesService";
import { createTag, getAllTags } from "../../firebase/services/tasksService";
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
  const { note, isEdit } = route.params || {};
  
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [lastAiAction, setLastAiAction] = useState(null);
  const [lastAiResult, setLastAiResult] = useState('');

  const [tags, setTags] = useState(dummy_tags);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsVisible, setTagsVisible] = useState(false);
  const [createTagDialogVisible, setCreateTagDialogVisible] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  // Load note data if editing
  useEffect(() => {
    if (isEdit && note) {
      setTitle(note.title || '');
      setText(note.content || '');
      setSelectedTags(note.tag || []);
    }
  }, [isEdit, note]);

  // Load tags from Firebase
  useEffect(() => {
    const loadTags = async () => {
      try {
        const firebaseTags = await getAllTags();
        // Keep full tag objects with {id, label, color}
        setTags(firebaseTags);
      } catch (error) {
        console.error('Error loading tags:', error);
        // Fallback to dummy tags
        setTags(dummy_tags);
      }
    };
    loadTags();
  }, []);

  const handleTagSelection = (tag) => {
    setSelectedTags((prevSelectedTags) => 
      prevSelectedTags.includes(tag)
        ? prevSelectedTags.filter((item) => item !== tag)
        : [...prevSelectedTags, tag]
    );
  };

  // Function to generate a random color for new tags
  const generateRandomColor = () => {
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", 
      "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739", "#52BE80", 
      "#EC7063", "#5DADE2", "#48C9B0", "#F4D03F", "#EB984E"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle opening the create tag dialog
  const handleOpenCreateTagDialog = () => {
    setCreateTagDialogVisible(true);
  };

  // Handle closing the create tag dialog
  const handleCloseCreateTagDialog = () => {
    setCreateTagDialogVisible(false);
    setNewTagLabel('');
  };

  // Handle creating a new tag
  const handleCreateTag = async () => {
    if (!newTagLabel.trim()) {
      Alert.alert("Error", "Please enter a tag name");
      return;
    }

    // Check if tag already exists
    if (tags.includes(newTagLabel.trim())) {
      Alert.alert("Error", "This tag already exists");
      return;
    }

    setCreatingTag(true);
    try {
      const newTag = {
        label: newTagLabel.trim(),
        color: generateRandomColor(),
      };

      // Save to Firestore
      await createTag(newTag);

      // Update local state
      setTags(prevTags => [...prevTags, newTagLabel.trim()]);
      
      Alert.alert("Success", "Tag created successfully!");
      handleCloseCreateTagDialog();
    } catch (error) {
      console.error('Error creating tag:', error);
      Alert.alert("Error", "Failed to create tag. Please try again.");
    } finally {
      setCreatingTag(false);
    }
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
      if (isEdit && note) {
        // Update existing note
        await updateNote(note.id, {
          title: title.trim(),
          content: text.trim(),
          tag: selectedTags,
        });
      } else {
        // Create new note
        await createNote({
          title: title.trim(),
          content: text.trim(),
          tag: selectedTags,
          archived: false,
          deleted: false,
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert("Error", "Failed to save note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title={isEdit ? "Edit Note" : "Add Smart Note"}
        rightButtons={[{icon: "check", action: handleSave, disabled: saving}]}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Title Section */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Title
            </Text>
            <TextInput
              mode="outlined"
              label="Note Title"
              placeholder="Enter a title for your note..."
              value={title}
              onChangeText={setTitle}
              style={styles.titleInput}
            />
          </View>

          {/* Tags Section */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Tags
            </Text>
            <View style={styles.tagsWrapper}>
              <TagChipList
                tags={tags}
                selectedTags={selectedTags}
                mode="single"
                showTags={tagsVisible}
                setShowTags={setTagsVisible}
                whenTagSelected={handleTagSelection}
                onCreateTag={() => navigation.navigate("Tags")}
              />
            </View>
          </View>

          {/* Note Content Section - Separate section after tags */}
          <View style={styles.section}>
            <Text variant="labelLarge" style={styles.sectionLabel}>
              Note Content
            </Text>
            <TextInput
              multiline
              value={text}
              onChangeText={setText}
              placeholder="Start typing your note here..."
              mode="outlined"
              style={styles.contentInput}
              editable={!aiProcessing}
              scrollEnabled={true}
            />
          </View>

          {/* AI Actions Section */}
          {text.trim().length > 0 && (
            <View style={styles.section}>
              <Text variant="labelLarge" style={styles.sectionLabel}>
                AI Actions
              </Text>
              <Surface style={styles.aiActionsContainer} elevation={2}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.aiButtonsScrollContent}
                >
                  <View style={styles.aiButtonsContainer}>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleAiAction(summarizeNote, "Summarize")}
                      disabled={aiProcessing}
                      style={styles.aiButton}
                    >
                      Summarize
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
                      Expand
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleAiAction(makeNoteCasual, "Make Casual")}
                      disabled={aiProcessing}
                      style={styles.aiButton}
                    >
                      Casual
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleAiAction(makeNoteFormal, "Make Formal")}
                      disabled={aiProcessing}
                      style={styles.aiButton}
                    >
                      Formal
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleAiAction(makeNoteProfessional, "Make Professional")}
                      disabled={aiProcessing}
                      style={styles.aiButton}
                    >
                      Professional
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleAiAction(fixGrammar, "Fix Grammar")}
                      disabled={aiProcessing}
                      style={styles.aiButton}
                    >
                      Fix grammar
                    </Button>
                    <Button
                      mode="outlined"
                      compact
                      onPress={() => handleAiAction(reorganizeNote, "Reorganize")}
                      disabled={aiProcessing}
                      style={styles.aiButton}
                    >
                      Reorganize
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
                    <Text variant="bodySmall" style={styles.loadingText}>
                      Processing...
                    </Text>
                  </View>
                )}
              </Surface>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Tag Dialog */}
      <Portal>
        <Dialog visible={createTagDialogVisible} onDismiss={handleCloseCreateTagDialog}>
          <Dialog.Title>Create New Tag</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Tag Name"
              placeholder="Enter tag name..."
              value={newTagLabel}
              onChangeText={setNewTagLabel}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseCreateTagDialog} disabled={creatingTag}>
              Cancel
            </Button>
            <Button 
              onPress={handleCreateTag} 
              disabled={creatingTag || !newTagLabel.trim()}
              loading={creatingTag}
            >
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  container: {
    padding: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  titleInput: {
    marginBottom: 0,
  },
  tagsWrapper: {
    width: '100%',
  },
  contentInput: {
    textAlignVertical: 'top',
    minHeight: 200,
  },
  aiActionsContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  aiButtonsScrollContent: {
    paddingVertical: 4,
  },
  aiButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  aiButton: {
    marginRight: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
});

export default AddNoteScreen;
