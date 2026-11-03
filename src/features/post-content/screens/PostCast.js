import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal as ModalReact,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import categories from '@shared/data/categories';
import departments from '@shared/data/departments';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import {
  BackButton,
  OptionsModal,
  SelectorField,
  TopicPickerModal,
  UploadingOverlay,
  VisibilitySlider,
  ensureCanPost,
  isNonEmpty,
  postFormStyles,
  useDepartmentTopics,
  usePostAuthor,
} from '@features/post-content/components/PostFormFields';

const UPLOAD_TIMEOUT_MS = 300000;

const SourceButton = ({ title, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={[styles.button, style]} accessibilityRole="button">
    <Text style={styles.buttonText}>{title}</Text>
  </TouchableOpacity>
);

const requestPermission = async (source) => {
  const { granted } =
    source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!granted) {
    Alert.alert(
      'Permission required',
      source === 'camera'
        ? 'Please allow camera access in your device settings to record a video.'
        : 'Please allow photo library access in your device settings to choose a video.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]
    );
  }
  return granted;
};

const PostCast = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [topic, setTopic] = useState('');
  const [video, setVideo] = useState(null);
  const [visibility, setVisibility] = useState(1);
  const previewPlayer = useVideoPlayer(video?.uri ?? null);

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  const [isSourceModalVisible, setSourceModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDepartmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [isTopicModalVisible, setTopicModalVisible] = useState(false);
  const pendingSourceRef = useRef(null);

  const { userId, university } = usePostAuthor('GeorgiaTech');
  const topicsState = useDepartmentTopics(department);

  const selectDepartment = (dept) => {
    if (dept.name !== department) {
      setDepartment(dept.name);
      setTopic('');
    }
    setDepartmentModalVisible(false);
  };

  const pickVideo = async (source) => {
    try {
      if (!(await requestPermission(source))) return;
      const options = { mediaTypes: ['videos'] };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets?.length > 0) {
        setVideo(result.assets[0]);
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'Could not open the video picker. Please try again.');
    }
  };

  // iOS cannot present the picker while the source modal is still animating out,
  // so the launch is deferred to the modal's onDismiss there.
  const launchPendingSource = () => {
    const source = pendingSourceRef.current;
    pendingSourceRef.current = null;
    if (source) pickVideo(source);
  };

  const chooseSource = (source) => {
    pendingSourceRef.current = source;
    setSourceModalVisible(false);
    if (Platform.OS !== 'ios') launchPendingSource();
  };

  const sendCast = async () => {
    if (submittingRef.current) return;

    const missingFields = [];
    if (!title.trim()) missingFields.push('Title');
    if (!link.trim()) missingFields.push('Link');
    if (!category.trim()) missingFields.push('Category');
    if (!department.trim()) missingFields.push('Department');
    if (!topic.trim()) missingFields.push('Topic');
    if (!video) missingFields.push('Video');

    if (missingFields.length > 0) {
      Alert.alert('Missing information', 'Please fill in all the required fields:\n\n' + missingFields.join('\n'));
      return;
    }
    if (!ensureCanPost(userId, navigation)) return;

    submittingRef.current = true;
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
      await api.post('/cast', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: UPLOAD_TIMEOUT_MS,
      });
      Alert.alert('Success', 'Cast posted successfully!');
      navigation.popTo('BottomNav', { screen: 'Cast' });
    } catch (error) {
      console.error('Error sending cast:', error);
      Alert.alert('Error', getErrorMessage(error, 'An error occurred while sending the cast.'));
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <BackButton onPress={() => navigation.goBack()} style={postFormStyles.backButton} />
          <Text style={postFormStyles.Maintitle}>Post a Cast</Text>

          <TextInput
            label="Title"
            style={postFormStyles.input}
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            autoCapitalize="none"
            activeOutlineColor={colors.darkGreen}
            maxLength={85}
          />

          {isNonEmpty(title) && (
            <TextInput
              label="Link"
              style={postFormStyles.input}
              value={link}
              onChangeText={setLink}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              activeOutlineColor={colors.darkGreen}
            />
          )}

          {isNonEmpty(link) && (
            <SelectorField
              label={category || 'Select Category'}
              onPress={() => setCategoryModalVisible(true)}
            />
          )}

          {isNonEmpty(category) && (
            <SelectorField
              label={departments.find((dept) => dept.name === department)?.display || 'Select Department'}
              onPress={() => setDepartmentModalVisible(true)}
            />
          )}

          {isNonEmpty(department) && (
            <SelectorField
              label={topic || 'Select Topic'}
              onPress={() => setTopicModalVisible(true)}
            />
          )}

          {isNonEmpty(topic) && (
            <>
              <VisibilitySlider value={visibility} onChange={setVisibility} />
              <View style={styles.videoPicker}>
                <TouchableOpacity
                  onPress={() => setSourceModalVisible(true)}
                  style={styles.imagePicker}
                  accessibilityRole="button"
                >
                  <Text style={styles.imagePickerText}>
                    {video ? 'Change Video' : 'Select Video'}
                  </Text>
                </TouchableOpacity>

                {video && (
                  <View style={styles.previewContainer}>
                    <VideoView
                      player={previewPlayer}
                      style={styles.preview}
                      contentFit="contain"
                      nativeControls
                    />
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footerContainer, { paddingBottom: insets.bottom }]}>
        <Button
          onPress={sendCast}
          loading={loading}
          disabled={loading}
          mode="contained"
          buttonColor={colors.darkGreen}
          icon={require('@assets/Postcontent_icons/send.png')}
          labelStyle={postFormStyles.postButtonLabel}
          style={postFormStyles.postButton}
        >
          POST
        </Button>
      </View>

      <OptionsModal
        visible={isCategoryModalVisible}
        onDismiss={() => setCategoryModalVisible(false)}
        options={categories}
        getKey={(item) => item}
        getLabel={(item) => item}
        onSelect={(item) => {
          setCategory(item);
          setCategoryModalVisible(false);
        }}
      />
      <OptionsModal
        visible={isDepartmentModalVisible}
        onDismiss={() => setDepartmentModalVisible(false)}
        options={departments}
        getKey={(item) => item.name}
        getLabel={(item) => item.display}
        onSelect={selectDepartment}
      />
      <TopicPickerModal
        visible={isTopicModalVisible}
        onDismiss={() => setTopicModalVisible(false)}
        topics={topicsState.topics}
        loading={topicsState.loading}
        error={topicsState.error}
        onRetry={topicsState.reload}
        onSelect={(name) => {
          setTopic(name);
          setTopicModalVisible(false);
        }}
      />

      <ModalReact
        animationType="slide"
        transparent={true}
        visible={isSourceModalVisible}
        onRequestClose={() => setSourceModalVisible(false)}
        onDismiss={launchPendingSource}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Choose Video Source</Text>
            <SourceButton
              title="Record Video"
              onPress={() => chooseSource('camera')}
              style={styles.sourceButton}
            />
            <SourceButton
              title="Choose from Gallery"
              onPress={() => chooseSource('library')}
              style={styles.sourceButton}
            />
            <SourceButton
              title="Cancel"
              onPress={() => setSourceModalVisible(false)}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </ModalReact>

      <UploadingOverlay visible={loading} message="Uploading your cast..." />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footerContainer: {
    backgroundColor: colors.primaryBis,
    borderTopWidth: 1,
    borderColor: colors.lightGray,
  },
  previewContainer: {
    width: '70%',
    height: 200,
    alignSelf: 'center',
    marginTop: spacing.m,
    marginBottom: spacing.xl,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  videoPicker: {
    marginTop: spacing.l,
    width: '100%',
  },
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
  sourceButton: {
    backgroundColor: colors.darkblue,
  },
  cancelButton: {
    backgroundColor: colors.secondary,
  },
});

export default PostCast;
