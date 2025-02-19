import React, { useState, useEffect } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  Image, 
  StyleSheet, 
  Dimensions,
  ScrollView,
  RefreshControl
} from 'react-native';
import { Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { API_BASE_URL } from '../APIConfig';
import { colors, sizes, spacing } from '../theme';
import departments from '../../lists/departments';

const { width, height } = Dimensions.get('window');

const DiscoverScreen = ({ navigation, route }) => {
  const [videos, setVideos] = useState([]);
  const [watchedCastIds, setWatchedCastIds] = useState([]);
  const [finishedVideos, setFinishedVideos] = useState([]);
  const [apiError, setApiError] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Retrieve userId.
  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  // Listen for finishedVideoId from route params.
  useEffect(() => {
    if (route.params?.finishedVideoId) {
      console.log('Received finishedVideoId:', route.params.finishedVideoId);
      const finishedId = route.params.finishedVideoId;
      setFinishedVideos((prev) =>
        prev.includes(finishedId) ? prev : [...prev, finishedId]
      );
    }
  }, [route.params?.finishedVideoId]);

  // Once userId is available, fetch watched casts and then fetch videos.
  useEffect(() => {
    if (userId) {
      fetchWatchedContent();
    }
  }, [userId]);

  const fetchWatchedContent = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch watched content');
      const userData = await response.json();
      const watchedCasts =
        userData.evaluation_list
          ?.filter(item => item.type === 'cast' && item.watched)
          .map(item => item.contentid) || [];
      setWatchedCastIds(watchedCasts);
      fetchVideos(watchedCasts);
    } catch (error) {
      console.error('Error fetching watched content:', error);
      setApiError(true);
      setIsLoading(false);
    }
  };

  // Fetch casts and filter out those already watched or marked as finished.
  const fetchVideos = async (watchedCasts) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cast`);
      if (!response.ok) throw new Error('Failed to fetch casts');
      const data = await response.json();
      const filteredVideos = data.filter(cast => 
        !watchedCasts.includes(cast._id) && !finishedVideos.includes(cast._id)
      );
      // Fetch university logos for each cast.
      const fetchUniversityLogos = filteredVideos.map(cast =>
        fetch(`${API_BASE_URL}/university/by/name/${cast.university}`)
          .then(res => res.json())
          .then(universityData => ({
            ...cast,
            universityLogo: universityData.iconurl,
          }))
          .catch(() => ({ ...cast, universityLogo: null }))
      );
      const dataWithLogos = await Promise.all(fetchUniversityLogos);
      setVideos(dataWithLogos);
      setIsLoading(false);
    } catch (error) {
      console.error('Fetching error:', error);
      setApiError(true);
      setIsLoading(false);
    }
  };

  // Helper functions.
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

  const togglePlay = () => {
    const selectedVideo = videos[focusedIndex];
    navigation.navigate('DiscoverVideoScreen', { selectedCastId: selectedVideo._id });
  };

  // When a finished cast is removed, automatically move to the next cast.
  const handleFinishedVideo = (finishedId) => {
    setFinishedVideos((prev) => prev.filter((id) => id !== finishedId));
    // Remove the finished cast from the videos list:
    setVideos((prev) => prev.filter((video) => video._id !== finishedId));
    // And move to the next one:
    handleNextVideoPress();
  };

  const handleNextVideoPress = () => {
    if (videos.length === 0) return;
    const nextIndex = (focusedIndex + 1) % videos.length;
    setFocusedIndex(nextIndex);
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../../assets/Loader/loader.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Top Section: Display the currently focused cast */}
      {videos.length > 0 && videos[focusedIndex] && (
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
            {/* If the current video is marked as finished, overlay the Lottie animation */}
            {finishedVideos.includes(videos[focusedIndex]._id) && (
              <LottieView
                source={require('../../assets/lotties/done.json')}
                autoPlay
                loop={false}
                onAnimationFinish={() => handleFinishedVideo(videos[focusedIndex]._id)}
                style={styles.lottieOverlay}
              />
            )}
            <View style={styles.playIconContainer}>
              <Image
                source={require('../../assets/Cast_icons/play_icon.png')}
                style={styles.playIcon}
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Section: Cast details and Explore Next */}
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
          {/*<View style={styles.separator} />*/}
          <View style={styles.middleColumn}>
            {videos[focusedIndex] && videos[focusedIndex].universityLogo && (
              <Image
                source={{ uri: videos[focusedIndex].universityLogo }}
                style={styles.universityIconMain}
                resizeMode="contain"
              />
            )}
          </View>
          {/*<View style={styles.separator} />*/}
          <View style={styles.rightColumn}>
            <Text style={styles.durationText}>
              {videos[focusedIndex] ? formatDuration(videos[focusedIndex].duration) : '00:00'}
            </Text>
          </View>
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  topSection: {
    flex: 1,
    marginTop: height * 0.1,
  },
  bottomSection: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
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
    flexDirection: 'row',
    paddingTop: spacing.s,
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
  lottieOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: width / 1.75,
    zIndex: 1,
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
  randomButton: {
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.m,
    marginRight: spacing.s,
  },
  randomButtonIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: colors.lightGreen,
  },
});

export default DiscoverScreen;
