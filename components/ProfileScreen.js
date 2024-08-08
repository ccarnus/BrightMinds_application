import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { colors, sizes, spacing } from './theme';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import departments from '../lists/departments';
import PieChart from 'react-native-pie-chart'; // Import the PieChart component

const { width, height } = Dimensions.get('window');

const departmentMapping = departments.reduce((map, dept) => {
  map[dept.name] = dept.display;
  return map;
}, {});

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [userPreferences, setUserPreferences] = useState([]);
  const [trackingData, setTrackingData] = useState({ objective: '', progress: 0 });
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      // Fetch user data
      axios
        .get(`http://3.17.219.54/user/${userId}`)
        .then(response => setUserData(response.data))
        .catch(error => console.error('Error fetching user data:', error));

      // Fetch user preferences
      axios
        .get(`http://3.17.219.54/user/${userId}/preferences`)
        .then(response => setUserPreferences(response.data.preferences))
        .catch(error => console.error('Error fetching user preferences:', error));

      // Fetch tracking data
      axios
        .get(`http://3.17.219.54/user/${userId}/tracking`)
        .then(response => setTrackingData(response.data.tracking))
        .catch(error => console.error('Error fetching tracking data:', error));
    }
  }, [userId]);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userUniversity');
    setUserData(null);
    setUserPreferences([]);
    setTrackingData({ objective: '', progress: 0 });
    navigation.navigate('LoginScreen');
  };

  const pieData = userPreferences.map(pref => pref.weight);
  const pieColors = userPreferences.map((_, index) => `hsl(${index * 360 / userPreferences.length}, 70%, 50%)`);

  return (
    <View style={styles.container}>
      {userData && (
        <View style={styles.upperSection}>
          <View>
            <Image
              source={{ uri: userData.profilePictureUrl }}
              style={styles.profileImage}
            />
            <Text style={styles.overlayUsername}>{userData.username}</Text>
          </View>
        </View>
      )}
      <View style={styles.lowerSection}>
        <ScrollView style={styles.lowerSectionScrollView}>
          <View style={[styles.lowerSectionContainer, styles.shadow]}>
            <View style={styles.objectiveContainer}>
              <Text style={styles.preferencesTitle}>My Learning Path</Text>
              <TouchableOpacity
                style={styles.buttonObjectiveContainer}
                onPress={() => navigation.navigate('Objective', { objective: trackingData.objective })}
              >
                <Text style={styles.objectiveText}>{trackingData.objective}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.lowerSectionContainer}>
            <Text style={styles.preferencesTitle}>Preferences</Text>
            {userPreferences.length > 0 ? (
              <View style={styles.pieContainer}>
                <PieChart
                  widthAndHeight={250}
                  series={pieData}
                  sliceColor={pieColors}
                  doughnut={true}
                  coverRadius={0.6}
                  coverFill={colors.primary}
                />
                <View style={styles.legendContainer}>
                  {userPreferences.map((pref, index) => (
                    <View key={index} style={styles.legendItem}>
                      <View style={[styles.legendColor, { backgroundColor: pieColors[index] }]} />
                      <Text style={styles.legendText}>{departmentMapping[pref.category]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.noDataText}>No preferences set just yet..</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.logoutContainer}
            onPress={handleLogout}
          >
            <Text style={styles.buttonLogout}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'visible',
  },
  upperSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: height*2 / 7,
    backgroundColor: colors.secondary,
    elevation: 5,
  },
  lowerSection: {
    flex: 2,
    backgroundColor: colors.primaryBis,
    alignItems: 'center',
    overflow: 'visible',
    width: '100%',
  },
  lowerSectionContainer: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginLeft: spacing.s,
    marginRight: spacing.s,
    marginBottom: spacing.m,
    marginTop: spacing.m,
    borderRadius: sizes.radius,
    overflow: 'visible',
    elevation: 5,
  },
  lowerSectionScrollView: {
    width: '100%',
    marginBottom: spacing.l,
    paddingHorizontal: spacing.m,
  },
  profileImage: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  score: {
    fontSize: sizes.h3,
    fontWeight: 'bold',
    color: colors.secondary,
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
  textContainer: {
    width: "33%",
    marginLeft: 5,
    textAlign: "center",
    marginBottom: spacing.l,
  },
  buttonContainer: {
    backgroundColor: colors.primary,
    borderRadius: sizes.radius,
    paddingVertical: 10,
    justifyContent: 'center',
    width: 100,
    flexDirection: "row",
    marginTop: 15,
    elevation: 5,
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
    borderWidth: 1,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    elevation:5,
  },
  preferencesTitle: {
    fontSize: sizes.h2,
    color: colors.white,
    marginBottom: 10,
    marginTop: spacing.s,
    fontFamily: 'MontserratBold',
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
    flexDirection: "row",
    marginBottom: spacing.m,
  },
  objectiveText: {
    fontSize: sizes.h3,
    color: colors.primary,
    fontFamily: 'Montserrat',
  },
  logoutContainer: {
    backgroundColor: colors.primaryBis,
    borderColor: colors.secondary,
    borderWidth: 2,
    borderRadius: sizes.radius,
    paddingVertical: 5,
    paddingHorizontal: 15,
    justifyContent: 'center',
    flexDirection: "row",
    marginBottom: spacing.s,
    marginTop: spacing.s,
    alignSelf: 'center',
  },
  buttonLogout: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  noDataText: {
    color: colors.secondary,
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: spacing.l,
    marginBottom: spacing.xl
  }
});

export default ProfileScreen;
