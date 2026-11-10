import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { colors, contentWidth, sizes, spacing, typography } from '@shared/config/theme';
import { useTabBarSpace } from '@navigation/FloatingTabBar';
import { api } from '@shared/api/client';
import { getUser, canAccessLibrary, isGuestUser } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import ErrorSnackbar from '@shared/components/ErrorSnackbar';

const articleLogo = require('@assets/Cast_screen_icons/article_logo.png');
const castLogo = require('@assets/Cast_screen_icons/cast_logo.png');

const LibraryScreen = () => {
  const navigation = useNavigation();
  const tabBarSpace = useTabBarSpace();
  const [userRole, setUserRole] = useState('');
  const [castCount, setCastCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  // `manual` marks a pull-to-refresh: its failure is reported, while a failed background
  // reload (on focus) silently keeps the counts already on screen.
  const fetchUserData = useCallback(async ({ manual = false } = {}) => {
    try {
      const { userId, userRole: role } = await getUser();
      if (!isMounted.current) return;
      setUserRole(role || '');

      if (userId && !isGuestUser(userId) && canAccessLibrary(role)) {
        const { data } = await api.get(`/user/${encodeURIComponent(userId)}`);
        if (!isMounted.current) return;
        setCastCount(data?.castPublications?.length || 0);
        setArticleCount(data?.articlePublications?.length || 0);
      }
      setError(null);
      hasLoaded.current = true;
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (!isMounted.current) return;
      if (!hasLoaded.current) setError(err);
      else if (manual) setRefreshError(err);
    } finally {
      if (isMounted.current) setIsLoading(false);
    }
  }, []);

  // Refresh counts every time the tab is focused (e.g. after publishing); only the
  // first load shows the full-screen loader.
  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [fetchUserData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshError(null);
    await fetchUserData({ manual: true });
    if (isMounted.current) setRefreshing(false);
  }, [fetchUserData]);

  const retry = useCallback(() => {
    setError(null);
    setIsLoading(true);
    fetchUserData();
  }, [fetchUserData]);

  if (isLoading) {
    return <Loader backgroundColor={colors.background} style={{ paddingBottom: tabBarSpace }} />;
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingBottom: tabBarSpace }]}>
        <ErrorState
          error={error}
          onRetry={retry}
          fallbackMessage="We couldn't load your publications."
        />
      </View>
    );
  }

  const tiles = [
    { label: 'Articles', count: articleCount, icon: articleLogo, route: 'ArticlePublicationsScreen' },
    { label: 'Casts', count: castCount, icon: castLogo, route: 'CastPublicationsScreen' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Your Publications</Text>

        {canAccessLibrary(userRole) ? (
          <View style={styles.tiles}>
            {tiles.map((tile) => (
              <TouchableOpacity
                key={tile.route}
                style={styles.tile}
                activeOpacity={0.85}
                onPress={() => navigation.navigate(tile.route)}
                accessibilityRole="button"
                accessibilityLabel={`Your ${tile.label.toLowerCase()}: ${tile.count}`}
              >
                <Image source={tile.icon} style={styles.tileIcon} />
                <Text style={styles.tileCount}>{tile.count}</Text>
                <Text style={styles.tileLabel}>{tile.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <StateMessage
            icon="library-outline"
            title="Library unavailable"
            message="The library is available to professors, researchers and PhD students."
          />
        )}
      </ScrollView>
      <ErrorSnackbar
        error={refreshError}
        onDismiss={() => setRefreshError(null)}
        onRetry={onRefresh}
        wrapperStyle={{ bottom: tabBarSpace - spacing.m }}
      />
    </View>
  );
};

export default LibraryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    ...contentWidth,
    flexGrow: 1,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  tiles: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.s,
    borderRadius: sizes.radius,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tileIcon: {
    width: 56,
    height: 56,
    resizeMode: 'contain',
  },
  tileCount: {
    ...typography.h1,
    marginTop: spacing.s,
  },
  tileLabel: {
    ...typography.bodySmall,
  },
});