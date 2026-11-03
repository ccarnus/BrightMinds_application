import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { Button } from 'react-native-paper';
import { colors, sizes, spacing } from '@shared/config/theme';
import { setOnboardingCompleted } from '@shared/utils/UserStorage';

const { width, height } = Dimensions.get('window');

const DoneButton = ({ onPress }) => (
  <View style={styles.ButtonContainer}>
    <Button
      mode="contained"
      onPress={onPress}
      style={styles.GoButton}
      labelStyle={styles.GoButtonLabel}
      buttonColor={colors.primary}
    >
      Let's Go!
    </Button>
  </View>
);

const SkipButton = ({ onPress }) => (
  <View style={styles.ButtonContainer}>
    <Button
      mode="contained"
      onPress={onPress}
      style={styles.skipButton}
      labelStyle={styles.skipButtonLabel}
      buttonColor={colors.primary}
    >
      Skip
    </Button>
  </View>
);

const NextButton = ({ onPress }) => (
  <View style={styles.ButtonContainer}>
    <Button
      onPress={onPress}
      style={styles.Button}
      labelStyle={styles.ButtonLabel}
      mode="contained"
      buttonColor={colors.darkGreen}
      icon={require('@assets/Discover_icons/next.png')}
      contentStyle={styles.nextButtonContent}
    >
      Next
    </Button>
  </View>
);

const OnboardingScreen = ({ navigation }) => {
  const completedRef = useRef(false);

  const handleOnboardingComplete = async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    await setOnboardingCompleted();
    navigation.replace('AuthChoice');
  };

  return (
    <Onboarding
      SkipButtonComponent={SkipButton}
      NextButtonComponent={NextButton}
      DoneButtonComponent={DoneButton}
      onSkip={handleOnboardingComplete}
      onDone={handleOnboardingComplete}
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
              source={require('@assets/Onboarding/latest.png')}
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
              source={require('@assets/Onboarding/topublic.png')}
              style={styles.image}
              resizeMode="contain"
            />
          ),
          title: 'Explained in the most simple way',
          subtitle: '',
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
    height: '100%',
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
  nextButtonContent: {
    flexDirection: 'row-reverse',
    paddingTop: spacing.xs,
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
    backgroundColor: 'transparent',
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
});

export default OnboardingScreen;
