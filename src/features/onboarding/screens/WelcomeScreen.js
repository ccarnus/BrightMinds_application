import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '@shared/config/theme';
import { resetToHome } from '@navigation/navigationHelpers';

const { width } = Dimensions.get('window');
// Fallback in case the animation never reports completion.
const MAX_ANIMATION_DURATION_MS = 4000;

const WelcomeScreen = ({ navigation }) => {
  const hasNavigatedRef = useRef(false);

  const goHome = useCallback(() => {
    if (hasNavigatedRef.current) return;
    hasNavigatedRef.current = true;
    resetToHome(navigation);
  }, [navigation]);

  useEffect(() => {
    const timer = setTimeout(goHome, MAX_ANIMATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [goHome]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('@assets/Loader/Welcome.json')}
        autoPlay
        loop={false}
        onAnimationFinish={goHome}
        style={styles.lottie}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryBis,
  },
  lottie: {
    width: width * 0.8,
    height: width * 0.8,
  },
});

export default WelcomeScreen;
