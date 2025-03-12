import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Linking 
} from 'react-native';
import { Button, IconButton, Dialog, Portal, Card } from 'react-native-paper';
import { Slider } from '@miblanchard/react-native-slider';
import { colors, sizes, spacing } from '../theme';

const WorksListScreen = ({ route }) => {
  // Expecting route.params.topicId to be a topic id string (e.g., "T11881")
  const { topicId } = route.params;
  const [works, setWorks] = useState([]);
  const [meta, setMeta] = useState({});
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter dialog visibility
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Filter states (no date filtering)
  // Defaults: open access, has abstract, and language = English are true by default.
  const [filterIsOa, setFilterIsOa] = useState(true);
  const [sliderValue, setSliderValue] = useState(0); // Minimum cited count
  const [filterHasAbstract, setFilterHasAbstract] = useState(true);
  const [filterLanguage, setFilterLanguage] = useState(true); // Only English if true

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const perPage = 50;
  const primaryTopic = topicId; // since topicId already contains the id (e.g., "T11881")

  // Fetch topic details to get the display name.
  useEffect(() => {
    const fetchTopicDetails = async () => {
      try {
        const res = await fetch(`https://api.openalex.org/topics/${topicId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch topic details');
        }
        const data = await res.json();
        setTopicName(data.display_name);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTopicDetails();
  }, [topicId]);

  // Build filter string based on active filters
  const buildFilterString = () => {
    let filters = [`primary_topic.id:${primaryTopic}`];
    if (filterIsOa) {
      filters.push('is_oa:true');
    }
    if (sliderValue > 0) {
      filters.push(`cited_by_count:>${sliderValue}`);
    }
    if (filterHasAbstract) {
      filters.push('has_abstract:true');
    }
    if (filterLanguage) {
      filters.push('language:en');
    }
    return filters.join(',');
  };

  // Fetch works using current filters and page
  const fetchWorks = async () => {
    setLoading(true);
    try {
      const filterString = buildFilterString();
      const url = `https://api.openalex.org/works?filter=${filterString}&per_page=${perPage}&page=${currentPage}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch works');
      }
      const data = await res.json();
      setWorks(data.results);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch works when component mounts and when currentPage changes
  useEffect(() => {
    fetchWorks();
  }, [currentPage]);

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => console.error('Failed opening URL:', err));
  };

  // Apply filters: reset to page 1 and fetch works
  const handleApplyFilters = () => {
    setFilterVisible(false);
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchWorks();
    }
  };

  // Clear all filters (reset to default: open access, has abstract and language = English)
  const clearFilters = () => {
    setFilterIsOa(true);
    setSliderValue(0);
    setFilterHasAbstract(true);
    setFilterLanguage(true);
  };

  // Pagination handlers
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToNextPage = () => {
    if (meta.count && meta.per_page) {
      const totalPages = Math.ceil(meta.count / meta.per_page);
      if (currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    }
  };

  // Compute a string to display active filters (with comma-formatted numbers)
  const appliedFilters = [];
  if (filterIsOa) appliedFilters.push("Open Access");
  if (sliderValue > 0) appliedFilters.push(`Min Cited: ${sliderValue.toLocaleString()}`);
  if (filterHasAbstract) appliedFilters.push("Has Abstract");
  if (filterLanguage) appliedFilters.push("English Only");
  const appliedFiltersText = appliedFilters.length > 0 ? appliedFilters.join(" | ") : "No filters applied";

  // Calculate total pages (if available)
  const totalPages = meta.count && meta.per_page ? Math.ceil(meta.count / meta.per_page) : 0;

  return (
    <View style={styles.container}>
      {/* Header displays the topic name */}
      <View style={styles.TopBanner}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{topicName || 'Works'}</Text>
          <IconButton
            icon="filter"
            size={32}
            onPress={() => setFilterVisible(true)}
            color={colors.lightOrange}
          />
        </View>
        {/* Banner displaying active filters */}
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>
            {appliedFiltersText}
          </Text>
        </View>
      </View>
      {/* Filter Dialog */}
      <Portal>
        <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)}>
          <Dialog.Title style={styles.dialogTitle}>Filter Works</Dialog.Title>
          <Dialog.Content>
            {/* Open Access Toggle */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Only Open Access</Text>
              <Button 
                mode={filterIsOa ? "contained" : "outlined"}
                onPress={() => setFilterIsOa(!filterIsOa)}
                style={styles.toggleButton}
                buttonColor={filterIsOa ? colors.secondary : undefined}
                color={colors.secondary}
              >
                {filterIsOa ? "Yes" : "No"}
              </Button>
            </View>
            {/* Minimum Cited Count Slider */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Minimum Cited Count: {sliderValue.toLocaleString()}</Text>
            </View>
            <Slider
              value={[sliderValue]}
              onValueChange={(value) => setSliderValue(value[0])}
              minimumValue={0}
              maximumValue={50}
              step={1}
              trackStyle={{ height: 4, backgroundColor: colors.lightGray }}
              thumbStyle={{ height: 20, width: 20, backgroundColor: colors.secondary, borderRadius: 10 }}
            />
            {/* Has Abstract Toggle */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Must Have Abstract</Text>
              <Button 
                mode={filterHasAbstract ? "contained" : "outlined"}
                onPress={() => setFilterHasAbstract(!filterHasAbstract)}
                style={styles.toggleButton}
                buttonColor={filterHasAbstract ? colors.secondary : undefined}
                color={colors.secondary}
              >
                {filterHasAbstract ? "Yes" : "No"}
              </Button>
            </View>
            {/* Language Toggle */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Only English</Text>
              <Button 
                mode={filterLanguage ? "contained" : "outlined"}
                onPress={() => setFilterLanguage(!filterLanguage)}
                style={styles.toggleButton}
                buttonColor={filterLanguage ? colors.secondary : undefined}
                color={colors.secondary}
              >
                {filterLanguage ? "Yes" : "No"}
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={clearFilters} textColor={colors.red}>Clear</Button>
            <Button onPress={() => setFilterVisible(false)} textColor={colors.secondary}>Cancel</Button>
            <Button onPress={handleApplyFilters} textColor={colors.darkGreen}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Works List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.secondary} style={styles.loading} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          works.length > 0 ? (
            works.map(work => {
              // Retrieve the first author if available.
              const firstAuthor = work.authorships && work.authorships.length > 0 
                ? work.authorships[0].author.display_name 
                : null;
              return (
                <Card key={work.id} style={styles.workCard}>
                  <Card.Content>
                    <Text style={styles.cardTitle}>
                      {work.display_name}
                    </Text>
                    {firstAuthor && (
                      <Text style={styles.cardSubtitle}>
                        {firstAuthor}
                      </Text>
                    )}
                    <Text style={styles.workInfo}>
                      Year: {Number(work.publication_year).toLocaleString()}
                    </Text>
                    <Text style={styles.workInfo}>
                      Cited: {Number(work.cited_by_count).toLocaleString()}
                    </Text>
                    <Text style={styles.workInfo}>
                      Status: {work.open_access ? work.open_access.oa_status : 'closed'}
                    </Text>
                  </Card.Content>
                  <Card.Actions>
                    <Button
                      mode="contained"
                      onPress={() => handleOpenLink(work.id)}
                      buttonColor={colors.lightOrange}
                      icon={require('../../assets/Discover_icons/next.png')}
                      contentStyle={{ flexDirection: 'row-reverse' }}
                      labelStyle={{
                        fontSize: sizes.h3,
                        fontFamily: 'Montserrat',
                        textAlign: 'center',
                      }}
                      style={{
                        borderRadius: sizes.buttonRadius,
                      }}
                    >
                      Explore
                    </Button>
                  </Card.Actions>
                </Card>
              );
            })
          ) : (
            <Text style={styles.noDataText}>No works found.</Text>
          )
        )}
      </ScrollView>

      {/* Pagination Controls */}
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationText}>
          {meta.count ? `Total: ${Number(meta.count).toLocaleString()}` : ''}
        </Text>
        <View style={styles.paginationButtons}>
          <IconButton 
            onPress={goToPreviousPage} 
            icon="page-previous-outline"
            disabled={currentPage === 1}
            size={32}
            color={colors.secondary}
          />
          <Text style={styles.paginationText}>
            Page {currentPage.toLocaleString()}{totalPages ? ` / ${totalPages.toLocaleString()}` : ''}
          </Text>
          <IconButton 
            onPress={goToNextPage} 
            disabled={totalPages && currentPage >= totalPages}
            icon="page-next-outline"
            size={32}
            color={colors.secondary}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.primary,
  },
  headerText: {
    fontSize: sizes.h2,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    marginTop: spacing.l,
    textAlign: 'center',
  },
  filterBanner: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
  TopBanner: {
    elevation: 5,
    backgroundColor: colors.primary,
  },
  filterBannerText: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.secondary,
    textAlign: 'center'
  },
  scrollContainer: {
    padding: spacing.m,
    paddingBottom: spacing.xl,
  },
  loading: {
    marginTop: spacing.xl,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: spacing.m,
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
  noDataText: {
    textAlign: 'center',
    fontSize: sizes.h4,
    color: colors.secondary,
    marginTop: spacing.m,
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
  slider: {
    width: '100%',
    height: 40,
  },
  paginationContainer: {
    padding: spacing.s,
    elevation: 5,
    backgroundColor: colors.primary,
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationText: {
    fontSize: sizes.h4,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    textAlign: 'center'
  },
});

export default WorksListScreen;
