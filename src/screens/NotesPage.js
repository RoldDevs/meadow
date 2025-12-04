import React, { useState, useLayoutEffect, useEffect } from "react";
import { View, FlatList, StyleSheet, Modal, Alert, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Appbar,
  FAB,
  Card,
  Text,
  Button,
  Chip,
  Portal,
  Dialog,
  ActivityIndicator,
} from "react-native-paper";
import TagChipList from "../components/TagChipList"
import { getAllNotes, subscribeToNotes } from "../firebase/services/notesService";
import { dummy_tags } from "../../Data/tasks";
import TopAppBar from "../TopAppBar";

const SmartNotesScreen = () => {
  const navigation = useNavigation();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState(dummy_tags);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsVisible, setTagsVisible] = useState(false);

  // Load notes from Firebase with real-time updates
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToNotes((firebaseNotes, error) => {
      if (error) {
        console.error('Error loading notes:', error);
        setLoading(false);
        return;
      }
      setNotes(firebaseNotes);
      setLoading(false);
    }, false, false); // exclude archived and deleted
    
    return () => unsubscribe();
  }, []);

  // Navigate to Add Note Page
  const navigateToAddNote = () => {
    navigation.navigate("Add", {
      allTags: tags,
      setTags,
    });
  };


  // Filter Notes by Selected Tags
  const filteredNotes = notes.filter((note) => {
    if (selectedTags.length === 0) return true;
    const noteTags = note.tag || [];
    return noteTags.some((tag) => {
      const tagValue = typeof tag === 'string' ? tag : tag.label || tag;
      return selectedTags.includes(tagValue);
    });
  });

  const handleTagSelection = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  // Render Note Card
  const renderItem = ({ item }) => {
    const formatDate = (date) => {
      if (!date) return '';
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    return (
      <Card style={styles.card}>
        <Card.Title title={item.title} subtitle={formatDate(item.date || item.createdAt)} />
        <Card.Content>
          <Text style={{ marginBottom: 8 }}>{item.content}</Text>
          <View style={styles.tagContainer}>
            {(item.tag || []).map((tag, idx) => {
              const tagLabel = typeof tag === 'string' ? tag : tag.label || tag;
              return (
                <Chip key={idx} style={{ marginRight: 6, marginBottom: 6 }}>
                  {tagLabel}
                </Chip>
              );
            })}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Smart Notes"
        rightButtons={[
          { icon: "magnify", action: () => {} },
          { icon: "dots-vertical", action: () => {} }
        ]}
      />
      <View style={styles.container}>
        <TagChipList
          tags={tags}
          selectedTags={selectedTags}
          mode="single"
          showTags={tagsVisible}
          setShowTags={setTagsVisible}
          whenTagSelected={handleTagSelection}
        />

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100}}>
          <ActivityIndicator size="large" />
          <Text style={{marginTop: 10}}>Loading notes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={() => (
            <Text style={{textAlign: 'center', marginTop: 40, fontSize: 16}}>
              No notes yet. Create your first note!
            </Text>
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={navigateToAddNote}
      />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  card: {
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});

export default SmartNotesScreen;
