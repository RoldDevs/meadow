import React, { useState, useEffect } from "react";
import { View, FlatList, StyleSheet, Alert, BackHandler, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  FAB,
  Card,
  Text,
  Chip,
  ActivityIndicator,
  Checkbox,
  Searchbar,
  useTheme,
  Menu,
} from "react-native-paper";
import TagChipList from "../components/TagChipList"
import { getAllNotes, subscribeToNotes, deleteNote } from "../firebase/services/notesService";
import { getAllTags } from "../firebase/services/tasksService";
import { dummy_tags } from "../../Data/tasks";
import TopAppBar from "../TopAppBar";

const SmartNotesScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState(dummy_tags);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagsVisible, setTagsVisible] = useState(false);
  
  // Selection mode states
  const [selectModeEnabled, setSelectModeEnabled] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState([]);
  
  // Search states
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Menu states
  const [menuVisible, setMenuVisible] = useState(false);

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

  // Load tags from Firebase
  useEffect(() => {
    const loadTags = async () => {
      try {
        const firebaseTags = await getAllTags();
        // Keep full tag objects with {id, label, color}
        setTags(firebaseTags);
      } catch (error) {
        console.error('Error loading tags:', error);
        // Fallback to dummy tags on error
        setTags(dummy_tags);
      }
    };
    loadTags();
  }, []);

  // Navigate to Add Note Page
  const navigateToAddNote = () => {
    navigation.navigate("Add", {
      allTags: tags,
      setTags,
    });
  };

  // Selection mode functions
  const enableSelectMode = (noteId) => {
    setSelectModeEnabled(true);
    setSelectedNotes([noteId]);
  };

  const disableSelectMode = () => {
    setSelectModeEnabled(false);
    setSelectedNotes([]);
  };

  const toggleNoteSelection = (noteId) => {
    setSelectedNotes(prev =>
      prev.includes(noteId)
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  const deleteSelectedNotes = async () => {
    if (selectedNotes.length === 0) {
      Alert.alert("Error", "No notes selected");
      return;
    }

    Alert.alert(
      "Delete Notes",
      `Are you sure you want to delete ${selectedNotes.length} note(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const deletePromises = selectedNotes.map(noteId => deleteNote(noteId));
              await Promise.all(deletePromises);
              disableSelectMode();
              Alert.alert("Success", `${selectedNotes.length} note(s) deleted successfully`);
            } catch (error) {
              console.error('Error deleting notes:', error);
              Alert.alert('Error', 'Failed to delete notes');
            }
          }
        }
      ]
    );
  };

  // BackHandler for selection mode
  useEffect(() => {
    const backAction = () => {
      if (selectModeEnabled) {
        disableSelectMode();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [selectModeEnabled]);

  // Filter Notes by Selected Tags and Search
  const filteredNotes = notes.filter((note) => {
    // Tag filter - support both string tags and object tags with {id, label, color}
    const matchesTags = selectedTags.length === 0 || (() => {
      const noteTags = note.tag || [];
      return noteTags.some((tag) => {
        const tagId = typeof tag === 'string' ? tag : (tag.id || tag.label || tag);
        return selectedTags.includes(tagId);
      });
    })();

    // Search filter
    const matchesSearch = !searchQuery ||
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTags && matchesSearch;
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

    const isSelected = selectedNotes.includes(item.id);
    
    return (
      <Pressable
        onLongPress={() => !selectModeEnabled && enableSelectMode(item.id)}
        onPress={() => {
          if (selectModeEnabled) {
            toggleNoteSelection(item.id);
          } else {
            // Navigate to edit note screen
            navigation.navigate("Add", { note: item, isEdit: true });
          }
        }}
      >
        <Card 
          style={[
            styles.card,
            isSelected && selectModeEnabled && {
              borderWidth: 2,
              borderColor: theme.colors.primary
            }
          ]}
        >
        <Card.Title 
          title={item.title} 
          subtitle={formatDate(item.date || item.createdAt)}
          left={selectModeEnabled ? () => (
            <Checkbox
              status={isSelected ? 'checked' : 'unchecked'}
              onPress={() => toggleNoteSelection(item.id)}
            />
          ) : undefined}
        />
        <Card.Content>
          <Text numberOfLines={3} style={{ marginBottom: 8 }}>{item.content}</Text>
          <View style={styles.tagContainer}>
            {(item.tag || []).map((tag, idx) => {
              // If tag is a string (ID), find the matching tag object from tags array
              let tagLabel, tagColor;
              
              if (typeof tag === 'string') {
                // Tag is an ID, find the matching tag object
                const tagObj = tags.find(t => t.id === tag || t.label === tag);
                if (tagObj) {
                  tagLabel = tagObj.label;
                  tagColor = tagObj.color;
                } else {
                  // If not found, just display the string
                  tagLabel = tag;
                  tagColor = undefined;
                }
              } else {
                // Tag is already an object
                tagLabel = tag.label || tag;
                tagColor = tag.color;
              }
              
              return (
                <Chip 
                  key={idx} 
                  style={[
                    { marginRight: 6, marginBottom: 6 },
                    tagColor ? { backgroundColor: tagColor } : undefined
                  ]}
                  textStyle={tagColor ? { color: '#FFFFFF' } : undefined}
                >
                  {tagLabel}
                </Chip>
              );
            })}
          </View>
        </Card.Content>
      </Card>
      </Pressable>
    );
  };

  const rightButtons = selectModeEnabled
    ? [
        { icon: "delete", action: () => deleteSelectedNotes() },
        { icon: "close", action: () => disableSelectMode() }
      ]
    : [
        { icon: "magnify", action: () => setSearchVisible(true) },
        { icon: "dots-vertical", action: () => setMenuVisible(true) }
      ];

  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Smart Notes"
        rightButtons={rightButtons}
      />
      {selectModeEnabled && (
        <View style={[styles.selectionBanner, { backgroundColor: theme.colors.errorContainer }]}>
          <Text style={{ color: theme.colors.onErrorContainer, textAlign: "center", margin: 3 }}>
            {selectedNotes.length} note(s) selected
          </Text>
        </View>
      )}
      
      {/* Options Menu */}
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={{x: 1000, y: 80}}
      >
        <Menu.Item
          onPress={() => {
            setMenuVisible(false);
            navigation.navigate("Tags");
          }}
          leadingIcon="tag"
          title="Manage Tags"
        />
      </Menu>
      
      <View style={styles.container}>
        {/* Search Bar */}
        {searchVisible && (
          <View style={styles.searchContainer}>
            <Searchbar
              placeholder="Search notes..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              onIconPress={() => {
                setSearchVisible(false);
                setSearchQuery('');
              }}
              onClearIconPress={() => setSearchQuery('')}
            />
          </View>
        )}

        {/* Tags Section - Fixed at top */}
        <View style={styles.tagsSection}>
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

        {/* Notes List - Scrollable */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading notes...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredNotes}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No notes yet. Create your first note!
                </Text>
              </View>
            )}
            showsVerticalScrollIndicator={true}
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
    backgroundColor: 'transparent',
  },
  selectionBanner: {
    paddingVertical: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tagsSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80, // Extra padding for FAB
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
    paddingTop: 40,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
    paddingHorizontal: 20,
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
