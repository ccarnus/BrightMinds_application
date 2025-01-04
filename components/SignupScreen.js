import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  Platform, KeyboardAvoidingView, Alert, Modal, FlatList
} from 'react-native';
import { Button, TextInput, Portal, Provider, HelperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { colors, sizes, spacing } from './theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [universities, setUniversities] = useState([]);

  // We'll store the entire university object here (for icon, displayedName, etc.)
  const [selectedUniversity, setSelectedUniversity] = useState(null);

  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // For opening/closing the custom university modal
  const [universityModalVisible, setUniversityModalVisible] = useState(false);

  // A small array of role options for the horizontal scroll
  const roleOptions = [
    'College Student',
    'Professor',
    'Researcher',
    'Learning Enthusiast',
    'PhD Student',
  ];

  useEffect(() => {
    // Fetch universities from your API
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

    const roleNeedsUniversity =
      role === 'Professor' || role === 'PhD Student' || role === 'Researcher';

    const allFieldsOk =
      email &&
      password &&
      confirmPassword &&
      passwordsMatch &&
      username &&
      role &&
      profilePicture &&
      (!roleNeedsUniversity || selectedUniversity);

    setIsButtonDisabled(!allFieldsOk);
  }, [
    email,
    password,
    confirmPassword,
    username,
    role,
    profilePicture,
    selectedUniversity,
    passwordsMatch,
  ]);

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
    // Additional check to ensure passwords match
    if (!passwordsMatch) {
      showCustomAlert('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);

    // Build user object
    const user = {
      email,
      password,
      username,
      role,
    };

    // Only set user.university if needed by role
    if (role === 'Professor' || role === 'PhD Student' || role === 'Researcher') {
      user.university = selectedUniversity ? selectedUniversity.name : '';
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('user', JSON.stringify(user));
    formData.append('image', {
      uri: profilePicture.uri,
      type: 'image/jpeg',
      name: 'profile.jpg',
    });

    try {
      await axios.post('http://3.17.219.54/user/signup', formData, {
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

  // ** Render each university item in the modal **
  const renderUniversityItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.universityItemWrapper}
        onPress={() => {
          setSelectedUniversity(item);
          setUniversityModalVisible(false);
        }}
      >
        <Image source={{ uri: item.iconurl }} style={styles.universityIcon} />
        <Text style={styles.universityText}>{item.displayedName || item.name}</Text>
      </TouchableOpacity>
    );
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

          {/* Role Selector (horizontal scroll) */}
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>Select Your Role:</Text>
            <ScrollView horizontal>
              {roleOptions.map((r) => (
                <TouchableOpacity
                  key={r}
                  onPress={() => setRole(r)}
                  style={styles.roleOption}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      role === r && styles.roleSelected,
                    ]}
                  >
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* University Selector - only if needed */}
          {(role === 'Professor' || role === 'PhD Student' || role === 'Researcher') && (
            <TouchableOpacity
              style={styles.universitySelector}
              onPress={() => setUniversityModalVisible(true)}
            >
              {selectedUniversity ? (
                <View style={styles.universitySelectedWrapper}>
                  <Image
                    source={{ uri: selectedUniversity.iconurl }}
                    style={styles.universityIcon}
                  />
                  <Text style={styles.universityText}>
                    {selectedUniversity.displayedName || selectedUniversity.name}
                  </Text>
                </View>
              ) : (
                <Text style={styles.universityPlaceholder}>Select University</Text>
              )}
            </TouchableOpacity>
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

          {/* University Modal */}
          <Modal
            transparent={false}
            animationType="slide"
            visible={universityModalVisible}
            onRequestClose={() => setUniversityModalVisible(false)}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a University</Text>
              <TouchableOpacity onPress={() => setUniversityModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color={colors.secondary}
                />
              </TouchableOpacity>
            </View>
            <FlatList
              data={universities}
              keyExtractor={(item) => item._id}
              renderItem={renderUniversityItem}
              contentContainerStyle={styles.flatListContainer}
            />
          </Modal>

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
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.primaryBis,
  },
  title: {
    paddingTop: spacing.m,
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.l,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: 'transparent',
    fontFamily: 'Montserrat',
  },
  roleSelector: {
    marginBottom: spacing.m,
  },
  roleLabel: {
    fontSize: sizes.h3,
    marginBottom: spacing.s,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  roleOption: {
    marginRight: spacing.m,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    backgroundColor: 'white',
    borderRadius: sizes.radius,
  },
  roleOptionText: {
    fontFamily: 'Montserrat',
    color: colors.secondary,
    fontSize: sizes.h3,
  },
  roleSelected: {
    color: colors.secondary,
    fontWeight: 'bold',
  },
  universitySelector: {
    marginBottom: spacing.m,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: sizes.radius,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  universitySelectedWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  universityPlaceholder: {
    fontFamily: 'Montserrat',
    color: colors.secondary,
  },
  universityItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
  },
  universityIcon: {
    width: 40,
    height: 40,
    marginRight: spacing.m,
    resizeMode: 'contain',
  },
  universityText: {
    fontFamily: 'Montserrat',
    fontSize: sizes.h4,
  },
  imagePicker: {
    marginBottom: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    borderRadius: sizes.radius,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  imagePickerText: {
    color: 'gray',
    fontFamily: 'Montserrat',
  },
  button: {
    backgroundColor: colors.secondary,
    marginTop: spacing.l,
  },
  signupText: {
    marginTop: spacing.l,
    textAlign: 'center',
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.l,
    marginHorizontal: spacing.m,
  },
  modalTitle: {
    fontSize: sizes.h1,
    fontFamily: 'Montserrat',
  },
  flatListContainer: {
    paddingVertical: spacing.m,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
  },
});

export default SignupScreen;
