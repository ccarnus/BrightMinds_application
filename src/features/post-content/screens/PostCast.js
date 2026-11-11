import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
import MediaSourceModal, { pickVideoAsset } from '@features/post-content/components/MediaSourceModal';
import ThumbnailPicker from '@features/post-content/components/ThumbnailPicker';

const UPLOAD_TIMEOUT_MS = 300000;

const PostCast = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [topic, setTopic] = useState('');
  const [video, setVideo] = useState(null);
  // Moment of the video (seconds) used as the cast's image; null until the video is loaded.
  const [thumbnailTime, setThumbnailTime] = useState(null);
  const [visibility, setVisibility] = useState(1);

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  const [isSourceModalVisible, setSourceModalVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDepartmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [isTopicModalVisible, setTopicModalVisible] = useState(false);

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
      const asset = await pickVideoAsset(source);
      if (asset) {
        setVideo(asset);
        setThumbnailTime(null);
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      Alert.alert('Error', 'Could not open the video picker. Please try again.');
    }
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
      // The server cuts the thumbnail at this moment (omitted: it picks one automatically).
      ...(thumbnailTime !== null ? { thumbnailTime } : {}),
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
                <ThumbnailPicker
                  key={video.uri}
                  uri={video.uri}
                  initialDuration={video.duration ? video.duration / 1000 : 0}
                  value={thumbnailTime}
                  onChange={setThumbnailTime}
                />
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

      <MediaSourceModal
        visible={isSourceModalVisible}
        title="Choose Video Source"
        cameraLabel="Record Video"
        onSelect={pickVideo}
        onClose={() => setSourceModalVisible(false)}
      />

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
});

export default PostCast;
