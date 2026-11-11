import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { IconButton, Dialog, Portal } from 'react-native-paper';
import { Slider } from '@miblanchard/react-native-slider';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, fonts, layout, sizes, spacing, typography } from '@shared/config/theme';
import { openAlex, OPTIONAL_REQUEST_TIMEOUT_MS } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import AppButton from '@shared/components/AppButton';
import BackButton, { BACK_BUTTON_SIZE } from '@shared/components/BackButton';

const PER_PAGE = 50;
// OpenAlex basic paging only serves the first 10,000 results.
const MAX_PAGES = Math.floor(10000 / PER_PAGE);
const START_YEAR = 1990;
const YEARS = Array.from(
  { length: new Date().getFullYear() - START_YEAR + 1 },
  (_, i) => START_YEAR + i
);

const DEFAULT_FILTERS = {
  isOa: true,
  minCited: 0,
  hasAbstract: true,
  englishOnly: true,
  year: 2024,
};

const nextIcon = require('@assets/Discover_icons/next.png');

const buildFilterString = (topicId, filters) => {
  const parts = [`primary_topic.id:${topicId}`];
  if (filters.isOa) parts.push('is_oa:true');
  if (filters.minCited > 0) parts.push(`cited_by_count:>${filters.minCited}`);
  if (filters.hasAbstract) parts.push('has_abstract:true');
  if (filters.englishOnly) parts.push('language:en');
  if (filters.year) parts.push(`from_publication_date:${filters.year}-01-01`);
  return parts.join(',');
};

const describeFilters = (filters) => {
  const labels = [];
  if (filters.isOa) labels.push('Open Access');
  if (filters.minCited > 0) labels.push(`Min Cited: ${filters.minCited.toLocaleString()}`);
  if (filters.hasAbstract) labels.push('Has Abstract');
  if (filters.englishOnly) labels.push('English Only');
  if (filters.year) labels.push(`Published since: ${filters.year}`);
  return labels.length > 0 ? labels.join('\n') : 'No filters applied';
};

// Selected options are blue (accent); unselected ones are light outlined pills.
const OptionButton = ({ selected, style, ...props }) => (
  <AppButton
    variant={selected ? 'accent' : 'secondary'}
    size="medium"
    style={[style, !selected && styles.optionUnselected]}
    {...props}
  />
);

const ToggleRow = ({ label, value, onToggle }) => (
  <View style={styles.filterRow}>
    <Text style={styles.filterLabel}>{label}</Text>
    <OptionButton selected={value} onPress={onToggle} style={styles.toggleButton}>
      {value ? 'Yes' : 'No'}
    </OptionButton>
  </View>
);

const WorkCard = React.memo(({ work, onExplore }) => {
  const firstAuthor = work.authorships?.[0]?.author?.display_name;
  return (
    <View style={styles.workCard}>
      <Text style={styles.cardTitle}>{work.display_name}</Text>
      {!!firstAuthor && <Text style={styles.cardSubtitle}>{firstAuthor}</Text>}
      <Text style={styles.workInfo}>Year: {work.publication_year}</Text>
      <Text style={styles.workInfo}>
        Cited: {Number(work.cited_by_count || 0).toLocaleString()}
      </Text>
      <Text style={styles.workInfo}>
        Status: {work.open_access ? work.open_access.oa_status : 'closed'}
      </Text>
      <AppButton
        variant="primary"
        size="medium"
        iconPosition="right"
        onPress={() => onExplore(work.id)}
        icon={nextIcon}
        style={styles.exploreButton}
      >
        Explore
      </AppButton>
    </View>
  );
});

