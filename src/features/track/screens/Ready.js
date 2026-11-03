import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Image, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const { width } = Dimensions.get('window');
const readyImage = require('@assets/Track_icons/ready.png');

const ReadyScreen = ({ navigation }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const opacityValue = useRef(new Animated.Value(0)).current;
  const mountedRef = useRef(true);
  const numQuestions = evaluations.length;

  const loadEvaluations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { userId } = await getUser();
      let pending = [];
      if (userId && !isGuestUser(userId)) {
        const { data } = await api.get(`/user/${userId}`);
        pending = (data?.evaluation_list || [])
          .filter((item) => item.watched && !item.answered)
          .map((item) => ({ contentid: item.contentid, type: item.type }));
      }
      if (mountedRef.current) setEvaluations(pending);
    } catch (loadError) {
      console.error('Error fetching evaluation list:', loadError);
      if (mountedRef.current) {
        setError(getErrorMessage(loadError, "We couldn't load your questions."));
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadEvaluations();
    return () => {
      mountedRef.current = false;
    };
  }, [loadEvaluations]);

  useEffect(() => {
    if (isLoading || error) return undefined;
    opacityValue.setValue(0);
    const animation = Animated.timing(opacityValue, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [isLoading, error, opacityValue]);

  const handleReadyButtonPress = () => {
    if (numQuestions > 0) {
      navigation.navigate('Evaluation', { evaluations });
    } else {
      navigation.goBack();
    }
  };

  if (isLoading) {
    return <Loader backgroundColor={colors.primaryBis} />;
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <StateMessage
          icon="cloud-offline-outline"
          title="Something went wrong"
          message={error}
          actionLabel="Try again"
          onAction={loadEvaluations}
        />
        <Button mode="text" textColor={colors.secondary} onPress={() => navigation.goBack()} style={styles.backButton}>
          Go back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You have</Text>
      <Text style={styles.numQuestions}>{numQuestions}</Text>
      <Text style={styles.title}>{numQuestions === 1 ? 'Question' : 'Questions'}</Text>
      <Image source={readyImage} style={styles.infoImage} />
      <View style={styles.buttonContainer}>
        <Animated.View style={{ opacity: opacityValue }}>
          <Button
            mode="contained"
            onPress={handleReadyButtonPress}
            buttonColor={colors.darkGreen}
            contentStyle={styles.buttonContent}
            icon={require('@assets/Track_icons/go.png')}
            labelStyle={styles.buttonLabel}
            style={styles.button}
          >
            {numQuestions > 0 ? "Let's GO!" : 'Come Back Later'}
          </Button>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    paddingTop: spacing.xl * 4,
    alignItems: 'center',
  },
  stateContainer: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'center',
  },
  title: {
    fontSize: sizes.title,
    color: colors.secondary,
    marginBottom: spacing.s,
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  numQuestions: {
    fontSize: sizes.title * 2,
    color: colors.secondary,
    fontFamily: 'MontserratBold',
    marginBottom: 5,
    textAlign: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    alignItems: 'center',
    marginBottom: 80,
  },
  button: {
    marginLeft: spacing.m,
    marginRight: spacing.m,
    marginBottom: spacing.s,
    marginTop: spacing.l,
    borderRadius: sizes.buttonRadius,
  },
  buttonContent: {
    flexDirection: 'row-reverse',
  },
  buttonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
    paddingHorizontal: spacing.m,
  },
  infoImage: {
    width: width * 0.5,
    height: width * 0.5,
    marginTop: spacing.l,
    marginBottom: spacing.xl,
    resizeMode: 'contain',
  },
});

export default ReadyScreen;