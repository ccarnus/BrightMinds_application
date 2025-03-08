import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Provider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RFValue } from "react-native-responsive-fontsize";
import { colors, sizes, spacing } from '../theme';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import ActivityImage from '../../assets/Virtual_lab_icons/activity.png';
import ImpactImage from '../../assets/Virtual_lab_icons/impact.png';
import citationIcon from '../../assets/Virtual_lab_icons/citation.png';
import worksIcon from '../../assets/Virtual_lab_icons/works.png';
import castIcon from '../../assets/Cast_screen_icons/cast_icon.png';
import articleIcon from '../../assets/Cast_screen_icons/article_icon.png';

const { width, height } = Dimensions.get('window');

const TopicDetailScreen = ({ route }) => {
  const { topicId } = route.params;
  const navigation = useNavigation();
  const [brightData, setBrightData] = useState(null);
  const [openData, setOpenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const initialHeaderHeight = height / 4;
  const minHeaderHeight = height / 9;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res1 = await fetch(`https://api.brightmindsresearch.com/topic/${topicId}`);
        if (!res1.ok) {
          throw new Error('Failed to fetch Brightminds topic details');
        }
        const bright = await res1.json();
        setBrightData(bright);

        const openalexID = bright.openalexID;
        const res2 = await fetch(`https://api.openalex.org/topics/${openalexID}`);
        if (!res2.ok) {
          throw new Error('Failed to fetch OpenAlex topic details');
        }
        const open = await res2.json();
        setOpenData(open);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [topicId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00aaff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  const { name: brightName, departmentName, articleCount, castCount, activity, impact } = brightData || {};
  const { display_name, description, keywords, works_count, cited_by_count } = openData || {};
  const topicTitle = display_name || brightName || 'Topic Detail';
  const activityFill = brightData ? (activity / 9000) * 100 : 0;
  const impactFill = brightData ? (impact / 2000) * 100 : 0;
  const citationFill = openData ? (cited_by_count / 8000000) * 100 : 0;

  return (
    <Provider>
      <View style={styles.container}>
        {/* Animated Header */}
        <Animated.View style={[styles.header, { height: headerHeight }]}>
          <LinearGradient
            colors={[colors.secondary, colors.primaryBis]}
            style={styles.headerGradient}
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

        {/* Scrollable Content */}
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingTop: initialHeaderHeight }}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          {/* Overview Section */}
          <View style={styles.overviewContainer}>
            {/* Gauges Row for Activity and Impact */}
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
                    <Image 
                      source={ActivityImage} 
                      style={styles.gaugeIcon} 
                      resizeMode="contain"
                    />
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
                    <Image 
                      source={ImpactImage} 
                      style={styles.gaugeIcon} 
                      resizeMode="contain"
                    />
                  )}
                </AnimatedCircularProgress>
                <Text style={styles.gaugeLabelImpact}>Impact</Text>
              </View>
            </View>

            {/* Horizontal Gauge for Citations, positioned above the buttons */}
            <View style={styles.citationIconContainer}>
              <Image source={citationIcon} style={styles.horizontalGaugeIcon} resizeMode="contain" />
              <Text style={styles.citationCountText}>{cited_by_count} Citations</Text>
            </View>
            <View style={styles.horizontalGaugeWrapper}>
              <View style={styles.horizontalGaugeContainer}>
                <View style={styles.horizontalGaugeBackground}>
                  <Animated.View 
                    style={[
                      styles.horizontalGaugeFill, 
                      { width: `${citationFill}%` }
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Buttons Row for Works, Casts, and Articles */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity style={styles.statButton} onPress={() => { /* add Works onPress handler */ }}>
                <Image source={worksIcon} style={styles.statButtonIcon} resizeMode="contain" />
                <Text style={styles.statButtonLabel}>Works</Text>
               {/* <Text style={styles.statButtonCount}>{works_count}</Text>*/}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.statButton} 
                onPress={() => navigation.navigate('CastListScreen', { 
                  department: departmentName, 
                  topic: topicTitle 
                })}
              >
                <Image source={castIcon} style={styles.statButtonIcon} resizeMode="contain" />
                <Text style={styles.statButtonLabel}>Casts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statButton} onPress={() => { /* add Articles onPress handler */ }}>
                <Image source={articleIcon} style={styles.statButtonIcon} resizeMode="contain" />
                <Text style={styles.statButtonLabel}>Articles</Text>
                {/*<Text style={styles.statButtonCount}>{articleCount}</Text>*/}
              </TouchableOpacity>
            </View>

            {/* Department Information */}
            {departmentName && (
              <View style={styles.departmentContainer}>
                <Text style={styles.departmentText}>Department: {departmentName}</Text>
              </View>
            )}
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            {/* Description Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Description</Text>
              <Text style={styles.descriptionText}>{description}</Text>
            </View>

            {/* Keywords Section with multi-line wrapping and horizontal scrolling */}
            {keywords && keywords.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionHeader}>Keywords</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.keywordsContainer}
                >
                  {keywords.map((word, index) => (
                    <View key={index} style={styles.keywordChip}>
                      <Text style={styles.keywordText}>{word}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </Animated.ScrollView>
      </View>
    </Provider>
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
  },
  statButtonIcon: {
    width: RFValue(36),
    height: RFValue(36),
    marginBottom: spacing.s,
    tintColor: colors.primary,
  },
  statButtonLabel: {
    fontSize: RFValue(14),
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    color: colors.primary,
  },
  statButtonCount: {
    fontSize: RFValue(16),
    color: colors.darkblue,
    fontFamily: 'Montserrat',
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
    flexWrap: 'wrap', // Allows wrapping into 2-3 lines.
    alignItems: 'center',
  },
  keywordChip: {
    backgroundColor: colors.darkOrange,
    borderRadius: 16,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s / 2,
    marginRight: spacing.xs,
    marginBottom: spacing.xs, // Space between rows.
  },
  keywordText: {
    fontSize: RFValue(12),
    fontFamily: 'MontserratBold',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryBis,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: RFValue(16),
    color: 'red',
    marginBottom: spacing.m,
  },
});

export default TopicDetailScreen;
