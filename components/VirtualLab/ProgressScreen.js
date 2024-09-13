import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { colors, sizes, spacing } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const ProgressScreen = ({ route }) => {
  const { labId, labDisplayName } = route.params;
  const [progress] = useState(0.7);  // Example progress (70%)
  const [fillAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate the gauge filling based on the progress value
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [fillAnim, progress]);

  const gaugeHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500], // Assuming the image height is 200px
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.secondary, colors.primaryBis]}
        style={styles.topSection}>
        <View style={styles.titleOverlay}>
          <Text style={styles.labTitle}>{labDisplayName || 'Virtual Laboratory'}</Text>
        </View>
      </LinearGradient>
      <ScrollView style={styles.bottomSection}>
        <View style={styles.gaugeContainer}>
          <Animated.View style={[styles.fillGauge, { height: gaugeHeight }]} />    
          <Image source={require('../../assets/Virtual_lab_icons/Gauge.png')} style={styles.gaugeImage} />
        </View>
        <Text style={styles.progressText}>Progress: {(progress * 100).toFixed(0)}%</Text>
      </ScrollView>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    height: height / 4,
    backgroundColor: colors.secondary,
    elevation: 5,
  },
  bottomSection: {
    backgroundColor: colors.primaryBis,
    paddingVertical: spacing.m,
    width: width,
    marginBottom: spacing.m,
  },
  labTitle: {
    fontSize: sizes.title,
    color: colors.primary,
    textAlign: 'center',
    marginLeft: 10,
    marginRight: 10,
    fontFamily: 'Montserrat',
  },
  titleOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  gaugeContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: "100%",
  },
  gaugeImage: {
    width: "80%",
    resizeMode: 'contain',
    bottom: 0,
  },
  fillGauge: {
    position: 'absolute',
    bottom: 0,
    width: '80%',
    backgroundColor: colors.darkblue,
  },
  progressText: {
    fontSize: sizes.h2,
    color: colors.secondary,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: spacing.m,
  },
});

export default ProgressScreen;
