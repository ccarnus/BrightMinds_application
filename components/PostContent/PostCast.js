import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator, Dimensions, Modal as ModalReact, FlatList } from 'react-native';
import { Button, TextInput, Portal, Provider, Modal } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import categories from '../../lists/categories';
import departments from '../../lists/departments';
import { colors, shadow, sizes, spacing } from '../theme';
import Slider from '@react-native-community/slider';
import visibilityCategories from '../../lists/visibilityCategories';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PostCast = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState(null);
  const [visibility, setVisibility] = useState(1);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDepartmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [university, setUniversity] = useState('GeorgiaTech');

  const showCustomAlert = (message) => {
    setCustomAlertMessage(message);
    setCustomAlertVisible(true);
  };

  useEffect(() => {
    const fetchUserIdAndUniversity = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUniversity = await AsyncStorage.getItem('userUniversity');
      setUserId(storedUserId);
      if (storedUniversity) {
        setUniversity(storedUniversity);
      }
    };
    fetchUserIdAndUniversity();
  }, []);

  const takeNewVideo = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideo(result.assets[0]);
        setThumbnailUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking new video:', error);
    }
  };

  //Modal button styles
  const CustomButton = ({ title, onPress, style, textStyle }) => (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );

  // Function to toggle modal visibility
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  // Function to pick a video from the gallery
  const pickVideoFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideo(result.assets[0]);
      setThumbnailUri(result.assets[0].uri);
    }
  };

  const handlePlayVideo = () => {
    navigation.navigate('VideoPlayer', { videoUri: video.uri });
  };

  const sendCast = async () => {
    let missingFields = [];

    if (!title.trim()) missingFields.push("Title");
    if (!description.trim()) missingFields.push("Description");
    if (!category.trim()) missingFields.push("Category");
    if (!department.trim()) missingFields.push("Department");
    if (!video) missingFields.push("Video");

    if (missingFields.length > 0) {
      let errorMessage = 'Please fill in all the required fields:\n\n ' + missingFields.join('\n\n ');

      showCustomAlert(errorMessage);
      return;
    }

    setLoading(true);
    const castData = {
      title,
      description,
      department,
      category,
      university,
      brightmindid: userId,
      visibility,
    };

    const formData = new FormData();
    formData.append('cast', JSON.stringify(castData));
    formData.append('video', {
      uri: video.uri,
      type: 'video/mp4',
      name: 'video.mp4',
    });

    try {
      const response = await fetch('http://3.17.219.54/cast', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Cast posted successfully!');
        navigation.navigate('Cast');
      } else {
        const errorData = await response.text();
        Alert.alert('Error', `Failed to post cast. Error: ${errorData}`);
      }
    } catch (error) {
      console.error('Error sending cast:', error);
      Alert.alert('Error', 'An error occurred while sending the cast.');
    } finally {
      setLoading(false);
    }
  };

  const renderDepartmentItem = ({ item }) => (
    <Button
      onPress={() => { setDepartment(item.name); setDepartmentModalVisible(false); }}
      style={styles.modalItem}
      labelStyle={styles.modalItemLabel}
    >
      {item.display}
    </Button>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.Maintitle}>Post a Cast</Text>
        <TextInput
          label="Title"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          mode="outlined"
        />
        <TextInput
          style={[styles.input, styles.multilineInput]}
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
        />
        <Button
          icon="menu-down"
          mode="outlined"
          onPress={() => setCategoryModalVisible(true)}
          style={styles.dropdownButton}
          contentStyle={styles.dropdownContent}
          labelStyle={styles.dropdownLabel}
        >
          {category || "Select Category"}
        </Button>
        <Portal>
          <Modal visible={isCategoryModalVisible} onDismiss={() => setCategoryModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            {categories.map((item, index) => (
              <Button
                key={index}
                onPress={() => { setCategory(item); setCategoryModalVisible(false); }}
                style={styles.modalItem}
                labelStyle={styles.modalItemLabel}
              >
                {item}
              </Button>
            ))}
          </Modal>
        </Portal>

        <Button
          icon="menu-down"
          mode="outlined"
          onPress={() => setDepartmentModalVisible(true)}
          style={styles.dropdownButton}
          contentStyle={styles.dropdownContent}
          labelStyle={styles.dropdownLabel}
        >
          {department ? departments.find(dept => dept.name === department).display : "Select Department"}
        </Button>
        <Portal>
          <Modal visible={isDepartmentModalVisible} onDismiss={() => setDepartmentModalVisible(false)} contentContainerStyle={styles.modalContainer}>
            <FlatList
              data={departments}
              renderItem={renderDepartmentItem}
              keyExtractor={(item) => item.name}
            />
          </Modal>
        </Portal>

        <Text style={styles.visibilityLabel}>{visibilityCategories[visibility - 1].label}</Text>
        <Slider
          style={{ width: '100%', height: 20 }}
          minimumValue={1}
          maximumValue={5}
          step={1}
          value={visibility}
          onValueChange={(value) => setVisibility(value)}
          thumbTintColor={colors.darkblue}
          minimumTrackTintColor={colors.darkblue}
          maximumTrackTintColor={colors.lightblue}
        />
        {video && (
          <TouchableOpacity onPress={handlePlayVideo} style={styles.thumbnailContainer}>
            <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
            <View style={styles.playButton}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.videoPicker}>
          <TouchableOpacity onPress={toggleModal} style={styles.videoButton}>
            <Text style={styles.videoButtonText}>Select Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendButton} onPress={sendCast} disabled={loading}>
            <Text style={styles.sendButtonText}>POST</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ModalReact
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Choose Video Source</Text>
            <CustomButton
              title="Record Video"
              onPress={() => {
                takeNewVideo();
                toggleModal();
              }}
              style={styles.recordButton}
              textStyle={styles.recordButtonText}
            />
            <CustomButton
              title="Choose from Gallery"
              onPress={() => {
                pickVideoFromGallery();
                toggleModal();
              }}
              style={styles.galleryButton}
              textStyle={styles.galleryButtonText}
            />
            <CustomButton
              title="Cancel"
              onPress={toggleModal}
              style={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            />
          </View>
        </View>
      </ModalReact>
      <ModalReact
        visible={customAlertVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCustomAlertVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={styles.customAlertModalView}>
            <Text style={styles.customAlertText}>{customAlertMessage}</Text>
            <Button onPress={() => setCustomAlertVisible(false)}>OK</Button>
          </View>
        </View>
      </ModalReact>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000, // Ensure the overlay is on top
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  content: {
    paddingHorizontal: 20,
  },
  Maintitle: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.xl,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  fieldDescription: {
    fontSize: sizes.h2,
    color: '#1c1c1c',
    marginBottom: 5,
    fontFamily: 'Montserrat',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  videoPicker: {
    marginBottom: spacing.m,
    marginTop: spacing.l,
    width: "100%",

  },
  videoButton: {
    marginBottom: spacing.s,
    marginTop: spacing.s,
    padding: 10,
    backgroundColor: colors.secondary,
    borderRadius: sizes.radius,
    borderColor: colors.secondary,
    borderWidth: 1,
    width:"80%",
    marginLeft: "10%",
  },
  videoButtonText: {
    fontSize: sizes.h2,
    color: colors.primaryBis,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  sendButton: {
    padding: 15,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    borderRadius: sizes.radius,
    width:"80%",
    marginLeft: "10%",
    marginTop: spacing.m,
  },
  sendButtonText: {
    fontSize: sizes.h2,
    color: colors.primaryBis,
    fontWeight: 'bold',
    fontFamily: 'MontserratBold',
  },
  thumbnailContainer: {
    width: '70%',
    height: 200,
    marginLeft: '15%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
    marginTop: spacing.l,
    borderRadius: 10,
    overflow: 'hidden', // Ensure the child components do not overflow
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)', // Semi-transparent overlay
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#FFF',
    fontSize: 24,
  },
  loadingThumbnail: {
    height: 100,
    marginTop:10,
    marginBottom: 10,
  },
  visibilityLabel: {
    fontSize: sizes.h3,
    textAlign: 'center',
    marginTop: spacing.l,
    color: colors.darkblue,
    fontFamily: 'Montserrat',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  picker: {
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  departmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  departmentImage: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  departmentName: {
    fontSize: sizes.h2,
    fontFamily: 'Montserrat',
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    fontSize: sizes.h2,
  },
  button: {
    borderRadius: sizes.radius,
    padding: 10,
    elevation: 2,
    width: '90%',
    marginTop: 10,
  },
  buttonText: {
    color: colors.primaryBis,
    fontFamily: 'Montserrat',
    textAlign: "center",
    fontSize: sizes.h3,
  },
  recordButton: {
    backgroundColor: colors.darkblue,
  },
  recordButtonText: {},
  galleryButton: {
    backgroundColor: colors.darkblue,
  },
  galleryButtonText: {},
  cancelButton: {
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    color: colors.primaryBis,
  },
  dropdownButton: {
    marginTop: spacing.m,
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    justifyContent: 'center',
  },
  dropdownContent: {
    height: 60,
  },
  dropdownLabel: {
    color: colors.primaryBis,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
    marginBottom: spacing.s,
  },
  customAlertModalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  customAlertText: {
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
  modalItem: {
    color: colors.secondary,
  },
  modalItemLabel: {
    color: colors.secondary,
  }
});

export default PostCast;
