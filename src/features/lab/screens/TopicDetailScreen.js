import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Snackbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, fonts, scale, sizes, spacing, typography } from '@shared/config/theme';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ActivityImage from '@assets/Virtual_lab_icons/activity.png';
import ImpactImage from '@assets/Virtual_lab_icons/impact.png';
import citationIcon from '@assets/Virtual_lab_icons/citation.png';
import worksIcon from '@assets/Virtual_lab_icons/works.png';
import castIcon from '@assets/Cast_screen_icons/cast_icon.png';
import { api, openAlex, notFoundError, OPTIONAL_REQUEST_TIMEOUT_MS } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import ErrorState from '@shared/components/ErrorState';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';

const { width, height } = Dimensions.get('window');

const MAX_ACTIVITY = 9000;
const MAX_IMPACT = 2000;
const MAX_CITATIONS = 8000000;
const GAUGE_SIZE = Math.min(width * 0.35, 160);
const INITIAL_HEADER_HEIGHT = Math.min(height / 4, 260);
const MIN_HEADER_HEIGHT = Math.min(height / 9, 110);

const toFill = (value, max) => Math.min(100, Math.max(0, ((Number(value) || 0) / max) * 100));

// OpenAlex ids may be stored either as "T12345" or as "https://openalex.org/T12345".
const toShortOpenAlexId = (id) => (id ? String(id).split('/').pop() : null);

