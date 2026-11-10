import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Dialog, Portal } from 'react-native-paper';
import AppButton from '@shared/components/AppButton';
import { colors, layout, spacing, typography } from '@shared/config/theme';

/**
 * Standard confirmation dialog (log out, delete, irreversible changes).
 * The cancel action is always available unless `loading`; `destructive` paints the confirm button red.
 */
const ConfirmDialog = ({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onDismiss,
}) => (
  <Portal>
    <Dialog visible={visible} onDismiss={onDismiss} dismissable={!loading} style={styles.dialog}>
      {!!title && <Dialog.Title style={styles.title}>{title}</Dialog.Title>}
      {!!message && (
        <Dialog.Content>
          <Text style={styles.message}>{message}</Text>
        </Dialog.Content>
      )}
      <Dialog.Actions style={styles.actions}>
        <AppButton variant="link" size="medium" onPress={onDismiss} disabled={loading}>
          {cancelLabel}
        </AppButton>
        <AppButton
          variant={destructive ? 'danger' : 'primary'}
          size="medium"
          onPress={onConfirm}
          loading={loading}
          disabled={loading}
        >
          {confirmLabel}
        </AppButton>
      </Dialog.Actions>
    </Dialog>
  </Portal>
);

const styles = StyleSheet.create({
  dialog: {
    width: '88%',
    maxWidth: layout.maxContentWidth * 0.8,
    marginHorizontal: 0,
    alignSelf: 'center',
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.h2,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    justifyContent: 'center',
    gap: spacing.s,
    paddingBottom: spacing.m,
  },
});

export default ConfirmDialog;
