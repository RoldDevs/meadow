import React, { useEffect } from "react";
import * as NavigationBar from 'expo-navigation-bar';
import { StyleSheet, View, Text, Image } from "react-native";
import { useTheme } from "react-native-paper";
import { useColorScheme } from "react-native";

const SplashScreen = ({ navigation }) => {
  const theme = useTheme();
  const styles = createStyles(theme);
  const systemColorScheme = useColorScheme();

  useEffect(() => {
    NavigationBar.setBackgroundColorAsync("#4E6C50");
    NavigationBar.setButtonStyleAsync("light");
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace("Dashboard");
      NavigationBar.setButtonStyleAsync(systemColorScheme === "dark" ? "light" : "dark");
      NavigationBar.setBackgroundColorAsync(theme.colors.background);
    }, 3000); // Display splash screen for 3 seconds

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* App Logo */}
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>
        Meadow
      </Text>
    </View>
  );
};

const createStyles = (theme) => 
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#4E6C50",
      justifyContent: "center",
      alignItems: "center",
    },
    logo: {
      width: 300,
      height: 300,
      marginBottom: 20,
      shadowColor: "#000", 
      shadowOpacity: 0.5, 
      shadowRadius: 4,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#fff",
    },
    subtitle: {
      fontSize: 16,
      color: "#fff",
      marginTop: 10,
    },
  });

export default SplashScreen;
