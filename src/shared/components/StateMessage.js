import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '@shared/components/AppButton';
import { colors, layout, spacing, typography } from '@shared/config/theme';

/**
 * Empty / error placeholder: illustration (or icon), title, message, a primary action and an
 * optional secondary link. Errors should go through `ErrorState`, which builds on this.
 * Use instead of leaving the user on a blank screen or an endless loader.
 */
const StateMessage = ({
  icon = 'alert-circle-outline',
  image,
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  dark = false,
  style,
}) => {
  const { width } = useWindowDimensions();
  const imageSize = compact ? Math.min(width * 0.3, 120) : Math.min(width * 0.5, 220);

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <View style={styles.content}>
        {image ? (
          <Image
            source={image}
            style={{ width: imageSize, height: imageSize }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.iconCircle, compact && styles.iconCircleCompact, dark && styles.iconCircleDark]}>
            <Ionicons name={icon} size={compact ? 30 : 36} color={dark ? colors.textOnColor : colors.accent} />
          </View>
        )}
        {!!title && (
          <Text style={[styles.title, dark && styles.textOnDark]} accessibilityRole="header">
            {title}
          </Text>
        )}
        {!!message && <Text style={[styles.message, dark && styles.messageDark]}>{message}</Text>}
        {!!onAction && (
          <AppButton
            variant={dark ? 'light' : 'primary'}
            size="medium"
            onPress={onAction}
            style={styles.action}
          >
            {actionLabel || 'Try again'}
          </AppButton>
        )}
        {!!onSecondaryAction && (
          <AppButton
            variant="link"
            size="medium"
            onDark={dark}
            onPress={onSecondaryAction}
            style={styles.secondaryAction}
          >
            {secondaryActionLabel || 'Go back'}
          </AppButton>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  compactContainer: {
    padding: spacing.m,
  },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth * 0.75,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
  },
  iconCircleCompact: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  iconCircleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  title: {
    ...typography.h3,
    marginTop: spacing.m,
    textAlign: 'center',
  },
  textOnDark: {
    color: colors.textOnColor,
  },
  message: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  messageDark: {
    color: colors.lightGray,
  },
  action: {
    marginTop: spacing.l,
    minWidth: 160,
  },
  secondaryAction: {
    marginTop: spacing.xs,
  },
});

export default StateMessage;
