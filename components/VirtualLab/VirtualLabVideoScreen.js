import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image } from 'react-native';
import { Video } from 'expo-av';
import { Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import { colors, sizes, spacing } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../APIConfig';

const { width, height } = Dimensions.get('window');

const VirtualLabVideoScreen = ({ route, navigation }) => {
  const { selectedCastId } = route.params;
  const [video, setVideo] = useState(null);
  const [videoStatus, setVideoStatus] = useState(true);
  const [userId, setUserId] = useState(null);
  const [playbackInstancePosition, setPlaybackInstancePosition] = useState(0);
  const [playbackInstanceDuration, setPlaybackInstanceDuration] = useState(0);
  const [contentSubmitted, setContentSubmitted] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchVideoAndBookmarks();
    }
  }, [userId, selectedCastId]);

  const fetchVideoAndBookmarks = () => {
    fetch(`${API_BASE_URL}/cast/${selectedCastId}`)
      .then(response => response.json())
      .then(videoData => {
        fetch(`${API_BASE_URL}/university/by/name/${videoData.university}`)
          .then(res => res.json())
          .then(universityData => {
            setVideo({ ...videoData, universityLogo: universityData.iconurl });
          });
      })
      .catch(error => console.error(error));
  };

  const handleCastWatched = () => {
    if (!video || contentSubmitted) return;

    const castId = video._id;

    axios
      .post(`${API_BASE_URL}/user/add/content/${userId}`, { contentId: castId, type: "cast" })
      .then(response => {
        setContentSubmitted(true);
        console.log("Content marked as watched at 85%");
      })
      .catch(error => {
        console.error(error);
      });
  };

  const handleCastDonePlaying = () => {
    navigation.goBack();
  };

  useEffect(() => {
    // Pause the video when the screen loses focus
    const pauseVideo = () => {
      setVideoStatus(false);
    };
    const unsubscribe = navigation.addListener('blur', pauseVideo);
    return unsubscribe;
  }, [navigation]);

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPlaybackInstancePosition(status.positionMillis);
      setPlaybackInstanceDuration(status.durationMillis);

      const progress = status.positionMillis / status.durationMillis;

      if (progress >= 0.85 && !contentSubmitted) {
        handleCastWatched();
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
    if (videoRef.current) {
      const seekPosition = value * playbackInstanceDuration;
      await videoRef.current.setPositionAsync(seekPosition);
    }
  };

  if (!video) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <TouchableOpacity
          style={styles.videoWrapper}
          onPress={() => setVideoStatus(!videoStatus)}
        >
          <Video
            ref={videoRef}
            source={{ uri: video.casturl }}
            shouldPlay={videoStatus}
            resizeMode="contain"
            style={styles.video}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          />
        </TouchableOpacity>
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
          {getMMSSFromMillis(playbackInstancePosition)} / {getMMSSFromMillis(playbackInstanceDuration)}
        </Text>
        <View style={styles.UniversityContainer}>
          <Image
            source={{ uri: video.universityLogo }}
            style={styles.universityIcon}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
};

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: windowWidth,
    height: windowHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  video: {
    width: '100%',
    height: '100%',
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
  universityIcon: {
    width: "100%",
    height: "100%",
    marginHorizontal: 12,
  },
  UniversityContainer: {
    width: width/4,
    height: width/4,
    position: 'absolute',
    bottom: spacing.xl*2,
    right: spacing.l,
    alignItems: 'center',
  },
});

export default VirtualLabVideoScreen;
