import React, { useState, useEffect } from "react";
import {View,StyleSheet,Alert, SafeAreaView,Platform,StatusBar,} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {Button,Card,IconButton,Text,useTheme,
  MD3LightTheme as DefaultTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import Icon from "react-native-vector-icons/Feather";
import { useTimer } from "../contexts/TimerContext";
import TopAppBar from "../TopAppBar";

const TimerScreen = () => {
  const theme = useTheme();

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const navigation = useNavigation();
  const { startTimer, isRunning } = useTimer();


  const showInfo = () => {
    Alert.alert(
      "Pomodoro Technique 🍅",
      "The Pomodoro Technique helps you stay productive using timed focus sessions followed by short breaks.",
      [{ text: "Got it", style: "cancel" }]
    );
  };

  const increaseFocusTime = () => setFocusMinutes((prev) => Math.min(prev + 1, 60));
  const decreaseFocusTime = () => setFocusMinutes((prev) => Math.max(prev - 1, 1));
  const increaseBreakTime = () => setBreakMinutes((prev) => Math.min(prev + 1, 30));
  const decreaseBreakTime = () => setBreakMinutes((prev) => Math.max(prev - 1, 1));

  const renderTimerCard = (label, time, increase, decrease) => (
    <Card style={styles.timerCard}>
      <Card.Title
        title={label}
        titleStyle={styles.cardTitle}
        left={(props) => (
          <Icon {...props} color={theme.colors.primary} name={label.includes("Focus") ? "clock" : "coffee"} size={24} />
        )}
      />
      <Card.Content style={styles.cardContent}>
        <IconButton icon="chevron-up" onPress={increase} size={28} />
        <Text variant="headlineMedium" style={styles.timeText}>
          {time} mins
        </Text>
        <IconButton icon="chevron-down" onPress={decrease} size={28} />
      </Card.Content>
    </Card>
  );

  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Customize Your Session"
        rightButtons={[
          {
            icon: "information-outline",
            action: showInfo
          }
        ]}
      />
      <View style={styles.container}>
        <Text variant="titleLarge" style={styles.title}>
          Customize Your Session 🍃
        </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Adjust focus and break durations before starting.
      </Text>

      {renderTimerCard("Focus Time", focusMinutes, increaseFocusTime, decreaseFocusTime)}
      {renderTimerCard("Break Time", breakMinutes, increaseBreakTime, decreaseBreakTime)}

      <Button
        mode="contained"
        icon="play"
        style={styles.startButton}
        onPress={() => {
          startTimer(focusMinutes * 60, "Work");
          navigation.navigate("Countdown", { focusMinutes, breakMinutes });
        }}
      >
        {isRunning ? "Restart Timer" : "Start Focus Session"}
      </Button>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    
  },
  title: {
    textAlign: "center",
    marginBottom: 10,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 30,
  },
  timerCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeText: {
    marginHorizontal: 16,
    fontWeight: "bold",
  },
  startButton: {
    alignSelf: "center",
  },
});

export default TimerScreen;
