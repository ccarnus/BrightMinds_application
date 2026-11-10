import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { TextInput, Portal, Dialog } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, sizes, spacing, typography } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import AppButton from '@shared/components/AppButton';
import BackButton from '@shared/components/BackButton';
import { isValidEmail } from '@features/auth/utils/validation';

// Room kept above (and, for balance, below) the centered form for the floating back button.
const BACK_BUTTON_SPACE = spacing.xl + spacing.s;

const ForgotPasswordScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const submittingRef = useRef(false);

  const handlePasswordResetRequest = async () => {
    if (submittingRef.current) return;
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setAlert({ message: 'Please enter a valid email address.', success: false });
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      await api.post('/user/reset-password-request', { email: trimmedEmail });
      setAlert({ message: 'Please check your email to reset your password.', success: true });
    } catch (error) {
      setAlert({ message: getErrorMessage(error, 'Error sending reset email.'), success: false });
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  // Only leave the screen once the reset email was actually sent.
  const handleAlertDismiss = () => {
    const succeeded = alert?.success;
    setAlert(null);
    if (succeeded) {
      navigation.popTo('LoginScreen', { email: email.trim() });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + BACK_BUTTON_SPACE, paddingBottom: insets.bottom + BACK_BUTTON_SPACE },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={styles.title}>Reset Your Password</Text>
          <TextInput
            label="Email"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={() => {
              if (email) handlePasswordResetRequest();
            }}
          />
          <AppButton
            fullWidth
            onPress={handlePasswordResetRequest}
            loading={loading}
            disabled={!email || loading}
            icon={require('@assets/Login_icons/reset-password.png')}
            style={styles.button}
          >
            Send Link
          </AppButton>
        </View>
      </ScrollView>

      <BackButton onPress={() => navigation.goBack()} />

      <Portal>
        <Dialog visible={!!alert} onDismiss={handleAlertDismiss} style={styles.dialog}>
          <Dialog.Content>
            <Text style={styles.dialogText}>{alert?.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <AppButton variant="link" size="medium" onPress={handleAlertDismiss}>
              OK
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
  },
  form: {
    ...contentWidth,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: sizes.radius,
  },
  button: {
    marginTop: spacing.s,
  },
  dialog: {
    width: '88%',
    maxWidth: 448,
    marginHorizontal: 0,
    alignSelf: 'center',
    backgroundColor: colors.surface,
  },
  dialogText: {
    ...typography.body,
  },
});

export default ForgotPasswordScreen;
