import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, rewardColors, sizes, spacing } from '@shared/config/theme';

/** Daily streak chip: a flame that keeps pulsing while the streak is alive. */
const StreakFlame = ({ count = 0, label, compact = false }) => {
  const active = count > 0;
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!active) {
      cancelAnimation(pulse);
      pulse.value = 1;
      return undefined;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(1.18, { duration: 600 }), withTiming(1, { duration: 600 })),
      -1
    );
    return () => cancelAnimation(pulse);
  }, [active, pulse]);

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const text = label ?? (active ? `${count}-day streak` : 'No streak yet');

  return (
    <View
      style={[styles.chip, active ? styles.chipActive : styles.chipIdle, compact && styles.compact]}
      accessibilityLabel={text}
    >
      <Animated.View style={flameStyle}>
        <MaterialCommunityIcons
          name="fire"
          size={compact ? 18 : 22}
          color={active ? rewardColors.streak : colors.textMuted}
        />
      </Animated.View>
      <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.s + 2,
    paddingVertical: spacing.xs + 2,
    borderRadius: sizes.buttonRadius,
  },
  compact: {
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    backgroundColor: rewardColors.streakSoft,
  },
  chipIdle: {
    backgroundColor: colors.border,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: colors.textSecondary,
  },
  textActive: {
    color: rewardColors.streak,
  },
});

export default StreakFlame;
