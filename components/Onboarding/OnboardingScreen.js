import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions, 
  Alert, 
  Image 
} from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, sizes, spacing } from '../theme';
import { Button } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }) => {
  const videoRef = useRef(null);
  const [videoStatus, setVideoStatus] = useState({});

  useEffect(() => {
    // Optional: Auto-play video when the video screen is rendered
    // This can also be handled within the Video component
  }, []);

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

  const DoneButton = ({ ...props }) => (
    <Button
      mode="contained"
      onPress={props.onPress}
      style={{ marginRight: 10 }}
      contentStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
      labelStyle={{ fontSize: sizes.h3, fontFamily: 'Montserrat' }}
      buttonColor={colors.darkGreen}
    >
      Get Started
    </Button>
  );

  const SkipButton = ({ ...props }) => (
    <TouchableOpacity style={{ marginLeft: 10 }} {...props}>
      <Text style={styles.skipText}>Skip</Text>
    </TouchableOpacity>
  );

  const NextButton = ({ ...props }) => (
    <Button
      mode="outlined"
      onPress={props.onPress}
      style={{ marginRight: 10 }}
      contentStyle={{ paddingVertical: 8, paddingHorizontal: 16 }}
      labelStyle={{ fontSize: sizes.h3, fontFamily: 'Montserrat', color: colors.darkGreen }}
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
      pages={[
        {
          backgroundColor: colors.primaryBis,
          image: <Image source={require('../../assets/Onboarding/welcome.jpg')} style={styles.image} resizeMode="contain" />,
          title: 'Welcome to BrightMinds',
          subtitle: 'Discover and engage with insightful content tailored just for you.',
        },
        {
          backgroundColor: colors.primaryBis,
          image: <Image source={require('../../assets/Onboarding/features.jpg')} style={styles.image} resizeMode="contain" />,
          title: 'Explore Features',
          subtitle: 'Enjoy a variety of features designed to enhance your learning experience.',
        },
        {
          backgroundColor: colors.primaryBis,
          image: (
            <Video
              ref={videoRef}
              source={require('../../assets/Onboarding/onboarding-video.mp4')}
              style={styles.video}
              resizeMode="cover"
              shouldPlay={false} // Control playback manually
              isLooping={false}
              onPlaybackStatusUpdate={(status) => setVideoStatus(status)}
              onError={handleVideoError}
              onEnd={handleOnboardingComplete}
            />
          ),
          title: 'Watch & Learn',
          subtitle: 'Watch engaging videos to deepen your understanding.',
        },
        {
          backgroundColor: colors.primaryBis,
          image: <Image source={require('../../assets/Onboarding/get-started.png')} style={styles.image} resizeMode="contain" />, // Replace with your image
          title: 'Get Started',
          subtitle: 'Sign up or log in to start your journey with BrightMinds.',
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  image: {
    width: width * 0.6,
    height: height * 0.3,
  },
  video: {
    width: width * 0.8,
    height: height * 0.4,
    borderRadius: 10,
  },
  skipText: {
    color: colors.darkGreen,
    fontSize: sizes.h4,
    fontFamily: 'Montserrat',
  },
});

export default OnboardingScreen;
