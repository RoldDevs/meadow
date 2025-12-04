import { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
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
  clearAllTagsBehavior
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
    return(
      <Chip
        mode="outlined"
        compact="true"
        selected={selectedTags.includes(tag)}
        showSelectedOverlay="true"
        onPress={() => whenTagSelected(tag)}
        style={styles.tagChips}
      >
        {tag}
      </Chip>
    )
  }

  return(
    <>
      {/*
        //! horizontal and vertical flatlists needs to be separated and rendered like this because it gets icky when you change it on the fly
      */}
      {(selectedTags.length > 0 && !showTags && mode != "double") && 
        <FlatList
          data={selectedTags}
          style={styles.chipList}
          contentContainerStyle={{flexDirection:"row", gap: 8}}
          showsHorizontalScrollIndicator={false}
          horizontal
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item: tag, index }) => renderTagChip(tag, index)}
          ListEmptyComponent={()=>(
            <Text style={styles.emptyTaskText}> You have no tags yet. </Text>
          )}
        />
      }
      {(showTags || mostUsedTags) && 
        <FlatList
          data={items(tags, mostUsedTags, showTags)}
          numColumns={3}
          style={styles.chipList}
          contentContainerStyle={styles.chipListContainer}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item: tag, index }) => renderTagChip(tag, index)}
          ListEmptyComponent={()=>(
            <Text style={styles.emptyTaskText}> You have no tags yet. </Text>
          )}
        />
      }
      <View style={styles.horizontalContainer}>
        <Button mode="text" icon={showTags ? "chevron-up" : "chevron-down"} onPress={toggleChipList}>
          {showTags ? "Hide tags" : "Show tags"}
        </Button>
        { (clearAllTagsBehavior && selectedTags.length > 0) && 
          <Button mode="text" icon="close" onPress={() => clearAllTagsBehavior()}>
            {"Clear all selected tags"}
          </Button>
        }
        { (showTags || createTagAlwaysVisible) && 
          <Button mode="text" icon="plus" onPress={()=>{}} style={styles.buttons}>
            Create a new tag
          </Button>
        }
      </View>
      
    </>
  );
};

const createStyles = () => 
  StyleSheet.create({
    chipList:{
      flexGrow: 0,
      flexShrink: 0,
      maxHeight: 180,
      width:"100%",
    },
    chipListContainer:{
      flexDirection: "column",
      gap: 8
    },
    tagChips:{
      marginLeft:2,
      marginRight:2,
    },
    buttons:{
      alignSelf:"flex-start"
    },
    horizontalContainer:{
      flexDirection:"row",
      flexWrap: "wrap"
    }
  });

export default TagChipList;