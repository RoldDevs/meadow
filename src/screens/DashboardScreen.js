import React from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import { Avatar, Button, Card, IconButton, Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "react-native-paper";

import { useTimer } from "../contexts/TimerContext";

const Dashboard = () => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation();
  const { remainingTime, phase, isRunning, stopTimer } = useTimer();

  //import the covers here
  //the covers are required to be initalized at startup before they can be displayed like this (as far as i know)
  const covers = {
    "dashboard": require("../../assets/dashboard/tasks-cover.jpg")
  }
  
  //options
  const showAllIcons = true; //this is for debugging only - no state needed
  const showCovers = false;

  const [breakMinutes, setBreakMinutes] = React.useState(5); //! TEMPORARY FIX pls change ltr

  const dashboardItems = [
    {
      id:1,
      title:"Tasks",
      icon:"clipboard-text",
      showIcon:true,
      cover:"dashboard",
      route:"Task"
    },
    {
      id:2,
      title:"Smart Notes",
      icon:"note",
      showIcon:true,
      cover:"dashboard",
      route:"Notes"
    },
    {
      id:3,
      title:"Routines",
      icon:"flag",
      showIcon:true,
      cover:"dashboard",
      route:"Routine"
    },
    {
      id:4,
      title:"Time Management",
      icon:"clipboard-text",
      showIcon:true,
      cover:"dashboard",
      route: "Timer"
    },
    // {
    //   id:5,
    //   title:"Achievements",
    //   icon:"trophy",
    //   showIcon:true,
    //   cover:"dashboard",
    //   route:"Achieve"
    // },
  ]
  
  const DashboardCard = ({item}) => {
    // Handle navigation based on timer state
    const handleCardPress = () => {
      if (item.route === "Timer" && isRunning) {
        // If timer is running, navigate to countdown screen
        navigation.navigate("Countdown", { focusMinutes: 25, breakMinutes: breakMinutes });
      } else {
        // Normal navigation
        navigation.navigate(item.route);
      }
    };

    return(
      <Card
        key={item.id}
        mode={'elevated'}
        onPress={handleCardPress}
      >
        {item.cover && showCovers &&
          <View style={styles.cardFilter}>
            <Card.Cover source={ covers[item.cover] } style={{height: 100}}/>
          </View>
        }
        <Card.Title
          title={item.title}
          subtitle="Card Subtitle"
          left={item.showIcon && showAllIcons && ((props) => <Avatar.Icon {...props} icon={item.icon} />)}
          // right={(props) => <IconButton {...props} icon="dots-vertical" onPress={() => {}} />}
        />
      </Card>
    )
  }
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  //! main renderer
  return(
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Meadow</Text>

      <FlatList
        data={dashboardItems}
        renderItem={DashboardCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.dashboardListContainer}
        style={styles.dashboardList}
        showsVerticalScrollIndicator={false}
      />

      {isRunning && (
        <Pressable onPress={() => navigation.navigate("Countdown", { focusMinutes: 25, breakMinutes: breakMinutes })}>
          <Card style={{ marginBottom: 10 }}>
            <Card.Title
              title={`Current Session: ${phase}`}
              subtitle={`Time Remaining: ${formatTime(remainingTime)}`}
              left={(props) => <Avatar.Icon {...props} icon="clock-outline" />}
              right={(props) => <IconButton {...props} icon="close" iconColor={theme.colors.error} onPress={() => stopTimer()} />}
            />
          </Card>
        </Pressable>
      )}

      {/* DEBUGGING */}
      {false && (
        <Button mode="contained-tonal" buttonColor={theme.colors.errorContainer} textColor={theme.colors.onError} onPress={() => {navigation.navigate("Splash")}}>
          TEST: Show SplashScreen
        </Button>
      )}
      
    </View>
  );
}

const createStyles = (theme) => 
  StyleSheet.create({
    container:{
      backgroundColor: theme.colors.background,
      flex: 1,
      paddingLeft: 16,
      paddingRight: 16,
    },
    dashboardList:{
      width: '100%', marginBottom: 5, borderRadius: 12
    },
    dashboardListContainer:{
      gap:8,
      paddingLeft: 4,
      paddingRight: 4
    },
    cardFilter:{
      opacity:0.3,
      backgroundColor: theme.colors.primary,
      borderRadius: 9
    },
    headerTitle:{
      textAlign:'center',
      fontSize:28,
      paddingTop:45,
      paddingBottom:25
    }
  });

export default Dashboard;