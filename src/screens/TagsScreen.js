import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { 
  FAB, 
  Card, 
  Text, 
  IconButton, 
  useTheme, 
  Portal, 
  Dialog, 
  TextInput, 
  Button,
  Chip,
  ActivityIndicator
} from 'react-native-paper';
import TopAppBar from '../TopAppBar';
import { getAllTags, createTag, updateTag, deleteTag } from '../firebase/services/tasksService';

const TagsScreen = ({ navigation }) => {
  const theme = useTheme();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagLabel, setTagLabel] = useState('');
  const [tagColor, setTagColor] = useState('#4ECDC4');
  const [saving, setSaving] = useState(false);

  // Predefined color palette
  const colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
    '#EC7063', '#5DADE2', '#48C9B0', '#F4D03F', '#EB984E',
    '#AF7AC5', '#5499C7', '#48C774', '#F39C12', '#E74C3C'
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const fetchedTags = await getAllTags();
      setTags(fetchedTags);
    } catch (error) {
      console.error('Error loading tags:', error);
      Alert.alert('Error', 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (tag = null) => {
    if (tag) {
      setEditingTag(tag);
      setTagLabel(tag.label || '');
      setTagColor(tag.color || '#4ECDC4');
    } else {
      setEditingTag(null);
      setTagLabel('');
      setTagColor('#4ECDC4');
    }
    setDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
    setEditingTag(null);
    setTagLabel('');
    setTagColor('#4ECDC4');
  };

  const handleSaveTag = async () => {
    if (!tagLabel.trim()) {
      Alert.alert('Error', 'Tag name cannot be empty');
      return;
    }

    // Check for duplicate
    const duplicate = tags.find(
      t => t.label.toLowerCase() === tagLabel.trim().toLowerCase() && 
      t.id !== editingTag?.id
    );
    
    if (duplicate) {
      Alert.alert('Error', 'A tag with this name already exists');
      return;
    }

    setSaving(true);
    try {
      const tagData = {
        label: tagLabel.trim(),
        color: tagColor,
      };

      if (editingTag) {
        // Update existing tag
        await updateTag(editingTag.id, tagData);
      } else {
        // Create new tag
        await createTag(tagData);
      }

      await loadTags();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving tag:', error);
      Alert.alert('Error', 'Failed to save tag');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = (tag) => {
    Alert.alert(
      'Delete Tag',
      `Are you sure you want to delete "${tag.label}"? This will remove it from all tasks and notes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTag(tag.id);
              await loadTags();
            } catch (error) {
              console.error('Error deleting tag:', error);
              Alert.alert('Error', 'Failed to delete tag');
            }
          }
        }
      ]
    );
  };

  const renderTagItem = ({ item }) => (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.tagInfo}>
          <View style={[styles.colorPreview, { backgroundColor: item.color }]} />
          <Text variant="titleMedium">{item.label}</Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => handleOpenDialog(item)}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor={theme.colors.error}
            onPress={() => handleDeleteTag(item)}
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Manage Tags"
      />
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading tags...</Text>
          </View>
        ) : (
          <FlatList
            data={tags}
            renderItem={renderTagItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No tags yet. Create your first tag!
                </Text>
              </View>
            )}
          />
        )}

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => handleOpenDialog()}
        />
      </View>

      {/* Create/Edit Tag Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={handleCloseDialog}>
          <Dialog.Title>{editingTag ? 'Edit Tag' : 'Create Tag'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Tag Name"
              value={tagLabel}
              onChangeText={setTagLabel}
              autoFocus
              style={styles.input}
            />
            
            <Text variant="labelLarge" style={styles.colorLabel}>
              Color
            </Text>
            <View style={styles.colorPalette}>
              {colorPalette.map((color) => (
                <Chip
                  key={color}
                  selected={tagColor === color}
                  onPress={() => setTagColor(color)}
                  style={[
                    styles.colorChip,
                    { backgroundColor: color }
                  ]}
                  selectedColor="#FFFFFF"
                  showSelectedCheck={tagColor === color}
                >
                  {' '}
                </Chip>
              ))}
            </View>

            {/* Preview */}
            <View style={styles.preview}>
              <Text variant="labelMedium" style={styles.previewLabel}>Preview:</Text>
              <Chip
                mode="outlined"
                style={[styles.previewChip, { borderColor: tagColor }]}
                textStyle={{ color: tagColor }}
              >
                {tagLabel || 'Tag Name'}
              </Chip>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleCloseDialog} disabled={saving}>
              Cancel
            </Button>
            <Button 
              onPress={handleSaveTag} 
              disabled={saving || !tagLabel.trim()}
              loading={saving}
            >
              {editingTag ? 'Update' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    opacity: 0.7,
  },
  card: {
    marginBottom: 12,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorPreview: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  actions: {
    flexDirection: 'row',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  colorLabel: {
    marginBottom: 12,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  previewLabel: {
    opacity: 0.7,
  },
  previewChip: {
    borderWidth: 2,
  },
});

export default TagsScreen;

