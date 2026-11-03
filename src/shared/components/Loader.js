import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '@shared/config/theme';

const loaderAnimation = require('@assets/Loader/loader.json');

/**
 * Branded Lottie loading animation.
 * `fullScreen` centers it in a flex container; otherwise it renders inline.
 */
const Loader = ({ fullScreen = true, size, style, backgroundColor = colors.primary }) => {
  const { width } = useWindowDimensions();
  const dimension = size || width * 0.5;
  const animation = (
    <LottieView
      source={loaderAnimation}
      autoPlay
      loop
      style={{ width: dimension, height: dimension }}
      accessibilityLabel="Loading"
    />
  );

  if (!fullScreen) {
    return animation;
  }

  return <View style={[styles.container, { backgroundColor }, style]}>{animation}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Loader;
