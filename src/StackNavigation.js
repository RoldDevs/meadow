import React from "react";
import { StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { View } from "react-native";
import TopAppBar from './TopAppBar'

//screens
import DashboardScreen from './screens/DashboardScreen';
import TaskScreen from "./screens/TaskScreen";
import TimerScreen from "./screens/TimerScreen";
import NotesPage from "./screens/NotesPage";
import RoutinePage from "./screens/RoutinePage";
import SplashScreen from "./screens/SplashScreen";
import AchievementsScreen from "./screens/AchievementScreen";
//subscreens
import CreateTask from './screens/tasks/CreateTask';
import CountdownScreen from "./screens/timer/CountdownScreen";
import AddNotePage from "./screens/notes/AddNoteScreen";
import CreateRoutinePage from "./screens/routines/CreateRoutinePage";

//styles
//import navigationStyles from "./assets/Styles/navigationStyles";
import { useTheme } from "react-native-paper";

const Stack = createStackNavigator();

const StackNavigation = () => {
  const theme = useTheme();
  const styles = createStyles(theme);

	return (
    <View style={{flex:1,backgroundColor:theme.colors.background}}>
      <Stack.Navigator 
        screenOptions={{
          animation:'default'
        }}
      >
        {/* Splash screen */}
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        {/* Dashboard screen */}
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{ headerShown: false }}
          // options={{
          //   headerTitle: "Meadow",
          // }}
        />
        {/* Task Screen */}
        <Stack.Screen
          name="Task"
          component={TaskScreen}
          options={{ headerShown: false }}
          // options={{
          //   headerTitle: "Tasks",
          //   headerTitleStyle: styles.headerStyle,
          // }}
        />
        {/* Timer Screen */}
        <Stack.Screen
          name="Timer"
          component={TimerScreen}
          options={{ headerShown: false }}
          // options={{ headerTitle: "Pomodoro" }}
        />
        {/* Notes Page */}
        <Stack.Screen
          name="Notes"
          component={NotesPage}
          options={{ headerShown: false }}
          // options={{ headerTitle: "Smart Notes" }}
        />
        {/* Routine Page */}
        <Stack.Screen
          name="Routine"
          component={RoutinePage}
          options={{ headerShown: false }}
        />
        {/* Achievement Page */}
        <Stack.Screen
          name="Achieve"
          component={AchievementsScreen}
          options={{ headerShown: false }}
          // options={{ headerTitle: "Achievements" }}
        />

        {/* //! Subscreens here: */}
        {/* Create Task Screen */}
        <Stack.Screen
          name="Create"
          component={CreateTask}
          options={{ headerShown: false }}
          // options={{
          //   headerTitle:"Create a new task"
          // }}
        />
        {/* Create Routine Page */}
        <Stack.Screen
          name="CreateRoutine"
          component={CreateRoutinePage}
        />
        {/* Add Note Page */}
        <Stack.Screen
          name="Add"
          component={AddNotePage}
          options={{ headerTitle: "Add Smart Note" }}
        />
        {/* Countdown Screen */}
        <Stack.Screen
          name="Countdown"
          component={CountdownScreen}
          options={{ headerTitle: "Pomodoro" }}  // Added header title
        />
        
      </Stack.Navigator>
    </View>
	);
};

const createStyles = (theme) => 
  StyleSheet.create({
    meadowStyle: {
      color: theme.colors.onSurface,
      fontSize: 25,
      fontWeight: 'bold',
      fontStyle: 'italic',
    },
    headerStyle:{
      color: theme.colors.onSurface,
    }
  });

export default StackNavigation;