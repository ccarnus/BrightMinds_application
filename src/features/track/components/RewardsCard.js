import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Dialog, Portal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fonts, layout, rewardColors, sizes, spacing, typography } from '@shared/config/theme';
import haptics from '@shared/utils/haptics';
import AppButton from '@shared/components/AppButton';
import LevelBadge from '@features/track/components/LevelBadge';
import XpBar from '@features/track/components/XpBar';
import StreakFlame from '@features/track/components/StreakFlame';
import BadgeMedal from '@features/track/components/BadgeMedal';

const Stat = ({ icon, color, value, label }) => (
  <View style={styles.stat} accessible accessibilityLabel={`${value} ${label}`}>
    <MaterialCommunityIcons name={icon} size={20} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : null;
};

/** Track tab summary of the quiz rewards: level, XP, streak, stats and achievements. */
const RewardsCard = ({ rewards }) => {
  const [selected, setSelected] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const stats = rewards.stats || {};
  const badges = [...(rewards.badges || [])].sort((a, b) => Number(b.earned) - Number(a.earned));
  const earnedCount = badges.filter((badge) => badge.earned).length;
  const earnedOn = formatDate(selected?.earnedAt);

  const openBadge = (badge) => {
    haptics.tap();
    setSelected(badge);
    setDialogVisible(true);
  };
  const closeBadge = () => setDialogVisible(false);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <LevelBadge level={rewards.level} size={56} />
        <View style={styles.headerTexts}>
          <Text style={styles.title} numberOfLines={1}>
            {rewards.levelTitle}
          </Text>
          <Text style={styles.caption}>{rewards.xp} XP total</Text>
        </View>
      </View>

      <XpBar progress={rewards.progress} from={0} delay={300} />
      <View style={styles.progressRow}>
        <StreakFlame count={rewards.streak?.current || 0} compact />
        <Text style={styles.caption}>
          {rewards.levelSpan - rewards.levelXp} XP to level {rewards.level + 1}
        </Text>
      </View>

      <View style={styles.stats}>
        <Stat icon="clipboard-check-outline" color={colors.accent} value={stats.quizzesCompleted || 0} label="Quizzes" />
        <Stat icon="check-decagram" color={colors.action} value={stats.correctAnswers || 0} label="Correct" />
        <Stat icon="fire" color={rewardColors.streak} value={rewards.streak?.best || 0} label="Best streak" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <Text style={styles.caption}>
          {earnedCount} / {badges.length}
        </Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges}>
        {badges.map((badge) => (
          <BadgeMedal
            key={badge.key}
            badgeKey={badge.key}
            title={badge.title}
            earned={badge.earned}
            size={52}
            onPress={() => openBadge(badge)}
          />
        ))}
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeBadge} style={styles.dialog}>
          {selected && (
            <Dialog.Content style={styles.dialogContent}>
              <BadgeMedal
                badgeKey={selected.key}
                title={selected.title}
                earned={selected.earned}
                size={96}
                showTitle={false}
              />
              <Text style={styles.dialogTitle}>{selected.title}</Text>
              <Text style={styles.dialogText}>{selected.description}</Text>
              <Text style={[styles.dialogStatus, selected.earned && styles.dialogStatusEarned]}>
                {selected.earned
                  ? earnedOn
                    ? `Unlocked on ${earnedOn}`
                    : 'Unlocked'
                  : 'Locked: keep answering quizzes to unlock it'}
              </Text>
            </Dialog.Content>
          )}
          <Dialog.Actions style={styles.dialogActions}>
            <AppButton size="medium" onPress={closeBadge}>
              Got it!
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: sizes.radius,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
    marginBottom: spacing.m,
  },
  headerTexts: {
    flex: 1,
  },
  title: {
    ...typography.h3,
  },
  caption: {
    ...typography.caption,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s,
    marginTop: spacing.s,
  },
  stats: {
    flexDirection: 'row',
    marginTop: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: sizes.radius - 4,
    backgroundColor: colors.background,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.bold,
    fontSize: sizes.h3,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: sizes.h4,
  },
  badges: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  dialog: {
    width: '88%',
    maxWidth: layout.maxContentWidth * 0.8,
    marginHorizontal: 0,
    alignSelf: 'center',
    backgroundColor: colors.surface,
  },
  dialogContent: {
    alignItems: 'center',
    paddingTop: spacing.m,
  },
  dialogTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginTop: spacing.s,
  },
  dialogText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  dialogStatus: {
    ...typography.caption,
    fontFamily: fonts.bold,
    textAlign: 'center',
    marginTop: spacing.m,
  },
  dialogStatusEarned: {
    color: colors.action,
  },
  dialogActions: {
    justifyContent: 'center',
    paddingBottom: spacing.m,
  },
});

export default RewardsCard;
