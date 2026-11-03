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
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, canAccessLibrary, isGuestUser } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const articleLogo = require('@assets/Cast_screen_icons/article_logo.png');
const castLogo = require('@assets/Cast_screen_icons/cast_logo.png');

const LibraryScreen = () => {
  const navigation = useNavigation();
  const [userRole, setUserRole] = useState('');
  const [castCount, setCastCount] = useState(0);
  const [articleCount, setArticleCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasLoaded = useRef(false);
  const isMounted = useRef(true);
  useEffect(() => () => { isMounted.current = false; }, []);

  const fetchUserData = useCallback(async () => {
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
      if (isMounted.current) setError(getErrorMessage(err, 'Unable to load your publications.'));
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
    await fetchUserData();
    if (isMounted.current) setRefreshing(false);
  }, [fetchUserData]);

  const retry = useCallback(() => {
    setIsLoading(true);
    fetchUserData();
  }, [fetchUserData]);

  if (isLoading) {
    return <Loader size={200} backgroundColor={colors.primaryBis} />;
  }

  if (error && !hasLoaded.current) {
    return (
      <View style={styles.container}>
        <StateMessage
          icon="cloud-offline-outline"
          title="Whoops!"
          message={error}
          actionLabel="Try again"
          onAction={retry}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Your Publications</Text>

        {canAccessLibrary(userRole) ? (
          <View style={styles.publicationsContainer}>
            <TouchableOpacity
              style={styles.publicationColumn}
              onPress={() => navigation.navigate('ArticlePublicationsScreen')}
              accessibilityRole="button"
              accessibilityLabel={`Your articles: ${articleCount}`}
            >
              <Image source={articleLogo} style={styles.publicationIcon} />
              <Text style={styles.publicationCount}>{articleCount}</Text>
              <Text style={styles.publicationLabel}>Articles</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.publicationColumn}
              onPress={() => navigation.navigate('CastPublicationsScreen')}
              accessibilityRole="button"
              accessibilityLabel={`Your casts: ${castCount}`}
            >
              <Image source={castLogo} style={styles.publicationIcon} />
              <Text style={styles.publicationCount}>{castCount}</Text>
              <Text style={styles.publicationLabel}>Casts</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <StateMessage
            icon="library-outline"
            title="Library unavailable"
            message="The library is available to professors, researchers and PhD students."
          />
        )}
      </ScrollView>
    </View>
  );
};

export default LibraryScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  content: {
    flexGrow: 1,
    paddingVertical: spacing.l,
  },
  title: {
    fontSize: sizes.title,
    color: colors.secondary,
    marginBottom: spacing.l,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  publicationsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: spacing.m,
    marginTop: spacing.m,
  },
  publicationColumn: {
    alignItems: 'center',
  },
  publicationIcon: {
    width: 60,
    height: 60,
    marginBottom: spacing.xs,
    resizeMode: 'contain',
  },
  publicationCount: {
    fontSize: sizes.h2,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
  },
  publicationLabel: {
    fontSize: sizes.h4,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
});
