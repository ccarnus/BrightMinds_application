import React from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { useFonts, Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import MainNavigator from '@navigation/MainNavigator';
import ErrorBoundary from '@shared/components/ErrorBoundary';
import OfflineBanner from '@shared/components/OfflineBanner';
import { colors, fonts } from '@shared/config/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Brand colors instead of Paper's default purple, so inputs, dialogs and text buttons match the app.
// Custom font families must keep fontWeight 'normal', otherwise Android may fall back to the system font.
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.accent,
    onPrimary: colors.textOnColor,
    primaryContainer: '#d6e4f2',
    onPrimaryContainer: colors.accent,
    inversePrimary: '#9cc4ea',
    secondary: colors.action,
    onSecondary: colors.textOnColor,
    secondaryContainer: '#d7efe1',
    onSecondaryContainer: colors.text,
    background: colors.background,
    onBackground: colors.text,
    surface: colors.surface,
    onSurface: colors.text,
    surfaceVariant: '#eeeeee',
    onSurfaceVariant: colors.textSecondary,
    outline: colors.outline,
    outlineVariant: colors.border,
    error: colors.danger,
    elevation: {
      level0: 'transparent',
      level1: colors.surface,
      level2: colors.surface,
      level3: colors.surface,
      level4: colors.surface,
      level5: colors.surface,
    },
  },
  fonts: Object.fromEntries(
    Object.entries(MD3LightTheme.fonts).map(([variant, font]) => [
      variant,
      typeof font === 'object'
        ? {
            ...font,
            fontFamily: Number(font.fontWeight) >= 500 ? fonts.bold : fonts.regular,
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
      <StatusBar barStyle="dark-content" />
      <PaperProvider theme={theme}>
        <View style={styles.root}>
          <ErrorBoundary>
            <MainNavigator />
          </ErrorBoundary>
          <OfflineBanner />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
