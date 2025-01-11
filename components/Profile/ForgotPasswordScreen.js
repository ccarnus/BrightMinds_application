import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, KeyboardAvoidingView, Dimensions } from 'react-native';
import { Button, TextInput, Portal, Provider, Modal } from 'react-native-paper';
import axios from 'axios';
import { colors, sizes } from '../theme';

const { width, height } = Dimensions.get('window');

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState("");

  const showCustomAlert = (message) => {
    setCustomAlertMessage(message);
    setCustomAlertVisible(true);
  };

  const handlePasswordResetRequest = async () => {
    if (!email) {
      showCustomAlert('Please enter your email.');
      return;
    }

    setLoading(true);
    try {
      // Make sure you have your server endpoint set correctly:
      await axios.post('https://3.17.219.54/user/reset-password-request', { email });
      showCustomAlert('Please check your email to reset your password.');
    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.message || 'Error sending reset email.';
      showCustomAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAlertDismiss = () => {
    setCustomAlertVisible(false);
    navigation.navigate('LoginScreen', { email });
  };

  return (
    <Provider>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Reset Your Password</Text>
          <TextInput
            label="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            activeOutlineColor={colors.darkGreen}
          />
          <Button 
            mode="contained" 
            onPress={handlePasswordResetRequest} 
            loading={loading}
            disabled={!email}
            buttonColor={colors.darkGreen}
            icon={require('../../assets/Login_icons/reset-password.png')}
          >
            Send Reset Link
          </Button>
          <Portal>
            <Modal
              visible={customAlertVisible}
              onDismiss={handleAlertDismiss}  // when the modal is dismissed
              contentContainerStyle={styles.modalContainer}
            >
              <Text>{customAlertMessage}</Text>
              <Button 
                onPress={handleAlertDismiss}
                textColor={colors.darkGreen}  
              >OK</Button>
            </Modal>
          </Portal>
        </View>
      </KeyboardAvoidingView>
    </Provider>
  );
};

const styles = StyleSheet.create({
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
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
  },
});

export default ForgotPasswordScreen;