const WorksListScreen = ({ route }) => {
  // OpenAlex topic id, e.g. "T11881"
  const { topicId } = route.params;
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [works, setWorks] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const yearScrollRef = useRef(null);

  useEffect(() => {
    let active = true;
    // The topic name is only a header label; the list falls back to "Works" without it.
    openAlex
      .get(`/topics/${encodeURIComponent(topicId)}`, { timeout: OPTIONAL_REQUEST_TIMEOUT_MS })
      .then(({ data }) => {
        if (active) setTopicName(data?.display_name || '');
      })
      .catch(err => console.warn('Failed to fetch topic details:', err?.message));
    return () => { active = false; };
  }, [topicId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    openAlex
      .get('/works', {
        params: {
          filter: buildFilterString(topicId, appliedFilters),
          per_page: PER_PAGE,
          page: currentPage,
        },
      })
      .then(({ data }) => {
        if (!active) return;
        setWorks(Array.isArray(data?.results) ? data.results : []);
        setTotalCount(data?.meta?.count || 0);
      })
      .catch((err) => {
        console.error('Failed to fetch works:', err);
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [topicId, appliedFilters, currentPage, reloadKey]);

  const totalPages = Math.min(MAX_PAGES, Math.ceil(totalCount / PER_PAGE));

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFilterVisible(true);
  };

  const updateDraft = (changes) => setDraftFilters(prev => ({ ...prev, ...changes }));

  const handleApplyFilters = () => {
    setFilterVisible(false);
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
  };

  const handleExplore = useCallback((workId) => {
    const shortId = String(workId).split('/').pop();
    navigation.navigate('OpenAlexDetailsScreen', { workId: shortId });
  }, [navigation]);

  const renderWork = useCallback(
    ({ item }) => <WorkCard work={item} onExplore={handleExplore} />,
    [handleExplore]
  );

  const retryWorks = useCallback(() => setReloadKey(key => key + 1), []);

  const renderBody = () => {
    if (loading) {
      return <Loader backgroundColor={colors.background} />;
    }
    if (error) {
      return (
        <ErrorState
          error={error}
          onRetry={retryWorks}
          fallbackMessage="We couldn't load the research works."
        />
      );
    }
    return (
      <FlatList
        data={works}
        keyExtractor={(item) => item.id}
        renderItem={renderWork}
        contentContainerStyle={styles.listContent}
        initialNumToRender={6}
        ListEmptyComponent={
          <StateMessage
            icon="document-text-outline"
            title="No works found"
            message="Try relaxing the filters to see more results."
            actionLabel="Edit filters"
            onAction={openFilters}
          />
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBanner, { paddingTop: insets.top }]}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText} numberOfLines={2} ellipsizeMode="tail">
            {topicName || 'Works'}
          </Text>
        </View>
        <View style={styles.filterSection}>
          <View style={styles.filterLeft}>
            <IconButton
              icon="filter"
              size={24}
              onPress={openFilters}
              iconColor={colors.accent}
              style={styles.filterIcon}
              accessibilityLabel="Edit filters"
            />
            <Text style={styles.filterText}>{describeFilters(appliedFilters)}</Text>
          </View>
          <Text style={styles.totalCountText}>
            Total: {Number(totalCount).toLocaleString()}
          </Text>
        </View>
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <Portal>
        <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Filter</Dialog.Title>
          <Dialog.Content>
            <ToggleRow
              label="Only Open Access"
              value={draftFilters.isOa}
              onToggle={() => updateDraft({ isOa: !draftFilters.isOa })}
            />
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>
                Minimum Cited Count: {draftFilters.minCited.toLocaleString()}
              </Text>
            </View>
            <Slider
              value={[draftFilters.minCited]}
              onValueChange={(value) => updateDraft({ minCited: value[0] })}
              minimumValue={0}
              maximumValue={50}
              step={1}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              trackStyle={styles.sliderTrack}
              thumbStyle={styles.sliderThumb}
            />
            <ToggleRow
              label="Must Have Abstract"
              value={draftFilters.hasAbstract}
              onToggle={() => updateDraft({ hasAbstract: !draftFilters.hasAbstract })}
            />
            <ToggleRow
              label="Only English"
              value={draftFilters.englishOnly}
              onToggle={() => updateDraft({ englishOnly: !draftFilters.englishOnly })}
            />
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Published since</Text>
            </View>
            <ScrollView
              ref={yearScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.yearScroll}
              contentContainerStyle={styles.yearScrollContent}
              onContentSizeChange={() => yearScrollRef.current?.scrollToEnd({ animated: false })}
            >
              {YEARS.map(year => (
                <OptionButton
                  key={year}
                  selected={draftFilters.year === year}
                  onPress={() => updateDraft({ year })}
                >
                  {year}
                </OptionButton>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <AppButton variant="link" size="medium" onPress={() => setDraftFilters(DEFAULT_FILTERS)}>
              Clear
            </AppButton>
            <AppButton variant="link" size="medium" onPress={() => setFilterVisible(false)}>
              Cancel
            </AppButton>
            <AppButton variant="primary" size="medium" onPress={handleApplyFilters}>
              Apply
            </AppButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.body}>{renderBody()}</View>

      <View style={[styles.paginationBar, { paddingBottom: insets.bottom }]}>
        <View style={styles.paginationContent}>
          <IconButton
            onPress={() => setCurrentPage(page => Math.max(1, page - 1))}
            icon="page-previous-outline"
            disabled={loading || currentPage === 1}
            size={32}
            iconColor={colors.text}
            accessibilityLabel="Previous page"
          />
          <Text style={styles.paginationText}>
            Page {currentPage.toLocaleString()}{totalPages ? ` / ${totalPages.toLocaleString()}` : ''}
          </Text>
          <IconButton
            onPress={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
            disabled={loading || !totalPages || currentPage >= totalPages}
            icon="page-next-outline"
            size={32}
            iconColor={colors.text}
            accessibilityLabel="Next page"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  body: {
    flex: 1,
  },
  topBanner: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerContainer: {
    ...contentWidth,
    minHeight: BACK_BUTTON_SIZE + spacing.s,
    justifyContent: 'center',
    // Leaves room for the back button on both sides so the centered title never runs under it.
    paddingHorizontal: spacing.s + BACK_BUTTON_SIZE + spacing.s,
    paddingTop: spacing.s,
    paddingBottom: spacing.m,
  },
  headerText: {
    ...typography.h2,
    textAlign: 'center',
  },
  filterSection: {
    ...contentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.s,
    paddingRight: spacing.m,
    paddingLeft: spacing.s,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.xs,
  },
  filterText: {
    ...typography.caption,
    flexShrink: 1,
  },
  totalCountText: {
    ...typography.caption,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'right',
  },
  listContent: {
    ...contentWidth,
    flexGrow: 1,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.l,
  },
  workCard: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  cardTitle: {
    ...typography.h3,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    marginTop: spacing.xs,
    marginBottom: spacing.s,
  },
  workInfo: {
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  exploreButton: {
    alignSelf: 'flex-end',
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
  dialogActions: {
    paddingBottom: spacing.m,
  },
  filterLabel: {
    ...typography.bodySmall,
    color: colors.text,
    flexShrink: 1,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.s,
    marginVertical: spacing.s,
  },
  toggleButton: {
    minWidth: 88,
  },
  optionUnselected: {
    borderColor: colors.border,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    height: 20,
    width: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
  },
  yearScroll: {
    marginVertical: spacing.s,
  },
  yearScrollContent: {
    gap: spacing.s,
  },
  paginationBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  paginationContent: {
    ...contentWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
  paginationText: {
    ...typography.bodySmall,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },
});

export default WorksListScreen;
