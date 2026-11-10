import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, sizes, spacing, typography } from '@shared/config/theme';
import departments from '@shared/data/departments';
import AppButton from '@shared/components/AppButton';

const byName = (a, b) => a.display.localeCompare(b.display);

/** Deep Learner focus field: the user's preferred fields first, every other field on demand. */
const FocusFieldPicker = ({ value, onChange, preferredFields = [], color = colors.accent }) => {
  const preferred = preferredFields
    .map((name) => departments.find((department) => department.name === name))
    .filter(Boolean);
  const others = departments.filter((department) => !preferredFields.includes(department.name)).sort(byName);
  const [showAll, setShowAll] = useState(
    preferred.length === 0 || (!!value && !preferredFields.includes(value))
  );

  const renderChip = ({ name, display }) => {
    const selected = name === value;
    return (
      <Pressable
        key={name}
        onPress={() => onChange(name)}
        accessibilityRole="radio"
        accessibilityState={{ checked: selected }}
        style={[styles.chip, selected && { backgroundColor: color, borderColor: color }]}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{display}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your focus field</Text>
      <Text style={styles.caption}>Only what you learn in this field counts toward your milestones.</Text>
      {preferred.length > 0 && (
        <>
          <Text style={styles.group}>Your fields</Text>
          <View style={styles.chips}>{preferred.map(renderChip)}</View>
        </>
      )}
      {showAll ? (
        <>
          <Text style={styles.group}>{preferred.length > 0 ? 'Other fields' : 'All fields'}</Text>
          <View style={styles.chips}>{others.map(renderChip)}</View>
        </>
      ) : (
        <AppButton variant="link" size="medium" icon="chevron-down" onPress={() => setShowAll(true)} style={styles.more}>
          Show all fields
        </AppButton>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.m,
    paddingTop: spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    color: colors.text,
  },
  caption: {
    ...typography.caption,
    marginTop: 2,
  },
  group: {
    ...typography.caption,
    fontFamily: fonts.bold,
    marginTop: spacing.s + 4,
    marginBottom: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.s + 4,
    borderRadius: sizes.buttonRadius,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
  },
  chipTextSelected: {
    color: colors.textOnColor,
    fontFamily: fonts.bold,
  },
  more: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});

export default FocusFieldPicker;
