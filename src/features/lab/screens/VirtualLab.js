import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors, sizes, spacing } from '@shared/config/theme';
import InfoIcon from '@assets/Virtual_lab_icons/info_icon.png';
import ActivityImage from '@assets/Virtual_lab_icons/activity.png';
import ImpactImage from '@assets/Virtual_lab_icons/impact.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import departments from '@shared/data/departments';
import { Modal, Portal, Button, Searchbar } from 'react-native-paper';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { RFValue } from 'react-native-responsive-fontsize';
import { api, getErrorMessage } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import departmentImages from '@features/lab/data/departmentImages';

const { width, height } = Dimensions.get('window');

// Fixed reference scales for the gauges (topic activity / impact).
const MAX_ACTIVITY = 9000;
const MAX_IMPACT = 2000;
const GAUGE_SIZE = width * 0.35;
const nextIcon = require('@assets/Discover_icons/next.png');

const toFill = (value, max) => Math.min(100, Math.max(0, ((Number(value) || 0) / max) * 100));

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const TopicCard = React.memo(({ topic, onPress }) => {
  const handlePress = () => onPress(topic._id);
  return (
    <View style={styles.topicContainer}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} accessibilityRole="button">
        <Text style={styles.topicName} numberOfLines={3} ellipsizeMode="tail">
          {topic.name}
        </Text>
        <View style={styles.gaugeRow}>
          <View style={styles.gaugeContainer}>
            <AnimatedCircularProgress
              size={GAUGE_SIZE}
              width={10}
              fill={toFill(topic.activity, MAX_ACTIVITY)}
              tintColor={colors.lightTeal}
              backgroundColor={colors.primaryBis}
              rotation={-115}
              arcSweepAngle={230}
              lineCap="round"
            >
              {() => <Image source={ActivityImage} style={styles.gaugeIcon} resizeMode="contain" />}
            </AnimatedCircularProgress>
          </View>
          <View style={styles.gaugeContainer}>
            <AnimatedCircularProgress
              size={GAUGE_SIZE}
              width={10}
              fill={toFill(topic.impact, MAX_IMPACT)}
              tintColor={colors.darkTeal}
              backgroundColor={colors.primaryBis}
              rotation={-115}
              arcSweepAngle={230}
              lineCap="round"
            >
              {() => <Image source={ImpactImage} style={styles.gaugeIcon} resizeMode="contain" />}
            </AnimatedCircularProgress>
          </View>
        </View>
      </TouchableOpacity>
      <Button
        mode="contained"
        onPress={handlePress}
        buttonColor={colors.darkGreen}
        contentStyle={styles.exploreButtonContent}
        icon={nextIcon}
        labelStyle={styles.exploreButtonLabel}
        style={styles.exploreButton}
      >
        Explore
      </Button>
    </View>
  );
});

