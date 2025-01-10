import { StyleSheet } from 'react-native';
import { colors, sizes, spacing } from '../components/theme.js';

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.secondary,
    marginTop: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: sizes.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: colors.primaryBis,
    marginTop: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: sizes.radius,
    alignItems: 'center',
    justifyContent: 'center',
  },
});