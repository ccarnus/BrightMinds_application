import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  Image, 
  StyleSheet 
} from 'react-native';
import { Dimensions } from 'react-native';
import axios from 'axios';
import { colors, sizes, spacing } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { Button } from 'react-native-paper';
import { API_BASE_URL } from '../APIConfig';
import departments from '../../lists/departments';

const { width, height } = Dimensions.get('window');

const DiscoverScreen = ({ navigation }) => {
  const [videos, setVideos] = useState([]);
  const [apiError, setApiError] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const serverError = require('../../assets/Cast_screen_icons/server_error.png');

  const departmentIcons = {
    Medicine: require('../../assets/Virtual_labs/Medicine.png'),
    SocialSciences: require('../../assets/Virtual_labs/SocialSciences.png'),
    Engineering: require('../../assets/Virtual_labs/Engineering.png'),
    ArtsandHumanities: require('../../assets/Virtual_labs/ArtsandHumanities.png'),
    ComputerScience: require('../../assets/Virtual_labs/ComputerScience.png'),
    BiochemistryGeneticsandMolecularBiology: require('../../assets/Virtual_labs/BiochemistryGeneticsandMolecularBiology.png'),
    AgriculturalandBiologicalSciences: require('../../assets/Virtual_labs/AgriculturalandBiologicalSciences.png'),
    EnvironmentalScience: require('../../assets/Virtual_labs/EnvironmentalScience.png'),
    MaterialsScience: require('../../assets/Virtual_labs/MaterialsScience.png'),
    PhysicsandAstronomy: require('../../assets/Virtual_labs/PhysicsandAstronomy.png'),
    BusinessManagementandAccounting: require('../../assets/Virtual_labs/BusinessManagementandAccounting.png'),
    HealthProfessions: require('../../assets/Virtual_labs/HealthProfessions.png'),
    EconomicsEconometricsandFinance: require('../../assets/Virtual_labs/EconomicsEconometricsandFinance.png'),
    Psychology: require('../../assets/Virtual_labs/Psychology.png'),
    Chemistry: require('../../assets/Virtual_labs/Chemistry.png'),
    EarthandPlanetarySciences: require('../../assets/Virtual_labs/EarthandPlanetarySciences.png'),
    Neuroscience: require('../../assets/Virtual_labs/Neuroscience.png'),
    Mathematics: require('../../assets/Virtual_labs/Neuroscience.png'),
    ImmunologyandMicrobiology: require('../../assets/Virtual_labs/ImmunologyandMicrobiology.png'),
    DecisionSciences: require('../../assets/Virtual_labs/DecisionSciences.png'),
    Energy: require('../../assets/Virtual_labs/Energy.png'),
    Nursing: require('../../assets/Virtual_labs/Nursing.png'),
    PharmacologyToxicologyandPharmaceutics: require('../../assets/Virtual_labs/PharmacologyToxicologyandPharmaceutics.png'),
    Dentistry: require('../../assets/Virtual_labs/Dentistry.png'),
    ChemicalEngineering: require('../../assets/Virtual_labs/ChemicalEngineering.png'),
    Veterinary: require('../../assets/Virtual_labs/Veterinary.png'),
  };

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchVideos();
    }
  }, [userId]);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cast`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      if (data && data.length > 0) {
        const fetchUniversityLogos = data.map(cast =>
          fetch(`${API_BASE_URL}/university/by/name/${cast.university}`)
            .then(res => res.json())
            .then(universityData => {
              console.log(universityData.iconurl); // for debugging
              return { ...cast, universityLogo: universityData.iconurl };
            })
            .catch(() => ({ ...cast, universityLogo: null }))
        );
        Promise.all(fetchUniversityLogos).then(dataWithLogos => {
          setVideos(dataWithLogos);
          setIsLoading(false);
        });
      } else {
        setVideos([]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Fetching error:', error);
      setApiError(true);
      setIsLoading(false);
    }
  };

  if (apiError) {
    return (
      <View style={styles.errorContainer}>
        <Image source={serverError} style={styles.errorImage} />
        <Text style={styles.errorText}>Whoops!</Text>
        <Text style={styles.errorDetail}>Please try to come back later!</Text>
      </View>
    );
  }

  // Helper: Returns the display name for a given department key.
  const getDepartmentDisplayName = (departmentKey) => {
    const deptObj = departments.find(dept => dept.name === departmentKey);
    return deptObj ? deptObj.display : '';
  };

  const getDepartmentIcon = (department) => {
    return departmentIcons[department] || null;
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration);
    const seconds = Math.round((duration - minutes) * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // When the image is pressed, navigate to VideoScreen with the selected cast's ID
  const togglePlay = () => {
    const selectedVideo = videos[focusedIndex];
    navigation.navigate('VideoScreen', { selectedCastId: selectedVideo._id });
  };

  const handleNextVideoPress = () => {
    const nextIndex = (focusedIndex + 1) % videos.length;
    setFocusedIndex(nextIndex);
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          {console.log('Loader should be visible, state is: ' + isLoading)}
          <LottieView
            source={require('../../assets/Loader/loader.json')}
            autoPlay
            loop
            style={{ width: 200, height: 200 }}
          />
        </View>
      ) : (
        <>
          {videos.length > 0 && videos[focusedIndex] && (
            <>
            <View style={styles.topSection}>
                <View style={styles.titleView}>
                  <Text style={styles.videoTitle}>
                    {videos[focusedIndex].title}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.imageContainer, { height: width / 1.5 }]}
                  onPress={togglePlay}
                  activeOpacity={1}
                >
                  <Image
                    source={{ uri: videos[focusedIndex].castimageurl }}
                    style={{ width: width, height: width / 1.5 }}
                    resizeMode="contain"
                  />
                  <View style={styles.playIconContainer}>
                    <Image
                      source={require('../../assets/Cast_icons/play_icon.png')}
                      style={styles.playIcon}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.bottomSection}>
            <View style={styles.middleband}>
            <View style={styles.leftColumn}>
              {videos[focusedIndex] && videos[focusedIndex].department && (
                <View style={{ alignItems: 'center' }}>
                  <Image
                    source={getDepartmentIcon(videos[focusedIndex].department)}
                    style={styles.departmentIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.departmentLabel}>
                    {getDepartmentDisplayName(videos[focusedIndex].department)}
                  </Text>
                </View>
              )}
            </View>
              <View style={styles.separator} />
              <View style={styles.middleColumn}>
                {videos[focusedIndex] && videos[focusedIndex].universityLogo && (
                  <Image
                    source={{ uri: videos[focusedIndex].universityLogo }}
                    style={styles.universityIconMain}
                    resizeMode="contain"
                  />
                )}
              </View>
              <View style={styles.separator} />
              <View style={styles.rightColumn}>
                <Text style={styles.durationText}>
                  {videos[focusedIndex] ? formatDuration(videos[focusedIndex].duration) : '00:00'}
                </Text>
              </View>
            </View>
            <View style={styles.band}>
              <Button
                mode="contained"
                onPress={handleNextVideoPress}
                buttonColor={colors.darkGreen}
                icon={require('../../assets/Discover_icons/next.png')}
                contentStyle={{ flexDirection: 'row-reverse' }}
                labelStyle={{
                  fontSize: sizes.h2,
                  fontFamily: 'Montserrat',
                  textAlign: 'center',
                  paddingTop: spacing.s,
                }}
                style={{
                  marginBottom: spacing.s,
                  borderRadius: sizes.buttonRadius,
                }}
              >
                Explore Next
              </Button>
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  topSection: {
    flex: 1,
    marginTop: height * 0.15,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: height * 0.15,
  },
  band: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    padding: spacing.m,
  },
  middleband: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  leftColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: '60%',
    backgroundColor: colors.secondary,
  },
  middleColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  universityIconMain: {
    width: width * 0.18,
    height: width * 0.18,
  },
  departmentIcon: {
    width: width * 0.15,
    height: width * 0.15,
  },
  durationText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'Montserrat',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: width,
    height: width / 1.75,
  },
  playIconContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  playIcon: {
    width: 54,
    height: 54,
  },
  titleView: {
    marginLeft: spacing.s,
    marginRight: spacing.s,
    height: height * 0.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: sizes.h1,
    color: colors.secondary,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  departmentLabel: {
    fontSize: sizes.h4,
    color: colors.secondary,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    marginTop: spacing.s,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorImage: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: 20,
  },
  errorText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    textAlign: 'center',
    fontFamily: 'MontserratBold',
  },
  errorDetail: {
    fontSize: sizes.h4,
    color: colors.secondary,
    textAlign: 'center',
    fontFamily: 'Montserrat',
    marginTop: 10,
  },
});

export default DiscoverScreen;
