import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, fonts, scale, sizes, spacing, typography } from '@shared/config/theme';
import { openAlex, notFoundError } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';

import citationIcon from '@assets/Virtual_lab_icons/citation.png';
import worksIcon from '@assets/Virtual_lab_icons/works.png';

const { height } = Dimensions.get('window');

// The citation gauge is scaled against this many citations.
const MAX_GAUGE_CITATIONS = 8000000;
const INITIAL_HEADER_HEIGHT = Math.min(height / 4, 260);
const MIN_HEADER_HEIGHT = Math.min(height / 9, 110);
const HEADER_SHRINK_RANGE = INITIAL_HEADER_HEIGHT - MIN_HEADER_HEIGHT;

const SearchTopicResult = ({ route, navigation }) => {
  // topicId may be a full OpenAlex URL (e.g. "https://openalex.org/T11577") or a bare id.
  const { topicId } = route.params;
  const openAlexId = topicId ? String(topicId).split('/').pop() : topicId;
  const insets = useSafeAreaInsets();
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SHRINK_RANGE],
    outputRange: [INITIAL_HEADER_HEIGHT + insets.top, MIN_HEADER_HEIGHT + insets.top],
    extrapolate: 'clamp',
  });
  const titleFontSize = scrollY.interpolate({
    inputRange: [0, HEADER_SHRINK_RANGE],
    outputRange: [sizes.h1, sizes.h3],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchTopicData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await openAlex.get(`/topics/${encodeURIComponent(openAlexId)}`);
      if (mountedRef.current) setTopicData(data || null);
    } catch (err) {
      console.error('Error fetching topic details:', err);
      if (mountedRef.current) setError(err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [openAlexId]);

  useEffect(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  const renderBackButton = (tone) => (
    <BackButton tone={tone} onPress={() => navigation.goBack()} style={styles.backButton} />
  );

  if (loading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (error || !topicData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState
          error={error || notFoundError()}
          onRetry={fetchTopicData}
          fallbackMessage="We couldn't load this topic."
          notFoundTitle="Topic not found"
          notFoundMessage="This topic is not available right now."
          secondaryActionLabel="Back to Cast"
          onSecondaryAction={() => navigation.popTo('BottomNav', { screen: 'Cast' })}
        />
        {renderBackButton('default')}
      </View>
    );
  }

  const { display_name, description, cited_by_count = 0, keywords } = topicData;
  const citationFill = Math.min((cited_by_count / MAX_GAUGE_CITATIONS) * 100, 100);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[colors.secondary, colors.primaryBis]}
          style={[styles.headerGradient, { paddingTop: insets.top }]}
        >
          <Animated.Text
            style={[styles.headerTitle, { fontSize: titleFontSize }]}
            numberOfLines={3}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {display_name}
          </Animated.Text>
        </LinearGradient>
        {renderBackButton('light')}
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: INITIAL_HEADER_HEIGHT + insets.top + spacing.m,
          paddingBottom: insets.bottom + spacing.l,
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.citationRow}>
              <Image source={citationIcon} style={styles.citationIcon} resizeMode="contain" />
              <Text style={styles.citationCountText}>{cited_by_count} Citations</Text>
            </View>
            <View style={styles.gaugeTrack}>
              <View style={[styles.gaugeFill, { width: `${citationFill}%` }]} />
            </View>
            <View style={styles.statRow}>
              <TouchableOpacity
                style={styles.statButton}
                onPress={() => navigation.navigate('WorksListScreen', { topicId: openAlexId })}
                accessibilityRole="button"
              >
                <Image source={worksIcon} style={styles.statButtonIcon} resizeMode="contain" />
                <Text style={styles.statButtonLabel}>Works</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, styles.sections]}>
            <View>
              <Text style={styles.sectionHeader}>Description</Text>
              <Text style={styles.descriptionText}>{description || 'No description available.'}</Text>
            </View>
            {Array.isArray(keywords) && keywords.length > 0 && (
              <View>
                <Text style={styles.sectionHeader}>Keywords</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.keywordsContainer}
                >
                  {keywords.map((word, index) => (
                    <View key={`${word}-${index}`} style={styles.keywordChip}>
                      <Text style={styles.keywordText}>{word}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    zIndex: 1001,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Leaves room for the back button on both sides so the centered title never runs under it.
    paddingHorizontal: spacing.s + BACK_BUTTON_SIZE + spacing.s,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    color: colors.textOnColor,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    gap: spacing.m,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.m,
  },
  sections: {
    gap: spacing.l,
  },
  citationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    marginBottom: spacing.s,
  },
  citationIcon: {
    width: scale(32),
    height: scale(32),
  },
  citationCountText: {
    ...typography.h3,
    color: colors.accent,
  },
  gaugeTrack: {
    width: '100%',
    height: sizes.gauge,
    borderRadius: sizes.gauge / 2,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: sizes.gauge / 2,
    backgroundColor: colors.accent,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.l,
  },
  statButton: {
    alignItems: 'center',
    minWidth: scale(128),
    backgroundColor: colors.action,
    padding: spacing.m,
    borderRadius: sizes.radius,
  },
  statButtonIcon: {
    width: scale(36),
    height: scale(36),
    marginBottom: spacing.s,
    tintColor: colors.textOnColor,
  },
  statButtonLabel: {
    ...typography.button,
    color: colors.textOnColor,
  },
  sectionHeader: {
    ...typography.h2,
    marginBottom: spacing.s,
  },
  descriptionText: {
    ...typography.body,
  },
  keywordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  keywordChip: {
    backgroundColor: colors.accentSoft,
    borderRadius: sizes.radius,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs + 2,
  },
  keywordText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h5,
    color: colors.accent,
  },
});

export default SearchTopicResult;
