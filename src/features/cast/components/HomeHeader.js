import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, contentWidth, fonts, spacing, typography } from '@shared/config/theme';
import { firstName, greetingFor } from '@features/cast/utils/home';

/** Greeting at the top of the home screen: time of day, first name and the invitation to learn. */
const HomeHeader = ({ username, now = new Date() }) => {
  const name = firstName(username);
  const greeting = `${greetingFor(now.getHours())}${name ? `, ${name}` : ''}`;

  return (
    <Animated.View entering={FadeInDown.duration(420)} style={styles.container}>
      <Text style={styles.greeting} numberOfLines={1}>
        {greeting}
      </Text>
      <Text style={styles.title} accessibilityRole="header">
        What will you discover today?
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
    paddingBottom: spacing.m,
  },
  greeting: {
    ...typography.bodySmall,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  title: {
    ...typography.h1,
    marginTop: 2,
  },
});

export default HomeHeader;
