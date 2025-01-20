import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, sizes, spacing } from './theme';
import { API_BASE_URL } from './APIConfig';

const Banner = () => {
  const navigation = useNavigation();
  const defaultProfileIcon = require('../assets/Banner_icons/profile.png');
  const [profileImageSource, setProfileImageSource] = useState({ source: defaultProfileIcon });
  const [userId, setUserId] = useState(null);

  const handleProfilePress = () => {
    navigation.navigate('ProfileScreen');
  };

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserIdAndData = async () => {
        try {
          const storedUserId = await AsyncStorage.getItem('userId');
          if (storedUserId) {
            setUserId(storedUserId);
            const response = await fetch(`${API_BASE_URL}/user/${storedUserId}`);
            const data = await response.json();
    
            if (data && data.profilePictureUrl) {
              setProfileImageSource({ source: { uri: data.profilePictureUrl } });
            } else {
              console.error('No profile picture URL found in data:', data);
            }
          }
        } catch (error) {
          console.error('Failed to retrieve user ID from storage or fetch user data:', error);
        }
      };
  
      fetchUserIdAndData(); 
    }, [])
  );

  return (
    <View style={styles.bannerContainer}>
      <TouchableOpacity onPress={handleProfilePress} style={styles.logoContainer}>
        <Image
          source={require('../assets/BrightMinds/black_bear.png')}
          style={styles.logoImage}
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={handleProfilePress}>
        <Image
          source={profileImageSource.source}
          style={styles.profileImage}
        />
      </TouchableOpacity>
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
    backgroundColor: colors.primary,
    marginBottom: spacing.s,
  },
});

export default Banner;
