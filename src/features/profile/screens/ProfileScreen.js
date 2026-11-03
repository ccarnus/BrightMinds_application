import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PieChart from 'react-native-pie-chart';
import { Modal, Portal, Button } from 'react-native-paper';
import { colors, sizes, spacing } from '@shared/config/theme';
import departments from '@shared/data/departments';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, clearUser, isGuestUser } from '@shared/utils/UserStorage';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const { width } = Dimensions.get('window');

const departmentMapping = departments.reduce((map, dept) => {
  map[dept.name] = dept.display;
  return map;
}, {});

const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [userPreferences, setUserPreferences] = useState([]);
  const [trackingData, setTrackingData] = useState({ objective: '' });
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hasLoadedRef = useRef(false);

  const loadProfile = useCallback(async ({ isActive = () => true } = {}) => {
    try {
      const { userId } = await getUser();
      if (!isActive()) return;
      if (!userId || isGuestUser(userId)) {
        setIsGuest(true);
        return;
      }
      setIsGuest(false);
      const [userResponse, preferencesResponse, trackingResponse] = await Promise.all([
        api.get(`/user/${userId}`),
        api.get(`/user/${userId}/preferences`),
        api.get(`/user/${userId}/tracking`),
      ]);
      if (!isActive()) return;
      setUserData(userResponse.data);
      setUserPreferences(preferencesResponse.data?.preferences || []);
      setTrackingData(trackingResponse.data?.tracking || { objective: '' });
      setError(null);
      hasLoadedRef.current = true;
    } catch (loadError) {
      console.error('Error fetching profile data:', loadError);
      // A failed background refresh keeps the data already on screen.
      if (isActive() && !hasLoadedRef.current) {
        setError(getErrorMessage(loadError, "We couldn't load your profile."));
      }
    } finally {
      if (isActive()) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Refetch on focus so edits made in EditProfile / Objective are reflected.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadProfile({ isActive: () => active });
      return () => {
        active = false;
      };
    }, [loadProfile])
  );

  const retry = () => {
    setError(null);
    setIsLoading(true);
    loadProfile();
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    await clearUser();
    hideModal();
    resetToAuthChoice(navigation);
  };

  // The pie chart throws on non-positive values, so only positive weights are charted.
  const chartedPreferences = useMemo(
    () => userPreferences.filter((pref) => Number(pref.weight) > 0),
    [userPreferences]
  );
  const pieData = chartedPreferences.map((pref) => Number(pref.weight));
  const pieColors = chartedPreferences.map(
    (_, index) => `hsl(${(index * 360) / chartedPreferences.length}, 70%, 50%)`
  );

  const renderBackButton = (iconColor) =>
    navigation.canGoBack() ? (
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + spacing.s }]}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={28} color={iconColor} />
      </TouchableOpacity>
    ) : null;

  if (isLoading) {
    return <Loader backgroundColor={colors.primaryBis} />;
  }

  if (isGuest || error) {
    return (
      <View style={[styles.stateContainer, { paddingTop: insets.top }]}>
        {isGuest ? (
          <StateMessage
            icon="person-circle-outline"
            title="You're browsing as a guest"
            message="Create an account or log in to access your profile."
            actionLabel="Log in"
            onAction={handleLogout}
          />
        ) : (
          <StateMessage
            icon="cloud-offline-outline"
            title="Something went wrong"
            message={error}
            actionLabel="Try again"
            onAction={retry}
          />
        )}
        {renderBackButton(colors.secondary)}

      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: spacing.l + insets.bottom }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* UPPER SECTION */}
        {userData && (
          <View style={[styles.upperSection, { paddingTop: spacing.xl + insets.top }]}>
            <View>
              {userData.profilePictureUrl ? (
                <Image source={{ uri: userData.profilePictureUrl }} style={styles.profileImage} />
              ) : (
                <View style={[styles.profileImage, styles.profilePlaceholder]}>
                  <Ionicons name="person" size={width * 0.2} color={colors.lightGray} />
                </View>
              )}
              <Text style={styles.overlayUsername}>{userData.username}</Text>
            </View>
          </View>
        )}

        {/* LOWER SECTION */}
        <View style={styles.lowerSection}>
          {userData && !userData.isVerified && (
            <View style={[styles.lowerSectionContainer, styles.verificationContainer]}>
              <Image
                source={require('@assets/Profile_icons/warning_icon.png')}
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
                accessibilityRole="button"
                accessibilityHint="Change your learning path"
              >
                <Text style={styles.objectiveText}>
                  {trackingData.objective || 'Choose a learning path'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preferences Pie Chart */}
          <View style={styles.lowerSectionContainer}>
            <Text style={styles.preferencesTitle}>Preferences</Text>
            {chartedPreferences.length > 0 ? (
              <View style={styles.pieContainer}>
                <PieChart
                  widthAndHeight={250}
                  series={pieData}
                  sliceColor={pieColors}
                  coverRadius={0.6}
                  coverFill={colors.primary}
                />
                <View style={styles.legendContainer}>
                  {chartedPreferences.map((pref, index) => (
                    <View key={pref.category || index} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: pieColors[index] }]} />
                      <Text style={styles.legendText}>
                        {departmentMapping[pref.category] || pref.category}
                      </Text>
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
              onPress={() => navigation.navigate('EditProfileScreen')}
              buttonColor={colors.darkGreen}
              icon={require('@assets/Profile_icons/edit_profile_icon.png')}
              labelStyle={styles.buttonLabel}
              style={[styles.fullWidthButton, styles.buttonMargin]}
            >
              Edit
            </Button>

            <Button
              mode="contained"
              onPress={showModal}
              buttonColor={colors.darkGreen}
              icon={require('@assets/Profile_icons/logout_icon.png')}
              labelStyle={styles.buttonLabel}
              style={[styles.fullWidthButton, styles.buttonMargin]}
            >
              Log out
            </Button>
          </View>
        </View>
      </ScrollView>

      {renderBackButton(colors.primary)}

      {/* Modal for logging out */}
      <Portal>
        <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalText}>Are you sure you want to log out?</Text>
          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={handleLogout}
              loading={isLoggingOut}
              disabled={isLoggingOut}
              style={styles.modalButton}
              textColor={colors.secondary}
            >
              Yes
            </Button>
            <Button
              mode="contained"
              onPress={hideModal}
              disabled={isLoggingOut}
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
  scrollView: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  backButton: {
    position: 'absolute',
    left: spacing.m,
  },
  profilePlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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

  lowerSectionContainer: {
    width: '90%',
    alignSelf: 'center',
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
    color: colors.secondary,
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

  buttonRow: {
    width: '100%',
    alignItems: 'center',
  },
  fullWidthButton: {
    width: '90%',
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
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  modalButton: {
    margin: spacing.s,
  },

  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
});

export default ProfileScreen;
