import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, sizes, spacing } from '@shared/config/theme';
import { API_BASE_URL } from '@shared/config/APIConfig';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';

const Banner = () => {
  const navigation = useNavigation();
  const defaultProfileIcon = require('@assets/Banner_icons/profile.png');
  const [profileImageSource, setProfileImageSource] = useState({ source: defaultProfileIcon });
  const [isGuest, setIsGuest] = useState(false);

  // Only call navigation when user is not guest.
  const handleProfilePress = () => {
    if (!isGuest) {
      navigation.navigate('ProfileScreen');
    }
  };

  // Every time the banner comes into focus, get the user and update state.
  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        try {
          const { userId } = await getUser();
          if (userId) {
            const guestStatus = isGuestUser(userId);
            setIsGuest(guestStatus);
            // Only fetch profile details if the user is not a guest.
            if (!guestStatus) {
              const response = await fetch(`${API_BASE_URL}/user/${userId}`);
              const data = await response.json();
              if (data && data.profilePictureUrl) {
                setProfileImageSource({ source: { uri: data.profilePictureUrl } });
              } else {
                setProfileImageSource({ source: defaultProfileIcon });
              }
            } else {
              setProfileImageSource({ source: defaultProfileIcon });
            }
          }
        } catch (error) {
          console.error('Error fetching user data in Banner:', error);
        }
      };
      fetchUserData();
    }, [])
  );

  return (
    <View style={styles.bannerContainer}>
      {/* Left side: always show the logo */}
      <TouchableOpacity style={styles.logoContainer}>
        <Image
          source={require('@assets/BrightMinds/black_bear.png')}
          style={styles.logoImage}
        />
      </TouchableOpacity>
      {/* Right side: show profile button only if user is NOT a guest */}
      {!isGuest && (
        <TouchableOpacity onPress={handleProfilePress}>
          <Image
            source={profileImageSource.source}
            style={styles.profileImage}
          />
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
    paddingTop: 30,
    backgroundColor: colors.primary,
    elevation: 5,
  },
  logoContainer: {
    flex: 1,
    paddingLeft: 5,
    marginBottom: spacing.s,
  },
  logoImage: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  profileImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primaryBis,
    marginBottom: spacing.s,
  },
});

export default Banner;
