import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { Button, IconButton, Dialog, Portal, Card } from 'react-native-paper';
import { Slider } from '@miblanchard/react-native-slider';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '@shared/config/theme';
import { openAlex, getErrorMessage } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

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

const ToggleRow = ({ label, value, onToggle }) => (
  <View style={styles.filterRow}>
    <Text style={styles.filterLabel}>{label}</Text>
    <Button
      mode={value ? 'contained' : 'outlined'}
      onPress={onToggle}
      style={styles.toggleButton}
      buttonColor={value ? colors.secondary : undefined}
      textColor={value ? colors.primary : colors.secondary}
    >
      {value ? 'Yes' : 'No'}
    </Button>
  </View>
);

const WorkCard = React.memo(({ work, onExplore }) => {
  const firstAuthor = work.authorships?.[0]?.author?.display_name;
  return (
    <Card style={styles.workCard}>
      <Card.Content>
        <Text style={styles.cardTitle}>{work.display_name}</Text>
        {!!firstAuthor && <Text style={styles.cardSubtitle}>{firstAuthor}</Text>}
        <Text style={styles.workInfo}>Year: {work.publication_year}</Text>
        <Text style={styles.workInfo}>
          Cited: {Number(work.cited_by_count || 0).toLocaleString()}
        </Text>
        <Text style={styles.workInfo}>
          Status: {work.open_access ? work.open_access.oa_status : 'closed'}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="contained"
          onPress={() => onExplore(work.id)}
          buttonColor={colors.lightOrange}
          icon={nextIcon}
          contentStyle={styles.exploreButtonContent}
          labelStyle={styles.exploreButtonLabel}
          style={styles.exploreButton}
        >
          Explore
        </Button>
      </Card.Actions>
    </Card>
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
    openAlex
      .get(`/topics/${encodeURIComponent(topicId)}`)
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
        if (active) setError(getErrorMessage(err, 'Unable to load research works.'));
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
    navigation.navigate('OpenAlexDetailsScreen', { articleId: shortId });
  }, [navigation]);

  const renderWork = useCallback(
    ({ item }) => <WorkCard work={item} onExplore={handleExplore} />,
    [handleExplore]
  );

  const renderBody = () => {
    if (loading) {
      return <Loader size={150} backgroundColor={colors.primaryBis} />;
    }
    if (error) {
      return (
        <StateMessage
          icon="cloud-offline-outline"
          title="Couldn't load works"
          message={error}
          actionLabel="Try again"
          onAction={() => setReloadKey(key => key + 1)}
        />
      );
    }
    return (
      <FlatList
        data={works}
        keyExtractor={(item) => item.id}
        renderItem={renderWork}
        contentContainerStyle={styles.scrollContainer}
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
      <View style={[styles.TopBanner, { paddingTop: insets.top }]}>
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
              iconColor={colors.lightOrange}
              style={styles.filterIcon}
              accessibilityLabel="Edit filters"
            />
            <Text style={styles.filterText}>{describeFilters(appliedFilters)}</Text>
          </View>
          <Text style={styles.totalCountText}>
            Total: {Number(totalCount).toLocaleString()}
          </Text>
        </View>
      </View>

      <Portal>
        <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)}>
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
              onContentSizeChange={() => yearScrollRef.current?.scrollToEnd({ animated: false })}
            >
              {YEARS.map(year => (
                <Button
                  key={year}
                  mode={draftFilters.year === year ? 'contained' : 'outlined'}
                  onPress={() => updateDraft({ year })}
                  style={styles.yearButton}
                  buttonColor={draftFilters.year === year ? colors.secondary : colors.primary}
                  textColor={draftFilters.year === year ? colors.primary : colors.secondary}
                >
                  {year}
                </Button>
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDraftFilters(DEFAULT_FILTERS)} textColor={colors.red}>Clear</Button>
            <Button onPress={() => setFilterVisible(false)} textColor={colors.secondary}>Cancel</Button>
            <Button onPress={handleApplyFilters} textColor={colors.darkGreen}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <View style={styles.body}>{renderBody()}</View>

      <View style={[styles.paginationContainer, { paddingBottom: spacing.s + insets.bottom }]}>
        <IconButton
          onPress={() => setCurrentPage(page => Math.max(1, page - 1))}
          icon="page-previous-outline"
          disabled={loading || currentPage === 1}
          size={32}
          iconColor={colors.secondary}
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
          iconColor={colors.secondary}
          accessibilityLabel="Next page"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  body: {
    flex: 1,
  },
  TopBanner: {
    elevation: 5,
    backgroundColor: colors.primary,
  },
  headerContainer: {
    padding: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: sizes.h2,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.m,
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderTopWidth: 1,
    borderTopColor: colors.secondary,
  },
  filterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterIcon: {
    marginRight: spacing.s,
  },
  filterText: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.secondary,
  },
  totalCountText: {
    fontSize: sizes.h4,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    textAlign: 'right',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  workCard: {
    marginBottom: spacing.l,
    elevation: 3,
    borderRadius: sizes.radius,
    backgroundColor: colors.lightGreen,
  },
  cardTitle: {
    fontFamily: 'MontserratBold',
    color: colors.primary,
    fontSize: sizes.h3,
    flexWrap: 'wrap',
  },
  cardSubtitle: {
    fontFamily: 'MontserratBold',
    color: colors.primary,
    flexWrap: 'wrap',
    fontStyle: 'italic',
    marginBottom: spacing.m,
  },
  workInfo: {
    fontFamily: 'Montserrat',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  exploreButton: {
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
  filterLabel: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    marginBottom: spacing.s,
    color: colors.secondary,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.s,
  },
  toggleButton: {
    width: 80,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: colors.lightGray,
  },
  sliderThumb: {
    height: 20,
    width: 20,
    backgroundColor: colors.secondary,
    borderRadius: 10,
  },
  yearButton: {
    paddingHorizontal: spacing.s,
    minWidth: 60,
    marginRight: spacing.s,
    borderRadius: sizes.buttonRadius,
  },
  yearScroll: {
    marginVertical: spacing.s,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.s,
    elevation: 5,
    backgroundColor: colors.primary,
  },
  paginationText: {
    fontSize: sizes.h4,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    textAlign: 'center',
  },
  dialogTitle: {
    fontSize: sizes.h2,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
});

export default WorksListScreen;
