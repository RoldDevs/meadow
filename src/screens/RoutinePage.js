import React, { useState, useEffect } from "react";
import {View,FlatList,StyleSheet, ScrollView, Alert, BackHandler, Pressable} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {Appbar, Button, Text, Surface, Switch, FAB, useTheme, Chip, ActivityIndicator, Checkbox} from "react-native-paper";
import { getAllRoutines, subscribeToRoutines, updateRoutine, deleteRoutine } from "../firebase/services/routinesService";
import { scheduleRoutineNotification, cancelRoutineNotification, requestNotificationPermissions } from "../services/notificationService";
import TopAppBar from "../TopAppBar";

const RoutinePage = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Selection mode states
  const [selectModeEnabled, setSelectModeEnabled] = useState(false);
  const [selectedRoutines, setSelectedRoutines] = useState([]);


  // Request notification permissions on mount
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Load routines from Firebase with real-time updates
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToRoutines((firebaseRoutines, error) => {
      if (error) {
        console.error('Error loading routines:', error);
        setLoading(false);
        return;
      }
      setRoutines(firebaseRoutines);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleFilters = () => setShowFilters(!showFilters);

  const filteredRoutines = selectedDay
    ? routines.filter((routine) => routine.days.includes(selectedDay))
    : routines;

  const toggleRoutine = async (id) => {
    try {
      const routine = routines.find(r => r.id === id);
      if (routine) {
        const newEnabledState = !routine.enabled;
        
        if (newEnabledState) {
          // Enabling routine - schedule notification
          const notificationIds = await scheduleRoutineNotification({
            ...routine,
            enabled: true,
          });
          await updateRoutine(id, { 
            enabled: true, 
            notificationIds: notificationIds || routine.notificationIds 
          });
        } else {
          // Disabling routine - cancel notification
          if (routine.notificationIds) {
            await cancelRoutineNotification(routine.notificationIds);
          }
          await updateRoutine(id, { enabled: false });
        }
        
        // Real-time subscription will update the state automatically
      }
    } catch (error) {
      console.error('Error toggling routine:', error);
      Alert.alert('Error', 'Failed to update routine');
    }
  };

  // Selection mode functions
  const enableSelectMode = (routineId) => {
    setSelectModeEnabled(true);
    setSelectedRoutines([routineId]);
  };

  const disableSelectMode = () => {
    setSelectModeEnabled(false);
    setSelectedRoutines([]);
  };

  const toggleRoutineSelection = (routineId) => {
    setSelectedRoutines(prev =>
      prev.includes(routineId)
        ? prev.filter(id => id !== routineId)
        : [...prev, routineId]
    );
  };

  const deleteSelectedRoutines = async () => {
    if (selectedRoutines.length === 0) {
      Alert.alert("Error", "No routines selected");
      return;
    }

    Alert.alert(
      "Delete Routines",
      `Are you sure you want to delete ${selectedRoutines.length} routine(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Cancel notifications for selected routines
              const cancelPromises = selectedRoutines.map(routineId => {
                const routine = routines.find(r => r.id === routineId);
                if (routine?.notificationIds) {
                  return cancelRoutineNotification(routine.notificationIds);
                }
                return Promise.resolve();
              });
              await Promise.all(cancelPromises);
              
              // Delete routines
              const deletePromises = selectedRoutines.map(routineId => deleteRoutine(routineId));
              await Promise.all(deletePromises);
              
              disableSelectMode();
              Alert.alert("Success", `${selectedRoutines.length} routine(s) deleted successfully`);
            } catch (error) {
              console.error('Error deleting routines:', error);
              Alert.alert('Error', 'Failed to delete routines');
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

  const renderRoutineItem = ({ item }) => {
    const isSelected = selectedRoutines.includes(item.id);
    
    return (
      <Pressable
        onLongPress={() => !selectModeEnabled && enableSelectMode(item.id)}
        onPress={() => {
          if (selectModeEnabled) {
            toggleRoutineSelection(item.id);
          } else {
            // Navigate to edit routine
            navigation.navigate("CreateRoutine", { routine: item, isEdit: true });
          }
        }}
      >
        <Surface 
          style={[
            styles.card,
            isSelected && selectModeEnabled && {
              borderWidth: 2,
              borderColor: theme.colors.primary
            }
          ]}
        >
          <View style={styles.listItem}>
            {selectModeEnabled && (
              <Checkbox
                status={isSelected ? 'checked' : 'unchecked'}
                onPress={() => toggleRoutineSelection(item.id)}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.timeText}>
                {`${item.startTime}${item.endTime ? ` - ${item.endTime}` : ""}`}
              </Text>
              <Text style={styles.daysText}>{item.days.join(", ")}</Text>
            </View>
            {!selectModeEnabled && (
              <Switch
                value={item.enabled}
                onValueChange={() => toggleRoutine(item.id)}
              />
            )}
          </View>
        </Surface>
      </Pressable>
    );
  };

  const rightButtons = selectModeEnabled
    ? [
        { icon: "delete", action: () => deleteSelectedRoutines() },
        { icon: "close", action: () => disableSelectMode() }
      ]
    : [];

  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Routine"
        rightButtons={rightButtons}
      />
      {selectModeEnabled && (
        <View style={[styles.selectionBanner, { backgroundColor: theme.colors.errorContainer }]}>
          <Text style={{ color: theme.colors.onErrorContainer, textAlign: "center", margin: 3 }}>
            {selectedRoutines.length} routine(s) selected
          </Text>
        </View>
      )}
      { showFilters && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dayButtonsContainer}
          >
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
              <Chip
                key={index}
                mode="outlined"
                compact="true"
                selected={selectedDay != null && selectedDay.includes(day)}
                showSelectedOverlay="false"
                onPress={() => setSelectedDay(selectedDay === day ? null : day)}
                style={styles.tagChips}
              >
                {day}
              </Chip>
            ))}
          </ScrollView>

          {selectedDay && (
            <Button
              mode="text"
              onPress={() => setSelectedDay(null)}
              style={styles.clearFilter}
              compact
            >
              Clear Filter
            </Button>
          )}
        </View>
      )}

      {loading ? (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100}}>
          <ActivityIndicator size="large" />
          <Text style={{marginTop: 10}}>Loading routines...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredRoutines}
          keyExtractor={(item) => item.id}
          renderItem={renderRoutineItem}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>
              No routines for the selected day.
            </Text>
          )}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("CreateRoutine")}
      />
    </>

  );
};

const styles = StyleSheet.create({
  selectionBanner: {
    paddingVertical: 4,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  dayButtonsContainer: {
    flexDirection: "row",
    paddingVertical: 6,
    alignItems: "center",
  },
  dayButton: {
    marginRight: 8,
    borderRadius: 20,
  },
  clearFilter: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 3,
    borderRadius: 14,
  },
  listItem: {
    padding: 16,
  },
  title: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
  },
  daysText: {
    fontSize: 13,
    marginTop: 2,
    marginBottom: 6,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  fab:{
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  tagChips:{
    marginLeft:2,
    marginRight:2,
  },
});

export default RoutinePage;
