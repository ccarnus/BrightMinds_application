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
  FlatList
} from 'react-native';
import { Button, TextInput, Portal, Provider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { colors, sizes, spacing } from '@shared/config/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { API_BASE_URL } from '@shared/config/APIConfig';

const EditProfileScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  // Use a <Picker> for role, same as in SignupScreen
  const [role, setRole] = useState('College Student');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // For universities
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [universityModalVisible, setUniversityModalVisible] = useState(false);

  // Search state for filtering universities by name
  const [searchQuery, setSearchQuery] = useState('');

  // Alert modal
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        try {
          const response = await axios.get(`${API_BASE_URL}/user/${storedUserId}`);
          const userData = response.data;
          setEmail(userData.email);
          setUsername(userData.username);
          setRole(userData.role);
          setProfilePicture({ uri: userData.profilePictureUrl });
          if (userData.university) {
            // We only have the university name in userData, so store an object
            setSelectedUniversity({ name: userData.university });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    const fetchUniversities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/university`);
        setUniversities(response.data);
      } catch (error) {
        console.error('Error fetching universities:', error);
      }
    };

    fetchUserData();
    fetchUniversities();
  }, []);

  // Filter universities based on search query
  const filteredUniversities = universities.filter((item) => {
    const universityName = item.displayedName || item.name;
    return universityName.toLowerCase().includes(searchQuery.toLowerCase());
  });

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

  const handleSaveProfile = async () => {
    if (!userId) return;
    setLoading(true);

    // Build the user update
    const updatedUser = {
      email,
      username,
      role,
      university: selectedUniversity ? selectedUniversity.name : '',
    };

    const formData = new FormData();
    formData.append('user', JSON.stringify(updatedUser));
    if (profilePicture && profilePicture.uri) {
      formData.append('image', {
        uri: profilePicture.uri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      });
    }

    try {
      await axios.put(`${API_BASE_URL}/user/${userId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      Alert.alert('Profile updated successfully.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error updating profile.', error.message || 'Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const showCustomAlert = (message) => {
    setCustomAlertMessage(message);
    setCustomAlertVisible(true);
  };

  // For the custom university list items
  const renderUniversityItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.universityItemWrapper}
        onPress={() => {
          setSelectedUniversity(item);
          setUniversityModalVisible(false);
          // Reset search when an item is selected
          setSearchQuery('');
        }}
      >
        {item.iconurl && (
          <Image source={{ uri: item.iconurl }} style={styles.universityIcon} />
        )}
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
          <Text style={styles.title}>Edit Profile</Text>

          {/* Email */}
          <TextInput
            label="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
          />

          {/* Username */}
          <TextInput
            label="Username"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
          />

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

          {/* University Selector (only if needed) */}
          {(role === 'Professor' || role === 'Researcher' || role === 'PhD Student') && (
            <TouchableOpacity
              style={styles.universitySelector}
              onPress={() => setUniversityModalVisible(true)}
            >
              {selectedUniversity ? (
                <View style={styles.universitySelectedWrapper}>
                  {selectedUniversity.iconurl && (
                    <Image
                      source={{ uri: selectedUniversity.iconurl }}
                      style={styles.universityIcon}
                    />
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

          {/* Profile Picture */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture.uri }} style={styles.profileImage} />
            ) : (
              <Text style={styles.imagePickerText}>Select Profile Picture</Text>
            )}
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={handleSaveProfile}
            loading={loading}
            buttonColor={colors.darkGreen}
            icon={require('@assets/Profile_icons/save.png')}
            labelStyle={{
              fontSize: sizes.h2,
              fontFamily: 'Montserrat',
              textAlign: 'center',
              paddingTop: spacing.xs,
            }}
            style={{
              marginLeft: spacing.m,
              marginRight: spacing.m,
              marginBottom: spacing.s,
              marginTop: spacing.l,
              borderRadius: sizes.buttonRadius,
            }}
          >
            Save
          </Button>

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
            {/* Search input for universities */}
            <TextInput
              label="Search University"
              mode="outlined"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
            />
            <FlatList
              data={filteredUniversities}
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
  button: {
    backgroundColor: colors.secondary,
    marginTop: spacing.l,
    marginBottom: spacing.l,
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
  searchInput: {
    marginHorizontal: spacing.m,
    marginVertical: spacing.m,
    backgroundColor: 'white'
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

export default EditProfileScreen;
