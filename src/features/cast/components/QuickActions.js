import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import {
  colors,
  contentWidth,
  fonts,
  rewardColors,
  scale,
  shadow,
  sizes,
  spacing,
  tints,
  typography,
} from '@shared/config/theme';
import PressableScale from '@shared/components/PressableScale';

const BUBBLE = scale(42);

const ActionTile = ({ index, icon, color, tint, label, caption, badge, onPress }) => (
  <Animated.View entering={FadeInUp.delay(160 + index * 70).duration(400)} style={styles.tileWrapper}>
    <PressableScale
      onPress={onPress}
      style={styles.tile}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${caption}`}
    >
      <View style={[styles.bubble, { backgroundColor: tint }]}>
        <Ionicons name={icon} size={scale(22)} color={color} />
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text
        style={styles.label}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
      >
        {label}
      </Text>
      <Text style={styles.caption} numberOfLines={2}>
        {caption}
      </Text>
    </PressableScale>
  </Animated.View>
);

/**
 * Three shortcuts under the search: a random cast, the quiz (with the number of questions ready)
 * and the virtual labs. Guests have no quiz, so they only get the other two.
 */
const QuickActions = ({ guest, pendingCount, onDiscover, onQuiz, onLabs }) => {
  const tiles = [
    {
      key: 'discover',
      icon: 'shuffle',
      color: colors.action,
      tint: tints.green,
      label: 'Discover',
      caption: 'Surprise me',
      onPress: onDiscover,
    },
    ...(guest
      ? []
      : [
          {
            key: 'quiz',
            icon: 'flash',
            color: rewardColors.streak,
            tint: tints.orange,
            label: 'Quiz',
            caption: pendingCount > 0 ? `${pendingCount} ready` : 'Watch to unlock',
            badge: pendingCount,
            onPress: onQuiz,
          },
        ]),
    {
      key: 'labs',
      icon: 'flask',
      color: colors.accent,
      tint: tints.blue,
      label: 'Labs',
      caption: 'Explore fields',
      onPress: onLabs,
    },
  ];

  return (
    <View style={styles.row}>
      {tiles.map(({ key, ...tile }, index) => (
        <ActionTile key={key} index={index} {...tile} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    ...contentWidth,
    flexDirection: 'row',
    gap: spacing.s + 2,
    paddingHorizontal: spacing.m,
    marginTop: spacing.m,
  },
  tileWrapper: { flex: 1 },
  tile: {
    flex: 1,
    minHeight: scale(104),
    padding: spacing.s + 2,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.light,
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.s,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: rewardColors.streak,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    lineHeight: 12,
    color: colors.textOnColor,
  },
  label: { ...typography.bodySmall, fontSize: scale(13), fontFamily: fonts.bold, color: colors.text },
  caption: { ...typography.caption, marginTop: 1 },
});

export default QuickActions;
