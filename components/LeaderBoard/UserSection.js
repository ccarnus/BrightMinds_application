import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { colors, sizes } from '../theme';
import { API_BASE_URL } from '../APIConfig';

const UserProfile = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Fetch user data
    fetch(`${API_BASE_URL}/user/6474e4001eec5ee1ecd40180`) // WRONG
      .then((response) => response.json())
      .then((data) => setUserData(data))
      .catch((error) => console.error(error));
  }, []);

  if (!userData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: userData.profilePictureUrl }} style={styles.profilePicture} />
      <View style={styles.userInfo}>
        <Text style={styles.name}>{userData.username}</Text>
        <Text style={styles.score}>{userData.score}</Text>
        <Text style={styles.rank}>Better than {userData.percentage}%</Text>
      </View>
      <Image source={{ uri: 'https://3.17.219.54/backend/media/university_icon/GT.png1691613590597.png' }} style={styles.universityPicture} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.black,
    marginHorizontal: 10,
    padding: 10,
    borderRadius: sizes.radius,
    elevation: 3,
    marginTop:70,
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  name: {
    fontSize: 18,
    color: colors.white,
  },
  score: {
    fontSize: 16,
    color: colors.white,
  },
  rank: {
    fontSize: 16,
    color: colors.white,
    fontWeight:'bold',
  },
  universityPicture: {
    width: 70,
    height: 45,
  },
});

export default UserProfile;
