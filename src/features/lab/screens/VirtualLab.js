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
import { colors, contentWidth, fonts, layout, scale, sizes, spacing, typography } from '@shared/config/theme';
import InfoIcon from '@assets/Virtual_lab_icons/info_icon.png';
import ActivityImage from '@assets/Virtual_lab_icons/activity.png';
import ImpactImage from '@assets/Virtual_lab_icons/impact.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import departments from '@shared/data/departments';
import { Dialog, Portal } from 'react-native-paper';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { api } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';
import AppButton from '@shared/components/AppButton';
import SearchField from '@shared/components/SearchField';
import departmentImages from '@features/lab/data/departmentImages';

const { width, height } = Dimensions.get('window');

// Fixed reference scales for the gauges (topic activity / impact).
const MAX_ACTIVITY = 9000;
const MAX_IMPACT = 2000;
const GAUGE_SIZE = Math.min(width * 0.35, 160);
const INITIAL_HEADER_HEIGHT = Math.min(height / 4, 260);
const MIN_HEADER_HEIGHT = Math.min(height / 9, 110);
const INFO_ICON_SIZE = 26;
const HEADER_BUTTON_SIZE = 44;
const nextIcon = require('@assets/Discover_icons/next.png');

const toFill = (value, max) => Math.min(100, Math.max(0, ((Number(value) || 0) / max) * 100));

const TopicCard = React.memo(({ topic, onPress }) => {
  const handlePress = () => onPress(topic._id);
  return (
    <View style={styles.topicCard}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} accessibilityRole="button">
        <Text style={styles.topicName} numberOfLines={3} ellipsizeMode="tail">
          {topic.name}
        </Text>
        <View style={styles.gaugeRow}>
          <AnimatedCircularProgress
            size={GAUGE_SIZE}
            width={10}
            fill={toFill(topic.activity, MAX_ACTIVITY)}
            tintColor={colors.lightTeal}
            backgroundColor={colors.border}
            rotation={-115}
            arcSweepAngle={230}
            lineCap="round"
          >
            {() => <Image source={ActivityImage} style={styles.gaugeIcon} resizeMode="contain" />}
          </AnimatedCircularProgress>
          <AnimatedCircularProgress
            size={GAUGE_SIZE}
            width={10}
            fill={toFill(topic.impact, MAX_IMPACT)}
            tintColor={colors.darkTeal}
            backgroundColor={colors.border}
            rotation={-115}
            arcSweepAngle={230}
            lineCap="round"
          >
            {() => <Image source={ImpactImage} style={styles.gaugeIcon} resizeMode="contain" />}
          </AnimatedCircularProgress>
        </View>
      </TouchableOpacity>
      <AppButton
        variant="primary"
        iconPosition="right"
        fullWidth
        onPress={handlePress}
        icon={nextIcon}
        style={styles.exploreButton}
      >
        Explore
      </AppButton>
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
  const initialHeaderHeight = INITIAL_HEADER_HEIGHT + insets.top;
  const minHeaderHeight = MIN_HEADER_HEIGHT + insets.top;
  const headerShrinkRange = initialHeaderHeight - minHeaderHeight;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [initialHeaderHeight, minHeaderHeight],
    extrapolate: 'clamp',
  });
  const imageSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [scale(80), scale(40)],
    extrapolate: 'clamp',
  });
  const titleFontSize = scrollY.interpolate({
    inputRange: [0, headerShrinkRange],
    outputRange: [sizes.h2, sizes.h3],
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
      if (isMounted.current) setError(err);
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

  const renderBackButton = (tone) => (
    <BackButton tone={tone} onPress={() => navigation.goBack()} style={styles.backButton} />
  );

  if (isLoading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ErrorState
          error={error}
          onRetry={fetchTopics}
          fallbackMessage="We couldn't load the topics of this lab."
          secondaryActionLabel="Back to labs"
          onSecondaryAction={() => navigation.popTo('BottomNav', { screen: 'Lab' })}
        />
        {renderBackButton('default')}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={[colors.secondary, colors.primaryBis]}
          style={[styles.headerGradient, { paddingTop: insets.top + spacing.s }]}
        >
          <View style={styles.headerContent}>
            {departmentImageSource && (
              <Animated.Image
                source={departmentImageSource}
                style={{ width: imageSize, height: imageSize }}
                resizeMode="contain"
              />
            )}
            <Animated.Text
              style={[styles.labTitle, { fontSize: titleFontSize }]}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.5}
              numberOfLines={3}
            >
              {labDisplayName || 'Virtual Laboratory'}
            </Animated.Text>
          </View>
        </LinearGradient>
        {renderBackButton('light')}
        <TouchableOpacity
          style={[styles.infoButton, { top: insets.top + spacing.s + (BACK_BUTTON_SIZE - HEADER_BUTTON_SIZE) / 2 }]}
          onPress={() => setInfoVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="About this department"
        >
          <Image source={InfoIcon} style={styles.infoIcon} resizeMode="contain" />
        </TouchableOpacity>
      </Animated.View>

      <Animated.FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: initialHeaderHeight + spacing.m, paddingBottom: spacing.l + insets.bottom },
        ]}
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
          <SearchField
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
        <Dialog visible={infoVisible} onDismiss={() => setInfoVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>{labDisplayName} Department</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>{departmentDescription}</Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <AppButton variant="link" size="medium" onPress={() => setInfoVisible(false)}>
              Close
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    justifyContent: 'center',
    // Leaves room for the back and info buttons so the centered title never runs under them.
    paddingHorizontal: spacing.s + BACK_BUTTON_SIZE + spacing.s,
    paddingBottom: spacing.s,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.m,
  },
  labTitle: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    color: colors.textOnColor,
    textAlign: 'center',
  },
  backButton: {
    zIndex: 1001,
  },
  infoButton: {
    position: 'absolute',
    right: spacing.m - (HEADER_BUTTON_SIZE - INFO_ICON_SIZE) / 2,
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  infoIcon: {
    width: INFO_ICON_SIZE,
    height: INFO_ICON_SIZE,
    tintColor: colors.textOnColor,
  },
  list: {
    backgroundColor: colors.background,
  },
  listContent: {
    ...contentWidth,
    flexGrow: 1,
    paddingHorizontal: spacing.m,
  },
  searchBar: {
    marginBottom: spacing.m,
  },
  topicCard: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  topicName: {
    ...typography.h3,
  },
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.m,
    // The open bottom of the arcs leaves empty space under the gauges.
    marginBottom: -spacing.l,
  },
  gaugeIcon: {
    width: scale(48),
    height: scale(48),
  },
  exploreButton: {
    marginTop: spacing.m,
  },
  dialog: {
    width: '88%',
    maxWidth: layout.maxContentWidth * 0.8,
    marginHorizontal: 0,
    alignSelf: 'center',
    backgroundColor: colors.surface,
  },
  dialogTitle: {
    ...typography.h2,
    textAlign: 'center',
  },
  dialogText: {
    ...typography.body,
    textAlign: 'center',
  },
  dialogActions: {
    justifyContent: 'center',
    paddingBottom: spacing.m,
  },
});

export default VirtualLab;
