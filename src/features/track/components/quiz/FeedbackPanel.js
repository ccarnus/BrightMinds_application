import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AppButton from '@shared/components/AppButton';
import { colors, contentWidth, fonts, rewardColors, sizes, spacing, typography } from '@shared/config/theme';

/** Bottom sheet shown after answering: praise or encouragement, the XP won and the next step. */
const FeedbackPanel = ({ correct, praise, xp, isLast, onNext, bottomInset = 0 }) => (
  <Animated.View
    entering={SlideInDown.springify().damping(18)}
    style={[
      styles.panel,
      correct ? styles.panelCorrect : styles.panelWrong,
      { paddingBottom: spacing.m + bottomInset },
    ]}
    accessibilityLiveRegion="polite"
  >
    <View style={styles.content}>
      <View style={styles.row}>
        <Animated.View
          entering={ZoomIn.delay(120).springify().damping(7)}
          style={[styles.iconCircle, { backgroundColor: correct ? colors.action : colors.danger }]}
        >
          <MaterialCommunityIcons name={correct ? 'check-bold' : 'close-thick'} size={26} color={colors.textOnColor} />
        </Animated.View>
        <View style={styles.texts}>
          <Text style={[styles.praise, { color: correct ? colors.action : colors.danger }]}>{praise}</Text>
          <Text style={styles.detail}>
            {correct ? `+${xp} XP` : `The right answer is highlighted · +${xp} XP for trying`}
          </Text>
        </View>
      </View>
      <AppButton
        icon={require('@assets/Track_icons/go.png')}
        iconPosition="right"
        fullWidth
        variant={correct ? 'primary' : 'danger'}
        onPress={onNext}
        style={styles.button}
      >
        {isLast ? 'See my results' : 'Next question'}
      </AppButton>
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  panel: {
    paddingTop: spacing.m,
    paddingHorizontal: spacing.m,
    borderTopLeftRadius: sizes.radius + 8,
    borderTopRightRadius: sizes.radius + 8,
  },
  panelCorrect: {
    backgroundColor: rewardColors.correctPanel,
  },
  panelWrong: {
    backgroundColor: rewardColors.wrongPanel,
  },
  content: {
    ...contentWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s + 4,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
  },
  praise: {
    ...typography.h2,
  },
  detail: {
    ...typography.bodySmall,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  button: {
    marginTop: spacing.m,
  },
});

export default FeedbackPanel;
