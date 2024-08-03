import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { colors, sizes, spacing } from '../theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import departments from '../../lists/departments'; // Import the departments list

const ArticleDetailsScreen = ({ route }) => {
  const { selectedArticleId } = route.params;
  const [article, setArticle] = useState(null);
  const [universityLogo, setUniversityLogo] = useState(null);
  const [universityName, setUniversityName] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchArticle();
    }
  }, [userId, selectedArticleId]);

  const fetchArticle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://3.17.219.54/article/${selectedArticleId}`);
      const data = await response.json();
      setArticle(data);
      await fetchUniversityLogo(data.university);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUniversityLogo = async (universityName) => {
    try {
      const response = await fetch(`http://3.17.219.54/university/by/name/${universityName}`);
      const data = await response.json();
      setUniversityLogo(data.iconurl);
      setUniversityName(data.displayedName);
    } catch (error) {
      console.error('Error fetching university logo:', error);
    }
  };

  const handleAddToCastList = async () => {
    const contentId = selectedArticleId;
    const url = `http://3.17.219.54/user/add/content/${userId}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contentId: contentId, type: "article" }),
      });

      const result = await response.json();
      if (response.ok) {
        navigation.goBack();
      } else {
        console.error('Failed to add cast to list:', result);
        alert('Failed to add cast to your list.');
      }
    } catch (error) {
      console.error('Error adding cast to list:', error);
      alert('Error adding cast to your list.');
    }
  };

  const handleAccessFullResearch = () => {
    if (article && article.link) {
      Linking.openURL(article.link).catch((err) =>
        console.error('Failed to open URL:', err)
      );
    } else {
      alert('No link available for this article.');
    }
  };

  const getDaysSincePosted = (dateString) => {
    const datePosted = new Date(dateString);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    datePosted.setHours(0, 0, 0, 0);

    const differenceInTime = currentDate.getTime() - datePosted.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

    if (differenceInDays === 0) {
      return "today";
    } else {
      return `${differenceInDays} days ago`;
    }
  };

  const getDepartmentDisplayName = (departmentName) => {
    const department = departments.find((dept) => dept.name === departmentName);
    return department ? department.display : departmentName;
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.centered}>
        <Text>Article not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: article.articleimageurl }} style={styles.image} />
      {universityLogo && (
        <View style={styles.iconContainer}>
          <Image source={{ uri: universityLogo }} style={styles.icon} />
          <Text style={styles.iconText}>{universityName}</Text>
        </View>
      )}
      
      <View style={styles.infoDisplay}>
        <Text style={styles.infoText}>{getDaysSincePosted(article.dateAdded)}</Text>
        <Text style={styles.separator}> · </Text>
        <Text style={styles.infoText}>{getDepartmentDisplayName(article.department)}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.description}>{article.articleDescription}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleAddToCastList}>
          <Text style={styles.buttonAddText}>Got it!</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.accessButton]} onPress={handleAccessFullResearch}>
          <Text style={styles.buttonAccessText}>Access Full Research</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
    marginBottom: spacing.s,
  },
  content: {
    padding: spacing.m,
  },
  title: {
    fontSize: sizes.h1,
    marginBottom: spacing.m,
    fontFamily: "MontserratBold",
    textAlign: "center",
  },
  description: {
    fontSize: sizes.h3,
    color: colors.text,
    textAlign: "justify",
    fontFamily: "Montserrat",
  },
  detail: {
    fontSize: sizes.h1,
    color: colors.gray,
    marginBottom: spacing.xs,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginLeft: spacing.l,
    marginRight: spacing.l,
    marginVertical: spacing.s,
  },
  icon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: spacing.s,
  },
  iconText: {
    fontSize: sizes.h3,
    color: colors.black,
    fontFamily: 'Montserrat',
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: spacing.l * 2,
  },
  button: {
    backgroundColor: colors.darkblue,
    borderRadius: sizes.radius,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    width: '80%',
    marginVertical: spacing.s,
    borderWidth: 1,
    backgroundColor: colors.primary,
    borderColor: colors.secondary,
    elevation: 5,
  },
  buttonAddText: {
    color: colors.secondary,
    fontSize: sizes.title,
    textAlign: 'center',
    fontFamily: "MontserratBold",
  },
  buttonAccessText: {
    color: colors.secondary,
    fontSize: sizes.h3,
    textAlign: 'center',
    fontFamily: "Montserrat",
  },
  infoDisplay: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
    borderRadius: sizes.radius,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginHorizontal: spacing.s,
    marginBottom: spacing.m,
    borderWidth: 1,
    elevation: 5,
  },
  infoText: {
    fontSize: sizes.h4,
    color: colors.secondary,
    fontFamily: "MontserratBold",
  },
  separator: {
    fontSize: sizes.title,
    color: colors.secondary,
    paddingHorizontal: spacing.xs,
    fontFamily: "MontserratBold",
  },
});

export default ArticleDetailsScreen;
