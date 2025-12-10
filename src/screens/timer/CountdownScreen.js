import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions, Vibration, BackHandler } from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { Text, Button, Surface, useTheme } from "react-native-paper";
import { Audio } from "expo-av";
import { useTimer } from "../../contexts/TimerContext";
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const CountdownScreen = ({ route, navigation }) => {
  const theme = useTheme();
  
  const { focusMinutes, breakMinutes } = route.params;
  const [key, setKey] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [localPhase, setLocalPhase] = useState("Work");
  const { startTimer, stopTimer, remainingTime, phase: contextPhase, isRunning } = useTimer();

  const soundRef = useRef(null);

  // Sync local phase with context phase
  useEffect(() => {
    if (contextPhase) {
      setLocalPhase(contextPhase);
    }
  }, [contextPhase]);

  useEffect(() => {
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("../../../assets/Sound/lol.wav")
      );
      soundRef.current = sound;
    };

    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playSoundAndVibrate = async () => {
    try {
      Vibration.vibrate(500);
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.warn("Error playing sound:", error);
    }
  };

  const handleComplete = async () => {
    await playSoundAndVibrate();

    if (localPhase === "Work") {
      setLocalPhase("Break");
      startTimer(breakMinutes * 60, "Break");
      setKey((prev) => prev + 1);
      return { shouldRepeat: true, newInitialRemainingTime: breakMinutes * 60 };
    } else {
      setLocalPhase("Work");
      startTimer(focusMinutes * 60, "Work");
      setKey((prev) => prev + 1);
      return { shouldRepeat: true, newInitialRemainingTime: focusMinutes * 60 };
    }
  };

  const handleStop = async () => {
    await stopTimer();
    navigation.goBack();
  };

  // Handle back button - pause timer instead of stopping
  useEffect(() => {
    const backAction = () => {
      setIsPlaying(false); // Pause the timer
      navigation.goBack();
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.phaseText}>
        {localPhase} Time
      </Text>

      <CountdownCircleTimer
        key={key}
        isPlaying={isPlaying}
        duration={localPhase === "Work" ? focusMinutes * 60 : breakMinutes * 60}
        colors={[localPhase === "Work" ? theme.colors.primary : theme.colors.tertiary]}
        trailColor="#D3D3D3"
        strokeWidth={12}
        size={width * 0.7}
        onComplete={handleComplete}
      >
        {({ remainingTime: circleTime }) => {
          // Use context remainingTime if available, otherwise use circle time
          const displayTime = isRunning ? remainingTime : circleTime;
          const mins = Math.floor(displayTime / 60);
          const secs = displayTime % 60;
          return (
            <Text variant="displayMedium" style={styles.timerText}>
              {`${mins}:${secs < 10 ? "0" : ""}${secs}`}
            </Text>
          );
        }}
      </CountdownCircleTimer>

      <Surface style={styles.controls} elevation={0}>
        <Button
          mode="contained"
          icon={isPlaying ? "pause" : "play"}
          onPress={() => setIsPlaying(!isPlaying)}
          style={styles.controlButton}
          buttonColor={theme.colors.primary}
        >
          {isPlaying ? "Pause" : "Resume"}
        </Button>

        <Button
          mode="contained"
          icon="refresh"
          onPress={() => setKey((prev) => prev + 1)}
          style={styles.controlButton}
          buttonColor={theme.colors.secondary}
        >
          Reset
        </Button>

        <Button
          mode="contained"
          icon="close"
          onPress={() => handleStop()}
          style={styles.controlButton}
          buttonColor={theme.colors.tertiary}
        >
          Stop
        </Button>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  phaseText: {
    marginBottom: 20,
    textAlign: "center",
  },
  timerText: {
    fontWeight: "bold",
  },
  controls: {
    marginTop: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: 10,
    borderRadius: 16,
  },
  controlButton: {
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 25,
  },
});

export default CountdownScreen;
