import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, KeyboardAvoidingView, Image
} from 'react-native';
import { TextInput, Portal, Dialog } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, fonts, scale, sizes, spacing, typography } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import AppButton from '@shared/components/AppButton';
import { setUser } from '@shared/utils/UserStorage';
import { resetToHome } from '@navigation/navigationHelpers';
import { isValidEmail } from '@features/auth/utils/validation';

const LOGO_SIZE = Math.min(scale(140), 180);

const LoginScreen = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const submittingRef = useRef(false);
  const passwordInputRef = useRef(null);

  useEffect(() => {
    if (route.params?.email) {
      setEmail(route.params.email);
    }
  }, [route.params?.email]);

  const showCustomAlert = (message) => {
    setCustomAlertMessage(message);
    setCustomAlertVisible(true);
  };

  const handleLogin = async () => {
    if (submittingRef.current) return;
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      showCustomAlert('Please enter a valid email address.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    try {
      const { data: loginData } = await api.post('/user/login', { email: trimmedEmail, password });
      const userId = loginData.userId;
      const [{ data: userDetails }, { data: preferencesData }] = await Promise.all([
        api.get(`/user/${userId}`),
        api.get(`/user/${userId}/preferences`),
      ]);
      await setUser({
        userId,
        userRole: userDetails.role,
        userUniversity: userDetails.university || '',
      });

      if (!preferencesData?.preferences?.length) {
        navigation.reset({ index: 0, routes: [{ name: 'PreferencesScreen' }] });
      } else {
        resetToHome(navigation);
      }
    } catch (error) {
      // 4xx responses carry the reason (e.g. wrong password); connection issues get their own message.
      showCustomAlert(getErrorMessage(error, 'Invalid email or password.'));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.l, paddingBottom: insets.bottom + spacing.l },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Image
            source={require('@assets/BrightMinds/black_bear.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Log In</Text>

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
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            outlineStyle={styles.inputOutline}
          />

          <TextInput
            ref={passwordInputRef}
            label="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            mode="outlined"
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => {
              if (email && password) handleLogin();
            }}
            outlineStyle={styles.inputOutline}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye' : 'eye-off'}
                onPress={() => setShowPassword((visible) => !visible)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              />
            }
          />

          <AppButton
            fullWidth
            iconPosition="right"
            icon={require('@assets/Login_icons/log-in.png')}
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password || loading}
            style={styles.loginButton}
          >
            Login
          </AppButton>

          <AppButton
            variant="link"
            size="medium"
            onPress={() => navigation.navigate('ForgotPasswordScreen')}
            style={styles.forgotButton}
          >
            Forgot password?
          </AppButton>

          <TouchableOpacity
            onPress={() => navigation.navigate('SignupScreen')}
            style={styles.signupLink}
            accessibilityRole="button"
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.linkText}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={customAlertVisible}
          onDismiss={() => setCustomAlertVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Content>
            <Text style={styles.dialogText}>{customAlertMessage}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <AppButton variant="link" size="medium" onPress={() => setCustomAlertVisible(false)}>
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
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
  },
  form: {
    ...contentWidth,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignSelf: 'center',
    marginBottom: spacing.m,
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
  loginButton: {
    marginTop: spacing.s,
  },
  forgotButton: {
    alignSelf: 'center',
    marginTop: spacing.m,
  },
  signupLink: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  signupText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  linkText: {
    fontFamily: fonts.bold,
    color: colors.accent,
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

export default LoginScreen;
