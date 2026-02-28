import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Provider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RFValue } from "react-native-responsive-fontsize";
import LottieView from 'lottie-react-native';
import { colors, sizes, spacing } from '@shared/config/theme';

import citationIcon from '@assets/Virtual_lab_icons/citation.png';
import worksIcon from '@assets/Virtual_lab_icons/works.png';

const { width, height } = Dimensions.get('window');

const SearchTopicResult = ({ route }) => {
  // Expecting route.params.topicId to be a full OpenAlex URL, e.g., "https://openalex.org/T11577"
  const { topicId } = route.params;
  const navigation = useNavigation();
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract the OpenAlex ID from the full URL.
  const extractTopicId = (id) => {
    if (id) {
      const parts = id.split('/');
      return parts[parts.length - 1];
    }
    return id;
  };

  // Use the extracted id for navigation
  const openAlexId = extractTopicId(topicId);

  // Animated header variables.
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
    const fetchTopicData = async () => {
      try {
        const res = await fetch(`https://api.openalex.org/topics/${openAlexId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch topic details');
        }
        const data = await res.json();
        setTopicData(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTopicData();
  }, [openAlexId]);

  // Add a 20-second timeout.
  useEffect(() => {
    const timeoutTimer = setTimeout(() => {
      if (!topicData) {
        Alert.alert("Error", "Loading took too long, please try again later.", [
          { text: "OK", onPress: () => navigation.navigate('BottomNav') }
        ]);
      }
    }, 20000);
    return () => clearTimeout(timeoutTimer);
  }, [topicData, navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('@assets/Loader/loader.json')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }
  if (error || !topicData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error || 'Topic not found'}</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  // Destructure fields from OpenAlex topic data.
  const { display_name, description, works_count, cited_by_count, keywords } = topicData;
  // For the horizontal citation gauge, we assume a maximum of 8,000,000 citations.
  const citationFill = topicData ? (cited_by_count / 8000000) * 100 : 0;

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
              adjustsFontSizeToFit
              minimumFontScale={0.5}
            >
              {display_name}
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
          <View style={styles.overviewContainer}>
            {/* Horizontal Citation Gauge */}
            <View style={styles.citationGaugeWrapper}>
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
            </View>
            {/* Works Statistic Button */}
            <View style={styles.buttonsRow}>
              <TouchableOpacity 
                style={styles.statButton} 
                onPress={() => navigation.navigate('WorksListScreen', { topicId: openAlexId })}
              >
                <Image source={worksIcon} style={styles.statButtonIcon} resizeMode="contain" />
                <Text style={styles.statButtonLabel}>Works</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            {/* Description Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionHeader}>Description</Text>
              <Text style={styles.descriptionText}>
                {description || "No description available."}
              </Text>
            </View>
            {/* Keywords Section */}
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
  horizontalGaugeContainer: {
    flex: 1,
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
  lottie: {
    width: width * 0.8,
    height: width * 0.8,
  },
});

export default SearchTopicResult;
