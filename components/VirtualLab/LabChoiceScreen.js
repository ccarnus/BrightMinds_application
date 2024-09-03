import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { spacing, colors, sizes } from '../theme';

const LabChoiceScreen = ({ route }) => {
  const { labId, labDisplayName } = route.params;
  const navigation = useNavigation();
  const fadeInDuration = 600;

  const fadeAnim1 = useState(new Animated.Value(0))[0];
  const fadeAnim2 = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim1, {
      toValue: 1,
      duration: fadeInDuration,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(fadeAnim2, {
        toValue: 1,
        duration: fadeInDuration,
        useNativeDriver: true,
      }).start();
    }, fadeInDuration);

  }, [fadeAnim1, fadeAnim2]);

  const handleChoice = (castType) => {
    switch (castType) {
      case 'Learn':
        navigation.navigate('VirtualLab', { labId: labId, labDisplayName: labDisplayName });
        break;
      case 'Where':
        navigation.navigate('VirtualLab', { labId: labId, labDisplayName: labDisplayName });
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{labDisplayName}</Text>
      
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim1 }]}>
        <TouchableOpacity onPress={() => handleChoice('Learn')}>
          <View style={styles.content}>
            <Image
              source={require('../../assets/Virtual_lab_icons/learn_icon.png')}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Learn about it</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim2 }]}>
        <TouchableOpacity onPress={() => handleChoice('Where')}>
          <View style={styles.content}>
            <Image
              source={require('../../assets/Virtual_lab_icons/where_icon.png')}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Where we're going</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.l,
  },
  title: {
    fontSize: sizes.h1,
    color: colors.primary,
    fontFamily: 'MontserratBold',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    minHeight: 100, 
    justifyContent: 'center',
    padding: spacing.s,
    marginVertical: spacing.m,
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    borderRadius: sizes.radius,
  },
  icon: {
    width: 74,
    height: 74,
  },
  buttonText: {
    fontSize: sizes.h2,
    color: colors.secondary,
    fontFamily: 'Montserrat',
    marginTop: spacing.s,
    textAlign: 'center',
  },
});

export default LabChoiceScreen;
