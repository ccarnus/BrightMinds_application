import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { Button, TextInput, Modal, Portal, Provider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { colors, sizes, spacing } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EditProfileScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('College Student');
  const [profilePicture, setProfilePicture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState('');
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
            setSelectedUniversity(userData.university);
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
      university: selectedUniversity,
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

  return (
    <Provider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Edit Profile</Text>
          <TextInput
            label="Email"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            autoCapitalize="none"
          />
          <TextInput
            label="Username"
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            mode="outlined"
            autoCapitalize="none"
          />
          <Picker
            selectedValue={role}
            style={styles.input}
            onValueChange={(itemValue) => setRole(itemValue)}
          >
            <Picker.Item label="College Student" value="College Student" />
            <Picker.Item label="Professor" value="Professor" />
            <Picker.Item label="Researcher" value="Researcher" />
            <Picker.Item label="Learning Enthusiast" value="Learning Enthusiast" />
            <Picker.Item label="PhD Student" value="PhD Student" />
          </Picker>
          {(role === 'Professor' || role === 'Researcher' || role === 'PhD Student') && (
            <Picker
              selectedValue={selectedUniversity}
              style={styles.input}
              onValueChange={(itemValue) => setSelectedUniversity(itemValue)}
            >
              <Picker.Item label="Select University" value="" />
              {universities.map((university) => (
                <Picker.Item key={university._id} label={university.name} value={university.name} />
              ))}
            </Picker>
          )}
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
            style={styles.button}
          >
            Save Profile
          </Button>
          <Portal>
            <Modal visible={customAlertVisible} onDismiss={() => setCustomAlertVisible(false)} contentContainerStyle={styles.modalContainer}>
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
    justifyContent: 'top',
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
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
  },
});

export default EditProfileScreen;
