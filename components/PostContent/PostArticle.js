import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal as ModalReact,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Button, TextInput, Portal, Modal } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slider } from '@miblanchard/react-native-slider';

import { colors, sizes, spacing } from '../theme';
import departments from '../../lists/departments';
import categories from '../../lists/categories';
import visibilityCategories from '../../lists/visibilityCategories';

// Function to calculate reading time based on word count
const calculateReadingTime = (text) => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const time = Math.ceil(words / wordsPerMinute);
  return time;
};

const PostArticle = ({ navigation }) => {
  // Basic fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [topic, setTopic] = useState('');
  const [visibility, setVisibility] = useState(1);

  // For topics in the selected department
  const [topicOptions, setTopicOptions] = useState([]);
  const [topicLoading, setTopicLoading] = useState(false);
  const [isTopicModalVisible, setTopicModalVisible] = useState(false);

  // Optionally enter a custom topic
  const [isManualTopicEntry, setManualTopicEntry] = useState(false);
  const [manualTopicText, setManualTopicText] = useState('');

  // Modals for category & department
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDepartmentModalVisible, setDepartmentModalVisible] = useState(false);

  // Loading overlay for POST
  const [loading, setLoading] = useState(false);

  // Basic user info
  const [userId, setUserId] = useState(null);
  const [university, setUniversity] = useState('Default');

  // Custom Alert
  const [customAlertMessage, setCustomAlertMessage] = useState('');
  const [customAlertVisible, setCustomAlertVisible] = useState(false);

  // Fetch userId, university from AsyncStorage on mount
  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUniversity = await AsyncStorage.getItem('userUniversity');
      setUserId(storedUserId);
      if (storedUniversity) {
        setUniversity(storedUniversity);
      }
    };
    fetchUserId();
  }, []);

  // Whenever department changes, fetch topics from the server
  useEffect(() => {
    if (department) {
      fetchTopicsForDepartment(department);
    }
  }, [department]);

  // Helper: is string non-empty
  const isNonEmpty = (val) => val && val.trim().length > 0;

  // Custom alert toggler
  const showCustomAlert = (message) => {
    setCustomAlertMessage(message);
    setCustomAlertVisible(true);
  };

  // Fetch topics for a given department
  const fetchTopicsForDepartment = async (deptName) => {
    try {
      setTopicLoading(true);
      setTopicOptions([]);
      setTopic('');
      const response = await fetch(`http://3.17.219.54/topic/department/${deptName}`);
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

  // Category, Department, Topic item renderers
  const renderCategoryItem = (item, index) => (
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
  );

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

  // Slider for visibility
  const handleVisibilityChange = (val) => {
    if (Array.isArray(val)) {
      setVisibility(parseInt(val[0], 10));
    } else {
      setVisibility(parseInt(val, 10));
    }
  };

  // POST the article
  const handlePostArticle = async () => {
    // Check for missing fields
    const missingFields = [];
    if (!isNonEmpty(title)) missingFields.push('Title');
    if (!isNonEmpty(description)) missingFields.push('Description');
    if (!isNonEmpty(category)) missingFields.push('Category');
    if (!isNonEmpty(department)) missingFields.push('Department');
    if (!isNonEmpty(topic)) missingFields.push('Topic');

    if (missingFields.length > 0) {
      const errorMessage =
        'Please fill in all required fields:\n\n' + missingFields.join('\n');
      showCustomAlert(errorMessage);
      return;
    }

    setLoading(true);

    const articleData = {
      title,
      articleDescription: description,
      department,
      university,
      category,
      topic,
      brightmindid: userId,
      visibility,
      duration: calculateReadingTime(description),
    };

    try {
      const response = await fetch('http://3.17.219.54/article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) {
        throw new Error('Failed to post article');
      }
      Alert.alert('Success', 'Article posted successfully!');
      navigation.navigate('Cast');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Loading overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </View>
        )}

        <View style={styles.content}>
          <Text style={styles.mainTitle}>Post an Article</Text>

          {/* Title */}
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />

          {/* Description (only if Title is non-empty) */}
          {isNonEmpty(title) && (
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              mode="outlined"
              style={[styles.input, styles.multilineInput]}
            />
          )}

          {/* Category (only if Description is non-empty) */}
          {isNonEmpty(description) && (
            <>
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
                  {categories.map((item, index) => renderCategoryItem(item, index))}
                </Modal>
              </Portal>
            </>
          )}

          {/* Department (only if Category is chosen) */}
          {isNonEmpty(category) && (
            <>
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
            </>
          )}

          {/* Topic (only if Department is chosen) */}
          {isNonEmpty(department) && (
            <>
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
                    <ActivityIndicator size="large" color={colors.secondary} />
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
                            onChangeText={setManualTopicText}
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
            </>
          )}

          {/* Visibility Slider (only if Topic is chosen) */}
          {isNonEmpty(topic) && (
            <>
              <Text style={styles.visibilityLabel}>
                {visibilityCategories[visibility - 1].label}
              </Text>
              <Slider
                value={visibility}
                onValueChange={handleVisibilityChange}
                minimumValue={1}
                maximumValue={5}
                step={1}
                containerStyle={{ width: '100%', marginTop: 8 }}
                trackStyle={{ height: 4, backgroundColor: colors.lightGray }}
                thumbStyle={{
                  height: 20,
                  width: 20,
                  backgroundColor: colors.darkblue,
                  borderRadius: 10,
                }}
              />
            </>
          )}

          {/* Post Button (only if all fields have values) */}
          {isNonEmpty(topic) && (
            <TouchableOpacity
              style={styles.postButton}
              onPress={handlePostArticle}
              disabled={loading}
            >
              <Text style={styles.postButtonText}>POST</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Alert Modal */}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  /* Container & Scroll */
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  scrollContent: {
    paddingBottom: 50,
  },

  /* Main content */
  content: {
    padding: 20,
  },

  /* Title */
  mainTitle: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.xl,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },

  /* Inputs */
  input: {
    marginBottom: spacing.m,
    backgroundColor: 'transparent',
    fontFamily: 'Montserrat',
  },
  multilineInput: {
    height: 150,
    textAlignVertical: 'top',
  },

  /* Selector (Category/Department/Topic) */
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

  /* Modal Container */
  modalContainer: {
    backgroundColor: 'white',
    padding: spacing.m,
    margin: spacing.m,
    borderRadius: sizes.radius,
  },
  modalItem: {
    color: colors.secondary,
  },
  modalItemLabel: {
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },

  /* Visibility */
  visibilityLabel: {
    fontSize: sizes.h3,
    textAlign: 'center',
    marginTop: spacing.l,
    color: colors.darkblue,
    fontFamily: 'Montserrat',
  },

  /* Post Button */
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

  /* Loading Overlay */
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
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },

  /* Custom Alert Modal */
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.s,
  },
  customAlertModalView: {
    margin: spacing.m,
    backgroundColor: 'white',
    borderRadius: sizes.radius,
    padding: spacing.l,
    alignItems: 'center',
    elevation: 5,
    width: '80%',
  },
  customAlertText: {
    marginBottom: spacing.m,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    fontSize: sizes.h3,
  },
});

export default PostArticle;
