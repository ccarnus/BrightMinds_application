import React, { useRef } from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '@shared/components/AppButton';
import { colors, layout, sizes, spacing, typography } from '@shared/config/theme';
import { setOnboardingCompleted } from '@shared/utils/UserStorage';

const IMAGE_SIZE = Math.min(sizes.width * 0.8, sizes.height * 0.4, 420);
const BOTTOM_BAR_HEIGHT = 96;

const DoneButton = ({ onPress }) => (
  <View style={styles.buttonContainer}>
    <AppButton size="medium" onPress={onPress}>
      Let's Go!
    </AppButton>
  </View>
);

const SkipButton = ({ onPress }) => (
  <View style={styles.buttonContainer}>
    <AppButton variant="link" size="medium" onPress={onPress}>
      Skip
    </AppButton>
  </View>
);

const NextButton = ({ onPress }) => (
  <View style={styles.buttonContainer}>
    <AppButton
      size="medium"
      iconPosition="right"
      icon={require('@assets/Discover_icons/next.png')}
      onPress={onPress}
    >
      Next
    </AppButton>
  </View>
);

const OnboardingScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
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
      // The library's bottom bar only reserves the iOS home indicator area; on Android
      // (edge-to-edge) the navigation bar inset is added here so the buttons stay above it.
      bottomBarHeight={BOTTOM_BAR_HEIGHT + (Platform.OS === 'android' ? insets.bottom : 0)}
      containerStyles={styles.onboardingContainer}
      pages={[
        {
          backgroundColor: colors.background,
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
          subTitleStyles: styles.subtitle,
        },
        {
          backgroundColor: colors.background,
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
          subTitleStyles: styles.subtitle,
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
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    marginBottom: spacing.l,
  },
  title: {
    ...typography.title,
    textAlign: 'center',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: spacing.m,
  },
  subtitle: {
    ...typography.bodySmall,
    textAlign: 'center',
    maxWidth: layout.maxContentWidth,
    paddingHorizontal: spacing.m,
    marginTop: spacing.s,
  },
  buttonContainer: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: spacing.m,
  },
});

export default OnboardingScreen;
