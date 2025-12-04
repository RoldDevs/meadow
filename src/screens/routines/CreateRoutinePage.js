import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import {TextInput,Button,Switch,Text,Card, Chip,
  Provider as PaperProvider,
  MD3LightTheme as DefaultTheme, useTheme, ActivityIndicator
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { createRoutine } from "../../firebase/services/routinesService";

const CreateRoutinePage = ({ route, navigation }) => {
  const theme = useTheme();

  useEffect(()=>{
    navigation.setParams({ checkButtonBehavior: handleSave})
  },[handleSave, name, days, startTime, endTime, includeEndTime]);

  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [includeEndTime, setIncludeEndTime] = useState(true);
  const [days, setDays] = useState([]);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Routine name cannot be empty!");
      return;
    }
    if (days.length === 0) {
      Alert.alert("Error", "Please select at least one day!");
      return;
    }

    setSaving(true);
    try {
      await createRoutine({
        name: name.trim(),
        startTime: startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        endTime: includeEndTime
          ? endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : null,
        days,
        enabled: true,
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error creating routine:', error);
      Alert.alert("Error", "Failed to save routine. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (

      <ScrollView contentContainerStyle={styles.container}>
        <TextInput
          label="Routine Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <Button
          mode="text"
          onPress={() => setShowStartPicker(true)}
          style={styles.timeButton}
          icon="clock-outline"
        >
          Start Time: {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Button>
        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false);
              if (date) setStartTime(date);
            }}
          />
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Include End Time</Text>
          <Switch
            value={includeEndTime}
            onValueChange={setIncludeEndTime}
            color={theme.colors.primary}
          />
        </View>

        {includeEndTime && (
          <>
            <Button
              mode="text"
              onPress={() => setShowEndPicker(true)}
              style={styles.timeButton}
              icon="clock-outline"
            >
              End Time: {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Button>
            {showEndPicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                is24Hour={false}
                display="default"
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setEndTime(date);
                }}
              />
            )}
          </>
        )}

        <Card style={styles.card}>
          <Card.Title title="Select Days" titleStyle={{ fontSize: 16 }} />
          <Card.Content style={styles.daysContainer}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
              <Chip
                key={index}
                mode="outlined"
                compact="true"
                selected={days && days.includes(day)}
                showSelectedOverlay="false"
                onPress={() => toggleDay(day)}
                style={styles.tagChips}
              >
                {day}
              </Chip>
              
            ))}
          </Card.Content>
        </Card>

        {/* <Button
          mode="contained"
          onPress={handleSave}
          style={styles.saveButton}
          labelStyle={styles.saveButtonText}
        >
          Save Routine
        </Button> */}

      </ScrollView>

  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
  },
  input: {
    marginBottom: 16,
  },
  timeButton: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  daysContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 8,
    gap: 5,
  },
  dayButton: {
    margin: 4,
    borderRadius: 20,
  },
  saveButton: {
    marginTop: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
  },
});

export default CreateRoutinePage;
