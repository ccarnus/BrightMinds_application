import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainNavigator from './src/navigation/MainNavigator';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const App = () => {
  let [fontsLoaded] = useFonts({
    'Montserrat': Montserrat_400Regular,
    'MontserratBold': Montserrat_700Bold,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Wait for fonts to load here
        await fontsLoaded;
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide the splash screen
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <PaperProvider theme={theme}>
        <MainNavigator />
      </PaperProvider>
    </>
  );
};

const theme = {
  ...DefaultTheme,
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'Montserrat',
      fontWeight: 'normal',
    },
    medium: {
      fontFamily: 'MontserratBold',
      fontWeight: 'normal',
    },
    // Adjust based on your font weights and styles
  },
  // You can also customize colors, roundness, etc.
};

export default App;
