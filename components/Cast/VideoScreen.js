import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  Image, 
  Dimensions, 
  Share 
} from 'react-native';
import { Video } from 'expo-av';
import Slider from '@react-native-community/slider';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../APIConfig';
import { colors, sizes, spacing } from '../theme';

const { width, height } = Dimensions.get('window');

// Converts a time string (e.g. "00:00:04,639") to milliseconds.
const timeStringToMillis = (timeString) => {
  const parts = timeString.split(/[:,]/);
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const millis = parseInt(parts[3], 10);
  return hours * 3600000 + minutes * 60000 + seconds * 1000 + millis;
};

// Parses an SRT file string into an array of caption objects.
const parseSRT = (data) => {
  const captions = [];
  const blocks = data.split(/\n\s*\n/);
  blocks.forEach((block) => {
    const lines = block.split('\n').filter(line => line.trim() !== '');
    if (lines.length >= 2) {
      const timeLine = lines[1];
      const match = timeLine.match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (match) {
        const start = timeStringToMillis(match[1]);
        const end = timeStringToMillis(match[2]);
        const text = lines.slice(2).join('\n');
        captions.push({ start, end, text });
      }
    }
  });
  return captions;
};

const VideoScreen = ({ route, navigation }) => {
  // Accept either selectedCastId or selectedVideoId.
  const { selectedCastId, selectedVideoId } = route.params;
  // Use whichever parameter exists.
  const videoId = selectedCastId || selectedVideoId;

  const [video, setVideo] = useState(null);
  const [videoStatus, setVideoStatus] = useState(true);
  const [userId, setUserId] = useState(null);
  const [playbackInstancePosition, setPlaybackInstancePosition] = useState(0);
  const [playbackInstanceDuration, setPlaybackInstanceDuration] = useState(0);
  const [contentSubmitted, setContentSubmitted] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [parsedCaptions, setParsedCaptions] = useState([]);
  const [currentCaption, setCurrentCaption] = useState('');

  const videoRef = useRef(null);

  // Retrieve userId from AsyncStorage.
  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  // Once the userId is available, fetch the video.
  useEffect(() => {
    if (userId && videoId) {
      fetchVideo();
    }
  }, [userId, videoId]);

  const fetchVideo = () => {
    fetch(`${API_BASE_URL}/cast/${videoId}`)
      .then(response => response.json())
      .then(videoData => {
        fetch(`${API_BASE_URL}/university/by/name/${videoData.university}`)
          .then(res => res.json())
          .then(universityData => {
            const completeVideo = { 
              ...videoData, 
              universityLogo: universityData.iconurl 
            };
            setVideo(completeVideo);
          });
      })
      .catch(error => console.error(error));
  };

  // If a subtitle URL exists, fetch and parse the subtitle file.
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
    } else {
      setParsedCaptions([]);
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
      .catch(error => console.error(error));
  };

  const handleCastDonePlaying = () => {
    navigation.goBack();
  };

  // Pause video when the screen loses focus.
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

      // Update custom caption overlay only if captions are enabled.
      if (captionsEnabled && parsedCaptions.length > 0) {
        const currentTime = status.positionMillis;
        const caption = parsedCaptions.find(cap => currentTime >= cap.start && currentTime < cap.end);
        setCurrentCaption(caption ? caption.text : '');
      } else {
        setCurrentCaption('');
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

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out this video: ${video.casturl}`,
      });
      if (result.action === Share.sharedAction) {
        console.log(result.activityType
          ? 'Shared with activity type: ' + result.activityType
          : 'Video shared successfully.');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed.');
      }
    } catch (error) {
      console.error('Error sharing video:', error.message);
    }
  };

  // Determine which caption icon to use.
  // If the video has a subtitle URL and captions are enabled, show caption_on;
  // otherwise, show caption_off.
  let captionIcon = require('../../assets/Cast_screen_icons/caption_off.png');
  if (video && video.subtitleurl) {
    captionIcon = captionsEnabled
      ? require('../../assets/Cast_screen_icons/caption_on.png')
      : require('../../assets/Cast_screen_icons/caption_off.png');
  }

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
            textTracks={
              video.subtitleurl
                ? [
                    {
                      uri: video.subtitleurl,
                      language: 'en',
                      title: 'English Subtitles',
                      type: 'srt'
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

        {/* Progress Slider */}
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

        {/* Buttons container (always visible) positioned just above the progress bar */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={() => setCaptionsEnabled(prev => !prev)}>
            <Image source={captionIcon} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Image
              source={require('../../assets/Cast_screen_icons/share.png')}
              style={styles.icon}
            />
          </TouchableOpacity>
        </View>

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
  UniversityContainer: {
    width: width / 6,
    height: width / 6,
    position: 'absolute',
    top: spacing.xl * 2,
    right: spacing.l,
    alignItems: 'center',
  },
  universityIcon: {
    width: "100%",
    height: "100%",
    marginHorizontal: 12,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 55, // Just above the progress slider
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: width / 9,
    height: width / 9,
    marginHorizontal: spacing.s,
    tintColor: 'white',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: width / 3,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  captionText: {
    color: colors.primary,
    fontSize: sizes.h2,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontFamily: 'Montserrat',
  },
});

export default VideoScreen;
