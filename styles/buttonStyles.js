import { StyleSheet } from 'react-native';
import { colors, sizes, spacing } from '../components/theme.js';

export const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.secondary,
    marginTop: spacing.l,
    paddingVertical: spacing.l,
    borderRadius: sizes.radius,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: sizes.h1,
  },
  secondary: {
    backgroundColor: colors.primaryBis,
    marginTop: spacing.l,
    paddingVertical: spacing.l,
    borderRadius: sizes.radius,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: sizes.h1,
  },
});