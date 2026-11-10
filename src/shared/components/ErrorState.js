import React from 'react';
import StateMessage from '@shared/components/StateMessage';
import { ErrorType, getErrorType, getErrorMessage } from '@shared/api/client';
import { useIsOffline, useOnReconnect } from '@shared/utils/connectivity';

const errorIllustration = require('@assets/Cast_screen_icons/server_error.png');

const CONNECTIVITY_TYPES = [ErrorType.OFFLINE, ErrorType.NETWORK, ErrorType.TIMEOUT];

const getContent = (type, { error, fallbackTitle, fallbackMessage, notFoundTitle, notFoundMessage, canRetry }) => {
  switch (type) {
    case ErrorType.OFFLINE:
      return {
        title: "You're offline",
        message: canRetry
          ? "Check your internet connection. We'll reload automatically when you're back online."
          : 'Check your internet connection and try again.',
      };
    case ErrorType.NETWORK:
      return {
        title: 'Connection problem',
        message: "We couldn't reach the server. Check your connection and try again.",
      };
    case ErrorType.TIMEOUT:
      return {
        title: 'This is taking too long',
        message: 'Your connection seems slow or unstable. Please try again.',
      };
    case ErrorType.SERVER:
      return {
        title: 'Service unavailable',
        message: "We're having trouble on our side. Please try again in a moment.",
      };
    case ErrorType.NOT_FOUND:
      return {
        title: notFoundTitle || 'Content not available',
        message: notFoundMessage || 'This content may have been moved or removed.',
      };
    default:
      return {
        title: fallbackTitle || 'Something went wrong',
        message: getErrorMessage(error, fallbackMessage),
      };
  }
};

/**
 * Standard error screen/panel: same illustration, wording and actions everywhere.
 * The title and message come from the error type (offline, timeout, server, not found...);
 * `fallbackMessage` describes what failed for other errors. Connectivity errors reload
 * automatically through `onRetry` when the device comes back online.
 */
const ErrorState = ({
  error,
  onRetry,
  retryLabel = 'Try again',
  fallbackTitle,
  fallbackMessage,
  notFoundTitle,
  notFoundMessage,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
  dark = false,
  style,
}) => {
  // Re-render on connectivity changes so the copy always reflects the current state.
  useIsOffline();
  const type = getErrorType(error);
  useOnReconnect(onRetry, !!onRetry && CONNECTIVITY_TYPES.includes(type));

  const { title, message } = getContent(type, {
    error,
    fallbackTitle,
    fallbackMessage,
    notFoundTitle,
    notFoundMessage,
    canRetry: !!onRetry,
  });
  // Retrying a missing resource is pointless when there is a way out.
  const showRetry = !!onRetry && !(type === ErrorType.NOT_FOUND && onSecondaryAction);

  return (
    <StateMessage
      image={errorIllustration}
      title={title}
      message={message}
      actionLabel={retryLabel}
      onAction={showRetry ? onRetry : undefined}
      secondaryActionLabel={secondaryActionLabel}
      onSecondaryAction={onSecondaryAction}
      compact={compact}
      dark={dark}
      style={style}
    />
  );
};

export default ErrorState;
