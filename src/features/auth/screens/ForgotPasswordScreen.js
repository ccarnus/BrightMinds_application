import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, Dimensions } from 'react-native';
import { Button, TextInput, Portal, Modal } from 'react-native-paper';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { isValidEmail } from '@features/auth/utils/validation';

const { height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Reset Your Password</Text>
          <TextInput
            label="Email"
            style={styles.input}
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
            activeOutlineColor={colors.darkGreen}
          />
          <Button
            mode="contained"
            onPress={handlePasswordResetRequest}
            loading={loading}
            disabled={!email || loading}
            buttonColor={colors.darkGreen}
            icon={require('@assets/Login_icons/reset-password.png')}
            labelStyle={styles.buttonLabel}
            style={styles.button}
          >
            Send Link
          </Button>
        </View>
      </ScrollView>
      <Portal>
        <Modal
          visible={!!alert}
          onDismiss={handleAlertDismiss}
          contentContainerStyle={styles.modalContainer}
        >
          <Text>{alert?.message}</Text>
          <Button onPress={handleAlertDismiss} textColor={colors.darkGreen}>
            OK
          </Button>
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.primaryBis,
    marginTop: height * 0.3,
  },
  title: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'transparent',
    fontFamily: 'Montserrat',
  },
  buttonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.xs,
  },
  button: {
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.s,
    marginTop: spacing.l,
    borderRadius: sizes.buttonRadius,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
  },
});

export default ForgotPasswordScreen;
