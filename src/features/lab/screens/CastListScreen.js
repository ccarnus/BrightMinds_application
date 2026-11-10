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
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentWidth, sizes, spacing, typography } from '@shared/config/theme';
import { api, getUniversityLogo } from '@shared/api/client';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import ErrorSnackbar from '@shared/components/ErrorSnackbar';
import SearchField from '@shared/components/SearchField';
import BackButton from '@shared/components/BackButton';

const LOGO_SIZE = 40;

const formatDuration = (duration) => `${Math.round(Number(duration) || 0)} min`;

const CastCard = React.memo(({ cast, logoUrl, onPress }) => (
  <TouchableOpacity
    style={styles.castCard}
    activeOpacity={0.85}
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
      {!!logoUrl && <Image source={{ uri: logoUrl }} style={styles.uniIcon} resizeMode="contain" />}
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
  const [refreshError, setRefreshError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uniIcons, setUniIcons] = useState({});

  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchCasts = useCallback(async () => {
    const { data } = await api.get(`/cast/department/${encodeURIComponent(department)}`, {
      params: { topic },
    });
    if (isMounted.current) setCasts(Array.isArray(data) ? data : []);
  }, [department, topic]);

  const loadCasts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchCasts();
    } catch (err) {
      console.error('Failed to fetch casts:', err);
      if (isMounted.current) setError(err);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [fetchCasts]);

  useEffect(() => {
    loadCasts();
  }, [loadCasts]);

  // A failed refresh keeps the list on screen and explains the failure in a snackbar.
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    try {
      await fetchCasts();
    } catch (err) {
      console.error('Failed to refresh casts:', err);
      if (isMounted.current) setRefreshError(err);
    } finally {
      if (isMounted.current) setRefreshing(false);
    }
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

  const goBack = () => navigation.goBack();

  if (loading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (error) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <ErrorState
          error={error}
          onRetry={loadCasts}
          fallbackMessage="We couldn't load the casts of this topic."
          secondaryActionLabel="Go back"
          onSecondaryAction={() => navigation.goBack()}
        />
        <BackButton onPress={goBack} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.s }]}>
        <BackButton floating={false} onPress={goBack} />
        <SearchField
          placeholder="Search casts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>
      <FlatList
        style={styles.screen}
        contentContainerStyle={[styles.listContent, { paddingBottom: spacing.xl + insets.bottom }]}
        data={filteredCasts}
        keyExtractor={(item) => String(item._id)}
        renderItem={renderCast}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
      <ErrorSnackbar
        error={refreshError}
        onDismiss={() => setRefreshError(null)}
        onRetry={onRefresh}
        wrapperStyle={{ paddingBottom: insets.bottom }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    ...contentWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
  },
  searchBar: {
    flex: 1,
  },
  listContent: {
    ...contentWidth,
    flexGrow: 1,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
  },
  castCard: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.m,
    overflow: 'hidden',
  },
  castImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.placeholder,
  },
  cardContent: {
    flexDirection: 'row',
    padding: spacing.m,
    alignItems: 'center',
    gap: spacing.m,
  },
  textContainer: {
    flex: 1,
  },
  castTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  castDuration: {
    ...typography.caption,
  },
  uniIcon: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});

export default CastListScreen;
