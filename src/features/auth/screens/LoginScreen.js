import React, { useEffect, useRef, useState } from 'react';
import {
  Text, StyleSheet, TouchableOpacity, ScrollView,
  Platform, KeyboardAvoidingView, Image, Dimensions
} from 'react-native';
import { Button, TextInput, Portal, Modal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { setUser } from '@shared/utils/UserStorage';
import { resetToHome } from '@navigation/navigationHelpers';
import { isValidEmail } from '@features/auth/utils/validation';

const { width, height } = Dimensions.get('window');

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
      showCustomAlert(error.response?.data?.error || getErrorMessage(error, 'Invalid credentials'));
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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Image
          source={require('@assets/BrightMinds/black_bear.png')}
          style={styles.titleImage}
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
          activeOutlineColor={colors.darkGreen}
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
          activeOutlineColor={colors.darkGreen}
          outlineStyle={styles.inputOutline}
          right={
            <TextInput.Icon
              icon={showPassword ? 'eye' : 'eye-off'}
              onPress={() => setShowPassword((visible) => !visible)}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            />
          }
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={!email || !password || loading}
          buttonColor={colors.darkGreen}
          icon={require('@assets/Login_icons/log-in.png')}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          style={styles.button}
        >
          Login
        </Button>

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPasswordScreen')}
          style={styles.forgotLink}
          accessibilityRole="button"
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('SignupScreen')}
          style={styles.signupLink}
          accessibilityRole="button"
        >
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.underline}>Sign up</Text>
          </Text>
        </TouchableOpacity>

        <Portal>
          <Modal
            visible={customAlertVisible}
            onDismiss={() => setCustomAlertVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <Text>{customAlertMessage}</Text>
            <Button
              onPress={() => setCustomAlertVisible(false)}
              textColor={colors.darkGreen}
            >OK</Button>
          </Modal>
        </Portal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.primaryBis,
  },
  titleImage: {
    height: height * 0.3,
    width: width * 0.3,
    alignSelf: 'center',
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
  buttonContent: {
    flexDirection: 'row-reverse',
  },
  buttonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
  button: {
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.s,
    marginTop: spacing.l,
    borderRadius: sizes.buttonRadius,
  },
  forgotLink: {
    marginTop: 10,
  },
  forgotText: {
    marginTop: 10,
    textAlign: 'center',
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  signupLink: {
    marginTop: 20,
  },
  signupText: {
    textAlign: 'center',
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  underline: {
    textDecorationLine: 'underline',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
  },
  inputOutline: {
    borderRadius: sizes.radius,
  },
});

export default LoginScreen;
