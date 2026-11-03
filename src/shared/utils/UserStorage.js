import AsyncStorage from '@react-native-async-storage/async-storage';

export const GUEST_USER_ID = 'GUEST_USER';
export const GUEST_ROLE = 'guest';
export const LIBRARY_ROLES = ['Professor', 'Researcher', 'PhD Student'];

const KEYS = {
  userId: 'userId',
  userRole: 'userRole',
  userUniversity: 'userUniversity',
  hasOnboarded: 'hasOnboarded',
};

export const setUser = async ({ userId, userRole, userUniversity }) => {
  try {
    const entries = [
      [KEYS.userId, String(userId)],
      [KEYS.userRole, userRole || ''],
    ];
    if (userUniversity) {
      entries.push([KEYS.userUniversity, userUniversity]);
    }
    await AsyncStorage.multiSet(entries);
  } catch (error) {
    console.error('Error setting user data:', error);
  }
};

export const setGuestUser = async () => {
  try {
    await AsyncStorage.multiSet([
      [KEYS.userId, GUEST_USER_ID],
      [KEYS.userRole, GUEST_ROLE],
    ]);
  } catch (error) {
    console.error('Error setting guest user data:', error);
  }
};

export const clearUser = async () => {
  try {
    await AsyncStorage.multiRemove([KEYS.userId, KEYS.userRole, KEYS.userUniversity]);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

export const getUser = async () => {
  try {
    const values = Object.fromEntries(
      await AsyncStorage.multiGet([KEYS.userId, KEYS.userRole, KEYS.userUniversity])
    );
    return {
      userId: values[KEYS.userId],
      userRole: values[KEYS.userRole],
      userUniversity: values[KEYS.userUniversity],
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    return {};
  }
};

export const isGuestUser = (userId) => userId === GUEST_USER_ID;

export const canAccessLibrary = (userRole) => LIBRARY_ROLES.includes(userRole);

export const hasCompletedOnboarding = async () => {
  try {
    return !!(await AsyncStorage.getItem(KEYS.hasOnboarded));
  } catch (error) {
    return false;
  }
};

export const setOnboardingCompleted = async () => {
  try {
    await AsyncStorage.setItem(KEYS.hasOnboarded, 'true');
  } catch (error) {
    console.error('Error saving onboarding state:', error);
  }
};
