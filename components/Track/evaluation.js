import React, { useState, useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import axios from 'axios';
import Gauge from './Gauge';
import { colors, sizes, spacing } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../APIConfig';
import { Button } from 'react-native-paper';

let correctAnswerCount = 0;
const { width } = Dimensions.get('window');

const TakeTest = ({ route, navigation }) => {
  const { evaluations } = route.params;
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [displayedQuestion, setDisplayedQuestion] = useState('');
  const [userId, setUserId] = useState(null);
  const typingIntervalRef = useRef(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const getUserId = async () => {
      const storedUserId = await AsyncStorage.getItem('userId');
      setUserId(storedUserId);
    };
    getUserId();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex]?.question;
    if (currentQuestion) {
      setDisplayedQuestion('');
      typeQuestion(currentQuestion);
    }

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [currentQuestionIndex, questions]);

  const typeQuestion = (questionText) => {
    let i = 0;
    const typingSpeed = 20;
    typingIntervalRef.current = setInterval(() => {
      setDisplayedQuestion((prev) => prev + questionText.charAt(i));
      i++;
      if (i >= questionText.length) {
        clearInterval(typingIntervalRef.current);
      }
    }, typingSpeed);
  };

  const removeContentFromEvaluationList = async (evaluation) => {
    try {
      await axios.post(`${API_BASE_URL}/user/mark/content/as/answered/${userId}`, {
        contentId: evaluation.contentid,
      });
    } catch (error) {
      console.error(`Error marking content ${evaluation.contentid} as answered:`, error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const questionsPromises = evaluations.map((item) => {
        const url =
          item.type === 'article'
            ? `${API_BASE_URL}/article/${item.contentid}`
            : `${API_BASE_URL}/cast/${item.contentid}`;
        return axios.get(url);
      });

      const questionsResponses = await Promise.all(questionsPromises);
      const questionsData = questionsResponses.map((response) => response.data.evaluation);

      setQuestions(questionsData);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const animateCorrectAnswer = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.6,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateIncorrectAnswer = () => {
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
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleAnswerSelection = async (selectedResponse) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    const currentQuestion = questions[currentQuestionIndex];
    const correctAnswer = currentQuestion.correct;
    const isAnswerCorrect = selectedResponse === correctAnswer;

    setSelectedAnswer(selectedResponse);
    setIsCorrect(isAnswerCorrect);

    if (isAnswerCorrect) {
      animateCorrectAnswer();
      correctAnswerCount += 1;
      removeContentFromEvaluationList(evaluations[currentQuestionIndex]);
    } else {
      animateIncorrectAnswer();
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsCorrect(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      navigation.navigate('Finish', {
        totalQuestions: questions.length,
        correctAnswers: correctAnswerCount,
      });
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      <Gauge total={questions.length} current={currentQuestionIndex} />
      <View style={styles.questionContainer}>
        <Text
          style={styles.questionText}
          numberOfLines={5}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
        >
          {displayedQuestion}
        </Text>
      </View>

      <ScrollView
        style={styles.answersContainer}
        contentContainerStyle={styles.answersContentContainer}
      >
        {currentQuestion?.responses.map((response, index) => (
          <Animated.View
            key={index}
            style={{
              transform: [
                { scale: selectedAnswer === response && isCorrect ? scaleAnim : 1 },
                { translateX: selectedAnswer === response && isCorrect === false ? shakeAnim : 0 },
              ],
            }}
          >
            <TouchableOpacity
              style={[
                styles.answerButton,
                {
                  backgroundColor:
                    selectedAnswer === response
                      ? isCorrect
                        ? colors.darkGreen
                        : '#F44336' // incorrect = red
                      : '#FFFFFF',  // default = white
                },
              ]}
              onPress={() => handleAnswerSelection(response)}
              disabled={selectedAnswer !== null}
            >
              <Text style={styles.answerButtonText}>{response}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {selectedAnswer !== null && (
        <View style= {styles.fixedButtonContainer}>
          <Button
          mode="contained"
          onPress={handleNextQuestion}
          buttonColor={colors.darkGreen}
          icon={require('../../assets/Track_icons/go.png')}
          contentStyle={{ flexDirection: 'row-reverse'}}
          labelStyle={{
            fontSize: sizes.h2,
            fontFamily: 'Montserrat',
            textAlign: 'center',
            paddingTop: spacing.s,
          }}
          style={{
            marginLeft: spacing.xl,
            marginRight: spacing.xl,
            marginBottom: spacing.l,
            marginTop: spacing.l,
            borderRadius: sizes.buttonRadius,
          }}
          >
            Next
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
  questionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.s,
    marginBottom: spacing.s,
    marginHorizontal: spacing.s,
    height: '30%',
  },
  questionText: {
    fontSize: sizes.h2,
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
    paddingBottom: spacing.l,
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
});

export default TakeTest;
