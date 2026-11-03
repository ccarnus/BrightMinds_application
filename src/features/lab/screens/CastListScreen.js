import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Searchbar } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage, getUniversityLogo } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const formatDuration = (duration) => `${Math.round(Number(duration) || 0)} min`;

const CastCard = React.memo(({ cast, logoUrl, onPress }) => (
  <TouchableOpacity
    style={styles.castCard}
    onPress={() => onPress(cast._id)}
    accessibilityRole="button"
    accessibilityLabel={cast.title}
  >
    <Image source={{ uri: cast.castimageurl }} style={styles.castImage} resizeMode="cover" />
    <View style={styles.cardContent}>
      <View style={styles.textContainer}>
        <Text style={styles.castTitle}>{cast.title}</Text>
        <Text style={styles.castDuration}>Duration: {formatDuration(cast.duration)}</Text>
      </View>
      <View style={styles.uniIconContainer}>
        {!!logoUrl && (
          <Image source={{ uri: logoUrl }} style={styles.uniIcon} resizeMode="contain" />
        )}
      </View>
    </View>
  </TouchableOpacity>
));

const CastListScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { department, topic } = route.params;
  const [casts, setCasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uniIcons, setUniIcons] = useState({});

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchCasts = useCallback(async () => {
    setError(null);
    try {
      const { data } = await api.get(`/cast/department/${encodeURIComponent(department)}`, {
        params: { topic },
      });
      if (isMounted.current) setCasts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch casts:', err);
      if (isMounted.current) setError(getErrorMessage(err, 'Unable to load the casts.'));
    }
  }, [department, topic]);

  const loadCasts = useCallback(() => {
    setLoading(true);
    fetchCasts().finally(() => {
      if (isMounted.current) setLoading(false);
    });
  }, [fetchCasts]);

  useEffect(() => {
    loadCasts();
  }, [loadCasts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCasts();
    if (isMounted.current) setRefreshing(false);
  }, [fetchCasts]);

  useEffect(() => {
    const universities = [...new Set(casts.map(cast => cast.university).filter(Boolean))];
    if (universities.length === 0) return undefined;
    let active = true;
    Promise.all(universities.map(uni => getUniversityLogo(uni))).then((logos) => {
      if (!active) return;
      const icons = {};
      universities.forEach((uni, i) => {
        if (logos[i]) icons[uni] = logos[i];
      });
      setUniIcons(icons);
    });
    return () => { active = false; };
  }, [casts]);

  const filteredCasts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return casts;
    return casts.filter(cast => cast.title?.toLowerCase().includes(query));
  }, [casts, searchQuery]);

  const openCast = useCallback((castId) => {
    navigation.navigate('VirtualLabVideoScreen', { selectedCastId: castId });
  }, [navigation]);

  const renderCast = useCallback(
    ({ item }) => <CastCard cast={item} logoUrl={uniIcons[item.university]} onPress={openCast} />,
    [uniIcons, openCast]
  );

  if (loading) {
    return <Loader size={200} backgroundColor={colors.primaryBis} />;
  }

  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <StateMessage
          icon="cloud-offline-outline"
          title="Couldn't load casts"
          message={error}
          actionLabel="Try again"
          onAction={loadCasts}
        />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        { paddingTop: spacing.m + insets.top, paddingBottom: spacing.xl + insets.bottom },
      ]}
      data={filteredCasts}
      keyExtractor={(item) => String(item._id)}
      renderItem={renderCast}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <Searchbar
          placeholder="Search casts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      }
      ListEmptyComponent={
        <StateMessage
          icon={casts.length === 0 ? 'videocam-outline' : 'search-outline'}
          title={casts.length === 0 ? 'No casts yet' : 'No matching casts'}
          message={
            casts.length === 0
              ? 'No casts have been published on this topic yet.'
              : `No cast matches "${searchQuery.trim()}".`
          }
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  container: {
    paddingHorizontal: spacing.m,
    flexGrow: 1,
  },
  searchBar: {
    marginBottom: spacing.m,
    backgroundColor: colors.primary,
  },
  castCard: {
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    marginBottom: spacing.l,
    overflow: 'hidden',
    elevation: 3,
  },
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
});

export default CastListScreen;
