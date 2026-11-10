import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { colors, contentWidth, fonts, rewardColors, scale, sizes, spacing, typography } from '@shared/config/theme';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import haptics from '@shared/utils/haptics';
import AppButton from '@shared/components/AppButton';
import ConfettiBurst from '@shared/components/ConfettiBurst';
import LevelBadge from '@features/track/components/LevelBadge';
import XpBar from '@features/track/components/XpBar';
import StreakFlame from '@features/track/components/StreakFlame';
import BadgeMedal from '@features/track/components/BadgeMedal';
import useCountUp from '@features/track/utils/useCountUp';
import { resultTier, scoreLocally } from '@features/track/utils/rewards';
import { submitQuiz, newQuizId } from '@features/track/utils/quizApi';
import PathIcon from '@features/learning/components/PathIcon';

// A short suspense before the reveal; grading usually answers faster than this.
const MIN_COUNTING_MS = 900;
const HERO_SIZE = Math.min(scale(120), 150);
const RING_SIZE = Math.min(scale(132), 160);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const CountingXp = () => {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(360, { duration: 1200 }), -1);
  }, [spin]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  return (
    <View style={styles.counting}>
      <Animated.View style={style}>
        <MaterialCommunityIcons name="star-four-points" size={64} color={rewardColors.xp} />
      </Animated.View>
      <Text style={styles.countingText}>Counting your XP...</Text>
    </View>
  );
};

