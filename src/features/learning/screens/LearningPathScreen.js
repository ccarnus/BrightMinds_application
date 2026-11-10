import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, fonts, sizes, spacing, typography } from '@shared/config/theme';
import { getUser } from '@shared/utils/UserStorage';
import haptics from '@shared/utils/haptics';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import StateMessage from '@shared/components/StateMessage';
import AppButton from '@shared/components/AppButton';
import ConfettiBurst from '@shared/components/ConfettiBurst';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';
import PathIcon from '@features/learning/components/PathIcon';
import GoalRow from '@features/learning/components/GoalRow';
import MilestoneTrail from '@features/learning/components/MilestoneTrail';
import MilestoneTimeline from '@features/learning/components/MilestoneTimeline';
import { fetchLearningPaths, fetchLearningProfile } from '@features/learning/utils/learningApi';
import {
  GOAL_ACTIONS,
  METRIC_STYLES,
  fieldDisplay,
  formatDate,
  pathStyle,
  weakestGoal,
} from '@features/learning/utils/pathStyles';

const TOP_FIELDS = 5;

const StatTile = ({ metric, value, label }) => (
  <View style={styles.statTile} accessible accessibilityLabel={`${value} ${label}`}>
    <MaterialCommunityIcons name={METRIC_STYLES[metric].icon} size={22} color={colors.accent} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const Section = ({ title, delay = 0, children }) => (
  <Animated.View entering={FadeInDown.delay(delay)} style={styles.card}>
    {!!title && <Text style={styles.cardTitle}>{title}</Text>}
    {children}
  </Animated.View>
);

/** The user's learning path: journey, milestones, activity, path details and previous paths. */
const LearningPathScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [learning, setLearning] = useState(null);
  const [pathInfo, setPathInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [celebration, setCelebration] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async ({ isActive = () => true } = {}) => {
    try {
      const { userId } = await getUser();
      const [profile, catalog] = await Promise.all([
        fetchLearningProfile(userId),
        // The catalog only adds the path description.
        fetchLearningPaths().catch(() => []),
      ]);
      if (!isActive()) return;
      setLearning(profile);
      setPathInfo(catalog.find((path) => path.key === profile?.path) || null);
      setError(null);
      hasLoadedRef.current = true;
    } catch (loadError) {
      console.error('Error loading the learning path:', loadError);
      if (isActive() && !hasLoadedRef.current) setError(loadError);
    } finally {
      if (isActive()) setIsLoading(false);
    }
  }, []);

  // Refetch on focus: activity elsewhere (casts, quizzes, papers) moves the journey forward.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      load({ isActive: () => active });
      return () => {
        active = false;
      };
    }, [load])
  );

  // Milestones unlocked right away by a path switch (sent by the picker).
  const celebrateAt = route.params?.at;
  useEffect(() => {
    if (!celebrateAt) return;
    const count = route.params?.celebrate || 0;
    setCelebration(count);
    if (count > 0) {
      haptics.celebrate();
      setConfetti(Date.now());
    }
    navigation.setParams({ celebrate: undefined, at: undefined });
    // Runs once per picker result; `at` identifies it.
  }, [celebrateAt]);

  const retry = () => {
    setError(null);
    setIsLoading(true);
    load();
  };

  const choosePath = () => navigation.navigate('LearningPathPicker', { mode: 'change' });
  const goBack = () => navigation.goBack();
  const backButton = (tone) => <BackButton tone={tone} onPress={goBack} />;

  if (isLoading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (error || !learning?.path || !learning.journey) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {error ? (
          <ErrorState
            error={error}
            onRetry={retry}
            fallbackMessage="We couldn't load your learning path."
            secondaryActionLabel="Go back"
            onSecondaryAction={goBack}
          />
        ) : (
          <StateMessage
            icon="map-outline"
            title={learning ? 'No learning path yet' : 'Learning paths are coming soon'}
            message={
              learning
                ? 'Choose a path to get milestones that match how you like to learn.'
                : 'Update the app later to follow a learning path.'
            }
            actionLabel={learning ? 'Choose a path' : 'Go back'}
            onAction={learning ? choosePath : goBack}
          />
        )}
        {backButton('default')}
      </View>
    );
  }

  const { journey, stats } = learning;
  const { colors: gradient } = pathStyle(learning.path);
  const accent = gradient[1];
  const focusField = learning.focusField;
  const nextGoal = journey.next ? weakestGoal(journey.next.goals) : null;
  const action = nextGoal ? GOAL_ACTIONS[nextGoal.metric] : null;
  const since = formatDate(learning.startedAt);
  const topFields = stats.fields.slice(0, TOP_FIELDS);
  const maxContents = Math.max(1, ...topFields.map((field) => field.contents));

  const runAction = () => {
    if (!action) return;
    if (action.screen) navigation.navigate(action.screen);
    else navigation.popTo('BottomNav', { screen: action.tab });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.l + insets.bottom }}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + BACK_BUTTON_SIZE }]}
        >
          <Animated.View entering={ZoomIn.springify().damping(10)}>
            <PathIcon pathKey={learning.path} size={72} ring />
          </Animated.View>
          <Text style={styles.heroTitle} accessibilityRole="header">
            {learning.title}
          </Text>
          <Text style={styles.heroTagline}>{learning.tagline}</Text>
          <View style={styles.heroChips}>
            {!!focusField && (
              <View style={styles.heroChip}>
                <MaterialCommunityIcons name="target" size={14} color={colors.textOnColor} />
                <Text style={styles.heroChipText}>{fieldDisplay(focusField)}</Text>
              </View>
            )}
            {!!since && (
              <View style={styles.heroChip}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={14} color={colors.textOnColor} />
                <Text style={styles.heroChipText}>Since {since}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {celebration > 0 && (
            <Animated.View entering={ZoomIn.springify().damping(9)} style={[styles.banner, { borderColor: accent }]}>
              <MaterialCommunityIcons name="party-popper" size={26} color={accent} />
              <Text style={styles.bannerText}>
                Your learning already counts: {celebration}{' '}
                {celebration === 1 ? 'milestone' : 'milestones'} unlocked on this path!
              </Text>
            </Animated.View>
          )}

          <Section title={`${journey.level} of ${journey.total} milestones reached`} delay={100}>
            <MilestoneTrail milestones={journey.milestones} color={accent} size={32} />
            {journey.completed ? (
              <View style={styles.completed}>
                <MaterialCommunityIcons name="trophy" size={28} color={accent} />
                <Text style={styles.completedText}>
                  You completed the {learning.title} path. Keep learning, or take on a new path!
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.nextLabel}>
                  Next: <Text style={[styles.nextTitle, { color: accent }]}>{journey.next.title}</Text>
                </Text>
                {journey.next.goals.map((goal, index) => (
                  <GoalRow
                    key={goal.metric}
                    goal={goal}
                    focusField={focusField}
                    color={accent}
                    delay={250 + index * 120}
                  />
                ))}
                {!!action && (
                  <AppButton icon={action.icon} onPress={runAction} style={styles.action}>
                    {action.label}
                  </AppButton>
                )}
              </>
            )}
          </Section>

          <Section title="Milestones" delay={200}>
            <MilestoneTimeline milestones={journey.milestones} color={accent} focusField={focusField} />
          </Section>

          <Section title="Your learning so far" delay={300}>
            <Text style={styles.caption}>Everything counts, whatever the path: progress never resets.</Text>
            <View style={styles.stats}>
              <StatTile metric="contents" value={stats.contents} label="Casts & articles" />
              <StatTile metric="correctAnswers" value={stats.correctAnswers} label="Correct answers" />
              <StatTile metric="fields" value={stats.fieldsExplored} label="Fields explored" />
              <StatTile metric="papers" value={stats.papers} label="Research papers" />
            </View>
            {topFields.length > 0 && (
              <>
                <Text style={styles.subTitle}>Top fields</Text>
                {topFields.map((field) => (
                  <View key={field.field} style={styles.fieldRow}>
                    <View style={styles.fieldTexts}>
                      <Text style={styles.fieldName} numberOfLines={1}>
                        {fieldDisplay(field.field)}
                        {field.field === focusField ? '  ·  focus' : ''}
                      </Text>
                      <Text style={styles.fieldCaption}>
                        {field.contents} watched or read · {field.correctAnswers} correct
                        {field.papers > 0 ? ` · ${field.papers} ${field.papers === 1 ? 'paper' : 'papers'}` : ''}
                      </Text>
                    </View>
                    <View style={styles.fieldTrack}>
                      <View
                        style={[
                          styles.fieldFill,
                          { width: `${(field.contents / maxContents) * 100}%`, backgroundColor: accent },
                        ]}
                      />
                    </View>
                  </View>
                ))}
              </>
            )}
          </Section>

          {!!pathInfo && (
            <Section title="About this path" delay={400}>
              <Text style={styles.description}>{pathInfo.description}</Text>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="star-four-points" size={16} color={accent} />
                <Text style={styles.infoText}>{pathInfo.feed}</Text>
              </View>
            </Section>
          )}

          {learning.history.length > 0 && (
            <Section title="Previous paths" delay={500}>
              {learning.history.map((entry, index) => {
                const from = formatDate(entry.startedAt);
                const to = formatDate(entry.endedAt);
                return (
                  <View key={`${entry.path}-${index}`} style={styles.historyRow}>
                    <PathIcon pathKey={entry.path} size={36} />
                    <View style={styles.historyTexts}>
                      <Text style={styles.historyTitle} numberOfLines={1}>
                        {entry.title}
                        {entry.focusField ? ` · ${fieldDisplay(entry.focusField)}` : ''}
                      </Text>
                      <Text style={styles.caption}>
                        {[
                          from && to ? `${from} – ${to}` : to,
                          `${entry.milestonesReached} ${entry.milestonesReached === 1 ? 'milestone' : 'milestones'}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Section>
          )}

          <AppButton variant="secondary" fullWidth icon="swap-horizontal" onPress={choosePath}>
            Change learning path
          </AppButton>
        </View>
      </ScrollView>

      {backButton('light')}
      <ConfettiBurst trigger={confetti} count={56} origin={{ x: 0.5, y: 0.2 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.l,
  },
  heroTitle: {
    ...typography.h1,
    color: colors.textOnColor,
    marginTop: spacing.s + 4,
    textAlign: 'center',
  },
  heroTagline: {
    ...typography.bodySmall,
    color: colors.textOnColor,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  heroChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.s,
    marginTop: spacing.s + 4,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.s + 2,
    paddingVertical: spacing.xs,
    borderRadius: sizes.buttonRadius,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  heroChipText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: colors.textOnColor,
  },
  body: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    gap: spacing.m,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    padding: spacing.m,
    borderRadius: sizes.radius,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  bannerText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  card: {
    padding: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.m,
  },
  nextLabel: {
    ...typography.bodySmall,
    marginTop: spacing.m,
  },
  nextTitle: {
    fontFamily: fonts.bold,
  },
  action: {
    marginTop: spacing.m,
  },
  completed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    marginTop: spacing.m,
  },
  completedText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text,
  },
  caption: {
    ...typography.caption,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginTop: spacing.m,
  },
  statTile: {
    flexGrow: 1,
    flexBasis: '45%',
    alignItems: 'center',
    paddingVertical: spacing.s + 4,
    borderRadius: sizes.radius - 4,
    backgroundColor: colors.background,
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: sizes.h2,
    color: colors.text,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.caption,
  },
  subTitle: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    color: colors.text,
    marginTop: spacing.l,
    marginBottom: spacing.xs,
  },
  fieldRow: {
    marginTop: spacing.s,
  },
  fieldTexts: {
    gap: 2,
  },
  fieldName: {
    ...typography.bodySmall,
    color: colors.text,
    fontFamily: fonts.bold,
  },
  fieldCaption: {
    ...typography.caption,
  },
  fieldTrack: {
    height: 6,
    marginTop: spacing.xs,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  fieldFill: {
    height: '100%',
    borderRadius: 3,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s + 4,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    paddingVertical: spacing.xs,
  },
  historyTexts: {
    flex: 1,
  },
  historyTitle: {
    ...typography.bodySmall,
    color: colors.text,
    fontFamily: fonts.bold,
  },
});

export default LearningPathScreen;
