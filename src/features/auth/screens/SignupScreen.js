import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  Linking,
  Modal,
  FlatList,
  Keyboard,
} from 'react-native';
import { Button, TextInput, Portal, HelperText, Modal as PaperModal } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import { isValidEmail } from '@features/auth/utils/validation';

const SIGNUP_TIMEOUT_MS = 60000;
const CATEGORY_OPTIONS = [
  'College Student',
  'Professor',
  'Researcher',
  'Learning Enthusiast',
  'PhD Student',
];
const ROLES_WITH_UNIVERSITY = ['Professor', 'Researcher', 'PhD Student'];
const DEFAULT_IMAGE_NAME = 'user_image_default.png';

const SignupScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [universities, setUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(true);
  const [universitiesError, setUniversitiesError] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [universityModalVisible, setUniversityModalVisible] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const submittingRef = useRef(false);
  const pendingImageSourceRef = useRef(null);

  const needsUniversity = ROLES_WITH_UNIVERSITY.includes(role);
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword;
  const isFormComplete =
    !!email &&
    !!password &&
    !!confirmPassword &&
    passwordsMatch &&
    !!username &&
    !!profilePicture &&
    (!needsUniversity || !!selectedUniversity) &&
    role !== '';

  const fetchUniversities = useCallback(async (isActive = () => true) => {
    setUniversitiesLoading(true);
    setUniversitiesError(null);
    try {
      const { data } = await api.get('/university');
      if (isActive()) setUniversities(Array.isArray(data) ? data : []);
    } catch (error) {
      if (isActive()) setUniversitiesError(getErrorMessage(error, 'Could not load universities.'));
    } finally {
      if (isActive()) setUniversitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchUniversities(() => active);
    return () => {
      active = false;
    };
  }, [fetchUniversities]);

  useEffect(() => {
    // The floating footer is hidden while typing so it doesn't cover the inputs.
    const showListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  const pickImage = async () => {
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Permission required',
          'Please allow photo library access in your device settings to choose a profile picture.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setProfilePicture(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking profile picture:', error);
      Alert.alert('Error', 'Could not open your photo library. Please try again.');
    }
  };

  const applyDefaultImage = async () => {
    try {
      const asset = Asset.fromModule(require('@assets/Profile_icons/user_image_default.png'));
      await asset.downloadAsync();
      const localUri = asset.localUri || asset.uri;

      // Android release builds can return a non-file URI that cannot be uploaded; copy it to the cache.
      if (Platform.OS === 'android' && !localUri.startsWith('file://')) {
        const cachedPath = FileSystem.cacheDirectory + DEFAULT_IMAGE_NAME;
        try {
          await FileSystem.copyAsync({ from: localUri, to: cachedPath });
          setProfilePicture({ uri: cachedPath });
        } catch (error) {
          console.error('Error copying asset to cache:', error);
          setProfilePicture({ uri: localUri });
        }
      } else {
        setProfilePicture({ uri: localUri });
      }
    } catch (error) {
      console.error('Error loading default profile picture:', error);
      Alert.alert('Error', 'Could not load the default picture. Please choose one from your gallery.');
    }
  };

  // iOS cannot present the picker while the modal is still animating out,
  // so the action is deferred to the modal's onDismiss there.
  const runPendingImageSource = () => {
    const source = pendingImageSourceRef.current;
    pendingImageSourceRef.current = null;
    if (source === 'gallery') pickImage();
    if (source === 'default') applyDefaultImage();
  };

  const chooseImageSource = (source) => {
    pendingImageSourceRef.current = source;
    setImagePickerModalVisible(false);
    if (Platform.OS !== 'ios') runPendingImageSource();
  };

  const handleSignup = async () => {
    if (submittingRef.current || !isFormComplete) return;
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (!passwordsMatch) {
      Alert.alert('Signup failed', 'Passwords do not match. Please try again.');
      return;
    }

    submittingRef.current = true;
    setLoading(true);

    const user = {
      email: trimmedEmail,
      password,
      username,
      role,
    };
    if (needsUniversity) {
      user.university = selectedUniversity ? selectedUniversity.name : '';
    }

    const formData = new FormData();
    formData.append('user', JSON.stringify(user));

    const isDefaultImage = profilePicture.uri.includes(DEFAULT_IMAGE_NAME);
    formData.append('image', {
      uri: profilePicture.uri,
      type: isDefaultImage ? 'image/png' : 'image/jpeg',
      name: isDefaultImage ? DEFAULT_IMAGE_NAME : 'profile.jpg',
    });

    try {
      await api.post('/user/signup', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: SIGNUP_TIMEOUT_MS,
      });
      Alert.alert('Signup successful', 'Please check your email to verify your account');
      navigation.popTo('LoginScreen', { email: trimmedEmail });
    } catch (error) {
      Alert.alert('Signup failed', getErrorMessage(error, 'Could not create account. Please try again.'));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  const filteredUniversities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return universities;
    return universities.filter((item) =>
      (item.displayedName || item.name || '').toLowerCase().includes(query)
    );
  }, [universities, searchQuery]);

  const closeUniversityModal = () => {
    setUniversityModalVisible(false);
    setSearchQuery('');
  };

  const renderUniversityItem = ({ item }) => (
    <TouchableOpacity
      style={styles.universityItemWrapper}
      onPress={() => {
        setSelectedUniversity(item);
        closeUniversityModal();
      }}
      accessibilityRole="button"
    >
      <Image source={{ uri: item.iconurl }} style={styles.universityIcon} />
      <Text style={styles.universityText}>{item.displayedName || item.name}</Text>
    </TouchableOpacity>
  );

  const renderUniversityList = () => {
    if (universitiesLoading) {
      return <Loader backgroundColor={colors.primary} />;
    }
    if (universitiesError) {
      return (
        <StateMessage
          icon="cloud-offline-outline"
          title="Couldn't load universities"
          message={universitiesError}
          actionLabel="Try again"
          onAction={() => fetchUniversities()}
        />
      );
    }
    return (
      <FlatList
        data={filteredUniversities}
        keyExtractor={(item) => item._id}
        renderItem={renderUniversityItem}
        contentContainerStyle={styles.flatListContainer}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <StateMessage icon="school-outline" title="No university found" message="Try another search." />
        }
      />
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Sign Up</Text>

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
          activeOutlineColor={colors.darkGreen}
        />

        <TextInput
          label="Username"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          mode="outlined"
          autoCapitalize="none"
          autoCorrect={false}
          activeOutlineColor={colors.darkGreen}
        />

        <TextInput
          label="Password"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          mode="outlined"
          autoCapitalize="none"
          textContentType="newPassword"
          activeOutlineColor={colors.darkGreen}
        />

        <TextInput
          label="Confirm Password"
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          mode="outlined"
          autoCapitalize="none"
          textContentType="newPassword"
          error={!passwordsMatch}
          activeOutlineColor={colors.darkGreen}
        />
        {!passwordsMatch && (
          <HelperText type="error" visible>
            Passwords do not match
          </HelperText>
        )}

        <Text style={styles.pickerTitle}>Category:</Text>
        <TouchableOpacity
          style={styles.selectorContainer}
          onPress={() => setCategoryModalVisible(true)}
          accessibilityRole="button"
        >
          <Text style={styles.selectorText}>{role || 'Select Category'}</Text>
        </TouchableOpacity>

        {needsUniversity && (
          <TouchableOpacity
            style={styles.universitySelector}
            onPress={() => setUniversityModalVisible(true)}
            accessibilityRole="button"
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

        <TouchableOpacity
          onPress={() => setImagePickerModalVisible(true)}
          style={styles.imagePicker}
          accessibilityRole="button"
          accessibilityLabel="Select profile picture"
        >
          {profilePicture ? (
            <Image source={{ uri: profilePicture.uri }} style={styles.profileImage} />
          ) : (
            <Text style={styles.imagePickerText}>Select Profile Picture</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {!isKeyboardVisible && (
        <View style={[styles.footerContainer, { paddingBottom: spacing.l + insets.bottom }]}>
          <Button
            mode="contained"
            onPress={handleSignup}
            loading={loading}
            disabled={!isFormComplete || loading}
            buttonColor={colors.darkGreen}
            icon={require('@assets/Login_icons/sign-up.png')}
            contentStyle={styles.signupButtonContent}
            labelStyle={styles.signupButtonLabel}
            style={styles.signupButton}
          >
            Sign Up
          </Button>
          <TouchableOpacity
            onPress={() => navigation.popTo('LoginScreen')}
            accessibilityRole="button"
          >
            <Text style={styles.signupText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      )}

      <Portal>
        <PaperModal
          visible={categoryModalVisible}
          onDismiss={() => setCategoryModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {CATEGORY_OPTIONS.map((item) => (
            <Button
              key={item}
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
        </PaperModal>
      </Portal>

      <Modal
        transparent={false}
        animationType="slide"
        visible={universityModalVisible}
        onRequestClose={closeUniversityModal}
      >
        <SafeAreaView style={styles.universityModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a University</Text>
            <TouchableOpacity
              onPress={closeUniversityModal}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <MaterialCommunityIcons name="close" size={24} color={colors.secondary} />
            </TouchableOpacity>
          </View>
          <TextInput
            label="Search University"
            mode="outlined"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoCorrect={false}
            activeOutlineColor={colors.darkGreen}
          />
          {renderUniversityList()}
        </SafeAreaView>
      </Modal>

      <Modal
        transparent={true}
        visible={imagePickerModalVisible}
        animationType="fade"
        onRequestClose={() => setImagePickerModalVisible(false)}
        onDismiss={runPendingImageSource}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setImagePickerModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => chooseImageSource('gallery')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="image-multiple" size={40} color={colors.darkblue} />
              <Text style={styles.optionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => chooseImageSource('default')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="account" size={40} color={colors.darkblue} />
              <Text style={styles.optionText}>Default</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    flexGrow: 1,
    paddingVertical: spacing.m,
  },
  universityModal: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  signupButtonContent: {
    flexDirection: 'row-reverse',
  },
  signupButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
  signupButton: {
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.s,
    marginTop: spacing.l,
    borderRadius: sizes.buttonRadius,
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
  searchInput: {
    marginHorizontal: spacing.m,
    marginVertical: spacing.m,
    backgroundColor: 'white',
  },
});

export default SignupScreen;
