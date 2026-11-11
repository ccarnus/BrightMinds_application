import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import ErrorSnackbar from '@shared/components/ErrorSnackbar';
import SearchField from '@shared/components/SearchField';
import ConfirmDialog from '@shared/components/ConfirmDialog';
import { colors, contentWidth, sizes, spacing, typography } from '@shared/config/theme';

/** Lists the current user's cast publications with search, pull-to-refresh and delete-with-confirmation. */
const PublicationsList = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const mountedRef = useRef(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // `manual` marks a pull-to-refresh: its failure is reported, while a failed background
  // reload (on focus) silently keeps the data already on screen.
  const loadItems = useCallback(async ({ manual = false } = {}) => {
    try {
      const { userId } = await getUser();
      if (!userId || isGuestUser(userId)) {
        if (mountedRef.current) setItems([]);
        return;
      }
      const { data } = await api.get(`/user/${userId}`);
      const ids = data?.castPublications || [];
      const results = await Promise.all(
        ids.map((id) =>
          api
            .get(`/cast/${id}`)
            .then((response) => ({ item: response.data }))
            .catch((itemError) => ({ itemError }))
        )
      );
      const loaded = results.filter((r) => r.item && r.item._id).map((r) => r.item);
      // Skip individual broken/deleted items, but surface the error if nothing could be loaded.
      if (ids.length > 0 && loaded.length === 0) {
        throw results.find((r) => r.itemError)?.itemError || new Error('Failed to load');
      }
      if (mountedRef.current) {
        setItems(loaded);
        setError(null);
      }
      hasLoadedRef.current = true;
    } catch (loadError) {
      console.error('Error fetching user casts:', loadError);
      if (mountedRef.current) {
        if (!hasLoadedRef.current) setError(loadError);
        else if (manual) setRefreshError(loadError);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Reload on focus so publications created from this screen appear when coming back.
  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const retry = () => {
    setError(null);
    setIsLoading(true);
    loadItems();
  };

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshError(null);
    loadItems({ manual: true });
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => (item.title || '').toLowerCase().includes(query));
  }, [items, searchQuery]);

  const hideModal = () => {
    if (!isDeleting) setSelectedId(null);
  };

  const handleDelete = async () => {
    if (!selectedId || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/cast/${selectedId}`);
      if (mountedRef.current) {
        setItems((prev) => prev.filter((item) => item._id !== selectedId));
      }
    } catch (deleteError) {
      console.error('Error deleting cast:', deleteError);
      Alert.alert(
        "Couldn't delete this cast",
        getErrorMessage(deleteError, 'Please try again later.')
      );
    } finally {
      if (mountedRef.current) {
        setIsDeleting(false);
        setSelectedId(null);
      }
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.castimageurl }} style={styles.itemImage} />
      <Text style={styles.itemTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <TouchableOpacity
        onPress={() => setSelectedId(item._id)}
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`Delete cast ${item.title || ''}`.trim()}
      >
        <Image source={require('@assets/Track_icons/delete_icon.png')} style={styles.deleteIcon} />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return <Loader backgroundColor={colors.background} />;
    }
    if (error) {
      return (
        <ErrorState
          error={error}
          onRetry={retry}
          fallbackMessage="We couldn't load your casts."
          secondaryActionLabel="Go back"
          onSecondaryAction={() => navigation.goBack()}
        />
      );
    }
    const query = searchQuery.trim();
    return (
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => String(item._id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.m }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          query ? (
            <StateMessage
              icon="search-outline"
              title="No matching casts"
              message={`No cast matches "${query}".`}
            />
          ) : (
            <StateMessage
              icon="albums-outline"
              title="No publications yet"
              message="Your published casts will appear here."
              actionLabel="Create"
              onAction={() => navigation.navigate('PostCast')}
            />
          )
        }
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Your Casts</Text>
        <View style={styles.searchContainerAndButton}>
          <SearchField
            placeholder="Search your casts.."
            onChangeText={setSearchQuery}
            value={searchQuery}
            returnKeyType="search"
            style={styles.searchField}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('PostCast')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Create a new cast"
          >
            <Image
              source={require('@assets/Cast_screen_icons/plus_icon.png')}
              style={styles.addButtonIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {renderContent()}

      <ErrorSnackbar
        error={refreshError}
        onDismiss={() => setRefreshError(null)}
        onRetry={onRefresh}
        wrapperStyle={{ paddingBottom: insets.bottom }}
      />

      <ConfirmDialog
        visible={selectedId !== null}
        title="Delete this cast?"
        message="This can't be undone."
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
        onDismiss={hideModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    width: '100%',
  },
  header: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
    paddingBottom: spacing.m,
  },
  sectionTitle: {
    ...typography.title,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  searchContainerAndButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  searchField: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    tintColor: colors.action,
  },
  listContent: {
    ...contentWidth,
    flexGrow: 1,
    paddingHorizontal: spacing.m,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    marginBottom: spacing.s,
    padding: spacing.s,
    backgroundColor: colors.surface,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.placeholder,
  },
  itemTitle: {
    ...typography.h3,
    flex: 1,
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: colors.danger,
  },
});

export default PublicationsList;
