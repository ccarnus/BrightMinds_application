import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, rewardColors } from '@shared/config/theme';

/** Round level medallion; pops whenever `level` changes (level up). */
const LevelBadge = ({ level, size = 56 }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSequence(withSpring(1.25, { damping: 6 }), withSpring(1, { damping: 10 }));
  }, [level, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, style]}
      accessibilityLabel={`Level ${level}`}
    >
      <LinearGradient
        colors={rewardColors.level}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.inner, { borderRadius: size / 2 }]}
      >
        <Text style={[styles.caption, { fontSize: Math.round(size * 0.18) }]}>LV</Text>
        <Text style={[styles.level, { fontSize: Math.round(size * 0.38), lineHeight: Math.round(size * 0.44) }]}>
          {level}
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  ring: {
    padding: 3,
    backgroundColor: rewardColors.xp,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontFamily: fonts.bold,
    color: colors.textOnColor,
    opacity: 0.85,
    marginBottom: -2,
  },
  level: {
    fontFamily: fonts.bold,
    color: colors.textOnColor,
  },
});

export default LevelBadge;
