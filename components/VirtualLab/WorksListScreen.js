import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Linking 
} from 'react-native';
import { Button } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { colors, sizes, spacing } from '../theme';

const WorksListScreen = () => {
  const route = useRoute();
  const { topicId } = route.params; // topicId passed from previous screen
  const [works, setWorks] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const fetchWorks = async (page = 1) => {
    setLoading(true);
    try {
      const url = `https://api.openalex.org/works?filter=primary_topic.id:${topicId}&per_page=${perPage}&page=${page}`;
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

  useEffect(() => {
    fetchWorks(currentPage);
  }, [topicId, currentPage]);

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => console.error('Failed opening URL:', err));
  };

  // Calculate total pages from meta.count
  const totalPages = meta.count ? Math.ceil(meta.count / perPage) : 1;

  // A small component for pagination controls used at both top and bottom
  const PaginationControls = () => (
    <View style={styles.paginationContainer}>
      <Button 
        mode="outlined"
        disabled={currentPage === 1}
        onPress={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
      >
        Previous
      </Button>
      <Text style={styles.pageText}>
        Page {currentPage} of {totalPages}
      </Text>
      <Button 
        mode="outlined"
        disabled={currentPage === totalPages}
        onPress={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
      >
        Next
      </Button>
    </View>
  );

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
         <Button onPress={() => fetchWorks(currentPage)}>
           Retry
         </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Pagination */}
      <PaginationControls />

      {/* Total works count */}
      <Text style={styles.totalCountText}>Total Works: {meta.count}</Text>

      {/* List of work cards */}
      {works.length > 0 ? (
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
      )}

      {/* Bottom Pagination */}
      <PaginationControls />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    marginTop: spacing.l,
    marginBottom: spacing.xl,
    backgroundColor: colors.primaryBis,
  },
  totalCountText: {
    fontSize: sizes.h4,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.m,
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
    padding: spacing.m,
    backgroundColor: colors.primaryBis,
  },
  errorText: {
    fontSize: sizes.h4,
    color: 'red',
    marginBottom: spacing.m,
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
  openButton: {
    alignSelf: 'center',
  },
  noDataText: {
    textAlign: 'center',
    fontSize: sizes.h4,
    color: colors.secondary,
    marginTop: spacing.m,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.m,
  },
  pageText: {
    fontSize: sizes.h4,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
  },
});

export default WorksListScreen;
