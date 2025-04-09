import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { Button, TextInput, Portal, Provider, HelperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { colors, sizes, spacing } from './theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from './APIConfig';

const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [universityModalVisible, setUniversityModalVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const categoryOptions = [
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
        const response = await axios.get(`${API_BASE_URL}/university`);
        setUniversities(response.data);
      } catch (error) {
        console.error('Error fetching universities:', error);
      }
    };
    fetchUniversities();
  }, []);

  useEffect(() => {
    if (confirmPassword.length > 0 && password !== confirmPassword) {
      setPasswordsMatch(false);
    } else {
      setPasswordsMatch(true);
    }

    const needsUniversity =
      role === 'Professor' || role === 'PhD Student' || role === 'Researcher';

    const allFieldsOk =
      email &&
      password &&
      confirmPassword &&
      passwordsMatch &&
      username &&
      profilePicture &&
      (!needsUniversity || selectedUniversity) &&
      role !== '';

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

  useEffect(() => {
    // Track keyboard visibility
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const showCustomAlert = (message) => {
    setCustomAlertMessage(message);
    setCustomAlertVisible(true);
  };

  // Opens the device's image library
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePicture(result.assets[0]);
    }
  };

  // Sets the profile picture to the default image
  const useDefaultImage = () => {
    const defaultImageUri = Image.resolveAssetSource(
      require('../assets/Profile_icons/user_image_default.png')
    ).uri;
    setProfilePicture({ uri: defaultImageUri });
  };

  // Instead of an alert, open a custom modal with two icon buttons
  const selectProfilePicture = () => {
    setImagePickerModalVisible(true);
  };

  const handleSignup = async () => {
    if (!passwordsMatch) {
      showCustomAlert('Passwords do not match. Please try again.');
      return;
    }

    setLoading(true);

    // Build the user object
    const user = {
      email,
      password,
      username,
      role,
    };

    if (role === 'Professor' || role === 'PhD Student' || role === 'Researcher') {
      user.university = selectedUniversity ? selectedUniversity.name : '';
    }

    const formData = new FormData();
    formData.append('user', JSON.stringify(user));

    let imageType = 'image/jpeg';
    let imageName = 'profile.jpg';
    if (profilePicture.uri.includes('user_image_default.png')) {
      imageType = 'image/png';
      imageName = 'user_image_default.png';
    }

    formData.append('image', {
      uri: profilePicture.uri,
      type: imageType,
      name: imageName,
    });

    try {
      await axios.post(`${API_BASE_URL}/user/signup`, formData, {
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
      Alert.alert('Signup failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Render each university item in the modal
  const renderUniversityItem = ({ item }) => (
    <TouchableOpacity
      style={styles.universityItemWrapper}
      onPress={() => {
        setSelectedUniversity(item);
        setUniversityModalVisible(false);
      }}
    >
      <Image source={{ uri: item.iconurl }} style={styles.universityIcon} />
      <Text style={styles.universityText}>
        {item.displayedName || item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Provider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>Sign Up</Text>

            {/* Email */}
            <TextInput
              label="Email"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              autoCapitalize="none"
              keyboardType="email-address"
              activeOutlineColor={colors.darkGreen}
              outlineStyle={styles.inputOutline}
            />

            {/* Username */}
            <TextInput
              label="Username"
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              mode="outlined"
              autoCapitalize="none"
              activeOutlineColor={colors.darkGreen}
              outlineStyle={styles.inputOutline}
            />

            {/* Password */}
            <TextInput
              label="Password"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              mode="outlined"
              autoCapitalize="none"
              activeOutlineColor={colors.darkGreen}
              outlineStyle={styles.inputOutline}
            />

            {/* Confirm Password */}
            <TextInput
              label="Confirm Password"
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              mode="outlined"
              autoCapitalize="none"
              error={!passwordsMatch}
              activeOutlineColor={colors.darkGreen}
              outlineStyle={styles.inputOutline}
            />
            {!passwordsMatch && (
              <HelperText type="error" visible={!passwordsMatch}>
                Passwords do not match
              </HelperText>
            )}

            {/* Category Picker (Modal-based, same as in PostCast) */}
            <Text style={styles.pickerTitle}>Category:</Text>
            <TouchableOpacity
              style={styles.selectorContainer}
              onPress={() => setCategoryModalVisible(true)}
            >
              <Text style={styles.selectorText}>
                {role || 'Select Category'}
              </Text>
            </TouchableOpacity>
            <Portal>
              <Modal
                visible={categoryModalVisible}
                onDismiss={() => setCategoryModalVisible(false)}
                contentContainerStyle={styles.modalContainer}
              >
                {categoryOptions.map((item, index) => (
                  <Button
                    key={index}
                    onPress={() => {
                      setRole(item);
                      setCategoryModalVisible(false);
                    }}
                    style={styles.modalItem}
                    labelStyle={styles.modalItemLabel}
                  >
                    {item}
                  </Button>
                ))}
              </Modal>
            </Portal>

            {/* University Selector for certain roles */}
            {(role === 'Professor' || role === 'Researcher' || role === 'PhD Student') && (
              <TouchableOpacity
                style={styles.universitySelector}
                onPress={() => setUniversityModalVisible(true)}
              >
                {selectedUniversity ? (
                  <View style={styles.universitySelectedWrapper}>
                    <Image source={{ uri: selectedUniversity.iconurl }} style={styles.universityIcon} />
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
            <TouchableOpacity onPress={selectProfilePicture} style={styles.imagePicker}>
              {profilePicture ? (
                <Image source={{ uri: profilePicture.uri }} style={styles.profileImage} />
              ) : (
                <Text style={styles.imagePickerText}>Select Profile Picture</Text>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Footer with Sign Up Button */}
          {!isKeyboardVisible && (
            <View style={styles.footerContainer}>
              <Button
                mode="contained"
                onPress={handleSignup}
                loading={loading}
                disabled={isButtonDisabled}
                buttonColor={colors.darkGreen}
                icon={require('../assets/Login_icons/sign-up.png')}
                contentStyle={{ flexDirection: 'row-reverse' }}
                labelStyle={{
                  fontSize: sizes.h2,
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
                Sign Up
              </Button>
              <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
                <Text style={styles.signupText}>Already have an account? Login</Text>
              </TouchableOpacity>
            </View>
          )}

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
                <MaterialCommunityIcons name="close" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={universities}
              keyExtractor={(item) => item._id}
              renderItem={renderUniversityItem}
              contentContainerStyle={styles.flatListContainer}
            />
          </Modal>

          {/* Custom Image Picker Modal */}
          <Modal
            transparent={true}
            visible={imagePickerModalVisible}
            animationType="fade"
            onRequestClose={() => setImagePickerModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPressOut={() => setImagePickerModalVisible(false)}
            >
              <View style={styles.modalContent}>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setImagePickerModalVisible(false);
                    pickImage();
                  }}
                >
                  <MaterialCommunityIcons name="image-multiple" size={40} color={colors.darkblue} />
                  <Text style={styles.optionText}>Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    setImagePickerModalVisible(false);
                    useDefaultImage();
                  }}
                >
                  <MaterialCommunityIcons name="account" size={40} color={colors.darkblue} />
                  <Text style={styles.optionText}>Default</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Custom Alert Modal */}
          <Portal>
            <Modal
              visible={customAlertVisible}
              onDismiss={() => setCustomAlertVisible(false)}
              contentContainerStyle={styles.alertModalContainer}
            >
              <Text>{customAlertMessage}</Text>
              <Button onPress={() => setCustomAlertVisible(false)} textColor={colors.darkGreen}>
                OK
              </Button>
            </Modal>
          </Portal>
        </View>
      </KeyboardAvoidingView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.primaryBis,
    paddingBottom: 150,
  },
  title: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.xl,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: 'transparent',
    fontFamily: 'Montserrat',
    borderRadius: sizes.radius,
  },
  pickerTitle: {
    fontFamily: 'Montserrat',
    fontSize: sizes.h4,
    marginBottom: spacing.xs,
    color: colors.secondary,
  },
  // New styles for modal-based picker (similar to PostCast)
  selectorContainer: {
    marginBottom: spacing.m,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: sizes.radius,
    backgroundColor: 'white',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    justifyContent: 'center',
  },
  selectorText: {
    fontFamily: 'Montserrat',
    color: colors.secondary,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
  },
  modalItem: {
    marginVertical: spacing.s,
  },
  modalItemLabel: {
    color: colors.secondary,
    fontFamily: 'Montserrat',
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
    marginTop: spacing.m,
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
  alertModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: spacing.l,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: 250,
    backgroundColor: 'white',
    borderRadius: sizes.radius,
    paddingVertical: spacing.l,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  optionButton: {
    alignItems: 'center',
    paddingHorizontal: spacing.m,
  },
  optionText: {
    marginTop: spacing.xs,
    fontFamily: 'Montserrat',
    color: colors.darkblue,
  },
});

export default SignupScreen;
