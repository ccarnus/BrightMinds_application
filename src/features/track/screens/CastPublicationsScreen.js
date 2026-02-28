import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  TextInput,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, Portal, Button, Provider } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '@shared/config/APIConfig';
import { colors, sizes, spacing } from '@shared/config/theme';

const { width } = Dimensions.get('window');

const PublicationsScreen = ({ navigation }) => {
  const [casts, setCasts] = useState([]);
  const [filteredCasts, setFilteredCasts] = useState([]);
  const [userId, setUserId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedCastId, setSelectedCastId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search bar state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUserCasts = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          setIsLoading(false);
          return;
        }
        setUserId(storedUserId);
        const response = await axios.get(`${API_BASE_URL}/user/${storedUserId}`);
        const castDetails = await Promise.all(
          response.data.castPublications.map(async (castId) => {
            const castResponse = await axios.get(`${API_BASE_URL}/cast/${castId}`);
            return castResponse.data;
          })
        );

        setCasts(castDetails);
        setFilteredCasts(castDetails); // Initially, show all
      } catch (error) {
        console.error('Error fetching user casts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserCasts();
  }, []);

  const showModal = (castId) => {
    setSelectedCastId(castId);
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
    setSelectedCastId(null);
  };

  const handleDeleteCast = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/cast/${selectedCastId}`);
      const updatedCasts = casts.filter((cast) => cast._id !== selectedCastId);
      setCasts(updatedCasts);
      setFilteredCasts(updatedCasts);
      hideModal();
    } catch (error) {
      console.error('Error deleting cast:', error);
      hideModal();
    }
  };

  // Handle search input
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      // If search is cleared, show all casts
      setFilteredCasts(casts);
      return;
    }
    // Filter by title
    const filtered = casts.filter((cast) =>
      cast.title.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredCasts(filtered);
  };

  // Clear search input and reset filtered list
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredCasts(casts);
  };

  const renderItem = ({ item }) => (
    <View style={styles.castItem}>
      <Image source={{ uri: item.castimageurl }} style={styles.castImage} />
      <View style={styles.castInfo}>
        <Text style={styles.castTitle}>{item.title}</Text>
      </View>
      <TouchableOpacity onPress={() => showModal(item._id)} style={styles.deleteButton}>
        <Image
          source={require('@assets/Track_icons/delete_icon.png')}
          style={styles.deleteIcon}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Provider>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Your Casts</Text>
        <View style={styles.searchContainerAndButton}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="search your casts.."
              placeholderTextColor={colors.secondary}
              onChangeText={handleSearch}
              value={searchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              navigation.navigate('CastTypeChoice');
            }}
          >
            <Image
              source={require('@assets/Cast_screen_icons/plus_icon.png')}
              style={styles.addButtonIcon}
            />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loaderContainer}>
            <LottieView
              source={require('@assets/Loader/loader.json')}
              autoPlay
              loop
              style={{ width: width * 0.5, height: width * 0.5 }}
            />
          </View>
        ) : (
          <FlatList
            data={filteredCasts}
            renderItem={renderItem}
            keyExtractor={(item) => item._id.toString()}
            ListEmptyComponent={<Text style={styles.noDataText}>No publications found.</Text>}
          />
        )}

        <Portal>
          <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to delete this cast?</Text>
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={handleDeleteCast}
                style={styles.modalButton}
                textColor={colors.secondary}
              >
                Yes
              </Button>
              <Button
                mode="contained"
                onPress={hideModal}
                style={styles.modalButton}
                buttonColor={colors.secondary}
              >
                No
              </Button>
            </View>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

const styles = StyleSheet.create({
  /* Container & Titles */
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

  /* Search Bar & Button Wrapper (like CastScreen) */
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
    color: colors.white,
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

  /* Floating "Add" Button (like the random button in CastScreen) */
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

  /* Loader & Empty State */
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  noDataText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.l,
    fontFamily: 'Montserrat',
  },

  /* Cast Item & Delete Button */
  castItem: {
    flexDirection: 'row',
    marginBottom: spacing.m,
    padding: spacing.s,
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    elevation: 5,
    marginHorizontal: spacing.m,
  },
  castImage: {
    width: 80,
    height: 80,
    borderRadius: sizes.radius,
    marginRight: spacing.s,
  },
  castInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  castTitle: {
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
    backgroundColor: 'white',
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

export default PublicationsScreen;
