import React, { useRef, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button } from 'react-native-paper';
import LottieView from 'lottie-react-native';
import { colors, sizes, spacing } from '@shared/config/theme';
import { setGuestUser } from '@shared/utils/UserStorage';
import { resetToHome } from '@navigation/navigationHelpers';

const AuthChoiceScreen = ({ navigation }) => {
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
      <LottieView
        source={require('@assets/Onboarding/star_bg_2.json')}
        autoPlay
        backgroundColor={colors.secondary}
        loop
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.container}>
        <Image
          source={require('@assets/Onboarding/BrightMinds.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Button
          mode="contained"
          onPress={() => navigation.navigate('LoginScreen')}
          buttonColor={colors.darkGreen}
          labelStyle={styles.buttonLabel}
          style={styles.authButton}
        >
          Log In
        </Button>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('SignupScreen')}
          buttonColor={colors.darkGreen}
          labelStyle={styles.buttonLabel}
          style={styles.authButton}
        >
          Sign Up
        </Button>

        <Button
          mode="contained"
          onPress={handleContinueAsGuest}
          disabled={enteringAsGuest}
          buttonColor={colors.darkblue}
          labelStyle={styles.buttonLabel}
          style={styles.authButton}
        >
          Guest
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  logo: {
    width: '80%',
    height: undefined,
    aspectRatio: 1,
    marginBottom: spacing.xl,
  },
  authButton: {
    width: '100%',
    marginVertical: spacing.s,
    borderRadius: sizes.buttonRadius,
  },
  buttonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
});

export default AuthChoiceScreen;
