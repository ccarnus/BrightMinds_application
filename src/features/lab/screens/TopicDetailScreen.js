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
import { RFValue } from 'react-native-responsive-fontsize';
import { colors, sizes, spacing } from '@shared/config/theme';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ActivityImage from '@assets/Virtual_lab_icons/activity.png';
import ImpactImage from '@assets/Virtual_lab_icons/impact.png';
import citationIcon from '@assets/Virtual_lab_icons/citation.png';
import worksIcon from '@assets/Virtual_lab_icons/works.png';
import castIcon from '@assets/Cast_screen_icons/cast_icon.png';
import { api, openAlex, getErrorMessage } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const { width, height } = Dimensions.get('window');

const MAX_ACTIVITY = 9000;
const MAX_IMPACT = 2000;
const MAX_CITATIONS = 8000000;

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
  const initialHeaderHeight = height / 4 + insets.top;
  const minHeaderHeight = height / 9 + insets.top;
  const headerShrinkRange = initialHeaderHeight - minHeaderHeight;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [initialHeaderHeight, minHeaderHeight],
    extrapolate: 'clamp',
  });
  const titleFontSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [RFValue(sizes.h1), RFValue(sizes.h3)],
    extrapolate: 'clamp',
  });

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: bright } = await api.get(`/topic/${encodeURIComponent(topicId)}`);
      if (!isMounted.current) return;
      setBrightData(bright);

      const openAlexId = toShortOpenAlexId(bright?.openalexID);
      if (openAlexId) {
        try {
          const { data: open } = await openAlex.get(`/topics/${encodeURIComponent(openAlexId)}`);
          if (isMounted.current) setOpenData(open);
        } catch (openErr) {
          // OpenAlex enrichment is optional: keep showing the BrightMinds data.
          console.warn('Failed to fetch OpenAlex topic details:', openErr?.message);
        }
      }
    } catch (err) {
      console.error('Failed to fetch topic details:', err);
      if (isMounted.current) setError(getErrorMessage(err, 'Unable to load this topic.'));
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <Loader size={200} backgroundColor={colors.primaryBis} />;
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StateMessage
          icon="cloud-offline-outline"
          title="Couldn't load this topic"
          message={error}
          actionLabel="Try again"
          onAction={fetchData}
        />
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
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
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
          >
            {topicTitle}
          </Animated.Text>
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: initialHeaderHeight, paddingBottom: insets.bottom }}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.overviewContainer}>
          <View style={styles.gaugeRow}>
            <View style={styles.gaugeContainer}>
              <AnimatedCircularProgress
                size={width * 0.35}
                width={10}
                fill={activityFill}
                tintColor={colors.lightTeal}
                backgroundColor={colors.primaryBis}
                rotation={-115}
                arcSweepAngle={230}
                lineCap="round"
              >
                {() => (
                  <Image source={ActivityImage} style={styles.gaugeIcon} resizeMode="contain" />
                )}
              </AnimatedCircularProgress>
              <Text style={styles.gaugeLabelActivity}>Activity</Text>
            </View>
            <View style={styles.gaugeContainer}>
              <AnimatedCircularProgress
                size={width * 0.35}
                width={10}
                fill={impactFill}
                tintColor={colors.darkTeal}
                backgroundColor={colors.primaryBis}
                rotation={-115}
                arcSweepAngle={230}
                lineCap="round"
              >
                {() => (
                  <Image source={ImpactImage} style={styles.gaugeIcon} resizeMode="contain" />
                )}
              </AnimatedCircularProgress>
              <Text style={styles.gaugeLabelImpact}>Impact</Text>
            </View>
          </View>

          {cited_by_count != null && (
            <>
              <View style={styles.citationIconContainer}>
                <Image source={citationIcon} style={styles.horizontalGaugeIcon} resizeMode="contain" />
                <Text style={styles.citationCountText}>
                  {Number(cited_by_count).toLocaleString()} Citations
                </Text>
              </View>
              <View style={styles.horizontalGaugeWrapper}>
                <View style={styles.horizontalGaugeContainer}>
                  <View style={styles.horizontalGaugeBackground}>
                    <View style={[styles.horizontalGaugeFill, { width: `${citationFill}%` }]} />
                  </View>
                </View>
              </View>
            </>
          )}

          <View style={styles.buttonsRow}>
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
            <View style={styles.departmentContainer}>
              <Text style={styles.departmentText}>Department: {departmentName}</Text>
            </View>
          )}
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeader}>Description</Text>
            <Text style={styles.descriptionText}>
              {description || 'No description available for this topic yet.'}
            </Text>
          </View>

          {keywords && keywords.length > 0 && (
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
    backgroundColor: colors.primaryBis,
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
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.m,
  },
  gaugeContainer: {
    alignItems: 'center',
  },
  gaugeIcon: {
    width: RFValue(48),
    height: RFValue(48),
  },
  gaugeLabelImpact: {
    marginTop: -spacing.m,
    fontSize: RFValue(14),
    fontFamily: 'MontserratBold',
    color: colors.darkTeal,
  },
  gaugeLabelActivity: {
    marginTop: -spacing.m,
    fontSize: RFValue(14),
    fontFamily: 'MontserratBold',
    color: colors.lightTeal,
  },
  horizontalGaugeWrapper: {
    marginTop: spacing.s,
    marginBottom: spacing.m,
    alignItems: 'center',
  },
  horizontalGaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.8,
    height: RFValue(20),
    borderWidth: 0,
    borderColor: colors.darkblue,
    borderRadius: sizes.radius,
    overflow: 'hidden',
    backgroundColor: colors.primaryBis,
  },
  horizontalGaugeBackground: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  horizontalGaugeFill: {
    height: '100%',
    backgroundColor: colors.lightblue,
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
    alignItems: "center",
  },
  citationIconContainer: {
    alignItems: 'center',
    marginTop: spacing.s,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.m,
  },
  statButton: {
    alignItems: 'center',
    backgroundColor: colors.lightGreen,
    padding: spacing.m,
    borderRadius: sizes.radius,
    elevation: 3,
    width: width * 0.35,
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
  statButtonDisabled: {
    opacity: 0.5,
  },
  departmentContainer: {
    marginTop: spacing.m,
    alignItems: 'center',
  },
  departmentText: {
    fontSize: RFValue(16),
    fontFamily: 'Montserrat',
    color: colors.primary,
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
  backLink: {
    alignSelf: 'center',
    padding: spacing.m,
    marginBottom: spacing.l,
  },
  backLinkText: {
    fontSize: RFValue(14),
    fontFamily: 'MontserratBold',
    color: colors.secondary,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.darkGray,
  },
});

export default TopicDetailScreen;
