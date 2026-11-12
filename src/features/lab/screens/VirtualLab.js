import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Dialog, Portal } from 'react-native-paper';
import {
  colors,
  contentWidth,
  fonts,
  labColors,
  layout,
  sizes,
  spacing,
  typography,
} from '@shared/config/theme';
import departments from '@shared/data/departments';
import { api } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';
import AppButton from '@shared/components/AppButton';
import PressableScale from '@shared/components/PressableScale';
import LabDisc from '@features/lab/components/LabDisc';
import LABS from '@features/lab/data/labMeta';
import departmentImages from '@features/lab/data/departmentImages';
import { formatCount, rankTopics } from '@features/lab/utils/labTopics';

const DISC_UNIT = 42;
const SIZE_RING = 46;
const SIZE_DOT_MIN = 8;
const SIZE_DOT_MAX = 34;

const Stat = ({ icon, value }) => (
  <View style={styles.stat}>
    <Ionicons name={icon} size={16} color={colors.textSecondary} />
    <Text style={styles.statText}>{value}</Text>
  </View>
);

const TopicRow = React.memo(({ topic, level, palette, index, onPress }) => {
  const dot = SIZE_DOT_MIN + (SIZE_DOT_MAX - SIZE_DOT_MIN) * level;
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 45).duration(320)}
      style={styles.rowWrap}
    >
      <PressableScale
        style={styles.row}
        onPress={() => onPress(topic._id)}
        accessibilityRole="button"
        accessibilityLabel={topic.name}
      >
        <View style={[styles.sizeRing, { backgroundColor: palette.island, borderColor: palette.rim }]}>
          <View
            style={{
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: palette.side,
            }}
          />
        </View>
        <Text style={styles.rowName} numberOfLines={3}>
          {topic.name}
        </Text>
        {topic.castCount > 0 ? <Stat icon="play-circle-outline" value={topic.castCount} /> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </PressableScale>
    </Animated.View>
  );
});

const VirtualLab = ({ route }) => {
  const { labId, labDisplayName, works12m } = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const region = LABS.find((lab) => lab.name === labId)?.region || 'science';
  const palette = labColors.regions[region];

  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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

  const handleTopicPress = useCallback(
    (topicId) => navigation.navigate('TopicDetailScreen', { topicId }),
    [navigation]
  );

  const ranked = useMemo(() => rankTopics(topics), [topics]);
  const castTotal = useMemo(
    () => topics.reduce((sum, topic) => sum + (Number(topic.castCount) || 0), 0),
    [topics]
  );
  const departmentDescription = useMemo(() => {
    const department = departments.find((dep) => dep.name === labId);
    return department?.description || '';
  }, [labId]);

  const renderTopic = useCallback(
    ({ item, index }) => (
      <TopicRow
        topic={item.topic}
        level={item.level}
        palette={palette}
        index={index}
        onPress={handleTopicPress}
      />
    ),
    [handleTopicPress, palette]
  );

  const backButton = <BackButton onPress={() => navigation.goBack()} style={styles.backButton} />;

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
        {backButton}
      </View>
    );
  }

  const header = (
    <View style={[styles.hero, { backgroundColor: palette.island, paddingTop: insets.top + spacing.l }]}>
      <LabDisc
        unit={DISC_UNIT}
        region={region}
        icon={departmentImages[labId]}
        active={topics.length > 0}
        dot={castTotal > 0}
      />
      <Text style={styles.title} adjustsFontSizeToFit numberOfLines={2} minimumFontScale={0.7}>
        {labDisplayName || 'Virtual Laboratory'}
      </Text>
      <View style={styles.stats}>
        {works12m ? <Stat icon="document-text-outline" value={formatCount(works12m)} /> : null}
        <Stat icon="layers-outline" value={topics.length} />
        <Stat icon="play-circle-outline" value={castTotal} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={ranked}
        keyExtractor={(item) => String(item.topic._id)}
        renderItem={renderTopic}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.listContent, { paddingBottom: spacing.l + insets.bottom }]}
        initialNumToRender={8}
        windowSize={7}
        ListEmptyComponent={
          <StateMessage icon="flask-outline" title="No topics yet" compact style={styles.empty} />
        }
      />
      {backButton}
      {!!departmentDescription && (
        <TouchableOpacity
          style={[styles.infoButton, { top: insets.top + spacing.s }]}
          onPress={() => setInfoVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="About this lab"
        >
          <Ionicons name="information-circle-outline" size={26} color={colors.text} />
        </TouchableOpacity>
      )}

      <Portal>
        <Dialog visible={infoVisible} onDismiss={() => setInfoVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>{labDisplayName}</Dialog.Title>
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
  listContent: {
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.l,
    marginBottom: spacing.m,
    borderBottomLeftRadius: sizes.radius * 1.5,
    borderBottomRightRadius: sizes.radius * 1.5,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginTop: -spacing.m,
    maxWidth: layout.maxContentWidth,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.s,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontFamily: fonts.bold,
    fontSize: sizes.h4,
    color: colors.textSecondary,
  },
  rowWrap: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.s + spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.s + spacing.xs,
    paddingHorizontal: spacing.m,
  },
  sizeRing: {
    width: SIZE_RING,
    height: SIZE_RING,
    borderRadius: SIZE_RING / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: {
    ...typography.body,
    fontFamily: fonts.bold,
    flex: 1,
  },
  empty: {
    paddingVertical: spacing.xl,
  },
  backButton: {
    zIndex: 10,
  },
  infoButton: {
    position: 'absolute',
    right: spacing.s,
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
