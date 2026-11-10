import React from 'react';
import { StyleSheet } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { ErrorType, getErrorType } from '@shared/api/client';
import { colors } from '@shared/config/theme';

const MESSAGES = {
  [ErrorType.OFFLINE]: "You're offline. Showing the last loaded content.",
  [ErrorType.NETWORK]: "Couldn't refresh. Check your connection and try again.",
  [ErrorType.TIMEOUT]: "Couldn't refresh: the connection is too slow.",
  [ErrorType.SERVER]: "Couldn't refresh: the service is temporarily unavailable.",
};

/**
 * Non-blocking notice for a failed refresh while content is already on screen
 * (pull-to-refresh, partial reloads). Visible while `error` is set.
 */
const ErrorSnackbar = ({ error, onDismiss, onRetry, style, wrapperStyle }) => (
  <Snackbar
    visible={!!error}
    onDismiss={onDismiss}
    duration={4000}
    action={onRetry ? { label: 'Retry', onPress: onRetry, textColor: colors.lightTeal } : undefined}
    style={[styles.snackbar, style]}
    wrapperStyle={wrapperStyle}
  >
    {error ? MESSAGES[getErrorType(error)] || "Couldn't refresh. Please try again." : ''}
  </Snackbar>
);

const styles = StyleSheet.create({
  snackbar: {
    backgroundColor: colors.darkGray,
  },
});

export default ErrorSnackbar;
