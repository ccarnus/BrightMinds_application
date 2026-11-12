import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { colors, contentWidth, fonts, rewardColors, shadow, sizes, spacing, tints, typography } from '@shared/config/theme';
import { api } from '@shared/api/client';
import { getUser, isGuestUser, clearUser } from '@shared/utils/UserStorage';
import { useOnReconnect } from '@shared/utils/connectivity';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import { useTabBarSpace } from '@navigation/FloatingTabBar';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import ErrorSnackbar from '@shared/components/ErrorSnackbar';
import AppButton from '@shared/components/AppButton';
import CastRail from '@features/cast/components/CastRail';
import FeaturedCast from '@features/cast/components/FeaturedCast';
import HomeHeader from '@features/cast/components/HomeHeader';
import HomeSkeleton from '@features/cast/components/HomeSkeleton';
import ProgressCard from '@features/cast/components/ProgressCard';
import QuickActions from '@features/cast/components/QuickActions';
import SearchPanel from '@features/cast/components/SearchPanel';
import SearchPill from '@features/cast/components/SearchPill';
import SectionHeader from '@features/cast/components/SectionHeader';
import useCastSearch from '@features/cast/utils/useCastSearch';
import { countPending, getWatchedIds, splitFeed, toCastCard } from '@features/cast/utils/home';
import { fetchRewards } from '@features/track/utils/quizApi';
import { feedTitle } from '@features/learning/utils/pathStyles';

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

const GuestPrompt = ({ onSignIn }) => (
  <Animated.View entering={FadeInDown.delay(100).duration(420)} style={styles.guestWrapper}>
    <View style={styles.guestCard}>
      <Text style={styles.guestTitle}>Track your progress</Text>
      <Text style={styles.guestText}>
        Create an account to earn XP, keep a streak and get casts picked for you.
      </Text>
      <AppButton size="medium" onPress={onSignIn} style={styles.guestButton}>
        Create an account
      </AppButton>
    </View>
  </Animated.View>
);

