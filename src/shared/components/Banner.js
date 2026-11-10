import React, { useCallback, useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@shared/config/theme';
import { api } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';

const defaultProfileIcon = require('@assets/Banner_icons/profile.png');
const logo = require('@assets/BrightMinds/black_bear.png');

const Banner = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [profileImageSource, setProfileImageSource] = useState(defaultProfileIcon);
  const [isGuest, setIsGuest] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const fetchUserData = async () => {
        const { userId } = await getUser();
        const guest = !userId || isGuestUser(userId);
        if (!active) return;
        setIsGuest(guest);
        if (guest) return;
        try {
          const { data } = await api.get(`/user/${userId}`);
          if (active) {
            setProfileImageSource(data?.profilePictureUrl ? { uri: data.profilePictureUrl } : defaultProfileIcon);
          }
        } catch (error) {
          // Keep the current picture if the profile cannot be fetched.
        }
      };
      fetchUserData();
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={[styles.bannerContainer, { paddingTop: Math.max(insets.top, spacing.m) }]}>
      <Image source={logo} style={styles.logoImage} accessibilityLabel="BrightMinds" />
      {!isGuest && (
        <TouchableOpacity
          onPress={() => navigation.navigate('ProfileScreen')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Image source={profileImageSource} style={styles.profileImage} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  logoImage: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accentSoft,
    backgroundColor: colors.placeholder,
  },
});

export default Banner;
