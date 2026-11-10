import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@shared/config/theme';

const ICON_SIZE = 28;
// Outer size of the button, for screens that pad their content below it.
export const BACK_BUTTON_SIZE = layout.minTouchTarget - 4;

/**
 * The app's back button: 44 pt touch target with a chevron.
 * `tone`: "default" (dark icon on light screens), "light" (white icon on dark headers) or
 * "overlay" (white icon on a dark circle, for photos/videos).
 * `floating` (default) pins it to the top-left corner below the status bar; pass `floating={false}`
 * to place it inline, e.g. in a header row.
 */
const BackButton = ({ onPress, tone = 'default', floating = true, style, accessibilityLabel = 'Go back' }) => {
  const insets = useSafeAreaInsets();
  const iconColor = tone === 'default' ? colors.text : colors.textOnColor;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, floating && [styles.floating, { top: insets.top + spacing.s }], style]}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={[styles.iconWrap, tone === 'overlay' && styles.overlay]}>
        <Ionicons name="chevron-back" size={tone === 'overlay' ? 24 : ICON_SIZE} color={iconColor} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floating: {
    position: 'absolute',
    left: spacing.s,
    zIndex: 10,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
});

export default BackButton;
