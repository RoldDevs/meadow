import { StyleSheet } from 'react-native';

const navigationStyles = StyleSheet.create({
  dashboardHeader: {
    backgroundColor: '#4B553A', // Remove default header background
    height: 70, // Increase height to cover the background
    borderBottomEndRadius: 20,
    borderBottomStartRadius: 20,
    shadowColor: 'transparent', // Remove shadow
    elevation: 0, // Remove elevation on Android
  },
  headerTitleStyle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default navigationStyles;
