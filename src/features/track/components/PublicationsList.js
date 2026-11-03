import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Modal, Portal, Button } from 'react-native-paper';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import { colors, sizes, spacing } from '@shared/config/theme';

/**
 * Lists the current user's publications of one type (casts or articles) with search,
 * pull-to-refresh and delete-with-confirmation.
 */
const PublicationsList = ({
  navigation,
  title,
  searchPlaceholder,
  publicationsKey,
  endpoint,
  imageKey,
  itemLabel,
}) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
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

  const loadItems = useCallback(async () => {
    try {
      const { userId } = await getUser();
      if (!userId || isGuestUser(userId)) {
        if (mountedRef.current) setItems([]);
        return;
      }
      const { data } = await api.get(`/user/${userId}`);
      const ids = data?.[publicationsKey] || [];
      const results = await Promise.all(
        ids.map((id) =>
          api
            .get(`/${endpoint}/${id}`)
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
      console.error(`Error fetching user ${itemLabel}s:`, loadError);
      // Keep already displayed data on a failed background refresh.
      if (mountedRef.current && !hasLoadedRef.current) {
        setError(getErrorMessage(loadError, `We couldn't load your ${itemLabel}s.`));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, [publicationsKey, endpoint, itemLabel]);

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
    loadItems();
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
      await api.delete(`/${endpoint}/${selectedId}`);
      if (mountedRef.current) {
        setItems((prev) => prev.filter((item) => item._id !== selectedId));
      }
    } catch (deleteError) {
      console.error(`Error deleting ${itemLabel}:`, deleteError);
      Alert.alert(
        `Could not delete ${itemLabel}`,
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
      <Image source={{ uri: item[imageKey] }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
      </View>
      <TouchableOpacity
        onPress={() => setSelectedId(item._id)}
        style={styles.deleteButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${itemLabel} ${item.title || ''}`.trim()}
      >
        <Image source={require('@assets/Track_icons/delete_icon.png')} style={styles.deleteIcon} />
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (isLoading) {
      return <Loader backgroundColor={colors.primaryBis} />;
    }
    if (error) {
      return (
        <StateMessage
          icon="cloud-offline-outline"
          title="Something went wrong"
          message={error}
          actionLabel="Try again"
          onAction={retry}
        />
      );
    }
    return (
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => String(item._id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.m }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.noDataText}>
            {searchQuery.trim() ? `No ${itemLabel}s match your search.` : 'No publications found.'}
          </Text>
        }
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.searchContainerAndButton}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.secondary}
            onChangeText={setSearchQuery}
            value={searchQuery}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CastTypeChoice')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Create a new ${itemLabel}`}
        >
          <Image
            source={require('@assets/Cast_screen_icons/plus_icon.png')}
            style={styles.addButtonIcon}
          />
        </TouchableOpacity>
      </View>

      {renderContent()}

      <Portal>
        <Modal
          visible={selectedId !== null}
          onDismiss={hideModal}
          dismissable={!isDeleting}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>Are you sure you want to delete this {itemLabel}?</Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={handleDelete}
              loading={isDeleting}
              disabled={isDeleting}
              style={styles.modalButton}
              textColor={colors.secondary}
            >
              Yes
            </Button>
            <Button
              mode="contained"
              onPress={hideModal}
              disabled={isDeleting}
              style={styles.modalButton}
              buttonColor={colors.secondary}
            >
              No
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    width: '100%',
  },
  sectionTitle: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.m,
    marginTop: spacing.xl,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  searchContainerAndButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    paddingHorizontal: spacing.m,
    height: 40,
    flexShrink: 1,
  },
  searchInput: {
    flex: 1,
    color: colors.secondary,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
  },
  clearButton: {
    marginLeft: spacing.s,
  },
  clearButtonText: {
    color: colors.secondary,
    fontSize: sizes.h3,
  },
  addButton: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.m,
    marginRight: spacing.s,
  },
  addButtonIcon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    tintColor: colors.lightGreen,
  },
  listContent: {
    flexGrow: 1,
  },
  noDataText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.l,
    fontFamily: 'Montserrat',
  },
  item: {
    flexDirection: 'row',
    marginBottom: spacing.m,
    padding: spacing.s,
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    elevation: 5,
    marginHorizontal: spacing.m,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: sizes.radius,
    marginRight: spacing.s,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.secondary,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: sizes.radius,
  },
  deleteIcon: {
    width: 24,
    height: 24,
    tintColor: colors.red,
  },
  modalContainer: {
    backgroundColor: colors.primary,
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
    alignItems: 'center',
  },
  modalText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  modalButton: {
    margin: spacing.s,
  },
});

export default PublicationsList;
