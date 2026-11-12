import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, contentWidth, fonts, shadow, sizes, spacing, typography } from '@shared/config/theme';
import PressableScale from '@shared/components/PressableScale';
import LevelBadge from '@features/track/components/LevelBadge';
import XpBar from '@features/track/components/XpBar';
import StreakFlame from '@features/track/components/StreakFlame';

/**
 * Level, XP bar and streak at a glance; tapping it opens the Track tab. `rewards` is the answer of
 * `GET /user/:id/rewards`.
 */
const ProgressCard = ({ rewards, onPress }) => {
  const toNext = Math.max(0, (rewards.levelSpan || 0) - (rewards.levelXp || 0));
  const streak = rewards.streak?.current || 0;

  return (
    <Animated.View entering={FadeInDown.delay(60).duration(420)} style={styles.wrapper}>
      <PressableScale
        scaleTo={0.98}
        onPress={onPress}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={`Level ${rewards.level}, ${rewards.levelTitle}. ${toNext} XP to the next level. Open your progress`}
      >
        <LevelBadge level={rewards.level} size={52} />
        <View style={styles.middle}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {rewards.levelTitle}
            </Text>
          </View>
          <XpBar progress={rewards.progress} from={0} delay={500} height={8} style={styles.bar} />
          <Text style={styles.caption} numberOfLines={1}>
            {toNext} XP to level {rewards.level + 1}
          </Text>
        </View>
        <StreakFlame count={streak} label={streak > 0 ? `${streak}` : '0'} compact />
      </PressableScale>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.m,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    padding: spacing.s + 4,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.light,
  },
  middle: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.bodySmall,
    flex: 1,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  bar: { marginVertical: 5 },
  caption: { ...typography.caption },
});

export default ProgressCard;
