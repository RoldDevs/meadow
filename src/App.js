import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { AppState } from 'react-native';
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
import { startTimeTracking, endTimeTracking, cleanupOldStats } from './services/timeTrackingService';
import { setupNotificationChannels, requestNotificationPermissions } from './services/notificationService';

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
        // Request notification permissions
        await requestNotificationPermissions();
        // Setup notification channels
        await setupNotificationChannels();
        // Seed collections with initial data if they're empty
        await seedFirestore();
        // Clean up old time tracking stats
        await cleanupOldStats();
      } catch (error) {
        // Silently fail - collections might already exist or will be created on first use
        console.log('Initialization:', error.message || 'Already initialized');
      }
    };
    
    // Small delay to ensure Firebase is initialized
    const timer = setTimeout(() => {
      initializeCollections();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Track app usage time
  const appState = useRef(AppState.currentState);
  
  useEffect(() => {
    // Start tracking when app opens
    startTimeTracking();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        startTimeTracking();
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        endTimeTracking();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      // End tracking when app closes
      endTimeTracking();
    };
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

