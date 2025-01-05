import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Button, TextInput, Portal, Provider, Modal } from 'react-native-paper';
import { colors, sizes, spacing } from '../theme';
import departments from '../../lists/departments';
import categories from '../../lists/categories';
import visibilityCategories from '../../lists/visibilityCategories';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PostArticle = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState(1);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isDepartmentModalVisible, setDepartmentModalVisible] = useState(false);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [articleImageUrl, setArticleImageUrl] = useState('');
  const [userId, setUserId] = useState(null);
  const [university, setUniversity] = useState('Default');

  useEffect(() => {
    const fetchUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUniversity = await AsyncStorage.getItem('userUniversity');
      setUserId(storedUserId);
      if (storedUniversity) {
        setUniversity(storedUniversity);``
      }
    };
    fetchUserId();
  }, []);

  const calculateReadingTime = (text) => {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    const time = Math.ceil(words / wordsPerMinute);
    return time;
  };

  const handlePostArticle = async () => {
    setLoading(true);

    let missingFields = [];
    if (!title.trim()) missingFields.push("Title");
    if (!description.trim()) missingFields.push("Description");
    if (!category.trim()) missingFields.push("Category");
    if (!department.trim()) missingFields.push("Department");

    if (missingFields.length > 0) {
      Alert.alert('Missing Information', 'Please fill in all the required fields:\n\n ' + missingFields.join('\n\n '));
      setLoading(false);
      return;
    }

    const articleData = {
      title,
      articleDescription: description,
      department,
      university,
      category,
      brightmindid: userId,
      visibility,
      duration: calculateReadingTime(description),
    };

    try {
      const response = await fetch('http://3.17.219.54/article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      if (!response.ok) throw new Error('Failed to post article');

      Alert.alert('Success', 'Article posted successfully!');
      navigation.navigate('Cast');
    } catch (error) {
      Alert.alert('Error', error.message);
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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.MainTitle}>Post an Article</Text>
        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          mode="outlined"
          style={[styles.input, styles.multilineInput]}
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
        <TouchableOpacity style={styles.sendButton} onPress={handlePostArticle} disabled={loading}>
          <Text style={styles.sendButtonText}>POST</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
  },
  MainTitle: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.xl,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  input: {
    marginBottom: 15,
    backgroundColor: 'transparent',
  },
  multilineInput: {
    height: 150,
    textAlignVertical: 'top',
  },
  sendButton: {
    padding: 15,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    borderRadius: sizes.radius,
    width: "80%",
    marginLeft: "10%",
    marginTop: spacing.m,
  },
  sendButtonText: {
    fontSize: sizes.h2,
    color: colors.primaryBis,
    fontWeight: 'bold',
    fontFamily: 'MontserratBold',
  },
  articleImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginTop: spacing.m,
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
    zIndex: 1000, 
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  visibilityLabel: {
    fontSize: sizes.h3,
    textAlign: 'center',
    marginTop: spacing.l,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.primary,
    marginBottom: spacing.s,
    borderRadius: sizes.radius,
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
    color: colors.primary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
  },
  modalItem: {
    color: colors.secondary,
  },
  modalItemLabel: {
    color: colors.secondary,
  }
});

export default PostArticle;
