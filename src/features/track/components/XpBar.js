import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, rewardColors } from '@shared/config/theme';

const clamp = (value) => Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), 1);

/**
 * Animated XP bar: fills from `from` to `progress` (0–1). Remount it (key) to replay;
 * `onComplete` fires once the fill animation ends (used to chain level-up celebrations).
 */
const XpBar = ({ progress, from, delay = 0, duration = 900, height = 12, onComplete, style }) => {
  const fill = useSharedValue(clamp(from ?? progress));

  useEffect(() => {
    fill.value = withDelay(
      delay,
      withTiming(clamp(progress), { duration, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished && onComplete) runOnJS(onComplete)();
      })
    );
    // onComplete is read once per animation; re-running on its identity would restart the fill.
  }, [progress, delay, duration, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamp(progress) * 100) }}
    >
      <Animated.View style={[styles.fill, { borderRadius: height / 2 }, fillStyle]}>
        <LinearGradient
          colors={[rewardColors.gold[0], rewardColors.xp]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  fill: {
    height: '100%',
    overflow: 'hidden',
  },
});

export default XpBar;
