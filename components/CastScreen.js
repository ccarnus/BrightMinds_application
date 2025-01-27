import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, sizes, spacing } from './theme';
import Carousel from './Cast/Carousel';
import ArticleCarousel from './Cast/ArticleCarousel';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from './APIConfig';

const { width, height } = Dimensions.get('window');

const CastScreen = () => {
  const navigation = useNavigation();
  const [suggestedCastData, setSuggestedCastData] = useState([]);
  const [trendingCastData, setTrendingCastData] = useState([]);
  const [articleData, setArticleData] = useState([]);
  const [watchedCastIds, setWatchedCastIds] = useState([]);
  const [watchedArticleIds, setWatchedArticleIds] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [allCasts, setAllCasts] = useState([]);

  const forYouIcon = require('../assets/Cast_screen_icons/foryou_icon.png');
  const trendingIcon = require('../assets/Cast_screen_icons/trending_icon.png');
  const articleIcon = require('../assets/Cast_screen_icons/article_icon.png');
  const serverError = require('../assets/Cast_screen_icons/server_error.png');

  useEffect(() => {
    const getUserData = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        const storedUserRole = await AsyncStorage.getItem('userRole');
        setUserId(storedUserId);
        setUserRole(storedUserRole);
      } catch (error) {
        console.error('Error fetching user data from storage:', error);
      }
    };
    getUserData();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchWatchedContent();
    }
  }, [userId]);

  useEffect(() => {
    if (watchedCastIds !== null && watchedArticleIds !== null) {
      fetchAllContent();
    }
  }, [watchedCastIds, watchedArticleIds]);

  const fetchWatchedContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`);
      console.log(`${API_BASE_URL}/user/${userId}`);
      const userData = await response.json();

      setWatchedCastIds(
        userData.evaluation_list
          ?.filter(item => item.type === 'cast' && item.watched)
          .map(item => item.contentid) || []
      );
      setWatchedArticleIds(
        userData.evaluation_list
          ?.filter(item => item.type === 'article' && item.watched)
          .map(item => item.contentid) || []
      );

      fetchAllContent();
    } catch (error) {
      console.error('Error fetching watched content:', error);
      setApiError(true);
    }
  };

  const fetchAllContent = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSuggestedCastData(),
        fetchTrendingCastData(),
        fetchArticleData(),
        fetchAllCastData(),
      ]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setApiError(true);
    }
  };

  const fetchSuggestedCastData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}/suggested/for/you`);
      const data = await response.json();

      if (Array.isArray(data)) {
        const formattedData = data.map(cast => ({
          id: cast._id,
          image: cast.castimageurl,
          title: cast.title,
          duration: cast.duration,
          watched: watchedCastIds.includes(cast._id),
        }));
        setSuggestedCastData(formattedData);
      } else {
        console.error('Unexpected data format for suggested casts:', data);
        setSuggestedCastData([]);
      }
    } catch (error) {
      console.error('Error fetching suggested casts:', error);
      setSuggestedCastData([]);
    }
  };

  const fetchTrendingCastData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cast/trending/right/now`);
      const data = await response.json();

      if (Array.isArray(data)) {
        const formattedData = data.map(cast => ({
          id: cast._id,
          image: cast.castimageurl,
          title: cast.title,
          duration: cast.duration,
          watched: watchedCastIds.includes(cast._id),
        }));
        setTrendingCastData(formattedData);
      } else {
        console.error('Unexpected data format for trending casts:', data);
        setTrendingCastData([]);
      }
    } catch (error) {
      console.error('Error fetching trending casts:', error);
      setTrendingCastData([]);
    }
  };

  const fetchAllCastData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/cast`);
      const data = await response.json();
      setAllCasts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchArticleData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/article`);
      const data = await response.json();

      if (Array.isArray(data)) {
        const formattedData = data.map(article => ({
          ...article,
          watched: watchedArticleIds.includes(article._id),
        }));
        setArticleData(formattedData);
      } else {
        console.error('Unexpected data format for articles:', data);
        setArticleData([]);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      setArticleData([]);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setApiError(false);
    fetchWatchedContent();
    fetchAllContent();
    setRefreshing(false);
  }, [userId]);

  if (apiError) {
    return (
      <View style={styles.errorContainer}>
        <Image source={serverError} style={styles.errorImage} />
        <Text style={styles.errorText}>Whoops!</Text>
        <Text style={styles.errorDetail}>Please try refreshing or come back later!</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            setApiError(false);
            setIsLoading(true);
            fetchWatchedContent();
            fetchAllContent();
          }}
        >
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    const filteredCasts = allCasts.filter((cast) =>
      cast.title.toLowerCase().includes(text.toLowerCase())
    );
    setSearchResults(filteredCasts);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchResultPress = (id) => {
    navigation.navigate('SearchResult', { selectedCastId: id });
    console.log(id)
  };

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

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Bar */}
        <View style={styles.searchContainerAndRandom}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="I want to learn about.."
              placeholderTextColor={colors.secondary}
              onChangeText={handleSearch}
              value={searchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={styles.randomButton} 
            onPress={() => navigation.navigate('DiscoverScreen')}
          >
            <Image source={require('../assets/Cast_screen_icons/random.png')} style={styles.randomButtonIcon} />
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 ? (
          <View style={styles.searchResultsContainer}>
            {searchResults.length > 0 ? (
            searchResults.map((cast) => (
              <TouchableOpacity key={cast._id} onPress={() => handleSearchResultPress(cast._id)}>
                <Text style={styles.searchResultItem}>{cast.title}</Text>
              </TouchableOpacity>
            ))
          ) : searchQuery.trim().length > 0 ? (
            <Text style={styles.noResultsText}>No results.</Text>
          ) : null}
          </View>
        ) : searchQuery.length > 0 ? (
          <Text style={styles.noResultsText}>No results found.</Text>
        ) : (
          <>
            {/* Suggested For You */}
            <View style={styles.sectionHeader}>
              <Image source={forYouIcon} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>For You</Text>
            </View>
            {suggestedCastData.length > 0 ? (
              <Carousel list={suggestedCastData} carouselType="suggested" />
            ) : (
              <Text style={styles.noDataText}>No suggestions available.</Text>
            )}

            {/* Trending Now */}
            <View style={styles.sectionHeader}>
              <Image source={trendingIcon} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            {trendingCastData.length > 0 ? (
              <Carousel list={trendingCastData} carouselType="trending" />
            ) : (
              <Text style={styles.noDataText}>No trending casts available.</Text>
            )}

            {/* Articles */}
            <View style={styles.sectionHeader}>
              <Image source={articleIcon} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Articles</Text>
            </View>
            {articleData.length > 0 ? (
              <ArticleCarousel list={articleData} />
            ) : (
              <Text style={styles.noDataText}>No articles available.</Text>
            )}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {(userRole === 'Professor' ||
        userRole === 'Researcher' ||
        userRole === 'PhD Student') && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('CastTypeChoice')}
        >
          <Image
            source={require('../assets/Cast_screen_icons/plus_icon.png')}
            style={styles.floatingButtonIcon}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    paddingHorizontal: spacing.m,
    height: 40,
    flexShrink: 1,
  },
  searchContainerAndRandom: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
  },
  clearButton: {
    marginLeft: spacing.s,
  },
  clearButtonText: {
    color: colors.secondary,
    fontSize: sizes.h3,
  },
  searchResultsContainer: {
    paddingHorizontal: spacing.m,
  },
  searchResultItem: {
    paddingVertical: spacing.m,
  },
  searchResultText: {
    color: colors.white,
    fontSize: sizes.h4,
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
  noResultsText: {
    textAlign: 'center',
    color: colors.secondary,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    marginTop: spacing.l,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.s,
    marginBottom: spacing.s,
    paddingHorizontal: spacing.m,
  },
  sectionIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.s,
    tintColor: colors.secondary,
  },
  sectionTitle: {
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'MontserratBold',
  },
  noDataText: {
    textAlign: 'center',
    color: colors.secondary,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    marginVertical: spacing.l,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 25,
    right: 15,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    backgroundColor: 'transparent',
  },
  floatingButtonIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    tintColor: colors.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorImage: {
    width: width*0.5,
    height: width*0.5,
    marginBottom: 20,
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
    marginTop: 10,
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: colors.secondary,
    padding: 10,
    borderRadius: sizes.radius,
  },
  refreshButtonText: {
    color: colors.primary,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  randomButton: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.m,
    marginRight: spacing.s,
  },
  randomButtonIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: colors.lightGreen,
  },
});

export default CastScreen;