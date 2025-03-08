import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  Image 
} from 'react-native';
import { Button, Searchbar } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { colors, sizes, spacing } from '../theme';

const CastListScreen = () => {
  const route = useRoute();
  const { department, topic } = route.params;
  const [casts, setCasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uniIcons, setUniIcons] = useState({});

  // Fetch casts from the provided API
  useEffect(() => {
    const fetchCasts = async () => {
      try {
        const url = `http://3.17.219.54/cast/department/${department}?topic=${topic}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error('Failed to fetch casts');
        }
        const data = await res.json();
        setCasts(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCasts();
  }, [department, topic]);

  // For each unique university in the casts, fetch its icon
  useEffect(() => {
    if (casts.length > 0) {
      const uniqueUniversities = Array.from(new Set(casts.map(cast => cast.university)));
      uniqueUniversities.forEach(uni => {
        if (!uniIcons[uni]) {
          fetch(`http://3.17.219.54/university/by/name/${encodeURIComponent(uni)}`)
            .then(response => response.json())
            .then(data => {
              setUniIcons(prev => ({ ...prev, [uni]: data.iconurl }));
            })
            .catch(err => console.error(err));
        }
      });
    }
  }, [casts]);

  const onChangeSearch = (query) => setSearchQuery(query);

  const filteredCasts = casts.filter(cast =>
    cast.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDuration = (duration) => {
    return `${duration.toFixed(0)} min`;
  };

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
         <Button onPress={() => {/* Optionally implement retry logic */}}>
           Retry
         </Button>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Searchbar
        placeholder="Search casts..."
        onChangeText={onChangeSearch}
        value={searchQuery}
        style={styles.searchBar}
      />
      {filteredCasts.length > 0 ? (
        filteredCasts.map(cast => (
          <View key={cast._id} style={styles.castCard}>
            <Image 
              source={{ uri: cast.castimageurl }} 
              style={styles.castImage} 
              resizeMode="cover"
            />
            <View style={styles.cardContent}>
              <View style={styles.textContainer}>
                <Text style={styles.castTitle}>{cast.title}</Text>
                <Text style={styles.castDuration}>Duration: {formatDuration(cast.duration)}</Text>
              </View>
              <View style={styles.uniIconContainer}>
                {uniIcons[cast.university] ? (
                  <Image 
                    source={{ uri: uniIcons[cast.university] }} 
                    style={styles.uniIcon} 
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholderIcon} />
                )}
              </View>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>No casts found.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.m,
    marginTop: spacing.l,
    backgroundColor: colors.primaryBis,
  },
  searchBar: {
    marginBottom: spacing.m,
    backgroundColor: colors.primary,
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
  castCard: {
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    marginBottom: spacing.m,
    overflow: 'hidden',
    elevation: 3,
  },
  // Display the cast image with a 16:9 aspect ratio
  castImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  cardContent: {
    flexDirection: 'row',
    padding: spacing.m,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: spacing.m,
  },
  castTitle: {
    fontSize: sizes.h2,
    fontFamily: 'MontserratBold',
    color: colors.secondary,
    marginBottom: spacing.s,
  },
  castDuration: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.secondary,
  },
  uniIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uniIcon: {
    width: '100%',
    height: '100%',
  },
  placeholderIcon: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.darkOrange, // a placeholder color if icon not available
  },
  noDataText: {
    textAlign: 'center',
    fontSize: sizes.h4,
    color: colors.secondary,
    marginTop: spacing.m,
  },
});

export default CastListScreen;

