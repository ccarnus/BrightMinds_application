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
        const response = await fetch(`https://3.17.219.54/topic/department/${labId}`);
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
        {dataAvailable ? (
          <>
            <Text style={styles.gaugeTitle}>{gaugeTitle || 'Lab Progress'}</Text>
            <View style={styles.gaugeContainer}>
              <Animated.View style={[styles.fillGauge, { height: gaugeHeight }]} />    
              <Image source={require('../../assets/Virtual_lab_icons/Gauge.png')} style={styles.gaugeImage} />
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>No data available.</Text>
        )}
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
  bottomSection: {
    backgroundColor: colors.primaryBis,
    width: width,
    justifyContent: 'center',
    height: 3 * height / 4,
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryBis,
  },
  gaugeImage: {
    width: '80%',
    height: height * 0.6,
    resizeMode: 'contain',
    marginBottom: 0,
  },
  fillGauge: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    backgroundColor: colors.darkblue
  },
  gaugeTitle: {
    fontSize: sizes.h2,
    color: colors.secondary,
    marginBottom: spacing.s,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  noDataText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    marginTop: spacing.s,
    marginBottom: spacing.s,
  },
});

export default ProgressScreen;
