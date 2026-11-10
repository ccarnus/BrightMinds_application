import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors, spacing, typography } from '@shared/config/theme';
import { useIsOffline } from '@shared/utils/connectivity';

const loaderAnimation = require('@assets/Loader/loader.json');

// After this delay a full-screen loader explains the wait instead of spinning silently.
export const SLOW_LOADING_HINT_MS = 6000;

/**
 * Branded Lottie loading animation.
 * `fullScreen` centers it in a flex container (with a hint when loading is slow);
 * otherwise it renders inline.
 */
const Loader = ({ fullScreen = true, size, style, backgroundColor = colors.primary }) => {
  const { width } = useWindowDimensions();
  const isOffline = useIsOffline();
  const [isSlow, setIsSlow] = useState(false);
  const dimension = size || Math.min(width * 0.5, 240);

  useEffect(() => {
    if (!fullScreen) return undefined;
    const timer = setTimeout(() => setIsSlow(true), SLOW_LOADING_HINT_MS);
    return () => clearTimeout(timer);
  }, [fullScreen]);

  const animation = (
    <LottieView
      source={loaderAnimation}
      autoPlay
      loop
      style={{ width: dimension, height: dimension }}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    />
  );

  if (!fullScreen) {
    return animation;
  }

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {animation}
      {isSlow && (
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {isOffline
            ? "You're offline. Waiting for the connection..."
            : 'This is taking longer than usual...'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {
    ...typography.bodySmall,
    marginTop: spacing.s,
    paddingHorizontal: spacing.l,
    textAlign: 'center',
  },
});

export default Loader;
