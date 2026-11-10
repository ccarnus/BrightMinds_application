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
import { TextInput, Portal, HelperText, Modal as PaperModal } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, contentWidth, fonts, scale, sizes, spacing, typography } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import AppButton from '@shared/components/AppButton';
import Loader from '@shared/components/Loader';
import SearchField from '@shared/components/SearchField';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
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
const PROFILE_IMAGE_SIZE = Math.min(scale(120), 150);
const UNIVERSITY_ICON_SIZE = 40;

const OptionSeparator = () => <View style={styles.separator} />;

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
      console.error('Error fetching universities:', error);
      if (isActive()) setUniversitiesError(error);
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

  const renderUniversityItem = ({ item }) => {
    const selected = !!selectedUniversity && selectedUniversity._id === item._id;
    return (
      <TouchableOpacity
        style={[styles.universityRow, selected && styles.optionRowSelected]}
        onPress={() => {
          setSelectedUniversity(item);
          closeUniversityModal();
        }}
        accessibilityRole="button"
      >
        <Image source={{ uri: item.iconurl }} style={styles.universityIcon} />
        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
          {item.displayedName || item.name}
        </Text>
        {selected && <MaterialCommunityIcons name="check" size={20} color={colors.accent} />}
      </TouchableOpacity>
    );
  };

  const renderUniversityList = () => {
    if (universitiesLoading) {
      return <Loader backgroundColor={colors.surface} />;
    }
    if (universitiesError) {
      return (
        <ErrorState
          compact
          error={universitiesError}
          onRetry={() => fetchUniversities()}
          fallbackMessage="We couldn't load the universities."
        />
      );
    }
    return (
      <FlatList
        data={filteredUniversities}
        keyExtractor={(item) => item._id}
        renderItem={renderUniversityItem}
        ItemSeparatorComponent={OptionSeparator}
        contentContainerStyle={styles.flatListContainer}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <StateMessage compact icon="school-outline" title="No university found" message="Try another search." />
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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + spacing.l }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          <Text style={styles.title}>Sign Up</Text>

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
          />

          <TextInput
            label="Username"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            label="Password"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            autoCapitalize="none"
            textContentType="newPassword"
          />

          <TextInput
            label="Confirm Password"
            style={[styles.input, !passwordsMatch && styles.inputWithHelper]}
            outlineStyle={styles.inputOutline}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            mode="outlined"
            autoCapitalize="none"
            textContentType="newPassword"
            error={!passwordsMatch}
          />
          {!passwordsMatch && (
            <HelperText type="error" visible style={styles.helperText}>
              Passwords do not match
            </HelperText>
          )}

          <Text style={styles.fieldLabel}>Category:</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setCategoryModalVisible(true)}
            accessibilityRole="button"
          >
            <Text style={[styles.selectorText, !role && styles.selectorPlaceholder]}>
              {role || 'Select Category'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {needsUniversity && (
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setUniversityModalVisible(true)}
              accessibilityRole="button"
            >
              {selectedUniversity ? (
                <>
                  <Image source={{ uri: selectedUniversity.iconurl }} style={styles.selectorIcon} />
                  <Text style={styles.selectorText}>
                    {selectedUniversity.displayedName || selectedUniversity.name}
                  </Text>
                </>
              ) : (
                <Text style={[styles.selectorText, styles.selectorPlaceholder]}>Select University</Text>
              )}
              <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textSecondary} />
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
              <>
                <View style={[styles.profileImage, styles.profilePlaceholder]}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={36} color={colors.textSecondary} />
                </View>
                <Text style={styles.imagePickerText}>Select Profile Picture</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {!isKeyboardVisible && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.s }]}>
          <View style={styles.footerContent}>
            <AppButton
              fullWidth
              iconPosition="right"
              icon={require('@assets/Login_icons/sign-up.png')}
              onPress={handleSignup}
              loading={loading}
              disabled={!isFormComplete || loading}
            >
              Sign Up
            </AppButton>
            <TouchableOpacity
              onPress={() => navigation.popTo('LoginScreen')}
              style={styles.loginLink}
              accessibilityRole="button"
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.linkText}>Login</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Portal>
        <PaperModal
          visible={categoryModalVisible}
          onDismiss={() => setCategoryModalVisible(false)}
          contentContainerStyle={styles.optionsModal}
        >
          <Text style={styles.optionsTitle}>Select a category</Text>
          {CATEGORY_OPTIONS.map((item, index) => {
            const selected = item === role;
            return (
              <React.Fragment key={item}>
                {index > 0 && <OptionSeparator />}
                <TouchableOpacity
                  style={[styles.optionRow, selected && styles.optionRowSelected]}
                  onPress={() => {
                    setRole(item);
                    setCategoryModalVisible(false);
                  }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item}</Text>
                  {selected && <MaterialCommunityIcons name="check" size={20} color={colors.accent} />}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
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
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <SearchField
            placeholder="Search University"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchField}
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
          <View style={styles.sourceCard}>
            <TouchableOpacity
              style={styles.sourceOption}
              onPress={() => chooseImageSource('gallery')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="image-multiple" size={40} color={colors.accent} />
              <Text style={styles.sourceOptionText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sourceOption}
              onPress={() => chooseImageSource('default')}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="account" size={40} color={colors.accent} />
              <Text style={styles.sourceOptionText}>Default</Text>
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
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.l,
    paddingBottom: spacing.l,
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
  inputWithHelper: {
    marginBottom: 0,
  },
  helperText: {
    marginBottom: spacing.s,
  },
  fieldLabel: {
    ...typography.bodySmall,
    marginBottom: spacing.xs,
  },
  // Same height and outline as the outlined Paper TextInputs above it.
  selector: {
    minHeight: 56,
    marginBottom: spacing.m,
    paddingHorizontal: 16,
    paddingVertical: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
  },
  selectorText: {
    ...typography.body,
    flex: 1,
  },
  selectorPlaceholder: {
    color: colors.textSecondary,
  },
  selectorIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    marginTop: spacing.s,
    padding: spacing.m,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  profileImage: {
    width: PROFILE_IMAGE_SIZE,
    height: PROFILE_IMAGE_SIZE,
    borderRadius: PROFILE_IMAGE_SIZE / 2,
  },
  profilePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.placeholder,
  },
  imagePickerText: {
    ...typography.bodySmall,
  },
  footer: {
    paddingTop: spacing.m,
    paddingHorizontal: spacing.l,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerContent: {
    ...contentWidth,
  },
  loginLink: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  loginLinkText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  linkText: {
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  optionsModal: {
    width: '88%',
    maxWidth: 448,
    alignSelf: 'center',
    padding: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
  },
  optionsTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
  optionRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.s,
    borderRadius: spacing.s,
  },
  optionRowSelected: {
    backgroundColor: colors.accentSoft,
  },
  optionText: {
    ...typography.body,
    flex: 1,
  },
  optionTextSelected: {
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  universityModal: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.m,
    marginTop: spacing.m,
    marginHorizontal: spacing.m,
  },
  modalTitle: {
    ...typography.h1,
    flex: 1,
  },
  searchField: {
    marginHorizontal: spacing.m,
    marginVertical: spacing.m,
  },
  flatListContainer: {
    flexGrow: 1,
    paddingHorizontal: spacing.s,
    paddingBottom: spacing.m,
  },
  universityRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.s,
    borderRadius: spacing.s,
  },
  universityIcon: {
    width: UNIVERSITY_ICON_SIZE,
    height: UNIVERSITY_ICON_SIZE,
    resizeMode: 'contain',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.overlay,
  },
  sourceCard: {
    width: '80%',
    maxWidth: 320,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.l,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
  },
  sourceOption: {
    minWidth: 88,
    alignItems: 'center',
    padding: spacing.s,
    borderRadius: sizes.radius,
  },
  sourceOptionText: {
    ...typography.body,
    marginTop: spacing.xs,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
});

export default SignupScreen;
