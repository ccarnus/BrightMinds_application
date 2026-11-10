import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Linking, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, fonts, spacing, typography } from '@shared/config/theme';
import { openAlex, notFoundError } from '@shared/api/client';
import departments from '@shared/data/departments';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import { recordPaperOpened } from '@features/learning/utils/learningApi';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import AppButton from '@shared/components/AppButton';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';

const BUTTON_HEIGHT = 52;

// OpenAlex ships abstracts as an inverted index ({ word: [positions] }).
const reconstructAbstract = (invertedIndex) => {
  if (!invertedIndex) return '';
  const positions = [];
  Object.entries(invertedIndex).forEach(([word, posArray]) => {
    posArray.forEach((pos) => positions.push({ pos, word }));
  });
  positions.sort((a, b) => a.pos - b.pos);
  return positions.map((entry) => entry.word).join(' ');
};

const getTimeSincePosted = (dateString) => {
  const diffDays = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 3600 * 24));
  if (Number.isNaN(diffDays)) return '';
  if (diffDays < 365) {
    if (diffDays <= 0) return 'today';
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

const OpenAlexDetailsScreen = ({ route, navigation }) => {
  // Short OpenAlex work id, e.g. "W2935714482".
  const { articleId } = route.params;
  const insets = useSafeAreaInsets();
  const [work, setWork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchWork = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data } = await openAlex.get(`/works/${encodeURIComponent(articleId)}`);
      if (!mountedRef.current) return;
      setWork(data?.title ? data : null);
    } catch (error) {
      console.error('Error fetching work details:', error);
      if (mountedRef.current) setLoadError(error);
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    fetchWork();
  }, [fetchWork]);

  // Opening a paper counts for the Researcher path (once per visit, in the background).
  const recordedRef = useRef(false);
  useEffect(() => {
    if (!work || recordedRef.current) return;
    recordedRef.current = true;
    const fieldId = work.primary_topic?.field?.id;
    const field = fieldId ? departments.find((dept) => dept.id === fieldId)?.name : undefined;
    getUser()
      .then(({ userId }) => {
        if (userId && !isGuestUser(userId)) {
          recordPaperOpened(userId, { paperId: work.id || articleId, field });
        }
      })
      .catch(() => {});
  }, [work, articleId]);

  const abstractText = useMemo(() => {
    const index = work?.abstract_inverted_index_v3 || work?.abstract_inverted_index;
    return index ? reconstructAbstract(index) : 'No abstract available.';
  }, [work]);

  const goToCast = () => navigation.popTo('BottomNav', { screen: 'Cast' });

  const openFullResearch = () => {
    const url = work?.primary_location?.landing_page_url;
    if (!url) {
      Alert.alert('Unavailable', 'No link available for this work.');
      return;
    }
    Linking.openURL(url).catch((error) => {
      console.error('Failed to open URL:', error);
      Alert.alert('Error', 'Unable to open the research link.');
    });
  };

  const backButton = <BackButton onPress={() => navigation.goBack()} />;

  if (isLoading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (loadError || !work) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState
          error={loadError || notFoundError()}
          onRetry={fetchWork}
          fallbackMessage="We couldn't load this research paper."
          notFoundTitle="Research paper not found"
          notFoundMessage="This work is not available right now."
          secondaryActionLabel="Back to Cast"
          onSecondaryAction={goToCast}
        />
        {backButton}
      </View>
    );
  }

  const fieldId = work.primary_topic?.field?.id;
  const departmentDetails = fieldId ? departments.find((dept) => dept.id === fieldId) : null;
  const bottomBarPadding = Math.max(insets.bottom, spacing.m);
  // Keeps the end of the abstract above the pinned "Access Full Research" bar.
  const scrollBottomPadding = BUTTON_HEIGHT + spacing.s + bottomBarPadding + spacing.l;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.s + BACK_BUTTON_SIZE,
          paddingBottom: scrollBottomPadding,
        }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{work.title}</Text>
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
          <Text style={styles.dateText}>{getTimeSincePosted(work.publication_date)}</Text>
          <Text style={styles.description}>{abstractText}</Text>

          <AppButton
            variant="primary"
            onPress={goToCast}
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
          onPress={openFullResearch}
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
  content: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    gap: spacing.m,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
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

export default OpenAlexDetailsScreen;
