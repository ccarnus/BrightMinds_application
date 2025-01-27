import React, { useRef, useState } from 'react';
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
//import { Video } from 'expo-video';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, sizes, spacing } from '../theme';
import { Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  //const videoRef = useRef(null);
  //const [videoStatus, setVideoStatus] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      navigation.replace('AuthChoice');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  //const handleVideoError = (error) => {
  //  console.log('Video Error: ', error);
  //  Alert.alert('Error', 'Failed to load the onboarding video.');
  //  handleOnboardingComplete();
  //};

  //const togglePlayPause = async () => {
  //  if (!videoRef.current) return;
  //  if (isPlaying) {
  //    await videoRef.current.pauseAsync();
  //    setIsPlaying(false);
  //  } else {
  //    await videoRef.current.playAsync();
  //    setIsPlaying(true);
  //  }
  //};

  const DoneButton = ({ ...props }) => (
    <View style={styles.ButtonContainer}>
      <Button
        mode="contained"
        onPress={props.onPress}
        style={styles.GoButton}
        labelStyle={styles.GoButtonLabel}
        buttonColor={colors.primary}
      >
        Let's Go!
      </Button>
    </View>
  );

  const SkipButton = ({ ...props }) => (
    <View style={styles.ButtonContainer}>
      <Button
        mode="contained"
        onPress={props.onPress}
        style={styles.skipButton}
        labelStyle={styles.skipButtonLabel}
        buttonColor={colors.primary}
      >
        Skip
      </Button>
    </View>
  );

  const NextButton = ({ ...props }) => (
    <View style={styles.ButtonContainer}>
      <Button
        onPress={props.onPress}
        style={styles.Button}
        labelStyle={styles.ButtonLabel}
        mode="contained"
        buttonColor={colors.darkGreen}
        icon={require('../../assets/Discover_icons/next.png')}
        contentStyle={{ flexDirection: 'row-reverse', paddingTop: spacing.xs }}
      >
        Next
      </Button>
    </View>
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
      bottomBarHeight={120}
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
          title: 'Find out the latest from the research world',
          subtitle: '',
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
          title: 'Explained in the most simple way',
          subtitle: '',
          titleStyles: styles.title,
          subtitleStyles: styles.subtitle,
        },
        /*{
          backgroundColor: '#000000',
          image: (
            <View style={styles.videoContainer}>
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={togglePlayPause}
                style={styles.videoTouchContainer}
              >
                <Video
                  ref={videoRef}
                  source={require('../../assets/Onboarding/onboarding-video.mp4')}
                  style={styles.video}
                  resizeMode="contain"
                  // No auto-play: remove shouldPlay
                  isLooping={false}
                  playsInSilentLockedModeIOS // allow iOS playback in silent mode
                  onPlaybackStatusUpdate={(status) => {
                    setVideoStatus(status);
                    if (status.didJustFinish) {
                      handleOnboardingComplete();
                    }
                  }}
                  onError={handleVideoError}
                />
                {!isPlaying && (
                  <View style={styles.playIconContainer}>
                    <Ionicons name="play-circle" size={80} color="#FFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ),
          title: '',
          subtitle: '',
          titleStyles: styles.title,
          subtitleStyles: styles.subtitle,
        }*/
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
    fontSize: sizes.title,
    fontFamily: 'Montserrat',
    color: colors.secondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
    color: colors.secondary,
    textAlign: 'center',
    paddingHorizontal: spacing.m,
    marginTop: spacing.s,
  },
  ButtonContainer: {
    height: "100%",
    justifyContent: 'center',
    alignItems: 'center',  
  },
  GoButton: {
    backgroundColor: colors.primary,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    paddingBottom: spacing.s,
    borderRadius: sizes.buttonRadius,  
  },
  Button: {
    backgroundColor: colors.secondary,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    paddingBottom: spacing.s,
    borderRadius: sizes.buttonRadius,
  },
  ButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.xs,
    color: colors.primaryBis,
  },
  GoButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
    color: colors.secondary,
  },
  skipButton: {
    backgroundColor: colors.transparentButton,
    marginLeft: spacing.m,
    marginRight: spacing.m,
    paddingBottom: spacing.s,
    borderRadius: sizes.buttonRadius,
  },
  skipButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
    color: colors.secondary,
  },
  videoContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoTouchContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width * 1,   // adjust as desired
    height: height * 1, // adjust as desired
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 9999,
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.3)', // DEBUG
  },
});

export default OnboardingScreen;
