import React, {useState, useEffect, useCallback, useMemo} from 'react';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { NavigationContainer, DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme} from '@react-navigation/native';
import { MD3LightTheme, MD3DarkTheme, PaperProvider, adaptNavigationTheme } from 'react-native-paper';

import StackNavigation from './StackNavigation';

//utils
import merge from 'deepmerge';
import { en as enUS, registerTranslation } from 'react-native-paper-dates'
registerTranslation('en', enUS);

//contexts
import { PreferencesContext } from './contexts/PreferencesContext';

//providers
import { TimerProvider } from "./contexts/TimerContext";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { seedFirestore } from '../scripts/seedFirestore';

//colors, theming, etc.
import { useColorScheme } from 'react-native';
import { useMaterial3Theme } from '@pchmn/expo-material3-theme';
import meadowlight from '../assets/custom-colors/meadow-light.json'
import meadowlight_mediumcontrast from '../assets/custom-colors/meadow-light-medium-contrast.json'
import meadowdark from '../assets/custom-colors/meadow-dark.json'
import meadowdark_mediumcontrast from '../assets/custom-colors/meadow-dark-medium-contrast.json'
import sophialight from '../assets/custom-colors/sophia-light.json'
//combining react native paper theme with react navigation theme
const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
});
const CombinedLightTheme = merge(MD3LightTheme, LightTheme);
const CombinedDarkTheme = merge(MD3DarkTheme, DarkTheme);

//! app
export default function App() {

  //customizing the colors - per app preference
  const themelight = {
    ...CombinedLightTheme,
    colors: meadowlight_mediumcontrast.colors
  }
  const themedark = {
    ...CombinedDarkTheme,
    colors: meadowdark_mediumcontrast.colors
  }

  // Real-time darkmode/lightmode changing
  const systemColorScheme = useColorScheme();
  const [isThemeDark, setIsThemeDark] = useState(systemColorScheme === "dark");
  //console.log("systemColorScheme: " + systemColorScheme)

  useEffect(() => {
    setIsThemeDark(systemColorScheme === "dark");
  }, [systemColorScheme]);

  // Initialize Firestore collections with seed data (only once)
  useEffect(() => {
    const initializeCollections = async () => {
      try {
        // Seed collections with initial data if they're empty
        await seedFirestore();
      } catch (error) {
        // Silently fail - collections might already exist or will be created on first use
        console.log('Firestore seeding:', error.message || 'Collections already initialized');
      }
    };
    
    // Small delay to ensure Firebase is initialized
    const timer = setTimeout(() => {
      initializeCollections();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsThemeDark(prev => !prev);
  }, []);

  const preferences = useMemo(
    () => ({ toggleTheme, isThemeDark }),
    [toggleTheme, isThemeDark]
  );
  
  //console.log("shouldThemeBeDark?: " + isThemeDark)
  let theme = isThemeDark ? themedark : themelight;
  useEffect(() => {
    NavigationBar.setBackgroundColorAsync(theme.colors.background);
    NavigationBar.setButtonStyleAsync(systemColorScheme === "dark" ? "light" : "dark");
  }, [isThemeDark]);

  return (
    <FirebaseProvider>
      <PreferencesContext.Provider value={preferences}>
        <SafeAreaProvider>
          <PaperProvider theme={theme}>
            <StatusBar style={systemColorScheme === "dark" ? "light" : "dark"} />
            <TimerProvider>
            <NavigationContainer theme={theme}>
              <StackNavigation/>
            </NavigationContainer>
            </TimerProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </PreferencesContext.Provider>
    </FirebaseProvider>
  );
}

