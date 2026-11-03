import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Image } from 'react-native';
import { Button } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, sizes, spacing } from '@shared/config/theme';

const Finish = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { totalQuestions = 0, correctAnswers = 0 } = route.params || {};
  const successRate = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const showCup = successRate >= 50;

  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showCup) return undefined;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shakeAnim, showCup]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contentContainer}>
        <Image source={require('@assets/Track_icons/finish.png')} style={styles.finishIcon} />

        <Text style={styles.title} accessibilityRole="header">
          Evaluation Complete!
        </Text>

        {showCup && (
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
            <Image source={require('@assets/Track_icons/cup.png')} style={styles.cupIcon} />
          </Animated.View>
        )}

        <Text style={styles.resultRate}>{successRate}%</Text>
      </View>

      <View style={[styles.buttonContainer, { paddingBottom: spacing.m + insets.bottom }]}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('BottomNav', { screen: 'Track' })}
          buttonColor={colors.darkGreen}
          labelStyle={styles.finishButtonLabel}
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
  finishButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
});

export default Finish;