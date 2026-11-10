import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, rewardColors, sizes } from '@shared/config/theme';
import { badgeStyle } from '@features/track/utils/rewards';

/**
 * Achievement medallion: tier gradient + icon when earned, grey with a lock otherwise.
 * `enteringDelay` (ms) makes it pop in, for unlock celebrations.
 */
const BadgeMedal = ({ badgeKey, title, earned = true, size = 64, showTitle = true, onPress, enteringDelay }) => {
  const { icon, colors: tierColors } = badgeStyle(badgeKey);
  const entering =
    enteringDelay !== undefined ? ZoomIn.delay(enteringDelay).springify().damping(9) : undefined;

  return (
    <Animated.View entering={entering} style={[styles.container, { width: size + 24 }]}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : 'image'}
        accessibilityLabel={`${title}${earned ? '' : ' (locked)'}`}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]}>
          <LinearGradient
            colors={earned ? tierColors : rewardColors.locked}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={[styles.medal, { borderRadius: size / 2 }]}
          >
            <MaterialCommunityIcons
              name={earned ? icon : 'lock'}
              size={Math.round(size * 0.46)}
              color={earned ? colors.textOnColor : colors.textMuted}
            />
          </LinearGradient>
        </View>
      </Pressable>
      {showTitle && (
        <Text style={[styles.title, !earned && styles.titleLocked]} numberOfLines={2}>
          {title}
        </Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  ring: {
    padding: 3,
    backgroundColor: colors.surface,
    shadowColor: colors.black,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  medal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginTop: 6,
    fontFamily: fonts.bold,
    fontSize: sizes.small,
    color: colors.text,
    textAlign: 'center',
  },
  titleLocked: {
    color: colors.textMuted,
  },
});

export default BadgeMedal;
