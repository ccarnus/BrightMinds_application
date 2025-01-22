import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Alert 
} from 'react-native';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from 'react-native-paper';
import { colors, sizes, spacing } from '../theme';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoStatus, setVideoStatus] = useState({});

  useEffect(() => {
    // Auto-play the video when the component mounts
    const playVideo = async () => {
      if (videoRef.current) {
        await videoRef.current.playAsync();
      }
    };
    playVideo();
  }, []);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      navigation.replace('AuthChoice');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleVideoEnd = () => {
    handleOnboardingComplete();
  };

  const handleVideoError = (error) => {
    console.log('Video Error: ', error);
    Alert.alert('Error', 'Failed to load the onboarding video.');
    handleOnboardingComplete();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.videoWrapper}
        activeOpacity={1}
        onPress={() => {
          if (videoRef.current) {
            if (videoStatus.isPlaying) {
              videoRef.current.pauseAsync();
            } else {
              videoRef.current.playAsync();
            }
          }
        }}
      >
        <Video
          ref={videoRef}
          source={require('../../assets/Onboarding/onboarding-video.mp4')} // Ensure this path is correct
          style={styles.video}
          resizeMode="cover"
          shouldPlay={false} // Control playback manually
          isLooping={false}
          onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
          onEnd={handleVideoEnd}
          onError={handleVideoError}
        />
        {/* Overlay Controls */}
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.skipButton} onPress={handleOnboardingComplete}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: width,
    height: height,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: spacing.l,
    right: spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  skipText: {
    color: 'white',
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
  },
});

export default OnboardingScreen;
