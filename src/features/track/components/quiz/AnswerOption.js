import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, rewardColors, sizes, spacing, typography } from '@shared/config/theme';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

// idle → before answering; correct/wrong → the chosen option; reveal → the right answer after a
// mistake; dimmed → the other options.
const STATES = {
  idle: { card: null, letter: null, letterText: null, text: null, icon: null },
  correct: {
    card: { backgroundColor: colors.action, borderColor: colors.action },
    letter: { backgroundColor: colors.surface },
    letterText: { color: colors.action },
    text: { color: colors.textOnColor },
    icon: { name: 'check-circle', color: colors.textOnColor },
  },
  wrong: {
    card: { backgroundColor: colors.danger, borderColor: colors.danger },
    letter: { backgroundColor: colors.surface },
    letterText: { color: colors.danger },
    text: { color: colors.textOnColor },
    icon: { name: 'close-circle', color: colors.textOnColor },
  },
  reveal: {
    card: { backgroundColor: rewardColors.correctSoft, borderColor: colors.action, borderWidth: 2 },
    letter: { backgroundColor: colors.action },
    letterText: { color: colors.textOnColor },
    text: { color: colors.text },
    icon: { name: 'check-circle', color: colors.action },
  },
  dimmed: { card: { opacity: 0.45 }, letter: null, letterText: null, text: null, icon: null },
};

/** One answer of the quiz: staggered entrance, press squish, bounce when right, shake when wrong. */
const AnswerOption = ({ index, text, state = 'idle', disabled, onPress }) => {
  const scale = useSharedValue(1);
  const shake = useSharedValue(0);
  const look = STATES[state] || STATES.idle;

  useEffect(() => {
    if (state === 'correct') {
      scale.value = withSequence(withSpring(1.06, { damping: 5 }), withSpring(1, { damping: 10 }));
    } else if (state === 'wrong') {
      shake.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withRepeat(withTiming(10, { duration: 90 }), 4, true),
        withTiming(0, { duration: 50 })
      );
    }
  }, [state, scale, shake]);

  const motion = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shake.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(150 + index * 90).springify().damping(15)} style={styles.wrapper}>
      <Animated.View style={motion}>
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            if (!disabled) scale.value = withSpring(0.97);
          }}
          onPressOut={() => {
            if (!disabled) scale.value = withSpring(1);
          }}
          disabled={disabled}
          style={[styles.card, look.card]}
          accessibilityRole="button"
          accessibilityLabel={`${LETTERS[index]}: ${text}`}
          accessibilityState={{ disabled, selected: state === 'correct' || state === 'wrong' }}
        >
          <View style={[styles.letter, look.letter]}>
            <Text style={[styles.letterText, look.letterText]}>{LETTERS[index]}</Text>
          </View>
          <Text style={[styles.text, look.text]}>{text}</Text>
          {look.icon && (
            <Animated.View entering={ZoomIn.springify().damping(8)}>
              <MaterialCommunityIcons name={look.icon.name} size={26} color={look.icon.color} />
            </Animated.View>
          )}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.s + 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    minHeight: 60,
    paddingVertical: spacing.s + 4,
    paddingHorizontal: spacing.m,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  letter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  letterText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    color: colors.accent,
  },
  text: {
    ...typography.body,
    flex: 1,
  },
});

export default AnswerOption;
