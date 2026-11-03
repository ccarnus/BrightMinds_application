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
import { Button, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@shared/config/theme';
import departments from '@shared/data/departments';
import categories from '@shared/data/categories';
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

const POST_TIMEOUT_MS = 60000;
const WORDS_PER_MINUTE = 200;

const calculateReadingTime = (text) =>
  Math.ceil(text.trim().split(/\s+/).length / WORDS_PER_MINUTE);

const PostArticle = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [topic, setTopic] = useState('');
  const [visibility, setVisibility] = useState(1);

  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDepartmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [isTopicModalVisible, setTopicModalVisible] = useState(false);

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

  const handlePostArticle = async () => {
    if (submittingRef.current) return;

    const missingFields = [];
    if (!isNonEmpty(title)) missingFields.push('Title');
    if (!isNonEmpty(description)) missingFields.push('Description');
    if (!isNonEmpty(category)) missingFields.push('Category');
    if (!isNonEmpty(department)) missingFields.push('Department');
    if (!isNonEmpty(topic)) missingFields.push('Topic');

    if (missingFields.length > 0) {
      Alert.alert('Missing information', 'Please fill in all required fields:\n\n' + missingFields.join('\n'));
      return;
    }
    if (!ensureCanPost(userId, navigation)) return;

    submittingRef.current = true;
    setLoading(true);

    const articleData = {
      title,
      articleDescription: description,
      link,
      department,
      university,
      category,
      topic,
      brightmindid: userId,
      visibility,
      duration: calculateReadingTime(description),
    };

    try {
      await api.post('/article', articleData, { timeout: POST_TIMEOUT_MS });
      Alert.alert('Success', 'Article posted successfully!');
      navigation.navigate('BottomNav', { screen: 'Cast' });
    } catch (error) {
      console.error('Error posting article:', error);
      Alert.alert('Error', getErrorMessage(error, 'Failed to post the article. Please try again.'));
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
          <Text style={postFormStyles.Maintitle}>Post an Article</Text>

          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={postFormStyles.input}
            autoCapitalize="none"
            activeOutlineColor={colors.darkGreen}
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
              autoCapitalize="none"
              activeOutlineColor={colors.darkGreen}
            />
          )}

          {isNonEmpty(description) && (
            <TextInput
              label="Link"
              value={link}
              onChangeText={setLink}
              mode="outlined"
              style={postFormStyles.input}
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
              <Button
                onPress={handlePostArticle}
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
            </>
          )}
        </View>
      </ScrollView>

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

      <UploadingOverlay visible={loading} message="Posting your article..." />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
  multilineInput: {
    height: 150,
    textAlignVertical: 'top',
  },
});

export default PostArticle;
