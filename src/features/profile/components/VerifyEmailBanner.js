import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, sizes, spacing, typography } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import PressableScale from '@shared/components/PressableScale';
import haptics from '@shared/utils/haptics';

/**
 * Shown while the email is unconfirmed. The app works anyway: tapping asks the server to send the
 * confirmation link again (the server limits how often, and says how long to wait).
 */
const VerifyEmailBanner = ({ userId, email, onVerified }) => {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const resend = async () => {
    if (status === 'sending') return;
    setStatus('sending');
    try {
      const { data } = await api.post(`/user/${userId}/verification/resend`);
      if (data?.isVerified) {
        onVerified?.();
        return;
      }
      setStatus('sent');
      setMessage(data?.message || `We sent a confirmation email to ${email}.`);
      haptics.success();
    } catch (error) {
      setStatus('error');
      setMessage(getErrorMessage(error, "Couldn't send the email. Please try again."));
      haptics.error();
    }
  };

  const sent = status === 'sent';
  const subtitle = message || `Tap to send the confirmation link to ${email}.`;

  return (
    <PressableScale
      onPress={resend}
      disabled={status === 'sending'}
      accessibilityRole="button"
      accessibilityLabel="Confirm your email. Send the confirmation email again."
      style={[styles.container, sent && styles.containerSent]}
    >
      {status === 'sending' ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        <Image source={require('@assets/Profile_icons/warning_icon.png')} style={styles.icon} />
      )}
      <View style={styles.texts}>
        <Text style={[styles.title, sent && styles.titleSent]}>
          {sent ? 'Check your inbox' : 'Confirm your email'}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.danger,
  },
  containerSent: {
    borderColor: colors.accent,
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  texts: {
    flex: 1,
  },
  title: {
    ...typography.body,
    fontFamily: fonts.bold,
    color: colors.danger,
  },
  titleSent: {
    color: colors.accent,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

export default VerifyEmailBanner;
