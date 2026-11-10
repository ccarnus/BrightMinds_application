import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, RefreshControl } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, contentWidth, fonts, rewardColors, scale, sizes, spacing, typography } from '@shared/config/theme';
import departments from '@shared/data/departments';
import { api } from '@shared/api/client';
import { getUser, isGuestUser, clearUser } from '@shared/utils/UserStorage';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import { useTabBarSpace } from '@navigation/FloatingTabBar';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import ErrorSnackbar from '@shared/components/ErrorSnackbar';
import AppButton from '@shared/components/AppButton';
import RewardsCard from '@features/track/components/RewardsCard';
import { fetchRewards } from '@features/track/utils/quizApi';
import LearningPathCard from '@features/learning/components/LearningPathCard';
import { fetchLearningProfile } from '@features/learning/utils/learningApi';

const Learning = require('@assets/Track_icons/learning.png');
const Progress = require('@assets/Track_icons/progress_illustration.png');
const BUTTON_HEIGHT = 52;
const TOPIC_GAUGE_SIZE = Math.min(scale(84), 110);
const GAUGE_TRACK = 'rgba(255, 255, 255, 0.3)';
const toPercent = (ratio) => Math.min(Math.max(Number.isFinite(ratio) ? ratio : 0, 0), 1) * 100;

