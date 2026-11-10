import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { colors, sizes, typography } from '@shared/config/theme';

// Color roles: green "primary" for main actions, blue "accent" for navigation-like actions.
const VARIANTS = {
  primary: { mode: 'contained', buttonColor: colors.action, textColor: colors.textOnColor },
  accent: { mode: 'contained', buttonColor: colors.accent, textColor: colors.textOnColor },
  danger: { mode: 'contained', buttonColor: colors.danger, textColor: colors.textOnColor },
  // Outlined neutral button for secondary choices (Cancel, Skip...).
  secondary: { mode: 'outlined', textColor: colors.text },
  // Text-only link styled action.
  link: { mode: 'text', textColor: colors.accent },
  // White button for dark backgrounds.
  light: { mode: 'contained', buttonColor: colors.surface, textColor: colors.text },
};

const HEIGHTS = { large: 52, medium: 44 };

/**
 * The app's button: consistent height, pill shape and a vertically centered label on every platform.
 * `variant`: primary | accent | danger | secondary | link | light. `iconPosition="right"` for "Next" style buttons.
 */
const AppButton = ({
  variant = 'primary',
  size = 'large',
  iconPosition = 'left',
  fullWidth = false,
  onDark = false,
  style,
  contentStyle,
  labelStyle,
  children,
  ...props
}) => {
  const config = VARIANTS[variant] || VARIANTS.primary;
  const textColor = onDark && (variant === 'secondary' || variant === 'link') ? colors.textOnColor : config.textColor;
  return (
    <Button
      mode={config.mode}
      buttonColor={config.buttonColor}
      textColor={textColor}
      style={[
        styles.button,
        variant === 'secondary' && { borderColor: onDark ? colors.textOnColor : colors.text },
        fullWidth && styles.fullWidth,
        style,
      ]}
      contentStyle={[
        { height: HEIGHTS[size] || HEIGHTS.large },
        iconPosition === 'right' && styles.iconRight,
        contentStyle,
      ]}
      labelStyle={[styles.label, size === 'medium' && styles.labelMedium, labelStyle]}
      {...props}
    >
      {children}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: sizes.buttonRadius,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  iconRight: {
    flexDirection: 'row-reverse',
  },
  label: {
    ...typography.button,
    marginVertical: 0,
    marginHorizontal: 24,
  },
  labelMedium: {
    fontSize: sizes.h4,
    lineHeight: Math.round(sizes.h4 * 1.3),
    marginHorizontal: 18,
  },
});

export default AppButton;
