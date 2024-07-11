import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, Portal, Button, Provider } from 'react-native-paper';
import { colors, sizes, spacing } from '../theme';

const ArticlePublicationsScreen = () => {
  const [articles, setArticles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState(null);

  useEffect(() => {
    const fetchUserArticles = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        setUserId(storedUserId);
        const response = await axios.get(`http://3.17.219.54/user/${storedUserId}`);
        const articleDetails = await Promise.all(
          response.data.articlePublications.map(async (articleId) => {
            const articleResponse = await axios.get(`http://3.17.219.54/article/${articleId}`);
            return articleResponse.data;
          })
        );
        setArticles(articleDetails);
      } catch (error) {
        console.error('Error fetching user articles:', error);
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
      await axios.delete(`http://3.17.219.54/article/${selectedArticleId}`);
      setArticles(articles.filter((article) => article._id !== selectedArticleId));
      hideModal();
    } catch (error) {
      console.error('Error deleting article:', error);
      hideModal();
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.articleItem}>
      <Image source={{ uri: item.imageurl }} style={styles.articleImage} />
      <View style={styles.articleInfo}>
        <Text style={styles.articleTitle}>{item.title}</Text>
      </View>
      <TouchableOpacity onPress={() => showModal(item._id)} style={styles.deleteButton}>
        <Image source={require('../../assets/Track_icons/delete_icon.png')} style={styles.deleteIcon} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Provider>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>ARTICLES</Text>
        <FlatList
          data={articles}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={<Text style={styles.noDataText}>No publications found.</Text>}
        />
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
    padding: spacing.m,
    width: '100%'
  },
  sectionTitle: {
    fontSize: sizes.h2,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'MontserratBold',
  },
  articleItem: {
    flexDirection: 'row',
    marginBottom: spacing.m,
    padding: spacing.s,
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    elevation: 5,
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
    padding: spacing.s,
    backgroundColor: colors.red,
    borderRadius: sizes.radius,
  },
  deleteIcon: {
    width: 24,
    height: 24,
  },
  noDataText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.l,
    fontFamily: 'Montserrat',
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

export default ArticlePublicationsScreen;
