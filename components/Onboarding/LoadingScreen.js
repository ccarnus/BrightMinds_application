import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '../theme';

const LoadingScreen = ({ navigation }) => {
  useEffect(() => {
    const animationDuration = 4000;

    const timer = setTimeout(() => {
      navigation.replace('BottomNav');
    }, animationDuration);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/Loader/Welcome.json')}
        autoPlay
        loop={false}
        onAnimationFinish={() => navigation.replace('BottomNav')}
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
    width: 200,
    height: 200,
  },
});

export default LoadingScreen;
