import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, fonts, spacing, typography } from '@shared/config/theme';
import departments from '@shared/data/departments';
import { api, getErrorMessage, notFoundError, OPTIONAL_REQUEST_TIMEOUT_MS } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import AppButton from '@shared/components/AppButton';
import BackButton from '@shared/components/BackButton';

const BUTTON_HEIGHT = 52;
const MAX_HERO_HEIGHT = 320;

const getTimeSincePosted = (dateString) => {
  const diffInDays = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
  if (Number.isNaN(diffInDays)) return '';
  if (diffInDays < 365) {
    if (diffInDays <= 0) return 'today';
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }
  const years = Math.floor(diffInDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

const ArticleDetailsScreen = ({ route, navigation }) => {
  const { selectedArticleId } = route.params;
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [article, setArticle] = useState(null);
  const [university, setUniversity] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    getUser()
      .then(({ userId: storedUserId }) => mountedRef.current && setUserId(storedUserId))
      .catch((error) => console.error('Error reading user session:', error));
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchArticle = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await api.get(`/article/${encodeURIComponent(selectedArticleId)}`);
      if (!data?._id) throw notFoundError();
      if (!mountedRef.current) return;
      setArticle(data);
      setIsLoading(false);

      if (data.university) {
        try {
          // The university logo is optional and must not hold the article back.
          const { data: universityData } = await api.get(
            `/university/by/name/${encodeURIComponent(data.university)}`,
            { timeout: OPTIONAL_REQUEST_TIMEOUT_MS, retries: 0 }
          );
          if (mountedRef.current && universityData?.iconurl) {
            setUniversity({ logo: universityData.iconurl, name: universityData.displayedName });
          }
        } catch (error) {
          console.warn('Could not load the university logo:', error?.message);
        }
      }
    } catch (error) {
      console.error('Error fetching article:', error);
      if (mountedRef.current) {
        setLoadError(error);
        setIsLoading(false);
      }
    }
  }, [selectedArticleId]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  const promptSignIn = () => {
    Alert.alert('Sign in required', 'Create an account or sign in to track the articles you read.', [
      { text: 'Not now', style: 'cancel' },
      { text: 'Sign in', onPress: () => resetToAuthChoice(navigation) },
    ]);
  };

  const handleAddToCastList = async () => {
    if (isSubmitting) return;
    if (!userId || isGuestUser(userId)) {
      promptSignIn();
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/user/add/content/${userId}`, { contentId: selectedArticleId, type: 'article' });
      navigation.popTo('BottomNav', {
        screen: 'Cast',
        params: { finishedArticleId: selectedArticleId },
      });
    } catch (error) {
      console.error('Error adding article to list:', error);
      Alert.alert("Couldn't save this article", getErrorMessage(error, 'Please try again.'));
    } finally {
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  const handleAccessFullResearch = () => {
    if (!article?.link) {
      Alert.alert('Unavailable', 'No link available for this article.');
      return;
    }
    Linking.openURL(article.link).catch((error) => {
      console.error('Failed to open URL:', error);
      Alert.alert('Error', 'Unable to open the article link.');
    });
  };

  const backButton = <BackButton tone="overlay" onPress={() => navigation.goBack()} />;

  if (isLoading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (loadError || !article) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState
          error={loadError || notFoundError()}
          onRetry={fetchArticle}
          fallbackMessage="We couldn't load this article."
          notFoundTitle="Article not found"
          notFoundMessage="This article may have been removed."
          secondaryActionLabel="Go back"
          onSecondaryAction={() => navigation.goBack()}
        />
        {backButton}
      </View>
    );
  }

  const departmentDetails = departments.find((dept) => dept.name === article.department);
  const bottomBarPadding = Math.max(insets.bottom, spacing.m);
  // Keeps the end of the article above the pinned "Access Full Research" bar.
  const scrollBottomPadding = BUTTON_HEIGHT + spacing.s + bottomBarPadding + spacing.l;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: scrollBottomPadding }}>
        <Image
          source={{ uri: article.articleimageurl }}
          style={[styles.image, { height: Math.min(windowHeight * 0.3, MAX_HERO_HEIGHT) }]}
        />

        <View style={styles.content}>
          {(!!university || !!departmentDetails) && (
            <View style={styles.metaGroup}>
              {!!university && (
                <View style={styles.metaRow}>
                  <Image source={{ uri: university.logo }} style={styles.metaIcon} />
                  <Text style={styles.metaText}>{university.name}</Text>
                </View>
              )}

              {!!departmentDetails && (
                <TouchableOpacity
                  style={styles.metaRow}
                  onPress={() =>
                    navigation.navigate('VirtualLab', {
                      labId: departmentDetails.name,
                      labDisplayName: departmentDetails.display,
                    })
                  }
                  accessibilityRole="button"
                >
                  <Image source={departmentDetails.image} style={styles.metaIcon} />
                  <Text style={styles.metaText}>{departmentDetails.display}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={styles.dateText}>{getTimeSincePosted(article.dateadded)}</Text>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.description}>{article.description}</Text>

          <AppButton
            variant="primary"
            onPress={handleAddToCastList}
            loading={isSubmitting}
            disabled={isSubmitting}
            icon={require('@assets/Cast_screen_icons/like.png')}
            style={styles.gotItButton}
          >
            Got it!
          </AppButton>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomBarPadding }]}>
        <AppButton
          variant="accent"
          fullWidth
          onPress={handleAccessFullResearch}
          icon={require('@assets/Cast_screen_icons/link.png')}
          style={styles.bottomButton}
        >
          Access Full Research
        </AppButton>
      </View>
      {backButton}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  image: {
    width: '100%',
    resizeMode: 'cover',
    backgroundColor: colors.placeholder,
  },
  content: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
    gap: spacing.m,
  },
  metaGroup: {
    alignItems: 'center',
    gap: spacing.s,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    minHeight: 44,
    maxWidth: '100%',
  },
  metaIcon: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  metaText: {
    ...typography.body,
    color: colors.textSecondary,
    flexShrink: 1,
    textAlign: 'center',
  },
  dateText: {
    ...typography.caption,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
  },
  gotItButton: {
    alignSelf: 'center',
    minWidth: 200,
    marginTop: spacing.s,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bottomButton: {
    ...contentWidth,
  },
});

export default ArticleDetailsScreen;
