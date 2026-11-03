import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, Dimensions, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RFValue } from 'react-native-responsive-fontsize';
import { colors, sizes, spacing } from '@shared/config/theme';
import { openAlex, getErrorMessage } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

import citationIcon from '@assets/Virtual_lab_icons/citation.png';
import worksIcon from '@assets/Virtual_lab_icons/works.png';

const { width, height } = Dimensions.get('window');

// The citation gauge is scaled against this many citations.
const MAX_GAUGE_CITATIONS = 8000000;
const INITIAL_HEADER_HEIGHT = height / 4;
const MIN_HEADER_HEIGHT = height / 9;
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
    outputRange: [RFValue(sizes.h1), RFValue(sizes.h3)],
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
      if (mountedRef.current) setError(getErrorMessage(err, 'We could not load this topic.'));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [openAlexId]);

  useEffect(() => {
    fetchTopicData();
  }, [fetchTopicData]);

  const renderBackButton = (color) => (
    <TouchableOpacity
      style={[styles.backButton, { top: insets.top + spacing.s }]}
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="chevron-back" size={28} color={color} />
    </TouchableOpacity>
  );

  if (loading) {
    return <Loader backgroundColor={colors.primaryBis} />;
  }

  if (error || !topicData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StateMessage
          icon={error ? 'cloud-offline-outline' : 'search-outline'}
          title={error ? 'Something went wrong' : 'Topic not found'}
          message={error || 'This topic is not available right now.'}
          actionLabel={error ? 'Try again' : 'Back to Cast'}
          onAction={error ? fetchTopicData : () => navigation.navigate('BottomNav', { screen: 'Cast' })}
        />
        {renderBackButton(colors.secondary)}
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
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {display_name}
          </Animated.Text>
        </LinearGradient>
        {renderBackButton(colors.primary)}
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: INITIAL_HEADER_HEIGHT + insets.top }}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
      >
        <View style={styles.overviewContainer}>
          <View style={styles.citationGaugeWrapper}>
            <View style={styles.citationIconContainer}>
              <Image source={citationIcon} style={styles.horizontalGaugeIcon} resizeMode="contain" />
              <Text style={styles.citationCountText}>{cited_by_count} Citations</Text>
            </View>
            <View style={styles.horizontalGaugeWrapper}>
              <View style={[styles.horizontalGaugeFill, { width: `${citationFill}%` }]} />
            </View>
          </View>
          <View style={styles.buttonsRow}>
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

        <View style={styles.contentContainer}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Description</Text>
            <Text style={styles.descriptionText}>{description || 'No description available.'}</Text>
          </View>
          {Array.isArray(keywords) && keywords.length > 0 && (
            <View style={styles.sectionContainer}>
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
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  backButton: {
    position: 'absolute',
    left: spacing.m,
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
    paddingHorizontal: spacing.m,
  },
  headerTitle: {
    color: 'white',
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  overviewContainer: {
    backgroundColor: colors.primary,
    margin: spacing.m,
    padding: spacing.m,
    borderRadius: sizes.radius,
    elevation: 3,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.m,
  },
  statButton: {
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    padding: spacing.m,
    borderRadius: sizes.radius,
    elevation: 3,
  },
  statButtonIcon: {
    width: RFValue(36),
    height: RFValue(36),
    marginBottom: spacing.s,
    tintColor: colors.primary,
  },
  statButtonLabel: {
    fontSize: RFValue(14),
    fontFamily: 'MontserratBold',
    color: colors.primary,
  },
  citationGaugeWrapper: {
    marginVertical: spacing.m,
    alignItems: 'center',
  },
  citationIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  horizontalGaugeIcon: {
    width: RFValue(32),
    height: RFValue(32),
    marginHorizontal: spacing.s,
  },
  citationCountText: {
    fontSize: RFValue(14),
    fontFamily: 'MontserratBold',
    color: colors.lightblue,
  },
  horizontalGaugeWrapper: {
    width: width * 0.8,
    height: RFValue(20),
    borderRadius: sizes.radius,
    overflow: 'hidden',
    backgroundColor: colors.primaryBis,
  },
  horizontalGaugeFill: {
    height: '100%',
    backgroundColor: colors.lightblue,
  },
  contentContainer: {
    backgroundColor: colors.primary,
    margin: spacing.m,
    padding: spacing.m,
    borderRadius: sizes.radius,
    elevation: 3,
  },
  sectionContainer: {
    marginBottom: spacing.m,
  },
  sectionHeader: {
    fontSize: RFValue(sizes.h2),
    fontFamily: 'Montserrat',
    color: colors.secondary,
    marginBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary,
    paddingBottom: spacing.s,
  },
  descriptionText: {
    fontSize: RFValue(sizes.h4),
    fontFamily: 'Montserrat',
    color: colors.secondary,
    lineHeight: 22,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  keywordChip: {
    backgroundColor: colors.darkOrange,
    borderRadius: 16,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s / 2,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
  },
  keywordText: {
    fontSize: RFValue(12),
    fontFamily: 'MontserratBold',
    color: colors.primary,
  },
});

export default SearchTopicResult;
