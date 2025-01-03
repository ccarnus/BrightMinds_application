import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Button, TextInput, Modal, Portal, Provider, HelperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { colors, sizes, spacing } from './theme';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('College Student');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState("");
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await axios.get('http://3.17.219.54/university');
        setUniversities(response.data);
      } catch (error) {
        console.error('Error fetching universities:', error);
      }
    };

    fetchUniversities();
  }, []);

  useEffect(() => {
    // Check if passwords match
    if (confirmPassword.length > 0 && password !== confirmPassword) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }

    // Enable the button only if all fields are filled correctly
    if (
      email &&
      password &&
      confirmPassword &&
      passwordsMatch &&
      username &&
      role &&
      profilePicture &&
      (role === 'College Student' ||
        role === 'Learning Enthusiast' ||
        (role !== 'College Student' && selectedUniversity))
    ) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  }, [email, password, confirmPassword, username, role, profilePicture, selectedUniversity, passwordsMatch]);

  const showCustomAlert = (message) => {
    setCustomAlertMessage(message);
    setCustomAlertVisible(true);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Allow user to edit the image (crop, etc.)
      aspect: [1, 1], // Maintain square aspect ratio
      quality: 0.5, // Compress the image quality
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePicture(result.assets[0]);
    }
  };

  const handleSignup = async () => {
    // Additional check to ensure passwords match before proceeding
    if (password !== confirmPassword) {
      showCustomAlert("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);
    const user = {
      email,
      password,
      username,
      role,
    };

    if (role === 'Professor' || role === 'PhD Student' || role === 'Researcher') {
      user.university = selectedUniversity;
    }

    const formData = new FormData();
    formData.append('user', JSON.stringify(user));
    formData.append('image', {
      uri: profilePicture.uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });

    try {
      const response = await axios.post('http://3.17.219.54/user/signup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      Alert.alert('Signup successful', 'Please check your email to verify your account');
      navigation.navigate('LoginScreen');
    } catch (error) {
      let errorMessage = 'Could not create account. Please try again.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      console.log(formData);
      Alert.alert('Signup failed', errorMessage);
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Sign Up</Text>
          
          {/* Email Input */}
          <TextInput
            label="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* Username Input */}
          <TextInput
            label="Username"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
          />

          {/* Password Input */}
          <TextInput
            label="Password"
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            autoCapitalize="none"
          />

          {/* Confirm Password Input */}
          <TextInput
            label="Confirm Password"
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            mode="outlined"
            autoCapitalize="none"
            error={!passwordsMatch}
          />
          {/* Helper text for password mismatch */}
          {!passwordsMatch && (
            <HelperText type="error" visible={!passwordsMatch}>
              Passwords do not match
            </HelperText>
          )}

          {/* Role Picker */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={role}
              style={styles.picker}
              onValueChange={(itemValue) => setRole(itemValue)}
            >
              <Picker.Item label="College Student" value="College Student" />
              <Picker.Item label="Professor" value="Professor" />
              <Picker.Item label="Researcher" value="Researcher" />
              <Picker.Item label="Learning Enthusiast" value="Learning Enthusiast" />
              <Picker.Item label="PhD Student" value="PhD Student" />
            </Picker>
          </View>

          {/* University Picker (conditionally rendered) */}
          {(role === 'Professor' || role === 'Researcher' || role === 'PhD Student') && (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedUniversity}
                style={styles.picker}
                onValueChange={(itemValue) => setSelectedUniversity(itemValue)}
              >
                <Picker.Item label="Select University" value="" />
                {universities.map((university) => (
                  <Picker.Item key={university._id} label={university.name} value={university.name} />
                ))}
              </Picker>
            </View>
          )}

          {/* Profile Picture Picker */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture.uri }} style={styles.profileImage} />
            ) : (
              <Text style={styles.imagePickerText}>Select Profile Picture</Text>
            )}
          </TouchableOpacity>

          {/* Signup Button */}
          <Button 
            mode="contained" 
            onPress={handleSignup} 
            loading={loading} 
            style={styles.button} 
            disabled={isButtonDisabled}
          >
            Sign Up
          </Button>

          {/* Navigate to Login */}
          <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
            <Text style={styles.signupText}>Already have an account? Login</Text>
          </TouchableOpacity>

          {/* Custom Alert Modal */}
          <Portal>
            <Modal 
              visible={customAlertVisible} 
              onDismiss={() => setCustomAlertVisible(false)} 
              contentContainerStyle={styles.modalContainer}
            >
              <Text>{customAlertMessage}</Text>
              <Button onPress={() => setCustomAlertVisible(false)}>OK</Button>
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
  title: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: 20,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'transparent',
    fontFamily: 'Montserrat',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: sizes.radius,
    marginBottom: spacing.m,
    overflow: 'hidden',
  },
  picker: {
    height: 60,
    width: '100%',
  },
  imagePicker: {
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    borderRadius: sizes.radius,
    backgroundColor: colors.primaryBis,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 150,
  },
  imagePickerText: {
    color: 'gray',
    fontFamily: 'Montserrat',
  },
  button: {
    backgroundColor: colors.secondary,
    marginTop: 20,
  },
  signupText: {
    marginTop: 20,
    textAlign: 'center',
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
  },
});

export default SignupScreen;