const TrackScreen = () => {
  const [learning, setLearning] = useState(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [rewards, setRewards] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const hasLoadedRef = useRef(false);
  const tabBarSpace = useTabBarSpace();

  // `manual` marks a pull-to-refresh: its failure is reported, while a failed background
  // refresh (on focus) silently keeps the data already on screen.
  const fetchAllData = useCallback(async ({ isActive = () => true, manual = false } = {}) => {
    try {
      const { userId } = await getUser();
      const guest = !userId || isGuestUser(userId);
      if (!isActive()) return;
      setIsGuest(guest);
      // Guests have no tracking data; the sign-in overlay is shown instead.
      if (guest) return;

      const [learningProfile, userResponse, rewardsData] = await Promise.all([
        fetchLearningProfile(userId),
        api.get(`/user/${userId}`),
        // Rewards are a bonus: their failure must not hide the learning progress.
        fetchRewards(userId).catch((rewardsError) => {
          console.warn('Rewards unavailable:', rewardsError?.message);
          return undefined;
        }),
      ]);
      if (!isActive()) return;

      setLearning(learningProfile);
      const evaluationList = userResponse.data?.evaluation_list || [];
      setAnsweredCount(evaluationList.filter((evaluation) => evaluation.answered).length);
      setPendingCount(
        evaluationList.filter((evaluation) => evaluation.watched && !evaluation.answered).length
      );
      // `undefined` = failed this time (keep what is shown); `null` = backend without rewards.
      if (rewardsData !== undefined) setRewards(rewardsData);
      setLoadError(null);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Error fetching learning progress:', error);
      if (!isActive()) return;
      if (!hasLoadedRef.current) setLoadError(error);
      else if (manual) setRefreshError(error);
    } finally {
      if (isActive()) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Refetch on focus so progress is up to date after finishing a quiz.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      fetchAllData({ isActive: () => active });
      return () => {
        active = false;
      };
    }, [fetchAllData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshError(null);
    fetchAllData({ manual: true });
  }, [fetchAllData]);

  const retry = () => {
    setLoadError(null);
    setIsLoading(true);
    fetchAllData();
  };

  const handleSignIn = async () => {
    await clearUser();
    resetToAuthChoice(navigation);
  };

  if (isLoading) {
    return <Loader backgroundColor={colors.background} style={{ paddingBottom: tabBarSpace }} />;
  }

  if (loadError) {
    return (
      <View style={[styles.container, { paddingBottom: tabBarSpace }]}>
        <ErrorState
          error={loadError}
          onRetry={retry}
          fallbackMessage="We couldn't load your learning progress."
        />
      </View>
    );
  }

  // The floating "Test Yourself" button sits just above the tab bar.
  const buttonBottom = tabBarSpace - spacing.s;
  // Fields the user learned about; each gauge is relative to their most studied field.
  const fields = (learning?.stats?.fields || []).filter((field) => field.contents > 0);
  const maxContents = Math.max(1, ...fields.map((field) => field.contents));

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: buttonBottom + BUTTON_HEIGHT + spacing.l }]}
        refreshControl={
          isGuest ? undefined : <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hidden on servers without learning paths (`learning` is null). */}
        {!isGuest && !!learning && (
          <LearningPathCard
            learning={learning}
            onPress={() => navigation.navigate('LearningPath')}
            onChoose={() => navigation.navigate('LearningPathPicker', { mode: 'change' })}
          />
        )}

        {!isGuest && rewards && <RewardsCard rewards={rewards} />}

        <LinearGradient
          colors={[colors.lightblue, colors.darkblue]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.cardTagline}>Understand the research shaping tomorrow's world</Text>
          <View style={styles.learnedRow}>
            <View style={styles.learnedCount}>
              <Text style={styles.bigNumber}>{answeredCount}</Text>
              <Text style={styles.cardCaption}>
                {answeredCount === 1 ? 'Topic learned' : 'Topics learned'}
              </Text>
            </View>
            <Image source={Learning} style={styles.cardIllustration} resizeMode="contain" />
          </View>
        </LinearGradient>

        <LinearGradient
          colors={[colors.lightOrange, colors.darkOrange]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Image source={Progress} style={styles.headerIllustration} resizeMode="contain" />
            <Text style={[styles.cardTitle, styles.cardHeaderTitle]}>What you are learning about</Text>
          </View>
          {fields.length > 0 ? (
            <View style={styles.topicGrid}>
              {fields.map((field) => {
                const department = departments.find((dep) => dep.name === field.field);
                const percent = toPercent(field.contents / maxContents);
                return (
                  <View
                    style={styles.topicItem}
                    key={field.field}
                    accessible
                    accessibilityLabel={`${department ? department.display : field.field}: ${field.contents} watched or read`}
                  >
                    <AnimatedCircularProgress
                      size={TOPIC_GAUGE_SIZE}
                      width={8}
                      fill={percent}
                      tintColor={colors.textOnColor}
                      backgroundColor={GAUGE_TRACK}
                      lineCap="round"
                      rotation={0}
                    >
                      {() => <Text style={styles.topicGaugeText}>{field.contents}</Text>}
                    </AnimatedCircularProgress>
                    <Text style={styles.topicName} numberOfLines={2}>
                      {department ? department.display : field.field}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No learnings yet. Watch a cast to get started!</Text>
          )}
        </LinearGradient>
      </ScrollView>

      <View style={[styles.floatingAction, { bottom: buttonBottom }]} pointerEvents="box-none">
        <View style={styles.floatingButton}>
          <AppButton
            icon={require('@assets/Track_icons/test.png')}
            onPress={() => navigation.navigate('Ready')}
            fullWidth
            accessibilityLabel={
              pendingCount > 0
                ? `Test Yourself, ${pendingCount} ${pendingCount === 1 ? 'question' : 'questions'} waiting`
                : 'Test Yourself'
            }
          >
            Test Yourself
          </AppButton>
          {!isGuest && pendingCount > 0 && (
            <View style={styles.countBubble} pointerEvents="none">
              <Text style={styles.countText}>{pendingCount > 99 ? '99+' : pendingCount}</Text>
            </View>
          )}
        </View>
      </View>

      <ErrorSnackbar
        error={refreshError}
        onDismiss={() => setRefreshError(null)}
        onRetry={onRefresh}
        wrapperStyle={{ bottom: buttonBottom + BUTTON_HEIGHT }}
      />

      {isGuest && (
        <BlurView intensity={80} style={StyleSheet.absoluteFill}>
          <View style={[styles.overlayContainer, { paddingBottom: tabBarSpace }]}>
            <Text style={styles.overlayText}>Create an account to track your learning.</Text>
            <AppButton icon={require('@assets/Track_icons/user.png')} onPress={handleSignIn}>
              Log in
            </AppButton>
          </View>
        </BlurView>
      )}
    </View>
  );
};
export default TrackScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    gap: spacing.m,
  },
  card: {
    borderRadius: sizes.radius,
    padding: spacing.m,
    overflow: 'hidden',
  },
  cardTagline: {
    ...typography.body,
    color: colors.textOnColor,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textOnColor,
  },
  cardCaption: {
    ...typography.bodySmall,
    color: colors.textOnColor,
  },
  learnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.s,
  },
  learnedCount: {
    flex: 1,
    alignItems: 'center',
  },
  bigNumber: {
    fontFamily: fonts.bold,
    fontSize: scale(56),
    lineHeight: scale(64),
    color: colors.textOnColor,
  },
  cardIllustration: {
    width: '50%',
    height: Math.min(scale(130), 160),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  headerIllustration: {
    width: scale(84),
    height: scale(84),
  },
  cardHeaderTitle: {
    flex: 1,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.m,
    marginTop: spacing.m,
  },
  topicItem: {
    width: TOPIC_GAUGE_SIZE + spacing.m,
    alignItems: 'center',
  },
  topicGaugeText: {
    ...typography.caption,
    fontFamily: fonts.bold,
    color: colors.textOnColor,
  },
  topicName: {
    ...typography.caption,
    marginTop: spacing.xs,
    color: colors.textOnColor,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textOnColor,
    textAlign: 'center',
    marginVertical: spacing.l,
  },
  floatingAction: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.l,
  },
  floatingButton: {
    width: '100%',
    maxWidth: 360,
  },
  countBubble: {
    position: 'absolute',
    top: -6,
    right: 4,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rewardColors.streak,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  countText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: colors.textOnColor,
  },
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.l,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    padding: spacing.l,
  },
  overlayText: {
    ...typography.h1,
    textAlign: 'center',
  },
});