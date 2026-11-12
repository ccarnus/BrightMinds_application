import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import PieChart from 'react-native-pie-chart';
import { colors, contentWidth, sizes, spacing, typography } from '@shared/config/theme';
import departments from '@shared/data/departments';
import { api } from '@shared/api/client';
import { getUser, clearUser, isGuestUser } from '@shared/utils/UserStorage';
import { resetToAuthChoice } from '@navigation/navigationHelpers';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';
import ErrorState from '@shared/components/ErrorState';
import ErrorSnackbar from '@shared/components/ErrorSnackbar';
import AppButton from '@shared/components/AppButton';
import ConfirmDialog from '@shared/components/ConfirmDialog';
import BackButton from '@shared/components/BackButton';
import LearningPathCard from '@features/learning/components/LearningPathCard';
import VerifyEmailBanner from '@features/profile/components/VerifyEmailBanner';
import { fetchLearningProfile } from '@features/learning/utils/learningApi';

const departmentMapping = departments.reduce((map, dept) => {
  map[dept.name] = dept.display;
  return map;
}, {});

const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [userData, setUserData] = useState(null);
  const [userPreferences, setUserPreferences] = useState([]);
  const [learning, setLearning] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshError, setRefreshError] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const hasLoadedRef = useRef(false);

  // `manual` marks a pull-to-refresh: its failure is reported, while a failed background
  // refresh (on focus) silently keeps the data already on screen.
  const loadProfile = useCallback(async ({ isActive = () => true, manual = false } = {}) => {
    try {
      const { userId } = await getUser();
      if (!isActive()) return;
      if (!userId || isGuestUser(userId)) {
        setIsGuest(true);
        return;
      }
      setIsGuest(false);
      const [userResponse, preferencesResponse, learningProfile] = await Promise.all([
        api.get(`/user/${userId}`),
        api.get(`/user/${userId}/preferences`),
        fetchLearningProfile(userId),
      ]);
      if (!isActive()) return;
      setUserData(userResponse.data);
      setUserPreferences(preferencesResponse.data?.preferences || []);
      setLearning(learningProfile);
      setError(null);
      hasLoadedRef.current = true;
    } catch (loadError) {
      console.error('Error fetching profile data:', loadError);
      if (!isActive()) return;
      if (!hasLoadedRef.current) setError(loadError);
      else if (manual) setRefreshError(loadError);
    } finally {
      if (isActive()) {
        setIsLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Refetch on focus so edits made in EditProfile / the learning path screens are reflected.
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
    setRefreshError(null);
    loadProfile({ manual: true });
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

  const renderBackButton = (tone) =>
    navigation.canGoBack() ? <BackButton tone={tone} onPress={() => navigation.goBack()} /> : null;

  if (isLoading) {
    return <Loader backgroundColor={colors.background} />;
  }

  if (isGuest || error) {
    return (
      <View style={[styles.stateContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        {isGuest ? (
          <StateMessage
            icon="person-circle-outline"
            title="You're browsing as a guest"
            message="Create an account or log in to access your profile."
            actionLabel="Log in"
            onAction={handleLogout}
          />
        ) : (
          <ErrorState
            error={error}
            onRetry={retry}
            fallbackMessage="We couldn't load your profile."
            secondaryActionLabel="Go back"
            onSecondaryAction={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          />
        )}
        {renderBackButton('default')}
      </View>
    );
  }

  const pictureSize = Math.min(width * 0.36, 180);
  const pictureStyle = { width: pictureSize, height: pictureSize, borderRadius: pictureSize / 2 };
  const pieSize = Math.min(width * 0.6, 250);

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
            {userData.profilePictureUrl ? (
              <Image
                source={{ uri: userData.profilePictureUrl }}
                style={[styles.profileImage, pictureStyle]}
              />
            ) : (
              <View style={[styles.profileImage, styles.profilePlaceholder, pictureStyle]}>
                <Ionicons name="person" size={pictureSize * 0.5} color={colors.textMuted} />
              </View>
            )}
            <View style={styles.usernameChip}>
              <Text style={styles.username} numberOfLines={1}>
                {userData.username}
              </Text>
            </View>
          </View>
        )}

        {/* LOWER SECTION */}
        <View style={styles.lowerSection}>
          {userData && !userData.isVerified && !isGuest && (
            <VerifyEmailBanner
              userId={userData._id}
              email={userData.email}
              onVerified={() => loadProfile({ manual: true })}
            />
          )}

          {/* Learning Path (hidden on servers without learning paths) */}
          {!!learning && (
            <LearningPathCard
              learning={learning}
              onPress={() => navigation.navigate('LearningPath')}
              onChoose={() => navigation.navigate('LearningPathPicker', { mode: 'change' })}
            />
          )}

          {/* Preferences Pie Chart */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferences</Text>
            {chartedPreferences.length > 0 ? (
              <View style={styles.pieContainer}>
                <PieChart
                  widthAndHeight={pieSize}
                  series={pieData}
                  sliceColor={pieColors}
                  coverRadius={0.6}
                  coverFill={colors.surface}
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
            <AppButton
              fullWidth
              onPress={() => navigation.navigate('EditProfileScreen')}
              icon={require('@assets/Profile_icons/edit_profile_icon.png')}
            >
              Edit
            </AppButton>

            <AppButton
              variant="secondary"
              fullWidth
              onPress={showModal}
              icon={require('@assets/Profile_icons/logout_icon.png')}
            >
              Log out
            </AppButton>
          </View>
        </View>
      </ScrollView>

      {renderBackButton('light')}

      <ErrorSnackbar
        error={refreshError}
        onDismiss={() => setRefreshError(null)}
        onRetry={onRefresh}
        wrapperStyle={{ paddingBottom: insets.bottom }}
      />

      <ConfirmDialog
        visible={visible}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        destructive
        loading={isLoggingOut}
        onConfirm={handleLogout}
        onDismiss={hideModal}
      />
    </View>
  );
};
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContentContainer: {
    flexGrow: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  upperSection: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingBottom: spacing.l,
    paddingHorizontal: spacing.m,
  },
  profileImage: {
    borderWidth: 4,
    borderColor: colors.surface,
    backgroundColor: colors.placeholder,
  },
  profilePlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usernameChip: {
    maxWidth: '85%',
    marginTop: -spacing.m,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
    borderRadius: sizes.buttonRadius,
    backgroundColor: colors.surface,
  },
  username: {
    ...typography.h3,
    textAlign: 'center',
  },
  lowerSection: {
    ...contentWidth,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
    gap: spacing.l,
  },
  card: {
    alignItems: 'center',
    padding: spacing.m,
    backgroundColor: colors.surface,
    borderRadius: sizes.radius,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTitle: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.m,
  },
  pieContainer: {
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    columnGap: spacing.m,
    rowGap: spacing.s,
    marginTop: spacing.m,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    ...typography.bodySmall,
    color: colors.text,
  },
  noDataText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: spacing.m,
  },
  buttonRow: {
    gap: spacing.s,
  },
});

export default ProfileScreen;
