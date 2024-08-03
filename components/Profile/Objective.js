import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { colors, sizes, spacing } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ObjectiveScreen = () => {
  const buttons = ['Follower', 'Explorer', 'Deep Learner', 'Researcher', 'Career'];
  const route = useRoute();
  let initialObjective = route.params?.objective;
  const [selectedObjective, setSelectedObjective] = useState(initialObjective);
  const [userId, setUserId] = useState(null);
  const descriptions = {
    'Follower': "Don’t miss anything related to your preferences. The up to date pathway guides you through the trending casts, articles and podcasts that so that you are always on top of the latest discoveries in the fields that passionate you.",
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

  const updateObjective = (newObjective) => {
    if (!userId) return; // Ensure userId is available before making the API call

    axios.put(`http://3.17.219.54/user/${userId}/update/tracking`, {
      objective: newObjective
    })
    .then(response => {
      // Update the selected objective on successful response
      setSelectedObjective(newObjective);
    })
    .catch(error => {
      console.error('Error updating objective:', error);
    });
  };

  const handleButtonPress = (buttonName) => {
    if (buttonName === selectedObjective) {
      return; // Do nothing if the button is already the current category
    }

    let formattedButtonName = buttonName.replace(' ', ''); // Remove spaces for Deep Learner
    Alert.alert(
      "Update Learning Pathway",
      "\nAre you sure you want to update your Learning Pathway?\n\nProgress will be lost.",
      [
        { text: "No" },
        { text: "Yes", onPress: () => updateObjective(formattedButtonName) }
      ]
    );
  };

  const handleIconPress = (buttonName, event) => {
    event.stopPropagation();
    Alert.alert(`${buttonName} Description`, descriptions[buttonName]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Learning Pathway</Text>
      {buttons.map((buttonName) => (
        <TouchableOpacity 
          key={buttonName}
          style={[styles.button, selectedObjective === buttonName.replace(' ', '') && styles.highlightedButton]}
          onPress={() => handleButtonPress(buttonName)}
        >
          <Text style={[styles.buttonText, selectedObjective === buttonName.replace(' ', '') && styles.highlightedButtonText]}>{buttonName}</Text>
          <TouchableOpacity 
            style={styles.iconContainer}
            onPress={(event) => handleIconPress(buttonName, event)}
          >
            <Image
              source={require('../../assets/Profile_icons/info_icon.png')}
              style={styles.infoIcon}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </View>
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
    fontFamily: 'MontserratBold',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.l,
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
    color: colors.primary,
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
  },
});

export default ObjectiveScreen;
