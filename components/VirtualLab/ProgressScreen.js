import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { colors, sizes, spacing } from '../theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const ProgressScreen = ({ route }) => {
  const { labId, labDisplayName } = route.params;
  const [progress, setProgress] = useState(0);
  const [gaugeTitle, setGaugeTitle] = useState('');
  const [fillAnim] = useState(new Animated.Value(0));
  const [dataAvailable, setDataAvailable] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`http://3.17.219.54/topic/department/${labId}`);
        const data = await response.json();

        if (data.length > 0) {
          const firstElement = data[0];
          setProgress(firstElement.progress*0.01);
          setGaugeTitle(firstElement.name);
        } else {
          setDataAvailable(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setDataAvailable(false); // Handle error by showing no data available
      }
    };

    fetchData();
  }, [labId]);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [fillAnim, progress]);

  const gaugeHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.559],
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
      <View style={styles.bottomSection}>
            <Text style={styles.indicator}>Coming soon..</Text>
      </View>
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
  titleOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labTitle: {
    fontSize: sizes.title,
    color: colors.primary,
    textAlign: 'center',
    marginHorizontal: 10,
    fontFamily: 'Montserrat',
  },
  bottomSection: {
    width: width,
    height: 0.2 * height,
    backgroundColor: colors.primaryBis,
    justifyContent: 'center',
  },
  indicator: {
    fontSize: sizes.h3,
    color: colors.secondary,
    marginBottom: spacing.s,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
});

export default ProgressScreen;
