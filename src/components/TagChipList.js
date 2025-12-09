import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Chip, Button, Text } from "react-native-paper";

const TagChipList = ({
  tags, 
  selectedTags, 
  mostUsedTags, 
  showTags,
  setShowTags,
  createTagAlwaysVisible, 
  whenTagSelected, 
  mode,
  clearAllTagsBehavior,
  onCreateTag
}) => {
  const styles = createStyles();

  const toggleChipList = () => setShowTags(prev => !prev);
  
  const items = (tags, mostUsedTags, showTags) => {
    if(mode === "single"){
      return tags;
    } else if(mode === "double"){
      return !showTags ? mostUsedTags : tags;
    }
  }

  const renderTagChip = (tag, index) => {
    // Handle both string tags and object tags {id, label, color}
    const tagLabel = typeof tag === 'string' ? tag : tag.label || tag;
    const tagValue = typeof tag === 'string' ? tag : tag.id || tag.label || tag;
    const tagColor = typeof tag === 'object' && tag.color ? tag.color : undefined;
    
    return(
      <Chip
        mode="outlined"
        compact="true"
        selected={selectedTags.includes(tagValue) || selectedTags.includes(tagLabel)}
        showSelectedOverlay="true"
        onPress={() => whenTagSelected(tagValue)}
        style={[
          styles.tagChips,
          tagColor ? { backgroundColor: tagColor, borderColor: tagColor } : undefined
        ]}
        textStyle={tagColor ? { color: '#FFFFFF' } : undefined}
      >
        {tagLabel}
      </Chip>
    )
  }

  const tagItems = items(tags, mostUsedTags, showTags) || [];
  
  return(
    <View style={styles.container}>
      {/* Selected tags - horizontal scrollable list (only when tags are hidden) */}
      {selectedTags.length > 0 && !showTags && mode !== "double" && (
        <View style={styles.selectedTagsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalChipContainer}
          >
            {selectedTags.map((tag, index) => (
              <View key={`selected-${tag}-${index}`} style={styles.chipMargin}>
                {renderTagChip(tag, index)}
              </View>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* All tags - grid layout using flexWrap (only when showTags is true) */}
      {showTags && (
        <ScrollView 
          style={styles.chipListScrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chipListContainer}>
            {tagItems.length > 0 ? (
              tagItems.map((tag, index) => (
                <View key={`tag-${tag}-${index}`} style={styles.chipWrapper}>
                  {renderTagChip(tag, index)}
                </View>
              ))
            ) : (
              <Text style={styles.emptyTaskText}>You have no tags yet.</Text>
            )}
          </View>
        </ScrollView>
      )}
      
      {/* Control buttons */}
      <View style={styles.horizontalContainer}>
        <Button 
          mode="text" 
          icon={showTags ? "chevron-up" : "chevron-down"} 
          onPress={toggleChipList}
          compact
        >
          {showTags ? "Hide tags" : "Show tags"}
        </Button>
        {clearAllTagsBehavior && selectedTags.length > 0 && (
          <Button 
            mode="text" 
            icon="close" 
            onPress={() => clearAllTagsBehavior()}
            compact
          >
            Clear all
          </Button>
        )}
        {(showTags || createTagAlwaysVisible) && (
          <Button 
            mode="text" 
            icon="plus" 
            onPress={onCreateTag || (() => {})} 
            compact
          >
            Create tag
          </Button>
        )}
      </View>
    </View>
  );
};

const createStyles = () => 
  StyleSheet.create({
    container: {
      width: "100%",
    },
    selectedTagsContainer: {
      marginBottom: 8,
      maxHeight: 50,
    },
    chipListScrollView: {
      maxHeight: 200,
      marginBottom: 8,
    },
    chipListContainer:{
      flexDirection: "row",
      flexWrap: "wrap",
    },
    horizontalChipContainer:{
      flexDirection: "row",
      alignItems: "center",
      paddingRight: 8,
    },
    chipWrapper:{
      width: "33%",
      padding: 4,
    },
    chipMargin: {
      marginRight: 8,
    },
    tagChips:{
      margin: 0,
    },
    horizontalContainer:{
      flexDirection:"row",
      flexWrap: "wrap",
      alignItems: "center",
      marginTop: 4,
      marginBottom: 4,
      gap: 4,
    },
    emptyTaskText: {
      textAlign: 'center',
      padding: 16,
      opacity: 0.6,
      width: "100%",
    }
  });

export default TagChipList;