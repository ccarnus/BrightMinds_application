import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView,
  Platform, KeyboardAvoidingView, Alert, Modal, FlatList
} from 'react-native';
import { Button, TextInput, Portal, Provider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { colors, sizes, spacing } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const EditProfileScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('College Student');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [universityModalVisible, setUniversityModalVisible] = useState(false);
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        try {
          const response = await axios.get(`http://3.17.219.54/user/${storedUserId}`);
          const userData = response.data;
          setEmail(userData.email);
          setUsername(userData.username);
          setRole(userData.role);
          setProfilePicture({ uri: userData.profilePictureUrl });
          if (userData.university) {
            setSelectedUniversity({ name: userData.university });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    const fetchUniversities = async () => {
      try {
        const response = await axios.get('http://3.17.219.54/university');
        setUniversities(response.data);
      } catch (error) {
        console.error('Error fetching universities:', error);
      }
    };

    fetchUserData();
    fetchUniversities();
  }, []);

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
      await axios.put(`http://3.17.219.54/user/${userId}`, formData, {
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
        <Text style={styles.universityText}>{item.displayedName}</Text>
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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

          {/* Role Selector */}
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>Role:</Text>
            <ScrollView horizontal>
              <TouchableOpacity onPress={() => setRole('College Student')} style={styles.roleOption}>
                <Text style={[styles.roleOptionText, role === 'College Student' && styles.roleSelected]}>
                  College Student
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRole('Professor')} style={styles.roleOption}>
                <Text style={[styles.roleOptionText, role === 'Professor' && styles.roleSelected]}>
                  Professor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRole('Researcher')} style={styles.roleOption}>
                <Text style={[styles.roleOptionText, role === 'Researcher' && styles.roleSelected]}>
                  Researcher
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRole('Learning Enthusiast')} style={styles.roleOption}>
                <Text
                  style={[
                    styles.roleOptionText,
                    role === 'Learning Enthusiast' && styles.roleSelected
                  ]}
                >
                  Learning Enthusiast
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setRole('PhD Student')} style={styles.roleOption}>
                <Text style={[styles.roleOptionText, role === 'PhD Student' && styles.roleSelected]}>
                  PhD Student
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* University Selector (Custom) */}
          {(role === 'Professor' || role === 'Researcher' || role === 'PhD Student') && (
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

          {/* Profile Picture */}
          <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture.uri }} style={styles.profileImage} />
            ) : (
              <Text style={styles.imagePickerText}>Select Profile Picture</Text>
            )}
          </TouchableOpacity>

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSaveProfile}
            loading={loading}
            style={styles.button}
          >
            Save Profile
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
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.xl,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
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
    paddingHorizontal: spacing.s,
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
    color: colors.secondary,
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
  closeModal: {
    fontSize: sizes.h2,
    color: colors.secondary,
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

export default EditProfileScreen;
