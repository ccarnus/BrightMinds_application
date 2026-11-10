import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image, useWindowDimensions } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '@shared/components/AppButton';
import { colors, contentWidth, spacing } from '@shared/config/theme';
import { setGuestUser } from '@shared/utils/UserStorage';
import { resetToHome } from '@navigation/navigationHelpers';

const AuthChoiceScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Square logo that leaves room for the buttons on any screen size.
  const logoSize = Math.min(width * 0.7, height * 0.38, 340);
  const [enteringAsGuest, setEnteringAsGuest] = useState(false);
  const enteringRef = useRef(false);

  const handleContinueAsGuest = async () => {
    if (enteringRef.current) return;
    enteringRef.current = true;
    setEnteringAsGuest(true);
    await setGuestUser();
    resetToHome(navigation);
  };

  return (
    <View style={styles.rootContainer}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LottieView
          source={require('@assets/Onboarding/star_bg_2.json')}
          autoPlay
          backgroundColor={colors.secondary}
          loop
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + spacing.l, paddingBottom: insets.bottom + spacing.l },
        ]}
      >
        <Image
          source={require('@assets/Onboarding/BrightMinds.png')}
          style={[styles.logo, { width: logoSize, height: logoSize }]}
          resizeMode="contain"
        />

        <View style={styles.actions}>
          <AppButton fullWidth onPress={() => navigation.navigate('SignupScreen')}>
            Sign Up
          </AppButton>

          <AppButton variant="light" fullWidth onPress={() => navigation.navigate('LoginScreen')}>
            Log In
          </AppButton>

          <AppButton
            variant="secondary"
            onDark
            fullWidth
            onPress={handleContinueAsGuest}
            disabled={enteringAsGuest}
          >
            Continue as guest
          </AppButton>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.l,
  },
  logo: {
    marginBottom: spacing.xl,
  },
  actions: {
    ...contentWidth,
    maxWidth: 420,
    gap: spacing.s,
  },
});

export default AuthChoiceScreen;
