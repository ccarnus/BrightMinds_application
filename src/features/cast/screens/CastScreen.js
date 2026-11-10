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
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, sizes, spacing, typography, contentWidth, scale } from '@shared/config/theme';
import { api, openAlex } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import { useOnReconnect } from '@shared/utils/connectivity';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import { useTabBarSpace } from '@navigation/FloatingTabBar';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import ErrorSnackbar from '@shared/components/ErrorSnackbar';
import AppButton from '@shared/components/AppButton';
import SearchField from '@shared/components/SearchField';
import Carousel from '@features/cast/components/Carousel';
import { feedTitle } from '@features/learning/utils/pathStyles';

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

// Fulfilled responses yield a list (empty when the payload is unexpected); failures yield null.
const listFromResult = (result) => {
  if (result.status !== 'fulfilled') return null;
  return Array.isArray(result.value?.data) ? result.value.data : [];
};

const SectionError = ({ message, onRetry }) => (
  <View style={styles.sectionError}>
    <Text style={styles.sectionErrorText}>{message}</Text>
    <TouchableOpacity
      onPress={onRetry}
      accessibilityRole="button"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.sectionErrorAction}>Try again</Text>
    </TouchableOpacity>
  </View>
);

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
  // The backend shapes the suggestions by learning path; the title says how.
  const [suggestedTitle, setSuggestedTitle] = useState('For You');
  const [trendingCastData, setTrendingCastData] = useState([]);
  const [articleData, setArticleData] = useState([]);
  const [finishedVideos, setFinishedVideos] = useState([]);
  const [finishedArticles, setFinishedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [sectionErrors, setSectionErrors] = useState({});

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Article');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchAttempt, setSearchAttempt] = useState(0);

  const castSearchCacheRef = useRef(null);
  const searchRequestRef = useRef(0);
  const mountedRef = useRef(true);
  const tabBarSpace = useTabBarSpace();

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

  // Each section loads independently, so one failing endpoint only affects its own section.
  // Throws when no section could be loaded; otherwise returns the first section error (or null).
  const fetchFeed = useCallback(async (currentUserId) => {
    const guest = isGuestUser(currentUserId);
    const [userResult, suggestedResult, trendingResult, articleResult] = await Promise.allSettled([
      guest ? null : api.get(`/user/${currentUserId}`),
      guest ? null : api.get(`/user/${currentUserId}/suggested/for/you`),
      api.get('/cast/trending/right/now'),
      api.get('/article'),
    ]);
    if (!mountedRef.current) return null;

    const results = { suggested: suggestedResult, trending: trendingResult, articles: articleResult };
    const sectionNames = guest ? ['trending', 'articles'] : ['suggested', 'trending', 'articles'];
    const failedSections = sectionNames.filter((name) => results[name].status === 'rejected');
    failedSections.forEach((name) => console.error(`Error fetching ${name}:`, results[name].reason));
    if (failedSections.length === sectionNames.length) {
      throw results[failedSections[0]].reason;
    }

    // Without the profile, already-watched content is simply not filtered out.
    if (userResult.status === 'rejected') {
      console.warn('Could not load watched content:', userResult.reason?.message);
    }
    const evaluationList = userResult.status === 'fulfilled' ? userResult.value?.data?.evaluation_list : [];
    if (userResult.status === 'fulfilled') {
      setSuggestedTitle(feedTitle(userResult.value?.data?.learning));
    }
    const watchedCasts = getWatchedIds(evaluationList, 'cast');
    const watchedArticles = getWatchedIds(evaluationList, 'article');

    // A failed section keeps what it already shows (e.g. on refresh).
    const suggested = listFromResult(suggestedResult);
    const trending = listFromResult(trendingResult);
    const articles = listFromResult(articleResult);
    if (suggested) {
      setSuggestedCastData(suggested.filter((cast) => !watchedCasts.has(cast._id)).map(toCastCard));
    }
    if (trending) {
      setTrendingCastData(trending.filter((cast) => !watchedCasts.has(cast._id)).map(toCastCard));
    }
    if (articles) {
      setArticleData(
        articles.filter((article) => !watchedArticles.has(article._id)).map(toArticleCard)
      );
    }
    setSectionErrors({ suggested: !suggested, trending: !trending, articles: !articles });
    return failedSections.length > 0 ? results[failedSections[0]].reason : null;
  }, []);

  const loadFeed = useCallback(
    async (currentUserId) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        await fetchFeed(currentUserId);
      } catch (error) {
        if (mountedRef.current) setLoadError(error);
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    },
    [fetchFeed]
  );

  useEffect(() => {
    if (userId) loadFeed(userId);
  }, [userId, loadFeed]);

  const retry = useCallback(() => {
    if (userId) loadFeed(userId);
  }, [userId, loadFeed]);

  // Content already on screen is kept when a refresh fails; a snackbar explains why.
  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    setRefreshError(null);
    castSearchCacheRef.current = null;
    try {
      const sectionError = await fetchFeed(userId);
      if (mountedRef.current && sectionError) setRefreshError(sectionError);
    } catch (error) {
      if (mountedRef.current) setRefreshError(error);
    } finally {
      if (mountedRef.current) setRefreshing(false);
    }
  }, [userId, fetchFeed]);

  const hasSectionError = Object.values(sectionErrors).some(Boolean);
  useOnReconnect(onRefresh, hasSectionError && !refreshing);

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
          setSearchError(error);
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
  }, [searchQuery, selectedCategory, searchAttempt]);

  const retrySearch = useCallback(() => setSearchAttempt((attempt) => attempt + 1), []);

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

  const renderCategoryRow = () => (
    <View style={styles.categoryRow} accessibilityRole="radiogroup">
      {SEARCH_CATEGORIES.map((category) => {
        const selected = selectedCategory === category;
        return (
          <TouchableOpacity
            key={category}
            style={[styles.categoryChip, selected && styles.categoryChipSelected]}
            onPress={() => setSelectedCategory(category)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <Image
              source={CATEGORY_ICONS[category]}
              style={[styles.categoryIcon, selected && styles.categoryIconSelected]}
            />
            <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
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
          <Loader fullScreen={false} size={120} />
        </View>
      );
    }
    if (searchError) {
      return (
        <ErrorState
          compact
          error={searchError}
          onRetry={retrySearch}
          fallbackMessage="Search failed. Please try again."
          style={styles.searchState}
        />
      );
    }
    if (searchResults.length > 0) {
      return (
        <FlatList
          data={searchResults}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: tabBarSpace }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.searchResultRow}
              onPress={() => handleSearchResultPress(item)}
              accessibilityRole="button"
            >
              <Text style={styles.searchResultItem} numberOfLines={2}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      );
    }
    const query = searchQuery.trim();
    if (query.length > 0) {
      return (
        <StateMessage
          compact
          icon="search-outline"
          title="No results"
          message={`No ${selectedCategory.toLowerCase()} matches "${query}".`}
          style={styles.searchState}
        />
      );
    }
    return null;
  };

  // Shows the carousel, else an inline error when the section failed to load, else an empty note.
  const renderSection = ({ list, failed, errorMessage, emptyMessage, variant, finishedIds, onAnimationFinish }) => {
    if (list.length > 0) {
      return (
        <Carousel
          list={list}
          variant={variant}
          finishedIds={finishedIds}
          onAnimationFinish={onAnimationFinish}
        />
      );
    }
    if (failed) {
      return <SectionError message={errorMessage} onRetry={onRefresh} />;
    }
    return <Text style={styles.noDataText}>{emptyMessage}</Text>;
  };

  if (isLoading) {
    return <Loader backgroundColor={colors.primaryBis} />;
  }

  if (loadError) {
    return (
      <View style={[styles.container, { paddingBottom: tabBarSpace }]}>
        <ErrorState error={loadError} onRetry={retry} fallbackMessage="We couldn't load your feed." />
      </View>
    );
  }

  if (isSearching) {
    return (
      <View style={styles.container}>
        <View style={styles.searchHeader}>
          <SearchField
            placeholder="Search articles, topics, videos"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchHeaderField}
            autoFocus
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
        {renderCategoryRow()}
        <View style={styles.searchResultsWrapper}>{renderSearchResults()}</View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarSpace }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.searchSection}>
          <Text style={styles.titleText}>I want to learn about...</Text>
          <SearchField
            placeholder="Search articles, topics, videos"
            onChangeText={setSearchQuery}
            value={searchQuery}
            onFocus={() => setIsSearching(true)}
          />
          {renderCategoryRow()}
          <AppButton
            icon={randomIcon}
            onPress={() => navigation.navigate('DiscoverScreen')}
            accessibilityLabel="Discover a random cast"
            style={styles.discoverButton}
          >
            Discover
          </AppButton>
        </View>

        {!isGuestUser(userId) && (
          <>
            <View style={styles.sectionHeader}>
              <Image source={forYouIcon} style={styles.sectionIcon} />
              <Text style={styles.sectionTitle}>{suggestedTitle}</Text>
            </View>
            {renderSection({
              list: suggestedCastData,
              failed: sectionErrors.suggested,
              errorMessage: "Couldn't load your suggestions.",
              emptyMessage: 'No suggestions available.',
              variant: 'cast',
              finishedIds: finishedVideos,
              onAnimationFinish: removeFinishedVideo,
            })}
          </>
        )}

        <View style={styles.sectionHeader}>
          <Image source={trendingIcon} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Trending Now</Text>
        </View>
        {renderSection({
          list: trendingCastData,
          failed: sectionErrors.trending,
          errorMessage: "Couldn't load trending casts.",
          emptyMessage: 'No trending casts available.',
          variant: 'cast',
          finishedIds: finishedVideos,
          onAnimationFinish: removeFinishedVideo,
        })}

        <View style={styles.sectionHeader}>
          <Image source={articleIcon} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Articles</Text>
        </View>
        {renderSection({
          list: articleData,
          failed: sectionErrors.articles,
          errorMessage: "Couldn't load articles.",
          emptyMessage: 'No articles available.',
          variant: 'article',
          finishedIds: finishedArticles,
          onAnimationFinish: removeFinishedArticle,
        })}
      </ScrollView>
      <ErrorSnackbar
        error={refreshError}
        onDismiss={() => setRefreshError(null)}
        onRetry={onRefresh}
        wrapperStyle={{ bottom: tabBarSpace - spacing.m }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
  },
  searchHeaderField: { flex: 1 },
  cancelText: {
    ...typography.bodySmall,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  searchResultsWrapper: {
    flex: 1,
    paddingHorizontal: spacing.m,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
  },
  searchResultItem: {
    ...typography.body,
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  searchSection: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
    paddingBottom: spacing.m,
  },
  titleText: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.s,
    marginVertical: spacing.m,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: sizes.buttonRadius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  categoryChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  categoryChipText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  categoryChipTextSelected: {
    fontFamily: fonts.bold,
    color: colors.textOnColor,
  },
  categoryIcon: {
    width: scale(18),
    height: scale(18),
    resizeMode: 'contain',
    tintColor: colors.text,
  },
  categoryIconSelected: {
    tintColor: colors.textOnColor,
  },
  discoverButton: {
    alignSelf: 'center',
    minWidth: 180,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.l,
    marginBottom: spacing.s,
    paddingHorizontal: spacing.m,
  },
  sectionIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
    tintColor: colors.text,
  },
  sectionTitle: {
    ...typography.h3,
  },
  noDataText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginVertical: spacing.l,
  },
  sectionError: {
    alignItems: 'center',
    marginVertical: spacing.l,
    paddingHorizontal: spacing.m,
  },
  sectionErrorText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  sectionErrorAction: {
    ...typography.bodySmall,
    marginTop: spacing.s,
    fontFamily: fonts.bold,
    color: colors.accent,
  },
  searchState: {
    flex: 0,
    paddingTop: spacing.l,
  },
  searchLoaderContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.m },
});

export default CastScreen;