import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, 
  Platform, KeyboardAvoidingView, Image, Dimensions 
} from 'react-native';
import { Button, TextInput, Portal, Provider, Modal } from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, sizes, spacing } from '@shared/config/theme';
import { useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '@shared/config/APIConfig';
import {setUser} from '@shared/utils/UserStorage'

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const route = useRoute();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState("");

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
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/user/login`, { email, password });
      const userId = response.data.userId;
      const userDetailsResponse = await axios.get(`${API_BASE_URL}/user/${userId}`);
      const userRole = userDetailsResponse.data.role;
      const userUniversity = userDetailsResponse.data.university || '';
      await setUser({ userId, userRole, userUniversity });

      const userPreferencesResponse = await axios.get(`${API_BASE_URL}/user/${userId}/preferences`);
      const userPreferences = userPreferencesResponse.data.preferences;

      if (userPreferences.length === 0) {
        navigation.navigate('PreferencesScreen');
      } else {
        navigation.navigate('BottomNav');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Invalid credentials';
      showCustomAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Provider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.container} 
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
            underlineColor={colors.darkGreen}
            activeOutlineColor={colors.darkGreen}
            underlineColorAndroid={colors.darkGreen}
            outlineStyle={styles.inputOutline}
          />

          <TextInput
            label="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            mode="outlined"
            autoCapitalize="none"
            underlineColor={colors.darkGreen}
            activeOutlineColor={colors.darkGreen}
            outlineStyle={styles.inputOutline}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye' : 'eye-off'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={!email || !password}
            buttonColor={colors.darkGreen}
            icon={require('@assets/Login_icons/log-in.png')}
            contentStyle={{ flexDirection: 'row-reverse'}}
            labelStyle={{
              fontSize: sizes.h3,
              fontFamily: 'Montserrat',
              textAlign: 'center',
              paddingTop: spacing.s,
            }}
            style={{
              marginLeft: spacing.m,
              marginRight: spacing.m,
              marginBottom: spacing.s,
              marginTop: spacing.l,
              borderRadius: sizes.buttonRadius,
            }}
          >
            Login
          </Button>

          {/* Forgot password link */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPasswordScreen')} 
            style={{ marginTop: 10 }}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('SignupScreen')}
            style={{ marginTop: 20 }}
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
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  forgotText: {
    marginTop: 10,
    textAlign: 'center',
    color: colors.secondary,
    fontFamily: 'Montserrat',
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