const VirtualLab = ({ route }) => {
  const { labId, labDisplayName } = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [infoVisible, setInfoVisible] = useState(false);
  const departmentImageSource =
    departmentImages[labId] || departmentImages[labDisplayName] || null;

  const scrollY = useRef(new Animated.Value(0)).current;
  const initialHeaderHeight = height / 4 + insets.top;
  const minHeaderHeight = height / 9 + insets.top;
  const headerShrinkRange = initialHeaderHeight - minHeaderHeight;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [initialHeaderHeight, minHeaderHeight],
    extrapolate: 'clamp',
  });
  const imageSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [80, 40],
    extrapolate: 'clamp',
  });
  const titleFontSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [RFValue(sizes.h2), RFValue(sizes.h3)],
    extrapolate: 'clamp',
  });
  const infoIconSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [RFValue(30), RFValue(20)],
    extrapolate: 'clamp',
  });

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/topic/department/${encodeURIComponent(labId)}`);
      if (isMounted.current) setTopics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching topics:', err);
      if (isMounted.current) setError(getErrorMessage(err, 'Unable to load the topics of this lab.'));
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, [labId]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleTopicPress = useCallback((topicId) => {
    navigation.navigate('TopicDetailScreen', { topicId });
  }, [navigation]);

  const departmentDescription = useMemo(() => {
    const department = departments.find(
      (dep) =>
        dep.display.toLowerCase() === labDisplayName?.toLowerCase() ||
        dep.name.toLowerCase() === labId?.toLowerCase()
    );
    return department?.description || 'Description not available.';
  }, [labId, labDisplayName]);

  const filteredTopics = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return topics;
    return topics.filter(topic => topic.name?.toLowerCase().includes(query));
  }, [topics, searchQuery]);

  const renderTopic = useCallback(
    ({ item }) => <TopicCard topic={item} onPress={handleTopicPress} />,
    [handleTopicPress]
  );

  if (isLoading) {
    return <Loader size={200} backgroundColor={colors.primaryBis} />;
  }

  if (error) {
    return (
      <View style={[styles.container, styles.bottomSection, { paddingTop: insets.top }]}>
        <StateMessage
          icon="cloud-offline-outline"
          title="Couldn't load this lab"
          message={error}
          actionLabel="Try again"
          onAction={fetchTopics}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedLinearGradient
        colors={[colors.secondary, colors.primaryBis]}
        style={[styles.topSection, { height: headerHeight, paddingTop: spacing.m + insets.top }]}
      >
        <View style={styles.headerContent}>
          {departmentImageSource && (
            <Animated.Image
              source={departmentImageSource}
              style={[styles.departmentImage, { width: imageSize, height: imageSize }]}
              resizeMode="contain"
            />
          )}
          <Animated.Text
            style={[styles.labTitle, { fontSize: titleFontSize, flexShrink: 1 }]}
            adjustsFontSizeToFit={true}
            minimumFontScale={0.5}
            numberOfLines={3}
          >
            {labDisplayName || 'Virtual Laboratory'}
          </Animated.Text>
        </View>
        <View style={styles.topRightButtons}>
          <TouchableOpacity
            onPress={() => setInfoVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="About this department"
          >
            <Animated.Image
              source={InfoIcon}
              style={[styles.topRightIcon, { width: infoIconSize, height: infoIconSize }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </AnimatedLinearGradient>

      <Animated.FlatList
        style={styles.bottomSection}
        contentContainerStyle={{ paddingTop: initialHeaderHeight, paddingBottom: spacing.l + insets.bottom }}
        data={filteredTopics}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderTopic}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={4}
        windowSize={7}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        ListHeaderComponent={
          <Searchbar
            placeholder="Search topics..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
          />
        }
        ListEmptyComponent={
          topics.length === 0 ? (
            <StateMessage
              icon="flask-outline"
              title="No topics yet"
              message="This lab doesn't have any topics yet. Come back later!"
              actionLabel="Refresh"
              onAction={fetchTopics}
            />
          ) : (
            <StateMessage
              icon="search-outline"
              title="No matching topics"
              message={`No topic matches "${searchQuery.trim()}".`}
            />
          )
        }
      />

      <Portal>
        <Modal
          visible={infoVisible}
          onDismiss={() => setInfoVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>{labDisplayName} Department</Text>
          <Text style={styles.modalDescription}>{departmentDescription}</Text>
          <Button
            mode="contained"
            onPress={() => setInfoVisible(false)}
            style={styles.modalButton}
            buttonColor={colors.secondary}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    zIndex: 1000,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', // vertically centered
    justifyContent: 'center', // centers the row horizontally
  },
  departmentImage: {
    marginRight: spacing.m,
  },
  labTitle: {
    color: colors.primary,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  topRightButtons: {
    position: 'absolute',
    right: spacing.m,
    bottom: spacing.m, // placed at the bottom right of the header
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRightIcon: {
    tintColor: colors.primary,
  },
  bottomSection: {
    backgroundColor: colors.primaryBis,
  },
  searchBar: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.m,
    backgroundColor: colors.primary,
  },
  topicContainer: {
    backgroundColor: 'white',
    marginHorizontal: spacing.m,
    marginBottom: spacing.l,
    padding: spacing.m,
    borderRadius: sizes.radius,
    elevation: 5,
  },
  topicName: {
    fontSize: RFValue(20),
    color: colors.secondary,
    fontFamily: 'Montserrat',
    marginBottom: spacing.s,
  },
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.m,
    marginBottom: -spacing.l,
  },
  gaugeContainer: {
    alignItems: 'center',
  },
  gaugeIcon: {
    width: RFValue(48),
    height: RFValue(48),
  },
  exploreButton: {
    marginTop: spacing.m,
    marginHorizontal: spacing.xs,
    borderRadius: sizes.buttonRadius,
  },
  exploreButtonContent: {
    flexDirection: 'row-reverse',
  },
  exploreButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 18,
    margin: 18,
    borderRadius: sizes.radius,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: RFValue(sizes.h1),
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: RFValue(16),
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  modalButton: {
    marginTop: spacing.m,
    alignSelf: 'stretch',
  },
});

export default VirtualLab;
