import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, sizes, spacing, typography } from '@shared/config/theme';
import MilestoneNode, { milestoneState } from '@features/learning/components/MilestoneNode';
import { METRIC_STYLES, fieldDisplay, formatDate } from '@features/learning/utils/pathStyles';

const NODE_SIZE = 32;

// "3 casts & articles · 2 correct answers in Chemistry"
const goalsSummary = (goals, focusField) =>
  goals
    .map((goal) => `${goal.target} ${(METRIC_STYLES[goal.metric]?.label || goal.metric).toLowerCase()}`)
    .join(' · ') + (focusField ? ` in ${fieldDisplay(focusField)}` : '');

/** Vertical journey with every milestone: when it was reached, how close the next one is. */
const MilestoneTimeline = ({ milestones = [], color, focusField }) => (
  <View>
    {milestones.map((milestone, index) => {
      const state = milestoneState(milestones, index);
      const isLast = index === milestones.length - 1;
      const reachedOn = formatDate(milestone.reachedAt);
      let status = goalsSummary(milestone.goals, focusField);
      if (state === 'reached') status = reachedOn ? `Reached on ${reachedOn}` : 'Reached';
      if (state === 'next') status = `${Math.round(milestone.progress * 100)}% there · ${status}`;
      return (
        <View key={milestone.level} style={styles.item}>
          <View style={styles.rail}>
            <MilestoneNode state={state} level={milestone.level} isLast={isLast} color={color} size={NODE_SIZE} />
            {!isLast && (
              <View
                style={[styles.connector, { backgroundColor: milestones[index + 1].reached ? color : colors.border }]}
              />
            )}
          </View>
          <View style={[styles.content, !isLast && styles.contentSpaced]}>
            <Text style={[styles.title, state === 'locked' && styles.locked]}>
              {milestone.title}
              <Text style={styles.level}>{`  ${milestone.level}/${milestones.length}`}</Text>
            </Text>
            <Text style={[styles.status, state === 'next' && { color }]}>{status}</Text>
          </View>
        </View>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    gap: spacing.s + 4,
  },
  rail: {
    alignItems: 'center',
    width: NODE_SIZE,
  },
  connector: {
    flex: 1,
    width: 3,
    minHeight: spacing.m,
    marginVertical: 2,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingTop: 4,
  },
  contentSpaced: {
    paddingBottom: spacing.m,
  },
  title: {
    ...typography.h3,
    fontSize: sizes.h4,
  },
  locked: {
    color: colors.textMuted,
  },
  level: {
    fontFamily: fonts.regular,
    fontSize: sizes.h5,
    color: colors.textMuted,
  },
  status: {
    ...typography.caption,
    marginTop: 2,
  },
});

export default MilestoneTimeline;
