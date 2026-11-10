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
import { colors, fonts } from '@shared/config/theme';

/** State of a milestone in a journey: reached, next (the one being worked on) or locked. */
export const milestoneState = (milestones, index) => {
  if (milestones[index].reached) return 'reached';
  return index === 0 || milestones[index - 1].reached ? 'next' : 'locked';
};

/** A milestone dot: a check when reached, a pulsing ring when next, the level (or a trophy) otherwise. */
const MilestoneNode = ({ state, level, isLast, color, size = 28 }) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (state !== 'next') {
      cancelAnimation(pulse);
      pulse.value = 1;
      return undefined;
    }
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1
    );
    return () => cancelAnimation(pulse);
  }, [state, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  const shape = { width: size, height: size, borderRadius: size / 2 };
  const iconSize = Math.round(size * 0.55);

  if (state === 'reached') {
    return (
      <View style={[styles.node, shape, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={isLast ? 'trophy' : 'check-bold'} size={iconSize} color={colors.textOnColor} />
      </View>
    );
  }
  const active = state === 'next';
  return (
    <Animated.View
      style={[
        styles.node,
        shape,
        active ? [styles.next, { borderColor: color }] : styles.locked,
        pulseStyle,
      ]}
    >
      {isLast ? (
        <MaterialCommunityIcons name="trophy" size={iconSize} color={active ? color : colors.textMuted} />
      ) : (
        <Text style={[styles.level, { fontSize: Math.round(size * 0.42), color: active ? color : colors.textMuted }]}>
          {level}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  node: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  next: {
    borderWidth: 2.5,
    backgroundColor: colors.surface,
  },
  locked: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  level: {
    fontFamily: fonts.bold,
  },
});

export default MilestoneNode;
