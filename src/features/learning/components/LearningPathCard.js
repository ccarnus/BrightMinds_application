import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, sizes, spacing, typography } from '@shared/config/theme';
import AppButton from '@shared/components/AppButton';
import PathIcon from '@features/learning/components/PathIcon';
import GoalRow from '@features/learning/components/GoalRow';
import MilestoneTrail from '@features/learning/components/MilestoneTrail';
import { fieldDisplay, pathStyle } from '@features/learning/utils/pathStyles';

/**
 * Learning path summary (Track tab, Profile): path, milestone trail and the goals of the next
 * milestone. Without a path, invites the user to choose one.
 */
const LearningPathCard = ({ learning, onPress, onChoose, style }) => {
  if (!learning?.path || !learning.journey) {
    return (
      <View style={[styles.card, style]}>
        <View style={styles.header}>
          <PathIcon pathKey={null} size={48} />
          <View style={styles.headerTexts}>
            <Text style={styles.title}>Choose your learning path</Text>
            <Text style={styles.caption}>
              Follow, explore, go deep or go to the source: get milestones that match how you learn.
            </Text>
          </View>
        </View>
        <AppButton variant="accent" size="medium" icon="map-search-outline" onPress={onChoose} style={styles.cta}>
          Choose a path
        </AppButton>
      </View>
    );
  }

  const { journey } = learning;
  const accent = pathStyle(learning.path).colors[1];
  const missingFocus = learning.path === 'deep_learner' && !learning.focusField;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${learning.title} learning path${
        learning.focusField ? `, ${fieldDisplay(learning.focusField)}` : ''
      }. ${journey.level} of ${journey.total} milestones reached${
        journey.next ? `. Next: ${journey.next.title}` : ''
      }`}
      accessibilityHint="Opens your learning path"
      style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <PathIcon pathKey={learning.path} size={48} />
        <View style={styles.headerTexts}>
          <Text style={styles.overline}>My learning path</Text>
          <Text style={styles.title} numberOfLines={1}>
            {learning.title}
            {learning.focusField ? (
              <Text style={styles.focus}>{`  ·  ${fieldDisplay(learning.focusField)}`}</Text>
            ) : null}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
      </View>

      <MilestoneTrail milestones={journey.milestones} color={accent} style={styles.trail} />

      {missingFocus && (
        <Text style={styles.caption}>Choose a focus field to start measuring your progress.</Text>
      )}
      {!missingFocus && journey.completed && (
        <View style={styles.completed}>
          <MaterialCommunityIcons name="trophy" size={22} color={accent} />
          <Text style={styles.completedText}>
            Path completed! All {journey.total} milestones reached.
          </Text>
        </View>
      )}
      {!missingFocus && !journey.completed && journey.next && (
        <>
          <Text style={styles.nextLabel}>
            Next milestone · <Text style={[styles.nextTitle, { color: accent }]}>{journey.next.title}</Text>
          </Text>
          {journey.next.goals.map((goal, index) => (
            <GoalRow
              key={goal.metric}
              goal={goal}
              focusField={learning.focusField}
              color={accent}
              delay={200 + index * 120}
            />
          ))}
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
  },
  headerTexts: {
    flex: 1,
  },
  overline: {
    fontFamily: fonts.bold,
    fontSize: sizes.small,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  title: {
    ...typography.h3,
  },
  focus: {
    fontFamily: fonts.regular,
    fontSize: sizes.h4,
    color: colors.textSecondary,
  },
  caption: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.m,
    alignSelf: 'flex-start',
  },
  trail: {
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  nextLabel: {
    ...typography.bodySmall,
    marginTop: spacing.s,
  },
  nextTitle: {
    fontFamily: fonts.bold,
  },
  completed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  completedText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text,
    fontFamily: fonts.bold,
  },
});

export default LearningPathCard;
