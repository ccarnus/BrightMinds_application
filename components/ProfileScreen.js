import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import axios from 'axios';
import { colors, sizes, spacing } from './theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import departments from '../lists/departments';
import PieChart from 'react-native-pie-chart';
import { Modal, Portal, Button, Provider } from 'react-native-paper';
import { API_BASE_URL } from './APIConfig';

const { width, height } = Dimensions.get('window');

const departmentMapping = departments.reduce((map, dept) => {
  map[dept.name] = dept.display;
  return map;
}, {});

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [userPreferences, setUserPreferences] = useState([]);
  const [trackingData, setTrackingData] = useState({ objective: '', progress: 0 });
  const [userId, setUserId] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      axios
        .get(`${API_BASE_URL}/user/${userId}`)
        .then(response => setUserData(response.data))
        .catch(error => console.error('Error fetching user data:', error));

      axios
        .get(`${API_BASE_URL}/user/${userId}/preferences`)
        .then(response => setUserPreferences(response.data.preferences))
        .catch(error => console.error('Error fetching user preferences:', error));

      axios
        .get(`${API_BASE_URL}/user/${userId}/tracking`)
        .then(response => setTrackingData(response.data.tracking))
        .catch(error => console.error('Error fetching tracking data:', error));
    }
  }, [userId]);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const handleLogout = async () => {
    hideModal();
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userUniversity');
    setUserData(null);
    setUserPreferences([]);
    setTrackingData({ objective: '', progress: 0 });
    navigation.navigate('LoginScreen');
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen');
  };

  const pieData = userPreferences.map(pref => pref.weight);
  const pieColors = userPreferences.map((_, index) => `hsl(${(index * 360) / userPreferences.length}, 70%, 50%)`);

  return (
    <Provider>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContentContainer}
      >
        <View style={styles.container}>

          {/* UPPER SECTION */}
          {userData && (
            <View style={styles.upperSection}>
              <View>
                <Image
                  source={{ uri: userData.profilePictureUrl }}
                  style={styles.profileImage}
                />
                <Text style={styles.overlayUsername}>{userData.username}</Text>
              </View>
            </View>
          )}

          {/* LOWER SECTION */}
          <View style={styles.lowerSection}>
            {/* If the user is not verified, show a warning */}
            {userData && !userData.isVerified && (
              <View style={[styles.lowerSectionContainer, styles.verificationContainer]}>
                <Image 
                  source={require('../assets/Profile_icons/warning_icon.png')}
                  style={styles.warningIcon}
                />
                <Text style={styles.verificationText}>Verify your email</Text>
              </View>
            )}

            {/* Learning Path */}
            <View style={[styles.lowerSectionContainer, styles.shadow]}>
              <View style={styles.objectiveContainer}>
                <Text style={styles.preferencesTitle}>My Learning Path</Text>
                <TouchableOpacity
                  style={styles.buttonObjectiveContainer}
                  onPress={() => navigation.navigate('Objective', { objective: trackingData.objective })}
                >
                  <Text style={styles.objectiveText}>{trackingData.objective}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preferences Pie Chart */}
            <View style={styles.lowerSectionContainer}>
              <Text style={styles.preferencesTitle}>Preferences</Text>
              {userPreferences.length > 0 ? (
                <View style={styles.pieContainer}>
                  <PieChart
                    widthAndHeight={250}
                    series={pieData}
                    sliceColor={pieColors}
                    doughnut={true}
                    coverRadius={0.6}
                    coverFill={colors.primary}
                  />
                  <View style={styles.legendContainer}>
                    {userPreferences.map((pref, index) => (
                      <View key={index} style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: pieColors[index] }]} />
                        <Text style={styles.legendText}>{departmentMapping[pref.category]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={styles.noDataText}>No preferences set just yet..</Text>
              )}
            </View>

            {/* Buttons (Edit / Logout) */}
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={handleEditProfile}
                buttonColor={colors.darkGreen}
                icon={require('../assets/Profile_icons/edit_profile_icon.png')}
                labelStyle={styles.buttonLabel}
                style={[styles.fullWidthButton, styles.buttonMargin]}
              >
                Edit
              </Button>

              <Button
                mode="contained"
                onPress={showModal}
                buttonColor={colors.darkGreen}
                icon={require('../assets/Profile_icons/logout_icon.png')}
                labelStyle={styles.buttonLabel}
                style={[styles.fullWidthButton, styles.buttonMargin]}
              >
                Log out
              </Button>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal for logging out */}
      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalText}>Are you sure you want to log out?</Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={handleLogout}
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
    </Provider>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  scrollContentContainer: {
    paddingBottom: spacing.l,
  },
  container: {
    flex: 1,
    overflow: 'visible',
  },
  upperSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.secondary,
    elevation: 5,
    paddingVertical: spacing.xl,
  },
  lowerSection: {
    backgroundColor: colors.primaryBis,
    alignItems: 'center',
    width: '100%',
    marginTop: spacing.m,
  },

  /* Make the "lowerSectionContainer" fill most of the width */
  lowerSectionContainer: {
    width: '90%',             // <-- 90% of parent width
    alignSelf: 'center',      // <-- center horizontally
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    overflow: 'visible',
    elevation: 5,
    padding: spacing.m,
  },

  profileImage: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
  },
  overlayUsername: {
    position: 'absolute',
    bottom: -20,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: sizes.radius,
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    elevation: 5,
  },
  pieContainer: {
    alignItems: 'center',
    marginTop: spacing.m,
  },
  legendContainer: {
    marginTop: spacing.m,
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: spacing.s,
  },
  legendText: {
    fontSize: sizes.h4,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  preferencesTitle: {
    fontSize: sizes.h2,
    color: colors.white,
    marginBottom: spacing.s,
    marginTop: spacing.s,
    fontFamily: 'MontserratBold',
    textAlign: 'center',
  },
  noDataText: {
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: spacing.l,
    marginBottom: spacing.xl,
  },
  objectiveContainer: {
    alignItems: 'center',
  },
  buttonObjectiveContainer: {
    backgroundColor: colors.secondary,
    borderRadius: sizes.radius,
    paddingVertical: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: spacing.m,
  },
  objectiveText: {
    fontSize: sizes.h3,
    color: colors.primary,
    fontFamily: 'Montserrat',
  },
  verificationContainer: {
    borderColor: colors.red,
    borderWidth: 1,
    borderRadius: sizes.radius,
    padding: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  warningIcon: {
    width: 30,
    height: 30,
  },
  verificationText: {
    fontSize: sizes.h3,
    color: colors.red,
    fontFamily: 'Montserrat',
    marginLeft: spacing.s,
    textAlign: 'center',
  },

  /* Make the buttons row, each button full width, stacked vertically */
  buttonRow: {
    width: '100%',
    alignItems: 'center',
  },
  fullWidthButton: {
    width: '90%',         // fill about 90% of parent's width
    alignSelf: 'center',
    borderRadius: sizes.buttonRadius,
  },
  buttonLabel: {
    fontSize: sizes.h2,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
  buttonMargin: {
    marginVertical: spacing.s,
  },

  /* Modal styles */
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

  /* Shadow example */
  shadow: {
    // If you need a shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    // and for Android
    elevation: 5,
  },
});

export default ProfileScreen;
