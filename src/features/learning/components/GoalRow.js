import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, sizes, spacing, typography } from '@shared/config/theme';
import { METRIC_STYLES, goalLabel, goalRatio } from '@features/learning/utils/pathStyles';

/** One milestone goal: icon, label, "current / target" and an animated bar. */
const GoalRow = ({ goal, focusField, color, delay = 0 }) => {
  const ratio = goalRatio(goal);
  const done = goal.current >= goal.target;
  const label = goalLabel(goal.metric, focusField);
  const shown = Math.min(goal.current, goal.target);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(delay, withTiming(ratio, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [ratio, delay, fill]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${shown} of ${goal.target}`}>
      <View style={[styles.icon, { backgroundColor: done ? color : colors.background }]}>
        <MaterialCommunityIcons
          name={done ? 'check-bold' : METRIC_STYLES[goal.metric]?.icon || 'circle-outline'}
          size={16}
          color={done ? colors.textOnColor : color}
        />
      </View>
      <View style={styles.body}>
        <View style={styles.labelRow}>
          <Text style={styles.label} numberOfLines={2}>
            {label}
          </Text>
          <Text style={styles.count}>
            {shown} / {goal.target}
          </Text>
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { backgroundColor: color }, fillStyle]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 2,
    marginTop: spacing.s + 2,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.s,
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text,
  },
  count: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: colors.textSecondary,
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default GoalRow;
