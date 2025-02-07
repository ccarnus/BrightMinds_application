import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { spacing, colors, sizes } from '../theme';

const CastTypeChoice = () => {
  const navigation = useNavigation();
  const fadeInDuration = 400;

  const fadeAnim1 = useState(new Animated.Value(0))[0];
  const fadeAnim2 = useState(new Animated.Value(0))[0];
  const fadeAnim3 = useState(new Animated.Value(0))[0];

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

    setTimeout(() => {
      Animated.timing(fadeAnim3, {
        toValue: 1,
        duration: fadeInDuration,
        useNativeDriver: true,
      }).start();
    }, fadeInDuration * 2);
  }, [fadeAnim1, fadeAnim2, fadeAnim3]);

  const handleChoice = (castType) => {
    switch (castType) {
      case 'Clip':
        navigation.navigate('PostCast');
        break;
      case 'Article':
        navigation.navigate('PostArticle');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim2 }]}>
        <TouchableOpacity onPress={() => handleChoice('Clip')}>
          <View style={styles.content}>
            <Image
              source={require('../../assets/Cast_screen_icons/cast_logo.png')}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Clip</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim3 }]}>
        <TouchableOpacity onPress={() => handleChoice('Article')}>
          <View style={styles.content}>
            <Image
              source={require('../../assets/Cast_screen_icons/article_logo.png')}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Article</Text>
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
    backgroundColor: colors.primaryBis,
  },
  buttonContainer: {
    width: '80%',
    minHeight: 100, 
    justifyContent: 'center',
    padding: spacing.s,
    marginVertical: spacing.m,
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    borderRadius: sizes.radius,
  },
  icon: {
    width: 74,
    height: 70,
    marginRight: 20,
  },
  buttonText: {
    fontSize: 32,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
});

export default CastTypeChoice;
