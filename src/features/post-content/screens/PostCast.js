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
import { TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import categories from '@shared/data/categories';
import departments from '@shared/data/departments';
import { colors, contentWidth, sizes, spacing, typography } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import AppButton from '@shared/components/AppButton';
import BackButton from '@shared/components/BackButton';
import {
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
      Alert.alert("Couldn't post your cast", getErrorMessage(error, 'Please try again.'));
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.s }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={postFormStyles.header}>
          <BackButton floating={false} onPress={() => navigation.goBack()} style={postFormStyles.headerBackButton} />
          <Text style={postFormStyles.title}>Post a Cast</Text>
        </View>

        <View style={postFormStyles.form}>
          <TextInput
            label="Title"
            style={postFormStyles.input}
            outlineStyle={postFormStyles.inputOutline}
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            autoCapitalize="none"
            maxLength={85}
          />

          {isNonEmpty(title) && (
            <TextInput
              label="Link"
              style={postFormStyles.input}
              outlineStyle={postFormStyles.inputOutline}
              value={link}
              onChangeText={setLink}
              mode="outlined"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
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
              <TouchableOpacity
                onPress={() => setSourceModalVisible(true)}
                style={styles.videoPicker}
                accessibilityRole="button"
              >
                <Ionicons name="videocam-outline" size={22} color={colors.textSecondary} />
                <Text style={styles.videoPickerText}>
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
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.s }]}>
        <View style={styles.footerContent}>
          <AppButton
            fullWidth
            onPress={sendCast}
            loading={loading}
            disabled={loading}
            icon={require('@assets/Postcontent_icons/send.png')}
          >
            POST
          </AppButton>
        </View>
      </View>

      <OptionsModal
        visible={isCategoryModalVisible}
        onDismiss={() => setCategoryModalVisible(false)}
        title="Select a category"
        options={categories}
        getKey={(item) => item}
        getLabel={(item) => item}
        selectedKey={category}
        onSelect={(item) => {
          setCategory(item);
          setCategoryModalVisible(false);
        }}
      />
      <OptionsModal
        visible={isDepartmentModalVisible}
        onDismiss={() => setDepartmentModalVisible(false)}
        title="Select a department"
        options={departments}
        getKey={(item) => item.name}
        getLabel={(item) => item.display}
        selectedKey={department}
        onSelect={selectDepartment}
      />
      <TopicPickerModal
        visible={isTopicModalVisible}
        onDismiss={() => setTopicModalVisible(false)}
        title="Select a topic"
        topics={topicsState.topics}
        loading={topicsState.loading}
        error={topicsState.error}
        onRetry={topicsState.reload}
        selected={topic}
        onSelect={(name) => {
          setTopic(name);
          setTopicModalVisible(false);
        }}
      />

      <ModalReact
        animationType="fade"
        transparent={true}
        visible={isSourceModalVisible}
        onRequestClose={() => setSourceModalVisible(false)}
        onDismiss={launchPendingSource}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Video Source</Text>
            <AppButton fullWidth icon="camera" onPress={() => chooseSource('camera')}>
              Record Video
            </AppButton>
            <AppButton fullWidth icon="image-multiple" onPress={() => chooseSource('library')}>
              Choose from Gallery
            </AppButton>
            <AppButton fullWidth variant="secondary" onPress={() => setSourceModalVisible(false)}>
              Cancel
            </AppButton>
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
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.l,
  },
  footer: {
    paddingTop: spacing.s,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerContent: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
  },
  videoPicker: {
    minHeight: 56,
    marginTop: spacing.s,
    marginBottom: spacing.m,
    paddingHorizontal: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderWidth: 1,
    borderColor: colors.outline,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
  },
  videoPickerText: {
    ...typography.body,
  },
  previewContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    marginBottom: spacing.l,
    borderRadius: sizes.radius,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
    backgroundColor: colors.overlay,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.s,
    padding: spacing.l,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
  },
  modalTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.s,
  },
});

export default PostCast;
