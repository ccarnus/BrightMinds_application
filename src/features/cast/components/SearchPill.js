import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, contentWidth, shadow, spacing, typography } from '@shared/config/theme';
import PressableScale from '@shared/components/PressableScale';

const HEIGHT = 52;

/**
 * Looks like a search field but is a button: it opens the search view, whose field takes the focus
 * (so the keyboard never fights the screen change).
 */
const SearchPill = ({ onPress }) => (
  <Animated.View entering={FadeInDown.delay(40).duration(420)} style={styles.wrapper}>
    <PressableScale
      scaleTo={0.985}
      onPress={onPress}
      style={styles.pill}
      accessibilityRole="search"
      accessibilityLabel="Search papers, topics and videos"
    >
      <Ionicons name="search" size={20} color={colors.accent} />
      <Text style={styles.placeholder} numberOfLines={1}>
        Search papers and videos
      </Text>
    </PressableScale>
  </Animated.View>
);

const styles = StyleSheet.create({
  wrapper: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
  },
  pill: {
    height: HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 2,
    paddingHorizontal: spacing.m,
    borderRadius: HEIGHT / 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.light,
  },
  placeholder: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.textMuted,
  },
});

export default SearchPill;
