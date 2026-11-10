import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing } from '@shared/config/theme';
import departments from '@shared/data/departments';
import categories from '@shared/data/categories';
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
import MediaSourceModal, { pickMedia } from '@features/post-content/components/MediaSourceModal';
import CoverImagePicker from '@features/post-content/components/CoverImagePicker';

const POST_TIMEOUT_MS = 120000;
const WORDS_PER_MINUTE = 200;
// JPEG (not HEIC on iOS), recompressed: the server re-encodes the cover anyway.
const COVER_PICKER_OPTIONS = {
  mediaTypes: ['images'],
  quality: 0.85,
  preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
};

const calculateReadingTime = (text) =>
  Math.ceil(text.trim().split(/\s+/).length / WORDS_PER_MINUTE);

const coverFile = (image) => {
  const type = image.mimeType || 'image/jpeg';
  const extension = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg';
  return { uri: image.uri, type, name: `cover.${extension}` };
};

const PostArticle = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [topic, setTopic] = useState('');
  const [visibility, setVisibility] = useState(1);
  const [cover, setCover] = useState(null);

  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDepartmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [isTopicModalVisible, setTopicModalVisible] = useState(false);
  const [isSourceModalVisible, setSourceModalVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const submittingRef = useRef(false);

  const { userId, university } = usePostAuthor('Default');
  const topicsState = useDepartmentTopics(department);

  const selectDepartment = (dept) => {
    if (dept.name !== department) {
      setDepartment(dept.name);
      setTopic('');
    }
    setDepartmentModalVisible(false);
  };

  const pickCover = async (source) => {
    try {
      const asset = await pickMedia(source, 'image', COVER_PICKER_OPTIONS);
      if (asset) setCover(asset);
    } catch (error) {
      console.error('Error selecting cover image:', error);
      Alert.alert('Error', 'Could not open the image picker. Please try again.');
    }
  };

  const handlePostArticle = async () => {
    if (submittingRef.current) return;

    const missingFields = [];
    if (!isNonEmpty(title)) missingFields.push('Title');
    if (!isNonEmpty(description)) missingFields.push('Description');
    if (!isNonEmpty(category)) missingFields.push('Category');
    if (!isNonEmpty(department)) missingFields.push('Department');
    if (!isNonEmpty(topic)) missingFields.push('Topic');
    if (!cover) missingFields.push('Cover image');

    if (missingFields.length > 0) {
      Alert.alert('Missing information', 'Please fill in all required fields:\n\n' + missingFields.join('\n'));
      return;
    }
    if (!ensureCanPost(userId, navigation)) return;

    submittingRef.current = true;
    setLoading(true);

    const articleData = {
      title,
      description,
      link,
      department,
      university,
      category,
      topic,
      brightmindid: userId,
      visibility,
      duration: calculateReadingTime(description),
    };

    const formData = new FormData();
    formData.append('article', JSON.stringify(articleData));
    formData.append('image', coverFile(cover));

    try {
      await api.post('/article', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: POST_TIMEOUT_MS,
      });
      Alert.alert('Success', 'Article posted successfully!');
      navigation.popTo('BottomNav', { screen: 'Cast' });
    } catch (error) {
      console.error('Error posting article:', error);
      Alert.alert("Couldn't post your article", getErrorMessage(error, 'Please try again.'));
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
        contentContainerStyle={{
          paddingTop: insets.top + spacing.s,
          paddingBottom: insets.bottom + spacing.xl,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={postFormStyles.header}>
          <BackButton floating={false} onPress={() => navigation.goBack()} style={postFormStyles.headerBackButton} />
          <Text style={postFormStyles.title}>Post an Article</Text>
        </View>

        <View style={postFormStyles.form}>
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={postFormStyles.input}
            outlineStyle={postFormStyles.inputOutline}
            autoCapitalize="none"
            maxLength={85}
          />

          {isNonEmpty(title) && (
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              mode="outlined"
              style={[postFormStyles.input, styles.multilineInput]}
              outlineStyle={postFormStyles.inputOutline}
              autoCapitalize="none"
            />
          )}

          {isNonEmpty(description) && (
            <TextInput
              label="Link"
              value={link}
              onChangeText={setLink}
              mode="outlined"
              style={postFormStyles.input}
              outlineStyle={postFormStyles.inputOutline}
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
              <CoverImagePicker image={cover} onPress={() => setSourceModalVisible(true)} />
              <AppButton
                fullWidth
                onPress={handlePostArticle}
                loading={loading}
                disabled={loading}
                icon={require('@assets/Postcontent_icons/send.png')}
                style={postFormStyles.postButton}
              >
                POST
              </AppButton>
            </>
          )}
        </View>
      </ScrollView>

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
        title="Choose a cover image"
        cameraLabel="Take a Photo"
        onSelect={pickCover}
        onClose={() => setSourceModalVisible(false)}
      />

      <UploadingOverlay visible={loading} message="Posting your article..." />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  multilineInput: {
    height: 150,
    textAlignVertical: 'top',
  },
});

export default PostArticle;