const Hero = ({ tier }) => {
  const wiggle = useSharedValue(0);
  useEffect(() => {
    wiggle.value = withRepeat(
      withSequence(withTiming(-8, { duration: 220 }), withTiming(8, { duration: 440 }), withTiming(0, { duration: 220 }), withTiming(0, { duration: 1200 })),
      -1
    );
  }, [wiggle]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${wiggle.value}deg` }] }));
  return (
    <Animated.View entering={ZoomIn.springify().damping(8)} style={styles.heroWrap}>
      <Animated.View style={style}>
        <LinearGradient colors={tier.colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.hero}>
          <MaterialCommunityIcons name={tier.icon} size={HERO_SIZE * 0.5} color={colors.textOnColor} />
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
};

/** Level progress, with a level-up celebration: fill to the top, celebrate, then refill. */
const LevelProgress = ({ previous, rewards, leveledUp, onLevelUp }) => {
  const [phase, setPhase] = useState(leveledUp ? 'filling' : 'final');
  const shown = phase === 'final' ? rewards : previous;

  const handleFilled = useCallback(() => {
    if (phase !== 'filling') return;
    onLevelUp();
    setPhase('final');
  }, [phase, onLevelUp]);

  return (
    <View style={styles.card}>
      <View style={styles.levelRow}>
        <LevelBadge level={shown.level} size={60} />
        <View style={styles.levelTexts}>
          <Text style={styles.levelTitle}>{shown.levelTitle}</Text>
          <Text style={styles.levelCaption}>
            {shown.levelXp} / {shown.levelSpan} XP to level {shown.level + 1}
          </Text>
        </View>
      </View>
      {phase === 'filling' ? (
        <XpBar key="filling" from={previous.progress} progress={1} delay={900} onComplete={handleFilled} />
      ) : (
        <XpBar key="final" from={leveledUp ? 0 : previous.progress} progress={rewards.progress} delay={leveledUp ? 300 : 900} />
      )}
      {leveledUp && phase === 'final' && (
        <Animated.View entering={ZoomIn.springify().damping(7)} style={styles.levelUp}>
          <MaterialCommunityIcons name="arrow-up-bold-circle" size={22} color={colors.textOnColor} />
          <Text style={styles.levelUpText}>
            Level up! Level {rewards.level}: {rewards.levelTitle}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const Finish = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  // Small phones stack the score ring above the XP so neither gets squeezed.
  const stacked = useWindowDimensions().width < 360;
  const { answers = [], total = answers.length } = route.params || {};
  const [result, setResult] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(true);
  const [confetti, setConfetti] = useState(0);
  const quizIdRef = useRef(newQuizId());
  const celebratedRef = useRef(false);
  const mountedRef = useRef(true);

  const save = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    const startedAt = Date.now();
    let outcome;
    try {
      const { userId } = await getUser();
      if (userId && !isGuestUser(userId) && answers.length > 0) {
        outcome = await submitQuiz(userId, answers, quizIdRef.current);
        if (outcome.summary.total === 0) {
          // Nothing graded: either a retry of this quiz whose first response was lost (`duplicate`,
          // the XP was awarded then) or questions already answered elsewhere (no XP this time).
          const local = scoreLocally(answers);
          outcome = outcome.duplicate
            ? { ...local, previous: outcome.rewards, rewards: outcome.rewards, persisted: true }
            : { ...outcome, summary: local.summary, alreadyAnswered: true };
        }
      } else {
        outcome = { ...scoreLocally(answers), persisted: false };
      }
    } catch (error) {
      console.error('Error saving the quiz:', error);
      outcome = { ...scoreLocally(answers), persisted: false };
      if (mountedRef.current) setSaveError(error);
    }
    await wait(Math.max(0, MIN_COUNTING_MS - (Date.now() - startedAt)));
    if (!mountedRef.current) return;
    setResult(outcome);
    setSaving(false);
  }, [answers]);

  useEffect(() => {
    mountedRef.current = true;
    save();
    return () => {
      mountedRef.current = false;
    };
    // Saved once per visit; `answers` comes from route params.
  }, []);

  const summary = result?.summary || { total, correct: 0, bestCombo: 0 };
  const ratio = summary.total > 0 ? summary.correct / summary.total : 0;
  const tier = resultTier(ratio);
  const xpEarned = useCountUp(result ? result.xpEarned : 0, { duration: 1200, delay: 500 });

  useEffect(() => {
    if (!result || celebratedRef.current) return;
    celebratedRef.current = true;
    if (ratio >= 0.5) {
      haptics.celebrate();
      setConfetti(Date.now());
    } else {
      haptics.success();
    }
  }, [result, ratio]);

  const celebrateLevelUp = useCallback(() => {
    haptics.celebrate();
    setConfetti(Date.now());
  }, []);

  const goToTrack = () => navigation.popTo('BottomNav', { screen: 'Track' });

  if (saving && !result) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <CountingXp />
      </View>
    );
  }

  const rewards = result.rewards;
  const streak = rewards?.streak;
  const streakBonus = result.breakdown.find((item) => item.key === 'streak');

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.l, paddingBottom: spacing.l }]}
      >
        <Hero tier={tier} />
        <Animated.Text entering={FadeInDown.delay(200)} style={styles.title} accessibilityRole="header">
          {tier.title}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(300)} style={styles.subtitle}>
          {summary.correct} of {summary.total} correct
          {summary.bestCombo >= 2 ? ` · Best combo x${summary.bestCombo}` : ''}
        </Animated.Text>

        <Animated.View
          entering={FadeInDown.delay(400)}
          style={[styles.card, styles.scoreCard, stacked && styles.scoreCardStacked]}
        >
          <AnimatedCircularProgress
            size={RING_SIZE}
            width={12}
            fill={ratio * 100}
            duration={1200}
            tintColor={colors.action}
            backgroundColor={colors.border}
            lineCap="round"
            rotation={0}
          >
            {() => <Text style={styles.ringText}>{Math.round(ratio * 100)}%</Text>}
          </AnimatedCircularProgress>
          <View style={[styles.xpColumn, stacked && styles.xpColumnStacked]}>
            <View style={[styles.xpRow, stacked && styles.xpRowStacked]}>
              <MaterialCommunityIcons name="star-four-points" size={26} color={rewardColors.xp} />
              <Text style={styles.xpEarned}>+{xpEarned}</Text>
              <Text style={styles.xpUnit}>XP</Text>
            </View>
            {result.breakdown.map((item, index) => (
              <Animated.View key={item.key} entering={FadeInDown.delay(700 + index * 150)} style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <Text style={styles.breakdownValue}>+{item.xp}</Text>
              </Animated.View>
            ))}
            {result.alreadyAnswered && (
              <Text style={styles.breakdownLabel}>These questions were already answered: no XP this time.</Text>
            )}
          </View>
        </Animated.View>

        {rewards && result.previous && (
          <Animated.View entering={FadeInDown.delay(600)}>
            <LevelProgress
              previous={result.previous}
              rewards={rewards}
              leveledUp={result.leveledUp}
              onLevelUp={celebrateLevelUp}
            />
          </Animated.View>
        )}

        {streak && streak.current > 0 && (
          <Animated.View entering={FadeInDown.delay(800)} style={[styles.card, styles.streakCard]}>
            <StreakFlame count={streak.current} />
            <Text style={styles.streakText}>
              {streakBonus ? `+${streakBonus.xp} XP daily bonus. ` : ''}Come back tomorrow to keep the flame alive!
            </Text>
          </Animated.View>
        )}

        {(result.newMilestones || []).length > 0 && (
          <Animated.View entering={FadeInDown.delay(900)} style={styles.card}>
            <Text style={styles.sectionTitle}>
              {result.newMilestones.length === 1 ? 'Milestone reached!' : 'Milestones reached!'}
            </Text>
            {result.newMilestones.map((milestone, index) => (
              <Animated.View
                key={`${milestone.path}-${milestone.level}`}
                entering={ZoomIn.delay(1100 + index * 250).springify().damping(9)}
                style={styles.milestoneRow}
              >
                <PathIcon pathKey={milestone.path} size={44} />
                <View style={styles.milestoneTexts}>
                  <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                  <Text style={styles.breakdownLabel}>
                    {milestone.pathTitle} path · milestone {milestone.level} of {milestone.total}
                  </Text>
                </View>
              </Animated.View>
            ))}
            <AppButton variant="link" size="medium" onPress={() => navigation.navigate('LearningPath')}>
              View my learning path
            </AppButton>
          </Animated.View>
        )}

        {result.newBadges.length > 0 && (
          <Animated.View entering={FadeIn.delay(1000)} style={styles.card}>
            <Text style={styles.sectionTitle}>
              {result.newBadges.length === 1 ? 'New badge unlocked!' : 'New badges unlocked!'}
            </Text>
            <View style={styles.badges}>
              {result.newBadges.map((badge, index) => (
                <View key={badge.key} style={styles.badgeItem}>
                  <BadgeMedal badgeKey={badge.key} title={badge.title} size={64} enteringDelay={1300 + index * 300} />
                  <Animated.Text entering={FadeIn.delay(1500 + index * 300)} style={styles.badgeDescription}>
                    {badge.description}
                  </Animated.Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {saveError && (
          <Animated.View entering={FadeIn} style={[styles.card, styles.saveError]}>
            <MaterialCommunityIcons name="cloud-alert" size={22} color={colors.danger} />
            <Text style={styles.saveErrorText}>Your XP couldn't be saved. Check your connection.</Text>
            <AppButton variant="link" size="medium" onPress={save} loading={saving} disabled={saving}>
              Retry
            </AppButton>
          </Animated.View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: spacing.m + insets.bottom }]}>
        <AppButton fullWidth icon="arrow-right" iconPosition="right" onPress={goToTrack}>
          Continue
        </AppButton>
      </View>

      <ConfettiBurst
        trigger={confetti}
        count={ratio >= 1 ? 70 : 48}
        power={ratio >= 1 ? 1.2 : 1}
        origin={{ x: 0.5, y: 0.22 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    alignItems: 'stretch',
  },
  counting: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
  },
  countingText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  heroWrap: {
    alignSelf: 'center',
  },
  hero: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
  },
  title: {
    ...typography.title,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginTop: spacing.m,
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.l,
  },
  card: {
    padding: spacing.m,
    marginBottom: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  scoreCardStacked: {
    flexDirection: 'column',
  },
  ringText: {
    ...typography.h1,
  },
  xpColumn: {
    flex: 1,
  },
  xpColumnStacked: {
    flex: 0,
    alignSelf: 'stretch',
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  xpRowStacked: {
    justifyContent: 'center',
  },
  xpEarned: {
    fontFamily: fonts.bold,
    fontSize: scale(34),
    lineHeight: scale(40),
    color: colors.text,
  },
  xpUnit: {
    ...typography.h3,
    color: rewardColors.xp,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  breakdownLabel: {
    ...typography.caption,
  },
  breakdownValue: {
    ...typography.caption,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  levelTexts: {
    flex: 1,
  },
  levelTitle: {
    ...typography.h3,
  },
  levelCaption: {
    ...typography.caption,
  },
  levelUp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: sizes.buttonRadius,
    backgroundColor: colors.accent,
    alignSelf: 'center',
  },
  levelUpText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    color: colors.textOnColor,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
  },
  streakText: {
    ...typography.bodySmall,
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.m,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    marginBottom: spacing.s,
  },
  milestoneTexts: {
    flex: 1,
  },
  milestoneTitle: {
    ...typography.h3,
  },
  badgeItem: {
    width: 120,
    alignItems: 'center',
  },
  badgeDescription: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  saveError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  saveErrorText: {
    ...typography.bodySmall,
    flex: 1,
  },
  footer: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
  },
});

export default Finish;
