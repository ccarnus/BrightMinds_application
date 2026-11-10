import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, sizes, spacing, typography } from '@shared/config/theme';
import PathIcon from '@features/learning/components/PathIcon';
import { METRIC_STYLES, pathStyle } from '@features/learning/utils/pathStyles';

/** A path in the picker; the selected one expands with its details (and `children`, e.g. a focus field). */
const PathOptionCard = ({ path, selected, current, onPress, children }) => {
  const accent = pathStyle(path.key).colors[1];
  const first = path.milestones[0];

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${path.title}. ${path.tagline}${current ? '. Current path' : ''}`}
      style={[styles.card, selected && { borderColor: accent, borderWidth: 2 }]}
    >
      <View style={styles.header}>
        <PathIcon pathKey={path.key} size={48} />
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{path.title}</Text>
            {current && (
              <View style={[styles.currentChip, { backgroundColor: accent }]}>
                <Text style={styles.currentText}>Current</Text>
              </View>
            )}
          </View>
          <Text style={styles.tagline}>{path.tagline}</Text>
        </View>
        <View style={[styles.radio, selected && { borderColor: accent }]}>
          {selected && <View style={[styles.radioDot, { backgroundColor: accent }]} />}
        </View>
      </View>

      {selected && (
        <Animated.View entering={FadeIn.duration(250)} style={styles.details}>
          <Text style={styles.description}>{path.description}</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="star-four-points" size={16} color={accent} />
            <Text style={styles.infoText}>{path.feed}</Text>
          </View>
          <Text style={styles.sectionLabel}>{path.milestones.length} milestones</Text>
          <Text style={styles.milestones}>{path.milestones.map((step) => step.title).join('  →  ')}</Text>
          <Text style={styles.sectionLabel}>First milestone: {first.title}</Text>
          <View style={styles.goals}>
            {first.goals.map((goal) => (
              <View key={goal.metric} style={styles.goalChip}>
                <MaterialCommunityIcons name={METRIC_STYLES[goal.metric]?.icon || 'circle-outline'} size={14} color={accent} />
                <Text style={styles.goalText}>
                  {goal.target} {(METRIC_STYLES[goal.metric]?.label || goal.metric).toLowerCase()}
                </Text>
              </View>
            ))}
          </View>
          {children}
        </Animated.View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
  },
  texts: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  title: {
    ...typography.h3,
  },
  currentChip: {
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    borderRadius: sizes.buttonRadius,
  },
  currentText: {
    fontFamily: fonts.bold,
    fontSize: sizes.small,
    color: colors.textOnColor,
  },
  tagline: {
    ...typography.caption,
    marginTop: 2,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  details: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  description: {
    ...typography.bodySmall,
    color: colors.text,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: colors.text,
    marginTop: spacing.m,
  },
  milestones: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  goals: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
    borderRadius: sizes.buttonRadius,
    backgroundColor: colors.background,
  },
  goalText: {
    ...typography.caption,
    color: colors.text,
  },
});

export default PathOptionCard;
