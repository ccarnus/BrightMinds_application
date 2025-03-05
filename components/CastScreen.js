import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  Dimensions,
  Keyboard
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

  // Existing state variables…
  const [suggestedCastData, setSuggestedCastData] = useState([]);
  const [trendingCastData, setTrendingCastData] = useState([]);
  const [articleData, setArticleData] = useState([]);
  const [watchedCastIds, setWatchedCastIds] = useState([]);
  const [watchedArticleIds, setWatchedArticleIds] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [allCasts, setAllCasts] = useState([]);
  const [finishedVideos, setFinishedVideos] = useState([]);
  const [finishedArticles, setFinishedArticles] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Article');

  // New state to track if the search bar is active (pressed)
  const [isSearching, setIsSearching] = useState(false);
  // Ref for the pinned search bar
  const searchBarRef = useRef(null);

  // Icon definitions…
  const forYouIcon = require('../assets/Cast_screen_icons/foryou_icon.png');
  const trendingIcon = require('../assets/Cast_screen_icons/trending_icon.png');
  const articleIcon = require('../assets/Cast_screen_icons/article_icon.png');
  const serverError = require('../assets/Cast_screen_icons/server_error.png');

  // Helper to return an icon based on category.
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Article':
        return require('../assets/Cast_screen_icons/article_icon.png');
      case 'Topic':
        return require('../assets/Bottom_icons/lab.png');
      case 'Video':
        return require('../assets/Cast_screen_icons/cast_icon.png');
      default:
        return null;
    }
  };

  // Focus the search bar when isSearching becomes true.
  useEffect(() => {
    if (isSearching && searchBarRef.current) {
      searchBarRef.current.focus();
    }
  }, [isSearching]);

  // When the selected category changes, clear previous results and re-run the search if there’s a query.
  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults([]); // clear previous results
      handleSearch(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

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

  // Modified search handler with dedicated loader flag.
  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    if (selectedCategory === 'Video') {
      try {
        const response = await fetch('https://api.brightmindsresearch.com/cast/all/simplified');
        const data = await response.json();
        const results = data.filter(item =>
          item.title.toLowerCase().includes(text.toLowerCase())
        );
        setSearchResults(results);
      } catch (error) {
        console.error('Error fetching video data:', error);
      } finally {
        setSearchLoading(false);
      }
    } else if (selectedCategory === 'Topic') {
      try {
        const response = await fetch(`https://api.openalex.org/topics?search=${text}&select=id,display_name&per_page=50`);
        const data = await response.json();
        const results = data.results || [];
        setSearchResults(results);
      } catch (error) {
        console.error('Error fetching topic data:', error);
      } finally {
        setSearchLoading(false);
      }
    } else if (selectedCategory === 'Article') {
      let data = null;
      let retries = 0;
      const maxRetries = 10; // set a sensible upper limit to avoid an infinite loop
      while (retries < maxRetries) {
        try {
          const response = await fetch(
            `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(text)}&fields=paperId,title,abstract,url,publicationDate&sort=year&order=desc`
          );
          data = await response.json();
          // Check if the API returned a rate-limit error message.
          if (data.message && data.message.includes("Too Many Requests")) {
            console.warn("Rate limited. Retrying...");
            retries++;
            await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds before retrying
            continue;
          }
          // If we get here, we assume a valid JSON was returned.
          break;
        } catch (error) {
          console.error('Error fetching article data:', error);
          break;
        }
      }
      // Process the data once a valid response is received.
      const results = data && data.data ? data.data : [];
      setSearchResults(results);
      setSearchLoading(false);
    }    
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchResultPress = (id) => {
    if (selectedCategory === 'Article') {
      navigation.navigate('SearchArticleResults', { articleId: id });
    } else if (selectedCategory === 'Topic') {
      navigation.navigate('SearchTopicResult', { topicId: id });
    } else {
      navigation.navigate('VideoScreen', { selectedCastId: id });
    }
    console.log(id);
    setIsSearching(false);
    clearSearch();
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
      {isSearching ? (
        <View style={{ flex: 1 }}>
          <View style={styles.searchHeader}>
            <Searchbar
              ref={searchBarRef}
              placeholder="Type your search..."
              onChangeText={handleSearch}
              value={searchQuery}
              style={styles.searchBar}
              autoFocus
              onFocus={() => setIsSearching(true)}
            />
            <TouchableOpacity
              onPress={() => {
                setIsSearching(false);
                clearSearch();
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          {/* Category row under the search bar */}
          <View style={styles.categoryRowExpended}>
            {['Article', 'Topic', 'Video'].map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Image
                  source={getCategoryIcon(category)}
                  style={[
                    styles.categoryIcon,
                    selectedCategory === category && { tintColor: colors.primary }
                  ]}
                />
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
          <View style={styles.searchResultsWrapper}>
            {searchLoading ? (
              <View style={styles.searchLoaderContainer}>
                <LottieView
                  source={require('../assets/Loader/loader.json')}
                  autoPlay
                  loop
                  style={styles.searchLoader}
                />
              </View>
            ) : searchResults.length > 0 ? (
              <ScrollView>
                {searchResults.map((item) => {
                  const itemId = selectedCategory === 'Article'
                    ? item.paperId
                    : (item._id ? item._id : item.id);
                  return (
                    <TouchableOpacity
                      key={itemId}
                      onPress={() => handleSearchResultPress(itemId)}
                    >
                      <Text style={styles.searchResultItem}>
                        {selectedCategory === 'Topic' ? item.display_name : item.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : searchQuery.length > 0 ? (
              <Text style={styles.noResultsText}>No results found.</Text>
            ) : null}
          </View>
        </View>
      ) : (
        // Normal layout with search bar under "What do you want to learn about?"
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.searchSection}>
            <Text style={styles.titleText}>I want to learn about..</Text>
            <Searchbar
              placeholder="Type your search..."
              onChangeText={handleSearch}
              value={searchQuery}
              style={styles.searchBar}
              onFocus={() => setIsSearching(true)}
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
                  <Image
                    source={getCategoryIcon(category)}
                    style={[
                      styles.categoryIcon,
                      selectedCategory === category && { tintColor: colors.primary }
                    ]}
                  />
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
            </TouchableOpacity>
          </View>

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
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryBis },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    backgroundColor: colors.primaryBis,
  },
  searchBar: { flex: 1, backgroundColor: colors.primary },
  cancelText: {
    marginLeft: spacing.s,
    color: colors.secondary,
    fontSize: RFValue(sizes.h4),
    fontFamily: 'Montserrat',
  },
  searchResultsWrapper: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
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
  searchSection: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.l,
    backgroundColor: colors.primaryBis,
  },
  titleText: {
    fontSize: RFValue(sizes.title),
    fontFamily: 'Montserrat',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.m,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.l,
    marginTop: spacing.m,
  },
  categoryRowExpended: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: spacing.m,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: colors.primaryBis,
  },
  selectedCategoryButton: { backgroundColor: colors.darkTeal },
  categoryButtonText: {
    color: colors.secondary,
    fontFamily: 'Montserrat',
    fontSize: RFValue(sizes.h4),
  },
  selectedCategoryButtonText: { color: colors.primary },
  categoryIcon: {
    width: RFValue(20),
    height: RFValue(20),
    marginRight: spacing.s,
    tintColor: colors.secondary,
  },
  randomButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.m,
    backgroundColor: colors.darkGreen,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderRadius: 50,
  },
  randomButtonIcon: {
    width: RFValue(24),
    height: RFValue(24),
    resizeMode: 'contain',
    tintColor: colors.primaryBis,
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  lottie: { width: 200, height: 200 },
  searchLoaderContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.m },
  searchLoader: { width: 150, height: 150 }
});

export default CastScreen;
