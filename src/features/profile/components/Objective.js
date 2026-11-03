import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Portal, Button } from 'react-native-paper';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';

const { width } = Dimensions.get('window');

const OBJECTIVES = ['Follower', 'Explorer', 'Deep Learner', 'Researcher', 'Career'];

const DESCRIPTIONS = {
  Follower: "Don’t miss anything related to your preferences. The up-to-date pathway guides you through the trending casts, articles, and podcasts so that you are always on top of the latest discoveries in the fields that passionate you.",
  Explorer: "Ideal for users looking to keep up with their preferences as well as explore a wide range of research disciplines and topics, this pathway provides a curated selection of introductory content from various fields. It encourages users to discover new areas of interest.",
  'Deep Learner': "For users seeking in-depth knowledge in their preferred field(s), this pathway offers a more structured learning journey. It includes a series of articles, videos, and resources focused on specific topic(s), gradually increasing in complexity.",
  Researcher: "Geared towards users interested in understanding the research process and experience. This pathway guides through the work of specific researchers. It includes profiles of researchers, their methodologies, and the evolution of their work.",
  Career: "Aimed at users looking to enhance their career prospects, this pathway offers content related to skills development, career opportunities, and industry insights. It helps users bridge the gap between research and career goals.",
};

// The API stores objectives without spaces (e.g. "DeepLearner").
const toObjectiveValue = (name) => name.replace(' ', '');

const ObjectiveScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedObjective, setSelectedObjective] = useState(route.params?.objective);
  const [confirmationObjective, setConfirmationObjective] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [infoObjective, setInfoObjective] = useState(null);

  const hideConfirmationModal = () => {
    if (!isSaving) setConfirmationObjective(null);
  };

  const updateObjective = async () => {
    if (!confirmationObjective || isSaving) return;
    setIsSaving(true);
    try {
      const { userId } = await getUser();
      if (!userId || isGuestUser(userId)) {
        Alert.alert('Sign in required', 'Log in to choose a learning path.');
        setConfirmationObjective(null);
        return;
      }
      await api.put(`/user/${userId}/update/tracking`, { objective: confirmationObjective });
      setSelectedObjective(confirmationObjective);
      setConfirmationObjective(null);
    } catch (error) {
      console.error('Error updating objective:', error);
      Alert.alert(
        'Could not update your learning path',
        getErrorMessage(error, 'Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleButtonPress = (name) => {
    const value = toObjectiveValue(name);
    if (value === selectedObjective) return;
    setConfirmationObjective(value);
  };

  return (
    <View style={styles.container}>
      {navigation.canGoBack() && (
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + spacing.s }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={28} color={colors.secondary} />
        </TouchableOpacity>
      )}
      <Text style={styles.title} accessibilityRole="header">
        Your Learning Pathway
      </Text>
      {OBJECTIVES.map((name) => {
        const isSelected = selectedObjective === toObjectiveValue(name);
        return (
          <TouchableOpacity
            key={name}
            style={[styles.button, isSelected && styles.highlightedButton]}
            onPress={() => handleButtonPress(name)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
          >
            <Text style={[styles.buttonText, isSelected && styles.highlightedButtonText]}>
              {name}
            </Text>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => setInfoObjective(name)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`About ${name}`}
            >
              <Image
                source={require('@assets/Profile_icons/info_icon.png')}
                style={[styles.infoIcon, isSelected && styles.highlightedInfoIcon]}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      })}

      <Portal>
        <Modal
          visible={confirmationObjective !== null}
          onDismiss={hideConfirmationModal}
          dismissable={!isSaving}
          contentContainerStyle={styles.modalContainer}
        >
          <Text style={styles.modalText}>Update your Learning Pathway?</Text>
          <Text style={styles.modalSubText}>Progress will be lost.</Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={updateObjective}
              loading={isSaving}
              disabled={isSaving}
              style={styles.modalButton}
              textColor={colors.secondary}
            >
              Yes
            </Button>
            <Button
              mode="contained"
              onPress={hideConfirmationModal}
              disabled={isSaving}
              style={styles.modalButton}
              buttonColor={colors.secondary}
            >
              No
            </Button>
          </View>
        </Modal>

        <Modal
          visible={infoObjective !== null}
          onDismiss={() => setInfoObjective(null)}
          contentContainerStyle={styles.infoModalContainer}
        >
          <Text style={styles.infoModalTitle}>{infoObjective} Description</Text>
          <Text style={styles.infoModalDescription}>
            {DESCRIPTIONS[infoObjective] || 'Description not available.'}
          </Text>
          <Button
            mode="contained"
            onPress={() => setInfoObjective(null)}
            style={styles.infoModalButton}
            buttonColor={colors.secondary}
          >
            Close
          </Button>
        </Modal>
      </Portal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryBis,
  },
  backButton: {
    position: 'absolute',
    left: spacing.m,
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
  highlightedInfoIcon: {
    tintColor: colors.primary,
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
  infoModalContainer: {
    backgroundColor: colors.primary,
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
