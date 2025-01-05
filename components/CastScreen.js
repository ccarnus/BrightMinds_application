import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, sizes, spacing } from './theme';
import Carousel from './Cast/Carousel';
import ArticleCarousel from './Cast/ArticleCarousel';
import LottieView from 'lottie-react-native';

const CastScreen = () => {
  const navigation = useNavigation();
  const [suggestedCastData, setSuggestedCastData] = useState([]);
  const [trendingCastData, setTrendingCastData] = useState([]);
  const [articleData, setArticleData] = useState([]);
  const [watchedCastIds, setWatchedCastIds] = useState(null);
  const [watchedArticleIds, setWatchedArticleIds] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [allCasts, setAllCasts] = useState([]);

  const forYouIcon = require('../assets/Cast_screen_icons/foryou_icon.png');
  const trendingIcon = require('../assets/Cast_screen_icons/trending_icon.png');
  const articleIcon = require('../assets/Cast_screen_icons/article_icon.png');

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

  // Fetch watched IDs when userId is available
  useEffect(() => {
    if (userId) {
      fetchWatchedContent();
    }
  }, [userId]);

  // Fetch casts and articles when watched IDs are available
  useEffect(() => {
    if (watchedCastIds !== null && watchedArticleIds !== null) {
      fetchAllContent();
    }
  }, [watchedCastIds, watchedArticleIds]);

  // Fetch watched casts and articles
  const fetchWatchedContent = async () => {
    try {
      const response = await fetch(`http://3.17.219.54/user/${userId}`);
      const userData = await response.json();

      const watchedCasts = userData.evaluation_list
        .filter(item => item.type === 'cast' && item.watched)
        .map(item => item.contentid);

      const watchedArticles = userData.evaluation_list
        .filter(item => item.type === 'article' && item.watched)
        .map(item => item.contentid);

      setWatchedCastIds(watchedCasts);
      setWatchedArticleIds(watchedArticles);
    } catch (error) {
      console.error('Error fetching watched content:', error);
    }
  };

  // Fetch all content and prefetch images
  const fetchAllContent = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchSuggestedCastData(),
        fetchTrendingCastData(),
        fetchAllCastData(),
        fetchArticleData(),
      ]);
      prefetchImages();
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  // Prefetch all images for suggested, trending, and articles
  const prefetchImages = async () => {
    const allImageUrls = [
      ...suggestedCastData.map(item => item.image),
      ...trendingCastData.map(item => item.image),
      ...articleData.map(item => item.image)
    ];

    const imagePrefetchPromises = allImageUrls.map(url => Image.prefetch(url));

    try {
      await Promise.all(imagePrefetchPromises);
      setImagesLoaded(true);
    } catch (error) {
      console.error('Error prefetching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSuggestedCastData = async () => {
    try {
      const response = await fetch(`http://3.17.219.54/user/${userId}/suggested/for/you`);
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
      const response = await fetch(`http://3.17.219.54/cast/trending/right/now`);
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
      const response = await fetch('http://3.17.219.54/cast');
      const data = await response.json();
      setAllCasts(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchArticleData = async () => {
    try {
      const response = await fetch('http://3.17.219.54/article');
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

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWatchedContent();
    fetchAllContent();
    setRefreshing(false);
  }, [userId]);

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
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search casts..."
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    margin: spacing.m,
    paddingHorizontal: spacing.m,
    height: 40,
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
});

export default CastScreen;