import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import { colors, sizes, spacing } from '../theme';

const AuthChoiceScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to BrightMinds!</Text>
      <Text style={styles.subtitle}>Please choose an option to continue.</Text>
      
      <Button
        mode="contained"
        onPress={() => navigation.navigate('LoginScreen')}
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
        buttonColor={colors.darkGreen}
      >
        Log In
      </Button>

      <Button
        mode="outlined"
        onPress={() => navigation.navigate('SignupScreen')}
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
        color={colors.darkGreen}
      >
        Sign Up
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.l,
  },
  title: {
    fontSize: sizes.title,
    fontFamily: 'Montserrat-Bold',
    color: colors.secondary,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    color: colors.secondary,
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  button: {
    width: '80%',
    marginVertical: spacing.s,
    borderRadius: sizes.buttonRadius,
  },
  buttonContent: {
    paddingVertical: spacing.m,
  },
  buttonLabel: {
    fontSize: sizes.h2,
    fontFamily: 'Montserrat',
  },
});

export default AuthChoiceScreen;