const TopicDetailScreen = ({ route }) => {
  const { topicId } = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [brightData, setBrightData] = useState(null);
  const [openData, setOpenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const initialHeaderHeight = INITIAL_HEADER_HEIGHT + insets.top;
  const minHeaderHeight = MIN_HEADER_HEIGHT + insets.top;
  const headerShrinkRange = initialHeaderHeight - minHeaderHeight;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [initialHeaderHeight, minHeaderHeight],
    extrapolate: 'clamp',
  });
  const titleFontSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [sizes.h1, sizes.h3],
    extrapolate: 'clamp',
  });

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: bright } = await api.get(`/topic/${encodeURIComponent(topicId)}`);
      if (!bright || typeof bright !== 'object') throw notFoundError();
      if (!isMounted.current) return;
      setBrightData(bright);

      const openAlexId = toShortOpenAlexId(bright.openalexID);
      if (openAlexId) {
        try {
          // OpenAlex enrichment is optional: give up quickly and keep the BrightMinds data.
          const { data: open } = await openAlex.get(`/topics/${encodeURIComponent(openAlexId)}`, {
            timeout: OPTIONAL_REQUEST_TIMEOUT_MS,
            retries: 0,
          });
          if (isMounted.current) setOpenData(open);
        } catch (openErr) {
          console.warn('Failed to fetch OpenAlex topic details:', openErr?.message);
        }
      }
    } catch (err) {
      console.error('Failed to fetch topic details:', err);
      if (isMounted.current) setError(err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderBackButton = (tone) => (
    <BackButton tone={tone} onPress={() => navigation.goBack()} style={styles.backButton} />
  );

  if (loading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState
          error={error}
          onRetry={fetchData}
          fallbackMessage="We couldn't load this topic."
          notFoundTitle="Topic not found"
          notFoundMessage="This topic is not available right now."
          secondaryActionLabel="Go back"
          onSecondaryAction={() => navigation.goBack()}
        />
        {renderBackButton('default')}
      </View>
    );
  }

  const { name: brightName, departmentName, castCount, activity, impact } = brightData || {};
  const { display_name, description, keywords, cited_by_count } = openData || {};
  const openAlexTopicId = toShortOpenAlexId(brightData?.openalexID);
  const topicTitle = display_name || brightName || 'Topic Detail';
  const activityFill = toFill(activity, MAX_ACTIVITY);
  const impactFill = toFill(impact, MAX_IMPACT);
  const citationFill = toFill(cited_by_count, MAX_CITATIONS);

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
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {topicTitle}
          </Animated.Text>
        </LinearGradient>
        {renderBackButton('light')}
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: initialHeaderHeight + spacing.m,
          paddingBottom: insets.bottom + spacing.l,
        }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.gaugeRow}>
              <View style={styles.gaugeContainer}>
                <AnimatedCircularProgress
                  size={GAUGE_SIZE}
                  width={10}
                  fill={activityFill}
                  tintColor={colors.lightTeal}
                  backgroundColor={colors.border}
                  rotation={-115}
                  arcSweepAngle={230}
                  lineCap="round"
                >
                  {() => (
                    <Image source={ActivityImage} style={styles.gaugeIcon} resizeMode="contain" />
                  )}
                </AnimatedCircularProgress>
                <Text style={[styles.gaugeLabel, styles.gaugeLabelActivity]}>Activity</Text>
              </View>
              <View style={styles.gaugeContainer}>
                <AnimatedCircularProgress
                  size={GAUGE_SIZE}
                  width={10}
                  fill={impactFill}
                  tintColor={colors.darkTeal}
                  backgroundColor={colors.border}
                  rotation={-115}
                  arcSweepAngle={230}
                  lineCap="round"
                >
                  {() => (
                    <Image source={ImpactImage} style={styles.gaugeIcon} resizeMode="contain" />
                  )}
                </AnimatedCircularProgress>
                <Text style={[styles.gaugeLabel, styles.gaugeLabelImpact]}>Impact</Text>
              </View>
            </View>

            {cited_by_count != null && (
              <View style={styles.citationBlock}>
                <View style={styles.citationRow}>
                  <Image source={citationIcon} style={styles.citationIcon} resizeMode="contain" />
                  <Text style={styles.citationCountText}>
                    {Number(cited_by_count).toLocaleString()} Citations
                  </Text>
                </View>
                <View style={styles.gaugeTrack}>
                  <View style={[styles.gaugeFill, { width: `${citationFill}%` }]} />
                </View>
              </View>
            )}

            <View style={styles.statRow}>
              <TouchableOpacity
                style={[styles.statButton, !openAlexTopicId && styles.statButtonDisabled]}
                disabled={!openAlexTopicId}
                accessibilityRole="button"
                accessibilityLabel="Browse research works"
                onPress={() => navigation.navigate('WorksListScreen', { topicId: openAlexTopicId })}
              >
                <Image source={worksIcon} style={styles.statButtonIcon} resizeMode="contain" />
                <Text style={styles.statButtonLabel}>Works</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statButton}
                accessibilityRole="button"
                accessibilityLabel="Browse casts"
                onPress={() => {
                  if (!castCount) {
                    setSnackbarVisible(true);
                  } else {
                    navigation.navigate('CastListScreen', {
                      department: departmentName,
                      topic: topicTitle,
                    });
                  }
                }}
              >
                <Image source={castIcon} style={styles.statButtonIcon} resizeMode="contain" />
                <Text style={styles.statButtonLabel}>Casts</Text>
              </TouchableOpacity>
            </View>

            {!!departmentName && (
              <Text style={styles.departmentText}>Department: {departmentName}</Text>
            )}
          </View>

          <View style={[styles.card, styles.sections]}>
            <View>
              <Text style={styles.sectionHeader}>Description</Text>
              <Text style={styles.descriptionText}>
                {description || 'No description available for this topic yet.'}
              </Text>
            </View>

            {keywords && keywords.length > 0 && (
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

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={[styles.snackbar, { marginBottom: spacing.s + insets.bottom }]}
      >
        No casts available.
      </Snackbar>
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
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gaugeContainer: {
    alignItems: 'center',
  },
  gaugeIcon: {
    width: scale(48),
    height: scale(48),
  },
  gaugeLabel: {
    // The open bottom of the arc leaves room for the label.
    marginTop: -spacing.m,
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
  },
  gaugeLabelActivity: {
    color: colors.lightTeal,
  },
  gaugeLabelImpact: {
    color: colors.darkTeal,
  },
  citationBlock: {
    marginTop: spacing.l,
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
    gap: spacing.m,
    marginTop: spacing.l,
  },
  statButton: {
    flex: 1,
    maxWidth: 200,
    alignItems: 'center',
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
  statButtonDisabled: {
    opacity: 0.5,
  },
  departmentText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing.m,
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
  snackbar: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.darkGray,
  },
});

export default TopicDetailScreen;
