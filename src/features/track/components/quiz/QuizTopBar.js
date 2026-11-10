import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, rewardColors, sizes, spacing, typography } from '@shared/config/theme';
import useCountUp from '@features/track/utils/useCountUp';

const Segment = ({ status }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (status === 'current') {
      pulse.value = withRepeat(withSequence(withTiming(0.45, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
    } else {
      pulse.value = withTiming(1, { duration: 150 });
    }
  }, [status, pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return <Animated.View style={[styles.segment, styles[status], style]} />;
};

/**
 * Quiz header: close button, one progress segment per question (green/red once answered),
 * the XP earned so far (counts up and bumps) and the current combo.
 */
const QuizTopBar = ({ total, results, current, xp, combo, onClose }) => {
  const displayedXp = useCountUp(xp, { duration: 600 });
  const bump = useSharedValue(1);

  useEffect(() => {
    if (xp > 0) bump.value = withSequence(withSpring(1.25, { damping: 6 }), withSpring(1));
  }, [xp, bump]);

  const xpStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  const statusOf = (index) => {
    if (index < results.length) return results[index] ? 'correct' : 'wrong';
    return index === current ? 'current' : 'upcoming';
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.close}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Leave the quiz"
        >
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <View
          style={styles.segments}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: total, now: results.length }}
        >
          {Array.from({ length: total }, (_, index) => (
            <Segment key={index} status={statusOf(index)} />
          ))}
        </View>
        <Animated.View style={[styles.xpChip, xpStyle]} accessibilityLabel={`${xp} XP earned`}>
          <MaterialCommunityIcons name="star-four-points" size={16} color={rewardColors.xp} />
          <Text style={styles.xpText}>{displayedXp}</Text>
        </Animated.View>
      </View>

      <View style={styles.subRow}>
        <Text style={styles.counter}>
          Question {Math.min(current + 1, total)} of {total}
        </Text>
        {combo >= 2 && (
          <Animated.View key={combo} entering={ZoomIn.springify().damping(7)} style={styles.combo}>
            <MaterialCommunityIcons name="fire" size={16} color={rewardColors.streak} />
            <Text style={styles.comboText}>Combo x{combo}</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.s,
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  upcoming: {
    backgroundColor: colors.border,
  },
  current: {
    backgroundColor: colors.accent,
  },
  correct: {
    backgroundColor: colors.action,
  },
  wrong: {
    backgroundColor: colors.danger,
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 64,
    justifyContent: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: sizes.buttonRadius,
    backgroundColor: rewardColors.xpSoft,
  },
  xpText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    color: colors.text,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 28,
    marginTop: spacing.xs,
  },
  counter: {
    ...typography.caption,
    fontFamily: fonts.bold,
  },
  combo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: sizes.buttonRadius,
    backgroundColor: rewardColors.streakSoft,
  },
  comboText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: rewardColors.streak,
  },
});

export default QuizTopBar;
