import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Linking 
} from 'react-native';
import { Button, IconButton, Dialog, Portal } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { colors, sizes, spacing } from '../theme';

const WorksListScreen = () => {
  const [works, setWorks] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter dialog visibility
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Filter states (no date filtering)
  const [filterIsOa, setFilterIsOa] = useState(false);
  const [filterCitedCount, setFilterCitedCount] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [filterHasAbstract, setFilterHasAbstract] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  const perPage = 50;
  const primaryTopic = "T11881";

  // Build filter string based on active filters
  const buildFilterString = () => {
    let filters = [`primary_topic.id:${primaryTopic}`];
    if (filterIsOa) {
      filters.push('is_oa:true');
    }
    if (filterCitedCount > 0) {
      filters.push(`cited_by_count:>${filterCitedCount}`);
    }
    if (filterHasAbstract) {
      filters.push('has_abstract:true');
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

  // Fetch works when component mounts and whenever currentPage changes
  useEffect(() => {
    fetchWorks();
  }, [currentPage]);

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => console.error('Failed opening URL:', err));
  };

  // Apply filters: reset to page 1 and fetch works
  const handleApplyFilters = () => {
    // Ensure filter state reflects the latest slider value.
    setFilterCitedCount(sliderValue);
    setFilterVisible(false);
    if (currentPage !== 1) {
      setCurrentPage(1);
    } else {
      fetchWorks();
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterIsOa(false);
    setFilterCitedCount(0);
    setSliderValue(0);
    setFilterHasAbstract(false);
  };

  // Pagination handlers
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const goToNextPage = () => {
    // Calculate total pages if meta.count and meta.per_page are available
    if (meta.count && meta.per_page) {
      const totalPages = Math.ceil(meta.count / meta.per_page);
      if (currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    }
  };

  // Compute a string to display active filters
  const appliedFilters = [];
  if (filterIsOa) appliedFilters.push("Open Access");
  if (filterCitedCount > 0) appliedFilters.push(`Min Cited: ${filterCitedCount}`);
  if (filterHasAbstract) appliedFilters.push("Has Abstract");
  const appliedFiltersText = appliedFilters.length > 0 ? appliedFilters.join(" | ") : "No filters applied";

  // Calculate total pages (if available)
  const totalPages = meta.count && meta.per_page ? Math.ceil(meta.count / meta.per_page) : 0;

  return (
    <View style={styles.container}>
      {/* Header with title and filter button */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Works List</Text>
        <IconButton
          icon="filter"
          size={24}
          onPress={() => setFilterVisible(true)}
          color={colors.darkGreen}
        />
      </View>

      {/* Banner displaying active filters */}
      <View style={styles.filterBanner}>
        <Text style={styles.filterBannerText}>
          {appliedFiltersText}
        </Text>
      </View>

      {/* Filter Dialog */}
      <Portal>
        <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)}>
          <Dialog.Title>Filter Works</Dialog.Title>
          <Dialog.Content>
            {/* Open Access Toggle */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Only Open Access</Text>
              <Button 
                mode={filterIsOa ? "contained" : "outlined"}
                onPress={() => setFilterIsOa(!filterIsOa)}
                style={styles.toggleButton}
              >
                {filterIsOa ? "Yes" : "No"}
              </Button>
            </View>
            {/* Cited By Count Slider */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Minimum Cited Count: {sliderValue}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={50}
              step={1}
              value={sliderValue}
              onValueChange={(val) => setSliderValue(val)}
              onSlidingComplete={(val) => setFilterCitedCount(val)}
            />
            {/* Has Abstract Toggle */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Must Have Abstract</Text>
              <Button 
                mode={filterHasAbstract ? "contained" : "outlined"}
                onPress={() => setFilterHasAbstract(!filterHasAbstract)}
                style={styles.toggleButton}
              >
                {filterHasAbstract ? "Yes" : "No"}
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={clearFilters}>Clear</Button>
            <Button onPress={() => setFilterVisible(false)}>Cancel</Button>
            <Button onPress={handleApplyFilters}>Apply</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Works List */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#00aaff" style={styles.loading} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          works.length > 0 ? (
            works.map(work => (
              <View key={work.id} style={styles.workCard}>
                <View style={styles.workDetails}>
                  <Text style={styles.workTitle}>{work.display_name}</Text>
                  <Text style={styles.workInfo}>Year: {work.publication_year}</Text>
                  <Text style={styles.workInfo}>Cited: {work.cited_by_count}</Text>
                  <Text style={styles.workInfo}>
                    Status: {work.open_access ? work.open_access.oa_status : 'closed'}
                  </Text>
                </View>
                <Button
                  mode="contained"
                  onPress={() => handleOpenLink(work.id)}
                  buttonColor={colors.darkGreen}
                  contentStyle={{ flexDirection: 'row-reverse' }}
                  icon={require('../../assets/Discover_icons/next.png')}
                  labelStyle={{
                    fontSize: sizes.h3,
                    fontFamily: 'Montserrat',
                    textAlign: 'center'
                  }}
                  style={{
                    marginTop: spacing.m,
                    marginHorizontal: spacing.xs,
                    borderRadius: sizes.buttonRadius,
                  }}
                >
                  Explore
                </Button>
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No works found.</Text>
          )
        )}
      </ScrollView>

      {/* Pagination Controls */}
      <View style={styles.paginationContainer}>
        <Text style={styles.paginationText}>
          {meta.count ? `Total Works: ${meta.count}` : ''}
        </Text>
        <View style={styles.paginationButtons}>
          <Button 
            mode="outlined" 
            onPress={goToPreviousPage} 
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Text style={styles.paginationText}>
            Page {currentPage}{totalPages ? ` of ${totalPages}` : ''}
          </Text>
          <Button 
            mode="outlined" 
            onPress={goToNextPage} 
            disabled={totalPages && currentPage >= totalPages}
          >
            Next
          </Button>
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
  },
  filterBanner: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
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
    marginTop: spacing.l,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: spacing.m,
  },
  workCard: {
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    marginBottom: spacing.l,
    padding: spacing.m,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workDetails: {
    flex: 1,
    marginRight: spacing.m,
  },
  workTitle: {
    fontSize: sizes.h2,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    marginBottom: spacing.s,
  },
  workInfo: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.secondary,
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
    padding: spacing.m,
    backgroundColor: colors.primaryBis,
    borderTopWidth: 1,
    borderColor: colors.secondary,
  },
  paginationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.s,
  },
  paginationText: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.secondary,
    textAlign: 'center'
  },
});

export default WorksListScreen;
