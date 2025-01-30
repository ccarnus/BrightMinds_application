import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, sizes, spacing } from './theme';
import { API_BASE_URL } from './APIConfig';

const LibraryScreen = () => {
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [castCount, setCastCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);

  const navigation = useNavigation();

  // Fetch user ID and role from AsyncStorage
  useEffect(() => {
    const getUserDataFromStorage = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUserRole = await AsyncStorage.getItem('userRole');
      setUserId(storedUserId);
      setUserRole(storedUserRole);
    };
    getUserDataFromStorage();
  }, []);

  // Fetch user data from server to get the publication counts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}`);
        const data = await response.json();
        // Update local state with the number of casts and articles
        setCastCount(data.castPublications?.length || 0);
        setArticleCount(data.articlePublications?.length || 0);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  // Navigate to the corresponding publications screen
  const handleNavigateToPublications = (type) => {
    if (type === 'cast') {
      navigation.navigate('CastPublicationsScreen');
    } else if (type === 'article') {
      navigation.navigate('ArticlePublicationsScreen');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Publications</Text>

      {/* Only show this section if the user’s role allows creating/viewing publications */}
      {(userRole === 'Professor' ||
        userRole === 'Researcher' ||
        userRole === 'PhD Student') && (
        <View style={styles.publicationsContainer}>
          {/* Articles */}
          <TouchableOpacity
            style={styles.publicationColumn}
            onPress={() => handleNavigateToPublications('article')}
          >
            <Image
              source={require('../assets/Cast_screen_icons/article_logo.png')}
              style={styles.publicationIcon}
            />
            <Text style={styles.publicationCount}>{articleCount}</Text>
            <Text style={styles.publicationLabel}>Articles</Text>
          </TouchableOpacity>

          {/* Casts */}
          <TouchableOpacity
            style={styles.publicationColumn}
            onPress={() => handleNavigateToPublications('cast')}
          >
            <Image
              source={require('../assets/Cast_screen_icons/cast_logo.png')}
              style={styles.publicationIcon}
            />
            <Text style={styles.publicationCount}>{castCount}</Text>
            <Text style={styles.publicationLabel}>Casts</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default LibraryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: sizes.title,
    color: colors.secondary,
    marginBottom: spacing.l,
    fontFamily: 'MontserratBold',
  },
  publicationsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: spacing.m,
  },
  publicationColumn: {
    alignItems: 'center',
  },
  publicationIcon: {
    width: 60,
    height: 60,
    marginBottom: spacing.xs,
    resizeMode: 'contain',
  },
  publicationCount: {
    fontSize: sizes.h2,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
  },
  publicationLabel: {
    fontSize: sizes.h4,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
});
