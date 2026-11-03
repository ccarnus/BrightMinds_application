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
import { colors, sizes, spacing } from '@shared/config/theme';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '@shared/config/APIConfig';

const { width } = Dimensions.get('window');

const ArticlePublicationsScreen = ({ navigation }) => {
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]); // <-- For filtered search results
  const [userId, setUserId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search bar state
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUserArticles = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (!storedUserId) {
          setIsLoading(false);
          return;
        }
        setUserId(storedUserId);
        
        // Fetch the user data and retrieve all article IDs
        const response = await axios.get(`${API_BASE_URL}/user/${storedUserId}`);
        const articleDetails = await Promise.all(
          response.data.articlePublications.map(async (articleId) => {
            const articleResponse = await axios.get(`${API_BASE_URL}/article/${articleId}`);
            return articleResponse.data;
          })
        );

        setArticles(articleDetails);
        setFilteredArticles(articleDetails); // Show all by default
      } catch (error) {
        console.error('Error fetching user articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserArticles();
  }, []);

  const showModal = (articleId) => {
    setSelectedArticleId(articleId);
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
    setSelectedArticleId(null);
  };

  const handleDeleteArticle = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/article/${selectedArticleId}`);
      const updatedArticles = articles.filter((article) => article._id !== selectedArticleId);
      setArticles(updatedArticles);
      setFilteredArticles(updatedArticles);
      hideModal();
    } catch (error) {
      console.error('Error deleting article:', error);
      hideModal();
    }
  };

  // Handle user typing in the search bar
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      // If no search text, show all articles
      setFilteredArticles(articles);
      return;
    }
    // Filter articles by title
    const filtered = articles.filter((article) =>
      article.title.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredArticles(filtered);
  };

  // Clear the search input
  const clearSearch = () => {
    setSearchQuery('');
    setFilteredArticles(articles);
  };

  const renderItem = ({ item }) => (
    <View style={styles.articleItem}>
      <Image source={{ uri: item.articleimageurl }} style={styles.articleImage} />
      <View style={styles.articleInfo}>
        <Text style={styles.articleTitle}>{item.title}</Text>
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
        <Text style={styles.sectionTitle}>Your Articles</Text>

        {/* Search Bar + "Add" Button in a row, like the random button in CastScreen */}
        <View style={styles.searchContainerAndButton}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search your articles.."
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

          {/* Floating "Add" Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              // Navigate to a screen for adding an article, or whichever action you need.
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
            data={filteredArticles}
            renderItem={renderItem}
            keyExtractor={(item) => item._id.toString()}
            ListEmptyComponent={<Text style={styles.noDataText}>No publications found.</Text>}
          />
        )}

        <Portal>
          <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
            <Text style={styles.modalText}>Are you sure you want to delete this article?</Text>
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={handleDeleteArticle}
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

  // Search Bar and Button (similar to CastScreen)
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

  // Add ("plus") Button next to the search bar
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

  // Article Items
  articleItem: {
    flexDirection: 'row',
    marginBottom: spacing.m,
    padding: spacing.s,
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    elevation: 5,
    marginHorizontal: spacing.m,
  },
  articleImage: {
    width: 80,
    height: 80,
    borderRadius: sizes.radius,
    marginRight: spacing.s,
  },
  articleInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  articleTitle: {
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

  // Modal
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

export default ArticlePublicationsScreen;
