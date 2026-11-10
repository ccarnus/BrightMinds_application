import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Linking,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, sizes, spacing, typography } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, setUser, isGuestUser, canAccessLibrary } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import AppButton from '@shared/components/AppButton';
import SearchField from '@shared/components/SearchField';

const ROLES = ['College Student', 'Professor', 'Researcher', 'Learning Enthusiast', 'PhD Student'];
const UPLOAD_TIMEOUT_MS = 120000;
const PROFILE_PICTURE_SIZE = 150;

const UniversitySeparator = () => <View style={styles.separator} />;

const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('College Student');
  const [currentPictureUrl, setCurrentPictureUrl] = useState(null);
  // Only a newly picked local image is uploaded; the existing remote picture is left untouched.
  const [pickedImage, setPickedImage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [universities, setUniversities] = useState([]);
  const [universitiesError, setUniversitiesError] = useState(null);
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [universityModalVisible, setUniversityModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchUserData = useCallback(async () => {
    setIsLoadingUser(true);
    setLoadError(null);
    try {
      const { userId: storedUserId } = await getUser();
      if (!storedUserId || isGuestUser(storedUserId)) {
        throw new Error('No signed-in user');
      }
      const { data: userData } = await api.get(`/user/${storedUserId}`);
      if (!mountedRef.current) return;
      setUserId(storedUserId);
      setEmail(userData.email || '');
      setUsername(userData.username || '');
      if (userData.role) setRole(userData.role);
      setCurrentPictureUrl(userData.profilePictureUrl || null);
      // Only the university name is stored on the user.
      setSelectedUniversity(userData.university ? { name: userData.university } : null);
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (mountedRef.current) setLoadError(error);
    } finally {
      if (mountedRef.current) setIsLoadingUser(false);
    }
  }, []);

  const fetchUniversities = useCallback(async () => {
    setIsLoadingUniversities(true);
    setUniversitiesError(null);
    try {
      const { data } = await api.get('/university');
      if (mountedRef.current) setUniversities(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching universities:', error);
      if (mountedRef.current) setUniversitiesError(error);
    } finally {
      if (mountedRef.current) setIsLoadingUniversities(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchUniversities();
  }, [fetchUserData, fetchUniversities]);

  const filteredUniversities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return universities;
    return universities.filter((item) =>
      (item.displayedName || item.name || '').toLowerCase().includes(query)
    );
  }, [universities, searchQuery]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photos to change your profile picture.',
        permission.canAskAgain
          ? [{ text: 'OK' }]
          : [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setPickedImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Could not open your photos', 'Please try again.');
    }
  };

  const closeUniversityModal = () => {
    setUniversityModalVisible(false);
    setSearchQuery('');
  };

  const needsUniversity = canAccessLibrary(role);

  const handleSaveProfile = async () => {
    if (!userId || saving) return;
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    if (!trimmedEmail || !trimmedUsername) {
      Alert.alert('Missing information', 'Please enter both an email and a username.');
      return;
    }

    setSaving(true);
    const universityName = selectedUniversity ? selectedUniversity.name : '';
    const updatedUser = {
      email: trimmedEmail,
      username: trimmedUsername,
      role,
      university: universityName,
    };

    const formData = new FormData();
    formData.append('user', JSON.stringify(updatedUser));
    if (pickedImage?.uri) {
      formData.append('image', {
        uri: pickedImage.uri,
        type: pickedImage.mimeType || 'image/jpeg',
        name: pickedImage.fileName || 'profile.jpg',
      });
    }

    try {
      await api.put(`/user/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: UPLOAD_TIMEOUT_MS,
      });
      // Keep the cached session in sync so role-based access (Library tab) updates immediately.
      await setUser({ userId, userRole: role, userUniversity: universityName });
      if (!mountedRef.current) return;
      Alert.alert('Profile updated successfully.');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert("Couldn't update your profile", getErrorMessage(error, 'Please try again.'));
    } finally {
      if (mountedRef.current) setSaving(false);
    }
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
      {!!item.iconurl && <Image source={{ uri: item.iconurl }} style={styles.universityIcon} />}
      <Text style={styles.universityText}>{item.displayedName || item.name}</Text>
    </TouchableOpacity>
  );

  const renderUniversityList = () => {
    if (isLoadingUniversities) {
      return <Loader backgroundColor={colors.surface} />;
    }
    if (universitiesError) {
      return (
        <ErrorState
          compact
          error={universitiesError}
          onRetry={fetchUniversities}
          fallbackMessage="We couldn't load the universities."
        />
      );
    }
    return (
      <FlatList
        data={filteredUniversities}
        keyExtractor={(item, index) => String(item._id || item.name || index)}
        renderItem={renderUniversityItem}
        ItemSeparatorComponent={UniversitySeparator}
        contentContainerStyle={styles.flatListContainer}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        ListEmptyComponent={
          <StateMessage compact icon="school-outline" title="No university found" message="Try another search." />
        }
      />
    );
  };

  if (isLoadingUser) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (loadError) {
    return (
      <View style={[styles.stateContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ErrorState
          error={loadError}
          onRetry={fetchUserData}
          fallbackMessage="We couldn't load your profile."
          secondaryActionLabel="Go back"
          onSecondaryAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const previewUri = pickedImage?.uri || currentPictureUrl;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: spacing.l + insets.top, paddingBottom: spacing.l + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Edit Profile</Text>

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
          textContentType="emailAddress"
          autoComplete="email"
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
          textContentType="username"
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={role}
            style={styles.picker}
            dropdownIconColor={colors.textSecondary}
            onValueChange={(itemValue) => setRole(itemValue)}
            accessibilityLabel="Role"
          >
            {ROLES.map((roleOption) => (
              <Picker.Item key={roleOption} label={roleOption} value={roleOption} />
            ))}
          </Picker>
        </View>

        {needsUniversity && (
          <TouchableOpacity
            style={styles.universitySelector}
            onPress={() => setUniversityModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Select university"
          >
            {selectedUniversity ? (
              <View style={styles.universitySelectedWrapper}>
                {!!selectedUniversity.iconurl && (
                  <Image source={{ uri: selectedUniversity.iconurl }} style={styles.universityIcon} />
                )}
                <Text style={styles.universityText}>
                  {selectedUniversity.displayedName || selectedUniversity.name}
                </Text>
              </View>
            ) : (
              <Text style={styles.universityPlaceholder}>Select University</Text>
            )}
            <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={pickImage}
          style={styles.imagePicker}
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
        >
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={styles.profileImage} />
          ) : (
            <Text style={styles.imagePickerText}>Select Profile Picture</Text>
          )}
        </TouchableOpacity>

        <AppButton
          fullWidth
          onPress={handleSaveProfile}
          loading={saving}
          disabled={saving}
          icon={require('@assets/Profile_icons/save.png')}
          style={styles.saveButton}
        >
          Save
        </AppButton>
      </ScrollView>

      <Modal
        transparent={false}
        animationType="slide"
        visible={universityModalVisible}
        onRequestClose={closeUniversityModal}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select a University</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeUniversityModal}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <SearchField
              placeholder="Search University"
              accessibilityLabel="Search University"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            {renderUniversityList()}
          </View>
        </SafeAreaView>
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
    ...contentWidth,
    flexGrow: 1,
    paddingHorizontal: spacing.m,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.l,
  },
  input: {
    marginBottom: spacing.m,
    backgroundColor: colors.surface,
  },
  inputOutline: {
    borderRadius: sizes.radius,
  },
  pickerContainer: {
    marginBottom: spacing.m,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: sizes.radius,
    overflow: 'hidden',
  },
  picker: {
    height: 56,
    width: '100%',
    color: colors.text,
  },
  universitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    minHeight: 56,
    marginBottom: spacing.m,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: sizes.radius,
  },
  universitySelectedWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  universityPlaceholder: {
    ...typography.body,
    flex: 1,
    color: colors.textSecondary,
  },
  universityItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  universityIcon: {
    width: 36,
    height: 36,
    marginRight: spacing.m,
    resizeMode: 'contain',
  },
  universityText: {
    ...typography.body,
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.m,
    backgroundColor: colors.border,
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: spacing.m,
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: sizes.radius,
  },
  profileImage: {
    width: PROFILE_PICTURE_SIZE,
    height: PROFILE_PICTURE_SIZE,
    borderRadius: PROFILE_PICTURE_SIZE / 2,
    backgroundColor: colors.placeholder,
  },
  imagePickerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  saveButton: {
    marginTop: spacing.m,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalContent: {
    ...contentWidth,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.s,
    paddingTop: spacing.m,
    paddingLeft: spacing.m,
    paddingRight: spacing.xs,
  },
  modalTitle: {
    ...typography.h1,
    flexShrink: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    marginHorizontal: spacing.m,
    marginVertical: spacing.m,
  },
  flatListContainer: {
    flexGrow: 1,
    paddingBottom: spacing.m,
  },
});

export default EditProfileScreen;
