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
import { colors, sizes, spacing } from '../../theme';

const { width, height } = Dimensions.get('window');

const SearchTopicResult = ({ route }) => {
  // Expecting route.params.topicId to be something like "https://openalex.org/T11577"
  const { topicId } = route.params;
  const navigation = useNavigation();
  const [topicData, setTopicData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract the OpenAlex ID (e.g., "T11577") from the full URL.
  const extractTopicId = (id) => {
    if (id) {
      const parts = id.split('/');
      return parts[parts.length - 1];
    }
    return id;
  };

  const openAlexId = extractTopicId(topicId);

  // Animated header variables
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00aaff" />
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

  // Destructure the fields from the OpenAlex topic data.
  const { display_name, description, works_count, cited_by_count } = topicData;

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
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.sectionHeader}>Description</Text>
            <Text style={styles.descriptionText}>
              {description || "No description available."}
            </Text>
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

export default SearchTopicResult;
