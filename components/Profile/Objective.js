// ObjectiveScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Image 
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { colors, sizes, spacing } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Modal, Portal, Button, Provider } from 'react-native-paper';
import { API_BASE_URL } from '../APIConfig';

const ObjectiveScreen = () => {
  const buttons = ['Follower', 'Explorer', 'Deep Learner', 'Researcher', 'Career'];
  const route = useRoute();
  let initialObjective = route.params?.objective;
  const [selectedObjective, setSelectedObjective] = useState(initialObjective);
  const [userId, setUserId] = useState(null);
  const [confirmationVisible, setConfirmationVisible] = useState(false); // Confirmation Modal visibility
  const [confirmationObjective, setConfirmationObjective] = useState(null); // Objective to be confirmed

  // New state for Info Modal
  const [infoVisible, setInfoVisible] = useState(false); // Info Modal visibility
  const [infoTitle, setInfoTitle] = useState(''); // Info Modal title
  const [infoDescription, setInfoDescription] = useState(''); // Info Modal description

  const descriptions = {
    'Follower': "Don’t miss anything related to your preferences. The up-to-date pathway guides you through the trending casts, articles, and podcasts so that you are always on top of the latest discoveries in the fields that passionate you.",
    'Explorer': "Ideal for users looking to keep up with their preferences as well as explore a wide range of research disciplines and topics, this pathway provides a curated selection of introductory content from various fields. It encourages users to discover new areas of interest.",
    'Deep Learner': "For users seeking in-depth knowledge in their preferred field(s), this pathway offers a more structured learning journey. It includes a series of articles, videos, and resources focused on specific topic(s), gradually increasing in complexity.",
    'Researcher': "Geared towards users interested in understanding the research process and experience. This pathway guides through the work of specific researchers. It includes profiles of researchers, their methodologies, and the evolution of their work.",
    'Career': "Aimed at users looking to enhance their career prospects, this pathway offers content related to skills development, career opportunities, and industry insights. It helps users bridge the gap between research and career goals."
  };

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  const updateObjective = async () => {
    if (!userId) return;

    try {
      await axios.put(`${API_BASE_URL}/user/${userId}/update/tracking`, {
        objective: confirmationObjective
      });
      setSelectedObjective(confirmationObjective);
      hideConfirmationModal();
    } catch (error) {
      console.error('Error updating objective:', error);
    }
  };

  const handleButtonPress = (buttonName) => {
    if (buttonName === selectedObjective) return;

    let formattedButtonName = buttonName.replace(' ', ''); // Remove spaces for Deep Learner
    setConfirmationObjective(formattedButtonName); // Set objective for confirmation
    showConfirmationModal();
  };

  const showConfirmationModal = () => setConfirmationVisible(true);
  const hideConfirmationModal = () => setConfirmationVisible(false);

  // Functions to handle Info Modal
  const showInfoModal = (buttonName) => {
    setInfoTitle(`${buttonName} Description`);
    setInfoDescription(descriptions[buttonName] || 'Description not available.');
    setInfoVisible(true);
  };

  const hideInfoModal = () => {
    setInfoVisible(false);
    setInfoTitle('');
    setInfoDescription('');
  };

  return (
    <Provider>
      <View style={styles.container}>
        <Text style={styles.title}>Your Learning Pathway</Text>
        {buttons.map((buttonName) => (
          <TouchableOpacity 
            key={buttonName}
            style={[
              styles.button, 
              selectedObjective === buttonName.replace(' ', '') && styles.highlightedButton
            ]}
            onPress={() => handleButtonPress(buttonName)}
          >
            <Text 
              style={[
                styles.buttonText, 
                selectedObjective === buttonName.replace(' ', '') && styles.highlightedButtonText
              ]}
            >
              {buttonName}
            </Text>
            <TouchableOpacity 
              style={styles.iconContainer}
              onPress={() => showInfoModal(buttonName)}
            >
              <Image
                source={require('../../assets/Profile_icons/info_icon.png')}
                style={styles.infoIcon}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        {/* Update Learning Pathway Confirmation Modal */}
        <Portal>
          <Modal 
            visible={confirmationVisible} 
            onDismiss={hideConfirmationModal} 
            contentContainerStyle={styles.modalContainer}
          >
            <Text style={styles.modalText}>Update your Learning Pathway?</Text>
            <Text style={styles.modalSubText}>Progress will be lost.</Text>
            <View style={styles.modalButtons}>
              <Button 
                mode="outlined" 
                onPress={updateObjective} 
                style={styles.modalButton}
                textColor={colors.secondary}
              >
                Yes
              </Button>
              <Button 
                mode="contained" 
                onPress={hideConfirmationModal} 
                style={styles.modalButton}
                buttonColor={colors.secondary}
              >
                No
              </Button>
            </View>
          </Modal>
        </Portal>

        {/* Info Modal */}
        <Portal>
          <Modal 
            visible={infoVisible} 
            onDismiss={hideInfoModal} 
            contentContainerStyle={styles.infoModalContainer}
          >
            <Text style={styles.infoModalTitle}>{infoTitle}</Text>
            <Text style={styles.infoModalDescription}>{infoDescription}</Text>
            <Button 
              mode="contained" 
              onPress={hideInfoModal} 
              style={styles.infoModalButton}
              buttonColor={colors.secondary}
            >
              Close
            </Button>
          </Modal>
        </Portal>
      </View>
    </Provider>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: sizes.title,
    width: width * 0.8,
    marginBottom: spacing.l * 2,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    color: colors.secondary,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: sizes.radius,
    width: width * 0.8,
    marginBottom: spacing.l,
    elevation: 5,
  },
  highlightedButton: {
    backgroundColor: colors.darkblue,
    elevation: 5,
  },
  highlightedButtonText: {
    color: colors.primary,
  },
  buttonText: {
    color: colors.secondary,
    fontSize: 18,
    flex: 1,
    fontFamily: 'Montserrat',
  },
  iconContainer: {
    padding: 10,
    marginLeft: 10,
  },
  infoIcon: {
    width: 25,
    height: 25,
    tintColor: colors.secondary,
  },
  // Confirmation Modal Styles
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
    fontFamily: 'MontserratBold',
    textAlign: 'center',
  },
  modalSubText: {
    fontSize: sizes.h4,
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
  // Info Modal Styles
  infoModalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: sizes.radius,
    alignItems: 'center',
  },
  infoModalTitle: {
    fontSize: sizes.h3,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'MontserratBold',
    textAlign: 'center',
  },
  infoModalDescription: {
    fontSize: sizes.body,
    color: colors.secondary,
    marginBottom: spacing.m,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  infoModalButton: {
    marginTop: spacing.m,
    alignSelf: 'stretch',
  },
});

export default ObjectiveScreen;
