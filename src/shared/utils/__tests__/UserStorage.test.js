import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setUser,
  setGuestUser,
  getUser,
  clearUser,
  isGuestUser,
  canAccessLibrary,
  hasCompletedOnboarding,
  setOnboardingCompleted,
  GUEST_USER_ID,
} from '@shared/utils/UserStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(() => AsyncStorage.clear());

describe('UserStorage', () => {
  it('stores, reads and clears a user session', async () => {
    await setUser({ userId: 'abc', userRole: 'Researcher', userUniversity: 'MIT' });
    expect(await getUser()).toEqual({ userId: 'abc', userRole: 'Researcher', userUniversity: 'MIT' });

    await clearUser();
    expect(await getUser()).toEqual({ userId: null, userRole: null, userUniversity: null });
  });

  it('creates a guest session', async () => {
    await setGuestUser();
    const { userId, userRole } = await getUser();
    expect(userId).toBe(GUEST_USER_ID);
    expect(userRole).toBe('guest');
    expect(isGuestUser(userId)).toBe(true);
    expect(isGuestUser('abc')).toBe(false);
  });

  it('restricts the library to academic roles', () => {
    expect(canAccessLibrary('Professor')).toBe(true);
    expect(canAccessLibrary('Researcher')).toBe(true);
    expect(canAccessLibrary('PhD Student')).toBe(true);
    expect(canAccessLibrary('Student')).toBe(false);
    expect(canAccessLibrary('guest')).toBe(false);
    expect(canAccessLibrary(null)).toBe(false);
  });

  it('tracks onboarding completion', async () => {
    expect(await hasCompletedOnboarding()).toBe(false);
    await setOnboardingCompleted();
    expect(await hasCompletedOnboarding()).toBe(true);
  });
});
