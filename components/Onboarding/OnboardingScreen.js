import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  Alert, 
  Image, 
  TouchableOpacity 
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, sizes, spacing } from '../theme';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const videoRef = useRef(null);
  const [videoStatus, setVideoStatus] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Control video playback based on the current page
    if (currentPage === 2 && videoRef.current) {
      videoRef.current.playAsync();
      setIsPlaying(true);
    } else if (videoRef.current) {
      videoRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, [currentPage]);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      navigation.replace('AuthChoice');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleVideoError = (error) => {
    console.log('Video Error: ', error);
    Alert.alert('Error', 'Failed to load the onboarding video.');
    handleOnboardingComplete();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoRef.current.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const DoneButton = ({ ...props }) => (
    <Button
      mode="contained"
      onPress={props.onPress}
      style={styles.doneButton}
      labelStyle={styles.doneButtonLabel}
      buttonColor={colors.darkGreen}
    >
      Get Started
    </Button>
  );

  const SkipButton = ({ ...props }) => (
    <TouchableOpacity style={styles.skipButton} {...props}>
      <Text style={styles.skipText}>Skip</Text>
    </TouchableOpacity>
  );

  const NextButton = ({ ...props }) => (
    <Button
      mode="outlined"
      onPress={props.onPress}
      style={styles.nextButton}
      labelStyle={styles.nextButtonLabel}
      color={colors.darkGreen}
    >
      Next
    </Button>
  );

  return (
    <Onboarding
      SkipButtonComponent={SkipButton}
      NextButtonComponent={NextButton}
      DoneButtonComponent={DoneButton}
      onSkip={handleOnboardingComplete}
      onDone={handleOnboardingComplete}
      onPageChange={(index) => setCurrentPage(index)}
      showSkip={true}
      showNext={true}
      showDone={true}
      bottomBarHighlight={false}
      bottomBarHeight={60}
      containerStyles={styles.onboardingContainer}
      pages={[
        {
          backgroundColor: colors.primaryBis,
          image: (
            <Image 
              source={require('../../assets/Onboarding/latest.png')} 
              style={styles.image} 
              resizeMode="contain" 
            />
          ),
          title: 'The latests research..',
          subtitle: 'Discover and engage with insightful content tailored just for you.',
          titleStyles: styles.title,
          subtitleStyles: styles.subtitle,
        },
        {
          backgroundColor: colors.primaryBis,
          image: (
            <Image 
              source={require('../../assets/Onboarding/topublic.png')} 
              style={styles.image} 
              resizeMode="contain" 
            />
          ),
          title: '..Brought to the public',
          subtitle: 'Enjoy a variety of features designed to enhance your learning experience.',
          titleStyles: styles.title,
          subtitleStyles: styles.subtitle,
        },
        {
          backgroundColor: colors.primaryBis,
          image: (
            <View style={styles.videoContainer}>
              <TouchableOpacity activeOpacity={1} onPress={togglePlayPause}>
                <Video
                  ref={videoRef}
                  source={require('../../assets/Onboarding/onboarding-video.mp4')}
                  style={styles.video}
                  resizeMode="cover"
                  shouldPlay={false} // Controlled manually
                  isLooping={false}
                  isMuted={isMuted}
                  volume={isMuted ? 0 : 1}
                  onPlaybackStatusUpdate={(status) => {
                    setVideoStatus(status);
                    if (status.didJustFinish) {
                      handleOnboardingComplete();
                    }
                  }}
                  onError={handleVideoError}
                />
                {/* Overlay Play/Pause Icon */}
                {videoStatus.isPlaying !== undefined && (
                  <View style={styles.playPauseOverlay}>
                    <Ionicons
                      name={isPlaying ? 'pause-circle' : 'play-circle'}
                      size={64}
                      color="rgba(255, 255, 255, 0.7)"
                    />
                  </View>
                )}
              </TouchableOpacity>
              {/* Mute/Unmute Button */}
              <TouchableOpacity 
                style={styles.muteButton} 
                onPress={toggleMute}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isMuted ? 'volume-mute' : 'volume-high'} 
                  size={24} 
                  color={colors.white} 
                />
              </TouchableOpacity>
              {/* Transparent "Get Started" Button */}
              <TouchableOpacity 
                style={styles.transparentButton} 
                onPress={handleOnboardingComplete}
                activeOpacity={0.7}
              >
                <Text style={styles.transparentButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          ),
          title: 'Watch & Learn',
          subtitle: 'Watch engaging videos to deepen your understanding.',
          titleStyles: styles.title,
          subtitleStyles: styles.subtitle,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: spacing.l,
  },
  title: {
    fontSize: sizes.h2,
    fontFamily: 'MontserratBold',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.l,
  },
  subtitle: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.m,
    marginTop: spacing.s,
  },
  doneButton: {
    marginRight: spacing.m,
    borderRadius: sizes.buttonRadius,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  doneButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
  },
  skipButton: {
    marginLeft: spacing.m,
  },
  skipText: {
    color: colors.darkGreen,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
  },
  nextButton: {
    marginRight: spacing.m,
    borderRadius: sizes.buttonRadius,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  nextButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    color: colors.darkGreen,
  },
  videoContainer: {
    width: width,
    height: height * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: width,
    height: height * 0.6,
  },
  muteButton: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: spacing.s,
    borderRadius: 20,
  },
  transparentButton: {
    position: 'absolute',
    bottom: spacing.l,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m * 2,
    borderRadius: sizes.buttonRadius,
  },
  transparentButtonText: {
    color: colors.white,
    fontSize: sizes.h3,
    fontFamily: 'MontserratBold',
  },
  playPauseOverlay: {
    position: 'absolute',
    top: '45%',
    left: '45%',
  },
});

export default OnboardingScreen;
