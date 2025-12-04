import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { TextInput, Chip, List, Icon, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';
import TagChipList from "../../components/TagChipList"
import { createNote } from "../../firebase/services/notesService";
import { useNavigation } from '@react-navigation/native';
import TopAppBar from "../../TopAppBar";

import {dummy_tags} from "../../../Data/tasks";

const AddNoteScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

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
      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        placeholder="Enter note here..."
        mode="outlined"
        outlineColor="transparent"
        style={styles.input}
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
    height: 500,
  },
});

export default AddNoteScreen;
