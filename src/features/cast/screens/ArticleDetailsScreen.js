import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Linking, 
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { colors, sizes, spacing } from '@shared/config/theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import departments from '@shared/data/departments';
import { Button } from 'react-native-paper';
import { API_BASE_URL } from '@shared/config/APIConfig';

const { width, height } = Dimensions.get('window');

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
      const response = await fetch(`${API_BASE_URL}/article/${selectedArticleId}`);
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
      const response = await fetch(`${API_BASE_URL}/university/by/name/${universityName}`);
      const data = await response.json();
      setUniversityLogo(data.iconurl);
      setUniversityName(data.displayedName);
    } catch (error) {
      console.error('Error fetching university logo:', error);
    }
  };

  const handleAddToCastList = async () => {
    const contentId = selectedArticleId;
    const url = `${API_BASE_URL}/user/add/content/${userId}`;

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
        // Instead of simply going back, pass finishedArticleId as parameter.
        console.log('Article marked as watched');
        navigation.navigate('BottomNav', {  // Adjust as needed for your navigation structure
          screen: 'Cast',
          params: { finishedArticleId: selectedArticleId }
        });
      } else {
        console.error('Failed to add article to list:', result);
        alert('Failed to add article to your list.');
      }
    } catch (error) {
      console.error('Error adding article to list:', error);
      alert('Error adding article to your list.');
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

  const getDepartmentDetails = (departmentName) => {
    return departments.find((dept) => dept.name === departmentName);
  };

  const getTimeSincePosted = (dateString) => {
    const datePosted = new Date(dateString);
    const currentDate = new Date();
    const diffInMs = currentDate.getTime() - datePosted.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 3600 * 24));

    if (diffInDays < 365) {
      return diffInDays === 0 ? "today" : `${diffInDays} days ago`;
    } else {
      const years = Math.floor(diffInDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
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

  const departmentDetails = getDepartmentDetails(article.department);
  const departmentDisplayName = departmentDetails ? departmentDetails.display : article.department;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.containerScroll}>
        <Image source={{ uri: article.articleimageurl }} style={styles.image} />

        {universityLogo && (
          <View style={styles.topIconContainer}>
            <Image source={{ uri: universityLogo }} style={styles.icon} />
            <Text style={styles.iconText}>{universityName}</Text>
          </View>
        )}

        {departmentDetails && (
          <TouchableOpacity
            style={styles.topIconContainer}
            onPress={() =>
              navigation.navigate('VirtualLab', {
                labId: departmentDetails.name,
                labDisplayName: departmentDetails.display,
              })
            }
          >
            <Image source={departmentDetails.image} style={styles.icon} />
            <Text style={styles.iconTextDepartment}>{departmentDisplayName}</Text>
          </TouchableOpacity>
        )}


        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{getTimeSincePosted(article.dateadded)}</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.description}>{article.description}</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleAddToCastList}
            buttonColor={colors.darkGreen}
            icon={require('@assets/Cast_screen_icons/like.png')}
            labelStyle={{
              fontSize: sizes.h3,
              fontFamily: 'Montserrat',
              textAlign: 'center',
              paddingTop: spacing.s,
            }}
            style={{ 
              marginLeft: spacing.m,
              marginRight: spacing.m,
              marginBottom: height * 0.08,
              marginTop: spacing.l,
              paddingHorizontal: spacing.m,
              borderRadius: sizes.buttonRadius,
            }}
          >
            Got it!
          </Button>
        </View>
      </ScrollView>
      <View style={styles.fixedButtonContainer}>
        <Button
          mode="contained"
          onPress={handleAccessFullResearch}
          buttonColor={colors.darkblue}
          icon={require('@assets/Cast_screen_icons/link.png')}
          labelStyle={{ fontSize: sizes.h3, fontFamily: 'Montserrat' }}
          style={{ 
            marginLeft: spacing.m,
            marginRight: spacing.m,
            marginBottom: spacing.s,
            marginTop: spacing.l,
            paddingHorizontal: spacing.s
          }}
        >
          Access Full Research
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  containerScroll: {
    backgroundColor: colors.primaryBis,
  },
  image: {
    width: '100%',
    height: height * 0.3,
    resizeMode: 'cover',
    marginBottom: spacing.s,
  },
  content: {
    padding: spacing.m,
  },
  title: {
    fontSize: sizes.h1,
    marginBottom: spacing.l,
    fontFamily: "MontserratBold",
    textAlign: "center",
  },
  description: {
    fontSize: sizes.h3,
    color: colors.text,
    textAlign: "left",
    fontFamily: "Montserrat",
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topIconContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
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
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'center',
    width: '70%',
  },
  iconTextDepartment: {
    fontSize: sizes.h3,
    color: colors.black,
    fontFamily: 'Montserrat',
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: spacing.s,
    marginTop: spacing.s,
  },
  dateText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: "MontserratBold",
  },
  buttonContainer: {
    alignItems: 'center',
    marginBottom: spacing.l * 2,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    padding: spacing.m,
  },
});

export default ArticleDetailsScreen;
