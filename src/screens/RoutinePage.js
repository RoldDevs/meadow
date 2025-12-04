import React, { useState, useEffect } from "react";
import {View,FlatList,StyleSheet, ScrollView, Alert} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {Appbar, Button, Text, Surface, Switch, FAB, useTheme, Chip, ActivityIndicator} from "react-native-paper";
import { getAllRoutines, subscribeToRoutines, updateRoutine } from "../firebase/services/routinesService";
import TopAppBar from "../TopAppBar";

const RoutinePage = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showFilters, setShowFilters] = useState(true);


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
        await updateRoutine(id, { enabled: !routine.enabled });
        // Real-time subscription will update the state automatically
      }
    } catch (error) {
      console.error('Error toggling routine:', error);
      Alert.alert('Error', 'Failed to update routine');
    }
  };

  const renderRoutineItem = ({ item }) => (
    <Surface style={styles.card}>
      <View style={styles.listItem}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.timeText}>
          {`${item.startTime}${item.endTime ? ` - ${item.endTime}` : ""}`}
        </Text>
        <Text style={styles.daysText}>{item.days.join(", ")}</Text>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleRoutine(item.id)}
        />
      </View>
    </Surface>
  );

  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Routine"
      />
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
