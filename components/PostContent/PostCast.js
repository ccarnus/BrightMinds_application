import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal as ModalReact,
  FlatList,
} from 'react-native';
import { Button, TextInput, Portal, Modal } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import categories from '../../lists/categories';
import departments from '../../lists/departments';
import { colors, sizes, spacing } from '../theme';
import Slider from '@react-native-community/slider';
import visibilityCategories from '../../lists/visibilityCategories';

const PostCast = ({ navigation }) => {
  // Basic state
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [topic, setTopic] = useState('');
  const [video, setVideo] = useState(null);
  const [thumbnailUri, setThumbnailUri] = useState(null);
  const [visibility, setVisibility] = useState(1);
  const [loading, setLoading] = useState(false);
  const [topicLoading, setTopicLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDepartmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [isTopicModalVisible, setTopicModalVisible] = useState(false);
  const [topicOptions, setTopicOptions] = useState([]);
  const [isManualTopicEntry, setManualTopicEntry] = useState(false);
  const [manualTopicText, setManualTopicText] = useState('');
  const [customAlertVisible, setCustomAlertVisible] = useState(false);
  const [customAlertMessage, setCustomAlertMessage] = useState('');

  // User & University
  const [userId, setUserId] = useState(null);
  const [university, setUniversity] = useState('GeorgiaTech');

  useEffect(() => {
    // Fetch userId and university from AsyncStorage
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

  // Whenever a department is selected, fetch topics from the API
  useEffect(() => {
    if (department) {
      fetchTopicsForDepartment(department);
    }
  }, [department]);

  // Fetch topics for the selected department
  const fetchTopicsForDepartment = async (deptName) => {
    try {
      setTopicLoading(true);
      setTopicOptions([]); 
      setTopic('');
      const response = await fetch(
        `http://3.17.219.54/topic/department/${deptName}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch topics from the server');
      }
      const data = await response.json();
      setTopicOptions(data);
    } catch (error) {
      console.error('Error fetching topics:', error);
      showCustomAlert('Failed to load topics. Please try again later.');
    } finally {
      setTopicLoading(false);
    }
  };

  // Custom alert toggler
  const showCustomAlert = (message) => {
    setCustomAlertMessage(message);
    setCustomAlertVisible(true);
  };

  // Video handling
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

  const pickVideoFromGallery = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setVideo(result.assets[0]);
        setThumbnailUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video from gallery:', error);
    }
  };

  const handlePlayVideo = () => {
    navigation.navigate('VideoPlayer', { videoUri: video.uri });
  };

  // Video source modal toggler
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  // Send cast to API
  const sendCast = async () => {
    let missingFields = [];

    if (!title.trim()) missingFields.push('Title');
    if (!link.trim()) missingFields.push('Link');
    if (!category.trim()) missingFields.push('Category');
    if (!department.trim()) missingFields.push('Department');
    if (!topic.trim()) missingFields.push('Topic');
    if (!video) missingFields.push('Video');

    if (missingFields.length > 0) {
      let errorMessage =
        'Please fill in all the required fields:\n\n ' +
        missingFields.join('\n\n ');
      showCustomAlert(errorMessage);
      return;
    }

    setLoading(true);

    const castData = {
      title,
      link,
      department,
      category,
      topic,
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

  // Department render
  const renderDepartmentItem = ({ item }) => (
    <Button
      onPress={() => {
        setDepartment(item.name);
        setDepartmentModalVisible(false);
      }}
      style={styles.modalItem}
      labelStyle={styles.modalItemLabel}
    >
      {item.display}
    </Button>
  );

  // Topic render for each item from the API
  const renderTopicItem = ({ item }) => (
    <Button
      onPress={() => {
        setTopic(item.name);
        setTopicModalVisible(false);
      }}
      style={styles.modalItem}
      labelStyle={styles.modalItemLabel}
    >
      {item.name}
    </Button>
  );

  // Reusable button in the custom modals
  const CustomButton = ({ title, onPress, style, textStyle }) => (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      <Text style={[styles.buttonText, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Lottie-based loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <LottieView
              source={require('../../assets/Loader/loader.json')}
              autoPlay
              loop
              style={styles.lottie}
            />
          </View>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.Maintitle}>Post a Cast</Text>

        {/* Title */}
        <TextInput
          label="Title"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          autoCapitalize="none"
        />

        {/* Link */}
        <TextInput
          label="Link"
          style={styles.input}
          value={link}
          onChangeText={setLink}
          mode="outlined"
          autoCapitalize="none"
        />

        {/* Category Selector */}
        <TouchableOpacity
          style={styles.selectorContainer}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={styles.selectorText}>
            {category || 'Select Category'}
          </Text>
        </TouchableOpacity>
        <Portal>
          <Modal
            visible={isCategoryModalVisible}
            onDismiss={() => setCategoryModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            {categories.map((item, index) => (
              <Button
                key={index}
                onPress={() => {
                  setCategory(item);
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

        {/* Department Selector */}
        <TouchableOpacity
          style={styles.selectorContainer}
          onPress={() => setDepartmentModalVisible(true)}
        >
          <Text style={styles.selectorText}>
            {department
              ? departments.find((dept) => dept.name === department)?.display
              : 'Select Department'}
          </Text>
        </TouchableOpacity>
        <Portal>
          <Modal
            visible={isDepartmentModalVisible}
            onDismiss={() => setDepartmentModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <FlatList
              data={departments}
              renderItem={renderDepartmentItem}
              keyExtractor={(item) => item.name}
            />
          </Modal>
        </Portal>

        {/* Topic Selector */}
        <TouchableOpacity
          style={styles.selectorContainer}
          onPress={() => setTopicModalVisible(true)}
        >
          <Text style={styles.selectorText}>{topic || 'Select Topic'}</Text>
        </TouchableOpacity>
        <Portal>
          <Modal
            visible={isTopicModalVisible}
            onDismiss={() => setTopicModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            {topicLoading ? (
              <LottieView
                source={require('../../assets/Loader/loader.json')}
                autoPlay
                loop
                style={{ width: 100, height: 100, alignSelf: 'center' }}
              />
            ) : (
              <>
                <FlatList
                  data={topicOptions}
                  renderItem={renderTopicItem}
                  keyExtractor={(item) => item._id}
                />
                {!isManualTopicEntry && (
                  <Button
                    onPress={() => setManualTopicEntry(true)}
                    style={[styles.modalItem, { marginTop: 10 }]}
                    labelStyle={styles.modalItemLabel}
                  >
                    Enter Custom Topic
                  </Button>
                )}

                {isManualTopicEntry && (
                  <View>
                    <TextInput
                      label="Custom Topic"
                      value={manualTopicText}
                      onChangeText={(text) => setManualTopicText(text)}
                      mode="outlined"
                      style={styles.input}
                    />
                    <Button
                      onPress={() => {
                        if (manualTopicText.trim().length > 0) {
                          setTopic(manualTopicText.trim());
                          setTopicModalVisible(false);
                        }
                        setManualTopicEntry(false);
                        setManualTopicText('');
                      }}
                      style={styles.modalItem}
                      labelStyle={styles.modalItemLabel}
                    >
                      Save Topic
                    </Button>
                  </View>
                )}
              </>
            )}
          </Modal>
        </Portal>

        {/* Visibility Slider */}
        <Text style={styles.visibilityLabel}>
          {visibilityCategories[visibility - 1].label}
        </Text>
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

        {/* Video Picker + Thumbnail below */}
        <View style={styles.videoPicker}>
          <TouchableOpacity onPress={toggleModal} style={styles.imagePicker}>
            <Text style={styles.imagePickerText}>Select Video</Text>
          </TouchableOpacity>

          {video && (
            <TouchableOpacity
              onPress={handlePlayVideo}
              style={styles.thumbnailContainer}
            >
              <Image source={{ uri: thumbnailUri }} style={styles.thumbnail} />
              <View style={styles.playButton}>
                <Text style={styles.playButtonText}>▶</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.postButton}
            onPress={sendCast}
            disabled={loading}
          >
            <Text style={styles.postButtonText}>POST</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal for picking/recording video */}
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

      {/* Custom alert modal */}
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
  // Overall container style
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  content: {
    padding: 20,
  },
  // Title style
  Maintitle: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.xl,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  // TextInput styling
  input: {
    marginBottom: spacing.m,
    backgroundColor: 'transparent',
    fontFamily: 'Montserrat',
  },
  // Selector styling
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
  // Modals
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
  },
  modalItem: {
    color: colors.secondary,
  },
  modalItemLabel: {
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  // Thumbnail
  thumbnailContainer: {
    width: '70%',
    height: 200,
    marginLeft: '15%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.m,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButton: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  // Visibility label
  visibilityLabel: {
    fontSize: sizes.h3,
    textAlign: 'center',
    marginTop: spacing.l,
    color: colors.darkblue,
    fontFamily: 'Montserrat',
  },
  // Video picking row
  videoPicker: {
    marginTop: spacing.l,
    width: '100%',
  },
  // "Select Video" styling
  imagePicker: {
    marginBottom: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    padding: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: 'white',
  },
  imagePickerText: {
    color: 'gray',
    fontFamily: 'Montserrat',
  },
  // "POST" button styling
  postButton: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    borderRadius: sizes.radius,
    padding: spacing.m,
    marginTop: spacing.s,
  },
  postButtonText: {
    fontSize: sizes.h2,
    color: colors.primaryBis,
    fontWeight: 'bold',
    fontFamily: 'MontserratBold',
  },
  // Lottie-based loading overlay
  loadingOverlay: {
    position: 'absolute',
    zIndex: 1000,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    width: 200,
    height: 200,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
  // Video source modal
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: sizes.radius,
    padding: 35,
    alignItems: 'center',
    elevation: 5,
  },
  modalText: {
    marginBottom: spacing.m,
    textAlign: 'center',
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    fontSize: sizes.h2,
  },
  button: {
    borderRadius: sizes.radius,
    padding: spacing.m,
    elevation: 2,
    width: '90%',
    marginTop: spacing.s,
  },
  buttonText: {
    color: colors.primaryBis,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    fontSize: sizes.h3,
  },
  recordButton: {
    backgroundColor: colors.darkblue,
  },
  galleryButton: {
    backgroundColor: colors.darkblue,
  },
  cancelButton: {
    backgroundColor: colors.secondary,
  },
  recordButtonText: {},
  galleryButtonText: {},
  cancelButtonText: {
    color: colors.primaryBis,
  },
  // Custom alert modal
  customAlertModalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: sizes.radius,
    padding: 35,
    alignItems: 'center',
    elevation: 5,
  },
  customAlertText: {
    marginBottom: spacing.m,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
});

export default PostCast;
