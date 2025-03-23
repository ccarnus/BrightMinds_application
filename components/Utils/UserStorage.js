import AsyncStorage from '@react-native-async-storage/async-storage';

export const GUEST_USER_ID = 'GUEST_USER';

export const setUser = async ({ userId, userRole, userUniversity }) => {
  try {
    await AsyncStorage.setItem('userId', userId);
    await AsyncStorage.setItem('userRole', userRole);
    if (userUniversity) {
      await AsyncStorage.setItem('userUniversity', userUniversity);
    }
  } catch (error) {
    console.error('Error setting user data:', error);
  }
};

export const setGuestUser = async () => {
  try {
    await AsyncStorage.setItem('userId', GUEST_USER_ID);
    await AsyncStorage.setItem('userRole', 'guest');
  } catch (error) {
    console.error('Error setting guest user data:', error);
  }
};

export const clearUser = async () => {
  try {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userUniversity');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

export const getUser = async () => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    const userRole = await AsyncStorage.getItem('userRole');
    const userUniversity = await AsyncStorage.getItem('userUniversity');
    return { userId, userRole, userUniversity };
  } catch (error) {
    console.error('Error getting user data:', error);
    return {};
  }
};

export const isGuestUser = (userId) => {
  return userId === GUEST_USER_ID;
};
