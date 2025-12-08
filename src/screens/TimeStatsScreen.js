import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Card, Text, Button, ProgressBar, Surface, useTheme, TextInput, Dialog, Portal } from 'react-native-paper';
import TopAppBar from '../TopAppBar';
import { 
  getTodayStats, 
  getWeeklyStats, 
  getWeeklyAverage, 
  getDailyGoal, 
  setDailyGoal, 
  hasExceededGoal 
} from '../services/timeTrackingService';

const TimeStatsScreen = ({ navigation }) => {
  const theme = useTheme();
  const [todayStats, setTodayStats] = useState({ formattedTime: '0m', totalSeconds: 0 });
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [weeklyAverage, setWeeklyAverage] = useState({ formattedTime: '0m' });
  const [dailyGoal, setDailyGoalState] = useState(30);
  const [goalProgress, setGoalProgress] = useState({ percentage: 0, exceeded: false });
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialog states
  const [goalDialogVisible, setGoalDialogVisible] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState('30');

  const loadStats = async () => {
    try {
      const [today, weekly, average, goal, progress] = await Promise.all([
        getTodayStats(),
        getWeeklyStats(7),
        getWeeklyAverage(),
        getDailyGoal(),
        hasExceededGoal(),
      ]);

      setTodayStats(today);
      setWeeklyStats(weekly);
      setWeeklyAverage(average);
      setDailyGoalState(goal);
      setGoalProgress(progress);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
    
    // Refresh stats every minute when screen is visible
    const interval = setInterval(loadStats, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleSetGoal = async () => {
    const newGoal = parseInt(newGoalInput);
    if (isNaN(newGoal) || newGoal <= 0) {
      return;
    }

    await setDailyGoal(newGoal);
    setDailyGoalState(newGoal);
    setGoalDialogVisible(false);
    loadStats();
  };

  const getProgressColor = () => {
    if (goalProgress.percentage < 50) return theme.colors.primary;
    if (goalProgress.percentage < 80) return theme.colors.tertiary;
    if (goalProgress.percentage < 100) return '#FFA726';
    return theme.colors.error;
  };

  return (
    <>
      <TopAppBar
        onBack={() => navigation.goBack()}
        title="Time Management"
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Today's Usage */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Today's Usage</Text>
            <View style={styles.statRow}>
              <Text variant="displaySmall" style={{ color: getProgressColor() }}>
                {todayStats.formattedTime}
              </Text>
              <Text variant="bodyMedium" style={styles.goalText}>
                Goal: {dailyGoal} minutes
              </Text>
            </View>
            <ProgressBar
              progress={goalProgress.percentage / 100}
              style={styles.progressBar}
              color={getProgressColor()}
            />
            {goalProgress.exceeded && (
              <Text variant="bodySmall" style={[styles.warningText, { color: theme.colors.error }]}>
                ⚠️ You've exceeded your daily goal
              </Text>
            )}
            <Button
              mode="outlined"
              onPress={() => {
                setNewGoalInput(dailyGoal.toString());
                setGoalDialogVisible(true);
              }}
              style={styles.button}
            >
              Set Daily Goal
            </Button>
          </Card.Content>
        </Card>

        {/* Weekly Average */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>Weekly Average</Text>
            <Text variant="displaySmall" style={{ color: theme.colors.primary }}>
              {weeklyAverage.formattedTime}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              per day (last 7 days)
            </Text>
          </Card.Content>
        </Card>

        {/* Weekly Breakdown */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>This Week</Text>
            {weeklyStats.map((day, index) => (
              <View key={index} style={styles.dayRow}>
                <View style={styles.dayInfo}>
                  <Text variant="bodyLarge">{day.dayName}</Text>
                  <Text variant="bodySmall" style={styles.dateText}>{day.date}</Text>
                </View>
                <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                  {day.formattedTime}
                </Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Tips */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.cardTitle}>💡 Tips to Minimize Time</Text>
            <View style={styles.tipItem}>
              <Text variant="bodyMedium">• Use the Pomodoro timer for focused work sessions</Text>
            </View>
            <View style={styles.tipItem}>
              <Text variant="bodyMedium">• Set clear tasks with subtasks to stay organized</Text>
            </View>
            <View style={styles.tipItem}>
              <Text variant="bodyMedium">• Use routines to automate your daily schedule</Text>
            </View>
            <View style={styles.tipItem}>
              <Text variant="bodyMedium">• Review completed tasks at the end of each day</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Set Goal Dialog */}
      <Portal>
        <Dialog visible={goalDialogVisible} onDismiss={() => setGoalDialogVisible(false)}>
          <Dialog.Title>Set Daily Goal</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Goal (minutes)"
              value={newGoalInput}
              onChangeText={setNewGoalInput}
              keyboardType="numeric"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setGoalDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleSetGoal}>Set Goal</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
  },
  statRow: {
    marginBottom: 16,
  },
  goalText: {
    marginTop: 8,
    opacity: 0.7,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  warningText: {
    marginBottom: 8,
  },
  button: {
    marginTop: 8,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayInfo: {
    flexDirection: 'column',
  },
  dateText: {
    opacity: 0.6,
    marginTop: 2,
  },
  tipItem: {
    marginBottom: 8,
  },
});

export default TimeStatsScreen;

