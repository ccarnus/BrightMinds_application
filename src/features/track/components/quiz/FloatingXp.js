import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, rewardColors, sizes, spacing } from '@shared/config/theme';

/** "+15 XP" that pops, rises and fades each time `trigger` changes. Position it with `style`. */
const FloatingXp = ({ amount, trigger, style }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (!trigger) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.cubic) });
  }, [trigger, progress]);

  const animated = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.12, 0.7, 1], [0, 1, 1, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [10, -70]) },
      { scale: interpolate(progress.value, [0, 0.18, 0.35, 1], [0.5, 1.25, 1, 1]) },
    ],
  }));

  if (!trigger) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.bubble, style, animated]}>
      <MaterialCommunityIcons name="star-four-points" size={18} color={colors.textOnColor} />
      <Text style={styles.text}>+{amount} XP</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: sizes.buttonRadius,
    backgroundColor: rewardColors.xp,
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: sizes.h3,
    color: colors.textOnColor,
  },
});

export default FloatingXp;
