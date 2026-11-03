import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  RefreshControl,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Searchbar } from 'react-native-paper';
import { RFValue } from 'react-native-responsive-fontsize';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, openAlex, getErrorMessage } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import Loader from '@shared/components/Loader';
import Carousel from '@features/cast/components/Carousel';

const { width } = Dimensions.get('window');

const SEARCH_DEBOUNCE_MS = 400;
const SEARCH_CATEGORIES = ['Article', 'Topic', 'Video'];
const CATEGORY_ICONS = {
  Article: require('@assets/Cast_screen_icons/article_icon.png'),
  Topic: require('@assets/Bottom_icons/lab.png'),
  Video: require('@assets/Cast_screen_icons/cast_icon.png'),
};
const forYouIcon = require('@assets/Cast_screen_icons/foryou_icon.png');
const trendingIcon = require('@assets/Cast_screen_icons/trending_icon.png');
const articleIcon = require('@assets/Cast_screen_icons/article_icon.png');
const serverErrorImage = require('@assets/Cast_screen_icons/server_error.png');
const randomIcon = require('@assets/Cast_screen_icons/random.png');

const toCastCard = (cast) => ({
  id: cast._id,
  image: cast.castimageurl,
  title: cast.title,
  duration: cast.duration,
});

const toArticleCard = (article) => ({
  id: article._id,
  image: article.articleimageurl,
  title: article.title,
  duration: article.duration,
});

const getWatchedIds = (evaluationList, type) =>
  new Set(
    (Array.isArray(evaluationList) ? evaluationList : [])
      .filter((item) => item.type === type && item.watched)
      .map((item) => item.contentid)
  );

const lastPathSegment = (id = '') => id.split('/').pop();

const searchContent = async (category, query, castCacheRef) => {
  if (category === 'Video') {
    if (!castCacheRef.current) {
      const { data } = await api.get('/cast/all/simplified');
      castCacheRef.current = Array.isArray(data) ? data : [];
    }
    const needle = query.toLowerCase();
    return castCacheRef.current
      .filter((item) => (item.title || '').toLowerCase().includes(needle))
      .map((item) => ({ category, id: item._id, label: item.title }));
  }

  if (category === 'Topic') {
    const { data } = await openAlex.get('/topics', {
      params: { search: query, select: 'id,display_name', per_page: 50 },
    });
    return (data?.results || []).map((item) => ({ category, id: item.id, label: item.display_name }));
  }

  // Commas separate OpenAlex filters, so they cannot appear inside the search value.
  const { data } = await openAlex.get('/works', {
    params: {
      filter: `title.search:${query.replace(/,/g, ' ')},has_abstract:true,language:en`,
      per_page: 50,
    },
  });
  return (data?.results || []).map((item) => ({
    category,
    id: lastPathSegment(item.id),
    label: item.title,
  }));
};

const CastScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { finishedVideoId, finishedArticleId } = route.params ?? {};

  const [userId, setUserId] = useState(null);
  const [suggestedCastData, setSuggestedCastData] = useState([]);
  const [trendingCastData, setTrendingCastData] = useState([]);
  const [articleData, setArticleData] = useState([]);
  const [finishedVideos, setFinishedVideos] = useState([]);
  const [finishedArticles, setFinishedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Article');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  const castSearchCacheRef = useRef(null);
  const searchRequestRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Finished IDs arrive as route params from VideoScreen / ArticleDetails; clear them once
  // handled so they don't re-trigger the "done" animation.
  useEffect(() => {
    if (!finishedVideoId && !finishedArticleId) return;
    if (finishedVideoId) {
      setFinishedVideos((prev) => (prev.includes(finishedVideoId) ? prev : [...prev, finishedVideoId]));
    }
    if (finishedArticleId) {
      setFinishedArticles((prev) =>
        prev.includes(finishedArticleId) ? prev : [...prev, finishedArticleId]
      );
    }
    navigation.setParams({ finishedVideoId: undefined, finishedArticleId: undefined });
  }, [finishedVideoId, finishedArticleId, navigation]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getUser()
        .then(({ userId: storedUserId }) => {
          if (!active) return;
          if (!storedUserId) {
            resetToAuthChoice(navigation);
            return;
          }
          setUserId(storedUserId);
        })
        .catch((error) => console.error('Error reading user session:', error));
      return () => {
        active = false;
      };
    }, [navigation])
  );

  const loadContent = useCallback(async (currentUserId) => {
    const guest = isGuestUser(currentUserId);
    try {
      const [userResponse, suggestedResponse, trendingResponse, articleResponse] = await Promise.all([
        guest ? null : api.get(`/user/${currentUserId}`),
        // Suggestions are optional; their failure should not take the whole feed down.
        guest
          ? null
          : api.get(`/user/${currentUserId}/suggested/for/you`).catch((error) => {
              console.error('Error fetching suggestions:', error);
              return null;
            }),
        api.get('/cast/trending/right/now'),
        api.get('/article'),
      ]);
      if (!mountedRef.current) return;

      const evaluationList = userResponse?.data?.evaluation_list;
      const watchedCasts = getWatchedIds(evaluationList, 'cast');
      const watchedArticles = getWatchedIds(evaluationList, 'article');
      const toList = (data) => (Array.isArray(data) ? data : []);

      setSuggestedCastData(
        toList(suggestedResponse?.data).filter((cast) => !watchedCasts.has(cast._id)).map(toCastCard)
      );
      setTrendingCastData(
        toList(trendingResponse.data).filter((cast) => !watchedCasts.has(cast._id)).map(toCastCard)
      );
      setArticleData(
        toList(articleResponse.data)
          .filter((article) => !watchedArticles.has(article._id))
          .map(toArticleCard)
      );
      setApiError(false);
    } catch (error) {
      console.error('Error fetching cast content:', error);
      if (mountedRef.current) setApiError(true);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      loadContent(userId);
    }
  }, [userId, loadContent]);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    castSearchCacheRef.current = null;
    await loadContent(userId);
    if (mountedRef.current) setRefreshing(false);
  }, [userId, loadContent]);

  const retry = useCallback(() => {
    if (!userId) return;
    setApiError(false);
    setIsLoading(true);
    loadContent(userId);
  }, [userId, loadContent]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return undefined;
    }

    setSearchLoading(true);
    setSearchError(null);
    const requestId = ++searchRequestRef.current;
    const isLatest = () => requestId === searchRequestRef.current;

    const timer = setTimeout(async () => {
      try {
        const results = await searchContent(selectedCategory, query, castSearchCacheRef);
        if (isLatest()) setSearchResults(results);
      } catch (error) {
        console.error(`Error searching ${selectedCategory}:`, error);
        if (isLatest()) {
          setSearchResults([]);
          setSearchError(getErrorMessage(error, 'Search failed. Please try again.'));
        }
      } finally {
        if (isLatest()) setSearchLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      // Invalidate any in-flight request so stale results never overwrite newer ones.
      searchRequestRef.current += 1;
    };
  }, [searchQuery, selectedCategory]);

  const closeSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    Keyboard.dismiss();
  };

  const handleSearchResultPress = ({ category, id }) => {
    if (category === 'Article') {
      navigation.navigate('OpenAlexDetailsScreen', { articleId: id });
    } else if (category === 'Topic') {
      navigation.navigate('SearchTopicResult', { topicId: id });
    } else {
      navigation.navigate('VideoScreen', { selectedCastId: id });
    }
    closeSearch();
  };

  const removeFinishedVideo = useCallback((id) => {
    setSuggestedCastData((prev) => prev.filter((item) => item.id !== id));
    setTrendingCastData((prev) => prev.filter((item) => item.id !== id));
    setFinishedVideos((prev) => prev.filter((itemId) => itemId !== id));
  }, []);

  const removeFinishedArticle = useCallback((id) => {
    setArticleData((prev) => prev.filter((item) => item.id !== id));
    setFinishedArticles((prev) => prev.filter((itemId) => itemId !== id));
  }, []);

  const renderCategoryRow = (rowStyle) => (
    <View style={rowStyle}>
      {SEARCH_CATEGORIES.map((category) => {
        const selected = selectedCategory === category;
        return (
          <TouchableOpacity
            key={category}
            style={[styles.categoryButton, selected && styles.selectedCategoryButton]}
            onPress={() => setSelectedCategory(category)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Image
              source={CATEGORY_ICONS[category]}
              style={[styles.categoryIcon, selected && { tintColor: colors.primary }]}
            />
            <Text style={[styles.categoryButtonText, selected && styles.selectedCategoryButtonText]}>
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderSearchResults = () => {
    if (searchLoading) {
      return (
        <View style={styles.searchLoaderContainer}>
          <Loader fullScreen={false} size={150} />
        </View>
      );
    }
    if (searchError) {
      return <Text style={styles.noResultsText}>{searchError}</Text>;
    }
    if (searchResults.length > 0) {
      return (
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSearchResultPress(item)} accessibilityRole="button">
              <Text style={styles.searchResultItem}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      );
    }
    if (searchQuery.trim().length > 0) {
      return <Text style={styles.noResultsText}>No results found.</Text>;
    }
    return null;
  };

  if (apiError) {
    return (
      <View style={styles.errorContainer}>
        <Image source={serverErrorImage} style={styles.errorImage} />
        <Text style={styles.errorText}>Whoops!</Text>
        <Text style={styles.errorDetail}>Please try refreshing or come back later!</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={retry} accessibilityRole="button">
          <Text style={styles.refreshButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return <Loader backgroundColor={colors.primaryBis} />;
  }

  if (isSearching) {
    return (
      <View style={styles.container}>
        <View style={styles.searchHeader}>
          <Searchbar
            placeholder="Type your search..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={closeSearch}
            accessibilityRole="button"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        {renderCategoryRow(styles.categoryRowExpanded)}
        <View style={styles.searchResultsWrapper}>{renderSearchResults()}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.searchSection}>
          <Text style={styles.titleText}>I want to learn about..</Text>
          <Searchbar
            placeholder="Type your search..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            onFocus={() => setIsSearching(true)}
          />
          {renderCategoryRow(styles.categoryRow)}
          <TouchableOpacity
            style={styles.randomButton}
            onPress={() => navigation.navigate('DiscoverScreen')}
            accessibilityRole="button"
            accessibilityLabel="Discover a random cast"
          >
            <Image source={randomIcon} style={styles.randomButtonIcon} />
          </TouchableOpacity>
        </View>

        {!isGuestUser(userId) && (
          <>
            <View style={styles.sectionHeader}>
              <Image source={forYouIcon} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>For You</Text>
            </View>
            {suggestedCastData.length > 0 ? (
              <Carousel
                list={suggestedCastData}
                variant="cast"
                finishedIds={finishedVideos}
                onAnimationFinish={removeFinishedVideo}
              />
            ) : (
              <Text style={styles.noDataText}>No suggestions available.</Text>
            )}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Image source={trendingIcon} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Trending Now</Text>
        </View>
        {trendingCastData.length > 0 ? (
          <Carousel
            list={trendingCastData}
            variant="cast"
            finishedIds={finishedVideos}
            onAnimationFinish={removeFinishedVideo}
          />
        ) : (
          <Text style={styles.noDataText}>No trending casts available.</Text>
        )}

        <View style={styles.sectionHeader}>
          <Image source={articleIcon} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Articles</Text>
        </View>
        {articleData.length > 0 ? (
          <Carousel
            list={articleData}
            variant="article"
            finishedIds={finishedArticles}
            onAnimationFinish={removeFinishedArticle}
          />
        ) : (
          <Text style={styles.noDataText}>No articles available.</Text>
        )}
      </ScrollView>
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
    color: colors.black,
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
    color: colors.black,
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
  categoryRowExpanded: {
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
  searchLoaderContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.m },
});

export default CastScreen;
