import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { Button } from 'react-native-paper';
import { colors, sizes, spacing } from '../theme';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setGuestUser } from '../Utils/UserStorage'

const AuthChoiceScreen = () => {

  const navigation = useNavigation();

  const handleContinueAsGuest = async () => {
    try {
      await setGuestUser();
      navigation.navigate('BottomNav');
    } catch (error) {
      console.error('Error setting guest user:', error);
    }
  };

  return (
    <View style={styles.rootContainer}>
      <LottieView
        source={require('../../assets/Onboarding/star_bg_2.json')}
        autoPlay
        backgroundColor={colors.secondary}
        loop
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.container}>
        <Image
          source={require('../../assets/Onboarding/BrightMinds.png')}
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
    fontSize: sizes.h2,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
});

export default AuthChoiceScreen;