/** Home of the app: greeting, search, shortcuts, the cast picked for the user and the casts rails. */
const CastScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { finishedVideoId } = route.params ?? {};

  const [userId, setUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [rewards, setRewards] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [suggestedCastData, setSuggestedCastData] = useState([]);
  // The backend shapes the suggestions by learning path; the title says how.
  const [suggestedTitle, setSuggestedTitle] = useState('For You');
  const [trendingCastData, setTrendingCastData] = useState([]);
  const [finishedVideos, setFinishedVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [sectionErrors, setSectionErrors] = useState({});
  const [isSearching, setIsSearching] = useState(false);

  const search = useCastSearch();
  const hasLoadedRef = useRef(false);
  const mountedRef = useRef(true);
  const tabBarSpace = useTabBarSpace();
  const guest = isGuestUser(userId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const { featured, suggested, trending } = useMemo(
    () => splitFeed(suggestedCastData, trendingCastData),
    [suggestedCastData, trendingCastData]
  );
  const featuredId = featured?.id;
  const featuredIsSuggestion = !!featured && suggestedCastData[0]?.id === featuredId;

  const removeFinishedVideo = useCallback((id) => {
    setSuggestedCastData((prev) => prev.filter((item) => item.id !== id));
    setTrendingCastData((prev) => prev.filter((item) => item.id !== id));
    setFinishedVideos((prev) => prev.filter((itemId) => itemId !== id));
  }, []);

  // The finished ID arrives as a route param from VideoScreen; clear it once handled so it
  // doesn't re-trigger the "done" animation. The hero has no such animation: it just leaves.
  useEffect(() => {
    if (!finishedVideoId) return;
    if (finishedVideoId === featuredId) {
      removeFinishedVideo(finishedVideoId);
    } else {
      setFinishedVideos((prev) => (prev.includes(finishedVideoId) ? prev : [...prev, finishedVideoId]));
    }
    navigation.setParams({ finishedVideoId: undefined });
  }, [finishedVideoId, featuredId, navigation, removeFinishedVideo]);

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

  // Profile data the home shows on top (name, level, questions ready). Both requests are bonuses:
  // a failure keeps what is on screen.
  const applyProfile = useCallback((userResult, rewardsResult) => {
    if (userResult.status === 'fulfilled' && userResult.value?.data) {
      const { username: name, evaluation_list: evaluationList } = userResult.value.data;
      if (name) setUsername(name);
      setPendingCount(countPending(evaluationList));
    }
    // `null` = a backend without rewards; a failure keeps the previous value.
    if (rewardsResult.status === 'fulfilled') setRewards(rewardsResult.value ?? null);
  }, []);

  // Each section loads independently, so one failing endpoint only affects its own section.
  // Throws when no section could be loaded; otherwise returns the first section error (or null).
  const fetchFeed = useCallback(
    async (currentUserId) => {
      const isGuest = isGuestUser(currentUserId);
      const [userResult, suggestedResult, trendingResult, rewardsResult] = await Promise.allSettled([
        isGuest ? null : api.get(`/user/${currentUserId}`),
        isGuest ? null : api.get(`/user/${currentUserId}/suggested/for/you`),
        api.get('/cast/trending/right/now'),
        isGuest ? null : fetchRewards(currentUserId),
      ]);
      if (!mountedRef.current) return null;

      const results = { suggested: suggestedResult, trending: trendingResult };
      const sectionNames = isGuest ? ['trending'] : ['suggested', 'trending'];
      const failedSections = sectionNames.filter((name) => results[name].status === 'rejected');
      failedSections.forEach((name) => console.error(`Error fetching ${name}:`, results[name].reason));
      if (failedSections.length === sectionNames.length) {
        throw results[failedSections[0]].reason;
      }

      // Without the profile, already-watched content is simply not filtered out.
      if (userResult.status === 'rejected') {
        console.warn('Could not load watched content:', userResult.reason?.message);
      }
      if (!isGuest) {
        applyProfile(userResult, rewardsResult);
        if (userResult.status === 'fulfilled') {
          setSuggestedTitle(feedTitle(userResult.value?.data?.learning));
        }
      }
      const evaluationList =
        userResult.status === 'fulfilled' ? userResult.value?.data?.evaluation_list : [];
      const watchedCasts = getWatchedIds(evaluationList);

      // A failed section keeps what it already shows (e.g. on refresh).
      const suggestedList = listFromResult(suggestedResult);
      const trendingList = listFromResult(trendingResult);
      if (suggestedList) {
        setSuggestedCastData(
          suggestedList.filter((cast) => !watchedCasts.has(cast._id)).map(toCastCard)
        );
      }
      if (trendingList) {
        setTrendingCastData(
          trendingList.filter((cast) => !watchedCasts.has(cast._id)).map(toCastCard)
        );
      }
      setSectionErrors({ suggested: !suggestedList, trending: !trendingList });
      return failedSections.length > 0 ? results[failedSections[0]].reason : null;
    },
    [applyProfile]
  );

  const loadFeed = useCallback(
    async (currentUserId) => {
      setIsLoading(true);
      setLoadError(null);
      try {
        await fetchFeed(currentUserId);
        hasLoadedRef.current = true;
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

  // Coming back to the tab (after a quiz or a cast): level, streak and questions ready update
  // quietly, without a loader.
  useFocusEffect(
    useCallback(() => {
      if (!userId || guest || !hasLoadedRef.current) return;
      Promise.allSettled([api.get(`/user/${userId}`), fetchRewards(userId)]).then(
        ([userResult, rewardsResult]) => {
          if (mountedRef.current) applyProfile(userResult, rewardsResult);
        }
      );
    }, [userId, guest, applyProfile])
  );

  const retry = useCallback(() => {
    if (userId) loadFeed(userId);
  }, [userId, loadFeed]);

  // Content already on screen is kept when a refresh fails; a snackbar explains why.
  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    setRefreshError(null);
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

  const closeSearch = () => {
    setIsSearching(false);
    search.reset();
    Keyboard.dismiss();
  };

  const handleSearchResultPress = ({ category, id }) => {
    if (category === 'Paper') {
      navigation.navigate('OpenAlexDetailsScreen', { workId: id });
    } else if (category === 'Topic') {
      navigation.navigate('SearchTopicResult', { topicId: id });
    } else {
      navigation.navigate('VideoScreen', { selectedCastId: id });
    }
    closeSearch();
  };

  const openCast = (cast) => navigation.navigate('VideoScreen', { selectedCastId: cast.id });

  const handleSignIn = async () => {
    await clearUser();
    resetToAuthChoice(navigation);
  };

  if (isLoading) {
    return <HomeSkeleton />;
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
      <SearchPanel
        search={search}
        onClose={closeSearch}
        onSelect={handleSearchResultPress}
        bottomSpace={tabBarSpace}
      />
    );
  }

  const nothingToWatch = !featured && !sectionErrors.suggested && !sectionErrors.trending;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarSpace }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <HomeHeader username={guest ? '' : username} />
        {!guest && rewards && (
          <ProgressCard rewards={rewards} onPress={() => navigation.navigate('Track')} />
        )}
        <SearchPill onPress={() => setIsSearching(true)} />
        <QuickActions
          guest={guest}
          pendingCount={pendingCount}
          onDiscover={() => navigation.navigate('DiscoverScreen')}
          onQuiz={() => navigation.navigate('Ready')}
          onLabs={() => navigation.navigate('Lab')}
        />
        {guest && <GuestPrompt onSignIn={handleSignIn} />}

        {nothingToWatch && (
          <StateMessage
            icon="checkmark-done-circle-outline"
            title="You're all caught up"
            message="You have watched every cast for now. New ones land regularly, or try a surprise."
            actionLabel="Discover a cast"
            onAction={() => navigation.navigate('DiscoverScreen')}
            compact
            style={styles.empty}
          />
        )}

        {!!featured && (
          <View style={styles.hero}>
            <FeaturedCast
              cast={featured}
              label={featuredIsSuggestion ? 'Picked for you' : 'Trending now'}
              onPress={openCast}
            />
          </View>
        )}

        {!guest && (suggested.length > 0 || sectionErrors.suggested) && (
          <>
            <SectionHeader
              icon="heart"
              title={suggestedTitle}
              subtitle="Picked from your interests"
            />
            {suggested.length > 0 ? (
              <CastRail list={suggested} finishedIds={finishedVideos} onFinish={removeFinishedVideo} />
            ) : (
              <SectionError message="Couldn't load your suggestions." onRetry={onRefresh} />
            )}
          </>
        )}

        {(trending.length > 0 || sectionErrors.trending) && (
          <>
            <SectionHeader
              icon="flame"
              color={rewardColors.streak}
              tint={tints.orange}
              title="Trending Now"
              subtitle="What the community is watching"
            />
            {trending.length > 0 ? (
              <CastRail ranked list={trending} finishedIds={finishedVideos} onFinish={removeFinishedVideo} />
            ) : (
              <SectionError message="Couldn't load trending casts." onRetry={onRefresh} />
            )}
          </>
        )}
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
  hero: { marginTop: spacing.l },
  empty: { marginTop: spacing.l },
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
  guestWrapper: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    marginTop: spacing.m,
  },
  guestCard: {
    padding: spacing.m,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.light,
  },
  guestTitle: { ...typography.h3 },
  guestText: { ...typography.bodySmall, marginTop: spacing.xs },
  guestButton: { alignSelf: 'flex-start', marginTop: spacing.m },
});

export default CastScreen;
