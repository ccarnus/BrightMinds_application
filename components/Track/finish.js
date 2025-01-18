import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Image } from 'react-native';
import { colors, sizes, spacing } from '../theme';
import { Button } from 'react-native-paper';

const Finish = ({ route, navigation }) => {
  // Extract the totals passed via route.params
  const { totalQuestions, correctAnswers } = route.params;
  // Compute success rate
  const successRate = ((correctAnswers / totalQuestions) * 100).toFixed(0);

  // Create a shake animation (only used if successRate >= 50)
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (successRate >= 50) {
      // Loop the shake animation if successRate >= 50
      Animated.loop(
        Animated.sequence([
          Animated.timing(shakeAnim, {
            toValue: 10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: -10,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(shakeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [shakeAnim, successRate]);

  return (
    <View style={styles.container}>
      {/* Main content */}
      <View style={styles.contentContainer}>

        {/* Large finish icon at the top */}
        <Image 
          source={require('../../assets/Track_icons/finish.png')} 
          style={styles.finishIcon} 
        />

        {/* Title text */}
        <Text style={styles.title}>Evaluation Complete!</Text>

        {/* Only show the shaking cup if successRate >= 50 */}
        {successRate >= 50 && (
          <Animated.View
            style={{
              transform: [
                {
                  rotate: shakeAnim.interpolate({
                    inputRange: [-10, 10],
                    outputRange: ['-10deg', '10deg'],
                  }),
                },
              ],              
            }}
          >
            <Image
              source={require('../../assets/Track_icons/cup.png')}
              style={styles.cupIcon}
            />
          </Animated.View>
        )}

        {/* Show the successRate */}
        <Text style={styles.resultRate}>{successRate}%</Text>
      </View>

      {/* Button pinned at the bottom */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Track')}
          buttonColor={colors.darkGreen}
          labelStyle={{
            fontSize: sizes.h2,
            fontFamily: 'Montserrat',
            textAlign: 'center',
            paddingTop: spacing.s,
          }}
          style={styles.finishButton}
        >
          Got it!
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
  },
  contentContainer: {
    flex: 1,
    // Put main content in the center
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
  },
  finishIcon: {
    width: 170,
    height: 170,
    marginBottom: spacing.m,
  },
  title: {
    fontSize: sizes.title,
    fontFamily: 'Montserrat',
    color: colors.secondary,
    marginBottom: spacing.l,
    textAlign: 'center',
  },
  cupIcon: {
    width: 64,
    height: 64,
    marginBottom: spacing.l,
  },
  resultRate: {
    fontSize: sizes.title,
    color: colors.darkblue,
    fontFamily: 'MontserratBold',
    marginBottom: spacing.l,
  },
  buttonContainer: {
    padding: spacing.m,
  },
  finishButton: {
    borderRadius: sizes.buttonRadius,
  },
});

export default Finish;
