import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, Image, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { Video } from 'expo-av';
import { Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import { colors, sizes, spacing } from './theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const DiscoverScreen = ({ navigation }) => {
  const [videos, setVideos] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [videoStatus, setVideoStatus] = useState([]);
  const [showVideo, setShowVideo] = useState(false);
  const [userId, setUserId] = useState(null);
  const [playbackInstancePosition, setPlaybackInstancePosition] = useState(0);
  const [playbackInstanceDuration, setPlaybackInstanceDuration] = useState(0);
  const [contentSubmitted, setContentSubmitted] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const videoRefs = useRef([]);

  const departmentIcons = {
    MedicineandHealthSciences: require('../assets/Virtual_labs/MedicineandHealthSciences.png'),
    HistoryandGeography: require('../assets/Virtual_labs/HistoryandGeography.png'),
    ComputerScience: require('../assets/Virtual_labs/ComputerScience.png'),
    Biology: require('../assets/Virtual_labs/Biology.png'),
    Chemistry: require('../assets/Virtual_labs/Chemistry.png'),
    Physics: require('../assets/Virtual_labs/Physics.png'),
    Robotics: require('../assets/Virtual_labs/Robotics.png'),
    EarthScience: require('../assets/Virtual_labs/EarthSciences.png'),
    Geology: require('../assets/Virtual_labs/Geology.png'),
    Oceanography: require('../assets/Virtual_labs/Oceanography.png'),
    SpaceExploration: require('../assets/Virtual_labs/SpaceExploration.png'),
    EnvironmentalSciences: require('../assets/Virtual_labs/EnvironmentalScience.png'),
    Mathematics: require('../assets/Virtual_labs/Mathematics.png'),
    Statistics: require('../assets/Virtual_labs/Statistics.png'),
    Psychology: require('../assets/Virtual_labs/Psychology.png'),
    Sociology: require('../assets/Virtual_labs/Sociology.png'),
    CulturalStudies: require('../assets/Virtual_labs/CulturalStudies.png'),
    Economics: require('../assets/Virtual_labs/Economics.png'),
    PoliticalScience: require('../assets/Virtual_labs/PoliticalScience.png'),
    Engineering: require('../assets/Virtual_labs/Engineering.png'),
    Agriculture: require('../assets/Virtual_labs/Agriculture.png'),
    Philosophy: require('../assets/Virtual_labs/Philosophy.png'),
    Linguistics: require('../assets/Virtual_labs/Linguistics.png'),
    Neuroscience: require('../assets/Virtual_labs/Neuroscience.png'),
    ArtificialIntelligence: require('../assets/Virtual_labs/ArtificialIntelligence.png'),
    Law: require('../assets/Virtual_labs/Law.png'),
    Materials: require('../assets/Virtual_labs/Materials.png'),
    Mechanics: require('../assets/Virtual_labs/Mechanics.png'),
    MedicalImaging: require('../assets/Virtual_labs/MedicalImaging.png'),
    Meteorology: require('../assets/Virtual_labs/Meteorology.png'),
    NanoTechnology: require('../assets/Virtual_labs/NanoTechnology.png'),
    Nutrition: require('../assets/Virtual_labs/Nutrition.png'),
    Paleontology: require('../assets/Virtual_labs/Paleontology.png'),
    Pediatrics: require('../assets/Virtual_labs/Pediatrics.png'),
    SportSciences: require('../assets/Virtual_labs/SportSciences.png'),
    Transportation: require('../assets/Virtual_labs/Transportation.png'),
    Literature: require('../assets/Virtual_labs/Literature.png'),
    Genetics: require('../assets/Virtual_labs/Genetics.png'),
    Education: require('../assets/Virtual_labs/Education.png'),
    Astronomy: require('../assets/Virtual_labs/Astronomy.png'),
    Archaeology: require('../assets/Virtual_labs/Archaeology.png'),
    Art: require('../assets/Virtual_labs/Art.png'),
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

  const fetchVideos = () => {
    setIsLoading(true);
    fetch('http://3.17.219.54/cast')
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const fetchUniversityLogosAndApprovalStatus = data.map(cast =>
            Promise.all([
              fetch(`http://3.17.219.54/university/by/name/${cast.university}`)
                .then(res => res.json())
                .then(universityData => ({ ...cast, universityLogo: universityData.iconurl })),
              fetch(`http://3.17.219.54/cast/verification/${cast._id}`)
                .then(res => res.json())
                .then(verificationData => ({ ...cast, isApproved: verificationData.approvals >= 5 }))
            ]).then(results => Object.assign({}, ...results))
          );
          return Promise.all(fetchUniversityLogosAndApprovalStatus);
        }
        return [];
      })
      .then(dataWithLogosAndApproval => {
        setVideos(dataWithLogosAndApproval);
        setVideoStatus(dataWithLogosAndApproval.map(() => false));
        setContentSubmitted(dataWithLogosAndApproval.map(() => false));
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Fetching error:', error);
        setIsLoading(false);
      });
  };
  const getDepartmentIcon = (department) => {
    return departmentIcons[department] || null;
  };

  const togglePlay = () => {
    setShowVideo(true);
    setVideoStatus(videoStatus.map((status, idx) => idx === focusedIndex ? !status : status));
  };

  const formatDuration = (duration) => {
    const minutes = Math.floor(duration);
    const seconds = Math.round((duration - minutes) * 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayVideoFocused = async () => {
    if (videoRefs.current[focusedIndex]) {
      const status = await videoRefs.current[focusedIndex].getStatusAsync();
      if (status.isPlaying) {
        await videoRefs.current[focusedIndex].pauseAsync();
      } else {
        await videoRefs.current[focusedIndex].playAsync();
      }
    }
  };

  const handleCastWatched = (index) => {
    if (!videos[index] || contentSubmitted[index]) return;

    const castId = videos[index]._id;

    axios
      .post(`http://3.17.219.54/user/add/content/${userId}`, { contentId: castId, type: "cast" })
      .then(() => {
        setContentSubmitted(prevSubmitted => prevSubmitted.map((submitted, idx) => idx === index ? true : submitted));
        console.log("Content marked as watched at 85%");
      })
      .catch(error => {
        console.error(error);
      });
  };

  const handleCastDonePlaying = () => {
    setShowVideo(false);
    setVideoStatus(videoStatus.map((status, idx) => idx === focusedIndex ? false : status));
    navigation.goBack(); // Close the video and navigate back
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackInstancePosition(status.positionMillis);
      setPlaybackInstanceDuration(status.durationMillis);

      const progress = playbackInstancePosition / playbackInstanceDuration;

      if (progress >= 0.85 && !contentSubmitted[focusedIndex]) {
        handleCastWatched(focusedIndex); // Mark content as watched at 85%
      }

      if (status.didJustFinish) {
        handleCastDonePlaying();
      }
    }
  };

  const getMMSSFromMillis = (millis) => {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);

    const padWithZero = (number) => {
      const string = number.toString();
      if (number < 10) {
        return '0' + string;
      }
      return string;
    };
    return padWithZero(minutes) + ':' + padWithZero(seconds);
  };

  const handleSliderValueChange = async (value) => {
    if (videoRefs.current[focusedIndex]) {
      const seekPosition = value * playbackInstanceDuration;
      await videoRefs.current[focusedIndex].setPositionAsync(seekPosition);
    }
  };

  const handleNextVideoPress = () => {
    const nextIndex = (focusedIndex + 1) % videos.length;
    setFocusedIndex(nextIndex);
    setVideoStatus(videoStatus.map((_, idx) => idx === nextIndex ? false : false));
  };

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Image
            source={require('../assets/BrightMinds/logo_round.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      ) : (
        <>
          {videos.length > 0 && videos[focusedIndex] && (
            <>
              <View style={styles.titleView}>
                <Text style={styles.videoTitle}>
                  {videos[focusedIndex] ? videos[focusedIndex].title : ''}
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
                {!videoStatus[focusedIndex] && (
                  <View style={styles.playIconContainer}>
                    <Image
                      source={require('../assets/Cast_icons/play_icon.png')}
                      style={styles.playIcon}
                    />
                  </View>
                )}
                {videos[focusedIndex].isApproved && (
                  <Image
                    source={require('../assets/Cast_icons/approved_badge.png')}
                    style={styles.approvedIcon}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
              <Modal
                animationType="slide"
                transparent={false}
                visible={showVideo}
                onRequestClose={() => {
                  setShowVideo(false);
                  setVideoStatus(videoStatus.map((status, idx) =>
                    idx === focusedIndex ? false : status
                  ));
                }}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  style={{ flex: 1 }}
                  onPress={togglePlayVideoFocused}
                >
                  <View style={{ flex: 1, backgroundColor: colors.secondary }}>
                    <Video
                      ref={ref => (videoRefs.current[focusedIndex] = ref)}
                      source={{ uri: videos[focusedIndex].casturl }}
                      shouldPlay={videoStatus[focusedIndex]}
                      resizeMode="contain"
                      style={{ width: '100%', height: '100%' }}
                      onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                    />
                    <Slider
                      style={styles.progressSlider}
                      value={playbackInstancePosition / playbackInstanceDuration}
                      minimumValue={0}
                      maximumValue={1}
                      minimumTrackTintColor={colors.primary}
                      maximumTrackTintColor={colors.secondary}
                      thumbTintColor={colors.primary}
                      onSlidingComplete={handleSliderValueChange}
                    />
                    <Text style={styles.duration}>
                      {getMMSSFromMillis(playbackInstancePosition)} /{' '}
                      {getMMSSFromMillis(playbackInstanceDuration)}
                    </Text>
                    <View style={styles.buttonUniversityContainer}>
                      <Image
                        source={{ uri: videos[focusedIndex].universityLogo }}
                        style={styles.universityIcon}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              </Modal>
            </>
          )}
  
          <View style={styles.bottomSection}>
            <View style={styles.middleband}>
              <View style={styles.leftColumn}>
                {videos[focusedIndex] && videos[focusedIndex].department && (
                  <Image
                    source={getDepartmentIcon(videos[focusedIndex].department)}
                    style={styles.departmentIcon}
                    resizeMode="contain"
                  />
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
              <TouchableOpacity style={styles.button} onPress={handleNextVideoPress}>
                <Text style={styles.buttonText}>Find Next</Text>
              </TouchableOpacity>
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
  bottomSection: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  band: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
    width: width * 0.25,
    height: width * 0.25,
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
  button: {
    padding: 15,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    borderRadius: sizes.radius,
    width: "80%",
    elevation: 5,
  },
  buttonText: {
    fontSize: sizes.h3,
    color: colors.primaryBis,
    fontFamily: 'MontserratBold',
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: width,
    height: width / 1.75,
  },
  approvedIcon: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 50,
    height: 50,
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
  buttonUniversityContainer: {
    width: 62,
    height: 62,
    position: 'absolute',
    bottom: spacing.m + 64,
    right: spacing.m,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 50,
  },
  universityIcon: {
    width: "100%",
    height: "100%",
    marginHorizontal: 12,
  },
  progressSlider: {
    position: 'absolute',
    bottom: 30,
    width: '90%',
  },
  duration: {
    position: 'absolute',
    bottom: 10,
    color: 'white',
    textAlign: 'center',
    width: '100%',
    fontFamily: 'Montserrat',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.5, 
  },
});

export default DiscoverScreen;
