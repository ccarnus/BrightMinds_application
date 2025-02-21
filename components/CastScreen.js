import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, sizes, spacing } from './theme';
import Carousel from './Cast/Carousel';
import ArticleCarousel from './Cast/ArticleCarousel';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from './APIConfig';
import { Searchbar } from 'react-native-paper';
import { RFValue } from "react-native-responsive-fontsize";

const { width, height } = Dimensions.get('window');

const CastScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

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
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [allCasts, setAllCasts] = useState([]);
  const [finishedVideos, setFinishedVideos] = useState([]);
  const [finishedArticles, setFinishedArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Article');
  const forYouIcon = require('../assets/Cast_screen_icons/foryou_icon.png');
  const trendingIcon = require('../assets/Cast_screen_icons/trending_icon.png');
  const articleIcon = require('../assets/Cast_screen_icons/article_icon.png');
  const serverError = require('../assets/Cast_screen_icons/server_error.png');

  // Helper function to return an icon based on the selected category.
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Article':
        return require('../assets/Cast_screen_icons/article_icon.png');
      case 'Topic':
        // Replace with your topic icon asset
        return require('../assets/Cast_screen_icons/article_icon.png');
      case 'Video':
        // Replace with your video icon asset
        return require('../assets/Cast_screen_icons/article_icon.png');
      default:
        return null;
    }
  };

  // Listen for finished IDs from route params.
  useEffect(() => {
    if (route.params?.finishedVideoId) {
      console.log('Received finishedVideoId:', route.params.finishedVideoId);
      const finishedId = route.params.finishedVideoId;
      setFinishedVideos((prev) =>
        prev.includes(finishedId) ? prev : [...prev, finishedId]
      );
    }
    if (route.params?.finishedArticleId) {
      console.log('Received finishedArticleId:', route.params.finishedArticleId);
      const finishedArticleId = route.params.finishedArticleId;
      setFinishedArticles((prev) =>
        prev.includes(finishedArticleId) ? prev : [...prev, finishedArticleId]
      );
    }
  }, [route.params?.finishedVideoId, route.params?.finishedArticleId]);

  // Retrieve user data from AsyncStorage.
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

  // Fetch watched content when userId is available.
  useEffect(() => {
    if (userId) {
      awaitFetchWatchedContent();
    }
  }, [userId]);

  // Combined function to fetch watched content then all casts/articles.
  const awaitFetchWatchedContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`);
      console.log(`${API_BASE_URL}/user/${userId}`);
      const userData = await response.json();

      const fetchedWatchedCastIds =
        userData.evaluation_list
          ?.filter(item => item.type === 'cast' && item.watched)
          .map(item => item.contentid) || [];
      const fetchedWatchedArticleIds =
        userData.evaluation_list
          ?.filter(item => item.type === 'article' && item.watched)
          .map(item => item.contentid) || [];

      setWatchedCastIds(fetchedWatchedCastIds);
      setWatchedArticleIds(fetchedWatchedArticleIds);

      // Now fetch all content.
      await fetchAllContent(fetchedWatchedCastIds, fetchedWatchedArticleIds);
    } catch (error) {
      console.error('Error fetching watched content:', error);
      setApiError(true);
    }
  };

  const fetchAllContent = async (watchedCasts, watchedArticles) => {
    setIsLoading(true);
    try {
      const [
        suggestedResponse,
        trendingResponse,
        articleResponse,
        allCastsResponse
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/user/${userId}/suggested/for/you`),
        fetch(`${API_BASE_URL}/cast/trending/right/now`),
        fetch(`${API_BASE_URL}/article`),
        fetch(`${API_BASE_URL}/cast`)
      ]);

      const suggestedData = await suggestedResponse.json();
      const trendingData = await trendingResponse.json();
      const articlesData = await articleResponse.json();
      const allCastsData = await allCastsResponse.json();

      // Filter the fetched data by removing items in watched AND finished arrays.
      const filteredSuggested = Array.isArray(suggestedData)
        ? suggestedData
            .filter(
              (cast) =>
                !watchedCasts.includes(cast._id) &&
                !finishedVideos.includes(cast._id)
            )
            .map((cast) => ({
              id: cast._id,
              image: cast.castimageurl,
              title: cast.title,
              duration: cast.duration,
            }))
        : [];

      const filteredTrending = Array.isArray(trendingData)
        ? trendingData
            .filter(
              (cast) =>
                !watchedCasts.includes(cast._id) &&
                !finishedVideos.includes(cast._id)
            )
            .map((cast) => ({
              id: cast._id,
              image: cast.castimageurl,
              title: cast.title,
              duration: cast.duration,
            }))
        : [];

      const filteredArticles = Array.isArray(articlesData)
        ? articlesData.filter(
            (article) =>
              !watchedArticles.includes(article._id) &&
              !finishedArticles.includes(article._id)
          )
        : [];

      setSuggestedCastData(filteredSuggested);
      setTrendingCastData(filteredTrending);
      setArticleData(filteredArticles);
      setAllCasts(allCastsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching content:', error);
      setApiError(true);
    }
  };

  // Configurable search function – different APIs can be used based on selectedCategory.
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    // Replace the below local filtering with API calls as needed.
    let results = [];
    switch (selectedCategory) {
      case 'Article':
        // Call Article search API here.
        results = allCasts.filter((cast) =>
          cast.title.toLowerCase().includes(text.toLowerCase())
        );
        break;
      case 'Topic':
        // Call Topic search API here.
        results = allCasts.filter((cast) =>
          cast.title.toLowerCase().includes(text.toLowerCase())
        );
        break;
      case 'Video':
        // Call Video search API here.
        results = allCasts.filter((cast) =>
          cast.title.toLowerCase().includes(text.toLowerCase())
        );
        break;
      default:
        results = allCasts.filter((cast) =>
          cast.title.toLowerCase().includes(text.toLowerCase())
        );
    }
    setSearchResults(results);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchResultPress = (id) => {
    navigation.navigate('VideoScreen', { selectedCastId: id });
    console.log(id);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setApiError(false);
    await awaitFetchWatchedContent();
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
          onPress={async () => {
            setApiError(false);
            setIsLoading(true);
            await awaitFetchWatchedContent();
          }}
        >
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={serverError}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Search Section */}
        <View style={styles.searchSection}>
          <Text style={styles.titleText}>What do you want to learn about?</Text>
          <Searchbar
            placeholder="Type your search..."
            onChangeText={handleSearch}
            value={searchQuery}
            style={styles.searchBar}
          />
          <View style={styles.categoryRow}>
            {['Article', 'Topic', 'Video'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Image source={getCategoryIcon(category)} style={styles.categoryIcon} />
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.selectedCategoryButtonText
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.randomButton} onPress={() => navigation.navigate('DiscoverScreen')}>
            <Image source={require('../assets/Cast_screen_icons/random.png')} style={styles.randomButtonIcon} />
            <Text style={styles.randomButtonText}>Random</Text>
          </TouchableOpacity>
        </View>

        {/* Search Results */}
        {searchResults.length > 0 ? (
          <View style={styles.searchResultsContainer}>
            {searchResults.map((cast) => (
              <TouchableOpacity key={cast._id} onPress={() => handleSearchResultPress(cast._id)}>
                <Text style={styles.searchResultItem}>{cast.title}</Text>
              </TouchableOpacity>
            ))}
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
              <Carousel
                list={suggestedCastData}
                carouselType="suggested"
                finishedVideos={finishedVideos}
                onAnimationFinish={(id) => {
                  setSuggestedCastData((prev) => prev.filter((item) => item.id !== id));
                  setFinishedVideos((prev) => prev.filter((itemId) => itemId !== id));
                }}
              />
            ) : (
              <Text style={styles.noDataText}>No suggestions available.</Text>
            )}

            {/* Trending Now */}
            <View style={styles.sectionHeader}>
              <Image source={trendingIcon} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            {trendingCastData.length > 0 ? (
              <Carousel
                list={trendingCastData}
                carouselType="trending"
                finishedVideos={finishedVideos}
                onAnimationFinish={(id) => {
                  setTrendingCastData((prev) => prev.filter((item) => item.id !== id));
                  setFinishedVideos((prev) => prev.filter((itemId) => itemId !== id));
                }}
              />
            ) : (
              <Text style={styles.noDataText}>No trending casts available.</Text>
            )}

            {/* Articles */}
            <View style={styles.sectionHeader}>
              <Image source={articleIcon} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>Articles</Text>
            </View>
            {articleData.length > 0 ? (
              <ArticleCarousel
                list={articleData}
                finishedArticles={finishedArticles}
                onAnimationFinish={(id) => {
                  setArticleData((prev) => prev.filter((item) => item._id !== id));
                  setFinishedArticles((prev) => prev.filter((itemId) => itemId !== id));
                }}
              />
            ) : (
              <Text style={styles.noDataText}>No articles available.</Text>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBis },
  searchSection: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.l,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: sizes.radius,
    borderBottomRightRadius: sizes.radius,
  },
  titleText: {
    fontSize: RFValue(sizes.h3),
    fontFamily: 'MontserratBold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  searchBar: {
    backgroundColor: colors.primaryBis,
    borderRadius: sizes.radius,
    marginBottom: spacing.m,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.m,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: colors.primaryBis,
  },
  selectedCategoryButton: {
    backgroundColor: colors.secondary,
  },
  categoryButtonText: {
    color: colors.white,
    fontFamily: 'Montserrat',
    fontSize: RFValue(sizes.h4),
  },
  selectedCategoryButtonText: {
    color: colors.primary,
  },
  categoryIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.s,
    tintColor: colors.white,
  },
  randomButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.m,
    backgroundColor: colors.secondary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: sizes.radius,
  },
  randomButtonIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: colors.primary,
    marginRight: spacing.s,
  },
  randomButtonText: {
    color: colors.primary,
    fontSize: RFValue(sizes.h4),
    fontFamily: 'Montserrat',
  },
  searchResultsContainer: {
    paddingHorizontal: spacing.m,
  },
  searchResultItem: {
    paddingVertical: spacing.m,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.white,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorImage: {
    width: width * 0.5,
    height: width * 0.5,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 200,
    height: 200,
  },
});

export default CastScreen;
