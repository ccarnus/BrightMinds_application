import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, scale, spacing, tints, typography } from '@shared/config/theme';

/** Title of a home section: a tinted icon bubble, the title and an optional one-line subtitle. */
const SectionHeader = ({ icon, color = colors.accent, tint = tints.blue, title, subtitle, style }) => (
  <View style={[styles.row, style]}>
    <View style={[styles.bubble, { backgroundColor: tint }]}>
      <Ionicons name={icon} size={scale(18)} color={color} />
    </View>
    <View style={styles.texts}>
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      {!!subtitle && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  </View>
);

const BUBBLE = scale(36);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    paddingHorizontal: spacing.m,
    marginTop: spacing.l,
    marginBottom: spacing.s + 4,
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1 },
  title: { ...typography.h3 },
  subtitle: { ...typography.caption, marginTop: 1 },
});

export default SectionHeader;
