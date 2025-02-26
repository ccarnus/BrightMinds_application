import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Provider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RFValue } from "react-native-responsive-fontsize";
import { colors, sizes, spacing } from '../theme';

const { width, height } = Dimensions.get('window');

const TopicDetailScreen = ({ route }) => {
  // Make sure the parameter key matches what you pass from the previous screen.
  const { topicId } = route.params;
  const navigation = useNavigation();

  // States for API data and loading/error states.
  const [brightData, setBrightData] = useState(null);
  const [openData, setOpenData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Animated scroll value and header interpolation values.
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

  // Destructure data from the APIs (with fallbacks)
  const { name: brightName, departmentName, articleCount, castCount, activity, impact } = brightData || {};
  const { display_name, description, keywords, works_count, cited_by_count } = openData || {};

  const topicTitle = display_name || brightName;

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
              // Remove numberOfLines prop to allow wrapping
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
          {/* Section 1: Topic Overview */}
          <View style={styles.overviewContainer}>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{articleCount}</Text>
                <Text style={styles.statLabel}>Articles</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{castCount}</Text>
                <Text style={styles.statLabel}>Casts</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{activity.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Activity</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{impact.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Impact</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{works_count}</Text>
                <Text style={styles.statLabel}>Works</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{cited_by_count}</Text>
                <Text style={styles.statLabel}>Citations</Text>
              </View>
            </View>
            {departmentName && (
              <View style={styles.departmentContainer}>
                <Text style={styles.departmentText}>Department: {departmentName}</Text>
              </View>
            )}
          </View>

          {/* Section 2: Topic Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.sectionHeader}>Description</Text>
            <Text style={styles.descriptionText}>{description}</Text>

            {keywords && keywords.length > 0 && (
              <>
                <Text style={styles.sectionHeader}>Keywords</Text>
                <View style={styles.keywordsContainer}>
                  {keywords.map((word, index) => (
                    <View key={index} style={styles.keywordChip}>
                      <Text style={styles.keywordText}>{word}</Text>
                    </View>
                  ))}
                </View>
              </>
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
    borderRadius: 8,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.m,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: RFValue(20),
    fontFamily: 'Montserrat',
    color: colors.darkblue,
  },
  statLabel: {
    fontSize: RFValue(14),
    color: colors.secondary,
    marginTop: 4,
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
    borderRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: RFValue(sizes.h2),
    fontFamily: 'Montserrat',
    color: colors.secondary,
    marginBottom: spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: spacing.s,
  },
  descriptionText: {
    fontSize: RFValue(16),
    fontFamily: 'Montserrat',
    color: colors.secondary,
    lineHeight: 22,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.m,
  },
  keywordChip: {
    backgroundColor: colors.primaryBis,
    borderRadius: 16,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s / 2,
    margin: spacing.xs,
  },
  keywordText: {
    fontSize: RFValue(12),
    fontFamily: 'Montserrat',
    color: colors.lightOrange,
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
