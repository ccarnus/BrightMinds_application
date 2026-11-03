import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import Gauge from '@features/track/components/Gauge';
import { colors, sizes, spacing } from '@shared/config/theme';
import { api, getErrorMessage } from '@shared/api/client';
import { getUser, isGuestUser } from '@shared/utils/UserStorage';
import Loader from '@shared/components/Loader';
import StateMessage from '@shared/components/StateMessage';

const { width } = Dimensions.get('window');
const INCORRECT_COLOR = '#F44336';

const isValidQuestion = (question) =>
  !!question && typeof question.question === 'string' && Array.isArray(question.responses);

const TakeTest = ({ route, navigation }) => {
  const evaluations = route.params?.evaluations || [];
  // Each entry pairs a question with the evaluation it belongs to, so marking as answered
  // stays correct even when some content could not be loaded and was skipped.
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const userIdRef = useRef(null);
  const correctCountRef = useRef(0);
  // Refs (not state) so rapid double taps are rejected before the next render.
  const answerLockedRef = useRef(false);
  const advancingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [{ userId }, results] = await Promise.all([
        getUser(),
        Promise.all(
          evaluations.map((evaluation) =>
            api
              .get(`/${evaluation.type === 'article' ? 'article' : 'cast'}/${evaluation.contentid}`)
              .then(({ data }) => ({ evaluation, question: data?.evaluation }))
              .catch((itemError) => ({ evaluation, itemError }))
          )
        ),
      ]);
      userIdRef.current = userId;
      const loaded = results.filter((r) => isValidQuestion(r.question));
      if (loaded.length === 0 && results.some((r) => r.itemError)) {
        throw results.find((r) => r.itemError).itemError;
      }
      if (mountedRef.current) {
        correctCountRef.current = 0;
        answerLockedRef.current = false;
        advancingRef.current = false;
        setItems(loaded);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsCorrect(null);
      }
    } catch (fetchError) {
      console.error('Error fetching questions:', fetchError);
      if (mountedRef.current) {
        setError(getErrorMessage(fetchError, "We couldn't load your questions."));
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [evaluations]);

  useEffect(() => {
    fetchQuestions();
    // Questions are fetched once per visit; `evaluations` comes from route params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!items[currentQuestionIndex]) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentQuestionIndex, items, fadeAnim]);

  const goToTrack = () => navigation.popTo('BottomNav', { screen: 'Track' });

  const markAsAnswered = async (evaluation) => {
    const userId = userIdRef.current;
    if (!userId || isGuestUser(userId)) return;
    try {
      await api.post(`/user/mark/content/as/answered/${userId}`, {
        contentId: evaluation.contentid,
      });
    } catch (markError) {
      console.error(`Error marking content ${evaluation.contentid} as answered:`, markError);
    }
  };

  const animateCorrectAnswer = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.6, duration: 600, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  };

  const animateIncorrectAnswer = () => {
    const step = (toValue) =>
      Animated.timing(shakeAnim, { toValue, duration: 100, useNativeDriver: true });
    Animated.sequence([step(10), step(-10), step(10), step(-10), step(10), step(0)]).start();
  };

  const handleAnswerSelection = (selectedResponse) => {
    const current = items[currentQuestionIndex];
    if (!current || answerLockedRef.current) return;
    answerLockedRef.current = true;

    const isAnswerCorrect = selectedResponse === current.question.correct;
    setSelectedAnswer(selectedResponse);
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      correctCountRef.current += 1;
      animateCorrectAnswer();
      markAsAnswered(current.evaluation);
    } else {
      animateIncorrectAnswer();
    }
  };

  const handleNextQuestion = () => {
    if (!answerLockedRef.current || advancingRef.current) return;

    if (currentQuestionIndex < items.length - 1) {
      answerLockedRef.current = false;
      setSelectedAnswer(null);
      setIsCorrect(null);
      setCurrentQuestionIndex((index) => index + 1);
    } else {
      advancingRef.current = true;
      navigation.navigate('Finish', {
        totalQuestions: items.length,
        correctAnswers: correctCountRef.current,
      });
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
          onAction={fetchQuestions}
        />
        <Button mode="text" textColor={colors.secondary} onPress={goToTrack} style={styles.backButton}>
          Back to Track
        </Button>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.stateContainer}>
        <StateMessage
          icon="help-circle-outline"
          title="No questions available"
          message="Come back later after watching more content."
          actionLabel="Back to Track"
          onAction={goToTrack}
        />
      </View>
    );
  }

  const currentQuestion = items[currentQuestionIndex].question;

  return (
    <View style={styles.container}>
      <Gauge total={items.length} current={currentQuestionIndex} />

      <View style={styles.questionContainer}>
        <Animated.Text
          style={[styles.questionText, { opacity: fadeAnim }]}
          numberOfLines={5}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          accessibilityRole="header"
        >
          {currentQuestion.question}
        </Animated.Text>
      </View>

      <ScrollView
        style={styles.answersContainer}
        contentContainerStyle={styles.answersContentContainer}
      >
        {currentQuestion.responses.map((response, index) => {
          const isSelected = selectedAnswer === response;
          let backgroundColor = colors.primary;
          if (isSelected) backgroundColor = isCorrect ? colors.darkGreen : INCORRECT_COLOR;
          return (
            <Animated.View
              key={`${currentQuestionIndex}-${index}`}
              style={{
                transform: [
                  { scale: isSelected && isCorrect ? scaleAnim : 1 },
                  { translateX: isSelected && isCorrect === false ? shakeAnim : 0 },
                ],
              }}
            >
              <TouchableOpacity
                style={[styles.answerButton, { backgroundColor }]}
                onPress={() => handleAnswerSelection(response)}
                disabled={selectedAnswer !== null}
                accessibilityRole="button"
                accessibilityState={{ disabled: selectedAnswer !== null, selected: isSelected }}
              >
                <Text style={styles.answerButtonText}>{response}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {selectedAnswer !== null && (
        <View style={styles.fixedButtonContainer}>
          <Button
            mode="contained"
            onPress={handleNextQuestion}
            buttonColor={colors.darkGreen}
            icon={require('@assets/Track_icons/go.png')}
            contentStyle={styles.nextButtonContent}
            labelStyle={styles.nextButtonLabel}
            style={styles.nextButton}
          >
            {currentQuestionIndex < items.length - 1 ? 'Next' : 'Finish'}
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    alignItems: 'center',
    paddingTop: spacing.l,
  },
  stateContainer: {
    flex: 1,
    backgroundColor: colors.primaryBis,
    paddingBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'center',
  },
  questionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.s,
    marginBottom: spacing.s,
    marginHorizontal: spacing.s,
    height: '30%',
  },
  questionText: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    color: colors.secondary,
  },
  answersContainer: {
    width: '100%',
    marginBottom: spacing.m,
  },
  answersContentContainer: {
    alignItems: 'center',
    paddingBottom: spacing.xl * 3,
  },
  answerButton: {
    width: width * 0.9,
    borderRadius: sizes.radius,
    marginBottom: spacing.l,
    padding: spacing.m,
    elevation: 5,
  },
  answerButtonText: {
    fontSize: sizes.h3,
    color: colors.secondary,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    padding: spacing.m,
  },
  nextButton: {
    marginLeft: spacing.xl,
    marginRight: spacing.xl,
    marginBottom: spacing.l,
    marginTop: spacing.l,
    borderRadius: sizes.buttonRadius,
  },
  nextButtonContent: {
    flexDirection: 'row-reverse',
  },
  nextButtonLabel: {
    fontSize: sizes.h3,
    fontFamily: 'Montserrat',
    textAlign: 'center',
    paddingTop: spacing.s,
  },
});

export default TakeTest;