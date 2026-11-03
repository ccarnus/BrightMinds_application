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
import { Button, TextInput } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, setUser, isGuestUser, canAccessLibrary } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const ROLES = ['College Student', 'Professor', 'Researcher', 'Learning Enthusiast', 'PhD Student'];
const UPLOAD_TIMEOUT_MS = 120000;

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
      if (mountedRef.current) {
        setLoadError(getErrorMessage(error, "We couldn't load your profile."));
      }
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
      if (mountedRef.current) {
        setUniversitiesError(getErrorMessage(error, "We couldn't load the universities."));
      }
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
      Alert.alert('Error updating profile.', getErrorMessage(error, 'Please try again.'));
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
      return <Loader backgroundColor={colors.primary} />;
    }
    if (universitiesError) {
      return (
        <StateMessage
          icon="cloud-offline-outline"
          title="Something went wrong"
          message={universitiesError}
          actionLabel="Try again"
          onAction={fetchUniversities}
        />
      );
    }
    return (
      <FlatList
        data={filteredUniversities}
        keyExtractor={(item, index) => String(item._id || item.name || index)}
        renderItem={renderUniversityItem}
        contentContainerStyle={styles.flatListContainer}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        ListEmptyComponent={<Text style={styles.emptyText}>No universities found.</Text>}
      />
    );
  };

  if (isLoadingUser) {
    return <Loader backgroundColor={colors.primaryBis} />;
  }

  if (loadError) {
    return (
      <View style={[styles.stateContainer, { paddingTop: insets.top }]}>
        <StateMessage
          icon="cloud-offline-outline"
          title="Something went wrong"
          message={loadError}
          actionLabel="Try again"
          onAction={fetchUserData}
        />
        <Button mode="text" textColor={colors.secondary} onPress={() => navigation.goBack()} style={styles.backButton}>
          Go back
        </Button>
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
          { paddingTop: 20 + insets.top, paddingBottom: 20 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Edit Profile</Text>

        <TextInput
          label="Email"
          style={styles.input}
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

        <Button
          mode="contained"
          onPress={handleSaveProfile}
          loading={saving}
          disabled={saving}
          buttonColor={colors.darkGreen}
          icon={require('@assets/Profile_icons/save.png')}
          labelStyle={styles.saveButtonLabel}
          style={styles.saveButton}
        >
          Save
        </Button>
      </ScrollView>

      <Modal
        transparent={false}
        animationType="slide"
        visible={universityModalVisible}
        onRequestClose={closeUniversityModal}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a University</Text>
            <TouchableOpacity
              onPress={closeUniversityModal}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          />
          {renderUniversityList()}
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: colors.primaryBis,
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
  },
  // Picker styles
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: sizes.radius,
    marginBottom: spacing.l,
    marginTop: spacing.m,
    overflow: 'hidden',
  },
  picker: {
    height: 60,
    width: '100%',
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
  saveButton: {
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.s,
    marginTop: spacing.l,
    borderRadius: sizes.buttonRadius,
  },
  saveButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.xs,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'center',
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  emptyText: {
    fontFamily: 'Montserrat',
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.l,
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
    color: colors.secondary,
    flexShrink: 1,
  },
  searchInput: {
    marginHorizontal: spacing.m,
    marginVertical: spacing.m,
    backgroundColor: 'white'
  },
  flatListContainer: {
    paddingVertical: spacing.m,
  },
});

export default EditProfileScreen;
