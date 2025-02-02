import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { colors, sizes, spacing } from './theme';
import { API_BASE_URL } from './APIConfig';

const { width } = Dimensions.get('window');

const LibraryScreen = () => {
  const [userRole, setUserRole] = useState('');
  const [userId, setUserId] = useState(null);
  const [castCount, setCastCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  // Reuse the server error image from CastScreen
  const serverError = require('../assets/Cast_screen_icons/server_error.png');

  // Pull user data from AsyncStorage & fetch publications
  const fetchUserData = async () => {
    try {
      setApiError(false);
      setIsLoading(true);

      const storedUserId = await AsyncStorage.getItem('userId');
      const storedUserRole = await AsyncStorage.getItem('userRole');
      setUserId(storedUserId);
      setUserRole(storedUserRole);

      if (storedUserId) {
        const response = await fetch(`${API_BASE_URL}/user/${storedUserId}`);
        const data = await response.json();
        // Update local state with the number of casts and articles
        setCastCount(data.castPublications?.length || 0);
        setArticleCount(data.articlePublications?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh/pull to refresh callback
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData().then(() => setRefreshing(false));
  }, []);

  // Re-fetch user data every time this screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  // Initial load
  useEffect(() => {
    fetchUserData();
  }, []);

  // Navigate to the corresponding publications screen
  const handleNavigateToPublications = (type) => {
    if (type === 'cast') {
      navigation.navigate('CastPublicationsScreen');
    } else if (type === 'article') {
      navigation.navigate('ArticlePublicationsScreen');
    }
  };

  // If there's an API error, show error layout
  if (apiError) {
    return (
      <View style={styles.errorContainer}>
        <Image source={serverError} style={styles.errorImage} />
        <Text style={styles.errorText}>Whoops!</Text>
        <Text style={styles.errorDetail}>
          Please try refreshing or come back later!
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            setApiError(false);
            setIsLoading(true);
            fetchUserData();
          }}
        >
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // If loading, show the same lottie loader as in CastScreen
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/Loader/loader.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }

  // Otherwise, render main content
  return (
    <View style={styles.container}>
      {/* ScrollView with pull-to-refresh */}
      <ScrollView
        contentContainerStyle={{ paddingVertical: spacing.l }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.title}>Your Publications</Text>

        {/* Only show publications if the user’s role is Professor/Researcher/PhD */}
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
      </ScrollView>
    </View>
  );
};

export default LibraryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  title: {
    fontSize: sizes.title,
    color: colors.secondary,
    marginBottom: spacing.l,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  publicationsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: spacing.m,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryBis,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  // Error screen
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.primaryBis,
  },
  errorImage: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: spacing.m,
    resizeMode: 'contain',
  },
  errorText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    textAlign: 'center',
    fontFamily: 'MontserratBold',
  },
  errorDetail: {
    fontSize: sizes.h4,
    color: colors.secondary,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    marginTop: spacing.s,
    marginBottom: spacing.m,
  },
  refreshButton: {
    backgroundColor: colors.secondary,
    padding: spacing.m,
    borderRadius: sizes.radius,
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
});
