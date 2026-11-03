import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { colors, sizes, spacing } from '@shared/config/theme';

/**
 * Empty / error placeholder with an optional retry action.
 * Use instead of leaving the user on a blank screen or an endless loader.
 */
const StateMessage = ({ icon = 'alert-circle-outline', title, message, actionLabel, onAction, style }) => (
  <View style={[styles.container, style]}>
    <Ionicons name={icon} size={48} color={colors.lightGray} />
    {!!title && <Text style={styles.title}>{title}</Text>}
    {!!message && <Text style={styles.message}>{message}</Text>}
    {!!onAction && (
      <TouchableOpacity style={styles.button} onPress={onAction} accessibilityRole="button">
        <Text style={styles.buttonText}>{actionLabel || 'Try again'}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  title: {
    marginTop: spacing.s,
    fontFamily: 'MontserratBold',
    fontSize: RFValue(16),
    color: colors.secondary,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    fontFamily: 'Montserrat',
    fontSize: RFValue(13),
    color: colors.darkGray,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.m,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
    borderRadius: sizes.buttonRadius,
    backgroundColor: colors.darkblue,
  },
  buttonText: {
    fontFamily: 'MontserratBold',
    color: colors.primary,
  },
});

export default StateMessage;
