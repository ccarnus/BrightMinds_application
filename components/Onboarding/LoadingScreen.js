import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { colors } from '../theme';
const { width, height } = Dimensions.get('window');

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
        source={require('../../assets/Loader/loader.json')}
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
    width: width*0.8,
    height: width*0.8,
  },
});

export default LoadingScreen;
