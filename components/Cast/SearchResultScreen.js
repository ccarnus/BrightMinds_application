import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../APIConfig';
import { colors, sizes, spacing } from '../theme';

const { width, height } = Dimensions.get('window');

// Helper function: convert a time string like "00:00:04,639" to milliseconds.
const timeStringToMillis = (timeString) => {
  const parts = timeString.split(/[:,]/); // splits "00:00:04,639" into ["00", "00", "04", "639"]
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const millis = parseInt(parts[3], 10);
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
};

// Helper function: parse an SRT file string into an array of caption objects.
const parseSRT = (data) => {
  const captions = [];
  // Split by blank lines (each caption block)
  const blocks = data.split(/\n\s*\n/);
  blocks.forEach((block) => {
    const lines = block.split('\n').filter(line => line.trim() !== '');
    if (lines.length >= 2) {
      // Second line should contain the timecodes.
      const timeLine = lines[1];
      const match = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (match) {
        const start = timeStringToMillis(match[1]);
        const end = timeStringToMillis(match[2]);
        // All remaining lines are the caption text.
        const text = lines.slice(2).join('\n');
        captions.push({ start, end, text });
      }
    }
  });
  return captions;
};

const SearchResultScreen = ({ route, navigation }) => {
  const { selectedCastId } = route.params;
  const [video, setVideo] = useState(null);
  const [videoStatus, setVideoStatus] = useState(true); // auto-play
  const [userId, setUserId] = useState(null);
  const [playbackInstancePosition, setPlaybackInstancePosition] = useState(0);
  const [playbackInstanceDuration, setPlaybackInstanceDuration] = useState(0);
  const [contentSubmitted, setContentSubmitted] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true); // toggle built-in captions
  const [parsedCaptions, setParsedCaptions] = useState([]); // custom parsed captions
  const [currentCaption, setCurrentCaption] = useState(''); // current caption text for overlay

  const videoRef = useRef(null);

  // Retrieve userId from AsyncStorage
  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  // Fetch video data once the userId is available
  useEffect(() => {
    if (userId) {
      fetchVideo();
    }
  }, [userId, selectedCastId]);

  const fetchVideo = () => {
    fetch(`${API_BASE_URL}/cast/${selectedCastId}`)
      .then(response => response.json())
      .then(videoData => {
        fetch(`${API_BASE_URL}/university/by/name/${videoData.university}`)
          .then(res => res.json())
          .then(universityData => {
            const completeVideo = { ...videoData, universityLogo: universityData.iconurl };
            setVideo(completeVideo);
          });
      })
      .catch(error => console.error(error));
  };

  // If a subtitle URL is available, fetch and parse the subtitle file
  useEffect(() => {
    if (video && video.subtitleurl) {
      fetch(video.subtitleurl)
        .then(response => response.text())
        .then(text => {
          const parsed = parseSRT(text);
          setParsedCaptions(parsed);
        })
        .catch(error => {
          console.error('Error fetching subtitles:', error);
        });
    }
  }, [video]);

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

  // Pause the video when the screen loses focus
  useEffect(() => {
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

      // Update the custom caption overlay based on the current playback time
      if (parsedCaptions.length > 0) {
        const currentTime = status.positionMillis;
        const caption = parsedCaptions.find(cap => currentTime >= cap.start && currentTime < cap.end);
        if (caption) {
          setCurrentCaption(caption.text);
        } else {
          setCurrentCaption('');
        }
      }
    }
  };

  const getMMSSFromMillis = (millis) => {
    const totalSeconds = millis / 1000;
    const seconds = Math.floor(totalSeconds % 60);
    const minutes = Math.floor(totalSeconds / 60);
    const padWithZero = (number) => (number < 10 ? '0' + number : number);
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
            // Built-in captions configuration (note: these are not very styleable)
            textTracks={
              video.subtitleurl
                ? [
                    {
                      uri: video.subtitleurl,
                      language: 'en',
                      title: 'English Subtitles',
                      type: 'srt' // Use 'srt' for SRT files; switch to 'vtt' if you convert your file
                    }
                  ]
                : []
            }
            selectedTextTrack={
              video.subtitleurl
                ? (captionsEnabled ? { type: 'index', value: 0 } : { type: 'disabled' })
                : { type: 'disabled' }
            }
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
        {/* Toggle for built-in captions if a subtitle URL is available */}
        {video.subtitleurl && (
          <TouchableOpacity
            style={styles.captionToggle}
            onPress={() => setCaptionsEnabled((prev) => !prev)}
          >
            <Text style={styles.captionToggleText}>
              {captionsEnabled ? 'Hide Captions' : 'Show Captions'}
            </Text>
          </TouchableOpacity>
        )}
        {/* Custom caption overlay (fully styleable) */}
        {currentCaption !== '' && (
          <View style={styles.captionOverlay}>
            <Text style={styles.captionText}>{currentCaption}</Text>
          </View>
        )}
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
    width: width / 4,
    height: width / 4,
    position: 'absolute',
    bottom: spacing.xl * 2,
    right: spacing.l,
    alignItems: 'center',
  },
  captionToggle: {
    position: 'absolute',
    top: spacing.l,
    right: spacing.l,
    backgroundColor: colors.primary,
    padding: 8,
    borderRadius: 4,
  },
  captionToggleText: {
    color: 'white',
    fontFamily: 'Montserrat',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: spacing.xl*2,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captionText: {
    color: colors.primary,
    fontSize: sizes.h3,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontFamily: 'Montserrat',
  },
});

export default SearchResultScreen;