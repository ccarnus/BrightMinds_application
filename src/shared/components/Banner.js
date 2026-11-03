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
    <View style={[styles.bannerContainer, { paddingTop: Math.max(insets.top, spacing.l) }]}>
      <Image source={logo} style={styles.logoImage} accessibilityLabel="BrightMinds" />
      {!isGuest && (
        <TouchableOpacity
          onPress={() => navigation.navigate('ProfileScreen')}
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
    paddingHorizontal: 20,
    paddingBottom: spacing.s,
    backgroundColor: colors.primary,
    elevation: 5,
  },
  logoImage: {
    width: 48,
    height: 48,
    marginLeft: 5,
    resizeMode: 'contain',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryBis,
  },
});

export default Banner;
