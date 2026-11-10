import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, fonts, rewardColors, scale, sizes, spacing, typography } from '@shared/config/theme';
import { api } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import haptics from '@shared/utils/haptics';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import AppButton from '@shared/components/AppButton';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';
import LevelBadge from '@features/track/components/LevelBadge';
import XpBar from '@features/track/components/XpBar';
import StreakFlame from '@features/track/components/StreakFlame';
import { maxQuizXp, nextStreakDay } from '@features/track/utils/rewards';
import { fetchRewards } from '@features/track/utils/quizApi';

const readyImage = require('@assets/Track_icons/ready.png');

/** Gently floating illustration. */
const FloatingImage = ({ size, empty }) => {
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withSequence(withTiming(-10, { duration: 1400 }), withTiming(0, { duration: 1400 })), -1);
    return () => cancelAnimation(float);
  }, [float]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));
  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.imageWrap}>
      <Animated.Image
        source={readyImage}
        style={[{ width: size, height: size }, empty && styles.imageEmpty, style]}
        resizeMode="contain"
      />
    </Animated.View>
  );
};

/** Pulsing call to action, so the next step is obvious. */
const PulsingButton = ({ children, ...props }) => {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.04, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
    return () => cancelAnimation(pulse);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));
  return (
    <Animated.View style={style}>
      <AppButton fullWidth {...props}>
        {children}
      </AppButton>
    </Animated.View>
  );
};

const streakHint = (streak) => {
  if (!streak) return null;
  if (streak.completedToday) return "Today's streak is secured. Extra quizzes still earn XP!";
  if (streak.current > 0) return `Answer today to reach a ${nextStreakDay(streak)}-day streak!`;
  return 'Answer today to start a daily streak.';
};

const ReadyScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [evaluations, setEvaluations] = useState([]);
  const [rewards, setRewards] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const numQuestions = evaluations.length;

  const loadEvaluations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { userId } = await getUser();
      let pending = [];
      let userRewards = null;
      if (userId && !isGuestUser(userId)) {
        const [{ data }, rewardsData] = await Promise.all([
          api.get(`/user/${userId}`),
          // Rewards are a bonus: the quiz must stay available if they fail to load.
          fetchRewards(userId).catch((rewardsError) => {
            console.warn('Rewards unavailable:', rewardsError?.message);
            return null;
          }),
        ]);
        pending = (data?.evaluation_list || [])
          .filter((item) => item.watched && !item.answered)
          .map((item) => ({ contentid: item.contentid, type: item.type }));
        userRewards = rewardsData;
      }
      if (!mountedRef.current) return;
      setEvaluations(pending);
      setRewards(userRewards);
    } catch (loadError) {
      console.error('Error fetching evaluation list:', loadError);
      if (mountedRef.current) setError(loadError);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadEvaluations();
    return () => {
      mountedRef.current = false;
    };
  }, [loadEvaluations]);

  const startQuiz = () => {
    haptics.impact();
    navigation.navigate('Evaluation', { evaluations });
  };

  const exploreCasts = () => navigation.popTo('BottomNav', { screen: 'Cast' });

  if (isLoading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ErrorState
          error={error}
          onRetry={loadEvaluations}
          fallbackMessage="We couldn't load your questions."
          secondaryActionLabel="Go back"
          onSecondaryAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const imageSize = Math.min(width * 0.42, 200);
  const hasQuestions = numQuestions > 0;
  const hint = streakHint(rewards?.streak);

  return (
    <View style={styles.container}>
      <BackButton onPress={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + BACK_BUTTON_SIZE + spacing.s, paddingBottom: spacing.l },
        ]}
      >
        <FloatingImage size={imageSize} empty={!hasQuestions} />

        <Animated.View entering={FadeInDown.delay(150)} style={styles.headline}>
          {hasQuestions ? (
            <>
              <Text style={styles.label}>You have</Text>
              <Text style={styles.count}>{numQuestions}</Text>
              <Text style={styles.label}>{numQuestions === 1 ? 'question waiting' : 'questions waiting'}</Text>
            </>
          ) : (
            <>
              <Text style={styles.emptyTitle} accessibilityRole="header">
                All caught up!
              </Text>
              <Text style={styles.emptyText}>
                Watch casts or read articles to unlock new questions, then come back to earn XP.
              </Text>
            </>
          )}
        </Animated.View>

        {hasQuestions && (
          <Animated.View entering={FadeInDown.delay(300)} style={styles.xpPill}>
            <MaterialCommunityIcons name="star-four-points" size={18} color={rewardColors.xp} />
            <Text style={styles.xpPillText}>Earn up to +{maxQuizXp(numQuestions, rewards)} XP</Text>
          </Animated.View>
        )}

        {rewards && (
          <Animated.View entering={FadeInDown.delay(450)} style={styles.card}>
            <View style={styles.levelRow}>
              <LevelBadge level={rewards.level} size={52} />
              <View style={styles.levelTexts}>
                <Text style={styles.levelTitle} numberOfLines={1}>
                  {rewards.levelTitle}
                </Text>
                <Text style={styles.levelCaption}>
                  {rewards.levelXp} / {rewards.levelSpan} XP to level {rewards.level + 1}
                </Text>
              </View>
            </View>
            <XpBar progress={rewards.progress} from={0} delay={500} />
            <View style={styles.streakRow}>
              <StreakFlame count={rewards.streak.current} compact />
              {hint && <Text style={styles.streakHint}>{hint}</Text>}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(600)}
        style={[styles.footer, { paddingBottom: spacing.m + insets.bottom }]}
      >
        {hasQuestions ? (
          <PulsingButton icon="rocket-launch" iconPosition="right" onPress={startQuiz}>
            Let's go!
          </PulsingButton>
        ) : (
          <AppButton fullWidth variant="accent" icon="play-circle-outline" onPress={exploreCasts}>
            Explore casts
          </AppButton>
        )}
      </Animated.View>
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
  },
  imageWrap: {
    marginBottom: spacing.m,
  },
  imageEmpty: {
    opacity: 0.85,
  },
  headline: {
    alignItems: 'center',
  },
  label: {
    ...typography.h3,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  count: {
    fontFamily: fonts.bold,
    fontSize: scale(64),
    lineHeight: scale(76),
    color: colors.text,
    textAlign: 'center',
  },
  emptyTitle: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.m,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: sizes.buttonRadius,
    backgroundColor: rewardColors.xpSoft,
  },
  xpPillText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    color: colors.text,
  },
  card: {
    alignSelf: 'stretch',
    marginTop: spacing.l,
    padding: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.m,
  },
  streakHint: {
    ...typography.caption,
    flex: 1,
  },
  footer: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
  },
});

export default ReadyScreen;
