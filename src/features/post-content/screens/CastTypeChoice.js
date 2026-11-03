import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, colors, sizes } from '@shared/config/theme';
import { BackButton } from '@features/post-content/components/PostFormFields';

const FADE_IN_DURATION = 400;

const CHOICES = [
  { route: 'PostCast', label: 'Clip', icon: require('@assets/Cast_screen_icons/cast_logo.png') },
  { route: 'PostArticle', label: 'Article', icon: require('@assets/Cast_screen_icons/article_logo.png') },
];

const CastTypeChoice = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const fadeAnims = useRef(CHOICES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animation = Animated.stagger(
      FADE_IN_DURATION,
      fadeAnims.map((value) =>
        Animated.timing(value, { toValue: 1, duration: FADE_IN_DURATION, useNativeDriver: true })
      )
    );
    animation.start();
    return () => animation.stop();
  }, [fadeAnims]);

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} style={{ top: insets.top + spacing.s }} />
      {CHOICES.map((choice, index) => (
        <Animated.View
          key={choice.route}
          style={[styles.buttonContainer, { opacity: fadeAnims[index] }]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate(choice.route)}
            accessibilityRole="button"
            accessibilityLabel={`Post a ${choice.label.toLowerCase()}`}
          >
            <View style={styles.content}>
              <Image source={choice.icon} style={styles.icon} />
              <Text style={styles.buttonText}>{choice.label}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}
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
