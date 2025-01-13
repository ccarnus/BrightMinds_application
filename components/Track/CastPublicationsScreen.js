import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, Portal, Button, Provider } from 'react-native-paper';
import { colors, sizes, spacing } from '../theme';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '../APIConfig';

const { width, height } = Dimensions.get('window');

const PublicationsScreen = () => {
  const [casts, setCasts] = useState([]);
  const [userId, setUserId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedCastId, setSelectedCastId] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // State to manage loading indicator

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
      await axios.delete(`https://3.17.219.54/cast/${selectedCastId}`);
      setCasts(casts.filter((cast) => cast._id !== selectedCastId));
      hideModal();
    } catch (error) {
      console.error('Error deleting cast:', error);
      hideModal();
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.castItem}>
      <Image source={{ uri: item.castimageurl }} style={styles.castImage} />
      <View style={styles.castInfo}>
        <Text style={styles.castTitle}>{item.title}</Text>
      </View>
      <TouchableOpacity onPress={() => showModal(item._id)} style={styles.deleteButton}>
        <Image source={require('../../assets/Track_icons/delete_icon.png')} style={styles.deleteIcon} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Provider>
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Your Casts</Text>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <LottieView
              source={require('../../assets/Loader/loader.json')}
              autoPlay
              loop
              style={{ width: width*0.5, height: width*0.5}}
            />
          </View>
        ) : (
          <FlatList
            data={casts}
            renderItem={renderItem}
            keyExtractor={(item) => item._id.toString()} // Ensure that keyExtractor is using unique keys
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
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    width: '100%'
  },
  sectionTitle: {
    fontSize: sizes.title,
    textAlign: 'center',
    marginBottom: spacing.l,
    marginTop: spacing.xl,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
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
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    width: '100%'
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
});

export default PublicationsScreen;
