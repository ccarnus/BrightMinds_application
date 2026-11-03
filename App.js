import React from 'react';
import { StatusBar } from 'react-native';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import MainNavigator from '@navigation/MainNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Custom font families must keep fontWeight 'normal', otherwise Android may fall back to the system font.
const theme = {
  ...MD3LightTheme,
  fonts: Object.fromEntries(
    Object.entries(MD3LightTheme.fonts).map(([variant, font]) => [
      variant,
      typeof font === 'object'
        ? {
            ...font,
            fontFamily: Number(font.fontWeight) >= 500 ? 'MontserratBold' : 'Montserrat',
            fontWeight: 'normal',
          }
        : font,
    ])
  ),
};

const App = () => {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat: Montserrat_400Regular,
    MontserratBold: Montserrat_700Bold,
  });

  // MainNavigator hides the splash screen once the initial route is resolved.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <PaperProvider theme={theme}>
        <MainNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
};

export default App;
